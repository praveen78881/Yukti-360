// Permanent schema/regression gate. Runs every GSTR-1 wire-shape harness and
// FAILS the build if any deviates. Wired as `prebuild` so `npm run build`
// cannot ship a builder/model change that breaks the frozen template contract.
//
//   • verify_shape       — emitted JSON shape for the changed sections
//   • verify_validator   — broken-variants suite (each must be a BLOCKER)
//   • verify_template_diff — ZERO structural deviation vs GSTR1-SAVE-TEMPLATE.json (293/293)
//   • verify_sparse       — sparse-filing emit is GSTN-clean (no empty arrays / ghost rows / dropped zero-fields / dup b2cs) + gate blocks a dirty body
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const runners = ['verify_shape.mjs', 'verify_validator.mjs', 'verify_template_diff.mjs', 'verify_sparse.mjs'];
let failed = 0;

for (const r of runners) {
  console.log(`\n──────── ${r} ────────`);
  const res = spawnSync(process.execPath, [path.join('scripts', r)], { stdio: 'inherit' });
  if (res.status !== 0) { failed++; console.log(`  ✗ ${r} FAILED (exit ${res.status})`); }
}

if (failed) {
  console.log(`\n❌ verify_all: ${failed} harness(es) failed — build blocked.\n`);
  process.exit(1);
}
console.log('\n✅ verify_all: all schema harnesses passed — template contract intact.\n');
