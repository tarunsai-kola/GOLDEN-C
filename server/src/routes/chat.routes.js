const express = require('express');
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  createConversationSchema,
  sendMessageSchema,
  reportMessageSchema,
} = require('../validators/chat.validator');

const router = express.Router();

router.use(authenticate);

// 1. Conversations list & global unread count
router.get('/conversations', chatController.getConversations);
router.get('/unread-count', chatController.getUnreadCount);

// 2. Start or get conversation with user
router.post(
  '/conversations',
  validate(createConversationSchema),
  chatController.getOrCreateConversation
);

// 3. Conversation messages
router.get('/conversations/:id/messages', chatController.getConversationMessages);
router.post(
  '/conversations/:id/messages',
  validate(sendMessageSchema),
  chatController.sendMessage
);

// 4. Conversation actions
router.patch('/conversations/:id/read', chatController.markConversationAsRead);
router.patch('/conversations/:id/mute', chatController.toggleMute);
router.patch('/conversations/:id/block', chatController.toggleBlock);

// 5. Report message
router.post(
  '/messages/:id/report',
  validate(reportMessageSchema),
  chatController.reportMessage
);

module.exports = router;
