// Socket.IO utility helpers
const logger = require('./logger');

/**
 * Emit a notification event to a specific user
 * @param {Object} io - Socket.IO server instance
 * @param {String} userId - Target user's ID
 * @param {String} event - Event name
 * @param {Object} data - Event payload
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
  logger.debug(`Socket event '${event}' emitted to user ${userId}`);
};

/**
 * Emit a notification to all connected clients
 * @param {Object} io - Socket.IO server instance
 * @param {String} event - Event name
 * @param {Object} data - Event payload
 */
const emitToAll = (io, event, data) => {
  io.emit(event, data);
  logger.debug(`Socket event '${event}' broadcast to all`);
};

module.exports = { emitToUser, emitToAll };
