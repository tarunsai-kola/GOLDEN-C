const express = require('express');
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  createJobSchema,
  updateJobSchema,
  jobStatusSchema,
  jobReportSchema,
} = require('../validators/job.validator');

const router = express.Router();

// Optional authentication helper: inspects Bearer token if present
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

// 1. Discovery & List
router.get('/', optionalAuth, jobController.getJobs);

// 2. Saved jobs & Company jobs (placed BEFORE /:slugOrId)
router.get('/saved', authenticate, jobController.getSavedJobs);
router.get('/organization/:orgId', optionalAuth, jobController.getCompanyJobs);

// 3. Single Job Presentation
router.get('/:slugOrId', optionalAuth, jobController.getJobByIdOrSlug);

// 4. Create Job
router.post('/', authenticate, validate(createJobSchema), jobController.createJob);

// 5. Update Job Details
router.put('/:id', authenticate, validate(updateJobSchema), jobController.updateJob);

// 6. Job Status
router.patch('/:id/status', authenticate, validate(jobStatusSchema), jobController.updateJobStatus);

// 7. Track Application Click
router.post('/:id/apply', optionalAuth, jobController.applyJob);

// 8. Bookmark / Save Job
router.post('/:id/save', authenticate, jobController.saveJob);
router.delete('/:id/save', authenticate, jobController.unsaveJob);

// 9. Report Job
router.post('/:id/report', authenticate, validate(jobReportSchema), jobController.reportJob);

module.exports = router;
