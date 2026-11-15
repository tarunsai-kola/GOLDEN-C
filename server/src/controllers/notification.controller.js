const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications(
        req.user._id,
        req.query
      );
      return ApiResponse.success(
        res,
        'Notifications retrieved successfully',
        result.notifications,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user._id);
      return ApiResponse.success(res, 'Unread count retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(
        req.params.id,
        req.user._id
      );
      return ApiResponse.success(res, 'Notification marked as read', result);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(
        req.params.id,
        req.user._id
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req, res, next) {
    try {
      const result = await notificationService.getPreferences(req.user._id);
      return ApiResponse.success(res, 'Preferences retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const result = await notificationService.updatePreferences(
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, 'Preferences updated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
