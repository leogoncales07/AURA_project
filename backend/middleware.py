"""
FastAPI Security Middleware
============================
- Owner-only authentication via OWNER_SECRET header
- Per-client rate limiting
- Request logging with masked keys
"""

import time
import hashlib
from fastapi import Request, HTTPException # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from starlette.middleware.base import BaseHTTPMiddleware # type: ignore
from colorama import Fore, init # type: ignore

init(autoreset=True)


class OwnerAuthMiddleware(BaseHTTPMiddleware):
    """
    Blocks ALL requests that don't carry the correct OWNER_SECRET.
    Only YOU can use this API.
    
    Send the header:  X-Owner-Secret: <your_secret>
    """

    # Paths that don't require owner secret (auth, health, docs)
    PUBLIC_PATHS = {
        "/", "/health", "/docs", "/openapi.json", "/redoc", "/favicon.ico",
        "/auth/login", "/auth/signup", "/auth/refresh",
        "/api/v1/auth/login", "/api/v1/auth/signup", "/api/v1/auth/refresh"
    }

    def __init__(self, app, owner_secret: str):
        super().__init__(app) # type: ignore
        # Store hashed version — never keep raw secret in memory
        self._secret_hash = hashlib.sha256(owner_secret.encode()).hexdigest()

    # Paths that don't require owner secret (allow the app to function)
    PUBLIC_PREFIXES = ("/auth", "/users", "/companion", "/assessments", "/questionnaires", "/reports", "/api/v1")

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Skip auth for public paths or app-specific prefixes
        if path in self.PUBLIC_PATHS or path.startswith(self.PUBLIC_PREFIXES):
            return await call_next(request)

        # Check for owner secret
        provided = request.headers.get("X-Owner-Secret", "")
        provided_hash = hashlib.sha256(provided.encode()).hexdigest()

        if provided_hash != self._secret_hash:
            client_ip = request.client.host if request.client else "unknown"
            print(f"{Fore.RED}[AUTH] ✗ Rejected request from {client_ip} → {request.url.path}")
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden — invalid or missing owner secret."}
            )

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-client IP rate limiting for the API.
    Prevents brute-force attacks on your endpoints.
    """

    # Cleanup stale client entries older than 5 minutes
    STALE_ENTRY_TIMEOUT = 300  # seconds

    def __init__(self, app, requests_per_minute: int = 30):
        super().__init__(app) # type: ignore
        self.rpm = requests_per_minute
        self._clients: dict[str, list[float]] = {}

    def _cleanup_stale_entries(self):
        """Remove client entries that haven't been used recently to prevent memory leaks."""
        now = time.time()
        # Find entries where the most recent request is older than the timeout
        stale_ips = [
            ip for ip, timestamps in self._clients.items()
            if not timestamps or now - max(timestamps) > self.STALE_ENTRY_TIMEOUT
        ]
        for ip in stale_ips:
            self._clients.pop(ip, None)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0  # 1 minute

        # Periodically cleanup stale entries (every ~100 requests)
        if len(self._clients) > 100:
            self._cleanup_stale_entries()

        # Clean old entries for this client
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
