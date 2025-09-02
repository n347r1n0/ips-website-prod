-- 0) Флаг вкл/выкл
CREATE TABLE IF NOT EXISTS public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enforce_session_ticket boolean NOT NULL DEFAULT false
);
INSERT INTO public.app_settings (id, enforce_session_ticket) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.session_ticket_enforcement_enabled()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT enforce_session_ticket FROM public.app_settings WHERE id = 1;
$$;

-- 1) Таблица пер-сессионных билетов
CREATE TABLE IF NOT EXISTS public.session_tickets (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  user_agent text,
  ip inet,
  last_seen_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_session_tickets_user_id ON public.session_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tickets_active ON public.session_tickets(user_id, ticket) WHERE revoked_at IS NULL;

-- 2) Текущий тикет из JWT (из user_metadata)
CREATE OR REPLACE FUNCTION public.current_session_ticket()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'session_ticket');
$$;

-- 3) Активен ли текущий тикет
CREATE OR REPLACE FUNCTION public.ticket_is_active()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.session_tickets st
    WHERE st.user_id = auth.uid()
      AND st.ticket = public.current_session_ticket()
      AND st.revoked_at IS NULL
  );
$$;

-- 4) Обновляем get_user_role: роль доступна только если флаг выключен ИЛИ тикет активен
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role
  FROM public.club_members
  WHERE user_id = auth.uid()
    AND (
      NOT public.session_ticket_enforcement_enabled()
      OR public.ticket_is_active()
    );
$$;
