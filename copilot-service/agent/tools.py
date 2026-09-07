import datetime
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rag.retriever import retrieve_company_documents
from agent.audit import log_salary_access

# Comprehensive mock store covering the full employee record (Revision 2 Constraint 9)
MOCK_EMPLOYEE_STORE = {
    # Tenant Alpha
    ("tenant_alpha", "emp_alpha_01"): {
        "user_id": "emp_alpha_01",
        "company_id": "tenant_alpha",
        "name": "Alice Smith",
        "email": "alice.smith@alpha.com",
        "phone": "+1-555-0101",
        "department": "Engineering",
        "designation": "Staff Software Engineer",
        "role": "EMPLOYEE",
        "date_of_joining": "2023-03-15",
        "status": "Active",
        "work_location": "Building A, Floor 3 (HQ)",
        "leave_balance": {"casual": 8, "sick": 10, "annual": 15, "unpaid": 0},
        "leave_history": [
            {"date": "2026-07-10", "type": "Casual", "days": 2, "status": "Approved", "reason": "Personal errands"},
            {"date": "2026-05-14", "type": "Sick", "days": 1, "status": "Approved", "reason": "Fever"},
        ],
        "attendance_pct": 98.2,
        "attendance_summary": {
            "total_working_days": 160,
            "present_days": 157,
            "absent_days": 1,
            "late_days": 2,
            "half_days": 0,
        },
        "attendance_history": [
            {"date": "2026-08-31", "clock_in": "09:02 AM", "clock_out": "05:58 PM", "shift_status": "On-Time"},
            {"date": "2026-08-28", "clock_in": "09:15 AM", "clock_out": "06:05 PM", "shift_status": "Late"},
            {"date": "2026-08-27", "clock_in": "08:55 AM", "clock_out": "05:30 PM", "shift_status": "On-Time"},
        ],
        "monthly_salary": 8500,
        "salary_details": {
            "base_salary": 7000.0,
            "hra": 1000.0,
            "special_allowances": 500.0,
            "deductions": 700.0,
            "net_monthly": 8500.0,
            "currency": "USD",
            "effective_date": "2026-01-01",
        },
        "performance": {
            "rating": 4.8,
            "scale": 5.0,
            "review_period": "2025-2026 H1",
            "goals_completed": 9,
            "total_goals": 10,
            "kpis": {
                "Code Quality": "96%",
                "Sprint Velocity": "98%",
                "System Reliability": "99.9%",
            },
            "manager_feedback": "Consistently exceeds delivery expectations. Outstanding leadership during microservice migration.",
            "last_appraisal_date": "2026-06-30",
        },
    },
    ("tenant_alpha", "emp_alpha_02"): {
        "user_id": "emp_alpha_02",
        "company_id": "tenant_alpha",
        "name": "Bob Jones",
        "email": "bob.jones@alpha.com",
        "phone": "+1-555-0102",
        "department": "Sales",
        "designation": "Sales Executive",
        "role": "EMPLOYEE",
        "date_of_joining": "2024-01-10",
        "status": "Active",
        "work_location": "Building B, Floor 1",
        "leave_balance": {"casual": 4, "sick": 6, "annual": 8, "unpaid": 0},
        "leave_history": [
            {"date": "2026-06-12", "type": "Annual", "days": 3, "status": "Approved", "reason": "Family vacation"}
        ],
        "attendance_pct": 94.0,
        "attendance_summary": {
            "total_working_days": 160,
            "present_days": 150,
            "absent_days": 4,
            "late_days": 6,
            "half_days": 0,
        },
        "attendance_history": [
            {"date": "2026-08-31", "clock_in": "09:30 AM", "clock_out": "06:15 PM", "shift_status": "Late"},
            {"date": "2026-08-28", "clock_in": "09:00 AM", "clock_out": "05:30 PM", "shift_status": "On-Time"},
        ],
        "monthly_salary": 7200,
        "salary_details": {
            "base_salary": 5500.0,
            "hra": 1000.0,
            "special_allowances": 700.0,
            "deductions": 500.0,
            "net_monthly": 7200.0,
            "currency": "USD",
            "effective_date": "2026-01-01",
        },
        "performance": {
            "rating": 4.3,
            "scale": 5.0,
            "review_period": "2025-2026 H1",
            "goals_completed": 8,
            "total_goals": 10,
            "kpis": {"Lead Conversion": "92%", "Quota Attainment": "104%"},
            "manager_feedback": "Strong quarter for new logo acquisitions in Midwest region.",
            "last_appraisal_date": "2026-06-30",
        },
    },
    # Tenant Beta (same employee IDs / names to test strict isolation)
    ("tenant_beta", "emp_alpha_01"): {
        "user_id": "emp_alpha_01",
        "company_id": "tenant_beta",
        "name": "Alice Smith (Beta Corp)",
        "email": "alice@beta.corp",
        "phone": "+1-555-0201",
        "department": "Finance",
        "designation": "Financial Analyst",
        "role": "EMPLOYEE",
        "date_of_joining": "2022-11-01",
        "status": "Active",
        "work_location": "Beta West Tower",
        "leave_balance": {"casual": 2, "sick": 1, "annual": 5, "unpaid": 0},
        "leave_history": [
            {"date": "2026-08-01", "type": "Sick", "days": 2, "status": "Approved", "reason": "Dental surgery"}
        ],
        "attendance_pct": 88.0,
        "attendance_summary": {
            "total_working_days": 160,
            "present_days": 141,
            "absent_days": 9,
            "late_days": 10,
            "half_days": 0,
        },
        "attendance_history": [
            {"date": "2026-08-31", "clock_in": "09:45 AM", "clock_out": "06:00 PM", "shift_status": "Late"}
        ],
        "monthly_salary": 9500,
        "salary_details": {
            "base_salary": 8000.0,
            "hra": 1200.0,
            "special_allowances": 800.0,
            "deductions": 900.0,
            "net_monthly": 9500.0,
            "currency": "USD",
            "effective_date": "2026-01-01",
        },
        "performance": {
            "rating": 4.1,
            "scale": 5.0,
            "review_period": "2025-2026 H1",
            "goals_completed": 7,
            "total_goals": 10,
            "kpis": {"Audit Accuracy": "99%", "Report Turnaround": "90%"},
            "manager_feedback": "Solid financial modeling performance.",
            "last_appraisal_date": "2026-06-30",
        },
    },
}

