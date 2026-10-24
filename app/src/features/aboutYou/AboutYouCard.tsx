// Kit's "About you" card (10-onboarding.md §10–§11, #373, #375): an inline card, never a pop-up, asking one thing: how
// he likes clothes to fit. A tap on Fitted, Regular or Relaxed saves it; Not now folds it to one line; once a fit is
// given (here or in You) it says so. Past chats: no choices. Height and build are no longer asked (#375).
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, StylistMessage, TagLine, TextLink, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { FITS, fitLabel } from '@/features/onboarding/basics';
import { t } from '@/i18n/en';
import { aboutYouCardView, fitGiven, type AboutYouCardState, type AboutYouVariant } from './rules';
import { aboutYou } from './session';

export function AboutYouCard({ m, showHeader, readOnly }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const { isAccessibilitySize } = useTheme();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  if (profile === undefined) return null;
  const variant: AboutYouVariant = m.payload.variant === 'answer' ? 'answer' : 'visit';
  const state: AboutYouCardState = m.payload.state === 'declined' || m.payload.state === 'saved' ? m.payload.state : 'open';
  const v = aboutYouCardView({ variant, state }, fitGiven(profile), !!readOnly);
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
        {v.choices ? (
          <View style={{ gap: space.s, paddingTop: space.xs }}>
            {/* The same three choices as You → Style profile; side by side, stacked at the largest text sizes. */}
            <View style={{ flexDirection: isAccessibilitySize ? 'column' : 'row', gap: space.s }}>
              {FITS.map((f) => (
                <View key={f} style={isAccessibilitySize ? undefined : { flex: 1 }}>
                  <KButton title={fitLabel(f)} kind="secondary" size="regular" fullWidth onPress={() => void aboutYou.pick(m.id, f)} />
                </View>
              ))}
            </View>
            <View style={{ alignItems: 'center' }}>
              <TextLink title={t('about.notNow')} color="ink2" onPress={() => void aboutYou.notNow(m.id)} />
            </View>
          </View>
        ) : null}
      </KCardSection>
    </KCard>
  );
}
