const crypto = require("crypto");

// Paddle Billing (the current product — NOT the older, deprecated
// "Paddle Classic," which uses a completely different public-key
// scheme) signs every webhook with HMAC-SHA256 over the raw request
// body, keyed with a per-notification-destination secret.
//
// Header format: "ts=<timestamp>;h1=<hex signature>"
// Signed payload: "<timestamp>:<raw request body>" (exact bytes, no
// reformatting — any whitespace/formatting change produces a different
// signature than what Paddle computed).
//
// Paddle's own docs don't mention this, but the signature is HEX
// encoded, not base64 — confirmed across multiple independent
// real-world implementations.
function verifyPaddleSignature(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader || !secretKey || !rawBody) return false;

  const parts = {};
  signatureHeader.split(";").forEach((segment) => {
    const [key, value] = segment.split("=");
    if (key && value) parts[key] = value;
  });

  const { ts, h1 } = parts;
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computedSignature = crypto.createHmac("sha256", secretKey).update(signedPayload).digest("hex");

  try {
    const computedBuffer = Buffer.from(computedSignature, "hex");
    const receivedBuffer = Buffer.from(h1, "hex");
    // Different lengths would make timingSafeEqual throw rather than
    // return false — checked explicitly first so a malformed/wrong-
    // length signature is a clean rejection, not a crash.
    if (computedBuffer.length !== receivedBuffer.length) return false;
    // Timing-safe comparison — a plain === comparison would leak timing
    // information an attacker could use to guess the signature byte by
    // byte.
    return crypto.timingSafeEqual(computedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

module.exports = { verifyPaddleSignature };

// Determines what premium-status action (if any) a given, already-parsed
// Paddle webhook event implies, and for which user. Extracted into its
// own small, directly testable function — real production bug found
// exactly this way: this used to only act on "transaction.completed",
// but Paddle's own documentation explicitly recommends granting access
// on "subscription.created" for a recurring subscription product, and
// that's genuinely what Paddle sends — confirmed directly against real
// delivered events for two real live payments where the old code
// silently did nothing while still replying "OK" to Paddle.
//
// Returns { action: "grant" | "revoke" | null, userId: string | null }.
function resolvePremiumAction(event) {
  const GRANT_EVENTS = ["subscription.created", "subscription.activated", "transaction.completed"];
  const REVOKE_EVENTS = ["subscription.canceled"];

  if (!event || !event.event_type) return { action: null, userId: null };

  // custom_data can appear under slightly different keys depending on
  // the event type — check both rather than assuming one fixed shape,
  // since exactly this kind of mismatch caused the original bug.
  const userId =
    (event.data && event.data.custom_data && event.data.custom_data.userId) ||
    (event.data && event.data.customData && event.data.customData.userId) ||
    null;

  if (GRANT_EVENTS.includes(event.event_type)) return { action: "grant", userId };
  if (REVOKE_EVENTS.includes(event.event_type)) return { action: "revoke", userId };
  return { action: null, userId };
}

module.exports.resolvePremiumAction = resolvePremiumAction;