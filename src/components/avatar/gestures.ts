import type { GestureName } from './types';

/** An additive offset a gesture contributes on top of idle and expression. */
export interface GestureOffset {
  pitch: number;
  yaw: number;
  roll: number;
  x: number;
  y: number;
  z: number;
  /** extra eye height, 0 … 1 */
  eyeLift: number;
  /** extra glow gain */
  glow: number;
  gazeX: number;
  gazeY: number;
}

export const zeroOffset = (): GestureOffset => ({
  pitch: 0, yaw: 0, roll: 0, x: 0, y: 0, z: 0, eyeLift: 0, glow: 0, gazeX: 0, gazeY: 0,
});

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
/** a single soft hump, 0 → 1 → 0 across p ∈ [0, 1] */
const bump = (p: number) => Math.sin(Math.PI * clamp01(p));
/** rise over [0, a], hold, fall over [b, 1] */
const plateau = (p: number, a: number, b: number) =>
  p < a ? smooth(p / a) : p > b ? 1 - smooth((p - b) / (1 - b)) : 1;

interface GestureDef {
  duration: number;
  /** sample at local progress p ∈ [0, 1]; writes into `o` additively */
  sample(p: number, o: GestureOffset): void;
}

/* Signs follow three.js: +pitch tips the crown toward the viewer (a nod),
   +yaw turns the face to the viewer's right, +roll leans the crown left. */
export const GESTURES: Record<GestureName, GestureDef> = {
  nod: {
    duration: 0.62,
    sample(p, o) {
      o.pitch += bump(p) * 0.17;
      o.y -= bump(p) * 0.012;
    },
  },

  doubleNod: {
    duration: 1.0,
    sample(p, o) {
      // two humps, the second a little smaller — an emphatic "yes, yes"
      const first = p < 0.5;
      const local = first ? p / 0.5 : (p - 0.5) / 0.5;
      o.pitch += bump(local) * (first ? 0.15 : 0.11);
      o.y -= bump(local) * 0.01;
    },
  },

  shake: {
    duration: 0.82,
    sample(p, o) {
      // decaying side-to-side, 1.5 cycles
      o.yaw += Math.sin(p * Math.PI * 3) * (1 - p) * 0.24;
      o.roll += Math.sin(p * Math.PI * 3) * (1 - p) * 0.025;
    },
  },

  tilt: {
    duration: 0.95,
    sample(p, o) {
      o.roll += bump(p) * 0.2;
      o.x -= bump(p) * 0.02;
    },
  },

  leanIn: {
    duration: 0.85,
    sample(p, o) {
      const k = plateau(p, 0.35, 0.7);
      o.z += k * 0.1;
      o.pitch += k * 0.07;
      o.y -= k * 0.015;
    },
  },

  pullBack: {
    duration: 0.72,
    sample(p, o) {
      const k = plateau(p, 0.18, 0.62);
      o.z -= k * 0.12;
      o.pitch -= k * 0.09;
      o.y += k * 0.02;
    },
  },

  shrug: {
    duration: 0.95,
    sample(p, o) {
      const k = bump(p);
      o.y += k * 0.055;
      o.roll += Math.sin(p * Math.PI * 2) * k * 0.06;
      o.pitch -= k * 0.03;
    },
  },

  browFlash: {
    duration: 0.45,
    sample(p, o) {
      const k = bump(p);
      o.eyeLift += k;
      o.glow += k * 0.16;
      o.y += k * 0.016;
    },
  },

  glanceAway: {
    duration: 1.25,
    sample(p, o) {
      // look up-and-aside, hold, come back
      const k = plateau(p, 0.22, 0.72);
      o.gazeX += k * 0.78;
      o.gazeY += k * 0.34;
      o.yaw += k * 0.14;
      o.pitch -= k * 0.05;
    },
  },
};

export const GESTURE_NAMES = Object.keys(GESTURES) as GestureName[];
