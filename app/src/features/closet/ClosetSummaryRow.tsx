// The card's closet row (02 D7, #91): up to 4 overlapping thumbs, "Added 3 to Closet · 1 question" (or
// "Checking the details…" while the closet call is out), and Review. The AddedRow look, with the new tiles.
// `slide` (SY2.2): a fresh check's card says when the row has landed; the thumbs of the pieces it added are measured
// and their copies slide into the Closet tab (slide.ts), or, off screen or with Reduce Motion, the badge alone. A card
// lands folded to its rating (#344), with the row out of sight: then the copies start on its ⌄.
import { useEffect, useRef, type RefObject } from 'react';
import { AppState, Dimensions, View } from 'react-native';
import { KText, TextLink, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { launch, noSlide, shouldSlide, type FlightPiece } from './slide';

/** The list scrolls the new card into view first: measure this long after the row landed. */
const SETTLE_MS = 150;
/** The dock (composer + tab bar) covers about this much of the screen's bottom (useReveal's BOTTOM_COVER). */
const BOTTOM_COVER = 110;
const THUMB = 28;

export interface RowSlide {
  checkId: string;
  /** The check was new to him when the card mounted (features/fitcheck/reveal.ts wasLive). */
  fresh: boolean;
  /** The card's reveal is over (or never ran): the row is in its place. */
  ready: boolean;
  /** The pieces this check added (not the ones it only matched); the closet call may still be out. */
  added: readonly string[];
  pending: boolean;
  /** The card is open: folded, the row is laid out but clipped out of sight, so the copies start at `foldAnchor`. */
  visible: boolean;
  /** The folded card's ⌄: the copies start on it, side by side as the row draws them. */
  foldAnchor?: RefObject<View | null>;
}

/** The row's thumbs, overlapping as drawn: each 28 pt, 20 pt apart. */
const STEP = THUMB - 8;

export function ClosetSummaryRow({ items, text, onReview, slide }: { items: ClosetItemRow[]; text: string; onReview?: () => void; slide?: RowSlide }) {
  const { colors, isAccessibilitySize, a11y } = useTheme();
  const shown = items.slice(0, 4);
  const thumbs = useRef<(View | null)[]>([]);
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
      if (!visible) {
        // Folded: the copies start on the card's ⌄, side by side, centred on it (clear of the summary above).
        const anchor = slide.foldAnchor?.current;
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
        const v = thumbs.current[i];
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
  return (
    <View style={isAccessibilitySize ? { gap: 6, alignItems: 'flex-start' } : { flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {items.length > 0 ? (
        <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {shown.map((it, i) => (
            <View
              key={it.id}
              ref={(v) => {
                thumbs.current[i] = v;
              }}
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i, borderRadius: 9.5, borderWidth: 1.5, borderColor: colors.surface }}
            >
              <ClosetTile item={it} size={THUMB} radius={8} scale={0.86} decorative />
            </View>
          ))}
        </View>
      ) : null}
      <KText role="addedRow" style={{ flexShrink: 1 }}>
        {text}
      </KText>
      {onReview ? (
        <View style={isAccessibilitySize ? undefined : { marginLeft: 'auto' }}>
          <TextLink title={t('card.review')} onPress={onReview} compact />
        </View>
      ) : null}
    </View>
  );
}
