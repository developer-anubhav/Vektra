import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PORT: int = int(os.getenv("PORT", "8001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    INTERNAL_SERVICE_SECRET: str = os.getenv("INTERNAL_SERVICE_SECRET", "vektra_internal_copilot_secret_2026")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Vector DB / Chroma Settings
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parent / "data" / "chroma"))
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "vektra_policies")

    # Domain Guardrail Settings (Revision 2 Constraint 10)
    ALLOWED_QUERY_DOMAINS: str = os.getenv(
        "ALLOWED_QUERY_DOMAINS",
        "hr_data,payroll,attendance,policy,profile,performance,leave,salary,benefits",
    )

    # Audit Logging Settings (Revision 2 Constraint 12)
    SALARY_AUDIT_LOG_PATH: str = os.getenv(
        "SALARY_AUDIT_LOG_PATH",
        str(Path(__file__).resolve().parent / "data" / "salary_audit.log"),
    )

    def get_allowed_domains(self) -> list[str]:
        """Returns parsed list of normalized allowed domains."""
        raw = os.getenv("ALLOWED_QUERY_DOMAINS", self.ALLOWED_QUERY_DOMAINS)
        return [d.strip().lower() for d in raw.split(",") if d.strip()]

settings = Settings()

