// The fit-check card in the thread (02 D6 → D7 / D11 / S19 / S22 / S23). One slot that shows the
// live reading, then the result, from the same fit_checks row. One VoiceOver element with
// custom actions; the buttons inside are also there for touch.
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import {
  FinishTile, FixRow, GarmentIcon, Icon, IconButton, KButton, KCard, KCardSection, KText, PartialLabel, RowDivider, ScoreBlock, Seam,
  MorphPicker, TextLink, TextLinkRow, TipLine, displayScore, opacity, size, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { store } from '@/data/db';
import { OCCASIONS, type ClosetItemRow, type FitCheckRow } from '@/data/types';
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
import { useWeatherTip } from '@/features/morning/weatherTip';
import { styleLabel } from '@/features/morning/copy';
import { confirmLens } from '@/features/fitcheck/lensUi';
import { justAnswered, tapAs, TapCard, tapWord } from '@/features/tap/TapCard';
import { ClosetSummaryRow } from '@/features/closet/ClosetSummaryRow';
import { closetSummaryText } from '@/features/closet/summaryText';

function useCheck(checkId: string) {
  return useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
}

function useCloset() {
  return useLive(['closet'], () => store.closet.all(), []);
}

export function FitCheckCard({ checkId }: { checkId: string }) {
  const row = useCheck(checkId);
  const wxTip = useWeatherTip(row);
  const asked = useTapGarment(row);
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
  // Read, waiting for the one quick tap (02 "S5q"). From the row, so it survives the app closing.
  if (row.status === 'asking' && row.details.tap) return <TapCard row={row} />;
  if (row.status === 'failed') return <FailureCard row={row} />;
  if (row.status === 'notClothed' || row.status === 'unreadable') return <StatusCard text={t(row.status === 'notClothed' ? 'notClothed.text' : 'unreadable.text')} />;
  return <ScoredCard row={row} wxTip={wxTip} asked={asked} />;
}

/** Where the one quick tap's garment is in the CURRENT reading (a correction makes a new one), and its type now. */
interface AskedGarment {
  index: number;
  value: string | null;
}

function useTapGarment(row: FitCheckRow | null | undefined): AskedGarment | null {
  const tap = row?.details.tap;
  return useLive(
    ['readings'],
    async () => {
      if (!tap || !row?.readingId) return null;
      const r = (await store.readings.get(row.readingId))?.reading;
      if (!r) return null;
      const at = r.garments.map((g, i) => [g, i] as const).filter(([g]) => g.category === tap.slot)[tap.ordinal];
      return at ? { index: at[1], value: typeof at[0].subcategory === 'string' ? at[0].subcategory : null } : null;
    },
    [row?.readingId, tap?.slot, tap?.ordinal],
  ) ?? null;
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
  const key = code === 'timeout' ? 'fail.timeout' : code === 'offline' ? 'fail.offline' : code === 'paused' ? 'fail.paused' : code === 'unknownPhoto' ? 'demo.unknownPhoto'
    : code === 'replaced' ? 'fail.replaced' : 'fail.ai';
  return (
    <KCard accessibilityLabel={t(key)}>
      <KCardSection gap={6}>
        <KText role="cardSummary">{t(key)}</KText>
        {code !== 'unknownPhoto' && code !== 'replaced' ? <KButton title={t('common.tryAgain')} size="regular" kind="secondary" onPress={() => void fitCheck.retry(row.id)} /> : null}
      </KCardSection>
    </KCard>
  );
}

function ScoredCard({ row, wxTip, asked }: { row: FitCheckRow; wxTip: string | null; asked: AskedGarment | null }) {
  const closet = useCloset() ?? [];
  const tap = row.details.tap;
  // After the one quick tap: S8 prefilled with the other answer (the pair's other half; for the shoe question, the
  // next kind in the question's order, and the sheet lists every shoe type).
  const otherAnswer = tap?.answer ? tap.order.find((v) => v !== tap.answer) : undefined;
  const changeAnswer = tap?.answer && asked && asked.value === tap.answer && otherAnswer
    ? () => router.push(`/sheets/correct/${row.id}?reason=item&garment=${asked.index}&field=subcategory&value=${otherAnswer}`)
    : null;
  // "Scored as jeans. Not right? Tap." only after a Skip, while the piece still has the value it was scored as.
  const skippedAs = tap?.skipped && changeAnswer ? tapAs(tapWord(tap, tap.answer!)) : null;
  const readsAs = row.details.readsAs ? t('readsAs.line', { style: styleLabel(row.details.readsAs).toLowerCase() }) : null;
  const score = row.score ?? 0;
  const partial = row.isPartial;
  const finished = !partial && (row.snapState === 'snapped' || row.snapState === 'closetPick');
  const partialText = finished
    ? t(row.snapState === 'closetPick' ? 'partial.fullCloset' : 'partial.full')
    : row.notRated.includes('bottom half') ? t('partial.label.topOnly') : t('partial.label.shoes');
  // Two rule targets can land on the same move ("Swap to your Navy crewneck" fixes both "top too
  // big" and "top vs your style"); rubric.py lists it twice, the card shows it once (#42).
  const fixes = row.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);
  const top = fixes[0];
  const dialed = fixes.length === 0;
  const nextLevel = row.details.nextLevel?.[0];
  const recheckOpen = isRecheckOpen(row, sessionClock.nowMs(), sessionClock);
  // "Added 3 to Closet · 1 question" / "Checking the details…" (#91): from the closet summary.
  const closetLine = closetSummaryText(row.details.closetSummary, sessionClock.nowMs());
  const addedItems = (closetLine?.itemIds ?? []).map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
  const showCloset = !!closetLine && (closetLine.pending || addedItems.length > 0) && !partial;
  const finishing = partial && row.snapState === 'pending' && row.details.finish !== undefined;
  const scoreText = displayScore(score);

  const actions = [
    { name: 'why', label: t('card.why', { score: scoreText }) },
    { name: 'nqr', label: t('card.nqr') },
    ...(recheckOpen ? [{ name: 'recheck', label: t('card.recheck') }] : []),
    { name: 'share', label: t('card.share.a11y') },
    ...(showCloset ? [{ name: 'review', label: t('card.a11y.review') }] : []),
    { name: 'occasion', label: t('card.a11y.changeOccasion') },
    ...(changeAnswer ? [{ name: 'changeAnswer', label: t('tap.a11y.change') }] : []),
  ];
  const go = {
    why: () => router.push(`/sheets/why/${row.id}`),
    nqr: () => router.push(`/sheets/correct/${row.id}`),
    recheck: async () => {
      await fitCheck.postRecheckPrompt(row.id);
      router.push(`/camera?mode=recheck&parent=${row.id}`);
    },
    share: () => router.push(`/share/${row.id}`),
    review: () => router.push(`/sheets/added/${row.id}`),
    occasion: () => pickOccasion(row.occasion, (o) => void confirmLens(row, { occasion: o })),
    changeAnswer: () => changeAnswer?.(),
  };
  const label = [t('card.a11y.fitCheck', {
    occasion: occasionLabel(row.occasion),
    score: spokenScore(score),
    word: scoreWordLabel(score),
    partial: partial || finished ? `${partialText}. ` : '',
    summary: row.explanation ?? '',
    fix: top?.copy ?? t('card.noFixes'),
    tag: top?.tag ?? '',
  }), readsAs ? `${readsAs}.` : '', skippedAs ? t('tap.skipped', { choice: skippedAs }) : ''].filter(Boolean).join(' ');

  // Just answered the one quick tap here: say the score, then put VoiceOver on the result.
  const focusRef = useRef<View>(null);
  useEffect(() => {
    if (!justAnswered.has(row.id)) return;
    const h = setTimeout(() => {
      justAnswered.delete(row.id);
      AccessibilityInfo.announceForAccessibility?.(t('a11y.score', { score: spokenScore(score), word: scoreWordLabel(score) }));
      if (focusRef.current) AccessibilityInfo.sendAccessibilityEvent?.(focusRef.current, 'focus');
    }, 350);
    return () => clearTimeout(h);
  }, [row.id, score]);

  return (
    <View ref={focusRef} collapsable={false}>
      <KCard
        accessibilityLabel={label}
        accessibilityActions={actions}
        onAccessibilityAction={(e) => void go[e.nativeEvent.actionName as keyof typeof go]?.()}
      >
        <KCardSection>
          <LensTagline row={row} left={t(partial ? 'card.tag.partial' : 'card.tag.full')} />
          {partial || finished ? (
            <>
              <ScoreBlock score={score} partialLabel={partialText} partialDone={finished} />
              {row.explanation ? <KText variant="subheadline" color="ink2">{row.explanation}</KText> : null}
            </>
          ) : (
            <ScoreBlock score={score} verdict={row.explanation ?? undefined} />
          )}
          {readsAs ? <ReadsAsLine text={readsAs} /> : null}
          {skippedAs && changeAnswer ? <SkippedLine choice={skippedAs} onPress={changeAnswer} /> : null}
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
          {wxTip ? <TipLine lead={t('tip.wx.lead')} text={wxTip} /> : null}
        </KCardSection>
        <Seam />
        <KCardSection gap={6}>
          {showCloset && closetLine ? <ClosetSummaryRow items={addedItems} text={closetLine.text} onReview={go.review} /> : null}
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
            {/* `Later` (ruling 23) comes back in P4 with the "first 3 moves" card it leads to;
                until then a link that does nothing is worse than none. */}
          </TextLinkRow>
          {row.details.rescoredFrom ? (
            <KText variant="footnote" color="ink3">
              {t('rescore.footnote', {
                score: displayScore(row.details.rescoredFrom.score),
                lens: row.details.rescoredFrom.style !== row.style
                  ? styleLabel(row.details.rescoredFrom.style).toLowerCase()
                  : occasionLabel(row.details.rescoredFrom.occasion).toLowerCase(),
              })}
            </KText>
          ) : null}
        </KCardSection>
      </KCard>
    </View>
  );
}

