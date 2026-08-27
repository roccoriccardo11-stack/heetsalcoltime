-- ==============================================================================
-- HEETS ALCOL TIME — SCHEMA SUPABASE DEFINITIVO E BLINDATO
-- Esegui questo script nel "SQL Editor" di Supabase e premi "Run".
-- ==============================================================================

-- 1. Tabella PROFILES (Collegata ad auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('user', 'moderator', 'owner')) default 'user',
  avatar text default '⛷️',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabella MODERATOR_INVITES
create table if not exists public.moderator_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  note text default '',
  invited_by uuid references auth.users(id) on delete set null,
  status text not null check (status in ('pending', 'used', 'revoked', 'expired')) default 'pending',
  expires_at timestamptz not null default (now() + interval '72 hours'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Tabella AUDIT_LOGS (Immutabile)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  target text default '',
  details text default '',
  created_at timestamptz not null default now()
);

-- 4. Tabella APP_STATE (Contenuti sito non sensibili: eventi, foto, testi)
create table if not exists public.app_state (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- PROTEZIONE RIGIDA: TRIGGER CONTRO MODIFICA DIRETTA DEI RUOLI
-- ==============================================================================

create or replace function public.prevent_direct_role_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Se il ruolo viene modificato, consenti SOLO se l'operazione avviene all'interno di una RPC autorizzata
  if new.role is distinct from old.role then
    if current_setting('heets.allow_role_change', true) is distinct from 'true' then
      raise exception 'SICUREZZA: Non è consentito modificare il ruolo direttamente dal client.';
    end if;
  end if;

  -- Impedisci modifica diretta di id ed email
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'SICUREZZA: Non è consentito modificare id o email.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_profiles_role_protect on public.profiles;
create trigger on_profiles_role_protect
  before update on public.profiles
  for each row execute function public.prevent_direct_role_tampering();

-- ==============================================================================
-- FUNZIONI RPC PROTETTE (SECURITY DEFINER)
-- ==============================================================================

-- 1. Verifica esistenza Owner (Restituisce SOLO true/false senza esporre dati)
create or replace function public.has_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where role = 'owner'
  );
$$;

