const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deleted'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user owns resource or is admin
const authorizeResource = (resourceParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceId = req.params[resourceParam];
    const userId = req.user._id.toString();

    if (resourceId === userId) {
      return next();
    }

    // For nested resources, check if user is the owner
    if (req.body && req.body.user && req.body.user.toString() === userId) {
      return next();
    }

    if (req.body && req.body.organizer && req.body.organizer.toString() === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied - insufficient permissions'
    });
  };
};

// Middleware to check if user can vote
const canVote = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to vote'
      });
    }

    const { eventId, categoryId } = req.params;
    
    // Import models
    const Event = require('../models/Event');
    const Category = require('../models/Category');
    const Vote = require('../models/Vote');

    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.isVotingActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not active for this event'
      });
    }

    // Check if category exists and is active
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!category.settings.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not active for this category'
      });
    }

    // Check voting limits
    if (!event.votingSettings.allowMultipleVotes) {
      const existingVote = await Vote.findOne({
        voter: req.user._id,
        category: categoryId,
        status: 'active'
      });

      if (existingVote) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted in this category'
        });
      }
    }

    req.event = event;
    req.category = category;
    next();
  } catch (error) {
    console.error('Vote authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking voting permissions'
    });
  }
};

// Middleware to check if user can manage event
const canManageEvent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { eventId } = req.params;
    
    // Admin can manage all events
    if (req.user.role === 'admin') {
      return next();
    }

    // Import Event model
    const Event = require('../models/Event');

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can manage this event'
      });
    }

    req.event = event;
    next();
  } catch (error) {
    console.error('Event management authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking event management permissions'
    });
  }
};

// Middleware to check if user can access affiliate features
const canAccessAffiliate = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access all affiliate features
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is an affiliate
    if (req.user.role !== 'affiliate') {
      return res.status(403).json({
        success: false,
        message: 'Affiliate access required'
      });
    }

    // Import Affiliate model
    const Affiliate = require('../models/Affiliate');

    // Check if affiliate record exists and is active
    const affiliate = await Affiliate.findOne({ 
      user: req.user._id,
      status: 'active'
    });

    if (!affiliate) {
      return res.status(403).json({
        success: false,
        message: 'Affiliate account not found or not active'
      });
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    console.error('Affiliate authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking affiliate permissions'
    });
  }
};

// Middleware to check if user can access shop
const canAccessShop = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // All authenticated users can access shop
    // Additional checks can be added here for specific shop features
    
    next();
  } catch (error) {
    console.error('Shop authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking shop permissions'
    });
  }
};

// Middleware to check if user can access admin features
const canAccessAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin permissions'
    });
  }
};

// Middleware to check if user can access organizer features
const canAccessOrganizer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Organizer access required'
      });
    }

    next();
  } catch (error) {
    console.error('Organizer authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking organizer permissions'
    });
  }
};

// Middleware to validate email verification
const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking email verification'
    });
  }
};

// Middleware to validate phone verification
const requirePhoneVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required',
        code: 'PHONE_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Phone verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking phone verification'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeResource,
  canVote,
  canManageEvent,
  canAccessAffiliate,
  canAccessShop,
  canAccessAdmin,
  canAccessOrganizer,
  requireEmailVerification,
  requirePhoneVerification
};
