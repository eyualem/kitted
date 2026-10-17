// An answer drawn as look C (founder, Oct 16, #302; 07 §15.4): the move on its own line (headline, ink), the reason
// under it (callout, ink2), and his pieces named in the reason as chips: a swatch in the piece's color and the name
// in ink, opening the piece page. Everything here comes from the answer's plain text and his closet (answerText.ts);
// nothing comes from model markup. The lead stays plain: it's the move, read at a glance.
import { Text, View } from 'react-native';
import { KText, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { openPiece } from '@/features/closet/pieceActions';
import { chipDisplay, chipLabel, type AnswerLayout, type ChipPiece } from './answerText';

export { answerLayout } from './answerText';

let lastCloset: ClosetItemRow[] | null = null;

/**
 * His closet for an answer's chips. The last read is kept, so a row drawn for the first time (the stored answer taking
 * over from the live one) has its chips on its first frame instead of popping them in a frame later (07 §17, U19).
 */
export function useAnswerCloset(): readonly ClosetItemRow[] | null {
  const loaded = useLive(['closet'], async () => {
    const all = await store.closet.all();
    lastCloset = all;
    return all;
  }, []);
  return loaded ?? lastCloset;
}

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
  const { scheme, isAccessibilitySize } = useTheme();
  const name = chipDisplay(text);
  // At the accessibility sizes a fixed 10 pt swatch is lost beside the huge words: the name in ink is the chip.
  if (isAccessibilitySize) {
    return (
      <KText role="answerChip" onPress={() => openPiece(piece)}>
        {name}
      </KText>
    );
  }
  return (
    <KText role="answerChip" onPress={() => openPiece(piece)}>
      <Text>
        {/* An inline view sits on the baseline and ignores margins on iOS: lift it a little, then a narrow
            no-break space so the swatch never wraps away from its name. A round dot with a faint ring: the square
            with an ink3 border read as an empty checkbox on every white piece (07 §17, U11). */}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: piece.hex,
            borderWidth: 1,
            borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)',
            transform: [{ translateY: -1 }],
          }}
        />
      </Text>
      {`\u202f${name}`}
    </KText>
  );
}
