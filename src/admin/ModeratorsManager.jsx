import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Power,
  Copy,
  Check,
  Mail,
  History,
  Send,
  XCircle,
  KeyRound,
  Sparkles,
  Settings,
  Lock,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ModeratorsManager = ({ onShowToast }) => {
  const {
    user,
    isOwner,
    moderators,
    invitesList,
    auditLogs,
    createModeratorInvite,
    revokeModeratorInvite,
    deactivateModerator,
    activateModerator,
    removeModerator,
    updateSuperAdminProfile
  } = useAuth();

  // Invite emission states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Superadmin profile settings states
  const [adminName, setAdminName] = useState(user?.name || 'Owner Heets');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState('emit'); // 'emit' | 'moderators' | 'audit' | 'settings'

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    const res = await createModeratorInvite(inviteEmail, inviteNote);
    if (res.success) {
      setLastGeneratedInvite(res);
      setInviteEmail('');
      setInviteNote('');
      if (onShowToast) {
        onShowToast(`Codice Invito "${res.token}" generato con successo!`, 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast(res.error || 'Errore nella generazione del codice invito.', 'error');
      }
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    const res = await updateSuperAdminProfile({
      name: adminName,
      email: adminEmail,
      password: adminPassword || undefined
    });

    if (res.success) {
      setSavedSettingsSuccess(true);
      setAdminPassword('');
      setTimeout(() => setSavedSettingsSuccess(false), 4000);
      if (onShowToast) {
        onShowToast('Credenziali Owner aggiornate con successo!', 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast(res.error, 'error');
      }
    }
  };

  const copyText = (text, type = 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
      if (onShowToast) onShowToast(`Codice ${text} copiato negli appunti!`, 'info');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      if (onShowToast) onShowToast('Link invito copiato!', 'info');
    }
  };

  const handleDeactivate = async (modId, name, email) => {
    if (confirm(`Disattivare l'accesso del moderatore "${name}" (${email})?`)) {
      const res = await deactivateModerator(modId);
      if (res.success && onShowToast) onShowToast(`Moderatore ${name} disattivato.`, 'info');
    }
  };

  const handleActivate = async (modId, name) => {
    const res = await activateModerator(modId);
    if (res.success && onShowToast) onShowToast(`Accesso moderatore ${name} riattivato.`, 'success');
  };

  const handleRemove = async (modId, name, email) => {
    if (confirm(`ATTENZIONE: Rimuovere DEFINITIVAMENTE "${name}" (${email}) dal team dei moderatori?`)) {
      const res = await removeModerator(modId);
      if (res.success && onShowToast) onShowToast(`Moderatore ${name} rimosso dal team.`, 'info');
    }
  };

  const handleRevokeInvite = async (inviteId, code) => {
    if (confirm(`Revocare il codice invito ${code}? Non potrà più essere utilizzato.`)) {
      const res = await revokeModeratorInvite(inviteId);
      if (res.success && onShowToast) onShowToast(`Codice ${code} revocato.`, 'info');
    }
  };

  const pendingInvites = invitesList.filter(i => i.status === 'pending' && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            {isOwner ? 'AREA OWNER (PROPRIETARIO)' : 'GESTIONE INVITI & TEAM MODERATORI'}
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            EMISSIONE CODICI & TEAM COLLABORATORI
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mt-1">
            {isOwner
              ? "Sei l'Owner del sistema. Puoi emettere codici e link di invito, gestire i moderatori del team e aggiornare le tue impostazioni amministrative."
              : "Come Moderatore autorizzato puoi generare codici e link di invito monouso per nuovi collaboratori e monitorare il team."}
          </p>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveSubTab('emit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'emit'
              ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
              : 'bg-alpine-950 text-zinc-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Emetti Codice Invito ({pendingInvites.length} attivi)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('moderators')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'moderators'
              ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
              : 'bg-alpine-950 text-zinc-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Moderatori del Team ({moderators.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'audit'
              ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
              : 'bg-alpine-950 text-zinc-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Storico Azioni ({auditLogs.length})</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === 'settings'
                ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
                : 'bg-alpine-950 text-zinc-400 hover:text-white border border-cyan-500/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Credenziali SuperAdmin</span>
          </button>
        )}
      </div>

      {/* SECTION 1: EMIT INVITE CODES */}
      {activeSubTab === 'emit' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Generator Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-tight flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                Genera Nuovo Codice Invito per Moderatore
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                Clicca per generare un <strong>Codice Privato Monouso</strong> (es. <code className="text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">MOD-9K2F7</code>). La persona potrà inserirlo nel sito nella sezione <em>"Usa Invito"</em> per diventare Moderatore.
              </p>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Nota / Nome Collaboratore (facoltativo)
                  </label>
                  <input
                    type="text"
                    placeholder="es. Per Marco PR o DJ resident"
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Email specifica (facoltativo, lascia vuoto per codice libero)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="collaboratore@email.it"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Genera Codice & Link Invito</span>
              </button>
            </form>

            {/* Generated Code Result Display */}
            {lastGeneratedInvite && (
              <div className="p-5 rounded-2xl bg-cyan-950/50 border-2 border-cyan-400 shadow-glow-cyan space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-cyan-400" />
                    CODICE INVITO ATTIVO E PRONTO:
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Valido 72 ore · Monouso</span>
                </div>

                {/* Big Code Pill */}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-alpine-950 border border-cyan-500/40">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Codice da comunicare al moderatore:</p>
                    <p className="text-2xl sm:text-3xl font-mono font-black text-cyan-300 tracking-widest mt-0.5 select-all">
                      {lastGeneratedInvite.token}
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(lastGeneratedInvite.token, 'code')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copiato!' : 'Copia Codice'}</span>
                  </button>
                </div>

                {/* Link Option */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={lastGeneratedInvite.inviteLink}
                    className="w-full px-3.5 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-zinc-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyText(lastGeneratedInvite.inviteLink, 'link')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-alpine-900 hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-mono whitespace-nowrap transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copia Link</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pending Invites List */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center justify-between">
              <span>Codici Invito Attivi in Sospeso ({pendingInvites.length})</span>
            </h4>

            {pendingInvites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingInvites.map((inv) => {
                  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?invite=${inv.token}`;
                  return (
                    <div
                      key={inv.id}
                      className="glass-card p-4 rounded-2xl border border-cyan-500/20 flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-base text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                              {inv.token}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-mono font-bold">
                              ATTIVO
                            </span>
                          </div>
                          <p className="text-xs text-white font-medium mt-1.5">
                            {inv.note || 'Invito collaboratore'}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400">
                            {inv.email !== 'Qualsiasi email autorizzata' ? `Riservato a: ${inv.email}` : 'Utilizzabile da qualsiasi collaboratore'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                          Scade: {new Date(inv.expires_at).toLocaleDateString('it-IT')}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyText(inv.token, 'code')}
                            className="px-2.5 py-1 rounded-lg bg-alpine-950 hover:bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 text-xs font-mono"
                            title="Copia codice"
                          >
                            Codice
                          </button>
                          <button
                            onClick={() => copyText(inviteUrl, 'link')}
                            className="px-2.5 py-1 rounded-lg bg-alpine-950 hover:bg-cyan-950/50 text-sky-300 border border-sky-500/30 text-xs font-mono"
                            title="Copia link completo"
                          >
                            Link
                          </button>
                          <button
                            onClick={() => handleRevokeInvite(inv.id, inv.token)}
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                            title="Revoca codice"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 glass-panel rounded-2xl border border-cyan-500/15 p-4 text-zinc-400 text-xs">
                Nessun codice invito attivo al momento. Generane uno in alto quando vuoi aggiungere un moderatore.
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 2: MODERATORS LIST */}
      {activeSubTab === 'moderators' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
              Membri Attuali del Team Moderazione ({moderators.length})
            </h3>
            <button
              onClick={() => setActiveSubTab('emit')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan"
            >
              <UserPlus className="w-4 h-4" />
              <span>Emetti Codice per Nuovo Moderatore</span>
            </button>
          </div>

          {moderators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moderators.map((mod) => (
                <div
                  key={mod.email}
                  className={`p-5 rounded-2xl border transition-all ${
                    mod.isActive !== false
                      ? 'glass-card border-cyan-500/20 hover:border-cyan-400/60'
                      : 'bg-alpine-950/80 border-red-500/30 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-alpine-950 border border-cyan-500/30 flex items-center justify-center text-xl">
                        {mod.avatar || '🛡️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{mod.name}</h4>
                          {mod.isActive !== false ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                              ATTIVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold">
                              DISATTIVATO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-cyan-300 font-mono">{mod.email}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                      MODERATORE
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Attivo dal: {new Date(mod.createdAt || Date.now()).toLocaleDateString('it-IT')}</span>

                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        {mod.isActive !== false ? (
                          <button
                            onClick={() => handleDeactivate(mod.id, mod.name, mod.email)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-bold transition-colors"
                            title="Disattiva l'accesso"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>Disattiva</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(mod.id, mod.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                            title="Riattiva l'accesso"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>Riattiva</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleRemove(mod.id, mod.name, mod.email)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                          title="Rimuovi definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {mod.isActive !== false ? '• Account Operativo' : '• Account Sospeso'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-panel rounded-3xl border border-cyan-500/20 p-6 space-y-2">
              <Shield className="w-12 h-12 text-cyan-700 mx-auto" />
              <h4 className="font-bold text-white text-base">Nessun moderatore ancora registrato</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Sei tu l'unico SuperAdmin attivo. Emetti il primo codice invito dalla scheda "Emetti Codice Invito" per aggiungere collaboratori fidati.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Registro di Sicurezza & Storico Attività
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tracciamento in tempo reale di tutte le operazioni eseguite sul sito e sul team.
            </p>
          </div>

          <div className="glass-panel rounded-3xl border border-cyan-500/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-alpine-950/90 text-cyan-300 uppercase tracking-wider border-b border-cyan-500/20">
                  <tr>
                    <th className="p-3.5 sm:p-4">Data & Ora</th>
                    <th className="p-3.5 sm:p-4">Autore</th>
                    <th className="p-3.5 sm:p-4">Azione</th>
                    <th className="p-3.5 sm:p-4">Target</th>
                    <th className="p-3.5 sm:p-4">Dettagli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 sm:p-4 text-zinc-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('it-IT')}
                      </td>
                      <td className="p-3.5 sm:p-4 text-white font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{log.actorRole === 'owner' ? '👑' : '🛡️'}</span>
                          <span>{log.actorName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block">{log.actorEmail}</span>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-zinc-200 font-semibold max-w-[180px] truncate">
                        {log.target}
                      </td>
                      <td className="p-3.5 sm:p-4 text-zinc-400 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SUPERADMIN PROFILE SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/25 max-w-2xl space-y-5 animate-fadeIn">
          <div>
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Impostazioni Profilo SuperAdmin (Tu)
            </h3>
            <p className="text-xs text-zinc-300 mt-1">
              Personalizza qui la tua email e la tua password di accesso SuperAdmin.
            </p>
          </div>

          {savedSettingsSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Credenziali SuperAdmin salvate con successo!</span>
            </div>
          )}

          <form onSubmit={handleSaveAdminProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome SuperAdmin *</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email di Accesso SuperAdmin *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nuova Password SuperAdmin (lascia vuoto per non cambiarla)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Inserisci nuova password..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Salva Nuove Credenziali</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
