import { Project, Announcement } from '../types';

export type PublicationRouteType = 'p' | 'n' | 's';

export interface ParsedRoute {
  page: 'dash' | 'login' | 'admin' | 'publication';
  pubType?: PublicationRouteType;
  pubId?: string;
}

/**
 * Returns the short prefix for a project or announcement:
 * - /p/ID -> Proyectos, Plataformas Web, Apps
 * - /s/ID -> Sistemas, Infraestructura, Servicios API
 * - /n/ID -> Novedades, Noticias, Anuncios
 */
export function getPublicationPrefix(
  kind: 'project' | 'announcement',
  category?: Project['category'] | string
): PublicationRouteType {
  if (kind === 'announcement') {
    return 'n';
  }
  if (category === 'system' || category === 'api') {
    return 's';
  }
  return 'p';
}

export function getPublicationPath(
  kind: 'project' | 'announcement',
  item: { id: string; category?: Project['category'] | string }
): string {
  const prefix = getPublicationPrefix(kind, item.category);
  return `/${prefix}/${item.id}`;
}

export function getPublicationFullUrl(
  kind: 'project' | 'announcement',
  item: { id: string; category?: Project['category'] | string }
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vexaryx.tech';
  return `${origin}${getPublicationPath(kind, item)}`;
}

export async function copyPublicationUrl(
  kind: 'project' | 'announcement',
  item: { id: string; category?: Project['category'] | string }
): Promise<string> {
  const url = getPublicationFullUrl(kind, item);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
  }
  return url;
}

export function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') {
    return { page: 'dash' };
  }

  // 1. Check pathname (e.g. /p/:id, /n/:id, /s/:id)
  const path = window.location.pathname;
  const pubMatch = path.match(/^\/([pns])\/([a-zA-Z0-9_\-]+)\/?$/i);
  if (pubMatch) {
    return {
      page: 'publication',
      pubType: pubMatch[1].toLowerCase() as PublicationRouteType,
      pubId: pubMatch[2]
    };
  }

  // 2. Check hash route (e.g. #/p/:id, #/n/:id, #/s/:id)
  const hash = window.location.hash ? window.location.hash.replace(/^#\/?/, '/') : '';
  const hashPubMatch = hash.match(/^\/([pns])\/([a-zA-Z0-9_\-]+)\/?$/i);
  if (hashPubMatch) {
    return {
      page: 'publication',
      pubType: hashPubMatch[1].toLowerCase() as PublicationRouteType,
      pubId: hashPubMatch[2]
    };
  }

  // 3. Check query parameters (e.g. ?p=id or ?n=id or ?s=id)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    for (const key of ['p', 'n', 's'] as PublicationRouteType[]) {
      const val = searchParams.get(key);
      if (val) {
        return {
          page: 'publication',
          pubType: key,
          pubId: val
        };
      }
    }
  } catch {
    // ignore
  }

  // Check login / admin in path or hash
  const combined = (path + ' ' + hash).toLowerCase();
  if (combined.includes('login')) {
    return { page: 'login' };
  }
  if (combined.includes('admin')) {
    return { page: 'admin' };
  }

  return { page: 'dash' };
}
