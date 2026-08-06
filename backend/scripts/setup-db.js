'use strict';

/**
 * WIGO Herbal — Database Setup Script
 * ─────────────────────────────────────────────────────────────
 * Runs once to create all tables and seed the admin user.
 *
 * Works with:
 *   • Local MySQL    — run: node backend/scripts/setup-db.js
 *   • Aiven MySQL    — the script skips CREATE DATABASE because
 *                      Aiven does not grant that privilege.
 *                      Set DB_NAME=defaultdb (Aiven's database).
 *   • Any cloud MySQL that pre-creates the database.
 *
 * Usage:
 *   node backend/scripts/setup-db.js
 *
 * Required env vars (set in .env for local, Vercel env for cloud):
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 */

// Load .env for local dev only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

const {
  DB_HOST        = 'localhost',
  DB_PORT        = '3306',
  DB_USER        = 'root',
  DB_PASSWORD    = '',
  DB_NAME        = 'defaultdb',         // Aiven default — override via env
  ADMIN_EMAIL    = 'admin@wigoherbal.com',
  ADMIN_PASSWORD = 'Admin@Wigo2026'
} = process.env;

function ok(msg)   { console.log('  ✅ ' + msg); }
function info(msg) { console.log('  ℹ️  ' + msg); }
function fail(msg) { console.error('  ❌ ' + msg); }

