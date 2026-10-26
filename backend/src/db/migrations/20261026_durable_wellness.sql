-- Apply after backend/schema.sql. Back up the database before deployment.
BEGIN;
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'This migration requires the TEXT user IDs from backend/schema.sql. Inspect the existing schema before migrating.';
  END IF;
END $$;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title TEXT;
CREATE INDEX IF NOT EXISTS conversations_thread ON public.conversations(user_id, conversation_id, created_at);
ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_questionnaire_check;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_questionnaire_check
  CHECK (questionnaire IN ('PHQ-9', 'GAD-7', 'WHO-5', 'PSS', 'PSS-10'));

CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "bedTime" TEXT, "wakeTime" TEXT,
  hours NUMERIC NOT NULL CHECK (hours > 0 AND hours <= 24),
  quality INTEGER CHECK (quality BETWEEN 0 AND 100),
  notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL, prompt TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sleep_logs_user_date ON public.sleep_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reflections_user_date ON public.reflections(user_id, created_at DESC);

-- Link application records to Auth, including accounts created before this migration.
INSERT INTO public.users(id, name)
SELECT id::text, COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'name') FROM auth.users
ON CONFLICT(id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.create_aura_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users(id, name) VALUES (NEW.id::text, NEW.raw_user_meta_data->>'name')
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS aura_profile_created ON auth.users;
CREATE TRIGGER aura_profile_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_aura_profile();

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_sleep ON public.sleep_logs;
CREATE POLICY own_sleep ON public.sleep_logs FOR ALL TO authenticated
USING(user_id = auth.uid()::text) WITH CHECK(user_id = auth.uid()::text);
DROP POLICY IF EXISTS own_reflections ON public.reflections;
CREATE POLICY own_reflections ON public.reflections FOR ALL TO authenticated
USING(user_id = auth.uid()::text) WITH CHECK(user_id = auth.uid()::text);
DROP POLICY IF EXISTS own_app_settings ON public.app_settings;
CREATE POLICY own_app_settings ON public.app_settings FOR ALL TO authenticated
USING(user_id = auth.uid()::text) WITH CHECK(user_id = auth.uid()::text);
DROP POLICY IF EXISTS own_conversation_delete ON public.conversations;
CREATE POLICY own_conversation_delete ON public.conversations FOR DELETE TO authenticated USING(user_id = auth.uid()::text);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs, public.reflections, public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.daily_logs, public.assessments, public.conversations, public.user_sessions TO authenticated;

-- Partial updates preserve the other daily measurements, even during concurrent writes.
CREATE OR REPLACE FUNCTION public.save_daily_log(payload JSONB)
RETURNS SETOF public.daily_logs LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN QUERY INSERT INTO public.daily_logs(user_id, mood_score, sleep_hours, notes)
  VALUES(auth.uid()::text, (payload->>'mood_score')::int, (payload->>'sleep_hours')::numeric, payload->>'notes')
  ON CONFLICT(user_id, log_date) DO UPDATE SET
    mood_score = COALESCE(EXCLUDED.mood_score, daily_logs.mood_score),
    sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_logs.sleep_hours),
    notes = CASE WHEN payload ? 'notes' THEN EXCLUDED.notes ELSE daily_logs.notes END,
    created_at = now()
  RETURNING *;
END;
$$;

-- A sleep entry and its dashboard measurement commit together.
CREATE OR REPLACE FUNCTION public.save_sleep_log(payload JSONB)
RETURNS SETOF public.sleep_logs LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM public.save_daily_log(jsonb_build_object('sleep_hours', payload->'hours'));
  RETURN QUERY INSERT INTO public.sleep_logs(user_id, "bedTime", "wakeTime", hours, quality, notes)
  VALUES(auth.uid()::text, payload->>'bedTime', payload->>'wakeTime', (payload->>'hours')::numeric,
    (payload->>'quality')::int, payload->>'notes') RETURNING *;
END;
$$;
REVOKE ALL ON FUNCTION public.save_daily_log(JSONB), public.save_sleep_log(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_daily_log(JSONB), public.save_sleep_log(JSONB) TO authenticated;

-- Trigger cleanup runs in the same transaction as Supabase Auth deletion.
CREATE OR REPLACE FUNCTION public.delete_aura_data() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.assessments WHERE user_id = OLD.id::text;
  DELETE FROM public.user_sessions WHERE user_id = OLD.id::text;
  DELETE FROM public.users WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS aura_account_deleted ON auth.users;
CREATE TRIGGER aura_account_deleted BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.delete_aura_data();

CREATE OR REPLACE FUNCTION public.delete_wellness_data() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.daily_logs WHERE user_id = auth.uid()::text;
  DELETE FROM public.sleep_logs WHERE user_id = auth.uid()::text;
  DELETE FROM public.reflections WHERE user_id = auth.uid()::text;
  DELETE FROM public.conversations WHERE user_id = auth.uid()::text;
  DELETE FROM public.assessments WHERE user_id = auth.uid()::text;
  DELETE FROM public.user_sessions WHERE user_id = auth.uid()::text;
END;
$$;
DROP POLICY IF EXISTS own_log_delete ON public.daily_logs;
CREATE POLICY own_log_delete ON public.daily_logs FOR DELETE TO authenticated USING(user_id = auth.uid()::text);
DROP POLICY IF EXISTS own_assessment_delete ON public.assessments;
CREATE POLICY own_assessment_delete ON public.assessments FOR DELETE TO authenticated USING(user_id = auth.uid()::text);
DROP POLICY IF EXISTS own_session_delete ON public.user_sessions;
CREATE POLICY own_session_delete ON public.user_sessions FOR DELETE TO authenticated USING(user_id = auth.uid()::text);
REVOKE ALL ON FUNCTION public.delete_wellness_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_wellness_data() TO authenticated;
CREATE OR REPLACE FUNCTION public.save_app_settings(payload JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result JSONB;
BEGIN
  INSERT INTO public.app_settings(user_id, preferences) VALUES(auth.uid()::text, payload)
  ON CONFLICT(user_id) DO UPDATE SET preferences = app_settings.preferences || payload, updated_at = now()
  RETURNING preferences INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_app_settings(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_app_settings(JSONB) TO authenticated;
CREATE OR REPLACE FUNCTION public.aura_storage_version() RETURNS INTEGER
LANGUAGE sql STABLE SECURITY INVOKER AS $$ SELECT 1 $$;
REVOKE ALL ON FUNCTION public.aura_storage_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aura_storage_version() TO authenticated;
COMMIT;
