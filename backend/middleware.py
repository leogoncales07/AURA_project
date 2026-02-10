"""
FastAPI Security Middleware
============================
- Owner-only authentication via OWNER_SECRET header
- Per-client rate limiting
- Request logging with masked keys
"""

import time
import hashlib
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from colorama import Fore, init

init(autoreset=True)


class OwnerAuthMiddleware(BaseHTTPMiddleware):
    """
    Blocks ALL requests that don't carry the correct OWNER_SECRET.
    Only YOU can use this API.
    
    Send the header:  X-Owner-Secret: <your_secret>
    """

    # Paths that don't require auth (health checks, docs)
    PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/favicon.ico"}

    def __init__(self, app, owner_secret: str):
        super().__init__(app)
        # Store hashed version — never keep raw secret in memory
        self._secret_hash = hashlib.sha256(owner_secret.encode()).hexdigest()

    async def dispatch(self, request: Request, call_next):
        # Skip auth for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Check for owner secret
        provided = request.headers.get("X-Owner-Secret", "")
        provided_hash = hashlib.sha256(provided.encode()).hexdigest()

        if provided_hash != self._secret_hash:
            client_ip = request.client.host if request.client else "unknown"
            print(f"{Fore.RED}[AUTH] ✗ Rejected request from {client_ip} → {request.url.path}")
            raise HTTPException(
                status_code=403,
                detail="Forbidden — invalid or missing owner secret."
            )

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-client IP rate limiting for the API.
    Prevents brute-force attacks on your endpoints.
    """

    def __init__(self, app, requests_per_minute: int = 30):
        super().__init__(app)
        self.rpm = requests_per_minute
        self._clients: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0  # 1 minute

        # Clean old entries
        if client_ip not in self._clients:
            self._clients[client_ip] = []
        self._clients[client_ip] = [
            t for t in self._clients[client_ip] if now - t < window
        ]

        # Check limit
        if len(self._clients[client_ip]) >= self.rpm:
            retry_after = int(window - (now - self._clients[client_ip][0]))
            print(f"{Fore.RED}[RateLimit] ✗ Client {client_ip} exceeded {self.rpm} RPM")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too many requests. Retry in {retry_after}s.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Record this request
        self._clients[client_ip].append(now)
        return await call_next(request)
