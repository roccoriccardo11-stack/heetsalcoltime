/**
 * Photo Service — Heets Alcol Time
 *
 * Gestisce le foto tramite la tabella `app_state` già esistente in Supabase,
 * usando la chiave dedicata "photos". I metadati sono URL pubblici leggeri
 * (non base64), quindi il payload JSON è piccolo e non causa timeout.
 *
 * ARCHITETTURA:
 *   File immagini  → Supabase Storage (bucket event-images / category-images)
 *   Metadati foto  → app_state key="photos" (array JSON leggero di riferimenti)
 *   localStorage   → MAI. Zero.
 *   base64         → MAI. Zero.
 *
 * La tabella `public.photos` separata NON esiste nel progetto attuale.
 * Questo servizio usa ESCLUSIVAMENTE la tabella `app_state` già presente.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const APP_STATE_TABLE = 'app_state';
const PHOTOS_KEY = 'photos';

/**
 * Recupera l'array di foto da app_state.
 * @returns {Array} Array di oggetti foto (può essere vuoto)
 */
export const fetchAllPhotos = async () => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from(APP_STATE_TABLE)
      .select('value')
      .eq('key', PHOTOS_KEY)
      .maybeSingle();

    if (error) {
      console.warn('[PhotoService] Error fetching photos from app_state:', error.message);
      return [];
    }

    const value = data?.value;
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  } catch (err) {
    console.warn('[PhotoService] Exception fetching photos:', err);
    return [];
  }
};

/**
 * Salva l'intero array di foto in app_state.
 * NOTA: I metadati devono essere SOLO riferimenti URL (non base64/blob).
 * @param {Array} photosArray - Array di oggetti { id, url, title, category, author, uploadedAt, status, likes }
 */
export const saveAllPhotos = async (photosArray) => {
  if (!isSupabaseConfigured || !supabase) return;

  // Sanity check: garantiamo che nessun elemento contenga base64
  const safePhotos = photosArray.map(p => ({
    id: p.id,
    url: p.url,
    title: p.title,
    category: p.category,
    author: p.author,
    uploadedAt: p.uploadedAt,
    status: p.status,
    likes: p.likes ?? 0
  }));

  try {
    const { error } = await supabase
      .from(APP_STATE_TABLE)
      .upsert(
        { key: PHOTOS_KEY, value: safePhotos, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.warn('[PhotoService] Error saving photos to app_state:', error.message);
    }
  } catch (err) {
    console.warn('[PhotoService] Exception saving photos:', err);
  }
};

/**
 * Sottoscrizione Realtime ai cambiamenti sulla chiave "photos" in app_state.
 * Quando un altro device aggiorna le foto, il callback riceve il nuovo array.
 * @param {function} onUpdate - Callback(photosArray)
 * @returns {function} Funzione di cleanup (unsubscribe)
 */
export const subscribeToPhotos = (onUpdate) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('photos_app_state_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: APP_STATE_TABLE,
          filter: `key=eq.${PHOTOS_KEY}`
        },
        (payload) => {
          if (payload.new?.value && Array.isArray(payload.new.value)) {
            onUpdate(payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[PhotoService] Could not subscribe to realtime photo updates:', err);
    return () => {};
  }
};
