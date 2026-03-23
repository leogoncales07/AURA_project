-- Mental Health App — Settings and Account System Schema
-- Supabase Integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users (Public profile and identity)
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    email_verified      BOOLEAN DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    password_hash       VARCHAR(255),            -- null if OAuth-only
    display_name        VARCHAR(100),
    username            VARCHAR(50) UNIQUE,
    avatar_url          VARCHAR(500),
    bio                 VARCHAR(120),
    date_of_birth       DATE,
    timezone            VARCHAR(50) DEFAULT 'UTC',
    country_code        CHAR(2),
    language            VARCHAR(10) DEFAULT 'en',
    gender              VARCHAR(30),
    phone               VARCHAR(20),
    phone_verified      BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ             -- soft delete
);

-- Table: user_settings (Application preferences)
CREATE TABLE IF NOT EXISTS user_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Wellness
    primary_goal        VARCHAR(50),
    health_conditions   JSONB DEFAULT '[]',      -- stored client-side encrypted
    occupation_type     VARCHAR(30),
    activity_level      VARCHAR(20),
    wellness_goals      JSONB DEFAULT '[]',      -- array of goal slugs
    stress_triggers     JSONB DEFAULT '[]',
    
    -- Sleep
    target_bedtime_start TIME,
    target_bedtime_end   TIME,
    target_wake_time     TIME,
    sleep_target_hours   SMALLINT DEFAULT 8,
    wind_down_minutes    SMALLINT DEFAULT 30,
    sleep_sound_pref     VARCHAR(30),
    smart_alarm_enabled  BOOLEAN DEFAULT FALSE,
    smart_alarm_window   SMALLINT DEFAULT 30,
    sleep_debt_tracking  BOOLEAN DEFAULT TRUE,
    weekly_checkin_day   SMALLINT DEFAULT 1,     -- 0=Sun, 1=Mon...
    
    -- Notifications
    push_enabled         BOOLEAN DEFAULT TRUE,
    daily_reminder_time  TIME DEFAULT '20:00',
    weekly_report_day    SMALLINT DEFAULT 1,
    streak_alerts        BOOLEAN DEFAULT TRUE,
    milestone_alerts     BOOLEAN DEFAULT TRUE,
    email_weekly_summary BOOLEAN DEFAULT TRUE,
    email_tips           BOOLEAN DEFAULT FALSE,
    email_product        BOOLEAN DEFAULT FALSE,
    notif_intensity      SMALLINT DEFAULT 2,     -- 1/2/3
    
    -- Appearance
    theme                VARCHAR(10) DEFAULT 'system',
    accent_color         VARCHAR(20) DEFAULT 'violet',
    reduce_motion        BOOLEAN DEFAULT FALSE,
    text_size            VARCHAR(10) DEFAULT 'default',
    dense_mode           BOOLEAN DEFAULT FALSE,
    
    -- Privacy
    analytics_opt_out    BOOLEAN DEFAULT FALSE,
    personalization      BOOLEAN DEFAULT TRUE,
    data_retention_years SMALLINT DEFAULT 2,
    
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_security (Sensitive security data)
CREATE TABLE IF NOT EXISTS user_security (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    totp_secret          VARCHAR(64),             -- encrypted at rest
    totp_enabled         BOOLEAN DEFAULT FALSE,
    totp_enabled_at      TIMESTAMPTZ,
    backup_codes         JSONB,                   -- hashed backup codes
    recovery_email       VARCHAR(255),
    recovery_email_verified BOOLEAN DEFAULT FALSE,
    password_updated_at  TIMESTAMPTZ
);

-- Table: user_sessions (Active login sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash           VARCHAR(64) NOT NULL,    -- never store raw tokens
    device_name          VARCHAR(100),
    device_type          VARCHAR(20),             -- mobile/desktop/tablet
    ip_address           INET,
    location             VARCHAR(100),            -- reverse geocoded
    user_agent           TEXT,
    last_active_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    expires_at           TIMESTAMPTZ NOT NULL,
    revoked_at           TIMESTAMPTZ              -- null = active
);

-- Table: oauth_connections (External providers)
CREATE TABLE IF NOT EXISTS oauth_connections (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
    provider             VARCHAR(20) NOT NULL,    -- google/apple/spotify
    provider_user_id     VARCHAR(255) NOT NULL,
    provider_email       VARCHAR(255),
    access_token         TEXT,                    -- encrypted
    refresh_token        TEXT,                    -- encrypted
    token_expires_at     TIMESTAMPTZ,
    scopes               JSONB DEFAULT '[]',
    connected_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Table: data_export_jobs (Asynchronous export status)
CREATE TABLE IF NOT EXISTS data_export_jobs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES users(id),
    status               VARCHAR(20) DEFAULT 'pending',
    file_url             VARCHAR(500),
    expires_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    completed_at         TIMESTAMPTZ
);

-- Table: audit_log (Critical actions log)
CREATE TABLE IF NOT EXISTS audit_log (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES users(id),
    action               VARCHAR(100) NOT NULL,
    metadata             JSONB DEFAULT '{}',
    ip_address           INET,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_user             ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created          ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash    ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active   ON user_sessions(user_id, last_active_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_username         ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);

-- ─── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- Basic Policies (example, usually fine-tuned in Supabase)
-- "Users can access their own data"
CREATE POLICY "Users can access own profile" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can access own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own security" ON user_security FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own oauth" ON oauth_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own export" ON data_export_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own audit" ON audit_log FOR SELECT USING (auth.uid() = user_id);
