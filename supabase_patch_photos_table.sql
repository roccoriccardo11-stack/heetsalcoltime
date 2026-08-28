-- ==============================================================================
-- HEETS ALCOL TIME — PATCH: Tabella dedicata per le foto
-- Esegui questo script nel "SQL Editor" di Supabase e premi "Run".
--
-- OBIETTIVO: Separare le foto da app_state per evitare timeout e QuotaExceeded.
-- SICUREZZA: NON elimina nessuna foto, bucket o dato esistente.
-- ==============================================================================

-- 1. Creazione tabella PHOTOS dedicata (sicura, non distruttiva)
create table if not exists public.photos (
  id          text        primary key,          -- es. "ph-1" o "ph-1753000000000"
  url         text        not null,             -- URL pubblico Supabase Storage o esterno
  title       text        not null default 'Momento speciale',
  category    text        not null default 'feste',
  author      text        not null default 'Ospite',
  uploaded_at date        not null default current_date,
  status      text        not null check (status in ('approved', 'pending', 'rejected')) default 'pending',
  likes       integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Indici utili per query frequenti
create index if not exists idx_photos_status     on public.photos (status);
create index if not exists idx_photos_category   on public.photos (category);
create index if not exists idx_photos_created_at on public.photos (created_at desc);

-- 3. Attiva RLS
alter table public.photos enable row level security;

-- 4. Policy: Chiunque può leggere le foto approvate (galleria pubblica)
drop policy if exists "Public can view approved photos" on public.photos;
create policy "Public can view approved photos"
  on public.photos for select
  using (status = 'approved');

-- 5. Policy: Utenti autenticati possono leggere anche le foto pending (per la moderazione)
drop policy if exists "Admins can view all photos" on public.photos;
create policy "Admins can view all photos"
  on public.photos for select
  to authenticated
  using (public.is_admin_or_moderator());

-- 6. Policy: Qualunque utente (anche anonimo) può inserire una foto in pending
drop policy if exists "Anyone can submit photos for moderation" on public.photos;
create policy "Anyone can submit photos for moderation"
  on public.photos for insert
  with check (status = 'pending');

-- 7. Policy: Solo Owner/Moderatori possono modificare/cancellare foto
drop policy if exists "Admins can update photos" on public.photos;
create policy "Admins can update photos"
  on public.photos for update
  to authenticated
  using (public.is_admin_or_moderator())
  with check (public.is_admin_or_moderator());

drop policy if exists "Admins can delete photos" on public.photos;
create policy "Admins can delete photos"
  on public.photos for delete
  to authenticated
  using (public.is_admin_or_moderator());

-- 8. Trigger per aggiornare updated_at automaticamente
create or replace function public.set_photos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_photos_updated on public.photos;
create trigger on_photos_updated
  before update on public.photos
  for each row execute function public.set_photos_updated_at();

-- 9. Realtime: aggiungi la tabella alla pubblicazione
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end $$;

-- 10. MIGRAZIONE DATI DA app_state.photos (NON distruttiva)
-- Recupera l'array di foto salvato in app_state (se presente) e inserisce
-- ogni elemento nella nuova tabella photos, senza sovrascrivere i record
-- già esistenti (ON CONFLICT DO NOTHING garantisce idempotenza).
do $$
declare
  v_photos_json jsonb;
  v_photo       jsonb;
begin
  -- Leggi il valore corrente da app_state
  select value into v_photos_json
  from public.app_state
  where key = 'photos'
  limit 1;

  -- Se non esiste o è nullo, skip
  if v_photos_json is null then
    raise notice 'Nessun dato "photos" trovato in app_state. Nessuna migrazione necessaria.';
    return;
  end if;

  -- Se è un array, migra ogni elemento
  if jsonb_typeof(v_photos_json) = 'array' then
    for v_photo in select * from jsonb_array_elements(v_photos_json)
    loop
      insert into public.photos (
        id,
        url,
        title,
        category,
        author,
        uploaded_at,
        status,
        likes,
        created_at
      ) values (
        v_photo->>'id',
        v_photo->>'url',
        coalesce(v_photo->>'title', 'Momento speciale'),
        coalesce(v_photo->>'category', 'feste'),
        coalesce(v_photo->>'author', 'Ospite'),
        coalesce((v_photo->>'uploadedAt')::date, current_date),
        coalesce(v_photo->>'status', 'pending'),
        coalesce((v_photo->>'likes')::integer, 0),
        now()
      )
      on conflict (id) do nothing;  -- NON sovrascrivere foto già migrate
    end loop;
    raise notice 'Migrazione completata: foto migrate da app_state a public.photos.';
  else
    raise notice 'Il valore "photos" in app_state non è un array JSON valido. Migrazione saltata.';
  end if;
end $$;

-- 11. Rimuovi la chiave 'photos' da app_state DOPO la migrazione riuscita
-- (sicuro: le foto sono già nella tabella dedicata)
delete from public.app_state where key = 'photos';

-- 12. Fine
-- Le foto esistenti sono ora in public.photos.
-- Il sistema app_state non contiene più la chiave 'photos'.
-- Il bucket Supabase Storage e tutte le immagini fisiche NON sono stati toccati.
