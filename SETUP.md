# WIGO Herbal — Local Server & Database Setup Guide

## Step 1 — Install Node.js

1. Open your browser and go to: **https://nodejs.org**
2. Download the **LTS** version (recommended)
3. Run the installer — click Next → Next → Install
4. After install, **restart your computer**
5. Verify: open PowerShell and type:
   ```
   node --version
   npm --version
   ```
   Both should print a version number.

---

## Step 2 — Install MySQL

1. Go to: **https://dev.mysql.com/downloads/installer/**
2. Download **MySQL Installer for Windows**
3. Run the installer
4. Choose **"Developer Default"** setup type
5. Set a **root password** — write it down, you will need it
6. Complete the installation
7. Verify: open PowerShell and type:
   ```
   mysql --version
   ```

---

## Step 3 — Configure the .env file

Open this file in your editor:
```
wigo-herbal\backend\.env
```

Set your MySQL root password on this line:
```
DB_PASSWORD=your_mysql_root_password_here
```

Leave everything else as-is unless you changed MySQL settings.

---

## Step 4 — Install dependencies & setup database

Open PowerShell, then run these commands one by one:

```powershell
cd "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\backend"
npm install
node scripts/setup-db.js
```

You should see:
```
✅ Database "wigo_herbal" ready
✅ Table: users
✅ Table: appointments
✅ Table: services
✅ Table: contact_messages
✅ Admin user created  →  admin@wigoherbal.com / Admin@Wigo2026
✅ Seeded 19 service(s)
🎉 Setup complete!
```

---

## Step 5 — Start the server

```powershell
npm run dev
```

You should see:
```
🌿 WIGO Herbal Server running at http://localhost:5000
```

Open your browser and go to: **http://localhost:5000**

---

## One-Click Startup (after first setup)

After the first setup, you only need to run this every time:
```powershell
cd "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\backend"
npm run dev
```

Or double-click the PowerShell script:
```
wigo-herbal\backend\scripts\start.ps1
```

---

## Admin Login

After the server starts, use these credentials to log in:

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@wigoherbal.com     |
| Password | Admin@Wigo2026           |

> ⚠️ Change your password after first login!

---

## API Endpoints

| Method | URL                           | Access  | Description              |
|--------|-------------------------------|---------|--------------------------|
| GET    | /api/health                   | Public  | Server health check      |
| POST   | /api/auth/login               | Public  | Admin login              |
| GET    | /api/auth/profile             | Admin   | Get profile              |
| POST   | /api/appointments             | Public  | Book appointment         |
| GET    | /api/appointments             | Admin   | List appointments        |
| GET    | /api/appointments/stats/overview | Admin | Dashboard stats        |
| PATCH  | /api/appointments/:id         | Admin   | Update status            |
| DELETE | /api/appointments/:id         | Admin   | Delete appointment       |
| GET    | /api/services                 | Public  | List all services        |
| POST   | /api/contact                  | Public  | Submit contact message   |
| GET    | /api/contact                  | Admin   | List contact messages    |

---

## Troubleshooting

**"ECONNREFUSED" error**
→ MySQL is not running. Open Windows Services and start "MySQL80".

**"ER_ACCESS_DENIED_ERROR"**
→ Wrong password in `.env`. Update `DB_PASSWORD`.

**"npm is not recognized"**
→ Node.js is not installed or you need to restart your computer after installing.

**Port 5000 already in use**
→ Change `PORT=5000` to `PORT=5001` in `.env`
