const assert = require("node:assert");
const test = require("node:test");
const { buildPrompt } = require("../sequenceService");

const ITEMS = [{ id: "1", type: "book", title: "New Book", author: "Author A" }];

test("buildPrompt includes the previously-completed context when expanding a finished scroll", () => {
  const { system } = buildPrompt({
    goal: "understand AI",
    level: "wellread",
    format: "either",
    timeCommitment: "moderate",
    items: ITEMS,
    previouslyCompleted: [{ title: "Intro to AI", author: "Someone" }],
  });
  assert.ok(system.includes("ALREADY completed"), "expected the completed-items context to appear");
  assert.ok(system.includes("Intro to AI"), "expected the specific completed title to be named");
});

test("buildPrompt omits the completed-items section entirely for a fresh (non-expansion) path", () => {
  const { system } = buildPrompt({
    goal: "understand AI",
    level: "new",
    format: "either",
    timeCommitment: "moderate",
    items: ITEMS,
    previouslyCompleted: [],
  });
  assert.ok(!system.includes("ALREADY completed"), "a fresh path should not mention prior completion at all");
});

test("buildPrompt handles previouslyCompleted being entirely absent (undefined), not just empty", () => {
  const { system } = buildPrompt({ goal: "x", level: "new", format: "either", timeCommitment: "moderate", items: ITEMS });
  assert.ok(!system.includes("ALREADY completed"));
});