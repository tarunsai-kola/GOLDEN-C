const mongoose = require('mongoose');
const { Job, JOB_STATUSES } = require('../models/job.model');
const SavedJob = require('../models/savedJob.model');
const JobReport = require('../models/jobReport.model');
const Organization = require('../models/organization.model');
const OrganizationMembership = require('../models/organizationMembership.model');
const CompanyProfile = require('../models/companyProfile.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

class JobService {
  /**
   * Generate unique slug from title
   */
  async generateUniqueSlug(title) {
    let baseSlug = title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = 'job-opening';

    let slug = baseSlug;
    let counter = 1;
    while (await Job.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Check if user is authorized to manage jobs for an organization
   */
  async checkOrgJobPermission(organizationId, userId, userRole) {
    if (userRole === 'admin') return true;

    // Check organization direct creator
    const isOwner = await Organization.exists({
      _id: organizationId,
      createdBy: userId,
    });
    if (isOwner) return true;

    // Check membership role: Owner, Administrator, Recruiter
    const membership = await OrganizationMembership.findOne({
      organizationId,
      userId,
      status: 'active',
      role: { $in: ['Owner', 'Administrator', 'Recruiter'] },
    });

    return !!membership;
  }

  /**
   * Search / list jobs with filters and pagination
   */
  async getJobs(query = {}, currentUserId = null) {
    const {
      q,
      employmentType,
      workplaceType,
      experience,
      location,
      organizationId,
      isEquity,
      status = 'Published',
      sort = 'newest',
      page = 1,
      limit = 10,
    } = query;

    const filter = {};

    // Only Published jobs by default unless specific status requested
    if (status) {
      filter.status = status;
    }

    // By default, filter out expired jobs for public discovery
    if (status === 'Published') {
      filter.expiryDate = { $gt: new Date() };
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    if (workplaceType) {
      filter.workplaceType = workplaceType;
    }

    if (experience) {
      filter.experience = experience;
    }

    if (location) {
      filter.location = { $regex: escapeRegex(location), $options: 'i' };
    }

    if (organizationId) {
      if (mongoose.Types.ObjectId.isValid(organizationId)) {
        filter.organizationId = organizationId;
      }
    }

    if (isEquity === 'true' || isEquity === true) {
      filter['salary.equity'] = { $exists: true, $nin: ['', null] };
    }

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(escaped, 'i')] } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'salary_desc') {
      sortOption = { 'salary.max': -1, 'salary.min': -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortOption = { viewsCount: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .populate('organizationId', 'name slug logo location website isVerified')
        .populate('postedBy', 'fullName email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Check saved state for current user
    let savedJobIds = new Set();
    if (currentUserId && jobs.length > 0) {
      const jobIds = jobs.map((j) => j._id);
      const saved = await SavedJob.find({
        userId: currentUserId,
        jobId: { $in: jobIds },
      }).select('jobId');
      savedJobIds = new Set(saved.map((s) => s.jobId.toString()));
    }

    const formattedJobs = jobs.map((job) => ({
      ...job,
      isSaved: savedJobIds.has(job._id.toString()),
    }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      jobs: formattedJobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get single job by ID or slug
   */
  async getJobByIdOrSlug(idOrSlug, currentUserId = null) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    // Increment view count atomically
    const job = await Job.findOneAndUpdate(
      query,
      { $inc: { viewsCount: 1 } },
      { new: true }
    )
      .populate('organizationId', 'name slug logo location website isVerified')
      .populate('postedBy', 'fullName email')
      .lean();

    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    // Attach company profile details if organization exists
    let companyProfile = null;
    if (job.organizationId && job.organizationId._id) {
      companyProfile = await CompanyProfile.findOne({
        organizationId: job.organizationId._id,
      })
        .select('tagline industry foundedYear teamSize coverImage')
        .lean();
    }

    let isSaved = false;
    if (currentUserId) {
      isSaved = !!(await SavedJob.exists({
        userId: currentUserId,
        jobId: job._id,
      }));
    }

    return {
      ...job,
      companyProfile,
      isSaved,
    };
  }

  /**
   * Create a job opening
   */
  async createJob(userId, userRole, data) {
    const { organizationId } = data;

    const hasPermission = await this.checkOrgJobPermission(organizationId, userId, userRole);
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to post jobs for this organization');
    }

    const slug = await this.generateUniqueSlug(data.title);

    const job = await Job.create({
      ...data,
      slug,
      postedBy: userId,
    });

    // Update CompanyProfile.isHiring to true
    await CompanyProfile.findOneAndUpdate(
      { organizationId },
      { isHiring: true }
    );

    const populatedJob = await Job.findById(job._id)
      .populate('organizationId', 'name slug logo location website isVerified')
      .populate('postedBy', 'fullName email');

    logger.info(`Job created: ${job.title} (${slug}) for org ${organizationId}`);
    return populatedJob;
  }

  /**
   * Update a job opening
   */
  async updateJob(jobId, data, userId, userRole) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    const hasPermission = await this.checkOrgJobPermission(job.organizationId, userId, userRole);
    const isAuthor = job.postedBy && job.postedBy.toString() === userId.toString();

    if (!hasPermission && !isAuthor && userRole !== 'admin') {
      throw ApiError.forbidden('You do not have permission to update this job');
    }

    // Disallow altering immutable keys
    delete data.organizationId;
    delete data.postedBy;
    delete data.slug;
    delete data.viewsCount;
    delete data.clicksCount;

    Object.assign(job, data);
    await job.save();

    return Job.findById(jobId)
      .populate('organizationId', 'name slug logo location website isVerified')
      .populate('postedBy', 'fullName email');
  }

  /**
   * Update job status (Draft, Published, Closed, Expired)
   */
  async updateJobStatus(jobId, status, userId, userRole) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    const hasPermission = await this.checkOrgJobPermission(job.organizationId, userId, userRole);
    const isAuthor = job.postedBy && job.postedBy.toString() === userId.toString();

    if (!hasPermission && !isAuthor && userRole !== 'admin') {
      throw ApiError.forbidden('You do not have permission to change this job status');
    }

    job.status = status;
    await job.save();

    // Reconcile CompanyProfile.isHiring
    if (status === 'Closed' || status === 'Expired' || status === 'Draft') {
      const activeCount = await Job.countDocuments({
        organizationId: job.organizationId,
        status: 'Published',
        expiryDate: { $gt: new Date() },
      });
      if (activeCount === 0) {
        await CompanyProfile.findOneAndUpdate(
          { organizationId: job.organizationId },
          { isHiring: false }
        );
      }
    } else if (status === 'Published') {
      await CompanyProfile.findOneAndUpdate(
        { organizationId: job.organizationId },
        { isHiring: true }
      );
    }

    return job;
  }

  /**
   * Register application click and return destination
   */
  async applyJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    if (job.status !== 'Published' || (job.expiryDate && job.expiryDate < new Date())) {
      throw ApiError.badRequest('This job opening is no longer accepting applications');
    }

    job.clicksCount += 1;
    await job.save();

    return {
      applicationUrl: job.applicationUrl,
      applicationType: job.applicationType,
      clicksCount: job.clicksCount,
    };
  }

  /**
   * Bookmark a job
   */
  async saveJob(userId, jobId) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw ApiError.badRequest('Invalid job ID');
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    await SavedJob.findOneAndUpdate(
      { userId, jobId },
      { userId, jobId, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return { message: 'Job saved successfully', isSaved: true };
  }

  /**
   * Unsave / unbookmark a job
   */
  async unsaveJob(userId, jobId) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw ApiError.badRequest('Invalid job ID');
    }

    await SavedJob.findOneAndDelete({ userId, jobId });

    return { message: 'Job removed from saved list', isSaved: false };
  }

  /**
   * Get saved jobs for user
   */
  async getSavedJobs(userId, query = {}) {
    const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, savedEntries] = await Promise.all([
      SavedJob.countDocuments({ userId }),
      SavedJob.find({ userId })
        .populate({
          path: 'jobId',
          populate: {
            path: 'organizationId',
            select: 'name slug logo location website isVerified',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const jobs = savedEntries
      .filter((entry) => entry.jobId)
      .map((entry) => ({
        ...entry.jobId,
        savedAt: entry.createdAt,
        isSaved: true,
      }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Report a job posting
   */
  async reportJob(jobId, userId, reportData) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw ApiError.badRequest('Invalid job ID');
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }

    const report = await JobReport.create({
      jobId,
      reportedBy: userId,
      reason: reportData.reason,
      details: reportData.details || '',
    });

    return { message: 'Job report submitted successfully', report };
  }

  /**
   * Get jobs for a specific organization
   */
  async getCompanyJobs(organizationId, currentUserId = null, userRole = null) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw ApiError.badRequest('Invalid organization ID');
    }

    let hasPermission = false;
    if (currentUserId) {
      hasPermission = await this.checkOrgJobPermission(organizationId, currentUserId, userRole);
    }

    const query = { organizationId };

    // If not privileged manager, show only published and non-expired
    if (!hasPermission && userRole !== 'admin') {
      query.status = 'Published';
      query.expiryDate = { $gt: new Date() };
    }

    const jobs = await Job.find(query)
      .populate('organizationId', 'name slug logo location website isVerified')
      .sort({ createdAt: -1 })
      .lean();

    return jobs;
  }
}

module.exports = new JobService();
