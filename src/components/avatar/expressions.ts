import type { ExpressionName, ExpressionPose } from './types';

/** Default glow — a clean teal that reads as "on" against the matte visor. */
export const DEFAULT_GLOW = '#38EFDC';

/** Seconds to blend from one expression pose to the next. */
export const EXPRESSION_BLEND = 0.4;

const base: ExpressionPose = {
  eyeShape: 'slab',
  eyeScaleX: 1,
  eyeScaleY: 1,
  eyeTilt: 0,
  mouthCurve: 0.5,
  mouthWidth: 1,
  mouthOpen: 0,
  glow: DEFAULT_GLOW,
  glowGain: 1,
  headRoll: 0,
  idleFactor: 1,
};

/* Each expression is a pose. The five the brief specifies use its numbers
   exactly; explaining / greeting / listening follow the same structure. */
export const EXPRESSIONS: Record<ExpressionName, ExpressionPose> = {
  neutral: { ...base },

  happy: {
    ...base,
    eyeShape: 'arc',
    mouthCurve: 1.0,
    mouthWidth: 1.18,
    glowGain: 1.18,
    enter: 'browFlash',
  },

  thinking: {
    ...base,
    eyeScaleY: 0.52,
    eyeTilt: 0.05,
    mouthCurve: 0.05,
    mouthWidth: 0.72,
    headRoll: 0.1,
    idleFactor: 0.65,
    enter: 'glanceAway',
  },

  concerned: {
    ...base,
    eyeTilt: 0.26,
    mouthCurve: -0.72,
    glow: '#3FD8E8',
    enter: 'leanIn',
  },

  surprised: {
    ...base,
    eyeShape: 'round',
    eyeScaleX: 1.2,
    eyeScaleY: 1.3,
    mouthCurve: 0,
    mouthOpen: 0.42,
    glowGain: 1.32,
    idleFactor: 1.3,
    enter: 'pullBack',
  },

  explaining: {
    ...base,
    eyeScaleY: 0.94,
    mouthCurve: 0.34,
    mouthWidth: 1.06,
    glowGain: 1.06,
    headRoll: -0.04,
    idleFactor: 1.1,
    enter: 'nod',
  },

  greeting: {
    ...base,
    eyeShape: 'arc',
    mouthCurve: 0.92,
    mouthWidth: 1.12,
    glowGain: 1.14,
    idleFactor: 1.15,
    enter: 'doubleNod',
  },

  listening: {
    ...base,
    eyeScaleY: 0.9,
    eyeTilt: 0.03,
    mouthCurve: 0.28,
    mouthWidth: 0.88,
    headRoll: 0.12,
    idleFactor: 0.8,
    enter: 'tilt',
  },
};

export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS) as ExpressionName[];
