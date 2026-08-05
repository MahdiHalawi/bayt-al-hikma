const assert = require("node:assert");
const test = require("node:test");
const { resolveLevelInstruction, buildPrompt, buildCritiquePrompt } = require("../sequenceService");

test("resolveLevelInstruction uses the real custom description when level is 'other'", () => {
  const result = resolveLevelInstruction("other", "I know statistics well but I'm new to this specific topic");
  assert.ok(result.includes("I know statistics well but I'm new to this specific topic"), "expected the real typed description to appear verbatim");
  assert.ok(!result.includes("does not indicate its difficulty"), "should not be the wellread instruction");
});

test("resolveLevelInstruction falls back to the normal bucket when level is NOT 'other'", () => {
  const result = resolveLevelInstruction("new", "");
  assert.ok(result.includes("completely new to this topic"));
});

test("resolveLevelInstruction falls back to the normal bucket if 'other' was selected but nothing was actually typed", () => {
  const result = resolveLevelInstruction("other", "");
  assert.ok(!result.includes("in their own words"), "empty description should not produce a broken/empty custom instruction");
});

test("resolveLevelInstruction falls back safely if 'other' was selected but levelOther is missing entirely (undefined)", () => {
  const result = resolveLevelInstruction("other", undefined);
  assert.ok(typeof result === "string" && result.length > 0);
});

test("buildPrompt includes the real custom description, not just the word 'other'", () => {
  const ITEMS = [{ id: "1", type: "book", title: "A Book", author: "Author A" }];
  const { system } = buildPrompt({ goal: "understand ML", level: "other", levelOther: "I'm a working statistician", format: "either", timeCommitment: "moderate", items: ITEMS });
  assert.ok(system.includes("I'm a working statistician"));
  assert.ok(!system.includes("LEARNER LEVEL: other"), "the raw meaningless word should never appear alone");
});

test("buildCritiquePrompt ALSO includes the real custom description, not just the raw word 'other' (this was the actual bug)", () => {
  const { system } = buildCritiquePrompt({
    goal: "understand ML",
    level: "other",
    levelOther: "I'm a working statistician",
    format: "either",
    timeCommitment: "moderate",
    chosenPath: [{ id: "1", title: "A Book", author: "Author A", reason: "fine" }],
    remainingItems: [],
  });
  assert.ok(system.includes("I'm a working statistician"), "the critique pass needs the real context too, not just the fresh selection pass");
  assert.ok(!system.includes("LEARNER LEVEL: other"));
});
