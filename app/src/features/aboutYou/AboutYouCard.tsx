// Kit's "About you" card (10-onboarding.md §10.1, #370): an inline card, never a pop-up. Add them opens the sheet; Not
// now folds it to one line; once he's given any of the three (here or in You) it says so. Past chats: no buttons.
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, StylistMessage, TagLine, space } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { aboutYouCardView, basicsGiven, type AboutYouCardState, type AboutYouVariant } from './rules';
import { aboutYou } from './session';

export function AboutYouCard({ m, showHeader, readOnly }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  if (profile === undefined) return null;
  const variant: AboutYouVariant = m.payload.variant === 'answer' ? 'answer' : 'visit';
  const state: AboutYouCardState = m.payload.state === 'declined' || m.payload.state === 'saved' ? m.payload.state : 'open';
  const v = aboutYouCardView({ variant, state }, basicsGiven(profile), !!readOnly);
  if (v.line) return <StylistMessage showHeader={showHeader}>{v.line}</StylistMessage>;
  return (
    <KCard>
      <KCardSection>
        <TagLine left={v.tagLeft} right={v.tagRight} />
        <View style={{ gap: space.xs }} accessible accessibilityLabel={t('about.a11y', { title: v.title, body: v.body })}>
          <KText variant="headline" accessibilityRole="header">
            {v.title}
          </KText>
          <KText variant="subheadline" color="ink2">
            {v.body}
          </KText>
        </View>
        {v.buttons ? (
          <View style={{ gap: space.s, paddingTop: space.xs }}>
            <KButton title={t('about.add')} size="regular" fullWidth onPress={() => router.push({ pathname: '/sheets/about-you', params: { msg: m.id } })} />
            <KButton title={t('about.notNow')} kind="secondary" size="regular" fullWidth onPress={() => void aboutYou.notNow(m.id)} />
          </View>
        ) : null}
      </KCardSection>
    </KCard>
  );
}
