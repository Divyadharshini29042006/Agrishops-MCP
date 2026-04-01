// backend/src/middleware/validateMiddleware.js

/**
 * Validation middleware for request body, params, and query
 * Provides common validation rules
 */

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate password strength
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Validate GST number
export const validateGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

// Validate pincode (Indian)
export const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Validate ObjectId (MongoDB)
export const validateObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Middleware to validate registration input
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  const errors = [];

  // Check required fields
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!validatePassword(password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (!role) {
    errors.push('Role is required');
  } else if (!['customer', 'retailer', 'supplier'].includes(role)) {
    errors.push('Invalid role. Must be customer, retailer, or supplier');
  }

  if (phone && !validatePhone(phone)) {
    errors.push('Invalid phone number. Must be 10 digits starting with 6-9');
  }

  // Check business details for retailers/suppliers
  if ((role === 'retailer' || role === 'supplier') && !req.body.businessDetails?.businessName) {
    errors.push('Business name is required for retailers and suppliers');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate login input
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate product input
 */
export const validateProduct = (req, res, next) => {
  const { name, category, price, stock, unit } = req.body;

  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!category) {
    errors.push('Category is required');
  } else if (!validateObjectId(category)) {
    errors.push('Invalid category ID');
  }

  if (!price) {
    errors.push('Price is required');
  } else if (isNaN(price) || Number(price) <= 0) {
    errors.push('Price must be a positive number');
  }

  if (!stock && stock !== 0) {
    errors.push('Stock quantity is required');
  } else if (isNaN(stock) || Number(stock) < 0) {
    errors.push('Stock must be a non-negative number');
  }

  if (!unit || unit.trim().length === 0) {
    errors.push('Unit is required (e.g., kg, liter, packet)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate ObjectId in params
 */
export const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`
      });
    }

    next();
  };
};

/**
 * Generic validation middleware
 * Pass validation schema as argument
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value) {
        if (rules.type === 'email' && !validateEmail(value)) {
          errors.push(`Invalid ${field} format`);
        }

        if (rules.type === 'phone' && !validatePhone(value)) {
          errors.push(`Invalid ${field} format`);
        }

        if (rules.type === 'number' && isNaN(value)) {
          errors.push(`${field} must be a number`);
        }

        if (rules.min && value.length < rules.min) {
          errors.push(`${field} must be at least ${rules.min} characters`);
        }

        if (rules.max && value.length > rules.max) {
          errors.push(`${field} must be at most ${rules.max} characters`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateGST,
  validatePincode,
  validateObjectId,
  validateRegister,
  validateLogin,
  validateProduct,
  validateIdParam,
  validate
};