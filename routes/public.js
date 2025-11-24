const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../middleware/logging');

/**
 * GET /api/public/host/:hostId
 * Get public host information with badge status and experiences
 */
router.get('/host/:hostId', async (req, res) => {
    try {
        const { hostId } = req.params;
        
        // Get host with badge info
        const hostQuery = `
            SELECT 
                h.host_id,
                h.host_name,
                h.email,
                h.phone,
                v.reviews_count_90d,
                v.avg_rating_90d,
                v.has_valuable_host_badge
            FROM hosts h
            LEFT JOIN vw_host_badge_status v ON h.host_id = v.host_id
            WHERE h.host_id = ?
        `;
        
        const hostResult = await executeQuery(hostQuery, [parseInt(hostId)]);
        
        if (!hostResult.recordset || hostResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Host not found'
            });
        }
        
        const host = hostResult.recordset[0];
        
        // Get experiences
        const experiencesQuery = `
            SELECT 
                experience_id,
                title,
                description,
                price,
                image_url
            FROM experiences
            WHERE host_id = ?
            ORDER BY title
        `;
        
        const experiencesResult = await executeQuery(experiencesQuery, [parseInt(hostId)]);
        
        // Format response
        const response = {
            success: true,
            host: {
                id: host.host_id,
                name: host.host_name,
                email: host.email,
                phone: host.phone,
                experience_name: 'Øl Smagning hos KBHBajer', // Placeholder
                location: 'Rådhuspladsen 1, 1553 København', // Placeholder
                description: 'Bajer', // Placeholder
                price: 200, // Placeholder
                has_valuable_host_badge: host.has_valuable_host_badge === 1,
                avg_rating_90d: parseFloat(host.avg_rating_90d) || 0,
                reviews_count_90d: host.reviews_count_90d || 0,
                experiences: experiencesResult.recordset || []
            }
        };
        
        res.json(response);
        
    } catch (error) {
        logger.error('Error fetching host:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/public/host/:hostId/reviews
 * Get public reviews for a host (last 90 days)
 */
router.get('/host/:hostId/reviews', async (req, res) => {
    try {
        const { hostId } = req.params;
        const { limit = 10 } = req.query;
        
        const query = `
            SELECT 
                rating,
                comment_text,
                created_at
            FROM evaluations
            WHERE host_id = ?
                AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                AND comment_text IS NOT NULL
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const result = await executeQuery(query, [parseInt(hostId), parseInt(limit)]);
        
        res.json({
            success: true,
            reviews: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/public/badge-criteria
 * Get the criteria for earning Valuable Host badge
 */
router.get('/badge-criteria', (req, res) => {
    res.json({
        success: true,
        criteria: {
            minRating: 4.8,
            minReviews: 10,
            timeWindow: '90 days',
            description: 'Hosts must maintain an average rating of 4.8 or higher with at least 10 reviews in the last 90 days to earn the Valuable Host badge.'
        }
    });
});

/**
 * GET /api/public/community-stats
 * Get community overview statistics (public)
 */
router.get('/community-stats', async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM hosts) AS total_hosts,
                (SELECT COUNT(*) FROM vw_host_badge_status WHERE has_valuable_host_badge = 1) AS valuable_hosts,
                (SELECT COUNT(*) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) AS total_reviews,
                (SELECT COALESCE(AVG(rating), 0) FROM evaluations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)) AS avg_rating
        `;
        
        const result = await executeQuery(query);
        
        res.json({
            success: true,
            stats: result.recordset[0]
        });
        
    } catch (error) {
        logger.error('Error fetching community stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/public/leaderboard
 * Get top 40 leaderboard (public)
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const query = `
            SELECT 
                h.host_id,
                h.host_name as name,
                v.reviews_count_90d,
                v.avg_rating_90d,
                v.has_valuable_host_badge
            FROM hosts h
            LEFT JOIN vw_host_badge_status v ON h.host_id = v.host_id
            WHERE v.reviews_count_90d > 0
            ORDER BY v.avg_rating_90d DESC, v.reviews_count_90d DESC
            LIMIT 40
        `;
        
        const result = await executeQuery(query);
        
        res.json({
            success: true,
            leaderboard: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;