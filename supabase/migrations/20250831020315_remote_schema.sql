drop extension if exists "pg_net";

alter table "public"."tournament_participants" alter column "guest_name" drop not null;

alter table "public"."tournament_participants" alter column "telegram_id" drop not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$function$
;


  create policy "Allow anonymous registration"
  on "public"."tournament_participants"
  as permissive
  for insert
  to anon
with check (true);



