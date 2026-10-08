// S7 Why this score (02 D8): the math, line by line; "What I read" pills open the correction
// sheet on that piece; "How I score ›" swaps to the plain-words explainer in place.
import { stylesFor } from '@/features/fitcheck/lens';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KText, LedgerRow, LedgerTotal, Pill, TagLine, displayScore } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { garmentLabel, whatIRead } from '@/features/fitcheck/labels';
import { styleLabel } from '@/features/morning/copy';
import { signed } from '@/i18n/format';
import { styleEffects } from '@kitted/core';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t, type StringKey } from '@/i18n/en';
import { whyRows } from './ledgerRows';

export function WhySheet() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const [how, setHow] = useState(false);
  const data = useLive(['fitChecks', 'readings', 'profile'], async () => {
    const row = await store.fitChecks.get(checkId);
    const reading = row?.readingId ? (await store.readings.get(row.readingId))?.reading : undefined;
    const p = await store.profile.get('me');
    if (!row || !reading) return null;
    const lens = styleEffects(reading, { occasion: row.occasion, style: row.style, boldness: p?.boldness ?? null });
    return { row, reading, lens, rows: whyRows(reading, row.occasion, stylesFor(row.style, p?.styles ?? []), p?.boldness ?? null) };
  }, [checkId]);
  if (!data || !data.rows) return <SheetScaffold title={t('why.how.title')} />;
  const { row, reading, rows, lens } = data;
  const score = row.score ?? 0;

  if (how) {
    return (
      <SheetScaffold title={t('why.how.title')} onClose={() => setHow(false)}>
        {(['why.how.body1', 'why.how.body2', 'why.how.body3', 'why.how.body4', 'why.how.body5'] as const).map((k) => (
          <KText key={k} variant="body">
            {t(k)}
          </KText>
        ))}
      </SheetScaffold>
    );
  }

  const mistakes = rows.ledger.rules.length;
  const pills = whatIRead(reading);
  const wornCount = reading.garments.filter((g) => g.certainty !== 'unsure' && g.category !== 'accessory').length;
  return (
    <SheetScaffold title={t('why.title', { score: displayScore(score) })} subtitle={t('why.sub')}>
      <View>
        {rows.rows.map((r) => (
          <LedgerRow key={r.key} rule={r.rule} item={r.item} amount={r.amount} valueText={r.valueText} zero={r.zero} />
        ))}
        <LedgerTotal score={score} note={mistakes === 0 ? t('why.noMistakes') : t('why.mistakes', { n: mistakes })} />
      </View>
      {/* What the style changed (02 "S6s", #61). Below the total, so the rows above still add up. */}
      {lens.effects.length > 0 && row.style ? (
        <View style={{ gap: 2, paddingTop: 12 }}>
          <KText variant="footnote" color="ink2" mono="label" accessibilityRole="header">
            {t('why.style.header', { style: styleLabel(row.style).toLowerCase() })}
          </KText>
          {lens.effects.map((e) => {
            const g = e.culpritIndex !== null ? reading.garments[e.culpritIndex] : undefined;
            const off = e.withStyle < e.general;
            return (
              <View key={e.id} accessible style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'transparent' }}>
                <View style={{ flex: 1, gap: 1 }}>
                  <KText variant="subheadline" weight="600">
                    {g ? garmentLabel(g) : t(`why.rule.${e.id}` as StringKey)}
                  </KText>
                  <KText variant="footnote" color="ink2">
                    {off
                      ? t('why.style.off', { style: styleLabel(row.style).toLowerCase(), amount: signed(-e.general) })
                      : t('why.style.on', { style: styleLabel(row.style).toLowerCase() })}
                  </KText>
                </View>
                <KText variant="footnote" color="ink3">
                  {off && e.withStyle === 0 ? t('why.style.notCounted') : signed(-e.withStyle)}
                </KText>
              </View>
            );
          })}
          <KText role="finePrint">{t('why.style.footer')}</KText>
        </View>
      ) : null}
      <View style={{ gap: 8, paddingTop: 12 }}>
        <TagLine left={t('why.read')} right={t('why.howLink')} rightColor="accent" onPressRight={() => setHow(true)} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {pills.map((p, i) => (
            <Pressable
              key={p + i}
              accessibilityRole="button"
              accessibilityLabel={t('why.a11y.pill', { garment: p })}
              hitSlop={{ top: 9, bottom: 9 }}
              disabled={i >= wornCount}
              onPress={() => {
                router.back();
                setTimeout(() => router.push(`/sheets/correct/${row.id}?reason=detail&garment=${i}`), 350);
              }}
            >
              <Pill title={p} />
            </Pressable>
          ))}
        </View>
      </View>
      <KText role="finePrint" style={{ paddingTop: 8 }}>
        {t('why.footer')}
      </KText>
    </SheetScaffold>
  );
}
