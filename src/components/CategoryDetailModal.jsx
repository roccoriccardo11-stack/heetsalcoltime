import React from 'react';
import { X, Image as ImageIcon, PlusCircle, Heart, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const CategoryDetailModal = ({ category, onClose, onSelectPhoto, onOpenUploadForCategory }) => {
  const { approvedPhotos } = useData();

  if (!category) return null;

  const categoryPhotos = approvedPhotos.filter(p => p.category === category.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-alpine-900 border border-cyan-500/25 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header with Category Cover Banner */}
        <div className="relative h-56 sm:h-72 w-full flex-shrink-0">
          <img
            src={category.coverImage}
            alt={category.title}
            className="w-full h-full object-cover filter brightness-[0.45] contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-alpine-900 via-alpine-900/40 to-transparent"></div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-cyan-500/30 hover:border-cyan-400 transition-all"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner content */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              {category.badge || "CATEGORIA"}
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
              {category.title}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          
          {/* Descriptions (Short & Long) */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/15 space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Cosa rappresenta per noi
            </h4>
            <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
              {category.shortDesc}
            </p>
            {category.longDesc && (
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-2 border-t border-cyan-500/10">
                {category.longDesc}
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                Momenti Raccolti ({categoryPhotos.length})
              </h3>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenUploadForCategory(category.id);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black shadow-glow-cyan transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Carica Foto in {category.title}</span>
            </button>
          </div>

          {/* Category Photo Gallery Grid */}
          {categoryPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {categoryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => onSelectPhoto(photo)}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-alpine-800 border border-cyan-500/15 hover:border-cyan-400/60 transition-all duration-300 shadow-card"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-xs font-bold text-white truncate">{photo.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-300 font-mono">
                      <span>{photo.author}</span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Heart className="w-3 h-3 fill-cyan-400" /> {photo.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-cyan-500/20 rounded-2xl p-6">
              <ImageIcon className="w-10 h-10 text-cyan-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">Nessuna foto presente in questa categoria</p>
              <p className="text-xs text-zinc-500 mt-1">Sii il primo a caricare un ricordo indimenticabile!</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadForCategory(category.id);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Carica la prima foto
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
