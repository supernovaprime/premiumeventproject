const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getProductById,
  searchProducts,
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  cancelOrder,
  getShopStats
} = require('../controllers/shopController');

const { authenticateToken, authorize, validateObjectId } = require('../middleware/auth');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

import validateObjectId from "../middleware/validateObjectId.js";

// Example


const router = express.Router();

router.get("/:id", validateObjectId, getEventById);
router.put("/:id", validateObjectId, updateEvent);
router.delete("/:id", validateObjectId, deleteEvent);

// @route   GET /api/shop/products
// @desc    Get all products
// @access  Public
router.get('/products', [
  validatePagination
], getProducts);

// @route   GET /api/shop/products/search
// @desc    Search products
// @access  Public
router.get('/products/search', [
  validatePagination
], searchProducts);

// @route   GET /api/shop/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/products/:id', [
  validateObjectId('id'),
  handleValidationErrors
], getProductById);

// @route   GET /api/shop/orders/user
// @desc    Get orders by user
// @access  Private
router.get('/orders/user', [
  authenticateToken,
  validatePagination
], getOrdersByUser);

// @route   GET /api/shop/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/orders/:id', [
  authenticateToken,
  validateObjectId('id'),
  handleValidationErrors
], getOrderById);

// @route   GET /api/shop/stats
// @desc    Get shop statistics (Admin only)
// @access  Private/Admin
router.get('/stats', [
  authenticateToken,
  authorize('admin')
], getShopStats);

// @route   POST /api/shop/orders
// @desc    Create order
// @access  Private
router.post('/orders', [
  authenticateToken,
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.customization')
    .optional()
    .isObject()
    .withMessage('Customization must be an object'),
  
  body('items.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Item notes cannot exceed 500 characters'),
  
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('shippingAddress.email')
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('shippingAddress.phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  
  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required')
    .isLength({ max: 10 })
    .withMessage('Zip code cannot exceed 10 characters'),
  
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'mobile_money', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Order notes cannot exceed 1000 characters'),
  
  handleValidationErrors
], createOrder);

// @route   PUT /api/shop/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/orders/:id/status', [
  authenticateToken,
  authorize('admin'),
  validateObjectId('id'),
  
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Status notes cannot exceed 500 characters'),
  
  handleValidationErrors
], updateOrderStatus);

// @route   PUT /api/shop/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/orders/:id/cancel', [
  authenticateToken,
  validateObjectId('id'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),
  
  handleValidationErrors
], cancelOrder);

module.exports = router;
