const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { validateRating, sanitizeInput } = require('../middleware/security');
const { logger, logTwilioWebhook } = require('../middleware/logging');
const twilio = require('twilio');

// TwiML for responses
const MessagingResponse = twilio.twiml.MessagingResponse;

/**
 * POST /api/twilio/webhook/message
 * Twilio webhook endpoint for incoming SMS messages
 * 
 * Expected format from customer:
 * "5" or "5 Great experience!" or "4 Good but could be better"
 */
router.post('/webhook/message', async (req, res) => {
    try {
        const { From, To, Body, MessageSid } = req.body;
        
        logTwilioWebhook(From, Body, MessageSid);
        
        const twiml = new MessagingResponse();
        
        if (!Body || Body.trim() === '') {
            twiml.message('Tak for din besked! Send venligst en vurdering (1-5) efterfulgt af en valgfri kommentar.');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Parse rating and comment from message
        const bodyText = sanitizeInput(Body.trim());
        const firstChar = bodyText.charAt(0);
        const rating = parseInt(firstChar);
        
        if (!validateRating(rating)) {
            twiml.message('Ugyldigt format. Send venligst en vurdering fra 1-5, efterfulgt af en valgfri kommentar.\n\nEksempel: "5 Fantastisk oplevelse!"');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Extract comment (everything after first character and optional space)
        const comment = bodyText.substring(1).trim() || null;
        
        // Check if customer has a pending evaluation request
        // For now, we'll need to find the host_id based on the phone number
        // This is a simplified version - in production you'd want better tracking
        
        const findHostQuery = `
            SELECT h.host_id, h.host_name
            FROM hosts h
            LIMIT 1
        `;
        
        const hostResult = await executeQuery(findHostQuery);
        
        if (!hostResult.recordset || hostResult.recordset.length === 0) {
            twiml.message('Vi kunne ikke finde værtsinformation. Kontakt support.');
            return res.type('text/xml').send(twiml.toString());
        }
        
        const { host_id, host_name } = hostResult.recordset[0];
        
        // Check if this message was already processed (prevent duplicates)
        const duplicateCheck = `
            SELECT evaluation_id FROM evaluations WHERE customer_phone = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `;
        const duplicateResult = await executeQuery(duplicateCheck, [From]);
        
        if (duplicateResult.recordset.length > 0) {
            twiml.message('Tak! Vi har allerede modtaget din vurdering. 🌟');
            return res.type('text/xml').send(twiml.toString());
        }
        
        // Insert evaluation into database
        const insertQuery = `
            INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        await executeQuery(insertQuery, [
            host_id,
            rating,
            comment,
            From
        ]);
        
        logger.info(`New evaluation received: Host ${host_id}, Rating ${rating}, From ${From}`);
        
        // Send confirmation message
        const confirmationMessage = rating >= 4 
            ? `Tusind tak for din ${rating}-stjerner vurdering! 🌟 Din feedback hjælper ${host_name} med at blive endnu bedre!`
            : `Tak for din ${rating}-stjerner vurdering. Vi sætter pris på din ærlige feedback og vil arbejde på at forbedre oplevelsen.`;
        
        twiml.message(confirmationMessage);
        
        res.type('text/xml').send(twiml.toString());
        
    } catch (error) {
        logger.error('Twilio webhook error:', error);
        
        // Send error response via TwiML
        const twiml = new MessagingResponse();
        twiml.message('Beklager, der skete en fejl. Prøv igen senere eller kontakt support.');
        res.type('text/xml').send(twiml.toString());
    }
});

/**
 * GET /api/twilio/webhook/message
 * Handle GET requests (Twilio sometimes sends GET for testing)
 */
router.get('/webhook/message', (req, res) => {
    const twiml = new MessagingResponse();
    twiml.message('Twilio webhook is active. Send a POST request with SMS data.');
    res.type('text/xml').send(twiml.toString());
});

/**
 * POST /api/twilio/webhook/status
 * Twilio webhook for message status updates
 */
router.post('/webhook/status', (req, res) => {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;
    
    logger.info(`SMS Status Update: ${MessageSid} - ${MessageStatus}`, {
        errorCode: ErrorCode || 'none'
    });
    
    res.sendStatus(200);
});

module.exports = router;