/**
 * Netlify Function — Sandbox.co.in GST (GSP) proxy.
 *
 * Keeps SANDBOX_API_KEY / SANDBOX_API_SECRET server-side (never in the client
 * bundle) exactly like gemini-plan.js. The browser POSTs { action, ...params };
 * this handler injects the secret, talks to Sandbox, and returns the JSON.
 *
 * Actions: status | gstinSearch | otpGenerate | otpVerify | fetch  (see _shared/sandboxCore.mjs).
 *
 * NOTE ON AUTH: gemini-plan.js requires a Supabase JWT. App login is currently
 * suspended (see src/routes.tsx), so requiring a JWT here would break the whole
 * flow. We gate on an optional origin allowlist instead. Re-enable
 * verifySupabaseUser() (copy from gemini-plan.js) the moment login is restored.
 */

import { getConfigFromEnv, handleAction } from './_shared/sandboxCore.mjs';

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
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
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!originAllowed(request)) return json(403, { error: 'Origin not allowed' });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { action, env: reqEnv, ...params } = body || {};
  if (!action) return json(400, { error: 'Missing "action" in request body' });

  const cfg = getConfigFromEnv(process.env, reqEnv);
  try {
    const { status, data } = await handleAction(action, params, cfg);
    return json(status, data);
  } catch (e) {
    return json(e?.statusCode || 500, { error: e?.message || 'Sandbox proxy error' });
  }
}
