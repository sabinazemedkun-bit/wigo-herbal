// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wigo_herbal_secret_key_2026_change_in_production';

/**
 * Verify JWT token from Authorization header
 * Usage: router.get('/protected', auth, (req, res) => {...})
 */
function auth(req, res, next) {
    try {
        // Support Bearer token or direct token
        const header = req.headers['authorization'];
        const token = header && header.startsWith('Bearer ')
            ? header.slice(7)
            : header;
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
}

/**
 * Require superadmin role
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
}

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

module.exports = { auth, requireSuperAdmin, generateToken, JWT_SECRET };
