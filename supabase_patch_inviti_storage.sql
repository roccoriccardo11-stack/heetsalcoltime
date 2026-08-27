-- ==============================================================================
-- HEETS ALCOL TIME — PATCH: INVITI + STORAGE IMMAGINI
-- ==============================================================================
-- ESEGUI QUESTO SCRIPT nel "SQL Editor" di Supabase → premi "Run".
-- NON elimina tabelle, utenti, dati o account Owner.
-- ==============================================================================

-- ==============================================================================
-- 1. NUOVA FUNZIONE RPC: verify_invite_token
-- ==============================================================================
-- Permette a QUALSIASI utente autenticato di verificare un codice invito
-- senza che la RLS (che limita moderator_invites al solo Owner) lo blocchi.
-- Restituisce SOLO i dati necessari, non espone informazioni sensibili.

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

  -- Restituisci solo i dati non sensibili necessari per la registrazione
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
-- 2. BUCKET SUPABASE STORAGE: event-images
-- ==============================================================================
-- Crea il bucket per le immagini degli eventi (pubblico in lettura).
-- Se il bucket esiste già, questo comando viene ignorato.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ==============================================================================
-- 3. POLICY STORAGE: event-images
-- ==============================================================================
-- Lettura pubblica (le immagini degli eventi devono essere visibili a tutti)
-- Upload e gestione riservati a Owner e Moderator autenticati

-- Pulizia policy precedenti per evitare conflitti
drop policy if exists "Public read event images" on storage.objects;
drop policy if exists "Auth upload event images" on storage.objects;
drop policy if exists "Auth update event images" on storage.objects;
drop policy if exists "Auth delete event images" on storage.objects;

-- 3a. Lettura pubblica
create policy "Public read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

-- 3b. Upload (solo Owner/Moderator autenticati)
create policy "Auth upload event images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

-- 3c. Aggiornamento (solo Owner/Moderator autenticati)
create policy "Auth update event images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

-- 3d. Eliminazione (solo Owner/Moderator autenticati)
create policy "Auth delete event images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.is_admin_or_moderator()
  );

-- ==============================================================================
-- FINE PATCH
-- ==============================================================================
-- Dopo l'esecuzione:
-- ✅ La funzione verify_invite_token è attiva
-- ✅ Il bucket event-images è creato
-- ✅ Le policy Storage sono configurate
-- ✅ Nessuna tabella, dato o utente è stato eliminato
-- ==============================================================================
