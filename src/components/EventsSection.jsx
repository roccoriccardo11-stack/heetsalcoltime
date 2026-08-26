import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles, History, Ticket } from 'lucide-react';
import { useData } from '../context/DataContext';

export const EventsSection = ({ onSelectEvent }) => {
  const { upcomingEvents, pastEvents } = useData();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  const currentList = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return { day, month, year };
    } catch {
      return { day: '01', month: 'GEN', year: '2026' };
    }
  };

  return (
    <section id="eventi" className="relative py-24 bg-alpine-950 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2">
              <span className="w-6 h-[1.5px] bg-cyan-400"></span>
              CALENDARIO EVENTI
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
              PROSSIME FESTE & SERATE
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl">
              Non perdere i nostri raduni esclusivi tra baite in quota, après-ski e serate private a Pinzolo e Campiglio.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex p-1 rounded-2xl bg-alpine-900/80 border border-cyan-500/20 backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 text-black shadow-glow-cyan font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>In Programma ({upcomingEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('past')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'past'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Storico Passati ({pastEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map((event) => {
              const { day, month, year } = formatDate(event.date);

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="group relative rounded-3xl overflow-hidden cursor-pointer bg-alpine-900 border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 shadow-card hover:shadow-glow-cyan flex flex-col justify-between"
                >
                  {/* Poster Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-alpine-800">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 group-hover:brightness-[0.75] transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-alpine-900 via-transparent to-transparent"></div>

                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-500/30 text-center shadow-lg group-hover:border-cyan-400 transition-colors">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase leading-none">
                        {month}
                      </span>
                      <span className="text-xl font-display font-black text-white leading-none mt-0.5">
                        {day}
                      </span>
                    </div>

                    {/* Status / Category Tag */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-alpine-950/90 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-200">
                        {event.category.toUpperCase()}
                      </span>
                      {event.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                          {event.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{event.time || "22:00 - Late"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed pt-1">
                        {event.shortDesc}
                      </p>
                    </div>

                    {/* Footer / CTA */}
                    <div className="pt-4 border-t border-cyan-500/15 flex items-center justify-between">
                      {event.isUpcoming !== false ? (
                        <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" /> Liste Aperte
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500">
                          Evento Concluso
                        </span>
                      )}

                      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                        <span>{event.isUpcoming !== false ? 'Info e liste' : 'Guarda Dettagli'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-3xl border border-cyan-500/20 p-8">
            <Calendar className="w-12 h-12 text-cyan-700 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-white">Nessun evento in questa sezione</h3>
            <p className="text-xs text-zinc-400 mt-1">Stiamo preparando le prossime date calde per Pinzolo e Campiglio!</p>
          </div>
        )}

      </div>
    </section>
  );
};
