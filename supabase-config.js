// Paste your own values here — from Supabase dashboard:
// Project Settings → API → Project URL, and the "anon public" key.
//
// This is safe to have in frontend code. Unlike the Anthropic/Stripe
// secret keys, Supabase's anon key is DESIGNED to be public — real
// security comes from the Row Level Security policies we wrote in SQL,
// not from hiding this key. Never paste your "service_role" key here
// though — that one genuinely is secret and belongs only on a server.

const SUPABASE_URL = "https://voknkeinegcxemtqwkzr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva25rZWluZWdjeGVtdHF3a3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgxMDEsImV4cCI6MjEwMDk5NDEwMX0.WiPT164t89MzlvTGSNBrIgVx9SV2Sizy863I9B4cAeQ";

// Attached explicitly to window rather than left as a plain `const` —
// this guarantees app.js (a separate script file) can always see it,
// rather than relying on implicit scope-sharing between script tags.
window.sb = supabase.createClient("https://voknkeinegcxemtqwkzr.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva25rZWluZWdjeGVtdHF3a3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgxMDEsImV4cCI6MjEwMDk5NDEwMX0.WiPT164t89MzlvTGSNBrIgVx9SV2Sizy863I9B4cAeQ");
