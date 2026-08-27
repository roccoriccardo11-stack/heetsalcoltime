-- ==============================================================================
-- HEETS ALCOL TIME — PATCH STORAGE: CATEGORY IMAGES
-- Esegui questo script nell'Editor SQL di Supabase per creare il bucket
-- dedicato alle immagini delle categorie e le relative policy di sicurezza.
-- ==============================================================================

-- 1. Creazione Bucket 'category-images'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. Rimozione policy esistenti se presenti
drop policy if exists "Public read category images" on storage.objects;
drop policy if exists "Auth upload category images" on storage.objects;
drop policy if exists "Auth update category images" on storage.objects;
drop policy if exists "Auth delete category images" on storage.objects;

-- 3. Policy di Lettura Pubblica (necessaria per il sito pubblico)
create policy "Public read category images"
  on storage.objects for select
  using (bucket_id = 'category-images');

-- 4. Policy di Caricamento (solo Owner e Moderatori autenticati)
create policy "Auth upload category images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );

-- 5. Policy di Aggiornamento (solo Owner e Moderatori autenticati)
create policy "Auth update category images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );

-- 6. Policy di Eliminazione (solo Owner e Moderatori autenticati)
create policy "Auth delete category images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );
