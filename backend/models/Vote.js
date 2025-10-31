const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  // Vote Information
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nominee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nominee',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Vote Details
  voteWeight: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 10
  },
  
  // Voting Method
  votingMethod: {
    type: String,
    enum: ['web', 'mobile', 'api', 'admin'],
    default: 'web'
  },
  
  // Device and Location Information
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown']
    },
    browser: String,
    os: String
  },
  
  // Location Information (if available)
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms', 'none'],
    default: 'none'
  },
  
  // Fraud Prevention
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  fraudFlags: [{
    type: String,
    enum: ['duplicate_ip', 'rapid_voting', 'suspicious_pattern', 'bot_detected']
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'flagged', 'invalidated', 'pending'],
    default: 'active'
  },
  
  // Additional Data
  metadata: {
    sessionId: String,
    referrer: String,
    campaign: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },
  
  // Timestamps
  votedAt: {
    type: Date,
    default: Date.now
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

// Compound indexes for better performance
voteSchema.index({ voter: 1, category: 1 });
voteSchema.index({ nominee: 1 });
voteSchema.index({ event: 1 });
voteSchema.index({ votedAt: -1 });
voteSchema.index({ 'deviceInfo.ipAddress': 1 });
voteSchema.index({ status: 1 });

// Virtual for vote validity
voteSchema.virtual('isValid').get(function() {
  return this.status === 'active' && !this.isDeleted;
});

// Method to calculate fraud score
voteSchema.methods.calculateFraudScore = async function() {
  let score = 0;
  const flags = [];
  
  // Check for duplicate IP votes in same category
  const Vote = mongoose.model('Vote');
  const duplicateIpVotes = await Vote.countDocuments({
    'deviceInfo.ipAddress': this.deviceInfo.ipAddress,
    category: this.category,
    votedAt: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    },
    _id: { $ne: this._id }
  });
  
  if (duplicateIpVotes > 5) {
    score += 30;
    flags.push('duplicate_ip');
  }
  
  // Check for rapid voting
  const rapidVotes = await Vote.countDocuments({
    voter: this.voter,
    votedAt: {
      $gte: new Date(Date.now() - 60 * 1000) // Last minute
    },
    _id: { $ne: this._id }
  });
  
  if (rapidVotes > 3) {
    score += 25;
    flags.push('rapid_voting');
  }
  
  // Check for suspicious patterns
  if (this.deviceInfo.userAgent && this.deviceInfo.userAgent.length < 20) {
    score += 20;
    flags.push('suspicious_pattern');
  }
  
  // Bot detection (simple heuristic)
  if (this.deviceInfo.userAgent && 
      (this.deviceInfo.userAgent.includes('bot') || 
       this.deviceInfo.userAgent.includes('crawler'))) {
    score += 40;
    flags.push('bot_detected');
  }
  
  this.fraudScore = Math.min(score, 100);
  this.fraudFlags = flags;
  
  // Update status based on fraud score
  if (this.fraudScore > 70) {
    this.status = 'flagged';
  }
  
  return {
    score: this.fraudScore,
    flags: this.fraudFlags
  };
};

// Method to validate vote
voteSchema.methods.validateVote = async function() {
  const Event = mongoose.model('Event');
  const Category = mongoose.model('Category');
  
  // Check if event is active
  const event = await Event.findById(this.event);
  if (!event || !event.isActive) {
    this.status = 'invalidated';
    return false;
  }
  
  // Check if voting is active
  if (!event.isVotingActive) {
    this.status = 'invalidated';
    return false;
  }
  
  // Check if category is active
  const category = await Category.findById(this.category);
  if (!category || !category.settings.isActive) {
    this.status = 'invalidated';
    return false;
  }
  
  // Check voting limits
  if (!event.votingSettings.allowMultipleVotes) {
    const existingVote = await mongoose.model('Vote').findOne({
      voter: this.voter,
      category: this.category,
      status: 'active',
      _id: { $ne: this._id }
    });
    
    if (existingVote) {
      this.status = 'invalidated';
      return false;
    }
  }
  
  return true;
};

// Method to process vote
voteSchema.methods.processVote = async function() {
  const isValid = await this.validateVote();
  
  if (!isValid) {
    return false;
  }
  
  // Calculate fraud score
  await this.calculateFraudScore();
  
  // Update nominee vote count if vote is valid
  if (this.status === 'active') {
    const Nominee = mongoose.model('Nominee');
    await Nominee.findByIdAndUpdate(this.nominee, {
      $inc: { voteCount: this.voteWeight }
    });
    
    // Update nominee position
    const nominee = await Nominee.findById(this.nominee);
    await nominee.updatePosition();
  }
  
  return this.status === 'active';
};

// Static method to find votes by voter
voteSchema.statics.findByVoter = function(voterId) {
  return this.find({ 
    voter: voterId,
    isDeleted: false
  }).sort({ votedAt: -1 });
};

// Static method to find votes by category
voteSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId,
    isDeleted: false,
    status: 'active'
  }).sort({ votedAt: -1 });
};

// Static method to find votes by event
voteSchema.statics.findByEvent = function(eventId) {
  return this.find({ 
    event: eventId,
    isDeleted: false,
    status: 'active'
  }).sort({ votedAt: -1 });
};

// Static method to get voting statistics
voteSchema.statics.getVotingStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: {
        event: mongoose.Types.ObjectId(eventId),
        status: 'active',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: '$voteWeight' },
        uniqueVoters: { $addToSet: '$voter' },
        totalVotingSessions: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        totalVotes: 1,
        uniqueVoters: { $size: '$uniqueVoters' },
        totalVotingSessions: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalVotes: 0,
    uniqueVoters: 0,
    totalVotingSessions: 0
  };
};

// Static method to find flagged votes
voteSchema.statics.findFlaggedVotes = function() {
  return this.find({ 
    status: 'flagged',
    isDeleted: false
  }).sort({ votedAt: -1 });
};

// Pre-save middleware to set default values
voteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.votedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Vote', voteSchema);
