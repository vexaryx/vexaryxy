import React, { useState, useEffect } from 'react';
import { Project } from '../src/types';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { ExternalLink, Github, Eye, X, Check, Copy, Download, FileArchive } from 'lucide-react';
import { copyPublicationUrl } from '../src/utils/routes';

interface ProjectCardProps {
  project: Project;
  isAdmin?: boolean;
  onUpdate?: (updatedProject: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project: initialProject, isAdmin: propIsAdmin }) => {
  const { isAdmin: authIsAdmin } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  const [project, setProject] = useState<Project>(initialProject);
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await copyPublicationUrl('project', project);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Sync if parent updates project
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleOpenDetails = () => {
    setShowModal(true);
    api.trackProjectView(project.id);
    if (isAdmin) {
      setProject(prev => ({
        ...prev,
        views: (prev.views || 0) + 1
      }));
    }
  };

  const getCategoryLabel = (cat: Project['category']) => {
    switch (cat) {
      case 'app':
        return 'Aplicación Móvil';
      case 'web':
        return 'Plataforma Web';
      case 'system':
        return 'Sistema & Infra';
      case 'api':
        return 'Servicio API';
      default:
        return 'Proyecto VEXARYX';
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'live':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'beta':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'in_development':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'live':
        return 'En Producción';
      case 'beta':
        return 'Fase Beta';
      case 'in_development':
        return 'En Desarrollo';
    }
  };

  return (
    <>
      <div className="group relative rounded-2xl bg-[#161412] border border-[#2a241f] hover:border-[#e66822]/40 overflow-hidden transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-orange-950/20">
        {/* Glow Accent Top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e66822]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Media / Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-transparent to-black/40" />

          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide bg-black/70 backdrop-blur-md text-[#f57a33] border border-orange-900/40">
              {getCategoryLabel(project.category)}
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusColor(
                project.status
              )} backdrop-blur-md`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>

          {/* Version badge */}
          <div className="absolute bottom-2 right-3 font-mono text-[11px] text-[#a8a29e] bg-black/60 px-2 py-0.5 rounded border border-[#2a241f]">
            {project.version}
          </div>

          {/* ADMIN ONLY: Real Views Badge on Top Corner */}
          {isAdmin && (
            <div
              className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-[#e66822]/40 text-[#f57a33] text-[11px] font-mono shadow-md"
              title="Vistas reales registradas (Exclusivo para el administrador)"
            >
              <Eye className="w-3.5 h-3.5 text-[#e66822]" />
              <span className="font-bold">{project.views || 0}</span>
              <span className="text-[10px] text-[#a8a29e] hidden sm:inline">vistos</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#fafaf9] group-hover:text-[#f57a33] transition-colors">
              {project.title}
            </h3>
            <p className="mt-2 text-xs text-[#a8a29e] leading-relaxed line-clamp-2">
              {project.description}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#201c18] border border-[#2d2721] text-[10px] text-[#d6d3d1] font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer actions: Solo botón para copiar y descargas */}
          <div className="pt-3 border-t border-[#24201c] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181512] hover:bg-[#241f1a] border border-[#2e2721] hover:border-[#e66822]/40 text-xs font-medium text-[#d6d3d1] hover:text-[#f57a33] transition-colors"
              title="Copiar URL"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-xs">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#e66822]" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              {project.fileUrl && (
                <a
                  href={project.fileUrl}
                  download={project.fileName || true}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#251d16] hover:bg-[#34271c] border border-[#e66822]/40 text-[#f57a33] hover:text-white text-xs font-semibold transition-all shadow-sm shadow-orange-950/20"
                  title={`Descargar archivo (${project.fileName || 'Descarga'})`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.{project.fileType ? project.fileType.toUpperCase() : 'DESCARGAR'}</span>
                </a>
              )}

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackProjectView(project.id)}
                  className="p-1.5 rounded-lg bg-[#e66822] hover:bg-[#f57a33] text-white transition-colors"
                  title="Abrir enlace externo del proyecto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#141210] border border-[#2a241f] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8c857f] hover:text-white rounded-lg bg-[#201c18]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-[#f57a33] bg-[#27211c] border border-[#e66822]/30">
                {getCategoryLabel(project.category)}
              </span>
              <span className="font-mono text-xs text-[#8c857f]">{project.version}</span>

              {/* ADMIN ONLY in modal */}
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-amber-900/40 text-[#f57a33] font-mono text-[11px]">
                  <Eye className="w-3 h-3 text-[#e66822]" />
                  <span>{project.views || 0} vistas registradas</span>
                </span>
              )}
            </div>

            {/* Acciones del Modal: Solo botón Copiar */}
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-lg bg-[#221d18] hover:bg-[#2e2620] text-xs text-white font-medium flex items-center gap-1.5 border border-[#332a22] transition-colors"
                title="Copiar URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#e66822]" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <h2 className="text-xl font-bold text-[#fafaf9] mb-3">{project.title}</h2>

            <div className="rounded-xl overflow-hidden mb-4 border border-[#2a241f]">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-52 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-sm text-[#d6d3d1] leading-relaxed mb-4 whitespace-pre-line">
              {project.fullDetails || project.description}
            </p>

            <div className="mb-6">
              <h4 className="text-xs font-semibold text-[#8c857f] uppercase tracking-wider mb-2">
                Tecnologías y Especialidad
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#1e1a17] border border-[#2b241e] text-xs text-[#d6d3d1] font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Downloadable Project File Box */}
            {project.fileUrl && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#1a1612] border border-[#382b1e] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#251e18] border border-[#443323] flex items-center justify-center shrink-0">
                    <FileArchive className="w-5 h-5 text-[#f57a33]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff5500]/20 text-[#ff7722] border border-[#ff5500]/30 uppercase">
                        .{project.fileType?.toUpperCase() || 'FILE'}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-xs block">
                        {project.fileName || 'Archivo del Proyecto'}
                      </span>
                    </div>
                    {project.fileSize ? (
                      <span className="text-[11px] font-mono text-[#a8a29e]">
                        Tamaño: {(project.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    ) : null}
                  </div>
                </div>

                <a
                  href={project.fileUrl}
                  download={project.fileName || true}
                  className="px-3.5 py-2 rounded-xl bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-950/30 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo</span>
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#24201c]">
              <div className="flex items-center gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#d6d3d1] hover:text-white px-3 py-2 rounded-lg bg-[#201c18]"
                  >
                    <Github className="w-4 h-4" />
                    <span>Repositorio</span>
                  </a>
                )}
              </div>

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackProjectView(project.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-bold transition-colors"
                >
                  <span>Acceder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
