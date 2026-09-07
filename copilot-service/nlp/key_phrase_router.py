import re
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

@dataclass
class KeyPhraseEntities:
    data_category: str                  # 'salary', 'attendance', 'leave', 'profile', 'performance', 'policy', 'mixed', 'unknown'
    employee_reference: Optional[str]   # Explicit employee ID or 'SELF'
    target_user_id: Optional[str]       # Resolved target user ID
    date_range: Optional[str]           # Extracted date/period string
    is_self_query: bool                 # Whether user is asking about themselves
    extracted_keywords: List[str]       # Key phrases found
    target_doc_category: Optional[str] = None  # 'terms_and_conditions', 'employee_handbooks', 'compliance_regulatory', 'company_policies'

@dataclass
class KeyPhraseRoutingDecision:
    route_type: str                     # 'STRUCTURED_TOOL', 'CHROMA_RAG', 'HYBRID_COMPOSED', or 'UNRESOLVED'
    tool_name: Optional[str]            # Primary tool function name
    secondary_tool: Optional[str]       # Optional secondary tool for hybrid queries
    reason: str                         # Routing rationale
    category_filter: Optional[str] = None  # Category filter for retrieval call

EMP_ID_PATTERN = re.compile(r"\b(emp_[a-zA-Z0-9_]+)\b", re.IGNORECASE)
SELF_PATTERN = re.compile(r"\b(?:my|mine|i|me|myself|self)\b", re.IGNORECASE)
DATE_RANGE_PATTERNS = [
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    re.compile(r"\b\d{4}-\d{2}\b"),
    re.compile(r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b", re.IGNORECASE),
    re.compile(r"\b(?:this\s+month|last\s+month|this\s+year|last\s+year|today|yesterday|this\s+week)\b", re.IGNORECASE),
]

STRUCTURED_FIELD_MAP = {
    "salary": "fetch_salary_details",
    "attendance": "fetch_attendance_records",
    "leave": "fetch_leave_balance",
    "profile": "fetch_employee_profile",
    "performance": "fetch_performance_reviews",
}

POLICY_KEYWORDS = [
    "policy", "handbook", "guideline", "guidelines", "code of conduct",
    "official rules", "regulations", "procedure", "dress code", "remote work rules",
    "evacuation", "what is the policy on", "according to policy", "standard policy",
    "terms and conditions", "terms & conditions", "compliance",
]

def detect_doc_category(query: str) -> Optional[str]:
    """
    Phase 6 Requirement 5:
    Detects when user query names a specific document category:
    'policy', 'handbook', 'compliance', 'terms and conditions'.
    """
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

def extract_key_phrases(query: str, requester_user_id: Optional[str] = None) -> KeyPhraseEntities:
    """
    Phase 5 & 6 NLP Key-Phrase & Entity Extraction:
    - data category keyword ('salary', 'attendance', 'leave', 'profile', 'performance', 'policy')
    - document category keyword ('terms_and_conditions', 'company_policies', 'employee_handbooks', 'compliance_regulatory')
    - employee reference (emp_... ID or self)
    - date range (specific date, month, or relative period)
    """
    q_lower = query.lower()
    keywords_found = []

    # 1. Employee reference
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

    # 2. Date range
    date_range = None
    for dp in DATE_RANGE_PATTERNS:
        match_date = dp.search(query)
        if match_date:
            date_range = match_date.group(0)
            keywords_found.append(f"date_range:{date_range}")
            break

    # 3. Document Category detection (Phase 6 Requirement 5)
    doc_category = detect_doc_category(query)
    if doc_category:
        keywords_found.append(f"doc_category:{doc_category}")

    # 4. Detect policy vs structured indicators
    has_policy_lang = bool(doc_category) or any(k in q_lower for k in POLICY_KEYWORDS)

    structured_matches = []
    if any(k in q_lower for k in ["salary", "compensation", "wage", "wages", "payslip", "base salary", "hra", "allowance", "net pay", "earnings"]):
        structured_matches.append("salary")
        keywords_found.append("category:salary")
    if any(k in q_lower for k in ["attendance", "clock in", "clock-in", "clock out", "check-in", "late days", "present days", "absent days"]):
        structured_matches.append("attendance")
        keywords_found.append("category:attendance")
    if any(k in q_lower for k in ["leave balance", "sick leave", "casual leave", "annual leave", "pto", "vacation days", "leave history"]):
        structured_matches.append("leave")
        keywords_found.append("category:leave")
    if any(k in q_lower for k in ["profile", "designation", "contact info", "phone number", "joining date", "work location", "who am i", "my role", "employee id", "department"]):
        structured_matches.append("profile")
        keywords_found.append("category:profile")
    if any(k in q_lower for k in ["performance", "appraisal", "kpi", "kpis", "rating", "review period", "manager feedback"]):
        structured_matches.append("performance")
        keywords_found.append("category:performance")

    # Explicit question asking about policy or rules (without personal my balance/records request)
    is_pure_policy_inquiry = has_policy_lang and not (
        is_self and any(k in q_lower for k in ["my balance", "my salary", "my attendance", "my records", "my leave", "my rating", "my profile"])
    ) and ("what is the policy" in q_lower or "policy on" in q_lower or "official rules" in q_lower or "guidelines" in q_lower or "handbook" in q_lower or "terms" in q_lower or "compliance" in q_lower)

    # Mixed query: has explicit personal request AND policy inquiry
    is_mixed_query = (
        (has_policy_lang and (is_self or match_emp) and any(k in q_lower for k in ["my balance", "my salary", "my attendance", "my leave", "what is my"])) or
        (has_policy_lang and "and" in q_lower and any(k in q_lower for k in ["balance", "salary", "attendance", "record", "my"]))
    )

    if is_pure_policy_inquiry:
        category = "policy"
        keywords_found.append("category:policy")
    elif is_mixed_query:
        category = "mixed"
        keywords_found.append("category:mixed")
    elif has_policy_lang and not structured_matches:
        category = "policy"
        keywords_found.append("category:policy")
    elif len(structured_matches) == 1:
        category = structured_matches[0]
    elif len(structured_matches) > 1:
        category = "mixed"
    else:
        category = "unknown"

    return KeyPhraseEntities(
        data_category=category,
        employee_reference=emp_ref,
        target_user_id=target_id,
        date_range=date_range,
        is_self_query=is_self,
        extracted_keywords=keywords_found,
        target_doc_category=doc_category,
    )

def route_key_phrase_query(query: str, requester_user_id: Optional[str] = None) -> KeyPhraseRoutingDecision:
    """
    Phase 5 & 6 Key-Phrase Decision Routing:
    - Structured fields (salary, attendance, leave, profile, performance) -> matching tool
    - Policy/document language -> ChromaDB RAG pipeline with optional category filter
    - Ambiguous or mixed queries -> HYBRID_COMPOSED (run both and compose answer citing both)
    """
    entities = extract_key_phrases(query, requester_user_id)
    doc_cat_filter = entities.target_doc_category

    if entities.data_category in STRUCTURED_FIELD_MAP:
        tool_name = STRUCTURED_FIELD_MAP[entities.data_category]
        return KeyPhraseRoutingDecision(
            route_type="STRUCTURED_TOOL",
            tool_name=tool_name,
            secondary_tool=None,
            reason=f"Direct structured field key-phrase matched: '{entities.data_category}' -> {tool_name}",
            category_filter=None,
        )
    elif entities.data_category == "policy":
        return KeyPhraseRoutingDecision(
            route_type="CHROMA_RAG",
            tool_name="query_company_policies",
            secondary_tool=None,
            reason=f"Policy/document-style key phrases matched (filter: {doc_cat_filter}) -> ChromaDB RAG pipeline",
            category_filter=doc_cat_filter,
        )
    elif entities.data_category == "mixed":
        # Mixed: structured + policy (e.g. "What is my sick leave balance and what does the policy say about doctor notes?")
        return KeyPhraseRoutingDecision(
            route_type="HYBRID_COMPOSED",
            tool_name=STRUCTURED_FIELD_MAP.get("leave", "fetch_leave_balance"),
            secondary_tool="query_company_policies",
            reason=f"Mixed query containing structured field request and policy inquiry (filter: {doc_cat_filter}) -> Hybrid composed pipeline",
            category_filter=doc_cat_filter,
        )

    return KeyPhraseRoutingDecision(
        route_type="CHROMA_RAG",
        tool_name="query_company_policies",
        secondary_tool=None,
        reason="Default semantic RAG routing for general workplace inquiry",
        category_filter=doc_cat_filter,
    )

