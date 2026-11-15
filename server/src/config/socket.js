const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token');
const { config } = require('./env');
const logger = require('../utils/logger');

let io = null;
const onlineUsers = new Map(); // userId string -> count of active sockets

function initSocket(httpServer) {
  const allowedOrigins = (config.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          config.isDev
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {});
        token = cookies.token || cookies.accessToken;
      }

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth error: ${err.message}`);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id || socket.user._id;
    const userIdStr = userId.toString();

    // Track active connection count
    const currentCount = onlineUsers.get(userIdStr) || 0;
    onlineUsers.set(userIdStr, currentCount + 1);

    // Join personal notification channel
    socket.join(`user:${userIdStr}`);

    // If newly online, notify contacts
    if (currentCount === 0) {
      socket.broadcast.emit('user:online', { userId: userIdStr });
    }

    logger.debug(`Socket connected: ${socket.id} (User: ${userIdStr})`);

    // Join conversation room
    socket.on('join:conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conv:${conversationId}`);
        logger.debug(`Socket ${socket.id} joined room conv:${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
        logger.debug(`Socket ${socket.id} left room conv:${conversationId}`);
      }
    });

    // Typing status relay
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('typing', {
          conversationId,
          userId: userIdStr,
          isTyping: !!isTyping,
        });
      }
    });

    // Mark as read relay
    socket.on('mark:read', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('conversation:read', {
          conversationId,
          userId: userIdStr,
        });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const remaining = (onlineUsers.get(userIdStr) || 1) - 1;
      if (remaining <= 0) {
        onlineUsers.delete(userIdStr);
        socket.broadcast.emit('user:offline', {
          userId: userIdStr,
          lastSeen: new Date(),
        });
      } else {
        onlineUsers.set(userIdStr, remaining);
      }
      logger.debug(`Socket disconnected: ${socket.id} (User: ${userIdStr})`);
    });
  });

  logger.success('Socket.IO initialized successfully');
  return io;
}

function getIO() {
  if (!io) {
    logger.warn('Socket.IO accessed before initialization');
  }
  return io;
}

function isUserOnline(userId) {
  if (!userId) return false;
  return onlineUsers.has(userId.toString());
}

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  getOnlineUserIds,
};
