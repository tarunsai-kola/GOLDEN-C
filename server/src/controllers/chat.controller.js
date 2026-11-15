const chatService = require('../services/chat.service');
const ApiResponse = require('../utils/apiResponse');

class ChatController {
  async getConversations(req, res, next) {
    try {
      const result = await chatService.getConversations(req.user._id);
      return ApiResponse.success(res, 'Conversations retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getOrCreateConversation(req, res, next) {
    try {
      const result = await chatService.getOrCreateConversation(
        req.user._id,
        req.body.recipientId
      );
      return ApiResponse.success(res, 'Conversation ready', result);
    } catch (error) {
      next(error);
    }
  }

  async getConversationMessages(req, res, next) {
    try {
      const result = await chatService.getConversationMessages(
        req.params.id,
        req.user._id,
        req.query
      );
      return ApiResponse.success(
        res,
        'Messages retrieved successfully',
        result.messages,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const result = await chatService.sendMessage(
        req.params.id,
        req.user._id,
        req.body.content
      );
      return ApiResponse.created(res, 'Message sent successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async markConversationAsRead(req, res, next) {
    try {
      const result = await chatService.markConversationAsRead(
        req.params.id,
        req.user._id
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async toggleMute(req, res, next) {
    try {
      const result = await chatService.toggleMuteConversation(
        req.params.id,
        req.user._id
      );
      return ApiResponse.success(res, 'Conversation mute updated', result);
    } catch (error) {
      next(error);
    }
  }

  async toggleBlock(req, res, next) {
    try {
      const result = await chatService.toggleBlockConversation(
        req.params.id,
        req.user._id
      );
      return ApiResponse.success(res, 'Conversation block updated', result);
    } catch (error) {
      next(error);
    }
  }

  async reportMessage(req, res, next) {
    try {
      const result = await chatService.reportMessage(
        req.params.id,
        req.user._id,
        req.body.reason
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const result = await chatService.getUnreadCount(req.user._id);
      return ApiResponse.success(res, 'Unread count retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
