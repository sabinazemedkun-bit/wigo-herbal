// WIGO Herbal — Express Server (Vercel Serverless + Local Dev)
'use strict';

// Load .env only in local development.
// Vercel injects env vars directly — dotenv is not needed in production.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const path        = require('path');
const rateLimit   = require('express-rate-limit');

const app    = express();
const PORT   = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ============================================================
// Trust Proxy — required on Vercel and behind Nginx
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// Compression
// ============================================================
app.use(compression({
  level : 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ============================================================
// Security Headers (Helmet)
// Vercel serves frontend static files directly, so the CSP here
// only needs to cover API responses — not page content.
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,   // CSP is handled in frontend HTML meta tags
  crossOriginEmbedderPolicy: false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// ============================================================
// CORS
// Covers:
//  • Local dev            (localhost:5000, 127.0.0.1:5500)
//  • Vercel preview URLs  (*.vercel.app)
//  • Custom domain        (set FRONTEND_URL env var on Vercel)
// ============================================================
const VERCEL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null;

const allowedOrigins = [
  // Custom domain — set this in Vercel environment variables
  process.env.FRONTEND_URL,
  // Vercel auto-injects VERCEL_URL for the current deployment
  VERCEL_URL,
  // Allow all *.vercel.app preview deployments
  /\.vercel\.app$/,
  // Local development
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);

    // Check against static origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) return cb(null, true);

    console.warn(`CORS blocked: ${origin}`);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials  : true,
  methods      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================
// Rate Limiting
// ============================================================
// General API limiter — applied to all /api/* routes
const apiLimiter = rateLimit({
  windowMs       : 15 * 60 * 1000,
  max            : isProd ? 100 : 500,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : { success: false, message: 'Too many requests. Please try again later.' }
});

app.use('/api/', apiLimiter);

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================
// Logging
// On Vercel there is no writable filesystem — always use stdout.
// Morgan 'dev' for local, 'combined' for production (Vercel captures stdout).
// ============================================================
app.use(morgan(isProd ? 'combined' : 'dev'));

// ============================================================
// Static Files
// Uses process.cwd() as the base — on Vercel this resolves to
// /var/task (the project root), so '../frontend' from backend/
// or 'frontend' from root both work correctly.
// ============================================================
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND_DIR, {
  index       : 'index.html',
  maxAge      : isProd ? '7d' : 0,
  etag        : true,
  lastModified: true
}));

app.use('/uploads', express.static(
  path.join(FRONTEND_DIR, 'assets', 'images'),
  { maxAge: isProd ? '30d' : 0 }
));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/contact',      require('./routes/contact'));

// Health check — used by uptime monitors and Vercel health checks
app.get('/api/health', (_req, res) => {
  res.json({
    success  : true,
    message  : 'WIGO Herbal API is running',
    env      : process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint — checks env vars and DB connectivity
// REMOVE THIS after confirming production works
app.get('/api/debug', async (_req, res) => {
  const { testConnection } = require('./config/database');
  const dbOk = await testConnection();

  res.json({
    env: {
      NODE_ENV    : process.env.NODE_ENV     || 'MISSING',
      DB_HOST     : process.env.DB_HOST      ? process.env.DB_HOST.substring(0, 20) + '...' : 'MISSING',
      DB_PORT     : process.env.DB_PORT      || 'MISSING',
      DB_USER     : process.env.DB_USER      || 'MISSING',
      DB_PASSWORD : process.env.DB_PASSWORD  ? `SET (${process.env.DB_PASSWORD.length} chars)` : 'MISSING',
      DB_NAME     : process.env.DB_NAME      || 'MISSING',
      JWT_SECRET  : process.env.JWT_SECRET   ? `SET (${process.env.JWT_SECRET.length} chars)` : 'MISSING',
      ADMIN_EMAIL : process.env.ADMIN_EMAIL  || 'MISSING'
    },
    db_connected: dbOk
  });
});

// ============================================================
// 404 for unknown /api/* routes
// ============================================================
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ============================================================
// Admin + SPA Fallback
// ============================================================
app.get('/admin*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin', 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ============================================================
// Global Error Handler
// ============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  console.error('Unhandled error:', err.message || err);

  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal server error.' : (err.message || 'Unknown error')
  });
});

// ============================================================
// Start Server (local dev) OR export app (Vercel serverless)
// ============================================================
if (require.main === module) {
  const server = app.listen(PORT, async () => {
    console.log(`\n🌿 WIGO Herbal Server running`);
    console.log(`   URL:   http://localhost:${PORT}`);
    console.log(`   API:   http://localhost:${PORT}/api`);
    console.log(`   Admin: http://localhost:${PORT}/admin/`);
    console.log(`   Mode:  ${process.env.NODE_ENV || 'development'}\n`);

    const { testConnection } = require('./config/database');
    await testConnection();
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM — shutting down gracefully');
    server.close(() => process.exit(0));
  });

} else {
  // Vercel serverless — test DB connection lazily (non-blocking)
  const { testConnection } = require('./config/database');
  testConnection().catch(() => { /* already logged inside testConnection */ });
  console.log(`🌿 WIGO Herbal serverless | ${process.env.NODE_ENV || 'development'}`);
}

module.exports = app;
