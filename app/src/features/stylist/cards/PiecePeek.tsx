// The piece peek (09-ui-review §28.3, #371): a fix row that names a closet piece is pressable; a tap floats a small
// card over the row with the piece's drawing, its name, "Worn 4 times" and "Open piece". It's drawn in a transparent
// Modal at the row's measured spot (like MorphPicker), so nothing in the thread clips it. Tap anywhere else to close.
import * as Haptics from 'expo-haptics';
import { useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KText, TextLink, opacity, shadow, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { openPiece } from '@/features/closet/pieceActions';
import { peekFrame, peekLines, type Rect } from './fixPeek';

const MS_OPEN = 200;
const MS_CLOSE = 150;
const TILE = 104;
const POINTER = 12;

/** A fix row that shows its piece on a tap. With no piece it's the row as it was. */
export function PeekRow({ item, children }: { item: ClosetItemRow | null; children: ReactNode }) {
  const ref = useRef<View>(null);
  const [row, setRow] = useState<Rect | null>(null);
  if (!item) return <>{children}</>;
  const open = () => {
    ref.current?.measureInWindow((x, y, w, h) => {
      if (Platform.OS === 'ios') void Haptics.selectionAsync();
      setRow({ x, y, w, h });
    });
  };
  return (
    <>
      <Pressable ref={ref} onPress={open} accessible={false} style={({ pressed }) => ({ opacity: pressed && !row ? opacity.pressed : 1 })}>
        {children}
      </Pressable>
      {row ? <PiecePeek item={item} row={row} onClosed={() => setRow(null)} /> : null}
    </>
  );
}

function PiecePeek({ item, row, onClosed }: { item: ClosetItemRow; row: Rect; onClosed: () => void }) {
  const { colors, scheme, a11y } = useTheme();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState<number | null>(null);
  const p = useSharedValue(0);
  const lines = peekLines(item);
  const frame = h !== null ? peekFrame(row, h, win, insets) : null;
  const still = a11y.reduceMotion;

  const show = (height: number) => {
    if (h !== null) return;
    setH(height);
    p.set(withTiming(1, { duration: still ? 0 : MS_OPEN, easing: Easing.out(Easing.cubic) }));
  };
  const close = (then?: () => void) => {
    p.set(withTiming(0, { duration: still ? 0 : MS_CLOSE, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) runOnJS(onClosed)();
    }));
    then?.();
  };
  const open = () => close(() => openPiece(item));

  // Grows from the row's side of the peek: its bottom edge when it sits above, its top when below.
  const card = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: interpolate(p.value, [0, 1], [frame?.above === false ? -6 : 6, 0]) },
      { scale: still ? 1 : interpolate(p.value, [0, 1], [0.92, 1]) },
    ],
  }));
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));

  // The pointer sits over the row's middle, inside the card's rounded corners.
  const pointerX = frame ? Math.min(Math.max(18, row.x + row.w / 2 - frame.x - POINTER / 2), frame.w - 18 - POINTER) : 0;

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => close()} statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={() => close()} accessibilityRole="button" accessibilityLabel={lines.name}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(18,22,40,0.06)' }, scrim]} />
      </Pressable>
      <Animated.View
        onLayout={(e) => show(e.nativeEvent.layout.height)}
        accessibilityViewIsModal
        style={[
          {
            position: 'absolute', left: frame?.x ?? 0, top: frame?.y ?? -1000, width: frame?.w ?? Math.min(280, win.width - 32),
            borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
            boxShadow: scheme === 'dark' ? '0px 12px 32px rgba(0,0,0,0.45)' : shadow.card,
            paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', gap: 10,
          },
          card,
        ]}
      >
        {frame ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', left: pointerX, width: POINTER, height: POINTER, backgroundColor: colors.surface,
              borderColor: colors.line, transform: [{ rotate: '45deg' }],
              ...(frame.above
                ? { bottom: -POINTER / 2 - 0.5, borderRightWidth: 1, borderBottomWidth: 1 }
                : { top: -POINTER / 2 - 0.5, borderLeftWidth: 1, borderTopWidth: 1 }),
            }}
          />
        ) : null}
        <Pressable onPress={open} accessible={false}>
          <ClosetTile item={item} size={TILE} decorative />
        </Pressable>
        <View style={{ alignItems: 'center', gap: 2, alignSelf: 'stretch' }} accessible accessibilityLabel={[lines.name, lines.worn].filter(Boolean).join('. ')}>
          <KText variant="callout" weight="600" style={{ textAlign: 'center' }}>{lines.name}</KText>
          {lines.worn ? <KText variant="footnote" color="ink2" style={{ textAlign: 'center' }}>{lines.worn}</KText> : null}
        </View>
        <TextLink title={`${lines.open} ›`} accessibilityLabel={lines.open} onPress={open} compact />
      </Animated.View>
    </Modal>
  );
}
