'use strict';

/**
 * WIGO Herbal — MySQL Connection Pool
 * ─────────────────────────────────────────────────────────────
 * mysql2/promise pool — Vercel serverless safe.
 *
 * ENOTFOUND fix: all env vars are trimmed and stripped of
 * surrounding quotes before use — copy-paste from Vercel UI
 * sometimes injects invisible whitespace or quote characters.
 */

const mysql = require('mysql2/promise');

// ── Sanitize helper ──────────────────────────────────────────
// Removes surrounding whitespace and accidental quote chars that
// can appear when copy-pasting into Vercel environment variables.
function sanitizeEnv(value) {
  if (value === undefined || value === null) return null;
  return String(value)
    .trim()
    .replace(/^["']|["']$/g, '');  // strip leading/trailing quotes
}

// ── Read and sanitize every DB env var ───────────────────────
const DB_HOST     = sanitizeEnv(process.env.DB_HOST);
const DB_USER     = sanitizeEnv(process.env.DB_USER);
const DB_PASSWORD = sanitizeEnv(process.env.DB_PASSWORD);
const DB_NAME     = sanitizeEnv(process.env.DB_NAME);
const DB_PORT     = sanitizeEnv(process.env.DB_PORT);
const DB_PORT_NUM = DB_PORT ? parseInt(DB_PORT, 10) : 16356; // Aiven default

// ── Validate ─────────────────────────────────────────────────
const MISSING = [];
if (!DB_HOST)     MISSING.push('DB_HOST');
if (!DB_USER)     MISSING.push('DB_USER');
if (!DB_PASSWORD) MISSING.push('DB_PASSWORD');
if (!DB_NAME)     MISSING.push('DB_NAME');

const DB_VARS_OK = MISSING.length === 0;

if (!DB_VARS_OK) {
  console.error(
    `❌ MISSING DATABASE ENV VARS: ${MISSING.join(', ')}\n` +
    '   Go to Vercel → Project → Settings → Environment Variables and add them.\n' +
    '   Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT'
  );
} else {
  // Log sanitized values (never log the password)
  console.log('🔌 DB config loaded:');
  console.log(`   HOST=${DB_HOST}  PORT=${DB_PORT_NUM}  DB=${DB_NAME}  USER=${DB_USER}`);

  // Catch common ENOTFOUND causes — hostname must not start with
  // whitespace, quotes, or contain "MISSING" as a placeholder
  if (DB_HOST.startsWith(' ') || DB_HOST.includes('"') || DB_HOST === 'MISSING') {
    console.error(`❌ DB_HOST looks invalid: "${DB_HOST}" — check Vercel env var`);
  }

  if (isNaN(DB_PORT_NUM) || DB_PORT_NUM < 1 || DB_PORT_NUM > 65535) {
    console.error(`❌ DB_PORT is not a valid port number: "${DB_PORT}" — defaulting to 16356`);
  }
}

// ── Connection pool ──────────────────────────────────────────
let pool = null;

if (DB_VARS_OK) {
  try {
    pool = mysql.createPool({
      host    : DB_HOST,
      port    : DB_PORT_NUM,
      user    : DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,

      // SSL — required by Aiven MySQL
      ssl: {
        rejectUnauthorized: false
      },

      // Pool behaviour
      waitForConnections: true,
      connectionLimit   : 10,
      queueLimit        : 0,

      // utf8mb4 — required for Amharic / Ethiopic characters
      charset: 'utf8mb4',

      // Store timestamps in UTC
      timezone: '+00:00',

      // Cloud DBs can be slow on cold start
      connectTimeout: 30000
    });

    // Swallow pool-level errors — prevent uncaught exception crashes
    // pool.pool is the underlying mysql2 Pool (promise wrapper exposes it)
    if (pool && pool.pool && typeof pool.pool.on === 'function') {
      pool.pool.on('error', (err) => {
        console.error('MySQL pool error (non-fatal):', err.code, err.message);
      });
    }

    console.log(`✅ MySQL pool created → ${DB_HOST}:${DB_PORT_NUM}/${DB_NAME}`);

  } catch (createErr) {
    console.error('❌ Failed to create MySQL pool:', createErr.message);
    pool = null;
  }
}

// ── Lazy connectivity test ───────────────────────────────────
async function testConnection() {
  if (!pool) {
    console.error('❌ Cannot test — pool not created (missing env vars)');
    return false;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    console.log(`✅ Database connected: ${DB_HOST}:${DB_PORT_NUM}/${DB_NAME} [SSL on]`);
    return true;

  } catch (err) {
    console.error('❌ Database connection test failed:', err.code, err.message);

    if (err.code === 'ENOTFOUND') {
      console.error(`   → Hostname "${DB_HOST}" could not be resolved.`);
      console.error('   → Check DB_HOST in Vercel env vars — no spaces, quotes, or typos.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error(`   → Connection refused at ${DB_HOST}:${DB_PORT_NUM}`);
      console.error('   → Check DB_PORT is correct (Aiven port is usually 5-digits, e.g. 16356)');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Wrong DB_USER or DB_PASSWORD');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`   → Database "${DB_NAME}" does not exist — run: node backend/scripts/setup-db.js`);
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
      console.error('   → Connection timed out — Aiven IP allowlist may be blocking the request.');
      console.error('   → Set IP filter to 0.0.0.0/0 in Aiven console.');
    }
    return false;

  } finally {
    if (conn) conn.release();
  }
}

module.exports        = pool;
module.exports.testConnection = testConnection;
module.exports.DB_VARS_OK     = DB_VARS_OK;
