# T53 · Notifications in the beta: Kit's ask, the daily nudge, Fit check ready, You → Notifications, the comeback

**From:** `plan.md` → T53 · **Spec:** `specs/notifications.md` (approved Nov 9) → NT1 (except NT1.8–NT1.10, T57), NT2, NT3, NT4, NT5, NT6; `specs.md` → F13, "First run" step 9 · **Design:** `tasks/T53/DESIGN.md` (approved Nov 9, phones 1–17) · **Lane:** Kit and the morning card (`app/src/features/{stylist,ask,morning}`, plus the files on T53's plan line)

## Goal
After his first scored fit Kit asks what time he gets dressed; on his yes and Apple's Allow the phone schedules one nudge a day 15 minutes before it (7 days ahead, replaced on every open, return and leave), You → Notifications changes or stops it, a check that finishes after he leaves tells him once, and after a week away Kit asks once whether he wants the nudges back.

## Before building
- **T34 merges first** (DESIGN Q2): the words say "You → Notifications", T34 makes You the settings home and its `SettingsRows` shows the `Notifications` row once `NOTIFICATIONS_BUILT` is true, and T34 also edits `SettingsList.tsx` (testIDs on `LinkRow`/`PickerRow`). Merge main into this branch after T34 lands, then build. If T34 isn't on main when the build starts, stop and tell the coordinator.
- Memory on this Mac is tight: `npx expo install`, `expo prebuild` and the Simulator build are heavy; check `top -l 1 | grep PhysMem` and run them one at a time.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.

**On T53's plan line or in its lane**
- `app/package.json` (shared): `expo-notifications` (the founder's OK, Nov 9), installed with `npx expo install expo-notifications` (the SDK 57 version).
- `app/app.config.ts` (shared): the `// P6: 'expo-notifications',` comment goes. Add the `'expo-notifications'` plugin **only if** prebuild needs it for local notifications, and only in a form that adds **no `aps-environment`** entitlement (see Must not break). Nothing else in this file changes.
- `app/src/config/features.ts` (shared): `NOTIFICATIONS_BUILT = true`, comment rewritten (local only; the ask, the nudge, Fit check ready).
- `app/src/i18n/en.ts` (shared): `push.ready` keeps its `one` form; `notifs.a11y.time` is removed (VoiceOver uses `settings.a11y.value`); nothing else.
- `app/src/services/notifications.ts`: the permission and scheduler interfaces, the pure content mapping, the scripted permission and the recording scheduler (no native import).
- `app/src/services/notificationsNative.ts` (**new**, next to the listed file): the `expo-notifications` adapter, the tap listener and the background-time wrapper. The only file that imports `expo-notifications`.
- `app/src/features/finish/sequence.ts`: `askDue` and `catchUpDue` replace `notifyAskable`; `NotifyPermission` re-exported from `@/services/notifications`.
- `app/src/features/finish/service.ts`: the one-step ask (`notifyPickTime`, `notifyYes` = Send me ideas, `notifyNo`), the asked marker, the catch-up, new deps.
- `app/src/features/finish/session.ts`: passes the new deps.
- `app/src/features/finish/NotifyAskCard.tsx`: phones 1–6 (one step, time row up front, the waiting state, the answered lines, focus, AX stacking).
- `app/src/features/finish/NotifyTimeRow.tsx` (**new**): the shared "I get dressed at" + time capsule row (ask and comeback).
- `app/src/features/finish/demo.ts`: the steps for the new card (`notifyYes` now taps Send me ideas; `notifyAllow` goes; `'pending'` permission).
- `app/src/features/settings/prefs.ts`: 17 times (5:00 am–1:00 pm); `NotificationKind` = `'idea' | 'ready'`; the idea switch reads unset as off; `trial` goes.
- `app/src/app/(tabs)/you/notifications.tsx`: phones 8–10 and 16.
- `app/src/features/morning/nudges.ts` (**new**, pure): nudge times, lines, the done/back-on lines, the switches' view.
- `app/src/features/morning/nudgeService.ts` (**new**): schedule, lapse and comeback, the switches, the time, cancel.
- `app/src/features/morning/readyWatch.ts` (**new**): NT6.
- `app/src/features/morning/nudgeTap.ts` (**new**): what a tap opens.
- `app/src/features/morning/nudgeSession.ts` (**new**): the app's instances and `useNotifications()`.
- `app/src/features/morning/ComebackCard.tsx` (**new**): phones 11–14.
- `app/src/features/morning/nudgeDemo.ts` (**new**): the demo screens' notification state.
- `app/src/features/stylist/MessageView.tsx`: routes `question: 'comeback'` to `ComebackCard`.
- `app/src/features/stylist/thread.ts`: `isStylistLine` counts the comeback card.
- `app/src/features/stylist/StylistScreen.tsx`: calls `useNotifications()` once.

**Outside the lane, needed (see Open questions, technical, item 13)**
- `app/src/features/settings/SettingsList.tsx` (you-and-first-run lane; after T34): `PickerRow` gains `disabled` (DESIGN "New parts"), `ToggleRow` gains `testID` (on its `Switch`).
- `app/src/features/privacy/wipe.ts` (sign-in lane; named in the spec's Touches): `WipeDeps.cancelNotifications?`, called by `deleteAllData`.
- `app/src/features/privacy/actions.ts` (you-and-first-run lane): passes `nudges.cancelAll`.
- `app/src/features/paywall/switch.ts` (free-and-pro lane): the permission fallback becomes the native one when present; `setDemoNotify` takes `'pending'` and a start state.
- `app/modules/kitted-vision/ios/KittedVisionModule.swift`, `app/modules/kitted-vision/index.ts` (the app's own local module; named in the spec's Touches): begin/end iOS background time.
- `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts`: demo screens 159, 160 changed; 280–291 added; the `notify` scenario field.
- `handoff/02-screens.md` §5 (the copy deck) and `app/src/i18n/en.generated.ts` (regenerated with `node app/scripts/gen-en.mjs`, never hand-edited).
- Tests and flows (the test writer): new files under `app/src/__tests__/T53-*.test.ts(x)`, `app/e2e/flows/T53-*.yaml`; the old notification tests in `onboardingFinish.test.ts` (N1–N3, the `NOTIFICATIONS_BUILT` false line in P3/P7), `settingsPrefs.test.ts` ("are on until turned off") and `betaLimits.test.ts` FP7.5 change because the spec changed them (the reason goes in REPORT.md).

## Interfaces
What the tests call. The test writer reads only this section.

### `@/services/notifications` (pure, safe in Jest)
```ts
export type NotifyPermission = 'undetermined' | 'granted' | 'denied';
export interface NotificationPermissions {
  permission(): Promise<NotifyPermission>;   // what iOS says now, never asks
  request(): Promise<NotifyPermission>;      // Apple's prompt only when undetermined; otherwise returns the current answer
}
export type NotificationData = { kind: 'nudge' } | { kind: 'ready'; checkId: string };
export interface LocalNotification {
  id: string;            // 'nudge|YYYY-MM-DD' (local calendar date) or 'ready|<checkId>'
  body: string;          // the one line; there is no title field
  atMs: number | null;   // fire time; null = now (Fit check ready)
  data: NotificationData;
}
export interface NotificationScheduler {
  replaceNudges(list: readonly LocalNotification[]): Promise<void>; // cancels every scheduled one, then schedules `list`
  cancelAll(): Promise<void>;
  presentNow(n: LocalNotification): Promise<void>;
  pending(): Promise<LocalNotification[]>;                           // what is scheduled now
}
export type SchedulerCall =
  | { op: 'replaceNudges'; list: LocalNotification[] }
  | { op: 'cancelAll' }
  | { op: 'presentNow'; n: LocalNotification };
/** Every call kept in order; `pending()` = the last replaceNudges list, [] after cancelAll. */
export function recordingScheduler(): NotificationScheduler & { calls: SchedulerCall[] };
/** Scripted iOS: starts at `start` (default 'undetermined'); request() from undetermined answers allow → 'granted',
 *  deny → 'denied', pending → never resolves. `requests` counts request() calls. */
export function scriptedNotifications(answer: 'allow' | 'deny' | 'pending', start?: NotifyPermission): NotificationPermissions & { requests: number };
export const unbuiltNotifications: NotificationPermissions; // 'undetermined', and request() does nothing
/** What iOS gets for `n`: no title, the default sound, no badge. */
export function notificationContent(n: LocalNotification): { body: string; sound: 'default'; data: NotificationData };
export function notificationTrigger(n: LocalNotification): { type: 'date'; date: number } | null;
export interface BackgroundWork { begin(): Promise<string | null>; end(id: string): void; }
export const noBackgroundWork: BackgroundWork;
```

### `@/services/notificationsNative` (imports `expo-notifications`; never imported by a test)
```ts
export const nativeAvailable: boolean;                    // false on web and on a build without the native module
export const nativePermissions: NotificationPermissions;  // getPermissionsAsync / requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } }); provisional or ephemeral → 'granted'
export const nativeScheduler: NotificationScheduler;      // scheduleNotificationAsync with notificationContent / notificationTrigger
export const nativeBackgroundWork: BackgroundWork;        // modules/kitted-vision begin/endBackgroundWork; null on builds without it
export function onNotificationTap(cb: (data: NotificationData) => void): () => void;
export function lastTap(): Promise<NotificationData | null>; // a cold start from a tap
```
No `setNotificationHandler` that shows banners: a nudge that fires while Kitted is in front isn't shown (iOS's default; see Open questions, founder, 3).

### `app/modules/kitted-vision`
`beginBackgroundWork(): Promise<string | null>` and `endBackgroundWork(id: string): void` (optional on older builds: `null` / no-op). Swift: `UIApplication.shared.beginBackgroundTask(withName: "KittedFitCheck")` with an expiration handler that ends it.

### `@/features/settings/prefs`
```ts
export const DEFAULT_IDEA_TIME = '08:00';
export const IDEA_TIMES: readonly string[];              // 17: '05:00','05:30',…,'12:30','13:00'
export function ideaTimeLabel(hhmm: string): string;      // '08:00' → '8:00 am', '12:00' → '12:00 pm', '13:00' → '1:00 pm' (as built)
export function ideaTimeOptions(current: string): string[]; // IDEA_TIMES, plus `current` sorted in when off the list (as built)
export type NotificationKind = 'idea' | 'ready';
export type NotificationPrefs = Record<NotificationKind, boolean>;
export function parseIdeaSwitch(raw: string | null): boolean;   // only '1' is on (unset = off)
export function parseReadySwitch(raw: string | null): boolean;  // on unless '0'
export function loadNotificationPrefs(store): Promise<NotificationPrefs>;
export function setNotificationPref(store, kind: NotificationKind, on: boolean): Promise<void>; // '1' / '0'
```
KV keys stay `KV.notifyIdea` = `notify.idea`, `KV.notifyReady` = `notify.ready`. `notify.trial` is never read or written.

### `@/features/morning/nudges` (pure)
```ts
export const NUDGE_DAYS = 7;
export const NUDGE_LEAD_MIN = 15;
export const NOTIFY_KV: {
  asked: 'notify.asked';               // the id of Kit's ask message, by any route (setup, catch-up, T57's Later)
  through: 'notify.through';           // ms of the last scheduled nudge (string); unset when nothing is scheduled
  paused: 'notify.paused';             // '1' while the comeback question is unanswered
  comebackFor: 'notify.comebackFor';   // the `through` of the lapse the comeback was posted for
  bigEnoughAt: 'notify.bigEnoughAt';   // ms of the scheduled "big enough" nudge
  bigEnoughDone: 'notify.bigEnoughDone'; // '1' once it was delivered
};
export function nudgeHHMM(ideaTime: string): string;       // '08:00' → '07:45', '05:00' → '04:45', '13:00' → '12:45'
export function nudgeLabel(ideaTime: string): string;      // '08:00' → '7:45 am'
/** The next 7 nudge instants: one per local calendar date, each at nudgeHHMM in `zone`, the first strictly after nowMs. */
export function nudgeTimes(nowMs: number, ideaTime: string, zone: ZoneOffset): number[];
/** Today's nudge time (local calendar date) is still ahead. */
export function landsToday(nowMs: number, ideaTime: string, zone: ZoneOffset): boolean;
export type NudgeLine = 'check' | 'bigEnough' | 'idea';
/** Per day: 'check' while it can't suggest; the first day it can, 'bigEnough' unless `bigEnoughDone`; then 'idea'. */
export function nudgeLines(canSuggest: readonly boolean[], bigEnoughDone: boolean): NudgeLine[];
export function nudgeBody(line: NudgeLine): string;        // t('push.nudge.check' | 'push.nudge.bigEnough' | 'push.nudge.idea')
export function readyBody(fixCount: number): string;       // 2 → push.ready (n = 2), 1 → its one form, 0 → push.ready.none
export function askDoneLine(when: 'today' | 'tomorrow', ideaTime: string): string; // notif.ask.doneToday / notif.ask.done with nudgeLabel
export function backOnLine(when: 'today' | 'tomorrow', ideaTime: string): string;  // comeback.backToday / comeback.back
export interface SwitchView { idea: boolean; timeRow: boolean; ready: boolean; offCard: boolean; greyed: boolean; }
export function switchesShown(i: { ideaKv: string | null; readyKv: string | null; permission: NotifyPermission; paused: boolean }): SwitchView;
```
`switchesShown` (DESIGN "What the switches show"):
- `permission === 'denied'`: `offCard: true`, `greyed: true`, `idea = parseIdeaSwitch(ideaKv)`, `timeRow = parseIdeaSwitch(ideaKv)`, `ready = parseReadySwitch(readyKv)`.
- otherwise: `offCard: false`, `greyed: false`, `idea = ideaKv === '1' && permission === 'granted' && !paused`, `timeRow = idea`, `ready = permission === 'granted' && readyKv !== '0'`.

### `@/features/morning/nudgeService`
```ts
export interface NudgeDeps {
  store: KittedStore; clock: Clock; ids: (prefix: string) => string;
  built: () => boolean;                         // NOTIFICATIONS_BUILT && nativeAvailable, or a demo script
  permissions: NotificationPermissions;
  scheduler: NotificationScheduler;
  canSuggest: (atMs: number) => Promise<boolean>; // morning.canSuggest (T55, on main)
  ageBlocked: () => Promise<boolean>;            // getAgeBlocked
  afterTodaysCard: () => Promise<void>;          // resolves once morning.ensureCard() has settled
}
export type Trigger = 'open' | 'foreground' | 'background' | 'change';
export type RescheduleResult =
  | { kind: 'scheduled'; atMs: number[]; lines: NudgeLine[] }
  | { kind: 'cancelled'; why: 'unbuilt' | 'age' | 'permission' | 'off' }
  | { kind: 'paused' }
  | { kind: 'comeback'; messageId: string };
export function createNudgeService(d: NudgeDeps): {
  reschedule(trigger: Trigger): Promise<RescheduleResult>;
  setIdea(on: boolean): Promise<NotifyPermission>;   // You → Notifications' daily switch
  setReady(on: boolean): Promise<NotifyPermission>;  // You → Notifications' Fit check ready switch
  setTime(hhmm: string): Promise<void>;              // saves profile.ideaTime, then reschedule('change')
  comebackOn(messageId: string): Promise<void>;      // Turn them back on
  comebackShowTime(messageId: string): Promise<void>;// Change the time (state 'picking')
  comebackPickTime(messageId: string, hhmm: string): Promise<void>;
  comebackNo(messageId: string): Promise<void>;
  cancelAll(): Promise<void>;                        // "Delete all my data"
  paused(): Promise<boolean>;
};
export type NudgeService = ReturnType<typeof createNudgeService>;
```
`reschedule(trigger)`, in this order:
1. `!built()` → `cancelled/unbuilt` (no scheduler call). `ageBlocked()` → `cancelAll`, clear `through`, `cancelled/age`. `permission() !== 'granted'` → `cancelAll`, clear `through`, `cancelled/permission`. `notify.idea !== '1'` → `cancelAll`, clear `through`, `cancelled/off`.
2. `notify.paused === '1'` → `paused` (no scheduler call).
3. `through` set and `nowMs > through`, and `notify.comebackFor !== through`: on `open`/`foreground` → await `afterTodaysCard()`, post the comeback card, write `paused = '1'`, `comebackFor = through` → `comeback`; on `background`/`change` → `paused` behaviour without posting (nothing scheduled).
4. Otherwise: if `bigEnoughAt ≤ nowMs` → `bigEnoughDone = '1'`. Times = `nudgeTimes(now, profile.ideaTime ?? '08:00', clock.offset)`; `canSuggest(t)` per time; lines = `nudgeLines(…)`; `replaceNudges` with 7 `LocalNotification`s (`id 'nudge|<local date>'`, `data {kind:'nudge'}`); `through = last time`; `bigEnoughAt` = the 'bigEnough' day's time, or cleared → `scheduled`.

`setIdea(true)`: writes `notify.idea = '1'` first; if `permission()` is undetermined, `request()`. If the result is granted: clear `paused`, `reschedule('change')`, turn an open ask card into its done line (state `allowed`, `when`, `time`; DESIGN Q8) and an open comeback card into its `Back on.` line (state `on`). Returns the permission. `setIdea(false)`: `notify.idea = '0'`, `cancelAll`, clear `through` and `paused`; an open comeback card is left as it is.
`setReady(on)`: writes `'1'`/`'0'`; switching on with permission undetermined asks; returns the permission.
Comeback answers write the card payload: `on` (with `when` and `time`), `picking`, `declined`. `comebackNo` writes `notify.idea = '0'`, clears `paused`, `cancelAll`. `comebackOn` / a pick clear `paused` and schedule.
`cancelAll()`: `scheduler.cancelAll()` only (the wipe clears the kv).

### `@/features/morning/readyWatch`
```ts
export interface ReadyDeps {
  store: KittedStore; built: () => boolean; permissions: NotificationPermissions; scheduler: NotificationScheduler;
  background: BackgroundWork; ageBlocked: () => Promise<boolean>;
}
export function createReadyWatch(d: ReadyDeps): {
  appState(s: 'active' | 'background' | 'inactive'): Promise<void>;
  checksChanged(): Promise<void>;
};
```
On `'background'`: watch the ids of checks whose status is `'scoring'`; if any, `background.begin()`. On `checksChanged()` while in the background: a watched check now `status 'scored'` with `score !== null` → if `built()`, not age-blocked, permission granted and `parseReadySwitch(notify.ready)`: `presentNow({ id: 'ready|<id>', body: readyBody(fixCount), atMs: null, data: { kind: 'ready', checkId } })`, once per check id; any other status (`failed`, `unreadable`, `notClothed`, `held`, `asking`) → unwatched, nothing sent. When nothing is watched → `background.end(id)`. On `'active'` / `'inactive'` after background: unwatch all, `end`. `fixCount` = distinct fix copies (as `toFinishChecks`).

### `@/features/morning/nudgeTap`
```ts
export interface TapDeps {
  store: KittedStore; clock: Clock;
  ensureTodaysCard: () => Promise<unknown>;  // morning.ensureCard()
  navigate: () => void;                      // router.navigate('/stylist')
  setAction: (a: StylistAction) => void;     // setStylistAction (router/stylistAction.ts, unchanged)
}
export function openFromNotification(data: NotificationData, d: TapDeps): Promise<void>;
```
`nudge`: `navigate()`, await `ensureTodaysCard()`, then the `dailyIdeas` row for `slotAt(now)` → `setAction({ kind: 'scrollTo', messageId })` if it has one (none: Stylist at its end). `ready`: the chat message with `cardType 'fitCheck'` and that `fitCheckId` → `navigate()` + `setAction({ kind: 'scrollTo', messageId })`. Never `{ kind: 'checkMyFit' }`.

### `@/features/morning/nudgeSession`
`export const nudges: NudgeService; export const readyWatch; export function useNotifications(): void;` `useNotifications` (called once in `StylistScreen`): on the first mount per process `nudges.reschedule('open')` and `lastTap()`; one app-wide `AppState` listener (registered once): `active` → `reschedule('foreground')`, `background` → `reschedule('background')`; both → `readyWatch.appState`; `onChange(['fitChecks'])` → `readyWatch.checksChanged()`; `onNotificationTap` → `openFromNotification`. On a demo screen the scheduler is a `recordingScheduler()` (never real notifications), the permission is `switch.ts`'s `notifications`, and background work is `noBackgroundWork`.

### `@/features/finish/sequence`
```ts
export type { NotifyPermission } from '@/services/notifications';
/** The setup ask (and T57's): built, not under the age lock, never posted, and he hasn't set the daily switch himself. */
export function askDue(i: { built: boolean; ageBlocked: boolean; asked: boolean; ideaKv: string | null }): boolean;
/** NT1.6: setup finished (step 'done' or 'skipped') with no ask ever, Apple's prompt never shown, the switch never set. */
export function catchUpDue(i: { built: boolean; ageBlocked: boolean; asked: boolean; ideaKv: string | null; permission: NotifyPermission; step: FinishStep }): boolean;
```
`asked` = `notify.asked` set or `FinishState.notifyMsgId` set. `notifyAskable` is removed.

### `@/features/finish/service`
```ts
export type NotifyCardState = 'open' | 'allowed' | 'denied' | 'declined'; // a stored 'picking' (older builds) reads as 'open'
// FinishDeps gains:
ageBlocked?: () => Promise<boolean>;        // default: false
rescheduleNudges?: () => Promise<void>;     // nudges.reschedule('change')
afterTodaysCard?: () => Promise<void>;      // default: resolves at once
// the service:
notifyPickTime(messageId: string, hhmm: string): Promise<void>; // open card only; nothing saved or scheduled
notifyYes(messageId: string): Promise<NotifyCardState>;         // Send me ideas: notify.idea '1', request(); granted → profile.ideaTime = the card's time, rescheduleNudges, 'allowed' (+ when); else 'denied'
notifyNo(messageId: string): Promise<void>;                     // notify.idea '0', no request, 'declined'
askPosted(): Promise<boolean>;                                  // for T57: notify.asked or notifyMsgId
// notifySet and notifyYes's old 'picking' step are removed
```
Ask payload: `{ question: 'notify', state: NotifyCardState, time: 'HH:MM', when?: 'today' | 'tomorrow' }` (`when` fixed when he answers, from `landsToday`; a stored `allowed` card with no `when` reads `tomorrow`, as built). Posting the ask (setup or catch-up) writes `notify.asked = <message id>`. The catch-up runs in `ensure()` when `catchUpDue`, after `afterTodaysCard()`, at the end of today's thread, once.

### Components and testIDs
- `NotifyAskCard({ m, showHeader?, readOnly? })` (unchanged props). Open: wrapper `View` testID `notify-ask`; time row testID `notify-ask-time-row`; buttons by their words. While Apple's prompt is up: `Send me ideas` `loading` (spinner, same width, `accessibilityState.busy`), `No thanks` `disabled`. Answered: wrapper testID `notify-ask-line`. At accessibility sizes each button `fullWidth`. After an answer, VoiceOver focus moves to the line (`AccessibilityInfo.setAccessibilityFocus`).
- `NotifyTimeRow({ time, onPick, testID, focusOnMount? })`: label `I get dressed at` (`KText subheadline ink2`, hidden from VoiceOver) + `MorphPicker` (capsule) with `accessibilityLabel = t('settings.a11y.value', { label: 'I get dressed at', value: ideaTimeLabel(time) })` and options `ideaTimeOptions(time)`.
- `ComebackCard({ m, showHeader?, readOnly? })`: payload `{ question: 'comeback', state: 'open' | 'picking' | 'on' | 'declined', time: 'HH:MM', when?: 'today' | 'tomorrow' }`. Open: wrapper testID `comeback`; `picking`: time row testID `comeback-time-row` (focus moves to the time); answered: wrapper testID `comeback-line`. `readOnly` (Past chats): the question only.
- You → Notifications: off card testID `notifs-off-card` (`Open Settings` by its words → `Linking.openSettings()`); `ToggleRow testID="notifs-idea"`, `PickerRow testID="notifs-time"` (`disabled` when greyed), `ToggleRow testID="notifs-ready"`. While Apple's prompt is up from a switch, that switch shows on and is disabled. The page re-reads the permission when the app returns to the front.
- `SettingsList.tsx`: `PickerRow` prop `disabled?: boolean` (row contents at `opacity.disabled`, not tappable, `accessibilityState.disabled`); `ToggleRow` prop `testID?: string` (on the `Switch`).
- `WipeDeps.cancelNotifications?: () => Promise<void>`: `deleteAllData` awaits it before `store.wipe()`.
- `switch.ts`: `setDemoNotify(answer: 'allow' | 'deny' | 'pending' | null, start?: NotifyPermission)`; `notificationsOn() = (NOTIFICATIONS_BUILT && nativeAvailable) || a demo script`; `notifications` falls back to `nativePermissions` when available, else `unbuiltNotifications`.

### Copy keys (the deck `handoff/02-screens.md` §5 → `en.generated.ts`)
| key | text |
|---|---|
| `notif.ask` | What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before. |
| `notif.ask.label` | I get dressed at |
| `notif.ask.yes` | Send me ideas |
| `notif.ask.no` | No thanks (kept) |
| `notif.ask.done` | Done. Your first idea lands tomorrow at {time}. (kept) |
| `notif.ask.doneToday` | Done. Your first idea lands today at {time}. (new) |
| `notif.ask.later` | No problem. You can turn it on later in You → Notifications. |
| `comeback.q` | I paused your daily ideas after a week without a visit. Want them back? |
| `comeback.on` | Turn them back on |
| `comeback.time` | Change the time |
| `comeback.no` | No thanks |
| `comeback.back` | Back on. Next one lands tomorrow at {time}. |
| `comeback.backToday` | Back on. Next one lands today at {time}. |
| `comeback.done` | Done. You can turn them on in You → Notifications. |
| `push.nudge.check` | Check today's fit. Each one teaches me your closet. |
| `push.nudge.idea` | Today's outfit idea is ready. |
| `push.nudge.bigEnough` | Your closet's big enough now: here's today's idea. |
| `push.ready` | Your fit check is ready. {n} quick fixes inside. (kept; `one`: Your fit check is ready. 1 quick fix inside.) |
| `push.ready.none` | Your fit check is ready. (new) |
| `notifs.header` | An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send. |
| `notifs.time` | I get dressed at |
Kept as they are: `notifs.title` Notifications, `notifs.idea` Daily outfit idea, `notifs.ready` Fit check ready, `notifs.off` Notifications are off for Kitted., `common.openSettings` Open Settings, `settings.a11y.value` `{label}, {value}`. **Removed:** `notif.ask.set`, `notifs.trial`, `push.trial`, `push.idea`, `unopened.q`, `unopened.keep`, `unopened.time`, `unopened.stop`, and `notifs.a11y.time` (en.ts).

### Demo screens
Changed: **158** Kit's ask (phone 1; 7:43, 8:00 am) · **159** Kit's ask · waiting on Apple's prompt (phone 3's card: `finish: { notify: 'pending', steps: ['later', 'notifyYes'] }`) · **160** Kit's ask · allowed, today (phone 4, 7:43: "…lands today at 7:45 am.") · **86** stays (now shows no `Trial ending` row).
New: **280** Kit's ask · allowed, tomorrow (phone 4; now `2026-10-22T07:50:00`) · **281** Kit's ask · No thanks (phone 5) · **282** Kit's ask · Don't Allow (phone 5; `notify: 'deny'`) · **283** Kit's ask · the catch-up (phone 6; scenario `full`, `finish: { notify: 'allow' }`, no ask posted before) · **284** You → Notifications · on (phone 8; granted, `notify.idea '1'`) · **285** · never asked (phone 9; undetermined, answer allow) · **286** · paused (phone 9 variant; granted, `'1'`, paused) · **287** · off in iOS (phone 10; denied, `'1'`) · **288** The comeback question (phone 11; scenario `full`, now `2026-10-29T09:00:00`, granted, `'1'`, a lapse) · **289** · Change the time (phone 12) · **290** · back on (phone 13) · **291** · No thanks (phone 14).
The scenario field (`app/src/demo/scenarios.ts`), prepared by `prepareNudgeDemo(store, sc, nowMs)` from `nudgeDemo.ts`:
```ts
export interface NotifyDemo {
  permission: NotifyPermission; answer?: 'allow' | 'deny' | 'pending';
  idea?: '1' | '0'; ready?: '1' | '0'; ideaTime?: string;
  lapse?: boolean;   // a schedule that ran out 1+ day ago (notify.through in the past)
  paused?: boolean;
  steps?: ('comebackOn' | 'comebackTime' | 'comebackNo')[];
}
```
Largest text: phone 15 = demo 158, phone 16 = demo 287, and 288, with the Simulator's text size at AX5. Phones 2 (the menu), 7 and 17 (the lock screen) have no screen of their own: 2 is a tap on 158; 7 and 17 are drawn by iOS.

## Data
- `profile.ideaTime` ("HH:MM", as built; default 08:00 when null). The nudge time is derived, never stored.
- KV `notify.idea`: `'1'` / `'0'`; **unset now reads off** for the daily switch (change from today). KV `notify.ready`: `'0'` = off, unset = on. `notify.trial` no longer read.
- New KV: `notify.asked`, `notify.through`, `notify.paused`, `notify.comebackFor`, `notify.bigEnoughAt`, `notify.bigEnoughDone` (meanings under `NOTIFY_KV`). All cleared by "Delete all my data" (`store.wipe()` clears every kv), as are `profile.ideaTime`, `notify.idea`, `notify.ready`, `onboard.finish` and `firstCheckOffer.laterAt`.
- Chat payloads: the ask `{ question: 'notify', state, time, when? }`; the comeback `{ question: 'comeback', state, time, when? }`.
- Migration: none written. A stored `picking` ask reads as `open`; a stored `allowed` ask with no `when` reads "tomorrow"; testers from the first TestFlight build have `onboard.finish` `done` with `notifyMsgId: null` (NOTIFICATIONS_BUILT was false), which is what the catch-up looks for.

## Steps
1. Merge main after T34 lands. `npx expo install expo-notifications` (memory check first).
2. Copy deck rows in `handoff/02-screens.md` §5 (the table above), `node app/scripts/gen-en.mjs`, then `en.ts` (`push.ready` `one` kept, `notifs.a11y.time` removed).
3. `services/notifications.ts` (interfaces, `notificationContent`, `notificationTrigger`, `scriptedNotifications`, `recordingScheduler`, `noBackgroundWork`); `services/notificationsNative.ts`; the two native functions in `modules/kitted-vision`.
4. `prefs.ts`: 17 times; idea unset = off; drop `trial`.
5. `features/morning/nudges.ts`, `nudgeService.ts`, `readyWatch.ts`, `nudgeTap.ts`, `nudgeSession.ts`, `ComebackCard.tsx`, `nudgeDemo.ts`.
6. `features/finish/`: `sequence.ts` (`askDue`, `catchUpDue`), `service.ts` (one-step ask, asked marker, catch-up, deps), `session.ts`, `NotifyTimeRow.tsx`, `NotifyAskCard.tsx`, `demo.ts`.
7. `features/stylist/`: `MessageView.tsx`, `thread.ts`, `StylistScreen.tsx` (`useNotifications()`).
8. `you/notifications.tsx` and `SettingsList.tsx` (`PickerRow disabled`, `ToggleRow testID`).
9. `privacy/wipe.ts` and `privacy/actions.ts`; `paywall/switch.ts`; `config/features.ts`.
10. Demo screens in `scenarios.ts` / `prepareDemoScreen.ts`.
11. `app.config.ts`; `LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install`, check `ios/Kitted/Kitted.entitlements` has no `aps-environment`, `pod install`, then the Simulator build (`expo run:ios --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D --no-bundler`). No EAS build, no TestFlight (Y22 is the founder's separate OK).

## Must not break
- The setup sequence's order (first check → Later or a re-check → "Want outfit ideas from your own clothes?" + the closet card → the paywall where it's on → the ask) and its tests E1–E7, L1, O1–O9, B1, P2–P8 in `onboardingFinish.test.ts`; the beta skips the paywall (FP7.5) and the ask follows the closet card.
- The morning card: its locked idea, rotation, `ensureCard`'s one-card-per-window guard (T54) and T55's threshold; the nudge code only reads `canSuggest()` and calls `ensureCard()` only on a tap. `morningService`, `morningOneCard`, `morningSwap`, `morningCopy` tests and the T55 flow stay green.
- Nothing leaves the phone: no network call, push token or server code anywhere in the notification code (`getDevicePushTokenAsync` / `getExpoPushTokenAsync` never called).
- **No `aps-environment` entitlement** and no Push Notifications capability: the free Personal Team can't sign it (`app.config.ts` `APPLE.paid` is false) and nothing is pushed. If the plugin adds it, leave the plugin out (local notifications need none) and say so in REPORT.md.
- A JS update reaching a build without the native module (the founder's phone before its rebuild, the web preview) doesn't crash and shows no ask (`built()` false).
- T34's You rows and its flow (`T34-you-settings-home.yaml`); `privacyWipe.test.ts`; "Delete all my data" still returns him to Welcome with the age block kept.
- Every existing Maestro flow (`smoke.yaml`, `T14-beta-limits.yaml`, `T55-card-threshold.yaml`, T34's).
- No `KeyboardAvoidingView`, no inverted list; React Compiler rules (no `Date.now()` in render; times come from the session clock).

## Open questions
**For the founder**
1. **After Don't Allow from the You → Notifications switch, does the daily switch show off or greyed on?** Spec NT3.3 says "Don't Allow leaves the switch off". The approved design writes `notify.idea` on before asking, and phone 10 shows the daily switch greyed **on** ("switch button, on, dimmed"), so that coming back from iOS Settings with notifications on schedules at once (spec NT3, "Coming back with them on clears the card and schedules"). Phone 9's text also says "goes back off", so the design contradicts itself. · the founder (what he sees) · **recommended and the default meanwhile: phone 10 as drawn** (greyed on, nothing scheduled, Open Settings is the way back), and NT3.3's "off" read as "can't be on": no nudge is scheduled.
2. **The "big enough" line when his closet was already big enough at his first nudge.** NT2.6 says the first scheduled day it can suggest gets "Your closet's big enough now: here's today's idea." A tester whose closet already makes two outfits when he says yes (the founder's phone) would get "big enough now" on day one, though nothing changed. · the founder (words he reads) · recommended: send it only after at least one "Check today's fit." nudge was scheduled, otherwise "Today's outfit idea is ready." (a spec change, NT2.6) · **default meanwhile: the spec as written.**
3. **A nudge that fires while Kitted is open.** The spec doesn't say. · the founder (taste) · **recommended and default: not shown** (iOS's own default for the app in front; today's card is already in Stylist, and it keeps "one a day" quiet).

**The founder's answers (Nov 10, in chat)**
1. Don't Allow from the switch: **greyed out, still on** (phone 10 as drawn). Spec NT3 and NT3.3 now say so.
2. The "big enough" line: **only after at least one `Check today's fit` nudge was delivered**; someone who could already suggest when he said yes never gets it. Spec NT2 and NT2.6 now say so.
3. A nudge while Kitted is open: **not shown** (iOS's default; a technical call, settled by the coordinator).

**Technical defaults (the coordinator logs them)**
1. **The catch-up (NT1.6)** fires only when the finish sequence's step is `done` or `skipped` (setup finished), no ask was ever posted (`notify.asked` and `notifyMsgId` empty), `notify.idea` is unset, the permission is `undetermined`, notifications are built and he isn't age-blocked. A first-build tester who never checked a fit (step `waiting`) gets the ask after his first scored fit, like a new user.
2. **The setup ask no longer requires iOS's permission to be `undetermined`** (spec: after "Delete all my data" the ask comes again "like a new user", and iOS keeps its answer through a wipe). It's skipped when already posted, when `notify.idea` was already set in You → Notifications, under the age lock, or when not built. After a wipe with iOS already at Don't Allow, `Send me ideas` shows the later line with no prompt (iOS won't ask twice).
3. **A lapse** is `now > notify.through` (the last scheduled nudge's time); the comeback posts once per lapse (`notify.comebackFor`). While nothing can be scheduled (switch off, iOS off, age lock, not built) `notify.through` is cleared, so coming back from a long iOS-off spell schedules normally and asks nothing (consistent with DESIGN Q3).
4. **"Delivered" for the big-enough line** = its scheduled time passed before the next reschedule (`notify.bigEnoughAt ≤ now`). Turning the switch off before it fires clears it. If iOS notifications were off at that moment it still counts as delivered (Kitted can't know).
5. **today / tomorrow** in the done and back-on lines is by the phone's calendar date (not the 4 am day key), fixed when he answers (`payload.when`), so the line never changes later.
6. **A tap** opens the card of the window he's in when he taps (after 5 pm, the evening card); with no card (fit checks declined, S26) it opens Stylist at the end.
7. **Fit check ready** watches checks with status `scoring` at the moment the app goes to the background; it sends only if one turns `scored` with a score while still in the background. `asking` (the one quick tap) waits for him, so nothing is sent. A partly "not rated" check that still has a score sends ("not rated" = no score).
8. **Demo screens never schedule real notifications** (a recording scheduler). `built()` = `NOTIFICATIONS_BUILT && nativeAvailable` (or a demo script).
9. **No `aps-environment`**; the `expo-notifications` config plugin only if prebuild needs it.
10. **Cards posted on open** (the catch-up and the comeback) wait for `morning.ensureCard()` to settle, so they sit under today's card (DESIGN Q4).
11. **Switching the daily idea off in You → Notifications** doesn't change an open comeback card; its buttons still work.
12. **New code lives in `features/morning/`** (the lane) and `services/notificationsNative.ts`; kv keys are local to `nudges.ts` (no change to `data/store.ts`).
13. **Out-of-lane files** (listed under Files): `SettingsList.tsx` (after T34), `privacy/wipe.ts` and `privacy/actions.ts`, `paywall/switch.ts`, `modules/kitted-vision`, `demo/scenarios.ts` and `prepareDemoScreen.ts`, the copy deck and `en.generated.ts`. The spec's Touches names `wipe.ts`, the native module and the copy deck; DESIGN names `SettingsList.tsx`. Each is a few lines. The coordinator should confirm no session is editing them at build time.
14. **The plan line's checks say "NT1–NT5 except NT1.8–NT1.10"**, but the spec (approved Nov 9 with NT6 in the beta) and the approved design include NT6 (Fit check ready, phone 17), and the coordinator's brief says NT1–NT6. This plan covers NT6; the coordinator should add NT6 to T53's plan line.
