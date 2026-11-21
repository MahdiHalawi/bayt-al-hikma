# Bayt Al-Hikma (بيت الحكمة) — House of Wisdom

A real, live, AI-powered personalized learning platform. Someone describes what they want to learn, and the site generates a real, sequenced learning path — actual books, videos, articles, and courses, in a genuine beginner-to-mastery order. Every recommendation is grounded against real search results (Open Library, YouTube, live web search) — nothing is invented or hallucinated by the AI.

**Live at:** [baytalhikmaa.com](https://baytalhikmaa.com)
**Backend:** `https://bayt-al-hikma.onrender.com`

This is not a demo or prototype — real accounts, real payments, and real users are live on this right now.

## Real, current status

- ✅ Real accounts (Supabase Auth), with email confirmation and password reset fully working
- ✅ Real payments (Paddle, Live mode) — Stripe is not used; Paddle was chosen since Stripe doesn't support Lebanon
- ✅ Real, self-service "Manage subscription" in the UI — a live Paddle customer-portal link, not a link buried in an old receipt email
- ✅ Real security review completed: XSS escaping on all user/external content, Row Level Security verified on every table, rate limiting on cost-incurring endpoints
- ✅ Multi-language: English, Arabic (full RTL support), French
- ✅ Country-specific pricing (accessible tier for Lebanon, Jordan, Egypt, Iraq, Tunisia, Morocco)
- ✅ Legal pages live: Privacy Policy, Terms of Service, 14-day Refund Policy, standalone Pricing page
- ✅ Real analytics (Umami) and error monitoring (Sentry) live in production
- ✅ Extensive automated test coverage: 108 backend tests, 14+ frontend test files

## How the core product actually works

1. Someone types a real goal ("I want to understand philosophy")
2. A short questionnaire captures level, format preference (books/videos/articles/courses/mix), time commitment, and content language
3. The backend fetches REAL live results (Open Library for books, YouTube for videos, live web search for articles/courses)
4. Those real, already-fetched items are sent to Claude, which selects and sequences them into a genuine progression — it never invents new items, only orders and selects from what was actually found
5. The path is saved to the user's account

**Free tier**: one path per account, first 2 steps unlocked, rest locked.
**Premium**: unlimited paths, full content unlocked, progress tracker.

**A real, deliberate business rule**: once a path's content is genuinely unlocked while Premium, it stays unlocked forever, even if the subscription later lapses — matching how a one-time purchase works. Tracker access, however, specifically requires an *active* subscription regardless of any path's unlock history — an ongoing tool needs an ongoing subscription, unlike content already paid for and received.

## Real accounts — Supabase Auth

Signup, login, premium status, and progress tracking are fully real, backed by Supabase, with Row Level Security enforced on every table so a user can only ever access their own data (verified directly, not just assumed).

**A genuinely important, real bug this project hit and fixed**: email confirmation links are very often opened inside an email app's own in-app browser (Gmail, Outlook), which is a completely separate, sandboxed browser context sharing nothing with the original browser — not even localStorage. The fix: the pending goal (what someone was mid-generating at signup) is saved server-side via a dedicated backend endpoint using the service-role key (bypassing Row Level Security for this one, narrow, pre-authentication purpose — there's no active session yet at that exact moment for RLS to check against). This means whichever browser or app ends up with the confirmed session — not just the original one — can correctly resume and complete the flow. See `pendingGoalService.js` and the `save-pending-goal` endpoint in `server.js` for the full implementation and reasoning.

Custom SMTP (Brevo) is fully configured and verified working for both email confirmation and password reset — sent from `account@baytalhikmaa.com`, not Supabase's rate-limited default address.

## Real payments — Paddle (Live mode)

Stripe is kept nowhere in this codebase — Paddle is the actual, sole payment provider, chosen specifically because Stripe doesn't support Lebanon.

