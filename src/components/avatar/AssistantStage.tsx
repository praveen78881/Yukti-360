import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { getUserFirstName } from '@/lib/userIdentity';
import { projectorBus, type ProjectionRequest } from '@/lib/carp/tools/projector';
import { CompanyDashboard } from '@/components/dashboard/CompanyDashboard';
import { AssistantAvatar } from './AssistantAvatar';
import { Hologram, HoloStyles, ProjectorBeam, type HoloSlide } from './Hologram';
import { captureCompanyRoute } from './reportCapture';
import { useAssistantChat, type ThreadMessage } from './useAssistantChat';
import type { AssistantAvatarHandle } from './types';

/* ── The dashboard assistant ───────────────────────────────────────────────
   The orb IS the assistant. On arrival it appears large in the centre, greets
   the signed-in person by name, then glides down to its resting dock in the
   bottom-right corner — leaving the rest of the dashboard free canvas. Click
   it to talk; the ask-bar rises above it and slips away again after 30s if
   left empty. The conversation stays on screen and is remembered per company.
   When the assistant projects a report, it beams it from its visor as a
   hologram onto the free centre — captured on the fly, never stored, and
   deleted the moment the projection closes. */

const IDLE_MS = 30_000;
/** The whole centre → corner glide. */
const TRAVEL_MS = 1500;
/** Keep the orb centre-stage at least this long so the greeting lands. */
const MIN_CENTER_MS = 2600;
/** Dock anyway after this, in case the scene never reports ready (no WebGL). */
const FALLBACK_DOCK_MS = 6500;
const EASE_LAYOUT = 'cubic-bezier(.3,.9,.3,1)';
const EASE_TRAVEL = 'cubic-bezier(.45,.05,.2,1)';

/** The small resting size. The orb tucks into the bottom-right corner at about
    a third of its former dock size (the original quarter, grown 15% from that
    resting size), so it stays a discreet presence rather than dominating the
    corner. */
function smallSize(): number {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const base = Math.max(148, Math.min(vw * 0.15, 188));
  return Math.round(base * 0.2875 * 1.15);
}

interface Geo { W: number; H: number; S: number; big: number; bigLeft: number; bigTop: number; smallLeft: number; smallTop: number }

function computeGeo(W: number, H: number): Geo {
  const S = smallSize();
  const big = Math.round(Math.max(S, Math.min(H * 0.86, W * 0.9, 600)));
  return {
    W, H, S, big,
    bigLeft: Math.round((W - big) / 2),
    bigTop: Math.round((H - big) / 2),
    smallLeft: Math.round(W - S),
    smallTop: Math.round(H - S),
  };
}

/** A warm, time-aware greeting addressed to the signed-in person. */
function buildGreeting(first: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const who = first ? `, ${first}` : '';
  return {
    title: `Good ${part}${who}!`,
    sub: 'I’m right here whenever you need a hand with these books.',
    speech: first
      ? `Good ${part}, ${first}. I’m right here whenever you need a hand.`
      : `Good ${part}. I’m right here whenever you need a hand.`,
  };
}

