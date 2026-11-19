// Kit's typing dots before its hello (useTypingBeat): the same dots as an answer on its way (a still "…" with Reduce
// Motion), in Kit's spot, read as one element, "Kit is writing" (the answer's own words).
import { View } from 'react-native';
import { StylistMessage } from '@/design-system';
import { TypingDots } from '@/features/ask/LiveAnswerRow';
import { t } from '@/i18n/en';

export function KitTypingRow() {
  return (
    <View accessible accessibilityLabel={t('ask.a11yWriting')}>
      <StylistMessage showHeader body={<TypingDots />}>
        {''}
      </StylistMessage>
    </View>
  );
}
