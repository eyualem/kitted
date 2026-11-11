// You → Notifications (specs/notifications.md NT3; DESIGN phones 8–10 and 16): the two things Kitted sends, both
// scheduled on the phone. Daily outfit idea (with "I get dressed at" while it's on) and Fit check ready. What each switch
// shows comes from nudges.ts switchesShown: the saved switch, iOS's answer and the comeback pause. Switching one on
// when Apple's prompt was never shown asks now (the switch shows on and waits); with iOS off for Kitted, the off card
// and Open Settings sit on top and the rows are greyed at their saved values. Back from iOS Settings, the page reads
// iOS again (the app-wide return reschedules).
import { useEffect, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { KButton, KCard, KText, radius, space } from '@/design-system';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { useLive } from '@/data/useLive';
import { nudges } from '@/features/morning/nudgeSession';
import { switchesShown } from '@/features/morning/nudges';
import { notifications } from '@/features/paywall/switch';
import { ideaTimeLabel, ideaTimeOptions, parseIdeaTime } from '@/features/settings/prefs';
import { PickerRow, Section, SettingsScroll, ToggleRow } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';
import type { NotifyPermission } from '@/services/notifications';

interface Saved {
  ideaKv: string | null;
  readyKv: string | null;
  permission: NotifyPermission;
  paused: boolean;
}

async function loadSaved(): Promise<Saved> {
  const [ideaKv, readyKv, paused, permission] = await Promise.all([
    store.getKv(KV.notifyIdea), store.getKv(KV.notifyReady), nudges.paused(), notifications.permission(),
  ]);
  return { ideaKv, readyKv, paused, permission };
}

export default function NotificationsScreen() {
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  /** Bumped when iOS may say something new: back from iOS Settings, or Apple's prompt answered. */
  const [version, setVersion] = useState(0);
  /** The switch whose Apple's prompt is up: it shows on and waits. */
  const [asking, setAsking] = useState<'idea' | 'ready' | null>(null);
  const saved = useLive(['kv'], loadSaved, [version]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setVersion((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  if (!saved || profile === undefined) return null;
  const v = switchesShown(saved);
  const time = parseIdeaTime(profile?.ideaTime);
  const timeOptions = ideaTimeOptions(time).map((o) => ({ value: o, label: ideaTimeLabel(o) }));
  const idea = asking === 'idea' ? true : v.idea;
  const ready = asking === 'ready' ? true : v.ready;
  const locked = v.greyed || asking !== null;

  const turn = (kind: 'idea' | 'ready') => (on: boolean) => {
    if (on) setAsking(kind);
    const done = kind === 'idea' ? nudges.setIdea(on) : nudges.setReady(on);
    void done.finally(() => {
      setAsking(null);
      setVersion((n) => n + 1);
    });
  };

  return (
    <SettingsScroll>
      {v.offCard ? (
        <View testID="notifs-off-card">
          <KCard radius={radius.cardSmall}>
            <View style={{ padding: space.l, gap: space.m }}>
              <KText variant="callout">{t('notifs.off')}</KText>
              <KButton title={t('common.openSettings')} kind="secondary" size="regular" onPress={() => void Linking.openSettings()} />
            </View>
          </KCard>
        </View>
      ) : null}
      <Section header={t('notifs.header')}>
        <ToggleRow testID="notifs-idea" title={t('notifs.idea')} value={idea} onChange={turn('idea')} disabled={locked} />
        {v.timeRow ? (
          <PickerRow testID="notifs-time" title={t('notifs.time')} value={time} options={timeOptions} onPick={(hhmm) => void nudges.setTime(hhmm)} disabled={locked} />
        ) : null}
        <ToggleRow testID="notifs-ready" title={t('notifs.ready')} value={ready} onChange={turn('ready')} disabled={locked} />
      </Section>
    </SettingsScroll>
  );
}
