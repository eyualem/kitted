// Kit's ask (specs/notifications.md NT1; DESIGN phones 1–6): one step. "What time do you usually get dressed to head
// out?…", the time row up front (his stored time or 8:00 am), then Send me ideas (the only place on Stylist that shows
// Apple's prompt) and No thanks (never asks). While the prompt is up, Send me ideas spins at its own width and No thanks
// is dimmed, so a second tap can't race it. Answered, the card is its one line for good, and VoiceOver moves to it.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { KButton, StylistMessage, space, useTheme } from '@/design-system';
import type { ChatMessage } from '@/data/types';
import { askDoneLine } from '@/features/morning/nudges';
import { parseIdeaTime } from '@/features/settings/prefs';
import { t } from '@/i18n/en';
import { NotifyTimeRow } from './NotifyTimeRow';
import { notifyCardState } from './service';
import { finish } from './session';

/** VoiceOver to an answer's line, once it shows (the button he tapped is gone). */
export function useFocusOnAnswer(answered: boolean) {
  const lineRef = useRef<View>(null);
  const tappedRef = useRef(false);
  useEffect(() => {
    if (!answered || !tappedRef.current) return;
    tappedRef.current = false;
    // A mounted host view always has a handle on the phone.
    if (lineRef.current) AccessibilityInfo.setAccessibilityFocus(findNodeHandle(lineRef.current) as number);
  }, [answered]);
  /** He answered in this card (not one that scrolled back into view answered). */
  const markTapped = () => {
    tappedRef.current = true;
  };
  return { lineRef, markTapped };
}

export function NotifyAskCard({ m, showHeader, readOnly = false }: { m: ChatMessage; showHeader?: boolean; readOnly?: boolean }) {
  const { isAccessibilitySize: ax } = useTheme();
  const state = notifyCardState(m);
  const time = parseIdeaTime(typeof m.payload.time === 'string' ? m.payload.time : null);
  // Apple's prompt may already be up for this card (a demo screen's scripted wait, or a re-render mid-ask).
  const [asking, setAsking] = useState(() => finish.notifyAsking?.(m.id) === true);
  const { lineRef, markTapped } = useFocusOnAnswer(state !== 'open');

  if (state !== 'open') {
    const when = m.payload.when === 'today' ? 'today' : 'tomorrow'; // an allowed card from before `when` reads tomorrow
    const text = state === 'allowed' ? askDoneLine(when, time) : t('notif.ask.later');
    return (
      <View ref={lineRef} testID="notify-ask-line">
        <StylistMessage showHeader={showHeader}>{text}</StylistMessage>
      </View>
    );
  }
  // An earlier day's ask that was never answered: just the question (Past chats can't change anything).
  if (readOnly) return <StylistMessage showHeader={showHeader}>{t('notif.ask')}</StylistMessage>;

  const yes = () => {
    if (asking) return;
    markTapped();
    setAsking(true);
    void finish.notifyYes(m.id).finally(() => setAsking(false));
  };
  const no = () => {
    if (asking) return;
    markTapped();
    void finish.notifyNo(m.id);
  };
  const footer = (
    <View style={{ paddingTop: 6, gap: space.s }}>
      <NotifyTimeRow time={time} testID="notify-ask-time-row" onPick={(v) => void finish.notifyPickTime(m.id, v)} />
      <View style={ax ? { gap: space.s } : { flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
        <KButton title={t('notif.ask.yes')} size="regular" fullWidth={ax} loading={asking} onPress={yes} />
        <KButton title={t('notif.ask.no')} kind="secondary" size="regular" fullWidth={ax} disabled={asking} onPress={no} />
      </View>
    </View>
  );
  return (
    <View testID="notify-ask">
      <StylistMessage showHeader={showHeader} footer={footer}>
        {t('notif.ask')}
      </StylistMessage>
    </View>
  );
}
