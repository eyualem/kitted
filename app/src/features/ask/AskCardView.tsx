// The one attachment under an answer (07 §1; checks R6, R8) and the "Saved to what I know · Undo" line (C4, M2).
// Drawn from the stored card (by id), so Past chats show it the same way; pieces removed since then say "No longer
// in your closet". No card ever shows a predicted score, a brand or a link out (R5).
import { dayKey, localParts } from '@kitted/core';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Chip, ChipFlow, KButton, KCard, KCardSection, KText, TagLine, TextLink, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage, OutfitRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { openPiece } from '@/features/closet/pieceActions';
import { openLookPage } from '@/features/lookbook/lookPage';
import { CardRoom, PieceTiles, type Tile } from '@/features/stylist/cards/OutfitTiles';
import { occasionLabel } from '@/features/stylist/thread';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { ADD_READY, cardActions } from './cardActions';
import { cardControls, cardSpoken, linkedPiece, needMenuChoices, outfitNow, outfitTag, savedUndoShows, storedCard, tileMark, type AskCard, type CardPiece } from './cards';
import { AddCard, ChangedCard, ColorsCard, DrawnBuyCard, drawnSpec, OptionsCard } from './KitCardViews';
import { needMenuRows } from './needChoices';
import { openNeedMenu } from './needMenu';
import { undoRemember } from './memory';
import { tapAnswer } from './session';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function AskAttachment({ m, readOnly }: { m: ChatMessage; readOnly: boolean }) {
  const card = storedCard(m.payload.askCard);
  const saved = typeof m.payload.savedFact === 'string' ? m.payload.savedFact : null;
  const window = useWindowDimensions().width;
  const [width, setWidth] = useState(0);
  if (!card && !saved) return null;
  // The width a card's tiles may use: the thread's, less the card's padding and border (KC1.6). Until it's measured,
  // the screen's width less the thread's margins.
  const room = (width || window - 2 * space.m) - 2 * space.cardPadH - 2;
  return (
    <CardRoom.Provider value={room}>
      <View style={{ gap: space.s, paddingTop: 6 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {card ? <CardBody m={m} card={card} readOnly={readOnly} /> : null}
        {saved ? <SavedLine factId={saved} itemId={typeof m.payload.savedPiece === 'string' ? m.payload.savedPiece : null} readOnly={readOnly} /> : null}
      </View>
    </CardRoom.Provider>
  );
}

/** A "You'd need" tile's tap (KC2.10): the menu with I have one (once T106 builds it) and Next buy (when the kind has a
 *  Starter entry). Neither: the tile isn't a button. Past chats: never. */
function useNeedTile(m: ChatMessage, live: boolean) {
  const styles = useLive(['profile'], async () => (await store.profile.get('me'))?.styles ?? null, []);
  return (piece: CardPiece): Partial<Tile> => {
    if (!live) return {};
    const rows = needMenuRows(needMenuChoices(piece, styles ?? null, ADD_READY));
    if (rows.length === 0) return {};
    const nextBuy = needMenuChoices(piece, styles ?? null, ADD_READY).nextBuy;
    return {
      hint: rows.map((r) => (r === 'haveOne' ? t('ask.card.haveOne') : t('ask.card.nextBuy'))).join(', '),
      onPress: () =>
        openNeedMenu(piece.name, rows, (c) => {
          if (c === 'haveOne') void cardActions.haveOne(m, piece);
          else if (nextBuy) router.push(`/sheets/next-buy?starter=${encodeURIComponent(nextBuy)}` as Href);
        }),
    };
  };
}

function CardBody({ m, card, readOnly }: { m: ChatMessage; card: AskCard; readOnly: boolean }) {
  switch (card.type) {
    case 'outfit':
      return <OutfitCard m={m} card={card} readOnly={readOnly} />;
    case 'check':
      return !cardControls(card, { readOnly, tapped: null }).checkIt ? null : (
        <View style={{ alignItems: 'flex-start' }}>
          <KButton title={t('ask.card.startCheck')} icon="camera" kind="secondary" size="regular" onPress={() => openCamera(card.occasion)} />
        </View>
      );
    case 'ask':
      return <AskQuestion m={m} card={card} readOnly={readOnly} />;
    case 'buy':
      return <DrawnBuyCard card={card} />;
    case 'link':
      return <LinkRow card={card} />;
    case 'correct':
      return <CorrectRow card={card} readOnly={readOnly} />;
    case 'options':
      return <OptionsMessage m={m} card={card} readOnly={readOnly} />;
    case 'colors':
      return <ColorsCard card={card} />;
    case 'add':
      return <AddCard m={m} card={card} readOnly={readOnly} />;
    case 'changed':
      return <ChangedCard m={m} card={card} readOnly={readOnly} />;
  }
}

function OptionsMessage({ m, card, readOnly }: { m: ChatMessage; card: Extract<AskCard, { type: 'options' }>; readOnly: boolean }) {
  const needTile = useNeedTile(m, cardControls(card, { readOnly, tapped: null }).needMenu);
  return <OptionsCard card={card} needTile={needTile} />;
}

/** "That score is wrong" (09 §20.8 G19): his check's Not quite right?, while that check is still here (today only). */
function CorrectRow({ card, readOnly }: { card: Extract<AskCard, { type: 'correct' }>; readOnly: boolean }) {
  const scored = useLive(['fitChecks'], async () => (await store.fitChecks.get(card.checkId))?.status === 'scored', [card.checkId]);
  if (!scored || !cardControls(card, { readOnly, tapped: null }).correct) return null;
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <KButton title={t('card.nqr')} kind="secondary" size="regular" onPress={() => router.push(`/sheets/correct/${card.checkId}`)} />
    </View>
  );
}

function openCamera(occasion: string) {
  router.push({ pathname: '/camera', params: { occasion, from: 'ask' } } as unknown as Href);
}

function OutfitCard({ m, card, readOnly }: { m: ChatMessage; card: Extract<AskCard, { type: 'outfit' }>; readOnly: boolean }) {
  const { isAccessibilitySize } = useTheme();
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const needTile = useNeedTile(m, cardControls(card, { readOnly, tapped: null }).needMenu);
  if (!closet) return null;
  const { items, needs, example, gone } = outfitNow(card, closet);
  const names = items.map((i) => lower(i.name)).join(', ');
  const wear = async () => {
    const now = sessionClock.nowMs();
    const day = dayKey(now, sessionClock.offset);
    const outfit: OutfitRow = {
      id: newId('O'), itemIds: items.map((i) => i.id), occasion: card.occasion, title: null, summary: names, details: {} as OutfitRow['details'],
      source: 'idea', isSaved: false, createdAt: now,
    };
    await store.outfits.put(outfit);
    const before = await store.wearLog.get(day);
    await store.wearLog.put({ day, fitCheckId: null, outfitId: outfit.id, createdAt: now });
    showToast(t('toast.logged'), async () => {
      if (before) await store.wearLog.put(before);
      else await store.wearLog.delete(day);
    });
  };
  const c = cardControls(card, { readOnly, tapped: null, gone });
  const label = cardSpoken(card, { nameOf: (id) => items.find((i) => i.id === id)?.name ?? null }) ?? '';
  const tag = outfitTag(card, occasionLabel(card.occasion));
  // His pieces first on solid tiles, then the drawn ones: dashed with "You'd need", or plain in an Example (KC2.2, KC2.3).
  const tiles: Tile[] = [
    ...items.map((item): Tile => ({ key: item.id, item, mark: tileMark(card, true) })),
    ...needs.map((p, i): Tile => ({ key: `n${i}`, piece: drawnSpec(p), dashed: !example, mark: tileMark(card, false), ...(example ? {} : needTile(p)) }) as Tile),
  ];
  const checkTitle = example ? t('idea.checkFit') : t('ask.card.checkIt');
  // VoiceOver: one element for the card, its buttons as actions (02 D12's card rule); a card with a tappable tile keeps
  // its tiles as their own elements, so the tile's menu can be reached.
  const grouped = !tiles.some((x) => x.onPress);
  const actions = [...(c.wear ? [{ name: 'wear', label: t('idea.wear') }] : []), ...(c.checkIt ? [{ name: 'check', label: checkTitle }] : [])];
  return (
    <KCard
      style={{ alignSelf: 'flex-start', maxWidth: '100%' }}
      accessibilityLabel={grouped ? (gone ? `${label} ${t('ask.card.gone')}` : label) : undefined}
      accessibilityActions={grouped ? actions : undefined}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'wear' ? void wear() : e.nativeEvent.actionName === 'check' ? openCamera(card.occasion) : undefined)}
    >
      <KCardSection gap={space.s}>
        <TagLine left={tag.left} right={tag.right} />
        <PieceTiles tiles={tiles} />
        {gone ? (
          <KText variant="subheadline" color="ink2">
            {t('ask.card.gone')}
          </KText>
        ) : null}
        {c.wear || c.checkIt ? (
          <View style={isAccessibilitySize ? { gap: space.s } : { flexDirection: 'row', gap: space.s }}>
            {c.wear ? <KButton title={t('idea.wear')} size="regular" fullWidth={isAccessibilitySize} onPress={() => void wear()} /> : null}
            {c.checkIt ? (
              <KButton title={checkTitle} icon="camera" kind={example ? 'primary' : 'secondary'} size="regular" fullWidth={isAccessibilitySize} onPress={() => openCamera(card.occasion)} />
            ) : null}
          </View>
        ) : null}
      </KCardSection>
    </KCard>
  );
}

