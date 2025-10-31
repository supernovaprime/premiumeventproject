const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Category description cannot exceed 500 characters']
  },
  
  // Event Reference
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Category Settings
  settings: {
    allowMultipleWinners: {
      type: Boolean,
      default: false
    },
    maxWinners: {
      type: Number,
      default: 1,
      min: 1
    },
    votingWeight: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Category Media
  icon: String,
  image: String,
  color: {
    type: String,
    default: '#3B82F6'
  },
  
  // Nominees
  nominees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nominee'
  }],
  
  // Voting Statistics
  votingStats: {
    totalVotes: {
      type: Number,
      default: 0
    },
    uniqueVoters: {
      type: Number,
      default: 0
    },
    averageVotesPerNominee: {
      type: Number,
      default: 0
    }
  },
  
  // Winners
  winners: [{
    nominee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nominee'
    },
    position: {
      type: Number,
      required: true
    },
    votes: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    announcedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Results Settings
  resultsSettings: {
    showResults: {
      type: Boolean,
      default: true
    },
    showVoteCounts: {
      type: Boolean,
      default: true
    },
    showPercentages: {
      type: Boolean,
      default: true
    },
    announceWinners: {
      type: Boolean,
      default: true
    },
    announcementDate: Date
  },
  
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
categorySchema.index({ event: 1 });
categorySchema.index({ 'settings.displayOrder': 1 });
categorySchema.index({ 'settings.isActive': 1 });
categorySchema.index({ createdAt: -1 });

// Virtual for nominee count
categorySchema.virtual('nomineeCount').get(function() {
  return this.nominees.length;
});

// Virtual for winner count
categorySchema.virtual('winnerCount').get(function() {
  return this.winners.length;
});

// Virtual for voting completion status
categorySchema.virtual('isVotingComplete').get(function() {
  return this.winners.length > 0;
});

// Method to calculate voting statistics
categorySchema.methods.calculateVotingStats = async function() {
  const Nominee = mongoose.model('Nominee');
  
  const nominees = await Nominee.find({ 
    category: this._id,
    isDeleted: false 
  });
  
  const totalVotes = nominees.reduce((total, nominee) => total + nominee.voteCount, 0);
  const uniqueVoters = await mongoose.model('Vote').distinct('voter', {
    category: this._id
  });
  
  this.votingStats.totalVotes = totalVotes;
  this.votingStats.uniqueVoters = uniqueVoters.length;
  this.votingStats.averageVotesPerNominee = nominees.length > 0 ? totalVotes / nominees.length : 0;
  
  return this.votingStats;
};

// Method to determine winners
categorySchema.methods.determineWinners = async function() {
  const Nominee = mongoose.model('Nominee');
  
  const nominees = await Nominee.find({ 
    category: this._id,
    isDeleted: false 
  }).sort({ voteCount: -1 });
  
  const maxWinners = this.settings.maxWinners;
  const winners = [];
  
  for (let i = 0; i < Math.min(maxWinners, nominees.length); i++) {
    const nominee = nominees[i];
    const percentage = this.votingStats.totalVotes > 0 
      ? (nominee.voteCount / this.votingStats.totalVotes) * 100 
      : 0;
    
    winners.push({
      nominee: nominee._id,
      position: i + 1,
      votes: nominee.voteCount,
      percentage: Math.round(percentage * 100) / 100,
      announcedAt: new Date()
    });
  }
  
  this.winners = winners;
  return winners;
};

// Method to get category results
categorySchema.methods.getResults = async function() {
  const Nominee = mongoose.model('Nominee');
  
  const nominees = await Nominee.find({ 
    category: this._id,
    isDeleted: false 
  }).sort({ voteCount: -1 });
  
  const results = nominees.map(nominee => ({
    nominee: nominee.toObject(),
    position: nominees.indexOf(nominee) + 1,
    votes: nominee.voteCount,
    percentage: this.votingStats.totalVotes > 0 
      ? Math.round((nominee.voteCount / this.votingStats.totalVotes) * 10000) / 100
      : 0
  }));
  
  return results;
};

// Method to check if user can vote in this category
categorySchema.methods.canUserVote = function(userId) {
  if (!this.settings.isActive) return false;
  
  // Additional checks can be added here based on event voting settings
  return true;
};

// Static method to find categories by event
categorySchema.statics.findByEvent = function(eventId) {
  return this.find({ 
    event: eventId,
    isDeleted: false,
    'settings.isActive': true
  }).sort({ 'settings.displayOrder': 1 });
};

// Static method to find active categories
categorySchema.statics.findActiveCategories = function() {
  return this.find({ 
    'settings.isActive': true,
    isDeleted: false
  });
};

// Pre-save middleware to update last modified
categorySchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
