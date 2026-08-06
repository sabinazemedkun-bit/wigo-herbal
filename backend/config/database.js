// Database Configuration — MySQL Connection Pool
// Supports local MySQL AND cloud providers (Aiven, PlanetScale, etc.)
'use strict';

const mysql = require('mysql2/promise');

const {
  DB_HOST     = 'localhost',
  DB_PORT     = '3306',
  DB_USER     = 'root',
  DB_PASSWORD = '',
  DB_NAME     = 'wigo_herbal',
  // DB_SSL=true is required for cloud databases (Aiven, etc.)
  // Leave unset or DB_SSL=false for local MySQL
  DB_SSL      = 'false'
} = process.env;

// Build SSL config — Aiven and most cloud MySQL providers require SSL
const sslConfig = DB_SSL === 'true'
  ? { rejectUnauthorized: false }   // allows self-signed certs on cloud DBs
  : false;

// Create connection pool for better performance and connection reuse
const pool = mysql.createPool({
  host              : DB_HOST,
  port              : Number(DB_PORT),
  user              : DB_USER,
  password          : DB_PASSWORD,
  database          : DB_NAME,
  ssl               : sslConfig,
  waitForConnections: true,
  connectionLimit   : 10,           // max 10 simultaneous connections
  queueLimit        : 0,
  charset           : 'utf8mb4',    // required for Amharic / Ethiopic characters
  timezone          : '+00:00',     // store timestamps in UTC
  connectTimeout    : 20000         // 20 seconds — cloud DBs can be slow to connect
});

// Test connection on startup — fail fast if DB is unreachable
(async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${DB_HOST}:${DB_PORT} | DB: ${DB_NAME} | SSL: ${DB_SSL}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'ECONNREFUSED')       console.error('   → Check DB_HOST and DB_PORT');
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('   → Check DB_USER and DB_PASSWORD');
    if (err.code === 'ER_BAD_DB_ERROR')    console.error('   → Database does not exist — run: node backend/scripts/setup-db.js');
    if (DB_SSL !== 'true')                 console.error('   → If using a cloud database, set DB_SSL=true');
    process.exit(1);
  }
}());

module.exports = pool;
