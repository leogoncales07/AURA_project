"""
Mental Health App — FastAPI Backend
=====================================
Complete API with:
- Owner authentication + rate limiting
- Supabase Auth (signup, login, JWT)
- DevTeam coding agents
- ClinicalBot (assessments) + CompanionBot (support)
- Questionnaire forms & auto-scoring
- AI-powered reports
- Mood/sleep daily logs
"""

import asyncio
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from config import settings
from middleware import OwnerAuthMiddleware, RateLimitMiddleware
from db import get_db

# ── Create App ──
app = FastAPI(
    title="Mental Health AI Agents",
    description="API for AI-powered mental health tools.",
    version="0.3.0",
)

# ── Security Middleware (order matters: rate limit first, then auth) ──
app.add_middleware(RateLimitMiddleware, requests_per_minute=30)
app.add_middleware(OwnerAuthMiddleware, owner_secret=settings.owner_secret)

# ── CORS (allow your frontends) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React web dev
        "http://localhost:8081",   # Expo dev
        "http://localhost:19006",  # Expo web
        "exp://localhost:8081",    # Expo Go
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════
# ── Request/Response Models ───────────────────────────
# ═══════════════════════════════════════════════════════

# -- Auth --
class SignupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

# -- Dev Agents --
class CodeTaskRequest(BaseModel):
    task: str
    max_iterations: int = 2

class ChatRequest(BaseModel):
    message: str

class SuggestTasksRequest(BaseModel):
    area: str = "general"
    context: str = ""

# -- Companion --
class CompanionMessageRequest(BaseModel):
    user_id: str
    message: str

class CompanionMeditationRequest(BaseModel):
    user_id: str
    request: str = "I'm feeling stressed, can you guide me through a quick meditation?"

# -- Daily Logs --
class DailyLogRequest(BaseModel):
    user_id: str
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None

# -- Assessments --
class AssessmentSubmitRequest(BaseModel):
    user_id: str
    questionnaire_id: str
    answers: List[int]

# -- Users --
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferences: Optional[dict] = None

# -- Reports --
class ReportRequest(BaseModel):
    user_id: str
    context: str = ""


# ═══════════════════════════════════════════════════════
# ── Health Check ──────────────────────────────────────
# ═══════════════════════════════════════════════════════

