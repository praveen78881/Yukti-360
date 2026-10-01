/* ── Report capture for the projector ─────────────────────────────────────
   Renders a company route in a hidden same-origin iframe, waits until the
   report has actually drawn and stopped changing, captures the page content
   with html2canvas-pro (lazy — it is only fetched the first time something is
   projected) and hands back an object URL. Nothing is persisted: the caller
   owns the URL and must revoke it when the projection closes. */

const FRAME_W = 1280;
const FRAME_H = 1600;
/** Tall reports are cut here — the hologram scrolls, but a 10,000px ledger is a memory hazard. */
const MAX_CAPTURE_H = 2600;

export interface CapturedImage {
  url: string;
  width: number;
  height: number;
}

export async function captureCompanyRoute(companyId: string, path: string, signal?: AbortSignal): Promise<CapturedImage> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // Off-screen but laid out: html2canvas needs real layout, so no display:none.
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-30000px',
    top: '0',
    width: `${FRAME_W}px`,
    height: `${FRAME_H}px`,
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  frame.src = `/company/${encodeURIComponent(companyId)}/${path}`;
  document.body.appendChild(frame);

  try {
    await waitForLoad(frame, 25000, signal);
    const doc = frame.contentDocument;
    if (!doc) throw new Error('Report frame is not same-origin');
    const target = await waitForReport(doc, 20000, signal);

    const { default: html2canvas } = await import('html2canvas-pro');
    throwIfAborted(signal);
    const height = Math.min(target.scrollHeight, MAX_CAPTURE_H);
    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
      useCORS: true,
      windowWidth: FRAME_W,
      windowHeight: FRAME_H,
      height,
    });
    throwIfAborted(signal);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    const out = { width: canvas.width, height: canvas.height };
    canvas.width = canvas.height = 0; // release the bitmap now, not at GC
    if (!blob) throw new Error('Capture produced no image');
    return { url: URL.createObjectURL(blob), ...out };
  } finally {
    frame.remove();
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Projection closed', 'AbortError');
}

function waitForLoad(frame: HTMLIFrameElement, timeout: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Report took too long to open')), timeout);
    const done = () => { window.clearTimeout(timer); resolve(); };
    frame.addEventListener('load', done, { once: true });
    signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Projection closed', 'AbortError')); }, { once: true });
  });
}

/** The report is ready when the page content exists, no loader is spinning,
    and its height has held still for a few polls (tables fill in async). */
async function waitForReport(doc: Document, timeout: number, signal?: AbortSignal): Promise<HTMLElement> {
  const start = performance.now();
  let lastH = -1;
  let stable = 0;
  while (performance.now() - start < timeout) {
    throwIfAborted(signal);
    const main = doc.querySelector('main');
    const content = (main?.firstElementChild as HTMLElement | null) ?? null;
    if (content) {
      const spinning = main!.querySelector('.animate-spin, .animate-pulse');
      const substantial = !!content.querySelector('table, .panel, .page-card, h1') || (content.innerText?.length ?? 0) > 120;
      const h = content.scrollHeight;
      if (!spinning && substantial && h > 80) {
        stable = h === lastH ? stable + 1 : 0;
        lastH = h;
        if (stable >= 3) return content;
      }
    }
    await new Promise((r) => setTimeout(r, 160));
  }
  const fallback = doc.querySelector('main')?.firstElementChild as HTMLElement | null;
  if (fallback) return fallback;
  throw new Error('The report never finished rendering');
}
