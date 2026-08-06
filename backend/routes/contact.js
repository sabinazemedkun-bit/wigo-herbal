const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sanitizeBody, validateContact } = require('../middleware/validate');
const { submitMessage, getMessages, markAsRead, deleteMessage } = require('../controllers/contactController');

// Public — submit message
router.post('/', sanitizeBody, validateContact, submitMessage);

// Admin — authenticated
router.get('/',          auth, getMessages);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id',    auth, deleteMessage);

module.exports = router;
