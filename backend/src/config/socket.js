import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

let io;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

/**
 * Socket.IO Authentication Middleware
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Try to get token from multiple sources
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '') ||
      socket.handshake.query.token;

    if (!token || token === 'null' || token === 'undefined') {
      logger.warn('Socket connection attempted without valid token');
      return next(new Error('Authentication error: No token provided'));
    }

    logger.info(`Attempting socket auth with token: ${token.substring(0, 20)}...`);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }

    // Verify user exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      logger.warn(`Socket auth failed: User ${decoded.id} not found in database`);
      return next(new Error('User not found'));
    }

    // Attach user info to socket - ensure consistent string format
    socket.userId = user._id.toString();
    socket.username = user.username || user.name;
    socket.email = user.email;
    socket.role = user.role || 'user';

    logger.info(`✅ Socket authenticated: ${socket.username} (${socket.userId}) [${socket.role}]`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed: ' + error.message));
  }
};

/**
 * Handle room join events
 */
const handleJoinRoom = async (socket, roomId) => {
  try {
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    socket.join(`room:${roomId}`);

    // Notify others in the room
    socket.to(`room:${roomId}`).emit('user:joined', {
      userId: socket.userId,
      username: socket.username,
      roomId,
      timestamp: new Date()
    });

    // Send confirmation to the user
    socket.emit('room:joined', {
      roomId,
      message: `Successfully joined room ${roomId}`
    });

    logger.info(`User ${socket.username} joined room ${roomId}`);
  } catch (error) {
    logger.error(`Error joining room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to join room' });
  }
};

/**
 * Handle room leave events
 */
const handleLeaveRoom = (socket, roomId) => {
  try {
    socket.leave(`room:${roomId}`);

    socket.to(`room:${roomId}`).emit('user:left', {
      userId: socket.userId,
      username: socket.username,
      roomId,
      timestamp: new Date()
    });

    socket.emit('room:left', {
      roomId,
      message: `Successfully left room ${roomId}`
    });

    logger.info(`User ${socket.username} left room ${roomId}`);
  } catch (error) {
    logger.error(`Error leaving room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to leave room' });
  }
};

/**
 * Handle message sending
 */
const handleSendMessage = async (socket, data) => {
  try {
    const { roomId, content, type = 'text', metadata } = data;

    if (!roomId || !content) {
      socket.emit('error', { message: 'Room ID and content are required' });
      return;
    }

    const message = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      sender: {
        _id: socket.userId,
        username: socket.username,
        email: socket.email
      },
      content,
      type,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Emit to all users in the room (including sender)
    io.to(`room:${roomId}`).emit('message:received', message);

    logger.info(`Message sent in room ${roomId} by ${socket.username}`);
  } catch (error) {
    logger.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

/**
 * Handle typing indicators
 */
const handleTypingStart = (socket, roomId) => {
  if (!roomId) return;

  socket.to(`room:${roomId}`).emit('user:typing', {
    userId: socket.userId,
    username: socket.username,
    roomId
  });
};

const handleTypingStop = (socket, roomId) => {
  if (!roomId) return;

  socket.to(`room:${roomId}`).emit('user:stopped-typing', {
    userId: socket.userId,
    roomId
  });
};

/**
 * Update user online status
 */
const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    logger.error(`Error updating status for user ${userId}:`, error);
  }
};

/**
 * Handle socket disconnection
 */
const handleDisconnect = async (socket) => {
  logger.info(`User disconnected: ${socket.userId} (${socket.username})`);

  // Update user offline status
  await updateUserStatus(socket.userId, false);

  // Notify all rooms the user was in
  const rooms = Array.from(socket.rooms).filter(room => room.startsWith('room:'));
  rooms.forEach(room => {
    socket.to(room).emit('user:disconnected', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });
  });
};

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');
        const allowed = [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://hack-fusion-2k26-team-luxray.vercel.app',
          'https://coral-app-neg9t.ondigitalocean.app',
          'https://www.medisage.me',
          'https://medisage.me',
        ];

        // Allow Vercel preview deployments
        if (normalizedOrigin.includes('hack-fusion-2k26') && normalizedOrigin.includes('vercel.app')) {
          return callback(null, true);
        }

        if (allowed.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true // Enable compatibility with older clients
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Enhanced error handling
  io.engine.on('connection_error', (err) => {
    logger.error('Socket connection error:', {
      message: err.message,
      code: err.code,
      context: err.context
    });
  });

  // Handle connections
  io.on('connection', (socket) => {
    logger.info(`✅ User connected: ${socket.userId} (${socket.username}) [${socket.role}]`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Update user online status
    updateUserStatus(socket.userId, true);

    // Emit connection success with user info
    socket.emit('connection:success', {
      userId: socket.userId,
      username: socket.username,
      role: socket.role,
      message: 'Connected to socket server',
      timestamp: new Date()
    });

    // Room events
    socket.on('join:room', (roomId) => handleJoinRoom(socket, roomId));
    socket.on('leave:room', (roomId) => handleLeaveRoom(socket, roomId));

    // Message events
    socket.on('message:send', (data) => handleSendMessage(socket, data));

    // Typing events
    socket.on('typing:start', (roomId) => handleTypingStart(socket, roomId));
    socket.on('typing:stop', (roomId) => handleTypingStop(socket, roomId));

    // Ping-pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
      socket.emit('error:response', { message: error.message || 'Unknown error' });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userId} (${socket.username}) - Reason: ${reason}`);
      handleDisconnect(socket);
    });
  });

  logger.info('✅ Socket.IO server initialized successfully');
  return io;
};

/**
 * Get the Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
};

/**
 * Safely check if Socket.IO is initialized
 */
export const isSocketInitialized = () => {
  return io !== undefined && io !== null;
};

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId, event, data) => {
  if (!isSocketInitialized()) {
    logger.warn(`Cannot emit ${event} to user: Socket.io not initialized`);
    return false;
  }

  try {
    // Ensure userId is a string
    const userIdStr = userId.toString();
    io.to(`user:${userIdStr}`).emit(event, data);
    logger.info(`✅ Emitted ${event} to user ${userIdStr}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting ${event} to user ${userId}:`, error);
    return false;
  }
};

/**
 * Emit event to a specific room
 */
export const emitToRoom = (roomId, event, data) => {
  if (!isSocketInitialized()) {
    logger.warn(`Cannot emit ${event} to room: Socket.io not initialized`);
    return false;
  }

  try {
    io.to(`room:${roomId}`).emit(event, data);
    logger.info(`✅ Emitted ${event} to room ${roomId}`);
    return true;
  } catch (error) {
    logger.error(`Error emitting ${event} to room ${roomId}:`, error);
    return false;
  }
};

/**
 * Emit new message notification
 */
export const emitNewMessage = async (roomId, messageData) => {
  if (!isSocketInitialized()) {
    logger.warn('Cannot emit new message: Socket.io not initialized');
    return false;
  }

  try {
    io.to(`room:${roomId}`).emit('message:new', {
      roomId,
      message: messageData,
      timestamp: new Date()
    });

    logger.info(`✅ New message notification sent to room ${roomId}`);
    return true;
  } catch (error) {
    logger.error('Error emitting new message:', error);
    return false;
  }
};

/**
 * Broadcast to all connected users
 */
export const broadcastToAll = (event, data) => {
  if (!isSocketInitialized()) {
    logger.warn(`Cannot broadcast ${event}: Socket.io not initialized`);
    return false;
  }

  try {
    io.emit(event, data);
    logger.info(`✅ Broadcasted ${event} to all users`);
    return true;
  } catch (error) {
    logger.error(`Error broadcasting ${event}:`, error);
    return false;
  }
};

/**
 * Get all connected sockets
 */
export const getConnectedUsers = async () => {
  if (!isSocketInitialized()) {
    return [];
  }

  try {
    const sockets = await io.fetchSockets();
    return sockets.map(socket => ({
      userId: socket.userId,
      username: socket.username,
      email: socket.email,
      role: socket.role,
      rooms: Array.from(socket.rooms).filter(r => r.startsWith('room:'))
    }));
  } catch (error) {
    logger.error('Error fetching connected users:', error);
    return [];
  }
};

/**
 * Disconnect a specific user
 */
export const disconnectUser = async (userId, reason = 'Server disconnect') => {
  if (!isSocketInitialized()) {
    logger.warn('Cannot disconnect user: Socket.io not initialized');
    return false;
  }

  try {
    const userIdStr = userId.toString();
    const sockets = await io.in(`user:${userIdStr}`).fetchSockets();
    sockets.forEach(socket => {
      socket.emit('force:disconnect', { reason });
      socket.disconnect(true);
    });

    logger.info(`✅ Disconnected user ${userIdStr}. Reason: ${reason}`);
    return true;
  } catch (error) {
    logger.error(`Error disconnecting user ${userId}:`, error);
    return false;
  }
};