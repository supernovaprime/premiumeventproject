const Affiliate = require('../models/Affiliate');
const User = require('../models/User');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');
const { generateUniqueId } = require('../utils/helpers');

// @desc    Register as affiliate
// @route   POST /api/affiliates/register
// @access  Private
const registerAffiliate = async (req, res, next) => {
  try {
    const { businessName, businessType, website, socialMedia, bankDetails } = req.body;

    // Check if user is already an affiliate
    const existingAffiliate = await Affiliate.findOne({ user: req.user._id });
    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as an affiliate'
      });
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      referralCode = generateUniqueId(8).toUpperCase();
      const existingCode = await Affiliate.findOne({ referralCode });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Unable to generate unique referral code'
      });
    }

    // Create affiliate
    const affiliate = await Affiliate.create({
      user: req.user._id,
      referralCode,
      businessName,
      businessType,
      website,
      socialMedia,
      bankDetails,
      status: 'pending',
      commissionRate: 0.05 // Default 5% commission
    });

    // Update user role to affiliate
    await User.findByIdAndUpdate(req.user._id, {
      role: 'affiliate'
    });

    logger.logBusinessEvent('affiliate_registered', {
      affiliateId: affiliate._id,
      userId: req.user._id,
      businessName,
      referralCode
    });

    res.status(201).json({
      success: true,
      message: 'Affiliate registration submitted successfully. It will be reviewed by admin.',
      data: {
        affiliate: {
          id: affiliate._id,
          referralCode: affiliate.referralCode,
          status: affiliate.status,
          businessName: affiliate.businessName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get affiliate stats
// @route   GET /api/affiliates/stats
// @access  Private/Affiliate
const getAffiliateStats = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    const stats = await affiliate.getStatistics();

    res.json({
      success: true,
      data: {
        affiliate: {
          id: affiliate._id,
          referralCode: affiliate.referralCode,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate,
          businessName: affiliate.businessName
        },
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get affiliate referrals
// @route   GET /api/affiliates/referrals
// @access  Private/Affiliate
const getAffiliateReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    const referrals = await affiliate.getReferrals({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        referrals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(referrals.total / limit),
          totalReferrals: referrals.total,
          hasNextPage: page < Math.ceil(referrals.total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get affiliate earnings
// @route   GET /api/affiliates/earnings
// @access  Private/Affiliate
const getAffiliateEarnings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, period = 'month' } = req.query;

    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    const earnings = await affiliate.getEarnings({
      page: parseInt(page),
      limit: parseInt(limit),
      period
    });

    res.json({
      success: true,
      data: {
        earnings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(earnings.total / limit),
          totalEarnings: earnings.total,
          hasNextPage: page < Math.ceil(earnings.total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request payout
// @route   POST /api/affiliates/payout
// @access  Private/Affiliate
const requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    if (affiliate.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Affiliate account is not active'
      });
    }

    // Check available balance
    const availableBalance = await affiliate.getAvailableBalance();
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for payout'
      });
    }

    // Check minimum payout amount
    const minPayoutAmount = 50; // $50 minimum
    if (amount < minPayoutAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is $${minPayoutAmount}`
      });
    }

    // Create payout request
    const payoutRequest = await affiliate.requestPayout(amount);

    logger.logBusinessEvent('payout_requested', {
      affiliateId: affiliate._id,
      userId: req.user._id,
      amount,
      payoutRequestId: payoutRequest._id
    });

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        payoutRequest: {
          id: payoutRequest._id,
          amount: payoutRequest.amount,
          status: payoutRequest.status,
          requestedAt: payoutRequest.requestedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payout history
// @route   GET /api/affiliates/payouts
// @access  Private/Affiliate
const getPayoutHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    const payouts = await affiliate.getPayoutHistory({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(payouts.total / limit),
          totalPayouts: payouts.total,
          hasNextPage: page < Math.ceil(payouts.total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update affiliate profile
// @route   PUT /api/affiliates/profile
// @access  Private/Affiliate
const updateAffiliateProfile = async (req, res, next) => {
  try {
    const { businessName, businessType, website, socialMedia, bankDetails } = req.body;

    const affiliate = await Affiliate.findOne({ user: req.user._id });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate profile not found'
      });
    }

    // Update fields
    if (businessName) affiliate.businessName = businessName;
    if (businessType) affiliate.businessType = businessType;
    if (website) affiliate.website = website;
    if (socialMedia) affiliate.socialMedia = socialMedia;
    if (bankDetails) affiliate.bankDetails = bankDetails;

    await affiliate.save();

    logger.logBusinessEvent('affiliate_profile_updated', {
      affiliateId: affiliate._id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Affiliate profile updated successfully',
      data: {
        affiliate: {
          id: affiliate._id,
          businessName: affiliate.businessName,
          businessType: affiliate.businessType,
          website: affiliate.website,
          socialMedia: affiliate.socialMedia
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get affiliate leaderboard
// @route   GET /api/affiliates/leaderboard
// @access  Public
const getAffiliateLeaderboard = async (req, res, next) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    const leaderboard = await Affiliate.getLeaderboard({
      period,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        leaderboard,
        period
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve affiliate (Admin only)
// @route   PUT /api/affiliates/:id/approve
// @access  Private/Admin
const approveAffiliate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commissionRate, notes } = req.body;

    const affiliate = await Affiliate.findById(id).populate('user');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    await affiliate.approve(commissionRate, notes, req.user._id);

    logger.logBusinessEvent('affiliate_approved', {
      affiliateId: affiliate._id,
      userId: affiliate.user._id,
      approvedBy: req.user._id,
      commissionRate
    });

    res.json({
      success: true,
      message: 'Affiliate approved successfully',
      data: {
        affiliate: {
          id: affiliate._id,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject affiliate (Admin only)
// @route   PUT /api/affiliates/:id/reject
// @access  Private/Admin
const rejectAffiliate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const affiliate = await Affiliate.findById(id).populate('user');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    await affiliate.reject(reason, notes, req.user._id);

    logger.logBusinessEvent('affiliate_rejected', {
      affiliateId: affiliate._id,
      userId: affiliate.user._id,
      rejectedBy: req.user._id,
      reason
    });

    res.json({
      success: true,
      message: 'Affiliate rejected successfully',
      data: {
        affiliate: {
          id: affiliate._id,
          status: affiliate.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
