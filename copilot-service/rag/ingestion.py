import os
import io
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import pypdf
import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings

CANONICAL_CATEGORIES = [
    "terms_and_conditions",
    "company_policies",
    "employee_handbooks",
    "compliance_regulatory",
]

CATEGORY_DISPLAY_LABELS = {
    "terms_and_conditions": "Terms & Conditions",
    "company_policies": "Company Policy",
    "employee_handbooks": "Employee Handbook",
    "compliance_regulatory": "Compliance & Regulatory",
    "TERMS_AND_CONDITIONS": "Terms & Conditions",
    "POLICY": "Company Policy",
    "HANDBOOK": "Employee Handbook",
    "COMPLIANCE": "Compliance & Regulatory",
    "OTHER": "Company Document",
}

def get_category_display_label(cat: Optional[str]) -> str:
    if not cat:
        return "Company Document"
    clean = str(cat).strip()
    return (
        CATEGORY_DISPLAY_LABELS.get(clean)
        or CATEGORY_DISPLAY_LABELS.get(clean.lower())
        or clean.replace("_", " ").title()
    )

def normalize_category(cat: Optional[str]) -> str:
    if not cat:
        return "company_policies"
    clean = str(cat).strip().lower()
    mapping = {
        "policy": "company_policies",
        "policies": "company_policies",
        "company_policies": "company_policies",
        "handbook": "employee_handbooks",
        "handbooks": "employee_handbooks",
        "employee_handbooks": "employee_handbooks",
        "compliance": "compliance_regulatory",
        "regulatory": "compliance_regulatory",
        "compliance_regulatory": "compliance_regulatory",
        "terms": "terms_and_conditions",
        "terms and conditions": "terms_and_conditions",
        "terms & conditions": "terms_and_conditions",
        "terms_and_conditions": "terms_and_conditions",
        "other": "company_policies",
    }
    return mapping.get(clean, clean)

def get_chroma_client():
    """
    Returns a persistent ChromaDB client using configured directory.
    """
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    return chromadb.PersistentClient(
        path=settings.CHROMA_PERSIST_DIR,
        settings=ChromaSettings(anonymized_telemetry=False)
    )

def get_or_create_collection(client=None):
    """
    Retrieves or creates the policy vector collection.
    """
    if client is None:
        client = get_chroma_client()
    return client.get_or_create_collection(name=settings.COLLECTION_NAME)

def chunk_text(
    text: str,
    chunk_size_chars: int = 1500,
    overlap_chars: int = 200
) -> List[str]:
    """
    Chunks raw text into ~500-token (~1500 char) segments with sliding overlap.
    """
    if not text or not text.strip():
        return []
    
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if current_len + para_len > chunk_size_chars and current_chunk:
            combined = "\n\n".join(current_chunk)
            chunks.append(combined)
            # Keep tail for overlap if long enough
            if len(combined) > overlap_chars:
                current_chunk = [combined[-overlap_chars:], para]
                current_len = overlap_chars + para_len
            else:
                current_chunk = [para]
                current_len = para_len
        else:
            current_chunk.append(para)
            current_len += para_len

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

def parse_iso_datetime(dt_str: Optional[str], default_future: bool = True) -> Tuple[str, int]:
    """
    Parses ISO date string into (iso_str, timestamp_int).
    """
    if not dt_str:
        if default_future:
            # 100 years in future
            dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=36500)
        else:
            dt = datetime.datetime.now(datetime.timezone.utc)
    else:
        try:
            # handle formats like 2026-08-31 or 2026-08-31T00:00:00Z
            clean = dt_str.replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
        except Exception:
            dt = datetime.datetime.now(datetime.timezone.utc) + (
                datetime.timedelta(days=36500) if default_future else datetime.timedelta()
            )

    return dt.isoformat(), int(dt.timestamp())