/** "Fit check · Full" + the occasion (02 "S6s"). The occasion opens an in-card tray (a change asks first,
 *  #62). No style here: a style never changes the score (rubric v4); the card says "Reads as …" (#85). */
function LensTagline({ row, left }: { row: FitCheckRow; left: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
      <KText variant="footnote" color="ink2" mono="label">
        {left}
      </KText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MorphPicker
          plain
          label={occasionLabel(row.occasion)}
          value={row.occasion}
          sections={[{ options: OCCASIONS.map((o) => ({ value: o, label: occasionLabel(o) })) }]}
          onPick={(o) => void confirmLens(row, { occasion: o })}
          accessibilityLabel={t('card.a11y.changeOccasion')}
        />
      </View>
    </View>
  );
}

/** "Reads as streetwear" (02 "S6s", #85): the look the outfit reads as. Never changes the score. */
function ReadsAsLine({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 }}>
      <Icon name="tag" size="small" color="ink2" />
      <KText variant="footnote" color="ink2" style={{ flexShrink: 1 }}>
        {text}
      </KText>
    </View>
  );
}

/** After a Skip: "Scored as jeans. Not right? Tap." The whole inset opens S8 with the other answer picked. */
function SkippedLine({ choice, onPress }: { choice: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('tap.skipped', { choice })} ${t('tap.a11y.change')}`}
      style={({ pressed }) => ({
        minHeight: size.hit, justifyContent: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderCurve: 'continuous',
        paddingVertical: 8, paddingHorizontal: 12, opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <KText variant="footnote" color="ink2">
        {`${t('tap.skipped', { choice })} `}
        <KText variant="footnote" weight="600" color="accent">
          {t('tap.skipped.fix')}
        </KText>
      </KText>
    </Pressable>
  );
}

/** "Finish the check · Same shoes as Monday?" + the remembered pair, the camera, Skip (02 D11). */
function FinishRow({ row, closet }: { row: FitCheckRow; closet: ClosetItemRow[] }) {
  const { colors, isAccessibilitySize } = useTheme();
  const f = row.details.finish;
  const item = f?.suggestedItemId ? closet.find((c) => c.id === f.suggestedItemId) : undefined;
  const weekday = f?.weekday !== null && f?.weekday !== undefined ? weekdayName(f.weekday) : null;
  const remembered = item && weekday ? { item, weekday } : null;
  const hasShoes = closet.some((c) => c.slot === 'shoes' && !c.isDeleted);
  const second = remembered
    ? t('partial.finish.same', { weekday: remembered.weekday })
    : hasShoes ? t('partial.finish.snapOrPick') : t('partial.finish.snapOnly');
  return (
    // AX sizes: the text on its own line, the controls in a row under it (p2-design-spec 11 §5).
    <View style={isAccessibilitySize ? { gap: 8 } : { flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <KText variant="subheadline" color="ink2" style={{ flexShrink: 1 }}>
        <KText variant="subheadline" weight="600" color="ink">
          {t('partial.finish.title')}
        </KText>
        {`\n${second}`}
      </KText>
      <View style={{ marginLeft: isAccessibilitySize ? 0 : 'auto', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {remembered ? (
          <FinishTile
            filled
            label={t('partial.a11y.useSame', { shoes: remembered.item.name.toLowerCase(), weekday: remembered.weekday })}
            onPress={() => void fitCheck.pickShoes(row.id, remembered.item.id)}
          >
            <GarmentIcon type={garmentIconType(remembered.item.garment)} color={remembered.item.hex} size={36} />
          </FinishTile>
        ) : hasShoes ? (
          <FinishTile filled label={t('partial.a11y.pick')} onPress={() => router.push(`/sheets/pick-shoes/${row.id}`)}>
            <Icon name="shoes" size="regular" color={colors.ink} />
          </FinishTile>
        ) : null}
        <FinishTile label={t('partial.a11y.snap')} onPress={() => router.push(`/camera?mode=shoeSnap&parent=${row.id}`)}>
          <Icon name="camera" size="regular" color={colors.ink} />
        </FinishTile>
        <TextLink title={t('common.skip')} color="ink2" compact onPress={() => void fitCheck.skipFinish(row.id)} />
      </View>
    </View>
  );
}

export { PartialLabel };
