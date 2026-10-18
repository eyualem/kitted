// S14 · the one optional step after his first fit (10-onboarding.md §9.11, #342; it replaced "Your first 3 moves"):
// "Tap the clothes you already own", said to be optional twice (Kit's line and the tag). One button, one Skip. Skipped:
// one line, nothing else asked. Added: how many, and "Add more". Read-only in Past chats.
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, TagLine, TextLink } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { t } from '@/i18n/en';
import { useBasicsAdded } from './hooks';
import { inviteState } from './invite';

/** Closet first, then "What you already own" on top of it, so Back lands on the Closet grid. */
export function openStarter(): void {
  router.navigate('/closet');
  setTimeout(() => router.push('/closet/starter'), 0);
}

export function InviteCard({ m, readOnly = false }: { m: ChatMessage; readOnly?: boolean }) {
  const added = useBasicsAdded();
  if (added === undefined) return null;
  const state = inviteState(m, added);
  const skip = () => void store.chat.put({ ...m, payload: { ...m.payload, skipped: true } });
  const line = state === 'open' ? t('plan.body') : state === 'skipped' ? t('plan.skipped') : t('plan.added', { n: added });
  const actions = readOnly ? [] : state === 'open' ? [{ name: 'activate', label: t('plan.show') }, { name: 'skip', label: t('plan.skip') }] : state === 'added' ? [{ name: 'activate', label: t('plan.addMore') }] : [];
  return (
    <KCard
      accessibilityLabel={`${t('plan.tag')}. ${t('plan.title')}. ${line}`}
      accessibilityActions={actions.length ? actions : undefined}
      onAccessibilityAction={actions.length ? (e) => (e.nativeEvent.actionName === 'skip' ? skip() : openStarter()) : undefined}
    >
      <KCardSection gap={12} paddingVertical={14} style={{ paddingHorizontal: 16 }}>
        <TagLine left={t('plan.tag')} right={t('plan.tagCount')} />
        <View style={{ gap: 4 }}>
          <KText variant="headline" accessibilityRole="header">
            {t('plan.title')}
          </KText>
          <KText variant="subheadline" color="ink2">
            {line}
          </KText>
        </View>
        {!readOnly && state === 'open' ? (
          <View style={{ gap: 4, alignItems: 'center' }}>
            <KButton title={t('plan.show')} size="regular" fullWidth onPress={openStarter} />
            <TextLink title={t('plan.skip')} onPress={skip} />
          </View>
        ) : null}
        {!readOnly && state === 'added' ? <TextLink title={t('plan.addMore')} onPress={openStarter} /> : null}
      </KCardSection>
    </KCard>
  );
}
