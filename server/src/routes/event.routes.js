const express = require('express');
const eventController = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  createEventSchema,
  updateEventSchema,
  eventStatusSchema,
  eventFeedbackSchema,
} = require('../validators/event.validator');

const router = express.Router();

// Optional authentication helper: inspects Bearer token if present
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

// 1. Discovery & List
router.get('/', optionalAuth, eventController.getEvents);

// 2. Authenticated user's registrations & Admin moderation queue (placed BEFORE /:slugOrId)
router.get('/my-registrations', authenticate, eventController.getMyRegistrations);
router.get('/moderation', authenticate, authorize('admin'), eventController.getModerationQueue);

// 3. Single Event Presentation
router.get('/:slugOrId', optionalAuth, eventController.getEventByIdOrSlug);

// 4. Create / Submit Event
router.post('/', authenticate, validate(createEventSchema), eventController.createEvent);

// 5. Update Event
router.put('/:id', authenticate, validate(updateEventSchema), eventController.updateEvent);

// 6. Event Moderation Status
router.patch('/:id/status', authenticate, validate(eventStatusSchema), eventController.updateEventStatus);

// 7. Event Registration & Ticket Management
router.post('/:id/register', authenticate, eventController.registerForEvent);
router.delete('/:id/register', authenticate, eventController.cancelRegistration);

// 8. Attendees list
router.get('/:id/attendees', optionalAuth, eventController.getAttendees);

// 9. Feedback & Reviews
router.post('/:id/feedback', authenticate, validate(eventFeedbackSchema), eventController.addFeedback);

module.exports = router;
