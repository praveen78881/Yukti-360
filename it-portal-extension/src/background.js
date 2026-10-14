/* ===========================================================================
   background.js — service worker / orchestrator.

   Holds the unlocked AES key in MEMORY for the session (never persisted) and:
     • decrypts a client's portal password on demand for auto-fill,
     • opens the portal tab when Yukti asks to fetch AIS/26AS,
     • routes downloaded statement text back to the Yukti tab (YES = auto-import)
       or to disk via a Save-As dialog (NO = choose folder).

   Portal page automation (select AY, tick box, pick format, download) lives in
   content-portal.js; this worker just coordinates tabs and secrets.
   =========================================================================== */
'use strict';

importScripts('vault.js');

/* ---- in-memory session key (NOT persisted) ------------------------------- */
var sessionKey = null;          // CryptoKey, or null when locked
var jobs = {};                  // portalTabId -> job context

function importJwk(jwk) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  switch (msg && msg.type) {

    /* popup unlocked the vault → keep the key for this session */
    case 'VAULT_UNLOCKED':
      importJwk(msg.jwk).then(function (k) { sessionKey = k; });
      return;

    case 'VAULT_LOCK':
      sessionKey = null;
      return;

    case 'VAULT_STATUS':
      sendResponse({ unlocked: !!sessionKey });
      return;

    /* Yukti asked to fetch statements for a client/AY (content-yukti.js) */
    case 'YUKTI_PORTAL_FETCH':
      startFetch(msg, sender).then(function (r) { sendResponse(r); });
      return true; // async

    /* portal login page needs the decrypted credential (content-portal.js) */
    case 'REQUEST_CREDENTIAL':
      provideCredential(msg.pan, sender).then(sendResponse);
      return true; // async

    /* portal content script finished a download and captured the text/blob */
    case 'PORTAL_FILE_READY':
      handleFile(msg, sender).then(function (r) { sendResponse(r); });
      return true; // async

    /* portal content script reports which step it reached (for the popup/log) */
    case 'PORTAL_PROGRESS':
      // Could surface in the popup; for now just log.
      console.log('[portal]', msg.step, msg.detail || '');
      return;
  }
});

/* ---- open the portal and remember what to fetch -------------------------- */
function startFetch(msg, sender) {
  if (!sessionKey) {
    return Promise.resolve({ ok: false, error: 'LOCKED', message: 'Open the Yukti IT-Portal Helper and unlock the vault first.' });
  }
  var yuktiTabId = sender.tab && sender.tab.id;
  return new Promise(function (res) {
    chrome.tabs.create({ url: 'https://eportal.incometax.gov.in/iec/foservices/#/login', active: true }, function (tab) {
      jobs[tab.id] = {
        yuktiTabId: yuktiTabId,
        pan: msg.pan,
        ay: msg.ay,                        // e.g. "2026-27"
        want: msg.want || ['ais', '26as'], // which statements
        mode: msg.mode || 'auto'           // 'auto' = import into Yukti, 'save' = Save-As
      };
      res({ ok: true, portalTabId: tab.id });
    });
  });
}

/* ---- decrypt the credential for the login page --------------------------- */
function provideCredential(pan, sender) {
  if (!sessionKey) return Promise.resolve({ ok: false, error: 'LOCKED' });
  var job = jobs[sender.tab && sender.tab.id];
  var usePan = pan || (job && job.pan);
  if (!usePan) return Promise.resolve({ ok: false, error: 'NO_PAN' });
  return Vault.reveal(sessionKey, usePan)
    .then(function (cred) { return { ok: true, userId: cred.userId, password: cred.password, ay: job && job.ay, want: job && job.want }; })
    .catch(function (e) { return { ok: false, error: 'NO_CRED', message: e.message }; });
}

/* ---- a statement file is ready ------------------------------------------- */
function handleFile(msg, sender) {
  var job = jobs[sender.tab && sender.tab.id] || {};
  // AUTO: relay text to the Yukti tab, which posts YUKTI_IMPORT_STATEMENT into
  // the ITR iframe (already handled by 96_docs_ay.js). No disk touched.
  if (job.mode !== 'save' && job.yuktiTabId != null && typeof msg.text === 'string') {
    return new Promise(function (res) {
      chrome.tabs.sendMessage(job.yuktiTabId, {
        type: 'IMPORT_INTO_YUKTI', name: msg.name, text: msg.text
      }, function () { res({ ok: true, routed: 'yukti' }); });
    });
  }
  // SAVE: hand to the OS Save-As dialog (user picks the folder).
  if (msg.url) {
    return new Promise(function (res) {
      chrome.downloads.download({ url: msg.url, filename: msg.name, saveAs: true }, function (id) {
        res({ ok: true, routed: 'download', id: id });
      });
    });
  }
  return Promise.resolve({ ok: false, error: 'NO_PAYLOAD' });
}
