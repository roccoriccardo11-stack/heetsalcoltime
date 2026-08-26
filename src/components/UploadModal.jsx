import React, { useState, useRef } from 'react';
import { X, UploadCloud, ShieldAlert, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { IcebergLogoIcon } from './Logo';

export const UploadModal = ({ isOpen, onClose, initialCategory, onShowToast }) => {
  const { user } = useAuth();
  const { uploadUserPhoto, siteContent } = useData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory || 'feste');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        if (onShowToast) onShowToast('Il file supera i 10MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!previewUrl && !imageUrl) {
      if (onShowToast) onShowToast('Seleziona o incolla un\'immagine prima di caricare', 'error');
      return;
    }

    uploadUserPhoto({
      url: previewUrl || imageUrl,
      title: title || 'Momento indimenticabile a Pinzolo',
      category: category,
      author: authorName || (user?.name || 'Ospite Heets')
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setSubmitted(true);
    if (onShowToast) {
      onShowToast('Foto inviata con successo! In attesa di approvazione dai gestori.', 'success');
    }
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setPreviewUrl('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn">
      
      <div className="relative w-full max-w-xl bg-alpine-900 border border-cyan-500/25 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-cyan-500/15 flex items-center justify-between bg-alpine-850">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              <IcebergLogoIcon className="w-4 h-4" />
              COMMUNITY UPLOAD
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
              CARICA I TUOI MOMENTI
            </h2>
          </div>

          <button
            onClick={resetForm}
            className="p-2.5 rounded-full bg-alpine-800 hover:bg-cyan-950/40 text-zinc-300 hover:text-white border border-cyan-500/20 transition-all"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-6">
          
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto shadow-glow-cyan">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight">
                Grazie per il tuo contributo!
              </h3>
              <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                La tua foto è stata inviata ai gestori di <strong>Heets Alcol Time</strong>. Non appena verrà approvata, comparirà nella galleria pubblica della categoria selezionata!
              </p>

              <div className="pt-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan hover:from-cyan-300 hover:to-blue-500 transition-all"
                >
                  Chiudi o Carica un'altra
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Info Notice about moderation */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-200 leading-relaxed">
                  <strong>Moderazione attiva:</strong> per garantire la qualità dei contenuti, ogni foto caricata va prima nella coda di approvazione degli admin prima di essere visibile pubblicamente.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  1. Seleziona o trascina la tua foto *
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : previewUrl
                      ? 'border-cyan-400 bg-alpine-950 shadow-glow-cyan'
                      : 'border-cyan-500/20 bg-alpine-950/60 hover:bg-cyan-950/20 hover:border-cyan-400/50'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                      <img
                        src={previewUrl}
                        alt="Anteprima caricamento"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-full border border-cyan-500/30">
                          Clicca per cambiare immagine
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-4">
                      <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        Trascina qui la foto oppure <span className="text-cyan-400 underline">sfoglia</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Supporta JPG, PNG, WEBP (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Oppure incolla link immagine (es. https://...)"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  2. Scegli la categoria di appartenenza *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {siteContent.categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === cat.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-glow-cyan'
                          : 'border-cyan-500/15 bg-alpine-950 text-zinc-400 hover:text-white hover:border-cyan-500/40'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{cat.title}</p>
                      <p className="text-[9px] text-cyan-400/80 font-mono uppercase">{cat.badge}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Il tuo nome / nickname *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Giacomo o @instagram"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Didascalia / Titolo foto
                  </label>
                  <input
                    type="text"
                    placeholder="es. Serata in baita indimenticabile"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-alpine-950 border border-cyan-500/20 focus:border-cyan-400 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-glow-cyan transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Invia Foto per Approvazione</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