**How it actually works**: clicking "Upgrade to Premium" opens Paddle's real checkout widget directly in the browser, tagging the purchase with the logged-in user's real id via `customData`. When Paddle confirms payment, it calls `/webhook-paddle` — the signature is verified (HMAC-SHA256, Paddle Billing's real scheme), and only then is the user marked premium in Supabase. The browser-side `checkout.completed` event only shows a "confirming your account..." message and briefly polls for that real update — it never sets premium status itself.

**A real, serious bug this caught and fixed**: the webhook originally only listened for `transaction.completed`, but Paddle's own documentation recommends granting access on `subscription.created` for a recurring subscription product — and that's genuinely what Paddle sends. The old code silently did nothing on real payments while still replying "OK" to Paddle, meaning a real customer paid and received nothing. Confirmed and fixed — see `paddleWebhookService.js`'s `resolvePremiumAction`.

Country-specific pricing ($2.99/month for Lebanon, Jordan, Egypt, Iraq, Tunisia, Morocco; $4.99/month elsewhere) is configured directly in Paddle's dashboard, detected automatically at checkout.

Test the webhook signature verification and event-resolution logic directly, no live Paddle account needed:
```bash
cd payments-backend
node --test test/paddleWebhookService.test.js
node --test test/resolvePremiumAction.test.js
```

## Manage subscription — real, self-service cancellation

Until now, a subscriber's only way to cancel was digging up Paddle's own link from an old receipt email — not something anyone should have to do. There's now a real **"Manage subscription"** option in the site itself: click the account badge in the top bar (same spot "Log out" already lived) while logged in as Premium, and a small panel opens with a "Manage subscription" button alongside "Log out" — same floating, responsive panel component already used for login, so it fits phone and laptop screens the same way that one already does, with no separate mobile-specific work needed.

**How it actually works:** clicking it calls the backend's new `/api/manage-subscription` endpoint (auth-protected, rate-limited, same pattern as the other endpoints), which asks Paddle's real **Create Customer Portal Session** API for a live, personal link into that customer's own Paddle-hosted portal (plan, payment method, and a real "Cancel subscription" option) — then opens it in a new tab. Paddle's own docs say these links carry a short-lived token and "shouldn't be cached," so nothing is ever stored client-side; a fresh link is requested on every click.

This required capturing two ids that weren't tracked before: `paddle_customer_id` and `paddle_subscription_id`, pulled off the real webhook payload (`extractPaddleIds` in `paddleWebhookService.js`) and saved to `profiles` the moment a subscription is granted. **A real, one-time consequence of this: anyone who subscribed before this change won't have these ids on their profile yet**, so "Manage subscription" won't find anything for them until their subscription's next renewal event re-fires the webhook (or they're backfilled manually via the Paddle dashboard — their existing Paddle customer id is visible there under Customers). New subscribers from this point on are unaffected.

**Setup:** add to `payments-backend/.env`:
```
PADDLE_API_KEY=...          # Developer Tools → Authentication → API keys (NOT the client-side token)
PADDLE_API_BASE=https://api.paddle.com   # use https://sandbox-api.paddle.com while testing in Sandbox
```

**Database migration required** — run once in the Supabase SQL Editor:
```sql
alter table profiles add column paddle_customer_id text;
alter table profiles add column paddle_subscription_id text;
```

Test the id-extraction and portal-link logic directly, no live Paddle account needed:
```bash
cd payments-backend
node --test test/extractPaddleIds.test.js
node --test test/paddlePortalService.test.js
```

## Book selection — "AI proposes, then verify"

Open Library keyword search returns title matches and obscure/old scans, so books are now chosen differently: `/api/suggest-books` (`bookSuggestService.js`) has Claude propose 10–12 well-known books for the goal (and translate Arabic/French goals to a short English search goal), then **every candidate is verified against Open Library by title + author** — unverified books are dropped, so nothing is invented. The most-published record wins. Newest buyable edition is preferred over an older, more-published one (the year is shown on the card). If fewer than 4 verify, a second round asks for different/broader books; if still short, a popularity-sorted (`sort=editions`) keyword search with the English goal tops it up. Every format (books, videos, articles, courses, mix) is held to a minimum of 4 real items: short results are broadened and topped up, and the sequencer is told to pick at least 4.

Breadth applies to every format: article/course web searches are told to cover foundation, core, history, adjacent-discipline and current-relevance angles, and video searches run up to 3 angle searches (core + foundation + adjacent, planned by the cheap `/api/plan-angles` call; each YouTube search costs 100 of the 10,000 daily quota units).

Every book card also carries a "Find this book" link (a Google Books search), since most books have no free edition; a "mix" path asks the sequencer for at least 2 items of each available format; and the sequencer writes its one-line reasons in the language the goal was typed in. Paths are capped at 7 steps and floored at 4.

## Guest generation — the path comes before the signup

A visitor no longer has to create an account (and confirm an email) before seeing anything. They type a goal, answer the questions, and their first path is built straight away. The first 2 steps are open, exactly like a free account. Signup is asked for afterwards, to **save** the path or unlock more, and the path they already built is saved to the new account as-is (no second generation, including when the email is confirmed in a different browser: the path travels with the pending goal).

**How cost is protected** (`guestAccessService.js`): a guest is a random id kept in the browser, sent as an `X-Guest-Id` header instead of a session token. The backend allows one path per guest id per day, caps every IP address at a small multiple of that (so clearing storage or changing the id doesn't help), and stops all guest paths at a global daily ceiling. Counters are in memory and reset daily and on a restart.

**Settings** (`payments-backend/.env`, both optional):
```
GUEST_GENERATION_ENABLED=false   # switch guests off: every AI endpoint requires a session again
GUEST_DAILY_PATH_CAP=150         # most guest paths per day, across all visitors
```

New Umami events: `signup_prompt_shown` and `guest_path_saved`; `path_generated` now carries `guest: true/false`. The funnel order is now goal_submitted → path_generated → signup_completed.

```bash
cd payments-backend
node --test test/guestAccessService.test.js
```

## Free-tier enforcement — a real bug worth knowing about

The free-path-limit (one path per free account) is enforced **on the backend**, not just the frontend — a frontend-only check is really just a suggestion, trivially bypassed by a browser back button, a fresh tab, or calling the endpoint directly, and every bypass burns a real, paid Anthropic API call regardless. See `pathLimitService.js` for the authoritative, tested enforcement.

A related real bug: the frontend originally treated a legitimate 403 "you've reached your limit" rejection identically to a generic network failure, silently falling back to generating a path anyway — completely bypassing the backend's correct rejection. Fixed by having the frontend specifically recognize and respect that rejection code (`FREE_PATH_LIMIT_REACHED`) rather than degrading past it.

## Security

- **XSS**: all user-typed and external/AI-generated content (goals, book titles, authors, AI-written descriptions) is HTML-escaped before rendering; URLs going into `href`/`src` attributes are validated as genuine `http(s)` links or dropped.
- **Row Level Security**: enabled and verified on `profiles`, `paths`, and `progress` — confirmed directly by querying as a real user and checking only their own data returns, not just trusting policy names.
- **Rate limiting**: on `/api/sequence-path` (10/min) and `/api/save-pending-goal` (10/min), since both can be called by an unauthenticated or minimally-authenticated client.
- **Auth-protected AI endpoints**: every AI/search endpoint requires either a genuine, currently-valid Supabase session token or a guest id inside its small daily quota (see "Guest generation" above). A present-but-invalid token is always rejected, never treated as a guest.

## Video search, AI sequencing, articles/courses

Same real-content grounding throughout — books (Open Library, no key needed), videos (YouTube, key lives only in the backend `.env`, never in any frontend file), and articles/courses (live web search) are all fetched for real before Claude ever sees them, and Claude only selects and sequences from what was actually found.

## RTL and multi-language — real, hard-won lessons

Arabic support is genuine, not just translated strings — full `dir="rtl"` layout switching. A real, repeated class of bug during development: physical CSS properties (`left`, `right`, `margin-left`) don't automatically flip for RTL, since they mean the same physical side regardless of text direction. Fixed by converting to logical properties (`inset-inline-start`, `margin-inline-end`) wherever this mattered — confirmed with real rendered tests in both directions, not just assumed correct.

## Running it locally

```bash
python3 -m http.server 8000
```
Open `http://localhost:8000`.

```bash
cd payments-backend
npm install
cp .env.example .env
# fill in real Supabase, Paddle, Anthropic, and YouTube keys
node server.js
```

## Testing

```bash
cd payments-backend
node --test test/*.test.js
```

103 tests, covering auth, rate limiting, webhook signature verification and event resolution, the free-path-limit enforcement, content search grounding, sequencing, the pending-goal cross-browser fix, and the Paddle id-extraction/portal-link logic behind "Manage subscription."

Frontend tests (jsdom-based, simulating real user flows including signup, cross-device/cross-browser confirmation, XSS payloads, and the permanent-unlock logic) live alongside the project and are run individually with `node <test-file>.js`.

## Known, genuinely open items (not oversights — real, current status)

- Trademark question on the name "Bayt Al-Hikma" — real conflicts found (a Tunisian research institution, an Iraqi academic institution, a UK publisher), sent to a lawyer, unresolved
- Business registration — deliberately deferred; operating as an individual for now, revisit if the product gains real traction
- Two of four planned social post templates (testimonial, educational) still need final real content in some cases
- Book/article/course catalog coverage for less common topics can still fall back to a generic, less-tailored result — the site now honestly tells the user when this happens, rather than presenting a mismatched path silently

### Traffic source and deep links

Funnel events sent to Umami now carry a `source` property (from `?utm_source=`, `?src=`, or the referrer host, otherwise `direct`). Social posts can link to `baytalhikmaa.com/?utm_source=tiktok&topic=philosophy`: the topic pre-fills the goal box.
