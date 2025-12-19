const express = require('express');
const { body, param } = require('express-validator');
const {
  processPayment,
  getPaymentById,
  getPaymentsByUser,
  refundPayment,
  getPaymentStats,
  verifyWebhook
} = require('../controllers/paymentController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

import validateObjectId from "../middleware/validateObjectId.js";

// Example


const router = express.Router();

router.get("/:id", validateObjectId, getEventById);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

// @route   GET /api/payments/user
// @desc    Get payments by user
// @access  Private
router.get('/user', [
  authenticateToken,
  validatePagination
], getPaymentsByUser);

// @route   GET /api/payments/stats
// @desc    Get payment statistics (Admin only)
// @access  Private/Admin
router.get('/stats', [
  authenticateToken,
  authorize('admin')
], getPaymentStats);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], getPaymentById);

// @route   POST /api/payments/process
// @desc    Process payment
// @access  Private
router.post('/process', [
  authenticateToken,
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'GHS', 'NGN'])
    .withMessage('Invalid currency'),
  
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'mobile_money', 'paypal', 'apple_pay', 'google_pay'])
    .withMessage('Invalid payment method'),
  
  body('paymentGateway')
    .optional()
    .isIn(['stripe', 'paypal', 'hubtel', 'flutterwave'])
    .withMessage('Invalid payment gateway'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  
  body('eventId')
    .optional()
    .isMongoId()
    .withMessage('Valid event ID is required'),
  
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Valid order ID is required'),
  
  body('ticketId')
    .optional()
    .isMongoId()
    .withMessage('Valid ticket ID is required'),
  
  handleValidationErrors
], processPayment);

// @route   POST /api/payments/:id/refund
// @desc    Refund payment (Admin only)
// @access  Private/Admin
router.post('/:id/refund', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  handleValidationErrors
], refundPayment);

// @route   POST /api/payments/webhook/:gateway
// @desc    Verify payment webhook
// @access  Public (with signature verification)
router.post('/webhook/:gateway', [
  param('gateway')
    .isIn(['stripe', 'paypal', 'hubtel', 'flutterwave'])
    .withMessage('Invalid payment gateway'),
  
  handleValidationErrors
], verifyWebhook);

module.exports = router;
