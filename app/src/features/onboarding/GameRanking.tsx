// T113 · "Now put them in order" (specs/style-game.md SG2): two of his Me's side by side, on their second drawings. A tap
// picks one: a light tap of the haptic, a ring on the pick while the other fades, then after 260 ms (120 under Reduce
// Motion) the next pair. Taps in that pause are ignored. Mounted once per pair (keyed by the round), so each pair starts
// clean.
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { KText, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { LOOKS } from './looks';
import { Outfit } from './LookTile';
import { descKey } from './styleGame';
import { pickInRanking } from './styleGameSession';

export function GameRanking({ pair, mes, width }: { pair: readonly [StyleKey, StyleKey]; mes: number; width: number }) {
  const { a11y, isAccessibilitySize: ax } = useTheme();
  const [chosen, setChosen] = useState<StyleKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dim] = useState(() => new Animated.Value(1));
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (look: StyleKey) => {
    if (chosen) return;
    setChosen(look);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ms = a11y.reduceMotion ? 120 : 260;
    Animated.timing(dim, { toValue: 0.35, duration: ms, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      timer.current = null;
      void pickInRanking(store, look);
    }, ms);
  };

  const cardW = ax ? Math.min(width, 260) : Math.floor((width - space.m) / 2);
  return (
    <View style={styles.wrap}>
      <View style={styles.title}>
        <KText testID="rank-title" variant="largeTitle" accessibilityRole="header">
          {t('game.order.title')}
        </KText>
        <KText testID="rank-line" variant="body" color="ink2">
          {t('game.order.line', { n: mes })}
        </KText>
      </View>
      <View style={[styles.pair, { flexDirection: ax ? 'column' : 'row' }]}>
        {pair.map((look, i) => (
          <RankCard key={look} side={i === 0 ? 'left' : 'right'} look={look} width={cardW} chosen={chosen === look} faded={chosen !== null && chosen !== look ? dim : null} onPress={() => pick(look)} />
        ))}
      </View>
    </View>
  );
}

function RankCard({ side, look, width, chosen, faded, onPress }: { side: 'left' | 'right'; look: StyleKey; width: number; chosen: boolean; faded: Animated.Value | null; onPress: () => void }) {
  const { colors } = useTheme();
  const outfit = LOOKS.find((l) => l.style === look)!.outfits[1];
  return (
    <Animated.View style={{ opacity: faded ?? 1 }}>
      <Pressable
        testID={`rank-pick-${side}`}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t(descKey(look, 1))}
        style={[styles.card, { width, backgroundColor: colors.surface2, borderColor: chosen ? colors.ink : 'transparent' }]}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Outfit outfit={outfit} w={Math.min(150, width - 2 * space.m)} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xl },
  title: { gap: space.xs },
  pair: { justifyContent: 'center', alignItems: 'center', gap: space.m },
  card: { alignItems: 'center', paddingVertical: space.l, borderRadius: 18, borderCurve: 'continuous', borderWidth: 2.5 },
});
