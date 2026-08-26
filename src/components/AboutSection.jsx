import React from 'react';
import { Mountain, Users, GlassWater, Sparkles, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { IcebergLogoIcon } from './Logo';

export const AboutSection = () => {
  const { siteContent } = useData();
  const { about } = siteContent;

  const defaultStats = [
    { label: "Anni di Feste", value: "6+", icon: Sparkles },
    { label: "Eventi Organizzati", value: "80+", icon: GlassWater },
    { label: "Momenti in Quota", value: "1000+", icon: Mountain },
    { label: "Community & Amici", value: "5000+", icon: Users }
  ];

  const stats = about.stats || defaultStats;

  return (
    <section id="chi-siamo" className="relative py-24 bg-alpine-950 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2">
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
            {about.tag || "CHI SIAMO"}
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
            {about.title || "NON SOLO AMICI, UNA SECONDA FAMIGLIA"}
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left / Main text card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-8 sm:p-10 rounded-3xl relative overflow-hidden border border-cyan-500/20 shadow-card">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <IcebergLogoIcon className="w-44 h-44 text-cyan-400" />
              </div>
              
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono uppercase">
                  <Heart className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  Passione · Montagna · Notte
                </div>

                <p className="text-base sm:text-lg md:text-xl text-zinc-200 leading-relaxed font-normal">
                  "{about.text}"
                </p>

                <div className="pt-4 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
                  <span className="text-cyan-400 font-bold tracking-wider">PINZOLO · MADONNA DI CAMPIGLIO</span>
                  <span>ESTATE & INVERNO</span>
                </div>
              </div>
            </div>

            {/* Quick feature chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass-card p-4 rounded-2xl border border-cyan-500/15 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Mountain className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">In Quota</p>
                  <p className="text-[11px] text-zinc-400">Escursioni & Baite</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-cyan-500/15 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <GlassWater className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Après-Ski</p>
                  <p className="text-[11px] text-zinc-400">Dj set & Drink</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-cyan-500/15 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Community</p>
                  <p className="text-[11px] text-zinc-400">Accoglienza pura</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Visual image composition & Stats */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visual Photo Stack */}
            <div className="relative rounded-3xl overflow-hidden group shadow-2xl border border-cyan-500/20 h-72 sm:h-80">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80"
                alt="Heets Alcol Time Serate"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-alpine-950 via-alpine-950/30 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-alpine-900/85 backdrop-blur-md border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">La Montagna che Unisce</p>
                  <p className="text-[11px] text-cyan-300 font-mono">Dalle cime innevate ai ritrovi estivi</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-glow-cyan"></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((st, idx) => (
                <div key={idx} className="glass-card p-4 rounded-2xl border border-cyan-500/15 text-center">
                  <div className="font-display font-black text-2xl sm:text-3xl text-cyan-400 tracking-tight">
                    {st.value}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-1">
                    {st.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
