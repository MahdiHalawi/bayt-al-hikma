const assert = require("node:assert");
const test = require("node:test");
const { buildPrompt, buildCritiquePrompt } = require("../sequenceService");

const ITEMS = [{ id: "1", type: "video", title: "A Video", author: "Someone" }];

test("wellread-level prompt explicitly warns against judging difficulty by length", () => {
  const { system } = buildPrompt({ goal: "x", level: "wellread", format: "either", timeCommitment: "moderate", items: ITEMS });
  assert.ok(system.toLowerCase().includes("does not indicate its difficulty") || system.toLowerCase().includes("does not indicate its difficulty".toLowerCase()));
  assert.ok(system.includes("7-hour crash course") || system.includes("beginner's guide"));
});

test("the critique pass also carries the length-versus-difficulty warning", () => {
  const { system } = buildCritiquePrompt({
    goal: "x",
    level: "wellread",
    format: "either",
    timeCommitment: "moderate",
    chosenPath: [{ id: "1", title: "A Video", author: "Someone", reason: "fine" }],
    remainingItems: [],
  });
  assert.ok(system.toLowerCase().includes("length does not indicate its difficulty") || system.toLowerCase().includes("regardless of how many hours"));
});
