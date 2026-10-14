// "AI proposes, then we verify." Keyword search on Open Library returns
// title matches and obscure/old books. Instead, Claude proposes the
// well-known books a good teacher would pick (title + author, from its own
// knowledge), and EVERY candidate is then checked against Open Library by
// title and author. Only books that are found are ever returned, so
// nothing is invented — the model chooses WHICH books, Open Library
// proves they exist. Among several editions/records of the same book we
// keep the one with the most editions (the popular one).
//
// The same call also translates the goal (e.g. Arabic) into a short
// English search goal, used for keyword fallbacks and topic detection.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MIN_VERIFIED = 4;
const LANGUAGE_NAMES = { en: "English", ar: "Arabic", fr: "French" };

function buildSuggestPrompt({ goal, level, contentLanguage, exclude = [] }) {
  const languageName = LANGUAGE_NAMES[contentLanguage];
  const languageLine = languageName
    ? `The learner prefers books in ${languageName}. Prefer well-known books that exist in ${languageName} (original or published translation) and give "title" exactly as published in ${languageName}, with "author" in Latin letters. If there are not enough, fill up with the best books in any language, giving their English titles.`
    : `Give titles in English unless a book is best known under another title.`;
  const excludeLine = exclude.length
    ? `\nDo NOT repeat these books (already found): ${exclude.map((b) => `"${b.title}"`).join(", ")}. Propose DIFFERENT books from other angles (foundations, history, neighbouring disciplines).\n`
    : "";

  const system = `You are an expert librarian and teacher. A learner's goal is: "${goal}" (learner level: ${level || "basics"}; the goal may be written in any language).

Return ONLY a JSON object (no markdown fences, no extra text) shaped exactly like:
{ "searchGoal": "<the goal as a short English search phrase of 1-4 words, e.g. 'psychology'>", "angleQueries": { "foundation": "<2-5 word search phrase>", "adjacent": "<2-5 word search phrase>", "history": "<2-5 word search phrase>" }, "books": [ { "title": "<exact published title>", "author": "<author's full name>", "angle": "<one of: foundation, core, history, adjacent, current>", "reason": "<one sentence on why a good teacher would pick this for this learner>" } ] }

Rules:
- Propose 12 to 14 REAL, well-known, widely-read books a good teacher would genuinely recommend. Never obscure titles, never children's books, never books that merely have the topic word in the title.
- BREADTH AS WELL AS DEPTH. A great reading list goes beyond the immediate topic. Cover several different angles, tagging each book with its "angle":
  * "foundation": what a learner must understand FIRST before the topic itself (e.g. for dementia: how the brain and its parts work; for economics: basic history or logic of exchange).
  * "core": books directly about the topic (at most 3-4 of these — never a list of near-duplicate titles).
  * "history": how the topic or its tools developed and have been used over time.
  * "adjacent": neighbouring disciplines that explain it from another side (psychology, neuroscience, sociology, language, ethics, technology, etc.).
  * "current": where the field is heading / why it still matters today.
  Include at least 3 of the angles, and at least one "foundation" book unless the learner's level is advanced. Many of the best books will NOT have the topic in their title.
- Only books you are confident really exist, with their real author. If unsure a book exists, leave it out. Every book will be checked against a library catalog and dropped if not found.
- Prefer books that are CURRENTLY AVAILABLE to buy: recent editions (ideally published in the last ~10 years) or timeless classics still in print. For fast-moving fields (technology, economics, medicine, business) avoid outdated books.
- Order so foundations come first, then core, then deeper and more specialised.
${languageLine}${excludeLine}`;
  return { system, user: "Propose the books now." };
}

async function callModel({ system, user }, fetchImpl = fetch) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — see .env.example");
  const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
  });
  if (!response.ok) throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function cleanAngleQueries(q) {
  const out = {};
  for (const k of ["foundation", "adjacent", "history", "current"]) {
    if (q && typeof q[k] === "string" && q[k].trim()) out[k] = q[k].trim().slice(0, 80);
  }
  return out;
}

// Light, cheap call (no books, no catalog checks) used for videos: turns
// the goal into a short English search goal plus search phrases for the
// other angles, so video results get breadth too.
function buildAnglesPrompt({ goal, level }) {
  const system = `A learner's goal is: "${goal}" (level: ${level || "basics"}; the goal may be in any language).
Return ONLY a JSON object (no fences): { "searchGoal": "<short English search phrase, 1-4 words>", "angleQueries": { "foundation": "<search phrase for what must be understood FIRST>", "adjacent": "<search phrase for a neighbouring discipline that explains it from another side>", "history": "<search phrase for its history or how it has been used>" } }
Each phrase is 2-5 words, suitable for a video search. They must go BEYOND the exact topic wording (e.g. for dementia: foundation "how the brain works", adjacent "neuroscience of memory").`;
  return { system, user: "Plan the angles now." };
}

async function planAngles({ goal, level }, { fetchImpl = fetch, modelImpl } = {}) {
  const ask = modelImpl || ((prompt) => callModel(prompt, fetchImpl));
  try {
    const parsed = parseSuggestions(await ask(buildAnglesPrompt({ goal, level })));
    return { searchGoal: parsed.searchGoal, angleQueries: parsed.angleQueries };
  } catch (err) {
    console.error("Angle planning failed:", err.message);
    return { searchGoal: "", angleQueries: {} };
  }
}

