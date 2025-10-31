const Category = require('../models/Category');
const Event = require('../models/Event');
const Nominee = require('../models/Nominee');
const Vote = require('../models/Vote');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get categories by event
// @route   GET /api/categories/event/:eventId
// @access  Public
const getCategoriesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const categories = await Category.findByEvent(eventId)
      .populate('nominees', 'name description logo image voteCount')
      .sort({ 'settings.displayOrder': 1 });

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('event', 'title eventDate status')
      .populate({
        path: 'nominees',
        populate: {
          path: 'appliedBy',
          select: 'firstName lastName'
        }
      });

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Organizer or Admin
const createCategory = async (req, res, next) => {
  try {
    const { eventId, ...categoryData } = req.body;

    // Verify event exists and user can manage it
    const event = await Event.findById(eventId);
    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create categories for this event'
      });
    }

    const category = await Category.create({
      ...categoryData,
      event: eventId
    });

    // Add category to event
    await Event.findByIdAndUpdate(eventId, {
      $push: { categories: category._id }
    });

    logger.logBusinessEvent('category_created', {
      categoryId: category._id,
      eventId,
      createdBy: req.user._id,
      name: category.name
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Organizer or Admin
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('event');

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && category.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        category[key] = req.body[key];
      }
    });

    await category.save();

    logger.logBusinessEvent('category_updated', {
      categoryId: category._id,
      eventId: category.event._id,
      updatedBy: req.user._id,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Organizer or Admin
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('event');

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && category.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }

    // Soft delete
    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = req.user._id;
    await category.save();

    // Remove from event
    await Event.findByIdAndUpdate(category.event._id, {
      $pull: { categories: category._id }
    });

    logger.logBusinessEvent('category_deleted', {
      categoryId: category._id,
      eventId: category.event._id,
      deletedBy: req.user._id,
      name: category.name
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category results
// @route   GET /api/categories/:id/results
// @access  Public
const getCategoryResults = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const results = await category.getResults();

    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          settings: category.settings,
          winners: category.winners
        },
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Determine category winners
// @route   POST /api/categories/:id/determine-winners
// @access  Private/Organizer or Admin
const determineWinners = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('event');

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && category.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to determine winners for this category'
      });
    }

    // Check if voting is still active
    if (category.event.isVotingActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine winners while voting is still active'
      });
    }

    const winners = await category.determineWinners();

    logger.logBusinessEvent('winners_determined', {
      categoryId: category._id,
      eventId: category.event._id,
      determinedBy: req.user._id,
      winnersCount: winners.length
    });

    res.json({
      success: true,
      message: 'Winners determined successfully',
      data: {
        winners
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category display order
// @route   PUT /api/categories/:id/order
// @access  Private/Organizer or Admin
const updateCategoryOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;

    const category = await Category.findById(id).populate('event');

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && category.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }

    category.settings.displayOrder = displayOrder;
    await category.save();

    res.json({
      success: true,
      message: 'Category order updated successfully',
      data: {
        category: {
          id: category._id,
          displayOrder: category.settings.displayOrder
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategoriesByEvent,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryResults,
  determineWinners,
  updateCategoryOrder
};
