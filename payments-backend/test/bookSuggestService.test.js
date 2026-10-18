const assert = require("node:assert");
const test = require("node:test");
const { titleMatches, authorMatches, verifyCandidate, suggestBooks, parseSuggestions, buildSuggestPrompt } = require("../bookSuggestService");

function catalog(map) {
  // map: lowercase title -> docs
  return async (url) => {
    const u = new URL(url);
    const title = (u.searchParams.get("title") || "").toLowerCase();
    return { ok: true, json: async () => ({ docs: map[title] || [] }) };
  };
}

test("titleMatches accepts exact and subtitle variants, rejects unrelated", () => {
  assert.ok(titleMatches("Thinking, Fast and Slow", "Thinking, Fast and Slow"));
  assert.ok(titleMatches("The Psychology Book: Big Ideas", "Psychology Book"));
  assert.ok(!titleMatches("Psychology for Beginners", "Thinking, Fast and Slow"));
});

test("authorMatches uses surname", () => {
  assert.ok(authorMatches(["Daniel Kahneman"], "Daniel Kahneman"));
  assert.ok(!authorMatches(["Someone Else"], "Daniel Kahneman"));
});

test("verifyCandidate keeps the most-published matching record and drops non-matches", async () => {
  const f = catalog({
    "thinking, fast and slow": [
      { key: "/works/A", title: "Thinking, Fast and Slow", author_name: ["Daniel Kahneman"], edition_count: 3 },
      { key: "/works/B", title: "Thinking, Fast and Slow", author_name: ["Daniel Kahneman"], edition_count: 40, cover_i: 9 },
      { key: "/works/C", title: "Thinking, Fast and Slow", author_name: ["Impostor"], edition_count: 99 },
    ],
  });
  const r = await verifyCandidate({ title: "Thinking, Fast and Slow", author: "Daniel Kahneman", reason: "x" }, f);
  assert.strictEqual(r.id, "/works/B");
});

test("an invented book that is not in the catalog is dropped", async () => {
  const r = await verifyCandidate({ title: "Totally Made Up Book", author: "Nobody" }, catalog({}));
  assert.strictEqual(r, null);
});

test("suggestBooks returns only verified books and the English search goal", async () => {
  const f = catalog({
    a: [{ key: "/w/a", title: "A", author_name: ["X Alpha"], edition_count: 5 }],
    b: [{ key: "/w/b", title: "B", author_name: ["Y Beta"], edition_count: 5 }],
    c: [{ key: "/w/c", title: "C", author_name: ["Z Gamma"], edition_count: 5 }],
    d: [{ key: "/w/d", title: "D", author_name: ["W Delta"], edition_count: 5 }],
  });
  const model = async () =>
    JSON.stringify({
      searchGoal: "psychology",
      books: [
        { title: "A", author: "X Alpha" }, { title: "B", author: "Y Beta" },
        { title: "C", author: "Z Gamma" }, { title: "D", author: "W Delta" },
        { title: "Fake", author: "Ghost" },
      ],
    });
  const r = await suggestBooks({ goal: "علم النفس للمبتدئين", level: "new", contentLanguage: "ar" }, { fetchImpl: f, modelImpl: model });
  assert.strictEqual(r.searchGoal, "psychology");
  assert.strictEqual(r.items.length, 4);
  assert.ok(r.enough);
});

test("when fewer than 4 verify, a second broadening round runs and results merge", async () => {
  const f = catalog({
    a: [{ key: "/w/a", title: "A", author_name: ["X Alpha"], edition_count: 5 }],
    b: [{ key: "/w/b", title: "B", author_name: ["Y Beta"], edition_count: 5 }],
    c: [{ key: "/w/c", title: "C", author_name: ["Z Gamma"], edition_count: 5 }],
    d: [{ key: "/w/d", title: "D", author_name: ["W Delta"], edition_count: 5 }],
  });
  let calls = 0;
  const prompts = [];
  const model = async (p) => {
    prompts.push(p.system);
    calls++;
    return JSON.stringify(
      calls === 1
        ? { searchGoal: "x", books: [{ title: "A", author: "X Alpha" }, { title: "B", author: "Y Beta" }] }
        : { searchGoal: "x", books: [{ title: "C", author: "Z Gamma" }, { title: "D", author: "W Delta" }] }
    );
  };
  const r = await suggestBooks({ goal: "g", level: "new" }, { fetchImpl: f, modelImpl: model });
  assert.strictEqual(calls, 2);
  assert.strictEqual(r.items.length, 4);
  assert.ok(prompts[1].includes('"A"'), "second round should exclude already-found books");
});

