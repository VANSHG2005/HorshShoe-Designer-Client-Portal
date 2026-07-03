/**
 * Role-Based Access Control middleware
 * Restricts route access to specified roles
 * Must be used AFTER authenticate middleware
 *
 * Usage: requireRole('admin', 'designer')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['You must be logged in to access this resource'],
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errors: [
          `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        ],
      });
    }

    next();
  };
};

module.exports = requireRole;
