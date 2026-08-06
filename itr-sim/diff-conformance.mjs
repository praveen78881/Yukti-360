// Deterministic schema-vs-emitted diff. For each (form, ay) reads the resolved
// schema tree (trees/tree-FORM-AY.txt) + our emitted paths (emitted/TOOL.txt),
// normalizes, and classifies every schema leaf: OK (emitted non-zero) / ZERO
// (emitted but 0/empty) / MISS (not emitted). Focus metric = % of REQUIRED leaves
// that are OK. Writes diff/diff-FORM-AY.txt + prints a summary table.
import fs from 'node:fs';

const BASE = 'docs/itr-schema-conformance/real';
fs.mkdirSync(`${BASE}/diff`, { recursive: true });

// form, ay, emitted-tool-file, ayMatch(false => our tool is a different AY build)
const JOBS = [
  ['ITR1', '2026', 'itr1', true], ['ITR1', '2025', 'itr1-2025-26', true],
  ['ITR2', '2026', 'itr2', true], ['ITR2', '2025', 'itr2-2025-26', true],
  ['ITR3', '2026', 'itr3', true], ['ITR3', '2025', 'itr3-2025-26', true],
  ['ITR4', '2026', 'itr4', true], ['ITR4', '2025', 'itr4-2025-26', true],
  ['ITR5', '2026', 'itr5', true], ['ITR5', '2025', 'itr5', false],
  ['ITR6', '2025', 'itr6', false],
  ['ITR7', '2026', 'itr7', true], ['ITR7', '2025', 'itr7', false],
];

const norm = (p) => p.replace(/\[\]/g, '').toLowerCase();

function readTree(f) {
  const out = [];
  for (const ln of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = ln.match(/^([R ]) \| .+? \| (.+)$/);
    if (m) out.push({ required: m[1] === 'R', path: m[2] });
  }
  return out;
}
function readEmitted(f) {
  const zero = new Set(), all = new Set();
  const txt = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  for (const ln of txt.split('\n')) {
    if (!ln || ln[0] === '#') continue;
    const isZero = ln[0] === 'Z';
    const path = ln.slice(2);
    if (!path) continue;
    all.add(norm(path));
    if (isZero) zero.add(norm(path));
  }
  return { all, zero, failed: txt.includes('EMIT FAILED') };
}

const table = [];
for (const [form, ay, tool, ayMatch] of JOBS) {
  const treeF = `${BASE}/trees/tree-${form}-${ay}.txt`;
  const emitF = `${BASE}/emitted/${tool}.txt`;
  if (!fs.existsSync(treeF)) continue;
  const tree = readTree(treeF);
  const em = readEmitted(emitF);
  const bySched = {};
  const miss = [];
  let ok = 0, zero = 0, missc = 0, reqOk = 0, reqZero = 0, reqMiss = 0;
  for (const leaf of tree) {
    const n = norm(leaf.path);
    const nonzero = em.all.has(n) && !em.zero.has(n);
    const present = em.all.has(n);
    let cls;
    if (nonzero) { cls = 'OK'; ok++; if (leaf.required) reqOk++; }
    else if (present) { cls = 'ZERO'; zero++; if (leaf.required) reqZero++; }
    else { cls = 'MISS'; missc++; if (leaf.required) { reqMiss++; miss.push(leaf.path); } }
    const s = leaf.path.split('.')[1] || '(root)';
    bySched[s] = bySched[s] || { total: 0, ok: 0, zero: 0, miss: 0, req: 0, reqMiss: 0 };
    bySched[s].total++; if (cls === 'OK') bySched[s].ok++; else if (cls === 'ZERO') bySched[s].zero++; else bySched[s].miss++;
    if (leaf.required) { bySched[s].req++; if (cls === 'MISS') bySched[s].reqMiss++; }
  }
  const req = tree.filter((l) => l.required).length;
  const pctReq = req ? (100 * reqOk / req).toFixed(1) : 'n/a';
  const missByS = {}; miss.forEach((p) => { const s = p.split('.')[1] || '(root)'; (missByS[s] = missByS[s] || []).push(p); });
  const schedRows = Object.keys(bySched).sort().map((s) => {
    const c = bySched[s];
    return `  ${s.padEnd(28)} total ${String(c.total).padStart(4)} | OK ${String(c.ok).padStart(4)} ZERO ${String(c.zero).padStart(4)} MISS ${String(c.miss).padStart(4)} | req ${String(c.req).padStart(4)} reqMISS ${String(c.reqMiss).padStart(4)}`;
  });
  const body = [
    `# ${form} AY${ay === '2026' ? '2026-27' : '2025-26'}  (emitted tool: ${tool}${ayMatch ? '' : '  ⚠ AY-MISMATCH: our tool is a different-AY build — structural proxy only'})`,
    `schema leaves ${tree.length} | required ${req} | emitted-present ${ok + zero} | OK(non-zero) ${ok} | ZERO ${zero} | MISS ${missc}`,
    `REQUIRED: ${req} | reqOK ${reqOk} | reqZERO ${reqZero} | reqMISS ${reqMiss} | %required-fillable ${pctReq}%`,
    em.failed ? '!! emitted probe FAILED for this tool — treat emitted as empty' : '',
    '',
    '## Per-schedule',
    ...schedRows,
    '',
    '## REQUIRED leaves MISSING (filing blockers), grouped by schedule',
    ...Object.keys(missByS).sort().flatMap((s) => [`### ${s}  (${missByS[s].length})`, ...missByS[s].map((p) => '  ' + p)]),
  ].join('\n');
  fs.writeFileSync(`${BASE}/diff/diff-${form}-${ay}.txt`, body);
  table.push(`${form} AY${ay}  leaves ${String(tree.length).padStart(4)} req ${String(req).padStart(4)}  reqOK ${String(reqOk).padStart(4)}  %reqFill ${String(pctReq).padStart(5)}%  ${ayMatch ? '' : '(AYmismatch)'}`);
}
console.log(table.join('\n'));
