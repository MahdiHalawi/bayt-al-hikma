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
