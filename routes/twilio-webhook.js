const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const twilio = require('twilio');

const MessagingResponse = twilio.twiml.MessagingResponse;

/**
 * POST /api/twilio/webhook/message
 * Ultra-simplified webhook with extensive logging
 */
router.post('/webhook/message', async (req, res) => {
    console.log('='.repeat(60));
    console.log('📱 TWILIO WEBHOOK RECEIVED');
    console.log('='.repeat(60));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('='.repeat(60));
    
    try {
        const { From, Body } = req.body;
        const twiml = new MessagingResponse();
        
        // Validate inputs
        if (!Body || !Body.trim()) {
            console.log('⚠️ Empty body received');
            twiml.message('Tak! Send venligst en rating (1-5) og kommentar.\n\nEksempel: "5 Fantastisk!"');
            const response = twiml.toString();
            console.log('📤 Sending TwiML response:', response);
            return res.type('text/xml').send(response);
        }
        
        // Parse message
        const messageText = Body.trim();
        const firstChar = messageText.charAt(0);
        const rating = parseInt(firstChar);
        
        console.log(`📊 Parsed - Rating: ${rating}, Message: ${messageText}`);
        
        // Validate rating
        if (isNaN(rating) || rating < 1 || rating > 5) {
            console.log('⚠️ Invalid rating:', firstChar);
            twiml.message('Tak! Send venligst en rating mellem 1-5.\n\nEksempel: "5 Fantastisk!" eller "3 Det var okay"');
            const response = twiml.toString();
            console.log('📤 Sending TwiML response:', response);
            return res.type('text/xml').send(response);
        }
        
        const comment = messageText.length > 1 ? messageText.substring(1).trim() : null;
        
        console.log('💾 Attempting to save to database...');
        
        // Save to database
        const insertQuery = `
            INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        await executeQuery(insertQuery, [1, rating, comment, From]);
        
        console.log('✅ Saved successfully!');
        
        // Send confirmation
        const confirmationMessage = rating >= 4 
            ? `Tusind tak for din ${rating}-stjerner vurdering! 🌟`
            : `Tak for din ${rating}-stjerner vurdering. Vi sætter pris på din feedback.`;
        
        twiml.message(confirmationMessage);
        
        const response = twiml.toString();
        console.log('📤 Sending TwiML response:', response);
        console.log('='.repeat(60));
        
        return res.type('text/xml').send(response);
        
    } catch (error) {
        console.error('❌ ERROR in webhook:', error);
        console.error('Stack:', error.stack);
        
        const twiml = new MessagingResponse();
        twiml.message('Beklager, der skete en fejl. Prøv igen senere.');
        
        const response = twiml.toString();
        console.log('📤 Sending error TwiML:', response);
        
        return res.type('text/xml').send(response);
    }
});

router.get('/webhook/message', (req, res) => {
    const twiml = new MessagingResponse();
    twiml.message('Webhook is active! 🚀');
    res.type('text/xml').send(twiml.toString());
});

router.post('/webhook/status', (req, res) => {
    console.log('📊 SMS Status:', req.body);
    res.sendStatus(200);
});

module.exports = router;