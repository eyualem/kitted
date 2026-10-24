// Closet's To confirm: "Are these one piece?" (09-ui-review §29, #380). Two of his pieces the closet may have split
// from one thing he owns (pairDoubt.pairCard), drawn side by side with their names. Yes, one piece folds the one with
// fewer wears into the other (the piece page's merge, its toast and Undo); No, two pieces keeps them apart for good;
// Skip hides it until a newer photo of either. Never on a score card, and nothing here moves a score.
import { useState } from 'react';
import { View } from 'react-native';
import { Chip, ChipFlow, KText, TextLink, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { fitCheck } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { mergePairNow } from './pieceActions';
import { PAIR_SKIP_KEY, parsePairSkips, withPairSkip, type PairCard } from './pairDoubt';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function PairQuestion({ pair }: { pair: PairCard }) {
  const { isAccessibilitySize } = useTheme();
  const [width, setWidth] = useState(0);
  const [said, setSaid] = useState<'no' | null>(null);
  const { keep, fold } = pair;
  const question = t('closet.pair.q');
  const reason = pair.why === 'minutes' ? t('closet.pair.why.minutes') : t('closet.q.why.similar');
  if (said === 'no') {
    return <KText variant="footnote" color="ink2">{t('closet.pair.saidNo')}</KText>;
  }
  const skip = async () => {
    const skips = parsePairSkips(await store.getKv(PAIR_SKIP_KEY));
    await store.setKv(PAIR_SKIP_KEY, withPairSkip(skips, pair));
  };
  const no = async () => {
    setSaid('no');
    await fitCheck.closet.keepApart(keep.id, fold.id);
  };
  // Two drawings side by side (one per row at the largest text sizes), as the "Is this your …?" question.
  const fw = width > 0 ? Math.min(120, Math.floor(isAccessibilitySize ? width : (width - 12) / 2)) : 0;
  return (
    <View style={{ gap: 10 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ gap: 3 }}>
        <KText
          variant="subheadline" weight="600" accessibilityRole="header"
          accessibilityLabel={t('closet.pair.a11y', { a: lower(keep.name), b: lower(fold.name), reason })}
        >
          {question}
        </KText>
        <KText variant="footnote" color="ink2">{reason}</KText>
      </View>
      {fw > 0 ? (
        <View style={isAccessibilitySize ? { gap: 10 } : { flexDirection: 'row', gap: 12 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[keep, fold].map((it) => (
            <View key={it.id} style={{ gap: 4, width: fw }}>
              <ClosetTile item={it} size={fw} aspect={1.1} radius={14} scale={0.7} decorative />
              <KText variant="caption" color="ink2" style={{ textAlign: 'center' }}>{it.name}</KText>
            </View>
          ))}
        </View>
      ) : null}
      <ChipFlow accessibilityLabel={question}>
        <Chip title={t('closet.pair.yes')} small onPress={() => void mergePairNow(fold, keep)} />
        <Chip title={t('closet.pair.no')} small onPress={() => void no()} />
      </ChipFlow>
      <View style={{ alignSelf: 'flex-start' }}>
        <TextLink compact title={t('tap.skip')} onPress={() => void skip()} />
      </View>
    </View>
  );
}
