'use strict';

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { login, register, profile, changePassword } = require('../controllers/authController');

const isProd = process.env.NODE_ENV === 'production';

// Stricter rate limiter for login — only active in production
// max:10 prevents brute-force while allowing Vercel cold-start retries
const loginLimiter = rateLimit({
  windowMs        : 15 * 60 * 1000,
  max             : isProd ? 10 : 100,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
});

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// POST /api/auth/register (superadmin only)
router.post('/register', auth, requireSuperAdmin, register);

// GET /api/auth/profile
router.get('/profile', auth, profile);

// PUT /api/auth/change-password
router.put('/change-password', auth, changePassword);

module.exports = router;
