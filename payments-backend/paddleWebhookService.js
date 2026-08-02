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
