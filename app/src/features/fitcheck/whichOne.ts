// "Which one is you?" (02 S23, Oct 14): a photo with two people of comparable size. Nothing is sent until he taps
// himself; then the check runs with everyone else covered in what's sent. The question is a stylist card in the
// thread (cardType 'question'); its photo is his temporary original (the picker's or camera's file), which photo prep
// deletes once it's used. Kept apart from service.ts so boot can import it without the whole fit-check stack.
import type { KittedStore } from '@/data/store';
import type { ChatMessage, OccasionKey, StyleKey } from '@/data/types';
import type { CheckMode } from './machine';
import type { PersonBox } from '@/services/imagePrep/demo';

export interface WhichOnePayload {
  question: 'whichOne';
  /** 'open' until he taps someone ('picked', while the check starts) or Cancel (the message is then deleted). */
  state: 'open' | 'picked';
  /** His temporary original (absolute file uri): shown on the card, prepped again with the person he taps. */
  photoUri: string;
  /** Demo screens only: a bundled photo instead (its boxes are drawn for the demo). */
  photoId?: string;
  /** width / height of the upright photo. */
  aspect: number | null;
  /** Everyone he could be (the biggest first), normalized, origin top-left. */
  people: PersonBox[];
  mode: CheckMode;
  parentCheckId: string | null;
  /** The lens the check was started with (the morning card's), only what was set. */
  occasion?: OccasionKey;
  style?: StyleKey | null;
}

export function whichOneOf(m: Pick<ChatMessage, 'cardType' | 'payload'> | null | undefined): WhichOnePayload | null {
  if (!m || m.cardType !== 'question' || m.payload.question !== 'whichOne') return null;
  const p = m.payload as unknown as WhichOnePayload;
  return typeof p.photoUri === 'string' && Array.isArray(p.people) ? p : null;
}

/** The people in the order they stand, left to right (VoiceOver and the tap targets): [index into people, box]. */
export function leftToRight(people: readonly PersonBox[]): [number, PersonBox][] {
  return people.map((b, i) => [i, b] as [number, PersonBox]).sort((a, b) => a[1].x + a[1].width / 2 - (b[1].x + b[1].width / 2) || a[0] - b[0]);
}

/** "Which one is you?" questions are dropped: the message deleted and its temporary photo discarded. A new photo drops
 *  the waiting ones (`onlyOpen`; one being picked right now cleans up after its own check); at launch, all of them
 *  (their photo may be gone). Nothing was sent or counted for any of them. */
export async function dropWhichOne(store: KittedStore, discard: (uri: string) => void, opts: { onlyOpen: boolean }): Promise<number> {
  let n = 0;
  for (const m of await store.chat.all()) {
    const q = whichOneOf(m);
    if (!q || (opts.onlyOpen && q.state !== 'open')) continue;
    await store.chat.delete(m.id);
    try {
      discard(q.photoUri);
    } catch {
      // already gone
    }
    n += 1;
  }
  return n;
}
