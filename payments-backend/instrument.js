// This file MUST be required first, before any other module — Sentry's
// own instrumentation only works correctly if it initializes before the
// code it's meant to monitor even loads. See server.js's very first line.
require("dotenv").config();
const Sentry = require("@sentry/node");

// Optional, same pattern as Stripe/Supabase elsewhere in this file — if
// you haven't set up a Sentry account yet, the server still starts and
// runs completely normally, just without error monitoring.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    // Tags every error with the real environment it happened in, so
    // real production issues never get buried in local-testing noise.
    // Defaults to "development" (safe) unless explicitly set — set
    // SENTRY_ENVIRONMENT=production in Render's environment variables
    // for your real deployed backend.
    environment: process.env.SENTRY_ENVIRONMENT || "development",
  });
} else {
  console.warn("SENTRY_DSN not set — error monitoring is disabled. Fine for local testing.");
}

module.exports = Sentry;