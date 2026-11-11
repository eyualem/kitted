// "I get dressed at" + the time capsule (specs/notifications.md NT1 step 2, NT4; DESIGN "The time row"): shared by Kit's
// ask and the comeback question. The label is hidden from VoiceOver because the capsule says it ("I get dressed at,
// 8:00 am"). The menu is Settings' own half-hour list (MorphPicker), with his stored time kept if it's off the list.
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { KText, MorphPicker, space } from '@/design-system';
import { ideaTimeLabel, ideaTimeOptions, parseIdeaTime } from '@/features/settings/prefs';
import { t } from '@/i18n/en';

export function NotifyTimeRow({ time, onPick, testID, focusOnMount = false }: { time: string; onPick: (hhmm: string) => void; testID: string; focusOnMount?: boolean }) {
  const hhmm = parseIdeaTime(time);
  const label = t('notif.ask.label');
  const row = useRef<View>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    // The row's first VoiceOver element is the time ("I get dressed at, 8:00 am"); its label is hidden.
    if (row.current) AccessibilityInfo.setAccessibilityFocus(findNodeHandle(row.current) as number);
  }, [focusOnMount]);
  return (
    <View ref={row} testID={testID} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s }}>
      <KText variant="subheadline" color="ink2" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {label}
      </KText>
      <MorphPicker
        label={ideaTimeLabel(hhmm)}
        value={hhmm}
        sections={[{ options: ideaTimeOptions(hhmm).map((v) => ({ value: v, label: ideaTimeLabel(v) })) }]}
        onPick={onPick}
        accessibilityLabel={t('settings.a11y.value', { label, value: ideaTimeLabel(hhmm) })}
      />
    </View>
  );
}
