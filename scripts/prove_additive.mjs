// Bundles scripts/prove_additive.ts (resolving the '@' alias to ./src) and runs it.
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const root = path.resolve(process.cwd());
const outfile = path.join(os.tmpdir(), `ca_verify_${Date.now()}.mjs`);

// Minimal browser stubs for modules that reference them at import time.
const shim = `
globalThis.localStorage = globalThis.localStorage || {
  _s: new Map(),
  getItem(k){ return this._s.has(k) ? this._s.get(k) : null; },
  setItem(k,v){ this._s.set(k, String(v)); },
  removeItem(k){ this._s.delete(k); },
};
globalThis.window = globalThis.window || undefined;
if (!globalThis.crypto) globalThis.crypto = { randomUUID: () => 'id-' + Math.random().toString(36).slice(2) };
`;

await build({
  entryPoints: [path.join(root, 'scripts', 'prove_additive.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  banner: { js: shim },
  alias: { '@': path.join(root, 'src') },
  define: {
    'import.meta.env.DEV': 'false',
    'import.meta.env.VITE_SUPABASE_URL': '""',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
    'import.meta.env.VITE_GEMINI_MODEL': '""',
  },
  logLevel: 'warning',
});

await import(pathToFileURL(outfile).href);
fs.rmSync(outfile, { force: true });
