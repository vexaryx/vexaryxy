import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, INITIAL_ADMIN_EMAIL } from './src/storage';
import { User, Announcement, Project, GlobalNotification, Report } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vexaryx_super_secret_jwt_key_2025';

// Increase payload limit to support direct base64 uploads from mobile/desktop
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure public uploads directory is served
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// JWT helpers
interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Acceso no autorizado: Token requerido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Tu cuenta ha sido suspendida por la administración de VEXARYX.' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado' });
    return;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  authenticateToken(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Permisos insuficientes: se requiere rol de Administrador' });
      return;
    }
    next();
  });
}

// Optional Auth (for tracking impressions/context)
function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const user = db.findUserById(decoded.userId);
      if (user && user.status !== 'suspended') {
        (req as any).user = user;
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password, phone, countryCode, countryName, dialCode } = req.body;

    if (!name || !email || !password || !phone || !countryCode || !dialCode) {
      res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      res.status(400).json({ error: 'El correo electrónico no es válido' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico' });
      return;
    }

    // Role is STRICTLY 'user' during public registration - cannot elevate to admin
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      countryCode: String(countryCode).toUpperCase(),
      countryName: String(countryName || countryCode),
      dialCode: String(dialCode),
      role: 'user' as const,
      status: 'active' as const,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    const safeUser = db.addUser(newUser);
    const token = generateToken({ userId: safeUser.id, email: safeUser.email, role: safeUser.role });

    res.status(201).json({
      message: 'Cuenta creada con éxito',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error interno en el servidor al registrar usuario' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Correo y contraseña requeridos' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const storedUser = db.findUserByEmail(cleanEmail);

    if (!storedUser) {
      res.status(401).json({ error: 'Credenciales inválidas. Revisa tu correo o contraseña.' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, storedUser.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciales inválidas. Revisa tu correo o contraseña.' });
      return;
    }

    if (storedUser.status === 'suspended') {
      res.status(403).json({ error: 'Esta cuenta ha sido suspendida. Contacta a soporte VEXARYX.' });
      return;
    }

    // Update last login
    db.updateUserProfile(storedUser.id, { lastLogin: new Date().toISOString() });

    const token = generateToken({
      userId: storedUser.id,
      email: storedUser.email,
      role: storedUser.role
    });

    const { passwordHash, ...safeUser } = storedUser;
    safeUser.lastLogin = new Date().toISOString();

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en el servidor al autenticar' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req: Request, res: Response): void => {
  const currentUser = (req as any).user;
  const { name, phone, countryCode, countryName, dialCode, newPassword } = req.body;

  const updates: Partial<User> = {};
  if (name) updates.name = String(name).trim();
  if (phone) updates.phone = String(phone).trim();
  if (countryCode) updates.countryCode = String(countryCode).toUpperCase();
  if (countryName) updates.countryName = String(countryName);
  if (dialCode) updates.dialCode = String(dialCode);

  if (newPassword && String(newPassword).length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);
    (updates as any).passwordHash = passwordHash;
  }

  const updated = db.updateUserProfile(currentUser.id, updates);
  res.json({ message: 'Perfil actualizado con éxito', user: updated });
});

// ==================== ANNOUNCEMENTS / ADS ====================

// Public list of announcements
app.get('/api/announcements', optionalAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const includeAll = user && user.role === 'admin' && req.query.all === 'true';
  const placement = req.query.placement as string | undefined;

  let ads = db.getAnnouncements(includeAll);
  if (placement) {
    ads = ads.filter(a => a.placement === placement);
  }
  res.json(ads);
});

// Get Single Announcement (Public)
app.get('/api/announcements/:id', (req: Request, res: Response): void => {
  const ad = db.getAnnouncementById(req.params.id);
  if (!ad) {
    res.status(404).json({ error: 'Novedad o anuncio no encontrado' });
    return;
  }
  res.json(ad);
});

// Create Announcement (Admin)
app.post('/api/announcements', requireAdmin, (req: Request, res: Response): void => {
  try {
    const admin = (req as any).user;
    const {
      title,
      description,
      mediaType,
      mediaUrl,
      externalUrl,
      externalPreview,
      placement,
      durationDays,
      status,
      badge,
      targetCategory
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'El título y la descripción son obligatorios' });
      return;
    }

    const duration = parseInt(durationDays, 10) || 30;
    const expiresAt = new Date(Date.now() + duration * 86400000).toISOString();

    const newAd: Announcement = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: String(title).trim(),
      description: String(description).trim(),
      mediaType: mediaType || 'none',
      mediaUrl: mediaUrl || undefined,
      externalUrl: externalUrl || undefined,
      externalPreview: externalPreview || undefined,
      placement: placement || 'dash',
      durationDays: duration,
      status: status || 'active',
      badge: badge ? String(badge).trim() : undefined,
      targetCategory: targetCategory || undefined,
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    const created = db.addAnnouncement(newAd);
    db.logAction(admin.email, 'CREATE_ANNOUNCEMENT', `Creó anuncio: "${newAd.title}" (${newAd.placement})`);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear anuncio' });
  }
});

