import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { Project, Announcement, GlobalNotification } from '../types';
import { NotificationBanner } from '../../vyx/NotificationBanner';
import { ProjectCard } from '../../vyx/ProjectCard';
import { ReportModal } from '../../vyx/ReportModal';
import {
  ExternalLink,
  Search,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Layers,
  Sparkles,
  PlusCircle,
  Globe,
  Copy,
  Check,
  Link2
} from 'lucide-react';
import { copyPublicationUrl, getPublicationPath } from '../utils/routes';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'app' | 'web' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);

  const handleCopyAdUrl = async (ad: Announcement) => {
    await copyPublicationUrl('announcement', ad);
    setCopiedAdId(ad.id);
    setTimeout(() => setCopiedAdId(null), 2000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, adsRes, notifsRes] = await Promise.all([
          api.getProjects(),
          api.getAnnouncements(false),
          api.getNotifications()
        ]);
        setProjects(projRes);
        setAnnouncements(adsRes);
        setNotifications(notifsRes);

        adsRes.forEach(ad => {
          api.trackImpression(ad.id);
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'all' || p.category === activeTab;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-[#d6d3d1] flex flex-col font-sans selection:bg-[#e66822] selection:text-white">
      {/* ================= MINIMALIST TOP BAR ================= */}
      <header className="sticky top-0 z-40 bg-[#0c0b0a]/90 backdrop-blur-md border-b border-[#24201c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <button
            onClick={() => onNavigate('dash')}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e66822] to-[#8c3809] flex items-center justify-center shadow-md shadow-orange-950/40">
              <span className="font-extrabold text-white text-sm tracking-tight">VX</span>
            </div>
            <span className="text-base font-bold tracking-tight text-[#fafaf9] group-hover:text-[#f57a33] transition-colors">
              VEXARYX
            </span>
          </button>

          {/* Simple Clean Navigation */}
          <nav className="flex items-center gap-6 text-xs font-medium text-[#a8a29e]">
            <button
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              className="hover:text-[#fafaf9] transition-colors"
            >
              Explorar
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="hover:text-[#fafaf9] transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#e66822]" />
              <span>Soporte</span>
            </button>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="px-3 py-1.5 rounded-lg bg-[#27211c] hover:bg-[#342b24] text-[#f57a33] border border-[#e66822]/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                )}
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-semibold text-[#fafaf9] block truncate max-w-[120px]">
                    {user.name}
                  </span>
                </div>
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
                className="px-3.5 py-1.5 text-xs font-semibold text-[#fafaf9] bg-[#e66822] hover:bg-[#f57a33] rounded-lg transition-all shadow-md shadow-orange-950/30 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Clean Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Global Notifications if active */}
        <NotificationBanner notifications={notifications} />

        {/* ================= MINIMALIST CLEAN HERO ================= */}
        <section className="text-center py-6 sm:py-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1b17] border border-[#2e2923] text-[11px] font-medium text-[#f57a33]">
            <Sparkles className="w-3 h-3" />
            <span>Ecosistema Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#fafaf9] tracking-tight">
            VEXARYX
          </h1>

          <p className="text-sm text-[#a8a29e] max-w-md mx-auto leading-relaxed">
            Plataforma moderna de desarrollo, aplicaciones web y servicios tecnológicos.
          </p>

          {/* Minimalist Search & Discovery Bar (ChatGPT / Spotify style) */}
          <div className="max-w-lg mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#78716c] absolute left-4" />
              <input
                type="text"
                placeholder="Buscar aplicaciones o proyectos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#151311] border border-[#2a2520] focus:border-[#e66822] rounded-full text-xs text-[#fafaf9] placeholder-[#78716c] focus:outline-none transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs text-[#78716c] hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
              {[
                { id: 'all', label: 'Todo' },
                { id: 'app', label: 'Apps Móviles' },
                { id: 'web', label: 'Plataformas Web' },
                { id: 'system', label: 'Sistemas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#2a241f] text-[#fafaf9] border border-[#e66822]/40 font-medium'
                      : 'text-[#8c857f] hover:text-[#fafaf9] hover:bg-[#1a1815]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ================= REAL ANNOUNCEMENTS (Only if admin created any) ================= */}
        {announcements.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8c857f] px-1">
              Novedades Destacadas
            </h2>
            <div className="grid gap-4">
              {announcements.map(ad => (
                <div
                  key={ad.id}
                  className="rounded-2xl p-5 bg-[#161412] border border-[#2a2520] hover:border-[#e66822]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {ad.mediaUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-[#2a2520]">
                        {ad.mediaType === 'video' ? (
                          <video src={ad.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={ad.mediaUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      {ad.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2a221b] text-[#f57a33] border border-[#e66822]/20">
                          {ad.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-[#fafaf9]">{ad.title}</h3>
                      <p className="text-xs text-[#a8a29e] leading-relaxed max-w-xl">{ad.description}</p>
                      
                      {/* Botón para copiar la URL: Solo dice Copiar */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleCopyAdUrl(ad)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#181512] hover:bg-[#241f1a] border border-[#2e2721] hover:border-[#e66822]/40 text-xs font-medium text-[#d6d3d1] hover:text-[#f57a33] transition-colors"
                          title="Copiar URL"
                        >
                          {copiedAdId === ad.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-sans text-xs">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#e66822]" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {ad.externalUrl && (
                    <div className="shrink-0 self-end sm:self-center">
                      <a
                        href={ad.externalUrl.startsWith('http') ? ad.externalUrl : `https://${ad.externalUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => api.trackClick(ad.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= PROJECTS & APPLICATIONS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8c857f]">
              Publicaciones & Proyectos
            </h2>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="text-xs text-[#f57a33] hover:text-[#fafaf9] flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Gestionar en Admin</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-44 rounded-2xl bg-[#141311] border border-[#24201c] animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-[#24201c] bg-[#141311] p-10 sm:p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#1e1b17] border border-[#2c2721] text-[#78716c] flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#fafaf9]">
                {projects.length === 0 ? 'Espacio Limpio' : 'No se encontraron resultados'}
              </h3>
              <p className="text-xs text-[#8c857f] leading-relaxed">
                {projects.length === 0
                  ? 'No hay publicaciones cargadas todavía. Los proyectos reales que agregue el administrador aparecerán en esta sección.'
                  : 'Prueba buscando con otros términos o cambia el filtro de categoría.'}
              </p>
              {isAdmin && projects.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#e66822] hover:bg-[#f57a33] text-white text-xs font-semibold transition-colors"
                >
                  Publicar Proyecto desde Admin
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredProjects.map(proj => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  isAdmin={isAdmin}
                  onUpdate={updatedProj => {
                    setProjects(prev => prev.map(p => (p.id === updatedProj.id ? updatedProj : p)));
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ================= QUIET MINIMAL FOOTER ================= */}
      <footer className="border-t border-[#1e1b17] py-8 text-center text-xs text-[#78716c] space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-[#a8a29e]">
          <button onClick={() => onNavigate('dash')} className="hover:text-white transition-colors">
            Inicio
          </button>
          <span>·</span>
          <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
            Cuenta
          </button>
          <span>·</span>
          <button onClick={() => setIsReportOpen(true)} className="hover:text-white transition-colors">
            Soporte
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
          © {new Date().getFullYear()} VEXARYX · Todos los derechos reservados.
        </p>
      </footer>

      {/* Support / Report Modal */}
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
};
