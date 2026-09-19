import os
import pytest
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.tools import (
    fetch_employee_profile,
    fetch_salary_details,
    fetch_attendance_records,
    fetch_leave_balance,
    fetch_leave_history,
    fetch_performance_reviews,
)
from guardrails.domain_filter import DomainFilter, domain_filter, validate_query_domain
from nlp.key_phrase_router import (
    extract_key_phrases,
    route_key_phrase_query,
)

# --- 1. Test Phase 5 Tools Scoping & RBAC ---

def test_phase5_fetch_employee_profile_rbac():
    # Employee querying self -> SUCCESS
    res_self = fetch_employee_profile(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["name"] == "Alice Smith"

    # Employee querying another user -> FORBIDDEN
    res_other = fetch_employee_profile(
        company_id="tenant_alpha",
        user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_other["status"] == "FORBIDDEN"
    assert res_other["blocked_at"] == "tool_level_rbac"

def test_phase5_fetch_salary_details_rbac_and_audit():
    # Employee querying self -> SUCCESS
    res_self = fetch_salary_details(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_self["status"] == "SUCCESS"
    assert res_self["net_monthly"] == 8500.0

    # Employee querying another user -> FORBIDDEN
    res_other = fetch_salary_details(
        company_id="tenant_alpha",
        user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_other["status"] == "FORBIDDEN"

    # HR querying employee -> GRANTED
    res_hr = fetch_salary_details(
        company_id="tenant_alpha",
        user_id="emp_alpha_02",
        requester_role="HR",
        requester_user_id="hr_01",
    )
    assert res_hr["status"] == "SUCCESS"

def test_phase5_fetch_attendance_records():
    res = fetch_attendance_records(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
        date_range="2026-08",
    )
    assert res["status"] == "SUCCESS"
    assert res["attendance_percentage"] == 98.2
    assert "summary" in res

def test_phase5_fetch_leave_balance_and_history():
    res_bal = fetch_leave_balance(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_bal["status"] == "SUCCESS"
    assert "casual" in res_bal["leave_balance"]

    res_hist = fetch_leave_history(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
        date_range="2026",
    )
    assert res_hist["status"] == "SUCCESS"
    assert len(res_hist["leave_history"]) > 0

def test_phase5_fetch_performance_reviews():
    res_perf = fetch_performance_reviews(
        company_id="tenant_alpha",
        user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert res_perf["status"] == "SUCCESS"
    assert res_perf["rating"] == 4.8
    assert "Code Quality" in res_perf["kpis"]

# --- 2. Test Phase 5 Domain Filter Guardrail ---

def test_phase5_domain_filter_generic_queries_rejection():
    # Arithmetic rejection
    allowed, msg = validate_query_domain("Calculate 2*2 for me")
    assert allowed is False
    assert "outside official company HR records" in msg

    # Trivia rejection
    allowed, msg = validate_query_domain("What is the capital of Australia?")
    assert allowed is False
    assert "outside official company HR records" in msg

    # Coding rejection
    allowed, msg = validate_query_domain("Write a Python script to sort an array")
    assert allowed is False

    # HR valid query acceptance
    allowed, msg = validate_query_domain("What is my monthly salary?")
    assert allowed is True

    allowed, msg = validate_query_domain("What is the official sick leave policy?")
    assert allowed is True

def test_phase5_domain_filter_configured_allow_list(monkeypatch):
    monkeypatch.setenv("ALLOWED_QUERY_DOMAINS", "attendance,leave")
    custom_filter = DomainFilter()

    # Attendance allowed
    allowed, _, _ = custom_filter.validate_query("Show my attendance percentage")
    assert allowed is True

    # Salary not in custom allow list
    allowed, _, msg = custom_filter.validate_query("What is my base salary?")
    assert allowed is False
    assert "restricted by your organization" in msg

# --- 3. Test Phase 5 NLP Key-Phrase Router ---

def test_phase5_key_phrase_entity_extraction():
    entities = extract_key_phrases(
        "What is my salary for August 2026?",
        requester_user_id="emp_alpha_01"
    )
    assert entities.data_category == "salary"
    assert entities.is_self_query is True
    assert entities.target_user_id == "emp_alpha_01"
    assert entities.date_range == "August 2026"

def test_phase5_key_phrase_deterministic_routing():
    # Structured field -> DIRECT_TOOL
    decision_sal = route_key_phrase_query("What is my salary?")
    assert decision_sal.route_type == "STRUCTURED_TOOL"
    assert decision_sal.tool_name == "fetch_salary_details"

    decision_att = route_key_phrase_query("Show my attendance records")
    assert decision_att.route_type == "STRUCTURED_TOOL"
    assert decision_att.tool_name == "fetch_attendance_records"

    # Policy language -> CHROMA_RAG
    decision_pol = route_key_phrase_query("What is the official policy on annual leave carry-over?")
    assert decision_pol.route_type == "CHROMA_RAG"
    assert decision_pol.tool_name == "query_company_policies"

    # Mixed query -> HYBRID_COMPOSED
    decision_mixed = route_key_phrase_query("What is my leave balance and what does the policy state about bereavement?")
    assert decision_mixed.route_type == "HYBRID_COMPOSED"
    assert decision_mixed.tool_name == "fetch_leave_balance"
    assert decision_mixed.secondary_tool == "query_company_policies"
