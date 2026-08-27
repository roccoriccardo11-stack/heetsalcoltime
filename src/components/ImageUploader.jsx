import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, Replace, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { optimizeImage } from '../lib/imageOptimizer';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB raw before gentle optimization
const BUCKET_NAME = 'event-images';

export const ImageUploader = ({ currentImageUrl, onImageUploaded, onImageRemoved, onError }) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSizeInfo, setFileSizeInfo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
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
      return `File troppo grande (${sizeMB} MB). Massimo consentito: 8 MB.`;
    }
    return null;
  };

  const handleFileSelect = async (file) => {
    setUploadError('');
    setUploadSuccess(false);

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      if (onError) onError(error);
      return;
    }

    // Show instant preview from object URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFileName(file.name);
    setFileSizeInfo(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    // Intelligent gentle optimization + upload
    uploadFile(file);
  };

  const uploadFile = async (rawFile) => {
    if (!supabase) {
      setUploadError('Supabase non configurato.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Analisi & Ottimizzazione intelligente...');
    setUploadError('');

    try {
      // 1. Intelligent gentle optimization (preserves max visual quality)
      let fileToUpload = rawFile;
      try {
        const optResult = await optimizeImage(rawFile);
        if (optResult.isOptimized && optResult.file) {
          fileToUpload = optResult.file;
          const origMB = (optResult.originalSize / 1024).toFixed(0);
          const optMB = (optResult.optimizedSize / 1024).toFixed(0);
          setFileSizeInfo(`${optMB} KB (risparmio ${optResult.reductionPercent}% - qualità HD)`);
        }
      } catch (optErr) {
        console.warn('[ImageUploader] Ottimizzazione saltata, uso originale:', optErr);
        fileToUpload = rawFile;
      }

      setUploadProgress(40);
      setUploadStatusText('Caricamento su Supabase Storage...');

      // 2. Generate unique clean filename
      const ext = fileToUpload.name.split('.').pop().toLowerCase() || 'jpg';
      const cleanBase = rawFile.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const uniqueName = `img_${Date.now()}_${cleanBase}.${ext}`;

      setUploadProgress(65);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, fileToUpload, {
          cacheControl: '31536000', // 1 year cache
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      setUploadProgress(90);

      // 3. Retrieve public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Impossibile ottenere l\'URL pubblico dell\'immagine.');
      }

      setUploadProgress(100);
      setUploadStatusText('Completato!');
      setUploadSuccess(true);

      // Notify parent
      if (onImageUploaded) {
        onImageUploaded(urlData.publicUrl);
      }

      // Safe cleanup of old file if in event-images
      if (currentImageUrl && currentImageUrl.includes(BUCKET_NAME) && currentImageUrl !== urlData.publicUrl) {
        try {
          const oldPath = currentImageUrl.split(`${BUCKET_NAME}/`).pop();
          if (oldPath && !oldPath.startsWith('http')) {
            await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
          }
        } catch {
          // ignore cleanup errors
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

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    setFileSizeInfo('');
    setUploadError('');
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageRemoved) onImageRemoved();
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Foto / Locandina Evento</span>
        </label>
        {displayImage && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Rimuovi Foto</span>
          </button>
        )}
      </div>

      {/* Current/Preview Image */}
      {displayImage && (
        <div className="relative group rounded-2xl overflow-hidden border border-cyan-500/30 bg-alpine-950">
          <img
            src={displayImage}
            alt="Anteprima locandina evento"
            className="w-full h-48 sm:h-56 object-cover"
          />
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-extrabold uppercase tracking-wider shadow-glow-cyan transition-colors"
            >
              <Replace className="w-3.5 h-3.5" />
              <span>Sostituisci Foto</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
              title="Elimina foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info pill */}
          {(fileName || fileSizeInfo) && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
              {fileName && (
                <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono truncate border border-white/10">
                  {fileName}
                </span>
              )}
              {fileSizeInfo && (
                <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 backdrop-blur-sm text-cyan-300 text-[10px] font-mono border border-cyan-500/30 ml-auto whitespace-nowrap">
                  {fileSizeInfo}
                </span>
              )}
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
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-cyan-500/25 hover:border-cyan-400/50 bg-alpine-950/60 hover:bg-alpine-950'
          }`}
        >
          <div className="flex flex-col items-center gap-2.5">
            <div className={`p-3 rounded-xl ${dragOver ? 'bg-cyan-400/20' : 'bg-cyan-500/10'} transition-colors`}>
              <Upload className={`w-5 h-5 ${dragOver ? 'text-cyan-300' : 'text-cyan-400'}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {dragOver ? 'Rilascia la foto qui' : 'Seleziona una foto o trascinala qui'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                JPG, PNG, WEBP · Ottimizzazione qualità HD automatica
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input (native file / gallery picker) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {uploadStatusText || 'Caricamento...'}
            </span>
            <span className="text-zinc-400">{uploadProgress}%</span>
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
          <span className="text-xs font-mono text-emerald-300">Foto caricata in alta qualità!</span>
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
