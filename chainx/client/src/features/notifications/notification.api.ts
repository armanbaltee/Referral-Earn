import apiClient from '@/lib/axios';

export interface NotificationItem {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | undefined;
  referenceId?: string | undefined;
  referenceModel?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  readAt?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}

export const notificationApi = {
  getMyNotifications: (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    isRead?: boolean | undefined;
    type?: string | undefined;
  }): Promise<NotificationListResponse> =>
    apiClient.get('/notifications', { params }).then((r) => r.data),

  getUnreadCount: (): Promise<UnreadCountResponse> =>
    apiClient.get('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<{ success: boolean }> =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: (): Promise<{ success: boolean; data: { modifiedCount: number } }> =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),

  deleteNotification: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/notifications/${id}`).then((r) => r.data),
};

