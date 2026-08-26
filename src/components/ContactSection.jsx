import React, { useState } from 'react';
import { Send, Mail, MapPin, MessageCircle, CheckCircle2 } from 'lucide-react';
import { InstagramIcon, TikTokIcon } from './Icons';
import { useData } from '../context/DataContext';

export const ContactSection = ({ onShowToast }) => {
  const { siteContent, sendContactMessage } = useData();
  const { contacts } = siteContent;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Info Serate & Liste');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !message) return;

    sendContactMessage({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@guest.it`,
      phone,
      subject: `Richiesta: ${category}`,
      message,
      category
    });

    setSubmitted(true);
    if (onShowToast) {
      onShowToast('Messaggio inviato con successo! Ti risponderemo al più presto.', 'success');
    }
  };

  const getWhatsAppLink = () => {
    const rawNumber = contacts.whatsappNumber || '393450000000';
    const text = encodeURIComponent(
      contacts.whatsappText || "Ciao Heets Alcol Time! Vorrei info sulle vostre prossime feste a Pinzolo/Campiglio 🏔️🍸"
    );
    return `https://wa.me/${rawNumber}?text=${text}`;
  };

  return (
    <section id="contatti" className="relative py-24 bg-alpine-950 overflow-hidden">
      {/* Glow decorations */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2">
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
            SEMPRE REPERIBILI
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
            CONTATTI & SOCIAL
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Vuoi unirti a una serata, organizzare una festa in baita, metterti in lista per i prossimi eventi o fare due chiacchiere? Scrivici subito!
          </p>
        </div>

        {/* Two-Column Grid: Left (Socials & WhatsApp) / Right (Contact Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Links & Info */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Instagram Card */}
            <a
              href={contacts.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 rounded-3xl border border-cyan-500/15 flex items-center justify-between group hover:border-cyan-400/50 block shadow-card hover:shadow-glow-cyan"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <InstagramIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-zinc-400">Instagram Ufficiale</p>
                  <p className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {contacts.instagramHandle || "@heets.alcoltime"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Seguici →
              </span>
            </a>

            {/* TikTok Card */}
            <a
              href={contacts.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 rounded-3xl border border-cyan-500/15 flex items-center justify-between group hover:border-cyan-400/50 block shadow-card hover:shadow-glow-cyan"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-alpine-900 border border-cyan-500/30 flex items-center justify-center text-white shadow-md">
                  <TikTokIcon className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-zinc-400">TikTok Ufficiale</p>
                  <p className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {contacts.tiktokHandle || "@heets.alcoltime"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Guarda i video →
              </span>
            </a>

            {/* WhatsApp Quick Chat */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 rounded-3xl border border-emerald-500/30 flex items-center justify-between group hover:border-emerald-400/60 block bg-emerald-950/20 shadow-card"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-black shadow-md">
                  <MessageCircle className="w-6 h-6 fill-black" />
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-emerald-400">Chat Rapida WhatsApp</p>
                  <p className="text-base font-bold text-white">Scrivici in Diretta</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                Apri Chat →
              </span>
            </a>

            {/* Location & Email */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/15 space-y-3">
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{contacts.location || "Pinzolo & Madonna di Campiglio (TN), Dolomiti di Brenta"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href={`mailto:${contacts.email || 'info@heetsalcoltime.it'}`} className="hover:text-cyan-300 transition-colors">
                  {contacts.email || "info@heetsalcoltime.it"}
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-7 sm:p-9 rounded-3xl border border-cyan-500/20 shadow-card">
              <div className="mb-6">
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  INVIACI UN MESSAGGIO
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Rispondiamo solitamente entro pochi minuti.
                </p>
              </div>

              {submitted ? (
                <div className="py-10 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-xl text-white">Messaggio Inviato!</h4>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                    Grazie per averci contattato. Uno dei gestori di Heets Alcol Time ti risponderà a breve.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="mt-4 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20"
                  >
                    Invia un altro messaggio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome e Cognome *</label>
                      <input
                        type="text"
                        required
                        placeholder="es. Marco Rossi"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email / Instagram</label>
                      <input
                        type="text"
                        placeholder="es. marco@email.it o @marcorossi"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Cellulare (facoltativo)</label>
                      <input
                        type="tel"
                        placeholder="+39 340 0000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Motivo del Contatto</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                      >
                        <option value="Info Serate & Liste">Info Serate & Liste</option>
                        <option value="Prenotazione Tavolo / Colletta">Prenotazione Tavolo / Colletta</option>
                        <option value="DJ / Artista / Musica">DJ / Artista / Musica</option>
                        <option value="Altro">Altro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Il tuo messaggio *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Scrivi qui cosa vorresti organizzare o sapere..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Invia Messaggio</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
