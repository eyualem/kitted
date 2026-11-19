// The follow-up taps under the latest answer (specs/kit-stylist-chat.md KC1.3; T104): 0 to 3 of them, checked by code
// (cards.ts). A tap sends it as his message, and it counts as a question (KC10.2). The screen passes them to the latest
// answer's row only; Past chats never show them.
import { View } from 'react-native';
import { Chip, ChipFlow, space } from '@/design-system';
import { sendQuestion } from '@/features/stylist/ask';

export function FollowUpRow({ taps }: { taps: readonly string[] }) {
  if (taps.length === 0) return null;
  return (
    <View style={{ paddingTop: space.s }}>
      <ChipFlow>
        {taps.map((tap) => (
          <Chip key={tap} title={tap} onPress={() => void sendQuestion(tap)} />
        ))}
      </ChipFlow>
    </View>
  );
}
