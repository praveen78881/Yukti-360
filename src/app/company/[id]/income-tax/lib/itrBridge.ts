/* ─────────────────────────────────────────────────────────────────────────────
   Bridge into a Yukti form running in a same-origin iframe.

   The Yukti builds are classic (non-module) scripts, so their top-level
   `const S`, `paint`, `commit`, `importReturn` live in the frame's global
   LEXICAL environment — they are NOT properties of `window` and cannot be
   reached as `frame.contentWindow.S`. Everything here therefore goes through
   an indirect eval inside the frame.

   `S` is the form's own declared "working state", so snapshotting it captures
   the entire draft — including dynamically added grid rows — without the shell
   needing to know a single field name.
   ──────────────────────────────────────────────────────────────────────────── */

type Win = Window & { __caBridge?: unknown };

function frameWindow(frame: HTMLIFrameElement | null): Win | null {
  try { return (frame?.contentWindow as Win) ?? null; } catch { return null; }
}

/** Run an expression inside the frame's global scope. Returns undefined on failure. */
function evalIn<T>(frame: HTMLIFrameElement | null, expr: string): T | undefined {
  const win = frameWindow(frame);
  if (!win) return undefined;
  try {
    // indirect eval -> runs in global scope, so top-level const/let are visible
    const f = (win as unknown as { eval: (s: string) => unknown }).eval;
    return f.call(win, expr) as T;
  } catch { return undefined; }
}

/** True once the form has booted and its state object exists. */
export function isReady(frame: HTMLIFrameElement | null): boolean {
  return evalIn<boolean>(frame, 'typeof S !== "undefined" && !!S') === true;
}

/** The whole draft, as JSON. Null if the form has not booted. */
export function readState(frame: HTMLIFrameElement | null): string | null {
  return evalIn<string>(frame, 'JSON.stringify(S)') ?? null;
}

/**
 * Merge a saved draft back in and repaint. Top-level keys are replaced
 * wholesale (arrays and grids must not be deep-merged or rows would double).
 * Returns the number of top-level keys restored.
 */
export function writeState(frame: HTMLIFrameElement | null, json: string): number {
  const win = frameWindow(frame);
  if (!win) return 0;
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(json); } catch { return 0; }
  if (!parsed || typeof parsed !== 'object') return 0;
  win.__caBridge = parsed;
  const n = evalIn<number>(frame, `(function(){
    var d = window.__caBridge, n = 0;
    for (var k in d) { if (Object.prototype.hasOwnProperty.call(d, k)) { S[k] = d[k]; n++; } }
    delete window.__caBridge;
    try { if (typeof commit === 'function') commit(); } catch (e) {}
    try { if (typeof paint  === 'function') paint();  } catch (e) {}
    return n;
  })()`);
  return n ?? 0;
}

/**
 * Every `data-p` path the rendered form binds. This — not the keys currently
 * on `S` — is the authoritative list of paths a form supports: several forms
 * (ITR-2 most obviously) only materialise an identity key on first edit, so
 * probing `S` alone makes prefill silently skip them.
 */
export function boundPaths(frame: HTMLIFrameElement | null): Set<string> {
  const doc = frame?.contentDocument;
  if (!doc) return new Set();
  const out = new Set<string>();
  doc.querySelectorAll('[data-p]').forEach((el) => {
    const p = el.getAttribute('data-p');
    if (p) out.add(p);
  });
  return out;
}

/**
 * Set one dotted path inside S (e.g. "pi.pan"), creating intermediate objects
 * only where the form already declares the path in the DOM. Never overwrites a
 * value the CA has entered. Returns true if it landed.
 */
export function setPath(frame: HTMLIFrameElement | null, path: string, value: string): boolean {
  const win = frameWindow(frame);
  if (!win) return false;
  win.__caBridge = { path, value };
  return evalIn<boolean>(frame, `(function(){
    var a = window.__caBridge; delete window.__caBridge;
    var parts = a.path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    var leaf = parts[parts.length - 1];
    var cur = o[leaf];
    if (cur !== undefined && cur !== null && cur !== '' && cur !== 0) return false; // CA's value wins
    o[leaf] = a.value;
    return true;
  })()`) === true;
}

/** Which of these dotted roots exist on S (e.g. ['pi','who']). */
export function rootsPresent(frame: HTMLIFrameElement | null, roots: string[]): string[] {
  const win = frameWindow(frame);
  if (!win) return [];
  win.__caBridge = roots;
  return evalIn<string[]>(frame, `(function(){
    var r = window.__caBridge; delete window.__caBridge;
    return r.filter(function(k){ return S[k] && typeof S[k] === 'object'; });
  })()`) ?? [];
}

/** Keys available on a root object, so prefill can pick the right field names. */
export function keysOf(frame: HTMLIFrameElement | null, root: string): string[] {
  const win = frameWindow(frame);
  if (!win) return [];
  win.__caBridge = root;
  return evalIn<string[]>(frame, `(function(){
    var k = window.__caBridge; delete window.__caBridge;
    return (S[k] && typeof S[k] === 'object') ? Object.keys(S[k]) : [];
  })()`) ?? [];
}

/** Repaint after a batch of setPath calls. */
export function repaint(frame: HTMLIFrameElement | null): void {
  evalIn(frame, `(function(){
    try { if (typeof commit === 'function') commit(); } catch (e) {}
    try { if (typeof paint  === 'function') paint();  } catch (e) {}
  })()`);
}
