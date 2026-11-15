const express = require('express');
const savedItemController = require('../controllers/savedItem.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

router.get('/', authenticate, savedItemController.getSavedItems);
router.get('/status/:itemType/:itemId', optionalAuth, savedItemController.isSaved);

router.post('/:itemType/:itemId', authenticate, savedItemController.saveItem);
router.delete('/:itemType/:itemId', authenticate, savedItemController.unsaveItem);

module.exports = router;
