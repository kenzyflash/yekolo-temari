import { supabase } from '@/integrations/supabase/client';

export interface EventRegistrationResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Register user for an event with proper concurrency handling
 */
export async function registerForEvent(
  eventId: string, 
  userId: string,
  maxCapacity: number = 100
): Promise<EventRegistrationResult> {
  try {
    // Check if user is already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (existingRegistration) {
      return { success: false, error: 'You are already registered for this event' };
    }

    // Get current participant count with lock
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('participants')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return { success: false, error: eventError.message };
    }

    // Check capacity
    if (event.participants >= maxCapacity) {
      return { success: false, error: 'Event is full. Registration capacity reached.' };
    }

    // Register user
    const { error: insertError } = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: userId,
        registered_at: new Date().toISOString()
      });

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return { success: false, error: 'You are already registered for this event' };
      }
      return { success: false, error: insertError.message };
    }

    // Increment participant count
    const { error: updateError } = await supabase
      .from('events')
      .update({ participants: event.participants + 1 })
      .eq('id', eventId);

    if (updateError) {
      // Rollback registration if count update fails
      await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
      
      return { success: false, error: 'Failed to update participant count. Please try again.' };
    }

    return { 
      success: true, 
      message: 'Successfully registered for the event!' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Unregister user from an event
 */
export async function unregisterFromEvent(
  eventId: string, 
  userId: string
): Promise<EventRegistrationResult> {
  try {
    // Check if user is registered
    const { data: registration, error: checkError } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (!registration) {
      return { success: false, error: 'You are not registered for this event' };
    }

    // Delete registration
    const { error: deleteError } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Decrement participant count
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('participants')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return { success: false, error: eventError.message };
    }

    const { error: updateError } = await supabase
      .from('events')
      .update({ participants: Math.max(0, event.participants - 1) })
      .eq('id', eventId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { 
      success: true, 
      message: 'Successfully unregistered from the event' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Check if user is registered for an event
 */
export async function checkEventRegistration(
  eventId: string, 
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking registration:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
}
