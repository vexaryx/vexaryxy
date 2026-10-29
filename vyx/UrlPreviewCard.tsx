import React, { useState } from 'react';
import { ExternalLink, Globe, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../src/api';

interface UrlPreviewCardProps {
  url: string;
  onUrlChange: (url: string) => void;
  previewData?: {
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
  };
  onPreviewFetched?: (data: { title?: string; description?: string; image?: string; domain?: string }) => void;
}

export const UrlPreviewCard: React.FC<UrlPreviewCardProps> = ({
  url,
  onUrlChange,
  previewData,
  onPreviewFetched
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(previewData);

  const fetchPreview = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.trim()) return;
    setLoading(true);
    try {
      const data = await api.fetchUrlPreview(targetUrl.trim());
      setPreview(data);
      if (onPreviewFetched) onPreviewFetched(data);
    } catch {
      // Fallback
      try {
        const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
        const fallback = { title: parsed.hostname, domain: parsed.hostname, description: 'Enlace externo' };
        setPreview(fallback);
        if (onPreviewFetched) onPreviewFetched(fallback);
      } catch {
        // invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-300">URL Externa o Enlace de Destino</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="url"
            placeholder="https://ejemplo.com/novedad"
            value={url}
            onChange={e => onUrlChange(e.target.value)}
            onBlur={() => url && fetchPreview(url)}
            className="w-full pl-9 pr-3 py-2 bg-[#121217] border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#ff5500]"
          />
        </div>
        <button
          type="button"
          onClick={() => fetchPreview(url)}
          disabled={!url || loading}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff5500]" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Vista Previa</span>
        </button>
      </div>

      {preview && (preview.title || preview.image) && (
        <div className="mt-2 rounded-xl border border-slate-800 bg-[#0d0d12] p-3 flex gap-3 items-center overflow-hidden">
          {preview.image && (
            <img
              src={preview.image}
              alt={preview.title || 'Preview'}
              className="w-16 h-16 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-[#ff5500] uppercase tracking-wider block">
              {preview.domain || 'Enlace externo'}
            </span>
            <h4 className="text-xs font-semibold text-slate-200 truncate">{preview.title || url}</h4>
            {preview.description && (
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{preview.description}</p>
            )}
          </div>
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg shrink-0"
            title="Abrir enlace"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
