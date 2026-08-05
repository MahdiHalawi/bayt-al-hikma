// Takes real, already-fetched items (from Open Library / YouTube) and
// asks the model to SELECT and SEQUENCE a genuine beginner→mastery path
// from ONLY those real items — same anti-hallucination grounding as the
// standalone curriculum-ai project, just applied to live search results
// instead of a fixed local catalog.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const LEVEL_INSTRUCTIONS = {
  new: "The learner is completely new to this topic. Start with the most introductory, accessible items and progress toward the more substantial ones in the list.",
  basics: "The learner already knows some basics. Skip the most beginner-level items if better options exist, and build from a moderate starting point toward the more advanced items in the list.",
  wellread: "The learner is already well-read on this topic. Prioritize the most substantive, advanced, or specialized items in the list, in a logical deepening order. IMPORTANT: a resource's length or thoroughness does NOT indicate its difficulty — a multi-hour 'complete beginner's guide' or '7-hour crash course for beginners' is still beginner content, and a poor fit here, no matter how long it is. Judge genuine difficulty from what the title/description actually says about its level, not how much time it takes.",
};

const TIME_INSTRUCTIONS = {
  quick: "The learner specifically wants QUICK, bite-sized resources. Favor shorter videos and more concise books/articles, and keep the total path on the shorter side rather than maximizing item count.",
  moderate: "The learner wants a steady, moderate pace. A balanced mix of resource lengths is appropriate.",
  deep: "The learner specifically wants DEEP, immersive study. Favor more thorough, substantial resources over quick overviews, even if that means choosing fewer total items.",
};

// Format is included as a stated preference, but treated as a SOFT
// signal, not a hard filter — the available resource list doesn't
// reliably indicate physical vs. digital availability for every item,
// so the model is told this honestly rather than pretending it can
// guarantee format compliance.
const FORMAT_NOTES = {
  physical: "The learner prefers physical books where that's knowable from the resource list, though this is a soft preference since availability format isn't confirmed for every item.",
  digital: "The learner prefers digital/ebook formats where that's knowable from the resource list, though this is a soft preference since availability format isn't confirmed for every item.",
  either: "The learner has no strong preference between physical and digital formats.",
};

// Shared by both prompts below. When someone picks "Something else" and
// describes their own starting point in their own words (since the 3
// fixed buckets don't always genuinely fit — e.g. strong in a related
// field, but new to this specific topic), that description becomes the
// actual instruction, instead of guessing from a generic bucket.
function resolveLevelInstruction(level, levelOther) {
  if (level === "other" && levelOther && levelOther.trim()) {
    return `The learner describes their own starting point in their own words, rather than picking one of the standard levels: "${levelOther.trim()}". Use this description to judge a genuinely appropriate starting point and build a real progression from there — do not default to a generic beginner or expert assumption.`;
  }
  return LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.basics;
}

function buildPrompt({ goal, level, levelOther, format, timeCommitment, items, previouslyCompleted }) {
  const itemList = items
    .map((it, i) => `${i}. id: "${it.id}" | type: ${it.type} | "${it.title}" by ${it.author}`)
    .join("\n");

  // Only present when this is an "Expand my scroll" continuation, not a
  // fresh path. These items are already excluded from `items` above by
  // the frontend, so the model can't select them again even if it tried
  // — this section is purely context, telling it what foundation to
  // build on rather than repeat.
  const completedSection =
    previouslyCompleted && previouslyCompleted.length > 0
      ? `\nThe learner has ALREADY completed the following real items on this exact goal (they are not available to choose again — build on this foundation, going meaningfully deeper toward mastery rather than repeating introductory ground):\n${previouslyCompleted.map((it) => `- "${it.title}" by ${it.author}`).join("\n")}\n`
      : "";

  const system = `You are sequencing a personalized learning path from a FIXED list of real, already-verified resources.

You must choose ids ONLY from the list below. Never invent a resource, id, title, or author that is not in this exact list, even if you know of a better one in the real world.

AVAILABLE RESOURCES:
${itemList}
${completedSection}
${resolveLevelInstruction(level, levelOther)}
${TIME_INSTRUCTIONS[timeCommitment] || TIME_INSTRUCTIONS.moderate}
${FORMAT_NOTES[format] || FORMAT_NOTES.either}

Choose between 3 and ${Math.min(items.length, 7)} of these resources — however many genuinely form a good progression, not necessarily all of them.

Return ONLY a JSON array, no surrounding text, no markdown fences. Each item must have exactly this shape:
{ "id": "<must exactly match an id from the list above>", "reason": "<one sentence: why this belongs at this point in the progression>" }

Order the array as the actual sequence someone should follow, first to last.`;

  const user = `Goal: "${goal}"\nBuild the sequenced path now.`;

  return { system, user };
}

function parseModelOutput(rawText) {
  const cleaned = rawText.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Model output was not a JSON array");
  return parsed;
}

