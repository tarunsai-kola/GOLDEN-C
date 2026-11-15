const mongoose = require('mongoose');
const Connection = require('../models/connection.model');
const UserBlock = require('../models/userBlock.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { getIO, isUserOnline } = require('../config/socket');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const USER_PUBLIC_FIELDS = 'fullName headline avatar location accountType';

class NetworkService {
  /**
   * Send a connection request
   */
  async sendConnectionRequest(requesterId, recipientId, note = '') {
    if (requesterId.toString() === recipientId.toString()) {
      throw ApiError.badRequest('You cannot send a connection request to yourself');
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw ApiError.badRequest('Invalid recipient user ID');
    }

    const recipient = await User.findById(recipientId).select(USER_PUBLIC_FIELDS);
    if (!recipient) {
      throw ApiError.notFound('Recipient user not found');
    }

    // Check if either user has blocked the other
    const isBlocked = await UserBlock.exists({
      $or: [
        { blocker: requesterId, blocked: recipientId },
        { blocker: recipientId, blocked: requesterId },
      ],
    });
    if (isBlocked) {
      throw ApiError.forbidden('Unable to send connection request to this user');
    }

    // Check existing connection
    let existing = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw ApiError.conflict('You are already connected with this user');
      }

      if (existing.status === 'pending') {
        if (existing.requester.toString() === requesterId.toString()) {
          throw ApiError.badRequest('Connection request is already pending');
        } else {
          // The other user already sent a request, auto-accept it
          existing.status = 'accepted';
          existing.acceptedAt = new Date();
          await existing.save();

          getIO()?.to(`user:${recipientId}`).emit('connection:accepted', {
            connectionId: existing._id,
            partnerId: requesterId,
          });

          return existing;
        }
      }

      // If previously rejected or cancelled, re-open
      existing.requester = requesterId;
      existing.recipient = recipientId;
      existing.status = 'pending';
      existing.note = note || '';
      existing.acceptedAt = null;
      await existing.save();

      const populated = await Connection.findById(existing._id)
        .populate('requester', USER_PUBLIC_FIELDS)
        .populate('recipient', USER_PUBLIC_FIELDS);

      getIO()?.to(`user:${recipientId}`).emit('connection:request', {
        connection: populated,
      });

      return populated;
    }

    // Create new pending connection
    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
      note: note || '',
    });

    const populated = await Connection.findById(connection._id)
      .populate('requester', USER_PUBLIC_FIELDS)
      .populate('recipient', USER_PUBLIC_FIELDS);

    getIO()?.to(`user:${recipientId}`).emit('connection:request', {
      connection: populated,
    });

    notificationService.createNotification({
      userId: recipientId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${populated.requester?.fullName || 'A member'} sent you a connection request.`,
      relatedEntity: { entityType: 'connection', entityId: connection._id },
      link: '/network',
    });

    logger.info(`Connection request sent from ${requesterId} to ${recipientId}`);
    return populated;
  }

  /**
   * Accept an incoming connection request
   */
  async acceptConnection(connectionId, recipientId) {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      throw ApiError.badRequest('Invalid connection ID');
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      throw ApiError.notFound('Connection request not found');
    }

    if (connection.recipient.toString() !== recipientId.toString()) {
      throw ApiError.forbidden('You are not authorized to accept this connection request');
    }

    if (connection.status === 'accepted') {
      return connection;
    }

    if (connection.status !== 'pending') {
      throw ApiError.badRequest(`Cannot accept request with status '${connection.status}'`);
    }

    connection.status = 'accepted';
    connection.acceptedAt = new Date();
    await connection.save();

    const populated = await Connection.findById(connection._id)
      .populate('requester', USER_PUBLIC_FIELDS)
      .populate('recipient', USER_PUBLIC_FIELDS);

    getIO()?.to(`user:${connection.requester}`).emit('connection:accepted', {
      connectionId: connection._id,
      partner: populated.recipient,
    });

    notificationService.createNotification({
      userId: connection.requester,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${populated.recipient?.fullName || 'A member'} accepted your connection request.`,
      relatedEntity: { entityType: 'connection', entityId: connection._id },
      link: '/network',
    });

    return populated;
  }

  /**
   * Reject an incoming connection request
   */
  async rejectConnection(connectionId, recipientId) {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      throw ApiError.badRequest('Invalid connection ID');
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      throw ApiError.notFound('Connection request not found');
    }

    if (connection.recipient.toString() !== recipientId.toString()) {
      throw ApiError.forbidden('You are not authorized to reject this connection request');
    }

    connection.status = 'rejected';
    await connection.save();

    return { message: 'Connection request rejected', connectionId };
  }

  /**
   * Cancel an outgoing connection request
   */
  async cancelConnectionRequest(connectionId, requesterId) {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      throw ApiError.badRequest('Invalid connection ID');
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      throw ApiError.notFound('Connection request not found');
    }

    if (connection.requester.toString() !== requesterId.toString()) {
      throw ApiError.forbidden('You are not authorized to cancel this connection request');
    }

    connection.status = 'cancelled';
    await connection.save();

    return { message: 'Connection request cancelled', connectionId };
  }

  /**
   * Remove an existing connection
   */
  async removeConnection(userId, targetUserId) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw ApiError.badRequest('Invalid user ID');
    }

    const connection = await Connection.findOneAndDelete({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: targetUserId },
        { requester: targetUserId, recipient: userId },
      ],
    });

    if (!connection) {
      throw ApiError.notFound('Active connection not found with this user');
    }

    return { message: 'Connection removed successfully', targetUserId };
  }

  /**
   * Get active connections for user
   */
  async getConnections(userId) {
    const connections = await Connection.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate('requester', USER_PUBLIC_FIELDS)
      .populate('recipient', USER_PUBLIC_FIELDS)
      .sort({ acceptedAt: -1, updatedAt: -1 })
      .lean();

    const formatted = connections.map((conn) => {
      const isRequester = conn.requester._id.toString() === userId.toString();
      const partner = isRequester ? conn.recipient : conn.requester;
      return {
        _id: conn._id,
        connectedAt: conn.acceptedAt || conn.updatedAt,
        partner: {
          ...partner,
          isOnline: isUserOnline(partner?._id),
        },
      };
    });

    return formatted;
  }

  /**
   * Get pending received and sent connection requests
   */
  async getConnectionRequests(userId) {
    const [received, sent] = await Promise.all([
      Connection.find({ recipient: userId, status: 'pending' })
        .populate('requester', USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
      Connection.find({ requester: userId, status: 'pending' })
        .populate('recipient', USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return {
      received: received.map((c) => ({
        _id: c._id,
        note: c.note,
        createdAt: c.createdAt,
        user: {
          ...c.requester,
          isOnline: isUserOnline(c.requester?._id),
        },
      })),
      sent: sent.map((c) => ({
        _id: c._id,
        note: c.note,
        createdAt: c.createdAt,
        user: {
          ...c.recipient,
          isOnline: isUserOnline(c.recipient?._id),
        },
      })),
    };
  }

  /**
   * Check connection status between two users
   */
  async getConnectionStatus(userId, targetUserId) {
    if (userId.toString() === targetUserId.toString()) {
      return { status: 'self' };
    }

    const isBlocked = await UserBlock.exists({
      $or: [
        { blocker: userId, blocked: targetUserId },
        { blocker: targetUserId, blocked: userId },
      ],
    });

    if (isBlocked) {
      return { status: 'blocked' };
    }

    const connection = await Connection.findOne({
      $or: [
        { requester: userId, recipient: targetUserId },
        { requester: targetUserId, recipient: userId },
      ],
    }).lean();

    if (!connection) {
      return { status: 'none' };
    }

    if (connection.status === 'accepted') {
      return { status: 'connected', connectionId: connection._id };
    }

    if (connection.status === 'pending') {
      if (connection.requester.toString() === userId.toString()) {
        return { status: 'pending_sent', connectionId: connection._id };
      } else {
        return { status: 'pending_received', connectionId: connection._id };
      }
    }

    return { status: 'none' };
  }
}

module.exports = new NetworkService();