MOCK_PAYROLL_STORE = {
    ("tenant_alpha", "run_2026_08"): {
        "run_id": "run_2026_08",
        "company_id": "tenant_alpha",
        "month": 8,
        "year": 2026,
        "total_disbursed": 450000.00,
        "employee_count": 48,
        "status": "COMPLETED",
        "approved_by": "HR Admin Alpha",
    },
    ("tenant_beta", "run_2026_08"): {
        "run_id": "run_2026_08",
        "company_id": "tenant_beta",
        "month": 8,
        "year": 2026,
        "total_disbursed": 980000.00,
        "employee_count": 110,
        "status": "COMPLETED",
        "approved_by": "HR Admin Beta",
    },
}

def _find_record(company_id: str, target_user_id: str) -> Optional[Dict[str, Any]]:
    """Helper that looks up employee record with strict multi-tenant scoping."""
    if not company_id or not target_user_id:
        return None

    key = (str(company_id), str(target_user_id))
    if key in MOCK_EMPLOYEE_STORE:
        return MOCK_EMPLOYEE_STORE[key]

    # Check same company for user ID match
    for (cid, uid), rec in MOCK_EMPLOYEE_STORE.items():
        if cid == str(company_id) and (uid == str(target_user_id) or rec.get("user_id") == str(target_user_id)):
            return rec

    return None

def _enforce_scoping(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
) -> Optional[Dict[str, Any]]:
    """
    Common defense-in-depth scoping enforcement:
    - Verifies company_id presence
    - Enforces that EMPLOYEE role can ONLY access their own target_user_id
    """
    if not company_id:
        return {"error": "Multi-tenant violation: company_id is required.", "status": "FORBIDDEN"}

    if requester_role and requester_role.upper() == "EMPLOYEE":
        if str(target_user_id) != str(requester_user_id):
            return {
                "error": "Access Denied: EMPLOYEE role is restricted to own records only.",
                "status": "FORBIDDEN",
                "blocked_at": "tool_level_rbac",
            }
    return None

