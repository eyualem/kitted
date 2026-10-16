// L3 · Your moves (02 L3; 10-onboarding.md §9.9): the first 3 moves, kept after the day's chat. Header "n of 3 done" and a
// 3-slot bar, then each move with its own Start (any order, unlike the card's one button) or the done badge. All 3
// done: "All 3 done. Nice work." Pushed from the pinned rows in Lookbook and You.
import { View } from 'react-native';
import { FixRow, KButton, KCard, KText, RowDivider, space, useTheme } from '@/design-system';
import { SettingsScroll } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';
import { useYourMoves } from './hooks';
import { startMove } from './MovesCard';
import type { Move } from './moves';
import { SlotBar } from './SlotBar';
import { moveStart, movesDoneCount } from './yourMoves';

export function YourMovesScreen() {
  const plan = useYourMoves();
  // Opened before the moves card exists (a stale link): nothing to show.
  if (!plan) return null;
  const n = movesDoneCount(plan);
  const allDone = plan.current === null;
  const header = allDone ? t('moves.allDone') : t('moves.done', { n });
  return (
    <SettingsScroll>
      <View style={{ gap: space.s, paddingHorizontal: space.xs }}>
        <KText variant="headline" accessibilityRole="header">
          {header}
        </KText>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SlotBar filled={n} slots={3} />
        </View>
      </View>
      <KCard radius={20}>
        {plan.moves.map((mv, i) => (
          <View key={mv.kind}>
            {i > 0 ? <RowDivider /> : null}
            <MoveRow move={mv} n={i + 1} />
          </View>
        ))}
      </KCard>
    </SettingsScroll>
  );
}

function MoveRow({ move, n }: { move: Move; n: number }) {
  const { isAccessibilitySize: ax } = useTheme();
  const spoken = move.done ? t('moves.a11y.rowDone', { n, title: move.title }) : t('moves.a11y.row', { n, title: move.title, detail: move.detail.replace(/ · /g, ', ') });
  const start = moveStart(move);
  return (
    <View style={{ flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'stretch' : 'center', gap: ax ? 0 : space.m, paddingHorizontal: space.l, paddingBottom: ax && start ? space.m : 0 }}>
      <View style={{ flex: ax ? undefined : 1 }} accessible accessibilityLabel={spoken}>
        <FixRow number={n} title={move.title} detail={move.detail} gain="" done={move.done} />
      </View>
      {start ? (
        <KButton kind="secondary" size="regular" title={t('plan.start')} accessibilityLabel={t('plan.startN', { n })} onPress={() => startMove(start)} />
      ) : null}
    </View>
  );
}
