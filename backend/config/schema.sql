-- ============================================================
-- WIGO Herbal Traditional Medical Services
-- Database Schema
-- Run via:  node scripts/setup-db.js
--           OR manually in MySQL: SOURCE path/to/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wigo_herbal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wigo_herbal;

-- ============================================================
-- Users (admin accounts only)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(150)    NOT NULL,
    email       VARCHAR(200)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,   -- bcrypt hash, never plain text
    role        ENUM('admin','superadmin') NOT NULL DEFAULT 'admin',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(150)    NOT NULL,
    gender              ENUM('male','female') NOT NULL,
    age                 TINYINT UNSIGNED NOT NULL,
    phone               VARCHAR(20)     NOT NULL,
    email               VARCHAR(200)    DEFAULT NULL,
    address             VARCHAR(300)    DEFAULT NULL,
    language            ENUM('en','am') NOT NULL DEFAULT 'en',
    service             VARCHAR(100)    NOT NULL,
    appointment_date    DATE            NOT NULL,
    appointment_time    TIME            NOT NULL,
    symptoms            TEXT            NOT NULL,
    notes               TEXT            DEFAULT NULL,
    status              ENUM('pending','confirmed','completed','cancelled')
                        NOT NULL DEFAULT 'pending',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_appt_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appt_date    ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_service ON appointments(service);

-- ============================================================
-- Services
-- ============================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Contact Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    phone       VARCHAR(20)     NOT NULL,
    subject     VARCHAR(300)    NOT NULL,
    message     TEXT            NOT NULL,
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTE: Admin user and services are seeded by:
--       node scripts/setup-db.js
-- Do NOT insert a raw password here — bcrypt hashing requires Node.js
-- ============================================================
