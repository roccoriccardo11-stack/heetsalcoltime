import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Cloud Sync Service with Supabase
 * Handles real-time cross-device synchronization for:
 * - Content & CMS
 * - Events
 * - Photos (approved & pending)
 * - Messages
 * - Users & Roles (Owner, Moderator, User)
 * - Invites & Audit logs
 */

export const fetchCloudKey = async (key, fallbackValue) => {
  if (!isSupabaseConfigured || !supabase) return fallbackValue;

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`[CloudSync] Error fetching "${key}":`, error.message);
      return fallbackValue;
    }

    return data && data.value !== undefined && data.value !== null ? data.value : fallbackValue;
  } catch (err) {
    console.warn(`[CloudSync] Exception fetching "${key}":`, err);
    return fallbackValue;
  }
};

export const saveCloudKey = async (key, value) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.warn(`[CloudSync] Error saving "${key}":`, error.message);
    }
  } catch (err) {
    console.warn(`[CloudSync] Exception saving "${key}":`, err);
  }
};

export const subscribeToCloudChanges = (onUpdate) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('app_state_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_state' },
        (payload) => {
          if (payload.new && payload.new.key) {
            onUpdate(payload.new.key, payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('[CloudSync] Could not subscribe to realtime updates:', e);
    return () => {};
  }
};
