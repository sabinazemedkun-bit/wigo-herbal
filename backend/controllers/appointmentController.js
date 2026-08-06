// Appointment Controller — Full CRUD + statistics
const db = require('../config/database');

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// POST /api/appointments  — Public: submit new appointment
async function createAppointment(req, res) {
    try {
        const {
            full_name, gender, age, phone, email, address,
            language, service, appointment_date, appointment_time, symptoms, notes
        } = req.body;
        
        const [result] = await db.execute(
            `INSERT INTO appointments
             (full_name, gender, age, phone, email, address, language, service,
              appointment_date, appointment_time, symptoms, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                full_name, gender, parseInt(age, 10),
                phone, email || null, address || null,
                language || 'en', service,
                appointment_date, appointment_time,
                symptoms, notes || null
            ]
        );
        
        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            appointmentId: result.insertId
        });
        
    } catch (err) {
        console.error('Create appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
}

// GET /api/appointments  — Admin: list all with optional filters
async function getAppointments(req, res) {
    try {
        const {
            status, service, date, search,
            page = 1, limit = 20, sort = 'desc'
        } = req.query;
        
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const sortDir = sort === 'asc' ? 'ASC' : 'DESC';
        
        let conditions = [];
        let params = [];
        
        if (status && VALID_STATUSES.includes(status)) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (service) {
            conditions.push('service = ?');
            params.push(service);
        }
        if (date) {
            conditions.push('appointment_date = ?');
            params.push(date);
        }
        if (search) {
            conditions.push('(full_name LIKE ? OR phone LIKE ? OR service LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const limitInt  = parseInt(limit, 10);
        const pageInt   = parseInt(page,  10);
        const offsetVal = (pageInt - 1) * limitInt;

        // Total count
        const [countRows] = await db.execute(
            `SELECT COUNT(*) AS total FROM appointments ${where}`,
            params
        );
        const total = countRows[0].total;

        // Paginated results — use db.query with inline LIMIT/OFFSET to avoid prepared stmt issue
        const [rows] = await db.query(
            `SELECT * FROM appointments ${where}
             ORDER BY created_at ${sortDir}
             LIMIT ${limitInt} OFFSET ${offsetVal}`,
            params
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page  : pageInt,
                limit : limitInt,
                pages : Math.ceil(total / limitInt)
            }
        });
        
    } catch (err) {
        console.error('Get appointments error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// GET /api/appointments/:id  — Admin: single appointment
async function getAppointmentById(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Get appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// PUT /api/appointments/:id  — Admin: update appointment
async function updateAppointment(req, res) {
    try {
        const { status, appointment_date, appointment_time, notes } = req.body;
        
        const updates = [];
        const params = [];
        
        if (status && VALID_STATUSES.includes(status)) { updates.push('status = ?'); params.push(status); }
        if (appointment_date) { updates.push('appointment_date = ?'); params.push(appointment_date); }
        if (appointment_time) { updates.push('appointment_time = ?'); params.push(appointment_time); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update.' });
        }
        
        params.push(req.params.id);
        
        const [result] = await db.execute(
            `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        
        res.json({ success: true, message: 'Appointment updated successfully.' });
        
    } catch (err) {
        console.error('Update appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// DELETE /api/appointments/:id  — Admin: delete appointment
async function deleteAppointment(req, res) {
    try {
        const [result] = await db.execute('DELETE FROM appointments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        res.json({ success: true, message: 'Appointment deleted successfully.' });
    } catch (err) {
        console.error('Delete appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// GET /api/appointments/stats/overview  — Admin: dashboard statistics
async function getStats(req, res) {
    try {
        const [[total]]  = await db.execute('SELECT COUNT(*) AS total FROM appointments');
        const [[pending]] = await db.execute("SELECT COUNT(*) AS n FROM appointments WHERE status='pending'");
        const [[confirmed]] = await db.execute("SELECT COUNT(*) AS n FROM appointments WHERE status='confirmed'");
        const [[completed]] = await db.execute("SELECT COUNT(*) AS n FROM appointments WHERE status='completed'");
        const [[cancelled]] = await db.execute("SELECT COUNT(*) AS n FROM appointments WHERE status='cancelled'");
        
        // Today's appointments
        const [[today]] = await db.execute(
            "SELECT COUNT(*) AS n FROM appointments WHERE DATE(appointment_date) = CURDATE()"
        );
        
        // This month
        const [[thisMonth]] = await db.execute(
            "SELECT COUNT(*) AS n FROM appointments WHERE MONTH(appointment_date) = MONTH(CURDATE()) AND YEAR(appointment_date) = YEAR(CURDATE())"
        );
        
        // Most popular service
        const [topServices] = await db.execute(
            "SELECT service, COUNT(*) AS count FROM appointments GROUP BY service ORDER BY count DESC LIMIT 5"
        );
        
        // Recent appointments
        const [recent] = await db.execute(
            "SELECT id, full_name, service, appointment_date, status FROM appointments ORDER BY created_at DESC LIMIT 10"
        );
        
        res.json({
            success: true,
            stats: {
                total: total.total,
                pending: pending.n,
                confirmed: confirmed.n,
                completed: completed.n,
                cancelled: cancelled.n,
                today: today.n,
                thisMonth: thisMonth.n
            },
            topServices,
            recent
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = {
    createAppointment, getAppointments, getAppointmentById,
    updateAppointment, deleteAppointment, getStats
};
