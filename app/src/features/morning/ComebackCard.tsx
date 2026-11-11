// The comeback question (specs/notifications.md NT4; DESIGN phones 11–14): after a week with no visit the nudges stop,
// and the next open Kit asks once whether he wants them back. Turn them back on schedules the next 7 days; Change the
// time swaps that button for the time row (a pick saves and schedules at once); No thanks saves the switch off.
// Answered, the card is its one line for good, and VoiceOver moves to it. Past chats show only the question.
import { useState } from 'react';
import { View } from 'react-native';
import { KButton, StylistMessage, space, useTheme } from '@/design-system';
import type { ChatMessage } from '@/data/types';
import { useFocusOnAnswer } from '@/features/finish/NotifyAskCard';
import { NotifyTimeRow } from '@/features/finish/NotifyTimeRow';
import { parseIdeaTime } from '@/features/settings/prefs';
import { t } from '@/i18n/en';
import { backOnLine } from './nudges';
import { nudges } from './nudgeSession';

export function ComebackCard({ m, showHeader, readOnly = false }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const { isAccessibilitySize: ax } = useTheme();
  const st = m.payload.state;
  const state = st === 'on' || st === 'declined' || st === 'picking' ? st : 'open';
  const time = parseIdeaTime(typeof m.payload.time === 'string' ? m.payload.time : null);
  const answered = state === 'on' || state === 'declined';
  const { lineRef, markTapped } = useFocusOnAnswer(answered);
  // Focus moves to the time only when he tapped Change the time here (not when the card scrolls back into view).
  const [pickedHere, setPickedHere] = useState(false);

  if (answered) {
    const text = state === 'on' ? backOnLine(m.payload.when === 'today' ? 'today' : 'tomorrow', time) : t('comeback.done');
    return (
      <View ref={lineRef} testID="comeback-line">
        <StylistMessage showHeader={showHeader}>{text}</StylistMessage>
      </View>
    );
  }
  if (readOnly) return <StylistMessage showHeader={showHeader}>{t('comeback.q')}</StylistMessage>;

  const answer = (fn: () => Promise<void>) => () => {
    markTapped();
    void fn();
  };
  const row = ax ? { gap: space.s } : { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: space.s };
  const footer = (
    <View style={{ paddingTop: 6, gap: space.s }}>
      {state === 'picking' ? (
        <NotifyTimeRow
          time={time}
          testID="comeback-time-row"
          focusOnMount={pickedHere}
          onPick={(v) => {
            markTapped();
            void nudges.comebackPickTime(m.id, v);
          }}
        />
      ) : null}
      <View style={row}>
        <KButton title={t('comeback.on')} size="regular" fullWidth={ax} onPress={answer(() => nudges.comebackOn(m.id))} />
        {state === 'open' ? (
          <KButton
            title={t('comeback.time')}
            kind="secondary"
            size="regular"
            fullWidth={ax}
            onPress={() => {
              setPickedHere(true);
              void nudges.comebackShowTime(m.id);
            }}
          />
        ) : null}
        <KButton title={t('comeback.no')} kind="secondary" size="regular" fullWidth={ax} onPress={answer(() => nudges.comebackNo(m.id))} />
      </View>
    </View>
  );
  return (
    <View testID="comeback">
      <StylistMessage showHeader={showHeader} footer={footer}>
        {t('comeback.q')}
      </StylistMessage>
    </View>
  );
}
