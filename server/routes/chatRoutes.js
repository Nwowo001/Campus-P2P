const express = require('express');
const { getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/messages/:userId', protect, getMessages);

module.exports = router;
