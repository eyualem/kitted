// The share card's ready gate (handoff/14-share-card.md step 2, checks A1–A2; #352). The full-size copy that gets
// captured loads its own images; capturing before they're in would save a card with a blank photo. One gate per
// mounted copy (the screen makes a new one whenever version, face, tone or the font changes, and remounts the copy):
// it opens once `needed` images have loaded (at once when none are needed), and `wait` resolves true when it opens or
// false after its timeout, never a capture of a card that isn't the one in the preview.
export interface ReadyGate {
  /** One of the copy's images finished loading. */
  loaded(): void;
  isOpen(): boolean;
  /** Resolves true once open (at once if it already is), false if `ms` pass first. */
  wait(ms: number): Promise<boolean>;
}

/** `needed`: how many images the copy must load; Infinity keeps it shut (the font isn't loaded yet). */
export function createGate(needed: number): ReadyGate {
  let count = 0;
  let open = needed <= 0;
  const waiters = new Set<() => void>();
  return {
    loaded() {
      count += 1;
      if (!open && count >= needed) {
        open = true;
        for (const w of waiters) w();
        waiters.clear();
      }
    },
    isOpen: () => open,
    wait(ms: number) {
      if (open) return Promise.resolve(true);
      return new Promise<boolean>((resolve) => {
        const done = () => {
          clearTimeout(timer);
          resolve(true);
        };
        const timer = setTimeout(() => {
          waiters.delete(done);
          resolve(false);
        }, ms);
        waiters.add(done);
      });
    },
  };
}

/** How long Share and Save wait for the copy before saying "Couldn't make the image. Try again." */
export const READY_WAIT_MS = 4000;
