// Y1 · You (02 D17). Until P5 builds the profile card, settings and the sub-screens, it shows
// the parts that are real today: what your stylist knows, today's usage, and the privacy line.
// Rows don't push anywhere yet, so they carry no chevrons. No dev placeholder text in a tab
// (DECISIONS-LOG #56).
import { ScrollView, View } from 'react-native';
import { Icon, KCard, KText, RowDivider, TagLine, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';

const FACTS_SHOWN = 4;

export default function YouScreen() {
  const { colors } = useTheme();
  const facts = useLive(['facts'], async () => (await store.facts.all()).filter((f) => !f.isDeleted).sort((a, b) => b.createdAt - a.createdAt), []);
  const usage = useLive(['usage', 'fitChecks'], () => quota.snapshot(), []);
  if (!facts || !usage) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      <TagLine left={t('you.knows')} right={facts.length > FACTS_SHOWN ? t('you.knowsAll', { n: facts.length }) : undefined} />
      <KCard>
        {facts.length === 0 ? (
          <KText variant="subheadline" color="ink2" style={{ paddingVertical: space.rowY, paddingHorizontal: space.rowX }}>
            {t('you.facts.empty')}
          </KText>
        ) : (
          facts.slice(0, FACTS_SHOWN).map((f, i) => (
            <View key={f.id}>
              {i > 0 ? <RowDivider /> : null}
              <View style={{ paddingVertical: space.rowY, paddingHorizontal: space.rowX, gap: 2 }}>
                <KText variant="subheadline" weight="600" color={f.source === 'guess' ? 'ink2' : 'ink'} style={f.source === 'guess' ? { fontStyle: 'italic' } : undefined}>
                  {f.value}
                </KText>
              </View>
            </View>
          ))
        )}
      </KCard>
      <KCard>
        <View style={{ paddingVertical: space.rowY, paddingHorizontal: space.rowX, gap: 2 }}>
          <KText variant="callout" weight="600">
            {usage.pro ? t('you.plan.pro') : t('you.plan.free')}
          </KText>
          <KText variant="footnote" color="ink2">
            {usage.pro ? t('you.plan.proLine') : t('you.plan.usage', { checks: usage.checksUsed, questions: usage.questionsUsed })}
          </KText>
        </View>
      </KCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.xs, paddingVertical: space.xs }}>
        <Icon name="lock" color="ink3" />
        <KText variant="subheadline" weight="500" style={{ flex: 1 }}>
          {t('you.privacyRow')}
        </KText>
      </View>
    </ScrollView>
  );
}
