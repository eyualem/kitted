// Kit's new card views (specs/kit-stylist-chat.md, drawn in mockups/kit-stylist-chat.html; T104): options, colors,
// the add card's three states, Changed · Undo and the drawn buy card (the follow-up taps: FollowUpRow.tsx).
// Each card is only as wide as its content (KC1.6). What the buttons do is cardActions.ts (T106, T107).
import { FAMILY_HEX } from '@kitted/core';
import type { ReactNode } from 'react';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { KButton, KCard, KCardSection, KText, TagLine, TextLink, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import type { DrawnPieceSpec } from '@/features/closet/artSpec';
import { PieceArt } from '@/features/closet/GarmentArt';
import { useOutfitsOn } from '@/features/closet/outfitsSwitch';
import { openPiece } from '@/features/closet/pieceActions';
import { catalogRow } from '@/features/finish/starter';
import { PieceTiles, type Tile } from '@/features/stylist/cards/OutfitTiles';
import { t } from '@/i18n/en';
import { cardActions } from './cardActions';
import {
  addStatus, buyGainLine, buyPiece, buySpoken, cardControls, cardSpoken, colorName, colorPieces, colorsTitle, optionsNow, tileMark,
  type AskCard, type CardPiece,
} from './cards';

/** A drawn piece as the closet's drawing takes it. */
export const drawnSpec = (p: CardPiece): DrawnPieceSpec => ({ kind: p.kind, family: p.color, name: p.name });

/** Kit's cards hug their content (KC1.6): never stretched to the thread's width. */
const HUG = { alignSelf: 'flex-start', maxWidth: '100%' } as const;

/** An options card (KC2.4): 2 or 3 of one kind, his own first with `Yours`, the rest drawn with `You'd need`. */
export function OptionsCard({ card, needTile }: { card: Extract<AskCard, { type: 'options' }>; needTile: (p: CardPiece) => Partial<Tile> }) {
  const closet = useLive(['closet'], () => store.closet.all(), []);
  if (!closet) return null;
  const { entries } = optionsNow(card, closet);
  const tiles: Tile[] = entries.flatMap((e, i): Tile[] => {
    if ('item' in e) return [{ key: e.item.id, item: e.item, mark: tileMark(card, true) }];
    if ('piece' in e) return [{ key: `p${i}`, piece: drawnSpec(e.piece), dashed: true, mark: tileMark(card, false), ...needTile(e.piece) } as Tile];
    return [];
  });
  const gone = entries.some((e) => 'gone' in e);
  const label = cardSpoken(card, { nameOf: (id) => closet.find((c) => c.id === id)?.name ?? null }) ?? '';
  return (
    <KCard style={HUG} accessibilityLabel={tiles.some((x) => x.onPress) ? undefined : label}>
      <KCardSection gap={space.s}>
        <TagLine left={t('ask.card.options')} />
        <PieceTiles tiles={tiles} />
        {gone ? (
          <KText variant="subheadline" color="ink2">
            {t('ask.card.gone')}
          </KText>
        ) : null}
      </KCardSection>
    </KCard>
  );
}

/** A colors card: about a piece, the piece drawn once per color and named (KC3.1); in general, 3–5 named round
 *  swatches (KC3.2). Every color carries its name in text (KC3.4). */
export function ColorsCard({ card }: { card: Extract<AskCard, { type: 'colors' }> }) {
  const label = cardSpoken(card, { nameOf: () => null }) ?? '';
  return (
    <KCard style={HUG} accessibilityLabel={label}>
      <KCardSection gap={space.s}>
        <TagLine left={colorsTitle(card)} />
        {card.about === 'piece' ? (
          <PieceTiles tiles={colorPieces(card).map((p) => ({ key: p.color, piece: drawnSpec(p), label: colorName(p.color) ?? p.color }))} />
        ) : (
          <Swatches families={card.families} />
        )}
      </KCardSection>
    </KCard>
  );
}

function Swatches({ families }: { families: readonly string[] }) {
  const { colors, fontScale } = useTheme();
  const dot = Math.round(40 * Math.min(1.5, Math.max(1, fontScale)));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: space.s }}>
      {families.map((f) => (
        <View key={f} style={{ width: dot + 24, alignItems: 'center', gap: 5 }}>
          <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: FAMILY_HEX[f as keyof typeof FAMILY_HEX], borderWidth: 1, borderColor: colors.inkFaint }} />
          <KText role="miniLabel" style={{ textAlign: 'center' }}>
            {colorName(f) ?? f}
          </KText>
        </View>
      ))}
    </View>
  );
}

