import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { Project, Announcement } from '../types';
import {
  PublicationRouteType,
  getPublicationFullUrl,
  copyPublicationUrl,
  getPublicationPrefix
} from '../utils/routes';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Github,
  Layers,
  Sparkles,
  Calendar,
  Tag,
  Globe,
  Clock,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  MessageSquare,
  AlertCircle,
  Download,
  FileArchive,
  FileCheck
} from 'lucide-react';

interface PublicationDetailPageProps {
  pubType: PublicationRouteType;
  pubId: string;
  onNavigate: (page: string, state?: any) => void;
}

export const PublicationDetailPage: React.FC<PublicationDetailPageProps> = ({
  pubType,
  pubId,
  onNavigate
}) => {
  const { user, isAdmin, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Content state (either project or announcement)
  const [project, setProject] = useState<Project | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [otherProjects, setOtherProjects] = useState<Project[]>([]);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Load publication data
  useEffect(() => {
    let isMounted = true;

    async function loadPublication() {
      setLoading(true);
      setError(null);

      try {
        if (pubType === 'n') {
          // It's an announcement / news
          try {
            const ad = await api.getAnnouncement(pubId);
            if (isMounted) {
              setAnnouncement(ad);
              api.trackImpression(ad.id);
            }
          } catch (e) {
            // Check if it exists in all announcements
            const allAds = await api.getAnnouncements(true);
            const found = allAds.find(a => a.id === pubId);
            if (found && isMounted) {
              setAnnouncement(found);
              api.trackImpression(found.id);
            } else {
              throw new Error('Publicación no encontrada');
            }
          }
        } else {
          // pubType === 'p' (project/web/app) or 's' (system/api)
          try {
            const proj = await api.getProject(pubId);
            if (isMounted) {
              setProject(proj);
              // Track view on visit
              api.trackProjectView(proj.id);
              if (isAdmin) {
                setProject(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
              }
            }
          } catch (e) {
            // Fallback: check getProjects()
            const all = await api.getProjects();
            const found = all.find(p => p.id === pubId);
            if (found && isMounted) {
              setProject(found);
              api.trackProjectView(found.id);
            } else {
              // Maybe it was an announcement with this ID?
              try {
                const ad = await api.getAnnouncement(pubId);
                if (ad && isMounted) {
                  setAnnouncement(ad);
                  api.trackImpression(ad.id);
                  return;
                }
              } catch {
                // not an ad either
              }
              throw new Error('Publicación no encontrada');
            }
          }
        }

        // Also fetch other projects for related items carousel
        const allProj = await api.getProjects();
        if (isMounted) {
          setOtherProjects(allProj.filter(p => p.id !== pubId).slice(0, 3));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'No se pudo cargar la publicación');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPublication();

    return () => {
      isMounted = false;
    };
  }, [pubId, pubType, isAdmin]);

  const currentFullUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    if (project) {
      await copyPublicationUrl('project', project);
    } else if (announcement) {
      await copyPublicationUrl('announcement', announcement);
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        // fallback
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const title = project?.title || announcement?.title || 'VEXARYX Publicación';
    const text = project?.description || announcement?.description || 'Publicación en VEXARYX';
    const url = currentFullUrl;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const getBadgeInfo = () => {
    if (announcement) {
      return {
        label: 'NOVEDAD / ANUNCIO',
        tagBg: 'bg-purple-950/40 text-purple-300 border-purple-800/50',
        prefix: '/n/'
      };
    }
    if (project?.category === 'system' || project?.category === 'api' || pubType === 's') {
      return {
        label: project?.category === 'api' ? 'SERVICIO API' : 'SISTEMA & INFRAESTRUCTURA',
        tagBg: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50',
        prefix: '/s/'
      };
    }
    return {
      label: project?.category === 'app' ? 'APLICACIÓN MÓVIL' : 'PROYECTO & PLATAFORMA WEB',
      tagBg: 'bg-orange-950/40 text-orange-300 border-orange-800/50',
      prefix: '/p/'
    };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-[#d6d3d1] flex flex-col font-sans selection:bg-[#e66822] selection:text-white">
      {/* ================= TOP NAVIGATION ================= */}
      <header className="sticky top-0 z-40 bg-[#0c0b0a]/90 backdrop-blur-md border-b border-[#24201c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dash')}
              className="flex items-center gap-2 text-xs font-medium text-[#a8a29e] hover:text-white px-2.5 py-1.5 rounded-lg bg-[#191614] hover:bg-[#241f1a] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
            <div className="h-4 w-px bg-[#26211d] hidden sm:block" />
            <button
              onClick={() => onNavigate('dash')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e66822] to-[#8c3809] flex items-center justify-center shadow-md shadow-orange-950/40">
                <span className="font-extrabold text-white text-xs tracking-tight">VX</span>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#fafaf9] group-hover:text-[#f57a33] transition-colors hidden sm:inline">
                VEXARYX
              </span>
            </button>
          </div>

          {/* Clean Right Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-[#1c1916] hover:bg-[#28231e] text-[#fafaf9] text-xs font-semibold border border-[#2e2721] flex items-center gap-1.5 transition-all"
              title="Copiar enlace"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#e66822]" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="px-3 py-1.5 rounded-lg bg-[#27211c] hover:bg-[#342b24] text-[#f57a33] border border-[#e66822]/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <button
                  onClick={logout}
                  className="p-1.5 text-[#8c857f] hover:text-red-400 rounded-lg hover:bg-[#1a1714] transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-semibold text-[#fafaf9] bg-[#e66822] hover:bg-[#f57a33] rounded-lg transition-all shadow-md shadow-orange-950/30 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#e66822] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#8c857f]">Cargando publicación oficial de VEXARYX...</p>
          </div>
        ) : error || (!project && !announcement) ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-4 bg-[#141210] p-8 rounded-2xl border border-[#2a241f]">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Publicación no encontrada</h2>
            <p className="text-xs text-[#a8a29e] leading-relaxed">
              La publicación solicitada con ID <code className="text-[#f57a33] font-mono">{pubId}</code> no existe, ha sido movida o fue eliminada por la administración.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('dash')}
                className="px-4 py-2 rounded-xl bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-semibold transition-colors"
              >
                Volver a Explorar Proyectos
              </button>
            </div>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Breadcrumbs & Route Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#78716c] font-mono text-[11px]">
                <button onClick={() => onNavigate('dash')} className="hover:text-white transition-colors">
                  vexaryx.tech
                </button>
                <span>/</span>
                <span className="text-[#e66822] font-semibold">{badgeInfo.prefix}</span>
                <span>/</span>
                <span className="text-slate-400 truncate max-w-[160px]">{pubId}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${badgeInfo.tagBg}`}>
                  {badgeInfo.label}
                </span>

                {project?.version && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#1c1916] border border-[#2b2520] text-[#a8a29e]">
                    {project.version}
                  </span>
                )}

                {/* ADMIN ONLY: Real Views Badge on the publication header */}
                {isAdmin && (
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-orange-950/30 border border-orange-800/50 text-[#f57a33]"
                    title="Vistas reales registradas en el servidor (Solo visible para Administradores)"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#e66822]" />
                    <span className="font-bold">{project ? (project.views || 0) : (announcement?.impressions || 0)}</span>
                    <span className="text-[10px] text-slate-400">vistas (Admin)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Publication Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#fafaf9] tracking-tight leading-snug">
                {project ? project.title : announcement?.title}
              </h1>
              <p className="text-sm sm:text-base text-[#a8a29e] leading-relaxed max-w-3xl">
                {project ? project.description : announcement?.description}
              </p>
            </div>

            {/* Image / Media Showcase */}
            {(project?.imageUrl || announcement?.mediaUrl) && (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-[#2a241f] shadow-2xl">
                {announcement && announcement.mediaType === 'video' ? (
                  <video
                    src={announcement.mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project ? project.imageUrl : announcement?.mediaUrl}
                    alt={project ? project.title : announcement?.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* Clean Publication Share / Copy */}
            <div className="rounded-2xl bg-[#141210] border border-[#2a241f] p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#e66822]" />
                <span className="text-xs font-bold text-[#fafaf9] tracking-wide">
                  Enlace Oficial de la Publicación
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#201c18] hover:bg-[#2b2520] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#302923] transition-all"
                  title="Copiar enlace"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#e66822]" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNativeShare}
                  className="p-2 rounded-xl bg-[#201c18] hover:bg-[#2b2520] text-white border border-[#302923] transition-colors"
                  title="Compartir enlace"
                >
                  <Share2 className="w-4 h-4 text-[#e66822]" />
                </button>
              </div>
            </div>

            {/* Detailed Content & Specifications */}
            {project?.fullDetails && (
              <div className="rounded-2xl bg-[#141210] border border-[#2a241f] p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#fafaf9]">
                  Detalles y Especificaciones
                </h3>
                <div className="text-xs sm:text-sm text-[#d6d3d1] leading-relaxed whitespace-pre-line space-y-2">
                  {project.fullDetails}
                </div>
              </div>
            )}

            {/* Tags / Stack */}
            {project?.tags && project.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8c857f]">
                  Etiquetas y Tecnologías
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-[#181513] border border-[#28221c] text-xs font-mono text-[#d6d3d1]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Downloadable File Card (.apk, .zip, etc.) */}
            {project?.fileUrl && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#181410] to-[#1f1812] border border-[#3e2e21] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#281e16] border border-[#483424] flex items-center justify-center shrink-0">
                    <FileArchive className="w-6 h-6 text-[#ff6611]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff5500]/20 text-[#ff7722] border border-[#ff5500]/40 uppercase">
                        .{project.fileType?.toUpperCase() || 'FILE'}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">
                        {project.fileName || 'Descarga de Instalación / Código'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#a8a29e] flex items-center gap-2 font-mono">
                      {project.fileSize ? <span>{(project.fileSize / (1024 * 1024)).toFixed(2)} MB</span> : null}
                      <span>•</span>
                      <span className="text-emerald-400 font-sans">Archivo oficial de VEXARYX</span>
                    </p>
                  </div>
                </div>

                <a
                  href={project.fileUrl}
                  download={project.fileName || true}
                  className="px-5 py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all shrink-0 hover:scale-[1.02] active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar .{project.fileType?.toUpperCase() || 'ARCHIVO'}</span>
                </a>
              </div>
            )}

            {/* External Links / Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#24201c]">
              <div className="flex items-center gap-3">
                {project?.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1916] hover:bg-[#28231e] text-[#fafaf9] text-xs font-medium border border-[#2e2721] transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>Repositorio</span>
                  </a>
                )}
              </div>

              {project?.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackProjectView(project.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-bold transition-all shadow-lg shadow-orange-950/40"
                >
                  <span>Acceder al Proyecto</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {announcement?.externalUrl && (
                <a
                  href={
                    announcement.externalUrl.startsWith('http')
                      ? announcement.externalUrl
                      : `https://${announcement.externalUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackClick(announcement.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-bold transition-all shadow-lg shadow-orange-950/40"
                >
                  <span>Visitar Enlace Externo</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Other Projects / Explore More */}
            {otherProjects.length > 0 && (
              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8c857f]">
                    Otras Publicaciones en VEXARYX
                  </h3>
                  <button
                    onClick={() => onNavigate('dash')}
                    className="text-xs text-[#e66822] hover:underline"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {otherProjects.map(p => {
                    const prefix = getPublicationPrefix('project', p.category);
                    const path = `/${prefix}/${p.id}`;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          window.history.pushState({}, '', path);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="cursor-pointer group rounded-xl bg-[#141210] border border-[#24201c] hover:border-[#e66822]/40 p-3 transition-all"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden bg-black mb-2 border border-[#24201c]">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#f57a33] transition-colors">
                          {p.title}
                        </h4>
                        <span className="text-[10px] font-mono text-[#8c857f] block mt-0.5 uppercase tracking-wider">
                          {p.category || 'Proyecto'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#1e1b17] py-8 text-center text-xs text-[#78716c] space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-[#a8a29e]">
          <button onClick={() => onNavigate('dash')} className="hover:text-white transition-colors">
            Inicio
          </button>
          <span>·</span>
          <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
            Cuenta
          </button>
          {isAdmin && (
            <>
              <span>·</span>
              <button onClick={() => onNavigate('admin')} className="text-[#e66822] hover:underline">
                Panel Admin
              </button>
            </>
          )}
        </div>
        <p className="font-mono text-[11px] text-[#635d57]">
          © {new Date().getFullYear()} VEXARYX · Publicaciones y Proyectos Digitales.
        </p>
      </footer>
    </div>
  );
};
