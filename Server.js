require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import database
const { getPool } = require('./config/database');

// Import routes (will create these next)
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const twilioWebhookRoutes = require('./routes/twilio-webhook');

// Import middleware
const { securityMiddleware, rateLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/logging');

const app = express();
const PORT = process.env.PORT || 4545;

// ==========================================
// MIDDLEWARE SETUP
// ==========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [`http://${process.env.DROPLET_IP}`, process.env.BASE_URL]
        : '*',
    credentials: true
}));

// Request logging
app.use(morgan('dev')); // Console logging
app.use(requestLogger); // Custom Winston logging

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for session management
app.use(cookieParser(process.env.SESSION_SECRET));

// Rate limiting for Twilio webhook (prevent spam)
app.use('/api/twilio', rateLimiter);

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin routes (performance dashboard, send SMS)
app.use('/api/admin', adminRoutes);

// Public API routes (host storefront data)
app.use('/api/public', publicRoutes);

// Twilio webhook routes
app.use('/api/twilio', twilioWebhookRoutes);

// Serve frontend pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/storefront/:hostId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'storefront', 'index.html'));
});

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
    try {
        // Test database connection
        console.log('🔄 Testing database connection...');
        try {
            await getPool();
            console.log('✅ Database connected successfully!\n');
        } catch (dbError) {
            console.log('⚠️  Database connection failed:', dbError.message);
            console.log('⚠️  Server will start without database functionality\n');
        }
        
        // Start Express server
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 Understory Superhost Server Running!`);
            console.log('='.repeat(50));
            console.log(`📍 Local:    http://localhost:${PORT}`);
            console.log(`📍 Network:  http://${process.env.DROPLET_IP || 'your-ip'}:${PORT}`);
            console.log(`📊 Admin:    http://localhost:${PORT}/admin`);
            console.log(`🏪 Storefront: http://localhost:${PORT}/storefront/1`);
            console.log(`🔗 API Docs: http://localhost:${PORT}/health`);
            console.log('='.repeat(50));
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📦 Database: ${process.env.DB_DATABASE || 'Not configured'}`);
            console.log('='.repeat(50) + '\n');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;