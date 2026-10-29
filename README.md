# VEXARYX | Ecosistema Tecnológico & Plataforma Digital

Plataforma corporativa y tecnológica integral para **VEXARYX**, desarrollada con un diseño ultra-moderno en negro (#08080a), naranja vibrante (#ff5500) y tipografía blanca contrastada, con soporte responsive completo (móvil y escritorio).

---

## 🚀 Estructura del Proyecto

- **`web/dash.html`**: Portal principal con proyectos activos, aplicaciones, plataformas web, anuncios destacados, novedades y soporte.
- **`login.html`**: Inicio de sesión seguro y registro con selector de país y prefijo telefónico internacional (+1, +34, +52, +54, etc.).
- **`admin.html`**: Panel privado de administración con métricas, gestión de anuncios (imágenes/videos/URLs externas), usuarios (suspender/reactivar), proyectos, notificaciones globales, reportes y registros de auditoría.
- **`web/css/`**:
  - `web/css/vexaryx-theme.css`: Variables globales, paleta negro/naranja, glassmorphism y efectos de aura.
  - `web/css/dash.css`: Estilos visuales del hero, showcase y banners.
  - `web/css/login.css`: Formularios de autenticación y tarjetas translúcidas.
  - `web/css/admin.css`: Tablas de alta densidad, métricas y barra de navegación administrativa.
- **`src/`**:
  - `src/types.ts`: Modelos de datos TypeScript (User, Announcement, Project, GlobalNotification, Report, AuditLog).
  - `src/storage.ts`: Base de datos persistente atómica (`data/database.json`) que conserva datos tras recargas y reinicios.
  - `src/api.ts`: Cliente HTTP para consumir los endpoints del servidor con tokens JWT.
  - `src/auth.tsx`: Proveedor de autenticación, sesión, roles y listado de países con prefijos telefónicos.
  - `src/pages/`: Vistas completas (`DashboardPage.tsx`, `LoginPage.tsx`, `AdminPage.tsx`).
- **`vyx/`**: Componentes modulares propios de VEXARYX:
  - `vyx/CountrySelector.tsx`: Selector interactivo de país con búsqueda, bandera y código telefónico.
  - `vyx/MediaUploader.tsx`: Carga directa de imágenes y videos desde el móvil o la PC.
  - `vyx/UrlPreviewCard.tsx`: Previsualización automática de enlaces externos (OpenGraph/metadata).
  - `vyx/NotificationBanner.tsx`: Sistema de alertas y anuncios globales en tiempo real.
  - `vyx/ProjectCard.tsx`: Tarjetas tecnológicas interactivas con modal de detalles y métricas.
  - `vyx/ReportModal.tsx`: Envío de incidencias técnicas y consultas directas al panel admin.
- **`server.ts`**: Servidor Express con bcrypt, JWT, subida de archivos, proxies de metadatos y middleware de Vite.
- **`vercel.json`**: Configuración optimizada con reglas de redirección, rewrites y cabeceras de seguridad para despliegue en Vercel.

---

## 🔐 Acceso de Administrador

- **Correo electrónico**: `fedezyljx@gmail.com`
- **Contraseña inicial**: `Vexaryx2025!Admin#`
- **Seguridad**:
  - Las contraseñas se almacenan cifradas con **bcrypt** en el backend.
  - El registro público asigna estrictamente el rol `user` y no permite elevar privilegios.
  - Las rutas administrativas requieren token JWT verificado en el servidor.
  - Se puede configurar `ADMIN_INITIAL_PASSWORD` y `JWT_SECRET` en variables de entorno.

---

## 📦 Despliegue en Vercel

1. Sube el repositorio a GitHub o GitLab.
2. Importa el proyecto en tu panel de Vercel.
3. Vercel detectará la configuración de `vercel.json` y ejecutará `npm run build`.
4. Define las variables de entorno en Vercel (opcional):
   - `JWT_SECRET`: Llave secreta para firmar tokens.
   - `ADMIN_INITIAL_PASSWORD`: Contraseña inicial del administrador.
