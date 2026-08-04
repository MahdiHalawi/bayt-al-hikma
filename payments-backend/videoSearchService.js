// Moves the YouTube Data API call to the backend — the key now lives
// only in Render's (or your host's) environment variables, never in any
// frontend file. This mirrors the exact same secret-handling pattern
// already used for Anthropic and Stripe: real secrets belong on the
// server, period, not in browser-loaded code.

const YOUTUBE_LANG_CODES = { en: "en", ar: "ar", fr: "fr" };

// The equivalent of "explained" in each supported language — previously
// this was hardcoded to the English word regardless of the requested
// language, which meant even an Arabic-language request had English
// text injected directly into the search query itself. That's a much
// stronger bias toward English results than relevanceLanguage's soft
// ranking signal alone, and was the real, primary cause of Arabic/French
// requests still coming back mostly in English.
const EDUCATIONAL_SUFFIX = { en: "explained", ar: "شرح", fr: "expliqué" };

// No DOM available server-side, so this is a small manual replacement
// instead of the browser's textarea-based decode trick used before.
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function searchVideos({ query, contentLanguage }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { items: [], error: "YOUTUBE_API_KEY is not set", usedFallback: true };
  }

  // videoDuration=medium excludes anything under ~4 minutes — filters
  // out YouTube Shorts, which are heavily hashtag-farmed and rarely
  // represent real educational material. Appending the equivalent of
  // "explained" IN THE REQUESTED LANGUAGE biases toward genuine
  // educational content over news/opinion/tool-roundup videos that
  // merely mention the topic — using the wrong-language word here would
  // itself bias results toward that language, which is exactly the bug
  // this now avoids.
  const suffix = EDUCATIONAL_SUFFIX[contentLanguage] || EDUCATIONAL_SUFFIX.en;
  const educationalQuery = `${query} ${suffix}`;
  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=medium&maxResults=6&q=${encodeURIComponent(educationalQuery)}&key=${apiKey}`;
  const langCode = YOUTUBE_LANG_CODES[contentLanguage];
  // relevanceLanguage is a soft ranking signal, not a hard filter —
  // YouTube doesn't offer a strict "only this language" search filter.
  if (langCode) url += `&relevanceLanguage=${langCode}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube API request failed: " + res.status);
    const data = await res.json();
    const items = (data.items || []).map((item) => ({
      id: item.id.videoId,
      type: "video",
      title: decodeHtmlEntities(item.snippet.title),
      author: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      coverUrl:
        item.snippet.thumbnails && item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : null,
      reason: `A real, current video match for "${query}".`,
    }));
    return { items, error: null, usedFallback: false };
  } catch (err) {
    console.error("Video search failed:", err.message);
    return { items: [], error: err.message, usedFallback: true };
  }
}

module.exports = { searchVideos, decodeHtmlEntities };
