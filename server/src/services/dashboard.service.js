const mongoose = require('mongoose');
const User = require('../models/user.model');
const Connection = require('../models/connection.model');
const { Notification } = require('../models/notification.model');
const Follow = require('../models/follow.model');
const SavedItem = require('../models/savedItem.model');
const EventRegistration = require('../models/eventRegistration.model');
const { Event } = require('../models/event.model');
const Organization = require('../models/organization.model');
const chatService = require('./chat.service');
const ApiError = require('../utils/apiError');

class DashboardService {
  /**
   * Aggregate personal executive dashboard data
   */
  async getPersonalDashboard(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // 1. Profile completion meter
    const missingFields = [];
    let completionPercentage = 40; // Base: Account created & verified

    if (user.location && user.location.trim()) {
      completionPercentage += 15;
    } else {
      missingFields.push('location');
    }

    if (user.headline && user.headline.trim()) {
      completionPercentage += 15;
    } else {
      missingFields.push('headline');
    }

    if (user.avatar && user.avatar.trim()) {
      completionPercentage += 15;
    } else {
      missingFields.push('avatar');
    }

    if (user.bio && user.bio.trim()) {
      completionPercentage += 15;
    } else {
      missingFields.push('bio');
    }

    // 2. Parallel aggregation of counts
    const [
      connectionsCount,
      pendingRequestsCount,
      savedItemsCount,
      followingCount,
      unreadNotificationsCount,
      unreadMessagesRes,
    ] = await Promise.all([
      Connection.countDocuments({
        status: 'accepted',
        $or: [{ requester: userId }, { recipient: userId }],
      }),
      Connection.countDocuments({
        recipient: userId,
        status: 'pending',
      }),
      SavedItem.countDocuments({ userId }),
      Follow.countDocuments({ followerId: userId }),
      Notification.countDocuments({ userId, isRead: false }),
      chatService.getUnreadCount(userId),
    ]);

    // 3. Upcoming Event Registrations
    const upcomingRegistrations = await EventRegistration.find({
      userId,
      status: 'confirmed',
    })
      .populate({
        path: 'eventId',
        select: 'title slug date startTime category format venue coverImage pricingType meetingUrl',
        populate: { path: 'organizationId', select: 'name slug logo' },
      })
      .sort({ registeredAt: -1 })
      .limit(5)
      .lean();

    const formattedEvents = upcomingRegistrations
      .filter((reg) => reg.eventId)
      .map((reg) => ({
        registrationId: reg._id,
        registeredAt: reg.registeredAt,
        status: reg.status,
        event: reg.eventId,
      }));

    // 4. Followed Ventures (Recent 4)
    const recentFollows = await Follow.find({ followerId: userId })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const followedVentures = await Promise.all(
      recentFollows.map(async (f) => {
        let details = null;
        if (f.targetType === 'organization') {
          details = await Organization.findById(f.targetId)
            .select('name slug logo location website isVerified')
            .lean();
        } else if (f.targetType === 'founder') {
          details = await User.findById(f.targetId)
            .select('fullName avatar headline location')
            .lean();
        }
        return {
          _id: f._id,
          targetType: f.targetType,
          targetId: f.targetId,
          target: details,
          followedAt: f.createdAt,
        };
      })
    );

    // 5. Recent Saved Items (Recent 4)
    const recentSaved = await SavedItem.find({ userId })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // 6. Recent Notifications Activity Feed (Recent 6)
    const recentNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        headline: user.headline || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        location: user.location || '',
        accountType: user.accountType,
        role: user.role,
      },
      profileCompletion: {
        percentage: Math.min(100, completionPercentage),
        missingFields,
      },
      counts: {
        connections: connectionsCount,
        pendingRequests: pendingRequestsCount,
        savedItems: savedItemsCount,
        following: followingCount,
        unreadNotifications: unreadNotificationsCount,
        unreadMessages: unreadMessagesRes.unreadCount || 0,
      },
      upcomingEvents: formattedEvents,
      followedVentures: followedVentures.filter((f) => f.target !== null),
      recentSavedItems: recentSaved,
      activityFeed: recentNotifications,
    };
  }

  /**
   * Update personal profile details
   */
  async updatePersonalProfile(userId, updateData) {
    const allowed = ['headline', 'bio', 'location', 'avatar', 'website', 'linkedin'];
    const update = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        update[key] = updateData[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('fullName email headline avatar bio location website linkedin accountType role');

    return updatedUser;
  }
}

module.exports = new DashboardService();
