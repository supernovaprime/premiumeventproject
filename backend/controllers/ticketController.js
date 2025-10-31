const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');
const { generateQRCode, sendEmail } = require('../utils/helpers');

// @desc    Purchase ticket
// @route   POST /api/tickets/purchase
// @access  Private
const purchaseTicket = async (req, res, next) => {
  try {
    const { eventId, ticketType, attendeeInfo, paymentMethod } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if ticketing is enabled
    if (!event.ticketingSettings.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Ticketing is not enabled for this event'
      });
    }

    // Check if ticket sales are active
    if (!event.isTicketSalesActive) {
      return res.status(400).json({
        success: false,
        message: 'Ticket sales are not currently active'
      });
    }

    // Find ticket type
    const ticketTypeData = event.ticketingSettings.ticketTypes.find(
      type => type.name === ticketType
    );

    if (!ticketTypeData || !ticketTypeData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Ticket type not found or not available'
      });
    }

    // Check availability
    if (ticketTypeData.sold >= ticketTypeData.quantity) {
      return res.status(400).json({
        success: false,
        message: 'This ticket type is sold out'
      });
    }

    // Create ticket
    const ticket = await Ticket.create({
      event: eventId,
      ticketType: {
        name: ticketTypeData.name,
        price: ticketTypeData.price,
        currency: ticketTypeData.currency
      },
      purchaser: req.user._id,
      attendee: attendeeInfo,
      payment: {
        amount: ticketTypeData.price,
        currency: ticketTypeData.currency,
        paymentMethod,
        paymentGateway: 'stripe', // This would be determined by payment method
        paymentStatus: 'pending'
      }
    });

    // Update ticket type sold count
    ticketTypeData.sold += 1;
    await event.save();

    // Generate QR code
    const qrCodeData = ticket.generateQRCodeData();
    const qrCodeImage = await generateQRCode(qrCodeData, {
      width: 200,
      margin: 2
    });

    ticket.qrCode.data = qrCodeData;
    ticket.qrCode.image = qrCodeImage;
    await ticket.save();

    logger.logBusinessEvent('ticket_purchased', {
      ticketId: ticket._id,
      eventId,
      purchaserId: req.user._id,
      ticketType: ticketTypeData.name,
      amount: ticketTypeData.price
    });

    res.status(201).json({
      success: true,
      message: 'Ticket purchased successfully',
      data: {
        ticket: {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          event: eventId,
          ticketType: ticketTypeData.name,
          attendee: attendeeInfo,
          amount: ticketTypeData.price,
          currency: ticketTypeData.currency,
          qrCode: qrCodeImage,
          status: ticket.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('event', 'title eventDate location')
      .populate('purchaser', 'firstName lastName email');

    if (!ticket || ticket.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        ticket.purchaser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      data: {
        ticket
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tickets by user
// @route   GET /api/tickets/user
// @access  Private
const getTicketsByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
      purchaser: req.user._id,
      isDeleted: false 
    };

    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('event', 'title eventDate location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTickets: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate ticket
// @route   POST /api/tickets/:id/validate
// @access  Private/Organizer or Admin
const validateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qrCodeData, location, notes } = req.body;

    const ticket = await Ticket.findById(id)
      .populate('event');

    if (!ticket || ticket.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        ticket.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to validate this ticket'
      });
    }

    // Validate QR code
    if (qrCodeData && !ticket.validateQRCode(qrCodeData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    // Check if ticket is already used
    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      });
    }

    // Check if ticket is expired
    if (ticket.expiresAt && ticket.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has expired'
      });
    }

    // Mark ticket as used
    await ticket.markAsUsed(req.user._id, location, notes);

    logger.logBusinessEvent('ticket_validated', {
      ticketId: ticket._id,
      eventId: ticket.event._id,
      validatedBy: req.user._id,
      location,
      notes
    });

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        ticket: {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          validatedAt: ticket.validation.validatedAt,
          validatedBy: ticket.validation.validatedBy,
          validationLocation: ticket.validation.validationLocation
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send ticket via email
// @route   POST /api/tickets/:id/send
// @access  Private
const sendTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { method = 'email' } = req.body;

    const ticket = await Ticket.findById(id)
      .populate('event', 'title eventDate location')
      .populate('purchaser', 'firstName lastName email');

    if (!ticket || ticket.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        ticket.purchaser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send this ticket'
      });
    }

    // Send ticket
    await ticket.sendTicket(method);

    // Send email if method is email
    if (method === 'email') {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Your Event Ticket</h2>
            <p>Dear ${ticket.attendee.firstName} ${ticket.attendee.lastName},</p>
            <p>Here is your ticket for <strong>${ticket.event.title}</strong>:</p>
            
            <div style="border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Ticket Details</h3>
              <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
              <p><strong>Event:</strong> ${ticket.event.title}</p>
              <p><strong>Date:</strong> ${new Date(ticket.event.eventDate).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${ticket.event.location.venue || 'Virtual Event'}</p>
              <p><strong>Ticket Type:</strong> ${ticket.ticketType.name}</p>
              <p><strong>Attendee:</strong> ${ticket.attendee.firstName} ${ticket.attendee.lastName}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <img src="${ticket.qrCode.image}" alt="QR Code" style="max-width: 200px;" />
              <p style="font-size: 12px; color: #666;">Present this QR code at the event entrance</p>
            </div>
            
            <p>Please arrive at least 30 minutes before the event starts.</p>
            <p>If you have any questions, please contact the event organizer.</p>
            
            <p>Best regards,<br>Premium Event Platform</p>
        `;

        await sendEmail(
          ticket.attendee.email,
          `Your Ticket for ${ticket.event.title}`,
          emailHtml
        );
      } catch (emailError) {
        logger.logError(emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Ticket sent successfully',
      data: {
        ticket: {
          id: ticket._id,
          deliveryStatus: ticket.delivery.deliveryStatus,
          deliveredAt: ticket.delivery.deliveredAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats/:eventId
// @access  Public
const getTicketStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const stats = await Ticket.getTicketStats(eventId);

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel ticket
// @route   PUT /api/tickets/:id/cancel
// @access  Private
const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ticket = await Ticket.findById(id)
      .populate('event');

    if (!ticket || ticket.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        ticket.purchaser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this ticket'
      });
    }

    // Check if ticket can be cancelled
    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a used ticket'
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already cancelled'
      });
    }

    // Cancel ticket
    await ticket.cancel(reason);

    // Update event ticket count
    const event = await Event.findById(ticket.event._id);
    const ticketType = event.ticketingSettings.ticketTypes.find(
      type => type.name === ticket.ticketType.name
    );
    if (ticketType) {
      ticketType.sold = Math.max(0, ticketType.sold - 1);
      await event.save();
    }

    logger.logBusinessEvent('ticket_cancelled', {
      ticketId: ticket._id,
      eventId: ticket.event._id,
      cancelledBy: req.user._id,
      reason
    });

    res.json({
      success: true,
      message: 'Ticket cancelled successfully',
      data: {
        ticket: {
          id: ticket._id,
          status: ticket.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  purchaseTicket,
  getTicketById,
  getTicketsByUser,
  validateTicket,
  sendTicket,
  getTicketStats,
  cancelTicket
};
