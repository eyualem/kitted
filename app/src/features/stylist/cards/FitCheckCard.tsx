// The fit-check card in the thread (02 D6 → D7 / D11 / S19 / S22 / S23). One slot that shows the
// live reading, then the result, from the same fit_checks row. One VoiceOver element with
// custom actions; the buttons inside are also there for touch.
import { router } from 'expo-router';
import { View } from 'react-native';
import {
  AddedRow, FinishTile, FixRow, GarmentIcon, Icon, IconButton, KButton, KCard, KCardSection, KText, PartialLabel, RowDivider, ScoreBlock, Seam,
  TagLine, TextLink, TextLinkRow, TipLine, displayScore, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { store } from '@/data/db';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { garmentIconType } from '@/features/fitcheck/labels';
import { fitCheck, useFitCheckSession } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { isRecheckOpen } from '@/services/quota';
import { sessionClock } from '@/state/session';
import { pickOccasion } from '../occasionPicker';
import { occasionLabel } from '../thread';
import { OccasionQuestion, ReadingCard } from './ReadingCard';

function useCheck(checkId: string) {
  return useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
}

function useCloset() {
  return useLive(['closet'], () => store.closet.all(), []);
}

export function FitCheckCard({ checkId }: { checkId: string }) {
  const row = useCheck(checkId);
  const session = useFitCheckSession();
  if (!row) return null;
  if (row.status === 'scoring') {
    if (session.kind === 'reading' && session.checkId === checkId) {
      return (
        <View style={{ gap: 12 }}>
          <ReadingCard s={session} />
          {session.mode === 'check' ? <OccasionQuestion s={session} onPick={(o) => fitCheck.selectOccasion(o)} /> : null}
        </View>
      );
    }
    return null; // a read that never finished (app closed mid-read): nothing to show yet
  }
  if (row.status === 'failed') return <FailureCard row={row} />;
  if (row.status === 'notClothed' || row.status === 'unreadable') return <StatusCard text={t(row.status === 'notClothed' ? 'notClothed.text' : 'unreadable.text')} />;
  return <ScoredCard row={row} />;
}

export function StatusCard({ text }: { text: string }) {
  return (
    <KCard accessibilityLabel={text}>
      <KCardSection>
        <KText role="cardSummary">{text}</KText>
      </KCardSection>
    </KCard>
  );
}

function FailureCard({ row }: { row: FitCheckRow }) {
  const code = row.details.failCode ?? 'ai';
  const key = code === 'timeout' ? 'fail.timeout' : code === 'offline' ? 'fail.offline' : code === 'paused' ? 'fail.paused' : code === 'unknownPhoto' ? 'demo.unknownPhoto' : 'fail.ai';
  return (
    <KCard accessibilityLabel={t(key)}>
      <KCardSection gap={6}>
        <KText role="cardSummary">{t(key)}</KText>
        {code !== 'unknownPhoto' ? <KButton title={t('common.tryAgain')} size="regular" kind="secondary" onPress={() => void fitCheck.retry(row.id)} /> : null}
      </KCardSection>
    </KCard>
  );
}

function ScoredCard({ row }: { row: FitCheckRow }) {
  const closet = useCloset() ?? [];
  const score = row.score ?? 0;
  const partial = row.isPartial;
  const partialText = row.notRated.includes('bottom half') ? t('partial.label.topOnly') : t('partial.label.shoes');
  const fixes = row.fixes;
  const top = fixes[0];
  const dialed = fixes.length === 0;
  const nextLevel = row.details.nextLevel?.[0];
  const recheckOpen = isRecheckOpen(row, sessionClock.nowMs(), sessionClock);
  const added = (row.details.closetSummary?.added ?? []).filter((id) => !(row.details.closetSummary?.undone ?? []).includes(id));
  const addedItems = added.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
  const finishing = partial && row.snapState === 'pending' && row.details.finish !== undefined;
  const scoreText = displayScore(score);

  const actions = [
    { name: 'why', label: t('card.why', { score: scoreText }) },
    { name: 'nqr', label: t('card.nqr') },
    ...(recheckOpen ? [{ name: 'recheck', label: t('card.recheck') }] : []),
    { name: 'share', label: t('card.share.a11y') },
    ...(addedItems.length > 0 && !partial ? [{ name: 'review', label: t('card.a11y.review') }] : []),
    { name: 'occasion', label: t('card.a11y.changeOccasion') },
  ];
  const go = {
    why: () => router.push(`/sheets/why/${row.id}`),
    nqr: () => router.push(`/sheets/correct/${row.id}`),
    recheck: async () => {
      await fitCheck.postRecheckPrompt(row.id);
      router.push(`/sheets/sample-photos?mode=recheck&parent=${row.id}`);
    },
    share: () => router.push(`/share/${row.id}`),
    review: () => router.push(`/sheets/added/${row.id}`),
    occasion: () => pickOccasion(row.occasion, (o) => void fitCheck.changeOccasion(row.id, o)),
  };
  const label = t('card.a11y.fitCheck', {
    occasion: occasionLabel(row.occasion),
    score: spokenScore(score),
    word: scoreWordLabel(score),
    partial: partial ? `${partialText}. ` : '',
    summary: row.explanation ?? '',
    fix: top?.copy ?? t('card.noFixes'),
    tag: top?.tag ?? '',
  });

  return (
    <KCard
      accessibilityLabel={label}
      accessibilityActions={actions}
      onAccessibilityAction={(e) => void go[e.nativeEvent.actionName as keyof typeof go]?.()}
    >
      <KCardSection>
        <TagLine
          left={t(partial ? 'card.tag.partial' : 'card.tag.full')}
          right={occasionLabel(row.occasion)}
          onPressRight={go.occasion}
        />
        {partial ? (
          <>
            <ScoreBlock score={score} partialLabel={partialText} />
            {row.explanation ? <KText variant="subheadline" color="ink2">{row.explanation}</KText> : null}
          </>
        ) : (
          <ScoreBlock score={score} verdict={row.explanation ?? undefined} />
        )}
      </KCardSection>
      <Seam />
      <KCardSection paddingVertical={4} gap={0}>
        {dialed ? (
          <View style={{ paddingVertical: space.fixRowV }}>
            <KText role="fixTitle">{score >= 9 ? t('dialed.title') : t('card.noFixes')}</KText>
          </View>
        ) : (
          fixes.map((f, i) => (
            <View key={f.target + i}>
              {i > 0 ? <RowDivider /> : null}
              <FixRow number={i + 1} title={f.copy} detail={f.tag} gain={t('card.gainTo', { score: displayScore(f.to) })} />
            </View>
          ))
        )}
        {nextLevel ? <TipLine lead={t('card.nextLevel')} text={nextLevel} /> : null}
      </KCardSection>
      <Seam />
      <KCardSection gap={6}>
        {addedItems.length > 0 && !partial ? (
          <AddedRow
            items={addedItems.map((c) => ({ type: garmentIconType(c.garment), hex: c.hex }))}
            count={addedItems.length}
            onReview={go.review}
          />
        ) : null}
        {finishing ? <FinishRow row={row} closet={closet} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: recheckOpen || dialed ? 'flex-start' : 'flex-end' }}>
          {dialed && score >= 9 ? (
            <KButton title={t('dialed.save')} icon="bookmark" size="regular" style={{ flex: 1 }} />
          ) : recheckOpen ? (
            <KButton title={t('card.recheck')} icon="recheck" size="regular" style={{ flex: 1 }} onPress={() => void go.recheck()} />
          ) : null}
          <IconButton icon="share" diameter={36} label={t('card.share.a11y')} onPress={go.share} />
        </View>
        <TextLinkRow>
          <TextLink title={t('card.why', { score: scoreText })} onPress={go.why} compact />
          <TextLink title={t('card.nqr')} onPress={go.nqr} compact />
          {row.isFirstCheck && recheckOpen ? <TextLink title={t('card.later')} color="ink2" compact /> : null}
        </TextLinkRow>
      </KCardSection>
    </KCard>
  );
}

