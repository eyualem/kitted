// The tour's examples (specs/app-tour.md AT1, AT2; tasks/T118/DESIGN.md): three drawn looks, Welcome's outfit on top and
// two more neutral everyday outfits, from readings the app already bundles (p01b, s05). Each look's score and word are
// the scoring code's own output for its reading, run the way Welcome's card is (Everyday, no picks, an empty closet, a
// first check), never typed in (AT2.2). The example closet is every piece of the three looks, head to toe. Pure: nothing
// is stored or sent, and the screens draw these in place of the empty states while the tour is up.
import { FAMILY_HEX, UNKNOWN_HEX, type Reading } from '@kitted/core';
import type { ClosetTileProps } from '@/features/closet/ClosetTile';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { displayScore, scoreWordLabel } from '@/design-system/score';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { WELCOME_READING } from './exampleCheck';
import { drawnPieces, type DrawnPiece, type DrawnSlot } from './outfitDrawing';

/** Lookbook's order, newest on top: Welcome's outfit, then the two new ones. The look lands last on top, so the rows
 *  slide in from the bottom row up. */
export const EXAMPLE_READING_IDS: readonly string[] = [WELCOME_READING, 'p01b', 's05'];

export interface ExampleLook {
  readingId: string;
  reading: Reading;
  pieces: DrawnPiece[];
  score: number;
  /** The score as shown ("7.5"). */
  scoreText: string;
  /** The score's word ("Put together"). */
  word: string;
}

let cached: ExampleLook[] | undefined;

/** The score the app gives a first check of this reading at Everyday with nothing picked and an empty closet (what
 *  exampleCheck() does for Welcome's), or null when it doesn't score. */
export function scoreExample(reading: Reading): number | null {
  const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
  return ev.row.status === 'scored' ? ev.row.score : null;
}

/** The example looks, newest first. A reading that is missing or doesn't score is left out (the rest still show; the
 *  AT2.2 test fails the build first). Memoised. */
export function exampleLooks(): ExampleLook[] {
  if (cached) return cached;
  cached = EXAMPLE_READING_IDS.flatMap((readingId) => {
    const reading = demoReadingById(readingId);
    if (!reading) return [];
    const score = scoreExample(reading);
    const pieces = drawnPieces(reading);
    if (score === null || pieces.length === 0) return [];
    return [{ readingId, reading, pieces, score, scoreText: displayScore(score), word: scoreWordLabel(score) }];
  });
  return cached;
}

/** Closet's sections, head to toe. */
const SECTION_ORDER: readonly DrawnSlot[] = ['outer', 'top', 'bottom', 'shoes'];

export interface ExampleSection {
  slot: DrawnSlot;
  /** Closet's section key, `closet.section.<slot>`. */
  titleKey: `closet.section.${DrawnSlot}`;
  pieces: { id: string; name: string; item: ClosetTileProps['item'] }[];
}

/** Every piece of the example looks as Closet's tiles, in its sections (Jackets and layers, Tops, Bottoms, Shoes). The
 *  order inside a section is the looks' order, so the drop runs in a steady wave. */
export function exampleCloset(looks: readonly ExampleLook[] = exampleLooks()): ExampleSection[] {
  return SECTION_ORDER.flatMap((slot) => {
    const pieces = looks.flatMap((l) => l.pieces.filter((p) => p.slot === slot).map((p) => ({
      id: `${l.readingId}:${slot}`,
      name: p.name,
      item: { garment: p.garment, hex: FAMILY_HEX[String(p.garment.color_family)] ?? UNKNOWN_HEX, art: null, name: p.name, isPhotographed: true },
    })));
    return pieces.length > 0 ? [{ slot, titleKey: `closet.section.${slot}` as const, pieces }] : [];
  });
}

export function exampleClosetCount(sections: readonly ExampleSection[]): number {
  return sections.reduce((n, s) => n + s.pieces.length, 0);
}
