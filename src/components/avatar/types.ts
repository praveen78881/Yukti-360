/* ── Assistant avatar — shared types ──────────────────────────────────────
   Nothing in this file (or anything it is imported by outside AvatarScene)
   may import three / @react-three/*: these types travel in the main bundle. */

export type ExpressionName =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'concerned'
  | 'surprised'
  | 'explaining'
  | 'greeting'
  | 'listening';

export type GestureName =
  | 'nod'
  | 'doubleNod'
  | 'shake'
  | 'tilt'
  | 'leanIn'
  | 'pullBack'
  | 'shrug'
  | 'browFlash'
  | 'glanceAway';

export type EyeShape = 'slab' | 'arc' | 'round';

/** A face + body pose. Every numeric field is blended; eyeShape and glow switch. */
export interface ExpressionPose {
  eyeShape: EyeShape;
  /** multiplier on the 132 × 150 eye box */
  eyeScaleX: number;
  eyeScaleY: number;
  /** radians; mirrored per eye, positive = inner corners down */
  eyeTilt: number;
  /** −1 frown … +1 full smile */
  mouthCurve: number;
  /** multiplier on the 132px mouth width */
  mouthWidth: number;
  /** 0 closed … 1 wide vowel */
  mouthOpen: number;
  /** hex glow colour */
  glow: string;
  /** brightness gain on the glow */
  glowGain: number;
  /** head roll in radians held for as long as the expression lasts */
  headRoll: number;
  /** multiplier on idle float amplitude */
  idleFactor: number;
  /** gesture fired when this expression is entered */
  enter?: GestureName;
}

/** Everything the face painter needs for one frame. */
export interface FaceFrame {
  eyeShape: EyeShape;
  /** 0 shut … 1 open (blink) */
  eyeOpen: number;
  eyeScaleX: number;
  eyeScaleY: number;
  eyeTilt: number;
  /** extra eye height from a brow flash, 0 … 1 */
  eyeLift: number;
  /** gaze offset, −1 … 1 of the travel range */
  gazeX: number;
  gazeY: number;
  mouthCurve: number;
  mouthWidth: number;
  mouthOpen: number;
  glow: string;
  glowGain: number;
}

/** The orb's transform for one frame (radians / scene units). */
export interface BodyFrame {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  roll: number;
}

export interface AvatarFrame {
  body: BodyFrame;
  face: FaceFrame;
}

export interface SpeakOptions {
  /** Use window.speechSynthesis when present; the mouth anchors to its word boundaries. */
  synth?: boolean;
  /** Voice rate passed to the synthesiser (default 1). */
  rate?: number;
  /** Seconds per character for the unsynthesised timeline (default 0.062). */
  secondsPerChar?: number;
}

/** The imperative handle exposed by <AssistantAvatar ref={…}>. */
export interface AssistantAvatarHandle {
  setExpression(name: ExpressionName): void;
  playGesture(name: GestureName): void;
  /** Resolves when speech finishes or is stopped. */
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stopSpeaking(): void;
  /** Show an expression for a few seconds, then return to the previous one. */
  flashExpression(name: ExpressionName, seconds: number): void;
  /** Projector mode: the eyes brighten and look up toward the hologram. */
  setProjecting(on: boolean): void;
  /** Where the eyes are on screen, as fractions (0…1) of the avatar box. Live. */
  readonly eyeAnchor: { readonly x: number; readonly y: number };
  readonly expression: ExpressionName;
  readonly speaking: boolean;
}
