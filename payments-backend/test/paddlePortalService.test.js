const assert = require("node:assert");
const test = require("node:test");
const { createPaddlePortalSession } = require("../paddlePortalService");

function fakeFetch(responseBody, { ok = true, status = 200 } = {}) {
  return async (url, opts) => ({
    ok,
    status,
    text: async () => JSON.stringify(responseBody),
    json: async () => responseBody,
    _url: url,
    _opts: opts,
  });
}

test("returns the general overview link when Paddle provides one", async () => {
  const fetchImpl = fakeFetch({ data: { urls: { general: { overview: "https://buyer-portal.paddle.com/overview/abc" } } } });
  const result = await createPaddlePortalSession({ customerId: "ctm_1", subscriptionId: "sub_1", apiKey: "key", fetchImpl });
  assert.strictEqual(result.url, "https://buyer-portal.paddle.com/overview/abc");
});

test("falls back to the per-subscription link if no general overview link is returned", async () => {
  const fetchImpl = fakeFetch({
    data: { urls: { subscriptions: [{ cancel_subscription: "https://buyer-portal.paddle.com/subscriptions/sub_1/cancel" }] } },
  });
  const result = await createPaddlePortalSession({ customerId: "ctm_1", subscriptionId: "sub_1", apiKey: "key", fetchImpl });
  assert.strictEqual(result.url, "https://buyer-portal.paddle.com/subscriptions/sub_1/cancel");
});

test("sends the subscription id in the request body when one is provided, so Paddle returns a subscription-specific link too", async () => {
  let capturedBody = null;
  const fetchImpl = async (url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ data: { urls: { general: { overview: "https://x" } } } }) };
  };
  await createPaddlePortalSession({ customerId: "ctm_1", subscriptionId: "sub_9", apiKey: "key", fetchImpl });
  assert.deepStrictEqual(capturedBody, { subscription_ids: ["sub_9"] });
});

test("omits subscription_ids from the request body when no subscription id is known yet", async () => {
  let capturedBody = null;
  const fetchImpl = async (url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ data: { urls: { general: { overview: "https://x" } } } }) };
  };
  await createPaddlePortalSession({ customerId: "ctm_1", apiKey: "key", fetchImpl });
  assert.deepStrictEqual(capturedBody, {});
});

test("sends the real Bearer auth header and hits the documented endpoint shape", async () => {
  let capturedUrl = null;
  let capturedHeaders = null;
  const fetchImpl = async (url, opts) => {
    capturedUrl = url;
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({ data: { urls: { general: { overview: "https://x" } } } }) };
  };
  await createPaddlePortalSession({ customerId: "ctm_42", apiKey: "secret-key", apiBase: "https://api.paddle.com", fetchImpl });
  assert.strictEqual(capturedUrl, "https://api.paddle.com/customers/ctm_42/portal-sessions");
  assert.strictEqual(capturedHeaders.Authorization, "Bearer secret-key");
});

test("throws a clear error when Paddle responds with a failure status, rather than silently returning nothing", async () => {
  const fetchImpl = fakeFetch({ error: { detail: "not found" } }, { ok: false, status: 404 });
  await assert.rejects(() => createPaddlePortalSession({ customerId: "ctm_bad", apiKey: "key", fetchImpl }), /404/);
});

test("returns a null url (not a crash) if Paddle's response is missing the urls object entirely", async () => {
  const fetchImpl = fakeFetch({ data: {} });
  const result = await createPaddlePortalSession({ customerId: "ctm_1", apiKey: "key", fetchImpl });
  assert.strictEqual(result.url, null);
});

test("requires a customerId", async () => {
  await assert.rejects(() => createPaddlePortalSession({ apiKey: "key", fetchImpl: fakeFetch({}) }), /customerId/);
});

test("requires an apiKey", async () => {
  await assert.rejects(() => createPaddlePortalSession({ customerId: "ctm_1", fetchImpl: fakeFetch({}) }), /API key/);
});
