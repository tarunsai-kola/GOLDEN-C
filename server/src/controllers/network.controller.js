const networkService = require('../services/network.service');
const ApiResponse = require('../utils/apiResponse');

class NetworkController {
  async sendConnectionRequest(req, res, next) {
    try {
      const result = await networkService.sendConnectionRequest(
        req.user._id,
        req.params.userId,
        req.body?.note
      );
      return ApiResponse.created(res, 'Connection request sent successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async acceptConnection(req, res, next) {
    try {
      const result = await networkService.acceptConnection(
        req.params.connectionId,
        req.user._id
      );
      return ApiResponse.success(res, 'Connection request accepted', result);
    } catch (error) {
      next(error);
    }
  }

  async rejectConnection(req, res, next) {
    try {
      const result = await networkService.rejectConnection(
        req.params.connectionId,
        req.user._id
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async cancelConnection(req, res, next) {
    try {
      const result = await networkService.cancelConnectionRequest(
        req.params.connectionId,
        req.user._id
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async removeConnection(req, res, next) {
    try {
      const result = await networkService.removeConnection(
        req.user._id,
        req.params.userId
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getConnections(req, res, next) {
    try {
      const result = await networkService.getConnections(req.user._id);
      return ApiResponse.success(res, 'Connections retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getConnectionRequests(req, res, next) {
    try {
      const result = await networkService.getConnectionRequests(req.user._id);
      return ApiResponse.success(res, 'Connection requests retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getConnectionStatus(req, res, next) {
    try {
      const result = await networkService.getConnectionStatus(
        req.user._id,
        req.params.userId
      );
      return ApiResponse.success(res, 'Connection status retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NetworkController();
