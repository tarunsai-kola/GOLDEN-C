const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/personal', dashboardController.getPersonalDashboard);
router.put('/profile', dashboardController.updatePersonalProfile);

module.exports = router;
