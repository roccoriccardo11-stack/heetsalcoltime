-- ==============================================================================
-- HEETS ALCOL TIME — PATCH: AGGIORNAMENTO GESTIONE HOME & INVITI MODERATORE
-- ==============================================================================
-- Esegui questo script nel "SQL Editor" di Supabase e premi "Run".
-- NON elimina tabelle, utenti, dati o account Owner esistenti.
-- ==============================================================================

-- 1. Aggiornamento Stored Procedure create_moderator_invite
-- Consente sia all'Owner sia ai Moderatori attivi di emettere inviti per nuovi collaboratori.
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
  v_caller_email text;
  v_caller_name text;
  v_token text;
  v_new_invite record;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i int;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Non autenticato.';
  end if;

  select role, email, name into v_caller_role, v_caller_email, v_caller_name
  from public.profiles
  where id = v_caller_id and is_active = true;

  if v_caller_role not in ('owner', 'moderator') then
    raise exception 'Accesso negato: operazione riservata ad Owner e Moderatori autorizzati.';
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
    v_caller_email,
    v_caller_name,
    v_caller_role,
    'EMISSIONE_INVITO_MODERATORE',
    v_new_invite.email,
    format('%s (%s) ha emesso il codice invito %s con scadenza 72h', v_caller_name, v_caller_role, v_token)
  );

  return jsonb_build_object(
    'success', true,
    'invite', row_to_json(v_new_invite),
    'token', v_token
  );
end;
$$;

-- 2. Aggiornamento Stored Procedure revoke_moderator_invite
-- Consente a Owner e Moderatori attivi di revocare un codice invito non ancora utilizzato.
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
  if v_caller_role not in ('owner', 'moderator') then
    raise exception 'Accesso negato: operazione riservata ad Owner e Moderatori autorizzati.';
  end if;

  update public.moderator_invites
  set status = 'revoked'
  where id = p_invite_id and status = 'pending';

  return jsonb_build_object('success', true);
end;
$$;

-- 3. Aggiornamento Policy RLS per moderator_invites
-- Permette sia ad Owner sia a Moderatori attivi di consultare e gestire la lista degli inviti.
drop policy if exists "Only Owner can access moderator_invites" on public.moderator_invites;
drop policy if exists "Admins can access moderator_invites" on public.moderator_invites;

create policy "Admins can access moderator_invites"
  on public.moderator_invites for all
  to authenticated
  using (public.is_admin_or_moderator())
  with check (public.is_admin_or_moderator());

-- 4. Assicura policy per storage bucket 'category-images'
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

drop policy if exists "Public read category images" on storage.objects;
drop policy if exists "Auth upload category images" on storage.objects;
drop policy if exists "Auth update category images" on storage.objects;
drop policy if exists "Auth delete category images" on storage.objects;

create policy "Public read category images"
  on storage.objects for select
  using (bucket_id = 'category-images');

create policy "Auth upload category images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );

create policy "Auth update category images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );

create policy "Auth delete category images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'category-images'
    and public.is_admin_or_moderator()
  );

-- ==============================================================================
-- FINE PATCH
-- ==============================================================================
