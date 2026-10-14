// Y3 · What your stylist knows (02 §3.6 Y3; revised #246): everything the stylist uses, in the second person, each
// with where it came from. A tap opens the fact sheet (Edit, Delete); long-press or the VoiceOver action deletes
// (soft, with "Forgot it." + Undo). Guesses are asked as Yes / Not really questions.
import { ScrollView } from 'react-native';
import { KText, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { FactCard } from '@/features/you/FactRows';
import { liveFacts } from '@/features/you/facts';
import { t } from '@/i18n/en';

export default function WhatYourStylistKnowsScreen() {
  const { colors } = useTheme();
  const facts = useLive(['facts'], async () => liveFacts(await store.facts.all()), []);
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.m, paddingBottom: space.xxxl }}>
      <KText variant="subheadline" color="ink2" style={{ paddingHorizontal: space.xs }}>
        {t('knows.header')}
      </KText>
      {facts ? <FactCard facts={facts} /> : null}
      {facts && facts.length > 0 ? (
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs }}>
          {t('knows.footer')}
        </KText>
      ) : null}
    </ScrollView>
  );
}
