// backend/src/middleware/roleMiddleware.js

/**
 * Role-based authorization middleware
 * Checks if user has required role to access route
 * 
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

/**
 * Check if user's account is approved (for sellers)
 */
export const checkApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }

  // Only check approval for retailers and suppliers
  if ((req.user.role === 'retailer' || req.user.role === 'supplier') && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending admin approval',
    });
  }

  next();
};

/**
 * Check if user's account is active
 */
export const checkActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
    });
  }

  next();
};

export default {
  authorize,
  checkApproval,
  checkActive,
};