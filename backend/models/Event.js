const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Basic Event Information
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Event description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  
  // Event Details
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  eventTime: {
    type: String,
    required: [true, 'Event time is required']
  },
  endDate: Date,
  endTime: String,
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Location Information
  location: {
    type: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical'
    },
    venue: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    virtualLink: String,
    virtualPlatform: String
  },
  
  // Organizer Information
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Event Media
  logo: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  gallery: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Sponsors
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    description: String,
    tier: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze'],
      default: 'bronze'
    }
  }],
  
  // Event Status and Settings
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  
  // Voting Settings
  votingSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    startDate: Date,
    endDate: Date,
    allowMultipleVotes: {
      type: Boolean,
      default: false
    },
    maxVotesPerUser: {
      type: Number,
      default: 1
    },
    requireRegistration: {
      type: Boolean,
      default: false
    },
    allowAnonymousVoting: {
      type: Boolean,
      default: true
    }
  },
  
  // Ticketing Settings
  ticketingSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    ticketTypes: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      price: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      sold: {
        type: Number,
        default: 0
      },
      salesStartDate: Date,
      salesEndDate: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    salesStartDate: Date,
    salesEndDate: Date
  },
  
  // Categories and Nominees
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Financial Information
  financial: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    commissionRate: {
      type: Number,
      default: 5 // Percentage
    },
    platformFee: {
      type: Number,
      default: 0
    },
    organizerEarnings: {
      type: Number,
      default: 0
    }
  },
  
  // SEO and Marketing
  seo: {
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  // Custom Branding
  branding: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
    accentColor: {
      type: String,
      default: '#F59E0B'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    },
    customCSS: String
  },
  
  // Analytics
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    socialShares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 }
    },
    trafficSources: {
      direct: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      referral: { type: Number, default: 0 }
    }
  },
  
  // Event Link
  eventLink: {
    type: String,
    unique: true,
    sparse: true
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
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ 'seo.slug': 1 });
eventSchema.index({ 'eventLink': 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ 'votingSettings.startDate': 1, 'votingSettings.endDate': 1 });

// Virtual for event status
eventSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.eventDate <= now && 
         (this.endDate ? this.endDate >= now : true);
});

// Virtual for voting status
eventSchema.virtual('isVotingActive').get(function() {
  if (!this.votingSettings.enabled) return false;
  
  const now = new Date();
  const startDate = this.votingSettings.startDate || this.createdAt;
  const endDate = this.votingSettings.endDate || this.eventDate;
  
  return now >= startDate && now <= endDate;
});

// Virtual for ticket sales status
eventSchema.virtual('isTicketSalesActive').get(function() {
  if (!this.ticketingSettings.enabled) return false;
  
  const now = new Date();
  const startDate = this.ticketingSettings.salesStartDate || this.createdAt;
  const endDate = this.ticketingSettings.salesEndDate || this.eventDate;
  
  return now >= startDate && now <= endDate;
});

// Virtual for total tickets sold
eventSchema.virtual('totalTicketsSold').get(function() {
  return this.ticketingSettings.ticketTypes.reduce((total, ticketType) => {
    return total + ticketType.sold;
  }, 0);
});

// Virtual for total tickets available
eventSchema.virtual('totalTicketsAvailable').get(function() {
  return this.ticketingSettings.ticketTypes.reduce((total, ticketType) => {
    return total + ticketType.quantity;
  }, 0);
});

// Pre-save middleware to generate slug
eventSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.seo.slug) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to generate event link
eventSchema.pre('save', function(next) {
  if (!this.eventLink) {
    const randomId = Math.random().toString(36).substring(2, 8);
    this.eventLink = `event-${randomId}`;
  }
  next();
});

// Method to calculate financial summary
eventSchema.methods.calculateFinancialSummary = function() {
  const totalRevenue = this.ticketingSettings.ticketTypes.reduce((total, ticketType) => {
    return total + (ticketType.price * ticketType.sold);
  }, 0);
  
  const platformFee = totalRevenue * (this.financial.commissionRate / 100);
  const organizerEarnings = totalRevenue - platformFee;
  
  this.financial.totalRevenue = totalRevenue;
  this.financial.platformFee = platformFee;
  this.financial.organizerEarnings = organizerEarnings;
  
  return {
    totalRevenue,
    platformFee,
    organizerEarnings,
    commissionRate: this.financial.commissionRate
  };
};

// Method to check if user can vote
eventSchema.methods.canUserVote = function(userId) {
  if (!this.votingSettings.enabled) return false;
  if (!this.isVotingActive) return false;
  
  // Additional checks can be added here based on voting settings
  return true;
};

// Method to get public event data
eventSchema.methods.getPublicData = function() {
  const eventObj = this.toObject();
  
  // Remove sensitive information
  delete eventObj.financial;
  delete eventObj.approval;
  delete eventObj.organizer;
  
  return eventObj;
};

// Static method to find active events
eventSchema.statics.findActiveEvents = function() {
  return this.find({ 
    status: 'active',
    isDeleted: false,
    eventDate: { $gte: new Date() }
  });
};

// Static method to find events by organizer
eventSchema.statics.findByOrganizer = function(organizerId) {
  return this.find({ 
    organizer: organizerId,
    isDeleted: false
  });
};

// Static method to find upcoming events
eventSchema.statics.findUpcomingEvents = function() {
  return this.find({ 
    status: 'active',
    isDeleted: false,
    eventDate: { $gte: new Date() }
  }).sort({ eventDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);
