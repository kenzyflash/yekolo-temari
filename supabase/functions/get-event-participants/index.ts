import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create authenticated client to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated and is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Admin check failed:', roleError);
      throw new Error('Forbidden: Admin access required');
    }

    // Get event ID from request
    const { eventId } = await req.json();
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    console.log(`Fetching participants for event: ${eventId}`);

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch event participants
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('event_participants')
      .select('id, event_id, user_id, registered_at, checked_in, check_in_time, notes')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      throw participantsError;
    }

    // Fetch profiles for all participants
    const userIds = participants?.map(p => p.user_id) || [];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, phone, bio, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Combine participants with their profile data
    const participantsWithProfiles = participants?.map(participant => {
      const profile = profiles?.find(p => p.user_id === participant.user_id);
      return {
        ...participant,
        profiles: profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          bio: profile.bio,
        } : null,
        user_email: profile?.email || 'No email',
      };
    });

    console.log(`Successfully fetched ${participantsWithProfiles?.length || 0} participants`);

    return new Response(
      JSON.stringify({ participants: participantsWithProfiles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-event-participants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('Forbidden') ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
