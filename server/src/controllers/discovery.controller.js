const discoveryService = require('../services/discovery.service');
const ApiResponse = require('../utils/apiResponse');

class DiscoveryController {
  async getStartups(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await discoveryService.getStartups(req.query, currentUserId);
      return ApiResponse.success(res, 'Startups retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getFilterMeta(req, res, next) {
    try {
      const result = await discoveryService.getFilterMeta();
      return ApiResponse.success(res, 'Filter metadata retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async saveCompany(req, res, next) {
    try {
      const result = await discoveryService.saveCompany(req.user._id, req.params.id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async unsaveCompany(req, res, next) {
    try {
      const result = await discoveryService.unsaveCompany(req.user._id, req.params.id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getSavedCompanies(req, res, next) {
    try {
      const result = await discoveryService.getSavedCompanies(req.user._id, req.query);
      return ApiResponse.success(res, 'Saved startups retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DiscoveryController();
