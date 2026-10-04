// ============================================================================
// Who is signed in, for greetings and attribution.
//
// Offline single-user mode keeps the person's details in localStorage under
// `ca_user_registration` (written by the onboarding SignUpForm). This reads the
// display name back out — best-effort, never throws, empty string when unknown.
// ============================================================================

const REGISTRATION_KEY = 'ca_user_registration';

interface StoredRegistration {
  name?: string;
  email?: string;
}

/** The signed-in person's full name, or '' when not registered / unreadable. */
export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(REGISTRATION_KEY);
    if (!raw) return '';
    const data = JSON.parse(raw) as StoredRegistration;
    return typeof data?.name === 'string' ? data.name.trim() : '';
  } catch {
    return '';
  }
}

/** Just the first word of the name — what a greeting uses ("Hi, Sagar"). */
export function getUserFirstName(): string {
  const name = getUserName();
  if (!name) return '';
  // first whitespace-separated token, trimmed of stray punctuation
  return name.split(/\s+/)[0].replace(/[^\p{L}\p{N}.'-]/gu, '');
}