def format_currency_hrms(amount, currency="INR") -> str:
    """Formats salary amount matching Vektra Employee Section on the left (e.g. ₹15,00,000)."""
    if amount is None or amount == "" or amount == "Not available":
        return "Not available"
    try:
        val = float(amount)
        if currency.upper() == "USD" or (val < 10 and val != int(val)):
            return f"${val:,.2f}"
        int_val = int(val)
        s = str(int_val)
        if len(s) > 3:
            last3 = s[-3:]
            remaining = s[:-3]
            res = ""
            while len(remaining) > 2:
                res = "," + remaining[-2:] + res
                remaining = remaining[:-2]
            formatted = remaining + res + "," + last3
        else:
            formatted = s
        return f"₹{formatted}"
    except Exception:
        return f"₹{amount}"

def fetch_employee_profile(
    company_id: str,
    target_user_id: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    employee_override: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches employee profile details with strict multi-tenant and RBAC enforcement.
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id

    rbac_err = _enforce_scoping(company_id, effective_target_id, requester_role, effective_requester_id)
    if rbac_err:
        return rbac_err

    record = employee_override or _find_record(company_id, effective_target_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No employee profile found for ID {effective_target_id} in company {company_id}.",
        }

    sal_val = record.get("monthlySalary") if record.get("monthlySalary") is not None else record.get("monthly_salary", 0)
    curr = record.get("currency", "INR")
    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record.get("user_id", target_user_id),
        "employee_id": record.get("employeeId") or record.get("employee_id") or record.get("user_id", "Not assigned"),
        "name": record.get("name", "Employee"),
        "email": record.get("email", "Not available"),
        "phone": record.get("phoneNumber") or record.get("phone", "Not available"),
        "department": record.get("department", "Not specified"),
        "designation": record.get("designation", record.get("department", "Not specified")),
        "role": record.get("role", "EMPLOYEE"),
        "date_of_joining": record.get("date_of_joining", "N/A"),
        "status_label": record.get("status", record.get("status_label", "Active")),
        "monthly_salary": sal_val,
        "formatted_salary": format_currency_hrms(sal_val, curr),
        "work_location": record.get("work_location", "Main Office"),
    }

def fetch_employee_salary(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches employee salary & compensation details.
    Revision 2 Constraint 9 & 12:
    - Strict multi-tenant & RBAC scoping
    - Audit-logged on access (both granted and denied attempts)
    """
    rbac_err = _enforce_scoping(company_id, target_user_id, requester_role, requester_user_id)
    if rbac_err:
        log_salary_access(
            company_id=company_id,
            requester_user_id=requester_user_id,
            requester_role=requester_role,
            target_user_id=target_user_id,
            status="DENIED",
            reason=rbac_err.get("error", "RBAC Access Denied"),
        )
        return rbac_err

    record = employee_override or _find_record(company_id, target_user_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No salary record found for ID {target_user_id} in company {company_id}.",
        }

    # Audit log the successful access
    log_salary_access(
        company_id=company_id,
        requester_user_id=requester_user_id,
        requester_role=requester_role,
        target_user_id=target_user_id,
        status="GRANTED",
        reason="Authorized employee compensation inspection",
        accessed_fields=["base_salary", "hra", "special_allowances", "deductions", "net_monthly"],
    )

    sal_details = record.get("salary_details", {})
    sal_val = record.get("monthlySalary") if record.get("monthlySalary") is not None else record.get("monthly_salary", 0)
    curr = sal_details.get("currency", record.get("currency", "INR"))
    formatted_sal = format_currency_hrms(sal_val, curr)

    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record.get("user_id", target_user_id),
        "employee_id": record.get("employeeId") or record.get("employee_id") or record.get("user_id", "Not assigned"),
        "name": record.get("name", "Employee"),
        "department": record.get("department", "Not specified"),
        "role": record.get("role", "EMPLOYEE"),
        "email": record.get("email", "Not available"),
        "phone": record.get("phoneNumber") or record.get("phone", "Not available"),
        "status_label": record.get("status", record.get("status_label", "Active")),
        "base_salary": sal_details.get("base_salary", sal_val),
        "hra": sal_details.get("hra", 0),
        "special_allowances": sal_details.get("special_allowances", 0),
        "deductions": sal_details.get("deductions", 0),
        "net_monthly": sal_val,
        "monthly_salary": sal_val,
        "formatted_salary": formatted_sal,
        "currency": curr,
        "effective_date": sal_details.get("effective_date", "2026-01-01"),
    }


def fetch_employee_attendance(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
    date_range: Optional[str] = None,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches employee attendance statistics and recent logs.
    """
    rbac_err = _enforce_scoping(company_id, target_user_id, requester_role, requester_user_id)
    if rbac_err:
        return rbac_err

    record = employee_override or _find_record(company_id, target_user_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No attendance record found for ID {target_user_id} in company {company_id}.",
        }

    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record.get("user_id", target_user_id),
        "name": record.get("name", "Employee"),
        "attendance_percentage": record.get("attendance_pct", 0),
        "summary": record.get("attendance_summary", {}),
        "recent_logs": record.get("attendance_history", []),
        "filter_date_range": date_range,
    }

