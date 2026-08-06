# ============================================================
# WIGO Herbal — One-Click Startup Script
# Run from the backend folder:
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
# ============================================================

$backendDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $backendDir

Write-Host ""
Write-Host "🌿 WIGO Herbal — Starting Up" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org (LTS version)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found — reinstall Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm: $(npm --version)" -ForegroundColor Green

# Install dependencies if node_modules missing
if (-not (Test-Path "$backendDir\node_modules")) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Run DB setup
Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Cyan
node scripts/setup-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Database setup failed." -ForegroundColor Red
    Write-Host "   Make sure MySQL is running and .env has correct credentials." -ForegroundColor Yellow
    Write-Host "   Edit: backend\.env" -ForegroundColor Yellow
    exit 1
}

# Start server
Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Cyan
Write-Host ""
npm run dev
