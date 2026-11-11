// Kit's first-check offer (T39, specs/onboarding-screens.md OS5; tasks/T39/DESIGN.md phone 8): under Kit's first
// message at the end of setup. "Want to check a fit now?" and its line are one VoiceOver element (no header trait);
// Check my fit (the camera, with the agreement first before he has agreed) and Later stay separate buttons, since this
// is the one thing setup asks him to do. The buttons go for good after Later, Not now on the agreement, or any scored
// check (offerButtonsShow), and never show in Past chats (readOnly).
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, space } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { loadOfferState, offerButtonsShow, tapLater } from './firstCheckOffer';

const later = () => {
  void tapLater(store, sessionClock.nowMs(), newId).catch((e: unknown) => console.error('[offer] Later failed', e));
};

export function FirstCheckOfferCard({ readOnly }: { m: ChatMessage; readOnly?: boolean }) {
  const state = useLive(['fitChecks', 'chat', 'kv'], () => loadOfferState(store), []);
  const buttons = !readOnly && state !== undefined && offerButtonsShow(state);
  const title = t('offer.title');
  const body = t('offer.body');
  return (
    <View testID="offer-card">
      <KCard>
        <KCardSection>
          <View testID="offer-text" accessible accessibilityLabel={`${title} ${body}`} style={{ gap: space.xs }}>
            <KText testID="offer-title" variant="headline">
              {title}
            </KText>
            <KText testID="offer-body" variant="subheadline" color="ink2">
              {body}
            </KText>
          </View>
          {buttons ? (
            <View testID="offer-buttons" style={{ gap: space.s, paddingTop: space.xs }}>
              <KButton
                title={t('composer.check')}
                size="regular"
                fullWidth
                icon="camera"
                accessibilityLabel={t('composer.a11y.camera')}
                onPress={() => router.push('/camera')}
              />
              <KButton title={t('offer.later')} kind="secondary" size="regular" fullWidth onPress={later} />
            </View>
          ) : null}
        </KCardSection>
      </KCard>
    </View>
  );
}
