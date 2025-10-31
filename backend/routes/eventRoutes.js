const express = require('express');
const { body, param } = require('express-validator');
const {
  getEvents,
  getEventById,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getEventsByOrganizer,
  getEventAnalytics,
  getUpcomingEvents
} = require('../controllers/eventController');

const { authenticateToken, authorize, canManageEvent, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', [
  validatePagination,
  validateDateRange
], getEvents);

// @route   GET /api/events/upcoming
// @desc    Get upcoming events
// @access  Public
router.get('/upcoming', getUpcomingEvents);

// @route   GET /api/events/slug/:slug
// @desc    Get event by slug
// @access  Public
router.get('/slug/:slug', getEventBySlug);

// @route   GET /api/events/organizer/:organizerId
// @desc    Get events by organizer
// @access  Public
router.get('/organizer/:organizerId', [
  validateObjectId('organizerId'),
  validatePagination,
  handleValidationErrors
], getEventsByOrganizer);

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  handleValidationErrors
], getEventById);

// @route   GET /api/events/:id/analytics
// @desc    Get event analytics
// @access  Private/Organizer or Admin
router.get('/:id/analytics', [
  authenticateToken,
  canManageEvent,
  handleValidationErrors
], getEventAnalytics);

// @route   POST /api/events
// @desc    Create event
// @access  Private/Organizer
router.post('/', [
  authenticateToken,
  authorize('organizer', 'admin'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Event title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Event description must be between 20 and 2000 characters'),
  
  body('eventDate')
    .isISO8601()
    .withMessage('Event date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  
  body('eventTime')
    .notEmpty()
    .withMessage('Event time is required'),
  
  body('location.type')
    .optional()
    .isIn(['physical', 'virtual', 'hybrid'])
    .withMessage('Invalid location type'),
  
  body('location.venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue name cannot exceed 200 characters'),
  
  body('location.virtualLink')
    .optional()
    .isURL()
    .withMessage('Invalid virtual link URL'),
  
  body('votingSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Voting enabled must be a boolean'),
  
  body('votingSettings.startDate')
    .optional()
    .isISO8601()
    .withMessage('Voting start date must be a valid date'),
  
  body('votingSettings.endDate')
    .optional()
    .isISO8601()
    .withMessage('Voting end date must be a valid date'),
  
  body('ticketingSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Ticketing enabled must be a boolean'),
  
  body('ticketingSettings.ticketTypes')
    .optional()
    .isArray()
    .withMessage('Ticket types must be an array'),
  
  body('ticketingSettings.ticketTypes.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Ticket type name is required'),
  
  body('ticketingSettings.ticketTypes.*.price')
    .optional()
    .isNumeric()
    .withMessage('Ticket price must be a number'),
  
  body('ticketingSettings.ticketTypes.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ticket quantity must be a positive integer'),
  
  body('branding.primaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Primary color must be a valid hex color'),
  
  body('branding.secondaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Secondary color must be a valid hex color'),
  
  handleValidationErrors
], createEvent);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private/Organizer or Admin
router.put('/:id', [
  authenticateToken,
  canManageEvent,
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Event title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Event description must be between 20 and 2000 characters'),
  
  body('eventDate')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  
  body('eventTime')
    .optional()
    .notEmpty()
    .withMessage('Event time is required'),
  
  body('location.type')
    .optional()
    .isIn(['physical', 'virtual', 'hybrid'])
    .withMessage('Invalid location type'),
  
  body('location.venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue name cannot exceed 200 characters'),
  
  body('location.virtualLink')
    .optional()
    .isURL()
    .withMessage('Invalid virtual link URL'),
  
  body('votingSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Voting enabled must be a boolean'),
  
  body('votingSettings.startDate')
    .optional()
    .isISO8601()
    .withMessage('Voting start date must be a valid date'),
  
  body('votingSettings.endDate')
    .optional()
    .isISO8601()
    .withMessage('Voting end date must be a valid date'),
  
  body('ticketingSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Ticketing enabled must be a boolean'),
  
  body('branding.primaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Primary color must be a valid hex color'),
  
  body('branding.secondaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Secondary color must be a valid hex color'),
  
  handleValidationErrors
], updateEvent);

// @route   PUT /api/events/:id/approve
// @desc    Approve event (Admin only)
// @access  Private/Admin
router.put('/:id/approve', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters'),
  
  handleValidationErrors
], approveEvent);

// @route   PUT /api/events/:id/reject
// @desc    Reject event (Admin only)
// @access  Private/Admin
router.put('/:id/reject', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters'),
  
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters'),
  
  handleValidationErrors
], rejectEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private/Organizer or Admin
router.delete('/:id', [
  authenticateToken,
  canManageEvent,
  handleValidationErrors
], deleteEvent);

module.exports = router;
