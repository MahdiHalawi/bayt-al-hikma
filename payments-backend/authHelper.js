// Verifies that a request carries a real, currently-valid Supabase
// session token. This is what actually protects the AI sequencing
// endpoint — and the real Anthropic billing behind it — from being
// called by anyone who simply finds the URL, rather than only genuine
// logged-in users of the actual site.
//
// Separated from server.js so this logic can be unit-tested directly
// with a mocked Supabase admin client, without needing to spin up a
// real HTTP server or a real Supabase project to test against.
async function verifyRequestAuth(sbAdmin, authHeader) {
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: "Missing Authorization header" };
  }
  if (!sbAdmin) {
    return { user: null, error: "Supabase is not configured — cannot verify the request" };
  }

  try {
    const { data, error } = await sbAdmin.auth.getUser(token);
    if (error || !data || !data.user) {
      return { user: null, error: "Invalid or expired session" };
    }
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: "Could not verify session: " + err.message };
  }
}

module.exports = { verifyRequestAuth };