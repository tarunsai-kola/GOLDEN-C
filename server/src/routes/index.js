const express = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('./auth.routes');
const organizationRouter = require('./organization.routes');
const discoveryRouter = require('./discovery.routes');
const eventRouter = require('./event.routes');
const jobRouter = require('./job.routes');
const networkRouter = require('./network.routes');
const chatRouter = require('./chat.routes');
const notificationRouter = require('./notification.routes');
const followRouter = require('./follow.routes');
const savedItemRouter = require('./savedItem.routes');
const dashboardRouter = require('./dashboard.routes');
const adminRouter = require('./admin.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/organizations', organizationRouter);
router.use('/discovery', discoveryRouter);
router.use('/events', eventRouter);
router.use('/jobs', jobRouter);
router.use('/network', networkRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationRouter);
router.use('/follows', followRouter);
router.use('/saved-items', savedItemRouter);
router.use('/dashboard', dashboardRouter);
router.use('/admin', adminRouter);

module.exports = router;
