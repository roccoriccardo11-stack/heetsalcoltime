import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Shield, ArrowRight, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IcebergLogoIcon } from './Logo';

export const AuthModal = ({ isOpen, onClose, onShowToast, initialInviteToken = null }) => {
  const { login, register, verifyInviteToken, registerWithInvite } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'invite'
  
  // Login / Register Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Invite Form State
  const [inviteToken, setInviteToken] = useState(initialInviteToken || '');
  const [verifiedInvite, setVerifiedInvite] = useState(null);
  const [modName, setModName] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modPassword, setModPassword] = useState('');

  useEffect(() => {
    if (initialInviteToken) {
      setInviteToken(initialInviteToken);
      setActiveTab('invite');
      const res = verifyInviteToken(initialInviteToken);
      if (res.valid) {
        setVerifiedInvite(res.invite);
        if (res.invite.email && res.invite.email !== 'Qualsiasi email autorizzata') {
          setModEmail(res.invite.email);
        }
      } else {
        setError(res.error);
      }
    }
  }, [initialInviteToken, verifyInviteToken]);

  if (!isOpen) return null;

  const handleVerifyToken = () => {
    setError('');
    const res = verifyInviteToken(inviteToken.trim());
    if (res.valid) {
      setVerifiedInvite(res.invite);
      if (res.invite.email && res.invite.email !== 'Qualsiasi email autorizzata') {
        setModEmail(res.invite.email);
      }
      if (onShowToast) onShowToast('Codice invito valido! Completa la registrazione moderatore.', 'success');
    } else {
      setVerifiedInvite(null);
      setError(res.error || 'Codice invito non valido o scaduto.');
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!modName || !modPassword) {
      setError('Inserisci il tuo nome e una password.');
      return;
    }

    const emailToUse = (verifiedInvite?.email && verifiedInvite.email !== 'Qualsiasi email autorizzata')
      ? verifiedInvite.email
      : modEmail;

    if (!emailToUse) {
      setError('Inserisci il tuo indirizzo email.');
      return;
    }

    const res = registerWithInvite({
      token: inviteToken.trim(),
      name: modName,
      email: emailToUse,
      password: modPassword
    });

    if (res.success) {
      if (onShowToast) {
        onShowToast(`Benvenuto nel team moderatori, ${res.user.name}!`, 'success');
      }
      onClose();
    } else {
      setError(res.error || 'Errore nella registrazione con invito.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'login') {
      const res = login(email, password);
      if (res.success) {
        if (onShowToast) {
          const roleLabel = res.user.role === 'owner' ? 'SuperAdmin' : res.user.role === 'moderator' ? 'Moderatore' : 'Utente';
          onShowToast(`Accesso effettuato come ${roleLabel} (${res.user.name})!`, 'success');
        }
        onClose();
      } else {
        setError(res.error || 'Credenziali non valide');
      }
    } else if (activeTab === 'register') {
      if (!name) {
        setError('Inserisci il tuo nome');
        return;
      }
      // Strictly registers as normal consumer/user
      const res = register(name, email, password);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md bg-alpine-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/15 flex items-center justify-between bg-alpine-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <IcebergLogoIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                {activeTab === 'login' && 'ACCEDI A HEETS'}
                {activeTab === 'register' && 'REGISTRATI'}
                {activeTab === 'invite' && 'ATTIVA INVITO MODERATORE'}
              </h3>
              <p className="text-[10px] text-cyan-400 font-mono">Pinzolo & Madonna di Campiglio</p>
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
          
          {/* Mode Tabs */}
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
              Usa Codice
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1 & 2: LOGIN / USER REGISTER */}
          {activeTab !== 'invite' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
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
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    La registrazione pubblica crea un account <strong>Utente / Community</strong>.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  {activeTab === 'login' ? 'Email o Username (SuperAdmin: admin)' : 'Email *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'login' ? 'admin oppure la tua email' : 'iltuonome@email.it'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Password *</label>
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
              >
                <span>{activeTab === 'login' ? 'Accedi' : 'Crea Account Utente'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {activeTab === 'login' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('invite')}
                    className="text-[11px] text-cyan-400 hover:underline font-mono"
                  >
                    Hai un codice invito da SuperAdmin? Attiva qui il tuo account Moderatore →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 3: REGISTER WITH SINGLE-USE INVITE CODE */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Attivazione Account Moderatore
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Inserisci il <strong>codice invito privato</strong> ricevuto dal SuperAdmin (es. <code className="text-cyan-300">MOD-9K2F7</code>).
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
                    onClick={handleVerifyToken}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
                  >
                    <span>Verifica Codice</span>
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
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Attiva Account Moderatore</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
