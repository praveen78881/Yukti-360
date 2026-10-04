/* Login gate — the offline marker.
 *
 * With Supabase configured the real auth session is the source of truth. Without
 * it (offline mode, no VITE_SUPABASE_* keys) the login screen is an offline
 * pass-through, so there is no session to check; instead the login screen sets
 * this flag and RequireAuth (src/routes.tsx) checks it. Either way the app can't
 * be reached — not even by a deep link — without passing the login screen.
 */

export const SIGNED_IN_KEY = 'ca_signed_in';

/** Mark the visitor as signed in (offline mode). Called once the login screen
 *  is cleared, i.e. after a profile is chosen. */
export function markSignedIn(): void {
  try { localStorage.setItem(SIGNED_IN_KEY, '1'); } catch { /* storage blocked */ }
}

/** Forget the offline sign-in (on Sign Out). */
export function clearSignedIn(): void {
  try { localStorage.removeItem(SIGNED_IN_KEY); } catch { /* storage blocked */ }
}

/** True when the visitor has passed the login screen in offline mode. */
export function hasLocalSignIn(): boolean {
  try { return localStorage.getItem(SIGNED_IN_KEY) === '1'; } catch { return false; }
}

/* ── Password policy ────────────────────────────────────────────────────────
 * A login password is one the user creates here — not their email password. It
 * must be strong: 8+ characters with an uppercase letter, a number and a
 * special character. The login screen shows these as a live checklist. */
export interface PasswordCheck {
  length: boolean;
  upper: boolean;
  number: boolean;
  special: boolean;
  /** All rules met. */
  ok: boolean;
}

export function checkPassword(pw: string): PasswordCheck {
  const length = pw.length >= 8;
  const upper = /[A-Z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);
  return { length, upper, number, special, ok: length && upper && number && special };
}

/* ── Email ──────────────────────────────────────────────────────────────────
 * The login identifier. The password is still a separate one the user creates
 * here, not their email account's password. */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}
export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/* ── Offline credential store ───────────────────────────────────────────────
 * With no Supabase backend, the account the user creates lives on this device:
 * the email and a salted SHA-256 of the password (never the password itself).
 * Sign-up saves it; sign-in verifies against it. This is a local access gate,
 * not a substitute for server auth — it moves to Supabase email auth
 * automatically once the keys are set. */
const CREDENTIAL_KEY = 'ca_local_credential';

async function hashPassword(email: string, password: string): Promise<string> {
  const input = `yukti360:${email}:${password}`;
  // Web Crypto needs a secure context (https or localhost). It is there in the
  // normal case; the fallback keeps the local gate working if the app is opened
  // over a plain-http LAN IP, where crypto.subtle is undefined.
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return 's' + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* fall through to the weak fallback */ }
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  return 'f' + (h >>> 0).toString(16);
}

interface StoredCredential { email: string; hash: string }

function readCredential(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return typeof c?.email === 'string' && typeof c?.hash === 'string' ? c : null;
  } catch { return null; }
}

/** Has an offline account been created on this device? */
export function hasLocalAccount(): boolean {
  return readCredential() !== null;
}

/** Create (or replace) the offline account. */
export async function saveLocalCredential(email: string, password: string): Promise<void> {
  const id = normalizeEmail(email);
  const hash = await hashPassword(id, password);
  try { localStorage.setItem(CREDENTIAL_KEY, JSON.stringify({ email: id, hash })); } catch { /* storage blocked */ }
}

/** True when the email + password match the stored offline account. */
export async function verifyLocalCredential(email: string, password: string): Promise<boolean> {
  const cred = readCredential();
  if (!cred) return false;
  const id = normalizeEmail(email);
  const hash = await hashPassword(id, password);
  return cred.email === id && cred.hash === hash;
}

/** Forget the offline account (used by the offline "reset password" path). */
export function clearLocalCredential(): void {
  try { localStorage.removeItem(CREDENTIAL_KEY); } catch { /* storage blocked */ }
}
