import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { notificationApi, type NotificationItem } from '../notification.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  REGISTRATION_SUCCESS: '🎉',
  PAYMENT_CONFIRMED: '✅',
  ACCOUNT_VERIFIED: '🔐',
  REFERRAL_REGISTERED: '👥',
  REFERRAL_COMMISSION_APPROVED: '💰',
  MILESTONE_ACHIEVED: '🏆',
  REFUND_ELIGIBLE: '♻️',
  REFUND_COMPLETED: '💸',
  DEPOSIT_APPROVED: '✅',
  DEPOSIT_REJECTED: '❌',
  WITHDRAWAL_APPROVED: '✅',
  WITHDRAWAL_COMPLETED: '💸',
  WITHDRAWAL_REJECTED: '❌',
  TASK_ASSIGNED: '📋',
  TASK_SUBMISSION_APPROVED: '✅',
  TASK_SUBMISSION_REJECTED: '❌',
  TASK_REWARD_CREDITED: '💰',
  NEW_ANNOUNCEMENT: '📢',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getMyNotifications({
        page,
        limit: 20,
        isRead: filterRead,
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
      setTotalPages(res.data.meta.totalPages);
      setTotal(res.data.meta.total);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filterRead]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => t - 1);
    } catch {
      // Silently fail
    }
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) await handleMarkAsRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filterRead === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilterRead(undefined); setPage(1); }}
        >
          All
        </Button>
        <Button
          variant={filterRead === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilterRead(false); setPage(1); }}
        >
          Unread {unreadCount > 0 && <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>}
        </Button>
        <Button
          variant={filterRead === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilterRead(true); setPage(1); }}
        >
          Read
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Bell className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`group flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${
                !n.isRead ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' : 'bg-white dark:bg-gray-900'
              }`}
              onClick={() => void handleClick(n)}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-semibold ${!n.isRead ? 'text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {n.title}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); void handleMarkAsRead(n._id); }}
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 text-red-400 hover:text-red-600"
                  onClick={(e) => { e.stopPropagation(); void handleDelete(n._id); }}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;

