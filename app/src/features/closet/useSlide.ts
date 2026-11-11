// The slide into Closet's start (SY2.2, slide.ts): once a fresh check's card has landed, the copies of the pieces it
// added start from the card's `Added {n} to Closet` row when it shows, otherwise from the card's bottom edge (a card
// folded to its rating, #344, or a re-check card, which has no row): side by side, as the row draws them. Then the
// copies slide (the row on screen, Reduce Motion off) or the badge alone.
import { useEffect, type RefObject } from 'react';
import { AppState, Dimensions, type View } from 'react-native';
import { useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { launch, noSlide, shouldSlide, type FlightPiece } from './slide';

/** The list scrolls the new card into view first: measure this long after the card landed. */
const SETTLE_MS = 150;
/** The dock (composer + tab bar) covers about this much of the screen's bottom (useReveal's BOTTOM_COVER). */
const BOTTOM_COVER = 110;
/** The row's thumbs: 28 pt, overlapping by 8. */
export const THUMB = 28;
const STEP = THUMB - 8;

export interface SlideSource {
  checkId: string;
  /** The check was new to him when the card mounted (features/fitcheck/reveal.ts wasLive). */
  fresh: boolean;
  /** The card's reveal is over (or never ran): it's in its place. */
  ready: boolean;
  /** The pieces this check added (not the ones it only matched); the closet call may still be out. */
  added: readonly string[];
  pending: boolean;
  /** The row's thumbs are in sight (an open card). Otherwise the copies start at `edge`. */
  visible: boolean;
  /** The card's bottom edge (a folded card's ⌄, a re-check card's foot): the copies start on it, centred. */
  edge?: RefObject<View | null>;
}

type Piece = Pick<ClosetItemRow, 'id' | 'garment' | 'hex' | 'art' | 'name' | 'isPhotographed'>;

/** `shown`: the pieces the card draws (at most 4), in order; `thumbs`: their views in the row, when it has one. */
export function useSlideIntoCloset(slide: SlideSource | undefined, shown: readonly Piece[], thumbs?: RefObject<(View | null)[]>): void {
  const { a11y } = useTheme();
  const addedKey = slide?.added.join() ?? '';
  useEffect(() => {
    if (!slide?.fresh || !slide.ready || slide.pending) return;
    const { checkId, visible } = slide;
    const added = new Set(slide.added);
    const flying = shown.map((it, i) => ({ it, i })).filter(({ it }) => added.has(it.id));
    if (flying.length === 0) {
      // Nothing it added (it only matched pieces he had): the badge doesn't change. Pieces it added that the card's
      // closet list hasn't loaded yet: wait for them.
      if (slide.added.length === 0) noSlide(checkId);
      return;
    }
    let alive = true;
    const decide = (pieces: FlightPiece[]) => {
      if (!alive) return;
      const H = Dimensions.get('window').height;
      const onScreen = pieces.length === flying.length && pieces.every((q) => q.y >= 40 && q.y + q.size <= H - BOTTOM_COVER) && AppState.currentState === 'active';
      if (shouldSlide({ fresh: true, readOnly: false, reduceMotion: a11y.reduceMotion, onScreen, pieces: pieces.length, checkId })) {
        launch({ checkId, pieces: [...pieces].sort((p, q) => p.x - q.x) });
      } else noSlide(checkId);
    };
    const timer = setTimeout(() => {
      if (!visible || !thumbs) {
        // No row in sight: the copies start on the card's bottom edge, side by side, centred on it.
        const anchor = slide.edge?.current;
        if (!anchor) return decide([]);
        anchor.measureInWindow((x, y, w, h) => {
          const width = THUMB + STEP * (flying.length - 1);
          const left = x + w / 2 - width / 2;
          const top = y + h / 2 - THUMB / 2;
          decide(w > 0 ? flying.map(({ it }, i) => ({ item: it, x: left + i * STEP, y: top, size: THUMB })) : []);
        });
        return;
      }
      const pieces: FlightPiece[] = [];
      let left = flying.length;
      for (const { it, i } of flying) {
        const v = thumbs.current?.[i];
        const done = (p: FlightPiece | null) => {
          if (p) pieces.push(p);
          if (--left === 0) decide(pieces);
        };
        // The thumb's frame has a 1.5 pt border round the 28 pt tile.
        if (!v) done(null);
        else v.measureInWindow((x, y, w) => done(w > 0 ? { item: it, x: x + 1.5, y: y + 1.5, size: THUMB } : null));
      }
    }, SETTLE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // The row's pieces arrive by id; a re-render with the same ones changes nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.fresh, slide?.ready, slide?.pending, slide?.visible, addedKey, shown.map((it) => it.id).join(), a11y.reduceMotion]);
}
