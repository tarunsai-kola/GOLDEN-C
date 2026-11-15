import api from './api';

export const organizationService = {
  create: async (data) => {
    const res = await api.post('/organizations', data);
    return res.data?.data || res.data;
  },

  getMyOrganizations: async () => {
    const res = await api.get('/organizations/my');
    return res.data?.data || res.data;
  },

  getPublicOrganizations: async (params = {}) => {
    const res = await api.get('/organizations/public', { params });
    return res.data?.data || res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/organizations/${id}`);
    return res.data?.data || res.data;
  },

  getPublicProfile: async (id) => {
    try {
      const res = await api.get(`/organizations/${id}/public-profile`);
      return res.data?.data || res.data;
    } catch (err) {
      // Fallback to getById if public-profile endpoint is pending
      const fallback = await api.get(`/organizations/${id}`);
      return fallback.data?.data || fallback.data;
    }
  },

  getStudioData: async (id) => {
    try {
      const res = await api.get(`/organizations/${id}/studio`);
      return res.data?.data || res.data;
    } catch (err) {
      // Fallback
      const fallback = await api.get(`/organizations/${id}`);
      return fallback.data?.data || fallback.data;
    }
  },

  saveStudioData: async (id, data) => {
    try {
      const res = await api.put(`/organizations/${id}/studio`, data);
      return res.data?.data || res.data;
    } catch (err) {
      // Fallback to general update if studio endpoint is pending
      const res = await api.put(`/organizations/${id}`, data);
      return res.data?.data || res.data;
    }
  },

  uploadMedia: async (id, fileOrFormData) => {
    let payload = fileOrFormData;
    let headers = {};
    if (!(fileOrFormData instanceof FormData)) {
      const formData = new FormData();
      formData.append('image', fileOrFormData);
      payload = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }
    const res = await api.post(`/organizations/${id}/upload`, payload, { headers });
    return res.data?.data || res.data;
  },

  follow: async (id) => {
    const res = await api.post(`/organizations/${id}/follow`);
    return res.data?.data || res.data;
  },

  unfollow: async (id) => {
    const res = await api.delete(`/organizations/${id}/follow`);
    return res.data?.data || res.data;
  },

  addProduct: async (id, product) => {
    const res = await api.post(`/organizations/${id}/products`, product);
    return res.data?.data || res.data;
  },

  deleteProduct: async (id, productId) => {
    const res = await api.delete(`/organizations/${id}/products/${productId}`);
    return res.data?.data || res.data;
  },

  addMilestone: async (id, milestone) => {
    const res = await api.post(`/organizations/${id}/milestones`, milestone);
    return res.data?.data || res.data;
  },

  deleteMilestone: async (id, milestoneId) => {
    const res = await api.delete(`/organizations/${id}/milestones/${milestoneId}`);
    return res.data?.data || res.data;
  },

  addGalleryItem: async (id, item) => {
    const res = await api.post(`/organizations/${id}/gallery`, item);
    return res.data?.data || res.data;
  },

  deleteGalleryItem: async (id, imageId) => {
    const res = await api.delete(`/organizations/${id}/gallery/${imageId}`);
    return res.data?.data || res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/organizations/${id}`, data);
    return res.data?.data || res.data;
  },

  getMembers: async (id) => {
    const res = await api.get(`/organizations/${id}/members`);
    return res.data?.data || res.data;
  },

  inviteMember: async (id, payload) => {
    const res = await api.post(`/organizations/${id}/invitations`, payload);
    return res.data?.data || res.data;
  },

  getInvitations: async (id) => {
    const res = await api.get(`/organizations/${id}/invitations`);
    return res.data?.data || res.data;
  },

  cancelInvitation: async (id, invitationId) => {
    const res = await api.delete(`/organizations/${id}/invitations/${invitationId}`);
    return res.data?.data || res.data;
  },

  getInvitationByToken: async (token) => {
    const res = await api.get(`/organizations/invitations/${token}`);
    return res.data?.data || res.data;
  },

  acceptInvitation: async (token) => {
    const res = await api.post('/organizations/invitations/accept', { token });
    return res.data?.data || res.data;
  },

  rejectInvitation: async (token) => {
    const res = await api.post('/organizations/invitations/reject', { token });
    return res.data?.data || res.data;
  },

  updateMemberRole: async (id, membershipId, role) => {
    const res = await api.patch(`/organizations/${id}/members/${membershipId}/role`, { role });
    return res.data?.data || res.data;
  },

  removeMember: async (id, membershipId) => {
    const res = await api.delete(`/organizations/${id}/members/${membershipId}`);
    return res.data?.data || res.data;
  },

  leave: async (id) => {
    const res = await api.post(`/organizations/${id}/leave`);
    return res.data?.data || res.data;
  },
};

export default organizationService;
