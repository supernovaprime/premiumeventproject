const Vote = require('../models/Vote');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// @desc    Cast vote
// @route   POST /api/votes
// @access  Private
const castVote = async (req, res, next) => {
  try {
    const { nomineeId, categoryId, eventId, voteWeight = 1 } = req.body;

    // Verify nominee exists
    const nominee = await Nominee.findById(nomineeId);
    if (!nominee || nominee.isDeleted || nominee.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found or not approved'
      });
    }

    // Verify category exists and is active
    const category = await Category.findById(categoryId);
    if (!category || category.isDeleted || !category.settings.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or not active'
      });
    }

    // Verify event exists and voting is active
    const event = await Event.findById(eventId);
    if (!event || event.isDeleted || !event.isVotingActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or voting is not active'
      });
    }

    // Check if user can vote
    if (!event.votingSettings.allowMultipleVotes) {
      const existingVote = await Vote.findOne({
        voter: req.user._id,
        category: categoryId,
        status: 'active'
      });

      if (existingVote) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted in this category'
        });
      }
    }

    // Check voting limits
    if (event.votingSettings.maxVotesPerUser) {
      const userVotesInEvent = await Vote.countDocuments({
        voter: req.user._id,
        event: eventId,
        status: 'active'
      });

      if (userVotesInEvent >= event.votingSettings.maxVotesPerUser) {
        return res.status(400).json({
          success: false,
          message: `You have reached the maximum voting limit of ${event.votingSettings.maxVotesPerUser} votes for this event`
        });
      }
    }

    // Create vote
    const vote = await Vote.create({
      voter: req.user._id,
      nominee: nomineeId,
      category: categoryId,
      event: eventId,
      voteWeight,
      votingMethod: 'web',
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceType: getDeviceType(req.get('User-Agent')),
        browser: getBrowser(req.get('User-Agent')),
        os: getOS(req.get('User-Agent'))
      }
    });

    // Process the vote
    const isValid = await vote.processVote();

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Vote could not be processed'
      });
    }

    logger.logVotingEvent('vote_cast', {
      voteId: vote._id,
      voterId: req.user._id,
      nomineeId,
      categoryId,
      eventId,
      voteWeight
    });

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        vote: {
          id: vote._id,
          nominee: nomineeId,
          category: categoryId,
          event: eventId,
          voteWeight,
          votedAt: vote.votedAt,
          status: vote.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get votes by event
// @route   GET /api/votes/event/:eventId
// @access  Public
const getVotesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const votes = await Vote.findByEvent(eventId)
      .populate('voter', 'firstName lastName email')
      .populate('nominee', 'name')
      .populate('category', 'name')
      .sort({ votedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vote.countDocuments({ event: eventId, isDeleted: false });

    res.json({
      success: true,
      data: {
        votes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVotes: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get votes by user
// @route   GET /api/votes/user/:userId
// @access  Private
const getVotesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user can view these votes
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these votes'
      });
    }

    const votes = await Vote.findByVoter(userId)
      .populate('nominee', 'name')
      .populate('category', 'name')
      .populate('event', 'title eventDate')
      .sort({ votedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vote.countDocuments({ voter: userId, isDeleted: false });

    res.json({
      success: true,
      data: {
        votes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVotes: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get voting statistics
// @route   GET /api/votes/stats/:eventId
// @access  Public
const getVotingStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const stats = await Vote.getVotingStats(eventId);

    // Get category-wise statistics
    const categories = await Category.find({ event: eventId });
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const categoryVotes = await Vote.countDocuments({
          category: category._id,
          status: 'active',
          isDeleted: false
        });

        const uniqueVoters = await Vote.distinct('voter', {
          category: category._id,
          status: 'active',
          isDeleted: false
        });

        return {
          categoryId: category._id,
          categoryName: category.name,
          totalVotes: categoryVotes,
          uniqueVoters: uniqueVoters.length
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats,
        categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get flagged votes (Admin only)
// @route   GET /api/votes/flagged
// @access  Private/Admin
const getFlaggedVotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const votes = await Vote.findFlaggedVotes()
      .populate('voter', 'firstName lastName email')
      .populate('nominee', 'name')
      .populate('category', 'name')
      .populate('event', 'title')
      .sort({ votedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vote.countDocuments({ status: 'flagged', isDeleted: false });

    res.json({
      success: true,
      data: {
        votes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVotes: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate vote
// @route   PUT /api/votes/:id/validate
// @access  Private/Admin
const validateVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['active', 'invalidated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const vote = await Vote.findById(id);

    if (!vote || vote.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    const oldStatus = vote.status;
    vote.status = status;

    if (notes) {
      vote.timeline.push({
        status,
        timestamp: new Date(),
        message: notes,
        updatedBy: req.user._id
      });
    }

    await vote.save();

    logger.logBusinessEvent('vote_validated', {
      voteId: vote._id,
      oldStatus,
      newStatus: status,
      validatedBy: req.user._id,
      notes
    });

    res.json({
      success: true,
      message: 'Vote validation updated successfully',
      data: {
        vote: {
          id: vote._id,
          status: vote.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const getDeviceType = (userAgent) => {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

const getBrowser = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

const getOS = (userAgent) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

module.exports = {
  castVote,
  getVotesByEvent,
  getVotesByUser,
  getVotingStats,
  getFlaggedVotes,
  validateVote
};
