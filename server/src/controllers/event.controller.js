const eventService = require('../services/event.service');
const ApiResponse = require('../utils/apiResponse');

class EventController {
  async getEvents(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await eventService.getEvents(req.query, currentUserId);
      return ApiResponse.success(res, 'Events retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getEventByIdOrSlug(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const userRole = req.user ? req.user.role : null;
      const result = await eventService.getEventByIdOrSlug(
        req.params.slugOrId,
        currentUserId,
        userRole
      );
      return ApiResponse.success(res, 'Event details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req, res, next) {
    try {
      const result = await eventService.createEvent(req.user._id, req.body, req.user.role);
      return ApiResponse.created(res, 'Event created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const result = await eventService.updateEvent(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );
      return ApiResponse.success(res, 'Event updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateEventStatus(req, res, next) {
    try {
      const result = await eventService.updateEventStatus(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );
      return ApiResponse.success(res, `Event status updated to ${req.body.status}`, result);
    } catch (error) {
      next(error);
    }
  }

  async registerForEvent(req, res, next) {
    try {
      const answers = req.body.answers || {};
      const result = await eventService.registerForEvent(req.params.id, req.user._id, answers);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async cancelRegistration(req, res, next) {
    try {
      const result = await eventService.cancelRegistration(req.params.id, req.user._id);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getAttendees(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const userRole = req.user ? req.user.role : null;
      const result = await eventService.getAttendees(req.params.id, currentUserId, userRole);
      return ApiResponse.success(res, 'Attendees retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getMyRegistrations(req, res, next) {
    try {
      const result = await eventService.getMyRegistrations(req.user._id);
      return ApiResponse.success(res, 'My registered events retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getModerationQueue(req, res, next) {
    try {
      const result = await eventService.getModerationQueue(req.user.role);
      return ApiResponse.success(res, 'Moderation queue retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async addFeedback(req, res, next) {
    try {
      const result = await eventService.addFeedback(req.params.id, req.user._id, req.body);
      return ApiResponse.created(res, 'Feedback submitted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
