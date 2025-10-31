const Nominee = require('../models/Nominee');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Vote = require('../models/Vote');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get nominees by category
// @route   GET /api/nominees/category/:categoryId
// @access  Public
const getNomineesByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const nominees = await Nominee.findByCategory(categoryId)
      .populate('appliedBy', 'firstName lastName email')
      .sort({ voteCount: -1 });

    res.json({
      success: true,
      data: {
        nominees
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nominee by ID
// @route   GET /api/nominees/:id
// @access  Public
const getNomineeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nominee = await Nominee.findById(id)
      .populate('category', 'name description')
      .populate('event', 'title eventDate')
      .populate('appliedBy', 'firstName lastName email');

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    res.json({
      success: true,
      data: {
        nominee
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create nominee
// @route   POST /api/nominees
// @access  Private
const createNominee = async (req, res, next) => {
  try {
    const nomineeData = {
      ...req.body,
      appliedBy: req.user._id,
      applicationMethod: 'manual'
    };

    // Verify category exists
    const category = await Category.findById(nomineeData.category);
    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Verify event exists
    const event = await Event.findById(nomineeData.event);
    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can add nominees to this event
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add nominees to this event'
      });
    }

    const nominee = await Nominee.create(nomineeData);

    // Add nominee to category
    await Category.findByIdAndUpdate(category._id, {
      $push: { nominees: nominee._id }
    });

    logger.logBusinessEvent('nominee_created', {
      nomineeId: nominee._id,
      categoryId: category._id,
      eventId: event._id,
      createdBy: req.user._id,
      name: nominee.name
    });

    res.status(201).json({
      success: true,
      message: 'Nominee created successfully',
      data: {
        nominee
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update nominee
// @route   PUT /api/nominees/:id
// @access  Private/Organizer or Admin
const updateNominee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nominee = await Nominee.findById(id).populate('event');

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && nominee.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this nominee'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        nominee[key] = req.body[key];
      }
    });

    await nominee.save();

    logger.logBusinessEvent('nominee_updated', {
      nomineeId: nominee._id,
      eventId: nominee.event._id,
      updatedBy: req.user._id,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Nominee updated successfully',
      data: {
        nominee
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete nominee
// @route   DELETE /api/nominees/:id
// @access  Private/Organizer or Admin
const deleteNominee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nominee = await Nominee.findById(id).populate('event');

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && nominee.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this nominee'
      });
    }

    // Soft delete
    nominee.isDeleted = true;
    nominee.deletedAt = new Date();
    nominee.deletedBy = req.user._id;
    await nominee.save();

    // Remove from category
    await Category.findByIdAndUpdate(nominee.category, {
      $pull: { nominees: nominee._id }
    });

    logger.logBusinessEvent('nominee_deleted', {
      nomineeId: nominee._id,
      eventId: nominee.event._id,
      deletedBy: req.user._id,
      name: nominee.name
    });

    res.json({
      success: true,
      message: 'Nominee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve nominee
// @route   PUT /api/nominees/:id/approve
// @access  Private/Organizer or Admin
const approveNominee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nominee = await Nominee.findById(id).populate('event');

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && nominee.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this nominee'
      });
    }

    await nominee.approve();

    logger.logBusinessEvent('nominee_approved', {
      nomineeId: nominee._id,
      eventId: nominee.event._id,
      approvedBy: req.user._id,
      name: nominee.name
    });

    res.json({
      success: true,
      message: 'Nominee approved successfully',
      data: {
        nominee: {
          id: nominee._id,
          status: nominee.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject nominee
// @route   PUT /api/nominees/:id/reject
// @access  Private/Organizer or Admin
const rejectNominee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const nominee = await Nominee.findById(id).populate('event');

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && nominee.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this nominee'
      });
    }

    await nominee.reject();

    logger.logBusinessEvent('nominee_rejected', {
      nomineeId: nominee._id,
      eventId: nominee.event._id,
      rejectedBy: req.user._id,
      name: nominee.name,
      reason
    });

    res.json({
      success: true,
      message: 'Nominee rejected successfully',
      data: {
        nominee: {
          id: nominee._id,
          status: nominee.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top nominees
// @route   GET /api/nominees/top/:categoryId
// @access  Public
const getTopNominees = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { limit = 10 } = req.query;

    const nominees = await Nominee.findTopNominees(categoryId, parseInt(limit));

    res.json({
      success: true,
      data: {
        nominees
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nominee statistics
// @route   GET /api/nominees/:id/stats
// @access  Public
const getNomineeStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nominee = await Nominee.findById(id);

    if (!nominee || nominee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    const stats = await nominee.getStatistics();

    res.json({
      success: true,
      data: {
        nominee: {
          id: nominee._id,
          name: nominee.name,
          voteCount: nominee.voteCount,
          position: nominee.position
        },
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Self-apply as nominee
// @route   POST /api/nominees/self-apply
// @access  Private
const selfApplyNominee = async (req, res, next) => {
  try {
    const { categoryId, ...nomineeData } = req.body;

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if self-application is allowed
    const event = await Event.findById(category.event);
    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user already applied
    const existingNominee = await Nominee.findOne({
      category: categoryId,
      appliedBy: req.user._id,
      isDeleted: false
    });

    if (existingNominee) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this category'
      });
    }

    const nominee = await Nominee.create({
      ...nomineeData,
      category: categoryId,
      event: event._id,
      appliedBy: req.user._id,
      applicationMethod: 'self-application',
      status: 'pending'
    });

    // Add nominee to category
    await Category.findByIdAndUpdate(categoryId, {
      $push: { nominees: nominee._id }
    });

    logger.logBusinessEvent('self_application_submitted', {
      nomineeId: nominee._id,
      categoryId,
      eventId: event._id,
      applicantId: req.user._id,
      name: nominee.name
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. It will be reviewed by the event organizer.',
      data: {
        nominee
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
