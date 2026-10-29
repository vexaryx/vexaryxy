import {
  User,
  Announcement,
  Project,
  GlobalNotification,
  Report,
  AuditLog,
  PlatformStats
} from './types';

const TOKEN_KEY = 'vexaryx_auth_token';
const USER_KEY = 'vexaryx_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage = data?.error || data?.message || `Error ${res.status}: Fallo en la solicitud`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: {
    name: string;
    email: string;
    password: string;
    phone: string;
    countryCode: string;
    countryName: string;
    dialCode: string;
  }): Promise<{ message: string; token: string; user: User }> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async login(body: { email: string; password: string }): Promise<{ message: string; token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  async updateProfile(updates: Partial<User> & { newPassword?: string }): Promise<{ message: string; user: User }> {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Announcements
  async getAnnouncement(id: string): Promise<Announcement> {
    return request(`/api/announcements/${id}`);
  },

  async getAnnouncements(includeAll = false, placement?: string): Promise<Announcement[]> {
    const params = new URLSearchParams();
    if (includeAll) params.set('all', 'true');
    if (placement) params.set('placement', placement);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/announcements${qs}`);
  },

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    return request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    return request(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteAnnouncement(id: string): Promise<{ message: string }> {
    return request(`/api/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  async trackImpression(id: string): Promise<void> {
    try {
      await fetch(`/api/announcements/${id}/impression`, { method: 'POST' });
    } catch {
      // silent
    }
  },

  async trackClick(id: string): Promise<void> {
    try {
      await fetch(`/api/announcements/${id}/click`, { method: 'POST' });
    } catch {
      // silent
    }
  },

  // Notifications
  async getNotifications(): Promise<GlobalNotification[]> {
    return request('/api/notifications');
  },

  async createNotification(data: Partial<GlobalNotification>): Promise<GlobalNotification> {
    return request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteNotification(id: string): Promise<{ message: string }> {
    return request(`/api/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects
  async getProject(id: string): Promise<Project> {
    return request(`/api/projects/${id}`);
  },

  async getProjects(): Promise<Project[]> {
    return request('/api/projects');
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    return request(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async trackProjectView(id: string): Promise<void> {
    try {
      await fetch(`/api/projects/${id}/view`, { method: 'POST' });
    } catch {
      // silent view tracking
    }
  },

  async rateProject(id: string, stars: number, clientToken?: string): Promise<{ message: string; project: Project }> {
    return request(`/api/projects/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ stars, clientToken })
    });
  },

  // Users (Admin)
  async getUsers(): Promise<User[]> {
    return request('/api/users');
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended'): Promise<{ message: string; user: User }> {
    return request(`/api/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<{ message: string; user: User }> {
    return request(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  // Reports
  async submitReport(data: {
    subject: string;
    description: string;
    category: string;
    reporterEmail?: string;
    reporterName?: string;
  }): Promise<{ message: string; report: Report }> {
    return request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getReports(): Promise<Report[]> {
    return request('/api/reports');
  },

  async updateReport(id: string, status: Report['status'], resolutionNote?: string): Promise<Report> {
    return request(`/api/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNote })
    });
  },

  // Admin Logs & Stats
  async getAuditLogs(): Promise<AuditLog[]> {
    return request('/api/logs');
  },

  async getStats(): Promise<PlatformStats> {
    return request('/api/stats');
  },

  // File & Media Upload
  async uploadMedia(dataUrl: string, filename?: string): Promise<{
    success: boolean;
    url: string;
    fileName: string;
    originalName?: string;
    extension?: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    return request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename })
    });
  },

  async uploadFile(dataUrl: string, filename?: string) {
    return this.uploadMedia(dataUrl, filename);
  },

  // URL Preview
  async fetchUrlPreview(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
  }> {
    return request('/api/preview', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }
};
