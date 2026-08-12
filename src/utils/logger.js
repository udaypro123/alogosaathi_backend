// logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // minimum log level
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Console me log
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Errors file me
    new winston.transports.File({ filename: 'combined.log' }) // Sab log file me
  ]
});

// Error object ko bhi log kar sakte ho
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

export default logger;
