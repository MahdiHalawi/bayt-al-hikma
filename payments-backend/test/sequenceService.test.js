const assert = require("node:assert");
const test = require("node:test");
const { parseModelOutput, validateAndMerge } = require("../sequenceService");

const REAL_ITEMS = [
  { id: "book-1", type: "book", title: "Real Book One", author: "Author A", reason: "default reason" },
  { id: "video-1", type: "video", title: "Real Video One", author: "Channel A", url: "https://youtube.com/1" },
];

test("parseModelOutput handles clean JSON", () => {
  const out = parseModelOutput('[{"id":"book-1","reason":"start here"}]');
  assert.strictEqual(out[0].id, "book-1");
});

test("parseModelOutput strips markdown fences", () => {
  const out = parseModelOutput('```json\n[{"id":"book-1","reason":"start here"}]\n```');
  assert.strictEqual(out[0].id, "book-1");
});

test("validateAndMerge keeps only real ids and merges full item data", () => {
  const raw = [
    { id: "book-1", reason: "a real book" },
    { id: "hallucinated-id", reason: "made up" },
    { id: "video-1", reason: "a real video" },
  ];
  const { path, rejected } = validateAndMerge(raw, REAL_ITEMS);
  assert.strictEqual(path.length, 2);
  assert.strictEqual(rejected.length, 1);
  assert.strictEqual(rejected[0], "hallucinated-id");
  // confirm the FULL original item data made it through, not just id/reason
  assert.strictEqual(path[0].title, "Real Book One");
  assert.strictEqual(path[1].url, "https://youtube.com/1");
});

test("validateAndMerge uses the model's reason when provided, falls back to the item's own reason otherwise", () => {
  const raw = [{ id: "video-1", reason: "custom sequencing reason" }, { id: "book-1" }]; // second has no reason field at all
  const { path } = validateAndMerge(raw, REAL_ITEMS);
  assert.strictEqual(path[0].reason, "custom sequencing reason");
  assert.strictEqual(path[1].reason, "default reason"); // fell back to the item's own reason
});

test("validateAndMerge returns an empty path if every id is hallucinated", () => {
  const { path, rejected } = validateAndMerge([{ id: "fake-1" }, { id: "fake-2" }], REAL_ITEMS);
  assert.strictEqual(path.length, 0);
  assert.strictEqual(rejected.length, 2);
});

test("validateAndMerge preserves the sequence order the model returned", () => {
  const raw = [{ id: "video-1", reason: "second" }, { id: "book-1", reason: "actually first, but listed second here" }];
  const { path } = validateAndMerge(raw, REAL_ITEMS);
  assert.strictEqual(path[0].id, "video-1");
  assert.strictEqual(path[1].id, "book-1");
});

test("enforceBounds caps at 7 and tops up to 4; the language note and standalone-reason rule are in the prompts", () => {
  const { enforceBounds, outputLanguageNote, buildCritiquePrompt } = require("../sequenceService");
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i), type: "book", title: "T" + i, author: "A" }));
  assert.strictEqual(enforceBounds(mk(12), mk(12)).length, 7);
  assert.strictEqual(enforceBounds(mk(2), mk(10)).length, 4);
  assert.strictEqual(enforceBounds(mk(2), mk(3)).length, 3, "never invents items when fewer exist");
  assert.ok(outputLanguageNote("ar").includes("Arabic"));
  assert.ok(outputLanguageNote("en").includes("same language the learner's goal"));
  const p = buildCritiquePrompt({ goal: "g", level: "new", format: "either", timeCommitment: "moderate", chosenPath: mk(3), remainingItems: mk(2), outputLanguage: "ar" });
  assert.ok(p.system.includes("stand on its own") && p.system.includes("Arabic"));
});

test("a mix path prompt demands several formats when the pool has them, and stays silent otherwise", () => {
  const { mixNote, buildPrompt } = require("../sequenceService");
  const pool = [{ id: "1", type: "book", title: "B", author: "A" }, { id: "2", type: "video", title: "V", author: "C" }];
  assert.ok(mixNote("mix", pool).includes("book, video"));
  assert.strictEqual(mixNote("books", pool), "");
  assert.strictEqual(mixNote("mix", [pool[0]]), "");
  assert.ok(buildPrompt({ goal: "g", level: "new", format: "either", timeCommitment: "moderate", items: pool, previouslyCompleted: [], contentType: "mix" }).system.includes("FORMAT MIX"));
});
