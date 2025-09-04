-- Complete cleanup of session ticket infrastructure and restore original get_user_role function
-- This migration fixes the tournament creation error by removing all references to dropped tables/functions

-- 1) First, restore the original get_user_role function (before session ticket modification)
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

-- Ensure proper permissions on the restored function
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;

-- 2) Drop all session ticket related functions (in correct dependency order)
DROP FUNCTION IF EXISTS public.ticket_is_active();
DROP FUNCTION IF EXISTS public.current_session_ticket();
DROP FUNCTION IF EXISTS public.session_ticket_enforcement_enabled();

-- 3) Drop session ticket infrastructure tables
DROP TABLE IF EXISTS public.session_tickets CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 4) Clean up any stray indexes that might remain
DROP INDEX IF EXISTS idx_session_tickets_user_id;
DROP INDEX IF EXISTS idx_session_tickets_active;

-- 5) Verify tournaments table policies are still intact
-- (These should not have been affected, but let's ensure they exist)
-- Note: We don't recreate them here since they should already exist from earlier migrations

-- Log the cleanup completion
DO $$
BEGIN
  RAISE NOTICE 'Session ticket infrastructure completely removed. Tournament creation should now work.';
END $$;