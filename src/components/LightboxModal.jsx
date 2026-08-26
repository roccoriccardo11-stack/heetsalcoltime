import React from 'react';
import { X, Heart, User } from 'lucide-react';
import { useData } from '../context/DataContext';

export const LightboxModal = ({ photo, onClose, onShowToast }) => {
  const { likePhoto } = useData();

  if (!photo) return null;

  const handleLike = (e) => {
    e.stopPropagation();
    likePhoto(photo.id);
    if (onShowToast) {
      onShowToast('Hai lasciato un like a questo momento! 🍸✨', 'info');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full bg-alpine-900 border border-cyan-500/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-cyan-500/30 hover:border-cyan-400 transition-all"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Photo Preview Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[450px] max-h-[68vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.title}
            className="max-h-[68vh] w-auto max-w-full object-contain select-none"
          />
        </div>

        {/* Info & Action Bar */}
        <div className="p-5 sm:p-6 bg-alpine-900 border-t border-cyan-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                {photo.category.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {photo.uploadedAt}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white">
              {photo.title}
            </h3>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Scattata da: <span className="text-zinc-200 font-semibold">{photo.author || 'Ospite Heets'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/50 transition-all active:scale-95 shadow-glow-cyan"
            >
              <Heart className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              <span className="font-mono font-bold text-xs">{photo.likes || 0} Like</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
