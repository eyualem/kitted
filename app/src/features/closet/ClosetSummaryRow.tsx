// The card's closet row (02 D7, #91): up to 4 overlapping thumbs, "Added 3 to Closet · 1 question" (or
// "Checking the details…" while the closet call is out), and Review. The AddedRow look, with the new tiles.
// `slide` (SY2.2): a fresh check's card says when the row has landed; the thumbs of the pieces it added are measured
// and their copies slide into the Closet tab (slide.ts), or, off screen or with Reduce Motion, the badge alone.
import { useEffect, useRef } from 'react';
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
}

export function ClosetSummaryRow({ items, text, onReview, slide }: { items: ClosetItemRow[]; text: string; onReview?: () => void; slide?: RowSlide }) {
  const { colors, isAccessibilitySize, a11y } = useTheme();
  const shown = items.slice(0, 4);
  const thumbs = useRef<(View | null)[]>([]);
  const addedKey = slide?.added.join() ?? '';
  useEffect(() => {
    if (!slide?.fresh || !slide.ready || slide.pending) return;
    const { checkId } = slide;
    const added = new Set(slide.added);
    const flying = shown.map((it, i) => ({ it, i })).filter(({ it }) => added.has(it.id));
    if (flying.length === 0) {
      // Nothing it added (it only matched pieces he had): the badge doesn't change. Pieces it added that the card's
      // closet list hasn't loaded yet: wait for them.
      if (slide.added.length === 0) noSlide(checkId);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      const pieces: FlightPiece[] = [];
      let left = flying.length;
      for (const { it, i } of flying) {
        const v = thumbs.current[i];
        const done = (p: FlightPiece | null) => {
          if (p) pieces.push(p);
          if (--left > 0 || !alive) return;
          const H = Dimensions.get('window').height;
          const onScreen = pieces.length === flying.length && pieces.every((q) => q.y >= 40 && q.y + q.size <= H - BOTTOM_COVER) && AppState.currentState === 'active';
          if (shouldSlide({ fresh: true, readOnly: false, reduceMotion: a11y.reduceMotion, onScreen, pieces: pieces.length, checkId })) {
            launch({ checkId, pieces: [...pieces].sort((a, b) => a.x - b.x) });
          } else noSlide(checkId);
        };
        if (!v) done(null);
        // The thumb's frame has a 1.5 pt border round the 28 pt tile.
        else v.measureInWindow((x, y, w) => done(w > 0 ? { item: it, x: x + 1.5, y: y + 1.5, size: THUMB } : null));
      }
    }, SETTLE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // The row's pieces arrive by id; a re-render with the same ones changes nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.fresh, slide?.ready, slide?.pending, addedKey, shown.map((it) => it.id).join(), a11y.reduceMotion]);
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
