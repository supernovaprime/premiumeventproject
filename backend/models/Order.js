const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Information
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    customization: {
      engraving: String,
      customFields: [{
        fieldName: String,
        fieldValue: String
      }]
    },
    notes: String
  }],
  
  // Pricing Information
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Shipping Information
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    address: {
      firstName: String,
      lastName: String,
      company: String,
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      phone: String
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['card', 'bank_transfer', 'mobile_money', 'cash', 'paypal'],
      required: true
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paystack', 'hubtel', 'manual'],
      required: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Processing Information
  processing: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    productionStartDate: Date,
    productionEndDate: Date,
    qualityCheckDate: Date,
    packagingDate: Date,
    shippingDate: Date,
    notes: String
  },
  
  // Timeline
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Customer Communication
  communication: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'phone', 'note'],
      required: true
    },
    subject: String,
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Additional Information
  notes: String,
  specialInstructions: String,
  giftMessage: String,
  giftWrap: {
    type: Boolean,
    default: false
  },
  
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for customer full name
orderSchema.virtual('customerFullName').get(function() {
  return `${this.shipping.address.firstName} ${this.shipping.address.lastName}`;
});

// Virtual for order completion status
orderSchema.virtual('isCompleted').get(function() {
  return this.status === 'delivered' && this.payment.status === 'completed';
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  const subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.pricing.subtotal = subtotal;
  this.pricing.totalAmount = subtotal + this.pricing.shippingCost + this.pricing.taxAmount - this.pricing.discountAmount;
  
  return this.pricing;
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, notes, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to timeline
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    updatedBy: updatedBy
  });
  
  // Set specific dates based on status
  switch (newStatus) {
    case 'processing':
      this.processing.productionStartDate = new Date();
      break;
    case 'shipped':
      this.processing.shippingDate = new Date();
      break;
    case 'delivered':
      this.shipping.actualDelivery = new Date();
      break;
  }
  
  return this.save();
};

// Method to add communication
orderSchema.methods.addCommunication = function(type, subject, message, sentBy) {
  this.communication.push({
    type,
    subject,
    message,
    sentAt: new Date(),
    sentBy
  });
  
  return this.save();
};

// Method to process payment
orderSchema.methods.processPayment = function(transactionId, gateway) {
  this.payment.transactionId = transactionId;
  this.payment.gateway = gateway;
  this.payment.status = 'completed';
  this.payment.paidAt = new Date();
  
  return this.save();
};

// Method to refund order
orderSchema.methods.refund = function(amount, reason) {
  this.payment.status = 'refunded';
  this.payment.refundedAt = new Date();
  this.payment.refundAmount = amount || this.pricing.totalAmount;
  this.payment.refundReason = reason;
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.payment.status = 'cancelled';
  
  this.timeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    notes: reason || 'Order cancelled',
    updatedBy: null
  });
  
  return this.save();
};

// Method to generate tracking information
orderSchema.methods.generateTrackingInfo = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    trackingNumber: this.shipping.trackingNumber,
    carrier: this.shipping.carrier,
    estimatedDelivery: this.shipping.estimatedDelivery,
    timeline: this.timeline
  };
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId) {
  return this.find({ 
    customer: customerId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ 
    status,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find pending orders
orderSchema.statics.findPendingOrders = function() {
  return this.find({ 
    status: { $in: ['pending', 'confirmed'] },
    isDeleted: false
  }).sort({ createdAt: 1 });
};

// Static method to generate order number
orderSchema.statics.generateOrderNumber = function() {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(period = 'month') {
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
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageOrderValue: { $avg: '$pricing.totalAmount' },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        pendingOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing']] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    pendingOrders: 0
  };
};

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = mongoose.model('Order').generateOrderNumber();
  }
  
  // Calculate totals
  this.calculateTotals();
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
