import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const p = await b.newPage();
await p.goto('http://localhost:7777/tax-utilities/itr3.html', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1200);
const out = await p.evaluate(() => {
  const j = window.buildItr3Json().ITR.ITR3;
  const pick = k => j[k];
  return {
    Form: pick('Form_ITR3'), GEN1: pick('PartA_GEN1'), GEN2: pick('PartA_GEN2'),
    VER: pick('Verification'), TI: pick('PartB-TI')
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
