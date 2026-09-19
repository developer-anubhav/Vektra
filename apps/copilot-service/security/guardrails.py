import re
import sys
from pathlib import Path
from typing import Tuple, List, Optional

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings

# Non-work out-of-domain patterns (arithmetic, coding, trivia, entertainment)
NON_WORK_PATTERNS = [
    # Basic arithmetic and mathematical equations (e.g., "2*2", "solve 42 * 98", "100 / 5")
    r"(?:\b\d+\s*[\+\-\*\/\^%]\s*\d+\b)",
    r"\b(?:calculate|solve|compute|math|equation)\b.*?\d+",
    
    # Coding / Programming assistance
    r"\b(?:python|javascript|typescript|c\+\+|java|rust|golang|html|css|sql|bash|powershell|regex)\b",
    r"\b(?:write|code|debug|compile|refactor|create|implement)\b.*?\b(?:script|function|algorithm|class|method|hook|loop|array|variable|endpoint)\b",
    r"\b(?:how\s+to\s+(?:build|code|program|develop|hack|scrape))\b",
    
    # Creative writing / jokes / poetry / entertainment
    r"\b(?:poem|poetry|story|joke|song|essay|novel|haiku|rap|fiction|riddle)\b",
    
    # General trivia / history / science / celebrities
    r"\b(?:napoleon|albert\s+einstein|cleopatra|shakespeare|president|prime\s+minister|elon\s+musk|celebrity)\b",
    r"\b(?:what\s+is\s+the\s+capital\s+of|capital\s+city)\b",
    r"\b(?:world\s+cup|super\s+bowl|oscars|olympics|championship)\b",
    r"\b(?:quantum\s+physics|theory\s+of\s+relativity|photosynthesis|black\s+holes|string\s+theory)\b",
    r"\b(?:recipe\s+for|how\s+to\s+cook|how\s+to\s+bake)\b",
    r"\b(?:who\s+was\s+[a-zA-Z]+)\b",
]

COMPILED_NON_WORK = [re.compile(p, re.IGNORECASE) for p in NON_WORK_PATTERNS]

# Mapping of domains to query indicator keywords
DOMAIN_KEYWORD_MAP = {
    "hr_data": [
        "employee", "staff", "worker", "department", "manager", "team", "organization", "hr", "who am i", "my name"
    ],
    "payroll": [
        "payroll", "payroll run", "disbursed", "disbursement", "payslip", "gross", "deduction"
    ],
    "attendance": [
        "attendance", "clock in", "clock-in", "clock out", "check-in", "shift", "shifts",
        "late", "present", "absent", "working days", "on-time", "kiosk", "biometric"
    ],
    "policy": [
        "policy", "handbook", "guideline", "guidelines", "rules", "code of conduct",
        "dress code", "wfh", "remote work", "work from home", "office hours", "probation",
        "termination", "resignation", "notice period", "safety", "evacuation",
        "compliance", "regulatory", "regulations", "audit", "retention", "terms",
        "terms and conditions", "statutory", "legal", "gdpr", "iso", "contract"
    ],
    "profile": [
        "profile", "designation", "email", "phone", "contact", "date of joining", "work location",
        "name", "whats my name", "what is my name", "what's my name", "who am i", "my identity",
        "my info", "my details", "about me", "my role", "my title", "employee id", "user id",
        "additional details", "show my profile", "employee details", "more details", "full profile",
        "my id", "department", "status", "joining date", "when did i join"
    ],
    "performance": [
        "performance", "appraisal", "rating", "review", "kpi", "kpis", "goals", "feedback"
    ],
    "leave": [
        "leave", "vacation", "sick leave", "casual leave", "annual leave", "pto",
        "maternity", "paternity", "parental", "holiday", "holidays", "time off", "absence"
    ],
    "salary": [
        "salary", "compensation", "wage", "wages", "base salary", "hra", "allowance",
        "allowances", "net monthly", "pay", "earnings"
    ],
    "benefits": [
        "benefit", "benefits", "insurance", "health insurance", "medical", "dental",
        "provident fund", "pf", "pension", "perks", "wellness"
    ],
}

def detect_query_domain(query_lower: str) -> Optional[str]:
    """Determines which HRMS domain a query belongs to based on keyword indicators."""
    for domain, keywords in DOMAIN_KEYWORD_MAP.items():
        if any(k in query_lower for k in keywords):
            return domain
    return None

def check_domain_guardrail(
    query: str,
    allowed_domains_override: Optional[List[str]] = None,
) -> Tuple[bool, str]:
    """
    Revision 2 Constraint 10:
    Domain guardrail is environment-configured, not hardcoded.
    Reads allowed query domains from env config (or settings) and rejects anything outside
    that set — including generic non-work queries such as basic arithmetic ('2*2') or trivia —
    before the request reaches the LLM.
    """
    if not query or not isinstance(query, str) or not query.strip():
        return False, "Query cannot be empty."

    cleaned = query.strip().lower()

    # Allow basic conversational greetings
    if cleaned in [
        "hi", "hello", "hey", "help", "who are you", "what can you do",
        "good morning", "good afternoon", "good evening", "greetings"
    ]:
        return True, ""

    # 1. Reject generic non-work queries (arithmetic, trivia, coding, poems, etc.)
    for pattern in COMPILED_NON_WORK:
        if pattern.search(cleaned):
            return False, (
                "I am the Vektra AI Co-Pilot, dedicated exclusively to enterprise HR, policy, "
                "attendance, and payroll inquiries. This request is outside official company HR records."
            )

    # 2. Get environment-configured allowed domains
    configured_domains = (
        allowed_domains_override
        if allowed_domains_override is not None
        else settings.get_allowed_domains()
    )

    # 3. Detect domain of query
    detected_domain = detect_query_domain(cleaned)

    if detected_domain:
        # Check if detected domain is in the allowed configured domains
        if detected_domain not in configured_domains:
            return False, (
                f"I am the Vektra AI Co-Pilot. Inquiries regarding '{detected_domain}' are currently "
                "restricted by your organization's environment configuration."
            )
        return True, ""

    # 4. If no specific HR domain keywords match, check if it has generic workplace/vektra terms
    if any(k in cleaned for k in ["vektra", "company", "office", "work", "job"]):
        return True, ""

    # Fallback rejection for completely unrecognized non-work topics
    return False, (
        "I am the Vektra AI Co-Pilot, dedicated exclusively to enterprise HR, policy, "
        "attendance, and payroll inquiries. This request is outside official company HR records."
    )