def fetch_employee_leave(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches employee leave balances and leave request history.
    """
    rbac_err = _enforce_scoping(company_id, target_user_id, requester_role, requester_user_id)
    if rbac_err:
        return rbac_err

    record = employee_override or _find_record(company_id, target_user_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No leave records found for ID {target_user_id} in company {company_id}.",
        }

    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record.get("user_id", target_user_id),
        "name": record.get("name", "Employee"),
        "leave_balance": record.get("leave_balance", {}),
        "leave_history": record.get("leave_history", []),
    }

def fetch_employee_performance(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches employee performance ratings, KPIs, and review history.
    """
    rbac_err = _enforce_scoping(company_id, target_user_id, requester_role, requester_user_id)
    if rbac_err:
        return rbac_err

    record = employee_override or _find_record(company_id, target_user_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No performance records found for ID {target_user_id} in company {company_id}.",
        }

    perf = record.get("performance", {})
    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record.get("user_id", target_user_id),
        "name": record.get("name", "Employee"),
        "rating": perf.get("rating"),
        "scale": perf.get("scale", 5.0),
        "review_period": perf.get("review_period"),
        "goals_completed": perf.get("goals_completed"),
        "total_goals": perf.get("total_goals"),
        "kpis": perf.get("kpis", {}),
        "manager_feedback": perf.get("manager_feedback"),
        "last_appraisal_date": perf.get("last_appraisal_date"),
    }

def fetch_employee_stats(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Backward-compatible aggregate stats tool:
    - EMPLOYEE role can ONLY access their own target_user_id
    - HR / ADMIN role can access any employee record within their own company_id
    """
    rbac_err = _enforce_scoping(company_id, target_user_id, requester_role, requester_user_id)
    if rbac_err:
        return rbac_err

    record = employee_override or _find_record(company_id, target_user_id)
    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No employee stats found for ID {target_user_id} in company {company_id}.",
        }

    # Return employee statistics (scrubbed of sensitive raw fields)
    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record["user_id"],
        "name": record["name"],
        "department": record["department"],
        "leave_balance": record["leave_balance"],
        "attendance_percentage": record["attendance_pct"],
        "monthly_salary": record["monthly_salary"] if requester_role.upper() in ["HR", "ADMIN", "SUPERADMIN"] or str(target_user_id) == str(requester_user_id) else "[RESTRICTED]",
    }

def fetch_payroll_run_details(
    company_id: str,
    run_id: str,
    requester_role: str = "HR",
    requester_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches aggregate payroll run metrics:
    - Restricted to HR / ADMIN / SUPERADMIN roles
    - EMPLOYEE role is blocked at tool layer
    """
    if not company_id:
        return {"error": "Multi-tenant violation: company_id is required.", "status": "FORBIDDEN"}

    # Defense-in-depth Tool RBAC check
    if requester_role.upper() not in ["HR", "ADMIN", "SUPERADMIN"]:
        return {
            "error": "Access Denied: Aggregate payroll metrics require HR/ADMIN privileges.",
            "status": "FORBIDDEN",
            "blocked_at": "tool_level_rbac",
        }

    key = (str(company_id), str(run_id))
    record = MOCK_PAYROLL_STORE.get(key)

    if not record:
        # Fallback to any company record matching run_id or default run
        for (cid, rid), r in MOCK_PAYROLL_STORE.items():
            if cid == str(company_id):
                record = r
                break

    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"Payroll run {run_id} not found for company {company_id}.",
        }

    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "run_id": record["run_id"],
        "month": record["month"],
        "year": record["year"],
        "total_disbursed": record["total_disbursed"],
        "employee_count": record["employee_count"],
        "status_label": record["status"],
        "approved_by": record["approved_by"],
    }

