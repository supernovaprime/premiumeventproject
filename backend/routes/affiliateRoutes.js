const express = require('express');
const { body, param } = require('express-validator');
const {
  registerAffiliate,
  getAffiliateStats,
  getAffiliateReferrals,
  getAffiliateEarnings,
  requestPayout,
  getPayoutHistory,
  updateAffiliateProfile,
  getAffiliateLeaderboard,
  approveAffiliate,
  rejectAffiliate
} = require('../controllers/affiliateController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/affiliates/leaderboard
// @desc    Get affiliate leaderboard
// @access  Public
router.get('/leaderboard', getAffiliateLeaderboard);

// @route   GET /api/affiliates/stats
// @desc    Get affiliate stats
// @access  Private/Affiliate
router.get('/stats', [
  authenticateToken,
  authorize('affiliate')
], getAffiliateStats);

import validateObjectId from "../middleware/validateObjectId.js";

// Example
router.get("/:id", validateObjectId, getEvent);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

// @route   GET /api/affiliates/referrals
// @desc    Get affiliate referrals
// @access  Private/Affiliate
router.get('/referrals', [
  authenticateToken,
  authorize('affiliate'),
  validatePagination
], getAffiliateReferrals);

// @route   GET /api/affiliates/earnings
// @desc    Get affiliate earnings
// @access  Private/Affiliate
router.get('/earnings', [
  authenticateToken,
  authorize('affiliate'),
  validatePagination
], getAffiliateEarnings);

// @route   GET /api/affiliates/payouts
// @desc    Get payout history
// @access  Private/Affiliate
router.get('/payouts', [
  authenticateToken,
  authorize('affiliate'),
  validatePagination
], getPayoutHistory);

// @route   POST /api/affiliates/register
// @desc    Register as affiliate
// @access  Private
router.post('/register', [
  authenticateToken,
  
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessType')
    .isIn(['individual', 'company', 'organization', 'influencer', 'blogger'])
    .withMessage('Invalid business type'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('socialMedia.platform')
    .optional()
    .isIn(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'])
    .withMessage('Invalid social media platform'),
  
  body('socialMedia.handle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Social media handle cannot exceed 100 characters'),
  
  body('bankDetails.accountName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Account name cannot exceed 100 characters'),
  
  body('bankDetails.accountNumber')
    .optional()
    .matches(/^[0-9]{10,20}$/)
    .withMessage('Invalid account number format'),
  
  body('bankDetails.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),
  
  body('bankDetails.routingNumber')
    .optional()
    .matches(/^[0-9]{9}$/)
    .withMessage('Invalid routing number format'),
  
  handleValidationErrors
], registerAffiliate);

// @route   POST /api/affiliates/payout
// @desc    Request payout
// @access  Private/Affiliate
router.post('/payout', [
  authenticateToken,
  authorize('affiliate'),
  
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  
  handleValidationErrors
], requestPayout);

// @route   PUT /api/affiliates/profile
// @desc    Update affiliate profile
// @access  Private/Affiliate
router.put('/profile', [
  authenticateToken,
  authorize('affiliate'),
  
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessType')
    .optional()
    .isIn(['individual', 'company', 'organization', 'influencer', 'blogger'])
    .withMessage('Invalid business type'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('socialMedia.platform')
    .optional()
    .isIn(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'])
    .withMessage('Invalid social media platform'),
  
  body('socialMedia.handle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Social media handle cannot exceed 100 characters'),
  
  body('bankDetails.accountName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Account name cannot exceed 100 characters'),
  
  body('bankDetails.accountNumber')
    .optional()
    .matches(/^[0-9]{10,20}$/)
    .withMessage('Invalid account number format'),
  
  body('bankDetails.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),
  
  body('bankDetails.routingNumber')
    .optional()
    .matches(/^[0-9]{9}$/)
    .withMessage('Invalid routing number format'),
  
  handleValidationErrors
], updateAffiliateProfile);

// @route   PUT /api/affiliates/:id/approve
// @desc    Approve affiliate (Admin only)
// @access  Private/Admin
router.put('/:id/approve', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('commissionRate')
    .optional()
    .isFloat({ min: 0.01, max: 0.5 })
    .withMessage('Commission rate must be between 0.01 and 0.5'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
], approveAffiliate);

// @route   PUT /api/affiliates/:id/reject
// @desc    Reject affiliate (Admin only)
// @access  Private/Admin
router.put('/:id/reject', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
], rejectAffiliate);

module.exports = router;
