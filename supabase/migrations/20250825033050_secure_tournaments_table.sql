-- 1) Безопасная функция роли
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE r text;
BEGIN
  SELECT role INTO r
  FROM public.club_members
  WHERE user_id = auth.uid();
  RETURN r;
END;
$$;

-- Явные права на функцию
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;

-- 2) Включаем RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- 3) SELECT всем
DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
CREATE POLICY "tournaments_select_all"
ON public.tournaments
FOR SELECT
USING (true);

-- 4) INSERT только админ
DROP POLICY IF EXISTS "tournaments_insert_admin" ON public.tournaments;
CREATE POLICY "tournaments_insert_admin"
ON public.tournaments
FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

-- 5) UPDATE только админ (оба условия)
DROP POLICY IF EXISTS "tournaments_update_admin" ON public.tournaments;
CREATE POLICY "tournaments_update_admin"
ON public.tournaments
FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- 6) DELETE только админ
DROP POLICY IF EXISTS "tournaments_delete_admin" ON public.tournaments;
CREATE POLICY "tournaments_delete_admin"
ON public.tournaments
FOR DELETE
USING (public.get_user_role() = 'admin');

-- Индекс по дате для календаря
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON public.tournaments (tournament_date);
