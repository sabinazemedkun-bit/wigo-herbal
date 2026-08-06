'use strict';

/**
 * WIGO Herbal — MySQL Connection Pool
 * ─────────────────────────────────────────────────────────────
 * mysql2/promise pool — all db.execute() / db.query() calls
 * across the controllers work without any extra .promise() call.
 *
 * Vercel-safe:
 *  • Never calls process.exit() — would kill the serverless fn
 *  • Startup test is lazy (runs on first query, not on import)
 *  • Pool-level error events are caught so unhandled rejections
 *    don't trigger FUNCTION_INVOCATION_FAILED
 */

const mysql = require('mysql2/promise');

// ── Guard: warn loudly if env vars are missing but don't crash ─
const DB_HOST     = process.env.DB_HOST     || null;
const DB_USER     = process.env.DB_USER     || null;
const DB_PASSWORD = process.env.DB_PASSWORD || null;
const DB_NAME     = process.env.DB_NAME     || null;
const DB_PORT     = Number(process.env.DB_PORT) || 28836;  // Aiven default

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  // Log a clear warning — individual API handlers will return 503
  // when they try to use the pool, rather than crashing the process.
  console.warn(
    '⚠️  Database env vars missing — ' +
    'DB_HOST/DB_USER/DB_PASSWORD/DB_NAME must be set in Vercel settings. ' +
    'API calls requiring the DB will return 503 until they are configured.'
  );
}

// ── Connection pool ──────────────────────────────────────────
let pool;

try {
  pool = mysql.createPool({
    host    : DB_HOST,
    port    : DB_PORT,
    user    : DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,

    // SSL — required by Aiven / Clever Cloud managed MySQL.
    // rejectUnauthorized: false accepts the provider's self-signed cert.
    // Local MySQL silently ignores this option.
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

    // Cloud DBs can be slow to accept connections on cold start
    connectTimeout: 20000
  });

  // ── Swallow pool-level errors ─────────────────────────────
  // Without this listener, any pool error (e.g. network blip
  // after initial connection) throws an uncaught exception that
  // Vercel treats as FUNCTION_INVOCATION_FAILED.
  pool.pool.on('error', (err) => {
    console.error('MySQL pool error (non-fatal):', err.message);
    // Do NOT re-throw or call process.exit() here.
    // The next query attempt will automatically try to reconnect.
  });

} catch (createErr) {
  // mysql.createPool itself threw — almost always a bad option value.
  // Log it and export a dummy pool so server.js can still start.
  console.error('Failed to create MySQL pool:', createErr.message);
  pool = null;
}

// ── Lazy connectivity test ───────────────────────────────────
// Called once by server.js AFTER express is set up, not at module
// import time — this way a DB hiccup on cold start doesn't prevent
// Vercel from even serving the health-check endpoint.
async function testConnection() {
  if (!pool) {
    console.error('❌ Pool was not created — check env vars and restart.');
    return false;
  }
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connected');
    console.log(`   ${DB_HOST}:${DB_PORT}  db=${DB_NAME}  ssl=on`);
    return true;
  } catch (err) {
    // Log but DO NOT call process.exit() — Vercel would report 500
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'ECONNREFUSED')
      console.error('   → Check DB_HOST / DB_PORT');
    if (err.code === 'ER_ACCESS_DENIED_ERROR')
      console.error('   → Check DB_USER / DB_PASSWORD');
    if (err.code === 'ER_BAD_DB_ERROR')
      console.error('   → DB does not exist — run setup-db.js');
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
