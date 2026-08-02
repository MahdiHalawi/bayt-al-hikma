// The backend's URL — this is what makes deployment possible at all.
// Right now it points at your local dev server. The MOMENT you deploy
// payments-backend somewhere real (Render, Railway, etc.), change this
// to that real URL — e.g. "https://bayt-al-hikma-backend.onrender.com"
// — with NO trailing slash.
//
// Same window-attachment pattern as supabase-config.js and
// youtube-config.js, for the same reason: guarantees app.js (a separate
// script file) can always see it.
window.BACKEND_URL = "https://bayt-al-hikma.onrender.com";