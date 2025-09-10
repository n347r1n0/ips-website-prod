-- Ensure function exists & matches DEV
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
BEGIN
  INSERT INTO public.club_members (
    user_id, nickname, full_name, avatar_url, telegram_id, telegram_username
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'nickname',''),
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url',''),
    NULLIF(NEW.raw_user_meta_data->>'telegram_id','')::BIGINT,
    NULLIF(NEW.raw_user_meta_data->>'username','')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nickname          = COALESCE(EXCLUDED.nickname, public.club_members.nickname),
    full_name         = COALESCE(EXCLUDED.full_name, public.club_members.full_name),
    avatar_url        = COALESCE(EXCLUDED.avatar_url, public.club_members.avatar_url),
    telegram_id       = COALESCE(EXCLUDED.telegram_id, public.club_members.telegram_id),
    telegram_username = COALESCE(EXCLUDED.telegram_username, public.club_members.telegram_username),
    updated_at        = timezone('utc', now());
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_auth_user() OWNER TO postgres;

-- Create trigger only if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_trigger t
    JOIN   pg_class c ON c.oid = t.tgrelid
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  n.nspname = 'auth'
       AND c.relname = 'users'
       AND t.tgname  = 'on_auth_user_created'
       AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END$$;