const CSS = `
.yk-stage{position:relative;height:100%;width:100%;min-height:360px}
/* the free centre — empty canvas for the dashboard, and where reports project */
.yk-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:4px 4px 0;pointer-events:none;z-index:2}
.yk-holo-wrap{pointer-events:auto;width:min(1040px,100%);height:min(64vh,620px)}
/* the orb itself — a fixed-size canvas that glides via transform only, so the
   WebGL surface never resizes mid-flight (which clipped it against R3F's
   overflow:hidden wrapper). It only ever scales down, so it stays crisp. */
.yk-orb{position:absolute;left:0;top:0;z-index:6;cursor:pointer;transform-origin:0 0;will-change:transform;
  filter:drop-shadow(0 20px 30px -20px rgba(24,44,70,.55))}
/* the ask-bar / conversation, stacked above the docked orb */
.yk-dock{position:absolute;right:0;z-index:6;display:flex;flex-direction:column;align-items:flex-end;gap:10px;max-width:min(360px,calc(100% - 4px));
  opacity:0;transform:translateY(8px);transition:opacity 320ms ease,transform 320ms ease;pointer-events:none}
.yk-dock.is-on{opacity:1;transform:none}
.yk-dock.is-on>*{pointer-events:auto}
.yk-ask{width:min(340px,86vw);display:flex;align-items:center;gap:8px;padding:7px 7px 7px 16px;border-radius:14px;
  background:linear-gradient(180deg,rgba(255,255,255,.74),rgba(240,246,252,.62));
  border:1px solid rgba(255,255,255,.9);box-shadow:0 2px 4px rgba(24,44,70,.06),0 26px 48px -24px rgba(24,44,70,.42),inset 0 1px 0 rgba(255,255,255,.9);
  backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  animation:yk-ask-in 260ms cubic-bezier(.2,.8,.3,1) both}
.yk-ask.yk-ask-out{animation:yk-ask-out 280ms cubic-bezier(.2,.8,.3,1) both}
.yk-ask input{flex:1;min-width:0;height:38px;border:0!important;background:transparent!important;box-shadow:none!important;padding:0;font-size:14px;color:var(--ink)}
.yk-ask input:focus{outline:none}
.yk-ask-send{height:38px;padding:0 20px;flex-shrink:0;background:var(--navy);color:#fff;font-family:var(--font-display);font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);filter:drop-shadow(0 6px 14px rgba(23,69,127,.38));transition:background-color 160ms ease,transform 160ms ease}
.yk-ask-send:hover:not(:disabled){background:var(--navy-2);transform:translateY(-1px)}
.yk-ask-send:disabled{background:var(--sand);color:var(--ink-3);filter:none}
/* arrival greeting — a speech bubble that points down toward the orb */
.yk-bubble{max-width:300px;padding:12px 32px 13px 15px;border-radius:16px 16px 4px 16px;
  background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(240,246,252,.86));
  border:1px solid rgba(255,255,255,.95);box-shadow:0 2px 4px rgba(24,44,70,.06),0 26px 48px -24px rgba(24,44,70,.42),inset 0 1px 0 rgba(255,255,255,.9);
  backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  animation:yk-bubble-in 360ms cubic-bezier(.2,.8,.3,1) both}
.yk-bubble.yk-bubble-out{animation:yk-ask-out 280ms cubic-bezier(.2,.8,.3,1) both}
.yk-greet-center{position:absolute;z-index:7}
.yk-bubble-title{font-weight:700;font-size:15px;line-height:1.25;color:var(--ink)}
.yk-bubble-sub{margin-top:3px;font-size:12.5px;line-height:1.45;color:var(--ink-2)}
.yk-bubble-x{position:absolute;top:7px;right:8px;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:7px;color:var(--ink-3);transition:background-color 150ms ease,color 150ms ease}
.yk-bubble-x:hover{background:var(--navy-soft);color:var(--navy)}
.yk-hint{font-family:var(--font-display);font-weight:600;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);padding:2px 6px;animation:yk-hint-in 500ms ease both}
.yk-thread{display:flex;flex-direction:column;min-height:0;border-radius:14px;
  background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(245,250,254,.6));border:1px solid rgba(255,255,255,.85);
  box-shadow:0 1px 2px rgba(24,44,70,.05),0 18px 36px -20px rgba(24,44,70,.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.yk-thread-dock{width:min(340px,86vw);max-height:min(50vh,440px)}
.yk-thread-list{flex:1;min-height:0;overflow-y:auto;padding:10px 12px 14px;display:flex;flex-direction:column;gap:8px;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 14px,#000 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 14px,#000 100%)}
.yk-msg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;animation:yk-msg-in 260ms cubic-bezier(.2,.8,.3,1) both}
.yk-msg-user{align-self:flex-end;background:var(--navy-soft);color:var(--navy-2);border-bottom-right-radius:4px}
.yk-msg-bot{align-self:flex-start;background:#fff;color:var(--ink-2);border:1px solid var(--sand);border-bottom-left-radius:4px}
.yk-msg-err{background:var(--bad-soft);color:#8C2E27;border-color:#F2C4C0}
.yk-chip{display:inline-flex;align-items:center;gap:5px;margin:6px 4px 0 0;padding:2px 9px;border-radius:999px;font-family:var(--font-display);font-weight:600;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;background:#DDF9F5;color:#0E5E57}
.yk-dots{display:inline-flex;gap:4px;padding:3px 2px}
.yk-dots i{width:6px;height:6px;border-radius:50%;background:var(--sand-2);animation:yk-dot 1.1s ease-in-out infinite}
.yk-dots i:nth-child(2){animation-delay:.15s}.yk-dots i:nth-child(3){animation-delay:.3s}
.yk-tool-btn{height:28px;padding:0 10px;border-radius:999px;font-family:var(--font-display);font-weight:600;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);border:1px solid var(--sand);background:rgba(255,255,255,.7);transition:color 160ms ease,border-color 160ms ease}
.yk-tool-btn:hover{color:var(--navy);border-color:var(--sand-2)}
@keyframes yk-ask-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes yk-ask-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(8px)}}
@keyframes yk-bubble-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
@keyframes yk-hint-in{from{opacity:0}to{opacity:1}}
@keyframes yk-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes yk-dot{0%,80%,100%{opacity:.35;transform:none}40%{opacity:1;transform:translateY(-2px)}}
@media (prefers-reduced-motion: reduce){.yk-ask,.yk-ask-out,.yk-bubble,.yk-hint,.yk-msg,.yk-dots i{animation:none!important}}
`;

