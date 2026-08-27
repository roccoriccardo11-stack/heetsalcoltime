import React, { useState, useRef } from 'react';
import {
  Upload,
  Link2,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Replace,
  Trash2,
  Globe,
  HardDrive
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { optimizeImage } from '../lib/imageOptimizer';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB raw before gentle optimization
const PRIMARY_BUCKET = 'category-images';
const FALLBACK_BUCKET = 'event-images';

export const CategoryImageUploader = ({
  currentImageUrl,
  onImageChange,
  onError,
  label = 'Immagine di Copertina Categoria'
}) => {
  // Mode: 'file' | 'url'
  // If currentImageUrl is an external URL (e.g. unsplash/http without supabase storage), default to 'url' or 'file' nicely
  const [activeMode, setActiveMode] = useState('file');
  const [urlInputValue, setUrlInputValue] = useState(currentImageUrl || '');
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

  const isSupabaseImage = (url) => {
    return (
      url &&
      (url.includes(PRIMARY_BUCKET) ||
        url.includes(FALLBACK_BUCKET) ||
        url.includes('/storage/v1/object/public/'))
    );
  };

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

    // Immediate preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFileName(file.name);
    setFileSizeInfo(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    // Upload process
    uploadFile(file);
  };

  const uploadFile = async (rawFile) => {
    if (!supabase) {
      setUploadError('Supabase non configurato.');
      if (onError) onError('Supabase non configurato.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Analisi & Ottimizzazione HD...');
    setUploadError('');

    try {
      // 1. Intelligent gentle optimization (preserves high visual quality)
      let fileToUpload = rawFile;
      try {
        const optResult = await optimizeImage(rawFile);
        if (optResult.isOptimized && optResult.file) {
          fileToUpload = optResult.file;
          const optKB = (optResult.optimizedSize / 1024).toFixed(0);
          setFileSizeInfo(`${optKB} KB (qualità HD preservata)`);
        }
      } catch (optErr) {
        console.warn('[CategoryImageUploader] Ottimizzazione saltata, uso originale:', optErr);
        fileToUpload = rawFile;
      }

      setUploadProgress(40);
      setUploadStatusText('Caricamento su Supabase Storage...');

      // 2. Generate unique clean filename
      const ext = fileToUpload.name.split('.').pop().toLowerCase() || 'jpg';
      const cleanBase = rawFile.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const uniqueName = `cat_${Date.now()}_${cleanBase}.${ext}`;

      setUploadProgress(65);

      let targetBucket = PRIMARY_BUCKET;
      let uploadRes = await supabase.storage
        .from(targetBucket)
        .upload(uniqueName, fileToUpload, {
          cacheControl: '31536000',
          upsert: false
        });

      // If category-images bucket not yet created in Supabase project, fallback to event-images
      if (uploadRes.error && (uploadRes.error.message?.includes('bucket not found') || uploadRes.error.message?.includes('Bucket not found'))) {
        console.warn(`[CategoryImageUploader] Bucket ${PRIMARY_BUCKET} non trovato, fallback su ${FALLBACK_BUCKET}...`);
        targetBucket = FALLBACK_BUCKET;
        uploadRes = await supabase.storage
          .from(targetBucket)
          .upload(uniqueName, fileToUpload, {
            cacheControl: '31536000',
            upsert: false
          });
      }

      if (uploadRes.error) {
        throw new Error(uploadRes.error.message);
      }

      setUploadProgress(90);

      // 3. Retrieve public URL
      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(uploadRes.data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Impossibile ottenere l\'URL pubblico dell\'immagine.');
      }

      const finalPublicUrl = urlData.publicUrl;
      setUploadProgress(100);
      setUploadStatusText('Completato!');
      setUploadSuccess(true);
      setUrlInputValue(finalPublicUrl);

      // Safe cleanup of old file if in our Supabase bucket and different
      if (
        currentImageUrl &&
        isSupabaseImage(currentImageUrl) &&
        currentImageUrl !== finalPublicUrl
      ) {
        try {
          const oldBucket = currentImageUrl.includes(PRIMARY_BUCKET)
            ? PRIMARY_BUCKET
            : FALLBACK_BUCKET;
          const oldPath = currentImageUrl.split(`${oldBucket}/`).pop();
          if (oldPath && !oldPath.startsWith('http')) {
            await supabase.storage.from(oldBucket).remove([oldPath]);
          }
        } catch (cleanupErr) {
          console.warn('[CategoryImageUploader] Cleanup old image non bloccante:', cleanupErr);
        }
      }

      // Notify parent
      if (onImageChange) {
        onImageChange(finalPublicUrl);
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore durante il caricamento dell\'immagine.';
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

  const handleUrlChange = (newUrl) => {
    setUrlInputValue(newUrl);
    setUploadError('');
    if (onImageChange) {
      onImageChange(newUrl);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    setFileSizeInfo('');
    setUploadError('');
    setUploadSuccess(false);
    setUploadProgress(0);
    setUrlInputValue('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageChange) onImageChange('');
  };

  const displayImage = preview || currentImageUrl || urlInputValue;

  return (
    <div className="space-y-3">
      {/* Top Header / Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{label}</span>
        </label>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1 bg-alpine-950 p-1 rounded-xl border border-cyan-500/20">
          <button
            type="button"
            onClick={() => setActiveMode('file')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              activeMode === 'file'
                ? 'bg-cyan-400 text-black shadow-glow-cyan'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3 h-3" />
            <span>📁 Carica File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              activeMode === 'url'
                ? 'bg-cyan-400 text-black shadow-glow-cyan'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>🔗 URL Immagine</span>
          </button>
        </div>
      </div>

      {/* Mode A: URL Input */}
      {activeMode === 'url' && (
        <div className="space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInputValue}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/... o URL diretto immagine"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-alpine-950 border border-cyan-500/20 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
              <Link2 className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {displayImage && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs"
                title="Rimuovi immagine"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            Inserisci un link diretto a un'immagine esterna (JPG, PNG, WEBP).
          </p>
        </div>
      )}

      {/* Mode B: Direct File Upload */}
      {activeMode === 'file' && (
        <div className="space-y-2 animate-fadeIn">
          {/* Dropzone if no image or want to upload */}
          {!displayImage && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-cyan-500/25 hover:border-cyan-400/50 bg-alpine-950/60 hover:bg-alpine-950'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2.5 rounded-xl ${dragOver ? 'bg-cyan-400/20' : 'bg-cyan-500/10'} transition-colors`}>
                  <Upload className={`w-4 h-4 ${dragOver ? 'text-cyan-300' : 'text-cyan-400'}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {dragOver ? 'Rilascia la foto qui' : 'Scegli dal PC / Galleria o trascina qui'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                    JPG, PNG, WEBP · PC, iPhone, Android (Max 8MB HD)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Input for Native File / Mobile Gallery Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview & Details Card */}
      {displayImage && (
        <div className="relative group rounded-2xl overflow-hidden border border-cyan-500/30 bg-alpine-950 mt-2">
          <img
            src={displayImage}
            alt="Anteprima copertina categoria"
            className="w-full h-36 sm:h-44 object-cover"
          />

          {/* Source Tag Badge */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono border border-white/10 text-cyan-300 flex items-center gap-1">
              {isSupabaseImage(displayImage) ? (
                <>
                  <HardDrive className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Storage Supabase</span>
                </>
              ) : (
                <>
                  <Globe className="w-2.5 h-2.5 text-amber-400" />
                  <span>URL Esterno</span>
                </>
              )}
            </span>
          </div>

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-[11px] font-extrabold uppercase tracking-wider shadow-glow-cyan transition-colors"
            >
              <Replace className="w-3 h-3" />
              <span>Carica File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-alpine-800 hover:bg-alpine-700 text-white text-[11px] font-mono border border-white/10 transition-colors"
            >
              <Link2 className="w-3 h-3" />
              <span>Cambia URL</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
              title="Rimuovi immagine"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info bar at bottom */}
          {(fileName || fileSizeInfo) && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
              {fileName && (
                <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono truncate border border-white/10">
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

      {/* Uploading Status Bar */}
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

      {/* Success Notification */}
      {uploadSuccess && !uploading && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-mono text-emerald-300">
            Immagine caricata nello Storage con successo!
          </span>
        </div>
      )}

      {/* Error Notification */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/15 border border-red-500/30 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[11px] font-mono text-red-300">{uploadError}</span>
        </div>
      )}
    </div>
  );
};
