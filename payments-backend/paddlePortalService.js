// Generates a real, authenticated Paddle customer-portal link on demand,
// via Paddle's "Create a customer portal session" API
// (POST /customers/{customer_id}/portal-sessions). This is the correct,
// current Paddle Billing mechanism for self-service "Manage subscription"
// — confirmed against Paddle's own docs, which explicitly say these
// links carry a temporary token and "shouldn't be cached" or stored.
// So this is called fresh every single time someone clicks the button,
// never saved anywhere.
//
// fetchImpl is injectable so this can be unit-tested with a fake
// response, exactly like the rest of this backend's approach to
// testing real network-dependent logic (see sequenceService.js,
// contentSearchService.js).
async function createPaddlePortalSession({ customerId, subscriptionId, apiKey, apiBase, fetchImpl }) {
  if (!customerId) {
    throw new Error("createPaddlePortalSession requires a customerId");
  }
  if (!apiKey) {
    throw new Error("createPaddlePortalSession requires a Paddle API key");
  }

  const doFetch = fetchImpl || fetch;
  const base = apiBase || "https://api.paddle.com";

  // Passing subscription_ids gets Paddle to also return a
  // subscription-specific deep link (see below) — but it's optional,
  // since an account could in principle have a stored customer id
  // without yet having a subscription id captured (e.g. an older
  // record from before this field was tracked).
  const body = subscriptionId ? { subscription_ids: [subscriptionId] } : {};

  const res = await doFetch(`${base}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await (res.text ? res.text().catch(() => "") : Promise.resolve(""));
    throw new Error(`Paddle portal session request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const urls = json && json.data && json.data.urls;
  if (!urls) return { url: null };

  // The general overview page is the right landing spot for a "Manage
  // subscription" button — it shows the plan, payment method, and the
  // option to cancel, rather than dropping someone straight into a
  // one-click cancellation flow. Only fall back to the per-subscription
  // link if Paddle didn't return an overview link for some reason.
  const subscriptionLink =
    subscriptionId && Array.isArray(urls.subscriptions) && urls.subscriptions[0]
      ? urls.subscriptions[0].cancel_subscription || urls.subscriptions[0].update_subscription_payment_method
      : null;

  return { url: (urls.general && urls.general.overview) || subscriptionLink || null };
}

module.exports = { createPaddlePortalSession };
