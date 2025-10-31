const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Custom logging methods
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? req.user._id : null
  };
  
  logger.info('HTTP Request', logData);
};

logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  };
  
  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user ? req.user._id : null
    };
  }
  
  logger.error('Application Error', errorData);
};

logger.logSecurityEvent = (event, details = {}) => {
  const securityData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'high'
  };
  
  logger.warn('Security Event', securityData);
};

logger.logBusinessEvent = (event, details = {}) => {
  const businessData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'info'
  };
  
  logger.info('Business Event', businessData);
};

logger.logPaymentEvent = (event, details = {}) => {
  const paymentData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'info'
  };
  
  logger.info('Payment Event', paymentData);
};

logger.logVotingEvent = (event, details = {}) => {
  const votingData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'info'
  };
  
  logger.info('Voting Event', votingData);
};

// Middleware to log requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
};

// Middleware to log errors
const errorLogger = (err, req, res, next) => {
  logger.logError(err, req);
  next(err);
};

// Utility function to create log directory
const createLogDirectory = () => {
  const fs = require('fs');
  const logDir = path.join(__dirname, '../logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

// Initialize log directory
createLogDirectory();

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
