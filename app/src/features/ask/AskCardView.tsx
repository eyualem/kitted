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
import { outfitNow, storedCard, type AskCard } from './cards';
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
      return readOnly ? null : (
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
  return (
    <KCard accessibilityLabel={t('ask.card.a11y.outfit', { names })}>
      <KCardSection gap={space.s}>
        <TagLine left={t('idea.tag')} right={t('idea.fromCloset')} />
        <OutfitTiles items={items} />
        {gone ? (
          <KText variant="subheadline" color="ink2">
            {t('ask.card.gone')}
          </KText>
        ) : null}
        {readOnly || gone ? null : (
          <View style={isAccessibilitySize ? { gap: space.s } : { flexDirection: 'row', gap: space.s }}>
            <KButton title={t('idea.wear')} size="regular" fullWidth={isAccessibilitySize} onPress={() => void wear()} />
            <KButton title={t('ask.card.checkIt')} icon="camera" kind="secondary" size="regular" fullWidth={isAccessibilitySize} onPress={() => openCamera(card.occasion)} />
          </View>
        )}
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
        {card.options.map((o) => (
          <Chip
            key={o}
            title={o}
            state={tapped === o ? 'selected' : 'normal'}
            disabled={readOnly || tapped !== null}
            accessibilityHint={t('ask.card.a11y.option', { option: o })}
            onPress={() => tapAnswer(m.id, o)}
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
    <KCard accessibilityLabel={[t('ask.card.buy.tag'), row.name, gain, row.budget].filter(Boolean).join('. ')}>
      <KCardSection gap={4}>
        <TagLine left={t('ask.card.buy.tag')} right={row.budget} />
        <KText variant="headline">{row.name}</KText>
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
      const it = await store.closet.get(card.itemId);
      return { kind: 'piece' as const, label: it && !it.isDeleted ? t('ask.card.link.piece', { item: lower(it.name) }) : null };
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
  const open = () => ('itemId' in card ? openPiece({ id: card.itemId }) : openLookPage(card.checkId));
  return <TextLink title={`${data.label} ›`} onPress={open} />;
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible={readOnly} accessibilityLabel={readOnly ? t('ask.saved') : undefined}>
      <KText role="miniLabel" color="ink2">
        {t('ask.saved')}
      </KText>
      {readOnly ? null : (
        <TextLink title={t('common.undo')} compact accessibilityHint={t('ask.saved.a11y')} onPress={() => void undoRemember(factId, itemId, { store })} />
      )}
    </View>
  );
}
