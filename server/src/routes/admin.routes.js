const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Enforce authentication & platform admin access on all routes
router.use(authenticate, requireAdmin);

// 1. Telemetry & Analytics
router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);

// 2. User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// 3. Organization Governance
router.get('/organizations', adminController.getOrganizations);
router.patch('/organizations/:id/verify', adminController.verifyOrganization);

// 4. Events Moderation
router.get('/events', adminController.getEvents);
router.patch('/events/:id/moderation', adminController.moderateEvent);

// 5. Jobs Moderation
router.get('/jobs', adminController.getJobs);
router.patch('/jobs/:id/moderation', adminController.moderateJob);

// 6. Editorial CMS
router.get('/cms', adminController.getEditorialArticles);
router.post('/cms', adminController.createEditorialArticle);
router.put('/cms/:id', adminController.updateEditorialArticle);
router.delete('/cms/:id', adminController.deleteEditorialArticle);

// 7. Moderation Reports & Privacy Gate
router.get('/moderation/reports', adminController.getModerationReports);
router.patch('/moderation/reports/:reportType/:reportId', adminController.resolveReport);
router.get('/moderation/messages/:id', adminController.inspectReportedMessage);

// 8. Platform Config
router.get('/config', adminController.getConfigs);
router.put('/config', adminController.updateConfig);

// 9. Compliance Audit Trail
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
