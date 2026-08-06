// Resolve an ITD ITR JSON-Schema into a flat leaf list. Handles $ref (local
// #/definitions/*), objects, arrays-of-objects, enums, and ref cycles.
// Usage: node resolve-schema.mjs "<schema.json>" <FormKey e.g. ITR1> [--counts]
import fs from 'node:fs';

const [, , file, formKey, flag] = process.argv;
if (!file || !formKey) { console.error('usage: node resolve-schema.mjs <schema.json> <FormKey> [--counts]'); process.exit(1); }
const o = JSON.parse(fs.readFileSync(file, 'utf8'));
const defs = o.definitions || {};

const leaves = [];
function walk(node, path, required, refStack) {
  if (node && node.$ref) {
    const name = node.$ref.split('/').pop();
    if (refStack.includes(name)) { leaves.push({ path, type: 'ref-cycle:' + name, required }); return; }
    node = defs[name] || {};
    refStack = [...refStack, name];
  }
  if (!node || typeof node !== 'object') { leaves.push({ path, type: 'any', required }); return; }

  const props = node.properties;
  if (props || node.type === 'object') {
    const reqSet = new Set(node.required || []);
    const keys = Object.keys(props || {});
    if (keys.length === 0) { leaves.push({ path, type: 'object(open)', required }); return; }
    for (const k of keys) walk(props[k], path ? path + '.' + k : k, reqSet.has(k), refStack);
    return;
  }
  if (node.type === 'array') {
    let it = node.items || {};
    if (it.$ref) { const name = it.$ref.split('/').pop(); if (!refStack.includes(name)) { it = defs[name] || {}; refStack = [...refStack, name]; } }
    if (it && it.properties) {
      const reqSet = new Set(it.required || []);
      for (const k of Object.keys(it.properties)) walk(it.properties[k], path + '[].' + k, reqSet.has(k), refStack);
    } else { leaves.push({ path: path + '[]', type: 'array<' + (it.type || 'any') + '>', required }); }
    return;
  }
  leaves.push({ path, type: node.enum ? 'enum(' + node.enum.slice(0, 6).join('|') + ')' : (node.type || 'any'), required });
}

walk({ $ref: '#/definitions/' + formKey }, formKey, true, []);

if (flag === '--counts') {
  const bySched = {}; const reqBySched = {};
  for (const l of leaves) { const s = l.path.split('.')[1] || '(root)'; bySched[s] = (bySched[s] || 0) + 1; if (l.required) reqBySched[s] = (reqBySched[s] || 0) + 1; }
  const rows = Object.keys(bySched).sort().map(s => `${String(bySched[s]).padStart(5)}  ${String(reqBySched[s] || 0).padStart(4)}req  ${s}`);
  console.log(`FORM ${formKey}  schedules=${Object.keys(bySched).length}  leaves=${leaves.length}  required=${leaves.filter(l => l.required).length}`);
  console.log('LEAVES  REQ   SCHEDULE');
  console.log(rows.join('\n'));
} else {
  for (const l of leaves) console.log(`${l.required ? 'R' : ' '} | ${l.type.padEnd(22)} | ${l.path}`);
  console.error(`(${leaves.length} leaves, ${leaves.filter(l => l.required).length} required)`);
}
