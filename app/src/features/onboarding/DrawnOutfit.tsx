// T38 · The drawn-outfit view (the spec's "drawn-outfit view built on flats.ts") and the Example check's drawn bubble.
// Each piece is Closet's own drawing (GarmentArt: artSpec + renderFlat), placed by Welcome's base box or by
// StandingOutfit's tile ratios (outfitDrawing.ts). Decorative: hidden from VoiceOver, no touch handling. On Welcome one
// piece can cross-fade to its after drawing (the top fix's swap).
//
// DrawnOutfitBubble re-creates PhotoBubble's frame from the same tokens (Chat.tsx is in the design system, outside this
// lane; T38 technical default 4, follow-up: let PhotoBubble take children and use it here).
import { Fragment } from 'react';
import { View } from 'react-native';
import { KText, radius, size, useTheme } from '@/design-system';
import { GarmentArt } from '@/features/closet/GarmentArt';
import { tilePlacement, welcomePlacement, WELCOME_BOX, type DrawnPiece, type DrawnSlot, type Placement } from './outfitDrawing';

export interface DrawnOutfitProps {
  pieces: readonly DrawnPiece[];
  layout: { kind: 'welcome'; k: number } | { kind: 'tile'; width: number; height: number };
  /** Welcome's swap: the after piece for one slot, drawn over the before piece. */
  swap?: { piece: DrawnPiece; opacity: number } | null;
  testID?: string;
}

/** Drawn back to front as StandingOutfit does: the core column in body order (shoes over the trouser hems), then the
 *  layer at the side over them. */
const PAINT_ORDER: readonly DrawnSlot[] = ['top', 'bottom', 'shoes', 'outer'];

function Piece({ piece, at, opacity, testID }: { piece: DrawnPiece; at: Placement; opacity: number; testID: string }) {
  return (
    <View testID={testID} pointerEvents="none" style={{ position: 'absolute', left: at.left, top: at.top, width: at.size, height: at.size, opacity }}>
      <GarmentArt spec={piece.spec} size={at.size} />
    </View>
  );
}

export function DrawnOutfit({ pieces, layout, swap, testID }: DrawnOutfitProps) {
  const { colors } = useTheme();
  const place = (slot: DrawnSlot) =>
    layout.kind === 'welcome' ? welcomePlacement(slot, layout.k) : tilePlacement(slot, layout.width, layout.height);
  const box =
    layout.kind === 'welcome'
      ? { width: WELCOME_BOX.width * layout.k, height: WELCOME_BOX.height * layout.k }
      : {
          width: layout.width,
          height: layout.height,
          backgroundColor: colors.surface2,
          borderTopLeftRadius: radius.photoBubbleInner,
          borderTopRightRadius: radius.photoBubbleInner,
          borderBottomRightRadius: radius.photoBubbleInnerTail,
          borderBottomLeftRadius: radius.photoBubbleInner,
          borderCurve: 'continuous' as const,
          overflow: 'hidden' as const,
        };
  const ordered = PAINT_ORDER.flatMap((slot) => pieces.filter((p) => p.slot === slot));
  return (
    <View testID={testID} style={box} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ordered.map((p) => {
        const at = place(p.slot);
        const after = swap && swap.piece.slot === p.slot ? swap : null;
        const beforeOpacity = after ? 1 - after.opacity : 1;
        return (
          <Fragment key={p.slot}>
            {beforeOpacity > 0 ? <Piece piece={p} at={at} opacity={beforeOpacity} testID={`drawn-piece-${p.slot}`} /> : null}
            {after && after.opacity > 0 ? <Piece piece={after.piece} at={at} opacity={after.opacity} testID={`drawn-piece-${p.slot}-after`} /> : null}
          </Fragment>
        );
      })}
    </View>
  );
}

export interface DrawnOutfitBubbleProps {
  pieces: readonly DrawnPiece[];
  /** "Everyday" */
  occasion: string;
  /** "Example" */
  time: string;
  /** drawnOutfitA11y(pieces, occasion) */
  label: string;
  testID?: string;
}

/** PhotoBubble's frame (135 wide, 4 padding, `me` fill, radii 21 with the 6 tail bottom right) around a 127 × 172
 *  drawn tile, with PhotoBubble's caption row; at accessibility sizes the caption moves under the bubble, as
 *  PhotoBubble does. One VoiceOver image; not tappable. */
export function DrawnOutfitBubble({ pieces, occasion, time, label, testID }: DrawnOutfitBubbleProps) {
  const { colors, isAccessibilitySize } = useTheme();
  const below = isAccessibilitySize;
  const innerW = size.photoBubbleWidth - 8;
  const bubble = (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-end',
        width: size.photoBubbleWidth,
        padding: 4,
        backgroundColor: colors.me,
        borderTopLeftRadius: radius.photoBubble,
        borderTopRightRadius: radius.photoBubble,
        borderBottomLeftRadius: radius.photoBubble,
        borderBottomRightRadius: radius.bubbleTail,
        borderCurve: 'continuous',
      }}
    >
      <DrawnOutfit pieces={pieces} layout={{ kind: 'tile', width: innerW, height: size.photoBubbleHeight }} />
      {below ? null : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingTop: 6,
            paddingBottom: 5,
            paddingHorizontal: 9,
            opacity: 0.9,
            gap: 4,
          }}
        >
          <KText role="photoCaption" numberOfLines={2} style={{ flexShrink: 1 }}>
            {occasion}
          </KText>
          <KText role="photoCaption" tabular numberOfLines={1} style={{ flexShrink: 0 }}>
            {time}
          </KText>
        </View>
      )}
    </View>
  );
  if (!below) return bubble;
  return (
    <View style={{ alignSelf: 'flex-end', alignItems: 'flex-end', gap: 4, maxWidth: '88%' }}>
      {bubble}
      {/* The bubble's label already says all of it. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <KText role="dayStamp" color="ink2" style={{ textAlign: 'right', flexShrink: 1 }}>
          {`${occasion} · ${time}`}
        </KText>
      </View>
    </View>
  );
}
