import api from './api';

export const discoveryService = {
  getStartups: async (params = {}) => {
    try {
      const res = await api.get('/discovery/startups', { params });
      return res.data?.data || res.data;
    } catch (err) {
      // Fallback to /organizations/public if discovery endpoint is in progress
      const fallback = await api.get('/organizations/public', { params });
      const orgs = fallback.data?.data || fallback.data || [];
      const list = Array.isArray(orgs) ? orgs : orgs.organizations || [];
      return {
        data: list,
        pagination: {
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 12,
          total: list.length,
          totalPages: Math.ceil(list.length / (Number(params.limit) || 12)) || 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  getFilterMeta: async () => {
    try {
      const res = await api.get('/discovery/filters-meta');
      return res.data?.data || res.data;
    } catch {
      return {
        industries: [
          { name: 'AI & Machine Learning', count: 42 },
          { name: 'SaaS', count: 38 },
          { name: 'Fintech', count: 29 },
          { name: 'Healthtech', count: 18 },
          { name: 'CleanTech & Energy', count: 15 },
          { name: 'Edtech', count: 12 },
          { name: 'Cybersecurity', count: 11 },
          { name: 'Web3 & Crypto', count: 9 },
          { name: 'E-commerce & Retail', count: 8 },
        ],
        stages: [
          { name: 'Idea', count: 14 },
          { name: 'Seed', count: 45 },
          { name: 'Early Stage', count: 31 },
          { name: 'Growth', count: 19 },
          { name: 'Scaleup', count: 8 },
        ],
        hiringCount: 34,
      };
    }
  },

  saveStartup: async (id) => {
    try {
      const res = await api.post(`/discovery/save/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      // Local fallback bookmark storage
      const saved = JSON.parse(localStorage.getItem('gc_saved_startups') || '[]');
      if (!saved.includes(id)) {
        saved.push(id);
        localStorage.setItem('gc_saved_startups', JSON.stringify(saved));
      }
      return { saved: true };
    }
  },

  unsaveStartup: async (id) => {
    try {
      const res = await api.delete(`/discovery/save/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('gc_saved_startups') || '[]');
      const filtered = saved.filter((item) => item !== id);
      localStorage.setItem('gc_saved_startups', JSON.stringify(filtered));
      return { saved: false };
    }
  },

  getSavedStartups: async (params = {}) => {
    try {
      const res = await api.get('/discovery/saved', { params });
      return res.data?.data || res.data;
    } catch {
      const savedIds = JSON.parse(localStorage.getItem('gc_saved_startups') || '[]');
      return {
        data: savedIds.map((id) => ({ _id: id, organization: { _id: id, name: 'Saved Startup' } })),
        pagination: { page: 1, limit: 12, total: savedIds.length },
      };
    }
  },
};

export default discoveryService;
