import api from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    try {
      const res = await api.get('/notifications', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('notificationService.getNotifications error:', err);
      return { notifications: [], unreadCount: 0 };
    }
  },

  getUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const data = res.data?.data || res.data;
      return typeof data === 'number' ? data : (data?.count || data?.unreadCount || 0);
    } catch {
      return 0;
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('notificationService.markAsRead error:', err);
      return null;
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('notificationService.markAllAsRead error:', err);
      return null;
    }
  },

  getPreferences: async () => {
    try {
      const res = await api.get('/notifications/preferences');
      return res.data?.data || res.data;
    } catch {
      return {
        emailNotifications: true,
        connectionRequests: true,
        messages: true,
        eventReminders: true,
        companyUpdates: true,
        jobAlerts: true,
      };
    }
  },

  updatePreferences: async (preferences) => {
    const res = await api.put('/notifications/preferences', preferences);
    return res.data?.data || res.data;
  },
};

export default notificationService;
