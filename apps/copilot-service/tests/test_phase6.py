import pytest
import datetime
import uuid
from fastapi.testclient import TestClient
from main import app
from rag.ingestion import (
    ingest_raw_text,
    ingest_document,
    expire_document_chunks,
    normalize_category,
    get_category_display_label,
    CANONICAL_CATEGORIES,
)
from rag.retriever import retrieve_company_documents
from nlp.key_phrase_router import extract_key_phrases, route_key_phrase_query

SECRET_HEADER = {"X-Internal-Secret": "vektra_internal_copilot_secret_2026"}

@pytest.fixture
def client():
    return TestClient(app)

def test_category_normalization_and_display_labels():
    """DoD 1: Category normalization & display formatting."""
    assert normalize_category("TERMS_AND_CONDITIONS") == "terms_and_conditions"
    assert normalize_category("POLICY") == "company_policies"
    assert normalize_category("HANDBOOK") == "employee_handbooks"
    assert normalize_category("COMPLIANCE") == "compliance_regulatory"
    assert normalize_category("OTHER") == "company_policies"
    assert normalize_category("terms and conditions") == "terms_and_conditions"
    assert normalize_category("compliance") == "compliance_regulatory"

    assert get_category_display_label("compliance_regulatory") == "Compliance & Regulatory"
    assert get_category_display_label("terms_and_conditions") == "Terms & Conditions"
    assert get_category_display_label("employee_handbooks") == "Employee Handbook"
    assert get_category_display_label("company_policies") == "Company Policy"

def test_ingestion_with_category_and_uploaded_at(client):
    """DoD 2: Ingest with category, uploadedAt, document_id metadata."""
    company_id = f"test_co_{uuid.uuid4().hex[:6]}"
    uploaded_time = "2026-08-15T10:00:00Z"
    doc_id = f"doc_{uuid.uuid4().hex[:6]}"

    res = ingest_raw_text(
        company_id=company_id,
        text="Compliance regulatory guideline section 4: All employee data must be preserved for 7 years.",
        source_doc_name="Data_Retention_2026.pdf",
        category="compliance_regulatory",
        uploadedAt=uploaded_time,
        document_id=doc_id,
    )

    assert res["success"] is True
    assert res["company_id"] == company_id
    assert res["category"] == "compliance_regulatory"
    assert res["document_id"] == doc_id
    assert res["chunks_ingested"] >= 1

def test_category_filtering_in_retriever():
    """DoD 3: Retrieval optionally filters by category in addition to mandatory company_id."""
    company_id = f"test_co_{uuid.uuid4().hex[:6]}"

    # Ingest a compliance document
    ingest_raw_text(
        company_id=company_id,
        text="GDPR Compliance: personal data retention schedule for EU employees.",
        source_doc_name="GDPR_Compliance.pdf",
        category="compliance_regulatory",
    )

    # Ingest a general policy document
    ingest_raw_text(
        company_id=company_id,
        text="Travel and Expense Policy: Meal reimbursement cap is $75 per day.",
        source_doc_name="Travel_Policy.pdf",
        category="company_policies",
    )

    # 1. Query with compliance_regulatory category filter
    compliance_chunks = retrieve_company_documents(
        company_id=company_id,
        query="retention reimbursement rules",
        category="compliance_regulatory",
        top_k=5,
    )
    assert len(compliance_chunks) > 0
    for chunk in compliance_chunks:
        assert chunk["category"] == "compliance_regulatory"
        assert "GDPR" in chunk["content"]

    # 2. Query with company_policies category filter
    policy_chunks = retrieve_company_documents(
        company_id=company_id,
        query="retention reimbursement rules",
        category="company_policies",
        top_k=5,
    )
    assert len(policy_chunks) > 0
    for chunk in policy_chunks:
        assert chunk["category"] == "company_policies"
        assert "Travel and Expense" in chunk["content"]

