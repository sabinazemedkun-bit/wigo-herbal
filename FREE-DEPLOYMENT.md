# WIGO Herbal — Free Deployment Guide
### Zero cost · Live in 30 minutes · No credit card required

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FREE SERVICES USED                     │
├──────────────────┬──────────────────┬───────────────────┤
│   GitHub (free)  │  Render.com (free│  Aiven (free)     │
│   Source code    │  Node.js server  │  MySQL database   │
│   Version control│  Frontend files  │  300 MB storage   │
│                  │  Admin dashboard │                   │
│                  │  Auto HTTPS/SSL  │                   │
│                  │  *.onrender.com  │                   │
└──────────────────┴──────────────────┴───────────────────┘
```

**Your live URLs (after deployment):**
```
Website:          https://wigo-herbal.onrender.com
Admin Dashboard:  https://wigo-herbal.onrender.com/admin/
API Health:       https://wigo-herbal.onrender.com/api/health
```

> **Note on free tier:** Render free services spin down after 15 minutes
> of inactivity. The first request after idle takes ~30 seconds.
> This is normal — upgrade to $7/month to keep it always-on.

---

## What You Need (All Free)

| Service | Purpose | Sign up |
|---------|---------|---------|
| GitHub | Store your code | github.com |
| Render.com | Host Node.js server | render.com |
| Aiven | Free MySQL database | aiven.io |
| Google account | Google Search Console | google.com |

---

## Step 1 — Push Code to GitHub

### 1.1 Create a GitHub account
Go to **https://github.com** and sign up (free).

### 1.2 Create a new repository
1. Click the **+** icon → **New repository**
2. Name: `wigo-herbal`
3. Visibility: **Private** (keeps your code safe)
4. Do NOT check "Add README" — your project already has files
5. Click **Create repository**

### 1.3 Push your project from your Windows computer

Open **PowerShell** and run:

```powershell
cd "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal"

# Initialize git (if not done yet)
git init
git branch -M main

# Stage all files (.gitignore will exclude secrets automatically)
git add .
git status
# Verify .env files are NOT listed — they should be excluded by .gitignore
```

> **IMPORTANT:** Before committing, verify the output of `git status`
> does NOT include `backend/.env` or `backend/.env.production`.
> If they appear, run: `git rm --cached backend/.env` first.

```powershell
git commit -m "Initial commit - WIGO Herbal production-ready"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/wigo-herbal.git

# Push to GitHub
git push -u origin main
```

GitHub will ask for your username and password.
Use a **Personal Access Token** (not your password):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token** → check **repo** scope → Generate
3. Copy the token and use it as your password

---

## Step 2 — Create Free MySQL Database (Aiven)

Aiven offers a **free MySQL plan** with 300 MB storage — enough for
thousands of appointments.

### 2.1 Sign up at Aiven
1. Go to **https://aiven.io**
2. Click **Sign up free** → use your Google account
3. Verify your email

### 2.2 Create a MySQL service
1. Click **Create service**
2. Choose **MySQL**
3. Select plan: **Free** (HOBBYIST)
4. Cloud provider: **AWS**
5. Region: **eu-west-1** (Ireland — closest free region to Ethiopia)
6. Service name: `wigo-herbal-mysql`
7. Click **Create free service**

Wait ~2 minutes for the service to start (shows green "Running").

### 2.3 Get your database credentials

Click on your MySQL service → **Overview** tab.
Copy these values — you will need them in Step 4:

```
Host:     mysql-wigo-herbal-xxxx.aivencloud.com
Port:     12345  (Aiven uses non-standard ports)
Database: defaultdb
Username: avnadmin
Password: your_aiven_password_here
```

### 2.4 Enable SSL for Aiven connection

Aiven requires SSL. Update `backend/config/database.js` to add SSL:

Open the file and verify it has this connection option. If not,
replace the connection config with:

```javascript
const pool = mysql.createPool({
  host    : process.env.DB_HOST,
  port    : Number(process.env.DB_PORT),
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl     : process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit   : 10
});
```

We will set `DB_SSL=true` as an environment variable on Render.

---

## Step 3 — Create Free Render.com Account

### 3.1 Sign up
1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Sign in with your **GitHub account** (easiest — links automatically)

### 3.2 Deploy using render.yaml Blueprint

1. In Render dashboard, click **New +** → **Blueprint**
2. Connect your GitHub account if not already connected
3. Select your **wigo-herbal** repository
4. Render will detect `render.yaml` automatically
5. Click **Apply**
6. Service name will be: `wigo-herbal`
7. Click **Create Resources**

Render will now:
- Clone your GitHub repo
- Run `cd backend && npm install --omit=dev`
- Start `node backend/server.js`
- Assign URL: `https://wigo-herbal.onrender.com`
- Install a free HTTPS certificate automatically

**Your subdomain is set.** No DNS configuration needed.

---

## Step 4 — Configure Environment Variables on Render

After the service is created (even if the first deploy fails),
go to:

**Render Dashboard → wigo-herbal → Environment**

Click **Add Environment Variable** and add each one:

### Required Variables

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Already set in render.yaml |
| `PORT` | `10000` | Render's default port |
| `DOMAIN` | `wigo-herbal.onrender.com` | Already set |
| `FRONTEND_URL` | `https://wigo-herbal.onrender.com` | Already set |
| `DB_HOST` | `mysql-wigo-herbal-xxxx.aivencloud.com` | From Aiven Step 2.3 |
| `DB_PORT` | `12345` | From Aiven Step 2.3 (your actual port) |
| `DB_USER` | `avnadmin` | From Aiven Step 2.3 |
| `DB_PASSWORD` | ` your_aiven_password_here` | From Aiven Step 2.3 |
| `DB_NAME` | `defaultdb` | From Aiven Step 2.3 |
| `DB_SSL` | `true` | Required for Aiven |
| `JWT_SECRET` | *(generated below)* | Must be strong and secret |
| `ADMIN_EMAIL` | `admin@wigoherbal.com` | Your admin login email |
| `ADMIN_PASSWORD` | *(your strong password)* | Your admin login password |

### Generate a strong JWT_SECRET

Run this in your local PowerShell:

```powershell
$env:PATH = "C:\Program Files\nodejs\;" + $env:PATH
& "C:\Program Files\nodejs\node.exe" -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the 128-character hex string and paste it as `JWT_SECRET`.

### Save and Redeploy

After adding all variables:
1. Click **Save Changes**
2. Go to **Deploys** tab → click **Deploy latest commit**
3. Watch the deploy log — look for:
   ```
   🌿 WIGO Herbal Server running
      URL:   http://localhost:10000
      Mode:  production
   ```

---

## Step 5 — Initialize the Database

The database tables need to be created and seeded.
Run the setup script using Render's Shell feature:

1. Render Dashboard → **wigo-herbal** → **Shell** tab
2. Click **Connect**
3. In the shell, run:

```bash
node backend/scripts/setup-db.js
```

You should see:
```
✅ Database "defaultdb" ready
✅ Table: users
✅ Table: appointments
✅ Table: services
✅ Table: contact_messages
✅ Admin user created → admin@wigoherbal.com
✅ Seeded 19 service(s)
🎉 Setup complete!
```

Then verify the connection:
```bash
node backend/scripts/check-db.js
```

```
✅ Database connection OK
   Host    : mysql-wigo-herbal-xxxx.aivencloud.com:12345
   Database: defaultdb
   Tables  : appointments, contact_messages, services, users
   Admins  : 1
   Latency : 45ms
```

---

## Step 6 — Verify the Deployment

Open your browser and test each URL:

### 6.1 Health check
```
https://wigo-herbal.onrender.com/api/health
```
Expected response:
```json
{
  "success": true,
  "message": "WIGO Herbal API is running",
  "env": "production",
  "timestamp": "2026-08-03T..."
}
```

### 6.2 Public website
```
https://wigo-herbal.onrender.com/
```
- Home page loads with WIGO logo and navigation ✅
- All navbar links work ✅
- Services page shows 19 services from database ✅
- Contact form submits successfully ✅
- Appointment form submits successfully ✅

### 6.3 Admin dashboard
```
https://wigo-herbal.onrender.com/admin/
```
Login with:
- Email: `admin@wigoherbal.com`
- Password: *(the ADMIN_PASSWORD you set in Step 4)*

Verify:
- Overview tab shows appointment stats ✅
- Appointments tab lists bookings ✅
- Services tab shows all 19 services ✅
- Messages tab shows contact messages ✅
- Status updates save correctly ✅

### 6.4 SSL certificate
Click the 🔒 padlock in your browser address bar.
Certificate should show: **Let's Encrypt** or **Render** — valid ✅

---

## Step 7 — Submit to Google Search

### 7.1 Add to Google Search Console
1. Go to **https://search.google.com/search-console**
2. Sign in with Google
3. Click **Add Property** → **URL prefix**
4. Enter: `https://wigo-herbal.onrender.com`
5. Click **Continue**

### 7.2 Verify ownership (HTML file method)
1. Download the verification file (e.g. `google1a2b3c4d.html`)
2. Place it in: `C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\frontend\`
3. Commit and push to GitHub:
   ```powershell
   git add frontend/google1a2b3c4d.html
   git commit -m "Add Google Search Console verification"
   git push
   ```
4. Render auto-deploys from GitHub — wait 1–2 minutes
5. Click **Verify** in Google Search Console

### 7.3 Submit sitemap
1. In Search Console → **Sitemaps** → Add:
   ```
   https://wigo-herbal.onrender.com/sitemap.xml
   ```
2. Click **Submit**
3. Google will start indexing within 1–7 days

---

## Step 8 — Set Up Auto-Deploy (Optional but Recommended)

Every time you push to GitHub, Render will automatically redeploy.
This is already enabled by default when you connect a GitHub repo.

To verify:
- Render Dashboard → **wigo-herbal** → **Settings**
- **Auto-Deploy**: should show **Yes**

To update your live site in the future:
```powershell
# Make your changes locally, then:
git add .
git commit -m "Update: description of what you changed"
git push
# Render automatically deploys within 1-2 minutes
```

---

## DNS Records Summary

Since you are using `*.onrender.com`, **no DNS configuration is needed**.
Render handles everything including SSL.

If you later buy a custom domain (e.g. `wigoherbal.com`):

| Type | Name | Value |
|------|------|-------|
| `CNAME` | `@` | `wigo-herbal.onrender.com` |
| `CNAME` | `www` | `wigo-herbal.onrender.com` |

Then in Render → **wigo-herbal** → **Settings** → **Custom Domain**:
- Add `wigoherbal.com`
- Render generates a free SSL cert automatically

---

## Environment Variables Reference

Complete list of all environment variables for the Render dashboard:

```
NODE_ENV         = production
PORT             = 10000
DOMAIN           = wigo-herbal.onrender.com
FRONTEND_URL     = https://wigo-herbal.onrender.com
DB_HOST          = [from Aiven dashboard]
DB_PORT          = [from Aiven dashboard]
DB_USER          = avnadmin
DB_PASSWORD      = [from Aiven dashboard]
DB_NAME          = defaultdb
DB_SSL           = true
JWT_SECRET       = [64-byte hex string — generate with node crypto]
ADMIN_EMAIL      = admin@wigoherbal.com
ADMIN_PASSWORD   = [your strong admin password]
```

---

## Security Checklist

After deployment, verify each item:

- [ ] `.env` file is NOT in your GitHub repository
- [ ] `JWT_SECRET` is at least 64 characters long
- [ ] `ADMIN_PASSWORD` is strong (min 12 chars, mixed case, numbers, symbols)
- [ ] Admin dashboard URL is not linked from any public page
- [ ] HTTPS is active (padlock shows in browser)
- [ ] `robots.txt` blocks `/admin/` from search engines
- [ ] Rate limiting is active (try 6+ rapid logins — should be blocked)
- [ ] Database password is different from local dev password

---

## Troubleshooting

### "Application failed to respond" on Render

The app crashed on startup. Check the deploy logs:
- Render → **wigo-herbal** → **Logs**
- Look for red error lines
- Most common cause: missing environment variable

Fix: Go to **Environment** tab, add the missing variable, redeploy.

### Database connection refused

```
❌ Database connection FAILED
   Error: ECONNREFUSED
```

Causes:
1. `DB_HOST` is wrong — copy again from Aiven dashboard
2. `DB_SSL` is not set to `true` — Aiven requires SSL
3. Aiven free service is sleeping — click **Power on** in Aiven dashboard

### "Invalid token" on admin login

`JWT_SECRET` environment variable is missing or empty.
Go to Render → Environment → add `JWT_SECRET` → redeploy.

### Page loads but shows no services

Database is connected but empty. Run in Render Shell:
```bash
node backend/scripts/setup-db.js
```

### First visit takes 30 seconds to load

Normal for Render free tier — the server was idle and is waking up.
The second visit will be instant.

To fix permanently: upgrade to Render Starter ($7/month) which
keeps the server always running.

### Changes pushed to GitHub but site not updating

1. Check Render → **Deploys** tab — did a new deploy start?
2. If not: Settings → Auto-Deploy → enable it
3. Manually trigger: Deploys → **Deploy latest commit**

---

## Upgrade Path (When You're Ready)

| Need | Solution | Cost |
|------|----------|------|
| Always-on (no cold start) | Render Starter plan | $7/month |
| More database storage | Aiven startup plan | $19/month |
| Custom domain | Buy domain + add to Render | ~$10/year |
| Multiple admin users | Already supported in the DB | Free |
| Email notifications | Add SendGrid free tier | Free (100 emails/day) |

---

## Final Production URLs

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WIGO Herbal — Live Production Endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌐  Website
      https://wigo-herbal.onrender.com

  🔑  Admin Dashboard
      https://wigo-herbal.onrender.com/admin/

  📋  API Base
      https://wigo-herbal.onrender.com/api

  ❤️   Health Check
      https://wigo-herbal.onrender.com/api/health

  🗺️   Sitemap
      https://wigo-herbal.onrender.com/sitemap.xml

  🤖  Robots
      https://wigo-herbal.onrender.com/robots.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API Endpoints (all require Bearer token except *)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  POST  /api/auth/login           *  Admin login
  GET   /api/auth/profile            Get profile
  GET   /api/appointments            List bookings
  POST  /api/appointments         *  Book appointment
  PUT   /api/appointments/:id        Update status
  DELETE /api/appointments/:id       Delete booking
  GET   /api/appointments/stats/overview  Dashboard stats
  GET   /api/services             *  List services
  POST  /api/services                Add service
  PUT   /api/services/:id            Edit service
  DELETE /api/services/:id           Delete service
  POST  /api/contact              *  Submit message
  GET   /api/contact                 List messages
  PATCH /api/contact/:id/read        Mark as read
  DELETE /api/contact/:id            Delete message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*WIGO Herbal Free Deployment Guide — prepared by Kiro AI, July 2026*
