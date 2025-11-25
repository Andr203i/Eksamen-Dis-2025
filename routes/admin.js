const express = require('express');
const router = express.Router();
const { executeQuery, executeStoredProcedure } = require('../config/database');
const { validatePhoneNumber, sanitizeInput, validateBadgeOverride } = require('../middleware/security');
const { logger, logSMSSent } = require('../middleware/logging');
const { authenticateToken, requireAdmin } = require('./auth');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// FIXED: Apply JWT authentication + admin check to ALL routes
router.use(authenticateToken);
router.use(requireAdmin);

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
 * GET /api/admin/stats/overview
 * Get overall system statistics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM hosts) as total_hosts,
                (SELECT COUNT(*) FROM vw_host_badge_status WHERE has_valuable_host_badge = 1) as hosts_with_badge,
                (SELECT COUNT(*) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) as evaluations_90d,
                (SELECT COALESCE(AVG(rating), 0) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) as avg_rating_90d
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
 * Send SMS evaluation to multiple customers
 */
router.post('/evaluations/send', async (req, res) => {
    try {
        const { hostId, phoneNumbers } = req.body;
        
        if (!hostId || !phoneNumbers || !Array.isArray(phoneNumbers)) {
            return res.status(400).json({
                success: false,
                error: 'Host ID and phone numbers required'
            });
        }
        
        // Get host info
        const hostQuery = 'SELECT host_name FROM hosts WHERE host_id = ?';
        const hostResult = await executeQuery(hostQuery, [hostId]);
        
        if (!hostResult.recordset || hostResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Host not found'
            });
        }
        
        const hostName = hostResult.recordset[0].host_name;
        
        let sentCount = 0;
        let failedCount = 0;
        
        for (const phone of phoneNumbers) {
            if (!validatePhoneNumber(phone)) {
                failedCount++;
                continue;
            }
            
            try {
                const message = `Hej! Tak fordi du valgte ${hostName}. Giv os feedback ved at svare med en rating (1-5) og evt. kommentar. F.eks: "5 Fantastisk oplevelse!"`;
                
                await twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phone
                });
                
                logSMSSent(phone, hostId);
                sentCount++;
                
            } catch (error) {
                logger.error(`Failed to send SMS to ${phone}:`, error.message);
                failedCount++;
            }
        }
        
        res.json({
            success: true,
            sent: sentCount,
            failed: failedCount
        });
        
    } catch (error) {
        logger.error('Error sending SMS:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/admin/hosts/:hostId/badge-override
 * Override badge status for a host
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
        
        const query = 'UPDATE hosts SET badge_override = ? WHERE host_id = ?';
        await executeQuery(query, [override, parseInt(hostId)]);
        
        res.json({
            success: true,
            message: `Badge override set to "${override}" for host ${hostId}`
        });
        
    } catch (error) {
        logger.error('Error updating badge override:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;