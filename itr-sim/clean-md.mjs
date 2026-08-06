import fs from 'node:fs';
const dir = 'docs/itd-validation-rules';
const files = [
  'ITR-3_ValidationRules_AY2025-26_V1.0', 'ITR-3_ValidationRules_AY2026-27_V1.0',
  'ITR-5_ValidationRules_AY2026-27_V1.0',
  'ITR-6_ValidationRules_AY2025-26_V1.0', 'ITR-6_ValidationRules_AY2026-27_V1.0',
  'ITR-7_ValidationRules_AY2025-26_V1.0', 'ITR-7_ValidationRules_AY2026-27_V1.0',
].map((x) => `${dir}/${x}.md`);
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/�/g, '-');                       // corrupted dash/bullet glyph -> hyphen
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');  // strip control bytes (keep \t \n \r)
  fs.writeFileSync(f, s);
  const lines = s.split('\n').filter((x) => x.trim());
  console.log(f.split('/').pop().padEnd(42), 'clean; last:', JSON.stringify(lines[lines.length - 1].slice(0, 72)));
}
