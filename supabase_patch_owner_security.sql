-- ==============================================================================
-- HEETS ALCOL TIME — PATCH: SICUREZZA OWNER GLOBALE & UNICITÀ RUOLI
-- Esegui questo script nel "SQL Editor" di Supabase e premi "Run".
--
-- OBIETTIVO:
-- 1. Garantire che la verifica "has_owner" sia accessibile globalmente a TUTTI i dispositivi (anon & auth).
-- 2. Bloccare rigorosamente la creazione di un secondo Owner se ne esiste già uno.
-- 3. Mantenere sincronizzato lo stato in app_state ('system_status') per lettura pubblica istantanea.
-- 4. NON distrugge NESSUN dato, account, foto o configurazione esistente.
-- ==============================================================================

-- 1. Funzione has_owner() potenziata (SECURITY DEFINER + STABLE)
create or replace function public.has_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where role = 'owner' and is_active = true
  );
$$;

-- 2. Permessi di esecuzione espliciti per anon, authenticated e service_role
grant execute on function public.has_owner() to anon, authenticated, service_role;
grant execute on function public.verify_invite_token(text) to anon, authenticated, service_role;
grant execute on function public.is_admin_or_moderator() to anon, authenticated, service_role;
grant execute on function public.setup_initial_owner(text) to authenticated, service_role;

-- 3. Inizializzazione / Aggiornamento record 'system_status' in app_state
insert into public.app_state (key, value, updated_at)
values (
  'system_status',
  jsonb_build_object(
    'has_owner', exists (select 1 from public.profiles where role = 'owner' and is_active = true),
    'updated_at', now()
  ),
  now()
)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();

-- 4. Trigger automatico per sincronizzare 'system_status' in tempo reale su qualsiasi modifica profili
create or replace function public.sync_owner_system_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_state (key, value, updated_at)
  values (
    'system_status',
    jsonb_build_object(
      'has_owner', exists (select 1 from public.profiles where role = 'owner' and is_active = true),
      'updated_at', now()
    ),
    now()
  )
  on conflict (key) do update set
    value = excluded.value,
    updated_at = now();
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_profiles_sync_system_status on public.profiles;
create trigger on_profiles_sync_system_status
  after insert or update or delete on public.profiles
  for each statement execute function public.sync_owner_system_status();

-- 5. Rafforzamento setup_initial_owner con blocco atomico invalicabile
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

  -- Lock atomico contro race condition
  perform pg_advisory_xact_lock(hashtext('heets_initial_owner_lock'));

  select count(*) into v_owner_count from public.profiles where role = 'owner' and is_active = true;
  if v_owner_count > 0 then
    raise exception 'BLOCCATO: Un account OWNER è già stato registrato ed è attivo nel sistema. Impossibile creare un secondo Owner.';
  end if;

  -- Recupera email da auth.users
  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'Utente auth non trovato.';
  end if;

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

  -- Registra nel log di audit
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
