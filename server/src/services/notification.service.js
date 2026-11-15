const mongoose = require('mongoose');
const { Notification } = require('../models/notification.model');
const NotificationPreference = require('../models/notificationPreference.model');
const User = require('../models/user.model');
const { sendNotificationEmail } = require('./email.service');
const { getIO } = require('../config/socket');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Helper to check preference and create notification with socket + optional email
   */
  async createNotification({
    userId,
    type = 'general',
    title,
    message,
    relatedEntity = null,
    link = '',
    sendEmail = true,
  }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('createNotification called with invalid userId');
      return null;
    }

    try {
      const user = await User.findById(userId).select('email fullName');
      if (!user) return null;

      // Get or create preferences
      let prefs = await NotificationPreference.findOne({ userId });
      if (!prefs) {
        prefs = await NotificationPreference.create({ userId });
      }

      // Check preference toggle
      let shouldSendEmail = sendEmail;
      if (shouldSendEmail) {
        if (type === 'invitation' && !prefs.emailInvitations) shouldSendEmail = false;
        else if (
          (type === 'connection_request' || type === 'connection_accepted') &&
          !prefs.emailConnections
        )
          shouldSendEmail = false;
        else if (type === 'new_message' && !prefs.emailMessages) shouldSendEmail = false;
        else if (
          (type === 'event_approved' ||
            type === 'event_rejected' ||
            type === 'event_registration' ||
            type === 'event_reminder') &&
          !prefs.emailEventReminders
        )
          shouldSendEmail = false;
        else if (type === 'job_update' && !prefs.emailJobUpdates) shouldSendEmail = false;
      }

      let deliveryStatus = 'in_app';
      if (shouldSendEmail && user.email) {
        try {
          await sendNotificationEmail(user.email, user.fullName, title, message, link);
          deliveryStatus = 'both';
        } catch (err) {
          logger.warn(`Failed sending notification email to ${user.email}: ${err.message}`);
          deliveryStatus = 'in_app';
        }
      }

      // Save notification to DB
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedEntity,
        deliveryStatus,
        link,
      });

      // Real-time socket emission
      try {
        getIO()?.to(`user:${userId}`).emit('notification:new', notification);
      } catch (err) {
        logger.debug(`Socket emission for notification failed: ${err.message}`);
      }

      return notification;
    } catch (error) {
      logger.error(`Error in createNotification: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user notifications with pagination and unread filter
   */
  async getNotifications(userId, query = {}) {
    const { unreadOnly, page = 1, limit = 20 } = query;

    const filter = { userId };
    if (unreadOnly === 'true' || unreadOnly === true) {
      filter.isRead = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      notifications,
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
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest('Invalid notification ID');
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest('Invalid notification ID');
    }

    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!result) {
      throw ApiError.notFound('Notification not found');
    }

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Get notification preferences for user
   */
  async getPreferences(userId) {
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }
    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, data) {
    const allowed = [
      'emailInvitations',
      'emailConnections',
      'emailMessages',
      'emailEventReminders',
      'emailJobUpdates',
      'emailMarketing',
    ];

    const update = {};
    for (const key of allowed) {
      if (typeof data[key] === 'boolean') {
        update[key] = data[key];
      }
    }

    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true }
    );

    return prefs;
  }
}

module.exports = new NotificationService();
