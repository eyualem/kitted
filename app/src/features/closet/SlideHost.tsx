// The slide into Closet's layer (SY2.2, slide.ts): above the tabs and the iOS tab bar, never touchable. Each copy of a
// row's picture eases from its thumb to the Closet tab, shrinking and fading as it gets there, 40 ms after the one
// before; one light haptic as the last one lands. Nothing else is drawn (no line, no trail).
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { ClosetTile } from './ClosetTile';
import { closetTabPoint, FLIGHT_MS, landed, STAGGER_MS, useFlights, type Flight, type FlightPiece } from './slide';

export function SlideHost() {
  const flights = useFlights();
  if (flights.length === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {flights.map((f) => <FlightView key={f.checkId} flight={f} />)}
    </View>
  );
}

function FlightView({ flight }: { flight: Flight }) {
  const total = FLIGHT_MS + STAGGER_MS * (flight.pieces.length - 1);
  useEffect(() => {
    const done = setTimeout(() => {
      if (Platform.OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      landed(flight.checkId);
    }, total);
    return () => clearTimeout(done);
  }, [flight.checkId, total]);
  return flight.pieces.map((p, i) => <Copy key={p.item.id} piece={p} delay={i * STAGGER_MS} />);
}

function Copy({ piece, delay }: { piece: FlightPiece; delay: number }) {
  const { width, height } = useWindowDimensions();
  const to = closetTabPoint(width, height);
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.cubic) })));
  }, [p, delay]);
  const half = piece.size / 2;
  const dx = to.x - (piece.x + half);
  const dy = to.y - (piece.y + half);
  const style = useAnimatedStyle(() => {
    const v = p.get();
    return {
      // A slight lift first, so it reads as leaving the card rather than sliding along it.
      transform: [{ translateX: dx * v }, { translateY: dy * v - Math.sin(v * Math.PI) * 24 }, { scale: 1 - 0.55 * v }],
      opacity: v < 0.6 ? 1 : 1 - (v - 0.6) / 0.4,
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: piece.x, top: piece.y }, style]}>
      <ClosetTile item={piece.item} size={piece.size} radius={8} scale={0.86} decorative />
    </Animated.View>
  );
}
