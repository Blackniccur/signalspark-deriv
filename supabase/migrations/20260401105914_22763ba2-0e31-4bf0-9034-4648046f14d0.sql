
CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON public.device_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
ON public.device_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
ON public.device_sessions FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
ON public.device_sessions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all sessions"
ON public.device_sessions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
