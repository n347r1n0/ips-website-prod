-- Migration for Epic 3: Timer Integration & Mocking (v2 with Constraint)

-- Step 1: Add 'status' to the tournaments table with a default value.
ALTER TABLE public.tournaments
ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled';

-- Step 2: Add a CHECK constraint to ensure data integrity for the new status field.
ALTER TABLE public.tournaments
ADD CONSTRAINT valid_tournament_status
CHECK (status IN ('scheduled', 'registration_open', 'late_registration', 'live_no_registration', 'completed', 'canceled'));

-- Step 3: Add 'rating_points' to the participants table for scoring.
ALTER TABLE public.tournament_participants
ADD COLUMN rating_points INTEGER NOT NULL DEFAULT 0;
