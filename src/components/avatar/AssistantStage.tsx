import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { projectorBus, type ProjectionRequest } from '@/lib/carp/tools/projector';
import { AssistantAvatar } from './AssistantAvatar';
import { Hologram, HoloStyles, ProjectorBeam, type HoloSlide } from './Hologram';
import { captureCompanyRoute } from './reportCapture';
import { useAssistantChat, type ThreadMessage } from './useAssistantChat';
import type { AssistantAvatarHandle } from './types';

/* ── The dashboard assistant ───────────────────────────────────────────────
   The orb IS the assistant. Click it to talk; the ask-bar appears beneath it
   and slips away again after 30s if left empty. The conversation stays on
   screen and is remembered per company. When the assistant decides to show a
   report, it projects it from its visor as a hologram — captured on the fly,
   never stored, and deleted the moment the projection closes. */

const IDLE_MS = 30_000;
const EASE_LAYOUT = 'cubic-bezier(.3,.9,.3,1)';

const CSS = `
.yk-ask{width:min(640px,100%);display:flex;align-items:center;gap:8px;padding:7px 7px 7px 16px;border-radius:14px;
  background:linear-gradient(180deg,rgba(255,255,255,.74),rgba(240,246,252,.62));
  border:1px solid rgba(255,255,255,.9);box-shadow:0 2px 4px rgba(24,44,70,.06),0 26px 48px -24px rgba(24,44,70,.42),inset 0 1px 0 rgba(255,255,255,.9);
  backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  animation:yk-ask-in 260ms cubic-bezier(.2,.8,.3,1) both}
.yk-ask.yk-ask-out{animation:yk-ask-out 280ms cubic-bezier(.2,.8,.3,1) both}
.yk-ask input{flex:1;min-width:0;height:38px;border:0!important;background:transparent!important;box-shadow:none!important;padding:0;font-size:14px;color:var(--ink)}
.yk-ask input:focus{outline:none}
.yk-ask-send{height:38px;padding:0 22px;flex-shrink:0;background:var(--navy);color:#fff;font-family:var(--font-display);font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);filter:drop-shadow(0 6px 14px rgba(23,69,127,.38));transition:background-color 160ms ease,transform 160ms ease}
.yk-ask-send:hover:not(:disabled){background:var(--navy-2);transform:translateY(-1px)}
.yk-ask-send:disabled{background:var(--sand);color:var(--ink-3);filter:none}
.yk-hint{font-family:var(--font-display);font-weight:600;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);animation:yk-hint-in 600ms 1.4s ease both}
.yk-thread{display:flex;flex-direction:column;min-height:0;border-radius:14px;
  background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(245,250,254,.6));border:1px solid rgba(255,255,255,.85);
  box-shadow:0 1px 2px rgba(24,44,70,.05),0 10px 24px -16px rgba(24,44,70,.32);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
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
@keyframes yk-hint-in{from{opacity:0}to{opacity:1}}
@keyframes yk-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes yk-dot{0%,80%,100%{opacity:.35;transform:none}40%{opacity:1;transform:translateY(-2px)}}
@media (prefers-reduced-motion: reduce){.yk-ask,.yk-ask-out,.yk-hint,.yk-msg,.yk-dots i{animation:none!important}}
`;

export function AssistantStage() {
  const { company, companyId } = useCompany();
  const avatar = useRef<AssistantAvatarHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const avatarBoxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chat = useAssistantChat(companyId, company, avatar);

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
    setAskLeaving(false);
    setAskOpen(true);
    lastActivity.current = Date.now();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

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

  return (
    <div ref={stageRef} className="relative min-h-full flex flex-col xl:flex-row gap-4 xl:gap-5">
      <style>{CSS}</style>
      <HoloStyles />

      <div className="relative flex-1 min-w-0 flex flex-col items-center">
        {/* the projection pushes the orb down rather than covering it */}
        <div
          className="relative w-full max-w-[1040px] z-[2]"
          style={{ height: projecting ? 'min(58vh, 620px)' : 0, transition: `height 280ms ${EASE_LAYOUT}` }}
        >
          {projecting && <Hologram slides={slides} onClose={closeProjection} panelRef={panelRef} />}
        </div>

        <div
          ref={avatarBoxRef}
          className="relative w-full"
          style={{ height: projecting ? '24vh' : '70vh', minHeight: projecting ? 150 : 360, transition: `height 280ms ${EASE_LAYOUT}` }}
        >
          <AssistantAvatar
            ref={avatar}
            autoGreet
            label="Yukti 360 assistant"
            onOrbClick={openAsk}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <div className="w-full flex justify-center px-2" style={{ minHeight: 54 }}>
          {askOpen ? (
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
          ) : (
            <span className="yk-hint self-center">{hasThread ? 'Click the orb to reply' : 'Click the orb to talk'}</span>
          )}
        </div>
      </div>

      {hasThread && (
        <Transcript
          messages={chat.messages}
          busy={chat.busy}
          voice={chat.voice}
          onVoice={chat.setVoice}
          onClear={chat.clear}
        />
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
    <aside className="yk-thread w-full xl:w-[340px] xl:shrink-0 max-h-[44vh] xl:max-h-none xl:h-[calc(70vh+54px)]" aria-label="Conversation">
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
