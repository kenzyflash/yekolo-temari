-- Create event_participants table for tracking event registrations
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_participants
CREATE POLICY "Users can view event participants" 
  ON public.event_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can register for events" 
  ON public.event_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events" 
  ON public.event_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage event participants" 
  ON public.event_participants 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));