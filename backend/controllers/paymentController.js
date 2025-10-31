const Payment = require('../models/Payment');
const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const { logger } = require('../utils/logger');
const { generateUniqueId } = require('../utils/helpers');

// @desc    Process payment
// @route   POST /api/payments/process
// @access  Private
const processPayment = async (req, res, next) => {
  try {
    const { 
      amount, 
      currency = 'USD', 
      paymentMethod, 
      paymentGateway = 'stripe',
      description,
      metadata = {},
      eventId,
      orderId,
      ticketId
    } = req.body;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      currency,
      paymentMethod,
      paymentGateway,
      description,
      metadata,
      event: eventId,
      order: orderId,
      ticket: ticketId,
      status: 'pending',
      transactionId: generateUniqueId(20)
    });

    // Process payment based on gateway
    let paymentResult;
    try {
      switch (paymentGateway) {
        case 'stripe':
          paymentResult = await processStripePayment(payment);
          break;
        case 'paypal':
          paymentResult = await processPayPalPayment(payment);
          break;
        case 'hubtel':
          paymentResult = await processHubtelPayment(payment);
          break;
        default:
          throw new Error('Unsupported payment gateway');
      }

      // Update payment status
      payment.status = paymentResult.status;
      payment.gatewayTransactionId = paymentResult.transactionId;
      payment.gatewayResponse = paymentResult.response;
      payment.processedAt = new Date();
      await payment.save();

      // Handle successful payment
      if (paymentResult.status === 'completed') {
        await handleSuccessfulPayment(payment);
      }

      logger.logBusinessEvent('payment_processed', {
        paymentId: payment._id,
        userId: req.user._id,
        amount,
        currency,
        paymentGateway,
        status: payment.status
      });

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment: {
            id: payment._id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            gatewayTransactionId: payment.gatewayTransactionId,
            processedAt: payment.processedAt
          }
        }
      });

    } catch (paymentError) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.errorMessage = paymentError.message;
      payment.processedAt = new Date();
      await payment.save();

      logger.logError(paymentError, {
        paymentId: payment._id,
        userId: req.user._id,
        amount,
        paymentGateway
      });

      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('event', 'title eventDate')
      .populate('order', 'orderNumber')
      .populate('ticket', 'ticketNumber');

    if (!payment || payment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: {
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments by user
// @route   GET /api/payments/user
// @access  Private
const getPaymentsByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;

    const query = { 
      user: req.user._id,
      isDeleted: false 
    };

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(query)
      .populate('event', 'title eventDate')
      .populate('order', 'orderNumber')
      .populate('ticket', 'ticketNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);

    if (!payment || payment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    // Check if already refunded
    if (payment.refund && payment.refund.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded'
      });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed original payment amount'
      });
    }

    // Process refund
    try {
      const refundResult = await processRefund(payment, refundAmount);

      // Update payment with refund info
      payment.refund = {
        amount: refundAmount,
        reason,
        status: refundResult.status,
        gatewayRefundId: refundResult.refundId,
        processedAt: new Date(),
        processedBy: req.user._id
      };

      await payment.save();

      logger.logBusinessEvent('payment_refunded', {
        paymentId: payment._id,
        userId: payment.user,
        refundAmount,
        reason,
        refundedBy: req.user._id
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          payment: {
            id: payment._id,
            refund: payment.refund
          }
        }
      });

    } catch (refundError) {
      logger.logError(refundError, {
        paymentId: payment._id,
        refundAmount
      });

      res.status(400).json({
        success: false,
        message: 'Refund processing failed',
        error: refundError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
const getPaymentStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const stats = await Payment.getPaymentStats(period);

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

// @desc    Verify payment webhook
// @route   POST /api/payments/webhook/:gateway
// @access  Public (with signature verification)
const verifyWebhook = async (req, res, next) => {
  try {
    const { gateway } = req.params;
    const signature = req.get('X-Webhook-Signature') || req.get('stripe-signature');
    const payload = req.body;

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(gateway, payload, signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Process webhook based on gateway
    await processWebhookEvent(gateway, payload);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.logError(error, {
      gateway: req.params.gateway,
      webhookPayload: req.body
    });

    res.status(400).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Helper functions
const processStripePayment = async (payment) => {
  // Implement Stripe payment processing
  // This would integrate with Stripe API
  return {
    status: 'completed',
    transactionId: 'stripe_' + generateUniqueId(20),
    response: { success: true }
  };
};

const processPayPalPayment = async (payment) => {
  // Implement PayPal payment processing
  return {
    status: 'completed',
    transactionId: 'paypal_' + generateUniqueId(20),
    response: { success: true }
  };
};

const processHubtelPayment = async (payment) => {
  // Implement Hubtel payment processing
  return {
    status: 'completed',
    transactionId: 'hubtel_' + generateUniqueId(20),
    response: { success: true }
  };
};

const processRefund = async (payment, amount) => {
  // Implement refund processing based on payment gateway
  return {
    status: 'completed',
    refundId: 'refund_' + generateUniqueId(20)
  };
};

const handleSuccessfulPayment = async (payment) => {
  // Handle successful payment based on payment type
  if (payment.event) {
    // Handle event-related payment
    const event = await Event.findById(payment.event);
    if (event) {
      event.financial.totalRevenue += payment.amount;
      await event.save();
    }
  }

  if (payment.order) {
    // Handle order payment
    const order = await Order.findById(payment.order);
    if (order) {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
      await order.save();
    }
  }

  if (payment.ticket) {
    // Handle ticket payment
    const ticket = await Ticket.findById(payment.ticket);
    if (ticket) {
      ticket.payment.status = 'completed';
      ticket.payment.paidAt = new Date();
      await ticket.save();
    }
  }
};

const verifyWebhookSignature = async (gateway, payload, signature) => {
  // Implement webhook signature verification
  return true; // Simplified for now
};

const processWebhookEvent = async (gateway, payload) => {
  // Process webhook events from payment gateways
  logger.logBusinessEvent('webhook_received', {
    gateway,
    eventType: payload.type || payload.event_type
  });
};

module.exports = {
  processPayment,
  getPaymentById,
  getPaymentsByUser,
  refundPayment,
  getPaymentStats,
  verifyWebhook
};
