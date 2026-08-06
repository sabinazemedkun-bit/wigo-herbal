// PM2 Ecosystem Configuration
// Usage:
//   pm2 start ecosystem.config.js          (start)
//   pm2 restart ecosystem.config.js        (restart)
//   pm2 stop wigo-herbal                   (stop)
//   pm2 logs wigo-herbal                   (logs)
//   pm2 monit                              (monitor)
//   pm2 save && pm2 startup                (auto-start on server reboot)

module.exports = {
  apps: [
    {
      name        : 'wigo-herbal',
      script      : './backend/server.js',
      cwd         : '/var/www/wigo-herbal',

      // ── Clustering ───────────────────────────────────────
      // 'max' uses all CPU cores; set to 1 if DB connections are limited
      instances   : 1,
      exec_mode   : 'fork',

      // ── Environment ──────────────────────────────────────
      env_production: {
        NODE_ENV  : 'production',
        PORT      : 5000
      },

      // ── Logging ──────────────────────────────────────────
      out_file    : '/var/log/wigo-herbal/out.log',
      error_file  : '/var/log/wigo-herbal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs  : true,

      // ── Auto-restart on crash ─────────────────────────────
      autorestart : true,
      watch       : false,          // set true only during development
      max_memory_restart: '300M',

      // ── Graceful shutdown ─────────────────────────────────
      kill_timeout     : 5000,
      listen_timeout   : 8000,
      shutdown_with_message: true
    }
  ]
};
