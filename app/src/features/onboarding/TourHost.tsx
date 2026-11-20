// The tour over the tabs (specs/app-tour.md AT1–AT3): mounted once at the root, beside the slide into Closet. It moves
// the app between the tabs as the stop changes (Closet, Lookbook, then Stylist when the tour ends) and draws the card
// just above the tab bar. The tab bar is dimmed and untouchable while it's up (app/(tabs)/_layout.tsx disables its
// items), and the examples are inert drawings, so the card is the only thing that responds. The tour saves nothing.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { endTour, nextStop, useTourStop, type TourStop } from './appTour';
import { TourCard } from './TourCard';

/** The floating tab bar's height above the safe area, and the air between it and the card. */
const BAR = 49;
const GAP = 12;

const ROUTES: Record<TourStop, '/closet' | '/lookbook'> = { 1: '/closet', 2: '/lookbook' };

export function TourHost() {
  const stop = useTourStop();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const before = useRef<TourStop | null>(null);
  const [cardH, setCardH] = useState(0);
  useEffect(() => {
    const prev = before.current;
    before.current = stop;
    if (stop !== null) router.navigate(ROUTES[stop]);
    // The tour just ended (Skip or Done): back to Stylist, where Kit's hello and offer are waiting (AT3).
    else if (prev !== null) router.navigate('/stylist');
  }, [stop]);
  if (stop === null) return null;
  const barTop = insets.bottom + BAR;
  const bottom = barTop + GAP;
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Screen colour behind the card and down to the tab bar, so the list doesn't peek out around its corners. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: barTop, height: cardH + GAP + 6, backgroundColor: colors.bg }} />
      {/* The header's buttons (Closet's +) out of reach too (AT3.3): a transparent block over the navigation bar. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 56 }} />
      {/* The tab bar dimmed and out of reach (AT3): a screen-coloured veil over it that takes the touch. The native bar
          draws above the screens, so its items are also disabled (app/(tabs)/_layout.tsx). */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: barTop + 8, backgroundColor: colors.bg, opacity: 0.6 }} />
      <View style={{ position: 'absolute', left: space.gutter, right: space.gutter, bottom }} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>
        <TourCard stop={stop} onNext={() => (stop === 1 ? nextStop() : void endTour(store))} onSkip={() => void endTour(store)} />
      </View>
    </View>
  );
}
