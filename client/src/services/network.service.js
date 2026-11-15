import api from './api';

export const networkService = {
  // Send connection request
  sendRequest: async (userId, note = '') => {
    const res = await api.post(`/network/connect/${userId}`, { note });
    return res.data?.data || res.data;
  },

  // Accept pending connection request
  acceptRequest: async (connectionId) => {
    const res = await api.post(`/network/accept/${connectionId}`);
    return res.data?.data || res.data;
  },

  // Reject pending connection request
  rejectRequest: async (connectionId) => {
    const res = await api.post(`/network/reject/${connectionId}`);
    return res.data?.data || res.data;
  },

  // Cancel an outgoing sent request
  cancelRequest: async (connectionId) => {
    const res = await api.delete(`/network/cancel/${connectionId}`);
    return res.data?.data || res.data;
  },

  // Remove an established connection
  removeConnection: async (userId) => {
    const res = await api.delete(`/network/remove/${userId}`);
    return res.data?.data || res.data;
  },

  // Get active connections
  getConnections: async (params = {}) => {
    try {
      const res = await api.get('/network/connections', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Network getConnections error:', err);
      return [];
    }
  },

  // Get incoming and outgoing connection requests
  getRequests: async () => {
    try {
      const res = await api.get('/network/requests');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Network getRequests error:', err);
      return { received: [], sent: [] };
    }
  },

  // Check connection status with a specific user
  getStatus: async (userId) => {
    try {
      const res = await api.get(`/network/status/${userId}`);
      return res.data?.data || res.data;
    } catch {
      return { status: 'none' };
    }
  },

  // Discover founders, investors & talent to connect with
  discoverPeers: async (params = {}) => {
    try {
      const res = await api.get('/network/discover', { params });
      return res.data?.data || res.data;
    } catch {
      return [];
    }
  },
};

export default networkService;
