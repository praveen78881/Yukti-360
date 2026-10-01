import { useEffect, useRef, useState, type RefObject } from 'react';

/* ── The projector's hologram ─────────────────────────────────────────────
   A report captured from the books, projected from the visor: translucent
   dark glass tinted in the face's #38EFDC family, faint scanlines, a slow
   sheen, soft edge glow, a flicker on arrival, and a light-beam cone from the
   eyes. The report is inverted onto the glass so it reads as emitted light —
   white paper becomes the dark screen, ink becomes glowing text. */

export interface HoloSlide {
  id: string;
  title: string;
  status: 'capturing' | 'ready' | 'error';
  url?: string;
  error?: string;
}

const CSS = `
.yk-holo{position:relative;height:100%;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,rgba(7,30,38,.88),rgba(4,17,24,.92));
  border:1px solid rgba(56,239,220,.42);
  box-shadow:inset 0 0 0 1px rgba(56,239,220,.1),inset 0 0 38px rgba(56,239,220,.1),0 0 28px rgba(56,239,220,.28),0 26px 48px -24px rgba(24,44,70,.42);
  backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
  animation:yk-holo-flicker 620ms steps(1,end) both, yk-holo-rise 420ms cubic-bezier(.2,.8,.3,1) both}
.yk-holo::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:3;
  background:repeating-linear-gradient(0deg,rgba(56,239,220,.055) 0 1px,transparent 1px 3px)}
.yk-holo::after{content:'';position:absolute;left:0;right:0;height:22%;top:-22%;pointer-events:none;z-index:3;
  background:linear-gradient(180deg,transparent,rgba(56,239,220,.09),transparent);animation:yk-holo-sweep 4.6s linear infinite}
.yk-holo-head{position:relative;z-index:4;display:flex;align-items:center;gap:8px;padding:9px 10px 9px 14px;
  border-bottom:1px solid rgba(56,239,220,.22);background:linear-gradient(180deg,rgba(56,239,220,.1),transparent)}
.yk-holo-title{font-family:var(--font-display);font-weight:600;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8FF7EC;text-shadow:0 0 10px rgba(56,239,220,.6);white-space:nowrap}
.yk-holo-tab{font-family:var(--font-display);font-weight:600;font-size:10px;letter-spacing:.12em;text-transform:uppercase;height:26px;padding:0 11px;border-radius:999px;
  color:rgba(143,247,236,.72);border:1px solid rgba(56,239,220,.25);background:transparent;transition:background-color 160ms ease,color 160ms ease;white-space:nowrap}
.yk-holo-tab:hover{color:#CFFCF7;background:rgba(56,239,220,.1)}
.yk-holo-tab[aria-selected=true]{color:#041318;background:#38EFDC;border-color:#38EFDC;box-shadow:0 0 14px rgba(56,239,220,.55)}
.yk-holo-close{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;flex-shrink:0;
  color:#8FF7EC;border:1px solid rgba(56,239,220,.3);background:rgba(56,239,220,.06);transition:background-color 160ms ease}
.yk-holo-close:hover{background:rgba(56,239,220,.18)}
.yk-holo-close:focus-visible,.yk-holo-tab:focus-visible{outline:2px solid #38EFDC;outline-offset:2px}
.yk-holo-body{position:relative;z-index:2;flex:1;min-height:0;overflow:auto;padding:10px 12px 14px;scrollbar-color:rgba(56,239,220,.4) transparent}
.yk-holo-img{display:block;width:100%;height:auto;border-radius:6px;
  filter:invert(1) hue-rotate(180deg) saturate(.3) sepia(.42) hue-rotate(122deg) saturate(2.4) brightness(1.1) contrast(1.06);
  mix-blend-mode:screen;opacity:.96}
.yk-holo-status{height:100%;min-height:160px;display:grid;place-items:center;text-align:center;color:#8FF7EC;font-size:12.5px;letter-spacing:.04em}
.yk-holo-scan{width:62%;height:2px;margin:12px auto 0;background:linear-gradient(90deg,transparent,#38EFDC,transparent);animation:yk-holo-scan 1.1s ease-in-out infinite alternate;box-shadow:0 0 12px #38EFDC}
.yk-beam{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:visible;animation:yk-beam-hum 2.8s ease-in-out infinite}
@keyframes yk-holo-flicker{0%{opacity:0}8%{opacity:.75}14%{opacity:.12}22%{opacity:.9}30%{opacity:.35}42%{opacity:1}100%{opacity:1}}
@keyframes yk-holo-rise{from{transform:translateY(10px)}to{transform:none}}
@keyframes yk-holo-sweep{from{top:-22%}to{top:100%}}
@keyframes yk-holo-scan{from{transform:translateX(-18%)}to{transform:translateX(18%)}}
@keyframes yk-beam-hum{0%,100%{opacity:.9}50%{opacity:.72}}
@media (prefers-reduced-motion: reduce){.yk-holo,.yk-holo::after,.yk-holo-scan,.yk-beam{animation:none!important}}
`;

