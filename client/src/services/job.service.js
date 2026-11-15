import api from './api';

export const jobService = {
  getJobs: async (params = {}) => {
    try {
      const res = await api.get('/jobs', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Job service getJobs error:', err);
      return {
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
      };
    }
  },

  getJobBySlugOrId: async (slugOrId) => {
    const res = await api.get(`/jobs/${slugOrId}`);
    return res.data?.data || res.data;
  },

  createJob: async (data) => {
    const res = await api.post('/jobs', data);
    return res.data?.data || res.data;
  },

  updateJob: async (id, data) => {
    const res = await api.put(`/jobs/${id}`, data);
    return res.data?.data || res.data;
  },

  updateJobStatus: async (id, status) => {
    const res = await api.patch(`/jobs/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  applyJob: async (id) => {
    const res = await api.post(`/jobs/${id}/apply`);
    return res.data?.data || res.data;
  },

  saveJob: async (id) => {
    try {
      const res = await api.post(`/jobs/${id}/save`);
      return res.data?.data || res.data;
    } catch {
      const saved = JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
      if (!saved.includes(id)) {
        saved.push(id);
        localStorage.setItem('gc_saved_jobs', JSON.stringify(saved));
      }
      return { saved: true };
    }
  },

  unsaveJob: async (id) => {
    try {
      const res = await api.delete(`/jobs/${id}/save`);
      return res.data?.data || res.data;
    } catch {
      const saved = JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
      const filtered = saved.filter((item) => item !== id);
      localStorage.setItem('gc_saved_jobs', JSON.stringify(filtered));
      return { saved: false };
    }
  },

  getSavedJobs: async (params = {}) => {
    try {
      const res = await api.get('/jobs/saved', { params });
      return res.data?.data || res.data;
    } catch {
      const savedIds = JSON.parse(localStorage.getItem('gc_saved_jobs') || '[]');
      return {
        data: savedIds.map((id) => ({ _id: id, title: 'Saved Job Role' })),
        pagination: { page: 1, limit: 12, total: savedIds.length },
      };
    }
  },

  reportJob: async (id, payload) => {
    const res = await api.post(`/jobs/${id}/report`, payload);
    return res.data?.data || res.data;
  },

  deleteJob: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data?.data || res.data;
  },

  getOrgJobs: async (orgId) => {
    try {
      const res = await api.get(`/organizations/${orgId}/jobs`);
      return res.data?.data || res.data;
    } catch {
      return [];
    }
  },
};

export default jobService;
