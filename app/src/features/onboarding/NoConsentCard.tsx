// S26 · Turn on fit checks (02 S26; 09-ui-review §20.8 G23): after "Not now" on consent, the thread isn't bare. Kit's
// line "Send me a fit. I'll score it and start your closet.", then the card: Review and turn on (the consent sheet;
// agreeing opens the camera) and See an example (the example check as a sheet). Once he has agreed, the buttons go and
// the line stays as history. One VoiceOver element, its buttons as actions.
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, StylistMessage, space } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { hasConsent } from './complete';

const review = () => router.push('/sheets/consent');
const example = () => router.push('/sheets/example');

export function NoConsentCard({ m, showHeader, readOnly }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const agreed = useLive(['profile'], () => hasConsent(store), []);
  const title = t('noConsent.title');
  const body = t('noConsent.body', { provider: t('config.providerDefault') });
  return (
    <View style={{ gap: space.s }}>
      <StylistMessage showHeader={showHeader}>{m.text ?? t('noConsent.greeting')}</StylistMessage>
      {agreed === false && !readOnly ? (
        <KCard
          accessibilityLabel={`${title}. ${body}`}
          accessibilityActions={[{ name: 'review', label: t('noConsent.cta') }, { name: 'example', label: t('noConsent.example') }]}
          onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'review' ? review() : e.nativeEvent.actionName === 'example' ? example() : undefined)}
        >
          <KCardSection>
            <View style={{ gap: space.xs }}>
              <KText variant="headline">{title}</KText>
              <KText variant="subheadline" color="ink2">
                {body}
              </KText>
            </View>
            <View style={{ gap: space.s, paddingTop: space.xs }}>
              <KButton title={t('noConsent.cta')} size="regular" fullWidth onPress={review} />
              <KButton title={t('noConsent.example')} kind="secondary" size="regular" fullWidth onPress={example} />
            </View>
          </KCardSection>
        </KCard>
      ) : null}
    </View>
  );
}
