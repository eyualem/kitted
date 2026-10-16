// An answer drawn as look C (founder, Oct 16, #302; 07 §15.4): the move on its own line (headline, ink), the reason
// under it (callout, ink2), and his pieces named in the reason as chips: a swatch in the piece's color and the name
// in ink, opening the piece page. Everything here comes from the answer's plain text and his closet (answerText.ts);
// nothing comes from model markup. The lead stays plain: it's the move, read at a glance.
import { Text, View } from 'react-native';
import { KText, useTheme } from '@/design-system';
import { openPiece } from '@/features/closet/pieceActions';
import { chipLabel, type AnswerLayout, type ChipPiece } from './answerText';

export { answerLayout } from './answerText';

/** VoiceOver's "Open {piece}" actions for an answer's chips. */
export function chipActions(chips: readonly ChipPiece[]) {
  return chips.map((p) => ({ name: `piece:${p.id}`, label: chipLabel(p), onPress: () => openPiece(p) }));
}

export function AnswerBody({ layout }: { layout: AnswerLayout }) {
  return (
    <View style={{ gap: 4 }}>
      {layout.lead ? <KText role="answerLead">{layout.lead}</KText> : null}
      {layout.rest.length > 0 ? (
        <KText role="answerRest">
          {layout.rest.map((s, i) => (s.piece ? <Chip key={i} piece={s.piece} text={s.text} /> : s.text))}
        </KText>
      ) : null}
    </View>
  );
}

function Chip({ piece, text }: { piece: ChipPiece; text: string }) {
  const { colors } = useTheme();
  return (
    <KText role="answerChip" onPress={() => openPiece(piece)}>
      <Text>
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: piece.hex, borderWidth: 1, borderColor: colors.ink3, marginRight: 4, transform: [{ translateY: 1 }] }} />
      </Text>
      {text}
    </KText>
  );
}
