const Notification = require('../models/Notification');
const logger = require('./logger');

let ioInstance = null;

const setSocketIo = (io) => {
  ioInstance = io;
};

/**
 * Persist notification in MongoDB and emit via Socket.IO to recipient's room
 */
const createAndEmitNotification = async ({
  recipient,
  sender = null,
  type = 'system_alert',
  title,
  message,
  link = '/dashboard',
}) => {
  try {
    if (!recipient) return null;

    // Do not notify self
    if (sender && sender.toString() === recipient.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
    });

    const populated = await Notification.findById(notification._id)
      .populate('sender', 'name email avatarUrl role')
      .lean();

    // Emit real-time event if socket is initialized
    if (ioInstance) {
      const room = `user_${recipient.toString()}`;
      ioInstance.to(room).emit('notification:new', populated);
      logger.info(`Socket notification emitted to ${room}: "${title}"`);
    }

    return populated;
  } catch (error) {
    logger.error('Failed to create or emit notification:', error);
    return null;
  }
};

module.exports = {
  setSocketIo,
  createAndEmitNotification,
};
