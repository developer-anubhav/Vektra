import os
import re
from typing import Optional, Tuple, List

DEFAULT_ALLOWED_DOMAINS = [
    "hr_data",
    "payroll",
    "attendance",
    "leave",
    "performance",
    "policy",
    "salary",
    "profile",
    "benefits",
]

DEFAULT_REJECTION_MESSAGE = (
    "I am the Vektra AI Co-Pilot, dedicated exclusively to enterprise HR, policy, "
    "attendance, and payroll inquiries. This request is outside official company HR records."
)

NON_WORK_REGEX = [
    # Basic arithmetic and mathematical equations (e.g., "2*2", "solve 42 * 98", "100 / 5")
    re.compile(r"(?:\b\d+\s*[\+\-\*\/\^%]\s*\d+\b)", re.IGNORECASE),
    re.compile(r"\b(?:calculate|solve|compute|math|equation)\b.*?\d+", re.IGNORECASE),
    # Coding / Programming assistance
    re.compile(r"\b(?:python|javascript|typescript|c\+\+|java|rust|golang|html|css|sql|bash|powershell|regex)\b", re.IGNORECASE),
    re.compile(r"\b(?:write|code|debug|compile|refactor|create|implement)\b.*?\b(?:script|function|algorithm|class|method|hook|loop|array|variable|endpoint)\b", re.IGNORECASE),
    re.compile(r"\b(?:how\s+to\s+(?:build|code|program|develop|hack|scrape))\b", re.IGNORECASE),
    # Creative writing / jokes / trivia
    re.compile(r"\b(?:poem|poetry|story|joke|song|essay|novel|haiku|rap|fiction|riddle)\b", re.IGNORECASE),
    re.compile(r"\b(?:napoleon|albert\s+einstein|cleopatra|shakespeare|president|prime\s+minister|elon\s+musk|celebrity)\b", re.IGNORECASE),
    re.compile(r"\b(?:what\s+is\s+the\s+capital\s+of|capital\s+city)\b", re.IGNORECASE),
    re.compile(r"\b(?:world\s+cup|super\s+bowl|oscars|olympics|championship)\b", re.IGNORECASE),
    re.compile(r"\b(?:quantum\s+physics|theory\s+of\s+relativity|photosynthesis|black\s+holes|string\s+theory)\b", re.IGNORECASE),
    re.compile(r"\b(?:recipe\s+for|how\s+to\s+cook|how\s+to\s+bake)\b", re.IGNORECASE),
    re.compile(r"\b(?:who\s+was\s+[a-zA-Z]+)\b", re.IGNORECASE),
]

DOMAIN_KEYWORDS = {
    "hr_data": ["employee", "staff", "worker", "department", "manager", "team", "organization", "hr", "who am i", "my name"],
    "payroll": ["payroll", "payroll run", "disbursed", "disbursement", "payslip", "gross", "deduction"],
    "salary": ["salary", "compensation", "wage", "wages", "base salary", "hra", "allowance", "net monthly", "pay", "earnings"],
    "attendance": ["attendance", "clock in", "clock-in", "clock out", "check-in", "shift", "shifts", "late", "present", "absent", "working days", "on-time", "kiosk", "biometric"],
    "leave": ["leave", "vacation", "sick leave", "casual leave", "annual leave", "pto", "maternity", "paternity", "parental", "holiday", "holidays", "time off", "absence"],
    "profile": ["profile", "designation", "email", "phone", "contact", "date of joining", "work location", "name", "who am i", "my role", "employee id", "department", "status"],
    "performance": ["performance", "appraisal", "rating", "review", "kpi", "kpis", "goals", "feedback"],
    "policy": [
        "policy", "handbook", "guideline", "guidelines", "rules", "code of conduct",
        "dress code", "wfh", "remote work", "work from home", "office hours", "probation",
        "termination", "safety", "compliance", "regulatory", "regulations", "audit",
        "retention", "terms", "terms and conditions", "statutory", "legal", "gdpr"
    ],
    "benefits": ["benefit", "benefits", "insurance", "health insurance", "medical", "dental", "provident fund", "pf", "pension", "perks", "wellness"],
}

class DomainFilter:
    """
    Phase 5 Domain Filter Guardrail:
    - Reads ALLOWED_QUERY_DOMAINS and STRICT_DOMAIN_MODE from environment
    - Classifies incoming queries before they reach the LLM or any tool
    - Rejects generic non-work queries without consuming LLM tokens
    """
    def __init__(self):
        raw_domains = os.getenv("ALLOWED_QUERY_DOMAINS", "")
        if raw_domains:
            self.allowed_domains = [d.strip().lower() for d in raw_domains.split(",") if d.strip()]
        else:
            self.allowed_domains = DEFAULT_ALLOWED_DOMAINS

        strict_str = os.getenv("STRICT_DOMAIN_MODE", "true").strip().lower()
        self.strict_mode = strict_str in ["true", "1", "yes", "on"]

        self.rejection_message = os.getenv(
            "REJECT_GENERIC_QUERIES_MESSAGE",
            DEFAULT_REJECTION_MESSAGE
        )

    def classify_query(self, query: str) -> Optional[str]:
        """Classifies query into an HRMS domain or returns None if unclassified/non-work."""
        if not query or not query.strip():
            return None

        q_lower = query.strip().lower()

        # Check non-work patterns
        for pat in NON_WORK_REGEX:
            if pat.search(q_lower):
                return "non_work_generic"

        for domain, keywords in DOMAIN_KEYWORDS.items():
            if any(k in q_lower for k in keywords):
                return domain

        # General workplace reference
        if any(k in q_lower for k in ["vektra", "company", "office", "work", "job", "policy"]):
            return "hr_data"

        return None

    def validate_query(self, query: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validates query against domain guardrail.
        Returns: (is_allowed: bool, domain: Optional[str], rejection_reason_or_msg: Optional[str])
        """
        if not query or not query.strip():
            return False, None, "Query cannot be empty."

        q_lower = query.strip().lower()

        # Allow basic greetings
        if q_lower in ["hi", "hello", "hey", "help", "who are you", "what can you do", "good morning", "good afternoon"]:
            return True, "greeting", None

        # Pre-flight non-work detection (arithmetic, trivia, coding)
        for pat in NON_WORK_REGEX:
            if pat.search(q_lower):
                return False, "non_work_generic", self.rejection_message

        detected_domain = self.classify_query(query)

        if not detected_domain or detected_domain == "non_work_generic":
            if self.strict_mode:
                return False, detected_domain, self.rejection_message
            return True, "unknown", None

        if self.strict_mode and detected_domain not in self.allowed_domains:
            msg = f"I am the Vektra AI Co-Pilot. Inquiries regarding '{detected_domain}' are currently restricted by your organization's environment configuration."
            return False, detected_domain, msg

        return True, detected_domain, None

domain_filter = DomainFilter()

def validate_query_domain(query: str) -> Tuple[bool, Optional[str]]:
    """Helper returning (is_valid, error_message)"""
    allowed, _, msg = domain_filter.validate_query(query)
    return allowed, msg or ""
