import api from './api';

export const eventService = {
  getEvents: async (params = {}) => {
    try {
      const res = await api.get('/events', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Events API getEvents failed:', err);
      return {
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
      };
    }
  },

  getEventBySlugOrId: async (slugOrId) => {
    const res = await api.get(`/events/${slugOrId}`);
    return res.data?.data || res.data;
  },

  createEvent: async (data) => {
    const res = await api.post('/events', data);
    return res.data?.data || res.data;
  },

  updateEvent: async (id, data) => {
    const res = await api.put(`/events/${id}`, data);
    return res.data?.data || res.data;
  },

  updateStatus: async (id, status, rejectionReason = '') => {
    const res = await api.patch(`/events/${id}/status`, { status, rejectionReason });
    return res.data?.data || res.data;
  },

  registerForEvent: async (id, answers = {}) => {
    const res = await api.post(`/events/${id}/register`, { answers });
    return res.data?.data || res.data;
  },

  cancelRegistration: async (id) => {
    const res = await api.delete(`/events/${id}/register`);
    return res.data?.data || res.data;
  },

  getAttendees: async (id) => {
    const res = await api.get(`/events/${id}/attendees`);
    return res.data?.data || res.data;
  },

  getMyRegistrations: async () => {
    try {
      const res = await api.get('/events/my-registrations');
      return res.data?.data || res.data;
    } catch {
      return [];
    }
  },

  getModerationQueue: async () => {
    try {
      const res = await api.get('/events/moderation');
      return res.data?.data || res.data;
    } catch {
      return [];
    }
  },

  submitFeedback: async (id, payload) => {
    const res = await api.post(`/events/${id}/feedback`, payload);
    return res.data?.data || res.data;
  },
};

export default eventService;
