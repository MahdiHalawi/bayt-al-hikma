const assert = require("node:assert");
const test = require("node:test");

const ITEMS = [
  { id: "1", type: "book", title: "Foundational Book", author: "Author A" },
  { id: "2", type: "video", title: "10 AI Tools You Need in 2026", author: "Trend Channel" }, // the weak fit
  { id: "3", type: "video", title: "Introduction to Neural Networks Explained", author: "EduChannel" }, // a genuinely better fit
  { id: "4", type: "book", title: "Advanced Book", author: "Author B" },
];

test("the critique pass replaces a weak-fit item chosen in the first pass with a genuinely better one", async () => {
  let callCount = 0;
  // Mock global fetch: first call = initial selection (includes the
  // weak "tool roundup" item by mistake), second call = the critique
  // pass fixing it.
  global.fetch = async () => {
    callCount += 1;
    const text =
      callCount === 1
        ? JSON.stringify([
            { id: "1", reason: "Good foundational start" },
            { id: "2", reason: "Covers AI tools" }, // weak fit, slipped through pass 1
            { id: "4", reason: "Advanced material" },
          ])
        : JSON.stringify([
            { id: "1", reason: "Good foundational start" },
            { id: "3", reason: "Actually teaches the underlying concept, unlike the tool roundup" },
            { id: "4", reason: "Advanced material" },
          ]);
    return {
      ok: true,
      json: async () => ({ content: [{ type: "text", text }] }),
    };
  };

  process.env.ANTHROPIC_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../sequenceService")];
  const { sequencePath } = require("../sequenceService");

  const result = await sequencePath({ goal: "understand AI", level: "new", items: ITEMS });

  assert.strictEqual(callCount, 2, "expected exactly two model calls: initial pass + critique pass");
  assert.strictEqual(result.usedFallback, false);
  assert.strictEqual(result.path.length, 3);
  assert.ok(
    !result.path.some((p) => p.id === "2"),
    "the weak-fit item (id 2) should have been swapped out by the critique pass"
  );
  assert.ok(
    result.path.some((p) => p.id === "3"),
    "the genuinely better item (id 3) should have been swapped in from the remaining pool"
  );
});

test("if the critique pass fails entirely, the first-pass result is still returned rather than losing everything", async () => {
  let callCount = 0;
  global.fetch = async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: JSON.stringify([{ id: "1", reason: "fine" }, { id: "4", reason: "fine" }]) }],
        }),
      };
    }
    // simulate the critique pass's network call failing
    return { ok: false, status: 500, text: async () => "server error" };
  };

  process.env.ANTHROPIC_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../sequenceService")];
  const { sequencePath } = require("../sequenceService");

  const result = await sequencePath({ goal: "understand AI", level: "new", items: ITEMS });

  assert.strictEqual(result.usedFallback, false);
  assert.strictEqual(result.path.length, 2);
  assert.deepStrictEqual(result.path.map((p) => p.id).sort(), ["1", "4"]);
});
