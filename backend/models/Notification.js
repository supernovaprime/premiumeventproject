const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification Details
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'event_approval',
      'event_rejection',
      'ticket_purchase',
      'payment_completed',
      'payment_failed',
      'vote_received',
      'nominee_added',
      'affiliate_commission',
      'payout_requested',
      'payout_processed',
      'order_status_update',
      'system_announcement',
      'welcome',
      'reminder',
      'invitation'
    ],
    required: true
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery Channels
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      emailId: String,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'pending'
      }
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      messageId: String,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      }
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      }
    },
    inApp: {
      sent: {
        type: Boolean,
        default: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'read', 'archived'],
        default: 'sent'
      }
    }
  },
  
  // Related Entity
  relatedEntity: {
    type: {
      type: String,
      enum: ['event', 'ticket', 'order', 'payment', 'vote', 'nominee', 'affiliate', 'user']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Action Information
  action: {
    type: {
      type: String,
      enum: ['view', 'approve', 'reject', 'purchase', 'vote', 'share', 'none']
    },
    url: String,
    buttonText: String
  },
  
  // Scheduling
  scheduledFor: Date,
  expiresAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Read Status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Additional Data
  data: mongoose.Schema.Types.Mixed,
  
  // Template Information
  template: {
    name: String,
    variables: mongoose.Schema.Types.Mixed
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

// Indexes for better performance
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });

// Virtual for delivery status
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  const statuses = [];
  
  if (channels.email.sent) statuses.push('email');
  if (channels.sms.sent) statuses.push('sms');
  if (channels.push.sent) statuses.push('push');
  if (channels.inApp.sent) statuses.push('inApp');
  
  return statuses;
});

// Virtual for is urgent
notificationSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.type === 'payment_failed';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  this.channels.inApp.status = 'read';
  return this.save();
};

// Method to mark as archived
notificationSchema.methods.markAsArchived = function() {
  this.channels.inApp.status = 'archived';
  return this.save();
};

// Method to send email notification
notificationSchema.methods.sendEmail = async function() {
  const nodemailer = require('nodemailer');
  
  try {
    // Get recipient email
    const User = mongoose.model('User');
    const user = await User.findById(this.recipient);
    
    if (!user || !user.email) {
      throw new Error('Recipient email not found');
    }
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: this.title,
      html: this.generateEmailHTML(),
      text: this.message
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    this.channels.email.sent = true;
    this.channels.email.sentAt = new Date();
    this.channels.email.emailId = info.messageId;
    this.channels.email.status = 'sent';
    
    await this.save();
    
    return info;
  } catch (error) {
    this.channels.email.status = 'failed';
    await this.save();
    throw error;
  }
};

// Method to send SMS notification
notificationSchema.methods.sendSMS = async function() {
  const twilio = require('twilio');
  
  try {
    // Get recipient phone
    const User = mongoose.model('User');
    const user = await User.findById(this.recipient);
    
    if (!user || !user.phone) {
      throw new Error('Recipient phone not found');
    }
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Send SMS
    const message = await client.messages.create({
      body: this.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    
    this.channels.sms.sent = true;
    this.channels.sms.sentAt = new Date();
    this.channels.sms.messageId = message.sid;
    this.channels.sms.status = 'sent';
    
    await this.save();
    
    return message;
  } catch (error) {
    this.channels.sms.status = 'failed';
    await this.save();
    throw error;
  }
};

// Method to send push notification
notificationSchema.methods.sendPush = async function() {
  // This would integrate with Firebase Cloud Messaging or similar
  // For now, just mark as sent
  this.channels.push.sent = true;
  this.channels.push.sentAt = new Date();
  this.channels.push.status = 'sent';
  
  return this.save();
};

// Method to generate email HTML
notificationSchema.methods.generateEmailHTML = function() {
  const actionButton = this.action.url ? 
    `<a href="${this.action.url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
      ${this.action.buttonText || 'View Details'}
    </a>` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${this.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #3B82F6; margin-top: 0;">${this.title}</h2>
        <p style="margin: 16px 0;">${this.message}</p>
        ${actionButton}
      </div>
      <div style="text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated message from Premium Event Platform.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;
};

// Method to process notification
notificationSchema.methods.process = async function() {
  try {
    // Send in-app notification (always sent)
    this.channels.inApp.sent = true;
    this.channels.inApp.sentAt = new Date();
    
    // Send email if enabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      await this.sendEmail();
    }
    
    // Send SMS if enabled and urgent
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && this.isUrgent) {
      await this.sendSMS();
    }
    
    // Send push notification
    await this.sendPush();
    
    this.status = 'sent';
    await this.save();
    
    return true;
  } catch (error) {
    this.status = 'failed';
    await this.save();
    throw error;
  }
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    recipient: data.recipient,
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority || 'medium',
    relatedEntity: data.relatedEntity,
    action: data.action,
    scheduledFor: data.scheduledFor,
    expiresAt: data.expiresAt,
    data: data.data,
    template: data.template
  });
};

// Static method to find notifications by recipient
notificationSchema.statics.findByRecipient = function(recipientId, options = {}) {
  const query = {
    recipient: recipientId,
    isDeleted: false
  };
  
  if (options.unreadOnly) {
    query.read = false;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find unread notifications
notificationSchema.statics.findUnreadNotifications = function(recipientId) {
  return this.find({
    recipient: recipientId,
    read: false,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(recipientId) {
  return this.updateMany(
    { recipient: recipientId, read: false },
    { 
      read: true, 
      readAt: new Date(),
      'channels.inApp.status': 'read'
    }
  );
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulkNotifications = async function(recipients, notificationData) {
  const notifications = recipients.map(recipient => ({
    ...notificationData,
    recipient: recipient._id || recipient
  }));
  
  const createdNotifications = await this.insertMany(notifications);
  
  // Process each notification
  for (const notification of createdNotifications) {
    try {
      await notification.process();
    } catch (error) {
      console.error(`Failed to process notification ${notification._id}:`, error);
    }
  }
  
  return createdNotifications;
};

// Pre-save middleware to set expiration
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Set expiration to 30 days from now
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
