// C7 · Next best buy (09-ui-review §14, #308; #87; 02 C7): the piece by kind (never a brand), what it adds with what he
// owns, its price, and the outfits it would make with the new piece drawn dashed. No shop links. Free on every plan.
// The number is ink (copper is for a score that moves, #231); the first 6 outfits show, the rest behind "Show {n} more" (#312).
// Off for the beta behind the Outfits switch (specs/closet-beta.md CB1): the route sends him to Closet. Opened from Kit's
// buy card or a "You'd need" tile (`?starter=<id>`, specs/kit-stylist-chat.md KC6.4, KC2.10), it shows that one piece:
// drawn, its name, its price range and Got it, with no outfit count (the beta's home for Next buy, T104).
import { useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { KButton, KText, Numeral, TagLine, TextLink, space } from '@/design-system';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { catalogRow } from '@/features/finish/starter';
import { t } from '@/i18n/en';
import { PieceArt } from './GarmentArt';
import { gainLine, loadNextBuy } from './nextBuyData';
import { useOutfitsOn } from './outfitsSwitch';
import { StandingOutfit } from './StandingOutfit';

/** Outfits shown before "Show {n} more". */
const FIRST = 6;

export function NextBuySheet() {
  const { starter } = useLocalSearchParams<{ starter?: string }>();
  const [all, setAll] = useState(false);
  const on = useOutfitsOn();
  const nb = useLive(['closet', 'fitChecks', 'kv'], () => (on && !starter ? loadNextBuy() : Promise.resolve(null)), [on, starter]);
  if (starter) return <StarterPiece id={starter} />;
  // Off for the beta (specs/closet-beta.md CB1): nothing links here, but the route stays registered, so an old link
  // lands on Closet instead of the sheet.
  if (!on) return <Redirect href="/closet" />;
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

/** One Starter piece, from Kit's card (KC6.4): drawn in its color, its name, its price range. No outfit count. */
function StarterPiece({ id }: { id: string }) {
  const row = catalogRow(id);
  const g = row?.pick?.garment;
  if (!row) return <SheetScaffold title={t('ask.card.buy.tag')} />;
  return (
    <SheetScaffold title={row.pick?.name ?? row.name}>
      <View style={{ gap: space.m, paddingTop: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          {g ? <PieceArt item={{ kind: String(g.subcategory), family: String(g.color_family), name: row.pick?.name ?? row.name }} size={96} /> : null}
          <View style={{ flexShrink: 1, gap: 4 }}>
            <TagLine left={t('ask.card.buy.tag')} right={row.budget} />
          </View>
        </View>
        <KButton title={t('nextBuy.gotIt')} size="large" fullWidth onPress={() => router.back()} />
      </View>
    </SheetScaffold>
  );
}
