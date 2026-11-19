// The follow-up taps under the latest answer (specs/kit-stylist-chat.md KC1.3; T104): 0 to 3 of them, checked by code
// (cards.ts). A tap sends it as his message, and it counts as a question (KC10.2). The screen passes them to the latest
// answer's row only; Past chats never show them.
import { View } from 'react-native';
import { Chip, ChipFlow, space } from '@/design-system';
import { sendQuestion } from '@/features/stylist/ask';
import { Enter } from '@/features/stylist/Enter';

/** `enter`: they fade in after the card, 50 ms apart (log #510). */
export function FollowUpRow({ taps, enter = false }: { taps: readonly string[]; enter?: boolean }) {
  if (taps.length === 0) return null;
  return (
    <View style={{ paddingTop: space.s }}>
      <ChipFlow>
        {taps.map((tap, i) => (
          <Enter key={tap} on={enter} tap={i}>
            <Chip title={tap} onPress={() => void sendQuestion(tap)} />
          </Enter>
        ))}
      </ChipFlow>
    </View>
  );
}
