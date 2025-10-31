const Notification = require('../models/Notification');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { sendEmail, sendSMS } = require('../utils/helpers');

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;

    const query = { 
      recipient: req.user._id,
      isDeleted: false 
    };

    if (type) {
      query.type = type;
    }

    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check permissions
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this notification as read'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: {
          id: notification._id,
          read: notification.read,
          readAt: notification.readAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { 
        recipient: req.user._id,
        read: false,
        isDeleted: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check permissions
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    // Soft delete
    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = async (req, res, next) => {
  try {
    const { recipients, type, title, message, link, priority = 'normal', sendEmail = false, sendSMS = false } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients are required'
      });
    }

    const notifications = [];
    const emailRecipients = [];
    const smsRecipients = [];

    // Create notifications for each recipient
    for (const recipientId of recipients) {
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type,
        title,
        message,
        link,
        priority,
        status: 'sent'
      });

      notifications.push(notification);

      // Collect recipients for email/SMS if requested
      if (sendEmail || sendSMS) {
        const user = await User.findById(recipientId);
        if (user) {
          if (sendEmail && user.email) {
            emailRecipients.push({
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              notificationId: notification._id
            });
          }
          if (sendSMS && user.phone) {
            smsRecipients.push({
              phone: user.phone,
              name: `${user.firstName} ${user.lastName}`,
              notificationId: notification._id
            });
          }
        }
      }
    }

    // Send emails if requested
    if (sendEmail && emailRecipients.length > 0) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">${title}</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
            </div>
            ${link ? `<p><a href="${link}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>` : ''}
            <p style="color: #666; font-size: 14px;">This is an automated notification from Premium Event Platform.</p>
          </div>
        `;

        for (const recipient of emailRecipients) {
          await sendEmail(recipient.email, title, emailHtml);
        }
      } catch (emailError) {
        logger.logError(emailError);
        // Don't fail the request if email fails
      }
    }

    // Send SMS if requested
    if (sendSMS && smsRecipients.length > 0) {
      try {
        for (const recipient of smsRecipients) {
          await sendSMS(recipient.phone, `${title}: ${message}`);
        }
      } catch (smsError) {
        logger.logError(smsError);
        // Don't fail the request if SMS fails
      }
    }

    logger.logBusinessEvent('notifications_created', {
      createdBy: req.user._id,
      recipientCount: recipients.length,
      type,
      title
    });

    res.status(201).json({
      success: true,
      message: 'Notifications created successfully',
      data: {
        notifications: notifications.map(n => ({
          id: n._id,
          recipient: n.recipient,
          type: n.type,
          title: n.title
        })),
        emailSent: emailRecipients.length,
        smsSent: smsRecipients.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private/Admin
const getNotificationStats = async (req, res, next) => {
  try {
    const stats = await Notification.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          unreadNotifications: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          },
          readNotifications: {
            $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] }
          },
          highPriorityNotifications: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get notifications by type
    const typeStats = await Notification.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const result = stats[0] || {
      totalNotifications: 0,
      unreadNotifications: 0,
      readNotifications: 0,
      highPriorityNotifications: 0
    };

    res.json({
      success: true,
      data: {
        stats: result,
        typeStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send notification to all users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res, next) => {
  try {
    const { type, title, message, link, priority = 'normal', userRoles = [], sendEmail = false, sendSMS = false } = req.body;

    // Get all users or users with specific roles
    const query = { isDeleted: false };
    if (userRoles.length > 0) {
      query.role = { $in: userRoles };
    }

    const users = await User.find(query).select('_id firstName lastName email phone role');
    
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found for broadcast'
      });
    }

    const recipients = users.map(user => user._id);
    
    // Create notification for each user
    const notifications = [];
    for (const user of users) {
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type,
        title,
        message,
        link,
        priority,
        status: 'sent'
      });

      notifications.push(notification);
    }

    // Send emails if requested
    if (sendEmail) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">${title}</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
            </div>
            ${link ? `<p><a href="${link}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>` : ''}
            <p style="color: #666; font-size: 14px;">This is an automated notification from Premium Event Platform.</p>
          </div>
        `;

        for (const user of users) {
          if (user.email) {
            await sendEmail(user.email, title, emailHtml);
          }
        }
      } catch (emailError) {
        logger.logError(emailError);
      }
    }

    // Send SMS if requested
    if (sendSMS) {
      try {
        for (const user of users) {
          if (user.phone) {
            await sendSMS(user.phone, `${title}: ${message}`);
          }
        }
      } catch (smsError) {
        logger.logError(smsError);
      }
    }

    logger.logBusinessEvent('notification_broadcast', {
      createdBy: req.user._id,
      recipientCount: users.length,
      type,
      title,
      userRoles
    });

    res.status(201).json({
      success: true,
      message: 'Broadcast notification sent successfully',
      data: {
        recipientCount: users.length,
        notificationsSent: notifications.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  broadcastNotification
};
