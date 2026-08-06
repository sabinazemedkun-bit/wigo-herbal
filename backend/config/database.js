'use strict';

/**
 * WIGO Herbal — MySQL Connection Pool
 * ─────────────────────────────────────────────────────────────
 * Uses mysql2/promise so every pool method (execute, query,
 * getConnection) returns a Promise — fully compatible with all
 * existing async/await calls throughout the controllers.
 *
 * SSL is always enabled with rejectUnauthorized: false so the
 * pool works on:
 *   • Aiven Cloud MySQL    (requires SSL, self-signed cert)
 *   • Clever Cloud MySQL   (requires SSL)
 *   • Local MySQL dev      (SSL option is silently ignored when
 *                           the server doesn't enforce it)
 *   • Vercel serverless    (each invocation creates a new pool;
 *                           connectTimeout keeps cold starts fast)
 */

const mysql = require('mysql2/promise');

// ── Environment variables ────────────────────────────────────
const DB_HOST     = process.env.DB_HOST;
const DB_USER     = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME     = process.env.DB_NAME;
const DB_PORT     = process.env.DB_PORT || 28836;   // Aiven default port

// ── Connection pool ──────────────────────────────────────────
const pool = mysql.createPool({
  host    : DB_HOST,
  port    : Number(DB_PORT),
  user    : DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,

  // SSL — required by Aiven, Clever Cloud, and most managed MySQL.
  // rejectUnauthorized: false accepts Aiven's self-signed certificate.
  ssl: {
    rejectUnauthorized: false
  },

  // Pool behaviour
  waitForConnections: true,
  connectionLimit   : 10,    // max simultaneous connections
  queueLimit        : 0,     // unlimited queue (0 = no limit)

  // Encoding — utf8mb4 supports Amharic / Ethiopic characters
  charset: 'utf8mb4',

  // Store all timestamps in UTC
  timezone: '+00:00',

  // Cloud MySQL can be slow on first connect (cold start)
  connectTimeout: 20000      // 20 seconds
});

// ── Startup connectivity test ────────────────────────────────
// Runs once when the module is first required.
// On Vercel serverless each function invocation may import this
// module fresh, so the test runs per cold start — lightweight
// because it only borrows and immediately releases one connection.
(async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log('✅ Database connected successfully');
    console.log(`   Host: ${DB_HOST}:${DB_PORT} | DB: ${DB_NAME} | SSL: on`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);

    // Actionable hints for the most common failures
    if (err.code === 'ECONNREFUSED')
      console.error('   → DB_HOST / DB_PORT is wrong or MySQL is not running');
    if (err.code === 'ER_ACCESS_DENIED_ERROR')
      console.error('   → DB_USER or DB_PASSWORD is incorrect');
    if (err.code === 'ER_BAD_DB_ERROR')
      console.error('   → Database does not exist — run: node backend/scripts/setup-db.js');
    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME)
      console.error('   → One or more DB_* environment variables are missing');

    // Exit so the process (or Vercel invocation) fails visibly
    // instead of silently serving broken responses.
    process.exit(1);
  }
}());

// ── Export ───────────────────────────────────────────────────
// Exported as the pool itself (not pool.promise()) because
// mysql2/promise's createPool already returns a promise-enabled
// pool — db.execute(), db.query(), db.getConnection() all work
// directly without any extra .promise() call.
module.exports = pool;
