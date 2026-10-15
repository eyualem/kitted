// A3 · "Keep your fits" (10-onboarding.md §3): an inline card, never a pop-up, after he's seen his first score.
// Save my fits opens A1; Not now folds it to one line. Once he's signed in (here or anywhere) it says so.
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, StylistMessage, TagLine, space } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { ACCOUNT_KEY, getAccount } from './account';
import { accountOffer } from './offerSession';

export function AccountOfferCard({ m, showHeader, readOnly }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const account = useLive(['kv'], () => getAccount(store), [], ACCOUNT_KEY);
  const pieces = typeof m.payload.pieces === 'number' ? m.payload.pieces : 0;
  if (account === undefined) return null;
  if (account) {
    return <StylistMessage showHeader={showHeader}>{t('acct.offer.signedIn', { provider: t(`acct.provider.${account.provider}`) })}</StylistMessage>;
  }
  if (m.payload.state === 'declined' || readOnly) {
    return m.payload.state === 'declined' ? <StylistMessage showHeader={showHeader}>{t('acct.offer.declined')}</StylistMessage> : null;
  }
  const body = pieces > 0 ? t('acct.offer.bodyPieces', { n: pieces }) : t('acct.offer.body');
  return (
    <KCard>
      <KCardSection>
        <TagLine left={t('acct.offer.tag')} right={t('acct.offer.tagRight')} />
        <View style={{ gap: space.xs }} accessible accessibilityLabel={t('acct.offer.a11y', { body })}>
          <KText variant="headline" accessibilityRole="header">
            {t('acct.offer.title')}
          </KText>
          <KText variant="subheadline" color="ink2">
            {body}
          </KText>
        </View>
        <View style={{ gap: space.s, paddingTop: space.xs }}>
          <KButton title={t('acct.offer.save')} size="regular" fullWidth onPress={() => router.push({ pathname: '/sheets/sign-in', params: { from: 'offer' } })} />
          <KButton title={t('acct.offer.notNow')} kind="secondary" size="regular" fullWidth onPress={() => void accountOffer.decline(m.id)} />
        </View>
      </KCardSection>
    </KCard>
  );
}
