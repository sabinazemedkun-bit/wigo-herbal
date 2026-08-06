#!/bin/bash
# ============================================================
# WIGO Herbal — Automated Deployment Script
# Run on your Ubuntu/Debian VPS as root or sudo user:
#   chmod +x deploy.sh
#   sudo bash deploy.sh
# ============================================================

set -e  # Exit immediately on any error

# ── Config ───────────────────────────────────────────────────
DOMAIN="wigoherbal.com"
APP_DIR="/var/www/wigo-herbal"
LOG_DIR="/var/log/wigo-herbal"
DB_NAME="wigo_herbal"
DB_USER="wigo_user"
NODE_VERSION="20"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

echo ""
echo "=============================================="
echo "  WIGO Herbal — Production Deployment"
echo "=============================================="
echo ""

# ── 1. System Update ─────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
success "System updated"

# ── 2. Install Node.js ───────────────────────────────────────
if ! command -v node &> /dev/null; then
    info "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    success "Node.js $(node --version) installed"
else
    success "Node.js $(node --version) already installed"
fi

# ── 3. Install MySQL ─────────────────────────────────────────
if ! command -v mysql &> /dev/null; then
    info "Installing MySQL..."
    apt-get install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    success "MySQL installed"
else
    success "MySQL already installed"
fi

# ── 4. Install Nginx ─────────────────────────────────────────
if ! command -v nginx &> /dev/null; then
    info "Installing Nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    success "Nginx installed"
else
    success "Nginx already installed"
fi

# ── 5. Install Certbot ───────────────────────────────────────
if ! command -v certbot &> /dev/null; then
    info "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    success "Certbot installed"
else
    success "Certbot already installed"
fi

# ── 6. Install PM2 ───────────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
    info "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"
else
    success "PM2 already installed"
fi

# ── 7. Create app directory ───────────────────────────────────
info "Setting up application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
success "Directories ready: $APP_DIR"

# ── 8. Upload notice ─────────────────────────────────────────
echo ""
warn "=================================================="
warn " MANUAL STEP REQUIRED"
warn "=================================================="
warn " Upload your project files to: $APP_DIR"
warn " You can use SCP, SFTP, or git:"
warn ""
warn "   # Option A — SCP from your local machine:"
warn "   scp -r ./wigo-herbal/* user@YOUR_SERVER_IP:$APP_DIR/"
warn ""
warn "   # Option B — Git (if repo is set up):"
warn "   cd $APP_DIR && git clone YOUR_REPO_URL ."
warn ""
warn " After uploading, press ENTER to continue..."
warn "=================================================="
read -p ""

# ── 9. Install dependencies ───────────────────────────────────
info "Installing Node.js dependencies..."
cd "$APP_DIR/backend"
npm install --omit=dev
success "Dependencies installed"

# ── 10. Setup .env ───────────────────────────────────────────
if [ ! -f "$APP_DIR/backend/.env" ]; then
    warn ".env file not found!"
    warn "Copy your .env.production to $APP_DIR/backend/.env"
    warn "Then edit it with your real DB password and JWT secret."
    warn "Press ENTER after setting up .env..."
    read -p ""
fi

# ── 11. Create MySQL user and database ───────────────────────
info "Setting up MySQL database..."
DB_PASS=$(grep DB_PASSWORD "$APP_DIR/backend/.env" | cut -d= -f2)

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
success "MySQL database and user created"

# ── 12. Run DB setup ─────────────────────────────────────────
info "Running database setup..."
cd "$APP_DIR/backend"
node scripts/setup-db.js
success "Database tables and seed data created"

# ── 13. Configure Nginx ───────────────────────────────────────
info "Configuring Nginx..."
cp "$APP_DIR/nginx/wigo-herbal.conf" /etc/nginx/sites-available/wigo-herbal

# Replace domain placeholder if needed
sed -i "s/wigoherbal.com/$DOMAIN/g" /etc/nginx/sites-available/wigo-herbal

# Enable site
if [ ! -L /etc/nginx/sites-enabled/wigo-herbal ]; then
    ln -s /etc/nginx/sites-available/wigo-herbal /etc/nginx/sites-enabled/
fi

# Remove default site
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
success "Nginx configured"

# ── 14. SSL Certificate ───────────────────────────────────────
info "Obtaining SSL certificate..."
warn "Make sure your domain ($DOMAIN) DNS A record points to this server IP first!"
warn "Press ENTER when DNS is configured, or Ctrl+C to skip SSL for now..."
read -p ""

certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive --agree-tos \
    --email "admin@$DOMAIN" \
    --redirect || warn "Certbot failed — configure SSL manually later"

# Auto-renew cron
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
success "SSL certificate installed with auto-renewal"

# ── 15. Start app with PM2 ───────────────────────────────────
info "Starting application with PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash
success "Application started with PM2"

# ── 16. Configure firewall ────────────────────────────────────
info "Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall configured"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "=============================================="
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "  Website:         https://$DOMAIN"
echo "  Admin Dashboard: https://$DOMAIN/admin/"
echo "  API Health:      https://$DOMAIN/api/health"
echo ""
echo "  PM2 commands:"
echo "    pm2 status          — check app status"
echo "    pm2 logs wigo-herbal — view logs"
echo "    pm2 restart wigo-herbal — restart app"
echo ""
