// The tour card (specs/app-tour.md AT1.3, AT2.4, AT5; tasks/T118/DESIGN.md): `1 of 2`, a title, one line, `Next` (or
// `Done`) and `Skip`. Built from KCard, TagLine, KText and KButton. The words are the spec's. VoiceOver reads the text as
// one element, then `Next` and `Skip` as buttons. At the largest text sizes the words scroll inside the card (capped at
// 60% of the screen) while the buttons stay pinned and whole.
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, ScrollView, useWindowDimensions, View } from 'react-native';
import { KButton, KCard, KText, TagLine, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { TOUR_STOPS, type TourStop } from './appTour';

export interface TourWords {
  step: string;
  title: string;
  body: string;
  next: string;
  spoken: string;
}

export function tourWords(stop: TourStop): TourWords {
  const step = t('tour.step', { n: stop });
  const title = t(stop === 1 ? 'tour.closet.title' : 'tour.lookbook.title');
  const body = t(stop === 1 ? 'tour.closet.body' : 'tour.lookbook.body');
  return { step, title, body, next: t(stop === TOUR_STOPS ? 'tour.done' : 'tour.next'), spoken: t('tour.a11y.card', { step, title, body }) };
}

/** At the largest text sizes the words scroll inside the card, which stays under 60% of the screen: that height less the
 *  two stacked buttons, the gaps and the card's padding. */
export const wordsMax = (screenHeight: number) => Math.max(120, Math.round(screenHeight * 0.6) - 180);

export function TourCard({ stop, onNext, onSkip }: { stop: TourStop; onNext: () => void; onSkip: () => void }) {
  const { isAccessibilitySize: ax } = useTheme();
  const { height } = useWindowDimensions();
  const w = tourWords(stop);
  // VoiceOver lands on the card's words at each stop (AT5.1), once the tab has changed under it.
  const words = useRef<View | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const tag = words.current ? findNodeHandle(words.current) : null;
      if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
    }, 500);
    return () => clearTimeout(timer);
  }, [stop]);
  return (
    <KCard>
      <View style={{ paddingHorizontal: space.cardPadH, paddingVertical: space.cardPadV, gap: space.m, flexShrink: 1 }}>
        <ScrollView style={ax ? { maxHeight: wordsMax(height) } : undefined} contentContainerStyle={{ gap: 6 }} scrollEnabled={ax} showsVerticalScrollIndicator={ax}>
          <View ref={words} accessible accessibilityLabel={w.spoken} style={{ gap: 6 }}>
            <TagLine left={w.step} accessibilityLabel={w.step} />
            <KText variant="title2" weight="700">{w.title}</KText>
            <KText variant="callout" color="ink2">{w.body}</KText>
          </View>
        </ScrollView>
        <View style={ax ? { gap: space.s } : { flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <KButton title={w.next} size="regular" fullWidth style={ax ? undefined : { flex: 1 }} onPress={onNext} />
          <KButton title={t('tour.skip')} kind="ghost" size="regular" inkLabel fullWidth={ax} onPress={onSkip} />
        </View>
      </View>
    </KCard>
  );
}
