const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sanitizeBody, validateAppointment } = require('../middleware/validate');
const {
    createAppointment, getAppointments, getAppointmentById,
    updateAppointment, deleteAppointment, getStats
} = require('../controllers/appointmentController');

// Public — book appointment
router.post('/', sanitizeBody, validateAppointment, createAppointment);

// Admin — must be authenticated for all routes below
router.get('/stats/overview', auth, getStats);
router.get('/', auth, getAppointments);
router.get('/:id', auth, getAppointmentById);
router.put('/:id', auth, sanitizeBody, updateAppointment);
router.delete('/:id', auth, deleteAppointment);

module.exports = router;
