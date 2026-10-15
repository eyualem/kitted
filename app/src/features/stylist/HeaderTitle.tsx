// "Stylist" + the quota line as the nav title (05 T25: no stable subtitle option on SDK 57). The line is the check's
// (02 D12) until 3 or fewer questions are left today, then "{n} questions left today" (02 S25, 07 §6.2).
import { View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, KText } from '@/design-system';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { stylistSubtitle } from '@/services/quota';

export function StylistHeaderTitle() {
  const sub = useLive(['usage', 'fitChecks'], async () => stylistSubtitle(await quota.snapshot()), []);
  const line = sub ? t(sub.key, sub.n !== undefined ? { n: sub.n } : undefined) : null;
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityRole="header" accessibilityLabel={line ? `${t('stylist.title')}, ${line}` : t('stylist.title')}>
      {/* Scales with Dynamic Type up to the controls' cap, like the other bar text. */}
      <KText variant="headline" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} numberOfLines={1}>
        {t('stylist.title')}
      </KText>
      {line ? (
        <KText variant="caption" weight="500" color="ink3" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} numberOfLines={1}>
          {line}
        </KText>
      ) : null}
    </View>
  );
}
