/**
 * Netlify Function — Gemini API Proxy
 *
 * Forwards CARP AI requests to Google's Generative Language API while keeping
 * the API key server-side (never in the client bundle).
 *
 * Hardening (do NOT relax without a replacement control):
 *  - Requires a valid Supabase access token (Authorization: Bearer <jwt>) so the
 *    endpoint is not a free public Gemini relay. Verified against Supabase Auth.
 *  - Pins the model to a small server-side allowlist so a caller can't select an
 *    expensive model.
 *  - Rejects cross-origin callers when an allowed-origins list is configured.
 *
 * Request body: { model?: string, ...rest of Gemini generateContent payload }
 * Response: Gemini API response passed through directly.
 */

// Models the proxy is allowed to invoke. Client-supplied model must be one of these.
const ALLOWED_MODELS = new Set([
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
]);
const DEFAULT_MODEL = 'gemini-flash-lite-latest';

function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Verify a Supabase access token by calling the Auth user endpoint. Returns the
 *  user id on success, or null if the token is missing/invalid. */
async function verifySupabaseUser(request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  // If Supabase isn't configured server-side, we can't verify — treat as unauth.
  if (!supabaseUrl || !anonKey) return null;

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) return null;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: anonKey, authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
  } catch {
    return null;
  }
}

function originAllowed(request) {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true; // not configured → skip origin check
  const origin = request.headers.get('origin') || '';
  return allowed.includes(origin);
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError('GEMINI_API_KEY is not configured on the server. Add it in Netlify → Site settings → Environment variables.', 500);
  }

  if (!originAllowed(request)) {
    return jsonError('Origin not allowed', 403);
  }

  // Require a signed-in Supabase user so this is not an open relay.
  const userId = await verifySupabaseUser(request);
  if (!userId) {
    return jsonError('Unauthorized — sign in required.', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  // Pin the model server-side: honour the client's choice only if allowlisted.
  const { model: requestedModel, ...geminiPayload } = body;
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiPayload),
    });
  } catch (e) {
    return jsonError(`Network error calling Gemini: ${e?.message || 'unknown'}`, 502);
  }

  const responseText = await response.text();

  return new Response(responseText, {
    status: response.status,
    headers: { 'content-type': 'application/json' },
  });
}