export function HoloStyles() {
  return <style>{CSS}</style>;
}

interface HologramProps {
  slides: HoloSlide[];
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
}

export function Hologram({ slides, onClose, panelRef }: HologramProps) {
  const [active, setActive] = useState(0);
  const idx = Math.min(active, slides.length - 1);
  const slide = slides[idx];

  // a new projection starts on its first slide
  const firstId = slides[0]?.id;
  useEffect(() => { setActive(0); }, [firstId]);

  // Escape closes the projection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!slide) return null;

  return (
    <div ref={panelRef} className="yk-holo" role="dialog" aria-label={`Projection: ${slides.map((s) => s.title).join(', ')}`}>
      <div className="yk-holo-head">
        {slides.length === 1 ? (
          <span className="yk-holo-title">{slide.title}</span>
        ) : (
          <div role="tablist" aria-label="Projected reports" style={{ display: 'flex', gap: 6, overflowX: 'auto', minWidth: 0 }}>
            {slides.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={i === idx} className="yk-holo-tab" onClick={() => setActive(i)}>
                {s.title}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="yk-holo-close" onClick={onClose} aria-label="Close projection" title="Close (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="yk-holo-body">
        {slide.status === 'ready' && slide.url ? (
          <img key={slide.id} className="yk-holo-img" src={slide.url} alt={slide.title} draggable={false} />
        ) : slide.status === 'error' ? (
          <div className="yk-holo-status"><div>Couldn&rsquo;t project {slide.title}.<br /><span style={{ opacity: 0.7 }}>{slide.error}</span></div></div>
        ) : (
          <div className="yk-holo-status"><div>Projecting {slide.title}&hellip;<div className="yk-holo-scan" /></div></div>
        )}
      </div>
    </div>
  );
}

/* ── the beam ──────────────────────────────────────────────────────────────
   A cone from the eyes to the panel's near edge, redrawn every frame so it
   stays attached while the orb floats and turns. Written straight to the SVG
   attributes — no React state, no re-render per frame. */

interface BeamProps {
  /** the element both ends are measured against */
  stageRef: RefObject<HTMLElement | null>;
  /** eye position in stage pixels, or null when unknown */
  getOrigin: () => { x: number; y: number } | null;
  panelRef: RefObject<HTMLElement | null>;
}

export function ProjectorBeam({ stageRef, getOrigin, panelRef }: BeamProps) {
  const cone = useRef<SVGPolygonElement>(null);
  const core = useRef<SVGPolygonElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const stage = stageRef.current, panel = panelRef.current, o = getOrigin();
      if (!stage || !panel || !o || !cone.current || !core.current || !grad.current) return;
      const s = stage.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      // the beam lands on whichever panel edge faces the eyes
      const below = o.y > p.bottom - s.top;
      const edgeY = below ? p.bottom - s.top - 2 : p.top - s.top + 2;
      const l = p.left - s.left + 18, r = p.right - s.left - 18;
      const mid = (l + r) / 2;
      cone.current.setAttribute('points', `${o.x - 6},${o.y} ${o.x + 6},${o.y} ${r},${edgeY} ${l},${edgeY}`);
      const cl = mid - (r - l) * 0.18, cr = mid + (r - l) * 0.18;
      core.current.setAttribute('points', `${o.x - 2},${o.y} ${o.x + 2},${o.y} ${cr},${edgeY} ${cl},${edgeY}`);
      grad.current.setAttribute('x1', String(o.x));
      grad.current.setAttribute('y1', String(o.y));
      grad.current.setAttribute('x2', String(mid));
      grad.current.setAttribute('y2', String(edgeY));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stageRef, panelRef, getOrigin]);

  return (
    <svg className="yk-beam" aria-hidden>
      <defs>
        <linearGradient id="yk-beam-grad" ref={grad} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38EFDC" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="#38EFDC" stopOpacity="0.18" />
          <stop offset="1" stopColor="#38EFDC" stopOpacity="0.06" />
        </linearGradient>
        <filter id="yk-beam-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <polygon ref={cone} fill="url(#yk-beam-grad)" filter="url(#yk-beam-soft)" />
      <polygon ref={core} fill="url(#yk-beam-grad)" opacity="0.8" />
    </svg>
  );
}
