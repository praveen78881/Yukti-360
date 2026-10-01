import { EXPRESSIONS, EXPRESSION_BLEND } from './expressions';
import { GESTURES, zeroOffset, type GestureOffset } from './gestures';
import { buildTimeline, sampleTimeline, type MouthShape, type VisemeTimeline } from './visemes';
import type {
  AvatarFrame, EyeShape, ExpressionName, ExpressionPose, GestureName, SpeakOptions,
} from './types';

/* ── AvatarController ──────────────────────────────────────────────────────
   Every moving part of the avatar, in plain numbers. No three.js, no React:
   it ships in the main bundle at a few KB and keeps working (queuing
   expressions, speech) before the lazy 3D scene has even loaded. The scene
   calls update(dt) once per frame and applies the result. */

const BLINK_LEN = 0.16;
const BLINK_CLOSE = 0.35;           // closing takes the first 35%
const DOUBLE_BLINK_CHANCE = 0.18;
const DEFAULT_SPC = 0.062;          // seconds per character without a synthesiser
const SPEECH_CURVE_SHOWS = 0.65;    // emotional curve still visible while talking
const GAZE_HOLD = 1.5;              // s the eyes keep following a pointer that has stopped
const LINGER_AFTER = 1.6;           // s of hovering before the orb reacts to it
const LEAVE_GRACE = 0.15;           // s — crossing from shell to visor is not leaving
const POKE_WINDOW = 2.5;            // s — this many pokes inside it reads as pestering
const POKES_TO_PESTER = 3;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

function mixHex(a: string, b: string, t: number): string {
  if (a === b || t <= 0) return a;
  if (t >= 1) return b;
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0').toUpperCase();
}

interface ActiveGesture { name: GestureName; t: number }

interface SpeechRun {
  tl: VisemeTimeline;
  /** seconds per weighted character — re-measured from word boundaries */
  spc: number;
  anchorTime: number;
  anchorPos: number;
  elapsed: number;
  synth: SpeechSynthesis | null;
  started: boolean;
  startTimeout: number;
  resolve: () => void;
  done: boolean;
}

export class AvatarController {
  /* expression */
  private exprName: ExpressionName = 'neutral';
  private fromPose: ExpressionPose = EXPRESSIONS.neutral;
  private toPose: ExpressionPose = EXPRESSIONS.neutral;
  private blend = 1;
  private shape: EyeShape = 'slab';

  /* gestures */
  private gestures: ActiveGesture[] = [];
  private nextMicro = rand(9, 19);

  /* blink */
  private blinkT = -1;                 // −1 = not blinking
  private nextBlink = rand(2.6, 6.8);
  private forcedBlinkIn = -1;          // countdown to a blink timed to hide a shape switch
  private secondOfDouble = false;

  /* gaze */
  private pointerX = 0;
  private pointerY = 0;
  private hasPointer = false;
  private pointerStamp = -Infinity;   // when the pointer last actually moved
  private gazeX = 0;
  private gazeY = 0;
  private sacX = 0;
  private sacY = 0;
  private sacTargetX = 0;
  private sacTargetY = 0;
  private nextSaccade = rand(0.6, 2);

  /* speech */
  private speech: SpeechRun | null = null;
  private speakEnv = 0;                // 0 → 1 while talking, eases in and out
  private mouth: MouthShape = { width: 1, open: 0 };
  private visemeOut: MouthShape = { width: 1, open: 0 };

  /* reduced motion: movement is damped, never frozen — a still face reads as broken */
  private calm = false;

  /* touch */
  private hovering = false;
  private hoverTime = 0;
  private lingered = false;
  private leaveAt = -1;
  private pokes: number[] = [];
  private lastReaction = '';
  /** a temporary expression that reverts on its own */
  private transient: { name: ExpressionName; until: number; restore: ExpressionName } | null = null;

  /* projector */
  private projecting = false;
  private projectEnv = 0;
  /** where the eyes are on screen, as fractions of the canvas box — the scene
      writes it every frame; the projector beam starts here */
  readonly eyeAnchor = { x: 0.5, y: 0.45 };

  private time = 0;
  private readonly off: GestureOffset = zeroOffset();
  private readonly frame: AvatarFrame = {
    body: { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 },
    face: {
      eyeShape: 'slab', eyeOpen: 1, eyeScaleX: 1, eyeScaleY: 1, eyeTilt: 0, eyeLift: 0,
      gazeX: 0, gazeY: 0, mouthCurve: 0.5, mouthWidth: 1, mouthOpen: 0, glow: '#38EFDC', glowGain: 1,
    },
  };

