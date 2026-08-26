import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_USERS } from '../data/initialData';
import { hashPassword, verifyPassword, generateSalt, generateInviteCode } from '../lib/authCrypto';

const AuthContext = createContext();

const STORAGE_KEY = 'heets_auth_user_v4';
const USERS_STORAGE_KEY = 'heets_registered_users_v4';
const INVITES_STORAGE_KEY = 'heets_moderator_invites_v4';
const AUDIT_STORAGE_KEY = 'heets_audit_logs_v4';
const RESETS_STORAGE_KEY = 'heets_password_resets_v4';

// Default emergency recovery key (can be overridden in production via VITE_EMERGENCY_RECOVERY_KEY)
const EMERGENCY_RECOVERY_KEY = import.meta.env.VITE_EMERGENCY_RECOVERY_KEY || 'HEETS-MASTER-RECOVERY-KEY-2026';

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

  // 2. Persistent Users Database (Initial: starts empty if no owner setup yet)
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_USERS;
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

  // 4. Password Reset Requests
  const [resetTokens, setResetTokens] = useState(() => {
    try {
      const saved = localStorage.getItem(RESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Audit Log System
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log-sys-init',
        timestamp: new Date().toISOString(),
        actorEmail: 'system',
        actorName: 'Sistema Heets',
        actorRole: 'system',
        action: 'AVVIO_SISTEMA_AUTENTICAZIONE',
        target: 'Configurazione Ruoli',
        details: 'Sistema avviato con controllo Initial Owner Setup.'
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
    localStorage.setItem(RESETS_STORAGE_KEY, JSON.stringify(resetTokens));
  }, [resetTokens]);

  useEffect(() => {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Real-time security verification: Check if current active session user is valid & active
  useEffect(() => {
    if (user) {
      const currentInDb = usersList.find(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (!currentInDb) {
        // User was removed from database
        setUser(null);
      } else if (currentInDb.role === 'moderator' && currentInDb.isActive === false) {
        // Moderator was deactivated by Owner -> immediate revocation of access
        setUser(null);
      } else if (currentInDb.role !== user.role) {
        // Role was updated in DB
        setUser(prev => ({ ...prev, role: currentInDb.role }));
      }
    }
  }, [usersList, user]);

  // Helper to record an administrative action in the Audit Log
  const recordAuditAction = useCallback((action, target, details) => {
    const actor = user || { email: 'sistema@heets.it', name: 'Sistema', role: 'system' };
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

  // Owner count calculation
  const ownerCount = usersList.filter(u => u.role === 'owner').length;
  const hasOwner = ownerCount > 0;

  // ==========================================
  // 1. INITIAL OWNER SETUP (Available ONLY when ownerCount === 0)
  // ==========================================
  const setupInitialOwner = async ({ name, email, password, confirmPassword }) => {
    // STRICT SECURITY CHECK: Allow setup ONLY if NO Owner exists
    const currentOwners = usersList.filter(u => u.role === 'owner');
    if (currentOwners.length > 0) {
      return {
        success: false,
        error: 'Configurazione iniziale già completata. Esiste già un account Owner nel sistema.'
      };
    }

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    if (!cleanName) {
      return { success: false, error: 'Inserisci il tuo nome completo.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }
    if (cleanPass !== confirmPassword) {
      return { success: false, error: 'Le password inserite non coincidono.' };
    }

    // Hash password with cryptographic salt
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(cleanPass, salt);

    const newOwner = {
      name: cleanName,
      email: cleanEmail,
      password: passwordHash, // stored as hashed string
      role: 'owner', // Strictly assigned as OWNER
      avatar: '👑',
      isActive: true,
      isFirstOwner: true,
      createdAt: new Date().toISOString()
    };

    // Save owner to persistent user list
    const updatedUsers = [...usersList.filter(u => u.email.toLowerCase() !== cleanEmail), newOwner];
    setUsersList(updatedUsers);

    // Immediately log in the Owner
    const sessionUser = {
      email: newOwner.email,
      name: newOwner.name,
      role: 'owner',
      avatar: '👑',
      isActive: true
    };
    setUser(sessionUser);

    recordAuditAction(
      'INITIAL_SETUP_OWNER_COMPLETATO',
      cleanEmail,
      `Creato con successo il primo account OWNER (${cleanName} - ${cleanEmail}). Setup iniziale completato e bloccato.`
    );

    return { success: true, user: sessionUser };
  };

  // ==========================================
  // 2. STANDARD LOGIN (Owner, Moderator, User)
  // ==========================================
  const login = async (emailOrUsername, password) => {
    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanInput || !cleanPassword) {
      return { success: false, error: 'Inserisci email e password.' };
    }

    const found = usersList.find(
      u => u.email.toLowerCase() === cleanInput || (cleanInput.includes('@') ? false : u.name.toLowerCase() === cleanInput)
    );

    if (!found) {
      return {
        success: false,
        error: 'Nessun account trovato con queste credenziali. Verifica email e password.'
      };
    }

    // Verify hashed password
    const isPasswordValid = await verifyPassword(cleanPassword, found.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Password non corretta. Riprova o usa il recupero password.'
      };
    }

    // Check if moderator is deactivated
    if (found.role === 'moderator' && found.isActive === false) {
      return {
        success: false,
        error: 'Questo account moderatore è stato disattivato dall\'Owner.'
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
      recordAuditAction(
        'LOGIN_GESTIONALE',
        'Pannello Gestione',
        `Accesso effettuato con ruolo ${sessionUser.role.toUpperCase()} (${sessionUser.email})`
      );
    }

    return { success: true, user: sessionUser };
  };

  // ==========================================
  // 3. PUBLIC REGISTRATION (Strictly ONLY 'user')
  // ==========================================
  const register = async (name, email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPass = password || '';

    if (!cleanName) {
      return { success: false, error: 'Inserisci il tuo nome.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'La password deve avere almeno 6 caratteri.' };
    }

    if (usersList.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Questa email è già registrata nel sistema.' };
    }

    // Role is strictly hardcoded to 'user' with NO bypass possible
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(cleanPass, salt);

    const newUser = {
      email: cleanEmail,
      password: passwordHash,
      name: cleanName,
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
      role: 'user',
      avatar: '⛷️',
      isActive: true
    };
    setUser(sessionUser);

    return { success: true, user: sessionUser };
  };

  // ==========================================
  // 4. MODERATOR REGISTRATION VIA INVITE CODE
  // ==========================================
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
      return { valid: false, error: 'Questo codice invito è stato revocato dall\'Owner.' };
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return { valid: false, error: 'Questo codice invito è scaduto. Richiedine uno nuovo all\'Owner.' };
    }

    return { valid: true, invite };
  }, [invitesList]);

  const registerWithInvite = async ({ token, name, email, password }) => {
    const verification = verifyInviteToken(token);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    const { invite } = verification;
    const finalEmail = (invite.email && invite.email !== 'Qualsiasi email autorizzata' ? invite.email : email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanPass = password || '';

    if (!cleanName) {
      return { success: false, error: 'Inserisci il tuo nome.' };
    }
    if (!finalEmail || !finalEmail.includes('@')) {
      return { success: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPassword(cleanPass, salt);

    const existingIndex = usersList.findIndex(u => u.email.toLowerCase() === finalEmail);

    const newModUser = {
      email: finalEmail,
      password: passwordHash,
      name: cleanName,
      role: 'moderator', // Verified moderator role granted only via valid invite code
      avatar: '🛡️',
      isActive: true,
      invitedBy: invite.invitedBy,
      createdAt: new Date().toISOString()
    };

    let updatedUsers;
    if (existingIndex >= 0) {
      // If user existed as normal user, elevate strictly to moderator via valid invite
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
      role: 'moderator',
      avatar: '🛡️',
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

  // ==========================================
  // 5. OWNER ONLY: CREATE INVITE CODE
  // ==========================================
  const createModeratorInvite = (emailToInvite = '', note = '') => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Operazione riservata esclusivamente all\'Owner del sito.' };
    }

    const cleanEmail = (emailToInvite || '').trim().toLowerCase();
    const token = generateInviteCode('MOD');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours validity

    const newInvite = {
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      token,
      email: cleanEmail || 'Qualsiasi email autorizzata',
      note: note || 'Invito moderatore',
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
      `Owner ha emesso il codice invito ${token} per ${newInvite.email} (Scadenza 72h)`
    );

    return {
      success: true,
      invite: newInvite,
      token,
      inviteLink
    };
  };

  // ==========================================
  // 6. OWNER ONLY: REVOKE INVITE CODE
  // ==========================================
  const revokeModeratorInvite = (inviteId) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo l\'Owner può revocare i codici invito.' };
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

  // ==========================================
  // 7. OWNER ONLY: MODERATOR MANAGEMENT
  // ==========================================
  const deactivateModerator = (emailToDeactivate) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo l\'Owner può disattivare i moderatori.' };
    }

    const targetUser = usersList.find(u => u.email.toLowerCase() === emailToDeactivate.toLowerCase());
    if (!targetUser) return { success: false, error: 'Utente non trovato.' };
    if (targetUser.role === 'owner') return { success: false, error: 'Impossibile disattivare l\'Owner.' };

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
      `Moderatore ${targetUser.name} (${emailToDeactivate}) disattivato dall'Owner.`
    );

    return { success: true };
  };

  const activateModerator = (emailToActivate) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo l\'Owner può riattivare i moderatori.' };
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
      `Moderatore ${targetUser.name} (${emailToActivate}) riattivato dall'Owner.`
    );

    return { success: true };
  };

  const removeModerator = (emailToRemove) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo l\'Owner può rimuovere i moderatori.' };
    }

    const targetUser = usersList.find(u => u.email.toLowerCase() === emailToRemove.toLowerCase());
    if (!targetUser) return { success: false, error: 'Utente non trovato.' };
    if (targetUser.role === 'owner') return { success: false, error: 'Impossibile rimuovere l\'Owner.' };

    setUsersList(prev => prev.filter(u => u.email.toLowerCase() !== emailToRemove.toLowerCase()));

    recordAuditAction(
      'RIMUOVI_MODERATORE',
      emailToRemove,
      `Moderatore ${targetUser.name} (${emailToRemove}) rimosso dal team dall'Owner.`
    );

    return { success: true };
  };

  const updateSuperAdminProfile = async ({ name, email, password }) => {
    if (user?.role !== 'owner') {
      return { success: false, error: 'Solo l\'Owner può modificare il proprio profilo.' };
    }

    let newPasswordHash = null;
    if (password && password.trim().length >= 6) {
      const salt = generateSalt(16);
      newPasswordHash = await hashPassword(password.trim(), salt);
    }

    const updatedUsers = usersList.map(u => {
      if (u.role === 'owner') {
        return {
          ...u,
          name: name ? name.trim() : u.name,
          email: email ? email.trim().toLowerCase() : u.email,
          password: newPasswordHash || u.password
        };
      }
      return u;
    });

    setUsersList(updatedUsers);

    const updatedOwner = updatedUsers.find(u => u.role === 'owner');
    setUser({
      email: updatedOwner.email,
      name: updatedOwner.name,
      role: 'owner',
      avatar: '👑',
      isActive: true
    });

    recordAuditAction(
      'MODIFICA_PROFILO_OWNER',
      updatedOwner.email,
      'Credenziali Owner aggiornate con successo'
    );

    return { success: true, user: updatedOwner };
  };

  // ==========================================
  // 8. SECURE PASSWORD RESET (Recupero Password)
  // ==========================================
  const requestPasswordReset = (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Inserisci la tua email.' };
    }

    const found = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        success: false,
        error: 'Nessun account trovato con questo indirizzo email.'
      };
    }

    const resetToken = generateInviteCode('RESET');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

    const newReset = {
      id: 'rst-' + Date.now(),
      email: cleanEmail,
      token: resetToken,
      expiresAt,
      status: 'pending'
    };

    setResetTokens(prev => [newReset, ...prev.filter(r => r.email !== cleanEmail)]);

    recordAuditAction(
      'RICHIESTA_RESET_PASSWORD',
      cleanEmail,
      `Richiesto codice di recupero password per ${cleanEmail}`
    );

    return {
      success: true,
      token: resetToken,
      email: cleanEmail,
      message: `Codice di recupero generato: ${resetToken}`
    };
  };

  const completePasswordReset = async ({ email, token, newPassword, confirmPassword }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim().toUpperCase();
    const cleanPass = newPassword || '';

    if (!cleanEmail || !cleanToken || !cleanPass) {
      return { success: false, error: 'Tutti i campi sono obbligatori.' };
    }

    if (cleanPass.length < 6) {
      return { success: false, error: 'La nuova password deve contenere almeno 6 caratteri.' };
    }

    if (cleanPass !== confirmPassword) {
      return { success: false, error: 'Le password non coincidono.' };
    }

    const resetRecord = resetTokens.find(
      r => r.email.toLowerCase() === cleanEmail && r.token.toUpperCase() === cleanToken && r.status === 'pending'
    );

    if (!resetRecord) {
      return { success: false, error: 'Codice di recupero non valido o già utilizzato.' };
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return { success: false, error: 'Il codice di recupero è scaduto. Richiedine uno nuovo.' };
    }

    const userIndex = usersList.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      return { success: false, error: 'Account non trovato.' };
    }

    const targetUser = usersList[userIndex];
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(cleanPass, salt);

    // STRICT: ONLY password is changed. The role is strictly preserved!
    const updatedUser = {
      ...targetUser,
      password: passwordHash
    };

    const updatedUsers = [...usersList];
    updatedUsers[userIndex] = updatedUser;
    setUsersList(updatedUsers);

    // Invalidate reset token
    setResetTokens(prev => prev.map(r => r.id === resetRecord.id ? { ...r, status: 'used' } : r));

    recordAuditAction(
      'RESET_PASSWORD_COMPLETATO',
      cleanEmail,
      `Password reimpostata con successo per ${cleanEmail} (Ruolo: ${targetUser.role})`
    );

    return { success: true };
  };

  // ==========================================
  // 9. EMERGENCY OWNER ACCESS RECOVERY
  // ==========================================
  const emergencyRecoverOwner = async ({ emergencyKey, name, email, newPassword, confirmPassword }) => {
    const cleanKey = (emergencyKey || '').trim();
    if (cleanKey !== EMERGENCY_RECOVERY_KEY) {
      return {
        success: false,
        error: 'Chiave di recupero emergenza server NON valida. Verifica le impostazioni di sistema.'
      };
    }

    const cleanName = (name || 'Owner Heets').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = newPassword || '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'La nuova password deve contenere almeno 6 caratteri.' };
    }
    if (cleanPass !== confirmPassword) {
      return { success: false, error: 'Le password non coincidono.' };
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPassword(cleanPass, salt);

    const existingOwnerIndex = usersList.findIndex(u => u.role === 'owner');

    let updatedUsers;
    let recoveredOwner;

    if (existingOwnerIndex >= 0) {
      recoveredOwner = {
        ...usersList[existingOwnerIndex],
        name: cleanName,
        email: cleanEmail,
        password: passwordHash,
        isActive: true
      };
      updatedUsers = [...usersList];
      updatedUsers[existingOwnerIndex] = recoveredOwner;
    } else {
      recoveredOwner = {
        name: cleanName,
        email: cleanEmail,
        password: passwordHash,
        role: 'owner',
        avatar: '👑',
        isActive: true,
        isFirstOwner: true,
        createdAt: new Date().toISOString()
      };
      updatedUsers = [...usersList, recoveredOwner];
    }

    setUsersList(updatedUsers);

    const sessionUser = {
      email: recoveredOwner.email,
      name: recoveredOwner.name,
      role: 'owner',
      avatar: '👑',
      isActive: true
    };
    setUser(sessionUser);

    recordAuditAction(
      'EMERGENCY_RECOVERY_OWNER',
      cleanEmail,
      `Ripristino di emergenza account OWNER effettuato tramite Master Key da ${cleanEmail}`
    );

    return { success: true, user: sessionUser };
  };

  const logout = () => {
    if (user?.role === 'owner' || user?.role === 'moderator') {
      recordAuditAction('LOGOUT', user.email, 'Disconnessione dal pannello');
    }
    setUser(null);
  };

  // Permissions
  const isOwner = user?.role === 'owner';
  const isModerator = (user?.role === 'moderator' && user?.isActive !== false);
  const canManage = isOwner || isModerator;
  const canManageTeam = isOwner;

  const moderators = usersList.filter(u => u.role === 'moderator');

  return (
    <AuthContext.Provider
      value={{
        user,
        ownerCount,
        hasOwner,
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
        completePasswordReset,
        emergencyRecoverOwner,
        recordAuditAction,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
