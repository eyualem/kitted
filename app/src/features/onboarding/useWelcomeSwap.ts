// T38 · Runs Welcome's swap once per mount (DESIGN.md phone 2). The frames come from welcomeSwapFrame (pure); this hook
// only owns the clock: a requestAnimationFrame loop from the time of mount, stretched by -demoRevealSlow in demo
// builds, stopped once the frame says done. Elapsed time only grows, so coming back from the background lands on the
// after state instead of replaying, and only a new mount plays it again. Nothing is stored.
import { useEffect, useRef, useState } from 'react';
import { revealSlow } from '@/features/fitcheck/reveal';
import { welcomeAfterFrame, welcomeMotion, welcomeSwapFrame, type WelcomeExample, type WelcomeSwapFrame } from './welcomeExample';

const same = (a: WelcomeSwapFrame, b: WelcomeSwapFrame) =>
  a.numeral === b.numeral && a.pieceAfter === b.pieceAfter && a.textAfter === b.textAfter && a.done === b.done;

/** 'still' (Reduce Motion or an accessibility size) → the after frame from the first render, no timer. 'play' → the
 *  frames of the swap, then the after frame. If motion turns off mid-play it jumps to the after state and stays there.
 *  null when there is no example. */
export function useWelcomeSwap(
  ex: WelcomeExample | null,
  o: { reduceMotion: boolean; accessibilitySize: boolean },
): WelcomeSwapFrame | null {
  const mode = welcomeMotion(o);
  const [frame, setFrame] = useState<WelcomeSwapFrame | null>(() =>
    ex ? (mode === 'still' ? welcomeAfterFrame(ex) : welcomeSwapFrame(0, ex)) : null,
  );
  /** When this mount's swap started (performance.now()), set by the first play. */
  const startedAt = useRef<number | null>(null);
  /** Motion was turned off once: the swap is over for this mount. */
  const halted = useRef(mode === 'still');

  useEffect(() => {
    if (!ex) return;
    if (mode === 'still') {
      halted.current = true;
      return;
    }
    let id: number | null = null;
    const tick = () => {
      if (halted.current) {
        setFrame(welcomeAfterFrame(ex));
        id = null;
        return;
      }
      startedAt.current ??= performance.now();
      const next = welcomeSwapFrame((performance.now() - startedAt.current) / revealSlow(), ex);
      setFrame((prev) => (prev && same(prev, next) ? prev : next));
      id = next.done ? null : requestAnimationFrame(tick);
    };
    startedAt.current ??= performance.now();
    id = requestAnimationFrame(tick);
    return () => {
      if (id !== null) cancelAnimationFrame(id);
    };
  }, [ex, mode]);

  if (!ex) return null;
  if (mode === 'still') return welcomeAfterFrame(ex);
  return frame;
}