  get expression(): ExpressionName { return this.exprName; }
  get speaking(): boolean { return this.speech !== null; }

  /* ── public API ─────────────────────────────────────────────────────── */

  setExpression(name: ExpressionName) {
    this.transient = null;
    this.applyExpression(name);
  }

  private applyExpression(name: ExpressionName) {
    if (!EXPRESSIONS[name] || name === this.exprName) return;
    // start from wherever the face is right now, not from the old target
    this.fromPose = this.currentPose();
    this.toPose = EXPRESSIONS[name];
    this.exprName = name;
    this.blend = 0;
    // fire a blink timed so the lid is fully shut at the blend's midpoint,
    // which is exactly when the eye silhouette switches — the change hides
    // under the blink instead of reading as a glitch.
    this.forcedBlinkIn = Math.max(0, EXPRESSION_BLEND * 0.5 - BLINK_LEN * BLINK_CLOSE);
    if (this.toPose.enter) this.playGesture(this.toPose.enter);
  }

  playGesture(name: GestureName) {
    if (!GESTURES[name]) return;
    // restarting the same gesture replaces it rather than stacking
    this.gestures = this.gestures.filter((g) => g.name !== name);
    this.gestures.push({ name, t: 0 });
  }

  /** Pointer in the canvas's own space: x −1 left … 1 right, y −1 bottom … 1 top. */
  setPointer(x: number, y: number) {
    this.pointerX = clamp(x, -1, 1);
    this.pointerY = clamp(y, -1, 1);
    this.hasPointer = true;
    this.pointerStamp = this.time;
  }

  clearPointer() { this.hasPointer = false; }

  /** prefers-reduced-motion: damp idle, talk and saccade motion; no unprompted gestures. */
  setCalm(calm: boolean) { this.calm = calm; }

  /** While projecting the eyes brighten and look up toward the hologram. */
  setProjecting(on: boolean) { this.projecting = on; }

  /** Show an expression briefly, then return to whatever was showing before. */
  flashExpression(name: ExpressionName, seconds: number) {
    const restore = this.transient?.restore ?? this.exprName;
    this.applyExpression(name);
    this.transient = { name, until: this.time + seconds, restore };
  }

  /* ── touch ────────────────────────────────────────────────────────────
     Driven by real raycast hits on the shell, visor and ear cups — not by
     the canvas rectangle. Reactions vary and never repeat back-to-back. */

  touchEnter() {
    const returning = this.leaveAt >= 0 && this.time - this.leaveAt < LEAVE_GRACE;
    this.leaveAt = -1;
    if (this.hovering || returning) { this.hovering = true; return; }
    this.hovering = true;
    this.hoverTime = 0;
    this.lingered = false;
    this.react('enter');
  }

  touchLeave() {
    if (this.hovering) this.leaveAt = this.time;
  }

