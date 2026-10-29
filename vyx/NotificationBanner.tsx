import React, { useState } from 'react';
import { GlobalNotification } from '../src/types';
import { Bell, Info, AlertTriangle, Sparkles, X, ExternalLink } from 'lucide-react';

interface NotificationBannerProps {
  notifications: GlobalNotification[];
  onDismiss?: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeNotifs = notifications.filter(n => n.active && !dismissedIds.includes(n.id));

  if (activeNotifs.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
    if (onDismiss) onDismiss(id);
  };

  const getTypeStyle = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-red-950/40 border-red-800/60',
          text: 'text-red-300',
          badge: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        };
      case 'promo':
        return {
          bg: 'bg-[#ff5500]/10 border-[#ff5500]/40',
          text: 'text-orange-200',
          badge: 'bg-[#ff5500]/25 text-orange-200 border-[#ff5500]/40',
          icon: <Sparkles className="w-4 h-4 text-[#ff5500] shrink-0" />
        };
      case 'update':
        return {
          bg: 'bg-cyan-950/40 border-cyan-800/50',
          text: 'text-cyan-200',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-amber-950/30 border-amber-800/40',
          text: 'text-amber-200',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <Info className="w-4 h-4 text-amber-400 shrink-0" />
        };
    }
  };

  return (
    <div className="w-full space-y-2 mb-6">
      {activeNotifs.map(notif => {
        const style = getTypeStyle(notif.type);
        return (
          <div
            key={notif.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md ${style.bg} transition-all duration-200`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {style.icon}
              {notif.imageUrl && (
                <img
                  src={notif.imageUrl}
                  alt={notif.title}
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="text-xs text-slate-200 flex-1 min-w-0">
                <span className="font-semibold text-white mr-2">{notif.title}:</span>
                <span className="text-slate-300">{notif.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {notif.linkUrl && (
                <a
                  href={notif.linkUrl}
                  className="text-xs font-semibold text-[#ff5500] hover:text-white flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <span>Ver más</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => handleDismiss(notif.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Cerrar notificación"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
