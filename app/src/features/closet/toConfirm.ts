// The Closet's "To confirm" card (#111, #117; 09-ui-review §7 C2): at most 3 open "Same as your …?" questions at a
// time, newest first, so the questions never bury the clothes; answering one brings the next in. The card's count
// stays the number still waiting. Pure.

/** The most questions the card shows at once (#111). */
export const TO_CONFIRM_MAX = 3;

/** The questions the card shows now, and how many are waiting in all. */
export function toConfirm<T>(open: readonly T[]): { shown: T[]; total: number } {
  return { shown: open.slice(0, TO_CONFIRM_MAX), total: open.length };
}