def test_immediate_soft_expiry_on_delete():
    """DoD 4: Soft-expire sets valid_until = now and excludes chunks from subsequent retrieval."""
    company_id = f"test_co_{uuid.uuid4().hex[:6]}"
    doc_name = "Obsolete_Handbook_2025.pdf"
    doc_id = f"doc_obs_{uuid.uuid4().hex[:6]}"

    ingest_raw_text(
        company_id=company_id,
        text="Obsolete core working hours: All staff must be in office by 8:00 AM sharp.",
        source_doc_name=doc_name,
        category="employee_handbooks",
        document_id=doc_id,
    )

    # Before expiry: retrieval returns the chunk
    before_chunks = retrieve_company_documents(
        company_id=company_id,
        query="working hours office time",
        top_k=4,
    )
    assert len(before_chunks) > 0

    # Soft-expire document chunks
    expire_res = expire_document_chunks(
        company_id=company_id,
        document_id=doc_id,
        source_doc=doc_name,
    )
    assert expire_res["success"] is True
    assert expire_res["expired_chunks"] > 0

    # After expiry: retrieval excludes expired chunks
    after_chunks = retrieve_company_documents(
        company_id=company_id,
        query="working hours office time",
        top_k=4,
    )
    assert len(after_chunks) == 0

def test_nlp_router_detects_named_categories():
    """DoD 5: NLP key-phrase router detects named categories and applies matching category filter."""
    # 1. Handbook
    q_hb = "What does the employee handbook say about probationary period?"
    ent_hb = extract_key_phrases(q_hb)
    assert ent_hb.target_doc_category == "employee_handbooks"
    dec_hb = route_key_phrase_query(q_hb)
    assert dec_hb.category_filter == "employee_handbooks"

    # 2. Compliance
    q_comp = "What are our compliance and regulatory standards for customer data?"
    ent_comp = extract_key_phrases(q_comp)
    assert ent_comp.target_doc_category == "compliance_regulatory"
    dec_comp = route_key_phrase_query(q_comp)
    assert dec_comp.category_filter == "compliance_regulatory"

    # 3. Terms and conditions
    q_terms = "What are our terms and conditions regarding remote contractors?"
    ent_terms = extract_key_phrases(q_terms)
    assert ent_terms.target_doc_category == "terms_and_conditions"
    dec_terms = route_key_phrase_query(q_terms)
    assert dec_terms.category_filter == "terms_and_conditions"

    # 4. Policy
    q_pol = "What is our company policy on parental leave?"
    ent_pol = extract_key_phrases(q_pol)
    assert ent_pol.target_doc_category == "company_policies"
    dec_pol = route_key_phrase_query(q_pol)
    assert dec_pol.category_filter == "company_policies"

def test_citation_formatting_includes_category_label(client):
    """DoD 6: Citation formatting includes category label alongside doc name and page."""
    company_id = f"test_co_{uuid.uuid4().hex[:6]}"
    doc_name = "Data_Retention_2026.pdf"

    ingest_raw_text(
        company_id=company_id,
        text="Section 3: Retention of financial audit files must be maintained for 10 years minimum.",
        source_doc_name=doc_name,
        category="compliance_regulatory",
    )

    resp = client.post(
        "/query",
        headers=SECRET_HEADER,
        json={
            "company_id": company_id,
            "query": "How long must financial audit files be retained?",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True

    # Citations list check
    citations = data.get("citations", [])
    assert len(citations) > 0
    top_cite = citations[0]
    assert top_cite["category_label"] == "Compliance & Regulatory"
    assert "Compliance & Regulatory" in top_cite["citation_text"]
    assert doc_name in top_cite["citation_text"]
    assert "Page 1" in top_cite["citation_text"]

def test_api_endpoints_ingest_and_expire(client):
    """DoD 7: /rag/ingest and /rag/expire-document HTTP endpoints."""
    company_id = f"test_co_{uuid.uuid4().hex[:6]}"
    doc_id = f"doc_{uuid.uuid4().hex[:6]}"

    # Ingest via HTTP
    ingest_resp = client.post(
        "/rag/ingest",
        headers=SECRET_HEADER,
        json={
            "company_id": company_id,
            "category": "terms_and_conditions",
            "file": "Terms & Conditions 2026: Intellectual property belongs exclusively to Vektra.",
            "source_doc": "Terms_2026.txt",
            "document_id": doc_id,
            "uploadedAt": "2026-09-01T12:00:00Z",
        },
    )
    assert ingest_resp.status_code == 200
    assert ingest_resp.json()["success"] is True

    # Soft-expire via HTTP
    expire_resp = client.post(
        "/rag/expire-document",
        headers=SECRET_HEADER,
        json={
            "company_id": company_id,
            "document_id": doc_id,
            "source_doc": "Terms_2026.txt",
        },
    )
    assert expire_resp.status_code == 200
    assert expire_resp.json()["success"] is True
    assert expire_resp.json()["data"]["expired_chunks"] > 0