/** The piece drawn small with a line beside it (the add card's outcome, Changed · Undo). */
function PieceLine({ art, name, status, undo, onOpen }: { art: ReactNode; name?: string; status: string | null; undo?: () => void; onOpen?: () => void }) {
  const { colors, fontScale } = useTheme();
  const side = Math.round(44 * Math.min(1.5, Math.max(1, fontScale)));
  const tile = (
    <View style={{ width: side, height: side, borderRadius: 10, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {art}
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', maxWidth: '100%' }}>
      {onOpen ? (
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={name} hitSlop={6}>
          {tile}
        </Pressable>
      ) : (
        tile
      )}
      <View style={{ flexShrink: 1, gap: 1 }}>
        {name ? (
          <KText variant="subheadline" color="ink" style={{ fontWeight: '600' }}>
            {name}
          </KText>
        ) : null}
        {status ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 }}>
            <KText variant="subheadline" color="ink2">
              {undo ? `${status} ·` : status}
            </KText>
            {undo ? <TextLink title={t('common.undo')} compact onPress={undo} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** The add card (KC4.2): the piece drawn, its name, the question, Add and No thanks; then `Added to Closet · Undo` (a
 *  tap on the piece opens it in Closet) or `Not added`. Past chats show the outcome only (KC1.5). */
export function AddCard({ m, card, readOnly }: { m: ChatMessage; card: Extract<AskCard, { type: 'add' }>; readOnly: boolean }) {
  const { isAccessibilitySize, fontScale } = useTheme();
  const c = cardControls(card, { readOnly, tapped: null });
  const art = (size: number) => <PieceArt item={drawnSpec(card.piece)} size={size} />;
  if (card.outcome !== 'asked' || readOnly) {
    const itemId = card.outcome === 'added' && !readOnly ? card.itemId : null;
    return (
      <PieceLine
        art={art(Math.round(36 * Math.min(1.5, Math.max(1, fontScale))))}
        name={card.piece.name}
        status={addStatus(card, readOnly)}
        undo={c.undo ? () => void cardActions.undo(m) : undefined}
        onOpen={itemId ? () => openPiece({ id: itemId }) : undefined}
      />
    );
  }
  const side = Math.round(72 * Math.min(1.5, Math.max(1, fontScale)));
  return (
    <KCard style={HUG} accessibilityLabel={cardSpoken(card, { nameOf: () => null }) ?? ''} accessibilityActions={[{ name: 'add', label: t('ask.card.add') }, { name: 'no', label: t('ask.card.noThanks') }]}
      onAccessibilityAction={(e) => void (e.nativeEvent.actionName === 'add' ? cardActions.add(m) : cardActions.decline(m))}
    >
      <KCardSection gap={space.s}>
        <View style={{ flexDirection: isAccessibilitySize ? 'column' : 'row', alignItems: isAccessibilitySize ? 'flex-start' : 'center', gap: 12 }}>
          <AddArt side={side}>{art(Math.round(side * 0.8))}</AddArt>
          <View style={{ flexShrink: 1, gap: 2, maxWidth: 220 * Math.max(1, fontScale) }}>
            <KText variant="body" color="ink" style={{ fontWeight: '600' }}>
              {card.piece.name}
            </KText>
            <KText variant="subheadline" color="ink2">
              {t('ask.card.add.ask')}
            </KText>
          </View>
        </View>
        <View style={{ flexDirection: isAccessibilitySize ? 'column' : 'row', gap: space.s, alignItems: 'flex-start' }}>
          {c.add ? <KButton title={t('ask.card.add')} size="regular" onPress={() => void cardActions.add(m)} /> : null}
          {c.noThanks ? <KButton title={t('ask.card.noThanks')} kind="secondary" size="regular" onPress={() => void cardActions.decline(m)} /> : null}
        </View>
      </KCardSection>
    </KCard>
  );
}

function AddArt({ side, children }: { side: number; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: side, height: side, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

/** A changed piece (T107 builds it; KC5.1): redrawn with its new name and `Changed · Undo`. Undone, the piece as it was
 *  again with `Changed back` (the founder, #493). */
export function ChangedCard({ m, card, readOnly }: { m: ChatMessage; card: Extract<AskCard, { type: 'changed' }>; readOnly: boolean }) {
  const { fontScale } = useTheme();
  const c = cardControls(card, { readOnly, tapped: null });
  const f = card.undone ? card.before : card.after;
  const size = Math.round(36 * Math.min(1.5, Math.max(1, fontScale)));
  return (
    <PieceLine
      art={<PieceArt item={{ garment: f.garment, hex: f.hex, name: f.name }} size={size} />}
      name={f.name}
      status={card.undone ? t('ask.card.changedBack') : t('ask.card.changed')}
      undo={c.undo ? () => void cardActions.undo(m) : undefined}
    />
  );
}

/** The drawn buy card (KC6.4): `Next buy` and the Starter price range, the piece in its color, its name, Kit's one reason
 *  line. A tap opens the Next buy sheet on that piece. No outfit count while Outfits are off (the beta). */
export function DrawnBuyCard({ card }: { card: Extract<AskCard, { type: 'buy' }> }) {
  const { fontScale } = useTheme();
  const on = useOutfitsOn();
  const row = catalogRow(card.starterId);
  if (!row) return null;
  const piece = buyPiece(card);
  const gain = buyGainLine(card.gain, on);
  const side = Math.round(84 * Math.min(1.5, Math.max(1, fontScale)));
  const spoken = [buySpoken(card, on), card.why].filter(Boolean).join(' ');
  return (
    <Pressable
      style={({ pressed }) => [HUG, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => router.push(`/sheets/next-buy?starter=${encodeURIComponent(card.starterId)}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={spoken}
    >
      <KCard>
        <KCardSection gap={space.s}>
          <TagLine left={t('ask.card.buy.tag')} right={row.budget} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {piece ? <AddArt side={side}><PieceArt item={drawnSpec(piece)} size={Math.round(side * 0.8)} /></AddArt> : null}
            <View style={{ flexShrink: 1, gap: 3, maxWidth: 200 * Math.max(1, fontScale) }}>
              <KText variant="headline">{row.pick?.name ?? row.name}</KText>
              {card.why ? (
                <KText variant="subheadline" color="ink2">
                  {card.why}
                </KText>
              ) : null}
              {gain ? (
                <KText variant="subheadline" color="ink2">
                  {gain}
                </KText>
              ) : null}
            </View>
          </View>
        </KCardSection>
      </KCard>
    </Pressable>
  );
}
