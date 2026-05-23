require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const connectDB = async () => {
  const db = require('./utils/db');
  await db();
};

const User = require('./models/User');
const Message = require('./models/Message');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: '*', // Allow all in dev, can restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Support parsing JSON requests, slightly larger body for product image base64 strings
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Pass Socket.io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'CampusMart API Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong!' });
});

// --- Socket.io Realtime Logic ---
const onlineUsers = new Map(); // Keep track of user status: userId -> set of socketIds

// Socket JWT authentication handshake
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusmart_jwt_super_secure_secret_key_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket Auth Error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  console.log(`User connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);

  // Add socket ID to user sockets list
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Broadcast online status to everyone
  io.emit('user_status_change', { userId, status: 'online' });

  // Join a unique channel for this user ID to receive direct targeted notifications/events
  socket.join(`user_${userId}`);

  // Listen for sending a private message
  socket.on('send_message', async (data, callback) => {
    const { receiverId, text } = data;

    if (!receiverId || !text) {
      if (callback) callback({ success: false, error: 'Receiver ID and text required' });
      return;
    }

    try {
      // Save message to DB
      const message = await Message.create({
        senderId: userId,
        receiverId,
        text,
      });

      const messageObj = message.toObject();

      // Emit to receiver's user channel
      io.to(`user_${receiverId}`).emit('receive_message', messageObj);
      // Emit to sender's user channel (in case they have multiple tabs/sessions open)
      io.to(`user_${userId}`).emit('receive_message', messageObj);

      if (callback) callback({ success: true, data: messageObj });
    } catch (error) {
      console.error('Error sending message via Socket:', error);
      if (callback) callback({ success: false, error: 'Database save failed' });
    }
  });

  // Check if a user is online
  socket.on('check_user_status', (checkedUserId, callback) => {
    const isOnline = onlineUsers.has(checkedUserId) && onlineUsers.get(checkedUserId).size > 0;
    if (callback) callback({ status: isOnline ? 'online' : 'offline' });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name} - Socket: ${socket.id}`);
    const userSockets = onlineUsers.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        // Broadcast offline status
        io.emit('user_status_change', { userId, status: 'offline' });
      }
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server failed to start:', error);
});
