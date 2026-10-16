// S14 · "Your first 3 moves" (02 S14; 10-onboarding.md §9.2): the basics, his first check's top fix, the Starter piece
// that adds the most outfits. One Start button, for the first move not done. Read-only in Past chats.
import { router } from 'expo-router';
import { View } from 'react-native';
import { FixRow, KButton, KCard, KCardSection, KText, RowDivider, TagLine } from '@/design-system';
import type { ChatMessage } from '@/data/types';
import { t } from '@/i18n/en';
import { useMoves } from './hooks';
import type { MoveGo } from './moves';

/** Closet first, then Starter essentials on top of it, so Back lands on the Closet grid. */
export function openStarter(): void {
  router.navigate('/closet');
  setTimeout(() => router.push('/closet/starter'), 0);
}

/** Where a move's Start goes (M4): the camera, or Closet then Starter essentials. The card and L3 share it. */
export const startMove = (where: MoveGo) => (where === 'camera' ? router.push('/camera') : openStarter());

export function MovesCard({ m, readOnly = false }: { m: ChatMessage; readOnly?: boolean }) {
  const plan = useMoves(m.fitCheckId ?? '', typeof m.payload.buyId === 'string' ? m.payload.buyId : null);
  if (!plan) return null;
  const allDone = plan.current === null;
  const current = plan.current !== null ? plan.moves[plan.current] : null;
  const startTitle = plan.current === 0 ? t('plan.start1') : t('plan.startN', { n: (plan.current ?? 0) + 1 });
  const spoken = [allDone ? t('moves.allDone') : t('plan.title'), ...plan.moves.map((mv, i) => `${i + 1}, ${mv.title}${mv.done ? '' : `, ${mv.detail}`}.`)].join(' ');
  const showStart = !readOnly && current?.go;
  return (
    <KCard
      accessibilityLabel={spoken}
      accessibilityActions={showStart ? [{ name: 'start', label: startTitle }] : undefined}
      onAccessibilityAction={showStart && current?.go ? () => startMove(current.go!) : undefined}
    >
      <KCardSection gap={12} paddingVertical={14} style={{ paddingHorizontal: 16 }}>
        <TagLine left={t('plan.tag')} right={t('plan.tagCount')} />
        <KText variant="headline" accessibilityRole="header">
          {allDone ? t('moves.allDone') : t('plan.title')}
        </KText>
        <View>
          {plan.moves.map((mv, i) => (
            <View key={mv.kind}>
              {i > 0 ? <RowDivider /> : null}
              <FixRow number={i + 1} title={mv.title} detail={mv.detail} gain="" done={mv.done} />
            </View>
          ))}
        </View>
        {showStart && current?.go ? <KButton title={startTitle} size="regular" fullWidth onPress={() => startMove(current.go!)} /> : null}
      </KCardSection>
    </KCard>
  );
}
