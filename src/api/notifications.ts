import api, { ApiResponse, PaginatedResponse } from './client';

export interface Notification {
  id: number;
  user_id: number;
  type: 'approval' | 'rejection' | 'info' | 'warning' | 'update';
  title: string;
  message: string;
  related_type?: string;
  related_id?: number;
  action_by?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  unread_only?: boolean;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface NotificationResponse extends PaginatedResponse<Notification> {
  unread_count: number;
}

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  getAll: async (filters: NotificationFilters = {}): Promise<NotificationResponse> => {
    const response = await api.get<NotificationResponse>('/notifications', { params: filters });
    return response.data;
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ success: boolean; count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  /**
   * Delete a notification
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  /**
   * Clear all read notifications
   */
  clearRead: async (): Promise<void> => {
    await api.delete('/notifications/clear-read');
  },
};

export default notificationsApi;
