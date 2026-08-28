const assert = require("node:assert");
const test = require("node:test");
const { hasReachedFreePathLimit } = require("../pathLimitService");

function mockSbAdmin({ isPremium, pathCount, profileError, countError }) {
  return {
    from(table) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve(
                profileError
                  ? { data: null, error: profileError }
                  : { data: { is_premium: isPremium }, error: null }
              ),
            }),
          }),
        };
      }
      if (table === "paths") {
        return {
          select: () => ({
            eq: () => Promise.resolve(
              countError
                ? { count: null, error: countError }
                : { count: pathCount, error: null }
            ),
          }),
        };
      }
      throw new Error(`Unexpected table in test mock: ${table}`);
    },
  };
}

test("blocks a free user who already has 1 existing path — the exact reported bug", async () => {
  const sbAdmin = mockSbAdmin({ isPremium: false, pathCount: 1 });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, true);
});

test("blocks a free user with 4 existing paths (the real, reported scenario)", async () => {
  const sbAdmin = mockSbAdmin({ isPremium: false, pathCount: 4 });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, true);
});

test("allows a genuinely new free user with 0 existing paths", async () => {
  const sbAdmin = mockSbAdmin({ isPremium: false, pathCount: 0 });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, false);
});

test("never blocks a premium user, regardless of how many paths they have", async () => {
  const sbAdmin = mockSbAdmin({ isPremium: true, pathCount: 12 });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, false);
});

test("fails OPEN (doesn't block) if the profile lookup errors — doesn't punish a real user for an unrelated glitch", async () => {
  const sbAdmin = mockSbAdmin({ profileError: { message: "db hiccup" } });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, false);
});

test("fails OPEN if the path-count lookup errors", async () => {
  const sbAdmin = mockSbAdmin({ isPremium: false, countError: { message: "db hiccup" } });
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, false);
});

test("treats a missing profile row (new user, upsert hasn't landed yet) as free, not premium", async () => {
  const sbAdmin = {
    from(table) {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
      }
      return { select: () => ({ eq: () => Promise.resolve({ count: 0, error: null }) }) };
    },
  };
  const result = await hasReachedFreePathLimit(sbAdmin, "user-1");
  assert.strictEqual(result, false); // 0 existing paths, so still allowed — just confirms it didn't crash treating missing profile as premium
});