  touchPoke() {
    const now = this.time;
    this.pokes = this.pokes.filter((p) => now - p < POKE_WINDOW);
    this.pokes.push(now);
    this.react(this.pokes.length >= POKES_TO_PESTER ? 'pester' : 'poke');
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    this.stopSpeaking();
    const tl = buildTimeline(text);
    if (tl.total <= 1.6) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const synth = options.synth && typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis
        : null;
      const run: SpeechRun = {
        tl,
        spc: options.secondsPerChar ?? DEFAULT_SPC,
        anchorTime: 0,
        anchorPos: 0,
        elapsed: 0,
        synth,
        started: !synth,
        startTimeout: 1.4,
        resolve,
        done: false,
      };
      this.speech = run;
      this.nextBlink = Math.min(this.nextBlink, rand(1.8, 4.4));

      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = options.rate ?? 1;
        u.onstart = () => {
          if (this.speech !== run) return;
          run.started = true;
          run.elapsed = 0;
          run.anchorTime = 0;
          run.anchorPos = 0;
        };
        // anchor the timeline to the synthesiser's real word boundaries and
        // re-lay out the remainder at the rate it is actually speaking
        u.onboundary = (e) => {
          if (this.speech !== run || (e.name && e.name !== 'word')) return;
          this.anchor(run, e.charIndex);
        };
        u.onend = () => { if (this.speech === run) this.finish(run); };
        u.onerror = () => {
          if (this.speech !== run) return;
          // fall back to the timed layout rather than freezing mid-word
          run.synth = null;
          run.started = true;
        };
        synth.cancel();
        synth.speak(u);
      }
    });
  }

  stopSpeaking() {
    const run = this.speech;
    if (!run) return;
    if (run.synth) run.synth.cancel();
    this.finish(run);
  }

  dispose() { this.stopSpeaking(); }

  /* ── per-frame update ───────────────────────────────────────────────── */

  update(dtRaw: number): AvatarFrame {
    const dt = clamp(dtRaw, 0, 0.1);
    this.time += dt;
    const t = this.time;

    /* a transient expression reverts to what was showing before it */
    if (this.transient && t >= this.transient.until) {
      const back = this.transient.restore;
      this.transient = null;
      this.applyExpression(back);
    }

    /* touch: a leave only counts after the grace period; lingering reacts once */
    if (this.leaveAt >= 0 && t - this.leaveAt >= LEAVE_GRACE) { this.hovering = false; this.leaveAt = -1; }
    if (this.hovering && this.leaveAt < 0) {
      this.hoverTime += dt;
      if (!this.lingered && this.hoverTime >= LINGER_AFTER) { this.lingered = true; this.react('linger'); }
    }

    /* expression blend — numeric fields ease, the eye silhouette switches at
       the midpoint (under the blink fired on change) */
    if (this.blend < 1) {
      const before = this.blend;
      this.blend = Math.min(1, this.blend + dt / EXPRESSION_BLEND);
      if (before < 0.5 && this.blend >= 0.5) this.shape = this.toPose.eyeShape;
    } else {
      this.shape = this.toPose.eyeShape;
    }
    const pose = this.currentPose();

    /* gestures, sampled over their own durations, summed */
    const o = this.off;
    o.pitch = o.yaw = o.roll = o.x = o.y = o.z = o.eyeLift = o.glow = o.gazeX = o.gazeY = 0;
    for (const g of this.gestures) {
      g.t += dt;
      const def = GESTURES[g.name];
      def.sample(Math.min(1, g.t / def.duration), o);
    }
    this.gestures = this.gestures.filter((g) => g.t < GESTURES[g.name].duration);

    /* unprompted micro-gesture every 9–19s — never frozen */
    this.nextMicro -= dt;
    if (this.nextMicro <= 0) {
      if (!this.calm && !this.speech && !this.projecting && !this.hovering && this.gestures.length === 0 && this.blend >= 1) {
        const pool: GestureName[] = ['tilt', 'nod', 'glanceAway', 'browFlash'];
        this.playGesture(pool[Math.floor(Math.random() * pool.length)]);
      }
      this.nextMicro = rand(9, 19);
    }

    /* speech */
    this.updateSpeech(dt);
    this.speakEnv = lerp(this.speakEnv, this.speech ? 1 : 0, damp(dt, 9));

    /* blink */
    const eyeOpen = this.updateBlink(dt);

    /* gaze: pointer measured against the canvas, plus micro-saccades */
    this.nextSaccade -= dt;
    if (this.nextSaccade <= 0) {
      const amp = this.calm ? 0.4 : 1;
      this.sacTargetX = rand(-0.16, 0.16) * amp;
      this.sacTargetY = rand(-0.1, 0.1) * amp;
      this.nextSaccade = rand(0.5, 2.1);
    }
    // saccades are fast jumps, the pointer follow is smooth
    this.sacX = lerp(this.sacX, this.sacTargetX, damp(dt, 30));
    this.sacY = lerp(this.sacY, this.sacTargetY, damp(dt, 30));
    // the eyes follow the pointer only while it is moving; a still pointer
    // is let go after GAZE_HOLD and the gaze eases back to its idle wander
    const following = this.hasPointer && t - this.pointerStamp < GAZE_HOLD;
    const wanderX = Math.sin(t * 0.23 + 0.4) * 0.12;
    this.projectEnv = lerp(this.projectEnv, this.projecting ? 1 : 0, damp(dt, 5));
    const aimX = following ? this.pointerX * 0.55 : wanderX * (1 - this.projectEnv);
    const aimY = following ? this.pointerY * 0.4 : 0.42 * this.projectEnv;
    this.gazeX = lerp(this.gazeX, aimX, damp(dt, 6));
    this.gazeY = lerp(this.gazeY, aimY, damp(dt, 6));
    const gazeX = clamp(this.gazeX + this.sacX + o.gazeX, -1.2, 1.2);
    const gazeY = clamp(this.gazeY + this.sacY + o.gazeY, -1, 1);

    /* idle: float, drift, and a slow breathing sway */
    const idle = pose.idleFactor * (this.calm ? 0.3 : 1);
    const float = (Math.sin(t * 0.85) * 0.055 + Math.sin(t * 1.43 + 1.1) * 0.014) * idle;
    const drift = Math.sin(t * 0.37 + 0.6) * 0.03;

    /* talking head motion */
    const s = this.speakEnv;
    const talkAmp = this.calm ? 0.4 : 1;
    const talkPitch = Math.sin(t * 5.3) * 0.03 * s * talkAmp;
    const talkYaw = Math.sin(t * 3.1 + 0.7) * 0.045 * s * talkAmp;
    const talkRoll = Math.sin(t * 2.4 + 1.9) * 0.025 * s * talkAmp;

    const body = this.frame.body;
    body.x = drift + o.x;
    body.y = float + o.y;
    body.z = o.z;
    body.pitch = float * 0.35 + gazeY * -0.16 + talkPitch + o.pitch;
    body.yaw = Math.sin(t * 0.29) * 0.03 * idle + gazeX * 0.2 + talkYaw + o.yaw;
    body.roll = pose.headRoll + Math.sin(t * 0.41 + 2) * 0.012 * idle + talkRoll + o.roll;

    /* mouth: visemes while talking, with the emotional curve showing through */
    const face = this.frame.face;
    const talk = this.mouth;
    face.mouthCurve = lerp(pose.mouthCurve, pose.mouthCurve * SPEECH_CURVE_SHOWS, s);
    face.mouthWidth = lerp(pose.mouthWidth, talk.width * (1 + (pose.mouthWidth - 1) * 0.5), s);
    face.mouthOpen = lerp(pose.mouthOpen, talk.open * 0.62 + pose.mouthOpen * 0.3, s);

    face.eyeShape = this.shape;
    face.eyeOpen = eyeOpen;
    face.eyeScaleX = pose.eyeScaleX;
    face.eyeScaleY = pose.eyeScaleY;
    face.eyeTilt = pose.eyeTilt;
    face.eyeLift = o.eyeLift;
    face.gazeX = gazeX;
    face.gazeY = gazeY;
    face.glow = pose.glow;
    face.glowGain = pose.glowGain + o.glow + this.projectEnv * 0.22;
    return this.frame;
  }

  /* ── internals ──────────────────────────────────────────────────────── */

  /** Pick a reaction for a touch. Every kind has two variants and the last
      reaction is never picked again, so poking it twice never plays the same
      thing twice. While talking only the gesture plays — the face keeps its
      speaking expression. */
  private react(kind: 'enter' | 'poke' | 'pester' | 'linger') {
    const variants: Record<typeof kind, string[]> = {
      enter: ['brow-happy', 'nod-happy'],
      poke: ['poke-surprise', 'poke-giggle'],
      pester: ['shrug', 'shake-concerned'],
      linger: ['tilt-listen', 'glance-away'],
    };
    const pool = variants[kind].filter((r) => r !== this.lastReaction);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastReaction = pick;
    const face = this.speech === null;
    switch (pick) {
      case 'brow-happy':      this.playGesture('browFlash');  if (face) this.flashExpression('happy', 1.1); break;
      case 'nod-happy':       this.playGesture('nod');        if (face) this.flashExpression('happy', 1.0); break;
      case 'poke-surprise':   if (face) this.flashExpression('surprised', 0.9); this.playGesture('pullBack'); break;
      case 'poke-giggle':     this.playGesture('doubleNod');  if (face) this.flashExpression('happy', 0.9); break;
      case 'shrug':           this.playGesture('shrug');      if (face) this.flashExpression('concerned', 1.2); break;
      case 'shake-concerned': this.playGesture('shake');      if (face) this.flashExpression('concerned', 1.1); break;
      case 'tilt-listen':     this.playGesture('tilt');       if (face) this.flashExpression('listening', 1.6); break;
      case 'glance-away':     this.playGesture('glanceAway'); if (face) this.flashExpression('thinking', 1.3); break;
    }
  }

  /** The most recent touch reaction (for tests and debugging). */
  get lastTouchReaction(): string { return this.lastReaction; }

  /** The frame most recently produced by update() (for tests and debugging). */
  get lastFrame(): AvatarFrame { return this.frame; }

  /** Whether the eyes are currently following the pointer. */
  get followingPointer(): boolean { return this.hasPointer && this.time - this.pointerStamp < GAZE_HOLD; }

  /** the pose at the current point of the blend */
  private currentPose(): ExpressionPose {
    if (this.blend >= 1) return this.toPose;
    const a = this.fromPose, b = this.toPose, k = easeInOut(this.blend);
    return {
      eyeShape: this.shape,
      eyeScaleX: lerp(a.eyeScaleX, b.eyeScaleX, k),
      eyeScaleY: lerp(a.eyeScaleY, b.eyeScaleY, k),
      eyeTilt: lerp(a.eyeTilt, b.eyeTilt, k),
      mouthCurve: lerp(a.mouthCurve, b.mouthCurve, k),
      mouthWidth: lerp(a.mouthWidth, b.mouthWidth, k),
      mouthOpen: lerp(a.mouthOpen, b.mouthOpen, k),
      glow: mixHex(a.glow, b.glow, k),
      glowGain: lerp(a.glowGain, b.glowGain, k),
      headRoll: lerp(a.headRoll, b.headRoll, k),
      idleFactor: lerp(a.idleFactor, b.idleFactor, k),
    };
  }

  /** returns eye openness 0 … 1 */
  private updateBlink(dt: number): number {
    if (this.forcedBlinkIn >= 0) {
      this.forcedBlinkIn -= dt;
      // a concealment blink is always single
      if (this.forcedBlinkIn < 0) { this.blinkT = 0; this.secondOfDouble = true; }
    }

    if (this.blinkT < 0) {
      this.nextBlink -= dt;
      if (this.nextBlink <= 0) { this.blinkT = 0; }
      else return 1;
    }

    this.blinkT += dt;
    const p = this.blinkT / BLINK_LEN;
    if (p >= 1) {
      this.blinkT = -1;
      if (!this.secondOfDouble && Math.random() < DOUBLE_BLINK_CHANCE) {
        this.nextBlink = rand(0.08, 0.14);
        this.secondOfDouble = true;
      } else {
        this.secondOfDouble = false;
        this.nextBlink = this.speech ? rand(1.8, 4.4) : rand(2.6, 6.8);
      }
      return 1;
    }
    // fast shut, slower open — like a real lid
    if (p < BLINK_CLOSE) {
      const k = p / BLINK_CLOSE;
      return 1 - k * k;
    }
    const k = (p - BLINK_CLOSE) / (1 - BLINK_CLOSE);
    return 1 - Math.pow(1 - k, 2.2);
  }

  private updateSpeech(dt: number) {
    const run = this.speech;
    if (!run) {
      this.mouth.width = lerp(this.mouth.width, 1, damp(dt, 14));
      this.mouth.open = lerp(this.mouth.open, 0, damp(dt, 14));
      return;
    }

    if (!run.started) {
      // a synthesiser that never starts (no voices, autoplay policy) must
      // not leave the avatar frozen — fall back to the timed layout
      run.startTimeout -= dt;
      if (run.startTimeout <= 0) {
        run.synth?.cancel();
        run.synth = null;
        run.started = true;
      }
    } else {
      run.elapsed += dt;
    }

    const pos = run.anchorPos + (run.elapsed - run.anchorTime) / run.spc;
    if (!run.synth && pos >= run.tl.total) { this.finish(run); return; }
    // with a synthesiser, hold the closed mouth until it reports the end —
    // but never forever
    if (run.synth && run.elapsed > run.tl.total * run.spc * 3 + 4) { run.synth.cancel(); this.finish(run); return; }

    sampleTimeline(run.tl, pos, this.visemeOut);
    // a fast follow so boundary re-anchoring never snaps the lips
    this.mouth.width = lerp(this.mouth.width, this.visemeOut.width, damp(dt, 26));
    this.mouth.open = lerp(this.mouth.open, this.visemeOut.open, damp(dt, 26));
  }

  private anchor(run: SpeechRun, charIndex: number) {
    const map = run.tl.posAtChar;
    const pos = map[clamp(charIndex, 0, map.length - 1)];
    const dPos = pos - run.anchorPos;
    const dTime = run.elapsed - run.anchorTime;
    if (dPos > 0.5 && dTime > 0.04) {
      const measured = dTime / dPos;
      run.spc = clamp(lerp(run.spc, measured, 0.6), 0.03, 0.16);
    }
    run.anchorTime = run.elapsed;
    run.anchorPos = pos;
  }

  private finish(run: SpeechRun) {
    if (run.done) return;
    run.done = true;
    if (this.speech === run) this.speech = null;
    run.resolve();
  }
}

