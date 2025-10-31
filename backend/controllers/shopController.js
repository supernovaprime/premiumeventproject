const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');
const { generateUniqueId } = require('../utils/helpers');

// @desc    Get all products
// @route   GET /api/shop/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      inStock = true
    } = req.query;

    // Build query
    const query = { 
      status: 'active',
      isDeleted: false 
    };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      query['inventory.quantity'] = { $gt: 0 };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'price') {
      sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sort['reviews.averageRating'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/shop/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product || product.isDeleted || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/shop/products/search
// @access  Public
const searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12, filters } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchFilters = filters ? JSON.parse(filters) : {};
    const products = await Product.searchProducts(q, {
      ...searchFilters,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        products,
        query: q
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order
// @route   POST /api/shop/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate and calculate order
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || product.isDeleted || product.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (!product.isAvailable(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        customization: item.customization || {},
        notes: item.notes
      });
    }

    // Calculate shipping (simplified)
    const shippingCost = calculateShippingCost(orderItems, shippingAddress);
    const taxAmount = calculateTax(subtotal, shippingAddress);
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      pricing: {
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        currency: 'USD'
      },
      shipping: {
        method: 'standard',
        address: shippingAddress
      },
      payment: {
        method: paymentMethod,
        gateway: 'stripe', // This would be determined by payment method
        amount: totalAmount,
        currency: 'USD',
        status: 'pending'
      },
      notes,
      status: 'pending'
    });

    // Update product inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.quantity': -item.quantity },
        $inc: { 'sales.totalSold': item.quantity },
        $set: { 'sales.lastSoldAt': new Date() }
      });
    }

    logger.logBusinessEvent('order_created', {
      orderId: order._id,
      customerId: req.user._id,
      itemCount: orderItems.length,
      totalAmount
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          items: orderItems,
          pricing: order.pricing,
          status: order.status,
          createdAt: order.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/shop/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name description images price');

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders by user
// @route   GET /api/shop/orders/user
// @access  Private
const getOrdersByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
      customer: req.user._id,
      isDeleted: false 
    };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/shop/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(id);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, notes, req.user._id);

    logger.logBusinessEvent('order_status_updated', {
      orderId: order._id,
      oldStatus: order.status,
      newStatus: status,
      updatedBy: req.user._id,
      notes
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: {
          id: order._id,
          status: order.status,
          timeline: order.timeline
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/shop/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    await order.cancel(reason);

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.quantity': item.quantity },
        $inc: { 'sales.totalSold': -item.quantity }
      });
    }

    logger.logBusinessEvent('order_cancelled', {
      orderId: order._id,
      cancelledBy: req.user._id,
      reason
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order: {
          id: order._id,
          status: order.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shop statistics
// @route   GET /api/shop/stats
// @access  Private/Admin
const getShopStats = async (req, res, next) => {
  try {
    const stats = await Order.getOrderStats('month');

    // Get product statistics
    const productStats = await Product.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$inventory.trackInventory', true] },
                  { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
                ]}, 1, 0]
              }
            }
          },
          totalRevenue: { $sum: '$sales.totalRevenue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        orderStats: stats,
        productStats: productStats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalRevenue: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const calculateShippingCost = (items, address) => {
  // Simplified shipping calculation
  const totalWeight = items.reduce((total, item) => total + (item.weight || 0.5), 0);
  const baseCost = totalWeight * 0.5; // $0.5 per kg
  return Math.round(baseCost * 100) / 100;
};

const calculateTax = (subtotal, address) => {
  // Simplified tax calculation (8% for most locations)
  const taxRate = 0.08;
  return Math.round(subtotal * taxRate * 100) / 100;
};

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  cancelOrder,
  getShopStats
};
