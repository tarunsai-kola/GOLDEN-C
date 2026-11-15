const adminService = require('../services/admin.service');
const ApiResponse = require('../utils/apiResponse');

class AdminController {
  async getMetrics(req, res, next) {
    try {
      const result = await adminService.getMetrics();
      return ApiResponse.success(res, 'Overview telemetry metrics retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return ApiResponse.success(
        res,
        'Users list retrieved successfully',
        result.users,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const result = await adminService.updateUserStatus(
        req.params.id,
        req.body.status,
        req.body.reason,
        req.user,
        req
      );
      return ApiResponse.success(res, 'User status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const result = await adminService.updateUserRole(
        req.params.id,
        req.body,
        req.body.reason,
        req.user,
        req
      );
      return ApiResponse.success(res, 'User role updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getOrganizations(req, res, next) {
    try {
      const result = await adminService.getOrganizations(req.query);
      return ApiResponse.success(
        res,
        'Organizations list retrieved successfully',
        result.organizations,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyOrganization(req, res, next) {
    try {
      const result = await adminService.verifyOrganization(
        req.params.id,
        req.body,
        req.user,
        req
      );
      return ApiResponse.success(res, 'Organization verification updated', result);
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req, res, next) {
    try {
      const result = await adminService.getEvents(req.query);
      return ApiResponse.success(
        res,
        'Events moderation queue retrieved',
        result.events,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async moderateEvent(req, res, next) {
    try {
      const result = await adminService.moderateEvent(
        req.params.id,
        req.body,
        req.user,
        req
      );
      return ApiResponse.success(res, 'Event moderation updated', result);
    } catch (error) {
      next(error);
    }
  }

  async getJobs(req, res, next) {
    try {
      const result = await adminService.getJobs(req.query);
      return ApiResponse.success(
        res,
        'Jobs moderation queue retrieved',
        result.jobs,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async moderateJob(req, res, next) {
    try {
      const result = await adminService.moderateJob(
        req.params.id,
        req.body,
        req.body.reason,
        req.user,
        req
      );
      return ApiResponse.success(res, 'Job moderation updated', result);
    } catch (error) {
      next(error);
    }
  }

  async getEditorialArticles(req, res, next) {
    try {
      const result = await adminService.getEditorialArticles(req.query);
      return ApiResponse.success(
        res,
        'Editorial articles retrieved',
        result.articles,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async createEditorialArticle(req, res, next) {
    try {
      const result = await adminService.createEditorialArticle(req.body, req.user, req);
      return ApiResponse.created(res, 'Editorial article created', result);
    } catch (error) {
      next(error);
    }
  }

  async updateEditorialArticle(req, res, next) {
    try {
      const result = await adminService.updateEditorialArticle(
        req.params.id,
        req.body,
        req.user,
        req
      );
      return ApiResponse.success(res, 'Editorial article updated', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteEditorialArticle(req, res, next) {
    try {
      const result = await adminService.deleteEditorialArticle(
        req.params.id,
        req.user,
        req
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getModerationReports(req, res, next) {
    try {
      const result = await adminService.getModerationReports(req.query);
      return ApiResponse.success(res, 'Moderation reports retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req, res, next) {
    try {
      const { reportType, reportId } = req.params;
      const result = await adminService.resolveReport(
        reportType,
        reportId,
        req.body,
        req.user,
        req
      );
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async inspectReportedMessage(req, res, next) {
    try {
      const result = await adminService.inspectReportedMessage(req.params.id);
      return ApiResponse.success(res, 'Reported message inspected', result);
    } catch (error) {
      next(error);
    }
  }

  async getConfigs(req, res, next) {
    try {
      const result = await adminService.getConfigs(req.query.category);
      return ApiResponse.success(res, 'Platform configs retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const { key, values, category } = req.body;
      const result = await adminService.updateConfig(
        key,
        values,
        category,
        req.user,
        req
      );
      return ApiResponse.success(res, 'Platform config saved', result);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      return ApiResponse.success(
        res,
        'Audit logs retrieved',
        result.logs,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const result = await adminService.getAnalytics();
      return ApiResponse.success(res, 'Ecosystem analytics retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
