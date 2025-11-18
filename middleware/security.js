const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for Twilio webhook to prevent spam
 */
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Max 20 requests per minute
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General security middleware
 */
const securityMiddleware = (req, res, next) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
};

/**
 * Validate phone number format (E.164)
 */
function validatePhoneNumber(phone) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate rating (1-5)
 */
function validateRating(rating) {
    const num = parseInt(rating);
    return !isNaN(num) && num >= 1 && num <= 5;
}

/**
 * Sanitize text input to prevent SQL injection
 */
function sanitizeInput(text) {
    if (!text) return '';
    return text
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
}

/**
 * Validate badge override value
 */
function validateBadgeOverride(value) {
    return ['auto', 'on', 'off'].includes(value);
}

/**
 * Input validation middleware for admin routes
 */
const validateAdminInput = (req, res, next) => {
    // Check if user has admin cookie (simple implementation)
    const adminCookie = req.cookies.admin_session;
    
    if (!adminCookie && req.path.includes('/admin')) {
        return res.status(401).json({ error: 'Unauthorized - Admin access required' });
    }
    
    next();
};

module.exports = {
    rateLimiter,
    securityMiddleware,
    validatePhoneNumber,
    validateRating,
    sanitizeInput,
    validateBadgeOverride,
    validateAdminInput
};