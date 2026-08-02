const assert = require("node:assert");
const test = require("node:test");
const crypto = require("node:crypto");
const { verifyPaddleSignature } = require("../paddleWebhookService");

const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ event_type: "transaction.completed", data: { custom_data: { userId: "user-123" } } });

// Computes a signature the EXACT same way Paddle's own servers do, so
// we're testing against a genuinely correct reference, not just
// whatever our own implementation happens to produce.
function realPaddleSignature(ts, body, secret) {
  const signedPayload = `${ts}:${body}`;
  return crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
}

test("accepts a genuinely valid signature, computed the real way", () => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const h1 = realPaddleSignature(ts, BODY, SECRET);
  const header = `ts=${ts};h1=${h1}`;
  assert.strictEqual(verifyPaddleSignature(BODY, header, SECRET), true);
});

test("rejects a signature if the body was tampered with after signing", () => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const h1 = realPaddleSignature(ts, BODY, SECRET);
  const header = `ts=${ts};h1=${h1}`;
  const tamperedBody = JSON.stringify({ event_type: "transaction.completed", data: { custom_data: { userId: "ATTACKER-999" } } });
  assert.strictEqual(verifyPaddleSignature(tamperedBody, header, SECRET), false);
});

test("rejects a signature computed with the wrong secret", () => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const h1 = realPaddleSignature(ts, BODY, "wrong-secret");
  const header = `ts=${ts};h1=${h1}`;
  assert.strictEqual(verifyPaddleSignature(BODY, header, SECRET), false);
});

test("rejects a malformed header missing the h1 part", () => {
  assert.strictEqual(verifyPaddleSignature(BODY, "ts=12345", SECRET), false);
});

test("rejects a malformed header missing the ts part", () => {
  assert.strictEqual(verifyPaddleSignature(BODY, "h1=abc123", SECRET), false);
});

test("rejects when the signature header is entirely missing", () => {
  assert.strictEqual(verifyPaddleSignature(BODY, undefined, SECRET), false);
});

test("rejects when the secret key is entirely missing (not configured)", () => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const h1 = realPaddleSignature(ts, BODY, SECRET);
  const header = `ts=${ts};h1=${h1}`;
  assert.strictEqual(verifyPaddleSignature(BODY, header, undefined), false);
});

test("rejects a signature of the wrong length/format without crashing", () => {
  assert.strictEqual(verifyPaddleSignature(BODY, "ts=12345;h1=not-valid-hex-zzz", SECRET), false);
});

test("a real signature for a DIFFERENT body does not accidentally validate this one", () => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const differentBody = JSON.stringify({ event_type: "subscription.canceled" });
  const h1 = realPaddleSignature(ts, differentBody, SECRET);
  const header = `ts=${ts};h1=${h1}`;
  assert.strictEqual(verifyPaddleSignature(BODY, header, SECRET), false);
});
