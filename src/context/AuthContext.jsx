import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Current Authenticated Profile
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOwner, setHasOwner] = useState(false);
  const [moderators, setModerators] = useState([]);
  const [invitesList, setInvitesList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch full user profile from 'profiles' table
  const fetchUserProfile = useCallback(async (userId, fallbackEmail = '') => {
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, avatar, is_active, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Error fetching profile:', error.message);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          email: data.email || fallbackEmail,
          name: data.name || 'Utente',
          role: data.role || 'user',
          avatar: data.avatar || (data.role === 'owner' ? '👑' : data.role === 'moderator' ? '🛡️' : '⛷️'),
          isActive: data.is_active !== false,
          createdAt: data.created_at
        };
      }
      return null;
    } catch (e) {
      console.warn('[Auth] Exception fetching profile:', e);
      return null;
    }
  }, []);

  // Check if an Owner exists in the system (Strict boolean from secure RPC)
  const checkOwnerStatus = useCallback(async () => {
    if (!supabase) return false;
    try {
      const { data: rpcHasOwner, error: rpcErr } = await supabase.rpc('has_owner');
      if (!rpcErr && typeof rpcHasOwner === 'boolean') {
        setHasOwner(rpcHasOwner);
        return rpcHasOwner;
      }
    } catch (e) {
      console.warn('[Auth] Error checking owner status:', e);
    }
    return false;
  }, []);

  // Load team data if authenticated as Owner or Moderator
  const loadOwnerData = useCallback(async (currentRole) => {
    if (!supabase) return;
    if (currentRole !== 'owner' && currentRole !== 'moderator') return;

    try {
      // Load all moderators
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, email, name, role, avatar, is_active, created_at')
        .eq('role', 'moderator')
        .order('created_at', { ascending: false });

      if (profs) {
        setModerators(profs.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          role: p.role,
          avatar: p.avatar,
          isActive: p.is_active !== false,
          createdAt: p.created_at
        })));
      }

      // Load invites (Owner only)
      if (currentRole === 'owner') {
        const { data: invs } = await supabase
          .from('moderator_invites')
          .select('*')
          .order('created_at', { ascending: false });

        if (invs) setInvitesList(invs);
      }

      // Load audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logs) setAuditLogs(logs);
    } catch (err) {
      console.warn('[Auth] Error loading admin datasets:', err);
    }
  }, []);

  // Helper to record an administrative action
  const recordAuditAction = useCallback(async (action, target, details) => {
    if (!supabase || !user) return;
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        actor_name: user.name,
        actor_role: user.role,
        action,
        target: target || 'Generale',
        details: details || ''
      });
    } catch (e) {
      console.warn('[Auth] Audit log insert failed:', e);
    }
  }, [user]);

  // Initial Auth Listener & Session Setup
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        await checkOwnerStatus();

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await fetchUserProfile(session.user.id, session.user.email);
          if (profile) {
            if (profile.role === 'moderator' && !profile.isActive) {
              await supabase.auth.signOut();
              setUser(null);
            } else {
              setUser(profile);
              loadOwnerData(profile.role);
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Init exception:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email);
          if (profile) {
            if (profile.role === 'moderator' && !profile.isActive) {
              await supabase.auth.signOut();
              setUser(null);
            } else {
              setUser(profile);
              loadOwnerData(profile.role);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setModerators([]);
        setInvitesList([]);
      }

      await checkOwnerStatus();
    });

    // Real-time table updates for profiles and invites
    const channel = supabase
      .channel('schema_auth_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async () => {
        await checkOwnerStatus();
        if (user) loadOwnerData(user.role);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moderator_invites' }, async () => {
        if (user?.role === 'owner') loadOwnerData('owner');
      })
      .subscribe();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [checkOwnerStatus, fetchUserProfile, loadOwnerData, user?.role]);

  // ==========================================
  // 1. INITIAL OWNER SETUP (Supabase Auth + Atomic Database RPC)
  // ==========================================
  const setupInitialOwner = async ({ name, email, password, confirmPassword }) => {
    if (!supabase) return { success: false, error: 'Database Supabase non configurato.' };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    if (!cleanName) return { success: false, error: 'Inserisci il tuo nome e cognome.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Inserisci un indirizzo email valido.' };
    if (cleanPass.length < 6) return { success: false, error: 'La password deve avere almeno 6 caratteri.' };
    if (cleanPass !== confirmPassword) return { success: false, error: 'Le password inserite non coincidono.' };

    // 1. Pre-check: verify NO Owner exists
    const alreadyHasOwner = await checkOwnerStatus();
    if (alreadyHasOwner) {
      return {
        success: false,
        error: 'BLOCCATO: Un account OWNER è già stato registrato nel database. La procedura è disabilitata.'
      };
    }

    try {
      // 2. Register via Supabase Authentication
      let currentSession = null;
      let currentUser = null;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { name: cleanName }
        }
      });

      if (authError) {
        const errorMsg = (authError.message || '').toLowerCase();
        // If user already exists in auth.users, perform login
        if (errorMsg.includes('already') || errorMsg.includes('registered') || errorMsg.includes('exists')) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });
          if (signInErr) {
            return {
              success: false,
              error: 'Questa email è già registrata in Supabase Auth. Verifica la password inserita o effettua il login.'
            };
          }
          currentSession = signInData.session;
          currentUser = signInData.user;
        } else {
          return { success: false, error: authError.message };
        }
      } else {
        // If Supabase returned empty identities (user already registered in email-confirmation mode)
        if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });
          if (signInErr) {
            return {
              success: false,
              error: 'Questa email è già registrata in Supabase Auth. Inserisci la password corretta per accedere.'
            };
          }
          currentSession = signInData.session;
          currentUser = signInData.user;
        } else {
          currentSession = authData?.session || null;
          currentUser = authData?.user || null;
        }
      }

      // 3. Verify session explicitly
      if (!currentSession) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentSession = sessionData?.session || null;
        if (sessionData?.session?.user) {
          currentUser = sessionData.session.user;
        }
      }

      // 4. If no session is available (e.g. Supabase requires email verification)
      if (!currentSession || !currentUser) {
        return {
          success: false,
          requiresVerification: true,
          error: `Registrazione completata! Per motivi di sicurezza Supabase richiede la verifica dell'email: controlla la tua casella di posta (${cleanEmail}), clicca sul link di conferma e poi effettua il login per attivare l'account OWNER.`
        };
      }

      // 5. Promote to 'owner' via secure atomic database RPC (uses auth.uid() from verified session)
      const { error: rpcError } = await supabase.rpc('setup_initial_owner', {
        p_name: cleanName
      });

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }

      // 6. Fetch and update session profile state
      const dbProfile = await fetchUserProfile(currentUser.id, currentUser.email || cleanEmail);
      const ownerProfile = dbProfile || {
        id: currentUser.id,
        email: cleanEmail,
        name: cleanName,
        role: 'owner',
        avatar: '👑',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      setUser(ownerProfile);
      setHasOwner(true);
      await loadOwnerData('owner');
      recordAuditAction('INITIAL_OWNER_SETUP', cleanEmail, 'Primo account OWNER configurato con successo.');

      return { success: true, user: ownerProfile };
    } catch (err) {
      return { success: false, error: err.message || 'Errore durante il setup del primo Owner.' };
    }
  };

  // ==========================================
  // 2. STANDARD LOGIN (Supabase Auth: Email + Password)
  // ==========================================
  const login = async (emailOrUsername, password) => {
    if (!supabase) return { success: false, error: 'Database Supabase non configurato.' };

    const cleanEmail = (emailOrUsername || '').trim().toLowerCase();
    const cleanPass = password || '';

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Inserisci email e password.' };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (authError) {
        return {
          success: false,
          error: authError.message.includes('Invalid login')
            ? 'Credenziali non corrette. Verifica email e password.'
            : authError.message
        };
      }

      if (!authData?.user) {
        return { success: false, error: 'Nessun utente trovato.' };
      }

      // Se non esiste ancora un Owner nel database (es. l'utente si era registrato e ha appena confermato l'email),
      // promuovi automaticamente questo primo utente autenticato a Owner tramite setup_initial_owner
      const isOwnerRegistered = await checkOwnerStatus();
      if (!isOwnerRegistered) {
        const ownerName = authData.user.user_metadata?.name || 'Owner';
        const { error: rpcErr } = await supabase.rpc('setup_initial_owner', {
          p_name: ownerName
        });
        if (!rpcErr) {
          setHasOwner(true);
        }
      }

      let profile = await fetchUserProfile(authData.user.id, authData.user.email);
      if (!profile) {
        return { success: false, error: 'Profilo utente non trovato nel database.' };
      }

      if (profile.role === 'moderator' && !profile.isActive) {
        await supabase.auth.signOut();
        return { success: false, error: 'Questo account moderatore è stato disattivato dall\'Owner.' };
      }

      setUser(profile);
      loadOwnerData(profile.role);

      recordAuditAction('LOGIN', 'Pannello Gestione', `Accesso effettuato con ruolo ${profile.role.toUpperCase()}`);

      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message || 'Errore durante il login.' };
    }
  };

  // ==========================================
  // 3. PUBLIC REGISTRATION (Strictly creates 'user')
  // ==========================================
  const register = async (name, email, password) => {
    if (!supabase) return { success: false, error: 'Database Supabase non configurato.' };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    if (!cleanName) return { success: false, error: 'Inserisci il tuo nome.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Inserisci un indirizzo email valido.' };
    if (cleanPass.length < 6) return { success: false, error: 'La password deve avere almeno 6 caratteri.' };

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { name: cleanName }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const sessionUser = {
        id: authData.user.id,
        email: cleanEmail,
        name: cleanName,
        role: 'user', // strictly 'user'
        avatar: '⛷️',
        isActive: true
      };

      setUser(sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message || 'Errore durante la registrazione.' };
    }
  };

  // ==========================================
  // 4. VERIFY & REGISTER MODERATOR VIA INVITE
  // ==========================================
  const verifyInviteToken = useCallback(async (rawToken) => {
    if (!supabase || !rawToken) return { valid: false, error: 'Inserisci il codice invito.' };

    const cleanToken = rawToken.trim().toUpperCase();
    try {
      const { data: invite, error } = await supabase
        .from('moderator_invites')
        .select('*')
        .eq('token', cleanToken)
        .maybeSingle();

      if (error || !invite) {
        return { valid: false, error: 'Codice invito non valido o inesistente.' };
      }

      if (invite.status === 'used') {
        return { valid: false, error: 'Questo codice invito è già stato utilizzato.' };
      }

      if (invite.status === 'revoked') {
        return { valid: false, error: 'Questo codice invito è stato revocato dall\'Owner.' };
      }

      if (new Date(invite.expires_at) < new Date()) {
        return { valid: false, error: 'Questo codice invito è scaduto. Richiedine uno nuovo all\'Owner.' };
      }

      return { valid: true, invite };
    } catch (err) {
      return { valid: false, error: 'Errore durante la verifica del codice.' };
    }
  }, []);

  const registerWithInvite = async ({ token, name, email, password }) => {
    if (!supabase) return { success: false, error: 'Database Supabase non configurato.' };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';
    const cleanToken = (token || '').trim().toUpperCase();

    if (!cleanName) return { success: false, error: 'Inserisci il tuo nome.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Inserisci un indirizzo email valido.' };
    if (cleanPass.length < 6) return { success: false, error: 'La password deve avere almeno 6 caratteri.' };

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: { data: { name: cleanName } }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });
          if (signInErr) return { success: false, error: 'Email già registrata con altra password.' };
        } else {
          return { success: false, error: authError.message };
        }
      }

      // Elevate strictly to moderator via DB RPC (uses auth.uid() automatically)
      const { error: rpcErr } = await supabase.rpc('register_moderator_with_invite', {
        p_name: cleanName,
        p_token: cleanToken
      });

      if (rpcErr) {
        return { success: false, error: rpcErr.message };
      }

      const modProfile = {
        id: authData?.user?.id,
        email: cleanEmail,
        name: cleanName,
        role: 'moderator',
        avatar: '🛡️',
        isActive: true
      };

      setUser(modProfile);
      return { success: true, user: modProfile };
    } catch (err) {
      return { success: false, error: err.message || 'Errore attivazione moderatore.' };
    }
  };

  // ==========================================
  // 5. OWNER: EMIT & MANAGE INVITES VIA SECURE RPC
  // ==========================================
  const createModeratorInvite = async (emailToInvite = '', note = '') => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    if (!supabase) return { success: false, error: 'Supabase non pronto.' };

    const cleanEmail = (emailToInvite || '').trim().toLowerCase();
    try {
      const { data, error } = await supabase.rpc('create_moderator_invite', {
        p_email: cleanEmail,
        p_note: note || ''
      });

      if (error) return { success: false, error: error.message };

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const inviteLink = `${origin}/?invite=${data.token}`;

      if (data.invite) {
        setInvitesList(prev => [data.invite, ...prev]);
      }

      return { success: true, invite: data.invite, token: data.token, inviteLink };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const revokeModeratorInvite = async (inviteId) => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    try {
      const { error } = await supabase.rpc('revoke_moderator_invite', {
        p_invite_id: inviteId
      });

      if (error) return { success: false, error: error.message };
      setInvitesList(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'revoked' } : i));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // 6. OWNER: MANAGE MODERATORS VIA SECURE RPC
  // ==========================================
  const deactivateModerator = async (modId) => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    try {
      const { error } = await supabase.rpc('toggle_moderator_status', {
        p_mod_id: modId,
        p_active: false
      });

      if (error) return { success: false, error: error.message };
      setModerators(prev => prev.map(m => m.id === modId ? { ...m, isActive: false } : m));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const activateModerator = async (modId) => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    try {
      const { error } = await supabase.rpc('toggle_moderator_status', {
        p_mod_id: modId,
        p_active: true
      });

      if (error) return { success: false, error: error.message };
      setModerators(prev => prev.map(m => m.id === modId ? { ...m, isActive: true } : m));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeModerator = async (modId) => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    try {
      const { error } = await supabase.rpc('remove_moderator', {
        p_mod_id: modId
      });

      if (error) return { success: false, error: error.message };
      setModerators(prev => prev.filter(m => m.id !== modId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateSuperAdminProfile = async ({ name, password }) => {
    if (user?.role !== 'owner') return { success: false, error: 'Riservato all\'Owner.' };
    try {
      if (name) {
        const { error: rpcErr } = await supabase.rpc('update_my_profile', {
          p_name: name
        });
        if (rpcErr) return { success: false, error: rpcErr.message };
      }
      if (password && password.length >= 6) {
        await supabase.auth.updateUser({ password });
      }

      setUser(prev => ({ ...prev, name: name || prev.name }));
      recordAuditAction('MODIFICA_PROFILO_OWNER', user.email, 'Credenziali Owner aggiornate');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // 7. PASSWORD RESET (Supabase Auth Official Email Reset)
  // ==========================================
  const requestPasswordReset = async (email) => {
    if (!supabase) return { success: false, error: 'Supabase non pronto.' };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'Inserisci la tua email.' };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin
      });

      if (error) return { success: false, error: error.message };

      recordAuditAction('RICHIESTA_RESET_PASSWORD', cleanEmail, 'Inviata email di reset password');
      return {
        success: true,
        email: cleanEmail,
        message: `Email di recupero inviata a ${cleanEmail}! Controlla la tua casella di posta.`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // 8. LOGOUT
  // ==========================================
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const isOwner = user?.role === 'owner';
  const isModerator = (user?.role === 'moderator' && user?.isActive !== false);
  const canManage = isOwner || isModerator;
  const canManageTeam = isOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasOwner,
        isOwner,
        isModerator,
        canManage,
        canManageTeam,
        isAdmin: canManage,
        isAuthenticated: !!user,
        moderators,
        invitesList,
        auditLogs,
        setupInitialOwner,
        login,
        register,
        verifyInviteToken,
        registerWithInvite,
        createModeratorInvite,
        revokeModeratorInvite,
        deactivateModerator,
        activateModerator,
        removeModerator,
        updateSuperAdminProfile,
        requestPasswordReset,
        recordAuditAction,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
