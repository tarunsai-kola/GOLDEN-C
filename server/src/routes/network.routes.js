const express = require('express');
const networkController = require('../controllers/network.controller');
const { authenticate } = require('../middleware/auth');
const { validate, connectSchema } = require('../validators/network.validator');

const router = express.Router();

router.use(authenticate);

// 1. Send connection request
router.post('/connect/:userId', validate(connectSchema), networkController.sendConnectionRequest);

// 2. Respond to connection request
router.post('/accept/:connectionId', networkController.acceptConnection);
router.post('/reject/:connectionId', networkController.rejectConnection);

// 3. Cancel sent request
router.delete('/cancel/:connectionId', networkController.cancelConnection);

// 4. Remove existing connection
router.delete('/remove/:userId', networkController.removeConnection);

// 5. Connection queries
router.get('/connections', networkController.getConnections);
router.get('/requests', networkController.getConnectionRequests);
router.get('/status/:userId', networkController.getConnectionStatus);

module.exports = router;
