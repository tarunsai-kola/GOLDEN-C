import api from './api';

export const savedItemService = {
  saveItem: async (itemType, itemId) => {
    const res = await api.post(`/saved-items/${itemType}/${itemId}`);
    return res.data?.data || res.data;
  },

  unsaveItem: async (itemType, itemId) => {
    const res = await api.delete(`/saved-items/${itemType}/${itemId}`);
    return res.data?.data || res.data;
  },

  getSavedItems: async (params = {}) => {
    try {
      const res = await api.get('/saved-items', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('savedItemService.getSavedItems error:', err);
      return [];
    }
  },
};

export default savedItemService;
