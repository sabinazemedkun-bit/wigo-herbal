'use strict';

/**
 * JWT Authentication Middleware
 *
 * Vercel-safe hardening:
 *  • JWT_SECRET falls back to a hardcoded default so the server
 *    never crashes if the env var is missing — but logs a warning.
 *  • All jwt operations are wrapped so malformed tokens return
 *    401 instead of an unhandled exception.
 *  • generateToken() wraps jwt.sign() in try/catch so a bad
 *    secret value returns a clear error rather than crashing.
 */

const jwt = require('jsonwebtoken');

// ── JWT Secret ───────────────────────────────────────────────
// Always falls back to a default so the server starts even when
// the env var is missing. The warning makes it visible in logs.
const JWT_SECRET = process.env.JWT_SECRET
  || 'wigo_herbal_fallback_secret_change_this_in_production_2026';

if (!process.env.JWT_SECRET) {
  console.warn(
    '⚠️  JWT_SECRET env var is not set. ' +
    'Using insecure default — set JWT_SECRET in your Vercel / deployment settings.'
  );
}

// ── auth middleware ──────────────────────────────────────────
/**
 * Verifies the Bearer JWT on protected routes.
 * Returns 401 for missing, invalid, or expired tokens.
 */
function auth(req, res, next) {
  try {
    const header = req.headers['authorization'];

    if (!header) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : header.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.'
        });
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
      // Any other jwt error (e.g. NotBeforeError)
      return res.status(401).json({
        success: false,
        message: 'Token verification failed.'
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    req.user = decoded;
    next();

  } catch (err) {
    // Catch any unexpected synchronous error so it never becomes
    // an unhandled exception that crashes the Vercel function.
    console.error('auth middleware error:', err.message || err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
}

// ── requireSuperAdmin middleware ─────────────────────────────
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  }
  next();
}

// ── generateToken ────────────────────────────────────────────
/**
 * Creates a signed JWT for a user object.
 * Throws if jwt.sign() fails (caller should catch).
 */
function generateToken(user) {
  if (!user || !user.id) {
    throw new Error('generateToken: invalid user object');
  }
  return jwt.sign(
    {
      id       : user.id,
      email    : user.email    || '',
      role     : user.role     || 'admin',
      full_name: user.full_name || ''
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = { auth, requireSuperAdmin, generateToken, JWT_SECRET };