// Edit Announcement (Admin)
app.put('/api/announcements/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateAnnouncement(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Anuncio no encontrado' });
    return;
  }

  db.logAction(admin.email, 'UPDATE_ANNOUNCEMENT', `Actualizó anuncio "${updated.title}" (ID: ${id})`);
  res.json(updated);
});

// Delete Announcement (Admin)
app.delete('/api/announcements/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const existing = db.getAnnouncementById(id);

  const deleted = db.deleteAnnouncement(id);
  if (!deleted) {
    res.status(404).json({ error: 'Anuncio no encontrado' });
    return;
  }

  db.logAction(admin.email, 'DELETE_ANNOUNCEMENT', `Eliminó anuncio: "${existing?.title || id}"`);
  res.json({ message: 'Anuncio eliminado correctamente' });
});

// Track Impression
app.post('/api/announcements/:id/impression', (req: Request, res: Response): void => {
  db.trackAdImpression(req.params.id);
  res.json({ success: true });
});

// Track Click
app.post('/api/announcements/:id/click', (req: Request, res: Response): void => {
  db.trackAdClick(req.params.id);
  res.json({ success: true });
});

// ==================== GLOBAL NOTIFICATIONS ====================

// List Notifications
app.get('/api/notifications', optionalAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const isAdmin = user && user.role === 'admin';
  const notifications = db.getNotifications(!isAdmin);
  res.json(notifications);
});

// Create Notification (Admin)
app.post('/api/notifications', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { title, message, type, target, linkUrl, imageUrl } = req.body;

  if (!title || !message) {
    res.status(400).json({ error: 'Título y mensaje son obligatorios' });
    return;
  }

  const newNotif: GlobalNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: String(title).trim(),
    message: String(message).trim(),
    type: type || 'info',
    target: target || 'all',
    active: true,
    linkUrl: linkUrl ? String(linkUrl).trim() : undefined,
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  const created = db.addNotification(newNotif);
  db.logAction(admin.email, 'BROADCAST_NOTIFICATION', `Emitió notificación global: "${newNotif.title}"`);
  res.status(201).json(created);
});

// Delete Notification (Admin)
app.delete('/api/notifications/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const deleted = db.deleteNotification(id);
  if (!deleted) {
    res.status(404).json({ error: 'Notificación no encontrada' });
    return;
  }
  db.logAction(admin.email, 'DELETE_NOTIFICATION', `Eliminó notificación ID: ${id}`);
  res.json({ message: 'Notificación eliminada' });
});

// ==================== PROJECTS ====================

// List Projects
app.get('/api/projects', (req: Request, res: Response): void => {
  res.json(db.getProjects());
});

// Get Single Project (Public)
app.get('/api/projects/:id', (req: Request, res: Response): void => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  res.json(project);
});

