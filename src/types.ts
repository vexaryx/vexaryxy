export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  countryName: string;
  dialCode: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export type MediaKind = 'image' | 'video' | 'none';
export type AdPlacement = 'hero' | 'dash' | 'banner' | 'modal' | 'sidebar';
export type AdStatus = 'active' | 'draft' | 'archived';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  mediaType: MediaKind;
  mediaUrl?: string;
  externalUrl?: string;
  externalPreview?: {
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
  };
  placement: AdPlacement;
  durationDays: number;
  status: AdStatus;
  badge?: string;
  targetCategory?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  expiresAt: string;
}

export type ProjectCategory = 'app' | 'web' | 'system' | 'api';
export type ProjectStatus = 'live' | 'beta' | 'in_development';

export interface ProjectRatingRecord {
  id: string;
  userIdOrIp: string;
  stars: number;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  fullDetails: string;
  tags: string[];
  status: ProjectStatus;
  liveUrl?: string;
  githubUrl?: string;
  imageUrl: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  featured: boolean;
  version: string;
  views: number;
  rating: number;
  ratingCount: number;
  ratings?: ProjectRatingRecord[];
  createdAt: string;
}

export type NotificationType = 'info' | 'announcement' | 'update' | 'promo' | 'alert';

export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: 'all' | 'admins';
  active: boolean;
  linkUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export type ReportCategory = 'bug' | 'abuse' | 'inquiry' | 'feature';
export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterEmail: string;
  reporterName: string;
  subject: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  createdAt: string;
  resolutionNote?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalProjects: number;
  activeAnnouncements: number;
  totalImpressions: number;
  totalClicks: number;
  pendingReports: number;
  notificationsCount: number;
  totalProjectViews?: number;
}
