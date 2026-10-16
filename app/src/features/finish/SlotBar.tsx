// SlotBar (03 §5): 12 (or 3) equal slots, gap 4, 8 tall, radius 4. Filled = ink, empty = surface2. C1, C5, L3.
import { View } from 'react-native';
import { useTheme } from '@/design-system';

export function SlotBar({ filled, slots }: { filled: number; slots: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: slots }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < filled ? colors.ink : colors.surface2 }} />
      ))}
    </View>
  );
}
