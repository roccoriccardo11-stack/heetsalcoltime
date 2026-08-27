import React, { useState, useRef } from 'react';
import { Video, Upload, X, Loader2, AlertCircle, CheckCircle2, Replace, Trash2, Film, Play } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov (iOS / Mac)
  'video/webm',
  'video/x-m4v',
  'video/3gpp',
  'video/ogg'
];

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB (Supabase standard free/pro limit)
const BUCKET_NAME = 'event-videos';

export const VideoUploader = ({ currentVideoUrl, onVideoUploaded, onVideoRemoved, onError }) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSizeInfo, setFileSizeInfo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return 'Nessun file selezionato.';

    // Check MIME type or common extensions
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const validExtensions = ['.mp4', '.mov', '.webm', '.m4v', '.3gp', '.ogg'];
    const isMimeValid = ACCEPTED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');
    const isExtValid = validExtensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return `Formato video non supportato (${file.type || ext}). Usa MP4, MOV o WEBM.`;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `Video troppo pesante (${sizeMB} MB). Limite massimo: 50 MB.`;
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

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFileName(file.name);
    setFileSizeInfo(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    // Upload original file directly without re-encoding (preserves 100% video & audio quality)
    uploadVideo(file);
  };

  const uploadVideo = async (file) => {
    if (!supabase) {
      setUploadError('Supabase non configurato.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadError('');

    try {
      // 1. Generate unique file name
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const cleanBase = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const uniqueName = `vid_${Date.now()}_${cleanBase}.${ext}`;

      setUploadProgress(35);

      // 2. Upload original file to Supabase Storage (event-videos bucket)
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file, {
          cacheControl: '31536000',
          contentType: file.type || 'video/mp4',
          upsert: false
        });

      if (error) {
        // If event-videos bucket does not exist yet, fallback to event-images with video
        if (error.message?.includes('bucket not found') || error.message?.includes('Bucket not found')) {
          console.warn('[VideoUploader] Bucket event-videos non trovato, fallback su event-images...');
          const fallbackRes = await supabase.storage
            .from('event-images')
            .upload(uniqueName, file, {
              cacheControl: '31536000',
              contentType: file.type || 'video/mp4',
              upsert: false
            });
          if (fallbackRes.error) throw new Error(fallbackRes.error.message);
          data.path = fallbackRes.data.path;
        } else {
          throw new Error(error.message);
        }
      }

      setUploadProgress(85);

      // 3. Retrieve public URL
      const targetBucket = data.path.includes('event-images') ? 'event-images' : BUCKET_NAME;
      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Impossibile ottenere l\'URL pubblico del video.');
      }

      setUploadProgress(100);
      setUploadSuccess(true);

      // Notify parent
      if (onVideoUploaded) {
        onVideoUploaded(urlData.publicUrl);
      }

      // Safe cleanup of old video
      if (currentVideoUrl && (currentVideoUrl.includes(BUCKET_NAME) || currentVideoUrl.includes('event-images')) && currentVideoUrl !== urlData.publicUrl) {
        try {
          const oldPath = currentVideoUrl.split(`${BUCKET_NAME}/`).pop()?.split('event-images/').pop();
          if (oldPath && !oldPath.startsWith('http')) {
            await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore durante il caricamento del video.';
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
    if (onVideoRemoved) onVideoRemoved();
  };

  const displayVideo = preview || currentVideoUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-sky-400" />
          <span>Video Evento (Opzionale)</span>
        </label>
        {displayVideo && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Rimuovi Video</span>
          </button>
        )}
      </div>

      {/* Video Preview Player */}
      {displayVideo && (
        <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 bg-black">
          <video
            src={displayVideo}
            controls
            playsInline
            preload="metadata"
            className="w-full h-48 sm:h-56 object-cover"
          />

          {/* Top Actions Bar */}
          <div className="p-2 bg-alpine-950/90 border-t border-sky-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Film className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-zinc-300 truncate">
                {fileName || 'Video allegato'}
              </span>
              {fileSizeInfo && (
                <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30 flex-shrink-0">
                  {fileSizeInfo} · Qualità Originale
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-mono font-bold uppercase transition-colors"
            >
              <Replace className="w-3 h-3" />
              <span>Sostituisci</span>
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone (when no video is present) */}
      {!displayVideo && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? 'border-sky-400 bg-sky-400/10'
              : 'border-sky-500/25 hover:border-sky-400/50 bg-alpine-950/60 hover:bg-alpine-950'
          }`}
        >
          <div className="flex flex-col items-center gap-2.5">
            <div className={`p-3 rounded-xl ${dragOver ? 'bg-sky-400/20' : 'bg-sky-500/10'} transition-colors`}>
              <Video className={`w-5 h-5 ${dragOver ? 'text-sky-300' : 'text-sky-400'}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {dragOver ? 'Rilascia il video qui' : 'Seleziona un video o trascinalo qui'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                MP4, MOV, WEBM · Max 50 MB · 100% Qualità Originale senza ricodifica
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for videos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1.5 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Caricamento video originale in corso...
            </span>
            <span className="text-zinc-400">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-alpine-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && !uploading && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-mono text-emerald-300">Video originale caricato con successo (qualità intatta)!</span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs font-mono text-red-300">{uploadError}</span>
        </div>
      )}
    </div>
  );
};
