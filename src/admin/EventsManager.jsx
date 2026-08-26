import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useData } from '../context/DataContext';

export const EventsManager = ({ onShowToast }) => {
  const { events, addEvent, updateEvent, deleteEvent, siteContent } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('feste');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('22:00 - Late');
  const [location, setLocation] = useState('Pinzolo & Madonna di Campiglio');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('EVENTO ESCLUSIVO');
  const [spotsLeft, setSpotsLeft] = useState(30);
  const [isUpcoming, setIsUpcoming] = useState(true);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentEventId(null);
    setTitle('');
    setCategory('feste');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('22:00 - Late');
    setLocation('Pinzolo & Madonna di Campiglio');
    setShortDesc('');
    setDescription('');
    setImage('');
    setBadge('EVENTO ESCLUSIVO');
    setSpotsLeft(30);
    setIsUpcoming(true);
  };

  const handleStartCreate = () => {
    resetForm();
    setImage('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80');
    setIsEditing(true);
  };

  const handleStartEdit = (evt) => {
    setCurrentEventId(evt.id);
    setTitle(evt.title);
    setCategory(evt.category);
    setDate(evt.date);
    setTime(evt.time || '22:00 - Late');
    setLocation(evt.location);
    setShortDesc(evt.shortDesc || '');
    setDescription(evt.description || '');
    setImage(evt.image);
    setBadge(evt.badge || '');
    setSpotsLeft(evt.spotsLeft ?? 30);
    setIsUpcoming(evt.isUpcoming !== false);
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date || !location) return;

    const eventPayload = {
      title,
      category,
      date,
      time,
      location,
      shortDesc: shortDesc || 'Serata imperdibile organizzata da Heets Alcol Time',
      description: description || shortDesc || 'Dettagli in arrivo per questa serata speciale.',
      image: image || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      badge,
      spotsLeft: Number(spotsLeft) || 0,
      isUpcoming
    };

    if (currentEventId) {
      updateEvent(currentEventId, eventPayload);
      if (onShowToast) onShowToast('Evento aggiornato con successo!', 'success');
    } else {
      addEvent(eventPayload);
      if (onShowToast) onShowToast('Nuovo evento creato e pubblicato!', 'success');
    }

    resetForm();
  };

  const handleDelete = (evt) => {
    if (confirm(`Sei sicuro di voler eliminare l'evento "${evt.title}"?`)) {
      deleteEvent(evt.id);
      if (onShowToast) onShowToast('Evento eliminato.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/15">
        <div>
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
            TUTTI GLI EVENTI ({events.length})
          </h3>
          <p className="text-xs text-zinc-400">Aggiungi, modifica le info, gestisci liste e archivio storico</p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Evento</span>
          </button>
        )}
      </div>

      {/* Editor Modal / Inline Form */}
      {isEditing && (
        <div className="p-6 sm:p-7 rounded-3xl bg-alpine-900 border border-cyan-500/40 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <h4 className="font-display font-bold text-base text-cyan-400 uppercase tracking-wider">
              {currentEventId ? 'Modifica Evento' : 'Crea Nuovo Evento'}
            </h4>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg bg-alpine-800 hover:bg-cyan-950/40 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Titolo Evento *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. HEETS PRIVATE CHALET PARTY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                >
                  {siteContent.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Orario</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="es. 16:30 - 21:00 o 22:00 - Late"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="es. Spinale, Madonna di Campiglio"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Etichetta / Badge</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="es. LISTE LIMITATE"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Posti Rimasti (Liste)</label>
                <input
                  type="number"
                  value={spotsLeft}
                  onChange={(e) => setSpotsLeft(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20">
                  <input
                    type="checkbox"
                    checked={isUpcoming}
                    onChange={(e) => setIsUpcoming(e.target.checked)}
                    className="w-4 h-4 text-cyan-400 rounded focus:ring-0"
                  />
                  <span className="text-xs text-white font-semibold">Mostra in "Prossimi Eventi"</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Immagine Locandina</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Breve Descrizione Anteprima</label>
              <input
                type="text"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Breve testo che compare nella card dell'evento"
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Descrizione Completa Evento</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spiega tutti i dettagli, navette, prezzi o formule d'ingresso..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan"
              >
                <Check className="w-4 h-4" />
                <span>{currentEventId ? 'Salva Modifiche' : 'Crea e Pubblica'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Table / List */}
      <div className="space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="glass-card p-4 sm:p-5 rounded-2xl border border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={evt.image}
                alt={evt.title}
                className="w-16 h-16 rounded-xl object-cover border border-cyan-500/20 flex-shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase border border-cyan-500/30">
                    {evt.category}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">{evt.date}</span>
                  {evt.isUpcoming ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      PROSSIMO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400 text-[10px] font-mono">
                      STORICO
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base">{evt.title}</h4>
                <p className="text-xs text-zinc-400 font-mono truncate max-w-md">{evt.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleStartEdit(evt)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-cyan-300 transition-colors"
                title="Modifica evento"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(evt)}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
                title="Elimina evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
