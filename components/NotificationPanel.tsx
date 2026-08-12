import React from 'react';
import { useNotifications, NotificationType } from '../contexts/NotificationContext';
import { 
  Bell, X, Check, CheckCheck, Trash2, 
  AlertTriangle, AlertCircle, Info, Package, 
  ShoppingCart, Settings, TrendingDown
} from 'lucide-react';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success': return <Check className="w-4 h-4 text-emerald-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'order': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    case 'stock': return <TrendingDown className="w-4 h-4 text-orange-500" />;
    case 'system': return <Settings className="w-4 h-4 text-purple-500" />;
    default: return <Info className="w-4 h-4 text-zinc-500" />;
  }
};

const getNotificationColors = (type: NotificationType, read: boolean) => {
  if (read) return 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800';
  
  switch (type) {
    case 'success': return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30';
    case 'warning': return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
    case 'error': return 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30';
    case 'order': return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30';
    case 'stock': return 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30';
    case 'system': return 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30';
    default: return 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification, 
    clearAll,
    isPanelOpen, 
    setIsPanelOpen 
  } = useNotifications();

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
        onClick={() => setIsPanelOpen(false)}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[201] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Notificaciones</h2>
                <p className="text-xs text-zinc-500">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          
          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button 
                onClick={markAllAsRead}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
              <button 
                onClick={clearAll}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-zinc-300" />
              </div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                Sin notificaciones
              </h3>
              <p className="text-xs text-zinc-500">
                Las alertas y actualizaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`
                    group p-4 border-l-2 transition-all duration-200 cursor-pointer active:scale-[0.99] hover:translate-x-1
                    ${getNotificationColors(notification.type, notification.read)}
                    ${!notification.read ? 'hover:bg-opacity-80' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}
                  `}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      // Dispatch custom event for navigation
                      window.dispatchEvent(new CustomEvent('notificationNavigate', { 
                        detail: { url: notification.actionUrl, data: notification.data } 
                      }));
                      // Also close the panel
                      setIsPanelOpen(false);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${!notification.read ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800'}
                    `}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold truncate ${!notification.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.actionLabel && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.actionUrl) {
                              window.dispatchEvent(new CustomEvent('notificationNavigate', { 
                                detail: { url: notification.actionUrl, data: notification.data } 
                              }));
                              setIsPanelOpen(false);
                            }
                          }}
                          className="text-xs font-medium text-amber-500 hover:text-amber-600 mt-2 flex items-center gap-1"
                        >
                          {notification.actionLabel} <span>→</span>
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <p className="text-[10px] text-zinc-400 text-center">
            LaserMachine Notification System v1.0
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
