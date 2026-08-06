# WIGO Herbal — Complete Deployment Guide
### From Local Development → Live Production Website

---

## Table of Contents

1. [What You Need](#1-what-you-need)
2. [Buy a Domain Name](#2-buy-a-domain-name)
3. [Get a VPS Server](#3-get-a-vps-server)
4. [Connect to Your Server](#4-connect-to-your-server)
5. [Install Required Software](#5-install-required-software)
6. [Upload Your Website Files](#6-upload-your-website-files)
7. [Configure the Database](#7-configure-the-database)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Start the Application with PM2](#9-start-the-application-with-pm2)
10. [Configure Nginx](#10-configure-nginx)
11. [Install SSL Certificate (HTTPS)](#11-install-ssl-certificate-https)
12. [Point Your Domain to the Server](#12-point-your-domain-to-the-server)
13. [Submit to Google Search](#13-submit-to-google-search)
14. [Admin Dashboard Usage](#14-admin-dashboard-usage)
15. [Keeping the Server Running](#15-keeping-the-server-running)
16. [Updating the Website](#16-updating-the-website)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. What You Need

| Item | Cost | Where to Get |
|------|------|-------------|
| Domain name | ~$10/year | Namecheap, GoDaddy, or Ethiopian registrar |
| VPS server | ~$6/month | DigitalOcean, Hetzner, Vultr, Linode |
| SSL certificate | FREE | Let's Encrypt (Certbot) |
| Google Search Console | FREE | search.google.com/search-console |

**Minimum server specs:**
- Ubuntu 22.04 LTS
- 1 vCPU, 1 GB RAM, 25 GB SSD
- (DigitalOcean "Basic Droplet" $6/month is enough)

---

## 2. Buy a Domain Name

1. Go to **https://www.namecheap.com** (recommended — cheapest)
2. Search for `wigoherbal.com` or `wigoherbal.et`
3. Add to cart and purchase
4. You will configure DNS in Step 12

**Recommended domain options:**
- `wigoherbal.com` — international
- `wigoherbal.et` — Ethiopian TLD (register at NIC Ethiopia: https://www.nic.et)

---

## 3. Get a VPS Server

### Option A — DigitalOcean (Recommended for beginners)

1. Go to **https://www.digitalocean.com**
2. Create an account
3. Click **Create → Droplets**
4. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic — $6/month (1 vCPU, 1 GB RAM)
   - **Region:** Frankfurt or Amsterdam (closest to Ethiopia)
   - **Authentication:** Password (set a strong root password)
5. Click **Create Droplet**
6. Copy the server IP address (e.g. `157.230.12.34`)

### Option B — Hetzner (Cheaper, good for Ethiopia)

1. Go to **https://www.hetzner.com/cloud**
2. Create a CX11 server (~€4/month)
3. Choose Ubuntu 22.04

---

## 4. Connect to Your Server

Open **PowerShell** on your Windows computer and connect via SSH:

```powershell
ssh root@YOUR_SERVER_IP
```

Example:
```powershell
ssh root@157.230.12.34
```

Type `yes` when asked about the fingerprint, then enter your root password.

---

## 5. Install Required Software

Once connected to your server, run these commands one by one:

### Update the system
```bash
apt-get update && apt-get upgrade -y
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### Install MySQL
```bash
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Secure MySQL installation
mysql_secure_installation
# Answer: Y, Y, Y, Y, Y (use a strong root password)
```

### Install Nginx
```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Install PM2 (process manager)
```bash
npm install -g pm2
```

### Install Certbot (free SSL)
```bash
apt-get install -y certbot python3-certbot-nginx
```

### Install Git
```bash
apt-get install -y git
```

---

## 6. Upload Your Website Files

### Option A — Upload directly with SCP (from your Windows computer)

Open a **new PowerShell window** on your local machine:

```powershell
# Create the app directory on server first
ssh root@YOUR_SERVER_IP "mkdir -p /var/www/wigo-herbal"

# Upload all files (run from your project root)
scp -r "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\*" root@YOUR_SERVER_IP:/var/www/wigo-herbal/
```

### Option B — Use GitHub (Recommended for future updates)

**On your local machine (PowerShell):**
```powershell
cd "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal"

# Initialize git and push to GitHub
git init
git add .
git commit -m "Initial commit — WIGO Herbal"

# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/wigo-herbal.git
git push -u origin main
```

**On your server:**
```bash
mkdir -p /var/www/wigo-herbal
cd /var/www/wigo-herbal
git clone https://github.com/YOUR_USERNAME/wigo-herbal.git .
```

---

## 7. Configure the Database

**On your server, log in to MySQL:**
```bash
mysql -u root -p
```

**Run these SQL commands:**
```sql
-- Create database
CREATE DATABASE wigo_herbal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create a dedicated DB user (safer than using root)
CREATE USER 'wigo_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_DB_PASSWORD';

-- Grant permissions
GRANT ALL PRIVILEGES ON wigo_herbal.* TO 'wigo_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

**Run the setup script to create tables and seed data:**
```bash
cd /var/www/wigo-herbal/backend
node scripts/setup-db.js
```

You should see:
```
✅ Database "wigo_herbal" ready
✅ Table: users
✅ Table: appointments
✅ Table: services
✅ Table: contact_messages
✅ Admin user created
✅ Seeded 19 service(s)
🎉 Setup complete!
```

---

## 8. Configure Environment Variables

**On your server, create the .env file:**
```bash
nano /var/www/wigo-herbal/backend/.env
```

**Paste and fill in your real values:**
```env
PORT=5000
NODE_ENV=production
DOMAIN=wigoherbal.com
FRONTEND_URL=https://wigoherbal.com

DB_HOST=localhost
DB_PORT=3306
DB_USER=wigo_user
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
DB_NAME=wigo_herbal

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=PASTE_YOUR_64_CHAR_RANDOM_STRING_HERE

ADMIN_EMAIL=admin@wigoherbal.com
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

**Secure the file:**
```bash
chmod 600 /var/www/wigo-herbal/backend/.env
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as `JWT_SECRET` in your .env file.

---

## 9. Install Dependencies and Start the Application with PM2

```bash
# Install Node.js dependencies
cd /var/www/wigo-herbal/backend
npm install --omit=dev

# Create log directory
mkdir -p /var/log/wigo-herbal

# Start with PM2
cd /var/www/wigo-herbal
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Auto-start PM2 on server reboot
pm2 startup systemd
# Copy and run the command it gives you
```

**Verify the app is running:**
```bash
pm2 status
# Should show: wigo-herbal | online | ...

curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"WIGO Herbal API is running",...}
```

---

## 10. Configure Nginx

```bash
# Copy the Nginx config
cp /var/www/wigo-herbal/nginx/wigo-herbal.conf /etc/nginx/sites-available/wigo-herbal

# Replace the domain placeholder with your real domain
sed -i 's/wigoherbal.com/YOUR_ACTUAL_DOMAIN.com/g' /etc/nginx/sites-available/wigo-herbal

# Enable the site
ln -s /etc/nginx/sites-available/wigo-herbal /etc/nginx/sites-enabled/

# Remove the default site
rm -f /etc/nginx/sites-enabled/default

# Test the config
nginx -t
# Should say: syntax is ok / test is successful

# Reload Nginx
systemctl reload nginx
```

**Test HTTP access (before SSL):**

Open your browser and visit `http://YOUR_SERVER_IP`
You should see the WIGO Herbal website.

---

## 11. Install SSL Certificate (HTTPS)

> **Important:** Complete Step 12 (point your domain to the server) BEFORE running Certbot.

```bash
# Get free SSL certificate for your domain
certbot --nginx -d wigoherbal.com -d www.wigoherbal.com

# When prompted:
# - Enter your email address
# - Agree to terms: A
# - Choose option 2 (Redirect HTTP to HTTPS)
```

**Set up automatic renewal:**
```bash
# Test renewal
certbot renew --dry-run

# Add auto-renewal cron job
crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 12. Point Your Domain to the Server

**In your domain registrar (Namecheap, GoDaddy, etc.):**

1. Log in to your domain registrar account
2. Find your domain → **Manage DNS**
3. Delete any existing A records
4. Add these DNS records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |

5. Save the changes
6. Wait 5–30 minutes for DNS to propagate

**Test DNS propagation:**
```bash
# From your server or local machine
nslookup wigoherbal.com
# Should return your server IP
```

Or check online: https://www.whatsmydns.net

---

## 13. Submit to Google Search

### Step 1 — Add your site to Google Search Console

1. Go to **https://search.google.com/search-console**
2. Sign in with your Google account
3. Click **Add Property**
4. Choose **URL prefix**
5. Enter: `https://wigoherbal.com`
6. Click **Continue**

### Step 2 — Verify ownership

Choose **HTML file** method:
1. Download the verification HTML file (e.g. `google1234abc.html`)
2. Upload it to: `/var/www/wigo-herbal/frontend/google1234abc.html`
3. Click **Verify** in Google Search Console

### Step 3 — Submit your sitemap

1. In Search Console, click **Sitemaps** in the left menu
2. Enter: `sitemap.xml`
3. Click **Submit**

### Step 4 — Request indexing

1. In Search Console, click **URL Inspection**
2. Enter your homepage URL: `https://wigoherbal.com`
3. Click **Request Indexing**
4. Repeat for each page (about, services, appointment, contact, address)

**Google will index your site within 1–7 days.**

### Step 5 — Optimize for Google (SEO Tips)

Your site already has:
- ✅ Meta description on every page
- ✅ Open Graph tags for social sharing
- ✅ JSON-LD structured data (MedicalBusiness schema)
- ✅ sitemap.xml
- ✅ robots.txt
- ✅ Canonical URLs
- ✅ Mobile-responsive design
- ✅ HTTPS (after SSL setup)

Additional tips:
- Add your business to **Google Business Profile**: https://business.google.com
- Register on **Google Maps** with your clinic address

---

## 14. Admin Dashboard Usage

**Access the admin dashboard:**
```
https://wigoherbal.com/admin/
```

**Login credentials (change after first login):**
```
Email:    admin@wigoherbal.com
Password: (the one you set in .env)
```

### Dashboard Sections

| Section | What you can do |
|---------|----------------|
| **Overview** | See total appointments, pending/completed counts, top services |
| **Appointments** | View all bookings, update status (pending→confirmed→completed), delete |
| **Services** | Add, edit, delete the 19 medical services |
| **Messages** | Read contact messages from patients, mark as read, delete |

### Appointment Status Flow
```
Patient books → pending → confirmed (you confirmed) → completed (treatment done)
                       ↘ cancelled (if patient cancels)
```

### Change your admin password
1. Log in to admin dashboard
2. Go to **Profile** (top right)
3. Click **Change Password**

Or update directly in the database:
```bash
cd /var/www/wigo-herbal/backend
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('YOUR_NEW_PASSWORD', 12).then(hash => {
  const db = require('./config/database');
  db.execute('UPDATE users SET password=? WHERE email=?',
    [hash, 'admin@wigoherbal.com'])
    .then(() => { console.log('Password updated'); process.exit(0); });
});"
```

---

## 15. Keeping the Server Running

### PM2 Commands
```bash
pm2 status                    # check if app is running
pm2 logs wigo-herbal          # view live logs
pm2 logs wigo-herbal --lines 100  # last 100 log lines
pm2 restart wigo-herbal       # restart the app
pm2 stop wigo-herbal          # stop the app
pm2 start wigo-herbal         # start the app
pm2 monit                     # real-time dashboard
```

### Check if everything is working
```bash
# App health
curl https://wigoherbal.com/api/health

# Nginx status
systemctl status nginx

# MySQL status
systemctl status mysql

# SSL certificate expiry
certbot certificates
```

### Set up uptime monitoring (free)
1. Go to **https://uptimerobot.com**
2. Create a free account
3. Add monitor → HTTP(s)
4. URL: `https://wigoherbal.com/api/health`
5. Check interval: 5 minutes
6. Alert email: your email
7. You'll get an email if the site goes down

---

## 16. Updating the Website

When you make changes to your code, update the live server:

### If using Git
```bash
cd /var/www/wigo-herbal
git pull origin main
cd backend
npm install --omit=dev
pm2 restart wigo-herbal
```

### If uploading manually (SCP)
```powershell
# From your local machine PowerShell:
scp -r "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\frontend\*" root@YOUR_SERVER_IP:/var/www/wigo-herbal/frontend/
scp -r "C:\Users\ltaye\OneDrive\Desktop\kiro\wigo-herbal\backend\*" root@YOUR_SERVER_IP:/var/www/wigo-herbal/backend/

# Then restart on server:
ssh root@YOUR_SERVER_IP "cd /var/www/wigo-herbal/backend && npm install --omit=dev && pm2 restart wigo-herbal"
```

---

## 17. Troubleshooting

### Site not loading
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs wigo-herbal --lines 50

# Check Nginx
nginx -t
systemctl status nginx
```

### 502 Bad Gateway
```bash
# App crashed — restart it
pm2 restart wigo-herbal
pm2 logs wigo-herbal
```

### Database connection error
```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -u wigo_user -p wigo_herbal -e "SELECT 1"

# Check .env has correct DB_PASSWORD
cat /var/www/wigo-herbal/backend/.env | grep DB_
```

### SSL certificate expired
```bash
certbot renew
systemctl reload nginx
```

### Port 5000 already in use
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process
kill -9 PID_NUMBER

# Restart with PM2
pm2 start wigo-herbal
```

### After server reboot — app not running
```bash
# PM2 should auto-start, but if not:
pm2 resurrect
# or
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## Quick Reference Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WIGO Herbal — Production Quick Reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Website:          https://wigoherbal.com
  Admin Dashboard:  https://wigoherbal.com/admin/
  API Health:       https://wigoherbal.com/api/health

  Server SSH:       ssh root@YOUR_SERVER_IP
  App directory:    /var/www/wigo-herbal/
  Logs directory:   /var/log/wigo-herbal/
  Nginx config:     /etc/nginx/sites-available/wigo-herbal
  SSL certs:        /etc/letsencrypt/live/wigoherbal.com/

  Start app:        pm2 start ecosystem.config.js --env production
  Restart app:      pm2 restart wigo-herbal
  View logs:        pm2 logs wigo-herbal
  App status:       pm2 status

  MySQL login:      mysql -u wigo_user -p wigo_herbal
  Nginx reload:     systemctl reload nginx
  SSL renew:        certbot renew
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*WIGO Herbal Deployment Guide — prepared by Kiro AI, July 2026*
