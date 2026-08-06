// Auth Controller — Login / Register / Profile
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 12;

// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        
        // Find user by email — use parameterized query to prevent SQL injection
        const [rows] = await db.execute(
            'SELECT id, full_name, email, password, role FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        
        const user = rows[0];
        
        // Compare password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        
        // Generate JWT
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
}

// POST /api/auth/register  (superadmin only — create additional admin accounts)
async function register(req, res) {
    try {
        const { full_name, email, password, role } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'full_name, email, and password are required.' });
        }
        
        // Check password strength
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }
        
        // Check if email already exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [full_name.trim(), email.trim().toLowerCase(), hashedPassword, role === 'superadmin' ? 'superadmin' : 'admin']
        );
        
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully.',
            userId: result.insertId
        });
        
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
}

// GET /api/auth/profile  (authenticated route)
async function profile(req, res) {
    try {
        const [rows] = await db.execute(
            'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        
        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both passwords are required.' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
        }
        
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
        
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        
        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
        
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = { login, register, profile, changePassword };
