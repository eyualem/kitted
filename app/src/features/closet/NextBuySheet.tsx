// C7 · Next best buy (09-ui-review §14, #308; #87; 02 C7): the piece by kind (never a brand), what it adds with what he
// owns, its price, and the outfits it would make with the new piece drawn dashed. No shop links. Free on every plan.
// The number is ink (copper is for a score that moves, #231); the first 6 outfits show, the rest behind "Show {n} more" (#312).
import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KText, Numeral, TagLine, TextLink, space } from '@/design-system';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { gainLine, loadNextBuy } from './nextBuyData';
import { StandingOutfit } from './StandingOutfit';

/** Outfits shown before "Show {n} more". */
const FIRST = 6;

export function NextBuySheet() {
  const [all, setAll] = useState(false);
  const nb = useLive(['closet', 'fitChecks', 'kv'], loadNextBuy, []);
  if (nb === undefined) return <SheetScaffold title={t('closet.nextBuy.tag')} />;
  if (!nb) return <SheetScaffold title={t('closet.nextBuy.tag')} />;
  return (
    <SheetScaffold title={nb.entry.pick!.name}>
      <View style={{ gap: space.m, paddingTop: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }} accessible accessibilityLabel={`${gainLine(nb.gain)}. ${nb.entry.budget}`}>
          <Numeral size={31} trimDescender={false}>{`+${nb.gain}`}</Numeral>
          <KText variant="subheadline" color="ink2">{gainLine(nb.gain).replace(/^\+\d+\s/, '')} · {nb.entry.budget}</KText>
        </View>
        <TagLine left={t('closet.nextBuy.unlocks')} right={String(nb.unlocks.length)} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          {(all ? nb.unlocks : nb.unlocks.slice(0, FIRST)).map((o) => (
            <StandingOutfit
              key={o.key} width={88} layerId={o.layerId} ghostId={nb.ghost.id}
              items={o.itemIds.map((id) => (id === nb.ghost.id ? nb.ghost : nb.closet.find((c) => c.id === id))).filter((c): c is NonNullable<typeof c> => !!c)}
            />
          ))}
        </View>
        {nb.unlocks.length > FIRST ? (
          <TextLink title={all ? t('closet.piece.fewer') : t('closet.outfits.more', { n: nb.unlocks.length - FIRST })} onPress={() => setAll(!all)} />
        ) : null}
        <KButton title={t('nextBuy.gotIt')} size="large" fullWidth onPress={() => router.back()} />
      </View>
    </SheetScaffold>
  );
}
