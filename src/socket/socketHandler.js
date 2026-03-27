'use strict';

const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User');
const chatService = require('../services/chat.service');

// Track online users: userId -> Set<socketId>
const onlineUsers = new Map();

/**
 * Register all socket.io events.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  // ── Auth middleware for socket ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required.'));
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return next(new Error('Invalid or expired token.'));
      }

      const user = await User.findById(payload.sub).select('_id name relationshipId');
      if (!user) return next(new Error('User not found.'));

      socket.userId = user._id.toString();
      socket.user = user;
      socket.relationshipId = user.relationshipId?.toString() ?? null;

      next();
    } catch (err) {
      next(new Error('Socket authentication failed.'));
    }
  });

  // ── Connection ──────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] Connected: ${socket.id} | User: ${userId}`);

    // Track online presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Auto-join relationship room and sync presence globally
    if (socket.relationshipId) {
      const roomName = `relationship:${socket.relationshipId}`;
      socket.join(roomName);
      
      // Notify partner that this user is online
      socket.to(roomName).emit('partnerOnline', {
        userId,
        timestamp: new Date().toISOString(),
      });
      
      // Sync initial state for the user who just joined
      io.in(roomName).fetchSockets().then((socketsInRoom) => {
        for (const s of socketsInRoom) {
          if (s.userId !== userId) {
            socket.emit('partnerOnline', {
              userId: s.userId,
              timestamp: new Date().toISOString(),
            });
            break;
          }
        }
      }).catch(err => console.error('[Socket] fetchSockets error:', err.message));
    }

    // ── joinRoom (Legacy/Redundant but kept for safety) ───────────────
    socket.on('joinRoom', async ({ relationshipId }) => {
      if (!relationshipId) return;
      if (socket.relationshipId !== relationshipId) {
        socket.emit('error', { message: 'Access denied to this room.' });
        return;
      }
      const roomName = `relationship:${relationshipId}`;
      socket.join(roomName);
    });

    // ── sendMessage ─────────────────────────────────────────────────────
    socket.on('sendMessage', async ({ relationshipId, message, senderId }) => {
      try {
        if (!relationshipId || !message?.trim()) return;

        // Validate sender matches authenticated user
        if (senderId !== userId) return;

        // Verify relationship access
        if (socket.relationshipId !== relationshipId) {
          socket.emit('error', { message: 'Access denied.' });
          return;
        }

        // Persist message
        const savedMessage = await chatService.saveMessage(
          userId,
          relationshipId,
          message.trim()
        );

        const payload = {
          _id: savedMessage._id.toString(),
          senderId: savedMessage.senderId.toString(),
          message: savedMessage.message,
          createdAt: savedMessage.createdAt.toISOString(),
        };

        // Broadcast to whole room (including sender for confirmation)
        const roomName = `relationship:${relationshipId}`;
        io.to(roomName).emit('receiveMessage', payload);

        console.log(`[Socket] Message saved & broadcast | Room: ${roomName}`);
      } catch (err) {
        console.error('[Socket] sendMessage error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── typing ──────────────────────────────────────────────────────────
    socket.on('typing', ({ relationshipId }) => {
      if (socket.relationshipId !== relationshipId) return;
      socket.to(`relationship:${relationshipId}`).emit('typing', { userId });
    });

    // ── stopTyping ──────────────────────────────────────────────────────
    socket.on('stopTyping', ({ relationshipId }) => {
      if (socket.relationshipId !== relationshipId) return;
      socket.to(`relationship:${relationshipId}`).emit('stopTyping', { userId });
    });

    // ── disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} | Reason: ${reason}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Notify partner that user is offline
          if (socket.relationshipId) {
            const roomName = `relationship:${socket.relationshipId}`;
            socket.to(roomName).emit('partnerOffline', {
              userId,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    });

    // ── error handler ─────────────────────────────────────────────────
    socket.on('error', (err) => {
      console.error('[Socket] Error:', err.message);
    });
  });
}

/**
 * Check if a user is currently online.
 * @param {string} userId
 * @returns {boolean}
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}

module.exports = { registerSocketHandlers, isUserOnline };