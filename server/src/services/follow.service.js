const mongoose = require('mongoose');
const Follow = require('../models/follow.model');
const OrganizationFollower = require('../models/organizationFollower.model');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');

class FollowService {
  /**
   * Follow an organization, founder, or product
   */
  async follow(followerId, targetType, targetId) {
    if (!['organization', 'founder', 'product'].includes(targetType)) {
      throw ApiError.badRequest('Invalid target type');
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw ApiError.badRequest('Invalid target ID');
    }

    if (targetType === 'founder' && followerId.toString() === targetId.toString()) {
      throw ApiError.badRequest('You cannot follow yourself');
    }

    if (targetType === 'organization') {
      const org = await Organization.findById(targetId);
      if (!org) throw ApiError.notFound('Organization not found');

      // Sync legacy OrganizationFollower
      await OrganizationFollower.findOneAndUpdate(
        { organizationId: targetId, userId: followerId },
        { organizationId: targetId, userId: followerId, createdAt: new Date() },
        { upsert: true }
      );
    } else if (targetType === 'founder') {
      const user = await User.findById(targetId);
      if (!user) throw ApiError.notFound('User not found');
    }

    await Follow.findOneAndUpdate(
      { followerId, targetType, targetId },
      { followerId, targetType, targetId, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return { isFollowing: true, message: `Successfully followed ${targetType}` };
  }

  /**
   * Unfollow an entity
   */
  async unfollow(followerId, targetType, targetId) {
    if (!['organization', 'founder', 'product'].includes(targetType)) {
      throw ApiError.badRequest('Invalid target type');
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw ApiError.badRequest('Invalid target ID');
    }

    await Follow.findOneAndDelete({ followerId, targetType, targetId });

    if (targetType === 'organization') {
      await OrganizationFollower.findOneAndDelete({
        organizationId: targetId,
        userId: followerId,
      });
    }

    return { isFollowing: false, message: `Successfully unfollowed ${targetType}` };
  }

  /**
   * Get user's followed entities
   */
  async getMyFollows(followerId, query = {}) {
    const filter = { followerId };
    if (query.targetType) {
      filter.targetType = query.targetType;
    }

    const follows = await Follow.find(filter).sort({ createdAt: -1 }).lean();

    // Populate polymorphic target
    const populated = await Promise.all(
      follows.map(async (f) => {
        let details = null;
        if (f.targetType === 'organization') {
          details = await Organization.findById(f.targetId)
            .select('name slug logo location website isVerified')
            .lean();
        } else if (f.targetType === 'founder') {
          details = await User.findById(f.targetId)
            .select('fullName avatar headline location accountType')
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

    return populated.filter((item) => item.target !== null);
  }

  /**
   * Check if user follows a target
   */
  async isFollowing(followerId, targetType, targetId) {
    if (!followerId) return { isFollowing: false };
    const exists = await Follow.exists({ followerId, targetType, targetId });
    return { isFollowing: !!exists };
  }
}

module.exports = new FollowService();
