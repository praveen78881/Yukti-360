/* Number inputs change ONLY by typing (user request, 2026-09-27).
 *
 * Browsers step a focused <input type="number"> up/down on the mouse wheel and
 * on ↑/↓ — so scrolling a page while an amount field has focus silently edits
 * the amount. This guard, installed once at startup, cancels that stepping app-
 * wide. The page still scrolls normally when the wheel moves over the field,
 * and any page-level key handlers still receive ↑/↓ (only the stepping is
 * prevented, not the event). */

function isFocusedNumberInput(t: EventTarget | null): t is HTMLInputElement {
  return t instanceof HTMLInputElement && t.type === 'number' && document.activeElement === t;
}

function scrollableAncestor(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const { overflowY, overflowX } = getComputedStyle(n);
    const canY = /(auto|scroll|overlay)/.test(overflowY) && n.scrollHeight > n.clientHeight;
    const canX = /(auto|scroll|overlay)/.test(overflowX) && n.scrollWidth > n.clientWidth;
    if (canY || canX) return n;
  }
  return (document.scrollingElement as HTMLElement | null) ?? null;
}

let installed = false;

export function installNumberInputGuard(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener(
    'wheel',
    (e) => {
      if (!isFocusedNumberInput(e.target)) return;
      e.preventDefault();
      // Keep scrolling whatever the field sits in, as if the field weren't there.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      scrollableAncestor(e.target)?.scrollBy({ top: e.deltaY * unit, left: e.deltaX * unit });
    },
    { passive: false, capture: true },
  );

  window.addEventListener(
    'keydown',
    (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isFocusedNumberInput(e.target)) {
        e.preventDefault();
      }
    },
    true,
  );
}
