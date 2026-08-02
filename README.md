# Bayt Al-Hikma — v2 (your design, wired with the discussed features)

Your visual design is kept as-is — the astrolabe, medallion, manuscript framing, all of it untouched. This adds: theme + language switching, the free/premium locked-path behavior, a demo signup/login flow, and a real (optional) Stripe payment integration.

## What changed from the file you sent

- **Removed Canva-specific scripts** (`__codeletBootstrap__`, the `/_sdk/*.js` telemetry/editing scripts) — these only work inside Canva's own editor and would either 404 or do nothing on a real host.
- **Replaced `canva://...` image sources** with local file paths (`assets/hoopoe/...`). Canva's internal image references don't resolve outside Canva — see "Missing images" below.
- **Added:** a password field on the signup step, a "Been here before? Log in" link + demo login panel, a free/premium plan badge, locked path cards (steps 2+ blurred with a lock, matching the earlier design decision), an upgrade/payment modal, and a real (optional) Stripe backend.
- Everything else — layout, animation, copy, structure — is exactly what you sent.

## Missing images (action needed)

Only `guiding.png` and `presenting.png` are included in `assets/hoopoe/` — these are the corrected versions (black crest tips removed) from earlier in this project. **`welcome.png`, `seeking.png`, and `rest.png` are not included** because I never received local copies of those specific files to place here. Add your approved versions of those three into `assets/hoopoe/` with those exact filenames, or the corresponding images on the page will simply appear broken.

## Running it

Plain static files, no build step:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000`. (A normal file double-click will mostly work too, but form/JS behavior is more reliable over a real local server.)

## How each requested feature works

**Free/Premium locking** — `state.isPremium` (in `app.js`) controls this. When false, only the first path card renders fully; the rest render blurred with a lock overlay and open the upgrade modal on click. This mirrors the exact locked-steps design agreed on earlier.

**Signup/login** — both the seeking-screen signup form and the landing-page "log in" panel are **demo-only**: they check that the fields look filled in, not against any real account database. Wiring real accounts means adding Supabase Auth or Firebase Auth (as discussed) — neither is wired in here yet.

**Payment — this is the one piece that's genuinely real, not just simulated:**
- `payments-backend/server.js` is a small, real Express + Stripe server.
- Clicking "Upgrade to Premium" first tries calling that backend (`http://localhost:4242/api/create-checkout-session`). If it's running and configured with real Stripe keys, **you get redirected to an actual Stripe Checkout page** — a real payment flow.
- If that backend isn't running (e.g. you're just reviewing the UI), it falls back to a demo unlock after a short delay, purely so the flow can be clicked through end to end. This fallback branch is explicitly marked in the code as something that must not exist in a real production build.
- **The most important architectural point, worth understanding even if you don't touch payments yet:** a user should only ever be marked "premium" from the Stripe **webhook** handler (`/webhook` in `server.js`), after Stripe itself confirms payment succeeded — never immediately after a checkout redirect, and never from browser-side code. The comments in both files walk through exactly why.

### To actually run the payments backend

## Paddle — the real payment provider (Stripe doesn't support Lebanon)

The Stripe code above is kept as a working reference architecture, but
**Paddle is the actual provider this project uses**, since Stripe isn't
available in Lebanon. Same core principle as Stripe: a user is only ever
marked premium from a **verified webhook**, never from the frontend.

**Setup:**
1. Create a Product + a recurring Price in your Paddle dashboard (Sandbox
   first — always test there before Live).
2. Get your **API Key** and **Client-side token** from Developer Tools →
   Authentication.
3. Set up a webhook: Developer Tools → Notifications → New destination →
   point it at `https://your-backend-url/webhook-paddle`, subscribe to
   at least `transaction.completed`, then copy the **Secret key** shown
   after saving.
4. In `payments-backend/.env`, add `PADDLE_WEBHOOK_SECRET`.
5. In `paddle-config.js` (frontend), paste your real `PADDLE_CLIENT_TOKEN`
   and `PADDLE_PRICE_ID`. Leave `PADDLE_ENVIRONMENT` as `"sandbox"` until
   you've fully tested a real purchase end to end.

**How it actually works:** clicking "Upgrade to Premium" opens Paddle's
real checkout widget directly in the browser (via `Paddle.Checkout.open`),
tagging the purchase with the logged-in user's real id via `customData`.
When Paddle confirms the payment, it calls `/webhook-paddle` — the
signature is verified (HMAC-SHA256, Paddle Billing's real scheme — see
`paddleWebhookService.js` for the exact algorithm and why it's
implemented this specific way), and only then is the user marked
premium in Supabase. The browser-side `checkout.completed` event is
used only to show a "confirming your account..." message and briefly
poll for that real update — it never sets premium status itself.

If Paddle isn't configured yet (still testing locally), this falls back
to the same demo unlock as before.

Test the signature verification logic itself, with real computed HMAC
test vectors, no live Paddle account needed:
```bash
cd payments-backend
node --test test/paddleWebhookService.test.js
```

### To actually run the payments backend
```bash
cd payments-backend
npm install express stripe dotenv cors express-rate-limit @supabase/supabase-js
cp .env.example .env
# fill in real Stripe TEST keys — https://dashboard.stripe.com/test/apikeys
# create a Product + recurring Price in the Stripe dashboard, paste its id in too
node server.js
```
Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) (`stripe listen --forward-to localhost:4242/webhook`) to test the webhook locally — Stripe won't reach `localhost` directly from the internet.

## Setting up real accounts + database (Supabase)

Signup, login, premium status, and tracker progress are now REAL — backed
by your own Supabase project, not just in-memory demo state.