@app.get("/")
async def root():
    """API Root."""
    return {
        "message": "Mental Health AI Agents API is running.",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Public health check (no auth required)."""
    return {"status": "ok", "version": "0.3.0", "supabase": True}


# ═══════════════════════════════════════════════════════
# ── Auth Routes (Supabase GoTrue) ─────────────────────
# ═══════════════════════════════════════════════════════

@app.post("/auth/signup")
async def signup(req: SignupRequest):
    """Register a new user. Returns access_token + user object."""
    from auth import auth
    result = await auth.signup(req.email, req.password, req.name)
    if "error" in result:
        raise HTTPException(status_code=result.get("status", 400), detail=result["error"])

    # Also create a user profile row in our users table using user's own token
    user_id = result.get("user", {}).get("id", result.get("id"))
    access_token = result.get("access_token")
    if user_id and access_token:
        try:
            db = get_db(access_token)
            await db.from_("users").insert({
                "id": user_id,
                "name": req.name,
            }).execute()
        except Exception as e:
            print(f"Profile creation failed (non-fatal): {e}")

    return result

@app.post("/auth/login")
async def login(req: LoginRequest):
    """Login with email/password. Returns access_token, refresh_token, user."""
    from auth import auth
    result = await auth.login(req.email, req.password)
    if "error" in result:
        raise HTTPException(status_code=result.get("status", 401), detail=result["error"])
    return result

@app.post("/auth/refresh")
async def refresh(req: RefreshRequest):
    """Refresh an expired access token."""
    from auth import auth
    result = await auth.refresh_token(req.refresh_token)
    if "error" in result:
        raise HTTPException(status_code=result.get("status", 401), detail=result["error"])
    return result

@app.get("/auth/me")
async def get_me(authorization: str = Header(...)):
    """Get the current user from their Bearer token."""
    from auth import auth
    token = authorization.replace("Bearer ", "")
    result = await auth.get_user(token)
    if "error" in result:
        raise HTTPException(status_code=result.get("status", 401), detail=result["error"])
    return result

@app.post("/auth/logout")
async def logout(authorization: str = Header(...)):
    """Invalidate the current session."""
    from auth import auth
    token = authorization.replace("Bearer ", "")
    result = await auth.logout(token)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ═══════════════════════════════════════════════════════
# ── User Profile ──────────────────────────────────────
# ═══════════════════════════════════════════════════════

@app.get("/users/{user_id}")
async def get_user_profile(user_id: str, authorization: Optional[str] = Header(None)):
    """Get a user's profile."""
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("users").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/users/{user_id}")
async def update_user_profile(user_id: str, req: UserProfileUpdate, authorization: Optional[str] = Header(None)):
    """Update a user's profile (name, preferences)."""
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.preferences is not None:
        update_data["preferences"] = req.preferences
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("users").update(update_data).eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
# ── Dev Agent Routes (DevCoder + DevReviewer) ─────────
# ═══════════════════════════════════════════════════════

@app.post("/agents/code")
async def agent_code(req: CodeTaskRequest):
    """Generate code using the DevTeam agents (owner-only). Logged to Supabase."""
    from dev_agents import DevTeam
    team = DevTeam()
    result = await team.collaborate(req.task, max_iterations=req.max_iterations)
    return {"result": result}

@app.post("/agents/interact")
async def agent_interact(req: ChatRequest):
    """Chat with the dev assistant."""
    from dev_agents import DevTeam
    team = DevTeam()
    response = await team.chat(req.message)
    return {"response": response}

@app.post("/agents/suggest")
async def agent_suggest(req: SuggestTasksRequest):
    """Get prioritized coding task suggestions."""
    from dev_agents import DevTeam
    team = DevTeam()
    suggestions = await team.suggest_tasks(area=req.area, context=req.context)
    return {"suggestions": suggestions}

@app.get("/agents/tasks")
async def list_agent_tasks(limit: int = 20):
    """List recent agent tasks from Supabase."""
    try:
        db = get_db()
        result = await db.from_("agent_tasks") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return {"tasks": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/tasks/{task_id}")
async def get_agent_task(task_id: str):
    """Get a specific task and its iterations."""
    try:
        db = get_db()
        task = await db.from_("agent_tasks") \
            .select("*") \
            .eq("id", task_id) \
            .single() \
            .execute()
        iterations = await db.from_("agent_iterations") \
            .select("*") \
            .eq("task_id", task_id) \
            .order("iteration") \
            .execute()
        return {"task": task.data, "iterations": iterations.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ═══════════════════════════════════════════════════════
# ── CompanionBot (Chat, Meditation, Sleep) ────────────
# ═══════════════════════════════════════════════════════

@app.post("/companion/chat")
async def companion_chat(req: CompanionMessageRequest, authorization: Optional[str] = Header(None)):
    """Chat with the CompanionBot. Persists conversation history."""
    from agents import CompanionBot

    # 1. Fetch recent history
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        history_res = await db.from_("conversations") \
            .select("role, message") \
            .eq("user_id", req.user_id) \
            .eq("agent_type", "CompanionBot") \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        history = [{"role": row["role"], "content": row["message"]} for row in reversed(history_res.data)]
    except Exception:
        history = []

    # 2. Get AI response
    bot = CompanionBot()
    response = await bot.chat(req.message, history)

    # 3. Save conversation
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        await db.from_("conversations").insert([
            {"user_id": req.user_id, "agent_type": "CompanionBot", "role": "user", "message": req.message},
            {"user_id": req.user_id, "agent_type": "CompanionBot", "role": "assistant", "message": response}
        ]).execute()
    except Exception as e:
        print(f"Failed to log conversation: {e}")

    return {"response": response}

@app.post("/companion/meditation")
async def companion_meditation(req: CompanionMeditationRequest):
    """Get a guided meditation from CompanionBot."""
    from agents import CompanionBot
    bot = CompanionBot()
    response = await bot.get_meditation(req.request)
    return {"meditation": response}

@app.post("/companion/log")
async def log_daily(req: DailyLogRequest, authorization: Optional[str] = Header(None)):
    """Log daily mood and sleep."""
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("daily_logs").insert({
            "user_id": req.user_id,
            "mood_score": req.mood_score,
            "sleep_hours": req.sleep_hours,
            "notes": req.notes
        }).execute()
        return {"log": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/companion/{user_id}/logs")
async def get_logs(user_id: str, limit: int = 14, authorization: Optional[str] = Header(None)):
    """Get recent mood and sleep logs."""
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("daily_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("log_date", desc=True) \
            .limit(limit) \
            .execute()
        return {"logs": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/companion/{user_id}/conversations")
async def get_conversations(user_id: str, limit: int = 50, authorization: Optional[str] = Header(None)):
    """Get conversation history with CompanionBot."""
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("conversations") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("agent_type", "CompanionBot") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return {"conversations": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
# ── ClinicalBot (Assessments) ─────────────────────────
# ═══════════════════════════════════════════════════════

@app.get("/questionnaires")
async def list_questionnaires():
    """List available questionnaires."""
    from questionnaires import QUESTIONNAIRES
    return {"questionnaires": [
        {"id": q.id, "name": q.name, "description": q.description}
        for q in QUESTIONNAIRES.values()
    ]}

@app.get("/questionnaires/{q_id}")
async def get_questionnaire(q_id: str):
    """Get the full form for a specific questionnaire."""
    from questionnaires import get_questionnaire as get_q
    q = get_q(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return {
        "id": q.id,
        "name": q.name,
        "description": q.description,
        "questions": q.questions,
        "options": q.options,
    }

@app.post("/assessments/submit")
async def submit_assessment(req: AssessmentSubmitRequest, authorization: Optional[str] = Header(None)):
    """Submit answers, auto-score, get AI risk summary, and save to DB."""
    from questionnaires import get_questionnaire as get_q, score_assessment
    from agents import ClinicalBot

    q = get_q(req.questionnaire_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    try:
        score_data = score_assessment(req.questionnaire_id, req.answers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Format responses for AI summary
    responses_list = []
    for i, answer_val in enumerate(req.answers):
        answer_text = str(answer_val)
        for opt in q.options:
            if opt["value"] == answer_val:
                answer_text = opt["text"]
                break
        responses_list.append({"question": q.questions[i], "answer": answer_text})

    # Generate AI summary
    bot = ClinicalBot()
    ai_summary = await bot.generate_summary(
        q.name, score_data["total_score"], score_data["risk_level"], responses_list
    )

    # Save to Supabase using user's own token
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        result = await db.from_("assessments").insert({
            "user_id": req.user_id,
            "questionnaire": req.questionnaire_id,
            "answers": req.answers,
            "total_score": score_data["total_score"],
            "risk_level": score_data["risk_level"],
            "ai_summary": ai_summary,
        }).execute()
        return {
            "assessment": result.data[0],
            "score_data": score_data,
            "ai_summary": ai_summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assessments/{user_id}/history")
async def get_assessment_history(user_id: str, questionnaire: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """Get assessment history for a user."""
    try:
        token = authorization.replace("Bearer ", "") if authorization else None
        db = get_db(token)
        query = db.from_("assessments") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True)
        if questionnaire:
            query = query.eq("questionnaire", questionnaire.upper())
        result = query.limit(50).execute()
        return {"assessments": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
# ── AI Reports ────────────────────────────────────────
# ═══════════════════════════════════════════════════════

@app.post("/reports/generate")
async def generate_report(req: ReportRequest, authorization: Optional[str] = Header(None)):
    """Generate a personalized mental health report using AI."""
    from reports import ReportGenerator

    token = authorization.replace("Bearer ", "") if authorization else None
    db = get_db(token)

    # Fetch assessments + mood logs in PARALLEL
    async def fetch_assessments():
        try:
            res = await db.from_("assessments") \
                .select("*") \
                .eq("user_id", req.user_id) \
                .order("created_at", desc=True) \
                .limit(10) \
                .execute()
            return res.data
        except Exception:
            return []

    async def fetch_mood_logs():
        try:
            db2 = get_db(token)  # Separate client for parallel request
            res = await db2.from_("daily_logs") \
                .select("*") \
                .eq("user_id", req.user_id) \
                .order("log_date", desc=True) \
                .limit(14) \
                .execute()
            return res.data
        except Exception:
            return []

    assessments, mood_logs = await asyncio.gather(
        fetch_assessments(), fetch_mood_logs()
    )

    generator = ReportGenerator()
    report = await generator.generate_report(assessments, mood_logs, req.context)

    return {"report": report}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
