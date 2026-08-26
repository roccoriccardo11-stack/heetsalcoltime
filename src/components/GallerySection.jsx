import React, { useState } from 'react';
import { Image as ImageIcon, Heart, PlusCircle, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const GallerySection = ({ onSelectPhoto, onOpenUpload, onShowToast }) => {
  const { approvedPhotos, siteContent, likePhoto } = useData();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPhotos = activeFilter === 'all'
    ? approvedPhotos
    : approvedPhotos.filter(p => p.category === activeFilter);

  const filterTabs = [
    { id: 'all', label: 'Tutti i Momenti' },
    ...siteContent.categories.map(c => ({ id: c.id, label: c.title }))
  ];

  const handleLike = (e, photo) => {
    e.stopPropagation();
    likePhoto(photo.id);
    if (onShowToast) {
      onShowToast('Hai lasciato un like a questo momento! 🍸✨', 'info');
    }
  };

  return (
    <section id="gallery" className="relative py-24 bg-alpine-950/90 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Upload Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2">
              <span className="w-6 h-[1.5px] bg-cyan-400"></span>
              GALLERIA FOTOGRAFICA
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
              I NOSTRI MOMENTI
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl">
              Anni di risate, tramonti in quota e notti indimenticabili a Pinzolo e Campiglio.
            </p>
          </div>

          {/* Carica i tuoi momenti button */}
          <button
            onClick={() => onOpenUpload()}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Carica i tuoi momenti</span>
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-cyan-400 text-black shadow-glow-cyan'
                  : 'bg-alpine-900/80 hover:bg-cyan-950/40 text-zinc-300 border border-cyan-500/20 hover:border-cyan-400/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onSelectPhoto(photo)}
                className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer bg-alpine-900 border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 shadow-card hover:shadow-glow-cyan"
              >
                {/* Photo Image */}
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 filter brightness-90 group-hover:brightness-105 transition-transform duration-700"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                  
                  {/* Top Category Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[9px] font-mono font-bold uppercase text-cyan-300">
                      {photo.category.toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => handleLike(e, photo)}
                      className="p-2 rounded-full bg-black/70 hover:bg-cyan-500/30 text-white hover:text-cyan-400 border border-cyan-500/30 transition-colors"
                      title="Lascia un like"
                    >
                      <Heart className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                    </button>
                  </div>

                  {/* Bottom Info */}
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-md">
                      {photo.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono">
                      <span className="truncate max-w-[120px]">@{photo.author || 'Ospite'}</span>
                      <span className="text-cyan-400 flex items-center gap-1 font-bold">
                        <Heart className="w-3 h-3 fill-cyan-400" /> {photo.likes || 0}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-3xl border border-cyan-500/20 p-8">
            <ImageIcon className="w-12 h-12 text-cyan-700 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-white">Nessuna foto in questa categoria</h3>
            <p className="text-xs text-zinc-400 mt-1">Carica tu il primo ricordo per questa sezione!</p>
            <button
              onClick={() => onOpenUpload(activeFilter !== 'all' ? activeFilter : undefined)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 rounded-full shadow-glow-cyan"
            >
              <PlusCircle className="w-4 h-4" />
              Carica foto ora
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
