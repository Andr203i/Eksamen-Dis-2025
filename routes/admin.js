const express = require('express');
const router = express.Router();
const { executeQuery, executeStoredProcedure } = require('../config/database');
const { validatePhoneNumber, sanitizeInput, validateBadgeOverride } = require('../middleware/security');
const { logger, logSMSSent } = require('../middleware/logging');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Middleware to check admin access
 */
function checkAdminAccess(req, res, next) {
    const adminSession = req.cookies.admin_session;
    
    if (adminSession === 'true') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
}

// Apply admin check to all routes
router.use(checkAdminAccess);

/**
 * GET /api/admin/hosts/top40
 * Get top 40 hosts ranked by performance
 */
router.get('/hosts/top40', async (req, res) => {
    try {
        const query = `
            SELECT 
                h.host_id,
                h.host_name,
                v.reviews_count_90d as count_90d,
                v.avg_rating_90d,
                v.has_valuable_host_badge as final_badge_status
            FROM hosts h
            LEFT JOIN vw_host_badge_status v ON h.host_id = v.host_id
            WHERE v.reviews_count_90d > 0
            ORDER BY v.avg_rating_90d DESC, v.reviews_count_90d DESC
            LIMIT 40
        `;
        
        const result = await executeQuery(query);
        
        res.json({
            success: true,
            top40: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching top 40:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/hosts/performance
 * Get all hosts with performance metrics
 */
router.get('/hosts/performance', async (req, res) => {
    try {
        const query = `
            SELECT 
                h.host_id,
                h.host_name,
                h.email,
                h.phone,
                h.badge_override,
                v.reviews_count_90d,
                v.avg_rating_90d,
                v.has_valuable_host_badge,
                h.created_at
            FROM hosts h
            LEFT JOIN vw_host_badge_status v ON h.host_id = v.host_id
            ORDER BY v.avg_rating_90d DESC
        `;
        
        const result = await executeQuery(query);
        
        res.json({
            success: true,
            hosts: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching host performance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/stats/overview
 * Get dashboard overview statistics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM hosts) AS total_hosts,
                (SELECT COUNT(*) FROM vw_host_badge_status WHERE has_valuable_host_badge = 1) AS hosts_with_badge,
                (SELECT COUNT(*) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) AS evaluations_90d,
                (SELECT COUNT(*) FROM evaluations) AS total_evaluations,
                (SELECT COALESCE(AVG(rating), 0) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) AS avg_rating_90d
        `;
        
        const result = await executeQuery(query);
        
        res.json({
            success: true,
            stats: result.recordset[0]
        });
        
    } catch (error) {
        logger.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/admin/evaluations/send
 * Send SMS evaluation requests
 */
router.post('/evaluations/send', async (req, res) => {
    try {
        const { hostId, phoneNumbers } = req.body;
        
        if (!hostId || !phoneNumbers || !Array.isArray(phoneNumbers)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: hostId and phoneNumbers array required'
            });
        }
        
        // Get host info
        const hostQuery = `SELECT host_name FROM hosts WHERE host_id = ?`;
        const hostResult = await executeQuery(hostQuery, [hostId]);
        
        if (!hostResult.recordset || hostResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Host not found'
            });
        }
        
        const hostName = hostResult.recordset[0].host_name;
        
        // Send SMS to each number
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };
        
        for (const phone of phoneNumbers) {
            // Validate phone number
            if (!validatePhoneNumber(phone)) {
                results.failed++;
                results.errors.push(`Invalid phone number: ${phone}`);
                continue;
            }
            
            try {
                const message = `Tak for din oplevelse hos ${hostName}! 🌟

Hvordan var det? Svar med:
1-5 [din kommentar]

Eks: 5 Fantastisk oplevelse!

Din feedback hjælper os med at blive bedre.`;
                
                await twilioClient.messages.create({
                    body: message,
                    to: phone,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
                });
                
                results.sent++;
                logSMSSent(hostId, phone);
                
            } catch (error) {
                results.failed++;
                results.errors.push(`Failed to send to ${phone}: ${error.message}`);
                logger.error(`SMS send error for ${phone}:`, error);
            }
        }
        
        res.json({
            success: true,
            sent: results.sent,
            failed: results.failed,
            errors: results.errors
        });
        
    } catch (error) {
        logger.error('Error sending evaluations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/admin/hosts/:hostId/badge-override
 * Manually override badge status
 */
router.patch('/hosts/:hostId/badge-override', async (req, res) => {
    try {
        const { hostId } = req.params;
        const { override } = req.body;
        
        if (!validateBadgeOverride(override)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid override value. Must be: auto, on, or off'
            });
        }
        
        const query = `
            UPDATE hosts 
            SET badge_override = ?
            WHERE host_id = ?
        `;
        
        await executeQuery(query, [override, hostId]);
        
        res.json({
            success: true,
            message: `Badge override set to: ${override}`
        });
        
    } catch (error) {
        logger.error('Error updating badge override:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/hosts/:hostId/evaluations
 * Get all evaluations for a specific host
 */
router.get('/hosts/:hostId/evaluations', async (req, res) => {
    try {
        const { hostId } = req.params;
        
        const query = `
            SELECT 
                evaluation_id,
                host_id,
                rating,
                comment_text,
                customer_phone,
                created_at
            FROM evaluations
            WHERE host_id = ?
            ORDER BY created_at DESC
        `;
        
        const result = await executeQuery(query, [parseInt(hostId)]);
        
        res.json({
            success: true,
            evaluations: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching evaluations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/hosts/:hostId/experiences
 * Get all experiences for a specific host
 */
router.get('/hosts/:hostId/experiences', async (req, res) => {
    try {
        const { hostId } = req.params;
        
        const query = `
            SELECT 
                experience_id,
                host_id,
                title,
                description,
                price
            FROM experiences
            WHERE host_id = ?
            ORDER BY title
        `;
        
        const result = await executeQuery(query, [parseInt(hostId)]);
        
        res.json({
            success: true,
            experiences: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching experiences:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/admin/hosts/:hostId/calculate-badge
 * Manually trigger badge calculation for a host
 */
router.post('/hosts/:hostId/calculate-badge', async (req, res) => {
    try {
        const { hostId } = req.params;
        
        // Get fresh badge status from view
        const query = `
            SELECT * FROM vw_host_badge_status WHERE host_id = ?
        `;
        
        const result = await executeQuery(query, [parseInt(hostId)]);
        
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Host not found'
            });
        }
        
        res.json({
            success: true,
            badge: result.recordset[0]
        });
        
    } catch (error) {
        logger.error('Error calculating badge:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;