function AskQuestion({ m, card, readOnly }: { m: ChatMessage; card: Extract<AskCard, { type: 'ask' }>; readOnly: boolean }) {
  const tapped = typeof m.payload.askTapped === 'string' ? m.payload.askTapped : null;
  return (
    <View style={{ gap: 6 }}>
      <KText role="chatText">{card.question}</KText>
      <ChipFlow>
        {cardControls(card, { readOnly, tapped }).answers.map((a) => (
          <Chip
            key={a.option}
            title={a.option}
            state={a.picked ? 'selected' : 'normal'}
            // His pick stays solid (and "selected" for VoiceOver); the others go quiet once one is picked.
            disabled={!a.picked && !a.tappable}
            accessibilityHint={t('ask.card.a11y.option', { option: a.option })}
            onPress={a.tappable ? () => tapAnswer(m.id, a.option) : undefined}
          />
        ))}
      </ChipFlow>
    </View>
  );
}

function LinkRow({ card }: { card: Extract<AskCard, { type: 'link' }> }) {
  const data = useLive(['closet', 'fitChecks'], async () => {
    if ('itemId' in card) {
      const it = linkedPiece(card.itemId, await store.closet.all());
      return { kind: 'piece' as const, id: it?.id ?? null, label: it ? t('ask.card.link.piece', { item: lower(it.name) }) : null };
    }
    const c = await store.fitChecks.get(card.checkId);
    if (!c) return { kind: 'check' as const, label: null };
    const today = dayKey(sessionClock.nowMs(), sessionClock.offset);
    const dow = localParts(c.createdAt, sessionClock.offset).dow;
    const day = weekdayName(dow);
    return { kind: 'check' as const, label: c.dayKey === today ? t('ask.card.link.today') : t('ask.card.link.day', { day }) };
  }, ['itemId' in card ? card.itemId : card.checkId]);
  if (!data) return null;
  if (!data.label) return <KText variant="subheadline" color="ink2">{t('ask.card.gone')}</KText>;
  const pieceId = data.kind === 'piece' ? data.id : null;
  const open = () => (pieceId ? openPiece({ id: pieceId }) : 'checkId' in card ? openLookPage(card.checkId) : undefined);
  // VoiceOver reads the words, not the "›" (07 §17).
  return <TextLink title={`${data.label} ›`} accessibilityLabel={data.label} onPress={open} />;
}

function SavedLine({ factId, itemId, readOnly }: { factId: string; itemId: string | null; readOnly: boolean }) {
  const fact = useLive(['facts'], () => store.facts.get(factId), [factId]);
  if (fact === undefined) return null;
  if (!fact || fact.isDeleted) {
    return (
      <KText role="miniLabel" color="ink3">
        {t('ask.saved.undone')}
      </KText>
    );
  }
  return (
    // Wraps, so at the largest text sizes Undo goes under the label instead of off the edge (07 §14 P5).
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2 }} accessible={readOnly} accessibilityLabel={readOnly ? t('ask.saved') : undefined}>
      <KText role="miniLabel" color="ink2" style={{ flexShrink: 1 }}>
        {t('ask.saved')}
      </KText>
      {!savedUndoShows(readOnly) ? null : (
        <TextLink title={t('common.undo')} compact accessibilityHint={t('ask.saved.a11y')} onPress={() => void undoRemember(factId, itemId, { store })} />
      )}
    </View>
  );
}
