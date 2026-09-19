import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app
from config import settings
from security.scrubber import scrub_text, scrub_payload
from security.guardrails import check_domain_guardrail
from rag.ingestion import ingest_raw_text
from rag.retriever import retrieve_company_documents
from llm_provider import NOT_AVAILABLE_FALLBACK

client = TestClient(app)
VALID_SECRET = settings.INTERNAL_SERVICE_SECRET

def test_dod_1_reject_missing_secret():
    """DoD 1a: Rejects request missing X-Internal-Secret with 401"""
    res = client.get("/health")
    assert res.status_code == 401
    assert "Missing X-Internal-Secret" in res.json().get("detail", "")

def test_dod_1_reject_invalid_secret():
    """DoD 1b: Rejects request with wrong X-Internal-Secret with 403"""
    res = client.get("/health", headers={"X-Internal-Secret": "wrong_secret_123"})
    assert res.status_code == 403
    assert "Invalid X-Internal-Secret" in res.json().get("detail", "")

def test_dod_1_accept_valid_secret():
    """DoD 1c: Accepts request with valid X-Internal-Secret (200)"""
    res = client.get("/health", headers={"X-Internal-Secret": VALID_SECRET})
    assert res.status_code == 200
    assert res.json().get("status") == "healthy"

def test_dod_2_and_6_multi_tenant_isolation_and_sample_ingest():
    """
    DoD 2 & 6: Ingest docs for Tenant A and Tenant B.
    Ensure Tenant A never sees Tenant B docs and vice versa.
    """
    tenant_a = "tenant_alpha_test_101"
    tenant_b = "tenant_beta_test_202"

    policy_a = "Company Alpha standard maternity leave is 16 weeks with 100% pay."
    policy_b = "Company Beta standard maternity leave is 26 weeks with 80% pay."

    # Ingest for Tenant A
    res_a = ingest_raw_text(
        company_id=tenant_a,
        text=policy_a,
        source_doc_name="Alpha_Handbook.txt",
        section_name="Maternity",
    )
    assert res_a["chunks_ingested"] >= 1

    # Ingest for Tenant B
    res_b = ingest_raw_text(
        company_id=tenant_b,
        text=policy_b,
        source_doc_name="Beta_Handbook.txt",
        section_name="Maternity",
    )
    assert res_b["chunks_ingested"] >= 1

    # Query scoped to Tenant A
    chunks_a = retrieve_company_documents(
        company_id=tenant_a,
        query="What is the maternity leave duration?",
        top_k=5,
    )
    assert len(chunks_a) > 0
    # Every chunk must belong to Tenant A
    for c in chunks_a:
        assert c["company_id"] == tenant_a
        assert "Alpha" in c["content"]
        assert "Beta" not in c["content"]

    # Query scoped to Tenant B
    chunks_b = retrieve_company_documents(
        company_id=tenant_b,
        query="What is the maternity leave duration?",
        top_k=5,
    )
    assert len(chunks_b) > 0
    for c in chunks_b:
        assert c["company_id"] == tenant_b
        assert "Beta" in c["content"]
        assert "Alpha" not in c["content"]

def test_dod_3_expired_chunks_excluded():
    """DoD 3: Chunks with valid_until in the past are excluded from retrieval"""
    tenant = "tenant_expiry_test_303"
    active_text = "Active remote work allows up to 2 days per week from home."
    expired_text = "Legacy 2018 policy allowed 0 days remote work. Completely discontinued."

    ingest_raw_text(
        company_id=tenant,
        text=active_text,
        source_doc_name="Current_WFH_2026.txt",
        valid_until="2035-01-01T00:00:00Z",
    )

    ingest_raw_text(
        company_id=tenant,
        text=expired_text,
        source_doc_name="Old_WFH_2018.txt",
        valid_until="2019-01-01T00:00:00Z",
    )

    chunks = retrieve_company_documents(
        company_id=tenant,
        query="How many days can I work from home?",
        top_k=5,
    )

    contents = [c["content"] for c in chunks]
    assert any("2 days per week" in c for c in contents)
    assert not any("Legacy 2018 policy" in c for c in contents)

def test_dod_4_out_of_domain_guardrail_rejection():
    """DoD 4: Out-of-domain prompt (e.g. write a poem, coding question) is rejected"""
    out_of_domain_queries = [
        "write me a poem about summer",
        "How do I write a Python function to sort a list?",
        "Who was Napoleon Bonaparte?",
        "tell me a funny joke",
        "solve this math: 42 * 98",
    ]

    for q in out_of_domain_queries:
        in_domain, msg = check_domain_guardrail(q)
        assert in_domain is False
        assert "outside official company HR records" in msg or "Vektra AI Co-Pilot" in msg

        # Test through FastAPI /query endpoint
        res = client.post(
            "/query",
            headers={"X-Internal-Secret": VALID_SECRET},
            json={"company_id": "tenant_test_101", "query": q},
        )
        assert res.status_code == 200
        assert res.json().get("status") == "GUARDRAIL_REJECTED"

def test_dod_5_missing_documents_fallback():
    """DoD 5: A query with no matching company documents returns not available in official records fallback"""
    res = client.post(
        "/query",
        headers={"X-Internal-Secret": VALID_SECRET},
        json={
            "company_id": "empty_tenant_999",
            "query": "What is the pet policy in the office building cafeteria?",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "NOT_AVAILABLE_IN_RECORDS"
    assert NOT_AVAILABLE_FALLBACK in data.get("answer", "")
    assert data.get("grounded") is False

def test_pii_and_biometric_scrubber():
    """DoD 5b: PII, bank account, routing, passwords, and biometric vectors are scrubbed"""
    raw_prompt = (
        "My routing number is 123456789 and bank account number is 987654321012. "
        "My password: SecretPass123 and biometric vector: [0.4532, -0.9123, 0.1122, 0.8877, -0.3344]."
    )

    scrubbed = scrub_text(raw_prompt)
    assert "123456789" not in scrubbed
    assert "987654321012" not in scrubbed
    assert "SecretPass123" not in scrubbed
    assert "0.4532" not in scrubbed
    assert "[REDACTED_BIOMETRIC_VECTOR]" in scrubbed
    assert "[REDACTED_ROUTING]" in scrubbed
    assert "[REDACTED_ACCOUNT]" in scrubbed
