/* ===========================================================================
   content-yukti.js — runs on the Yukti app (every frame, incl. the ITR iframe).

   Two jobs:
   1. Presence: tell the page the extension is installed, so Yukti can show the
      one-click "Fetch from portal" path instead of the manual window.open.
   2. Bridge:
        page  → (window.postMessage YUKTI_PORTAL_FETCH) → background opens portal
        background → (IMPORT_INTO_YUKTI) → page (window.postMessage
                     YUKTI_IMPORT_STATEMENT) → 96_docs_ay.js ingests it.
   =========================================================================== */
'use strict';

/* 1 — announce presence to the page's main world */
try {
  window.postMessage({ type: 'YUKTI_EXT_PRESENT', version: chrome.runtime.getManifest().version }, '*');
} catch (e) {}

/* 2a — page asks us to fetch from the portal */
window.addEventListener('message', function (ev) {
  if (ev.source !== window) return;
  var d = ev.data;
  if (!d || d.type !== 'YUKTI_PORTAL_FETCH') return;
  chrome.runtime.sendMessage({
    type: 'YUKTI_PORTAL_FETCH',
    pan: d.pan,
    ay: d.ay,
    want: d.want,       // e.g. ['ais','26as']
    mode: d.mode        // 'auto' | 'save'
  }, function (resp) {
    window.postMessage({ type: 'YUKTI_PORTAL_FETCH_ACK', ok: resp && resp.ok, error: resp && resp.error, message: resp && resp.message }, '*');
  });
});

/* 2b — background routes a downloaded statement back here → feed 96_docs_ay.js */
chrome.runtime.onMessage.addListener(function (msg) {
  if (msg && msg.type === 'IMPORT_INTO_YUKTI') {
    // The existing Yukti listener (96_docs_ay.js) handles this exact shape and
    // replies YUKTI_IMPORT_RESULT, which the page surfaces to the user.
    window.postMessage({ type: 'YUKTI_IMPORT_STATEMENT', name: msg.name, text: msg.text }, '*');
  }
});
