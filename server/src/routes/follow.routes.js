const express = require('express');
const followController = require('../controllers/follow.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

router.get('/my', authenticate, followController.getMyFollows);
router.get('/status/:targetType/:targetId', optionalAuth, followController.isFollowing);

router.post('/:targetType/:targetId', authenticate, followController.follow);
router.delete('/:targetType/:targetId', authenticate, followController.unfollow);

module.exports = router;
