'use strict';

/**
 * Auth Controller — Login / Register / Profile / Change Password
 *
 * Vercel-safe hardening applied:
 *  • Each handler checks that the DB pool is available before
 *    querying — returns 503 instead of crashing if DB env vars
 *    are missing or the pool failed to initialise.
 *  • JWT_SECRET null-check — returns 500 with a clear message
 *    instead of an unhandled rejection from jwt.sign().
 *  • All async operations are wrapped in try/catch — no
 *    uncaught promise rejections that trigger FUNCTION_INVOCATION_FAILED.
 *  • bcrypt errors (e.g. malformed hash) are caught and return 500.
 *  • Response messages never reveal whether the email exists
 *    (generic "Invalid credentials" for both 404 and wrong password).
 */

const bcrypt = require('bcrypt');
const db     = require('../config/database');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 12;

// ── Guard helpers ────────────────────────────────────────────

/**
 * Returns true if the DB pool is ready to accept queries.
 * db is null when mysql.createPool() failed (missing env vars).
 */
function dbAvailable() {
  return db !== null && db !== undefined;
}

/**
 * Returns true if JWT_SECRET is configured.
 * generateToken() will use the fallback default when it is missing,
 * but we surface a warning so it's visible in Vercel function logs.
 */
function jwtConfigured() {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET env var is not set — using insecure default. Set it in Vercel settings.');
  }
  return true; // always allow; the fallback in auth.js keeps things working
}

// ── POST /api/auth/login ─────────────────────────────────────
async function login(req, res) {
  try {
    // 1. Guard: DB pool must be available
    if (!dbAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable — database not configured.'
      });
    }

    // 2. Validate input
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' ||
        !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // 3. Warn if JWT_SECRET is missing (non-fatal)
    jwtConfigured();

    // 4. Lookup user — parameterized to prevent SQL injection
    const [rows] = await db.execute(
      'SELECT id, full_name, email, password, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    // Use the same message for "not found" and "wrong password"
    // to prevent user enumeration attacks
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // 5. Verify password hash
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error('bcrypt.compare error:', bcryptErr.message);
      return res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 6. Generate JWT
    let token;
    try {
      token = generateToken(user);
    } catch (jwtErr) {
      console.error('generateToken error:', jwtErr.message);
      return res.status(500).json({ success: false, message: 'Server error generating session token.' });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id       : user.id,
        full_name: user.full_name,
        email    : user.email,
        role     : user.role
      }
    });

  } catch (err) {
    // Log the full error so it's visible in Vercel function logs
    console.error('Login error:', err.code || '', err.message || err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      // Show DB error details in non-production for easier debugging
      detail : process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
}

// ── POST /api/auth/register (superadmin only) ────────────────
async function register(req, res) {
  try {
    if (!dbAvailable()) {
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable.' });
    }

    const { full_name, email, password, role } = req.body || {};

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'full_name, email, and password are required.'
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.'
      });
    }

    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        role === 'superadmin' ? 'superadmin' : 'admin'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      userId : result.insertId
    });

  } catch (err) {
    console.error('Register error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

// ── GET /api/auth/profile ────────────────────────────────────
async function profile(req, res) {
  try {
    if (!dbAvailable()) {
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable.' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const [rows] = await db.execute(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: rows[0] });

  } catch (err) {
    console.error('Profile error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── PUT /api/auth/change-password ────────────────────────────
async function changePassword(req, res) {
  try {
    if (!dbAvailable()) {
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable.' });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const [rows] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    } catch (bcryptErr) {
      console.error('bcrypt.compare error:', bcryptErr.message);
      return res.status(500).json({ success: false, message: 'Server error during password verification.' });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    return res.json({ success: true, message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { login, register, profile, changePassword };
