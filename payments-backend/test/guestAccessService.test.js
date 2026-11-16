const assert = require("node:assert");
const test = require("node:test");
const { isValidGuestId, createGuestQuota, resolveRequester } = require("../guestAccessService");

const G1 = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";
const G2 = "7a1c9e3b-2d4f-4a6b-9c8d-0e1f2a3b4c5d";

test("accepts a real UUID as a guest id and rejects anything else", () => {
  assert.strictEqual(isValidGuestId(G1), true);
  assert.strictEqual(isValidGuestId("not-a-uuid"), false);
  assert.strictEqual(isValidGuestId(""), false);
  assert.strictEqual(isValidGuestId(undefined), false);
  assert.strictEqual(isValidGuestId({ toString: () => G1 }), false);
});

test("a guest gets exactly one path per day", () => {
  const q = createGuestQuota();
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
  const second = q.consume("sequence-path", G1, "1.1.1.1");
  assert.strictEqual(second.allowed, false);
  assert.strictEqual(second.reason, "guest_limit");
});

test("changing the guest id does not get around the per-IP cap", () => {
  const q = createGuestQuota({ ipMultiplier: 2 });
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  assert.strictEqual(q.consume("sequence-path", id(1), "2.2.2.2").allowed, true);
  assert.strictEqual(q.consume("sequence-path", id(2), "2.2.2.2").allowed, true);
  const third = q.consume("sequence-path", id(3), "2.2.2.2");
  assert.strictEqual(third.allowed, false);
  assert.strictEqual(third.reason, "ip_limit");
});

test("different guests on different IPs do not affect each other", () => {
  const q = createGuestQuota();
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
  assert.strictEqual(q.consume("sequence-path", G2, "3.3.3.3").allowed, true);
});

test("the global daily cap stops all guest paths once reached", () => {
  const q = createGuestQuota({ globalDailyPaths: 2 });
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  assert.strictEqual(q.consume("sequence-path", id(1), "10.0.0.1").allowed, true);
  assert.strictEqual(q.consume("sequence-path", id(2), "10.0.0.2").allowed, true);
  const third = q.consume("sequence-path", id(3), "10.0.0.3");
  assert.strictEqual(third.allowed, false);
  assert.strictEqual(third.reason, "global_limit");
});

test("limits reset after a day", () => {
  let t = 1000;
  const q = createGuestQuota({ now: () => t });
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, false);
  t += 24 * 60 * 60 * 1000 + 1;
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
});

test("a refund gives the path back after a server-side failure", () => {
  const q = createGuestQuota({ globalDailyPaths: 1 });
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
  q.refund("sequence-path", G1, "1.1.1.1");
  assert.strictEqual(q.consume("sequence-path", G1, "1.1.1.1").allowed, true);
});

test("an endpoint that is not opened to guests is always refused", () => {
  const q = createGuestQuota();
  assert.strictEqual(q.consume("manage-subscription", G1, "1.1.1.1").allowed, false);
});

test("supporting searches allow the few calls one path needs, then stop", () => {
  const q = createGuestQuota();
  for (let i = 0; i < 6; i++) assert.strictEqual(q.consume("search-videos", G1, "1.1.1.1").allowed, true);
  assert.strictEqual(q.consume("search-videos", G1, "1.1.1.1").allowed, false);
});

const okAuth = async () => ({ user: { id: "user-1" }, error: null });
const badAuth = async () => ({ user: null, error: "Invalid or expired session" });

test("a logged-in user is resolved as a user, never as a guest", async () => {
  const who = await resolveRequester({ sbAdmin: {}, headers: { authorization: "Bearer x", "x-guest-id": G1 }, verifyRequestAuth: okAuth, guestsEnabled: true });
  assert.strictEqual(who.user.id, "user-1");
  assert.strictEqual(who.guest, null);
});

test("an invalid token is rejected, not downgraded to guest", async () => {
  const who = await resolveRequester({ sbAdmin: {}, headers: { authorization: "Bearer bad", "x-guest-id": G1 }, verifyRequestAuth: badAuth, guestsEnabled: true });
  assert.strictEqual(who.user, null);
  assert.strictEqual(who.guest, null);
  assert.ok(who.error);
});

test("no token plus a valid guest id resolves as a guest", async () => {
  const who = await resolveRequester({ sbAdmin: {}, headers: { "x-guest-id": G1 }, verifyRequestAuth: okAuth, guestsEnabled: true });
  assert.strictEqual(who.guest.id, G1);
});

test("guests are refused when the feature is switched off", async () => {
  const who = await resolveRequester({ sbAdmin: {}, headers: { "x-guest-id": G1 }, verifyRequestAuth: okAuth, guestsEnabled: false });
  assert.strictEqual(who.guest, null);
  assert.ok(who.error);
});

test("no token and no valid guest id is refused", async () => {
  const who = await resolveRequester({ sbAdmin: {}, headers: { "x-guest-id": "junk" }, verifyRequestAuth: okAuth, guestsEnabled: true });
  assert.strictEqual(who.user, null);
  assert.strictEqual(who.guest, null);
});
