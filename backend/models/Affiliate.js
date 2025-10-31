const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  // Affiliate Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Affiliate Code
  affiliateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Referral Information
  referrals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive'],
      default: 'pending'
    }
  }],
  
  // Commission Settings
  commission: {
    rate: {
      type: Number,
      default: 3, // Percentage
      min: 0,
      max: 50
    },
    minimumPayout: {
      type: Number,
      default: 50,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'mobile_money', 'paypal', 'check'],
      default: 'bank_transfer'
    }
  },
  
  // Financial Information
  earnings: {
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    paidEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Payment Information
  paymentDetails: {
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String
    },
    mobileMoney: {
      provider: String,
      accountNumber: String,
      accountName: String
    },
    paypal: {
      email: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  
  // Performance Metrics
  metrics: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    activeReferrals: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  
  // Status and Settings
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  
  // Approval Information
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    adminNotes: String
  },
  
  // Marketing Materials
  marketingMaterials: {
    bannerUrl: String,
    logoUrl: String,
    description: String,
    customLandingPage: String
  },
  
  // Tracking Information
  tracking: {
    clicks: {
      type: Number,
      default: 0
    },
    impressions: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    }
  },
  
  // Payout History
  payouts: [{
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentMethod: String,
    transactionId: String,
    notes: String
  }],
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
affiliateSchema.index({ user: 1 });
affiliateSchema.index({ affiliateCode: 1 });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ 'earnings.totalEarnings': -1 });
affiliateSchema.index({ createdAt: -1 });

// Virtual for referral link
affiliateSchema.virtual('referralLink').get(function() {
  return `${process.env.APP_URL}/ref/${this.affiliateCode}`;
});

// Virtual for available balance
affiliateSchema.virtual('availableBalance').get(function() {
  return this.earnings.totalEarnings - this.earnings.paidEarnings;
});

// Virtual for conversion rate
affiliateSchema.virtual('conversionRate').get(function() {
  if (this.tracking.clicks === 0) return 0;
  return (this.tracking.conversions / this.tracking.clicks) * 100;
});

// Method to add referral
affiliateSchema.methods.addReferral = function(userId) {
  const existingReferral = this.referrals.find(ref => 
    ref.user.toString() === userId.toString()
  );
  
  if (!existingReferral) {
    this.referrals.push({
      user: userId,
      referredAt: new Date(),
      status: 'pending'
    });
    
    this.metrics.totalReferrals += 1;
    this.metrics.lastActivity = new Date();
  }
  
  return this.save();
};

// Method to update referral status
affiliateSchema.methods.updateReferralStatus = function(userId, status) {
  const referral = this.referrals.find(ref => 
    ref.user.toString() === userId.toString()
  );
  
  if (referral) {
    referral.status = status;
    
    if (status === 'active') {
      this.metrics.activeReferrals += 1;
    } else if (status === 'inactive' && referral.status === 'active') {
      this.metrics.activeReferrals = Math.max(0, this.metrics.activeReferrals - 1);
    }
  }
  
  return this.save();
};

// Method to add earnings
affiliateSchema.methods.addEarnings = function(amount, source) {
  this.earnings.totalEarnings += amount;
  this.earnings.pendingEarnings += amount;
  this.metrics.lastActivity = new Date();
  
  return this.save();
};

// Method to request payout
affiliateSchema.methods.requestPayout = function(amount) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient balance for payout');
  }
  
  if (amount < this.commission.minimumPayout) {
    throw new Error(`Minimum payout amount is ${this.commission.minimumPayout}`);
  }
  
  this.payouts.push({
    amount,
    status: 'pending',
    requestedAt: new Date(),
    paymentMethod: this.commission.paymentMethod
  });
  
  this.earnings.pendingEarnings -= amount;
  
  return this.save();
};

// Method to process payout
affiliateSchema.methods.processPayout = function(payoutId, processedBy, transactionId, notes) {
  const payout = this.payouts.id(payoutId);
  
  if (!payout) {
    throw new Error('Payout not found');
  }
  
  payout.status = 'completed';
  payout.processedAt = new Date();
  payout.processedBy = processedBy;
  payout.transactionId = transactionId;
  payout.notes = notes;
  
  this.earnings.paidEarnings += payout.amount;
  
  return this.save();
};

// Method to track click
affiliateSchema.methods.trackClick = function() {
  this.tracking.clicks += 1;
  this.metrics.lastActivity = new Date();
  return this.save();
};

// Method to track conversion
affiliateSchema.methods.trackConversion = function(orderValue) {
  this.tracking.conversions += 1;
  this.metrics.lastActivity = new Date();
  
  // Calculate average order value
  const totalValue = this.metrics.averageOrderValue * (this.tracking.conversions - 1) + orderValue;
  this.metrics.averageOrderValue = totalValue / this.tracking.conversions;
  
  return this.save();
};

// Method to generate affiliate link
affiliateSchema.methods.generateAffiliateLink = function(eventId = null) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  let link = `${baseUrl}/ref/${this.affiliateCode}`;
  
  if (eventId) {
    link += `?event=${eventId}`;
  }
  
  return link;
};

// Method to get performance summary
affiliateSchema.methods.getPerformanceSummary = function() {
  return {
    totalReferrals: this.metrics.totalReferrals,
    activeReferrals: this.metrics.activeReferrals,
    totalEarnings: this.earnings.totalEarnings,
    paidEarnings: this.earnings.paidEarnings,
    pendingEarnings: this.earnings.pendingEarnings,
    availableBalance: this.availableBalance,
    conversionRate: this.conversionRate,
    averageOrderValue: this.metrics.averageOrderValue,
    clicks: this.tracking.clicks,
    conversions: this.tracking.conversions
  };
};

// Static method to find affiliate by code
affiliateSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    affiliateCode: code.toUpperCase(),
    status: 'active',
    isDeleted: false
  });
};

// Static method to find top affiliates
affiliateSchema.statics.findTopAffiliates = function(limit = 10) {
  return this.find({ 
    status: 'active',
    isDeleted: false
  }).sort({ 'earnings.totalEarnings': -1 }).limit(limit);
};

// Static method to find pending payouts
affiliateSchema.statics.findPendingPayouts = function() {
  return this.find({ 
    'payouts.status': 'pending',
    isDeleted: false
  });
};

// Static method to generate affiliate code
affiliateSchema.statics.generateAffiliateCode = function() {
  const prefix = 'AFF';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};

// Static method to get affiliate statistics
affiliateSchema.statics.getAffiliateStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: null,
        totalAffiliates: { $sum: 1 },
        activeAffiliates: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$earnings.totalEarnings' },
        totalPaidEarnings: { $sum: '$earnings.paidEarnings' },
        totalReferrals: { $sum: '$metrics.totalReferrals' },
        totalClicks: { $sum: '$tracking.clicks' },
        totalConversions: { $sum: '$tracking.conversions' }
      }
    }
  ]);
  
  return stats[0] || {
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalEarnings: 0,
    totalPaidEarnings: 0,
    totalReferrals: 0,
    totalClicks: 0,
    totalConversions: 0
  };
};

// Pre-save middleware to generate affiliate code
affiliateSchema.pre('save', function(next) {
  if (this.isNew && !this.affiliateCode) {
    this.affiliateCode = mongoose.model('Affiliate').generateAffiliateCode();
  }
  next();
});

// Pre-save middleware to update last modified
affiliateSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('Affiliate', affiliateSchema);
