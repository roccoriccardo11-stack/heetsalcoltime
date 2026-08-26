import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />
  };

  const borders = {
    success: 'border-cyan-500/40 bg-alpine-900/95 shadow-[0_0_20px_rgba(0,240,255,0.2)]',
    error: 'border-red-500/40 bg-alpine-900/95 shadow-red-500/10',
    info: 'border-cyan-500/40 bg-alpine-900/95 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div
        className={`flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${borders[type] || borders.info}`}
      >
        <div className="flex items-center gap-3">
          {icons[type] || icons.info}
          <p className="text-xs sm:text-sm font-medium text-white leading-snug">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
