-- Apply after 20261026_durable_wellness.sql. Safe to reapply.
BEGIN;
DO $$ BEGIN
  IF public.aura_storage_version() < 1 THEN RAISE EXCEPTION 'Apply the durable wellness migration first'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  practice_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 30 AND 7200),
  practiced_seconds INTEGER NOT NULL CHECK (practiced_seconds BETWEEN 27 AND 7202),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (practiced_seconds >= duration_seconds * 0.9 AND practiced_seconds <= duration_seconds + 2)
);
CREATE INDEX IF NOT EXISTS meditation_sessions_user_date ON public.meditation_sessions(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.wellness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wellness_reports_user_date ON public.wellness_reports(user_id, created_at DESC);
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_reports ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY['meditation_sessions', 'wellness_reports'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS own_read ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS own_insert ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS own_delete ON public.%I', tbl);
    EXECUTE format('CREATE POLICY own_read ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid()::text)', tbl);
    EXECUTE format('CREATE POLICY own_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text)', tbl);
    EXECUTE format('CREATE POLICY own_delete ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid()::text)', tbl);
    EXECUTE format('GRANT SELECT, INSERT, DELETE ON public.%I TO authenticated', tbl);
  END LOOP;
END $$;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS language TEXT CHECK (language IN ('pt', 'en', 'es', 'fr', 'de'));

CREATE OR REPLACE FUNCTION public.delete_wellness_data() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.wellness_reports WHERE user_id = auth.uid()::text;
  DELETE FROM public.meditation_sessions WHERE user_id = auth.uid()::text;
  DELETE FROM public.daily_logs WHERE user_id = auth.uid()::text;
  DELETE FROM public.sleep_logs WHERE user_id = auth.uid()::text;
  DELETE FROM public.reflections WHERE user_id = auth.uid()::text;
  DELETE FROM public.conversations WHERE user_id = auth.uid()::text;
  DELETE FROM public.assessments WHERE user_id = auth.uid()::text;
  DELETE FROM public.user_sessions WHERE user_id = auth.uid()::text;
END;
$$;
CREATE OR REPLACE FUNCTION public.aura_progress_version() RETURNS INTEGER
LANGUAGE sql STABLE SECURITY INVOKER AS $$ SELECT 1 $$;
REVOKE ALL ON FUNCTION public.aura_progress_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aura_progress_version() TO authenticated;
COMMIT;