export function AssistantStage() {
  const { company, companyId } = useCompany();
  const avatar = useRef<AssistantAvatarHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const avatarBoxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chat = useAssistantChat(companyId, company, avatar);

  // voice preference, read live in the greeting without re-triggering it
  const voiceRef = useRef(chat.voice);
  voiceRef.current = chat.voice;

  /* ── stage geometry: centre (big) and corner (small) ── */
  const [geo, setGeo] = useState<Geo | null>(null);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setGeo(computeGeo(r.width, r.height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* ── the arrival sequence: centre → greet → dock ── */
  const [phase, setPhase] = useState<'intro' | 'docked'>('intro');
  const [greet, setGreet] = useState<{ open: boolean; title: string; sub: string }>({ open: false, title: '', sub: '' });
  const [greetLeaving, setGreetLeaving] = useState(false);
  const sceneReady = useRef(false);
  const pendingGreet = useRef<string | null>(null);
  const docked = useRef(false);
  const fallbackTimer = useRef<number | undefined>(undefined);
  const holdTimer = useRef<number | undefined>(undefined);

  const dock = useCallback(() => {
    if (docked.current) return;
    docked.current = true;
    window.clearTimeout(fallbackTimer.current);
    window.clearTimeout(holdTimer.current);
    setPhase('docked');
    setGreetLeaving(true);
    window.setTimeout(() => { setGreet((g) => ({ ...g, open: false })); setGreetLeaving(false); }, 300);
  }, []);

  /** Say the greeting aloud (if voice is on) with the matching face, then settle. */
  const speakGreeting = useCallback(async (speech: string) => {
    const a = avatar.current;
    if (!a) return;
    a.setExpression('greeting');
    try {
      await a.speak(speech, { synth: voiceRef.current });
    } finally {
      if (avatar.current === a && !a.speaking && a.expression === 'greeting') a.setExpression('neutral');
    }
  }, []);

  /** Greet while centred, then dock once the greeting has had its moment. */
  const runGreeting = useCallback(async (speech: string) => {
    const started = Date.now();
    await speakGreeting(speech);
    const wait = Math.max(0, MIN_CENTER_MS - (Date.now() - started));
    holdTimer.current = window.setTimeout(dock, wait);
  }, [speakGreeting, dock]);

  // The scene is live — speak any greeting that was waiting on it.
  const onAvatarReady = useCallback(() => {
    sceneReady.current = true;
    const s = pendingGreet.current;
    if (s) { pendingGreet.current = null; void runGreeting(s); }
  }, [runGreeting]);

  // Run the whole sequence on arrival, and again whenever the company changes.
  useEffect(() => {
    if (!companyId) return;
    docked.current = false;
    setPhase('intro');
    const { title, sub, speech } = buildGreeting(getUserFirstName());
    setGreetLeaving(false);
    setGreet({ open: true, title, sub });
    if (sceneReady.current) void runGreeting(speech);
    else pendingGreet.current = speech;
    fallbackTimer.current = window.setTimeout(dock, FALLBACK_DOCK_MS);
    return () => { window.clearTimeout(fallbackTimer.current); window.clearTimeout(holdTimer.current); };
  }, [companyId, runGreeting, dock]);

  /* ── ask-bar ── */
  const [askOpen, setAskOpen] = useState(false);
  const [askLeaving, setAskLeaving] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActivity = useRef(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const touch = () => { lastActivity.current = Date.now(); };

  const openAsk = useCallback(() => {
    // clicking the orb ends the intro: hush the greeting, snap to the dock
    avatar.current?.stopSpeaking();
    pendingGreet.current = null;
    dock();
    setAskLeaving(false);
    setAskOpen(true);
    lastActivity.current = Date.now();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [dock]);

  // Empty and untouched for 30s → the bar slips away. Waiting on the AI or
  // listening to a reply counts as activity, so it never vanishes mid-answer.
  useEffect(() => {
    if (!askOpen) return;
    const id = window.setInterval(() => {
      if (draftRef.current.trim() || chat.busy || chat.talking) { lastActivity.current = Date.now(); return; }
      if (Date.now() - lastActivity.current >= IDLE_MS) {
        setAskLeaving(true);
        window.setTimeout(() => { setAskOpen(false); setAskLeaving(false); }, 280);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [askOpen, chat.busy, chat.talking]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || chat.busy) return;
    setDraft('');
    touch();
    void chat.send(text);
  };

  /* ── projector ── */
  const [slides, setSlides] = useState<HoloSlide[]>([]);
  const generation = useRef(0);
  const liveUrls = useRef<string[]>([]);
  const aborter = useRef<AbortController | null>(null);
  const projecting = slides.length > 0;

  /** Close = delete: abort any capture in flight, revoke every object URL, drop every reference. */
  const closeProjection = useCallback(() => {
    generation.current++;
    aborter.current?.abort();
    aborter.current = null;
    liveUrls.current.forEach((u) => URL.revokeObjectURL(u));
    liveUrls.current = [];
    setSlides([]);
    avatar.current?.setProjecting(false);
  }, []);

  useEffect(() => {
    const onRequest = async (req: ProjectionRequest) => {
      if (req.companyId !== companyId) return;
      closeProjection();
      const mine = ++generation.current;
      const ac = new AbortController();
      aborter.current = ac;
      setSlides(req.items.map((i) => ({ id: `${req.id}:${i.key}`, title: i.title, status: 'capturing' })));
      avatar.current?.setProjecting(true);
      // one at a time — each capture boots a full copy of the app in an iframe
      for (const item of req.items) {
        const id = `${req.id}:${item.key}`;
        try {
          const img = await captureCompanyRoute(companyId, item.path, ac.signal);
          if (generation.current !== mine) { URL.revokeObjectURL(img.url); return; }
          liveUrls.current.push(img.url);
          setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'ready', url: img.url } : s)));
        } catch (err) {
          if (generation.current !== mine) return;
          const msg = err instanceof Error ? err.message : 'Capture failed';
          setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'error', error: msg } : s)));
        }
      }
    };
    return projectorBus.listen((req) => { void onRequest(req); });
  }, [companyId, closeProjection]);

  // leaving the dashboard deletes whatever was projected
  useEffect(() => () => {
    aborter.current?.abort();
    liveUrls.current.forEach((u) => URL.revokeObjectURL(u));
    liveUrls.current = [];
  }, []);

  const getOrigin = useCallback(() => {
    const stage = stageRef.current, box = avatarBoxRef.current, a = avatar.current;
    if (!stage || !box || !a) return null;
    const s = stage.getBoundingClientRect(), b = box.getBoundingClientRect();
    return { x: b.left - s.left + a.eyeAnchor.x * b.width, y: b.top - s.top + a.eyeAnchor.y * b.height };
  }, []);

  const hasThread = chat.messages.length > 0 || chat.busy;
  const intro = phase === 'intro';

  // The canvas is always rendered at the big centred size; translate places it
  // and scale (≤1) shrinks it into the corner — animated on transform alone.
  const orbStyle: CSSProperties | undefined = geo
    ? {
        width: geo.big,
        height: geo.big,
        transform: intro
          ? `translate(${geo.bigLeft}px, ${geo.bigTop}px)`
          : `translate(${geo.smallLeft}px, ${geo.smallTop}px) scale(${geo.S / geo.big})`,
        transition: reduceMotion ? 'none' : `transform ${TRAVEL_MS}ms ${EASE_TRAVEL}`,
      }
    : undefined;

  return (
    <div ref={stageRef} className="yk-stage">
      <style>{CSS}</style>
      <HoloStyles />

      {/* The business dashboard fills the stage; the orb floats above it. */}
      <CompanyDashboard />

      {/* The free centre — where reports beam onto, above the dashboard. */}
      <div className="yk-center">
        {projecting && (
          <div className="yk-holo-wrap">
            <Hologram slides={slides} onClose={closeProjection} panelRef={panelRef} />
          </div>
        )}
      </div>

      {/* The greeting, shown above the big orb while it is centre-stage. */}
      {geo && intro && greet.open && (
        <div
          className={`yk-bubble yk-greet-center ${greetLeaving ? 'yk-bubble-out' : ''}`}
          role="status"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: Math.round(geo.H - geo.bigTop - geo.big * 0.14),
            maxWidth: Math.min(320, geo.W - 32),
          }}
        >
          <button type="button" className="yk-bubble-x" onClick={dock} aria-label="Dismiss greeting" title="Dismiss">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <div className="yk-bubble-title">{greet.title}</div>
          <div className="yk-bubble-sub">{greet.sub}</div>
        </div>
      )}

      {/* The ask-bar / conversation, stacked above the orb's resting dock. */}
      <div className={`yk-dock ${phase === 'docked' ? 'is-on' : ''}`} style={{ bottom: geo ? geo.S + 14 : 14 }}>
        {phase === 'docked' && (
          <>
            {hasThread && (
              <Transcript
                messages={chat.messages}
                busy={chat.busy}
                voice={chat.voice}
                onVoice={chat.setVoice}
                onClear={chat.clear}
              />
            )}
            {askOpen && (
              <form className={`yk-ask ${askLeaving ? 'yk-ask-out' : ''}`} onSubmit={submit}>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); touch(); if (chat.talking) avatar.current?.stopSpeaking(); }}
                  onFocus={touch}
                  onKeyDown={touch}
                  placeholder={chat.busy ? 'Thinking…' : 'Ask about these books…'}
                  aria-label="Message the assistant"
                  autoComplete="off"
                />
                <button type="submit" className="yk-ask-send" disabled={!draft.trim() || chat.busy}>Send</button>
              </form>
            )}
          </>
        )}
      </div>

      {/* The orb — glides from the big centre to the small corner dock. */}
      {geo && (
        <div ref={avatarBoxRef} className="yk-orb" style={orbStyle}>
          <AssistantAvatar
            ref={avatar}
            onReady={onAvatarReady}
            label="Yukti 360 assistant"
            onOrbClick={openAsk}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {projecting && <ProjectorBeam stageRef={stageRef} getOrigin={getOrigin} panelRef={panelRef} />}
    </div>
  );
}

