// Unified GSTR-1 return-status poller (Part 4).
//
// ONE poller for the whole app — replaces the ad-hoc loops in the e-File modal
// and client.ts. Discipline baked in, non-negotiable:
//   • schedule: first check 1.5s → 12s → 20s → 30s → 30s  (HARD CAP 5 auto-polls)
//   • timeout (cap reached, still processing) = BLOCKED, never ok:true, never
//     auto-continues to Proceed/File. The caller must poll manually or stop.
//   • REC and P  = SUCCESS (terminal)
//   • PE and ER  = FAILED  (terminal, carries error_report)
//   • HTTP 503 / "source unavailable" = UNAVAILABLE (amber, pipeline pauses
//     resumable, never auto-retried, never rendered as a hard error)
// Every returnStatus call is one credit — the poller reports each via onCall so
// the filing log can show a running "API calls this session: N".

import { sandboxClient } from './sandbox/client';
import type { SandboxResult } from './sandbox/client';

export type PollOutcome =
  | { kind: 'SUCCESS'; status_cd: string; referenceId?: string; raw?: unknown }
  | { kind: 'FAILED'; status_cd: string; errorReport?: unknown; raw?: unknown }
  | { kind: 'PENDING'; status_cd?: string; raw?: unknown }
  | { kind: 'BLOCKED'; raw?: unknown }
  | { kind: 'UNAVAILABLE'; raw?: unknown }
  | { kind: 'ERROR'; message?: string; raw?: unknown };

/** Backoff schedule (ms) before each auto-poll. Length = the hard cap (5). */
export const POLL_SCHEDULE_MS = [1500, 12000, 20000, 30000, 30000] as const;
export const POLL_MAX_ATTEMPTS = POLL_SCHEDULE_MS.length;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isUnavailable(r: SandboxResult): boolean {
  if (r.status === 503) return true;
  const msg = String(r.error ?? '').toLowerCase();
  return msg.includes('unavailable') || msg.includes('maintenance') || msg.includes('source is not available');
}

/** Unwrap Sandbox's `{data:{data:{status_cd,error_report}}}` envelope. */
function unwrap(r: SandboxResult): { status_cd?: string; error_report?: unknown } {
  const d = ((r.data as any)?.data?.data ?? (r.data as any)?.data ?? r.data) as any;
  return { status_cd: d?.status_cd, error_report: d?.error_report };
}

/** Interpret a single returnStatus response into a terminal-or-pending outcome. */
export function interpretStatus(r: SandboxResult): PollOutcome {
  if (isUnavailable(r)) return { kind: 'UNAVAILABLE', raw: r.data };
  if (!r.ok) return { kind: 'ERROR', message: r.error, raw: r.data };
  const { status_cd, error_report } = unwrap(r);
  const cd = status_cd;
  if (cd === 'REC' || cd === 'P') return { kind: 'SUCCESS', status_cd: cd, raw: r.data };
  if (cd === 'PE' || cd === 'ER') return { kind: 'FAILED', status_cd: cd, errorReport: error_report, raw: r.data };
  return { kind: 'PENDING', status_cd: cd, raw: r.data };
}

export interface PollHooks {
  /** Called once per outbound returnStatus call (for the credit counter). */
  onCall?: () => void;
  /** Progress tick: (attemptNumber, maxAttempts) before each poll. */
  onTick?: (attempt: number, max: number) => void;
}

/** One manual poll — a single returnStatus call the user triggered deliberately. */
export async function pollOnce(
  year: string, month: string, refId: string, sessionToken?: string, hooks?: PollHooks,
): Promise<PollOutcome> {
  hooks?.onCall?.();
  const r = await sandboxClient.returnStatus(year, month, refId, sessionToken);
  return interpretStatus(r);
}

/**
 * Drive the auto-poll to a terminal state within the hard cap. Returns SUCCESS /
 * FAILED / UNAVAILABLE as soon as seen; otherwise BLOCKED after the cap. Never
 * returns a truthy "ok" on timeout — the caller decides whether to manual-poll.
 */
export async function pollReturnStatusGated(
  year: string, month: string, refId: string, sessionToken?: string, hooks?: PollHooks,
): Promise<PollOutcome> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await delay(POLL_SCHEDULE_MS[i]);
    hooks?.onTick?.(i + 1, POLL_MAX_ATTEMPTS);
    const out = await pollOnce(year, month, refId, sessionToken, hooks);
    if (out.kind !== 'PENDING') return out; // SUCCESS / FAILED / UNAVAILABLE / ERROR — stop now
  }
  return { kind: 'BLOCKED' };
}
