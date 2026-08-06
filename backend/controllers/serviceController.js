// Service Controller — Full CRUD
const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// GET /api/services  — Public
async function getServices(req, res) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Get services error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// GET /api/services/:id  — Public
async function getServiceById(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Get service error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// POST /api/services  — Admin
async function createService(req, res) {
    try {
        const { title_en, title_am, description_en, description_am, sort_order } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;
        
        const [result] = await db.execute(
            `INSERT INTO services (title_en, title_am, description_en, description_am, image, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title_en, title_am, description_en, description_am, image, sort_order || 0]
        );
        
        res.status(201).json({
            success: true,
            message: 'Service created successfully.',
            serviceId: result.insertId
        });
    } catch (err) {
        console.error('Create service error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// PUT /api/services/:id  — Admin
async function updateService(req, res) {
    try {
        const { title_en, title_am, description_en, description_am, sort_order, is_active } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;
        
        const updates = [];
        const params = [];
        
        if (title_en)       { updates.push('title_en = ?');       params.push(title_en); }
        if (title_am)       { updates.push('title_am = ?');       params.push(title_am); }
        if (description_en) { updates.push('description_en = ?'); params.push(description_en); }
        if (description_am) { updates.push('description_am = ?'); params.push(description_am); }
        if (image)          { updates.push('image = ?');          params.push(image); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
        if (is_active !== undefined)  { updates.push('is_active = ?');  params.push(is_active ? 1 : 0); }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update.' });
        }
        
        params.push(req.params.id);
        const [result] = await db.execute(
            `UPDATE services SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }
        
        res.json({ success: true, message: 'Service updated successfully.' });
    } catch (err) {
        console.error('Update service error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// DELETE /api/services/:id  — Admin
async function deleteService(req, res) {
    try {
        const [rows] = await db.execute('SELECT image FROM services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }
        
        // Remove image file if it exists
        if (rows[0].image) {
            const filePath = path.join(__dirname, '..', '..', 'frontend', 'assets', rows[0].image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        await db.execute('DELETE FROM services WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Service deleted successfully.' });
    } catch (err) {
        console.error('Delete service error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = { getServices, getServiceById, createService, updateService, deleteService };