// Create Project (Admin)
app.post('/api/projects', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { title, category, description, fullDetails, tags, status, liveUrl, githubUrl, imageUrl, featured, version, metrics } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: 'Título y descripción son requeridos' });
    return;
  }

  const newProject: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: String(title).trim(),
    category: category || 'app',
    description: String(description).trim(),
    fullDetails: fullDetails ? String(fullDetails).trim() : String(description).trim(),
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : ['VEXARYX']),
    status: status || 'live',
    liveUrl: liveUrl ? String(liveUrl).trim() : undefined,
    githubUrl: githubUrl ? String(githubUrl).trim() : undefined,
    imageUrl: imageUrl || '/src/assets/images/vexaryx_hero_abstract_1793202617896.jpg',
    featured: Boolean(featured),
    version: version ? String(version).trim() : 'v1.0.0',
    views: 0,
    rating: 0,
    ratingCount: 0,
    ratings: [],
    createdAt: new Date().toISOString()
  };

  const created = db.addProject(newProject);
  db.logAction(admin.email, 'CREATE_PROJECT', `Creó proyecto: "${newProject.title}"`);
  res.status(201).json(created);
});

// Update Project (Admin)
app.put('/api/projects/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const updated = db.updateProject(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  db.logAction(admin.email, 'UPDATE_PROJECT', `Modificó proyecto: "${updated.title}"`);
  res.json(updated);
});

// Delete Project (Admin)
app.delete('/api/projects/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const deleted = db.deleteProject(id);
  if (!deleted) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  db.logAction(admin.email, 'DELETE_PROJECT', `Eliminó proyecto ID: ${id}`);
  res.json({ message: 'Proyecto eliminado con éxito' });
});

// Track Project View (Public)
app.post('/api/projects/:id/view', (req: Request, res: Response): void => {
  const { id } = req.params;
  db.trackProjectView(id);
  res.json({ success: true });
});

// Rate Project with Stars (1 to 5) (Public & Authenticated)
app.post('/api/projects/:id/rate', optionalAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { stars, clientToken } = req.body;
  const user = (req as any).user;

  const parsedStars = parseInt(stars, 10);
  if (isNaN(parsedStars) || parsedStars < 1 || parsedStars > 5) {
    res.status(400).json({ error: 'La puntuación debe ser un número entero entre 1 y 5 estrellas' });
    return;
  }

  // Identifier: user email or ID if logged in, or clientToken / IP
  const userIdentifier = user ? `usr_${user.id}` : (clientToken || req.ip || 'anon_visitor');

  const updatedProject = db.rateProject(id, parsedStars, userIdentifier);
  if (!updatedProject) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }

  res.json({
    message: '¡Puntuación registrada con éxito!',
    project: updatedProject
  });
});

// ==================== USER MANAGEMENT (ADMIN) ====================

// List users
app.get('/api/users', requireAdmin, (req: Request, res: Response): void => {
  res.json(db.getSafeUsers());
});

// Suspend or Reactivate user
app.put('/api/users/:id/status', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ error: 'Estado debe ser "active" o "suspended"' });
    return;
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Prevent suspending initial admin
  if (targetUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase() && status === 'suspended') {
    res.status(403).json({ error: 'No es posible suspender al Administrador Principal de la plataforma.' });
    return;
  }

  const updated = db.updateUserStatus(id, status);
  db.logAction(
    admin.email,
    status === 'suspended' ? 'SUSPEND_USER' : 'REACTIVATE_USER',
    `${status === 'suspended' ? 'Suspendió' : 'Reactivó'} la cuenta de ${targetUser.email} (ID: ${id})`
  );

  res.json({ message: `Usuario ${status === 'suspended' ? 'suspendido' : 'reactivado'} correctamente`, user: updated });
});

// Update user role
app.put('/api/users/:id/role', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'admin' && role !== 'user') {
    res.status(400).json({ error: 'Rol inválido' });
    return;
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  if (targetUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase() && role !== 'admin') {
    res.status(403).json({ error: 'No es posible retirar privilegios al Administrador Principal.' });
    return;
  }

  const updated = db.updateUserRole(id, role);
  db.logAction(admin.email, 'CHANGE_ROLE', `Cambió rol de ${targetUser.email} a ${role}`);
  res.json({ message: 'Rol actualizado', user: updated });
});

// ==================== REPORTS ====================

// Submit Report (Public or Authenticated)
app.post('/api/reports', optionalAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { subject, description, category, reporterEmail, reporterName } = req.body;

  if (!subject || !description) {
    res.status(400).json({ error: 'Asunto y descripción son requeridos' });
    return;
  }

  const newReport: Report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    reporterEmail: user ? user.email : (reporterEmail || 'anónimo@usuario.com'),
    reporterName: user ? user.name : (reporterName || 'Usuario Web'),
    subject: String(subject).trim(),
    description: String(description).trim(),
    category: category || 'inquiry',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const created = db.addReport(newReport);
  res.status(201).json({ message: 'Reporte enviado al equipo de soporte de VEXARYX', report: created });
});

