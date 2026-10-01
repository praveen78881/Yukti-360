import type { FaceFrame } from './types';

/* ── The face is drawn, not modelled ────────────────────────────────────────
   A 1000 × 600 canvas mapped onto a curved patch of the visor with additive
   blending: the transparent areas vanish and the drawn shapes are genuinely
   emissive. Repainting a canvas this size is not free, so the painter keys
   every frame on its quantised parameters and skips the draw when nothing
   visible changed. */

export const FACE_W = 1000;
export const FACE_H = 600;

const EYE_Y = 248;
const EYE_DX = 186;
const EYE_W = 132;
const EYE_H = 150;
const MOUTH_Y = 448;
const MOUTH_W = 132;

/** How far the eyes travel at gaze ±1, in canvas pixels. The mouth follows at 35%. */
const GAZE_X_PX = 60;
const GAZE_Y_PX = 44;
/** A closed eye still reads as a line, never disappears. */
const MIN_EYE_H = 11;

const q = (v: number, step: number) => Math.round(v / step);

function faceKey(f: FaceFrame): string {
  return [
    f.eyeShape,
    q(f.eyeOpen, 0.02),
    q(f.eyeScaleX, 0.004),
    q(f.eyeScaleY, 0.004),
    q(f.eyeTilt, 0.003),
    q(f.eyeLift, 0.02),
    q(f.gazeX, 0.012),
    q(f.gazeY, 0.012),
    q(f.mouthCurve, 0.01),
    q(f.mouthWidth, 0.006),
    q(f.mouthOpen, 0.01),
    f.glow,
  ].join('|');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export class FacePainter {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  /* Halo buffers. Blur is the expensive part of a glow and a halo is soft by
     nature, so it is drawn at a fraction of the resolution and scaled up —
     16× / 4× fewer pixels to blur, no visible difference. */
  private readonly haloWide = makeLayer(FACE_W / 4, FACE_H / 4);
  private readonly haloTight = makeLayer(FACE_W / 2, FACE_H / 2);
  /** the context the shape helpers draw into (swapped per pass) */
  private dc: CanvasRenderingContext2D;
  private lastKey = '';

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = FACE_W;
    this.canvas.height = FACE_H;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.dc = ctx;
  }

  /** Paints the frame if anything visible changed. Returns true when it repainted. */
  paint(f: FaceFrame): boolean {
    const key = faceKey(f);
    if (key === this.lastKey) return false;
    this.lastKey = key;

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, FACE_W, FACE_H);

    const [r, g, b] = hexToRgb(f.glow);
    const glow = (a: number) => `rgba(${r},${g},${b},${a})`;
    // the hot core leans toward white so the centre of each stroke reads lit
    const w = (c: number) => Math.round(c + (255 - c) * 0.55);
    const core = `rgba(${w(r)},${w(g)},${w(b)},0.55)`;

    // 1 · wide soft halo — quarter resolution
    this.pass(this.haloWide, 0.25, 12, glow(0.85), glow(0.32), f);
    // 2 · tight glow around the shape — half resolution
    this.pass(this.haloTight, 0.5, 7, glow(0.9), glow(1), f);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.haloWide.canvas, 0, 0, FACE_W, FACE_H);
    ctx.drawImage(this.haloTight.canvas, 0, 0, FACE_W, FACE_H);
    // 3 · crisp shape, then a white-hot core added on top — full resolution
    ctx.globalCompositeOperation = 'source-over';
    this.dc = ctx;
    ctx.shadowBlur = 0;
    ctx.fillStyle = ctx.strokeStyle = glow(1);
    this.eyes(f);
    this.mouth(f);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = ctx.strokeStyle = core;
    this.eyes(f);
    this.mouth(f);
    ctx.globalCompositeOperation = 'source-over';
    return true;
  }

  /** draw the face into a reduced-resolution layer with a blurred shadow */
  private pass(layer: CanvasRenderingContext2D, scale: number, blur: number, shadow: string, fill: string, f: FaceFrame) {
    layer.setTransform(1, 0, 0, 1, 0, 0);
    layer.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.setTransform(scale, 0, 0, scale, 0, 0);
    layer.shadowColor = shadow;
    layer.shadowBlur = blur;
    layer.fillStyle = layer.strokeStyle = fill;
    this.dc = layer;
    this.eyes(f);
    this.mouth(f);
    layer.shadowBlur = 0;
  }

  /* ── eyes ── */
  private eyes(f: FaceFrame) {
    const gx = f.gazeX * GAZE_X_PX;
    const gy = -f.gazeY * GAZE_Y_PX;
    const w = EYE_W * f.eyeScaleX;
    const h = EYE_H * f.eyeScaleY * (1 + f.eyeLift * 0.14);
    const lift = f.eyeLift * 10;
    for (const side of [-1, 1] as const) {
      const cx = FACE_W / 2 + side * EYE_DX + gx;
      const cy = EYE_Y + gy - lift;
      // mirrored tilt: +tilt drops the inner corners (canvas y points down,
      // so the left eye turns clockwise and the right eye counter-clockwise)
      const tilt = side === -1 ? f.eyeTilt : -f.eyeTilt;
      this.eye(f.eyeShape, cx, cy, w, h, f.eyeOpen, tilt);
    }
  }

  private eye(shape: FaceFrame['eyeShape'], cx: number, cy: number, w: number, h: number, open: number, tilt: number) {
    const ctx = this.dc;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.beginPath();

    if (shape === 'arc') {
      // a happy upturned curve; a blink flattens it to a line
      const sw = MIN_EYE_H + (30 - MIN_EYE_H) * open;
      const rise = h * 0.3 * open;
      const half = w / 2 - sw / 2;
      ctx.lineCap = 'round';
      ctx.lineWidth = sw;
      ctx.moveTo(-half, rise * 0.45);
      ctx.quadraticCurveTo(0, -rise * 1.35, half, rise * 0.45);
      ctx.stroke();
    } else if (shape === 'round') {
      const ry = Math.max(MIN_EYE_H / 2, (h / 2) * 0.9 * open);
      ctx.ellipse(0, 0, w / 2, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // slab — a rounded rectangle
      const eh = Math.max(MIN_EYE_H, h * open);
      const rad = Math.min(w, eh) * 0.34;
      roundRect(ctx, -w / 2, -eh / 2, w, eh, rad);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ── mouth: a lens between two quadratic lips. Closed, it is a curved
        line; open, it parts into a vowel. ── */
  private mouth(f: FaceFrame) {
    const ctx = this.dc;
    const cx = FACE_W / 2 + f.gazeX * GAZE_X_PX * 0.35;
    const cy = MOUTH_Y - f.gazeY * GAZE_Y_PX * 0.35;
    const w = MOUTH_W * f.mouthWidth;
    const c = f.mouthCurve;
    const o = Math.max(0, f.mouthOpen);

    const endY = cy - c * 12;
    const upperCtrl = cy + c * 52 - o * 28;
    const lowerCtrl = cy + c * 52 + 20 + o * 128;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, endY);
    ctx.quadraticCurveTo(cx, upperCtrl, cx + w / 2, endY);
    ctx.quadraticCurveTo(cx, lowerCtrl, cx - w / 2, endY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function makeLayer(w: number, h: number): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return ctx;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
