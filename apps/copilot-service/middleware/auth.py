from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from config import settings

class InternalSecretMiddleware(BaseHTTPMiddleware):
    """
    Middleware enforcing X-Internal-Secret header on all non-exempt incoming requests.
    """
    async def dispatch(self, request: Request, call_next):
        # Allow docs / OpenAPI schema inspection if in dev
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        secret = request.headers.get("X-Internal-Secret")
        if not secret:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Unauthorized: Missing X-Internal-Secret header."},
            )
        
        if secret != settings.INTERNAL_SERVICE_SECRET:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Forbidden: Invalid X-Internal-Secret header."},
            )
        
        return await call_next(request)

def verify_internal_secret(request: Request):
    """
    FastAPI dependency for endpoint-level internal secret verification.
    """
    secret = request.headers.get("X-Internal-Secret")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing X-Internal-Secret header.",
        )
    if secret != settings.INTERNAL_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid X-Internal-Secret header.",
        )
    return secret
