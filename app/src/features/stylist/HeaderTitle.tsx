// "Stylist" + the quota line as the nav title (05 T25: no stable subtitle option on SDK 57).
import { View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, KText } from '@/design-system';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { quotaLine } from '@/services/quota';

export function StylistHeaderTitle() {
  const line = useLive(['usage', 'fitChecks'], async () => quotaLine(await quota.snapshot()), []);
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityRole="header" accessibilityLabel={line ? `${t('stylist.title')}, ${t(line)}` : t('stylist.title')}>
      {/* Scales with Dynamic Type up to the controls' cap, like the other bar text. */}
      <KText variant="headline" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} numberOfLines={1}>
        {t('stylist.title')}
      </KText>
      {line ? (
        <KText variant="caption" weight="500" color="ink3" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} numberOfLines={1}>
          {t(line)}
        </KText>
      ) : null}
    </View>
  );
}
