const followService = require('../services/follow.service');
const ApiResponse = require('../utils/apiResponse');

class FollowController {
  async follow(req, res, next) {
    try {
      const { targetType, targetId } = req.params;
      const result = await followService.follow(req.user._id, targetType, targetId);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async unfollow(req, res, next) {
    try {
      const { targetType, targetId } = req.params;
      const result = await followService.unfollow(req.user._id, targetType, targetId);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyFollows(req, res, next) {
    try {
      const result = await followService.getMyFollows(req.user._id, req.query);
      return ApiResponse.success(res, 'Followed entities retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async isFollowing(req, res, next) {
    try {
      const { targetType, targetId } = req.params;
      const result = await followService.isFollowing(
        req.user ? req.user._id : null,
        targetType,
        targetId
      );
      return ApiResponse.success(res, 'Follow status checked', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FollowController();
