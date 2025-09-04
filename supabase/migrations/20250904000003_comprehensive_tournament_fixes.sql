-- Comprehensive tournament system fixes
-- This migration combines all fixes needed for stable tournament creation and beautiful calendar icons

-- =======================================================================
-- PART 1: Fix tournament creation by cleaning up session ticket functions
-- =======================================================================

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

-- =======================================================================
-- PART 2: Add visual fields for beautiful tournament calendar icons
-- =======================================================================

-- Add is_major field for special tournament highlighting with pulsing effects
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_major boolean DEFAULT false;

-- Add tournament_type field for visual calendar icons
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_type text DEFAULT 'Стандартный';

-- Add constraint to ensure tournament_type is one of the valid visual types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tournaments' 
        AND constraint_name = 'tournament_type_valid'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tournaments 
        ADD CONSTRAINT tournament_type_valid 
        CHECK (tournament_type IN ('Стандартный', 'Специальный', 'Фриролл', 'Рейтинговый'));
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON public.tournaments (tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_major ON public.tournaments (is_major) WHERE is_major = true;

-- Update existing tournaments to have default values
UPDATE public.tournaments 
SET tournament_type = 'Стандартный'
WHERE tournament_type IS NULL;

UPDATE public.tournaments 
SET is_major = false
WHERE is_major IS NULL;

-- =======================================================================
-- PART 3: Verification and logging
-- =======================================================================

-- Verify that the tournament policies are still intact
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'tournaments' 
    AND schemaname = 'public';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Tournament policies may be missing. Expected 4, found %', policy_count;
  ELSE
    RAISE NOTICE 'Tournament policies verified: % policies found', policy_count;
  END IF;
END $$;

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE '✅ Tournament creation should now work without session_ticket_enforcement_enabled error';
  RAISE NOTICE '✅ Beautiful calendar icons now available with 4 visual types';
  RAISE NOTICE '✅ Major tournament pulsing effects can now be enabled';
  RAISE NOTICE '🎯 Use Стандартный for standard tournaments (teal target icon)';
  RAISE NOTICE '⭐ Use Специальный for special events (gold star icon)';  
  RAISE NOTICE '⚡ Use Фриролл for freeroll tournaments (red lightning icon)';
  RAISE NOTICE '🏆 Use Рейтинговый for rating tournaments (gold trophy icon)';
END $$;