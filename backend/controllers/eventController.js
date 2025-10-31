const Event = require('../models/Event');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const Vote = require('../models/Vote');
const Ticket = require('../models/Ticket');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { generateSlug } = require('../utils/helpers');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'active', 
      category, 
      search, 
      sortBy = 'eventDate',
      sortOrder = 'asc',
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = { isDeleted: false };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'seo.keywords': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (startDate && endDate) {
      query.eventDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email avatar')
      .populate('categories', 'name description')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizer', 'firstName lastName email avatar bio socialLinks')
      .populate({
        path: 'categories',
        populate: {
          path: 'nominees',
          model: 'Nominee'
        }
      });

    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count
    event.analytics.totalViews += 1;
    await event.save();

    res.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event by slug
// @route   GET /api/events/slug/:slug
// @access  Public
const getEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ 'seo.slug': slug, isDeleted: false })
      .populate('organizer', 'firstName lastName email avatar bio socialLinks')
      .populate({
        path: 'categories',
        populate: {
          path: 'nominees',
          model: 'Nominee'
        }
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count
    event.analytics.totalViews += 1;
    await event.save();

    res.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    // Generate slug if not provided
    if (!eventData.seo?.slug) {
      eventData.seo = {
        ...eventData.seo,
        slug: generateSlug(eventData.title)
      };
    }

    const event = await Event.create(eventData);

    // Populate organizer data
    await event.populate('organizer', 'firstName lastName email avatar');

    logger.logBusinessEvent('event_created', {
      eventId: event._id,
      organizerId: req.user._id,
      title: event.title
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer or Admin
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

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
        message: 'Not authorized to update this event'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    // Update slug if title changed
    if (req.body.title && !req.body.seo?.slug) {
      event.seo.slug = generateSlug(req.body.title);
    }

    await event.save();

    logger.logBusinessEvent('event_updated', {
      eventId: event._id,
      updatedBy: req.user._id,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Organizer or Admin
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

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
        message: 'Not authorized to delete this event'
      });
    }

    // Soft delete
    event.isDeleted = true;
    event.deletedAt = new Date();
    event.deletedBy = req.user._id;
    await event.save();

    logger.logBusinessEvent('event_deleted', {
      eventId: event._id,
      deletedBy: req.user._id,
      title: event.title
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve event (Admin only)
// @route   PUT /api/events/:id/approve
// @access  Private/Admin
const approveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const event = await Event.findById(id);

    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.status = 'approved';
    event.approval.approvedBy = req.user._id;
    event.approval.approvedAt = new Date();
    event.approval.adminNotes = adminNotes;

    await event.save();

    logger.logBusinessEvent('event_approved', {
      eventId: event._id,
      approvedBy: req.user._id,
      organizerId: event.organizer
    });

    res.json({
      success: true,
      message: 'Event approved successfully',
      data: {
        event: {
          id: event._id,
          status: event.status,
          approvedAt: event.approval.approvedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject event (Admin only)
// @route   PUT /api/events/:id/reject
// @access  Private/Admin
const rejectEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const event = await Event.findById(id);

    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.status = 'rejected';
    event.approval.rejectionReason = rejectionReason;
    event.approval.adminNotes = adminNotes;

    await event.save();

    logger.logBusinessEvent('event_rejected', {
      eventId: event._id,
      rejectedBy: req.user._id,
      organizerId: event.organizer,
      reason: rejectionReason
    });

    res.json({
      success: true,
      message: 'Event rejected successfully',
      data: {
        event: {
          id: event._id,
          status: event.status,
          rejectionReason: event.approval.rejectionReason
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get events by organizer
// @route   GET /api/events/organizer/:organizerId
// @access  Public
const getEventsByOrganizer = async (req, res, next) => {
  try {
    const { organizerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
      organizer: organizerId, 
      isDeleted: false 
    };

    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email avatar')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event analytics
// @route   GET /api/events/:id/analytics
// @access  Private/Organizer or Admin
const getEventAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

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
        message: 'Not authorized to view analytics for this event'
      });
    }

    // Get voting statistics
    const votingStats = await Vote.getVotingStats(id);

    // Get ticket statistics
    const ticketStats = await Ticket.getTicketStats(id);

    // Get category statistics
    const categories = await Category.find({ event: id });
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const stats = await category.calculateVotingStats();
        return {
          categoryId: category._id,
          categoryName: category.name,
          ...stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        analytics: {
          event: {
            id: event._id,
            title: event.title,
            status: event.status,
            eventDate: event.eventDate,
            totalViews: event.analytics.totalViews,
            uniqueVisitors: event.analytics.uniqueVisitors,
            socialShares: event.analytics.socialShares,
            trafficSources: event.analytics.trafficSources
          },
          voting: votingStats,
          tickets: ticketStats,
          categories: categoryStats,
          financial: event.financial
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
const getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const events = await Event.findUpcomingEvents()
      .populate('organizer', 'firstName lastName email avatar')
      .populate('categories', 'name')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        events
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
