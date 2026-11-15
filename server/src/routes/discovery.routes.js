const express = require('express');
const discoveryController = require('../controllers/discovery.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Optional authentication helper: inspects Bearer token if present
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

// Public Discovery Endpoints (with optional user context)
router.get('/startups', optionalAuth, discoveryController.getStartups);
router.get('/filters-meta', discoveryController.getFilterMeta);

// Authenticated Bookmark / Saved Companies Endpoints
router.post('/save/:id', authenticate, discoveryController.saveCompany);
router.delete('/save/:id', authenticate, discoveryController.unsaveCompany);
router.get('/saved', authenticate, discoveryController.getSavedCompanies);

module.exports = router;
