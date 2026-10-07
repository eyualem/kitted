// "Stylist" + the quota line as the nav title (05 T25: no stable subtitle option on SDK 57).
import { View } from 'react-native';
import { KText } from '@/design-system';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { quotaLine } from '@/services/quota';

export function StylistHeaderTitle() {
  const line = useLive(['usage', 'fitChecks'], async () => quotaLine(await quota.snapshot()), []);
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityRole="header" accessibilityLabel={line ? `${t('stylist.title')}, ${t(line)}` : t('stylist.title')}>
      <KText variant="headline" allowFontScaling={false}>
        {t('stylist.title')}
      </KText>
      {line ? (
        <KText variant="caption" weight="500" color="ink3" allowFontScaling={false}>
          {t(line)}
        </KText>
      ) : null}
    </View>
  );
}
