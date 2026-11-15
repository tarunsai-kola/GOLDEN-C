import api from './api';

export const followService = {
  follow: async (targetType, targetId) => {
    const res = await api.post(`/follows/${targetType}/${targetId}`);
    return res.data?.data || res.data;
  },

  unfollow: async (targetType, targetId) => {
    const res = await api.delete(`/follows/${targetType}/${targetId}`);
    return res.data?.data || res.data;
  },

  getStatus: async (targetType, targetId) => {
    try {
      const res = await api.get(`/follows/status/${targetType}/${targetId}`);
      return res.data?.data || res.data;
    } catch {
      return { isFollowing: false };
    }
  },

  getFollowedEntities: async (params = {}) => {
    try {
      const res = await api.get('/follows', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('followService.getFollowedEntities error:', err);
      return [];
    }
  },
};

export default followService;
