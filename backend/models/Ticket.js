const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Ticket Information
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketType: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Purchaser Information
  purchaser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Attendee Information (can be different from purchaser)
  attendee: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String
  },
  
  // Payment Information
  payment: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'mobile_money', 'cash'],
      required: true
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'paystack', 'hubtel', 'manual'],
      required: true
    },
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  
  // Ticket Status
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled', 'expired', 'refunded'],
    default: 'active'
  },
  
  // QR Code Information
  qrCode: {
    data: String,
    image: String
  },
  
  // Validation Information
  validation: {
    isValid: {
      type: Boolean,
      default: true
    },
    validatedAt: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validationLocation: String,
    validationNotes: String
  },
  
  // Additional Information
  seatNumber: String,
  tableNumber: String,
  specialRequirements: String,
  dietaryRestrictions: String,
  
  // Delivery Information
  delivery: {
    method: {
      type: String,
      enum: ['email', 'sms', 'pickup', 'postal'],
      default: 'email'
    },
    deliveredAt: Date,
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    deliveryNotes: String
  },
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  expiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ event: 1 });
ticketSchema.index({ purchaser: 1 });
ticketSchema.index({ 'attendee.email': 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ 'payment.paymentStatus': 1 });
ticketSchema.index({ createdAt: -1 });

// Virtual for full attendee name
ticketSchema.virtual('attendeeFullName').get(function() {
  return `${this.attendee.firstName} ${this.attendee.lastName}`;
});

// Virtual for ticket validity
ticketSchema.virtual('isValid').get(function() {
  return this.status === 'active' && 
         this.payment.paymentStatus === 'completed' &&
         (!this.expiresAt || this.expiresAt > new Date());
});

// Method to generate QR code data
ticketSchema.methods.generateQRCodeData = function() {
  const qrData = {
    ticketNumber: this.ticketNumber,
    eventId: this.event,
    attendeeEmail: this.attendee.email,
    timestamp: this.createdAt,
    signature: this.generateSignature()
  };
  
  return JSON.stringify(qrData);
};

// Method to generate signature for QR code
ticketSchema.methods.generateSignature = function() {
  const crypto = require('crypto');
  const data = `${this.ticketNumber}${this.event}${this.attendee.email}`;
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('hex');
};

// Method to validate QR code
ticketSchema.methods.validateQRCode = function(qrData) {
  try {
    const data = JSON.parse(qrData);
    
    // Check if ticket number matches
    if (data.ticketNumber !== this.ticketNumber) {
      return false;
    }
    
    // Check if event ID matches
    if (data.eventId !== this.event.toString()) {
      return false;
    }
    
    // Check if attendee email matches
    if (data.attendeeEmail !== this.attendee.email) {
      return false;
    }
    
    // Verify signature
    const expectedSignature = this.generateSignature();
    if (data.signature !== expectedSignature) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Method to mark as used
ticketSchema.methods.markAsUsed = function(validatedBy, location, notes) {
  this.status = 'used';
  this.validation.isValid = true;
  this.validation.validatedAt = new Date();
  this.validation.validatedBy = validatedBy;
  this.validation.validationLocation = location;
  this.validation.validationNotes = notes;
  
  return this.save();
};

// Method to cancel ticket
ticketSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  return this.save();
};

// Method to refund ticket
ticketSchema.methods.refund = function(amount, reason) {
  this.status = 'refunded';
  this.payment.paymentStatus = 'refunded';
  this.payment.refundedAt = new Date();
  this.payment.refundAmount = amount || this.payment.amount;
  this.payment.refundReason = reason;
  
  return this.save();
};

// Method to send ticket
ticketSchema.methods.sendTicket = async function(method = 'email') {
  const nodemailer = require('nodemailer');
  
  this.delivery.method = method;
  this.delivery.deliveryStatus = 'sent';
  this.delivery.deliveredAt = new Date();
  
  // Here you would implement the actual sending logic
  // For email, you might use nodemailer
  // For SMS, you might use Twilio
  
  return this.save();
};

// Static method to find tickets by event
ticketSchema.statics.findByEvent = function(eventId) {
  return this.find({ 
    event: eventId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find tickets by purchaser
ticketSchema.statics.findByPurchaser = function(purchaserId) {
  return this.find({ 
    purchaser: purchaserId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find active tickets
ticketSchema.statics.findActiveTickets = function() {
  return this.find({ 
    status: 'active',
    'payment.paymentStatus': 'completed',
    isDeleted: false
  });
};

// Static method to generate ticket number
ticketSchema.statics.generateTicketNumber = function() {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Static method to get ticket statistics
ticketSchema.statics.getTicketStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: {
        event: mongoose.Types.ObjectId(eventId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        totalRevenue: { $sum: '$payment.amount' },
        completedPayments: {
          $sum: {
            $cond: [{ $eq: ['$payment.paymentStatus', 'completed'] }, 1, 0]
          }
        },
        pendingPayments: {
          $sum: {
            $cond: [{ $eq: ['$payment.paymentStatus', 'pending'] }, 1, 0]
          }
        },
        usedTickets: {
          $sum: {
            $cond: [{ $eq: ['$status', 'used'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalTickets: 0,
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    usedTickets: 0
  };
};

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', function(next) {
  if (this.isNew && !this.ticketNumber) {
    this.ticketNumber = mongoose.model('Ticket').generateTicketNumber();
  }
  
  // Generate QR code data
  if (this.isNew) {
    this.qrCode.data = this.generateQRCodeData();
  }
  
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
