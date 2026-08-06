/**
 * WIGO Herbal — Database Connectivity Check
 * -----------------------------------------
 * Used by Render.com health startup and CI/CD pipelines.
 * Run manually: node backend/scripts/check-db.js
 *
 * Exit codes:
 *   0 — connected successfully
 *   1 — connection failed (Render will retry / alert)
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const {
  DB_HOST     = 'localhost',
  DB_PORT     = '3306',
  DB_USER     = 'root',
  DB_PASSWORD = '',
  DB_NAME     = 'wigo_herbal'
} = process.env;

async function checkDB() {
  let conn;
  const start = Date.now();

  try {
    conn = await mysql.createConnection({
      host            : DB_HOST,
      port            : Number(DB_PORT),
      user            : DB_USER,
      password        : DB_PASSWORD,
      database        : DB_NAME,
      charset         : 'utf8mb4',
      connectTimeout  : 10000   // 10 second timeout
    });

    // Verify connection is alive
    const [[result]] = await conn.execute('SELECT 1 AS ok');
    const ms = Date.now() - start;

    if (result.ok !== 1) throw new Error('Unexpected query result');

    // Check all required tables exist
    const [tables] = await conn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN
       ('users','appointments','services','contact_messages')`,
      [DB_NAME]
    );

    const found    = tables.map(t => t.TABLE_NAME).sort();
    const required = ['appointments', 'contact_messages', 'services', 'users'];
    const missing  = required.filter(t => !found.includes(t));

    if (missing.length > 0) {
      console.error(`❌ Missing tables: ${missing.join(', ')}`);
      console.error('   Run: node backend/scripts/setup-db.js');
      process.exit(1);
    }

    // Check at least one admin user exists
    const [[{ count }]] = await conn.execute(
      'SELECT COUNT(*) AS count FROM users WHERE role IN (\'admin\',\'superadmin\')'
    );

    console.log('✅ Database connection OK');
    console.log(`   Host    : ${DB_HOST}:${DB_PORT}`);
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Tables  : ${found.join(', ')}`);
    console.log(`   Admins  : ${count}`);
    console.log(`   Latency : ${ms}ms`);

    process.exit(0);

  } catch (err) {
    const ms = Date.now() - start;
    console.error('❌ Database connection FAILED');
    console.error(`   Host    : ${DB_HOST}:${DB_PORT}`);
    console.error(`   Database: ${DB_NAME}`);
    console.error(`   Error   : ${err.message}`);
    console.error(`   After   : ${ms}ms`);

    if (err.code === 'ECONNREFUSED')    console.error('   → MySQL server is not running or wrong host/port');
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('   → Wrong DB_USER or DB_PASSWORD');
    if (err.code === 'ER_BAD_DB_ERROR') console.error('   → Database does not exist — run setup-db.js first');

    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

checkDB();
