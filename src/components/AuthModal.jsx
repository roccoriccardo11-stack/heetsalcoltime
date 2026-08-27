import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Crown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IcebergLogoIcon } from './Logo';

export const AuthModal = ({ isOpen, onClose, onShowToast, initialInviteToken = null }) => {
  const {
    hasOwner,
    setupInitialOwner,
    login,
    register,
    verifyInviteToken,
    registerWithInvite,
    requestPasswordReset
  } = useAuth();

  // Active view: 'setup' | 'login' | 'register' | 'invite' | 'forgot'
  const [activeTab, setActiveTab] = useState(() => (!hasOwner ? 'setup' : 'login'));

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Invite states
  const [inviteToken, setInviteToken] = useState(initialInviteToken || '');
  const [verifiedInvite, setVerifiedInvite] = useState(null);
  const [modName, setModName] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modPassword, setModPassword] = useState('');

  // Password reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Synchronize active tab if owner state changes or invite token is passed
  useEffect(() => {
    if (!hasOwner) {
      setActiveTab('setup');
    } else if (activeTab === 'setup') {
      setActiveTab('login');
    }
  }, [hasOwner]);

  useEffect(() => {
    if (initialInviteToken) {
      setInviteToken(initialInviteToken);
      setActiveTab('invite');
      verifyInviteToken(initialInviteToken).then((res) => {
        if (res.valid) {
          setVerifiedInvite(res.invite);
          if (res.invite.email && res.invite.email !== 'Qualsiasi email autorizzata') {
            setModEmail(res.invite.email);
          }
        } else {
          setError(res.error);
        }
      });
    }
  }, [initialInviteToken, verifyInviteToken]);

  if (!isOpen) return null;

  // Verify Moderator Invite Token
  const handleVerifyToken = async () => {
    setError('');
    setLoading(true);
    const res = await verifyInviteToken(inviteToken.trim());
    setLoading(false);
    if (res.valid) {
      setVerifiedInvite(res.invite);
      if (res.invite.email && res.invite.email !== 'Qualsiasi email autorizzata') {
        setModEmail(res.invite.email);
      }
      if (onShowToast) onShowToast('Codice invito valido! Inserisci i tuoi dati per completare la registrazione.', 'success');
    } else {
      setVerifiedInvite(null);
      setError(res.error || 'Codice invito non valido o scaduto.');
    }
  };

  // Submit Moderator Registration with Invite
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!modName || !modPassword) {
      setError('Inserisci il tuo nome e una password.');
      setLoading(false);
      return;
    }

    const emailToUse = (verifiedInvite?.email && verifiedInvite.email !== 'Qualsiasi email autorizzata')
      ? verifiedInvite.email
      : modEmail;

    if (!emailToUse) {
      setError('Inserisci il tuo indirizzo email.');
      setLoading(false);
      return;
    }

    const res = await registerWithInvite({
      token: inviteToken.trim(),
      name: modName,
      email: emailToUse,
      password: modPassword
    });

    setLoading(false);
    if (res.success) {
      if (onShowToast) {
        onShowToast(`Benvenuto nel team moderatori, ${res.user.name}! Accesso effettuato.`, 'success');
      }
      onClose();
    } else {
      setError(res.error || 'Errore nella registrazione con invito.');
    }
  };

  // Submit Initial Owner Setup (Available ONLY when no owner exists in DB)
  const handleInitialSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.');
      setLoading(false);
      return;
    }

    const res = await setupInitialOwner({
      name,
      email,
      password,
      confirmPassword
    });

    setLoading(false);
    if (res.success) {
      if (onShowToast) {
        onShowToast(`👑 Account OWNER creato con successo! Benvenuto, ${res.user.name}!`, 'success');
      }
      onClose();
    } else {
      if (res.requiresVerification && onShowToast) {
        onShowToast('Verifica la tua email prima di effettuare il login.', 'info');
      }
      setError(res.error || 'Errore durante la configurazione iniziale dell\'Owner.');
    }
  };

  // Submit Login or Public User Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (activeTab === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        if (onShowToast) {
          const roleLabel = res.user.role === 'owner' ? '👑 OWNER' : res.user.role === 'moderator' ? '🛡️ MODERATORE' : 'UTENTE';
          onShowToast(`Accesso effettuato come ${roleLabel} (${res.user.name})!`, 'success');
        }
        onClose();
      } else {
        setError(res.error || 'Credenziali non valide');
      }
    } else if (activeTab === 'register') {
      if (!name) {
        setError('Inserisci il tuo nome');
        setLoading(false);
        return;
      }
      const res = await register(name, email, password);
      setLoading(false);
      if (res.success) {
        if (onShowToast) {
          onShowToast(`Account creato con successo! Benvenuto su Heets, ${res.user.name}!`, 'success');
        }
        onClose();
      } else {
        setError(res.error || 'Errore nella registrazione');
      }
    }
  };

  // Password Reset Request (Supabase Auth Email Reset)
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    setLoading(true);

    const res = await requestPasswordReset(resetEmail);
    setLoading(false);
    if (res.success) {
      setResetSuccessMessage(res.message);
      if (onShowToast) onShowToast(res.message, 'success');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md bg-alpine-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/15 flex items-center justify-between bg-alpine-850">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              activeTab === 'setup'
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              {activeTab === 'setup' ? <Crown className="w-5 h-5 text-amber-300" /> : <IcebergLogoIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                {activeTab === 'setup' && 'INITIAL OWNER SETUP'}
                {activeTab === 'login' && 'ACCEDI A HEETS'}
                {activeTab === 'register' && 'REGISTRATI'}
                {activeTab === 'invite' && 'ATTIVA INVITO MODERATORE'}
                {activeTab === 'forgot' && 'RECUPERO PASSWORD'}
              </h3>
              <p className="text-[10px] text-cyan-400 font-mono">
                {activeTab === 'setup' ? 'Configurazione Primo Proprietario (Supabase Auth)' : 'Pinzolo & Madonna di Campiglio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-alpine-800 hover:bg-cyan-950/40 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Navigation Tabs (Available ONLY after first Owner is configured) */}
          {hasOwner ? (
            <div className="flex rounded-xl bg-alpine-950 p-1 border border-cyan-500/15">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'login' ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Accedi
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'register' ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Registrati
              </button>
              <button
                onClick={() => {
                  setActiveTab('invite');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'invite' ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Usa Invito
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold font-mono">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>NESSUN OWNER REGISTRATO (CONFIGURAZIONE INIZIALE)</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Sei il proprietario del sito: imposta il tuo account <strong>OWNER</strong> su Supabase per accedere subito al pannello e invitare i moderatori.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 0: INITIAL OWNER SETUP (ONLY when hasOwner === false) */}
          {/* ==================================================== */}
          {!hasOwner && activeTab === 'setup' && (
            <form onSubmit={handleInitialSetupSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome e Cognome Proprietario *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Mario Rossi (Proprietario Heets)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-amber-400/30 focus:border-amber-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email Proprietario (Accesso Supabase Auth) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="latuaemail@email.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-amber-400/30 focus:border-amber-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Password Proprietario (min. 6 caratteri) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-amber-400/30 focus:border-amber-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Conferma Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-amber-400/30 focus:border-amber-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                <span>{loading ? 'Creazione in corso...' : 'Crea Account OWNER e Accedi Subito'}</span>
              </button>

              <p className="text-[10px] text-zinc-400 text-center font-mono pt-1">
                La procedura è protetta a livello database e può essere eseguita <strong>una sola volta</strong>.
              </p>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAB 1: LOGIN (Owner, Moderator, User) */}
          {/* ==================================================== */}
          {hasOwner && activeTab === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email di Accesso *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="latuaemail@email.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono text-zinc-400">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setError('');
                      setResetEmail(email);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    Password dimenticata?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Accesso in corso...' : 'Accedi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('invite');
                    setError('');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-mono block mx-auto"
                >
                  Hai un codice invito da Owner? Attiva account Moderatore →
                </button>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PUBLIC USER REGISTRATION (Strictly creates 'user') */}
          {/* ==================================================== */}
          {hasOwner && activeTab === 'register' && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome e Cognome *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Mario Rossi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="mario.rossi@email.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Password (min. 6 caratteri) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Creazione account...' : 'Crea Account Utente'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-zinc-500 text-center font-mono">
                La registrazione pubblica assegna strettamente il ruolo <strong>Utente</strong> protetto da RLS.
              </p>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAB 3: REGISTER WITH SINGLE-USE INVITE CODE (MODERATOR) */}
          {/* ==================================================== */}
          {activeTab === 'invite' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Attivazione Account Moderatore
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Inserisci il <strong>codice invito privato</strong> ricevuto dall'Owner (es. <code className="text-cyan-300">MOD-9K2F7</code>).
                </p>
              </div>

              {!verifiedInvite ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Codice Invito Moderatore *</label>
                    <input
                      type="text"
                      placeholder="es. MOD-7X9K2"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-cyan-300 font-mono font-bold text-sm tracking-widest uppercase focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerifyToken}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all disabled:opacity-50"
                  >
                    <span>{loading ? 'Verifica...' : 'Verifica Codice Invito'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-mono text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Codice <strong>{verifiedInvite.token}</strong> valido!</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome Moderatore *</label>
                    <input
                      type="text"
                      required
                      placeholder="Il tuo nome"
                      value={modName}
                      onChange={(e) => setModName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>

                  {(!verifiedInvite.email || verifiedInvite.email === 'Qualsiasi email autorizzata') && (
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">La tua Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="latuaemail@email.it"
                        value={modEmail}
                        onChange={(e) => setModEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Imposta Password Moderatore *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={modPassword}
                      onChange={(e) => setModPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{loading ? 'Attivazione...' : 'Attiva Account Moderatore'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: PASSWORD RESET (Supabase Auth Official Email Reset) */}
          {/* ==================================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Recupero Password tramite Supabase Auth
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Riceverai un link sicuro via email per reimpostare la tua password senza modificare il tuo ruolo.
                </p>
              </div>

              {resetSuccessMessage ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {resetSuccessMessage}
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    Clicca sul link ricevuto per impostare una nuova password, poi torna qui ed effettua il login.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="mt-2 block w-full py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase text-center"
                  >
                    Torna al Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email dell'Account *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="latuaemail@email.it"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all disabled:opacity-50"
                  >
                    <span>{loading ? 'Invio in corso...' : 'Invia Link di Recupero Password'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setError('');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-cyan-300 hover:underline font-mono"
                    >
                      ← Torna al Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
