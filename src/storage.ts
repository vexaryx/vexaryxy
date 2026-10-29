import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { firestore } from './firebase';
import {
  User,
  Announcement,
  Project,
  GlobalNotification,
  Report,
  AuditLog,
  PlatformStats
} from './types';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  announcements: Announcement[];
  projects: Project[];
  notifications: GlobalNotification[];
  reports: Report[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default initial admin credentials
export const INITIAL_ADMIN_EMAIL = 'fedezyljx@gmail.com';
export const INITIAL_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Vexaryx2025!Admin#';

function getInitialData(): DatabaseSchema {
  const adminSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync(INITIAL_ADMIN_PASSWORD, adminSalt);

  const initialAdmin: StoredUser = {
    id: 'user_admin_initial',
    name: 'Fede Zyljx',
    email: INITIAL_ADMIN_EMAIL,
    phone: '5491140001122',
    countryCode: 'AR',
    countryName: 'Argentina',
    dialCode: '+54',
    role: 'admin',
    status: 'active',
    passwordHash: adminPasswordHash,
    createdAt: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  };

  return {
    users: [initialAdmin],
    announcements: [],
    projects: [],
    notifications: [],
    reports: [],
    auditLogs: []
  };
}

function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

class StorageEngine {
  private data: DatabaseSchema;
  private isFirestoreSynced = false;

  constructor() {
    this.data = this.load();
    this.ensureAdminExists();
    this.syncFromFirestore().catch(err => {
      console.warn('[StorageEngine] Background Firestore sync notice:', err?.message || err);
    });
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const mockAdIds = ['ad_vexaryx_launch', 'ad_vexaryx_promo'];
        const mockProjIds = ['proj_vexaryx_cloud', 'proj_vyx_portal', 'proj_vexaryx_shield', 'proj_vyx_mobile'];
        const mockNotifIds = ['notif_welcome', 'notif_security'];

        const cleanedData: DatabaseSchema = {
          users: (parsed.users || []).filter((u: any) => u.email !== 'carlos@tech.com'),
          announcements: (parsed.announcements || []).filter((a: any) => !mockAdIds.includes(a.id)),
          projects: (parsed.projects || []).filter((p: any) => !mockProjIds.includes(p.id)),
          notifications: (parsed.notifications || []).filter((n: any) => !mockNotifIds.includes(n.id)),
          reports: parsed.reports || [],
          auditLogs: (parsed.auditLogs || []).filter((l: any) => l.action !== 'INIT_PLATFORM')
        };
        this.saveDirect(cleanedData);
        return cleanedData;
      }
    } catch (err) {
      console.error('[StorageEngine] Error loading database file, initializing defaults:', err);
    }
    const initial = getInitialData();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[StorageEngine] Failed to save database file:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // Persist directly to real Cloud Firestore
  private async persistToFirestore(colName: string, id: string, docData: any) {
    try {
      const sanitized = cleanForFirestore(docData);
      await setDoc(doc(firestore, colName, id), sanitized, { merge: true });
    } catch (err: any) {
      console.error(`[StorageEngine -> Firestore] Error writing to ${colName}/${id}:`, err?.message || err);
    }
  }

  private async deleteFromFirestore(colName: string, id: string) {
    try {
      await deleteDoc(doc(firestore, colName, id));
    } catch (err: any) {
      console.error(`[StorageEngine -> Firestore] Error deleting from ${colName}/${id}:`, err?.message || err);
    }
  }

  // Load existing data from Firestore on boot
  public async syncFromFirestore() {
    try {
      const [usersSnap, projSnap, adsSnap, notifSnap, repSnap, logsSnap] = await Promise.allSettled([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'projects')),
        getDocs(collection(firestore, 'announcements')),
        getDocs(collection(firestore, 'notifications')),
        getDocs(collection(firestore, 'reports')),
        getDocs(collection(firestore, 'auditLogs'))
      ]);

      if (usersSnap.status === 'fulfilled' && !usersSnap.value.empty) {
        const cloudUsers: StoredUser[] = [];
        usersSnap.value.forEach(d => cloudUsers.push(d.data() as StoredUser));
        if (cloudUsers.length > 0) {
          // Merge by email/id
          cloudUsers.forEach(cu => {
            const idx = this.data.users.findIndex(u => u.id === cu.id || u.email.toLowerCase() === cu.email.toLowerCase());
            if (idx >= 0) {
              this.data.users[idx] = { ...this.data.users[idx], ...cu };
            } else {
              this.data.users.push(cu);
            }
          });
        }
      }

      if (projSnap.status === 'fulfilled' && !projSnap.value.empty) {
        const cloudProjects: Project[] = [];
        projSnap.value.forEach(d => cloudProjects.push(d.data() as Project));
        if (cloudProjects.length > 0) {
          this.data.projects = cloudProjects;
        }
      }

      if (adsSnap.status === 'fulfilled' && !adsSnap.value.empty) {
        const cloudAds: Announcement[] = [];
        adsSnap.value.forEach(d => cloudAds.push(d.data() as Announcement));
        if (cloudAds.length > 0) {
          this.data.announcements = cloudAds;
        }
      }

      if (notifSnap.status === 'fulfilled' && !notifSnap.value.empty) {
        const cloudNotifs: GlobalNotification[] = [];
        notifSnap.value.forEach(d => cloudNotifs.push(d.data() as GlobalNotification));
        if (cloudNotifs.length > 0) {
          this.data.notifications = cloudNotifs;
        }
      }

      if (repSnap.status === 'fulfilled' && !repSnap.value.empty) {
        const cloudReports: Report[] = [];
        repSnap.value.forEach(d => cloudReports.push(d.data() as Report));
        if (cloudReports.length > 0) {
          this.data.reports = cloudReports;
        }
      }

      if (logsSnap.status === 'fulfilled' && !logsSnap.value.empty) {
        const cloudLogs: AuditLog[] = [];
        logsSnap.value.forEach(d => cloudLogs.push(d.data() as AuditLog));
        if (cloudLogs.length > 0) {
          this.data.auditLogs = cloudLogs;
        }
      }

      this.ensureAdminExists();
      this.saveDirect(this.data);
      this.isFirestoreSynced = true;

      // Sync initial admin to Firestore if not present in cloud
      const adminUser = this.data.users.find(u => u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());
      if (adminUser) {
        this.persistToFirestore('users', adminUser.id, adminUser);
        // Also register in admins collection for security rules
        this.persistToFirestore('admins', adminUser.id, { email: adminUser.email, role: 'admin' });
      }

      console.log('[StorageEngine] Synchronized successfully with real Cloud Firestore database');
    } catch (err: any) {
      console.warn('[StorageEngine] Firestore initial sync skipped (local storage operational):', err?.message || err);
    }
  }

  private ensureAdminExists() {
    const adminIndex = this.data.users.findIndex(u => u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());
    if (adminIndex === -1) {
      const adminSalt = bcrypt.genSaltSync(10);
      const adminPasswordHash = bcrypt.hashSync(INITIAL_ADMIN_PASSWORD, adminSalt);
      const newAdmin: StoredUser = {
        id: 'user_admin_initial',
        name: 'Fede Zyljx',
        email: INITIAL_ADMIN_EMAIL,
        phone: '5491140001122',
        countryCode: 'AR',
        countryName: 'Argentina',
        dialCode: '+54',
        role: 'admin',
        status: 'active',
        passwordHash: adminPasswordHash,
        createdAt: new Date().toISOString()
      };
      this.data.users.push(newAdmin);
      this.save();
      this.persistToFirestore('users', newAdmin.id, newAdmin);
      this.persistToFirestore('admins', newAdmin.id, { email: newAdmin.email, role: 'admin' });
    } else {
      if (this.data.users[adminIndex].role !== 'admin') {
        this.data.users[adminIndex].role = 'admin';
        this.save();
        this.persistToFirestore('users', this.data.users[adminIndex].id, this.data.users[adminIndex]);
      }
    }
  }

  // --- Users ---
  public getUsers(): StoredUser[] {
    return this.data.users;
  }

  public getSafeUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...safe }) => safe);
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public addUser(user: StoredUser): User {
    this.data.users.push(user);
    this.save();
    this.persistToFirestore('users', user.id, user);
    if (user.role === 'admin') {
      this.persistToFirestore('admins', user.id, { email: user.email, role: 'admin' });
    }
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public updateUserStatus(id: string, status: 'active' | 'suspended'): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    user.status = status;
    this.save();
    this.persistToFirestore('users', user.id, user);
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public updateUserRole(id: string, role: 'admin' | 'user'): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    user.role = role;
    this.save();
    this.persistToFirestore('users', user.id, user);
    if (role === 'admin') {
      this.persistToFirestore('admins', user.id, { email: user.email, role: 'admin' });
    } else {
      this.deleteFromFirestore('admins', user.id);
    }
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public updateUserProfile(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    this.persistToFirestore('users', user.id, user);
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // --- Announcements ---
  public getAnnouncements(includeAll = false): Announcement[] {
    if (includeAll) return this.data.announcements;
    return this.data.announcements.filter(a => a.status === 'active');
  }

  public getAnnouncementById(id: string): Announcement | undefined {
    return this.data.announcements.find(a => a.id === id);
  }

  public addAnnouncement(ad: Announcement): Announcement {
    this.data.announcements.unshift(ad);
    this.save();
    this.persistToFirestore('announcements', ad.id, ad);
    return ad;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const index = this.data.announcements.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.data.announcements[index] = { ...this.data.announcements[index], ...updates };
    this.save();
    this.persistToFirestore('announcements', this.data.announcements[index].id, this.data.announcements[index]);
    return this.data.announcements[index];
  }

  public deleteAnnouncement(id: string): boolean {
    const initialLen = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter(a => a.id !== id);
    if (this.data.announcements.length !== initialLen) {
      this.save();
      this.deleteFromFirestore('announcements', id);
      return true;
    }
    return false;
  }

  public trackAdImpression(id: string) {
    const ad = this.data.announcements.find(a => a.id === id);
    if (ad) {
      ad.impressions = (ad.impressions || 0) + 1;
      this.save();
      this.persistToFirestore('announcements', ad.id, ad);
    }
  }

  public trackAdClick(id: string) {
    const ad = this.data.announcements.find(a => a.id === id);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      this.save();
      this.persistToFirestore('announcements', ad.id, ad);
    }
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  public addProject(project: Project): Project {
    this.data.projects.unshift(project);
    this.save();
    this.persistToFirestore('projects', project.id, project);
    return project;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.projects[index] = { ...this.data.projects[index], ...updates };
    this.save();
    this.persistToFirestore('projects', this.data.projects[index].id, this.data.projects[index]);
    return this.data.projects[index];
  }

  public deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    if (this.data.projects.length !== initialLen) {
      this.save();
      this.deleteFromFirestore('projects', id);
      return true;
    }
    return false;
  }

  public trackProjectView(id: string) {
    const proj = this.data.projects.find(p => p.id === id);
    if (proj) {
      proj.views = (proj.views || 0) + 1;
      this.save();
      this.persistToFirestore('projects', proj.id, proj);
    }
  }

  public rateProject(id: string, stars: number, userIdentifier: string): Project | null {
    const proj = this.data.projects.find(p => p.id === id);
    if (!proj) return null;

    if (!proj.ratings) proj.ratings = [];

    const existingIndex = proj.ratings.findIndex(r => r.userIdOrIp === userIdentifier);
    if (existingIndex >= 0) {
      proj.ratings[existingIndex].stars = stars;
      proj.ratings[existingIndex].createdAt = new Date().toISOString();
    } else {
      proj.ratings.push({
        id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userIdOrIp: userIdentifier,
        stars,
        createdAt: new Date().toISOString()
      });
    }

    const totalStars = proj.ratings.reduce((acc, r) => acc + r.stars, 0);
    proj.ratingCount = proj.ratings.length;
    proj.rating = parseFloat((totalStars / proj.ratingCount).toFixed(1));

    this.save();
    this.persistToFirestore('projects', proj.id, proj);
    return proj;
  }

  // --- Notifications ---
  public getNotifications(onlyActive = true): GlobalNotification[] {
    if (!onlyActive) return this.data.notifications;
    return this.data.notifications.filter(n => n.active);
  }

  public addNotification(notification: GlobalNotification): GlobalNotification {
    this.data.notifications.unshift(notification);
    this.save();
    this.persistToFirestore('notifications', notification.id, notification);
    return notification;
  }

  public deleteNotification(id: string): boolean {
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter(n => n.id !== id);
    if (this.data.notifications.length !== initialLen) {
      this.save();
      this.deleteFromFirestore('notifications', id);
      return true;
    }
    return false;
  }

  // --- Reports ---
  public getReports(): Report[] {
    return this.data.reports;
  }

  public addReport(report: Report): Report {
    this.data.reports.unshift(report);
    this.save();
    this.persistToFirestore('reports', report.id, report);
    return report;
  }

  public updateReportStatus(id: string, status: Report['status'], note?: string): Report | null {
    const report = this.data.reports.find(r => r.id === id);
    if (!report) return null;
    report.status = status;
    if (note) report.resolutionNote = note;
    this.save();
    this.persistToFirestore('reports', report.id, report);
    return report;
  }

  // --- Audit Logs ---
  public logAction(adminEmail: string, action: string, details: string, ip?: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      adminEmail,
      action,
      details,
      ip,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
    this.persistToFirestore('auditLogs', log.id, log);
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Stats ---
  public getStats(): PlatformStats {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter(u => u.status === 'active').length;
    const suspendedUsers = this.data.users.filter(u => u.status === 'suspended').length;
    const totalProjects = this.data.projects.length;
    const activeAnnouncements = this.data.announcements.filter(a => a.status === 'active').length;
    const totalImpressions = this.data.announcements.reduce((acc, a) => acc + (a.impressions || 0), 0);
    const totalClicks = this.data.announcements.reduce((acc, a) => acc + (a.clicks || 0), 0);
    const pendingReports = this.data.reports.filter(r => r.status === 'pending').length;
    const notificationsCount = this.data.notifications.filter(n => n.active).length;
    const totalProjectViews = this.data.projects.reduce((acc, p) => acc + (p.views || 0), 0);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProjects,
      activeAnnouncements,
      totalImpressions,
      totalClicks,
      pendingReports,
      notificationsCount,
      totalProjectViews
    };
  }
}

export const db = new StorageEngine();
