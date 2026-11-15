const mongoose = require('mongoose');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const VerificationRecord = require('../models/verificationRecord.model');
const { Event } = require('../models/event.model');
const EventRegistration = require('../models/eventRegistration.model');
const { Job } = require('../models/job.model');
const JobReport = require('../models/jobReport.model');
const Connection = require('../models/connection.model');
const Message = require('../models/message.model');
const AdminAuditLog = require('../models/adminAuditLog.model');
const EditorialArticle = require('../models/editorialArticle.model');
const PlatformConfig = require('../models/platformConfig.model');
const notificationService = require('./notification.service');
const { logAdminAction, enforceMessagePrivacyGate } = require('../middleware/adminAuth');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

class AdminService {
  /**
   * 1. Overview Telemetry Metrics
   */
  async getMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalOrganizations,
      verifiedOrganizations,
      pendingVerificationClaims,
      totalEvents,
      pendingEvents,
      activeJobs,
      totalConnections,
      totalRegistrations,
      pendingJobReports,
      reportedMessagesCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Organization.countDocuments(),
      Organization.countDocuments({ isVerified: true }),
      VerificationRecord.countDocuments({ status: { $in: ['pending', 'unverified'] } }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'Submitted' }),
      Job.countDocuments({ status: 'Published' }),
      Connection.countDocuments({ status: 'accepted' }),
      EventRegistration.countDocuments({ status: 'confirmed' }),
      JobReport.countDocuments({ status: 'pending' }),
      Message.countDocuments({ isReported: true }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      organizations: {
        total: totalOrganizations,
        verified: verifiedOrganizations,
        pendingClaims: pendingVerificationClaims,
      },
      events: { total: totalEvents, pending: pendingEvents },
      jobs: { active: activeJobs },
      connections: { total: totalConnections },
      registrations: { total: totalRegistrations },
      moderation: {
        pendingReports: pendingJobReports + reportedMessagesCount,
        jobReports: pendingJobReports,
        reportedMessages: reportedMessagesCount,
      },
    };
  }

  /**
   * 2. User Governance
   */
  async getUsers(query = {}) {
    const { q, role, status, accountType, page = 1, limit = 20 } = query;
    const filter = {};

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { location: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (accountType) filter.accountType = accountType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('fullName email location role adminRole status accountType isEmailVerified createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async updateUserStatus(userId, status, reason = '', adminUser, req = null) {
    if (!['active', 'suspended', 'pending'].includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'user_status_update',
      targetType: 'user',
      targetId: userId,
      reason,
      details: { previousStatus, newStatus: status },
      req,
    });

    // Notify user
    await notificationService.createNotification({
      userId,
      type: 'moderation_decision',
      title: `Account Status: ${status}`,
      message: `Your account status has been updated to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
      link: '/dashboard',
    });

    return user;
  }

  async updateUserRole(userId, { role, adminRole }, reason = '', adminUser, req = null) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const previous = { role: user.role, adminRole: user.adminRole };
    if (role !== undefined) user.role = role;
    if (adminRole !== undefined) user.adminRole = adminRole;
    await user.save();

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'user_role_update',
      targetType: 'user',
      targetId: userId,
      reason,
      details: { previous, updated: { role: user.role, adminRole: user.adminRole } },
      req,
    });

    return user;
  }

  /**
   * 3. Organization Verification & Governance
   */
  async getOrganizations(query = {}) {
    const { q, type, isVerified, page = 1, limit = 20 } = query;
    const filter = {};

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { location: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (type) filter.type = type;
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true' || isVerified === true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, organizations] = await Promise.all([
      Organization.countDocuments(filter),
      Organization.find(filter)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      organizations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async verifyOrganization(orgId, { status, reason = '' }, adminUser, req = null) {
    const org = await Organization.findById(orgId);
    if (!org) throw ApiError.notFound('Organization not found');

    let isVerified = false;
    let recStatus = 'unverified';

    if (status === 'approved') {
      isVerified = true;
      recStatus = 'verified';
    } else if (status === 'evidence_requested') {
      isVerified = false;
      recStatus = 'evidence_requested';
    } else {
      isVerified = false;
      recStatus = 'rejected';
    }

    org.isVerified = isVerified;
    await org.save();

    await VerificationRecord.findOneAndUpdate(
      { organizationId: orgId },
      {
        status: recStatus,
        reviewedBy: adminUser._id,
        reviewedAt: new Date(),
        notes: reason,
      },
      { upsert: true }
    );

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'organization_verification',
      targetType: 'organization',
      targetId: orgId,
      reason,
      details: { status, isVerified },
      req,
    });

    if (org.createdBy) {
      await notificationService.createNotification({
        userId: org.createdBy,
        type: 'moderation_decision',
        title: `Organization Verification: ${status === 'approved' ? 'Approved' : 'Action Required'}`,
        message: `Verification review completed for ${org.name}. Status: ${recStatus}. ${reason ? `Notes: ${reason}` : ''}`,
        relatedEntity: { entityType: 'organization', entityId: org._id },
        link: `/organizations/${org._id}`,
      });
    }

    return { organization: org, verificationStatus: recStatus };
  }

  /**
   * 4. Event Governance & Moderation
   */
  async getEvents(query = {}) {
    const { status, isFeatured, page = 1, limit = 20 } = query;
    const filter = {};

    if (status) filter.status = status;
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, events] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .populate('organizationId', 'name slug logo')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      events,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async moderateEvent(eventId, { status, rejectionReason, isFeatured }, adminUser, req = null) {
    const event = await Event.findById(eventId);
    if (!event) throw ApiError.notFound('Event not found');

    const previous = { status: event.status, isFeatured: event.isFeatured };

    if (status !== undefined) {
      event.status = status;
      if (rejectionReason) event.rejectionReason = rejectionReason;
    }

    if (isFeatured !== undefined) {
      event.isFeatured = isFeatured;
    }

    await event.save();

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'event_moderation',
      targetType: 'event',
      targetId: eventId,
      reason: rejectionReason || '',
      details: { previous, updated: { status: event.status, isFeatured: event.isFeatured } },
      req,
    });

    if (event.createdBy) {
      await notificationService.createNotification({
        userId: event.createdBy,
        type: ['Approved', 'Published'].includes(event.status) ? 'event_approved' : 'event_rejected',
        title: `Event Moderation: ${event.status}`,
        message: `Your event "${event.title}" status is now ${event.status}.`,
        relatedEntity: { entityType: 'event', entityId: event._id },
        link: `/events/${event.slug}`,
      });
    }

    return event;
  }

  /**
   * 5. Job Moderation
   */
  async getJobs(query = {}) {
    const { status, isFeatured, page = 1, limit = 20 } = query;
    const filter = {};

    if (status) filter.status = status;
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .populate('organizationId', 'name slug logo')
        .populate('postedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async moderateJob(jobId, { status, isFeatured }, reason = '', adminUser, req = null) {
    const job = await Job.findById(jobId);
    if (!job) throw ApiError.notFound('Job not found');

    const previous = { status: job.status, isFeatured: job.isFeatured };

    if (status !== undefined) job.status = status;
    if (isFeatured !== undefined) job.isFeatured = isFeatured;

    await job.save();

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'job_moderation',
      targetType: 'job',
      targetId: jobId,
      reason,
      details: { previous, updated: { status: job.status, isFeatured: job.isFeatured } },
      req,
    });

    return job;
  }

  /**
   * 6. Editorial CMS
   */
  async getEditorialArticles(query = {}) {
    const { type, status, page = 1, limit = 20 } = query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, articles] = await Promise.all([
      EditorialArticle.countDocuments(filter),
      EditorialArticle.find(filter)
        .populate('authorId', 'fullName email')
        .populate('featuredFounderId', 'fullName headline avatar')
        .populate('featuredOrgId', 'name slug logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      articles,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async createEditorialArticle(data, adminUser, req = null) {
    let baseSlug = (data.title || 'editorial')
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await EditorialArticle.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = await EditorialArticle.create({
      ...data,
      slug,
      authorId: adminUser._id,
    });

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'cms_create_article',
      targetType: 'cms',
      targetId: article._id,
      reason: 'Published editorial article',
      details: { title: article.title, type: article.type },
      req,
    });

    return article;
  }

  async updateEditorialArticle(articleId, data, adminUser, req = null) {
    const article = await EditorialArticle.findById(articleId);
    if (!article) throw ApiError.notFound('Editorial article not found');

    Object.assign(article, data);
    await article.save();

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'cms_update_article',
      targetType: 'cms',
      targetId: articleId,
      reason: 'Updated editorial article',
      details: data,
      req,
    });

    return article;
  }

  async deleteEditorialArticle(articleId, adminUser, req = null) {
    const article = await EditorialArticle.findByIdAndDelete(articleId);
    if (!article) throw ApiError.notFound('Editorial article not found');

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'cms_delete_article',
      targetType: 'cms',
      targetId: articleId,
      reason: 'Deleted editorial article',
      details: { title: article.title },
      req,
    });

    return { message: 'Editorial article deleted successfully' };
  }

  /**
   * 7. Safety & Moderation Reports
   */
  async getModerationReports(query = {}) {
    const [jobReports, reportedMessages] = await Promise.all([
      JobReport.find()
        .populate('reportedBy', 'fullName email')
        .populate({
          path: 'jobId',
          select: 'title slug organizationId status',
          populate: { path: 'organizationId', select: 'name slug logo' },
        })
        .sort({ createdAt: -1 })
        .lean(),
      Message.find({ isReported: true })
        .populate('sender', 'fullName email')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const formatted = [
      ...jobReports.map((r) => ({
        _id: r._id,
        reportType: 'job',
        targetId: r.jobId?._id,
        targetDetails: r.jobId,
        reportedBy: r.reportedBy,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...reportedMessages.map((m) => ({
        _id: m._id,
        reportType: 'message',
        targetId: m._id,
        targetDetails: { content: m.content, conversationId: m.conversationId },
        reportedBy: null,
        reason: m.reportReason,
        details: '',
        status: 'pending',
        createdAt: m.createdAt,
      })),
    ];

    return formatted;
  }

  async resolveReport(reportType, reportId, { resolution, actionTaken, notes = '' }, adminUser, req = null) {
    if (reportType === 'job') {
      const report = await JobReport.findById(reportId);
      if (!report) throw ApiError.notFound('Job report not found');

      report.status = resolution || 'reviewed';
      await report.save();

      if (actionTaken === 'close_job' && report.jobId) {
        await Job.findByIdAndUpdate(report.jobId, { status: 'Closed' });
      }

      await logAdminAction({
        adminId: adminUser._id,
        adminRole: adminUser.adminRole || 'super_admin',
        action: 'resolve_job_report',
        targetType: 'report',
        targetId: reportId,
        reason: notes,
        details: { resolution, actionTaken },
        req,
      });

      return { message: 'Job report resolved', report };
    } else if (reportType === 'message') {
      // Must use privacy gate
      const message = await enforceMessagePrivacyGate(reportId);

      if (actionTaken === 'suspend_user' && message.sender) {
        await User.findByIdAndUpdate(message.sender, { status: 'suspended' });
      }

      message.isReported = false;
      await message.save();

      await logAdminAction({
        adminId: adminUser._id,
        adminRole: adminUser.adminRole || 'super_admin',
        action: 'resolve_message_report',
        targetType: 'report',
        targetId: reportId,
        reason: notes,
        details: { resolution, actionTaken },
        req,
      });

      return { message: 'Message report resolved', reportId };
    }

    throw ApiError.badRequest('Invalid report type');
  }

  async inspectReportedMessage(messageId) {
    // Privacy Lock: throws 403 if isReported is not true
    const message = await enforceMessagePrivacyGate(messageId);
    return message;
  }

  /**
   * 8. Platform Configuration
   */
  async getConfigs(category = null) {
    const filter = category ? { category } : {};
    return PlatformConfig.find(filter).sort({ key: 1 }).lean();
  }

  async updateConfig(key, values, category = 'general', adminUser, req = null) {
    const config = await PlatformConfig.findOneAndUpdate(
      { key },
      { key, values, category, updatedBy: adminUser._id },
      { upsert: true, new: true }
    );

    await logAdminAction({
      adminId: adminUser._id,
      adminRole: adminUser.adminRole || 'super_admin',
      action: 'platform_config_update',
      targetType: 'config',
      targetId: key,
      reason: 'Config modified',
      details: { key, category, valuesCount: Array.isArray(values) ? values.length : 1 },
      req,
    });

    return config;
  }

  /**
   * 9. Compliance Audit Logs
   */
  async getAuditLogs(query = {}) {
    const { action, targetType, page = 1, limit = 25 } = query;
    const filter = {};

    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AdminAuditLog.countDocuments(filter),
      AdminAuditLog.find(filter)
        .populate('adminId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * 10. Ecosystem Analytics
   */
  async getAnalytics() {
    // Aggregate startup distribution by stage & industry
    const [stageStats, industryStats, eventStats] = await Promise.all([
      Organization.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      EventRegistration.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      organizationTypes: stageStats,
      eventCategories: industryStats,
      registrationStatuses: eventStats,
    };
  }
}

module.exports = new AdminService();