/** "Finish the check · Same shoes as Monday?" + the remembered pair, the camera, Skip (02 D11). */
function FinishRow({ row, closet }: { row: FitCheckRow; closet: ClosetItemRow[] }) {
  const { colors } = useTheme();
  const f = row.details.finish;
  const item = f?.suggestedItemId ? closet.find((c) => c.id === f.suggestedItemId) : undefined;
  const weekday = f?.weekday !== null && f?.weekday !== undefined ? weekdayName(f.weekday) : null;
  const second = item && weekday ? t('partial.finish.same', { weekday }) : t('partial.finish.snapOrPick');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <KText variant="subheadline" color="ink2" style={{ flexShrink: 1 }}>
        <KText variant="subheadline" weight="600" color="ink">
          {t('partial.finish.title')}
        </KText>
        {`\n${second}`}
      </KText>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {item && weekday ? (
          <FinishTile filled label={t('partial.a11y.useSame', { shoes: item.name.toLowerCase(), weekday })} onPress={() => void fitCheck.pickShoes(row.id, item.id)}>
            <GarmentIcon type={garmentIconType(item.garment)} color={item.hex} size={36} />
          </FinishTile>
        ) : null}
        <FinishTile label={t('partial.a11y.snap')} onPress={() => router.push(`/sheets/sample-photos?mode=shoeSnap&parent=${row.id}`)}>
          <Icon name="camera" size="regular" color={colors.ink} />
        </FinishTile>
        <TextLink title={t('common.skip')} color="ink2" compact onPress={() => void fitCheck.skipFinish(row.id)} />
      </View>
    </View>
  );
}

export { PartialLabel };
