const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Product description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  
  // Product Details
  category: {
    type: String,
    enum: ['plaque', 'trophy', 'medal', 'certificate', 'banner', 'badge', 'other'],
    required: true
  },
  subcategory: String,
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  
  // Product Images
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Product Specifications
  specifications: {
    material: String,
    size: String,
    weight: String,
    color: String,
    finish: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch', 'mm'],
        default: 'cm'
      }
    }
  },
  
  // Customization Options
  customization: {
    allowCustomization: {
      type: Boolean,
      default: false
    },
    customFields: [{
      fieldName: String,
      fieldType: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'textarea']
      },
      options: [String], // For select fields
      required: Boolean,
      maxLength: Number
    }],
    engravingOptions: {
      available: Boolean,
      maxCharacters: Number,
      fonts: [String],
      positions: [String]
    }
  },
  
  // Shipping Information
  shipping: {
    weight: {
      type: Number,
      required: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'international'],
      default: 'standard'
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 7
    },
    freeShippingThreshold: Number
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
  
  // Product Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'discontinued'],
    default: 'active'
  },
  
  // Product Tags
  tags: [String],
  
  // Reviews and Ratings
  reviews: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Sales Information
  sales: {
    totalSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastSoldAt: Date
  },
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'seo.slug': 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || this.images[0] || null;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackInventory) return 'unlimited';
  if (this.inventory.quantity === 0) return 'out_of_stock';
  if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (!this.cost || this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost) * 100;
});

// Method to update inventory
productSchema.methods.updateInventory = function(quantity, operation = 'subtract') {
  if (!this.inventory.trackInventory) return this;
  
  if (operation === 'subtract') {
    this.inventory.quantity = Math.max(0, this.inventory.quantity - quantity);
  } else if (operation === 'add') {
    this.inventory.quantity += quantity;
  } else if (operation === 'set') {
    this.inventory.quantity = quantity;
  }
  
  return this.save();
};

// Method to check availability
productSchema.methods.isAvailable = function(quantity = 1) {
  if (this.status !== 'active') return false;
  if (!this.inventory.trackInventory) return true;
  return this.inventory.quantity >= quantity;
};

// Method to calculate shipping cost
productSchema.methods.calculateShippingCost = function(destination, quantity = 1) {
  // This would integrate with shipping APIs
  // For now, return a simple calculation
  const baseCost = this.shipping.weight * 0.5; // $0.5 per kg
  const quantityMultiplier = Math.ceil(quantity / 5); // Every 5 items
  return baseCost * quantityMultiplier;
};

// Method to get product variants
productSchema.methods.getVariants = function() {
  // This would return different variants of the product
  // For now, return the product itself
  return [this];
};

// Method to add review
productSchema.methods.addReview = function(rating, review) {
  const totalRating = this.reviews.averageRating * this.reviews.totalReviews;
  this.reviews.totalReviews += 1;
  this.reviews.averageRating = (totalRating + rating) / this.reviews.totalReviews;
  
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category,
    status: 'active',
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find featured products
productSchema.statics.findFeaturedProducts = function(limit = 10) {
  return this.find({ 
    status: 'active',
    isDeleted: false,
    tags: 'featured'
  }).sort({ 'reviews.averageRating': -1 }).limit(limit);
};

// Static method to find low stock products
productSchema.statics.findLowStockProducts = function() {
  return this.find({
    'inventory.trackInventory': true,
    'inventory.quantity': { $lte: '$inventory.lowStockThreshold' },
    status: 'active',
    isDeleted: false
  });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ],
    status: 'active',
    isDeleted: false,
    ...filters
  };
  
  return this.find(searchQuery).sort({ 'reviews.averageRating': -1 });
};

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to update last modified
productSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);