def ingest_document(
    company_id: str,
    file_path: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    source_doc_name: Optional[str] = None,
    category: Optional[str] = "company_policies",
    uploadedAt: Optional[str] = None,
    valid_from: Optional[str] = None,
    valid_until: Optional[str] = None,
    section_name: Optional[str] = None,
    document_id: Optional[str] = None,
    client=None,
) -> Dict[str, Any]:
    """
    Phase 6: Ingests a PDF or text document into ChromaDB with multi-tenant metadata isolation.
    Attaches metadata: company_id, category, source_doc, page_number, valid_from = uploadedAt.
    """
    if not company_id:
        raise ValueError("company_id is mandatory for document ingestion.")

    if not file_path and file_bytes is None:
        raise ValueError("Either file_path or file_bytes must be provided for ingestion.")

    doc_name = source_doc_name or (Path(file_path).name if file_path else "document.pdf")
    norm_category = normalize_category(category)
    effective_valid_from = uploadedAt or valid_from
    valid_from_iso, _ = parse_iso_datetime(effective_valid_from, default_future=False)
    valid_until_iso, valid_until_ts = parse_iso_datetime(valid_until, default_future=True)

    collection = get_or_create_collection(client)
    
    chunks_to_insert = []
    metadatas_to_insert = []
    ids_to_insert = []

    is_pdf = doc_name.lower().endswith(".pdf") or (file_path and Path(file_path).suffix.lower() == ".pdf")

    if is_pdf:
        try:
            if file_bytes is not None:
                pdf_stream = io.BytesIO(file_bytes)
                reader = pypdf.PdfReader(pdf_stream)
            else:
                path_obj = Path(file_path)
                if not path_obj.exists():
                    raise FileNotFoundError(f"Source file not found: {file_path}")
                reader = pypdf.PdfReader(file_path)

            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if not page_text.strip():
                    continue
                
                page_num = page_idx + 1
                page_chunks = chunk_text(page_text)
                for chunk_idx, chunk in enumerate(page_chunks):
                    chunk_id = f"{company_id}_{doc_name}_p{page_num}_c{chunk_idx}_{uuid.uuid4().hex[:6]}"
                    
                    # Detect heading if present in first line
                    first_line = chunk.strip().split("\n")[0][:80]
                    sec = section_name or (first_line if first_line.isupper() or first_line.startswith("#") else f"Page {page_num}")

                    chunks_to_insert.append(chunk)
                    ids_to_insert.append(chunk_id)
                    metadatas_to_insert.append({
                        "company_id": str(company_id),
                        "category": str(norm_category),
                        "source_doc": str(doc_name),
                        "document_id": str(document_id or ""),
                        "page_number": int(page_num),
                        "section": str(sec),
                        "valid_from": valid_from_iso,
                        "valid_until": valid_until_iso,
                        "valid_until_ts": int(valid_until_ts),
                    })
        except Exception:
            # Fallback if binary is not a valid PDF (e.g. test string buffer with .pdf extension)
            is_pdf = False

    if not is_pdf:
        if file_bytes is not None:
            text = file_bytes.decode("utf-8", errors="ignore")
        else:
            path_obj = Path(file_path)
            if not path_obj.exists():
                raise FileNotFoundError(f"Source file not found: {file_path}")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        text_chunks = chunk_text(text)
        for chunk_idx, chunk in enumerate(text_chunks):
            chunk_id = f"{company_id}_{doc_name}_c{chunk_idx}_{uuid.uuid4().hex[:6]}"
            first_line = chunk.strip().split("\n")[0][:80]
            sec = section_name or (first_line if first_line.isupper() or first_line.startswith("#") else "General")

            chunks_to_insert.append(chunk)
            ids_to_insert.append(chunk_id)
            metadatas_to_insert.append({
                "company_id": str(company_id),
                "category": str(norm_category),
                "source_doc": str(doc_name),
                "document_id": str(document_id or ""),
                "page_number": 1,
                "section": str(sec),
                "valid_from": valid_from_iso,
                "valid_until": valid_until_iso,
                "valid_until_ts": int(valid_until_ts),
            })

    if chunks_to_insert:
        collection.add(
            ids=ids_to_insert,
            documents=chunks_to_insert,
            metadatas=metadatas_to_insert,
        )

    return {
        "success": True,
        "company_id": company_id,
        "category": norm_category,
        "source_doc": doc_name,
        "document_id": document_id,
        "chunks_ingested": len(chunks_to_insert),
        "valid_from": valid_from_iso,
        "valid_until": valid_until_iso,
    }

