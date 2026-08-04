// Articles and courses have no dedicated "search everything" API like
// Open Library or YouTube — so instead, this asks Claude to do a REAL
// web search and compose recommendations from genuine results, with the
// same anti-hallucination principle as everywhere else: we don't trust
// the model's claimed URLs, we verify them against what the web search
// tool actually returned.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const LANGUAGE_NAMES = { en: "English", ar: "Arabic", fr: "French" };

function buildContentSearchPrompt({ goal, contentType, level, contentLanguage }) {
  const typeLabel = contentType === "articles" ? "articles" : "online courses";
  const languageName = LANGUAGE_NAMES[contentLanguage];

  const languageInstruction = languageName
    ? `\nIMPORTANT: the learner specifically wants ${languageName}-language ${typeLabel}. Search specifically for ${languageName}-language results (not just results that happen to mention the topic) — construct your search queries in ${languageName} where that helps, and only include results that are genuinely in ${languageName}.\n`
    : "";

  const system = `You are finding real, currently-available ${typeLabel} on the open web for someone learning about: "${goal}".

Use your web search tool to find genuinely good ${typeLabel} — only ones you actually find through search just now, never ones you recall from memory.

Learner level: ${level}.
${languageInstruction}
After searching, return ONLY a JSON array (no surrounding text, no markdown fences) of 3 to 6 real results, each shaped exactly like this:
{ "title": "<real title>", "author": "<real publisher, site name, or course provider>", "url": "<the EXACT url from your search results>", "reason": "<one sentence: why this is a good fit>" }

CRITICAL: only include a URL if it came directly from your search results. Never construct, guess, shorten, or modify a URL. If you can't verify a result through search, leave it out entirely rather than guessing.`;

  const user = `Find real ${typeLabel} for this goal now.`;
  return { system, user };
}

async function callModelWithSearch({ system, user }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — see .env.example");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
      // max_uses caps how many searches happen per request — a real,
      // deliberate cost control, since web search is billed as an
      // add-on beyond normal token usage.
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  return response.json();
}

// Pulls every REAL URL that actually appeared in the search tool's own
// results — this is the ground truth everything gets checked against,
// exactly like validateAndMerge does for the sequencing pipeline, just
// sourced from live search results instead of a pre-fetched local list.
function extractRealSearchUrls(apiResponse) {
  const urls = new Set();
  for (const block of apiResponse.content || []) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const result of block.content) {
        if (result && result.url) urls.add(result.url);
      }
    }
  }
  return urls;
}

function extractFinalText(apiResponse) {
  return (apiResponse.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function parseModelOutput(rawText) {
  const cleaned = rawText.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Model output was not a JSON array");
  return parsed;
}

// The critical grounding step: a model ignoring instructions and
// inventing a plausible-looking URL cannot make a fake article/course
// show up to a real user — only URLs that genuinely appeared in the
// real search results survive this check.
function validateAgainstRealUrls(items, realUrls) {
  const kept = [];
  const rejected = [];
  for (const item of items) {
    if (item && typeof item.url === "string" && realUrls.has(item.url)) {
      kept.push(item);
    } else {
      rejected.push(item && item.url ? item.url : JSON.stringify(item));
    }
  }
  return { kept, rejected };
}

async function searchContent({ goal, contentType, level, contentLanguage }) {
  const prompt = buildContentSearchPrompt({ goal, contentType, level, contentLanguage });

  let apiResponse;
  try {
    apiResponse = await callModelWithSearch(prompt);
  } catch (err) {
    console.error("Content search model call failed:", err.message);
    return { items: [], rejected: [], usedFallback: true, error: err.message };
  }

  const realUrls = extractRealSearchUrls(apiResponse);
  const rawText = extractFinalText(apiResponse);

  let rawItems;
  try {
    rawItems = parseModelOutput(rawText);
  } catch (err) {
    console.error("Could not parse content search output:", err.message);
    return { items: [], rejected: [], usedFallback: true, error: err.message };
  }

  const { kept, rejected } = validateAgainstRealUrls(rawItems, realUrls);

  return {
    items: kept.map((it) => ({
      id: it.url, // the URL itself is a natural, stable unique id for web content
      type: contentType === "articles" ? "article" : "course",
      title: it.title,
      author: it.author,
      url: it.url,
      reason: it.reason,
    })),
    rejected,
    usedFallback: kept.length === 0,
  };
}

module.exports = {
  buildContentSearchPrompt,
  extractRealSearchUrls,
  extractFinalText,
  parseModelOutput,
  validateAgainstRealUrls,
  searchContent,
};
