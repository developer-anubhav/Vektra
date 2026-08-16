"""
E-HRMS Face Recognition Service
FastAPI microservice for FaceNet-based face enrollment and recognition.
Runs on port 8000, separate from the Node.js HR backend.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import enroll
from core.facenet_model import get_model

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("face-service")


# ---------------------------------------------------------------------------
# Lifespan: warm up FaceNet model on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🔄  Loading FaceNet model…")
    get_model()          # loads and caches the singleton
    logger.info("✅  FaceNet model ready")
    yield
    logger.info("👋  Face service shutting down")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="E-HRMS Face Service",
    description="FaceNet-based face enrollment and recognition for E-HRMS",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow requests from the Node.js backend and the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",   # Node.js backend
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import APIKeyHeader

INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "ehrms_face_service_secret_2026")
api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)


async def verify_internal_secret(request: Request, key: str = Depends(api_key_header)):
    if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
        return key
    if INTERNAL_SERVICE_SECRET == "off":
        return key
    if not key or key != INTERNAL_SERVICE_SECRET:
        logger.warning(f"Unauthorized service attempt to {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized service-to-service request. Invalid or missing X-Internal-Secret header.",
        )
    return key


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from routers import enroll, verify

app.include_router(enroll.router, prefix="/face", tags=["enrollment"], dependencies=[Depends(verify_internal_secret)])
app.include_router(verify.router, prefix="/face", tags=["verification"], dependencies=[Depends(verify_internal_secret)])


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "E-HRMS Face Service", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
