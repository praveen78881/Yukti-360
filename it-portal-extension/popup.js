/* popup.js — vault manager UI. Holds the derived AES key in memory only while
   the popup is open; also hands it to the background worker for the session so
   auto-fill can decrypt on demand. */
'use strict';

var sessionKey = null;
var $ = function (id) { return document.getElementById(id); };
function show(id) {
  ['setup', 'locked', 'unlocked'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); });
}
function msg(text, kind) {
  var m = $('msg'); m.textContent = text || ''; m.className = 'msg' + (kind ? ' ' + kind : '');
}

/* Decide which screen to show on open. */
Vault.isInitialised().then(function (yes) { show(yes ? 'locked' : 'setup'); });

/* ---- first-run setup ------------------------------------------------------ */
$('doSetup').addEventListener('click', function () {
  var a = $('newMaster').value, b = $('newMaster2').value;
  if (a.length < 8) return msg('Use at least 8 characters.', 'err');
  if (a !== b) return msg('The two passwords do not match.', 'err');
  Vault.initialise(a).then(function (key) {
    sessionKey = key; handoffKey(); show('unlocked'); refreshList(); msg('Vault created.', 'ok');
  });
});

/* ---- unlock --------------------------------------------------------------- */
$('doUnlock').addEventListener('click', function () {
  Vault.unlock($('master').value).then(function (key) {
    sessionKey = key; handoffKey(); $('master').value = ''; show('unlocked'); refreshList(); msg('');
  }).catch(function (e) { msg(e.message, 'err'); });
});

/* ---- add / update a credential ------------------------------------------- */
$('doSave').addEventListener('click', function () {
  var pan = $('pan').value.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return msg('Enter a valid 10-char PAN.', 'err');
  if (!$('pwd').value) return msg('Enter the portal password.', 'err');
  if (!sessionKey) return msg('Unlock the vault first.', 'err');
  Vault.put(sessionKey, {
    pan: pan,
    userId: $('userId').value.trim(),
    password: $('pwd').value,
    label: $('label').value.trim()
  }).then(function () {
    ['pan', 'userId', 'pwd', 'label'].forEach(function (f) { $(f).value = ''; });
    refreshList(); msg('Saved — password stored encrypted.', 'ok');
  });
});

/* ---- list / delete -------------------------------------------------------- */
function refreshList() {
  Vault.list().then(function (rows) {
    var box = $('credList');
    if (!rows.length) { box.innerHTML = '<p class="lock-note">No client logins saved yet.</p>'; return; }
    box.innerHTML = '';
    rows.forEach(function (r) {
      var el = document.createElement('div');
      el.className = 'cred';
      el.innerHTML = '<span class="pan"></span><span class="lbl"></span><button class="del" title="Delete">&times;</button>';
      el.querySelector('.pan').textContent = r.pan;
      el.querySelector('.lbl').textContent = r.label || r.userId;
      el.querySelector('.del').addEventListener('click', function () {
        Vault.remove(r.pan).then(refreshList);
      });
      box.appendChild(el);
    });
  });
}

/* ---- lock ----------------------------------------------------------------- */
$('doLock').addEventListener('click', function () {
  sessionKey = null;
  chrome.runtime.sendMessage({ type: 'VAULT_LOCK' });
  show('locked'); msg('Locked.');
});

/* Hand the derived key to the background worker for this browser session so the
   portal auto-fill can decrypt without re-prompting on every page. The key lives
   only in the worker's MEMORY (never chrome.storage / never disk) and is cleared
   on Lock, on browser restart, or when the idle worker is torn down. */
function handoffKey() {
  if (!sessionKey) return;
  crypto.subtle.exportKey('jwk', sessionKey).then(function (jwk) {
    chrome.runtime.sendMessage({ type: 'VAULT_UNLOCKED', jwk: jwk });
  });
}
