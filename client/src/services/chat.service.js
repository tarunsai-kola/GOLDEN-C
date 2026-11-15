import api from './api';

export const chatService = {
  // Get all conversations for current user
  getConversations: async (params = {}) => {
    try {
      const res = await api.get('/chat/conversations', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Chat getConversations error:', err);
      return [];
    }
  },

  // Find or create conversation with user
  getOrCreateConversation: async (userId) => {
    const res = await api.post('/chat/conversations', {
      userId,
      recipientId: userId,
    });
    return res.data?.data || res.data;
  },

  // Get message history for a conversation
  getMessages: async (conversationId, params = {}) => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Chat getMessages error:', err);
      return [];
    }
  },

  // Send message in a conversation
  sendMessage: async (conversationId, content, attachments = []) => {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      attachments,
    });
    return res.data?.data || res.data;
  },

  // Mark all messages as read
  markAsRead: async (conversationId) => {
    try {
      const res = await api.patch(`/chat/conversations/${conversationId}/read`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Chat markAsRead error:', err);
      return null;
    }
  },

  // Mute or unmute conversation
  toggleMute: async (conversationId, muted = true) => {
    const res = await api.patch(`/chat/conversations/${conversationId}/mute`, { muted });
    return res.data?.data || res.data;
  },

  // Block or unblock conversation / participant
  toggleBlock: async (conversationId, blocked = true, reason = '') => {
    const res = await api.patch(`/chat/conversations/${conversationId}/block`, { blocked, reason });
    return res.data?.data || res.data;
  },

  // Report abusive or spam message
  reportMessage: async (messageId, reason, details = '') => {
    const res = await api.post(`/chat/messages/${messageId}/report`, { reason, details });
    return res.data?.data || res.data;
  },

  // Total unread messages count across all conversations
  getUnreadCount: async () => {
    try {
      const res = await api.get('/chat/unread-count');
      const data = res.data?.data || res.data;
      return typeof data === 'number' ? data : (data?.unreadCount || data?.count || 0);
    } catch {
      return 0;
    }
  },
};

export default chatService;
