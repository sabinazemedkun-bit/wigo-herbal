const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sanitizeBody, validateService } = require('../middleware/validate');
const {
    getServices, getServiceById, createService, updateService, deleteService
} = require('../controllers/serviceController');

// Multer setup — secure image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../frontend/assets/images'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `service-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const valid = allowedTypes.test(path.extname(file.originalname).toLowerCase())
                   && allowedTypes.test(file.mimetype);
        if (valid) return cb(null, true);
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
});

// Public
router.get('/',    getServices);
router.get('/:id', getServiceById);

// Admin
router.post('/',    auth, upload.single('image'), sanitizeBody, validateService, createService);
router.put('/:id',  auth, upload.single('image'), sanitizeBody, updateService);
router.delete('/:id', auth, deleteService);

module.exports = router;
