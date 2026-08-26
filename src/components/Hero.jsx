import React from 'react';
import { Calendar, Image as ImageIcon, Sparkles, MapPin, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { IcebergLogoIcon } from './Logo';

export const Hero = ({ onOpenUpload }) => {
  const { siteContent } = useData();
  const { hero } = siteContent;

  return (
    <section id="home" className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background Image with Deep Midnight & Neon Cyan Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=85"
          alt="Alps Night Life & Mountain Vibes"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.32] contrast-125 transition-transform duration-1000"
        />
        {/* Deep Midnight Navy Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-alpine-950 via-alpine-950/70 to-black/80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/15 via-blue-600/5 to-transparent"></div>
        <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay"></div>
      </div>

      {/* Floating Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Top Location / Vibe Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-alpine-900/80 border border-cyan-400/30 backdrop-blur-md mb-6 shadow-glow-cyan hover:border-cyan-400/60 transition-all duration-300">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-cyan-300 uppercase font-mono">
            {hero.badge || "ALPS · SKI · NIGHTS · APRES-SKI"}
          </span>
        </div>

        {/* Big Central Neon Iceberg Glass Logo Emblem */}
        <div className="relative mb-6 group cursor-default">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 p-[2px] shadow-[0_0_35px_rgba(0,240,255,0.6)] group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(0,240,255,0.8)] transition-all duration-500">
            <div className="w-full h-full bg-[#030916] rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden p-2">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.25)_0%,transparent_70%)] animate-glow-pulse"></div>
              <img
                src="/logo.png"
                alt="Heets Alcol Time Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,240,255,0.9)] relative z-10"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white uppercase drop-shadow-2xl mb-4">
          HEETS <span className="bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 bg-clip-text text-transparent drop-shadow-none">ALCOL TIME</span>
        </h1>

        {/* Spaced Alpine Claim */}
        <div className="inline-block relative mb-6">
          <p className="font-mono text-sm sm:text-lg md:text-xl font-bold tracking-[0.3em] sm:tracking-[0.4em] text-cyan-200 uppercase px-4 py-1.5 border-y border-cyan-500/25 backdrop-blur-sm">
            {hero.claim || "PINZOLO · MADONNA DI CAMPIGLIO · TUTTO L'ANNO"}
          </p>
        </div>

        {/* Subtitle description */}
        <p className="max-w-2xl text-sm sm:text-base md:text-lg text-zinc-300 font-normal leading-relaxed mb-10 text-balance">
          {hero.subtitle || "L'energia della montagna, le migliori feste in quota e il gruppo di riferimento per chi vuole vivere davvero Pinzolo e Campiglio."}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* CTA 1: Prossimi Eventi */}
          <a
            href="#eventi"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-sm uppercase tracking-wider shadow-glow-cyan hover:shadow-[0_0_35px_rgba(0,240,255,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Calendar className="w-5 h-5 text-black" />
            <span>{hero.ctaPrimary || "Prossimi Eventi"}</span>
          </a>

          {/* CTA 2: Guarda i Momenti */}
          <a
            href="#gallery"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-alpine-900/80 hover:bg-cyan-950/40 text-white font-bold text-sm uppercase tracking-wider border border-cyan-500/30 hover:border-cyan-400/70 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>{hero.ctaSecondary || "Guarda i Momenti"}</span>
          </a>
        </div>

        {/* Location Tag Footer Indicator */}
        <div className="mt-14 inline-flex items-center gap-2 text-xs font-mono text-cyan-400/80 tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>{hero.locationTag || "Dolomiti di Brenta · Val Rendena · Trentino"}</span>
        </div>

        {/* Scroll indicator */}
        <div className="mt-8 animate-bounce text-cyan-400/50">
          <ChevronDown className="w-5 h-5" />
        </div>

      </div>
    </section>
  );
};
