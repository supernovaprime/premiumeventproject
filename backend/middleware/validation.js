const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Custom validation middleware for file uploads
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    required = false
  } = options;

  return (req, res, next) => {
    if (required && (!req.file && !req.files)) {
      return res.status(400).json({
        success: false,
        message: 'File upload is required'
      });
    }

    if (req.file || req.files) {
      const files = req.files ? req.files : [req.file];
      
      for (const file of files) {
        // Check file size
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
          });
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type ${file.mimetype} is not allowed`
          });
        }
      }
    }

    next();
  };
};

// Middleware to sanitize input data
const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous characters
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Middleware to validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page number must be greater than 0'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
};

// Middleware to validate date range
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }
    
    req.dateRange = { startDate: start, endDate: end };
  }
  
  next();
};

// Middleware to validate email format
const validateEmail = (req, res, next) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (req.body.email && !emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

// Middleware to validate phone number format
const validatePhone = (req, res, next) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  
  if (req.body.phone && !phoneRegex.test(req.body.phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  
  next();
};

// Middleware to validate password strength
const validatePassword = (req, res, next) => {
  if (req.body.password) {
    const password = req.body.password;
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter'
      });
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter'
      });
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number'
      });
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one special character'
      });
    }
  }
  
  next();
};

// Middleware to validate URL format
const validateURL = (req, res, next) => {
  const urlRegex = /^https?:\/\/.+/;
  
  if (req.body.url && !urlRegex.test(req.body.url)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format'
    });
  }
  
  next();
};

// Middleware to validate currency amount
const validateCurrency = (req, res, next) => {
  const amount = req.body.amount || req.body.price;
  
  if (amount !== undefined) {
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    if (amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot exceed 1,000,000'
      });
    }
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateFileUpload,
  sanitizeInput,
  validateObjectId,
  validatePagination,
  validateDateRange,
  validateEmail,
  validatePhone,
  validatePassword,
  validateURL,
  validateCurrency
};
