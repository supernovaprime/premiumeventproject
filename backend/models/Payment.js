const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment Information
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  
  // Payment Method
  method: {
    type: String,
    enum: ['card', 'bank_transfer', 'mobile_money', 'cash', 'paypal', 'stripe', 'paystack', 'hubtel'],
    required: true
  },
  
  // Payment Gateway
  gateway: {
    type: String,
    enum: ['stripe', 'paystack', 'hubtel', 'manual'],
    required: true
  },
  
  // Transaction Information
  transactionId: String,
  gatewayTransactionId: String,
  reference: String,
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Payment Purpose
  purpose: {
    type: String,
    enum: ['ticket_purchase', 'shop_order', 'event_registration', 'affiliate_payout', 'commission', 'refund'],
    required: true
  },
  
  // Related Entities
  relatedEntity: {
    type: {
      type: String,
      enum: ['ticket', 'order', 'event', 'affiliate', 'user'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  
  // Payer Information
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Recipient Information (for payouts)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment Details
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    accountNumber: String,
    mobileProvider: String,
    mobileNumber: String
  },
  
  // Fees and Charges
  fees: {
    gatewayFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  
  // Net Amount
  netAmount: {
    type: Number,
    required: true
  },
  
  // Refund Information
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: String,
    processedAt: {
      type: Date,
      default: Date.now
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gatewayRefundId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  
  // Payment Timeline
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  }],
  
  // Webhook Information
  webhook: {
    received: {
      type: Boolean,
      default: false
    },
    processed: {
      type: Boolean,
      default: false
    },
    webhookData: mongoose.Schema.Types.Mixed,
    processedAt: Date
  },
  
  // Additional Information
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Failure Information
  failure: {
    code: String,
    message: String,
    reason: String,
    gatewayError: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ payer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ purpose: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds.reduce((total, refund) => {
    return total + (refund.status === 'completed' ? refund.amount : 0);
  }, 0);
});

// Virtual for remaining refundable amount
paymentSchema.virtual('refundableAmount').get(function() {
  return this.netAmount - this.totalRefunded;
});

// Virtual for payment success
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Method to update status
paymentSchema.methods.updateStatus = function(newStatus, message, gatewayResponse) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to timeline
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    message: message || `Status changed from ${oldStatus} to ${newStatus}`,
    gatewayResponse: gatewayResponse
  });
  
  // Set completion timestamp
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'failed') {
    this.failedAt = new Date();
  }
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason, processedBy) {
  if (amount > this.refundableAmount) {
    throw new Error('Refund amount exceeds refundable amount');
  }
  
  this.refunds.push({
    amount,
    reason,
    processedBy,
    processedAt: new Date(),
    status: 'pending'
  });
  
  // Update payment status
  const totalRefunded = this.totalRefunded + amount;
  if (totalRefunded >= this.netAmount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Method to calculate fees
paymentSchema.methods.calculateFees = function() {
  let gatewayFee = 0;
  let processingFee = 0;
  let platformFee = 0;
  
  // Calculate fees based on gateway and amount
  switch (this.gateway) {
    case 'stripe':
      gatewayFee = this.amount * 0.029 + 0.30; // 2.9% + $0.30
      break;
    case 'paystack':
      gatewayFee = this.amount * 0.015; // 1.5%
      break;
    case 'hubtel':
      gatewayFee = this.amount * 0.02; // 2%
      break;
    default:
      gatewayFee = 0;
  }
  
  // Platform fee (configurable)
  platformFee = this.amount * 0.05; // 5% platform fee
  
  this.fees.gatewayFee = Math.round(gatewayFee * 100) / 100;
  this.fees.processingFee = Math.round(processingFee * 100) / 100;
  this.fees.platformFee = Math.round(platformFee * 100) / 100;
  this.fees.totalFees = this.fees.gatewayFee + this.fees.processingFee + this.fees.platformFee;
  
  this.netAmount = this.amount - this.fees.totalFees;
  
  return this.fees;
};

// Method to process webhook
paymentSchema.methods.processWebhook = function(webhookData) {
  this.webhook.received = true;
  this.webhook.webhookData = webhookData;
  this.webhook.processedAt = new Date();
  
  // Process webhook data based on gateway
  switch (this.gateway) {
    case 'stripe':
      this.processStripeWebhook(webhookData);
      break;
    case 'paystack':
      this.processPaystackWebhook(webhookData);
      break;
    case 'hubtel':
      this.processHubtelWebhook(webhookData);
      break;
  }
  
  return this.save();
};

// Method to process Stripe webhook
paymentSchema.methods.processStripeWebhook = function(webhookData) {
  const { type, data } = webhookData;
  
  switch (type) {
    case 'payment_intent.succeeded':
      this.updateStatus('completed', 'Payment completed via Stripe', webhookData);
      break;
    case 'payment_intent.payment_failed':
      this.updateStatus('failed', 'Payment failed via Stripe', webhookData);
      break;
    case 'charge.dispute.created':
      // Handle dispute
      break;
  }
};

// Method to process Paystack webhook
paymentSchema.methods.processPaystackWebhook = function(webhookData) {
  const { event, data } = webhookData;
  
  switch (event) {
    case 'charge.success':
      this.updateStatus('completed', 'Payment completed via Paystack', webhookData);
      break;
    case 'charge.failed':
      this.updateStatus('failed', 'Payment failed via Paystack', webhookData);
      break;
  }
};

// Method to process Hubtel webhook
paymentSchema.methods.processHubtelWebhook = function(webhookData) {
  const { ResponseCode, ResponseText } = webhookData;
  
  if (ResponseCode === '0000') {
    this.updateStatus('completed', 'Payment completed via Hubtel', webhookData);
  } else {
    this.updateStatus('failed', `Payment failed: ${ResponseText}`, webhookData);
  }
};

// Static method to find payments by payer
paymentSchema.statics.findByPayer = function(payerId) {
  return this.find({ 
    payer: payerId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find payments by status
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ 
    status,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find pending payments
paymentSchema.statics.findPendingPayments = function() {
  return this.find({ 
    status: { $in: ['pending', 'processing'] },
    isDeleted: false
  }).sort({ createdAt: 1 });
};

// Static method to generate payment ID
paymentSchema.statics.generatePaymentId = function() {
  const prefix = 'PAY';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(period = 'month') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        netAmount: { $sum: '$netAmount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalFees: 0,
    netAmount: 0,
    completedPayments: 0,
    failedPayments: 0,
    pendingPayments: 0
  };
};

// Pre-save middleware to generate payment ID
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = mongoose.model('Payment').generatePaymentId();
  }
  
  // Calculate fees
  this.calculateFees();
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
