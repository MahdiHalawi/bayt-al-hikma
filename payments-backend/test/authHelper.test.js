const assert = require("node:assert");
const test = require("node:test");
const { verifyRequestAuth } = require("../authHelper");

test("rejects when no Authorization header is present at all", async () => {
  const { user, error } = await verifyRequestAuth({}, undefined);
  assert.strictEqual(user, null);
  assert.ok(error);
});

test("rejects a malformed header missing the 'Bearer ' prefix", async () => {
  const { user } = await verifyRequestAuth({}, "just-a-raw-token");
  assert.strictEqual(user, null);
});

test("rejects everything if Supabase admin isn't configured, even with a token present", async () => {
  const { user, error } = await verifyRequestAuth(null, "Bearer some-token");
  assert.strictEqual(user, null);
  assert.ok(error.includes("not configured"));
});

test("rejects an invalid or expired token", async () => {
  const fakeSbAdmin = { auth: { getUser: async () => ({ data: null, error: { message: "invalid" } }) } };
  const { user, error } = await verifyRequestAuth(fakeSbAdmin, "Bearer bad-token");
  assert.strictEqual(user, null);
  assert.ok(error);
});

test("accepts a genuinely valid token and returns the real user", async () => {
  const fakeSbAdmin = {
    auth: {
      getUser: async (token) => {
        if (token === "good-token") return { data: { user: { id: "real-user-1" } }, error: null };
        return { data: null, error: { message: "invalid" } };
      },
    },
  };
  const { user, error } = await verifyRequestAuth(fakeSbAdmin, "Bearer good-token");
  assert.strictEqual(error, null);
  assert.strictEqual(user.id, "real-user-1");
});

test("a stale/copied token that no longer matches is still rejected", async () => {
  const fakeSbAdmin = {
    auth: {
      getUser: async (token) => {
        if (token === "good-token") return { data: { user: { id: "real-user-1" } }, error: null };
        return { data: null, error: { message: "invalid" } };
      },
    },
  };
  const { user } = await verifyRequestAuth(fakeSbAdmin, "Bearer good-token-but-wrong");
  assert.strictEqual(user, null);
});