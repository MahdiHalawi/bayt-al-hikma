const assert = require("node:assert");
const test = require("node:test");
const { validatePendingGoalRequest } = require("../pendingGoalService");

test("accepts a genuine, well-formed request", () => {
  const result = validatePendingGoalRequest({ userId: "u1", pendingGoal: { goal: "philosophy" } });
  assert.strictEqual(result.valid, true);
});

test("rejects a missing userId", () => {
  const result = validatePendingGoalRequest({ pendingGoal: { goal: "philosophy" } });
  assert.strictEqual(result.valid, false);
});

test("rejects a missing pendingGoal entirely", () => {
  const result = validatePendingGoalRequest({ userId: "u1" });
  assert.strictEqual(result.valid, false);
});

test("rejects a pendingGoal with no actual goal text", () => {
  const result = validatePendingGoalRequest({ userId: "u1", pendingGoal: { level: "basics" } });
  assert.strictEqual(result.valid, false);
});

test("rejects pendingGoal being an array instead of an object", () => {
  const result = validatePendingGoalRequest({ userId: "u1", pendingGoal: ["not", "an", "object"] });
  assert.strictEqual(result.valid, false);
});

test("rejects a completely empty/malformed body", () => {
  assert.strictEqual(validatePendingGoalRequest(null).valid, false);
  assert.strictEqual(validatePendingGoalRequest({}).valid, false);
  assert.strictEqual(validatePendingGoalRequest(undefined).valid, false);
});

test("accepts a real, full pendingGoal shape matching what the frontend actually sends", () => {
  const result = validatePendingGoalRequest({
    userId: "real-user-id",
    pendingGoal: {
      goal: "understanding stoicism",
      level: "basics",
      levelOther: "",
      format: "physical",
      timeCommitment: "moderate",
      contentType: "books",
      contentLanguage: "any",
    },
  });
  assert.strictEqual(result.valid, true);
});
