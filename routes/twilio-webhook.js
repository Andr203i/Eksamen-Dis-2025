const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../middleware/logging');
const twilio = require('twilio');

// TwiML for responses
const MessagingResponse = twilio.twiml.MessagingResponse;

/**
 * POST /api/twilio/webhook/message
 * Simplified Twilio webhook - saves SMS directly to evaluations
 */
router.post('/webhook/message', async (req, res) => {
    try {
        const { From, To, Body, MessageSid } = req.body;
        
        logger.info(`📱 SMS received from ${From}: ${Body}`);
        
        // Create TwiML response
        const twiml = new MessagingResponse();
        
        // Validate body exists
        if (!Body || Body.trim() === '') {
            twiml.message('Tak for din besked! Send venligst en rating (1-5) efterfulgt af en kommentar.\n\nEksempel: "5 Fantastisk oplevelse!"');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Parse rating and comment
        const messageText = Body.trim();
        const firstChar = messageText.charAt(0);
        const rating = parseInt(firstChar);
        
        // Validate rating
        if (isNaN(rating) || rating < 1 || rating > 5) {
            twiml.message('Tak for dit svar! Send venligst en rating mellem 1-5.\n\nEksempel: "5 Fantastisk!" eller "3 Det var okay"');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Extract comment (everything after first character)
        const comment = messageText.length > 1 ? messageText.substring(1).trim() : null;
        
        // Check for duplicate (same phone + rating in last hour)
        const duplicateCheck = `
            SELECT evaluation_id 
            FROM evaluations 
            WHERE customer_phone = ? 
            AND rating = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            LIMIT 1
        `;
        
        const duplicateResult = await executeQuery(duplicateCheck, [From, rating]);
        
        if (duplicateResult.recordset && duplicateResult.recordset.length > 0) {
            logger.info(`⚠️ Duplicate SMS detected from ${From}`);
            twiml.message('Tak! Vi har allerede modtaget din vurdering. 🌟');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Insert evaluation into database
        // NOTE: Defaults to host_id = 1 (KBHBajer)
        // For production, you'd track which host the SMS is for
        const insertQuery = `
            INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        await executeQuery(insertQuery, [
            1, // host_id (KBHBajer)
            rating,
            comment,
            From
        ]);
        
        logger.info(`✅ Evaluation saved: Host 1, Rating ${rating}, From ${From}`);
        
        // Send confirmation message
        const confirmationMessage = rating >= 4 
            ? `Tusind tak for din ${rating}-stjerner vurdering! 🌟\n\nDin feedback hjælper KBHBajer med at blive endnu bedre!`
            : `Tak for din ${rating}-stjerner vurdering.\n\nVi sætter pris på din ærlige feedback og vil arbejde på at forbedre oplevelsen.`;
        
        twiml.message(confirmationMessage);
        
        // Return TwiML response
        return res.type('text/xml').send(twiml.toString());
        
    } catch (error) {
        logger.error('❌ Twilio webhook error:', error);
        
        // Send error response via TwiML
        const twiml = new MessagingResponse();
        twiml.message('Beklager, der skete en fejl. Prøv igen senere.');
        return res.type('text/xml').send(twiml.toString());
    }
});

/**
 * GET /api/twilio/webhook/message
 * Handle GET requests (Twilio webhook verification)
 */
router.get('/webhook/message', (req, res) => {
    const twiml = new MessagingResponse();
    twiml.message('Twilio webhook is active! 🚀');
    res.type('text/xml').send(twiml.toString());
});

/**
 * POST /api/twilio/webhook/status
 * Twilio webhook for message status updates
 */
router.post('/webhook/status', (req, res) => {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;
    
    logger.info(`📊 SMS Status: ${MessageSid} - ${MessageStatus}`, {
        errorCode: ErrorCode || 'none'
    });
    
    res.sendStatus(200);
});

module.exports = router;