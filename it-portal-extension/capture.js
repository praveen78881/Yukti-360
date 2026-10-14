/* ===========================================================================
   capture.js — paste this into the browser DevTools Console (F12 → Console)
   while you are ON the live portal page you want to automate (logged in).

   It prints a compact list of the interactive controls + robust selectors for
   each, which lets the selectors in src/selectors.js be tuned to the real page.
   It reads the page only; it clicks nothing and sends nothing anywhere.
   =========================================================================== */
(function () {
  function sel(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    var a = ['formcontrolname', 'name', 'aria-label', 'placeholder', 'value', 'type'];
    for (var i = 0; i < a.length; i++) {
      var v = el.getAttribute(a[i]);
      if (v) return el.tagName.toLowerCase() + '[' + a[i] + '="' + v + '"]';
    }
    if (el.className && typeof el.className === 'string') return el.tagName.toLowerCase() + '.' + el.className.trim().split(/\s+/).join('.');
    return el.tagName.toLowerCase();
  }
  var nodes = document.querySelectorAll('input, select, button, a[role="button"], [role="combobox"], [type="checkbox"], [type="radio"]');
  var rows = [];
  nodes.forEach(function (el) {
    var label = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 40);
    rows.push({ tag: el.tagName.toLowerCase(), type: el.type || '', label: label, selector: sel(el) });
  });
  console.log('%cYukti capture — ' + location.href, 'font-weight:bold');
  console.table(rows);
  console.log('Copy the table (right-click → Copy) and send it back to tune selectors.js.');
  return rows;
})();
