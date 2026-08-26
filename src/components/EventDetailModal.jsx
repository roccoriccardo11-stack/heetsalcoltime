import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Send, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const EventDetailModal = ({ event, onClose, onShowToast }) => {
  const { siteContent, sendContactMessage } = useData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState('2');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!event) return null;

  const handleRSVP = (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    sendContactMessage({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@guest.it`,
      phone,
      subject: `Richiesta Lista Evento: ${event.title}`,
      message: `Richiesta accredito/tavolo per ${guestsCount} persone. Note: ${notes || 'Nessuna specifica'}`,
      category: 'Liste & Tavoli'
    });

    setSubmitted(true);
    if (onShowToast) {
      onShowToast('Richiesta inviata con successo! Ti contatteremo a breve su WhatsApp.', 'success');
    }
  };

  const getWhatsAppLink = () => {
    const rawNumber = siteContent.contacts.whatsappNumber || '393450000000';
    const text = encodeURIComponent(
      `Ciao Heets Alcol Time! Vorrei info e mettermi in lista per l'evento "${event.title}" a ${event.location} (${event.date}). Siamo in ${guestsCount} persone. 🏔️🍸`
    );
    return `https://wa.me/${rawNumber}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn">
      
      <div className="relative w-full max-w-3xl bg-alpine-900 border border-cyan-500/25 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cover Header */}
        <div className="relative h-60 sm:h-72 w-full flex-shrink-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover filter brightness-[0.45] contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-alpine-900 via-alpine-900/40 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-cyan-500/30 hover:border-cyan-400 transition-all"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              {event.badge || "EVENTO SPECIALE"}
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Info Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass-card p-3.5 rounded-2xl border border-cyan-500/15 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-[10px] text-zinc-400 font-mono uppercase">Data</p>
                <p className="text-xs font-bold text-white">{event.date}</p>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-cyan-500/15 flex items-center gap-3">
              <Clock className="w-5 h-5 text-sky-400" />
              <div>
                <p className="text-[10px] text-zinc-400 font-mono uppercase">Orario</p>
                <p className="text-xs font-bold text-white">{event.time || "22:00 - Late"}</p>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-cyan-500/15 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-[10px] text-zinc-400 font-mono uppercase">Location</p>
                <p className="text-xs font-bold text-white truncate max-w-[140px]">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/15 space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Dettagli Evento
            </h4>
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
              {event.description || event.shortDesc}
            </p>
          </div>

          {/* Direct WhatsApp / RSVP Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                Accreditamento & Info Liste
              </h3>
              {event.spotsLeft !== undefined && event.spotsLeft > 0 && (
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  ⚡ Solo {event.spotsLeft} posti rimasti
                </span>
              )}
            </div>

            {/* Direct WhatsApp CTA Button */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all"
            >
              <MessageCircle className="w-5 h-5 text-black" />
              <span>Richiedi Subito su WhatsApp</span>
            </a>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-cyan-500/15 w-full"></div>
              <span className="bg-alpine-900 px-3 text-[11px] font-mono text-zinc-500 uppercase tracking-widest absolute">
                oppure compila qui
              </span>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Richiesta Ricevuta!</h4>
                <p className="text-xs text-zinc-300">
                  Abbiamo registrato la tua richiesta per <strong>{event.title}</strong>. Il nostro team ti contatterà al numero {phone} per la conferma accredito.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRSVP} className="space-y-3 glass-panel p-5 rounded-2xl border border-cyan-500/15">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Mario Rossi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Cellulare (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+39 340 0000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Numero Persone</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    >
                      <option value="1">1 Persona</option>
                      <option value="2">2 Persone</option>
                      <option value="3-5">Gruppo 3-5 Persone</option>
                      <option value="6-10">Gruppo 6-10 Persone</option>
                      <option value="10+">Gruppo 10+ Persone (Tavolo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Note o preferenze</label>
                    <input
                      type="text"
                      placeholder="es. Arriviamo verso le 23:00"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-glow-cyan"
                >
                  <Send className="w-4 h-4" />
                  <span>Invia Richiesta Lista</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
