-- Clean up orphaned functions that reference dropped tables

-- Drop the session ticket enforcement function that references dropped app_settings table
DROP FUNCTION IF EXISTS public.session_ticket_enforcement_enabled();

-- Drop the current session ticket function that references dropped session_tickets table
DROP FUNCTION IF EXISTS public.current_session_ticket();