/* ── the conversation ── */

function Transcript({
  messages, busy, voice, onVoice, onClear,
}: {
  messages: ThreadMessage[];
  busy: boolean;
  voice: boolean;
  onVoice: (on: boolean) => void;
  onClear: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy]);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <aside className="yk-thread yk-thread-dock" aria-label="Conversation">
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(212,226,240,.7)' }}>
        <span className="eyebrow">Conversation</span>
        <div className="ml-auto flex items-center gap-1.5">
          {canSpeak && (
            <button type="button" className="yk-tool-btn" aria-pressed={voice} onClick={() => onVoice(!voice)} title={voice ? 'Mute the voice' : 'Speak replies aloud'}>
              {voice ? 'Voice on' : 'Voice off'}
            </button>
          )}
          <button type="button" className="yk-tool-btn" onClick={onClear} title="Forget this conversation">Clear</button>
        </div>
      </div>
      <div ref={list} className="yk-thread-list" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`yk-msg ${m.role === 'user' ? 'yk-msg-user' : 'yk-msg-bot'} ${m.error ? 'yk-msg-err' : ''}`}>
            {m.content.replace(/\*\*/g, '')}
            {m.tools && m.tools.length > 0 && (
              <div>{m.tools.map((t) => <span key={t} className="yk-chip">{t}</span>)}</div>
            )}
          </div>
        ))}
        {busy && (
          <div className="yk-msg yk-msg-bot" aria-label="The assistant is thinking">
            <span className="yk-dots"><i /><i /><i /></span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default AssistantStage;
