// Input Validation & Sanitization Middleware

/**
 * Sanitize a string: trim and remove HTML/script tags to prevent XSS
 */
function sanitize(value) {
    if (typeof value !== 'string') return value;
    return value
        .trim()
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/['"`;]/g, '');  // Block SQL meta-chars from plain strings
}

/**
 * Sanitize an entire req.body object recursively
 */
function sanitizeBody(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}

function sanitizeObject(obj) {
    const clean = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
            clean[key] = sanitize(val);
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            clean[key] = sanitizeObject(val);
        } else {
            clean[key] = val;
        }
    }
    return clean;
}

/**
 * Validate appointment payload
 */
function validateAppointment(req, res, next) {
    const { full_name, gender, age, phone, service, appointment_date, appointment_time, symptoms } = req.body;
    const errors = [];
    
    if (!full_name || full_name.length < 2 || full_name.length > 150)
        errors.push('full_name must be 2–150 characters');
    
    if (!['male', 'female'].includes(gender))
        errors.push('gender must be "male" or "female"');
    
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
        errors.push('age must be between 1 and 120');
    
    if (!phone || !/^[0-9+\s\-()]{7,20}$/.test(phone))
        errors.push('phone must be a valid number');
    
    if (!service || service.length < 2)
        errors.push('service is required');
    
    if (!appointment_date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date))
        errors.push('appointment_date must be YYYY-MM-DD');
    
    if (!appointment_time || !/^\d{2}:\d{2}$/.test(appointment_time))
        errors.push('appointment_time must be HH:MM');
    
    if (!symptoms || symptoms.length < 5)
        errors.push('symptoms must be at least 5 characters');
    
    if (errors.length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
}

/**
 * Validate contact message payload
 */
function validateContact(req, res, next) {
    const { name, phone, subject, message } = req.body;
    const errors = [];
    
    if (!name || name.length < 2 || name.length > 150)
        errors.push('name must be 2–150 characters');
    
    if (!phone || !/^[0-9+\s\-()]{7,20}$/.test(phone))
        errors.push('phone must be a valid number');
    
    if (!subject || subject.length < 2 || subject.length > 300)
        errors.push('subject must be 2–300 characters');
    
    if (!message || message.length < 5)
        errors.push('message must be at least 5 characters');
    
    if (errors.length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
}

/**
 * Validate service payload
 */
function validateService(req, res, next) {
    const { title_en, title_am, description_en, description_am } = req.body;
    const errors = [];
    
    if (!title_en || title_en.length < 2) errors.push('title_en is required');
    if (!title_am || title_am.length < 2) errors.push('title_am is required');
    if (!description_en || description_en.length < 5) errors.push('description_en is required');
    if (!description_am || description_am.length < 5) errors.push('description_am is required');
    
    if (errors.length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
}

module.exports = { sanitizeBody, validateAppointment, validateContact, validateService };
