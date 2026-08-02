const assert = require("node:assert");
const test = require("node:test");
const { buildPrompt, buildCritiquePrompt } = require("../sequenceService");

const ITEMS = [{ id: "1", type: "book", title: "A Book", author: "Author A" }];

test("buildPrompt includes the time-commitment preference text", () => {
  const { system } = buildPrompt({ goal: "understand AI", level: "new", format: "either", timeCommitment: "deep", items: ITEMS });
  assert.ok(system.includes("DEEP, immersive study"), "expected the deep-study instruction to appear in the prompt");
});

test("buildPrompt includes the quick-pace preference text when that's what was selected", () => {
  const { system } = buildPrompt({ goal: "understand AI", level: "new", format: "either", timeCommitment: "quick", items: ITEMS });
  assert.ok(system.includes("QUICK, bite-sized"), "expected the quick-pace instruction to appear in the prompt");
});

test("buildPrompt includes the format preference text", () => {
  const { system } = buildPrompt({ goal: "x", level: "new", format: "physical", timeCommitment: "moderate", items: ITEMS });
  assert.ok(system.includes("physical books"), "expected the physical-format note to appear in the prompt");
});

test("buildCritiquePrompt also includes time and format preferences, not just level", () => {
  const { system } = buildCritiquePrompt({
    goal: "understand AI",
    level: "wellread",
    format: "digital",
    timeCommitment: "quick",
    chosenPath: [{ id: "1", title: "A Book", author: "Author A", reason: "fine" }],
    remainingItems: [],
  });
  assert.ok(system.includes("QUICK, bite-sized"), "critique prompt should also reflect the time preference");
  assert.ok(system.includes("digital/ebook"), "critique prompt should also reflect the format preference");
});

test("missing format/timeCommitment fall back to sensible defaults instead of breaking", () => {
  const { system } = buildPrompt({ goal: "x", level: "new", items: ITEMS });
  assert.ok(system.includes("steady, moderate pace"));
  assert.ok(system.includes("no strong preference"));
});
