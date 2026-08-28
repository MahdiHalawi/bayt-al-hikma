// Paddle client-side setup. This token is safe to expose in the browser
// by design (same reasoning as Stripe's old publishable key) — real
// security comes entirely from the webhook-only premium-marking on the
// backend, never from anything client-side.
//
// IMPORTANT: this is set to "sandbox" right now — switch environment to
// "production" (and swap the token for your real LIVE client-side
// token) only once you've fully tested the sandbox flow end to end,
// including a real webhook actually marking a test account premium.
window.PADDLE_CLIENT_TOKEN = "test_4d9ba9a79a08c8147793a0da56c";
window.PADDLE_PRICE_ID = "pri_01kz0rgecs190vx3fwvz37bwd7";
window.PADDLE_ENVIRONMENT = "sandbox"; // change to "production" when actually going live

if (window.Paddle && !window.PADDLE_CLIENT_TOKEN.includes("PASTE_YOUR")) {
  Paddle.Environment.set(window.PADDLE_ENVIRONMENT);
  Paddle.Initialize({
    token: window.PADDLE_CLIENT_TOKEN,
    eventCallback: function (data) {
      // This is UX feedback ONLY — it never sets premium status
      // directly. The actual, authoritative confirmation only ever
      // comes from the server-side webhook. See handlePaddleCheckoutCompleted
      // in app.js, which polls Supabase to reflect what the webhook set,
      // rather than trusting this browser event on its own.
      if (data.name === "checkout.completed" && typeof handlePaddleCheckoutCompleted === "function") {
        handlePaddleCheckoutCompleted();
      }
      // Fires when checkout closes for ANY reason, including the
      // customer cancelling without paying — distinct from
      // checkout.completed above. Most of the time this needs no
      // special handling (closing just reveals whatever real screen was
      // already underneath), but see handlePaddleCheckoutClosed in
      // app.js for the one real exception: the premium-first flow,
      // where there's nothing real underneath to fall back to.
      if (data.name === "checkout.closed" && typeof handlePaddleCheckoutClosed === "function") {
        handlePaddleCheckoutClosed();
      }
    },
  });

  // Our own pricing card previously always showed a hardcoded "$4.99" —
  // real, but only for the base/default rate. Anyone with a country
  // override (e.g. Lebanon, Jordan, Egypt at $2.99) would see the WRONG
  // price right up until Paddle's own checkout opened and showed the
  // correct one — a confusing mismatch. This fetches the REAL price for
  // wherever the visitor actually is (auto-detected from their IP by
  // Paddle itself, no location info needs to be passed) and updates our
  // own display to match what they'll genuinely be charged.
  if (!window.PADDLE_PRICE_ID.includes("PASTE_YOUR")) {
    Paddle.PricePreview({
      items: [{ priceId: window.PADDLE_PRICE_ID, quantity: 1 }],
    })
      .then((result) => {
        const lineItem = result.data.details.lineItems[0];
        const priceEl = document.getElementById("pricing-price-value");
        if (lineItem && priceEl) {
          priceEl.textContent = lineItem.formattedTotals.total;
        }
      })
      .catch((err) => {
        console.warn("Could not fetch localized pricing, showing the default rate instead:", err);
      });
  }
}