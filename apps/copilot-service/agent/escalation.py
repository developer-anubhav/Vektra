import re
import uuid
import datetime
import sys
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Sensitive topic triggers that require mandatory HR escalation
SENSITIVE_TOPICS = [
    {
        "category": "Workplace Harassment & Conduct",
        "priority": "CRITICAL",
        "pattern": re.compile(
            r"\b(?:harass[a-z]*|sexual\s+harassment|bull(?:y|ied|ying)|hostile\s+environment|abuse[a-z]*|threat[a-z]*)\b",
            re.IGNORECASE,
        ),
    },
    {
        "category": "Discrimination & Bias",
        "priority": "HIGH",
        "pattern": re.compile(
            r"\b(?:discriminat[a-z]*|bias(?:ed)?|racial|racism|sexism|ageism|gender\s+bias|retaliat[a-z]*|disabilit[a-z]*)\b",
            re.IGNORECASE,
        ),
    },
    {
        "category": "Payroll & Compensation Dispute",
        "priority": "HIGH",
        "pattern": re.compile(
            r"\b(?:salary\s+dispute|unpaid\s+wages?|missing\s+pay|wrong\s+deduction|payroll\s+error|unpaid\s+overtime|not\s+paid|incorrectly\s+deducted)\b",
            re.IGNORECASE,
        ),
    },
    {
        "category": "Legal & Termination Grievance",
        "priority": "CRITICAL",
        "pattern": re.compile(
            r"\b(?:wrongful\s+termination|illegal\s+(?:firing|termination)|layoff\s+dispute|labor\s+lawyer|sue\s+the\s+company|whistleblower)\b",
            re.IGNORECASE,
        ),
    },
]

def check_sensitive_escalation(query: str) -> Optional[Tuple[str, str, str]]:
    """
    Checks if a query touches sensitive HR matters requiring human escalation.
    Returns (category, priority, reason) or None.
    """
    if not query:
        return None

    for topic in SENSITIVE_TOPICS:
        if topic["pattern"].search(query):
            return (
                topic["category"],
                topic["priority"],
                f"Triggered sensitive topic keywords for {topic['category']}",
            )

    return None

def create_hr_escalation_ticket(
    company_id: str,
    user_id: Optional[str],
    query: str,
    category: str,
    priority: str = "MEDIUM",
    reason: str = "Query requires HR human review",
) -> Dict[str, Any]:
    """
    Generates a draft HR escalation ticket record.
    """
    ticket_id = f"ESC-{uuid.uuid4().hex[:8].upper()}"
    return {
        "ticket_id": ticket_id,
        "company_id": str(company_id),
        "user_id": str(user_id or "anonymous_employee"),
        "category": category,
        "priority": priority,
        "reason": reason,
        "query_excerpt": query[:200],
        "draft_summary": (
            f"Employee raised an inquiry regarding '{category}'. "
            f"This has been routed to HR for confidential review."
        ),
        "status": "DRAFT_ESCALATION",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "requires_human_review": True,
    }
