import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCheck, Trash2, CheckSquare } from 'lucide-react';
import { useTrain } from '../../context/TrainContext';

export const NotificationBell: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearReadNotifications } = useTrain();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overload' | 'critical' | 'warning'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.severity === filter;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'overload':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-900 text-white animate-pulse">OVERLOAD</span>;
      case 'critical':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-600 text-white">CRITICAL</span>;
      case 'warning':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500 text-white">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-600 text-white">INFO</span>;
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'overload':
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Alert Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              Live Safety Alerts ({unreadCount} unread)
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded flex items-center gap-1"
                  title="Mark all notifications as read"
                >
                  <CheckSquare className="w-3 h-3" />
                  Mark All
                </button>
              )}
              {notifications.some(n => n.is_read) && (
                <button
                  onClick={clearReadNotifications}
                  className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1"
                  title="Clear read alerts"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${filter === 'all' ? 'bg-[#003366] text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('overload')}
              className={`px-2 py-0.5 rounded ${filter === 'overload' ? 'bg-rose-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Overload
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2 py-0.5 rounded ${filter === 'critical' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2 py-0.5 rounded ${filter === 'warning' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Warning
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No alerts matching selected filter
              </div>
            ) : (
              filteredNotifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getIcon(n.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                        {getSeverityBadge(n.severity)}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!n.is_read && (
                          <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                            <CheckCheck className="w-3 h-3" /> Mark read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
