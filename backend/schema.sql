-- =============================================================
-- Mental Health App — Supabase Schema
-- =============================================================
-- Run this in the Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- ─── Agent Tasks Log ─────────────────────────────────────────
-- Stores every task sent to the DevTeam agents and the final output.
CREATE TABLE IF NOT EXISTS agent_tasks (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task            TEXT NOT NULL,
    final_code      TEXT,
    iterations      INT DEFAULT 0,
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

-- ─── Agent Iterations Log ────────────────────────────────────
-- Stores each coder/reviewer iteration for a given task.
CREATE TABLE IF NOT EXISTS agent_iterations (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id         UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
    iteration       INT NOT NULL,
    coder_output    TEXT,
    reviewer_output TEXT,
    approved        BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Users Profile ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    preferences     JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Conversations (Chat History) ────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type      TEXT NOT NULL CHECK (agent_type IN ('ClinicalBot', 'CompanionBot')),
    message         TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Daily Logs (Mood & Sleep) ───────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_score      INT CHECK (mood_score >= 1 AND mood_score <= 10),
    sleep_hours     NUMERIC,
    notes           TEXT,
    log_date        DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, log_date)
);

-- ─── User Sessions (for future mental-health features) ──────
CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL,
    session_type    TEXT NOT NULL
                    CHECK (session_type IN ('assessment', 'meditation', 'chat', 'sleep')),
    data            JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now(),
    ended_at        TIMESTAMPTZ
);

-- ─── Assessment Results ──────────────────────────────────────
-- PHQ-9, GAD-7, WHO-5, PSS questionnaire results.
CREATE TABLE IF NOT EXISTS assessments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL,
    questionnaire   TEXT NOT NULL
                    CHECK (questionnaire IN ('PHQ-9', 'GAD-7', 'WHO-5', 'PSS')),
    answers         JSONB NOT NULL,
    total_score     INT,
    risk_level      TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    ai_summary      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Row Level Security ──────────────────────────────────────
-- Enable RLS on all tables.
ALTER TABLE agent_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments      ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies (Authenticated Users) ─────────────────────
-- Users table: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid()::text);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid()::text);

-- Conversations: users see only their own chat history
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Daily Logs: users can CRUD their own logs
CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Assessments: users can view and submit their own assessments
CREATE POLICY "Users can view own assessments" ON assessments
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own assessments" ON assessments
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- User Sessions: users can CRUD their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Agent tasks: allow all authenticated users to view (shared dev tool)
CREATE POLICY "Authenticated users can view agent tasks" ON agent_tasks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert agent tasks" ON agent_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view agent iterations" ON agent_iterations
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert agent iterations" ON agent_iterations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status     ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created    ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iterations_task_id     ON agent_iterations(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user     ON conversations(user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user        ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user          ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user       ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type       ON assessments(questionnaire);

