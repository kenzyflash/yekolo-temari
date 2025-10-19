-- Add registration_open column to events table
ALTER TABLE public.events 
ADD COLUMN registration_open boolean DEFAULT true NOT NULL;

-- Update existing events to have registration open
UPDATE public.events 
SET registration_open = true 
WHERE registration_open IS NULL;

-- Add confirmation_sent column to event_participants table to track email status
ALTER TABLE public.event_participants 
ADD COLUMN confirmation_sent boolean DEFAULT false NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_events_registration_open ON public.events(registration_open);
CREATE INDEX idx_event_participants_confirmation_sent ON public.event_participants(confirmation_sent);