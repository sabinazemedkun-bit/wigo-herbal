const express = require('express');
const router = express.Router();
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { login, register, profile, changePassword } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register  (superadmin only)
router.post('/register', auth, requireSuperAdmin, register);

// GET /api/auth/profile
router.get('/profile', auth, profile);

// PUT /api/auth/change-password
router.put('/change-password', auth, changePassword);

module.exports = router;