# --- Phase 5 Explicit Tools & Aliases ---

def fetch_salary_details(
    company_id: str,
    user_id: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
    employee_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Phase 5 Tool:
    fetch_salary_details(company_id, user_id) — EMPLOYEE: own record only; HR/ADMIN: individual or aggregate within tenant
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id
    return fetch_employee_salary(
        company_id=company_id,
        target_user_id=effective_target_id,
        requester_role=requester_role,
        requester_user_id=effective_requester_id,
        employee_override=employee_override,
    )

def fetch_attendance_records(
    company_id: str,
    user_id: Optional[str] = None,
    date_range: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Phase 5 Tool:
    fetch_attendance_records(company_id, user_id, date_range)
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id
    return fetch_employee_attendance(
        company_id=company_id,
        target_user_id=effective_target_id,
        requester_role=requester_role,
        requester_user_id=effective_requester_id,
        date_range=date_range,
    )

def fetch_leave_balance(
    company_id: str,
    user_id: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Phase 5 Tool:
    fetch_leave_balance(company_id, user_id)
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id
    res = fetch_employee_leave(
        company_id=company_id,
        target_user_id=effective_target_id,
        requester_role=requester_role,
        requester_user_id=effective_requester_id,
    )
    if res.get("status") == "SUCCESS":
        return {
            "status": "SUCCESS",
            "company_id": company_id,
            "user_id": res.get("user_id"),
            "name": res.get("name"),
            "leave_balance": res.get("leave_balance", {}),
        }
    return res

def fetch_leave_history(
    company_id: str,
    user_id: Optional[str] = None,
    date_range: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Phase 5 Tool:
    fetch_leave_history(company_id, user_id, date_range)
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id
    res = fetch_employee_leave(
        company_id=company_id,
        target_user_id=effective_target_id,
        requester_role=requester_role,
        requester_user_id=effective_requester_id,
    )
    if res.get("status") == "SUCCESS":
        return {
            "status": "SUCCESS",
            "company_id": company_id,
            "user_id": res.get("user_id"),
            "name": res.get("name"),
            "leave_history": res.get("leave_history", []),
            "filter_date_range": date_range,
        }
    return res

def fetch_performance_reviews(
    company_id: str,
    user_id: Optional[str] = None,
    requester_role: str = "EMPLOYEE",
    requester_user_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Phase 5 Tool:
    fetch_performance_reviews(company_id, user_id)
    """
    effective_target_id = target_user_id or user_id or requester_user_id
    effective_requester_id = requester_user_id or user_id or effective_target_id
    return fetch_employee_performance(
        company_id=company_id,
        target_user_id=effective_target_id,
        requester_role=requester_role,
        requester_user_id=effective_requester_id,
    )

def query_company_policies(company_id: str, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Tool wrapping tenant-isolated RAG retrieval with optional category filtering.
    """
    return retrieve_company_documents(company_id=company_id, query=query, category=category, top_k=4)


