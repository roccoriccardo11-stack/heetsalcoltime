import React, { useState } from 'react';
import { Check, X, Trash2, Image as ImageIcon, Filter, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';

export const PhotoModeration = ({ onShowToast }) => {
  const { pendingPhotos, approvedPhotos, approvePhoto, rejectPhoto, deletePhoto, siteContent } = useData();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [categoryFilter, setCategoryFilter] = useState('all');

  const currentList = activeTab === 'pending' ? pendingPhotos : approvedPhotos;
  const filtered = categoryFilter === 'all'
    ? currentList
    : currentList.filter(p => p.category === categoryFilter);

  const handleApprove = (photo) => {
    approvePhoto(photo.id);
    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch {}
    if (onShowToast) onShowToast(`Foto "${photo.title}" approvata e pubblicata nella gallery!`, 'success');
  };

  const handleReject = (photo) => {
    if (confirm(`Sei sicuro di voler rifiutare ed eliminare la foto "${photo.title}"?`)) {
      rejectPhoto(photo.id);
      if (onShowToast) onShowToast('Foto rifiutata.', 'info');
    }
  };

  const handleDeleteApproved = (photo) => {
    if (confirm(`Vuoi rimuovere definitivamente questa foto dalla gallery pubblica?`)) {
      deletePhoto(photo.id);
      if (onShowToast) onShowToast('Foto rimossa dalla gallery.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        
        {/* Pending vs Approved Switch */}
        <div className="inline-flex p-1 rounded-2xl bg-alpine-950 border border-cyan-500/20">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'pending'
                ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>In Attesa di Approvazione</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'pending' ? 'bg-black text-cyan-400' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {pendingPhotos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'approved'
                ? 'bg-cyan-400 text-black font-extrabold shadow-glow-cyan'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Gallery Pubblica</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'approved' ? 'bg-black text-cyan-400' : 'bg-white/10 text-zinc-300'
            }`}>
              {approvedPhotos.length}
            </span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">Tutte le Categorie</option>
            {siteContent.categories.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Grid of Moderation Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="glass-card rounded-2xl overflow-hidden border border-cyan-500/15 flex flex-col justify-between"
            >
              {/* Photo Image Preview */}
              <div className="relative aspect-video w-full bg-black overflow-hidden group">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                    {photo.category}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                    photo.status === 'pending'
                      ? 'bg-cyan-400 text-black animate-pulse'
                      : 'bg-emerald-500/80 text-black'
                  }`}>
                    {photo.status === 'pending' ? 'IN ATTESA' : 'PUBBLICA'}
                  </span>
                </div>
              </div>

              {/* Photo Metadata */}
              <div className="p-4 space-y-2 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{photo.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" />
                    {photo.author || 'Anonimo'}
                  </span>
                  <span>{photo.uploadedAt}</span>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="p-3 bg-alpine-950 border-t border-cyan-500/10 flex items-center gap-2">
                {activeTab === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(photo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition-colors shadow-glow-cyan"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approva</span>
                    </button>
                    <button
                      onClick={() => handleReject(photo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Rifiuta</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDeleteApproved(photo)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Elimina dalla Gallery</span>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-3xl border border-cyan-500/20 p-8">
          <ImageIcon className="w-12 h-12 text-cyan-700 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">
            {activeTab === 'pending'
              ? 'Nessuna foto in attesa di moderazione'
              : 'Nessuna foto trovata'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === 'pending'
              ? 'Tutte le foto caricate dagli utenti sono state moderate.'
              : 'Non ci sono foto per i filtri selezionati.'}
          </p>
        </div>
      )}

    </div>
  );
};
