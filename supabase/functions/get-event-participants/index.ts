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

    // Create service role client to bypass RLS and access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch event participants
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('event_participants')
      .select('id, event_id, user_id, registered_at, checked_in, check_in_time, notes, confirmation_sent')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      throw participantsError;
    }

    // Fetch user data from auth.users using service role
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      throw authUsersError;
    }

    // Create a map of user data for quick lookup
    const userMap = new Map(authUsers.users.map(u => [u.id, u]));

    // Combine participants with their auth.users data
    const participantsWithUserData = participants?.map(participant => {
      const authUser = userMap.get(participant.user_id);
      return {
        ...participant,
        user_email: authUser?.email || 'No email',
        user_phone: authUser?.user_metadata?.phone || authUser?.phone || 'No phone',
        user_name: authUser?.user_metadata?.first_name && authUser?.user_metadata?.last_name
          ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
          : authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'No name'
      };
    });

    console.log(`Successfully fetched ${participantsWithUserData?.length || 0} participants`);

    return new Response(
      JSON.stringify({ participants: participantsWithUserData }),
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
