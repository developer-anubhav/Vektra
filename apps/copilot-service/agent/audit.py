import json
import datetime
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

from config import settings

_audit_lock = threading.Lock()
_IN_MEMORY_AUDIT_LOGS: List[Dict[str, Any]] = []

def log_salary_access(
    company_id: str,
    requester_user_id: str,
    requester_role: str,
    target_user_id: str,
    status: str,  # "GRANTED" or "DENIED"
    reason: str = "",
    accessed_fields: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Revision 2 Constraint 12:
    Salary-field access is audit-logged:
    - who accessed (requester_user_id, requester_role)
    - whose salary data (target_user_id)
    - when (ISO-8601 timestamp)
    - tenant (company_id)
    - status (GRANTED or DENIED)
    """
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "company_id": str(company_id) if company_id else "UNKNOWN",
        "requester_user_id": str(requester_user_id) if requester_user_id else "ANONYMOUS",
        "requester_role": str(requester_role).upper() if requester_role else "UNKNOWN",
        "target_user_id": str(target_user_id) if target_user_id else "UNKNOWN",
        "status": status.upper(),
        "reason": reason,
        "accessed_fields": accessed_fields or ["base_salary", "net_salary"],
        "action": "SALARY_FIELD_ACCESS",
    }

    with _audit_lock:
        _IN_MEMORY_AUDIT_LOGS.append(entry)

    # Append to file if path is specified
    try:
        log_path = Path(settings.SALARY_AUDIT_LOG_PATH)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        # Non-blocking file log failure
        print(f"[WARN] Failed to write salary audit log to disk: {e}")

    return entry

def get_salary_audit_logs(
    company_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Returns filtered salary access audit logs for administrative inspection or testing.
    """
    with _audit_lock:
        records = list(_IN_MEMORY_AUDIT_LOGS)

    if company_id:
        records = [r for r in records if r.get("company_id") == str(company_id)]
    if target_user_id:
        records = [r for r in records if r.get("target_user_id") == str(target_user_id)]

    return records[-limit:]

def clear_audit_logs() -> None:
    """Clears in-memory audit logs for test isolation."""
    with _audit_lock:
        _IN_MEMORY_AUDIT_LOGS.clear()
