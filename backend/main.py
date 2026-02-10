"""
Mental Health App — FastAPI Backend
=====================================
Owner-only API with rate limiting and security middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from middleware import OwnerAuthMiddleware, RateLimitMiddleware

# ── Create App ──
app = FastAPI(
    title="Mental Health AI Agents",
    description="Owner-only API for AI-powered mental health tools.",
    version="0.1.0",
)

# ── Security Middleware (order matters: rate limit first, then auth) ──
app.add_middleware(RateLimitMiddleware, requests_per_minute=30)
app.add_middleware(OwnerAuthMiddleware, owner_secret=settings.owner_secret)

# ── CORS (only allow your own frontend) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ──

@app.get("/health")
async def health():
    """Public health check (no auth required)."""
    return {"status": "ok", "owner_only": True}


@app.post("/agents/code")
async def agent_code(task: dict):
    """Generate code using the DevTeam agents (owner-only)."""
    from dev_agents import DevTeam
    team = DevTeam()
    result = team.collaborate(task.get("task", ""), max_iterations=1)
    return {"result": result}
