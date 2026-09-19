import sys
import os
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rag.ingestion import ingest_raw_text
from rag.retriever import retrieve_company_documents

SAMPLE_POLICY = """# VEKTRA ENTERPRISE LEAVE AND ATTENDANCE POLICY 2026

## 1. ANNUAL AND CASUAL LEAVE
All full-time employees are entitled to 20 days of paid annual leave per calendar year. Casual leave can be availed up to 10 days per year with prior notification of at least 48 hours to the reporting manager.

## 2. SICK AND MEDICAL LEAVE
Employees receive 12 days of paid medical leave annually. Medical certificates are mandatory for sick leaves extending beyond 2 consecutive business days. Unused sick leave can be accumulated up to a maximum of 30 days.

## 3. PARENTAL AND MATERNITY BENEFITS
Female employees are entitled to 26 weeks of paid maternity leave. Male employees are entitled to 2 weeks of paid paternity leave, which must be availed within 6 months of childbirth.

## 4. WORKING HOURS AND REMOTE WORK GUIDELINES
Standard business hours are 9:00 AM to 6:00 PM Monday through Friday. Hybrid employees may work remotely up to 2 days per week with departmental approval."""

EXPIRED_POLICY = """# LEGACY TRAVEL REIMBURSEMENT POLICY (EXPIRED)
Employees may claim $20 per day for travel without receipts. This policy is discontinued."""

def run_smoke_test():
    print("[START] Starting Vektra AI Co-Pilot Smoke Test...")
    tenant_a = "company_tenant_alpha_101"
    tenant_b = "company_tenant_beta_202"

    # 1. Ingest valid policy for Tenant A
    print(f"\n1. Ingesting active HR policy for Tenant A ({tenant_a})...")
    res_a = ingest_raw_text(
        company_id=tenant_a,
        text=SAMPLE_POLICY,
        source_doc_name="Vektra_Leave_Policy_2026.txt",
        valid_from="2026-01-01T00:00:00Z",
        valid_until="2030-12-31T23:59:59Z",
        section_name="Leave Guidelines",
    )
    print(f"   [OK] Ingested {res_a['chunks_ingested']} chunks for {tenant_a}")

    # 2. Ingest expired policy for Tenant A
    print(f"\n2. Ingesting expired policy (valid_until=2020-01-01) for Tenant A...")
    res_exp = ingest_raw_text(
        company_id=tenant_a,
        text=EXPIRED_POLICY,
        source_doc_name="Legacy_Travel_Policy_2019.txt",
        valid_from="2019-01-01T00:00:00Z",
        valid_until="2020-01-01T00:00:00Z",
        section_name="Expired Travel",
    )
    print(f"   [OK] Ingested {res_exp['chunks_ingested']} expired chunks for {tenant_a}")

    # 3. Test scoped retrieval for Tenant A
    query = "How many days of sick leave are employees entitled to?"
    print(f"\n3. Querying Tenant A: '{query}'")
    chunks = retrieve_company_documents(company_id=tenant_a, query=query, top_k=2)
    assert len(chunks) > 0, "Tenant A should retrieve at least 1 document chunk"
    print(f"   [OK] Retrieved {len(chunks)} chunks:")
    for c in chunks:
        print(f"      - [{c['source_doc']} | Page {c['page_number']} | {c['section']}]: {c['content'][:100]}...")

    # 4. Multi-tenant Isolation Test: Query Tenant B for same question
    print(f"\n4. Multi-Tenant Check: Querying Tenant B ({tenant_b}) for same question...")
    chunks_b = retrieve_company_documents(company_id=tenant_b, query=query, top_k=2)
    assert len(chunks_b) == 0, f"Tenant B should retrieve 0 chunks from Tenant A's pool! Leaked: {len(chunks_b)}"
    print(f"   [OK] Multi-tenant isolation verified: Tenant B retrieved 0 chunks from Tenant A.")

    # 5. Expired Chunk Exclusion Check
    print("\n5. Expiration Check: Querying for expired travel reimbursement...")
    exp_chunks = retrieve_company_documents(company_id=tenant_a, query="travel reimbursement without receipts", top_k=5)
    expired_found = any("LEGACY TRAVEL" in c["content"] for c in exp_chunks)
    assert not expired_found, "Expired chunks should be filtered out!"
    print("   [OK] Temporal filtering verified: Expired policy chunk correctly excluded.")

    print("\n[SUCCESS] ALL SMOKE TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    run_smoke_test()
