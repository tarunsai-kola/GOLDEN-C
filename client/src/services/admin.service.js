import api from './api';

export const adminService = {
  // Telemetry & KPI metrics
  getMetrics: async () => {
    try {
      const res = await api.get('/admin/metrics');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getMetrics error:', err);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalOrganizations: 0,
        pendingVerifications: 0,
        totalEvents: 0,
        pendingEvents: 0,
        totalJobs: 0,
        pendingReports: 0,
      };
    }
  },

  // Users management
  getUsers: async (params = {}) => {
    try {
      const res = await api.get('/admin/users', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getUsers error:', err);
      return { users: [], pagination: { total: 0 } };
    }
  },

  updateUserStatus: async (userId, status, reason = '') => {
    const res = await api.patch(`/admin/users/${userId}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  updateUserRole: async (userId, role) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data?.data || res.data;
  },

  // Organizations management
  getOrganizations: async (params = {}) => {
    try {
      const res = await api.get('/admin/organizations', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getOrganizations error:', err);
      return { organizations: [], pagination: { total: 0 } };
    }
  },

  verifyOrganization: async (orgId, status, note = '') => {
    const res = await api.patch(`/admin/organizations/${orgId}/verify`, { status, note });
    return res.data?.data || res.data;
  },

  // Events moderation
  getEvents: async (params = {}) => {
    try {
      const res = await api.get('/admin/events', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getEvents error:', err);
      return { events: [], pagination: { total: 0 } };
    }
  },

  moderateEvent: async (eventId, action, note = '', isFeatured = false) => {
    const res = await api.patch(`/admin/events/${eventId}/moderation`, {
      action,
      note,
      isFeatured,
    });
    return res.data?.data || res.data;
  },

  // Jobs moderation
  getJobs: async (params = {}) => {
    try {
      const res = await api.get('/admin/jobs', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getJobs error:', err);
      return { jobs: [], pagination: { total: 0 } };
    }
  },

  moderateJob: async (jobId, action, note = '', isFeatured = false) => {
    const res = await api.patch(`/admin/jobs/${jobId}/moderation`, {
      action,
      note,
      isFeatured,
    });
    return res.data?.data || res.data;
  },

  // Editorial CMS
  getCMS: async (params = {}) => {
    try {
      const res = await api.get('/admin/cms', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getCMS error:', err);
      return { items: [], pagination: { total: 0 } };
    }
  },

  createCMS: async (payload) => {
    const res = await api.post('/admin/cms', payload);
    return res.data?.data || res.data;
  },

  updateCMS: async (id, payload) => {
    const res = await api.put(`/admin/cms/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteCMS: async (id) => {
    const res = await api.delete(`/admin/cms/${id}`);
    return res.data?.data || res.data;
  },

  // Universal Reports & Moderation
  getReports: async (params = {}) => {
    try {
      const res = await api.get('/admin/moderation/reports', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getReports error:', err);
      return { reports: [], pagination: { total: 0 } };
    }
  },

  resolveReport: async (reportId, resolution, action = '', note = '') => {
    const res = await api.patch(`/admin/moderation/reports/${reportId}`, {
      resolution,
      action,
      note,
    });
    return res.data?.data || res.data;
  },

  // Platform Configuration
  getConfig: async () => {
    try {
      const res = await api.get('/admin/config');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getConfig error:', err);
      return {
        industries: [],
        categories: [],
        eventFormats: [],
        templates: {},
      };
    }
  },

  updateConfig: async (config) => {
    const res = await api.put('/admin/config', config);
    return res.data?.data || res.data;
  },

  // Platform Analytics & Growth
  getAnalytics: async (params = {}) => {
    try {
      const res = await api.get('/admin/analytics', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getAnalytics error:', err);
      return {
        growthTrends: [],
        activityBreakdown: {},
        moderationSLAs: {},
      };
    }
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    try {
      const res = await api.get('/admin/audit-logs', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('adminService.getAuditLogs error:', err);
      return { logs: [], pagination: { total: 0 } };
    }
  },
};

export default adminService;
