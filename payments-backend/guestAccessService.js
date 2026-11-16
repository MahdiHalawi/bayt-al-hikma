// Guest generation: lets a visitor build ONE real path before creating
// an account, so the signup wall no longer sits in front of the product.
//
// A guest has no Supabase session, so nothing here can be "authoritative"
// the way pathLimitService is for real accounts. Instead, cost is capped
// three ways at once:
//   1. per guest id (a random UUID the browser keeps in localStorage),
//   2. per IP address (a cleared localStorage or a script changing the
//      id on every call still hits this one),
//   3. one global daily ceiling on guest paths, as a hard cost limit.
// Counters live in memory and reset daily (and on a server restart).
// Set GUEST_GENERATION_ENABLED=false to switch guests off entirely.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

// How many calls ONE guest may make per day, per endpoint. One path needs
// at most: 1 book suggestion, 1 angle plan, 2 content searches (a "mix"),
// 3 video searches, 1 sequencing call. The small headroom covers a retry.
const DEFAULT_LIMITS = {
  "sequence-path": 1,
  "suggest-books": 2,
  "plan-angles": 2,
  "search-content": 4,
  "search-videos": 6,
};

function isValidGuestId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

function createGuestQuota(options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  // Many real people share one IP (mobile carriers especially), so the
  // per-IP allowance is a multiple of the per-guest one.
  const ipMultiplier = options.ipMultiplier || 4;
  const globalDailyPaths = options.globalDailyPaths || 150;
  const now = options.now || Date.now;
  const counters = new Map();

  function bucket(key) {
    const t = now();
    let b = counters.get(key);
    if (!b || t >= b.resetAt) {
      b = { count: 0, resetAt: t + DAY_MS };
      counters.set(key, b);
    }
    return b;
  }

  function prune() {
    if (counters.size < 5000) return;
    const t = now();
    for (const [key, b] of counters) if (t >= b.resetAt) counters.delete(key);
  }

  function keysFor(endpoint, guestId, ip) {
    return [`${endpoint}|g|${guestId}`, `${endpoint}|ip|${ip || "unknown"}`];
  }

  // Counts the call if allowed. Returns { allowed, reason }.
  function consume(endpoint, guestId, ip) {
    const limit = limits[endpoint];
    if (!limit) return { allowed: false, reason: "endpoint_not_open_to_guests" };
    prune();
    const [gKey, ipKey] = keysFor(endpoint, guestId, ip);
    const g = bucket(gKey);
    const i = bucket(ipKey);
    if (g.count >= limit) return { allowed: false, reason: "guest_limit" };
    if (i.count >= limit * ipMultiplier) return { allowed: false, reason: "ip_limit" };
    let global = null;
    if (endpoint === "sequence-path") {
      global = bucket("global|sequence-path");
      if (global.count >= globalDailyPaths) return { allowed: false, reason: "global_limit" };
    }
    g.count++;
    i.count++;
    if (global) global.count++;
    return { allowed: true, reason: null };
  }

  // Gives a call back when the backend itself failed, so a server error
  // doesn't cost the guest their one free path.
  function refund(endpoint, guestId, ip) {
    const keys = keysFor(endpoint, guestId, ip);
    if (endpoint === "sequence-path") keys.push("global|sequence-path");
    for (const key of keys) {
      const b = counters.get(key);
      if (b && b.count > 0) b.count--;
    }
  }

  return { consume, refund, limits };
}

// Who is calling? A real logged-in user always wins. With no
// Authorization header at all, a valid X-Guest-Id is accepted as a
// guest (when guests are enabled). A PRESENT but invalid token is never
// downgraded to guest: that stays a plain 401, exactly as before.
async function resolveRequester({ sbAdmin, headers, verifyRequestAuth, guestsEnabled }) {
  const authHeader = headers && headers.authorization;
  if (authHeader) {
    const { user, error } = await verifyRequestAuth(sbAdmin, authHeader);
    return user ? { user, guest: null, error: null } : { user: null, guest: null, error: error || "Unauthorized" };
  }
  const guestId = headers && headers["x-guest-id"];
  if (guestsEnabled && isValidGuestId(guestId)) {
    return { user: null, guest: { id: guestId.toLowerCase() }, error: null };
  }
  return { user: null, guest: null, error: "Missing Authorization header" };
}

module.exports = { isValidGuestId, createGuestQuota, resolveRequester, DEFAULT_LIMITS };
