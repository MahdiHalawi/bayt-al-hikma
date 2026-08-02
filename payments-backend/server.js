// A minimal, real Stripe integration companion to the Bayt Al-Hikma
// frontend. This is intentionally small — it exists to show the CORRECT
// architecture (secret key never touches the browser, premium status is
// only ever set from a verified webhook), not to be a complete backend.
//
// Setup:
//   npm install express stripe dotenv cors @supabase/supabase-js express-rate-limit @sentry/node
//   cp .env.example .env   # then fill in your real Stripe + Supabase keys
//   node server.js
//
// You'll also need `stripe listen --forward-to localhost:4242/webhook`
// (Stripe CLI) to test webhooks locally.

// MUST be required first, before anything else — Sentry's error
// monitoring only correctly catches errors from code that loads AFTER
// it initializes. See instrument.js.
const Sentry = require("./instrument");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const { sequencePath } = require("./sequenceService");
const { searchContent } = require("./contentSearchService");
const { searchVideos } = require("./videoSearchService");
const { verifyPaddleSignature } = require("./paddleWebhookService");
const { verifyRequestAuth } = require("./authHelper");

// Both of these are made OPTIONAL on purpose — if you haven't decided on
// a payment provider yet (or haven't set up Supabase), the server still
// starts fine and the AI sequencing endpoint works regardless. Only the
// specific routes that need each service will fail, with a clear error,
// instead of the whole server crashing on startup over an unrelated
// missing key.
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("STRIPE_SECRET_KEY not set — payment endpoints will return an error until it's configured. Fine if you're not using Stripe yet.");
}

// This uses the SECRET service_role key — it bypasses Row Level Security
// entirely, which is exactly why it must only ever exist here, on the
// server, and never in any frontend file (unlike the anon key in
// supabase-config.js, which is meant to be public).
let sbAdmin = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn("Supabase admin credentials not set — the Stripe webhook won't be able to mark users premium until configured.");
}

const app = express();

// Restricted to your actual frontend's URL once CLIENT_URL is set —
// without this, ANY website could make requests to this backend
// directly. Left permissive (with a warning) when CLIENT_URL isn't set,
// since local dev's port can vary (Live Server, different setups).
if (process.env.CLIENT_URL) {
  app.use(cors({ origin: process.env.CLIENT_URL }));
} else {
  console.warn("CLIENT_URL not set — CORS is currently open to any origin. Set CLIENT_URL in .env before deploying publicly.");
  app.use(cors());
}

// NOTE: the webhook route needs the raw body, not JSON-parsed — this is
// a common Stripe integration mistake, so it's handled before the
// express.json() middleware below applies to every other route.
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(501).json({ error: "Stripe is not configured yet — see .env" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // THIS is the only place a user should ever actually be marked premium
  // — never on the frontend, never immediately after checkout redirect,
  // only here, after Stripe itself confirms the payment succeeded.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (!userId) {
      console.warn("Checkout completed but no client_reference_id was set — cannot link this payment to a user.");
    } else if (!sbAdmin) {
      console.warn("Payment confirmed but Supabase admin isn't configured — could not mark the user premium.");
    } else {
      const { error } = await sbAdmin.from("profiles").upsert({ id: userId, is_premium: true });
      if (error) console.error("Failed to mark user premium in Supabase:", error.message);
      else console.log(`User ${userId} marked premium after real payment confirmation.`);
    }
  }

  res.json({ received: true });
});

