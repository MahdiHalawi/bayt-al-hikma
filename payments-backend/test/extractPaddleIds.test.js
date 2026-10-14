const assert = require("node:assert");
const test = require("node:test");
const { extractPaddleIds } = require("../paddleWebhookService");

test("pulls customer id and subscription id off a real subscription.created event", () => {
  const event = {
    event_type: "subscription.created",
    data: { id: "sub_01h8bzakzx3hm2fmen703n5q45", customer_id: "ctm_01h8bzakzx3hm2fmen703n5q45", custom_data: { userId: "user-1" } },
  };
  const result = extractPaddleIds(event);
  assert.strictEqual(result.customerId, "ctm_01h8bzakzx3hm2fmen703n5q45");
  assert.strictEqual(result.subscriptionId, "sub_01h8bzakzx3hm2fmen703n5q45");
});

test("subscription.activated works the same way", () => {
  const event = {
    event_type: "subscription.activated",
    data: { id: "sub_2", customer_id: "ctm_2" },
  };
  const result = extractPaddleIds(event);
  assert.strictEqual(result.customerId, "ctm_2");
  assert.strictEqual(result.subscriptionId, "sub_2");
});

test("transaction.completed reads the subscription id from data.subscription_id, NOT data.id (which is the transaction's own id there)", () => {
  const event = {
    event_type: "transaction.completed",
    data: { id: "txn_should_not_be_used", subscription_id: "sub_3", customer_id: "ctm_3" },
  };
  const result = extractPaddleIds(event);
  assert.strictEqual(result.customerId, "ctm_3");
  assert.strictEqual(result.subscriptionId, "sub_3");
});

test("a transaction.completed event with no subscription_id at all correctly yields no subscription id, rather than misreading the transaction id as one", () => {
  const event = {
    event_type: "transaction.completed",
    data: { id: "txn_only", customer_id: "ctm_4" },
  };
  const result = extractPaddleIds(event);
  assert.strictEqual(result.customerId, "ctm_4");
  assert.strictEqual(result.subscriptionId, null);
});

test("doesn't crash on a malformed/empty event", () => {
  assert.deepStrictEqual(extractPaddleIds(null), { customerId: null, subscriptionId: null });
  assert.deepStrictEqual(extractPaddleIds({}), { customerId: null, subscriptionId: null });
  assert.deepStrictEqual(extractPaddleIds({ event_type: "subscription.created" }), { customerId: null, subscriptionId: null });
});