1. Create a free project at supabase.com.
2. In the SQL Editor, run the table + Row Level Security setup (ask me
   again if you need this SQL re-shown — it creates `profiles` and
   `progress` tables with policies so users can only ever access their
   own rows).
3. Go to Project Settings → API, copy your **Project URL** and **anon
   public key**, and paste them into `supabase-config.js`.
4. **For easier testing:** in Authentication → Providers → Email, turn
   OFF "Confirm email" — otherwise every signup requires clicking a
   confirmation link before they can log in.
5. In `payments-backend/.env`, also fill in `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API — this is the
   SECRET key, different from the anon key above, and must never appear
   in any frontend file).

With both pieces configured: signup creates a real account, login reads
your real saved premium status and progress, tracker toggles persist to
the database, and a real Stripe payment (via the backend) marks the
correct user premium through the webhook — not from the browser.

### Full SQL migration history (run these in order, in the SQL Editor)

If you're setting this up from scratch, run all of these once, in order:

```sql
-- Core tables + Row Level Security
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  is_premium boolean default false
);

create table progress (
  user_id uuid references auth.users on delete cascade,
  book_id text not null,
  done boolean default true
);

alter table profiles enable row level security;
alter table progress enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);
create policy "Users can manage their own progress"
  on progress for all using (auth.uid() = user_id);

-- Multiple saved paths per user
create table paths (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  goal text,
  topic text,
  created_at timestamptz default now()
);
alter table paths enable row level security;
create policy "Users can manage their own paths"
  on paths for all using (auth.uid() = user_id);

-- Tie progress to a specific path (not just a user), and fix the
-- primary key so the same book id can be tracked separately per path
alter table progress add column path_id uuid references paths(id) on delete cascade;
delete from progress where path_id is null;
alter table progress drop constraint progress_pkey;
alter table progress add primary key (user_id, book_id, path_id);

-- Multi-format questionnaire (books/articles/videos/courses + language)
alter table paths add column content_type text default 'mix';
alter table paths add column content_language text default 'any';

-- Store the ACTUAL chosen items per path, so reopening a path replays
-- exactly what was shown instead of re-running a live search
alter table paths add column items jsonb;
```

## Video search — backend-only, no key in any frontend file

Unlike books (Open Library, no key needed at all), YouTube search
requires a real API key. This key lives **only** in
`payments-backend/.env` as `YOUTUBE_API_KEY` — the frontend calls our
own `/api/search-videos` endpoint, same auth-protected pattern as
sequencing/content search, and the actual YouTube call happens
server-side. No YouTube key exists in any frontend file, ever — same
secret-handling standard as Anthropic and Stripe.

## AI sequencing — real beginner-to-mastery paths

Books/videos are fetched live (Open Library / YouTube), then sent to
`payments-backend`'s `/api/sequence-path` endpoint, which asks Claude to
select and SEQUENCE a genuine progression from those real, already-fetched
items based on the person's level — never inventing new items, same
grounding technique as the standalone `curriculum-ai` project.

**Setup:** add to `payments-backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5
```
No extra npm install needed — it uses the same built-in `fetch` Node
already has, same as the rest of the backend.

**If this backend isn't running**, the app falls back to the raw,
unsequenced live search results automatically — same fallback philosophy
as the payment checkout flow. Test the grounding logic itself (no API key
needed) with:
```bash
cd payments-backend
node --test test/sequenceService.test.js
```

## Analytics + error monitoring

**Umami** (analytics) — cookieless, no personal data, no consent-banner
interaction needed. Sign up free at umami.is → Settings → Websites →
Add Website → copy the tracking code's `data-website-id` into
`index.html`'s Umami script tag.

**Sentry** (error monitoring) — catches real errors on real users'
devices automatically, frontend and backend.
- Frontend: sentry.io → Settings → Projects → SDK Setup → Loader Script
  → copy the key into `index.html`'s Sentry script tag.
- Backend: same project settings → Client Keys (DSN) → add to
  `payments-backend/.env` as `SENTRY_DSN`.

Both are optional — leaving either as a placeholder doesn't break
anything, it just means that specific monitoring is off.

## Backend security — auth + rate limiting on `/api/sequence-path`

Since this endpoint costs real Anthropic billing per call, it now
requires a genuine, currently-valid Supabase session token — anyone
without one gets a `401`, before any AI call happens. The frontend
attaches this automatically (via `sb.auth.getSession()`); nothing to
configure. A rate limiter (10 requests/minute) sits on top as a second
layer, protecting against a single compromised or overly-eager account,
not just unauthenticated abuse.

Test the auth logic itself, with no real Supabase project needed:
```bash
cd payments-backend
node --test test/authHelper.test.js
```

## Still not done (by design, not oversight)

- **Custom email sending (deferred for now).** Password reset emails currently
  send from Supabase's default address (`noreply@mail.app.supabase.io`), which
  is rate-limited to a handful of emails/hour and — important — will ONLY
  deliver to email addresses that are actual members of your Supabase
  organization's team. To send from a real address like
  `no-reply@baytalhikma.com` with no such restrictions, set up Custom SMTP:
  **Authentication → Emails → SMTP Settings** in the Supabase dashboard,
  using a real email provider (Resend or Brevo both have workable free
  tiers and are officially supported). Not done yet — revisit before any
  real users rely on password reset.
- The real Stripe payment flow is built and wired to the webhook, but has
  only been tested via the demo fallback — a real live Checkout completion
  hasn't been tested end to end yet.
- The 3 missing hoopoe images noted above
- Growing the book catalog beyond the small hardcoded sample
- Articles and courses still come from the small static demo catalog —
  no live API integration for these two yet (see earlier discussion on
  why these are harder: no clean "search everything" API exists for
  either, unlike Open Library/YouTube)