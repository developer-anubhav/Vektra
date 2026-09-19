import re
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class QueryEntities:
    data_category: str        # 'salary', 'attendance', 'leave', 'profile', 'performance', 'payroll_aggregate', 'policy', 'unknown'
    employee_reference: Optional[str]   # Explicit ID or 'SELF'
    target_user_id: Optional[str]       # Resolved target user ID
    date_range: Optional[str]           # Extracted date/period string
    is_self_query: bool                 # Whether user is asking about themselves
    extracted_keywords: list[str]       # Key phrases found
    target_doc_category: Optional[str] = None  # Category filter if specified

@dataclass
class RoutingDecision:
    route_type: str                     # 'DIRECT_DB_LOOKUP', 'CHROMA_RAG', or 'UNRESOLVED'
    tool_name: str                      # Function name to invoke
    reason: str                         # Routing rationale
    category_filter: Optional[str] = None

# Regex matchers for entity extraction
EMP_ID_PATTERN = re.compile(r"\b(emp_[a-zA-Z0-9_]+)\b", re.IGNORECASE)
SELF_PATTERN = re.compile(r"\b(?:my|mine|i|me|myself|self)\b", re.IGNORECASE)
DATE_RANGE_PATTERNS = [
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    re.compile(r"\b\d{4}-\d{2}\b"),
    re.compile(r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b", re.IGNORECASE),
    re.compile(r"\b(?:this\s+month|last\s+month|this\s+year|last\s+year|today|yesterday|this\s+week)\b", re.IGNORECASE),
]

def detect_category_name(query: str) -> Optional[str]:
    q_lower = query.lower()
    if any(k in q_lower for k in ["terms and conditions", "terms & conditions", "terms of service", "terms and condition", "terms_and_conditions", "t&c"]):
        return "terms_and_conditions"
    if any(k in q_lower for k in ["compliance", "regulatory", "compliance and regulatory", "compliance & regulatory", "regulations", "gdpr", "iso", "compliance_regulatory", "statutory", "data retention"]):
        return "compliance_regulatory"
    if any(k in q_lower for k in ["handbook", "employee handbook", "staff handbook", "employee_handbooks", "handbooks"]):
        return "employee_handbooks"
    if any(k in q_lower for k in ["policy", "company policy", "company policies", "policies", "company_policies", "guideline", "guidelines", "code of conduct"]):
        return "company_policies"
    return None

def extract_query_entities(query: str, requester_user_id: Optional[str] = None) -> QueryEntities:
    """
    Revision 2 Constraint 11:
    Run a key-phrase/entity extraction step on the user's query:
    - data category (salary, attendance, leave, profile, performance, payroll, policy)
    - employee reference (emp_... ID or self)
    - date range (specific dates, months, relative ranges)
    """
    q_lower = query.lower()
    keywords_found = []

    # 1. Employee reference extraction
    match_emp = EMP_ID_PATTERN.search(query)
    is_self = bool(SELF_PATTERN.search(query))
    
    if match_emp:
        emp_ref = match_emp.group(1)
        target_id = emp_ref
        keywords_found.append(f"employee_id:{emp_ref}")
    elif is_self and requester_user_id:
        emp_ref = "SELF"
        target_id = requester_user_id
        keywords_found.append(f"self_ref:{requester_user_id}")
    else:
        emp_ref = None
        target_id = requester_user_id

    # 2. Date range extraction
    date_range = None
    for dp in DATE_RANGE_PATTERNS:
        match_date = dp.search(query)
        if match_date:
            date_range = match_date.group(0)
            keywords_found.append(f"date_range:{date_range}")
            break

    # 3. Category detection
    doc_category = detect_category_name(query)
    if doc_category:
        keywords_found.append(f"doc_category:{doc_category}")

    # 4. Data category extraction
    # Distinguish between policy RAG questions vs structured facts
    is_explicit_policy = bool(doc_category) or any(k in q_lower for k in [
        "policy", "handbook", "guideline", "guidelines", "code of conduct",
        "official rules", "regulations", "procedure", "how many days are allowed by company policy",
        "standard policy", "evacuation", "dress code", "remote work rules", "compliance", "terms"
    ]) and not (is_self and any(k in q_lower for k in ["my salary", "my attendance", "my balance", "my profile", "my rating"]))

    if is_explicit_policy:
        category = "policy"
        keywords_found.append("category:policy")
    elif any(k in q_lower for k in ["salary", "compensation", "wage", "pay slip", "payslip", "base salary", "hra", "allowance", "net pay", "earnings"]):
        category = "salary"
        keywords_found.append("category:salary")
    elif any(k in q_lower for k in ["attendance", "clock in", "clock out", "check in", "clock-in", "late days", "present days", "timesheet"]):
        category = "attendance"
        keywords_found.append("category:attendance")
    elif any(k in q_lower for k in ["leave balance", "sick leave balance", "casual leave", "annual leave balance", "vacation days", "leave history", "days of leave", "leave entitlement"]):
        category = "leave"
        keywords_found.append("category:leave")
    elif any(k in q_lower for k in [
        "profile", "designation", "contact info", "phone number", "joining date",
        "work location", "who am i", "job title", "whats my name", "what's my name",
        "what is my name", "my name", "my info", "my details", "about me", "my role", "my title",
        "show my profile", "additional details", "employee details", "more details", "full profile",
        "employee id", "my id", "whats my id", "what is my id", "my employee id",
        "department", "my department", "which department", "my email", "what is my email",
        "whats my email", "my status", "employment status", "when did i join"
    ]):
        category = "profile"
        keywords_found.append("category:profile")

    elif any(k in q_lower for k in ["performance", "appraisal", "kpi", "kpis", "rating", "review period", "manager feedback"]):
        category = "performance"
        keywords_found.append("category:performance")
    elif any(k in q_lower for k in ["payroll run", "disbursed", "total payroll", "payroll run details", "payroll metrics"]):
        category = "payroll_aggregate"
        keywords_found.append("category:payroll_aggregate")
    elif any(k in q_lower for k in ["policy", "handbook", "maternity leave", "paternity leave", "wfh policy", "holiday"]):
        category = "policy"
        keywords_found.append("category:policy")
    else:
        category = "unknown"

    return QueryEntities(
        data_category=category,
        employee_reference=emp_ref,
        target_user_id=target_id,
        date_range=date_range,
        is_self_query=is_self,
        extracted_keywords=keywords_found,
        target_doc_category=doc_category,
    )

def route_query_request(entities: QueryEntities) -> RoutingDecision:
    """
    Revision 2 Constraint 11:
    Use extracted key phrases to route the request:
    - Exact structured facts (salary, attendance, leave, profile, performance) -> direct database lookup tool
    - Policy/document questions -> existing ChromaDB RAG pipeline
    Do not depend on vector similarity alone to decide this routing.
    """
    cat = entities.data_category
    doc_cat_filter = entities.target_doc_category

    if cat == "salary":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_employee_salary",
            reason="Exact structured fact: employee compensation records",
            category_filter=None,
        )
    elif cat == "attendance":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_employee_attendance",
            reason="Exact structured fact: employee attendance logs & summary",
            category_filter=None,
        )
    elif cat == "leave":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_employee_leave",
            reason="Exact structured fact: employee leave balances & history",
            category_filter=None,
        )
    elif cat == "profile":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_employee_profile",
            reason="Exact structured fact: employee core profile & employment details",
            category_filter=None,
        )
    elif cat == "performance":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_employee_performance",
            reason="Exact structured fact: employee appraisals & KPI metrics",
            category_filter=None,
        )
    elif cat == "payroll_aggregate":
        return RoutingDecision(
            route_type="DIRECT_DB_LOOKUP",
            tool_name="fetch_payroll_run_details",
            reason="Exact structured fact: aggregate tenant payroll run metrics",
            category_filter=None,
        )
    elif cat == "policy":
        return RoutingDecision(
            route_type="CHROMA_RAG",
            tool_name="query_company_policies",
            reason=f"Document knowledge: enterprise company policies & guidelines (filter: {doc_cat_filter})",
            category_filter=doc_cat_filter,
        )
    else:
        # Unknown/Unspecified: fallback to ChromaDB RAG inspection first
        return RoutingDecision(
            route_type="CHROMA_RAG",
            tool_name="query_company_policies",
            reason=f"General inquiry: search tenant document store (filter: {doc_cat_filter})",
            category_filter=doc_cat_filter,
        )

