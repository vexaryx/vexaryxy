import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import {
  User,
  Announcement,
  Project,
  GlobalNotification,
  Report,
  AuditLog,
  PlatformStats,
  AdPlacement,
  AdStatus,
  MediaKind,
  ProjectCategory
} from '../types';
import { MediaUploader } from '../../vyx/MediaUploader';
import { ProjectFileUploader } from '../../vyx/ProjectFileUploader';
import { UrlPreviewCard } from '../../vyx/UrlPreviewCard';
import {
  Users,
  Megaphone,
  Layers,
  Bell,
  FileText,
  Activity,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Loader2,
  RefreshCw,
  LogOut,
  Eye,
  MousePointer,
  Copy,
  Globe,
  Link2,
  Check,
  Download,
  FileArchive,
  FileCheck
} from 'lucide-react';
import { copyPublicationUrl, getPublicationPath } from '../utils/routes';

export const AdminPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'announcements' | 'projects' | 'notifications' | 'reports' | 'logs'>('overview');

  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopyAdUrl = async (ad: Announcement) => {
    await copyPublicationUrl('announcement', ad);
    setCopiedItem(ad.id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleCopyProjectUrl = async (proj: Project) => {
    await copyPublicationUrl('project', proj);
    setCopiedItem(proj.id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Modals & form states
  // 1. Announcement modal
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adMediaType, setAdMediaType] = useState<MediaKind>('none');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adExternalUrl, setAdExternalUrl] = useState('');
  const [adPlacement, setAdPlacement] = useState<AdPlacement>('hero');
  const [adDurationDays, setAdDurationDays] = useState(30);
  const [adStatus, setAdStatus] = useState<AdStatus>('active');
  const [adBadge, setAdBadge] = useState('');
  const [adPreviewData, setAdPreviewData] = useState<any>(null);

  // 2. Project modal
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState<ProjectCategory>('app');
  const [projDescription, setProjDescription] = useState('');
  const [projFullDetails, setProjFullDetails] = useState('');
  const [projTags, setProjTags] = useState('React, TypeScript, VEXARYX');
  const [projImageUrl, setProjImageUrl] = useState('/src/assets/images/vexaryx_hero_abstract_1793202617896.jpg');
  const [projLiveUrl, setProjLiveUrl] = useState('');
  const [projVersion, setProjVersion] = useState('v1.0.0');
  const [projFileUrl, setProjFileUrl] = useState<string | undefined>(undefined);
  const [projFileName, setProjFileName] = useState<string | undefined>(undefined);
  const [projFileSize, setProjFileSize] = useState<number | undefined>(undefined);
  const [projFileType, setProjFileType] = useState<string | undefined>(undefined);

  // 3. Notification modal
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<GlobalNotification['type']>('info');
  const [notifLinkUrl, setNotifLinkUrl] = useState('');
  const [notifImageUrl, setNotifImageUrl] = useState('');

  // 4. Report note modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, adsRes, projRes, notifsRes, repRes, logsRes] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getAnnouncements(true),
        api.getProjects(),
        api.getNotifications(),
        api.getReports(),
        api.getAuditLogs()
      ]);
      setStats(statsRes);
      setUsers(usersRes);
      setAnnouncements(adsRes);
      setProjects(projRes);
      setNotifications(notifsRes);
      setReports(repRes);
      setLogs(logsRes);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Error al cargar datos administrativos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  // If not admin, restrict view with clear message
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080a] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0f0f16] border border-red-900/60 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Acceso Administrativo Restringido</h2>
          <p className="text-xs text-slate-400">
            Debes iniciar sesión con las credenciales de administrador oficial (<code className="text-orange-400 font-mono">fedezyljx@gmail.com</code>) para acceder a esta consola privada.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold transition-colors"
            >
              Iniciar Sesión como Administrador
            </button>
            <button
              onClick={() => onNavigate('dash')}
              className="w-full py-2 rounded-xl bg-slate-900 text-slate-400 text-xs transition-colors"
            >
              Regresar al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleToggleUserStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      showFeedback(`Usuario ${targetUser.email} ${newStatus === 'active' ? 'reactivado' : 'suspendido'}`);
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adDescription) {
      showFeedback('Título y descripción requeridos', 'error');
      return;
    }
    try {
      const payload: Partial<Announcement> = {
        title: adTitle,
        description: adDescription,
        mediaType: adMediaType,
        mediaUrl: adMediaUrl || undefined,
        externalUrl: adExternalUrl || undefined,
        externalPreview: adPreviewData || undefined,
        placement: adPlacement,
        durationDays: Number(adDurationDays),
        status: adStatus,
        badge: adBadge || undefined
      };

      if (editingAdId) {
        await api.updateAnnouncement(editingAdId, payload);
        showFeedback('Anuncio actualizado con éxito');
      } else {
        await api.createAnnouncement(payload);
        showFeedback('Anuncio publicado correctamente');
      }
      setIsAdModalOpen(false);
      resetAdForm();
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este anuncio?')) return;
    try {
      await api.deleteAnnouncement(id);
      showFeedback('Anuncio eliminado');
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const resetAdForm = () => {
    setEditingAdId(null);
    setAdTitle('');
    setAdDescription('');
    setAdMediaType('none');
    setAdMediaUrl('');
    setAdExternalUrl('');
    setAdPlacement('hero');
    setAdDurationDays(30);
    setAdStatus('active');
    setAdBadge('');
    setAdPreviewData(null);
  };

  const openEditAd = (ad: Announcement) => {
    setEditingAdId(ad.id);
    setAdTitle(ad.title);
    setAdDescription(ad.description);
    setAdMediaType(ad.mediaType);
    setAdMediaUrl(ad.mediaUrl || '');
    setAdExternalUrl(ad.externalUrl || '');
    setAdPlacement(ad.placement);
    setAdDurationDays(ad.durationDays);
    setAdStatus(ad.status);
    setAdBadge(ad.badge || '');
    setAdPreviewData(ad.externalPreview || null);
    setIsAdModalOpen(true);
  };

  // --- Project Handlers ---
  const openNewProject = () => {
    setEditingProjId(null);
    setProjTitle('');
    setProjCategory('app');
    setProjDescription('');
    setProjFullDetails('');
    setProjTags('React, TypeScript, VEXARYX');
    setProjImageUrl('/src/assets/images/vexaryx_hero_abstract_1793202617896.jpg');
    setProjLiveUrl('');
    setProjVersion('v1.0.0');
    setProjFileUrl(undefined);
    setProjFileName(undefined);
    setProjFileSize(undefined);
    setProjFileType(undefined);
    setIsProjModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Project> = {
        title: projTitle,
        category: projCategory,
        description: projDescription,
        fullDetails: projFullDetails || projDescription,
        tags: projTags.split(',').map(t => t.trim()),
        imageUrl: projImageUrl,
        liveUrl: projLiveUrl || undefined,
        version: projVersion,
        fileUrl: projFileUrl || undefined,
        fileName: projFileName || undefined,
        fileSize: projFileSize || undefined,
        fileType: projFileType || undefined,
        status: 'live'
      };

      if (editingProjId) {
        await api.updateProject(editingProjId, payload);
        showFeedback('Proyecto actualizado');
      } else {
        await api.createProject(payload);
        showFeedback('Proyecto creado en VEXARYX');
      }
      setIsProjModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('¿Eliminar proyecto del catálogo?')) return;
    try {
      await api.deleteProject(id);
      showFeedback('Proyecto eliminado');
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const openEditProject = (proj: Project) => {
    setEditingProjId(proj.id);
    setProjTitle(proj.title);
    setProjCategory(proj.category);
    setProjDescription(proj.description);
    setProjFullDetails(proj.fullDetails || proj.description);
    setProjTags(proj.tags.join(', '));
    setProjImageUrl(proj.imageUrl || '');
    setProjLiveUrl(proj.liveUrl || '');
    setProjVersion(proj.version || 'v1.0.0');
    setProjFileUrl(proj.fileUrl);
    setProjFileName(proj.fileName);
    setProjFileSize(proj.fileSize);
    setProjFileType(proj.fileType);
    setIsProjModalOpen(true);
  };

  // --- Notification Handlers ---
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createNotification({
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        target: 'all',
        linkUrl: notifLinkUrl || undefined,
        imageUrl: notifImageUrl || undefined
      });
      showFeedback('Notificación global transmitida a todos los usuarios');
      setIsNotifModalOpen(false);
      setNotifTitle('');
      setNotifMessage('');
      setNotifLinkUrl('');
      setNotifImageUrl('');
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      showFeedback('Notificación eliminada');
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // --- Report Handlers ---
  const handleResolveReport = async (status: Report['status']) => {
    if (!selectedReport) return;
    try {
      await api.updateReport(selectedReport.id, status, resolutionNote);
      showFeedback(`Reporte marcado como ${status}`);
      setSelectedReport(null);
      setResolutionNote('');
      loadAllAdminData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dash')}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Volver al Portal Público"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ff5500] flex items-center justify-center font-bold text-white text-xs shadow-md shadow-orange-500/20">
                VX
              </div>
              <h1 className="text-sm font-extrabold text-white tracking-wider">
                VEXARYX <span className="text-[#ff7722] font-mono text-xs">/ Consola de Administración</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAllAdminData}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ff5500]' : ''}`} />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-300 font-semibold">{user.email}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ff5500]/20 text-[#ff7722] border border-[#ff5500]/40">
                SuperAdmin
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Action feedback toast */}
        {actionMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 transition-all ${
              actionMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            {actionMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0f0f16] border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'overview', label: 'Resumen & Métricas', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'announcements', label: 'Gestión de Anuncios', icon: <Megaphone className="w-3.5 h-3.5" /> },
            { id: 'users', label: 'Usuarios Registrados', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'projects', label: 'Proyectos & Apps', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'notifications', label: 'Notificaciones Globales', icon: <Bell className="w-3.5 h-3.5" /> },
            { id: 'reports', label: 'Bandeja de Reportes', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'logs', label: 'Registro de Auditoría', icon: <ShieldAlert className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#ff5500] text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ================= TAB 1: OVERVIEW & STATS ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0f0f16] border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Usuarios Totales</span>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums">{stats.totalUsers}</div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">
                    {stats.activeUsers} activos / {stats.suspendedUsers} suspendidos
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f0f16] border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Anuncios en Circulación</span>
                  <div className="text-2xl font-bold font-mono text-orange-400 tabular-nums">
                    {stats.activeAnnouncements}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    {stats.totalImpressions} vistas · {stats.totalClicks} clics
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f0f16] border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Proyectos & Apps</span>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums">{stats.totalProjects}</div>
                  <span className="text-[11px] text-orange-400 mt-1 block font-mono">
                    {stats.totalProjectViews || 0} vistas registradas
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f0f16] border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Reportes Pendientes</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                    {stats.pendingReports}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Requieren revisión</span>
                </div>
              </div>
            )}

            {/* Quick action shortcuts */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  resetAdForm();
                  setIsAdModalOpen(true);
                }}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#120e0d] to-[#181310] border border-[#ff5500]/30 hover:border-[#ff5500] text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ff5500]/20 flex items-center justify-center text-[#ff5500] mb-3 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Crear Anuncio o Promoción</h4>
                <p className="text-xs text-slate-400">
                  Publica banners, videos o enlaces externos con vista previa para la comunidad.
                </p>
              </button>

              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="p-5 rounded-2xl bg-[#0e0e15] border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Emitir Notificación Global</h4>
                <p className="text-xs text-slate-400">
                  Envía alertas inmediatas a todos los usuarios en la barra superior.
                </p>
              </button>

              <button
                onClick={() => {
                  setEditingProjId(null);
                  setProjTitle('');
                  setProjDescription('');
                  setIsProjModalOpen(true);
                }}
                className="p-5 rounded-2xl bg-[#0e0e15] border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Añadir Proyecto al Showcase</h4>
                <p className="text-xs text-slate-400">
                  Registra nuevas aplicaciones web o móviles en el catálogo oficial de VEXARYX.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ANNOUNCEMENTS MANAGEMENT ================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Anuncios y Promociones</h3>
                <p className="text-xs text-slate-400">
                  Administra las campañas activas, banners principales y videos promocionales.
                </p>
              </div>
              <button
                onClick={() => {
                  resetAdForm();
                  setIsAdModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Anuncio</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12121a] text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3.5">Título & Campaña</th>
                      <th className="p-3.5">Ubicación</th>
                      <th className="p-3.5">Multimedia</th>
                      <th className="p-3.5">Métricas</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {announcements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No hay anuncios registrados. Crea el primero arriba.
                        </td>
                      </tr>
                    ) : (
                      announcements.map(ad => (
                        <tr key={ad.id} className="hover:bg-slate-850/40">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-xs">{ad.title}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {ad.description}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyAdUrl(ad)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-[11px] font-medium text-purple-300 transition-colors"
                                title="Copiar enlace"
                              >
                                {copiedItem === ad.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-purple-400" />}
                                <span>{copiedItem === ad.id ? '¡Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-orange-400 uppercase">
                            {ad.placement}
                          </td>
                          <td className="p-3.5">
                            {ad.mediaUrl ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                {ad.mediaType.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Texto</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-[11px]">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Eye className="w-3 h-3 text-[#ff5500]" /> {ad.impressions || 0}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <MousePointer className="w-3 h-3 text-cyan-400" /> {ad.clicks || 0}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                ad.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {ad.status === 'active' ? 'ACTIVO' : 'PAUSADO'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditAd(ad)}
                                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAd(ad.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 rounded-lg"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: REGISTERED USERS ================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Gestión de Usuarios</h3>
                <p className="text-xs text-slate-400">
                  Cuentas registradas con número de teléfono y prefijo telefónico internacional.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12121a] text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3.5">Nombre & Correo</th>
                      <th className="p-3.5">Teléfono & País</th>
                      <th className="p-3.5">Rol</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5">Registro</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-850/40">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{u.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-xs text-slate-200">
                            {u.dialCode} {u.phone}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.countryName}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              u.role === 'admin'
                                ? 'bg-[#ff5500]/20 text-[#ff7722] border border-[#ff5500]/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {u.status === 'active' ? 'ACTIVA' : 'SUSPENDIDA'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3.5 text-right">
                          {u.email.toLowerCase() === 'fedezyljx@gmail.com' ? (
                            <span className="text-[10px] font-mono text-slate-500">Admin Principal</span>
                          ) : (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                                u.status === 'active'
                                  ? 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/60'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspender' : 'Reactivar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PROJECTS MANAGEMENT ================= */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Catálogo de Proyectos y Apps</h3>
                <p className="text-xs text-slate-400">
                  Controla las aplicaciones, plataformas web y APIs visibles en el dashboard.
                </p>
              </div>
              <button
                onClick={openNewProject}
                className="px-4 py-2 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Proyecto</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] p-12 text-center">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white">Catálogo de Proyectos Limpio</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  No hay proyectos registrados todavía. Haz clic en "Nuevo Proyecto" para agregar uno con sus archivos .apk, .zip, etc.
                </p>
                <button
                  onClick={openNewProject}
                  className="px-4 py-2 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  + Crear Primer Proyecto
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(proj => (
                  <div
                    key={proj.id}
                    className="rounded-2xl border border-slate-800 bg-[#0e0e14] p-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                        <img
                          src={proj.imageUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-[#ff5500] uppercase font-bold">
                          {proj.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{proj.version}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                    </div>

                    {/* Downloadable file preview pill if attached */}
                    {proj.fileUrl && (
                      <div className="mt-2.5 p-2 rounded-xl bg-[#09090e] border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="truncate min-w-0">
                            <span className="font-semibold text-slate-200 block truncate text-[11px]">
                              {proj.fileName || 'Archivo adjunto'}
                            </span>
                            {proj.fileSize ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(proj.fileSize / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <a
                          href={proj.fileUrl}
                          download={proj.fileName || true}
                          className="px-2 py-1 rounded bg-[#ff5500]/20 hover:bg-[#ff5500]/30 text-[#ff7722] hover:text-white border border-[#ff5500]/40 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                          title="Descargar archivo"
                        >
                          <Download className="w-3 h-3" />
                          <span>Descargar</span>
                        </a>
                      </div>
                    )}

                    {/* Real metrics for admin: views and clean copy button */}
                    <div className="mt-3 pt-2 pb-1 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-orange-400 bg-orange-950/20 px-2 py-0.5 rounded border border-orange-900/40" title="Vistas reales registradas">
                        <Eye className="w-3.5 h-3.5 text-[#ff5500]" />
                        <span>{proj.views || 0} vistas</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyProjectUrl(proj)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700/60"
                        title="Copiar enlace"
                      >
                        {copiedItem === proj.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#ff5500]" />}
                        <span>{copiedItem === proj.id ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(proj.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditProject(proj)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                          title="Editar Proyecto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: GLOBAL NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Notificaciones Globales</h3>
                <p className="text-xs text-slate-400">
                  Transmite avisos importantes, alertas técnicas o promociones para todos los visitantes.
                </p>
              </div>
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Emitir Notificación</span>
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] p-8 text-center text-slate-500 text-xs">
                No hay notificaciones activas. Puedes emitir una para todos los usuarios con el botón superior.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-xl border border-slate-800 bg-[#0e0e14] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {notif.imageUrl && (
                        <img
                          src={notif.imageUrl}
                          alt={notif.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-orange-400">
                            {notif.type}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(notif.createdAt).toLocaleTimeString('es-ES')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-lg bg-slate-900 transition-colors"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: REPORTS & TICKETS ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Bandeja de Reportes e Incidencias</h3>
              <p className="text-xs text-slate-400">
                Tickets generados por los usuarios desde el portal de soporte.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12121a] text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3.5">Remitente</th>
                      <th className="p-3.5">Asunto & Detalle</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5 text-right">Revisar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No hay reportes de usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      reports.map(rep => (
                        <tr key={rep.id} className="hover:bg-slate-850/40">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{rep.reporterName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{rep.reporterEmail}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{rep.subject}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                              {rep.description}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-orange-400 uppercase">
                            {rep.category}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                rep.status === 'resolved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : rep.status === 'dismissed'
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {rep.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">
                            {new Date(rep.createdAt).toLocaleDateString('es-ES')}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedReport(rep);
                                setResolutionNote(rep.resolutionNote || '');
                              }}
                              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                            >
                              Gestionar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: AUDIT LOGS ================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Registro de Acciones Administrativas</h3>
              <p className="text-xs text-slate-400">
                Historial inmutable de cambios y operaciones realizadas en la consola.
              </p>
            </div>

            {logs.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] p-8 text-center text-slate-500 text-xs">
                No hay registros de auditoría aún. Las acciones que realices en el panel se guardarán aquí automáticamente.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-[#0e0e14] p-4 font-mono text-xs space-y-2 max-h-[600px] overflow-y-auto">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[#12121a] border border-slate-850 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff5500]/15 text-[#ff7722] font-bold">
                          {log.action}
                        </span>
                        <span className="text-slate-300 font-semibold">{log.adminEmail}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= AD MODAL ================= */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#0e0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingAdId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
            </h3>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              {/* Public URL Live Preview */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-slate-300 font-mono">URL pública asignada:</span>
                  <span className="font-mono text-purple-300 font-bold">
                    /n/{editingAdId || 'ad_ID_GENERADO'}
                  </span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">Novedad / Anuncio (/n/)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Título del Anuncio</label>
                  <input
                    type="text"
                    required
                    value={adTitle}
                    onChange={e => setAdTitle(e.target.value)}
                    placeholder="Ej. Lanzamiento VEXARYX Core 2026"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Badge o Etiqueta</label>
                  <input
                    type="text"
                    value={adBadge}
                    onChange={e => setAdBadge(e.target.value)}
                    placeholder="Ej. NOVEDAD, PROMO, BETA"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={adDescription}
                  onChange={e => setAdDescription(e.target.value)}
                  placeholder="Detalles del anuncio que se mostrarán al usuario..."
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500] resize-none"
                />
              </div>

              {/* Media Uploader for image or video from device */}
              <MediaUploader
                currentUrl={adMediaUrl}
                mediaType={adMediaType}
                onMediaChanged={(url, type) => {
                  setAdMediaUrl(url);
                  setAdMediaType(type);
                }}
              />

              {/* External URL with preview */}
              <UrlPreviewCard
                url={adExternalUrl}
                onUrlChange={url => setAdExternalUrl(url)}
                previewData={adPreviewData}
                onPreviewFetched={data => setAdPreviewData(data)}
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Ubicación</label>
                  <select
                    value={adPlacement}
                    onChange={e => setAdPlacement(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="hero">Hero Principal</option>
                    <option value="dash">Dashboard General</option>
                    <option value="banner">Banner Superior</option>
                    <option value="modal">Modal Emergente</option>
                    <option value="sidebar">Barra Lateral</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Duración (Días)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={adDurationDays}
                    onChange={e => setAdDurationDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Estado</label>
                  <select
                    value={adStatus}
                    onChange={e => setAdStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="active">Activo (Visible)</option>
                    <option value="draft">Borrador (Oculto)</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#ff5500] hover:bg-[#ff6a1a] rounded-lg shadow-lg shadow-orange-500/20"
                >
                  {editingAdId ? 'Guardar Cambios' : 'Publicar Anuncio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PROJECT MODAL ================= */}
      {isProjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#0e0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingProjId ? 'Editar Proyecto' : 'Añadir Proyecto al Catálogo'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* Public URL Live Preview */}
              <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span className="text-slate-300 font-mono">URL pública asignada:</span>
                  <span className="font-mono text-[#ff7722] font-bold">
                    {projCategory === 'system' || projCategory === 'api' ? '/s/' : '/p/'}
                    {editingProjId || 'proj_ID_GENERADO'}
                  </span>
                </div>
                <span className="text-[10px] text-orange-400 font-mono">
                  {projCategory === 'system' || projCategory === 'api' ? 'Sistema / Servicio (/s/)' : 'Proyecto / App (/p/)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={e => setProjTitle(e.target.value)}
                    placeholder="Ej. Vexaryx Portal"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={projCategory}
                    onChange={e => setProjCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="app">Aplicación Móvil</option>
                    <option value="web">Plataforma Web</option>
                    <option value="system">Sistema & Infraestructura</option>
                    <option value="api">Servicio API</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Descripción Corta</label>
                <input
                  type="text"
                  required
                  value={projDescription}
                  onChange={e => setProjDescription(e.target.value)}
                  placeholder="Resumen para la tarjeta de presentación"
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Detalles Completos</label>
                <textarea
                  rows={3}
                  value={projFullDetails}
                  onChange={e => setProjFullDetails(e.target.value)}
                  placeholder="Información detallada para el modal descriptivo..."
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Versión</label>
                  <input
                    type="text"
                    value={projVersion}
                    onChange={e => setProjVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">URL de Acceso Directo</label>
                  <input
                    type="url"
                    value={projLiveUrl}
                    onChange={e => setProjLiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              {/* Media Uploader for Project Image from Gallery */}
              <MediaUploader
                currentUrl={projImageUrl}
                mediaType="image"
                onMediaChanged={(url) => setProjImageUrl(url || '')}
                label="Imagen de Portada (Subir desde Galería del Celular o PC)"
              />

              {/* Subir Archivo del Proyecto (.apk, .zip, etc.) */}
              <ProjectFileUploader
                fileUrl={projFileUrl}
                fileName={projFileName}
                fileSize={projFileSize}
                fileType={projFileType}
                onFileChanged={(info) => {
                  setProjFileUrl(info.fileUrl);
                  setProjFileName(info.fileName);
                  setProjFileSize(info.fileSize);
                  setProjFileType(info.fileType);
                }}
                label="Subir Archivo de Descarga (.apk, .zip, .rar, .exe, .pdf, etc.)"
              />

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Tags (separados por coma)</label>
                <input
                  type="text"
                  value={projTags}
                  onChange={e => setProjTags(e.target.value)}
                  placeholder="React, Swift, Cloud"
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#ff5500] hover:bg-[#ff6a1a] rounded-lg shadow-lg shadow-orange-500/20"
                >
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION MODAL ================= */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0e0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Emitir Notificación Global</h3>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Título de la Notificación</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  placeholder="Ej. Actualización de Plataforma"
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Mensaje</label>
                <textarea
                  required
                  rows={3}
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  placeholder="Mensaje que verán todos los usuarios en el banner..."
                  className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tipo de Aviso</label>
                  <select
                    value={notifType}
                    onChange={e => setNotifType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="info">Información General</option>
                    <option value="announcement">Anuncio Oficial</option>
                    <option value="update">Actualización Técnica</option>
                    <option value="promo">Promoción Especial</option>
                    <option value="alert">Alerta Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Enlace de Destino (Opcional)</label>
                  <input
                    type="text"
                    value={notifLinkUrl}
                    onChange={e => setNotifLinkUrl(e.target.value)}
                    placeholder="/web/dash.html"
                    className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              {/* Media Uploader for Notification Image from Gallery */}
              <MediaUploader
                currentUrl={notifImageUrl}
                mediaType="image"
                onMediaChanged={(url) => setNotifImageUrl(url || '')}
                label="Imagen de la Notificación (Opcional - Subir desde Galería o PC)"
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#ff5500] hover:bg-[#ff6a1a] rounded-lg shadow-lg shadow-orange-500/20"
                >
                  Transmitir Notificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REPORT MANAGEMENT MODAL ================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0e0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Revisión de Reporte #{selectedReport.id}</h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Usuario:</span>{' '}
                <strong className="text-white">{selectedReport.reporterName}</strong> ({selectedReport.reporterEmail})
              </div>
              <div>
                <span className="text-slate-400">Asunto:</span> <strong className="text-white">{selectedReport.subject}</strong>
              </div>
              <div>
                <span className="text-slate-400">Categoría:</span>{' '}
                <span className="text-orange-400 uppercase font-mono">{selectedReport.category}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Descripción del Usuario:</label>
              <div className="p-3 rounded-xl bg-[#121218] border border-slate-800 text-xs text-slate-200 whitespace-pre-line max-h-40 overflow-y-auto">
                {selectedReport.description}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Nota de Resolución Interna:</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Indica las medidas tomadas o el veredicto..."
                className="w-full px-3 py-2 bg-[#14141c] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolveReport('dismissed')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-slate-800"
                >
                  Desestimar
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveReport('resolved')}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Marcar como Resuelto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
