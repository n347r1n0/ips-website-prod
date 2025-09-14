BEGIN;

-- Canonical profile builder called by trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
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

-- Ensure trigger exists & is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END$$;


-- Keep club_members.updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at'
      AND tgrelid = 'public.club_members'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.club_members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

COMMIT;
