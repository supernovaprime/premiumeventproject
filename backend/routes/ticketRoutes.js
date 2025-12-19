const express = require('express');
const { body, param } = require('express-validator');
const {
  purchaseTicket,
  getTicketById,
  getTicketsByUser,
  validateTicket,
  sendTicket,
  getTicketStats,
  cancelTicket
} = require('../controllers/ticketController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

import validateObjectId from "../middleware/validateObjectId.js";

// Example
router.get("/:id", validateObjectId, getEventById);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

const router = express.Router();

// @route   GET /api/tickets/user
// @desc    Get tickets by user
// @access  Private
router.get('/user', [
  authenticateToken,
  validatePagination
], getTicketsByUser);

// @route   GET /api/tickets/stats/:eventId
// @desc    Get ticket statistics
// @access  Public
router.get('/stats/:eventId', [
  validateObjectId('eventId'),
  handleValidationErrors
], getTicketStats);

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], getTicketById);

// @route   POST /api/tickets/purchase
// @desc    Purchase ticket
// @access  Private
router.post('/purchase', [
  authenticateToken,
  
  body('eventId')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  
  body('ticketType')
    .notEmpty()
    .withMessage('Ticket type is required'),
  
  body('attendeeInfo.firstName')
    .trim()
    .notEmpty()
    .withMessage('Attendee first name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('attendeeInfo.lastName')
    .trim()
    .notEmpty()
    .withMessage('Attendee last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('attendeeInfo.email')
    .isEmail()
    .withMessage('Valid attendee email is required'),
  
  body('attendeeInfo.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'mobile_money', 'cash'])
    .withMessage('Invalid payment method'),
  
  handleValidationErrors
], purchaseTicket);

// @route   POST /api/tickets/:id/validate
// @desc    Validate ticket
// @access  Private/Organizer or Admin
router.post('/:id/validate', [
  authenticateToken,
  authorize('organizer', 'admin'),
  validateObjectId('id'),
  
  body('qrCodeData')
    .optional()
    .notEmpty()
    .withMessage('QR code data is required for validation'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
], validateTicket);

// @route   POST /api/tickets/:id/send
// @desc    Send ticket via email/SMS
// @access  Private
router.post('/:id/send', [
  authenticateToken,
  validateObjectId('id'),
  
  body('method')
    .optional()
    .isIn(['email', 'sms'])
    .withMessage('Method must be either email or sms'),
  
  handleValidationErrors
], sendTicket);

// @route   PUT /api/tickets/:id/cancel
// @desc    Cancel ticket
// @access  Private
router.put('/:id/cancel', [
  authenticateToken,
  validateObjectId('id'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  handleValidationErrors
], cancelTicket);

module.exports = router;
