# Yukti IT-Portal Helper (browser extension)

Bridges **Yukti 360** and the **Income-Tax portal** so the CA can, from one
click in Yukti:

1. open the portal with **PAN + password auto-filled** (passwords stored
   **encrypted**, never in plain text),
2. have the **Assessment Year** and **AIS / 26AS** steps selected automatically
   from the year chosen in Yukti,
3. download **AIS as JSON** and **26AS as Text**, and
4. **auto-import** them back into Yukti (YES) or **Save-As** to a folder (NO).

> A website physically cannot do steps 1–3 on another site — browser security
> forbids it. That is why this is a browser **extension**.

---

## What works right now (Phase 1)

- ✅ **Encrypted credential vault** — master password (PBKDF2 → AES-256-GCM),
  per-client PAN, passwords encrypted at rest. Fully usable from the extension
  popup today.
- ✅ **Yukti ↔ extension bridge** — reuses the `YUKTI_IMPORT_STATEMENT` hook
  already present in `96_docs_ay.js`, so the auto-import path is wired.
- ✅ **Login auto-fill** scaffold (fills User ID + password; you complete OTP).
- ⏳ **AIS / 26AS navigation selectors** — need one live-tuning pass (the portal
  is login-gated and can't be inspected from outside). See *Tuning* below.

---

## Install (one time, Chrome or Edge)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** → select this `it-portal-extension` folder.
4. Pin the **Yukti IT-Portal Helper** icon.

Before first real use, edit `manifest.json` and replace
`https://YOUR-YUKTI-PROD-DOMAIN/*` (2 places) with the live Yukti URL
(the `localhost:3000` entry already covers local dev).

## Set up the vault

1. Click the extension icon → **Create a master password** (first run).
2. **+ Add / update a client login** → enter PAN, portal User ID (blank = PAN),
   password, optional label → **Save**. The password is encrypted immediately.
3. Next time, click the icon → **Unlock** with the master password.

> Forgetting the master password is unrecoverable **by design** — there is no
> backdoor to the stored passwords.

---

## Tuning the portal selectors (the one pending step)

Because the portal needs a login, its page structure has to be captured from a
real session:

1. Log in to the portal, open the page to automate (AIS page, or the TRACES
   26AS page).
2. Press **F12 → Console**, paste the contents of `capture.js`, press Enter.
3. Copy the printed table and send it back.
4. The real selectors go into `src/selectors.js` — the only file that needs
   editing — and the AIS/26AS steps in `src/content-portal.js` are switched on.

---

## Security notes

- Passwords: **AES-256-GCM**, key derived from the master password via
  **PBKDF2 (310k iterations)**. Only ciphertext + salt are stored.
- The unlocked key lives in the service worker's **memory only** for the
  session; it is never written to `chrome.storage` or disk, and clears on Lock
  or browser restart.
- The extension **never** submits OTP, solves captcha, or clicks final
  login/submit — those stay with the human.
- Selectors can break when the portal changes; patch `src/selectors.js`.
