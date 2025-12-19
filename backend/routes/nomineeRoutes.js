const express = require('express');
const { body, param } = require('express-validator');
const {
  getNomineesByCategory,
  getNomineeById,
  createNominee,
  updateNominee,
  deleteNominee,
  approveNominee,
  rejectNominee,
  getTopNominees,
  getNomineeStats,
  selfApplyNominee
} = require('../controllers/nomineeController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

const router = express.Router();

import validateObjectId from "../middleware/validateObjectId.js";

// Example
router.get("/:id", validateObjectId, getEventById);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

// @route   GET /api/nominees/category/:categoryId
// @desc    Get nominees by category
// @access  Public
router.get('/category/:categoryId', [
  validateObjectId('categoryId'),
  handleValidationErrors
], getNomineesByCategory);

// @route   GET /api/nominees/top/:categoryId
// @desc    Get top nominees by category
// @access  Public
router.get('/top/:categoryId', [
  validateObjectId('categoryId'),
  handleValidationErrors
], getTopNominees);

// @route   GET /api/nominees/:id
// @desc    Get nominee by ID
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  handleValidationErrors
], getNomineeById);

// @route   GET /api/nominees/:id/stats
// @desc    Get nominee statistics
// @access  Public
router.get('/:id/stats', [
  validateObjectId('id'),
  handleValidationErrors
], getNomineeStats);

// @route   POST /api/nominees
// @desc    Create nominee
// @access  Private/Organizer or Admin
router.post('/', [
  authenticateToken,
  authorize('organizer', 'admin'),
  
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('event')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nominee name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nominee name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['individual', 'organization', 'team', 'product', 'service'])
    .withMessage('Invalid nominee type'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('contact.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  
  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Biography cannot exceed 2000 characters'),
  
  handleValidationErrors
], createNominee);

// @route   POST /api/nominees/self-apply
// @desc    Self-apply as nominee
// @access  Private
router.post('/self-apply', [
  authenticateToken,
  
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nominee name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nominee name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['individual', 'organization', 'team', 'product', 'service'])
    .withMessage('Invalid nominee type'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('contact.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  
  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Biography cannot exceed 2000 characters'),
  
  handleValidationErrors
], selfApplyNominee);

// @route   PUT /api/nominees/:id
// @desc    Update nominee
// @access  Private/Organizer or Admin
router.put('/:id', [
  authenticateToken,
  validateObjectId('id'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nominee name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['individual', 'organization', 'team', 'product', 'service'])
    .withMessage('Invalid nominee type'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('contact.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  
  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Biography cannot exceed 2000 characters'),
  
  handleValidationErrors
], updateNominee);

// @route   PUT /api/nominees/:id/approve
// @desc    Approve nominee
// @access  Private/Organizer or Admin
router.put('/:id/approve', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], approveNominee);

// @route   PUT /api/nominees/:id/reject
// @desc    Reject nominee
// @access  Private/Organizer or Admin
router.put('/:id/reject', [
  authenticateToken,
  validateObjectId('id'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  handleValidationErrors
], rejectNominee);

// @route   DELETE /api/nominees/:id
// @desc    Delete nominee
// @access  Private/Organizer or Admin
router.delete('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], deleteNominee);

module.exports = router;
