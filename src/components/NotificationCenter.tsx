import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import Skeleton from './Skeleton';
import { notificationsApi, Notification } from '../api/notifications';

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.getAll({
        unread_only: filter === 'unread',
        per_page: 50
      });
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Notify the bell icon to refresh its count
      window.dispatchEvent(new Event('notifications-read'));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      // Notify the bell icon to refresh its count
      window.dispatchEvent(new Event('notifications-read'));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle size={18} className="text-emerald-500" />;
      case 'rejection':
        return <AlertCircle size={18} className="text-red-500" />;
      case 'correction_request':
        return <RefreshCcw size={18} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'update':
        return <Info size={18} className="text-blue-500" />;
      default:
        return <Info size={18} className="text-slate-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-end p-4 animate-in fade-in duration-200 pointer-events-none">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px] pointer-events-auto" onClick={onClose} />
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-right duration-300 max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Unread
          </button>
          <div className="flex-1" />
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={`text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                   <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                   <div className="flex-1 space-y-2">
                     <Skeleton className="h-4 w-3/4" />
                     <Skeleton className="h-3 w-1/2" />
                   </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Bell size={28} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${
                    !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {notification.title}
                      </p>
                      <p 
                        className={`text-sm text-slate-600 dark:text-slate-400 mt-0.5 ${
                          expandedIds.has(notification.id) ? '' : 'line-clamp-2'
                        }`}
                      >
                        {notification.message}
                      </p>
                      {notification.message.length > 80 && (
                        <button
                          onClick={() => toggleExpand(notification.id)}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          {expandedIds.has(notification.id) ? 'Show less' : 'Show more'}
                        </button>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-400">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        {notification.action_by && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">by {notification.action_by}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check size={14} className="text-slate-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-slate-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Notification Bell component for the header
interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Silently fail - user might not be authenticated
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Listen for custom event when notifications are marked as read
    const handleNotificationsRead = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notifications-read', handleNotificationsRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handleNotificationsRead);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      title="Notifications"
    >
      <Bell size={20} className="text-slate-600 dark:text-slate-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationCenter;
