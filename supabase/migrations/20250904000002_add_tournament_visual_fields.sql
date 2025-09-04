-- Add visual fields for tournament calendar display
-- This adds fields needed for the beautiful calendar icons and special effects

-- Add is_major field for special tournament highlighting
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_major boolean DEFAULT false;

-- Add tournament_type field for visual icons (separate from play style in settings_json)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_type text DEFAULT 'Стандартный';

-- Add constraint to ensure tournament_type is one of the valid visual types
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournament_type_valid CHECK (tournament_type IN ('Стандартный', 'Специальный', 'Фриролл', 'Рейтинговый'));

-- Add index for performance when filtering by tournament type
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON public.tournaments (tournament_type);

-- Add index for major tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_major ON public.tournaments (is_major) WHERE is_major = true;

-- Update existing tournaments to have default values
UPDATE public.tournaments 
SET tournament_type = 'Стандартный'
WHERE tournament_type IS NULL;

UPDATE public.tournaments 
SET is_major = false
WHERE is_major IS NULL;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Added tournament visual fields: tournament_type and is_major for calendar icons';
END $$;