// The SECOND layer of judgment — this is what actually addresses "these
// are topically related but not genuinely useful for this goal." The
// first pass picks and orders items; this pass specifically interrogates
// whether each chosen item, AT ITS POSITION in the sequence, genuinely
// serves someone working toward the stated goal — not just whether it
// mentions the topic. Weak fits can be swapped for a better item from
// the remaining pool, or dropped entirely.
function buildCritiquePrompt({ goal, level, levelOther, format, timeCommitment, chosenPath, remainingItems }) {
  const chosenList = chosenPath
    .map((it, i) => `${i + 1}. id: "${it.id}" | "${it.title}" by ${it.author} | current reason: ${it.reason}`)
    .join("\n");
  const remainingList =
    remainingItems.map((it) => `id: "${it.id}" | type: ${it.type} | "${it.title}" by ${it.author}`).join("\n") ||
    "(none available)";

  const system = `You are reviewing a proposed learning path for GENUINE FIT, not just topical relevance.

GOAL: "${goal}"
${resolveLevelInstruction(level, levelOther)}
${TIME_INSTRUCTIONS[timeCommitment] || TIME_INSTRUCTIONS.moderate}
${FORMAT_NOTES[format] || FORMAT_NOTES.either}

PROPOSED PATH (position 1 should serve a beginner at this goal; the final position should serve someone near mastery of it):
${chosenList}

For EACH item, judge honestly: does its actual content genuinely help someone make real progress toward THIS SPECIFIC GOAL, appropriate to its position in the sequence AND to the stated pace preference above? A video or book that is merely topically adjacent — a general news piece, an opinion piece, a tool roundup, a listicle — is a WEAK fit even if it mentions the subject. Do not keep something just because it's related; keep it only if it would actually teach or build the stated goal at that stage. Also watch for a specific trap: a resource's length does NOT indicate its difficulty — a long "beginner's guide" or "complete crash course for beginners" is still beginner-level content and a poor fit for a later, more advanced position in the sequence, regardless of how many hours it runs.

If an item is a weak fit, you may replace it with a better-fitting item from the pool below (only if a genuinely better one exists there), or remove it entirely if nothing available fits well.

REMAINING AVAILABLE ITEMS (not currently used, may be swapped in if genuinely better):
${remainingList}

Return ONLY a JSON array, no surrounding text, no markdown fences, same shape as before:
{ "id": "<id from either the proposed path or the remaining items above>", "reason": "<one sentence, why this belongs at this point>" }

This is the FINAL revised path, in order.`;

  const user = "Review the proposed path for genuine fit and finalize it now.";
  return { system, user };
}

// The critical grounding step — independent of what the model was told,
// this checks every returned id against the REAL items actually passed
// in, and discards anything that doesn't match. A model ignoring
// instructions can't make a nonexistent resource show up to a real user.
function validateAndMerge(rawItems, originalItems) {
  const byId = {};
  originalItems.forEach((it) => (byId[it.id] = it));

  const path = [];
  const rejected = [];

  for (const raw of rawItems) {
    const original = raw && typeof raw.id === "string" ? byId[raw.id] : undefined;
    if (original) {
      path.push({ ...original, reason: typeof raw.reason === "string" ? raw.reason : original.reason });
    } else {
      rejected.push(raw && raw.id ? raw.id : JSON.stringify(raw));
    }
  }

  return { path, rejected };
}

async function callModel({ system, user }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — see .env.example");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages: [{ role: "user", content: user }] }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock) throw new Error("No text content in model response");
  return textBlock.text;
}

// items: the real, already-fetched books/videos from the frontend.
// Returns the same fallback-safe shape as curriculum-ai: never throws,
// always returns SOMETHING usable, even if the model call fails.
async function sequencePath({ goal, level, levelOther = "", format, timeCommitment, items, previouslyCompleted = [] }) {
  if (!items || items.length === 0) {
    return { path: [], rejected: [], usedFallback: true, error: "No items provided to sequence" };
  }

  const prompt = buildPrompt({ goal, level, levelOther, format, timeCommitment, items, previouslyCompleted });

  let rawText;
  try {
    rawText = await callModel(prompt);
  } catch (err) {
    console.error("Sequencing model call failed, returning items unsequenced:", err.message);
    return { path: items, rejected: [], usedFallback: true, error: err.message };
  }

  let rawItems;
  try {
    rawItems = parseModelOutput(rawText);
  } catch (err) {
    console.error("Could not parse sequencing output, returning items unsequenced:", err.message);
    return { path: items, rejected: [], usedFallback: true, error: err.message };
  }

  const { path, rejected } = validateAndMerge(rawItems, items);

  if (path.length === 0) {
    // Every returned id was hallucinated/invalid — fall back to the
    // original, unsequenced-but-real items rather than showing nothing.
    return { path: items, rejected, usedFallback: true };
  }

  // SECOND LAYER: critique the first pass's choices for genuine fit, not
  // just topical relevance, and let it swap in better items from what
  // wasn't originally chosen. This costs one more small API call, but
  // this is specifically the step that catches "related but not
  // actually useful for this goal" items the first pass let through.
  try {
    const chosenIds = new Set(path.map((p) => p.id));
    const remainingItems = items.filter((it) => !chosenIds.has(it.id));
    const critiquePrompt = buildCritiquePrompt({ goal, level, levelOther, format, timeCommitment, chosenPath: path, remainingItems });
    const critiqueRawText = await callModel(critiquePrompt);
    const critiqueRawItems = parseModelOutput(critiqueRawText);
    const { path: refinedPath, rejected: critiqueRejected } = validateAndMerge(critiqueRawItems, items);

    if (refinedPath.length > 0) {
      return { path: refinedPath, rejected: [...rejected, ...critiqueRejected], usedFallback: false };
    }
    // Critique pass returned nothing usable — fall back to the first
    // pass's result rather than losing a perfectly fine path over it.
    console.warn("Critique pass returned no usable items, keeping the first-pass result.");
  } catch (err) {
    console.error("Critique pass failed, keeping the first-pass result:", err.message);
  }

  return { path, rejected, usedFallback: false };
}

module.exports = { buildPrompt, buildCritiquePrompt, resolveLevelInstruction, parseModelOutput, validateAndMerge, sequencePath };
