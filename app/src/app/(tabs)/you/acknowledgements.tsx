// You › Settings › Acknowledgements: the bundled font's credit and its licence in full (the SIL OFL asks for the
// licence to travel with the font). The text is a TS string generated from assets/fonts/OFL.txt.
import { View } from 'react-native';
import { KCard, KText, radius, space } from '@/design-system';
import { ARCHIVO_OFL_TEXT } from '@/features/settings/oflText';
import { SettingsScroll } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';

export default function AcknowledgementsScreen() {
  return (
    <SettingsScroll>
      <KCard radius={radius.cardSmall}>
        <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.l, gap: space.m }}>
          <KText variant="callout" weight="600">
            {t('ack.archivo')}
          </KText>
          <KText variant="footnote" color="ink2">
            {ARCHIVO_OFL_TEXT}
          </KText>
        </View>
      </KCard>
    </SettingsScroll>
  );
}
