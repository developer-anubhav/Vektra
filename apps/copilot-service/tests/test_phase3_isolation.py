import pytest
import json
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app
from config import settings
from agent.tools import fetch_employee_stats, fetch_payroll_run_details
from agent.escalation import check_sensitive_escalation, create_hr_escalation_ticket
from agent.hr_agent import HRAgent
from rag.ingestion import ingest_raw_text

client = TestClient(app)
VALID_SECRET = settings.INTERNAL_SERVICE_SECRET

def test_dod_1_employee_blocked_at_tool_layer():
    """
    DoD 1: An EMPLOYEE-role query attempting to fetch another employee's stats
    is blocked at the tool layer, not just the route layer.
    """
    # Employee emp_alpha_01 attempts to query emp_alpha_02
    result = fetch_employee_stats(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    assert result.get("status") == "FORBIDDEN"
    assert result.get("blocked_at") == "tool_level_rbac"
    assert "Access Denied" in result.get("error", "")

    # HR role CAN access other employee records in same company
    hr_result = fetch_employee_stats(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_02",
        requester_role="HR",
        requester_user_id="hr_manager_01",
    )
    assert hr_result.get("status") == "SUCCESS"
    assert hr_result.get("name") == "Bob Jones"

def test_dod_2_cross_tenant_isolation_identical_ids():
    """
    DoD 2: Seed two companies with overlapping employee IDs (emp_alpha_01)
    and confirm no cross-tenant data ever appears across responses or tools.
    """
    # Query emp_alpha_01 for Tenant Alpha
    res_alpha = fetch_employee_stats(
        company_id="tenant_alpha",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )
    # Query emp_alpha_01 for Tenant Beta
    res_beta = fetch_employee_stats(
        company_id="tenant_beta",
        target_user_id="emp_alpha_01",
        requester_role="EMPLOYEE",
        requester_user_id="emp_alpha_01",
    )

    assert res_alpha.get("name") == "Alice Smith"
    assert res_alpha.get("department") == "Engineering"
    assert res_alpha.get("company_id") == "tenant_alpha"

    assert res_beta.get("name") == "Alice Smith (Beta Corp)"
    assert res_beta.get("department") == "Finance"
    assert res_beta.get("company_id") == "tenant_beta"

    # Ensure zero data leakage between Alpha and Beta
    assert res_alpha.get("department") != res_beta.get("department")

def test_dod_3_grounded_answer_includes_citations():
    """
    DoD 3: Every successful agent answer includes at least one citation
    with document name, page number, and section.
    """
    tenant_id = "tenant_citation_test_404"
    ingest_raw_text(
        company_id=tenant_id,
        text="The Vektra emergency evacuation assembly point is the North Garden Lawn outside Tower B.",
        source_doc_name="Safety_Procedures_2026.pdf",
        section_name="Emergency Evacuation",
    )

    agent = HRAgent()
    result = agent.process_query(
        company_id=tenant_id,
        user_id="user_test_404",
        role="EMPLOYEE",
        message="Where is the emergency evacuation assembly point?",
    )

    assert result.get("status") == "COMPLETED"
    assert result.get("grounded") is True
    citations = result.get("citations", [])
    assert len(citations) >= 1
    top_citation = citations[0]
    assert top_citation.get("source_doc") == "Safety_Procedures_2026.pdf"
    assert top_citation.get("page_number") == 1
    assert "Emergency Evacuation" in top_citation.get("section")

def test_dod_4_sensitive_query_auto_drafts_escalation():
    """
    DoD 4: A sensitive or unresolvable query produces a draft HR escalation record
    instead of an ungrounded or fabricated answer.
    """
    sensitive_queries = [
        "I need to report sexual harassment from my manager on Slack",
        "My salary was incorrectly deducted by $1500 this month, this is a payroll dispute",
        "I was threatened with illegal termination because of my disability",
    ]

    agent = HRAgent()
    for sq in sensitive_queries:
        res = agent.process_query(
            company_id="tenant_alpha",
            user_id="emp_alpha_01",
            role="EMPLOYEE",
            message=sq,
        )

        assert res.get("status") == "ESCALATED_TO_HR"
        ticket = res.get("escalation")
        assert ticket is not None
        assert ticket.get("status") == "DRAFT_ESCALATION"
        assert ticket.get("requires_human_review") is True
        assert ticket.get("ticket_id", "").startswith("ESC-")
        assert "confidential draft ticket" in res.get("answer", "")

def test_dod_5_sse_streaming_endpoint():
    """
    DoD 5: Test SSE streaming endpoint returns incremental token events and final done payload.
    """
    res = client.post(
        "/agent/chat/stream",
        headers={"X-Internal-Secret": VALID_SECRET},
        json={
            "company_id": "tenant_alpha",
            "user_id": "emp_alpha_01",
            "role": "EMPLOYEE",
            "query": "What is my leave balance?",
        },
    )

    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")

    # Parse streamed lines
    events = [line for line in res.text.split("\n\n") if line.startswith("data: ")]
    assert len(events) > 0

    # Last event should contain done: true and citations
    last_event_raw = events[-1].replace("data: ", "")
    last_event_json = json.loads(last_event_raw)
    assert last_event_json.get("done") is True
    assert "citations" in last_event_json
