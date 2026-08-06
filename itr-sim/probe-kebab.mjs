// Verify the drill-in ⋮ transform: load a tool, apply kebabifyDrillins-equivalent,
// open a drill-in, confirm the ⋮ toggle appears, the menu opens, and the moved
// "Done" button still closes the subform (listeners preserved).
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:7777/tax-utilities/itr1.html', { waitUntil: 'load', timeout: 40000 });
await p.waitForTimeout(500);

// Inject the same transform the shell runs (mirrors kebabifyDrillins).
await p.evaluate(() => {
  const d = document;
  const st = d.createElement('style'); st.id = '__itr_kebab_style';
  st.textContent = '.__kb-menu{position:absolute;right:0;top:32px;background:#fff;border:1px solid #ccc;padding:4px;display:none;}.__kb-menu.open{display:block;}';
  d.head.appendChild(st);
  const process = () => d.querySelectorAll('.sf-actions:not(.__kb)').forEach((act) => {
    const btns = Array.from(act.querySelectorAll('button, .sf-btn'));
    if (!btns.length) return;
    act.classList.add('__kb');
    const menu = d.createElement('div'); menu.className = '__kb-menu';
    btns.forEach((x) => menu.appendChild(x));
    menu.addEventListener('click', () => menu.classList.remove('open'));
    const tog = d.createElement('button'); tog.type = 'button'; tog.className = '__kb-toggle'; tog.textContent = '⋮';
    tog.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    act.appendChild(tog); act.appendChild(menu);
  });
  process();
});

// Open a drill-in (the assessee master), then exercise the ⋮.
const out = await p.evaluate(() => {
  const trigger = document.querySelector('[data-sf="sf-assessee"]');
  if (trigger) trigger.click();
  const sf = document.getElementById('sf-assessee');
  const vis = () => sf && getComputedStyle(sf).display !== 'none' && sf.offsetParent !== null;
  const openedBefore = !!vis();
  const act = sf && sf.querySelector('.sf-actions');
  const tog = act && act.querySelector('.__kb-toggle');
  const menu = act && act.querySelector('.__kb-menu');
  const doneBtn = menu && menu.querySelector('[data-close]');
  // open the ⋮ menu
  if (tog) tog.click();
  const menuOpen = !!(menu && menu.classList.contains('open'));
  // click Done → should close the subform (moved listener preserved)
  if (doneBtn) doneBtn.click();
  const closedAfter = !vis();
  return { openedBefore, hasToggle: !!tog, hasMenu: !!menu, hasDoneInMenu: !!doneBtn, menuOpen, closedAfter };
});
console.log(JSON.stringify({ ...out, pageErrors: errs.slice(0, 3) }, null, 1));
await b.close();
