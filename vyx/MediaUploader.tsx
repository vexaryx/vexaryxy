import React, { useState, useRef } from 'react';
import { Upload, Film, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';
import { api } from '../src/api';
import { MediaKind } from '../src/types';

interface MediaUploaderProps {
  currentUrl?: string;
  mediaType: MediaKind;
  onMediaChanged: (url: string, type: MediaKind) => void;
  label?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  currentUrl,
  mediaType,
  onMediaChanged,
  label = 'Subir Imagen o Video (Celular o Computadora)'
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setError(null);
    if (!file) return;

    // Check size limit (max 45MB)
    if (file.size > 45 * 1024 * 1024) {
      setError('El archivo supera el límite de 45MB');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setError('Por favor selecciona un archivo de imagen (JPG, PNG, WebP) o video (MP4, WebM)');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.uploadMedia(base64Data, file.name);
          onMediaChanged(res.url, isVideo ? 'video' : 'image');
        } catch (err: any) {
          setError(err.message || 'Error al subir archivo');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Error al leer el archivo en el dispositivo');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al procesar archivo');
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300">{label}</label>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onMediaChanged('', 'none')}
            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Quitar multimedia
          </button>
        )}
      </div>

      {currentUrl ? (
        <div className="relative rounded-xl border border-slate-800 bg-[#0d0d12] p-2 overflow-hidden">
          {mediaType === 'video' ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <video src={currentUrl} controls className="max-h-56 w-full object-contain" />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/60 flex items-center justify-center">
              <img
                src={currentUrl}
                alt="Vista previa"
                className="max-h-56 w-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <Check className="w-3.5 h-3.5" /> Archivo subido y listo
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#ff5500] hover:text-[#ff7722] font-medium"
            >
              Reemplazar archivo
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            dragActive
              ? 'border-[#ff5500] bg-[#ff5500]/10'
              : 'border-slate-800 hover:border-slate-700 bg-[#0d0d12]/60 hover:bg-[#121218]'
          }`}
        >
          {uploading ? (
            <div className="py-4 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff5500]" />
              <p className="text-xs text-slate-300">Subiendo multimedia a VEXARYX...</p>
            </div>
          ) : (
            <div className="py-3 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#181822] flex items-center justify-center text-[#ff5500] border border-slate-800">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Arrastra o toca para seleccionar foto o video desde tu dispositivo
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-orange-400" /> JPG, PNG, WEBP
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3 text-orange-400" /> MP4, WEBM
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
