const assert = require("node:assert");
const test = require("node:test");
const { resolvePremiumAction } = require("../paddleWebhookService");

test("THE ACTUAL REPORTED BUG: subscription.created (what Paddle really sends) now correctly grants access", () => {
  const event = {
    event_type: "subscription.created",
    data: { custom_data: { userId: "hasan-real-user-1" } },
  };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, "grant");
  assert.strictEqual(result.userId, "hasan-real-user-1");
});

test("subscription.activated also correctly grants access", () => {
  const event = {
    event_type: "subscription.activated",
    data: { custom_data: { userId: "user-2" } },
  };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, "grant");
});

test("transaction.completed still works too, for backwards compatibility", () => {
  const event = {
    event_type: "transaction.completed",
    data: { custom_data: { userId: "user-3" } },
  };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, "grant");
});

test("THE OLD BUG, confirmed fixed: previously-unhandled events now correctly do nothing (not an error, just correctly ignored)", () => {
  const event = {
    event_type: "subscription.trialing",
    data: { custom_data: { userId: "user-4" } },
  };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, null);
});

test("subscription.canceled correctly triggers a revoke, not a grant", () => {
  const event = {
    event_type: "subscription.canceled",
    data: { custom_data: { userId: "user-5" } },
  };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, "revoke");
  assert.strictEqual(result.userId, "user-5");
});

test("handles a missing userId gracefully — action is still identified, but userId is null, not a crash", () => {
  const event = { event_type: "subscription.created", data: { custom_data: {} } };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.action, "grant");
  assert.strictEqual(result.userId, null);
});

test("checks the alternate customData (camelCase) key too, not just custom_data", () => {
  const event = { event_type: "subscription.created", data: { customData: { userId: "user-6" } } };
  const result = resolvePremiumAction(event);
  assert.strictEqual(result.userId, "user-6");
});

test("doesn't crash on a malformed/empty event", () => {
  assert.deepStrictEqual(resolvePremiumAction(null), { action: null, userId: null });
  assert.deepStrictEqual(resolvePremiumAction({}), { action: null, userId: null });
  assert.deepStrictEqual(resolvePremiumAction({ event_type: "subscription.created" }), { action: "grant", userId: null });
});