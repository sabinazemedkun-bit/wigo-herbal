// WIGO Herbal — Express Server (Production-Hardened)
'use strict';

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const fs          = require('fs');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ============================================================
// Trust Proxy — required behind Nginx reverse proxy
// ============================================================
if (isProd) app.set('trust proxy', 1);

// ============================================================
// Compression — gzip all responses
// ============================================================
app.use(compression({
    level  : 6,
    filter : (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// ============================================================
// Security Headers (Helmet)
// ============================================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc : ["'self'"],
            styleSrc   : ["'self'", "'unsafe-inline'",
                          'https://fonts.googleapis.com',
                          'https://cdnjs.cloudflare.com'],
            fontSrc    : ["'self'", 'https://fonts.gstatic.com',
                          'https://cdnjs.cloudflare.com', 'data:'],
            scriptSrc  : ["'self'", "'unsafe-inline'",
                          'https://cdnjs.cloudflare.com'],
            imgSrc     : ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc : ["'self'"],
            frameSrc   : ["'self'", 'https://www.google.com']
        }
    },
    crossOriginEmbedderPolicy: false,
    // HSTS — only in production (nginx also sets it)
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// ============================================================
// CORS
// ============================================================
const allowedOrigins = [
    `https://${process.env.DOMAIN || 'wigoherbal.com'}`,
    `https://www.${process.env.DOMAIN || 'wigoherbal.com'}`,
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials  : true,
    methods      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================
// Rate Limiting
// ============================================================
app.use('/api/', rateLimit({
    windowMs         : 15 * 60 * 1000,
    max              : isProd ? 100 : 500,
    standardHeaders  : true,
    legacyHeaders    : false,
    message          : { success: false, message: 'Too many requests. Please try again later.' }
}));

app.use('/api/auth/login', rateLimit({
    windowMs         : 15 * 60 * 1000,
    max              : isProd ? 5 : 20,
    standardHeaders  : true,
    legacyHeaders    : false,
    message          : { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
}));

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================
// Logging
// ============================================================
if (isProd) {
    // In production: write combined logs to file
    const logDir = '/var/log/wigo-herbal';
    try {
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const accessLog = fs.createWriteStream(
            path.join(logDir, 'access.log'),
            { flags: 'a' }
        );
        app.use(morgan('combined', { stream: accessLog }));
    } catch {
        // Fallback if log dir not writable (e.g. Windows dev)
        app.use(morgan('combined'));
    }
} else {
    app.use(morgan('dev'));
}

// ============================================================
// Static Files — serve entire frontend folder
// ============================================================
app.use(express.static(path.join(__dirname, '../frontend'), {
    index   : 'index.html',
    maxAge  : isProd ? '7d' : 0,   // cache static assets for 7 days in prod
    etag    : true,
    lastModified: true
}));

// Uploaded images
app.use('/uploads', express.static(
    path.join(__dirname, '../frontend/assets/images'),
    { maxAge: isProd ? '30d' : 0 }
));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/contact',      require('./routes/contact'));

// Health check — used by load balancers & uptime monitors
app.get('/api/health', (_req, res) => {
    res.json({
        success  : true,
        message  : 'WIGO Herbal API is running',
        env      : process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 404 for unknown API routes
// ============================================================
app.use('/api/*', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ============================================================
// SPA Fallback
// Admin paths → admin/index.html
// All others  → index.html
// ============================================================
app.get('*', (req, res) => {
    if (req.path.startsWith('/admin')) {
        return res.sendFile(
            path.join(__dirname, '../frontend/admin/index.html')
        );
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
// Global Error Handler
// ============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    // Don't log CORS errors as fatal
    if (err.message && err.message.startsWith('CORS blocked')) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    console.error('Unhandled error:', err.message);

    if (err.message && err.message.includes('Only JPEG')) {
        return res.status(400).json({ success: false, message: err.message });
    }

    res.status(err.status || 500).json({
        success: false,
        message: isProd ? 'Internal server error' : err.message
    });
});

// ============================================================
// Start Server (local dev) OR export app (Vercel/serverless)
// ============================================================
if (require.main === module) {
  // Running directly with node — start the HTTP server
  const server = app.listen(PORT, () => {
    console.log(`\n🌿 WIGO Herbal Server running`);
    console.log(`   URL:       http://localhost:${PORT}`);
    console.log(`   API:       http://localhost:${PORT}/api`);
    console.log(`   Admin:     http://localhost:${PORT}/admin/`);
    console.log(`   Mode:      ${process.env.NODE_ENV || 'development'}\n`);
  });

  // Graceful shutdown — for PM2 / Docker
  process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

} else {
  // Imported as a module (Vercel serverless / index.js)
  console.log(`🌿 WIGO Herbal running in serverless mode | Mode: ${process.env.NODE_ENV || 'development'}`);
}

// Export the Express app for Vercel
module.exports = app;
