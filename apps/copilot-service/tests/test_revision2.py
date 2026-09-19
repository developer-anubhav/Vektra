import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app
from config import settings
from agent.tools import (
    fetch_employee_profile,
    fetch_employee_salary,
    fetch_employee_attendance,
    fetch_employee_leave,
    fetch_employee_performance,
    fetch_employee_stats,
    fetch_payroll_run_details,
)
from agent.audit import get_salary_audit_logs, clear_audit_logs
from agent.router import extract_query_entities, route_query_request
from security.guardrails import check_domain_guardrail
from agent.hr_agent import HRAgent

client = TestClient(app)
VALID_SECRET = settings.INTERNAL_SERVICE_SECRET

# =========================================================================
# REVISION 2 ADDITION 9: Full Current Employee Record Tools & RBAC Scoping
# =========================================================================
def test_dod_9_profile_tool_rbac_and_isolation():
    """DoD 9a: Profile tool enforces RBAC self-scoping and multi-tenant isolation"""
    # Employee accessing own profile -> SUCCESS
    res_self = fetch_employee_profile(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["name"] == "Alice Smith"
    assert res_self["department"] == "Engineering"
    assert res_self["designation"] == "Staff Software Engineer"

    # Employee attempting to access another employee's profile -> FORBIDDEN
    res_other = fetch_employee_profile(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_other["status"] == "FORBIDDEN"
    assert res_other["blocked_at"] == "tool_level_rbac"
    assert "Access Denied" in res_other["error"]

    # HR role accessing employee profile -> SUCCESS
    res_hr = fetch_employee_profile(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="HR",
        requester_user_id="hr_user_01",
    )
    assert res_hr["status"] == "SUCCESS"
    assert res_hr["name"] == "Bob Jones"

    # Multi-tenant isolation: Tenant Alpha vs Tenant Beta with identical IDs
    res_beta = fetch_employee_profile(
        company_id="tenant_beta",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_beta["status"] == "SUCCESS"
    assert res_beta["department"] == "Finance"
    assert res_self["department"] != res_beta["department"]

def test_dod_9_attendance_tool_rbac_and_isolation():
    """DoD 9b: Attendance tool enforces RBAC and tenant isolation"""
    # Self query -> SUCCESS
    res_self = fetch_employee_attendance(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["attendance_percentage"] == 98.2
    assert len(res_self["recent_logs"]) > 0

    # Cross-employee query by EMPLOYEE -> BLOCKED
    res_blocked = fetch_employee_attendance(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_blocked["status"] == "FORBIDDEN"
    assert res_blocked["blocked_at"] == "tool_level_rbac"

def test_dod_9_leave_tool_rbac_and_isolation():
    """DoD 9c: Leave tool enforces RBAC and tenant isolation"""
    # Self query -> SUCCESS
    res_self = fetch_employee_leave(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["leave_balance"]["annual"] == 15
    assert len(res_self["leave_history"]) > 0

    # Cross-employee query by EMPLOYEE -> BLOCKED
    res_blocked = fetch_employee_leave(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_blocked["status"] == "FORBIDDEN"
    assert res_blocked["blocked_at"] == "tool_level_rbac"

def test_dod_9_performance_tool_rbac_and_isolation():
    """DoD 9d: Performance tool enforces RBAC and tenant isolation"""
    # Self query -> SUCCESS
    res_self = fetch_employee_performance(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["rating"] == 4.8
    assert res_self["goals_completed"] == 9

    # Cross-employee query by EMPLOYEE -> BLOCKED
    res_blocked = fetch_employee_performance(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_blocked["status"] == "FORBIDDEN"
    assert res_blocked["blocked_at"] == "tool_level_rbac"

# =========================================================================
# REVISION 2 ADDITION 10: Environment-Configured Domain Guardrail
# =========================================================================
def test_dod_10_environment_configured_guardrail_arithmetic():
    """DoD 10a: Basic arithmetic like '2*2' or '42 * 98' is rejected before LLM"""
    arithmetic_queries = [
        "2*2",
        "solve 2 * 2",
        "what is 42 * 98?",
        "calculate 100 / 5",
        "25 + 75",
    ]
    for q in arithmetic_queries:
        in_domain, msg = check_domain_guardrail(q)
        assert in_domain is False
        assert "outside official company HR records" in msg or "Vektra AI Co-Pilot" in msg

        # Verify via /query endpoint that status is GUARDRAIL_REJECTED
        res = client.post(
            "/query",
            headers={"X-Internal-Secret": VALID_SECRET},
            json={"company_id": "tenant_alpha", "query": q},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "GUARDRAIL_REJECTED"

def test_dod_10_environment_configured_guardrail_trivia_and_coding():
    """DoD 10b: General trivia, historical figures, and coding help are rejected"""
    rejected_queries = [
        "Who was Napoleon Bonaparte?",
        "How do I write a Python function to sort a list?",
        "What is quantum physics?",
        "Write me a funny joke about cats",
    ]
    for q in rejected_queries:
        in_domain, msg = check_domain_guardrail(q)
        assert in_domain is False
        assert "outside official company HR records" in msg

def test_dod_10_environment_domain_restriction_override():
    """DoD 10c: Restricting allowed domains via configuration disables unconfigured domains"""
    # Restrict allowed domains to 'policy' only
    policy_only_domains = ["policy"]
    
    # Query for salary should be restricted
    in_domain_salary, msg_salary = check_domain_guardrail(
        "What is my monthly salary?",
        allowed_domains_override=policy_only_domains,
    )
    assert in_domain_salary is False
    assert "restricted" in msg_salary.lower() or "outside" in msg_salary.lower()

    # Query for policy should pass
    in_domain_policy, msg_policy = check_domain_guardrail(
        "What is the company maternity leave policy?",
        allowed_domains_override=policy_only_domains,
    )
    assert in_domain_policy is True
    assert msg_policy == ""

# =========================================================================
# REVISION 2 ADDITION 11: Key-Phrase/Entity Extraction & Deterministic Routing
# =========================================================================
def test_dod_11_keyphrase_entity_extraction():
    """DoD 11a: Entity extraction extracts category, employee reference, date range"""
    # 1. Salary self-query with date range
    q1 = "What is my salary and compensation for August 2026?"
    ent1 = extract_query_entities(q1, requester_user_id="emp_alpha_01")
    assert ent1.data_category == "salary"
    assert ent1.is_self_query is True
    assert ent1.target_user_id == "emp_alpha_01"
    assert ent1.date_range == "August 2026"

    # 2. Target explicit employee ID
    q2 = "Show attendance records for emp_alpha_02"
    ent2 = extract_query_entities(q2, requester_user_id="hr_manager_01")
    assert ent2.data_category == "attendance"
    assert ent2.employee_reference == "emp_alpha_02"
    assert ent2.target_user_id == "emp_alpha_02"

    # 3. Policy document question
    q3 = "What is the official policy regarding emergency leave and bereavement?"
    ent3 = extract_query_entities(q3, requester_user_id="emp_alpha_01")
    assert ent3.data_category == "policy"

def test_dod_11_deterministic_routing():
    """DoD 11b: Deterministic routing routes structured facts directly to DB tools, not vector similarity"""
    # Structured salary -> DIRECT_DB_LOOKUP
    ent_sal = extract_query_entities("What is my salary?", requester_user_id="emp_alpha_01")
    route_sal = route_query_request(ent_sal)
    assert route_sal.route_type == "DIRECT_DB_LOOKUP"
    assert route_sal.tool_name == "fetch_employee_salary"

    # Structured attendance -> DIRECT_DB_LOOKUP
    ent_att = extract_query_entities("Show my attendance", requester_user_id="emp_alpha_01")
    route_att = route_query_request(ent_att)
    assert route_att.route_type == "DIRECT_DB_LOOKUP"
    assert route_att.tool_name == "fetch_employee_attendance"

    # Structured leave -> DIRECT_DB_LOOKUP
    ent_leave = extract_query_entities("What is my leave balance?", requester_user_id="emp_alpha_01")
    route_leave = route_query_request(ent_leave)
    assert route_leave.route_type == "DIRECT_DB_LOOKUP"
    assert route_leave.tool_name == "fetch_employee_leave"

    # Structured profile -> DIRECT_DB_LOOKUP
    ent_prof = extract_query_entities("Show my employee profile", requester_user_id="emp_alpha_01")
    route_prof = route_query_request(ent_prof)
    assert route_prof.route_type == "DIRECT_DB_LOOKUP"
    assert route_prof.tool_name == "fetch_employee_profile"

    # Structured performance -> DIRECT_DB_LOOKUP
    ent_perf = extract_query_entities("What is my performance rating and appraisal KPI?", requester_user_id="emp_alpha_01")
    route_perf = route_query_request(ent_perf)
    assert route_perf.route_type == "DIRECT_DB_LOOKUP"
    assert route_perf.tool_name == "fetch_employee_performance"

    # Policy question -> CHROMA_RAG
    ent_pol = extract_query_entities("What is the company handbook policy for remote work?", requester_user_id="emp_alpha_01")
    route_pol = route_query_request(ent_pol)
    assert route_pol.route_type == "CHROMA_RAG"
    assert route_pol.tool_name == "query_company_policies"

# =========================================================================
# REVISION 2 ADDITION 12: Salary-Field Access Audit Logging
# =========================================================================
def test_dod_12_salary_access_audit_logging():
    """DoD 12: Salary-field access is audit-logged with requester, target, timestamp, and status"""
    clear_audit_logs()

    # 1. Authorized access logs GRANTED
    res_granted = fetch_employee_salary(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_granted["status"] == "SUCCESS"

    logs = get_salary_audit_logs(company_id="tenant_alpha")
    assert len(logs) >= 1
    latest = logs[-1]
    assert latest["company_id"] == "tenant_alpha"
    assert latest["requester_user_id"] == "emp_alpha_01"
    assert latest["target_user_id"] == "emp_alpha_01"
    assert latest["requester_role"] == "EMPLOYEE"
    assert latest["status"] == "GRANTED"
    assert "timestamp" in latest

    # 2. Unauthorized cross-access logs DENIED
    res_denied = fetch_employee_salary(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_denied["status"] == "FORBIDDEN"

    logs_after = get_salary_audit_logs(company_id="tenant_alpha")
    denied_entry = logs_after[-1]
    assert denied_entry["requester_user_id"] == "emp_alpha_01"
    assert denied_entry["target_user_id"] == "emp_alpha_02"
    assert denied_entry["status"] == "DENIED"

    # 3. HTTP audit endpoint returns audit trail
    res_api = client.get(
        "/audit/salary-access?company_id=tenant_alpha",
        headers={"X-Internal-Secret": VALID_SECRET},
    )
    assert res_api.status_code == 200
    data = res_api.json()
    assert data["success"] is True
    assert data["count"] >= 2

# =========================================================================
# END-TO-END AGENT WORKFLOW WITH REVISION 2 CAPABILITIES
# =========================================================================
def test_agent_end_to_end_revision2():
    """Tests full HRAgent execution routing to Revision 2 tools and audit logging"""
    agent = HRAgent()

    # Query salary via agent
    res_sal = agent.process_query(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        role="EMPLOYEE",
        message="What is my salary and net pay?",
    )
    assert res_sal["status"] == "COMPLETED"
    assert "Salary & Compensation Details" in res_sal["answer"]
    assert len(res_sal["citations"]) == 1
    assert res_sal["citations"][0]["section"] == "Compensation Records"

    # Query performance via agent
    res_perf = agent.process_query(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        role="EMPLOYEE",
        message="What is my performance rating and manager remarks?",
    )
    assert res_perf["status"] == "COMPLETED"
    assert "4.8" in res_perf["answer"]
    assert res_perf["citations"][0]["section"] == "Performance Management"

    # Unauthorized salary query returns RBAC_BLOCKED
    res_unauth = agent.process_query(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        role="EMPLOYEE",
        message="What is the salary for emp_alpha_02?",
    )
    assert res_unauth["status"] == "RBAC_BLOCKED"
    assert "Access Denied" in res_unauth["answer"]
