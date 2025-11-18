const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

// Winston logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'understory-superhost' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to `combined.log`
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
    ],
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            type: 'response',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    
    next();
};

/**
 * Log Twilio webhook events
 */
const logTwilioWebhook = (data) => {
    logger.info({
        type: 'twilio_webhook',
        from: data.From,
        to: data.To,
        body: data.Body,
        messageSid: data.MessageSid,
        timestamp: new Date().toISOString()
    });
};

/**
 * Log badge calculation
 */
const logBadgeCalculation = (hostId, stats) => {
    logger.info({
        type: 'badge_calculation',
        hostId,
        count90d: stats.count_90d,
        avgRating: stats.avg_rating_90d,
        badgeAwarded: stats.has_badge_computed,
        timestamp: new Date().toISOString()
    });
};

/**
 * Log SMS sent
 */
const logSMSSent = (hostId, phone, status) => {
    logger.info({
        type: 'sms_sent',
        hostId,
        phone,
        status,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    requestLogger,
    logTwilioWebhook,
    logBadgeCalculation,
    logSMSSent
};