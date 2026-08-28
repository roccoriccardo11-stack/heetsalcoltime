/**
 * Photo Service — Heets Alcol Time
 *
 * Gestisce tutte le operazioni CRUD sulle foto tramite la tabella dedicata
 * `public.photos` di Supabase, separata completamente da `app_state`.
 *
 * ARCHITETTURA:
 *   File immagini  → Supabase Storage (bucket event-images / category-images)
 *   Metadati foto  → Supabase Database (tabella public.photos)
 *   app_state      → NON contiene più foto
 *   localStorage   → NON contiene più foto
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'photos';

/**
 * Recupera tutte le foto (approved + pending) dalla tabella dedicata.
 * Restituisce le foto ordinate per data di creazione decrescente.
 */
export const fetchAllPhotos = async () => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, url, title, category, author, uploaded_at, status, likes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[PhotoService] Error fetching photos:', error.message);
      return [];
    }

    // Normalizza il campo uploaded_at (snake_case dal DB → camelCase per il frontend)
    return (data || []).map(normalizePhoto);
  } catch (err) {
    console.warn('[PhotoService] Exception fetching photos:', err);
    return [];
  }
};

/**
 * Inserisce una nuova foto in stato "pending" per moderazione.
 * @param {object} photoData - { url, title, category, author }
 * @returns {object|null} - La foto inserita o null in caso di errore
 */
export const insertPhoto = async (photoData) => {
  if (!isSupabaseConfigured || !supabase) return null;

  const id = 'ph-' + Date.now();
  const row = {
    id,
    url: photoData.url,
    title: photoData.title || 'Momento speciale a Pinzolo',
    category: photoData.category || 'feste',
    author: photoData.author || 'Ospite',
    uploaded_at: new Date().toISOString().split('T')[0],
    status: 'pending',
    likes: 0
  };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select()
      .single();

    if (error) {
      console.warn('[PhotoService] Error inserting photo:', error.message);
      return { ...row }; // Restituisce comunque i dati ottimistici
    }

    return normalizePhoto(data);
  } catch (err) {
    console.warn('[PhotoService] Exception inserting photo:', err);
    return { ...normalizePhoto(row) };
  }
};

/**
 * Aggiorna lo stato di una foto (es. da 'pending' a 'approved').
 * @param {string} photoId
 * @param {object} updates - Campi da aggiornare (status, likes, title, ecc.)
 */
export const updatePhoto = async (photoId, updates) => {
  if (!isSupabaseConfigured || !supabase) return;

  // Converti camelCase → snake_case per i campi DB se necessario
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.likes !== undefined) dbUpdates.likes = updates.likes;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.author !== undefined) dbUpdates.author = updates.author;

  try {
    const { error } = await supabase
      .from(TABLE)
      .update(dbUpdates)
      .eq('id', photoId);

    if (error) {
      console.warn('[PhotoService] Error updating photo:', photoId, error.message);
    }
  } catch (err) {
    console.warn('[PhotoService] Exception updating photo:', photoId, err);
  }
};

/**
 * Elimina una foto dalla tabella (NON elimina il file dallo Storage).
 * @param {string} photoId
 */
export const deletePhotoById = async (photoId) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', photoId);

    if (error) {
      console.warn('[PhotoService] Error deleting photo:', photoId, error.message);
    }
  } catch (err) {
    console.warn('[PhotoService] Exception deleting photo:', photoId, err);
  }
};

/**
 * Sottoscrizione Realtime ai cambiamenti sulla tabella photos.
 * Chiama onInsert, onUpdate o onDelete al verificarsi di eventi.
 * @param {function} onInsert
 * @param {function} onUpdate
 * @param {function} onDelete
 * @returns {function} Funzione di cleanup
 */
export const subscribeToPhotos = (onInsert, onUpdate, onDelete) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('photos_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE },
        (payload) => {
          if (payload.new) {
            onInsert?.(normalizePhoto(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: TABLE },
        (payload) => {
          if (payload.new) {
            onUpdate?.(normalizePhoto(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: TABLE },
        (payload) => {
          if (payload.old?.id) {
            onDelete?.(payload.old.id);
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

/**
 * Normalizza un record DB (snake_case) nel formato usato dal frontend (camelCase).
 * @param {object} row
 * @returns {object}
 */
const normalizePhoto = (row) => ({
  id: row.id,
  url: row.url,
  title: row.title,
  category: row.category,
  author: row.author,
  uploadedAt: row.uploaded_at || row.uploadedAt || new Date().toISOString().split('T')[0],
  status: row.status,
  likes: row.likes ?? 0
});
