// Contact Messages Controller
const db = require('../config/database');

// POST /api/contact  — Public
async function submitMessage(req, res) {
    try {
        const { name, phone, subject, message } = req.body;
        
        await db.execute(
            'INSERT INTO contact_messages (name, phone, subject, message) VALUES (?, ?, ?, ?)',
            [name, phone, subject, message]
        );
        
        res.status(201).json({ success: true, message: 'Message submitted successfully.' });
    } catch (err) {
        console.error('Submit contact error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
}

// GET /api/contact  — Admin
async function getMessages(req, res) {
    try {
        const { is_read, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        let conditions = [];
        let params = [];
        
        if (is_read !== undefined) { conditions.push('is_read = ?'); params.push(parseInt(is_read, 10)); }
        if (search) {
            conditions.push('(name LIKE ? OR subject LIKE ? OR phone LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const limitInt  = parseInt(limit,  10);
        const offsetInt = parseInt(page,   10);
        const offsetVal = (offsetInt - 1) * limitInt;

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM contact_messages ${where}`, params
        );

        const [rows] = await db.query(
            `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offsetVal}`,
            params
        );
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                pages: Math.ceil(total / parseInt(limit, 10))
            }
        });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// PATCH /api/contact/:id/read  — Admin: mark as read
async function markAsRead(req, res) {
    try {
        const [result] = await db.execute(
            'UPDATE contact_messages SET is_read = 1 WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Message not found.' });
        }
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// DELETE /api/contact/:id  — Admin
async function deleteMessage(req, res) {
    try {
        const [result] = await db.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Message not found.' });
        }
        res.json({ success: true, message: 'Message deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = { submitMessage, getMessages, markAsRead, deleteMessage };