def ingest_raw_text(
    company_id: str,
    text: str,
    source_doc_name: str,
    category: Optional[str] = "company_policies",
    uploadedAt: Optional[str] = None,
    valid_from: Optional[str] = None,
    valid_until: Optional[str] = None,
    section_name: Optional[str] = None,
    document_id: Optional[str] = None,
    client=None,
) -> Dict[str, Any]:
    """
    Directly ingest raw text chunks for a specific company tenant with category metadata.
    """
    if not company_id:
        raise ValueError("company_id is mandatory for text ingestion.")

    norm_category = normalize_category(category)
    effective_valid_from = uploadedAt or valid_from
    valid_from_iso, _ = parse_iso_datetime(effective_valid_from, default_future=False)
    valid_until_iso, valid_until_ts = parse_iso_datetime(valid_until, default_future=True)

    collection = get_or_create_collection(client)
    chunks = chunk_text(text)
    
    chunks_to_insert = []
    metadatas_to_insert = []
    ids_to_insert = []

    for idx, chunk in enumerate(chunks):
        chunk_id = f"{company_id}_{source_doc_name}_raw_{idx}_{uuid.uuid4().hex[:6]}"
        chunks_to_insert.append(chunk)
        ids_to_insert.append(chunk_id)
        metadatas_to_insert.append({
            "company_id": str(company_id),
            "category": str(norm_category),
            "source_doc": str(source_doc_name),
            "document_id": str(document_id or ""),
            "page_number": 1,
            "section": str(section_name or "Policy Section"),
            "valid_from": valid_from_iso,
            "valid_until": valid_until_iso,
            "valid_until_ts": int(valid_until_ts),
        })

    if chunks_to_insert:
        collection.add(
            ids=ids_to_insert,
            documents=chunks_to_insert,
            metadatas=metadatas_to_insert,
        )

    return {
        "success": True,
        "company_id": company_id,
        "category": norm_category,
        "source_doc": source_doc_name,
        "document_id": document_id,
        "chunks_ingested": len(chunks_to_insert),
        "valid_from": valid_from_iso,
        "valid_until": valid_until_iso,
    }

def expire_document_chunks(
    company_id: str,
    source_doc: Optional[str] = None,
    document_id: Optional[str] = None,
    client=None,
) -> Dict[str, Any]:
    """
    Phase 6 Requirement 6:
    Immediately sets valid_until = now on existing chunks of a deleted/replaced document.
    Soft-expire excludes them from future retrieval without losing audit history.
    """
    if not company_id:
        raise ValueError("company_id is mandatory to expire document chunks.")

    collection = get_or_create_collection(client)
    now = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now.isoformat()
    now_ts = int(now.timestamp())

    where_clause = {"company_id": str(company_id)}
    try:
        results = collection.get(where=where_clause, include=["metadatas"])
    except Exception as e:
        return {
            "success": True,
            "company_id": company_id,
            "expired_chunks": 0,
            "message": f"No chunks found or error reading collection: {e}",
        }

    ids = results.get("ids", [])
    metadatas = results.get("metadatas", [])

    matching_ids = []
    updated_metadatas = []

    for chunk_id, meta in zip(ids, metadatas):
        matches = False
        if document_id and str(meta.get("document_id", "")).strip() == str(document_id).strip():
            matches = True
        elif source_doc and str(meta.get("source_doc", "")).strip() == str(source_doc).strip():
            matches = True

        if matches:
            meta_copy = dict(meta)
            meta_copy["valid_until"] = now_iso
            meta_copy["valid_until_ts"] = now_ts
            matching_ids.append(chunk_id)
            updated_metadatas.append(meta_copy)

    if matching_ids:
        collection.update(ids=matching_ids, metadatas=updated_metadatas)

    return {
        "success": True,
        "company_id": company_id,
        "source_doc": source_doc,
        "document_id": document_id,
        "expired_chunks": len(matching_ids),
        "valid_until": now_iso,
    }

