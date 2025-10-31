const User = require('../models/User');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Build query
    const query = { isDeleted: false };
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken -passwordResetExpires');

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findById(id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldStatus = user.status;
    user.status = status;
    
    if (status === 'suspended' && reason) {
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = req.user._id;
    }

    await user.save();

    logger.logBusinessEvent('user_status_updated', {
      userId: id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user._id,
      reason
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: {
          id: user._id,
          status: user.status,
          suspensionReason: user.suspensionReason,
          suspendedAt: user.suspendedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'organizer', 'user', 'affiliate'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.logBusinessEvent('user_role_updated', {
      userId: id,
      oldRole,
      newRole: role,
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    logger.logBusinessEvent('user_deleted', {
      userId: id,
      deletedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: ['$emailVerified', 1, 0] }
          },
          organizers: {
            $sum: { $cond: [{ $eq: ['$role', 'organizer'] }, 1, 0] }
          },
          affiliates: {
            $sum: { $cond: [{ $eq: ['$role', 'affiliate'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      suspendedUsers: 0,
      verifiedUsers: 0,
      organizers: 0,
      affiliates: 0
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!['admin', 'organizer', 'user', 'affiliate'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const users = await User.findByRole(role)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ role, isDeleted: false });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const query = {
      isDeleted: false,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
  getUsersByRole,
  searchUsers
};