test("model failure returns an empty result instead of throwing", async () => {
  const r = await suggestBooks({ goal: "g" }, { fetchImpl: catalog({}), modelImpl: async () => { throw new Error("boom"); } });
  assert.deepStrictEqual(r.items, []);
  assert.strictEqual(r.enough, false);
});

test("parseSuggestions strips fences; prompt mentions language preference", () => {
  const p = parseSuggestions('```json\n{"searchGoal":"s","books":[{"title":"T","author":"A"},{"bad":1}]}\n```');
  assert.strictEqual(p.books.length, 1);
  assert.ok(buildSuggestPrompt({ goal: "g", level: "new", contentLanguage: "ar" }).system.includes("Arabic"));
});

test("prefers the record with a recent edition people can buy over a more-published but old one", async () => {
  const f = catalog({
    "wealth": [
      { key: "/w/old", title: "Wealth", author_name: ["Adam Smith"], edition_count: 90, publish_year: [1900, 1910] },
      { key: "/w/new", title: "Wealth", author_name: ["Adam Smith"], edition_count: 20, publish_year: [1950, 2020] },
    ],
  });
  const r = await verifyCandidate({ title: "Wealth", author: "Adam Smith" }, f);
  assert.strictEqual(r.id, "/w/new");
  assert.strictEqual(r.editionYear, 2020);
});

test("prompt demands breadth across angles incl. foundations, and verified items keep their angle", async () => {
  const sys = buildSuggestPrompt({ goal: "dementia", level: "new" }).system;
  assert.ok(sys.includes("foundation") && sys.includes("adjacent") && sys.includes("history"));
  const f = catalog({ "how the brain works": [{ key: "/w/1", title: "How the Brain Works", author_name: ["Jane Doe"], edition_count: 4, publish_year: [2021] }] });
  const r = await verifyCandidate({ title: "How the Brain Works", author: "Jane Doe", angle: "foundation" }, f);
  assert.strictEqual(r.angle, "foundation");
});

test("planAngles returns an English goal and angle queries, and degrades to empty on failure", async () => {
  const { planAngles } = require("../bookSuggestService");
  const ok = await planAngles({ goal: "الخرف" }, { modelImpl: async () => JSON.stringify({ searchGoal: "dementia", angleQueries: { foundation: "how the brain works", adjacent: "neuroscience of memory", bogus: "x" } }) });
  assert.strictEqual(ok.searchGoal, "dementia");
  assert.deepStrictEqual(Object.keys(ok.angleQueries).sort(), ["adjacent", "foundation"]);
  const bad = await planAngles({ goal: "x" }, { modelImpl: async () => { throw new Error("no"); } });
  assert.deepStrictEqual(bad.angleQueries, {});
});

test("an Arabic-titled candidate is verified through its English title when the Arabic title isn't in the catalog", async () => {
  const f = catalog({
    "basic economics": [{ key: "/w/be", title: "Basic Economics", author_name: ["Thomas Sowell"], edition_count: 30, publish_year: [2014] }],
  });
  const r = await verifyCandidate({ title: "مبادئ الاقتصاد", englishTitle: "Basic Economics", author: "Thomas Sowell" }, f);
  assert.strictEqual(r.id, "/w/be");
});

test("Arabic matching ignores hamza/diacritic differences", () => {
  assert.ok(titleMatches("ثروة الامم", "ثروة الأمم"));
  assert.ok(titleMatches("الاقتصاد في درس واحد", "الاقتصاد في درس واحد"));
});

test("a throttled (429) Open Library response is retried once instead of silently counting as 'not found'", async () => {
  let calls = 0;
  const f = async () => {
    calls++;
    if (calls === 1) return { ok: false, status: 429, json: async () => ({}) };
    return { ok: true, json: async () => ({ docs: [{ key: "/w/x", title: "Basic Economics", author_name: ["Thomas Sowell"], edition_count: 9, publish_year: [2014] }] }) };
  };
  const r = await verifyCandidate({ title: "Basic Economics", author: "Thomas Sowell" }, f);
  assert.strictEqual(r.id, "/w/x");
  assert.strictEqual(calls, 2);
});
