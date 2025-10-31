const express = require('express');
const { body, param } = require('express-validator');
const {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
  getUsersByRole,
  searchUsers
} = require('../controllers/userController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', [
  authenticateToken,
  authorize('admin'),
  validatePagination
], getUsers);

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', [
  authenticateToken,
  authorize('admin')
], getUserStats);

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', [
  authenticateToken,
  validatePagination
], searchUsers);

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Private
router.get('/role/:role', [
  authenticateToken,
  
  param('role')
    .isIn(['admin', 'organizer', 'user', 'affiliate'])
    .withMessage('Invalid role'),
  
  validatePagination,
  handleValidationErrors
], getUsersByRole);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], getUserById);

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private/Admin
router.put('/:id/status', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Invalid status'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  handleValidationErrors
], updateUserStatus);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('role')
    .isIn(['admin', 'organizer', 'user', 'affiliate'])
    .withMessage('Invalid role'),
  
  handleValidationErrors
], updateUserRole);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  handleValidationErrors
], deleteUser);

module.exports = router;
