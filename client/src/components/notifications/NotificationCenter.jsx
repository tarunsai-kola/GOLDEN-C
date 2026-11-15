import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Building2,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Calendar,
  Briefcase,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import notificationService from '../../services/notification.service';
import socketService from '../../services/socket.service';
import { formatRelativeTime } from '../../utils/helpers';
import Spinner from '../ui/Spinner';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({ limit: 20 });
      const list = Array.isArray(data) ? data : data.notifications || [];
      setNotifications(list);
      const count = list.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time incoming notification
    const offNotification = socketService.on('notification:new', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      offNotification?.();
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif._id || notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'organization_invite':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'connection_request':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'connection_accepted':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'event_registration':
      case 'event_reminder':
      case 'event_approved':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'job_alert':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-neutral-600 hover:text-charcoal hover:bg-neutral-100 relative transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-neutral-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                return (
                  <div
                    key={notif._id || notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      notif.isRead
                        ? 'hover:bg-neutral-50/70 bg-white'
                        : 'bg-amber-50/30 hover:bg-amber-50/60'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 flex-shrink-0 shadow-2xs">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-xs font-bold text-charcoal truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                          {notif.createdAt ? formatRelativeTime(notif.createdAt) : 'recent'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-neutral-50/80 border-t border-neutral-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard?tab=notifications');
              }}
              className="text-xs font-semibold text-charcoal hover:text-amber-700 transition-colors"
            >
              View All in Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
