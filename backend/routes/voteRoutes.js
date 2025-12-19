const express = require('express');
const { body, param } = require('express-validator');
const {
  castVote,
  getVotesByEvent,
  getVotesByUser,
  getVotingStats,
  getFlaggedVotes,
  validateVote
} = require('../controllers/voteController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

import validateObjectId from "../middleware/validateObjectId.js";

// Example


const router = express.Router();

router.get("/:id", validateObjectId, getEventById);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);


// @route   GET /api/votes/event/:eventId
// @desc    Get votes by event
// @access  Public
router.get('/event/:eventId', [
  validateObjectId('eventId'),
  validatePagination,
  handleValidationErrors
], getVotesByEvent);

// @route   GET /api/votes/user/:userId
// @desc    Get votes by user
// @access  Private
router.get('/user/:userId', [
  authenticateToken,
  validateObjectId('userId'),
  validatePagination,
  handleValidationErrors
], getVotesByUser);

// @route   GET /api/votes/stats/:eventId
// @desc    Get voting statistics
// @access  Public
router.get('/stats/:eventId', [
  validateObjectId('eventId'),
  handleValidationErrors
], getVotingStats);

// @route   GET /api/votes/flagged
// @desc    Get flagged votes (Admin only)
// @access  Private/Admin
router.get('/flagged', [
  authenticateToken,
  authorize('admin'),
  validatePagination,
  handleValidationErrors
], getFlaggedVotes);

// @route   POST /api/votes
// @desc    Cast vote
// @access  Private
router.post('/', [
  authenticateToken,
  
  body('nomineeId')
    .isMongoId()
    .withMessage('Valid nominee ID is required'),
  
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('eventId')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  
  body('voteWeight')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Vote weight must be between 0.1 and 10'),
  
  handleValidationErrors
], castVote);

// @route   PUT /api/votes/:id/validate
// @desc    Validate vote (Admin only)
// @access  Private/Admin
router.put('/:id/validate', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('status')
    .isIn(['active', 'invalidated'])
    .withMessage('Status must be either active or invalidated'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
], validateVote);

module.exports = router;
