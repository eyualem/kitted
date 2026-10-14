// Y6 · Notifications (02-screens.md; DECISIONS-LOG #246: all three get switches): the only three things Kitted
// sends, all local. The switches and the idea's time are stored now (features/settings/prefs.ts); P6 installs
// expo-notifications, reads them to schedule, and adds the "Notifications are off for Kitted." card when the system
// permission is off. Until then nothing is sent. "Trial ending" shows only during a trial.
import { useEffect, useState } from 'react';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import {
  ideaTimeLabel, ideaTimeOptions, loadNotificationPrefs, parseIdeaTime, saveIdeaTime, setNotificationPref,
  type NotificationKind, type NotificationPrefs,
} from '@/features/settings/prefs';
import { PickerRow, Section, SettingsScroll, ToggleRow } from '@/features/settings/SettingsList';
import { usePlan } from '@/features/settings/usePlan';
import { t } from '@/i18n/en';

export default function NotificationsScreen() {
  const plan = usePlan();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  useEffect(() => {
    void loadNotificationPrefs(store).then(setPrefs);
  }, []);
  if (!prefs) return null;

  const toggle = (kind: NotificationKind) => (on: boolean) => {
    setPrefs((p) => (p ? { ...p, [kind]: on } : p));
    void setNotificationPref(store, kind, on);
  };
  const time = parseIdeaTime(profile?.ideaTime);
  const timeOptions = ideaTimeOptions(time).map((v) => ({ value: v, label: ideaTimeLabel(v) }));

  return (
    <SettingsScroll>
      <Section header={t('notifs.header')}>
        <ToggleRow title={t('notifs.idea')} value={prefs.idea} onChange={toggle('idea')} />
        {prefs.idea && profile ? (
          <PickerRow title={t('notifs.time')} value={time} options={timeOptions} onPick={(v) => void saveIdeaTime(store, v)} spoken={(label) => t('notifs.a11y.time', { time: label })} />
        ) : null}
        <ToggleRow title={t('notifs.ready')} value={prefs.ready} onChange={toggle('ready')} />
        {plan.kind === 'trial' ? <ToggleRow title={t('notifs.trial')} value={prefs.trial} onChange={toggle('trial')} /> : null}
      </Section>
    </SettingsScroll>
  );
}
