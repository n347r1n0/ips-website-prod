-- Migration: Add guest_contact column to tournament_participants table
-- This column will store contact information (phone, email, telegram, etc.) for guest registrations

ALTER TABLE "public"."tournament_participants"
ADD COLUMN "guest_contact" TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN "public"."tournament_participants"."guest_contact" 
IS 'Contact information for guest players (phone, email, telegram, etc.)';