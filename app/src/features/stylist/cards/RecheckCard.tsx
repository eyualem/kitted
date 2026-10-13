// S6r Re-check card (02 D10) and S21 "change not seen". The delta is like for like: the new
// photo is merged onto the first reading at the first check's occasion.
import { router } from 'expo-router';
import { View } from 'react-native';
import {
  DeltaRow, FixRow, KButton, KCard, KCardSection, KText, ScoreBlock, Seam, TagLine, TextLink, TextLinkRow, spokenScore,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { notSeenProblem, recheckSummary } from '@/features/fitcheck/explain';
import { fitCheck } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { signed } from '@/i18n/format';
import { occasionLabel } from '../thread';
import { FitCheckCard, SHARE_CARD_BUILT } from './FitCheckCard';

export function RecheckCard({ checkId }: { checkId: string }) {
  const row = useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
  const parent = useLive(['fitChecks', 'readings'], async () => {
    const p = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    const reading = p?.readingId ? (await store.readings.get(p.readingId))?.reading ?? null : null;
    return p ? { row: p, reading } : null;
  }, [row?.parentId]);
  if (!row) return null;
  if (row.status !== 'scored' || !row.details.recheck) return <FitCheckCard checkId={checkId} />;
  const rc = row.details.recheck;
  const now = row.score ?? 0;
  const occasionWord = occasionLabel(row.occasion);
  // The same photo again (#219): nothing was re-read or counted; say so and ask for a new photo after the fix.
  if (rc.samePhoto) {
    return (
      <KCard
        accessibilityLabel={t('card.a11y.recheckSame', { occasion: occasionWord, now: spokenScore(now), word: scoreWordLabel(now) })}
        // The card is one VoiceOver element: its button is an action, or VoiceOver can't reach it.
        accessibilityActions={[{ name: 'newPhoto', label: t('recheck.samePhoto.button') }]}
        onAccessibilityAction={() => router.push(`/camera?mode=recheck&parent=${row.parentId}`)}
      >
        <KCardSection gap={12}>
          <TagLine left={t('card.tag.recheck')} right={occasionWord} />
          <ScoreBlock score={now} />
          <KText role="cardSummary">{t('recheck.samePhoto')}</KText>
        </KCardSection>
        <KCardSection gap={4} style={{ paddingTop: 4 }}>
          <KButton
            title={t('recheck.samePhoto.button')} icon="camera" size="regular" fullWidth
            onPress={() => router.push(`/camera?mode=recheck&parent=${row.parentId}`)}
          />
        </KCardSection>
      </KCard>
    );
  }
  const notSeen = rc.notSeen && !row.details.confirmed;
  const done = rc.doneFixes[0];
  const occasion = occasionLabel(row.occasion);
  const outcome = { after: now, doneFixes: rc.doneFixes.map((d) => ({ ...(parent?.row.fixes.find((f) => f.copy === d.copy) ?? { target: '' }), earned: d.earned })) };
  const summary = recheckSummary(outcome as never);
  const problem = parent?.reading ? notSeenProblem(parent.reading, parent.row.fixes) : '';
  const iDidTitle = t('recheck.iDid', { fixPast: t(parent?.row.fixes.some((f) => f.edits.some((e) => e.op === 'add_held')) ? 'recheck.fixPast.held' : 'recheck.fixPast.generic') });
  const tryAnother = () => router.push(`/camera?mode=recheck&parent=${row.parentId}`);
  // One VoiceOver element: every button on it is also an action (the "not seen" card has its own two).
  const actions = notSeen
    ? [{ name: 'iDid', label: iDidTitle }, { name: 'tryAnother', label: t('recheck.tryAnother') }]
    : [...(SHARE_CARD_BUILT ? [{ name: 'share', label: t('recheck.share') }] : []), { name: 'tell', label: t('recheck.tellMe') }];
  const go = {
    iDid: () => void fitCheck.confirmFixes(row.id),
    tryAnother,
    share: () => router.push(`/share/${row.id}`),
    tell: () => router.push(`/sheets/tell-me/${row.id}`),
  };
  const label = notSeen
    ? `${t('card.tag.recheck')}, ${occasion}. ${t('recheck.notSeen', { problem })}`
    : t('card.a11y.recheck', { occasion, was: spokenScore(rc.parentScore), now: spokenScore(now), delta: rc.delta.toFixed(1), word: scoreWordLabel(now), fix: done?.copy ?? '' });
  return (
    <KCard
      accessibilityLabel={label}
      accessibilityActions={actions}
      onAccessibilityAction={(e) => go[e.nativeEvent.actionName as keyof typeof go]?.()}
    >
      <KCardSection gap={12}>
        <TagLine left={t('card.tag.recheck')} right={occasion} />
        {notSeen ? (
          <>
            <ScoreBlock score={now} />
            <KText role="cardSummary">{t('recheck.notSeen', { problem })}</KText>
          </>
        ) : (
          <>
            <DeltaRow was={rc.parentScore} now={now} />
            <KText role="cardSummary">
              {`${summary.lead} `}
              <KText role="cardSummary" weight="600">
                {summary.word}
              </KText>
              {` ${summary.tail}`}
              {row.details.confirmed ? ` ${t('recheck.tell.confirmed')}` : ''}
            </KText>
          </>
        )}
      </KCardSection>
      {!notSeen && rc.doneFixes.length > 0 ? (
        <>
          <Seam />
          <KCardSection paddingVertical={4} gap={0}>
            {rc.doneFixes.map((d, i) => (
              <FixRow key={i} number={i + 1} title={d.copy} gain={signed(d.earned)} done />
            ))}
          </KCardSection>
        </>
      ) : null}
      <KCardSection gap={4} style={{ paddingTop: 4 }}>
        {notSeen ? (
          <View style={{ gap: 8 }}>
            <KButton title={iDidTitle} size="regular" fullWidth onPress={go.iDid} />
            <KButton title={t('recheck.tryAnother')} size="regular" kind="secondary" fullWidth onPress={tryAnother} />
          </View>
        ) : (
          <>
            {SHARE_CARD_BUILT ? (
              <KButton title={t('recheck.share')} icon="share" size="regular" fullWidth onPress={() => router.push(`/share/${row.id}`)} />
            ) : null}
            <TextLinkRow justify="center">
              <TextLink title={t('recheck.tellMe')} compact onPress={() => router.push(`/sheets/tell-me/${row.id}`)} />
            </TextLinkRow>
          </>
        )}
      </KCardSection>
    </KCard>
  );
}
