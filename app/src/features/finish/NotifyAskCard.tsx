// S15 · The notification ask (02 S15; 10-onboarding.md §9.5): "Want a daily outfit idea at a time you choose?" Yes grows
// the card in place with the time (Settings' own half-hour list, so no date-time picker package) and `Set {time}`,
// which is the only place the system prompt is asked. No thanks never asks. Answered, it's one line for good.
import { useState } from 'react';
import { View } from 'react-native';
import { KButton, KText, MorphPicker, StylistMessage, space } from '@/design-system';
import type { ChatMessage } from '@/data/types';
import { ideaTimeLabel, ideaTimeOptions, parseIdeaTime } from '@/features/settings/prefs';
import { t } from '@/i18n/en';
import { finish } from './session';
import type { NotifyCardState } from './service';

export function NotifyAskCard({ m, showHeader, readOnly = false }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const state = (m.payload.state as NotifyCardState | undefined) ?? 'open';
  const time = parseIdeaTime(typeof m.payload.time === 'string' ? m.payload.time : null);
  const [asking, setAsking] = useState(false);

  if (state === 'allowed') return <StylistMessage showHeader={showHeader}>{t('notif.ask.done', { time: ideaTimeLabel(time) })}</StylistMessage>;
  if (state === 'denied' || state === 'declined') return <StylistMessage showHeader={showHeader}>{t('notif.ask.later')}</StylistMessage>;
  // An earlier day's ask that was never answered: just the question (Past chats can't change anything).
  if (readOnly) return <StylistMessage showHeader={showHeader}>{t('notif.ask')}</StylistMessage>;

  const footer =
    state === 'open' ? (
      <View style={{ paddingTop: 6, gap: space.s, flexDirection: 'row', flexWrap: 'wrap' }}>
        <KButton title={t('notif.ask.yes')} size="regular" onPress={() => void finish.notifyYes(m.id)} />
        <KButton title={t('notif.ask.no')} kind="secondary" size="regular" onPress={() => void finish.notifyNo(m.id)} />
      </View>
    ) : (
      <View style={{ paddingTop: 6, gap: space.s }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, flexWrap: 'wrap' }}>
          <KText variant="subheadline" color="ink2">
            {t('notif.ask.label')}
          </KText>
          <MorphPicker
            label={ideaTimeLabel(time)}
            value={time}
            sections={[{ options: ideaTimeOptions(time).map((v) => ({ value: v, label: ideaTimeLabel(v) })) }]}
            onPick={(v) => void finish.notifyPickTime(m.id, v)}
            accessibilityLabel={t('notifs.a11y.time', { time: ideaTimeLabel(time) })}
          />
        </View>
        <KButton
          title={t('notif.ask.set', { time: ideaTimeLabel(time) })}
          size="regular"
          loading={asking}
          disabled={asking}
          onPress={() => {
            setAsking(true);
            void finish.notifySet(m.id).finally(() => setAsking(false));
          }}
        />
      </View>
    );
  return (
    <StylistMessage showHeader={showHeader} footer={footer}>
      {t('notif.ask')}
    </StylistMessage>
  );
}
