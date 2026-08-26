import React from 'react';
import { Shield } from 'lucide-react';
import { InstagramIcon, TikTokIcon } from './Icons';
import { BrandLogo, IcebergLogoIcon } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const Footer = ({ onOpenAuth, onOpenAdmin }) => {
  const { user, isOwner, isModerator, canManage } = useAuth();
  const { siteContent } = useData();
  const { contacts, hero } = siteContent;

  const getRoleLabel = () => {
    if (isOwner) return '👑 OWNER';
    if (isModerator) return '🛡️ MODERATORE';
    return 'UTENTE';
  };

  return (
    <footer className="relative bg-alpine-950 border-t border-cyan-500/20 pt-16 pb-12 overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-cyan-500/15">
          
          {/* Brand & Claim */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="md" />

            <p className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-widest">
              {hero.claim || "PINZOLO · MADONNA DI CAMPIGLIO · TUTTO L'ANNO"}
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Il gruppo di riferimento per il divertimento, le feste in baita, i dj set e le migliori serate tra le Dolomiti di Brenta.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={contacts.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-alpine-900/80 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400/50 flex items-center justify-center text-zinc-300 hover:text-cyan-300 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href={contacts.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-alpine-900/80 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400/50 flex items-center justify-center text-zinc-300 hover:text-cyan-300 transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">
                Navigazione
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
                <li><a href="#home" className="hover:text-cyan-300 transition-colors">Home</a></li>
                <li><a href="#categorie" className="hover:text-cyan-300 transition-colors">Cosa Facciamo</a></li>
                <li><a href="#eventi" className="hover:text-cyan-300 transition-colors">Eventi & Liste</a></li>
                <li><a href="#gallery" className="hover:text-cyan-300 transition-colors">Momenti & Foto</a></li>
                <li><a href="#chi-siamo" className="hover:text-cyan-300 transition-colors">Chi Siamo</a></li>
                <li><a href="#contatti" className="hover:text-cyan-300 transition-colors">Contatti & Info</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">
                Location
              </h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="text-zinc-300 font-semibold">Pinzolo</li>
                <li className="text-zinc-300 font-semibold">Madonna di Campiglio</li>
                <li>Val Rendena (TN)</li>
                <li>Dolomiti di Brenta</li>
                <li className="pt-2 text-[10px] text-cyan-400 font-mono">Trentino, Italia</li>
              </ul>
            </div>
          </div>

          {/* Management / Account Box */}
          <div className="md:col-span-3 space-y-3">
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Accesso Gestionale</span>
                {user && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold font-mono border border-cyan-500/30">
                    {getRoleLabel()}
                  </span>
                )}
              </div>

              {canManage ? (
                <button
                  onClick={onOpenAdmin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 text-black text-xs font-extrabold shadow-glow-cyan"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Apri Pannello Gestione</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 px-3 rounded-xl bg-alpine-900/80 hover:bg-cyan-950/40 text-zinc-300 hover:text-white border border-cyan-500/20 text-xs font-bold transition-all text-center block"
                >
                  Login Moderatore / Utente
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} HEETS ALCOL TIME · Tutti i diritti riservati.</p>
          <p className="flex items-center gap-1.5">
            Fatto con passione per le serate in montagna <IcebergLogoIcon className="w-4 h-4 text-cyan-400 inline" /> Pinzolo & Campiglio
          </p>
        </div>

      </div>
    </footer>
  );
};
