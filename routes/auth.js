const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { logger } = require('../middleware/logging');

// JWT secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email og password er påkrævet' 
            });
        }
        
        logger.info(`Login attempt for: ${email}`);
        
        // Find user by email (protected against SQL injection with parameterized query)
        const query = `
            SELECT 
                user_id, 
                email, 
                password_hash, 
                role, 
                host_id, 
                name,
                is_active
            FROM users 
            WHERE email = ? AND is_active = TRUE
        `;
        
        const result = await executeQuery(query, [email]);
        
        if (!result.recordset || result.recordset.length === 0) {
            logger.warn(`Login failed: User not found - ${email}`);
            return res.status(401).json({ 
                success: false, 
                error: 'Forkert email eller password' 
            });
        }
        
        const user = result.recordset[0];
        
        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            logger.warn(`Login failed: Wrong password - ${email}`);
            return res.status(401).json({ 
                success: false, 
                error: 'Forkert email eller password' 
            });
        }
        
        // Update last login time
        await executeQuery(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );
        
        // Create JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                role: user.role,
                hostId: user.host_id,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        logger.info(`Login successful: ${email} (${user.role})`);
        
        // Set JWT as httpOnly cookie
        res.cookie('auth_token', token, {
            httpOnly: true, // Prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Send response
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                userId: user.user_id,
                email: user.email,
                role: user.role,
                hostId: user.host_id,
                name: user.name
            }
        });
        
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Der skete en fejl ved login' 
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout and clear JWT cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ 
        success: true, 
        message: 'Logout successful' 
    });
});

/**
 * GET /api/auth/me
 * Get current user info from JWT token
 */
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * Middleware: Authenticate JWT token
 */
function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Ikke godkendt - log venligst ind' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('JWT verification failed:', error.message);
        return res.status(403).json({ 
            success: false, 
            error: 'Ugyldig eller udløbet session' 
        });
    }
}

/**
 * Middleware: Require admin role
 */
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Admin adgang påkrævet' 
        });
    }
    next();
}

/**
 * Middleware: Require host role
 */
function requireHost(req, res, next) {
    if (req.user.role !== 'host') {
        return res.status(403).json({ 
            success: false, 
            error: 'Host adgang påkrævet' 
        });
    }
    next();
}

module.exports = {
    router,
    authenticateToken,
    requireAdmin,
    requireHost
};