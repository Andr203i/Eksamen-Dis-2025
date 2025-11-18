const mysql = require('mysql2/promise');
require('dotenv').config();

// Digital Ocean MySQL Database configuration
const dbConfig = {
    host: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL_MODE === 'REQUIRED' ? {
        rejectUnauthorized: false
    } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Connection pool
let pool = null;

/**
 * Get database connection pool
 */
async function getPool() {
    if (!pool) {
        try {
            pool = mysql.createPool(dbConfig);
            
            // Test connection
            const connection = await pool.getConnection();
            console.log('✅ Connected to Digital Ocean MySQL Database');
            connection.release();
            
            return pool;
        } catch (err) {
            console.error('❌ Database connection failed:', err.message);
            throw err;
        }
    }
    return pool;
}

/**
 * Execute a query with error handling
 */
async function executeQuery(query, params = []) {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute(query, params);
        return { recordset: rows };
    } catch (err) {
        console.error('Query error:', err.message);
        throw err;
    }
}

/**
 * Execute a stored procedure (MySQL version)
 */
async function executeStoredProcedure(procedureName, params = {}) {
    try {
        const pool = await getPool();
        
        const paramValues = Object.values(params);
        const placeholders = paramValues.map(() => '?').join(', ');
        const query = `CALL ${procedureName}(${placeholders})`;
        
        const [rows] = await pool.execute(query, paramValues);
        return { recordset: rows[0] || [] };
    } catch (err) {
        console.error('Stored procedure error:', err.message);
        throw err;
    }
}

/**
 * Close database connection
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Database connection closed');
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});

module.exports = {
    getPool,
    executeQuery,
    executeStoredProcedure,
    closePool
};