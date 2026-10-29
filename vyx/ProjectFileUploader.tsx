import React, { useState, useRef } from 'react';
import {
  FileArchive,
  Download,
  X,
  UploadCloud,
  Loader2,
  FileCode,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../src/api';

interface ProjectFileUploaderProps {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  onFileChanged: (info: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  }) => void;
  label?: string;
}

export const ProjectFileUploader: React.FC<ProjectFileUploaderProps> = ({
  fileUrl,
  fileName,
  fileSize,
  fileType,
  onFileChanged,
  label = 'Archivo Descargable del Proyecto (.apk, .zip, .rar, .exe, etc.)'
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileBadgeColor = (ext?: string) => {
    const e = (ext || '').toLowerCase();
    if (e === 'apk') return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
    if (e === 'zip' || e === 'rar' || e === '7z' || e === 'tar' || e === 'gz') {
      return 'bg-amber-950/60 text-amber-400 border-amber-500/40';
    }
    if (e === 'exe' || e === 'dmg' || e === 'deb' || e === 'msi') {
      return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40';
    }
    if (e === 'pdf' || e === 'doc' || e === 'docx') {
      return 'bg-rose-950/60 text-rose-400 border-rose-500/40';
    }
    return 'bg-[#2a221b] text-[#f57a33] border-[#e66822]/30';
  };

  const handleProcessFile = async (file: File) => {
    setError(null);
    if (!file) return;

    // 55MB limit for single file payload
    if (file.size > 55 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 55 MB.');
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 70);
          setProgress(percent);
        }
      };

      reader.onload = async () => {
        setProgress(80);
        const dataUrl = reader.result as string;
        try {
          const res = await api.uploadFile(dataUrl, file.name);
          setProgress(100);

          let detectedExt = res.extension;
          if (!detectedExt && file.name.includes('.')) {
            detectedExt = file.name.split('.').pop()?.toLowerCase();
          }

          onFileChanged({
            fileUrl: res.url,
            fileName: file.name,
            fileSize: res.sizeBytes || file.size,
            fileType: detectedExt || 'bin'
          });
        } catch (err: any) {
          setError(err.message || 'Error al subir el archivo al servidor');
        } finally {
          setUploading(false);
          setProgress(0);
        }
      };

      reader.onerror = () => {
        setError('Error al leer el archivo en el dispositivo');
        setUploading(false);
        setProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al preparar archivo');
      setUploading(false);
      setProgress(0);
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
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onFileChanged({
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined
    });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const ext = (fileType || (fileName?.includes('.') ? fileName.split('.').pop() : '') || 'FILE').toUpperCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300">{label}</label>
        {fileUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Quitar archivo
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {error && (
        <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {fileUrl ? (
        <div className="p-3.5 rounded-xl bg-[#12100e] border border-[#2e2620] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1e1915] border border-[#3b2f25] flex items-center justify-center shrink-0">
              {ext === 'APK' ? (
                <FileCheck className="w-5 h-5 text-emerald-400" />
              ) : ext === 'ZIP' || ext === 'RAR' || ext === '7Z' ? (
                <FileArchive className="w-5 h-5 text-amber-400" />
              ) : ext === 'PDF' ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : (
                <FileCode className="w-5 h-5 text-[#f57a33]" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getFileBadgeColor(ext)}`}>
                  .{ext}
                </span>
                <span className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md block">
                  {fileName || fileUrl.split('/').pop()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#a8a29e]">
                {fileSize && <span>{formatFileSize(fileSize)}</span>}
                <span className="text-emerald-400 flex items-center gap-1 font-sans">
                  <CheckCircle2 className="w-3 h-3" /> Listo para descargar
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              download={fileName || true}
              className="px-3 py-1.5 rounded-lg bg-[#27211b] hover:bg-[#382d23] border border-[#3d3227] text-xs font-medium text-[#f57a33] hover:text-white flex items-center gap-1.5 transition-colors"
              title="Descargar para probar"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#25201b] border border-[#2e2620] text-xs text-slate-300 hover:text-white transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
            dragActive
              ? 'border-[#ff5500] bg-[#ff5500]/10'
              : 'border-slate-800 hover:border-slate-700 bg-[#0e0e14]/60'
          }`}
        >
          {uploading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff5500]" />
              <p className="text-xs font-medium text-slate-300">
                Subiendo archivo... {progress > 0 && `${progress}%`}
              </p>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff5500] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-10 h-10 rounded-full bg-[#1b1713] border border-[#2e241c] flex items-center justify-center text-[#ff5500] mb-0.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Arrastra o haz clic para subir cualquier archivo (.apk, .zip, .rar, .pdf, .exe, etc.)
              </p>
              <p className="text-[11px] text-slate-400">
                Compatible con celulares y PC • Archivos ejecutables, binarios o comprimidos hasta 55MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
