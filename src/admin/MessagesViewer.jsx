import React, { useState } from 'react';
import { Mail, Check, Trash2, Phone, MessageSquare } from 'lucide-react';
import { useData } from '../context/DataContext';

export const MessagesViewer = ({ onShowToast }) => {
  const { messages, markMessageAsRead, deleteMessage } = useData();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = filter === 'unread'
    ? messages.filter(m => !m.read)
    : messages;

  const handleMarkRead = (msg) => {
    markMessageAsRead(msg.id);
    if (onShowToast) onShowToast('Messaggio segnato come letto', 'info');
  };

  const handleDelete = (msg) => {
    if (confirm('Sei sicuro di voler eliminare questo messaggio?')) {
      deleteMessage(msg.id);
      if (onShowToast) onShowToast('Messaggio eliminato', 'info');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
            MESSAGGI & RICHIESTE LISTE ({messages.length})
          </h3>
          <p className="text-xs text-zinc-400">Richieste di accredito, liste serate e contatti arrivati dal sito</p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-alpine-950 border border-cyan-500/20">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === 'all' ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tutti ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === 'unread' ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Da Leggere ({messages.filter(m => !m.read).length})
          </button>
        </div>
      </div>

      {/* Messages List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl border transition-all ${
                msg.read
                  ? 'glass-card border-white/5 opacity-80'
                  : 'bg-alpine-900 border-cyan-500/40 shadow-glow-cyan'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${msg.read ? 'bg-white/5 text-zinc-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{msg.subject || 'Nuovo Messaggio'}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Inviato da: <span className="text-zinc-200 font-semibold">{msg.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-cyan-300 uppercase">
                    {msg.category || 'Generale'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(msg.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-4 rounded-xl bg-alpine-950/80 border border-white/5 mb-3 text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                "{msg.message}"
              </div>

              {/* Contact Info & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-4 flex-wrap">
                  {msg.phone && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" /> {msg.phone}
                    </span>
                  )}
                  {msg.email && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-sky-400" /> {msg.email}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!msg.read && (
                    <button
                      onClick={() => handleMarkRead(msg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors shadow-glow-cyan"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Segna come letto</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Elimina messaggio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-3xl border border-cyan-500/20 p-8">
          <MessageSquare className="w-12 h-12 text-cyan-700 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">Nessun messaggio in questa cartella</h3>
          <p className="text-xs text-zinc-400 mt-1">I messaggi inviati tramite il form contatti o le liste appariranno qui.</p>
        </div>
      )}

    </div>
  );
};
