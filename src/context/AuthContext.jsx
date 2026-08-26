import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_USERS } from '../data/initialData';

const AuthContext = createContext();

const STORAGE_KEY = 'heets_auth_user_v3';
const USERS_STORAGE_KEY = 'heets_registered_users_v3';
const INVITES_STORAGE_KEY = 'heets_moderator_invites_v3';
const AUDIT_STORAGE_KEY = 'heets_audit_logs_v3';

// Generate human-friendly yet unpredictable invite codes (e.g., MOD-7X9K2)
const generateSecureToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MOD-${randomPart}`;
};

export const AuthProvider = ({ children }) => {
  // 1. Current Session User
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Persistent Users Database (Initial contains ONLY SuperAdmin)
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // 3. Persistent Moderator Invites Database
  const [invitesList, setInvitesList] = useState(() => {
    try {
      const saved = localStorage.getItem(INVITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Audit Log System (History of Moderator / SuperAdmin Actions)
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        actorEmail: 'admin@heets.it',
        actorName: 'SuperAdmin Heets',
        actorRole: 'owner',
        action: 'INIZIALIZZAZIONE_SUPERADMIN',
        target: 'Sistema Ruoli',
        details: 'Configurato account SuperAdmin. Nessun moderatore predefinito attivo.'
      }
    ];
  });

  // Sync state to persistent storage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invitesList));
  }, [invitesList]);

  useEffect(() => {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Real-time security verification: Check if current active session user is deactivated
  useEffect(() => {
    if (user) {
      const currentInDb = usersList.find(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (!currentInDb) {
        // User was removed from database
        setUser(null);
      } else if (currentInDb.role === 'moderator' && currentInDb.isActive === false) {
        // Moderator was deactivated by SuperAdmin -> immediate revocation of access
        setUser(null);
      } else if (currentInDb.role !== user.role) {
        // Role was updated in DB
        setUser(prev => ({ ...prev, role: currentInDb.role }));
      }
    }
  }, [usersList, user]);

  // Helper to record an administrative action in the Audit Log
  const recordAuditAction = useCallback((action, target, details) => {
    const actor = user || { email: 'admin@heets.it', name: 'SuperAdmin', role: 'owner' };
    const newEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      target: target || 'Generale',
      details: details || ''
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  }, [user]);

  // Public / SuperAdmin Login
  const login = (emailOrUsername, password) => {
    const cleanInput = emailOrUsername.trim().toLowerCase();

    // Check direct SuperAdmin shorthand ('admin' / 'admin' or 'owner' / 'owner')
    if ((cleanInput === 'admin' && password === 'admin') || (cleanInput === 'owner' && password === 'owner')) {
      const superAdmin = usersList.find(u => u.role === 'owner') || INITIAL_USERS[0];
      const sessionUser = {
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'owner',
        avatar: '👑',
        isActive: true
      };
      setUser(sessionUser);
      recordAuditAction('LOGIN_SUPERADMIN', 'Pannello di Controllo', 'Accesso SuperAdmin effettuato');
      return { success: true, user: sessionUser };
    }

    const found = usersList.find(
      u => u.email.toLowerCase() === cleanInput && u.password === password
    );

    if (found) {
      // Check if moderator is deactivated
      if (found.role === 'moderator' && found.isActive === false) {
        return {
          success: false,
          error: 'Questo account moderatore è stato disattivato dal SuperAdmin.'
        };
      }

      const sessionUser = {
        email: found.email,
        name: found.name,
        role: found.role, // 'owner' | 'moderator' | 'user'
        avatar: found.avatar || (found.role === 'owner' ? '👑' : found.role === 'moderator' ? '🛡️' : '⛷️'),
        isActive: found.isActive !== false
      };

      setUser(sessionUser);

      if (sessionUser.role === 'owner' || sessionUser.role === 'moderator') {
        recordAuditAction('LOGIN_GESTIONALE', 'Pannello Gestione', `Accesso effettuato con ruolo ${sessionUser.role.toUpperCase()}`);
      }

      return { success: true, user: sessionUser };
    }

    return {
      success: false,
      error: 'Credenziali non corrette. Inserisci email e password valide.'
    };
  };

  // Public Registration: STRICTLY creates ONLY 'user' role
  const register = (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (usersList.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Questa email è già registrata nel sistema.' };
    }

    // Role is strictly hardcoded to 'user' with NO bypass possible
    const newUser = {
      email: cleanEmail,
      password,
      name: name.trim(),
      role: 'user', // Always user
      avatar: '⛷️',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...usersList, newUser];
    setUsersList(updated);

    const sessionUser = {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar,
      isActive: true
    };
    setUser(sessionUser);

    return { success: true, user: sessionUser };
  };

  // Verify Moderator Invite Token or Code
  const verifyInviteToken = useCallback((rawToken) => {
    if (!rawToken) return { valid: false, error: 'Inserisci il codice invito.' };

    const cleanToken = rawToken.trim().toUpperCase();
    const invite = invitesList.find(inv => inv.token.toUpperCase() === cleanToken);
    
    if (!invite) {
      return { valid: false, error: 'Codice invito non valido o inesistente.' };
    }

    if (invite.status === 'used') {
      return { valid: false, error: 'Questo codice invito è già stato utilizzato.' };
    }

    if (invite.status === 'revoked') {
      return { valid: false, error: 'Questo codice invito è stato revocato dal SuperAdmin.' };
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return { valid: false, error: 'Questo codice invito è scaduto. Richiedine uno nuovo al SuperAdmin.' };
    }

    return { valid: true, invite };
  }, [invitesList]);

  // Register Moderator through Private Single-Use Invite Code
  const registerWithInvite = ({ token, name, email, password }) => {
    const verification = verifyInviteToken(token);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    const { invite } = verification;
    // Use invited email if specified in the invite, otherwise the user's provided email
    const finalEmail = (invite.email || email || '').toLowerCase().trim();

    if (!finalEmail) {
      return { success: false, error: 'Inserisci un indirizzo email valido.' };
    }

    // Check if user already exists
    const existingIndex = usersList.findIndex(u => u.email.toLowerCase() === finalEmail);

    const newModUser = {
      email: finalEmail,
      password,
      name: name.trim(),
      role: 'moderator', // Verified moderator role granted only via valid invite code
      avatar: '🛡️',
      isActive: true,
      invitedBy: invite.invitedBy,
      createdAt: new Date().toISOString()
    };

    let updatedUsers;
    if (existingIndex >= 0) {
      updatedUsers = [...usersList];
      updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...newModUser };
    } else {
      updatedUsers = [...usersList, newModUser];
    }

    setUsersList(updatedUsers);

    // Invalidate / mark invite code as used immediately
    const updatedInvites = invitesList.map(inv =>
      inv.token.toUpperCase() === token.trim().toUpperCase()
        ? { ...inv, status: 'used', usedAt: new Date().toISOString(), usedBy: newModUser.email }
        : inv
    );
    setInvitesList(updatedInvites);

    const sessionUser = {
      email: newModUser.email,
      name: newModUser.name,
      role: newModUser.role,
      avatar: newModUser.avatar,
      isActive: true
    };
    setUser(sessionUser);

    recordAuditAction(
      'ATTIVAZIONE_MODERATORE',
      finalEmail,
      `Nuovo moderatore "${newModUser.name}" (${finalEmail}) attivato tramite codice ${invite.token}`
    );

    return { success: true, user: sessionUser };
  };

  // SUPERADMIN ONLY: Create Single-Use Moderator Invite Code
  const createModeratorInvite = (emailToInvite = '', note = '') => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Operazione riservata esclusivamente al SuperAdmin.' };
    }

    const cleanEmail = (emailToInvite || '').trim().toLowerCase();
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours validity

    const newInvite = {
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      token,
      email: cleanEmail || 'Qualsiasi email autorizzata',
      note: note || 'Invito collaboratore',
      invitedBy: user.email,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'pending',
      usedAt: null,
      usedBy: null
    };

    setInvitesList(prev => [newInvite, ...prev]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = `${origin}/?invite=${token}`;

    recordAuditAction(
      'EMISSIONE_CODICE_MODERATORE',
      token,
      `SuperAdmin ha emesso il codice invito ${token} (Scadenza 72h). Note: ${newInvite.note}`
    );

    return {
      success: true,
      invite: newInvite,
      token,
      inviteLink
    };
  };

  // SUPERADMIN ONLY: Revoke an Invite Code
  const revokeModeratorInvite = (inviteId) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo il SuperAdmin può revocare i codici invito.' };
    }

    const targetInvite = invitesList.find(i => i.id === inviteId);
    if (!targetInvite) return { success: false, error: 'Invito non trovato.' };

    setInvitesList(prev =>
      prev.map(i => (i.id === inviteId ? { ...i, status: 'revoked' } : i))
    );

    recordAuditAction(
      'REVOCA_CODICE_MODERATORE',
      targetInvite.token,
      `Revocato codice invito ${targetInvite.token}`
    );

    return { success: true };
  };

  // SUPERADMIN ONLY: Deactivate a Moderator
  const deactivateModerator = (emailToDeactivate) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo il SuperAdmin può disattivare i moderatori.' };
    }

    const targetUser = usersList.find(u => u.email.toLowerCase() === emailToDeactivate.toLowerCase());
    if (!targetUser) return { success: false, error: 'Utente non trovato.' };
    if (targetUser.role === 'owner') return { success: false, error: 'Impossibile disattivare il SuperAdmin.' };

    setUsersList(prev =>
      prev.map(u =>
        u.email.toLowerCase() === emailToDeactivate.toLowerCase()
          ? { ...u, isActive: false }
          : u
      )
    );

    recordAuditAction(
      'DISATTIVA_MODERATORE',
      emailToDeactivate,
      `Moderatore ${targetUser.name} (${emailToDeactivate}) disattivato dal SuperAdmin.`
    );

    return { success: true };
  };

  // SUPERADMIN ONLY: Reactivate a Moderator
  const activateModerator = (emailToActivate) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo il SuperAdmin può riattivare i moderatori.' };
    }

    const targetUser = usersList.find(u => u.email.toLowerCase() === emailToActivate.toLowerCase());
    if (!targetUser) return { success: false, error: 'Utente non trovato.' };

    setUsersList(prev =>
      prev.map(u =>
        u.email.toLowerCase() === emailToActivate.toLowerCase()
          ? { ...u, isActive: true }
          : u
      )
    );

    recordAuditAction(
      'RIATTIVA_MODERATORE',
      emailToActivate,
      `Moderatore ${targetUser.name} (${emailToActivate}) riattivato dal SuperAdmin.`
    );

    return { success: true };
  };

  // SUPERADMIN ONLY: Remove a Moderator permanently
  const removeModerator = (emailToRemove) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo il SuperAdmin può rimuovere i moderatori.' };
    }

    const targetUser = usersList.find(u => u.email.toLowerCase() === emailToRemove.toLowerCase());
    if (!targetUser) return { success: false, error: 'Utente non trovato.' };
    if (targetUser.role === 'owner') return { success: false, error: 'Impossibile rimuovere il SuperAdmin.' };

    setUsersList(prev => prev.filter(u => u.email.toLowerCase() !== emailToRemove.toLowerCase()));

    recordAuditAction(
      'RIMUOVI_MODERATORE',
      emailToRemove,
      `Moderatore ${targetUser.name} (${emailToRemove}) rimosso dal team.`
    );

    return { success: true };
  };

  // SUPERADMIN ONLY: Update SuperAdmin Profile (Email, Password, Name)
  const updateSuperAdminProfile = ({ name, email, password }) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo il SuperAdmin può modificare il proprio profilo.' };
    }

    const updatedUsers = usersList.map(u => {
      if (u.role === 'owner') {
        return {
          ...u,
          name: name ? name.trim() : u.name,
          email: email ? email.trim().toLowerCase() : u.email,
          password: password ? password : u.password
        };
      }
      return u;
    });

    setUsersList(updatedUsers);

    const updatedOwner = updatedUsers.find(u => u.role === 'owner');
    setUser(updatedOwner);

    recordAuditAction(
      'MODIFICA_PROFILO_SUPERADMIN',
      updatedOwner.email,
      'Credenziali SuperAdmin aggiornate con successo'
    );

    return { success: true, user: updatedOwner };
  };

  const logout = () => {
    if (user?.role === 'owner' || user?.role === 'moderator') {
      recordAuditAction('LOGOUT', user.email, 'Disconnessione dal pannello');
    }
    setUser(null);
  };

  // Role Permissions
  const isOwner = user?.role === 'owner';
  const isModerator = (user?.role === 'moderator' && user?.isActive !== false);
  const canManage = isOwner || isModerator;
  const canManageTeam = isOwner;

  const moderators = usersList.filter(u => u.role === 'moderator');

  return (
    <AuthContext.Provider
      value={{
        user,
        isOwner,
        isModerator,
        canManage,
        canManageTeam,
        isAdmin: canManage,
        isAuthenticated: !!user,
        usersList,
        moderators,
        invitesList,
        auditLogs,
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
        recordAuditAction,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
