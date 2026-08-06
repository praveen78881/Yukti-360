/**
 * Sandbox GST — live connectivity smoke test (TEST environment).
 *
 * Reads .env, authenticates against the configured host, then does a public
 * GSTIN search. Run it the moment SANDBOX_API_SECRET is filled in:
 *
 *   node scripts/sandbox-smoke.mjs [GSTIN]
 *
 * With no secret set it prints exactly what's missing (proving the rest of the
 * pipeline is wired correctly). It touches NO taxpayer data — only /authenticate
 * and the public GSTIN lookup.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getConfigFromEnv, handleAction } from '../netlify/functions/_shared/sandboxCore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

const env = {};
try {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.error('Could not read .env at', envPath);
  process.exit(1);
}

const cfg = getConfigFromEnv(env);
const mask = (v) => (v ? v.slice(0, 9) + '…' : '(MISSING)');
console.log('── Sandbox smoke test ──');
console.log(`host   : ${cfg.host}`);
console.log(`key    : ${mask(cfg.apiKey)}`);
console.log(`secret : ${cfg.apiSecret ? 'set' : '(MISSING — add SANDBOX_API_SECRET to .env)'}`);
console.log(`version: ${cfg.version}`);

const gstin = process.argv[2] || '33ABKCS2033B1ZW'; // docs sample; pass your own test GSTIN

const run = async () => {
  console.log('\n1) status (authenticate)…');
  try {
    const s = await handleAction('status', {}, cfg);
    console.log('   →', s.status, JSON.stringify(s.data));
  } catch (e) {
    console.log('   ✗', e.statusCode || '', e.message);
    console.log('\nStopping — cannot authenticate. Fix the credentials above and re-run.');
    return;
  }

  console.log(`\n2) gstinSearch ${gstin}…`);
  try {
    const r = await handleAction('gstinSearch', { gstin }, cfg);
    const d = r.data?.data?.data || r.data?.data || r.data;
    console.log('   →', r.status);
    if (d?.lgnm || d?.tradeNam) {
      console.log('   ✓', d.tradeNam || d.lgnm, '·', d.sts, '·', d.dty || '');
    } else {
      console.log('   ', JSON.stringify(r.data).slice(0, 400));
    }
  } catch (e) {
    console.log('   ✗', e.statusCode || '', e.message);
  }
  console.log('\nDone.');
};

run();
