const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  async getPersonalDashboard(req, res, next) {
    try {
      const result = await dashboardService.getPersonalDashboard(req.user._id);
      return ApiResponse.success(res, 'Personal dashboard data retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updatePersonalProfile(req, res, next) {
    try {
      const result = await dashboardService.updatePersonalProfile(
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, 'Profile updated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
