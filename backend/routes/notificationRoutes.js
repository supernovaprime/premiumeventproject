const express = require('express');
const { body, param } = require('express-validator');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  broadcastNotification
} = require('../controllers/notificationController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications
// @access  Private
router.get('/', [
  authenticateToken,
  validatePagination
], getNotifications);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (Admin only)
// @access  Private/Admin
router.get('/stats', [
  authenticateToken,
  authorize('admin')
], getNotificationStats);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', [
  authenticateToken
], markAllAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], deleteNotification);

// @route   POST /api/notifications
// @desc    Create notification (Admin only)
// @access  Private/Admin
router.post('/', [
  authenticateToken,
  authorize('admin'),
  
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  
  body('recipients.*')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  
  body('type')
    .isIn(['info', 'success', 'warning', 'error', 'event_update', 'payment', 'system'])
    .withMessage('Invalid notification type'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  
  body('link')
    .optional()
    .isURL()
    .withMessage('Invalid link URL'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('Send email must be a boolean'),
  
  body('sendSMS')
    .optional()
    .isBoolean()
    .withMessage('Send SMS must be a boolean'),
  
  handleValidationErrors
], createNotification);

// @route   POST /api/notifications/broadcast
// @desc    Send broadcast notification (Admin only)
// @access  Private/Admin
router.post('/broadcast', [
  authenticateToken,
  authorize('admin'),
  
  body('type')
    .isIn(['info', 'success', 'warning', 'error', 'event_update', 'payment', 'system'])
    .withMessage('Invalid notification type'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  
  body('link')
    .optional()
    .isURL()
    .withMessage('Invalid link URL'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('userRoles')
    .optional()
    .isArray()
    .withMessage('User roles must be an array'),
  
  body('userRoles.*')
    .optional()
    .isIn(['admin', 'organizer', 'user', 'affiliate'])
    .withMessage('Invalid user role'),
  
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('Send email must be a boolean'),
  
  body('sendSMS')
    .optional()
    .isBoolean()
    .withMessage('Send SMS must be a boolean'),
  
  handleValidationErrors
], broadcastNotification);

module.exports = router;
