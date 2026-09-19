import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import httpx
from config import settings
from rag.ingestion import get_category_display_label

logger = logging.getLogger("copilot.llm")

SYSTEM_PROMPT = """You are the Vektra AI Co-Pilot, an enterprise HR intelligence assistant for Vektra E-HRMS.

DATA SCOPE & OPERATING DIRECTIVES:
1. Data Scope: You have access to official company policy documentation and verified employee records covering:
   - Full Employee Profile (designation, contact, department, date of joining, status, work location)
   - Salary & Compensation (base salary, allowances, deductions, net monthly pay)
   - Attendance (records, shifts, attendance percentage, punctuality)
   - Leave (balances, leave history, casual/sick/annual leaves)
   - Performance (reviews, appraisals, ratings, KPIs, manager feedback)
   - Official Company Policies & Handbooks (code of conduct, safety, remote work, leave policies, terms & conditions, compliance)
2. Grounding Directive: Answer ONLY using the official Company Documentation and verified structured records provided below.
3. Fallback Directive: If the provided context does not contain sufficient facts to answer the question completely, you MUST state: "This information is not available in official records."
4. Guardrail Directive: Out-of-domain requests (general trivia, coding help, mathematical puzzles, creative writing) are strictly prohibited and outside your operational domain.
5. Citation Requirement: Always cite your sources with category, document name, and page number in the format: '[Category Label — Document Name, Page X]' (e.g. '[Compliance & Regulatory — Data_Retention_2026.pdf, Page 3]').
6. Zero Speculation: NEVER speculate, guess, hallucinate, or use external knowledge beyond the provided documents and tenant data. Maintain a professional, concise HR tone."""

NOT_AVAILABLE_FALLBACK = "This information is not available in official records."

def format_citation_chip(c: Dict[str, Any]) -> Dict[str, Any]:
    cat_label = get_category_display_label(c.get("category"))
    source_doc = c.get("source_doc") or c.get("document") or "Company Document"
    page = c.get("page_number", c.get("page", 1))
    sec = c.get("section", "General")
    citation_text = f"[{cat_label} — {source_doc}, Page {page}]"
    return {
        "document": source_doc,
        "source_doc": source_doc,
        "category": c.get("category"),
        "category_label": cat_label,
        "page": page,
        "page_number": page,
        "section": sec,
        "citation_text": citation_text,
    }

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        pass

    def build_prompt(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks):
            doc = chunk.get("source_doc", "Document")
            page = chunk.get("page_number", 1)
            sec = chunk.get("section", "General")
            cat_label = get_category_display_label(chunk.get("category"))
            text = chunk.get("content", "")
            context_parts.append(
                f"[Source {i+1}: {cat_label} — {doc}, Page {page}, Section: '{sec}']\n{text}"
            )

        context_str = "\n\n".join(context_parts) if context_parts else "No company documentation found."

        history_str = ""
        if conversation_history:
            lines = []
            for msg in conversation_history[-5:]:
                r = msg.get("role", "user")
                c = msg.get("content", "")
                lines.append(f"{r.capitalize()}: {c}")
            history_str = "\nConversation History:\n" + "\n".join(lines)

        prompt = f"""{SYSTEM_PROMPT}

=== PROVIDED COMPANY DOCUMENTATION ===
{context_str}
======================================
{history_str}

User Question: {query}

Answer:"""
        return prompt

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        )

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if not self.api_key or self.api_key.startswith("your_"):
            logger.info("Gemini API key not configured. Using deterministic grounded fallback.")
            return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "gemini",
            }

        prompt = self.build_prompt(query, retrieved_chunks, conversation_history)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self.api_url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in content_parts).strip()
                        citations = [format_citation_chip(c) for c in retrieved_chunks]
                        return {
                            "answer": text or NOT_AVAILABLE_FALLBACK,
                            "citations": citations,
                            "grounded": True,
                            "provider": "gemini",
                        }
                logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")

        return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL or "llama3"

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "ollama",
            }

        prompt = self.build_prompt(query, retrieved_chunks, conversation_history)
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data.get("response", "").strip()
                    citations = [format_citation_chip(c) for c in retrieved_chunks]
                    return {
                        "answer": text or NOT_AVAILABLE_FALLBACK,
                        "citations": citations,
                        "grounded": True,
                        "provider": "ollama",
                    }
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")

        return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

class FallbackProvider(BaseLLMProvider):
    """
    Deterministic grounded fallback provider when external LLM endpoints are unreachable/unconfigured.
    """
    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        return self.generate_grounded_fallback(query, retrieved_chunks)

    def generate_grounded_fallback(self, query: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "fallback",
            }

        citations = [format_citation_chip(c) for c in retrieved_chunks]

        top_chunk = retrieved_chunks[0]
        cat_label = get_category_display_label(top_chunk.get("category"))
        doc_name = top_chunk.get("source_doc", "Company Document")
        page_num = top_chunk.get("page_number", 1)
        sec_name = top_chunk.get("section", "General")

        summary = (
            f"Based on [{cat_label} — {doc_name}, Page {page_num}] "
            f"(Section: '{sec_name}'): {top_chunk.get('content')}"
        )

        return {
            "answer": summary,
            "citations": citations,
            "grounded": True,
            "provider": "grounded_synthesizer",
        }

def get_llm_provider() -> BaseLLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "ollama":
        return OllamaProvider()
    elif provider_name == "gemini":
        return GeminiProvider()
    return FallbackProvider()
