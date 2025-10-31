const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random number
const generateRandomNumber = (min = 100000, max = 999999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Hash string
const hashString = (string, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(string).digest('hex');
};

// Generate JWT token
const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = '7d') => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate verification code
const generateVerificationCode = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

// Generate slug from string
const generateSlug = (string) => {
  return string
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Format currency
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

// Calculate time difference
const timeDifference = (date1, date2) => {
  const diff = moment(date2).diff(moment(date1));
  return moment.duration(diff);
};

// Generate QR code
const generateQRCode = async (data, options = {}) => {
  const defaultOptions = {
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 200
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Generate PDF
const generatePDF = (data, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to PDF
      doc.fontSize(20).text(data.title || 'Document', 100, 100);
      doc.fontSize(12).text(data.content || '', 100, 150);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Excel file
const generateExcel = async (data, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');
  
  // Add headers
  if (options.headers) {
    worksheet.addRow(options.headers);
  }
  
  // Add data rows
  if (data && data.length > 0) {
    data.forEach(row => {
      worksheet.addRow(row);
    });
  }
  
  // Style the worksheet
  if (options.headers) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  return workbook;
};

// Send email
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };
    
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error('Failed to send email');
  }
};

// Send SMS
const sendSMS = async (to, message) => {
  try {
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    
    return result;
  } catch (error) {
    throw new Error('Failed to send SMS');
  }
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Validate URL format
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitize HTML
const sanitizeHTML = (html) => {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Generate password
const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate unique ID
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}${timestamp}${random}`;
};

// Deep clone object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Retry function with exponential backoff
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Generate pagination info
const generatePaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
};

// Generate color from string
const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = Math.abs(hash).toString(16).substring(0, 6);
  return `#${color.padEnd(6, '0')}`;
};

// Validate credit card number
const validateCreditCard = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  hashString,
  generateToken,
  verifyToken,
  generateVerificationCode,
  generateSlug,
  formatCurrency,
  formatDate,
  timeDifference,
  generateQRCode,
  generatePDF,
  generateExcel,
  sendEmail,
  sendSMS,
  isValidEmail,
  isValidPhone,
  isValidURL,
  sanitizeHTML,
  generatePassword,
  calculateDistance,
  formatFileSize,
  generateUniqueId,
  deepClone,
  retry,
  debounce,
  throttle,
  generatePaginationInfo,
  calculatePercentage,
  generateColorFromString,
  validateCreditCard
};
