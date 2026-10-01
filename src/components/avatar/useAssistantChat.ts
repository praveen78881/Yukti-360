import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { runAgent, type CarpMessage, type ToolCall } from '@/lib/carp/agent';
import type { ToolResult } from '@/lib/carp/tools';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';
import type { AssistantAvatarHandle } from './types';

/* ── The dashboard assistant's conversation ────────────────────────────────
   The brain is the app's existing agent — the same runAgent CarpPanel (Aleza)
   uses, with the same tools. This hook adds only what the orb needs: the
   face it wears at each stage, the spoken reply, and a transcript that is
   remembered per company. */

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** short labels for what the assistant did ("Projected: Trial Balance") */
  tools?: string[];
  error?: boolean;
}

const threadKey = (companyId: string) => `yukti360.assistant.thread.${companyId}`;
const VOICE_KEY = 'yukti360.assistant.voice';
const MAX_KEPT = 80;
const SPEAK_LIMIT = 320;

function loadThread(companyId: string): ThreadMessage[] {
  if (!companyId) return [];
  try {
    const raw = localStorage.getItem(threadKey(companyId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveThread(companyId: string, msgs: ThreadMessage[]) {
  if (!companyId) return;
  try {
    if (msgs.length) localStorage.setItem(threadKey(companyId), JSON.stringify(msgs.slice(-MAX_KEPT)));
    else localStorage.removeItem(threadKey(companyId));
  } catch { /* storage full or blocked — the conversation still works, it just isn't remembered */ }
}

function readVoicePref(): boolean {
  const available = typeof window !== 'undefined' && 'speechSynthesis' in window;
  try {
    const v = localStorage.getItem(VOICE_KEY);
    return v === null ? available : v === '1';
  } catch {
    return available;
  }
}

/** Same wording the Aleza panel uses, so both surfaces fail the same way. */
function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message.toLowerCase() : '';
  if (raw.includes('quota') || raw.includes('rate') || raw.includes('limit') || raw.includes('429'))
    return "You've reached the usage limit for now. Please wait a minute and try again.";
  if (raw.includes('api key') || raw.includes('auth') || raw.includes('401') || raw.includes('403') || raw.includes('missing'))
    return "There's a connection issue with the AI service. Please check the API key in Settings.";
  if (raw.includes('network') || raw.includes('fetch') || raw.includes('offline'))
    return "Looks like there's a network issue. Please check your connection and try again.";
  return 'Something went wrong on our end. Please try again in a moment.';
}

function toolLabel(call: ToolCall, result?: ToolResult): string {
  if (call.name === 'show_on_projector') {
    const shown = (result?.data as { projecting?: string[] } | undefined)?.projecting;
    return result?.success && shown?.length ? `Projected: ${shown.join(', ')}` : 'Projector unavailable';
  }
  if (call.name === 'navigate_to_page') return `Opened ${String(call.args.page ?? '')}`;
  const words = call.name.replace(/_/g, ' ');
  return result && !result.success ? `Tried ${words}` : words.charAt(0).toUpperCase() + words.slice(1);
}

/** What the voice should say: prose only, no markdown, no tables, and short. */
function speakable(text: string): string {
  const prose = text
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('|'))
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (prose.length <= SPEAK_LIMIT) return prose;
  const cut = prose.slice(0, SPEAK_LIMIT);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trim()}…`;
}

interface CompanyLike { name: string; entity_type: string }

export function useAssistantChat(
  companyId: string,
  company: CompanyLike | null | undefined,
  avatar: RefObject<AssistantAvatarHandle | null>,
) {
  const navigate = useNavigate();
  // Messages travel with the company they belong to, so switching companies
  // can never save one company's thread under another's key.
  const [state, setState] = useState(() => ({ companyId, messages: loadThread(companyId) }));
  const [busy, setBusy] = useState(false);
  const [talking, setTalking] = useState(false);
  const [voice, setVoiceState] = useState(readVoicePref);
  const busyRef = useRef(false);
  const voiceRef = useRef(voice);
  const settleTimer = useRef<number | undefined>(undefined);

  if (state.companyId !== companyId) {
    // render-time reset on company change (the React-recommended pattern)
    setState({ companyId, messages: loadThread(companyId) });
  }
  const messages = state.companyId === companyId ? state.messages : [];

  useEffect(() => {
    if (state.companyId === companyId) saveThread(state.companyId, state.messages);
  }, [state, companyId]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const append = useCallback((m: ThreadMessage) => {
    setState((s) => ({ ...s, messages: [...s.messages, m] }));
  }, []);

  const setVoice = useCallback((on: boolean) => {
    voiceRef.current = on;
    setVoiceState(on);
    try { localStorage.setItem(VOICE_KEY, on ? '1' : '0'); } catch { /* preference just won't stick */ }
    if (!on) avatar.current?.stopSpeaking();
  }, [avatar]);

  /** Say something with the face that goes with it, then settle. */
  const say = useCallback(async (text: string, mood: 'happy' | 'concerned') => {
    const a = avatar.current;
    if (!a) return;
    window.clearTimeout(settleTimer.current);
    a.setExpression(mood === 'happy' ? 'explaining' : 'concerned');
    setTalking(true);
    try {
      await a.speak(speakable(text), { synth: voiceRef.current });
    } finally {
      setTalking(false);
    }
    if (avatar.current !== a) return;
    a.setExpression(mood);
    settleTimer.current = window.setTimeout(() => {
      if (avatar.current === a && !a.speaking && a.expression === mood) a.setExpression('neutral');
    }, mood === 'happy' ? 2600 : 3400);
  }, [avatar]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current || !company || !companyId) return;
    busyRef.current = true;
    setBusy(true);
    const a = avatar.current;
    a?.stopSpeaking();
    window.clearTimeout(settleTimer.current);
    a?.setExpression('thinking');

    const history: CarpMessage[] = messages.map((m) => ({
      id: m.id, role: m.role, content: m.content, timestamp: m.timestamp,
    }));
    append({ id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() });

    const tools: string[] = [];
    let reply = '';
    let failed: unknown = null;
    try {
      const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label ?? company.entity_type;
      await runAgent(
        text,
        history,
        companyId,
        company.name,
        entityLabel,
        (path) => navigate(path),
        // The dashboard has no confirmation card, and runAgent executes
        // destructive tools unconfirmed when no handler is given — so decline
        // them here and point to the panel that can confirm.
        async (action) => {
          tools.push(`Needs confirmation in Aleza: ${action.summary}`);
          return false;
        },
        (step) => {
          step.toolCalls?.forEach((c, i) => tools.push(toolLabel(c, step.toolResults?.[i])));
          if (step.content.trim()) reply = step.content.trim();
        },
      );
    } catch (err) {
      console.error('Assistant error:', err);
      failed = err;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }

    if (failed) {
      const msg = friendlyError(failed);
      append({ id: crypto.randomUUID(), role: 'assistant', content: msg, timestamp: Date.now(), error: true });
      await say(msg, 'concerned');
      return;
    }
    if (!reply) reply = tools.length ? 'Done.' : "I don't have an answer for that yet.";
    append({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
      tools: tools.length ? [...new Set(tools)] : undefined,
    });
    await say(reply, 'happy');
  }, [append, avatar, company, companyId, messages, navigate, say]);

  const clear = useCallback(() => {
    avatar.current?.stopSpeaking();
    setState((s) => ({ ...s, messages: [] }));
  }, [avatar]);

  return { messages, busy, talking, send, clear, voice, setVoice };
}
