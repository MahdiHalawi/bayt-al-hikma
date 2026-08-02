const assert = require("node:assert");
const test = require("node:test");
const {
  extractRealSearchUrls,
  extractFinalText,
  parseModelOutput,
  validateAgainstRealUrls,
} = require("../contentSearchService");

test("extractRealSearchUrls pulls URLs out of web_search_tool_result blocks", () => {
  const apiResponse = {
    content: [
      { type: "server_tool_use", name: "web_search" },
      {
        type: "web_search_tool_result",
        content: [
          { url: "https://real-site.com/article-1", title: "Real Article" },
          { url: "https://real-site.com/article-2", title: "Another Real Article" },
        ],
      },
      { type: "text", text: "some text" },
    ],
  };
  const urls = extractRealSearchUrls(apiResponse);
  assert.ok(urls.has("https://real-site.com/article-1"));
  assert.ok(urls.has("https://real-site.com/article-2"));
  assert.strictEqual(urls.size, 2);
});

test("extractRealSearchUrls handles a response with no search results gracefully", () => {
  const urls = extractRealSearchUrls({ content: [{ type: "text", text: "no search happened" }] });
  assert.strictEqual(urls.size, 0);
});

test("extractFinalText joins only the text blocks, ignoring tool-use/tool-result blocks", () => {
  const apiResponse = {
    content: [
      { type: "server_tool_use", name: "web_search" },
      { type: "web_search_tool_result", content: [] },
      { type: "text", text: '[{"title":"x"}]' },
    ],
  };
  assert.strictEqual(extractFinalText(apiResponse), '[{"title":"x"}]');
});

test("validateAgainstRealUrls keeps only items whose URL genuinely appeared in real search results", () => {
  const realUrls = new Set(["https://real-site.com/a", "https://real-site.com/b"]);
  const items = [
    { title: "Real one", url: "https://real-site.com/a" },
    { title: "Hallucinated one", url: "https://made-up-site.com/fake" },
    { title: "Real two", url: "https://real-site.com/b" },
  ];
  const { kept, rejected } = validateAgainstRealUrls(items, realUrls);
  assert.strictEqual(kept.length, 2);
  assert.strictEqual(rejected.length, 1);
  assert.strictEqual(rejected[0], "https://made-up-site.com/fake");
});

test("validateAgainstRealUrls rejects items with a missing or malformed url field entirely", () => {
  const realUrls = new Set(["https://real-site.com/a"]);
  const { kept, rejected } = validateAgainstRealUrls([{ title: "no url field" }, { title: "null url", url: null }], realUrls);
  assert.strictEqual(kept.length, 0);
  assert.strictEqual(rejected.length, 2);
});

test("parseModelOutput handles clean JSON and markdown-fenced JSON the same as sequenceService", () => {
  assert.strictEqual(parseModelOutput('[{"title":"x"}]')[0].title, "x");
  assert.strictEqual(parseModelOutput('```json\n[{"title":"x"}]\n```')[0].title, "x");
});
