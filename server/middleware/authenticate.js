const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate middleware
 * Verifies the JWT access token from the Authorization header
 * and attaches the user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        errors: ['Authorization header missing or malformed'],
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user and check if still active
    const user = await User.findById(decoded.userId).select('+tokenVersion');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errors: ['The user associated with this token no longer exists'],
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated',
        errors: ['Your account has been deactivated. Contact an administrator.'],
      });
    }

    // Check token version (for logout invalidation)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token invalidated',
        errors: ['This token has been revoked. Please log in again.'],
      });
    }

    // Attach user to request (without sensitive fields)
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      clientCompany: user.clientCompany,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        errors: ['Your access token has expired. Please refresh.'],
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        errors: ['The provided token is invalid.'],
      });
    }
    next(error);
  }
};

module.exports = authenticate;