async function main() {
  console.log('\n🌿 WIGO Herbal — Database Setup\n');
  console.log(`  Host    : ${DB_HOST}:${DB_PORT}`);
  console.log(`  User    : ${DB_USER}`);
  console.log(`  Database: ${DB_NAME}\n`);

  let conn;
  try {
    // ── Connect directly to the target database ─────────────
    // We do NOT connect without a database first, because on
    // Aiven the user only has privileges on their own database.
    conn = await mysql.createConnection({
      host    : DB_HOST,
      port    : Number(DB_PORT),
      user    : DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,              // connect straight to DB_NAME
      ssl     : { rejectUnauthorized: false },   // required for Aiven
      charset : 'utf8mb4',
      connectTimeout: 20000
    });

    ok(`Connected to "${DB_NAME}"`);

    // Use query() for DDL — execute() uses prepared statements
    // which don't support CREATE TABLE on older MySQL versions
    const ddl = (sql) => conn.query(sql);

    // ── users ────────────────────────────────────────────────
    await ddl(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        full_name   VARCHAR(150)    NOT NULL,
        email       VARCHAR(200)    NOT NULL UNIQUE,
        password    VARCHAR(255)    NOT NULL,
        role        ENUM('admin','superadmin') NOT NULL DEFAULT 'admin',
        created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    ok('Table: users');

    // ── appointments ─────────────────────────────────────────
    await ddl(`
      CREATE TABLE IF NOT EXISTS appointments (
        id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        full_name         VARCHAR(150)    NOT NULL,
        gender            ENUM('male','female') NOT NULL,
        age               TINYINT UNSIGNED NOT NULL,
        phone             VARCHAR(20)     NOT NULL,
        email             VARCHAR(200)    DEFAULT NULL,
        address           VARCHAR(300)    DEFAULT NULL,
        language          ENUM('en','am') NOT NULL DEFAULT 'en',
        service           VARCHAR(100)    NOT NULL,
        appointment_date  DATE            NOT NULL,
        appointment_time  TIME            NOT NULL,
        symptoms          TEXT            NOT NULL,
        notes             TEXT            DEFAULT NULL,
        status            ENUM('pending','confirmed','completed','cancelled')
                          NOT NULL DEFAULT 'pending',
        created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await ddl(`ALTER TABLE appointments ADD INDEX idx_appt_status  (status)`).catch(() => {});
    await ddl(`ALTER TABLE appointments ADD INDEX idx_appt_date    (appointment_date)`).catch(() => {});
    await ddl(`ALTER TABLE appointments ADD INDEX idx_appt_service (service)`).catch(() => {});
    ok('Table: appointments');

    // ── services ─────────────────────────────────────────────
    await ddl(`
      CREATE TABLE IF NOT EXISTS services (
        id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        title_en        VARCHAR(200)    NOT NULL,
        title_am        VARCHAR(200)    NOT NULL,
        description_en  TEXT            NOT NULL,
        description_am  TEXT            NOT NULL,
        image           VARCHAR(300)    DEFAULT NULL,
        is_active       TINYINT(1)      NOT NULL DEFAULT 1,
        sort_order      INT UNSIGNED    NOT NULL DEFAULT 0,
        created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    ok('Table: services');

    // ── contact_messages ─────────────────────────────────────
    await ddl(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(150)    NOT NULL,
        phone       VARCHAR(20)     NOT NULL,
        subject     VARCHAR(300)    NOT NULL,
        message     TEXT            NOT NULL,
        is_read     TINYINT(1)      NOT NULL DEFAULT 0,
        created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    ok('Table: contact_messages');

    // ── Seed admin user ───────────────────────────────────────
    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length === 0) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await conn.execute(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['WIGO Admin', ADMIN_EMAIL, hash, 'superadmin']
      );
      ok(`Admin created  →  ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
    } else {
      info(`Admin already exists: ${ADMIN_EMAIL}`);
    }

    // ── Seed services ─────────────────────────────────────────
    const services = [
      [1,  'Waist Pain Treatment',       'ለወገብ ህመም',           'Traditional herbal remedies for lower back and waist pain relief.',     'ለወገብና የታችኛው ጀርባ ህመም ማስታገሻ ባህላዊ የእፅዋት መድኃኒቶች።',        1],
      [2,  'Hip Pain Treatment',          'ለበጀድ ህመም',           'Natural treatments for hip joint pain and mobility issues.',           'ለበጀድ መገጣጠሚያ ህመም ተፈጥራዊ ሕክምናዎች።',                        2],
      [3,  'Shoulder, Back & Arm Pain',   'ለትከሻ፣ ለጀርባ እና ለእጅ ህመም', 'Comprehensive herbal therapy for upper body pain.',             'ለላይኛው የሰውነት ክፍል ህመም አጠቃላይ የእፅዋት ሕክምና።',              3],
      [4,  'Leg Pain Treatment',          'ለእግር ህመም',           'Effective herbal solutions for leg pain and discomfort.',              'ለእግር ህመም ውጤታማ የእፅዋት መፍትሄዎች።',                          4],
      [5,  'Kidney Problems',             'ለኩላሊት ህመም',          'Traditional remedies for kidney health and function.',                 'ለኩላሊት ጤና ባህላዊ መድኃኒቶች።',                                  5],
      [6,  'Stomach & Intestinal Ulcer',  'ለሆድ ህመም',            'Natural healing for digestive system ulcers and disorders.',           'ለምግብ መፈጨት ሥርዓት ቁስለቶች ተፈጥራዊ ፈውስ።',                     6],
      [7,  'Nerve Disorders',             'ለነርቭ መታወክ',          'Herbal treatments for nervous system conditions.',                     'ለነርቭ ስርዓት ሁኔታዎች የእፅዋት ሕክምናዎች።',                         7],
      [8,  'Uterus Problems',             'ለማህጸን ችግሮች',         "Women's health treatments for uterine conditions.",                    'ለማህጸን ሁኔታዎች የሴቶች ጤና ሕክምናዎች።',                           8],
      [9,  'Rheumatism',                  'ለሪህ ህመም',            'Traditional remedies for rheumatic conditions and joint pain.',        'ለሪህ ሁኔታዎች ባህላዊ መድኃኒቶች።',                                 9],
      [10, 'Respiratory Problems',        'ለመተንፈሻ ችግሮች',        'Herbal solutions for breathing and lung health.',                      'ለሳንባ ጤና የእፅዋት መፍትሄዎች።',                                  10],
      [11, 'Skin Diseases',               'ለቆዳ ህመም',            'Natural treatments for various skin conditions.',                      'ለቆዳ ሁኔታዎች ተፈጥራዊ ሕክምናዎች።',                               11],
      [12, 'Hemorrhoids',                 'ለኪንታሮት',             'Effective herbal remedies for hemorrhoid relief.',                     'ለኪንታሮት ማስታገሻ የእፅዋት መድኃኒቶች።',                            12],
      [13, 'Eye Problems',                'ለአይን ህመም',           'Traditional eye care and vision health treatments.',                   'ባህላዊ የዓይን እንክብካቤ ሕክምናዎች።',                               13],
      [14, 'Brain Problems',              'ለአእምሮ ህመም',          'Herbal support for neurological health.',                              'ለነርቭ ጤና የእፅዋት ድጋፍ።',                                      14],
      [15, 'Prostate & Urinary Problems', 'ለፕሮስቴት እና ለሽንት ችግሮች', "Men's health treatments for prostate and urinary conditions.",     'ለፕሮስቴት ሕክምናዎች።',                                          15],
      [16, 'Body Pain & Weakness',        'ለሰውነት ቁርጥማት እና ማቃተል', 'Comprehensive treatment for general body pain and fatigue.',      'ለሰውነት ህመም አጠቃላይ ሕክምና።',                                  16],
      [17, 'Epilepsy',                    'ለሚጥል በሽታ',           'Traditional herbal management for epileptic conditions.',              'ለሚጥል ሁኔታዎች ባህላዊ አስተዳደር።',                                17],
      [18, 'Bone & Joint Pain',           'ለአጥንት እና መገጣጠሚያ ህመም', 'Natural remedies for skeletal and joint health.',                  'ለአጥንት ጤና ተፈጥራዊ መድኃኒቶች።',                                18],
      [19, 'Other Health Problems',       'ለቁራኛ እና ሌሎች',        'Consultation for various other health conditions.',                    'ለተለያዩ ሌሎች የጤና ሁኔታዎች ምክክር።',                              19]
    ];

    let seeded = 0;
    for (const s of services) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO services
           (id, title_en, title_am, description_en, description_am, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        s
      );
      if (r.affectedRows > 0) seeded++;
    }
    if (seeded > 0) ok(`Seeded ${seeded} service(s)`);
    else            info('Services already seeded — skipped');

    // ── Done ──────────────────────────────────────────────────
    console.log('\n  ════════════════════════════════════');
    console.log('  🎉  Setup complete!');
    console.log('  ════════════════════════════════════\n');
    console.log(`  Admin login:`);
    console.log(`    Email   : ${ADMIN_EMAIL}`);
    console.log(`    Password: ${ADMIN_PASSWORD}`);
    console.log('\n  ⚠️  Change your password after first login!\n');

  } catch (e) {
    fail('Setup failed: ' + e.message);
    if (e.code === 'ECONNREFUSED')           fail('MySQL is not running or wrong host/port');
    if (e.code === 'ER_ACCESS_DENIED_ERROR') fail('Wrong DB_USER or DB_PASSWORD');
    if (e.code === 'ER_BAD_DB_ERROR')        fail(`Database "${DB_NAME}" does not exist`);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
