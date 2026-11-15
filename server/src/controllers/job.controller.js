const jobService = require('../services/job.service');
const ApiResponse = require('../utils/apiResponse');

class JobController {
  async getJobs(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await jobService.getJobs(req.query, currentUserId);
      return ApiResponse.success(res, 'Jobs retrieved successfully', result.jobs, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getJobByIdOrSlug(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await jobService.getJobByIdOrSlug(req.params.slugOrId, currentUserId);
      return ApiResponse.success(res, 'Job details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const result = await jobService.createJob(req.user._id, req.user.role, req.body);
      return ApiResponse.created(res, 'Job posted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const result = await jobService.updateJob(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );
      return ApiResponse.success(res, 'Job updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const result = await jobService.updateJobStatus(
        req.params.id,
        req.body.status,
        req.user._id,
        req.user.role
      );
      return ApiResponse.success(res, 'Job status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async applyJob(req, res, next) {
    try {
      const result = await jobService.applyJob(req.params.id);
      return ApiResponse.success(res, 'Application link retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async saveJob(req, res, next) {
    try {
      const result = await jobService.saveJob(req.user._id, req.params.id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      const result = await jobService.unsaveJob(req.user._id, req.params.id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getSavedJobs(req, res, next) {
    try {
      const result = await jobService.getSavedJobs(req.user._id, req.query);
      return ApiResponse.success(
        res,
        'Saved jobs retrieved successfully',
        result.jobs,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async reportJob(req, res, next) {
    try {
      const result = await jobService.reportJob(req.params.id, req.user._id, req.body);
      return ApiResponse.created(res, result.message, result.report);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyJobs(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const userRole = req.user ? req.user.role : null;
      const result = await jobService.getCompanyJobs(
        req.params.orgId,
        currentUserId,
        userRole
      );
      return ApiResponse.success(res, 'Company jobs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();
