// The one attachment under an answer (07 §1; checks R6, R8) and the "Saved to what I know · Undo" line (C4, M2).
// Drawn from the stored card (by id), so Past chats show it the same way; pieces removed since then say "No longer
// in your closet". No card ever shows a predicted score, a brand or a link out (R5).
import { dayKey, localParts } from '@kitted/core';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { Chip, ChipFlow, KButton, KCard, KCardSection, KText, TagLine, TextLink, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage, OutfitRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { openPiece } from '@/features/closet/pieceActions';
import { STARTER } from '@/features/finish/starter';
import { openLookPage } from '@/features/lookbook/lookPage';
import { OutfitTiles } from '@/features/stylist/cards/OutfitTiles';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { cardControls, cardSpoken, linkedPiece, outfitNow, savedUndoShows, storedCard, type AskCard } from './cards';
import { undoRemember } from './memory';
import { tapAnswer } from './session';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function AskAttachment({ m, readOnly }: { m: ChatMessage; readOnly: boolean }) {
  const card = storedCard(m.payload.askCard);
  const saved = typeof m.payload.savedFact === 'string' ? m.payload.savedFact : null;
  if (!card && !saved) return null;
  return (
    <View style={{ gap: space.s, paddingTop: 6 }}>
      {card ? <CardBody m={m} card={card} readOnly={readOnly} /> : null}
      {saved ? <SavedLine factId={saved} itemId={typeof m.payload.savedPiece === 'string' ? m.payload.savedPiece : null} readOnly={readOnly} /> : null}
    </View>
  );
}

function CardBody({ m, card, readOnly }: { m: ChatMessage; card: AskCard; readOnly: boolean }) {
  switch (card.type) {
    case 'outfit':
      return <OutfitCard card={card} readOnly={readOnly} />;
    case 'check':
      return !cardControls(card, { readOnly, tapped: null }).checkIt ? null : (
        <View style={{ alignItems: 'flex-start' }}>
          <KButton title={t('ask.card.startCheck')} icon="camera" kind="secondary" size="regular" onPress={() => openCamera(card.occasion)} />
        </View>
      );
    case 'ask':
      return <AskQuestion m={m} card={card} readOnly={readOnly} />;
    case 'buy':
      return <BuyCard card={card} />;
    case 'link':
      return <LinkRow card={card} />;
  }
}

function openCamera(occasion: string) {
  router.push({ pathname: '/camera', params: { occasion, from: 'ask' } } as unknown as Href);
}

function OutfitCard({ card, readOnly }: { card: Extract<AskCard, { type: 'outfit' }>; readOnly: boolean }) {
  const { isAccessibilitySize } = useTheme();
  const closet = useLive(['closet'], () => store.closet.all(), []);
  if (!closet) return null;
  const { items, gone } = outfitNow(card, closet);
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
  // VoiceOver: one element for the card, its buttons as actions (02 D12's card rule).
  const actions = [...(c.wear ? [{ name: 'wear', label: t('idea.wear') }] : []), ...(c.checkIt ? [{ name: 'check', label: t('ask.card.checkIt') }] : [])];
  return (
    <KCard
      accessibilityLabel={gone ? `${label} ${t('ask.card.gone')}` : label}
      accessibilityActions={actions}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'wear' ? void wear() : e.nativeEvent.actionName === 'check' ? openCamera(card.occasion) : undefined)}
    >
      <KCardSection gap={space.s}>
        <TagLine left={t('idea.tag')} right={t('idea.fromCloset')} />
        <OutfitTiles items={items} />
        {gone ? (
          <KText variant="subheadline" color="ink2">
            {t('ask.card.gone')}
          </KText>
        ) : null}
        {c.wear || c.checkIt ? (
          <View style={isAccessibilitySize ? { gap: space.s } : { flexDirection: 'row', gap: space.s }}>
            {c.wear ? <KButton title={t('idea.wear')} size="regular" fullWidth={isAccessibilitySize} onPress={() => void wear()} /> : null}
            {c.checkIt ? <KButton title={t('ask.card.checkIt')} icon="camera" kind="secondary" size="regular" fullWidth={isAccessibilitySize} onPress={() => openCamera(card.occasion)} /> : null}
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

function BuyCard({ card }: { card: Extract<AskCard, { type: 'buy' }> }) {
  const row = STARTER.find((e) => e.id === card.starterId);
  if (!row) return null;
  const gain = card.gain === null || card.gain <= 0 ? null : card.gain === 1 ? t('ask.card.buy.gainOne') : t('ask.card.buy.gain', { n: card.gain });
  return (
    <KCard accessibilityLabel={cardSpoken(card, { nameOf: () => null }) ?? ''}>
      <KCardSection gap={4}>
        <TagLine left={t('ask.card.buy.tag')} right={row.budget} />
        <KText variant="headline">{row.pick?.name ?? row.name}</KText>
        {gain ? (
          <KText variant="subheadline" color="ink2">
            {gain}
          </KText>
        ) : null}
      </KCardSection>
    </KCard>
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
