// S27 · the support card (02): caught on the phone before anything is sent. No styling content, a heart in ink2,
// and one button with the call or text choice. Never counted.
import { View } from 'react-native';
import { Icon, KButton, KCard, KCardSection, KText } from '@/design-system';
import { t } from '@/i18n/en';
import { chooseSupport } from './supportChoice';

export function SupportCard() {
  return (
    <KCard>
      <KCardSection>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ paddingTop: 2 }}>
            <Icon name="support" size="regular" color="ink2" scalesWithText />
          </View>
          <KText variant="body" style={{ flex: 1 }}>
            {t('support.text')}
          </KText>
        </View>
        <KButton title={t('support.cta')} onPress={chooseSupport} size="regular" fullWidth />
      </KCardSection>
    </KCard>
  );
}
