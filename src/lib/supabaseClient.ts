// Shared Supabase client (singleton).
//
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (set in .env). If either is
// missing, `supabase` is null and the app continues to use offline/localStorage
// storage — so the build never breaks just because Supabase isn't configured yet.
//
// Get the two values from Supabase → Project Settings → API
// (Project URL and the `anon` public key).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** True when both env vars are present, i.e. Supabase can be used. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — ' +
      'Supabase disabled, falling back to offline storage.',
  );
}

// The raw build-time vars lead the condition on purpose: in a build without them
// Vite inlines `undefined`, the bundler can prove createClient is unreachable, and
// the ~200 kB supabase-js library (sideEffects:false) drops out of the bundle.
// When they are present the result is exactly `isSupabaseConfigured ? … : null`.
export const supabase: SupabaseClient | null =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && isSupabaseConfigured
    ? createClient(url as string, anonKey as string, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;
