// ── Sandbox test-taxpayer GSTINs ─────────────────────────────────────────────
// The Sandbox TEST API (test-api.sandbox.co.in) authenticates a fixed mock
// taxpayer whose GSTIN — `29AAACQ3770E000` — is NOT a real, checksum-valid GSTIN
// (its 14th char is "0", not the mandatory "Z", and the check digit is a placeholder).
// So `isGstin()` (correctly) rejects it for real companies, which means the company
// forms would block you from ever creating a company bound to the test taxpayer.
//
// This is the documented exception: the company create/settings flows accept these
// specific known test GSTINs so a test-first user can wire the GST cockpit to the
// Sandbox mock. Real GSTINs still get full format + checksum validation.
//
// The taxpayer behind 29AAACQ3770E000: portal username `acme.com`, test OTP `575757`,
// EWB/e-invoice creds `ACME_IND_API_QCK`. (See the GST sandbox integration notes.)

/** Primary Sandbox test GSTIN (ACME). */
export const SANDBOX_TEST_GSTIN = '29AAACQ3770E000';

/** Every known Sandbox test-taxpayer GSTIN. */
export const SANDBOX_TEST_GSTINS = new Set<string>([SANDBOX_TEST_GSTIN]);

/** True for a known Sandbox mock GSTIN — used to relax real-GSTIN validation for test setup only. */
export function isSandboxTestGstin(gstin: string): boolean {
  return SANDBOX_TEST_GSTINS.has((gstin || '').trim().toUpperCase());
}
