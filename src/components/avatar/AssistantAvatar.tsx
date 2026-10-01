import {
  Suspense,
  forwardRef,
  lazy,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { AvatarController } from './controller';
import type { AssistantAvatarHandle, ExpressionName } from './types';

/* ============================================================================
   The public component.

   NOTHING here imports three. The 3D scene is reached only through this lazy
   import, and it is not even requested until the avatar comes near the
   viewport — so a screen that never shows the avatar never pays the ~1MB.

   The controller lives on THIS side of the boundary, so `speak()` and
   `setExpression()` called before the scene finishes downloading are simply
   waiting for it when it arrives.
   ========================================================================== */

const AvatarScene = lazy(() => import('./AvatarScene'));

export interface AssistantAvatarProps {
  /** Drive the expression declaratively; the ref handle can also change it. */
  expression?: ExpressionName;
  /** Greet once — greeting expression + its enter gesture — when the scene first appears. */
  autoGreet?: boolean;
  /** Size the avatar through these: it fills its box, and the orb frames itself inside. */
  className?: string;
  style?: CSSProperties;
  /** Accessible name — the avatar is an image, not a control. */
  label?: string;
  /** A click that lands on the orb itself (raycast), not the empty canvas around it. */
  onOrbClick?: () => void;
}

/** How long a greeting holds before settling back to the resting expression. */
const GREETING_HOLD_MS = 2400;

export const AssistantAvatar = forwardRef<AssistantAvatarHandle, AssistantAvatarProps>(
  function AssistantAvatar({ expression, autoGreet = false, className, style, label, onOrbClick }, ref) {
    const host = useRef<HTMLDivElement>(null);
    const controller = useMemo(() => new AvatarController(), []);
    const [mounted, setMounted] = useState(false);   // scene requested
    const [inView, setInView] = useState(true);      // near the viewport
    const [tabVisible, setTabVisible] = useState(true);
    const rest = useRef<ExpressionName>(expression ?? 'neutral');
    const greeted = useRef(false);

    useImperativeHandle(
      ref,
      (): AssistantAvatarHandle => ({
        setExpression: (name) => controller.setExpression(name),
        playGesture: (name) => controller.playGesture(name),
        speak: (text, options) => controller.speak(text, options),
        stopSpeaking: () => controller.stopSpeaking(),
        flashExpression: (name, seconds) => controller.flashExpression(name, seconds),
        setProjecting: (on) => controller.setProjecting(on),
        get eyeAnchor() { return controller.eyeAnchor; },
        get expression() { return controller.expression; },
        get speaking() { return controller.speaking; },
      }),
      [controller],
    );

    useEffect(() => () => controller.dispose(), [controller]);

    /* Dev builds only: expose live controllers so the avatar can be inspected
       and tested from the console. Stripped from production. */
    useEffect(() => {
      if (!import.meta.env.DEV) return;
      const w = window as unknown as { __yuktiAvatars?: AvatarController[] };
      w.__yuktiAvatars = [...(w.__yuktiAvatars ?? []), controller];
      return () => { w.__yuktiAvatars = (w.__yuktiAvatars ?? []).filter((c) => c !== controller); };
    }, [controller]);

    /* Controlled expression. */
    useEffect(() => {
      rest.current = expression ?? 'neutral';
      if (expression) controller.setExpression(expression);
    }, [expression, controller]);

    /* Reduced motion: damp the movement, don't freeze it — a face that never
       blinks reads as broken, not calm. */
    useEffect(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const apply = () => controller.setCalm(mq.matches);
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }, [controller]);

    /* Load on approach; stop rendering entirely when scrolled away. */
    useEffect(() => {
      const el = host.current;
      if (!el || typeof IntersectionObserver === 'undefined') { setMounted(true); return; }
      const io = new IntersectionObserver(
        ([entry]) => {
          setInView(entry.isIntersecting);
          if (entry.isIntersecting) setMounted(true);
        },
        { rootMargin: '200px' },
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    /* A hidden tab should not spend frames on a face nobody can see. */
    useEffect(() => {
      const onVis = () => setTabVisible(!document.hidden);
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    /* Greet once, when the scene first draws — never again on re-entry, which
       would feel like being waved at every time you scroll past. */
    const onReady = useCallback(() => {
      if (!autoGreet || greeted.current) return;
      greeted.current = true;
      controller.setExpression('greeting');
      window.setTimeout(() => {
        if (controller.expression === 'greeting') controller.setExpression(rest.current);
      }, GREETING_HOLD_MS);
    }, [autoGreet, controller]);

    return (
      <div
        ref={host}
        className={className}
        role="img"
        aria-label={label ?? 'Assistant avatar'}
        style={{ position: 'relative', containerType: 'size', minHeight: 56, ...style }}
      >
        {mounted ? (
          <Suspense fallback={<AvatarPlaceholder />}>
            <AvatarScene controller={controller} active={inView && tabVisible} onReady={onReady} onOrbClick={onOrbClick} />
          </Suspense>
        ) : (
          <AvatarPlaceholder />
        )}
      </div>
    );
  },
);

/* A CSS stand-in with the same silhouette and the same size the 3D orb will
   take — 2 units inside a 3.5-unit fit ≈ 57% of the limiting side — so the
   swap doesn't jump. Container units make that true at any aspect. */
function AvatarPlaceholder() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: 'min(57cqw, 57cqh)',
          aspectRatio: '1',
          marginTop: '-3cqh',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 66% 24%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 20%),' +
            'linear-gradient(180deg, transparent 37%, #030407 37%, #030407 56%, transparent 56%),' +
            'radial-gradient(circle at 50% 42%, #1A1D24 0%, #0A0B0F 55%, #05060A 100%)',
          boxShadow: '0 2cqh 5cqh -2.5cqh rgba(10,31,62,0.55)',
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export default AssistantAvatar;
