import api from './api';

export const dashboardService = {
  getPersonalDashboard: async () => {
    try {
      const res = await api.get('/dashboard/personal');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('dashboardService.getPersonalDashboard error:', err);
      return null;
    }
  },
};

export default dashboardService;
