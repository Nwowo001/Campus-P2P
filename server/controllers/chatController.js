const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages between logged in user and another user
// @route   GET /api/chat/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get list of conversations (users chatted with)
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Find all messages where the current user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email ratingAverage ratingCount')
      .populate('receiverId', 'name email ratingAverage ratingCount');

    // Group messages by unique other user
    const conversationsMap = new Map();

    for (const msg of messages) {
      const isSender = msg.senderId._id.toString() === req.user.id;
      const otherUser = isSender ? msg.receiverId : msg.senderId;

      if (!otherUser) continue;

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: {
            text: msg.text,
            createdAt: msg.createdAt,
            senderId: msg.senderId._id,
          },
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  getConversations,
};
