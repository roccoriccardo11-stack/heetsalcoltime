import React from 'react';
import { ArrowUpRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const CategoriesSection = ({ onSelectCategory }) => {
  const { siteContent, approvedPhotos } = useData();
  const categories = siteContent?.categories || [];

  // Filter active categories and sort by order
  const displayCategories = categories
    .filter(cat => cat.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getCategoryPhotoCount = (catId) => {
    return approvedPhotos.filter(p => p.category === catId).length;
  };

  const handleCardClick = (cat) => {
    if (cat.link && cat.link.trim() !== '') {
      const link = cat.link.trim();
      if (link.startsWith('#')) {
        const el = document.querySelector(link);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  return (
    <section id="categorie" className="relative py-24 bg-alpine-950/80 overflow-hidden">
      {/* Glow decorations */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2">
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
            COSA FACCIAMO
            <span className="w-6 h-[1.5px] bg-cyan-400"></span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
            I NOSTRI FORMAT & CATEGORIE
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Ogni stagione a Pinzolo e Campiglio ha le sue tradizioni. Clicca su ogni categoria per scoprire la storia e la gallery dedicata.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((cat, index) => {
            const photoCount = getCategoryPhotoCount(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => handleCardClick(cat)}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer bg-alpine-900 border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-500 shadow-card hover:shadow-glow-cyan flex flex-col justify-between min-h-[320px] sm:min-h-[340px] ${
                  index === 0 ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={cat.coverImage}
                    alt={cat.title}
                    className="w-full h-full object-cover filter brightness-[0.38] contrast-110 group-hover:scale-105 group-hover:brightness-[0.48] transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-alpine-950 via-alpine-950/60 to-transparent"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Top Badge & Counter */}
                <div className="relative z-10 p-6 sm:p-7 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {cat.badge || "HEETS VIBES"}
                  </span>

                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-alpine-900/80 backdrop-blur-md text-[11px] font-mono font-bold text-zinc-200 border border-cyan-500/20">
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    {photoCount} Foto
                  </span>
                </div>

                {/* Bottom Content Area (with pr-20 to safeguard arrow space) */}
                <div className="relative z-10 p-6 sm:p-8 pr-20 sm:pr-24 space-y-2">
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed max-w-xl">
                    {cat.shortDesc}
                  </p>
                </div>

                {/* Fixed Circular Arrow - Absolute positioned in bottom-right corner for perfect alignment */}
                <div
                  className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-20 w-11 h-11 rounded-full bg-alpine-800/90 border border-cyan-500/30 text-white group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-600 group-hover:border-cyan-300 group-hover:text-black flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-lg group-hover:shadow-glow-cyan pointer-events-none"
                  aria-hidden="true"
                >
                  <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
