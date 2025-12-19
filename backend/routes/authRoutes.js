import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyPhone,
  resendVerification,
  refreshToken
} from '../controllers/authController.js';

import validateObjectId from "../middleware/validateObjectId.js";



import { authenticateToken, requireEmailVerification } from '../middleware/auth.js';
import { handleValidationErrors, validatePassword } from '../middleware/validation.js';

const router = express.Router();

// Example
router.get("/:id", validateObjectId, getEvent);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'organizer', 'affiliate'])
    .withMessage('Invalid role'),
  
  body('referralCode')
    .optional()
    .isLength({ min: 6, max: 10 })
    .withMessage('Invalid referral code format'),
  
  handleValidationErrors
], register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('emailOrPhone')
    .notEmpty()
    .withMessage('Email or phone is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
], login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address cannot exceed 100 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Zip code cannot exceed 10 characters'),
  
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('socialLinks.facebook')
    .optional()
    .isURL()
    .withMessage('Invalid Facebook URL'),
  
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL'),
  
  body('socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Invalid Instagram URL'),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),
  
  handleValidationErrors
], updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  authenticateToken,
  
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  handleValidationErrors
], changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  handleValidationErrors
], forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  handleValidationErrors
], resetPassword);

// @route   POST /api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.post('/verify-email/:token', verifyEmail);

// @route   POST /api/auth/verify-phone
// @desc    Verify phone with code
// @access  Private
router.post('/verify-phone', [
  authenticateToken,
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits'),
  
  handleValidationErrors
], verifyPhone);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', authenticateToken, resendVerification);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors
], refreshToken);

module.exports = router;
