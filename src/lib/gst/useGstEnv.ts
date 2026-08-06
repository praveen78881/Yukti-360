// The server's configured GST environment (test vs live), read from the server —
// NOT a hardcoded client flag. Fetched once, module-cached, and zero-credit (the
// `env` action never calls Sandbox). Drives the PRODUCTION/TEST banner + env pill.

import { useEffect, useState } from 'react';
import { sandboxClient } from './sandbox/client';

export interface GstEnv { mode: 'test' | 'live'; host: string }

let cached: GstEnv | null = null;
let inflight: Promise<GstEnv> | null = null;

function fetchEnv(): Promise<GstEnv> {
  if (!inflight) {
    inflight = sandboxClient
      .getEnv()
      .then((r): GstEnv => {
        cached = { mode: r.data?.mode === 'live' ? 'live' : 'test', host: r.data?.host ?? '' };
        return cached;
      })
      .catch((): GstEnv => {
        // Probe hits our OWN server; a failure means the app is broken anyway. Fall back
        // to 'test' (the app's default env) rather than falsely flashing PRODUCTION.
        cached = { mode: 'test', host: '' };
        return cached;
      });
  }
  return inflight;
}

/** The configured GST environment, or null while the one-time probe resolves. */
export function useGstEnv(): GstEnv | null {
  const [env, setEnv] = useState<GstEnv | null>(cached);
  useEffect(() => {
    if (cached) { setEnv(cached); return; }
    let alive = true;
    fetchEnv().then((e) => { if (alive) setEnv(e); });
    return () => { alive = false; };
  }, []);
  return env;
}
