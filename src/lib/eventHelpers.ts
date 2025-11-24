import { supabase } from '@/integrations/supabase/client';

export interface EventRegistrationResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Register user for an event with IP-based rate limiting via edge function
 */
export async function registerForEvent(
  eventId: string, 
  userId: string,
  maxCapacity: number = 100
): Promise<EventRegistrationResult> {
  try {
    // Use edge function with IP-based rate limiting
    const { data, error } = await supabase.functions.invoke('register-event', {
      body: {
        event_id: eventId,
        user_id: userId,
        action: 'register'
      }
    });

    if (error) {
      // Handle rate limit errors
      if (error.message?.includes('Rate limit') || error.message?.includes('Too many')) {
        return { 
          success: false, 
          error: 'Too many registration attempts. Please try again later.' 
        };
      }
      return { success: false, error: error.message };
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
 * Unregister user from an event with IP-based rate limiting via edge function
 */
export async function unregisterFromEvent(
  eventId: string, 
  userId: string
): Promise<EventRegistrationResult> {
  try {
    // Use edge function with IP-based rate limiting
    const { data, error } = await supabase.functions.invoke('register-event', {
      body: {
        event_id: eventId,
        user_id: userId,
        action: 'unregister'
      }
    });

    if (error) {
      // Handle rate limit errors
      if (error.message?.includes('Rate limit') || error.message?.includes('Too many')) {
        return { 
          success: false, 
          error: 'Too many attempts. Please try again later.' 
        };
      }
      return { success: false, error: error.message };
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
