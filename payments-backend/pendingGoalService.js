// Validates a save-pending-goal request before it touches the database.
// Extracted into its own small, directly testable function — same
// lesson learned from the earlier free-path-limit bug, where logic
// left inline in a route handler went genuinely untested until a real
// user hit it. See server.js's own comment on this endpoint for the
// full reasoning on why this needs the service role at all.

function validatePendingGoalRequest(body) {
  const { userId, pendingGoal } = body || {};
  if (!userId || typeof userId !== "string") {
    return { valid: false, error: "userId is required" };
  }
  if (!pendingGoal || typeof pendingGoal !== "object" || Array.isArray(pendingGoal)) {
    return { valid: false, error: "pendingGoal is required" };
  }
  if (!pendingGoal.goal || typeof pendingGoal.goal !== "string") {
    return { valid: false, error: "pendingGoal.goal is required" };
  }
  return { valid: true };
}

module.exports = { validatePendingGoalRequest };