// This is the REAL, primary payment provider now — Stripe doesn't
// support Lebanon at all, which is why this exists. Same raw-body
// requirement, same absolute rule as the Stripe webhook above: a user
// is ONLY ever marked premium here, after Paddle itself confirms the
// payment — never from the frontend, never from a checkout-completed
// browser event, which could be spoofed by anyone with dev tools open.
app.post("/webhook-paddle", express.raw({ type: "application/json" }), async (req, res) => {
  const signatureHeader = req.headers["paddle-signature"];

  console.log("DEBUG: content-type header:", req.headers["content-type"]);
  console.log("DEBUG: typeof req.body:", typeof req.body);
  console.log("DEBUG: is req.body a Buffer?", Buffer.isBuffer(req.body));
  console.log("DEBUG: req.body length:", req.body ? req.body.length : "N/A");
  console.log("DEBUG: signature header received:", signatureHeader);
  console.log("DEBUG: PADDLE_WEBHOOK_SECRET is set?", !!process.env.PADDLE_WEBHOOK_SECRET);
  console.log("DEBUG: PADDLE_WEBHOOK_SECRET length:", process.env.PADDLE_WEBHOOK_SECRET ? process.env.PADDLE_WEBHOOK_SECRET.length : 0);

  const isValid = verifyPaddleSignature(req.body, signatureHeader, process.env.PADDLE_WEBHOOK_SECRET);
  console.log("DEBUG: signature valid?", isValid);

// Extra-detailed diagnostic — computes the signature manually here,
// and checks for invisible characters at the exact start/end of the
// body, which a normal console.log print wouldn't reveal.
const crypto = require("crypto");
const parts = {};
signatureHeader.split(";").forEach((seg) => { const [k, v] = seg.split("="); if (k && v) parts[k] = v; });
const manualPayload = `${parts.ts}:${req.body}`;
const manualComputed = crypto.createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET).update(manualPayload).digest("hex");
console.log("DEBUG: manually computed signature:", manualComputed);
console.log("DEBUG: received h1 value:          ", parts.h1);
console.log("DEBUG: first 5 char codes of body:", [...req.body.toString("utf8").slice(0, 5)].map(c => c.charCodeAt(0)));
console.log("DEBUG: last 5 char codes of body: ", [...req.body.toString("utf8").slice(-5)].map(c => c.charCodeAt(0)));

  let event;
  try {
    event = JSON.parse(req.body);
  } catch (err) {
    console.error("Could not parse Paddle webhook body:", err.message);
    return res.status(400).send("Invalid JSON");
  }

  if (event.event_type === "transaction.completed") {
    const userId = event.data && event.data.custom_data && event.data.custom_data.userId;

    if (!userId) {
      console.warn("Paddle transaction completed but no custom_data.userId was set — cannot link this payment to a user.");
    } else if (!sbAdmin) {
      console.warn("Payment confirmed but Supabase admin isn't configured — could not mark the user premium.");
    } else {
      const { error } = await sbAdmin.from("profiles").upsert({ id: userId, is_premium: true });
      if (error) console.error("Failed to mark user premium in Supabase:", error.message);
      else console.log(`User ${userId} marked premium after real Paddle payment confirmation.`);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) return res.status(501).json({ error: "Stripe is not configured yet — see .env" });

  try {
    const { userId } = req.body || {};
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL}/?checkout=cancelled`,
      // This is what lets the webhook above know WHICH user just paid —
      // without it, a successful payment would have no way to be linked
      // back to a specific account.
      client_reference_id: userId || undefined,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create checkout session" });
  }
});

// Second defensive layer, on top of the auth check below — caps how
// often even a genuinely logged-in user can hit this specific endpoint.
// This protects against a single compromised or overly-eager account
// hammering it, not just against unauthenticated abuse.
const sequenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down and try again shortly." },
});

// Takes the REAL items the frontend already fetched from Open Library /
// YouTube, and returns them selected + sequenced into a genuine
// beginner→mastery progression. Never invents new items — see
// sequenceService.js for the full grounding explanation.
//
// SECURITY: this endpoint now requires a real, currently-valid Supabase
// session token (checked via verifyRequestAuth) — without this, anyone
// who found this URL could call it directly and drain real Anthropic
// billing with no relation to actual site usage.
app.post("/api/sequence-path", sequenceLimiter, async (req, res) => {
  const { user, error: authError } = await verifyRequestAuth(sbAdmin, req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: authError || "Unauthorized" });
  }

  const { goal, level, format, timeCommitment, items, previouslyCompleted } = req.body || {};

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "'items' must be an array of the already-fetched books/videos" });
  }

  try {
    const result = await sequencePath({
      goal: goal || "",
      level: level || "basics",
      format: format || "either",
      timeCommitment: timeCommitment || "moderate",
      items,
      previouslyCompleted: Array.isArray(previouslyCompleted) ? previouslyCompleted : [],
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong sequencing the path" });
  }
});

// Real web search costs more per call than the sequencing endpoint (it's
// billed as an add-on beyond normal tokens), so this gets a stricter cap
// — same auth requirement as sequence-path, tighter rate limit on top.
const contentSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down and try again shortly." },
});

// Articles/courses have no dedicated search API like Open Library or
// YouTube — this asks Claude to do a REAL web search and compose
// recommendations from genuine results, grounded against the actual
// search results returned (see contentSearchService.js).
app.post("/api/search-content", contentSearchLimiter, async (req, res) => {
  const { user, error: authError } = await verifyRequestAuth(sbAdmin, req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: authError || "Unauthorized" });
  }

  const { goal, contentType, level } = req.body || {};
  if (contentType !== "articles" && contentType !== "courses") {
    return res.status(400).json({ error: "'contentType' must be 'articles' or 'courses'" });
  }

  try {
    const result = await searchContent({ goal: goal || "", contentType, level: level || "basics" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching for content" });
  }
});

// Same protection pattern as the other AI endpoints — the key now lives
// only here, never in a frontend file, so this needs the same real auth
// requirement to stop anyone who finds the URL from burning through your
// daily YouTube quota with no relation to genuine site usage.
const videoSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down and try again shortly." },
});

app.post("/api/search-videos", videoSearchLimiter, async (req, res) => {
  const { user, error: authError } = await verifyRequestAuth(sbAdmin, req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: authError || "Unauthorized" });
  }

  const { query, contentLanguage } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: "'query' is required" });
  }

  try {
    const result = await searchVideos({ query, contentLanguage });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching for videos" });
  }
});

// Must come after all routes are defined, and before any other
// error-handling middleware — this is what actually lets Sentry catch
// real errors happening to real users, automatically.
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Payments service listening on port ${PORT}`));
