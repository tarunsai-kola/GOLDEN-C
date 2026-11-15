const mongoose = require('mongoose');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const UserBlock = require('../models/userBlock.model');
const Connection = require('../models/connection.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { getIO, isUserOnline } = require('../config/socket');
const logger = require('../utils/logger');

const USER_PUBLIC_FIELDS = 'fullName headline avatar location accountType';

class ChatService {
  /**
   * Get user's conversation list
   */
  async getConversations(userId) {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', USER_PUBLIC_FIELDS)
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt readBy',
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    const formatted = conversations.map((conv) => {
      const partner = conv.participants.find(
        (p) => p && p._id.toString() !== userId.toString()
      );

      const unreadCount = conv.unreadCounts
        ? (conv.unreadCounts[userId.toString()] ?? 0)
        : 0;

      const isMuted = (conv.mutedBy || []).some(
        (id) => id.toString() === userId.toString()
      );

      const isBlocked = (conv.blockedBy || []).some(
        (id) => id.toString() === userId.toString()
      );

      return {
        _id: conv._id,
        partner: partner
          ? {
              ...partner,
              isOnline: isUserOnline(partner._id),
            }
          : null,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isMuted,
        isBlocked,
        createdAt: conv.createdAt,
      };
    });

    return formatted;
  }

  /**
   * Find or create conversation with user
   */
  async getOrCreateConversation(userId, recipientId) {
    if (userId.toString() === recipientId.toString()) {
      throw ApiError.badRequest('Cannot start a conversation with yourself');
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw ApiError.badRequest('Invalid recipient user ID');
    }

    const recipient = await User.findById(recipientId).select(USER_PUBLIC_FIELDS);
    if (!recipient) {
      throw ApiError.notFound('Recipient user not found');
    }

    // Check if blocked
    const isBlocked = await UserBlock.exists({
      $or: [
        { blocker: userId, blocked: recipientId },
        { blocker: recipientId, blocked: userId },
      ],
    });
    if (isBlocked) {
      throw ApiError.forbidden('You cannot message this user');
    }

    // Check connection requirement
    const isConnected = await Connection.exists({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId },
      ],
    });

    // Check if either is admin as exception
    const [userRecord, recipientRecord] = await Promise.all([
      User.findById(userId).select('role'),
      User.findById(recipientId).select('role'),
    ]);
    const isAdminException = userRecord?.role === 'admin' || recipientRecord?.role === 'admin';

    if (!isConnected && !isAdminException) {
      throw ApiError.forbidden('You must be connected with this member to start a conversation');
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    })
      .populate('participants', USER_PUBLIC_FIELDS)
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        unreadCounts: new Map([
          [userId.toString(), 0],
          [recipientId.toString(), 0],
        ]),
        lastMessageAt: new Date(),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', USER_PUBLIC_FIELDS)
        .populate('lastMessage');
    }

    return conversation;
  }

  /**
   * Get messages for conversation with pagination
   */
  async getConversationMessages(conversationId, userId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [total, messages] = await Promise.all([
      Message.countDocuments({ conversationId }),
      Message.find({ conversationId })
        .populate('sender', USER_PUBLIC_FIELDS)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      messages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Send message in conversation
   */
  async sendMessage(conversationId, senderId, content) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    // Check if blocked in conversation or UserBlock
    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      throw ApiError.forbidden('Unable to send message to blocked participant');
    }

    const partnerId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    const isBlocked = await UserBlock.exists({
      $or: [
        { blocker: senderId, blocked: partnerId },
        { blocker: partnerId, blocked: senderId },
      ],
    });
    if (isBlocked) {
      throw ApiError.forbidden('Unable to send message to blocked participant');
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      content,
      readBy: [senderId],
    });

    // Update conversation last message & unread counts
    const partnerIdStr = partnerId.toString();
    const currentUnread = conversation.unreadCounts.get(partnerIdStr) || 0;
    conversation.unreadCounts.set(partnerIdStr, currentUnread + 1);
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      USER_PUBLIC_FIELDS
    );

    // Socket broadcasts
    getIO()?.to(`conv:${conversationId}`).emit('message:new', populated);
    getIO()?.to(`user:${partnerIdStr}`).emit('message:notification', {
      conversationId,
      message: populated,
    });

    logger.debug(`Message sent in conv ${conversationId} by ${senderId}`);
    return populated;
  }

  /**
   * Mark all conversation messages as read
   */
  async markConversationAsRead(conversationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest('Invalid conversation ID');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    // Update messages
    await Message.updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    // Reset unread count for current user
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();

    // Socket notification
    getIO()?.to(`conv:${conversationId}`).emit('conversation:read', {
      conversationId,
      userId,
    });

    return { message: 'Conversation marked as read', conversationId };
  }

  /**
   * Mute / unmute conversation
   */
  async toggleMuteConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    const mutedIndex = conversation.mutedBy.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let isMuted;
    if (mutedIndex > -1) {
      conversation.mutedBy.splice(mutedIndex, 1);
      isMuted = false;
    } else {
      conversation.mutedBy.push(userId);
      isMuted = true;
    }

    await conversation.save();
    return { isMuted, conversationId };
  }

  /**
   * Block / unblock participant in conversation
   */
  async toggleBlockConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    const partnerId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    const blockedIndex = conversation.blockedBy.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let isBlocked;
    if (blockedIndex > -1) {
      conversation.blockedBy.splice(blockedIndex, 1);
      await UserBlock.findOneAndDelete({ blocker: userId, blocked: partnerId });
      isBlocked = false;
    } else {
      conversation.blockedBy.push(userId);
      await UserBlock.findOneAndUpdate(
        { blocker: userId, blocked: partnerId },
        { blocker: userId, blocked: partnerId, createdAt: new Date() },
        { upsert: true }
      );
      isBlocked = true;
    }

    await conversation.save();
    return { isBlocked, conversationId };
  }

  /**
   * Report an abusive message
   */
  async reportMessage(messageId, userId, reason) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw ApiError.badRequest('Invalid message ID');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    message.isReported = true;
    message.reportReason = reason;
    await message.save();

    return { message: 'Message reported successfully', messageId };
  }

  /**
   * Get total unread count for user across all conversations
   */
  async getUnreadCount(userId) {
    const conversations = await Conversation.find({
      participants: userId,
    }).select('unreadCounts');

    const total = conversations.reduce((acc, conv) => {
      const count = conv.unreadCounts?.get(userId.toString()) || 0;
      return acc + count;
    }, 0);

    return { unreadCount: total };
  }
}

module.exports = new ChatService();
