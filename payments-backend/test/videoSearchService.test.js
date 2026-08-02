const assert = require("node:assert");
const test = require("node:test");

test("decodeHtmlEntities correctly decodes common YouTube title entities", () => {
  delete require.cache[require.resolve("../videoSearchService")];
  const { decodeHtmlEntities } = require("../videoSearchService");
  assert.strictEqual(decodeHtmlEntities("Algebra Basics &amp; Beyond"), "Algebra Basics & Beyond");
  assert.strictEqual(decodeHtmlEntities("&quot;Quoted&quot; title"), '"Quoted" title');
});

test("returns a clear fallback result when YOUTUBE_API_KEY is not set", async () => {
  delete process.env.YOUTUBE_API_KEY;
  delete require.cache[require.resolve("../videoSearchService")];
  const { searchVideos } = require("../videoSearchService");
  const result = await searchVideos({ query: "philosophy", contentLanguage: "any" });
  assert.strictEqual(result.usedFallback, true);
  assert.strictEqual(result.items.length, 0);
  assert.ok(result.error.includes("not set"));
});

test("maps a real YouTube API response correctly, including decoding entities", async () => {
  process.env.YOUTUBE_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../videoSearchService")];
  const { searchVideos } = require("../videoSearchService");

  global.fetch = async (url) => ({
    ok: true,
    json: async () => ({
      items: [
        {
          id: { videoId: "abc123" },
          snippet: { title: "Learn AI &amp; ML", channelTitle: "EduChannel", thumbnails: { medium: { url: "https://img.example.com/thumb.jpg" } } },
        },
      ],
    }),
  });

  const result = await searchVideos({ query: "AI", contentLanguage: "any" });
  assert.strictEqual(result.usedFallback, false);
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].title, "Learn AI & ML");
  assert.strictEqual(result.items[0].url, "https://www.youtube.com/watch?v=abc123");
  assert.strictEqual(result.items[0].coverUrl, "https://img.example.com/thumb.jpg");
  assert.strictEqual(result.items[0].type, "video");
});

test("the actual request includes videoDuration=medium (excludes Shorts) and the educational query suffix", async () => {
  process.env.YOUTUBE_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../videoSearchService")];
  const { searchVideos } = require("../videoSearchService");

  let capturedUrl = null;
  global.fetch = async (url) => {
    capturedUrl = url;
    return { ok: true, json: async () => ({ items: [] }) };
  };

  await searchVideos({ query: "math", contentLanguage: "any" });
  assert.ok(capturedUrl.includes("videoDuration=medium"), "expected Shorts to be excluded");
  assert.ok(capturedUrl.includes(encodeURIComponent("math explained")), "expected the educational query suffix");
});

test("includes relevanceLanguage when a specific language is requested, omits it for 'any'", async () => {
  process.env.YOUTUBE_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../videoSearchService")];
  const { searchVideos } = require("../videoSearchService");

  let capturedUrl = null;
  global.fetch = async (url) => {
    capturedUrl = url;
    return { ok: true, json: async () => ({ items: [] }) };
  };

  await searchVideos({ query: "x", contentLanguage: "ar" });
  assert.ok(capturedUrl.includes("relevanceLanguage=ar"));

  await searchVideos({ query: "x", contentLanguage: "any" });
  assert.ok(!capturedUrl.includes("relevanceLanguage"));
});

test("gracefully handles the YouTube API itself returning an error, without throwing", async () => {
  process.env.YOUTUBE_API_KEY = "fake-key-for-test";
  delete require.cache[require.resolve("../videoSearchService")];
  const { searchVideos } = require("../videoSearchService");

  global.fetch = async () => ({ ok: false, status: 403 });

  const result = await searchVideos({ query: "x", contentLanguage: "any" });
  assert.strictEqual(result.usedFallback, true);
  assert.strictEqual(result.items.length, 0);
});
