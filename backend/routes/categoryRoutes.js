const express = require('express');
const { body, param } = require('express-validator');
const {
  getCategoriesByEvent,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryResults,
  determineWinners,
  updateCategoryOrder
} = require('../controllers/categoryController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/categories/event/:eventId
// @desc    Get categories by event
// @access  Public
router.get('/event/:eventId', [
  validateObjectId('eventId'),
  handleValidationErrors
], getCategoriesByEvent);

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  handleValidationErrors
], getCategoryById);

// @route   GET /api/categories/:id/results
// @desc    Get category results
// @access  Public
router.get('/:id/results', [
  validateObjectId('id'),
  handleValidationErrors
], getCategoryResults);

// @route   POST /api/categories
// @desc    Create category
// @access  Private/Organizer or Admin
router.post('/', [
  authenticateToken,
  authorize('organizer', 'admin'),
  
  body('eventId')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('settings.allowMultipleWinners')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple winners must be a boolean'),
  
  body('settings.maxWinners')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max winners must be between 1 and 10'),
  
  body('settings.votingWeight')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Voting weight must be between 0.1 and 10'),
  
  body('settings.displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  
  handleValidationErrors
], createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Organizer or Admin
router.put('/:id', [
  authenticateToken,
  validateObjectId('id'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('settings.allowMultipleWinners')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple winners must be a boolean'),
  
  body('settings.maxWinners')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max winners must be between 1 and 10'),
  
  body('settings.votingWeight')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Voting weight must be between 0.1 and 10'),
  
  body('settings.isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  
  handleValidationErrors
], updateCategory);

// @route   PUT /api/categories/:id/order
// @desc    Update category display order
// @access  Private/Organizer or Admin
router.put('/:id/order', [
  authenticateToken,
  validateObjectId('id'),
  
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  
  handleValidationErrors
], updateCategoryOrder);

// @route   POST /api/categories/:id/determine-winners
// @desc    Determine category winners
// @access  Private/Organizer or Admin
router.post('/:id/determine-winners', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], determineWinners);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Organizer or Admin
router.delete('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], deleteCategory);

module.exports = router;
