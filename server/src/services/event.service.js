const mongoose = require('mongoose');
const { Event } = require('../models/event.model');
const EventRegistration = require('../models/eventRegistration.model');
const Organization = require('../models/organization.model');
const OrganizationMembership = require('../models/organizationMembership.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { sendEventRegistrationEmail } = require('./email.service');
const notificationService = require('./notification.service');
const { ORG_ROLES } = require('../constants/roles');

class EventService {
  /**
   * Helper to create a unique slug from event title
   */
  async generateUniqueSlug(title) {
    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!baseSlug) baseSlug = 'event';

    let slug = baseSlug;
    let counter = 1;
    while (await Event.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Public / Authenticated Discovery Query for Events
   */
  async getEvents(queryParams = {}, currentUserId = null) {
    const {
      category,
      format,
      pricing,
      timeframe = 'upcoming',
      officialOnly,
      organizationId,
      q,
      sort = 'date_asc',
      page = 1,
      limit = 12,
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      status: { $in: ['Approved', 'Published'] },
    };

    // Category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // Format filter
    if (format && format.trim() && format !== 'All') {
      filter.format = format.trim();
    }

    // Pricing filter
    if (pricing && pricing.trim() && pricing !== 'All') {
      filter.pricingType = pricing.trim();
    }

    // Official Golden Circle filter
    if (officialOnly === true || officialOnly === 'true') {
      filter.organizerType = 'Golden Circle';
    }

    // Specific organization filter
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = organizationId;
    }

    // Timeframe filter (upcoming vs past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeframe === 'upcoming') {
      filter.date = { $gte: today };
    } else if (timeframe === 'past') {
      filter.date = { $lt: today };
    }

    // Keyword search
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: searchRegex },
        { 'speakers.name': searchRegex },
        { 'speakers.company': searchRegex },
      ];
    }

    // Sort order
    let sortOption = { date: 1, startTime: 1 };
    if (sort === 'date_desc' || timeframe === 'past') {
      sortOption = { date: -1, startTime: -1 };
    } else if (sort === 'popularity') {
      sortOption = { attendeeCount: -1, date: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('organizationId', 'name slug logo location website')
        .populate('createdBy', 'fullName email'),
      Event.countDocuments(filter),
    ]);

    // Check user registration status if logged in
    let registeredEventIds = new Set();
    if (currentUserId && events.length > 0) {
      const eventIds = events.map((e) => e._id);
      const userRegistrations = await EventRegistration.find({
        eventId: { $in: eventIds },
        userId: currentUserId,
        status: { $ne: 'cancelled' },
      }).select('eventId');
      registeredEventIds = new Set(userRegistrations.map((r) => r.eventId.toString()));
    }

    const formattedEvents = events.map((ev) => {
      const e = ev.toJSON();
      return {
        ...e,
        isRegistered: registeredEventIds.has(e._id.toString()),
        // Hide meetingUrl on summary discovery list for privacy
        meetingUrl: registeredEventIds.has(e._id.toString()) ? e.meetingUrl : '',
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      events: formattedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  /**
   * Get single event by slug or ID with user context
   */
  async getEventByIdOrSlug(idOrSlug, currentUserId = null, userRole = null) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const event = await Event.findOne(query)
      .populate('organizationId', 'name slug logo location website')
      .populate('createdBy', 'fullName email');

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Check privileged access for unpublished events
    const isPrivileged =
      userRole === 'admin' ||
      (currentUserId && event.createdBy._id.toString() === currentUserId.toString());

    if (!['Approved', 'Published'].includes(event.status) && !isPrivileged) {
      throw ApiError.forbidden('This event is under review and not yet publicly available');
    }

    let userRegistration = null;
    if (currentUserId) {
      userRegistration = await EventRegistration.findOne({
        eventId: event._id,
        userId: currentUserId,
        status: { $ne: 'cancelled' },
      });
    }

    const isConfirmedAttendee = userRegistration && userRegistration.status === 'confirmed';
    const canSeePrivateDetails = isPrivileged || isConfirmedAttendee;

    const eventJson = event.toJSON();

    return {
      event: {
        ...eventJson,
        meetingUrl: canSeePrivateDetails ? eventJson.meetingUrl : '',
      },
      isRegistered: !!userRegistration,
      myRegistration: userRegistration || null,
      canAccessMeeting: canSeePrivateDetails,
    };
  }

  /**
   * Create / Submit an event
   */
  async createEvent(userId, data, userRole = 'user') {
    // Permission check for Golden Circle Official events
    if (data.organizerType === 'Golden Circle' && userRole !== 'admin') {
      throw ApiError.forbidden(
        'Only platform administrators can organize official Golden Circle events'
      );
    }

    // Permission check for Organization events
    if (data.organizationId) {
      const membership = await OrganizationMembership.findOne({
        organizationId: data.organizationId,
        userId,
        status: 'active',
      });

      const allowedRoles = [
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMINISTRATOR,
        ORG_ROLES.EVENT_MANAGER,
      ];

      if (!membership || !allowedRoles.includes(membership.role)) {
        throw ApiError.forbidden(
          'You must be an Owner, Administrator, or Event Manager of this organization to host events'
        );
      }
    }

    const slug = await this.generateUniqueSlug(data.title);

    // Platform admins or official events get auto-published; others go to review queue
    const initialStatus =
      userRole === 'admin' || data.organizerType === 'Golden Circle'
        ? 'Published'
        : 'Submitted';

    const event = new Event({
      ...data,
      slug,
      status: initialStatus,
      createdBy: userId,
      date: new Date(data.date),
      attendeeCount: 0,
    });

    await event.save();
    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId, updateData, userId, userRole = 'user') {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const isCreator = event.createdBy.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    let isOrgManager = false;
    if (event.organizationId) {
      const membership = await OrganizationMembership.findOne({
        organizationId: event.organizationId,
        userId,
        status: 'active',
      });
      isOrgManager =
        membership &&
        [ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EVENT_MANAGER].includes(
          membership.role
        );
    }

    if (!isCreator && !isAdmin && !isOrgManager) {
      throw ApiError.forbidden('You do not have permission to modify this event');
    }

    // Update fields
    const fieldsToUpdate = [
      'title',
      'description',
      'shortDescription',
      'coverImage',
      'category',
      'tags',
      'speakers',
      'date',
      'startTime',
      'endTime',
      'timeZone',
      'language',
      'format',
      'venue',
      'meetingUrl',
      'registrationUrl',
      'pricingType',
      'price',
      'currency',
      'capacity',
      'audience',
      'registrationDeadline',
      'showAttendeesPublicly',
    ];

    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        event[field] = updateData[field];
      }
    });

    if (updateData.date) {
      event.date = new Date(updateData.date);
    }

    await event.save();
    return event;
  }

  /**
   * Moderate event status (Approve, Reject, Cancel)
   */
  async updateEventStatus(eventId, { status, rejectionReason }, userId, userRole = 'user') {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const isCreator = event.createdBy.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    // Only Admin can approve, publish, or reject from review queue
    if (['Approved', 'Published', 'Rejected'].includes(status) && !isAdmin) {
      throw ApiError.forbidden('Only platform administrators can approve or reject events');
    }

    // Creators or Admins can cancel an event
    if (status === 'Cancelled' && !isCreator && !isAdmin) {
      throw ApiError.forbidden('Only the event organizer or an administrator can cancel this event');
    }

    event.status = status;
    if (rejectionReason !== undefined) {
      event.rejectionReason = rejectionReason;
    }

    await event.save();

    notificationService.createNotification({
      userId: event.createdBy,
      type: ['Approved', 'Published'].includes(status) ? 'event_approved' : 'event_rejected',
      title: `Event ${status}`,
      message: `Your event "${event.title}" status is now ${status}.`,
      relatedEntity: { entityType: 'event', entityId: event._id },
      link: `/events/${event.slug}`,
    });

    return event;
  }

  /**
   * Register authenticated user for an event
   */
  async registerForEvent(eventId, userId, answers = {}) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (!['Approved', 'Published'].includes(event.status)) {
      throw ApiError.badRequest('This event is not open for registration');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check existing registration
    let existingReg = await EventRegistration.findOne({ eventId, userId });

    if (existingReg && existingReg.status !== 'cancelled') {
      throw ApiError.conflict('You are already registered for this event');
    }

    // Capacity check
    const currentConfirmed = await EventRegistration.countDocuments({
      eventId,
      status: 'confirmed',
    });

    const isWaitlisted = currentConfirmed >= event.capacity;
    const finalStatus = isWaitlisted ? 'waitlisted' : 'confirmed';

    if (existingReg) {
      existingReg.status = finalStatus;
      existingReg.answers = answers;
      existingReg.registeredAt = new Date();
      await existingReg.save();
    } else {
      existingReg = new EventRegistration({
        eventId,
        userId,
        status: finalStatus,
        answers,
        registeredAt: new Date(),
      });
      await existingReg.save();
    }

    // Update cached attendee counter
    event.attendeeCount = await EventRegistration.countDocuments({
      eventId,
      status: 'confirmed',
    });
    await event.save();

    // Send confirmation email
    if (finalStatus === 'confirmed') {
      await sendEventRegistrationEmail(user.email, user.fullName, event);
      notificationService.createNotification({
        userId,
        type: 'event_registration',
        title: finalStatus === 'confirmed' ? 'Event RSVP Confirmed' : 'Placed on Event Waitlist',
        message: finalStatus === 'confirmed'
          ? `You are confirmed for "${event.title}".`
          : `You are waitlisted for "${event.title}".`,
        relatedEntity: { entityType: 'event', entityId: event._id },
        link: `/events/${event.slug}`,
      });
    }

    return {
      registration: existingReg,
      status: finalStatus,
      message:
        finalStatus === 'confirmed'
          ? 'Registration confirmed! Check your email for details.'
          : 'Event is at full capacity. You have been placed on the priority waitlist.',
    };
  }

  /**
   * Cancel an existing event registration
   */
  async cancelRegistration(eventId, userId) {
    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      status: { $in: ['confirmed', 'waitlisted'] },
    });

    if (!registration) {
      throw ApiError.notFound('Active event registration not found');
    }

    const previousStatus = registration.status;
    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(eventId);

    // If confirmed seat was vacated, promote the next waitlisted attendee
    if (previousStatus === 'confirmed' && event) {
      const nextInLine = await EventRegistration.findOne({
        eventId,
        status: 'waitlisted',
      }).sort({ registeredAt: 1 });

      if (nextInLine) {
        nextInLine.status = 'confirmed';
        await nextInLine.save();
        const waitlistedUser = await User.findById(nextInLine.userId);
        if (waitlistedUser) {
          await sendEventRegistrationEmail(waitlistedUser.email, waitlistedUser.fullName, event);
        }
      }
    }

    if (event) {
      event.attendeeCount = await EventRegistration.countDocuments({
        eventId,
        status: 'confirmed',
      });
      await event.save();
    }

    return { message: 'Registration cancelled successfully' };
  }

  /**
   * View attendees list for an event
   */
  async getAttendees(eventId, currentUserId = null, userRole = null) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const isPrivileged =
      userRole === 'admin' ||
      (currentUserId && event.createdBy.toString() === currentUserId.toString());

    if (!event.showAttendeesPublicly && !isPrivileged) {
      throw ApiError.forbidden('The organizer has made the attendee list private');
    }

    const registrations = await EventRegistration.find({
      eventId,
      status: 'confirmed',
    })
      .populate('userId', 'fullName email location role status')
      .sort({ registeredAt: 1 });

    return registrations.map((r) => ({
      registrationId: r._id,
      registeredAt: r.registeredAt,
      status: r.status,
      user: r.userId,
    }));
  }

  /**
   * Get all registered events for the current user
   */
  async getMyRegistrations(userId) {
    const registrations = await EventRegistration.find({
      userId,
      status: { $ne: 'cancelled' },
    })
      .populate({
        path: 'eventId',
        populate: { path: 'organizationId', select: 'name slug logo' },
      })
      .sort({ registeredAt: -1 });

    const validRegistrations = registrations.filter((r) => r.eventId != null);

    return validRegistrations.map((r) => ({
      registrationId: r._id,
      status: r.status,
      registeredAt: r.registeredAt,
      event: r.eventId,
    }));
  }

  /**
   * Get admin review moderation queue
   */
  async getModerationQueue(userRole) {
    if (userRole !== 'admin') {
      throw ApiError.forbidden('Administrator access required');
    }

    return Event.find({ status: { $in: ['Submitted', 'Under Review'] } })
      .populate('organizationId', 'name slug logo')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  /**
   * Submit post-event attendee feedback & rating
   */
  async addFeedback(eventId, userId, { rating, comment }) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const isRegistered = await EventRegistration.exists({
      eventId,
      userId,
      status: { $in: ['confirmed', 'attended'] },
    });

    if (!isRegistered) {
      throw ApiError.forbidden('Only confirmed attendees can submit feedback for this event');
    }

    const feedbackEntry = {
      userId,
      rating,
      comment: comment || '',
      createdAt: new Date(),
    };

    event.feedback.push(feedbackEntry);
    await event.save();

    return feedbackEntry;
  }
}

module.exports = new EventService();
