import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, Replace } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = 'event-images';

export const ImageUploader = ({ currentImageUrl, onImageUploaded, onError }) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return 'Nessun file selezionato.';
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Formato non supportato (${file.type || 'sconosciuto'}). Usa JPG, PNG o WEBP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `File troppo grande (${sizeMB} MB). Massimo consentito: 5 MB.`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    setUploadError('');
    setUploadSuccess(false);

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      if (onError) onError(error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setFileName(file.name);

    // Upload immediately
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!supabase) {
      setUploadError('Supabase non configurato.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadError('');

    try {
      // Generate unique filename to avoid collisions
      const ext = file.name.split('.').pop().toLowerCase();
      const uniqueName = `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      setUploadProgress(30);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Impossibile ottenere l\'URL pubblico dell\'immagine.');
      }

      setUploadProgress(100);
      setUploadSuccess(true);

      // Notify parent with the public URL
      if (onImageUploaded) {
        onImageUploaded(urlData.publicUrl);
      }

      // Try to delete old image if it was in the same bucket
      if (currentImageUrl && currentImageUrl.includes(BUCKET_NAME)) {
        try {
          const oldPath = currentImageUrl.split(`${BUCKET_NAME}/`).pop();
          if (oldPath && !oldPath.startsWith('http')) {
            await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
          }
        } catch {
          // Non-critical: old file cleanup failure is ok
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore durante il caricamento.';
      setUploadError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const clearSelection = () => {
    setPreview(null);
    setFileName('');
    setUploadError('');
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
        Immagine Locandina Evento
      </label>

      {/* Current/Preview Image */}
      {displayImage && (
        <div className="relative group">
          <img
            src={displayImage}
            alt="Anteprima immagine evento"
            className="w-full h-48 object-cover rounded-2xl border border-cyan-500/20"
          />
          {/* Overlay with replace button */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400/90 hover:bg-cyan-300 text-black text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              <Replace className="w-4 h-4" />
              <span>Sostituisci</span>
            </button>
            {preview && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                title="Rimuovi anteprima"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* File name badge */}
          {fileName && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono truncate border border-white/10">
                {fileName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Drop zone (shown when no image) */}
      {!displayImage && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-cyan-500/20 hover:border-cyan-400/50 bg-alpine-950/50 hover:bg-alpine-950'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-xl ${dragOver ? 'bg-cyan-400/20' : 'bg-cyan-500/10'} transition-colors`}>
              <Upload className={`w-6 h-6 ${dragOver ? 'text-cyan-300' : 'text-cyan-500'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {dragOver ? 'Rilascia qui!' : 'Clicca o trascina un\'immagine'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                JPG, PNG, WEBP · Max 5 MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload button (when no image is displayed yet) */}
      {!displayImage && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-alpine-950 border border-cyan-500/20 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 text-xs font-bold uppercase tracking-wider transition-all"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Carica Immagine</span>
        </button>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-cyan-300">Caricamento in corso...</span>
            <span className="text-xs font-mono text-zinc-400 ml-auto">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-alpine-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && !uploading && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-mono text-emerald-300">Immagine caricata con successo!</span>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs font-mono text-red-300">{uploadError}</span>
        </div>
      )}
    </div>
  );
};
