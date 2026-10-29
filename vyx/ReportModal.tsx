import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../src/api';
import { useAuth } from '../src/auth';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'inquiry' | 'feature' | 'abuse'>('bug');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !description.trim()) {
      setError('Por favor completa el asunto y los detalles del reporte.');
      return;
    }

    setLoading(true);
    try {
      await api.submitReport({
        subject: subject.trim(),
        description: description.trim(),
        category,
        reporterEmail: user ? user.email : reporterEmail.trim(),
        reporterName: user ? user.name : reporterName.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setSubject('');
        setDescription('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-850"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Centro de Reportes y Soporte</h3>
        <p className="text-xs text-slate-400 mb-4">
          Comunica una incidencia técnica, consulta empresarial o sugerencia directa al equipo de VEXARYX.
        </p>

        {success ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h4 className="text-base font-semibold text-white">¡Reporte Enviado con Éxito!</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Tu mensaje ha sido registrado en el panel administrativo de VEXARYX para su revisión inmediata.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Tu Nombre</label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Tu Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Tipo de Incidencia</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
              >
                <option value="bug">Error o Fallo Técnico (Bug)</option>
                <option value="inquiry">Consulta o Propuesta Comercial</option>
                <option value="feature">Solicitud de Característica</option>
                <option value="abuse">Reporte de Seguridad / Abuso</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Asunto</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Breve resumen del reporte"
                className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Descripción Detallada</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe con precisión qué ocurrió, pasos para reproducirlo o tu solicitud..."
                className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-[#ff5500] hover:bg-[#ff6a1a] disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-500/20"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Enviar Reporte</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
