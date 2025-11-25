require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import database
const { getPool } = require('./config/database');

// Import routes
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const twilioWebhookRoutes = require('./routes/twilio-webhook');
const authRoutes = require('./routes/auth');

// Import middleware
const { securityMiddleware, rateLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/logging');

const app = express();


// Express skal vide at den står bag Nginx / load balancer
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4545;

// ==========================================
// MIDDLEWARE SETUP
// ==========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'http://spstudio.app',
            'https://spstudio.app',
            'http://www.spstudio.app',
            'https://www.spstudio.app',
            `http://${process.env.DROPLET_IP}:${PORT}`,
            process.env.BASE_URL
        ]
        : '*',
    credentials: true
}));

// Request logging
app.use(morgan('dev'));
app.use(requestLogger);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser(process.env.SESSION_SECRET));

// Rate limiting for Twilio webhook
app.use('/api/twilio', rateLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/twilio', twilioWebhookRoutes);
app.use('/api/auth', authRoutes.router);

// ==========================================
// FRONTEND ROUTES
// ==========================================

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

app.get('/login/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

// Dashboard - Host only
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/dashboard/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

// Performance page
app.get('/performance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'performance', 'index.html'));
});

app.get('/performance/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'performance', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Community/Leaderboard page
app.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'community', 'index.html'));
});

app.get('/community/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'community', 'index.html'));
});

// Storefront (public-facing)
app.get('/storefront/:hostId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'storefront', 'index.html'));
});

// Root redirect to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        message: 'The requested resource was not found on this server'
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
        console.log('Testing database connection...');
        try {
            await getPool();
            console.log('Database connected successfully!\n');
        } catch (dbError) {
            console.log('Database connection failed:', dbError.message);
            console.log('Server will start without database functionality\n');
        }
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(60));
            console.log(`Understory Superhost Server Running!`);
            console.log('='.repeat(60));
            console.log(`Local:      http://localhost:${PORT}`);
            console.log(`Network:    http://${process.env.DROPLET_IP}:${PORT}`);
            console.log(`Domain:     http://spstudio.app`);
            console.log('='.repeat(60));
            console.log(`Login:      http://spstudio.app/login`);
            console.log(`Dashboard:  http://spstudio.app/dashboard`);
            console.log(`Performance: http://spstudio.app/performance`);
            console.log(`Community:  http://spstudio.app/community`);
            console.log(`Admin:      http://spstudio.app/admin`);
            console.log(`Storefront: http://spstudio.app/storefront/1`);
            console.log(`Health:     http://spstudio.app/health`);
            console.log('='.repeat(60));
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: ${process.env.DB_DATABASE || 'Not configured'}`);
            console.log('='.repeat(60) + '\n');
        });
        
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nSIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;