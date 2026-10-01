import { useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  AssistantAvatar,
  EXPRESSION_NAMES,
  GESTURE_NAMES,
  type AssistantAvatarHandle,
  type ExpressionName,
} from '@/components/avatar';

/* Dev playground for the procedural assistant avatar. Three instances at very
   different aspects prove the FOV-derived framing; every control is broadcast
   to all of them (only the large one uses the voice, so audio never doubles). */

const SAMPLE =
  'Hello! Your trial balance tallies. I found three purchase invoices without a GSTIN — shall I show you?';

export default function AvatarPlaygroundPage() {
  const main = useRef<AssistantAvatarHandle>(null);
  const header = useRef<AssistantAvatarHandle>(null);
  const tall = useRef<AssistantAvatarHandle>(null);
  const all = () => [main.current, header.current, tall.current].filter(Boolean) as AssistantAvatarHandle[];

  const [expr, setExpr] = useState<ExpressionName>('neutral');
  const [text, setText] = useState(SAMPLE);
  const [voice, setVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const pickExpression = (name: ExpressionName) => {
    setExpr(name);
    all().forEach((a) => a.setExpression(name));
  };

  const speak = async () => {
    setSpeaking(true);
    const [m, ...rest] = all();
    rest.forEach((a) => a.speak(text));
    await m?.speak(text, { synth: voice });
    rest.forEach((a) => a.stopSpeaking());
    setSpeaking(false);
  };

  const stop = () => {
    all().forEach((a) => a.stopSpeaking());
    setSpeaking(false);
  };

  return (
    <div className="min-h-screen app-surface">
      <div className="max-w-6xl mx-auto px-5 pt-[18px] pb-10">
        <PageHeader
          title="Assistant Avatar"
          description="A procedural orb — shell, visor, ear cups and face are all generated in code. Move the pointer over it; it follows."
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* wide card */}
          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">Wide card</span>
              <span className={speaking ? 'status-warn' : 'status-idle'}>{speaking ? 'Speaking' : expr}</span>
            </div>
            <AssistantAvatar ref={main} autoGreet style={{ width: '100%', height: 440 }} label="Assistant avatar, wide" />
          </section>

          <div className="flex flex-col gap-4">
            {/* header-size strip */}
            <section className="panel">
              <div className="panel-head"><span className="panel-title">Header strip</span></div>
              <div className="panel-body flex items-center gap-3">
                <AssistantAvatar ref={header} style={{ width: 64, height: 56 }} label="Assistant avatar, header" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[var(--ink)]">Aleza</p>
                  <p className="text-[11.5px] text-[var(--ink-3)]">Same component at 64 × 56</p>
                </div>
              </div>
            </section>

            {/* tall narrow box */}
            <section className="panel">
              <div className="panel-head"><span className="panel-title">Narrow column</span></div>
              <div className="panel-body grid place-items-center">
                <AssistantAvatar ref={tall} style={{ width: 150, height: 260 }} label="Assistant avatar, narrow" />
              </div>
            </section>
          </div>
        </div>

        {/* controls */}
        <section className="panel mt-4">
          <div className="panel-head"><span className="panel-title">Expressions</span></div>
          <div className="panel-body flex flex-wrap gap-2">
            {EXPRESSION_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => pickExpression(name)}
                className={`h-8 px-4 rounded-full font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors duration-[160ms] ${
                  expr === name
                    ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]'
                    : 'border-[1.5px] border-[var(--sand)] bg-white/70 text-[var(--ink-2)] hover:border-[var(--sand-2)] hover:text-[var(--navy)]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel mt-4">
          <div className="panel-head"><span className="panel-title">Gestures</span></div>
          <div className="panel-body flex flex-wrap gap-2">
            {GESTURE_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => all().forEach((a) => a.playGesture(name))}
                className="h-8 px-4 rounded-full font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] border-[1.5px] border-[var(--sand)] bg-white/70 text-[var(--ink-2)] hover:border-[var(--sand-2)] hover:text-[var(--navy)] transition-colors duration-[160ms]"
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel mt-4">
          <div className="panel-head">
            <span className="panel-title">Speech</span>
            <label className="flex items-center gap-2 text-[12px] text-[var(--ink-2)] cursor-pointer select-none">
              <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} />
              Use voice (speechSynthesis)
            </label>
          </div>
          <div className="panel-body flex flex-col gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <button onClick={speak} disabled={speaking || !text.trim()} className="btn-pill-primary disabled:opacity-60">
                Speak
              </button>
              <button onClick={stop} disabled={!speaking} className="btn-pill-outline disabled:opacity-60">
                Stop
              </button>
              <span className="text-[11.5px] text-[var(--ink-3)] ml-2">
                Without a voice the mouth runs at ~0.062 s per character; with one it anchors to real word boundaries.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
