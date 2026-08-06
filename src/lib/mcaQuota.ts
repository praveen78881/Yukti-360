// ─────────────────────────────────────────────────────────────────────────────
// MCA data-import usage guard (client-side, localStorage).
//
// Company creation itself is free — importing MCA data is metered:
//   - Combined cap across CIN fetches AND name searches: 5 per day.
//   - The daily allowance resets at 12:00 AM local time.
//   - Burst rule: 2 fetches may run back-to-back inside a minute; attempting a
//     3rd within that minute starts a 1-minute cooldown timer.
//
// The exact numbers are deliberately NOT surfaced in the UI — the wizard only
// shows a countdown when a cooldown is active, or a generic "resets at 12 AM"
// line when the day's allowance is spent.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'ca_mca_import_quota_v1';
const DAILY_MAX = 5;
const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 2;
const COOLDOWN_MS = 60_000;

interface QuotaState {
  day: string;            // local yyyy-mm-dd the counters belong to
  used: number;           // fetches consumed today (CIN + name combined)
  stamps: number[];       // epoch-ms of recent fetches (burst window)
  cooldownUntil?: number; // epoch-ms until which fetching is paused
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function load(): QuotaState {
  const fresh: QuotaState = { day: todayStr(), used: 0, stamps: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const s = JSON.parse(raw) as QuotaState;
    // New day → everything resets (token refresh at 12 AM local).
    if (s.day !== todayStr()) return fresh;
    return { day: s.day, used: s.used || 0, stamps: Array.isArray(s.stamps) ? s.stamps : [], cooldownUntil: s.cooldownUntil };
  } catch {
    return fresh;
  }
}

function save(s: QuotaState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full/blocked */ }
}

export type QuotaCheck =
  | { ok: true }
  | { ok: false; reason: 'cooldown'; retryAt: number }
  | { ok: false; reason: 'daily' };

/** Can a fetch run right now? Starts the cooldown as a side effect when the burst rule trips. */
export function checkMcaQuota(): QuotaCheck {
  const s = load();
  const now = Date.now();
  if (s.cooldownUntil && now < s.cooldownUntil) return { ok: false, reason: 'cooldown', retryAt: s.cooldownUntil };
  if (s.used >= DAILY_MAX) return { ok: false, reason: 'daily' };
  const recent = s.stamps.filter(t => now - t < BURST_WINDOW_MS);
  if (recent.length >= BURST_MAX) {
    const cooldownUntil = now + COOLDOWN_MS;
    save({ ...s, stamps: recent, cooldownUntil });
    return { ok: false, reason: 'cooldown', retryAt: cooldownUntil };
  }
  return { ok: true };
}

/** Record one consumed fetch (call only after checkMcaQuota() returned ok). */
export function recordMcaFetch() {
  const s = load();
  const now = Date.now();
  save({
    day: s.day,
    used: s.used + 1,
    stamps: [...s.stamps.filter(t => now - t < BURST_WINDOW_MS), now],
    cooldownUntil: undefined,
  });
}
