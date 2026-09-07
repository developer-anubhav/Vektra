import datetime
from typing import List, Dict, Any, Optional
from rag.ingestion import get_or_create_collection, normalize_category

def retrieve_company_documents(
    company_id: str,
    query: str,
    category: Optional[str] = None,
    top_k: int = 4,
    current_time: Optional[datetime.datetime] = None,
    client=None,
) -> List[Dict[str, Any]]:
    """
    Mandatory Tenant-Isolated Retriever:
    - Strictly requires company_id
    - Applies ChromaDB metadata filter: company_id == company_id
    - Optionally applies category filter (terms_and_conditions, company_policies, employee_handbooks, compliance_regulatory)
    - Excludes expired policy chunks (valid_until_ts < current_ts)
    - Returns structured chunks with citation metadata including category
    """
    if not company_id or not str(company_id).strip():
        raise ValueError(
            "CRITICAL SECURITY VIOLATION: company_id is mandatory for retrieval. "
            "Unfiltered queries are strictly prohibited."
        )

    if not query or not query.strip():
        return []

    collection = get_or_create_collection(client)
    
    # Calculate current timestamp for validity filtering
    now = current_time or datetime.datetime.now(datetime.timezone.utc)
    now_ts = int(now.timestamp())

    norm_category = normalize_category(category) if category else None

    # Mandatory ChromaDB metadata filter for multi-tenant isolation + optional category
    if norm_category:
        where_clause = {
            "$and": [
                {"company_id": {"$eq": str(company_id)}},
                {"category": {"$eq": str(norm_category)}},
            ]
        }
    else:
        where_clause = {
            "company_id": str(company_id)
        }

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(top_k * 3, 30),  # Fetch extra to filter expired/mismatched chunks
            where=where_clause,
        )
    except Exception:
        # Fallback to single tenant filter if $and is unsupported on non-existent fields, then filter in code
        try:
            results = collection.query(
                query_texts=[query],
                n_results=min(top_k * 3, 30),
                where={"company_id": str(company_id)},
            )
        except Exception:
            return []

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0] if results.get("distances") else [0.0] * len(documents)

    valid_chunks = []
    for doc, meta, dist in zip(documents, metadatas, distances):
        # Enforce tenant match in metadata safeguard
        if str(meta.get("company_id")) != str(company_id):
            continue

        # Enforce category match if requested
        if norm_category:
            meta_cat = meta.get("category")
            if meta_cat and normalize_category(meta_cat) != norm_category:
                continue

        # Enforce temporal validity: exclude expired policy chunks (valid_until <= now)
        valid_until_ts = meta.get("valid_until_ts")
        if valid_until_ts is not None and valid_until_ts <= now_ts:
            # Chunk is expired
            continue

        valid_chunks.append({
            "content": doc,
            "source_doc": meta.get("source_doc", "Company Document"),
            "category": meta.get("category", norm_category or "company_policies"),
            "page_number": meta.get("page_number", 1),
            "section": meta.get("section", "General"),
            "valid_until": meta.get("valid_until"),
            "company_id": meta.get("company_id"),
            "distance": float(dist),
        })

        if len(valid_chunks) >= top_k:
            break

    return valid_chunks

