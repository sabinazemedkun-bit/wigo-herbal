'use strict';

/**
 * WIGO Herbal — Vercel Serverless Entry Point
 * ─────────────────────────────────────────────────────────────
 * Vercel invokes this file for every request matched by the
 * function routes in vercel.json (/api/*, /admin/*, etc.).
 *
 * This file must:
 *  1. Export the Express app as module.exports so Vercel can
 *     wrap it in its own HTTP handler.
 *  2. Never call app.listen() — Vercel manages the port.
 *  3. Catch any top-level import errors and return a clean
 *     500 JSON response instead of crashing the invocation.
 */

let app;

try {
  app = require('./backend/server.js');
} catch (err) {
  // If server.js itself throws on require (e.g. missing module,
  // syntax error, bad env var), return a clean 500 instead of
  // FUNCTION_INVOCATION_FAILED with no body.
  console.error('[index.js] Failed to load backend/server.js:', err.message);
  console.error(err.stack);

  // Export a minimal Express-compatible handler so Vercel still
  // gets a valid HTTP response rather than a hard crash.
  app = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      message: 'Server failed to initialise. Check Vercel function logs.',
      error  : process.env.NODE_ENV !== 'production' ? err.message : undefined
    }));
  };
}

module.exports = app;