-- 2. INITIAL OWNER SETUP (Atomico, verifica auth.uid() e blocca per sempre qualsiasi secondo owner)
create or replace function public.setup_initial_owner(
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_owner_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autenticato: esegui prima la registrazione/login in Supabase Auth.';
  end if;

  -- Lock atomico per evitare race condition tra più richieste contemporanee
  perform pg_advisory_xact_lock(hashtext('heets_initial_owner_lock'));

  select count(*) into v_owner_count from public.profiles where role = 'owner';
  if v_owner_count > 0 then
    raise exception 'BLOCCATO: Un account OWNER è già stato registrato ed è attivo nel sistema.';
  end if;

  -- Recupera email verificata da auth.users
  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'Utente auth non trovato.';
  end if;

  -- Abilita temporaneamente il flag per la stored procedure
  perform set_config('heets.allow_role_change', 'true', true);

  insert into public.profiles (id, email, name, role, avatar, is_active, updated_at)
  values (v_user_id, lower(trim(v_email)), trim(p_name), 'owner', '👑', true, now())
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = 'owner',
    avatar = '👑',
    is_active = true,
    updated_at = now();

  -- Registra nel log di sicurezza
  insert into public.audit_logs (actor_id, actor_email, actor_name, actor_role, action, target, details)
  values (
    v_user_id,
    lower(trim(v_email)),
    trim(p_name),
    'owner',
    'INITIAL_OWNER_SETUP_COMPLETATO',
    'Sistema Ruoli',
    'Creato il primo account OWNER. Setup iniziale completato e disabilitato per sempre.'
  );

  return jsonb_build_object('success', true, 'message', 'Account OWNER configurato con successo');
end;
$$;

-- 3. REGISTRAZIONE MODERATORE TRAMITE INVITO MONOUSO
create or replace function public.register_moderator_with_invite(
  p_name text,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_invite record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autenticato: esegui prima la registrazione/login in Supabase Auth.';
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'Utente auth non trovato.';
  end if;

  -- Verifica invito con lock riga
  select * into v_invite
  from public.moderator_invites
  where upper(trim(token)) = upper(trim(p_token))
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Codice invito non valido, già utilizzato o scaduto.';
  end if;

  -- Se l'invito era vincolato a una email, verifica coincidenza
  if v_invite.email is not null 
     and v_invite.email <> '' 
     and v_invite.email <> 'Qualsiasi email autorizzata' 
     and lower(trim(v_invite.email)) <> lower(trim(v_email)) then
    raise exception 'Questo codice invito è riservato a un altro indirizzo email (%s).', v_invite.email;
  end if;

  -- Marca l'invito come utilizzato
  update public.moderator_invites
  set status = 'used',
      used_at = now(),
      used_by = v_user_id
  where id = v_invite.id;

  -- Abilita temporaneamente il flag per la stored procedure
  perform set_config('heets.allow_role_change', 'true', true);

  -- Assegna SEMPRE e SOLO 'moderator'
  insert into public.profiles (id, email, name, role, avatar, is_active, updated_at)
  values (v_user_id, lower(trim(v_email)), trim(p_name), 'moderator', '🛡️', true, now())
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = 'moderator',
    avatar = '🛡️',
    is_active = true,
    updated_at = now();

  insert into public.audit_logs (actor_id, actor_email, actor_name, actor_role, action, target, details)
  values (
    v_user_id,
    lower(trim(v_email)),
    trim(p_name),
    'moderator',
    'ATTIVAZIONE_MODERATORE',
    lower(trim(v_email)),
    format('Moderatore attivato con codice %s', v_invite.token)
  );

  return jsonb_build_object('success', true, 'message', 'Account Moderatore attivato con successo');
end;
$$;

-- 4. AGGIORNAMENTO PROFILO SICURO (Modifica SOLO name e avatar, non tocca mai role/is_active)
create or replace function public.update_my_profile(
  p_name text,
  p_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autenticato.';
  end if;

  update public.profiles
  set name = coalesce(nullif(trim(p_name), ''), name),
      avatar = coalesce(p_avatar, avatar),
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 5. CREAZIONE INVITO MODERATORE (Riservato esclusivamente all'Owner)
create or replace function public.create_moderator_invite(
  p_email text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role text;
  v_token text;
  v_new_invite record;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i int;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Non autenticato.';
  end if;

  select role into v_caller_role from public.profiles where id = v_caller_id and is_active = true;
  if v_caller_role <> 'owner' then
    raise exception 'Accesso negato: solo l''Owner può emettere codici invito.';
  end if;

  -- Genera codice tipo MOD-XXXXXX
  v_token := 'MOD-';
  for v_i in 1..6 loop
    v_token := v_token || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  end loop;

  insert into public.moderator_invites (email, token, note, invited_by, status, expires_at)
  values (
    coalesce(nullif(lower(trim(p_email)), ''), 'Qualsiasi email autorizzata'),
    v_token,
    trim(p_note),
    v_caller_id,
    'pending',
    now() + interval '72 hours'
  )
  returning * into v_new_invite;

  insert into public.audit_logs (actor_id, actor_email, actor_name, actor_role, action, target, details)
  values (
    v_caller_id,
    (select email from public.profiles where id = v_caller_id),
    (select name from public.profiles where id = v_caller_id),
    'owner',
    'EMISSIONE_INVITO_MODERATORE',
    v_new_invite.email,
    format('Owner ha emesso il codice %s con scadenza 72h', v_token)
  );

  return jsonb_build_object(
    'success', true,
    'invite', row_to_json(v_new_invite),
    'token', v_token
  );
end;
$$;

-- 6. REVOCA INVITO MODERATORE (Riservato all'Owner)
create or replace function public.revoke_moderator_invite(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role text;
begin
  v_caller_id := auth.uid();
  select role into v_caller_role from public.profiles where id = v_caller_id and is_active = true;
  if v_caller_role <> 'owner' then
    raise exception 'Accesso negato: solo l''Owner può revocare codici invito.';
  end if;

  update public.moderator_invites
  set status = 'revoked'
  where id = p_invite_id and status = 'pending';

  return jsonb_build_object('success', true);
end;
$$;

-- 7. GESTIONE STATO MODERATORE: Disattiva / Riattiva (Riservato all'Owner)
create or replace function public.toggle_moderator_status(
  p_mod_id uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role text;
  v_target_role text;
begin
  v_caller_id := auth.uid();
  select role into v_caller_role from public.profiles where id = v_caller_id and is_active = true;
  if v_caller_role <> 'owner' then
    raise exception 'Accesso negato: solo l''Owner può modificare lo stato dei moderatori.';
  end if;

  select role into v_target_role from public.profiles where id = p_mod_id;
  if v_target_role <> 'moderator' then
    raise exception 'Operazione consentita solo su account con ruolo moderatore.';
  end if;

  update public.profiles
  set is_active = p_active,
      updated_at = now()
  where id = p_mod_id;

  insert into public.audit_logs (actor_id, actor_email, actor_name, actor_role, action, target, details)
  values (
    v_caller_id,
    (select email from public.profiles where id = v_caller_id),
    (select name from public.profiles where id = v_caller_id),
    'owner',
    case when p_active then 'RIATTIVA_MODERATORE' else 'DISATTIVA_MODERATORE' end,
    (select email from public.profiles where id = p_mod_id),
    format('Owner ha impostato is_active = %s per il moderatore %s', p_active, p_mod_id)
  );

  return jsonb_build_object('success', true);
end;
$$;

-- 8. RIMOZIONE DEFINITIVA MODERATORE (Riservato all'Owner)
create or replace function public.remove_moderator(
  p_mod_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role text;
  v_target_role text;
  v_target_email text;
begin
  v_caller_id := auth.uid();
  select role into v_caller_role from public.profiles where id = v_caller_id and is_active = true;
  if v_caller_role <> 'owner' then
    raise exception 'Accesso negato: solo l''Owner può eliminare moderatori.';
  end if;

  select role, email into v_target_role, v_target_email from public.profiles where id = p_mod_id;
  if v_target_role <> 'moderator' then
    raise exception 'Impossibile eliminare: il profilo non è un moderatore.';
  end if;

  delete from public.profiles where id = p_mod_id;

  insert into public.audit_logs (actor_id, actor_email, actor_name, actor_role, action, target, details)
  values (
    v_caller_id,
    (select email from public.profiles where id = v_caller_id),
    (select name from public.profiles where id = v_caller_id),
    'owner',
    'ELIMINA_MODERATORE',
    v_target_email,
    format('Owner ha eliminato dal team il moderatore %s', v_target_email)
  );

  return jsonb_build_object('success', true);
end;
$$;

-- 9. REGISTRAZIONE PUBBLICA: Trigger automatico su auth.users (Crea SEMPRE role = 'user')
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- Inserisce il profilo con role = 'user' se non esiste già
  insert into public.profiles (id, email, name, role, avatar, is_active)
  values (new.id, lower(new.email), v_name, 'user', '⛷️', true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ==============================================================================
-- HELPER FUNCTIONS SECURITY DEFINER PER RLS (Evitano ricorsione infinita)
-- ==============================================================================

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and is_active = true
  );
$$;

create or replace function public.is_admin_or_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'moderator') and is_active = true
  );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) SICURE, RIGIDE E SENZA RICORSIONE
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.moderator_invites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_state enable row level security;

-- PROFILES:
-- 1. Ogni utente può SEMPRE leggere il proprio profilo (senza ricorsione)
drop policy if exists "Users can read profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 2. Owner e Moderatori attivi possono leggere tutti i profili
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin_or_moderator());

-- MODERATOR_INVITES (Solo Owner può leggere e gestire inviti)
drop policy if exists "Only Owner can access moderator_invites" on public.moderator_invites;
create policy "Only Owner can access moderator_invites"
  on public.moderator_invites for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- AUDIT_LOGS (Lettura per Owner/Moderator, scrittura per utenti autenticati)
drop policy if exists "Audit logs read for Owner and Moderator" on public.audit_logs;
drop policy if exists "Audit logs insert for authenticated" on public.audit_logs;

create policy "Audit logs read for Owner and Moderator"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin_or_moderator());

create policy "Audit logs insert for authenticated"
  on public.audit_logs for insert
  to authenticated
  with check (auth.uid() = actor_id);

-- APP_STATE (Lettura pubblica, modifica SOLO Owner e Moderator attivi)
drop policy if exists "Anyone can read app_state" on public.app_state;
create policy "Anyone can read app_state"
  on public.app_state for select
  using (true);

drop policy if exists "Only Owner/Moderator can modify app_state" on public.app_state;
create policy "Only Owner/Moderator can modify app_state"
  on public.app_state for all
  to authenticated
  using (public.is_admin_or_moderator())
  with check (public.is_admin_or_moderator());

-- ==============================================================================
-- AUTO-RIPARAZIONE & SINCRONIZZAZIONE PROFILI ESISTENTI (Non distruttiva)
-- ==============================================================================
-- Assicura che qualsiasi utente presente in auth.users abbia una riga corrispondente in public.profiles
insert into public.profiles (id, email, name, role, avatar, is_active, created_at, updated_at)
select 
  u.id,
  lower(trim(u.email)),
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Utente'),
  'user',
  '⛷️',
  true,
  coalesce(u.created_at, now()),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ==============================================================================
-- PUBBLICAZIONE REALTIME
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.moderator_invites;
alter publication supabase_realtime add table public.audit_logs;
alter publication supabase_realtime add table public.app_state;

-- ==============================================================================
-- 10. VERIFICA INVITO MONOUSO (SECURITY DEFINER)
-- ==============================================================================
create or replace function public.verify_invite_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_clean_token text;
begin
  v_clean_token := upper(trim(p_token));

  if v_clean_token is null or v_clean_token = '' then
    return jsonb_build_object('valid', false, 'error', 'Inserisci il codice invito.');
  end if;

  select * into v_invite
  from public.moderator_invites
  where upper(trim(token)) = v_clean_token;

  if not found then
    return jsonb_build_object('valid', false, 'error', 'Codice invito non valido o inesistente.');
  end if;

  if v_invite.status = 'used' then
    return jsonb_build_object('valid', false, 'error', 'Questo codice invito è già stato utilizzato.');
  end if;

  if v_invite.status = 'revoked' then
    return jsonb_build_object('valid', false, 'error', 'Questo codice invito è stato revocato dall''Owner.');
  end if;

  if v_invite.expires_at < now() then
    return jsonb_build_object('valid', false, 'error', 'Questo codice invito è scaduto. Richiedine uno nuovo all''Owner.');
  end if;

  return jsonb_build_object(
    'valid', true,
    'invite', jsonb_build_object(
      'id', v_invite.id,
      'email', v_invite.email,
      'token', v_invite.token,
      'note', v_invite.note,
      'status', v_invite.status,
      'expires_at', v_invite.expires_at
    )
  );
end;
$$;

-- ==============================================================================
-- STORAGE CONFIGURATION (event-images)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Public read event images" on storage.objects;
drop policy if exists "Auth upload event images" on storage.objects;
drop policy if exists "Auth update event images" on storage.objects;
drop policy if exists "Auth delete event images" on storage.objects;

create policy "Public read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "Auth upload event images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

create policy "Auth update event images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

create policy "Auth delete event images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

-- ==============================================================================
-- STORAGE CONFIGURATION (event-videos)
-- ==============================================================================
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

drop policy if exists "Public read event videos" on storage.objects;
drop policy if exists "Auth upload event videos" on storage.objects;
drop policy if exists "Auth update event videos" on storage.objects;
drop policy if exists "Auth delete event videos" on storage.objects;

create policy "Public read event videos"
  on storage.objects for select
  using (bucket_id = 'event-videos');

create policy "Auth upload event videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );

create policy "Auth update event videos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );

create policy "Auth delete event videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-videos'
    and public.is_admin_or_moderator()
  );



