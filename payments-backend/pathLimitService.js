// Authoritative, backend-side enforcement of the free-tier "one path"
// limit. Extracted into its own small, testable function — same pattern
// as the other service modules — rather than left inline in the route
// handler, so this genuinely important business rule can be verified
// directly and in isolation, not just implicitly trusted.
//
// This is the REAL enforcement, not just a UX nicety. A frontend-only
// check is really just a suggestion: trivially bypassable (browser back
// button, a fresh tab, calling this endpoint directly), and every
// bypass burns a real, paid Anthropic API call regardless of whether
// the request should have been allowed in the first place.

async function hasReachedFreePathLimit(sbAdmin, userId) {
  const { data: profile, error: profileError } = await sbAdmin
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .single();

  if (profileError) {
    // Fail OPEN here (don't block) rather than closed — an unrelated
    // database hiccup shouldn't lock out a legitimate user, but this is
    // exactly the kind of thing worth having real monitoring on.
    console.error("Could not check premium status for path-limit check:", profileError);
    return false;
  }

  const isPremium = profile ? profile.is_premium : false;
  if (isPremium) return false; // premium users are never limited

  const { count, error: countError } = await sbAdmin
    .from("paths")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("Could not check existing path count for path-limit check:", countError);
    return false; // same fail-open reasoning as above
  }

  return count >= 1;
}

module.exports = { hasReachedFreePathLimit };