// List Reports (Admin)
app.get('/api/reports', requireAdmin, (req: Request, res: Response): void => {
  res.json(db.getReports());
});

// Resolve/Update Report (Admin)
app.put('/api/reports/:id', requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { status, resolutionNote } = req.body;

  const updated = db.updateReportStatus(id, status, resolutionNote);
  if (!updated) {
    res.status(404).json({ error: 'Reporte no encontrado' });
    return;
  }

  db.logAction(admin.email, 'RESOLVE_REPORT', `Actualizó reporte "${updated.subject}" a estado: ${status}`);
  res.json(updated);
});

// ==================== AUDIT LOGS & STATS ====================

app.get('/api/logs', requireAdmin, (req: Request, res: Response): void => {
  res.json(db.getAuditLogs());
});

app.get('/api/stats', requireAdmin, (req: Request, res: Response): void => {
  res.json(db.getStats());
});

// ==================== UNIVERSAL FILE & MEDIA UPLOAD ====================
// Accepts base64 data URL payload from mobile devices or desktop files (.apk, .zip, etc.)
app.post('/api/upload', (req: Request, res: Response): void => {
  try {
    const { dataUrl, filename } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Se requiere dataUrl con el contenido del archivo' });
      return;
    }

    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1 || !dataUrl.startsWith('data:')) {
      res.status(400).json({ error: 'Formato de base64 inválido' });
      return;
    }

    const header = dataUrl.substring(0, commaIndex);
    const base64Data = dataUrl.substring(commaIndex + 1);
    const mimeMatch = header.match(/^data:([^;]+);base64$/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const buffer = Buffer.from(base64Data, 'base64');

    // Extension determination preserving original filename extension (.apk, .zip, .rar, etc.)
    let ext = '';
    if (filename && filename.includes('.')) {
      const parts = filename.split('.');
      ext = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    if (!ext) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('svg')) ext = 'svg';
      else if (mimeType.includes('pdf')) ext = 'pdf';
      else if (mimeType.includes('zip') || mimeType.includes('compressed')) ext = 'zip';
      else if (mimeType.includes('android') || mimeType.includes('package-archive')) ext = 'apk';
      else ext = 'bin';
    }

    const baseName = filename
      ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      : 'vexaryx_file';
    const outputFileName = `${baseName}_${Date.now()}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, outputFileName);

    fs.writeFileSync(targetPath, buffer);
    const publicUrl = `/uploads/${outputFileName}`;

    res.json({
      success: true,
      url: publicUrl,
      fileName: outputFileName,
      originalName: filename || outputFileName,
      extension: ext,
      mimeType,
      sizeBytes: buffer.length
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al procesar y almacenar el archivo' });
  }
});

// ==================== LINK PREVIEW METADATA ====================
app.post('/api/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL requerida' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      res.status(400).json({ error: 'Formato de URL inválido' });
      return;
    }

    // Attempt to fetch page head for OG tags
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VexaryxBot/1.0; +https://vexaryx.tech)'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const html = await response.text();
      // Extract title
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                         html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                        html.match(/<meta name="description" content="([^"]+)"/i);
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

      res.json({
        title: titleMatch ? titleMatch[1] : parsedUrl.hostname,
        description: descMatch ? descMatch[1] : 'Enlace externo verificado por VEXARYX',
        image: imgMatch ? imgMatch[1] : undefined,
        domain: parsedUrl.hostname
      });
    } catch {
      clearTimeout(timeout);
      // Fallback
      res.json({
        title: parsedUrl.hostname,
        description: 'Enlace externo verificado',
        domain: parsedUrl.hostname
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener vista previa del enlace' });
  }
});

// ==================== VITE DEV MIDDLEWARE & ROUTING ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VEXARYX Platform] Running on port ${PORT}`);
    console.log(`[VEXARYX Platform] Initial Admin: ${INITIAL_ADMIN_EMAIL}`);
  });
}

startServer();