function parseSuggestions(rawText) {
  const cleaned = rawText.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  const books = Array.isArray(parsed.books) ? parsed.books : [];
  return {
    searchGoal: typeof parsed.searchGoal === "string" ? parsed.searchGoal.trim() : "",
    angleQueries: cleanAngleQueries(parsed.angleQueries),
    books: books.filter((b) => b && typeof b.title === "string" && b.title.trim() && typeof b.author === "string" && b.author.trim()),
  };
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|a|an|le|la|les|al)\s+/, "");
}

function titleMatches(docTitle, candTitle) {
  const d = normalize(docTitle);
  const c = normalize(candTitle);
  if (!d || !c) return false;
  return d === c || d.startsWith(c + " ") || c.startsWith(d + " ");
}

function authorMatches(docAuthors, candAuthor) {
  const parts = normalize(candAuthor).split(" ").filter(Boolean);
  if (parts.length === 0) return false;
  const last = parts[parts.length - 1];
  return (docAuthors || []).some((a) => normalize(a).split(" ").includes(last));
}

const FIELDS = "key,title,author_name,cover_i,ebook_access,ia,edition_count,first_publish_year,publish_year";

// Newest edition year Open Library knows for this record (0 if unknown).
function latestYear(doc) {
  const years = (doc.publish_year || []).filter((y) => Number.isInteger(y) && y <= new Date().getFullYear());
  return years.length ? Math.max(...years) : doc.first_publish_year || 0;
}

// Among records of the same book: prefer one with a recent (>= 2000)
// edition people can actually buy, then the most-published.
function rankDocs(a, b) {
  const ra = latestYear(a) >= 2000 ? 1 : 0;
  const rb = latestYear(b) >= 2000 ? 1 : 0;
  if (ra !== rb) return rb - ra;
  return (b.edition_count || 0) - (a.edition_count || 0);
}

// Verifies ONE candidate. Returns a book item or null.
async function verifyCandidate(cand, fetchImpl = fetch) {
  const url =
    `https://openlibrary.org/search.json?title=${encodeURIComponent(cand.title)}` +
    `&author=${encodeURIComponent(cand.author)}&limit=10&fields=${FIELDS}`;
  let data;
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    data = await res.json();
  } catch (err) {
    return null;
  }
  const matches = (data.docs || []).filter(
    (d) => titleMatches(d.title, cand.title) && authorMatches(d.author_name, cand.author)
  );
  if (matches.length === 0) return null;
  const best = matches.sort(rankDocs)[0];
  const hasFreeEbook = best.ebook_access === "public" && Array.isArray(best.ia) && best.ia.length > 0;
  return {
    id: best.key,
    type: "book",
    title: best.title,
    author: best.author_name ? best.author_name[0] : cand.author,
    coverUrl: best.cover_i ? `https://covers.openlibrary.org/b/id/${best.cover_i}-M.jpg` : null,
    pdfUrl: hasFreeEbook ? `https://archive.org/details/${best.ia[0]}` : null,
    angle: typeof cand.angle === "string" ? cand.angle : undefined,
    reason: cand.reason || `A well-known book on "${cand.title}".`,
    editionCount: best.edition_count || 0,
    editionYear: latestYear(best) || null,
  };
}

async function verifyCandidates(cands, fetchImpl = fetch) {
  const results = await Promise.all(cands.map((c) => verifyCandidate(c, fetchImpl)));
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

// Main entry. Round 1: propose + verify. If fewer than MIN_VERIFIED
// survive, round 2 asks for different/broader books (excluding what's
// already found) and merges. Never throws for model/catalog trouble —
// returns whatever was verified (possibly empty) so the caller can fall
// back to keyword search.
async function suggestBooks({ goal, level, contentLanguage }, { fetchImpl = fetch, modelImpl } = {}) {
  const ask = modelImpl || ((prompt) => callModel(prompt, fetchImpl));
  let searchGoal = "";
  let angleQueries = {};
  let verified = [];
  for (let round = 0; round < 2 && verified.length < MIN_VERIFIED; round++) {
    try {
      const raw = await ask(buildSuggestPrompt({ goal, level, contentLanguage, exclude: verified }));
      const parsed = parseSuggestions(raw);
      if (!searchGoal) searchGoal = parsed.searchGoal;
      if (!Object.keys(angleQueries).length) angleQueries = parsed.angleQueries;
      const fresh = await verifyCandidates(parsed.books, fetchImpl);
      const have = new Set(verified.map((v) => v.id));
      verified = verified.concat(fresh.filter((f) => !have.has(f.id)));
    } catch (err) {
      console.error("Book suggestion round failed:", err.message);
      break;
    }
  }
  return { searchGoal, angleQueries, items: verified, enough: verified.length >= MIN_VERIFIED };
}

module.exports = {
  MIN_VERIFIED,
  buildSuggestPrompt,
  parseSuggestions,
  normalize,
  titleMatches,
  authorMatches,
  latestYear,
  rankDocs,
  verifyCandidate,
  verifyCandidates,
  suggestBooks,
  planAngles,
  buildAnglesPrompt,
};
