import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Package, FileSignature, Boxes, RefreshCw, Trash2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const TYPE_META = {
  order: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  prescription: { icon: FileSignature, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  inventory: { icon: Boxes, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  refill: { icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  admin: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AdminNotificationPanel = () => {
  const { notifications, unreadCount, markNotificationAsRead, markAllAsRead, clearNotifications, removeNotification } = useSocket();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 flex-shrink-0" />
        <span className="truncate">Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-full ml-2 bottom-0 z-50 w-80 max-h-[480px] flex flex-col bg-white dark:bg-slate-900 border border-black/8 dark:border-white/8 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.admin;
                  const Icon = meta.icon;
                  return (
                    <li
                      key={n.id}
                      className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-black/3 dark:hover:bg-white/3 ${!n.read ? 'bg-primary/3' : ''
                        }`}
                      onClick={() => markNotificationAsRead(n.id)}
                    >
                      {/* Unread dot */}
                      {!n.read && (
                        <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-primary" />
                      )}

                      {/* Icon */}
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg}`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pr-3">
                        <p className={`text-[13px] font-semibold truncate ${!n.read ? 'text-text' : 'text-text-muted'}`}>
                          {n.title}
                        </p>
                        <p className="text-[12px] text-text-muted leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-text-muted/60 mt-0.5">{timeAgo(n.timestamp)}</p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex flex-col gap-1">
                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markNotificationAsRead(n.id); }}
                            className="p-1 rounded text-text-muted hover:text-primary transition-colors"
                            title="Mark read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                          className="p-1 rounded text-text-muted hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPanel;
