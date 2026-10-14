/* ===========================================================================
   vault.js — encrypted credential store for the Income-Tax portal.

   Security model (what the user asked for — passwords NEVER in plain text):
     • Master password  → PBKDF2(SHA-256, 310 000 iters, 16-byte salt) → AES-256 key
     • The AES key is NEVER stored. Only the random salt is stored.
     • Each client's portal password is encrypted with AES-256-GCM (random
       12-byte IV per entry) and only the ciphertext + IV live on disk
       (chrome.storage.local).
     • Decryption happens in memory, for the instant of auto-fill, then the
       plaintext is dropped. A stolen laptop/profile yields only ciphertext.

   Usable from both the popup (<script src>) and the service worker
   (importScripts). Exposes a global `Vault`.
   =========================================================================== */
(function (root) {
  'use strict';

  var PBKDF2_ITERS = 310000;
  var enc = new TextEncoder();
  var dec = new TextDecoder();

  /* ---- base64 <-> bytes ---------------------------------------------------- */
  function b64(bytes) {
    var s = '';
    var a = new Uint8Array(bytes);
    for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str), a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }

  /* ---- key derivation ------------------------------------------------------ */
  function deriveKey(masterPassword, saltBytes) {
    return crypto.subtle
      .importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          true, // extractable: lets the service worker hold the key in MEMORY for
                // the session (never persisted) so auto-fill can decrypt on demand
          ['encrypt', 'decrypt']
        );
      });
  }

  /* ---- primitive encrypt / decrypt ---------------------------------------- */
  function encrypt(key, plaintext) {
    var iv = rand(12);
    return crypto.subtle
      .encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext))
      .then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; });
  }
  function decrypt(key, blob) {
    return crypto.subtle
      .decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct))
      .then(function (pt) { return dec.decode(pt); });
  }

  /* ---- storage helpers ----------------------------------------------------- */
  function load() {
    return new Promise(function (res) {
      chrome.storage.local.get(['vaultMeta', 'vaultCreds'], function (r) {
        res({ meta: r.vaultMeta || null, creds: r.vaultCreds || {} });
      });
    });
  }
  function save(meta, creds) {
    return new Promise(function (res) {
      chrome.storage.local.set({ vaultMeta: meta, vaultCreds: creds }, res);
    });
  }

  var VERIFIER_TEXT = 'YUKTI_VAULT_OK';

  /* ---- public API ---------------------------------------------------------- */
  var Vault = {
    /** Has the master password ever been set? */
    isInitialised: function () { return load().then(function (s) { return !!s.meta; }); },

    /** First-time setup: pick a master password. Returns the in-memory key. */
    initialise: function (masterPassword) {
      var salt = rand(16);
      return deriveKey(masterPassword, salt).then(function (key) {
        return encrypt(key, VERIFIER_TEXT).then(function (ver) {
          return save({ salt: b64(salt), verifier: ver }, {}).then(function () { return key; });
        });
      });
    },

    /** Unlock with the master password. Rejects if wrong. Returns the key. */
    unlock: function (masterPassword) {
      return load().then(function (s) {
        if (!s.meta) return Promise.reject(new Error('Vault not set up yet.'));
        return deriveKey(masterPassword, unb64(s.meta.salt)).then(function (key) {
          return decrypt(key, s.meta.verifier)
            .then(function (txt) {
              if (txt !== VERIFIER_TEXT) throw new Error('bad');
              return key;
            })
            .catch(function () { return Promise.reject(new Error('Wrong master password.')); });
        });
      });
    },

    /** List stored clients (no secrets) — [{pan,userId,label}]. */
    list: function () {
      return load().then(function (s) {
        return Object.keys(s.creds).map(function (pan) {
          return { pan: pan, userId: s.creds[pan].userId || pan, label: s.creds[pan].label || '' };
        });
      });
    },

    /** Add / update one client's portal credential (password encrypted at rest). */
    put: function (key, entry) {
      return load().then(function (s) {
        return encrypt(key, entry.password).then(function (pwdEnc) {
          s.creds[entry.pan] = {
            userId: entry.userId || entry.pan,
            label: entry.label || '',
            pwdEnc: pwdEnc
          };
          return save(s.meta, s.creds);
        });
      });
    },

    /** Decrypt one client's password for the instant of auto-fill. */
    reveal: function (key, pan) {
      return load().then(function (s) {
        var c = s.creds[pan];
        if (!c) return Promise.reject(new Error('No saved login for PAN ' + pan));
        return decrypt(key, c.pwdEnc).then(function (pwd) {
          return { userId: c.userId || pan, password: pwd };
        });
      });
    },

    remove: function (pan) {
      return load().then(function (s) { delete s.creds[pan]; return save(s.meta, s.creds); });
    }
  };

  root.Vault = Vault;
})(typeof self !== 'undefined' ? self : this);
