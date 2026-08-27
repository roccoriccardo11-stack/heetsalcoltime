-- ==============================================================================
-- HEETS ALCOL TIME — PATCH: STORAGE EVENT-VIDEOS & EVENT-IMAGES
-- ==============================================================================
-- ESEGUI QUESTO SCRIPT nel "SQL Editor" di Supabase → premi "Run".
-- NON elimina tabelle, utenti, dati o account Owner.
-- ==============================================================================

-- ==============================================================================
-- 1. BUCKET SUPABASE STORAGE: event-videos
-- ==============================================================================
-- Crea il bucket dedicato per i video degli eventi (pubblico in streaming).
-- Dimensione massima: 50 MB (limite standard Supabase per video HD).
-- Formati consentiti: MP4, MOV (QuickTime/iOS), WEBM, M4V, 3GP, OGG.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-videos',
  'event-videos',
  true,
  52428800,  -- 50 MB
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp', 'video/ogg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp', 'video/ogg'];

-- ==============================================================================
-- 2. POLICY STORAGE: event-videos
-- ==============================================================================
-- - Lettura pubblica: chiunque visiti il sito può riprodurre i video degli eventi.
-- - Upload / Modifica / Eliminazione: consentiti ESCLUSIVAMENTE a Owner e Moderatori autenticati.
-- - I Consumer non possono caricare o modificare video.

drop policy if exists "Public read event videos" on storage.objects;
drop policy if exists "Auth upload event videos" on storage.objects;
drop policy if exists "Auth update event videos" on storage.objects;
drop policy if exists "Auth delete event videos" on storage.objects;

-- 2a. Lettura pubblica per lo streaming
create policy "Public read event videos"
  on storage.objects for select
  using (bucket_id = 'event-videos');

-- 2b. Upload video (solo Owner/Moderator autenticati)
create policy "Auth upload event videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );

-- 2c. Aggiornamento video (solo Owner/Moderator autenticati)
create policy "Auth update event videos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );

-- 2d. Eliminazione video (solo Owner/Moderator autenticati)
create policy "Auth delete event videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );

-- ==============================================================================
-- FINE PATCH MEDIA
-- ==============================================================================
