const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Nominee name is required'],
    trim: true,
    maxlength: [200, 'Nominee name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Nominee description cannot exceed 1000 characters']
  },
  
  // References
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
  
  // Nominee Details
  type: {
    type: String,
    enum: ['individual', 'organization', 'team', 'product', 'service'],
    default: 'individual'
  },
  
  // Contact Information
  contact: {
    email: String,
    phone: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    }
  },
  
  // Media
  logo: String,
  image: String,
  gallery: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Additional Information
  achievements: [{
    title: String,
    description: String,
    date: Date,
    organization: String
  }],
  
  biography: {
    type: String,
    maxlength: [2000, 'Biography cannot exceed 2000 characters']
  },
  
  // Application Information
  applicationMethod: {
    type: String,
    enum: ['manual', 'self-application', 'invitation'],
    default: 'manual'
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'approved'
  },
  
  // Voting Statistics
  voteCount: {
    type: Number,
    default: 0
  },
  uniqueVoters: {
    type: Number,
    default: 0
  },
  
  // Position in Category
  position: {
    type: Number,
    default: 0
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // Additional Data
  customFields: [{
    fieldName: String,
    fieldValue: String,
    fieldType: {
      type: String,
      enum: ['text', 'number', 'date', 'url', 'email']
    }
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
nomineeSchema.index({ category: 1 });
nomineeSchema.index({ event: 1 });
nomineeSchema.index({ status: 1 });
nomineeSchema.index({ voteCount: -1 });
nomineeSchema.index({ createdAt: -1 });

// Virtual for total votes percentage
nomineeSchema.virtual('votePercentage').get(function() {
  // This will be calculated dynamically based on category total votes
  return 0;
});

// Virtual for ranking position
nomineeSchema.virtual('ranking').get(function() {
  return this.position;
});

// Method to increment vote count
nomineeSchema.methods.incrementVoteCount = function() {
  this.voteCount += 1;
  return this.save();
};

// Method to decrement vote count
nomineeSchema.methods.decrementVoteCount = function() {
  if (this.voteCount > 0) {
    this.voteCount -= 1;
  }
  return this.save();
};

// Method to calculate vote percentage
nomineeSchema.methods.calculateVotePercentage = function(totalCategoryVotes) {
  if (totalCategoryVotes === 0) return 0;
  return Math.round((this.voteCount / totalCategoryVotes) * 10000) / 100;
};

// Method to update position
nomineeSchema.methods.updatePosition = async function() {
  const Nominee = mongoose.model('Nominee');
  
  const nominees = await Nominee.find({ 
    category: this.category,
    isDeleted: false,
    status: 'approved'
  }).sort({ voteCount: -1 });
  
  const position = nominees.findIndex(nominee => nominee._id.toString() === this._id.toString()) + 1;
  this.position = position;
  
  return this.save();
};

// Method to get nominee statistics
nomineeSchema.methods.getStatistics = async function() {
  const Vote = mongoose.model('Vote');
  
  const uniqueVoters = await Vote.distinct('voter', {
    nominee: this._id
  });
  
  this.uniqueVoters = uniqueVoters.length;
  return {
    totalVotes: this.voteCount,
    uniqueVoters: this.uniqueVoters,
    position: this.position
  };
};

// Method to verify nominee
nomineeSchema.methods.verify = function(verifiedBy) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  return this.save();
};

// Method to approve nominee
nomineeSchema.methods.approve = function() {
  this.status = 'approved';
  return this.save();
};

// Method to reject nominee
nomineeSchema.methods.reject = function() {
  this.status = 'rejected';
  return this.save();
};

// Method to withdraw nominee
nomineeSchema.methods.withdraw = function() {
  this.status = 'withdrawn';
  return this.save();
};

// Static method to find nominees by category
nomineeSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId,
    isDeleted: false,
    status: 'approved'
  }).sort({ voteCount: -1 });
};

// Static method to find nominees by event
nomineeSchema.statics.findByEvent = function(eventId) {
  return this.find({ 
    event: eventId,
    isDeleted: false,
    status: 'approved'
  }).sort({ voteCount: -1 });
};

// Static method to find top nominees
nomineeSchema.statics.findTopNominees = function(categoryId, limit = 10) {
  return this.find({ 
    category: categoryId,
    isDeleted: false,
    status: 'approved'
  }).sort({ voteCount: -1 }).limit(limit);
};

// Static method to find pending nominees
nomineeSchema.statics.findPendingNominees = function() {
  return this.find({ 
    status: 'pending',
    isDeleted: false
  });
};

// Pre-save middleware to update last modified
nomineeSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Post-save middleware to update category nominee count
nomineeSchema.post('save', async function() {
  const Category = mongoose.model('Category');
  await Category.findByIdAndUpdate(this.category, {
    $addToSet: { nominees: this._id }
  });
});

module.exports = mongoose.model('Nominee', nomineeSchema);
