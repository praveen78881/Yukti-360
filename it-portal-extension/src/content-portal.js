/* ===========================================================================
   content-portal.js — drives the Income-Tax portal / TRACES pages.

   Pipeline (per your spec):
     login (auto-fill PAN + password) → you complete OTP → select AY from Yukti
     → AIS: download JSON  → 26AS: tick box, View Tax Credit, format Text, export
     → hand each file to the worker → Yukti auto-imports (YES) or Save-As (NO).

   The login auto-fill is implemented. The AIS/26AS step selectors still need
   one live-tuning pass (see README + capture.js) because the portal is
   login-gated and can't be inspected from outside.
   =========================================================================== */
'use strict';

(function () {
  var S = (typeof YUKTI_SELECTORS !== 'undefined') ? YUKTI_SELECTORS : null;
  if (!S) return;

  /* ---- tiny DOM utilities (support a jQuery-style :contains fallback) ----- */
  function matchContains(root, text) {
    var want = text.toLowerCase(), out = [];
    var all = root.querySelectorAll('button, a, label, span, div, input');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var t = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (t === want || t.indexOf(want) === 0) out.push(el);
    }
    return out;
  }
  function pick(sel, root) {
    root = root || document;
    var parts = String(sel).split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      var m = p.match(/:contains\(["']?(.+?)["']?\)/i);
      if (m) { var c = matchContains(root, m[1]); if (c.length) return c[0]; continue; }
      try { var el = root.querySelector(p); if (el) return el; } catch (e) {}
    }
    return null;
  }
  function waitFor(sel, ms) {
    ms = ms || 15000;
    return new Promise(function (res, rej) {
      var found = pick(sel); if (found) return res(found);
      var t0 = Date.now();
      var iv = setInterval(function () {
        var el = pick(sel);
        if (el) { clearInterval(iv); res(el); }
        else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error('timeout: ' + sel)); }
      }, 300);
    });
  }
  function setValue(el, val) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    var setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function progress(step, detail) { try { chrome.runtime.sendMessage({ type: 'PORTAL_PROGRESS', step: step, detail: detail }); } catch (e) {} }

  /* ---- floating status chip so the CA sees what's happening -------------- */
  var chip;
  function say(txt) {
    if (!chip) {
      chip = document.createElement('div');
      chip.style.cssText = 'position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:280px;' +
        'background:#17457f;color:#fff;font:600 12px system-ui;padding:10px 13px;border-radius:10px;' +
        'box-shadow:0 10px 30px -10px rgba(0,0,0,.5)';
      document.documentElement.appendChild(chip);
    }
    chip.textContent = 'Yukti · ' + txt;
  }

  /* ---- route by which portal page we're on ------------------------------ */
  var href = location.href;
  var host = location.host;

  if (host.indexOf('tdscpc.gov.in') >= 0) {
    run26asTraces();
  } else if (/#\/login/i.test(href) || pick(S.login.userIdInput)) {
    runLogin();
  } else if (/ais/i.test(href)) {
    runAis();
  }
  // other portal pages: idle (the CA navigates; we re-activate on the right page)

  /* ---- LOGIN: auto-fill PAN + password (OTP stays manual) --------------- */
  function runLogin() {
    say('filling your login…');
    chrome.runtime.sendMessage({ type: 'REQUEST_CREDENTIAL' }, function (cred) {
      if (!cred || !cred.ok) {
        if (cred && cred.error === 'LOCKED') say('unlock the Yukti vault (click the extension).');
        else if (cred && cred.error === 'NO_CRED') say('no saved login for this client yet.');
        else say('login not available.');
        return;
      }
      waitFor(S.login.userIdInput).then(function (uid) {
        setValue(uid, cred.userId);
        var cont = pick(S.login.userContinue); if (cont) cont.click();
        progress('userId filled');
        // password field appears after the secure-access step
        return waitFor(S.login.passwordInput, 25000);
      }).then(function (pw) {
        setValue(pw, cred.password);
        say('password filled — complete OTP / secure access, then login.');
        progress('password filled');
        // We deliberately DO NOT click final login or submit OTP — human step.
      }).catch(function (e) { say('could not find a login field — needs selector tuning.'); progress('login error', e.message); });
    });
  }

  /* ---- AIS: download as JSON -------------------------------------------- */
  function runAis() {
    say('fetching AIS (JSON)…');
    // TODO(tuning): the AIS SPA flow (Proceed → pick FY → Download → JSON) needs
    // selectors verified on the live page. Scaffold below; fill from capture.js.
    progress('ais: scaffold reached');
    // Example shape once tuned:
    //   waitFor(S.ais.downloadBtn).then(el => el.click())
    //     .then(() => waitFor(S.ais.formatJson)).then(el => el.click())
    //     .then(() => pick(S.ais.confirmDl).click())
    //     .then(() => captureDownloadAndRelay('ais'));
  }

  /* ---- 26AS on TRACES: tick box → View Tax Credit → Text → export ------- */
  function run26asTraces() {
    say('fetching Form 26AS (Text)…');
    progress('26as: scaffold reached');
    // TODO(tuning): verify TRACES selectors (disclaimer checkbox, AY dropdown,
    // "View As = Text", Export). Scaffold:
    //   waitFor(S.form26as.disclaimerBox).then(cb => { cb.checked = true; cb.dispatchEvent(new Event('change',{bubbles:true})); })
    //     .then(() => pick(S.form26as.confirmProceed).click())
    //     ... select AY (from the job), set View As = Text, Export → relay.
  }

  /* ---- hand a downloaded statement to the worker ------------------------ */
  // Preferred for AUTO import: fetch the statement blob in-page (same portal
  // session/cookies) and send its TEXT — no disk needed. For SAVE mode we send
  // the URL so the worker can open a Save-As dialog.
  function captureDownloadAndRelay(kind, fileUrl, suggestedName) {
    return fetch(fileUrl, { credentials: 'include' })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        chrome.runtime.sendMessage({ type: 'PORTAL_FILE_READY', name: suggestedName || (kind + (kind === 'ais' ? '.json' : '.txt')), text: text, url: fileUrl, kind: kind });
      });
  }
  // expose for console testing during tuning
  window.__yuktiCaptureRelay = captureDownloadAndRelay;
})();
