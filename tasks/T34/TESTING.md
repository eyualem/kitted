# T34 · Testing contract

Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `<commit SHA>` · <date> · tests: `app/src/__tests__/youSettingsHome.test.tsx`, `app/e2e/flows/T34-you-settings-home.yaml`, and the on-purpose edits to `youTonight.test.ts` (YT2), `releaseSafety.test.ts` (R5), `heightBuildRemoved.test.ts` (line 91), `app/e2e/flows/T14-beta-limits.yaml` (its Settings step)

Plan-line criteria: SY1 → SY1.1, SY1.2, SY1.3, SY1.4, SY1.5, SY1.6 (6). All six are below.

Shared set-up for `youSettingsHome.test.tsx` (render tests with `@testing-library/react-native`): `@/design-system` mocked as in `cardNoAddTile.test.tsx` (plain `Text`/`View`/`Pressable` stand-ins for `KText`, `KCard`, `MonoLabel`, `Icon`, `KButton`, `TextLink`, `WovenLabel`, `RowDivider`, and a `MorphPicker` stand-in that renders one button labelled with its `accessibilityLabel` plus one button per option calling `onPick`); `expo-router` mocked (`router.push` a `jest.fn`, `useLocalSearchParams` returning the test's params); `@/data/db` `store` = a fresh `createMemoryStore()`; `@/data/useLive`, `@/features/fitcheck/session` and `@/services/entitlements` mocked to return the test's profile, facts and quota snapshot; `@/features/settings/actions` (`openLink`, `openManageSubscription`) and `@/features/toast/toast` (`showToast`) spied; `resetTierForTests()`, `setDemoPaywall(null)` and `setDemoTier(null)` before each test. "Free" = tier `free`, paywall off; "beta" = `setDemoTier('beta')`; "paywall on" = `setDemoPaywall('ok')` with tier `free`; "Pro" = `useIsPro()` true and the snapshot's `purchased: true`. `AccountSection` is mocked to render `View testID="you-section-account"` when the test turns accounts on, else `null`. "Order" = the order of `screen.getAllByTestId(/^you-/)` in the rendered tree.

## Criteria
- **SY1.1** · You's header has no gear or other button; the Settings page no longer exists, and every place that linked to it opens You.
  · how: unit (incoming links, the demo screen table, the route file) and flow (the header, the old link on the phone), plus a Simulator screenshot of the header
  · test: `youSettingsHome.test.tsx` › `SY1.1 · an old kitted://you/settings link opens You at its rows`; `SY1.1 · no demo screen opens or sits under /you/settings`; `SY1.1 · the Settings route is gone`; `T34-you-settings-home.yaml` steps "SY1.1 header" and "SY1.1 old link"
  · expect: `redirectSystemPath({ path: 'kitted://you/settings', initial: true })` → `'/you?at=settings'`; also `'/you/settings'` → `'/you?at=settings'`, `'/you/settings/'` → `'/you?at=settings'`, `'kitted://you/settings?x=1'` → `'/you?at=settings'`; controls unchanged: `'/closet'` → `'/closet'`, `'kitted://you/plan'` → `'/you/plan'`, `'kitted://demo/screen/9?latency=0'` → `'/demo/screen/9?latency=0'`. In `SCREENS`, no `href` or `under` starts with `/you/settings`; screens 84, 141, 142, 258 have `href: '/you?at=settings'`. `app/src/app/(tabs)/you/settings.tsx` does not exist. On the phone (demo 17 and 257): the large title `You` and nothing else in the nav bar; no element labelled `Settings`. `openLink: kitted://you/settings` → the style card (`Your style: …`) and the row `Plan & usage, Free plan` are visible.
  · must not: no element on You labelled `Settings` (exact, and `.*Settings.*` in the header area); the old link never shows `This isn't here anymore.` or a page titled `Settings`; `kitted://you/plan` is not rewritten to You.
  · edges: a cold start from the old link (`initial: true`) and a warm one (`initial: false`) both give `/you?at=settings`. A reinstall changes nothing (no stored state).
  · red: (test writer)

- **SY1.2** · You shows, in order: style card, What Kit knows, Today, the rows of SY1 step 5 (each shown only under its stated condition), then the version line.
  · how: component (render `YouScreen` and `SettingsRows` under each condition) and flow (demo 84, 141, 258, 270)
  · test: `youSettingsHome.test.tsx` › `SY1.2 · free: style, knows, Today, then Appearance, Plan & usage, Privacy & data, Acknowledgements, then the version line`; `SY1.2 · each conditional row shows only under its condition`; `SY1.2 · Pro: the Pro row under the style card`; `T34-you-settings-home.yaml` step "SY1.2 rows"
  · expect: **Free, nothing else on** — order exactly `you-scroll`, `you-style`, `you-knows`, `you-today`, `you-rows`, `you-section-main`, `you-row-appearance`, `you-row-plan`, `you-section-privacy`, `you-row-privacy`, `you-section-help`, `you-row-acknowledgements`, `you-version` (no `you-pro`, no `you-section-account`, no `you-row-notifications`, no `you-section-subscription`, no `you-row-report|support|privacy-policy|terms`). Section labels shown: `Help & about` only. Version line text = `versionLine(appVersion())`, which matches `/^Kitted \S+ \(\S+\) · Scoring v\S+$/`. **Accounts on** → `you-section-account` comes right after `you-rows` and before `you-section-main`. **`notificationsBuilt: true`** → `you-row-notifications` is the first row of `you-section-main`, before `you-row-appearance`, title `Notifications`. **Paywall on** → `you-section-subscription` (label `Subscription`) between `you-section-privacy` and `you-section-help`, rows `you-row-manage` (`Manage subscription`) then `you-row-restore` (`Restore purchases`). **Beta with the paywall script on** → no `you-section-subscription`. **`links: { support: 's@x.co', privacy: 'https://p.x', terms: 'https://t.x' }`** → Help & about rows in order `you-row-report` (`Report a wrong score`), `you-row-support` (`Contact support`), `you-row-privacy-policy` (`Privacy policy`), `you-row-terms` (`Terms of use`), `you-row-acknowledgements`; with only `support` set, report and support show and the two web rows don't. **Pro** → `you-pro` right after `you-style`, before `you-knows`; label `Kitted Pro`, hint `Plan & usage`. **No facts** → `you-knows` shows `I'll add what I learn here.` and no `See all`; with facts, `See all {n}` (n = the live fact count) and at most 4 facts. On the phone, demo 84: scrolling down from the top reaches `Appearance, System`, then `Plan & usage, Free plan`, then `Privacy & data`, then `Acknowledgements`, then the version line (each found below the one before); demo 141: `Back up and sync, Off · on this iPhone only` is above `Appearance, System`; demo 270: `Plan & usage, Kitted Pro`, `Manage subscription`, `Restore purchases`.
  · must not: no `Show me around` row in T34 (no element with those words); no Subscription section while the paywall is off or the tier is `beta`; no Notifications row while `notificationsBuilt` is false; no mail or web row while its address is null; no account section while accounts are off; nothing after the version line; no empty card for a section with no rows (Subscription off renders no `you-section-subscription` at all).
  · edges: You before its data loads renders nothing (`null`), not a half list. A profile-less install (no profile row) still renders the style card first (`you-style`, `No looks picked yet`). Offline changes nothing (every row is local).
  · red: (test writer)

- **SY1.3** · Each row does exactly what the Settings page's row did: same page, same value, same Appearance choice saved; Back from each page reads `You`.
  · how: component (press each row) and flow (open each page from You and read its back button)
  · test: `youSettingsHome.test.tsx` › `SY1.3 · each push row opens its page`; `SY1.3 · Plan & usage shows the plan's short name`; `SY1.3 · Appearance shows the saved choice and saves a new one`; `SY1.3 · Manage, Restore and the mail and web rows do what Settings did`; `T34-you-settings-home.yaml` step "SY1.3 back reads You"
  · expect: press `you-row-plan` → `router.push('/you/plan')`; `you-row-privacy` → `'/you/privacy'`; `you-row-acknowledgements` → `'/you/acknowledgements'`; `you-row-notifications` (built) → `'/you/notifications'`; each called once. Plan row label: free `Plan & usage, Free plan`; beta `Plan & usage, Kitted beta`; Pro `Plan & usage, Kitted Pro`; trial (`demoPlan: 'trial'`) `Plan & usage, Pro trial`. Appearance: with `KV.appearance` unset the pill reads `Appearance, System`; with it `dark` before render, `Appearance, Dark`; pick `Light` → the label becomes `Appearance, Light` and `store.getKv(KV.appearance)` is `'light'`. `you-row-manage` → `openManageSubscription` called once (hint `Opens your subscriptions in the App Store`). `you-row-restore` with the demo entitlement Pro → `showToast('Restored. Kitted Pro is on.')`; not Pro → `showToast('No purchases to restore.')`. `you-row-report` → `openLink(mailtoUrl('s@x.co', 'A wrong score (Kitted ' + appVersion().version + ')'))`; `you-row-support` → `openLink(mailtoUrl('s@x.co', 'Kitted ' + v.version + ' (' + v.build + ')'))`; both hint `Opens Mail`. `you-row-privacy-policy` → `openLink('https://p.x')`, `you-row-terms` → `openLink('https://t.x')`, both hint `Opens the page in Safari`. On the phone (demo 17): tap `Plan & usage, Free plan` → the page `Plan & usage` with its back button reading `You` (an element `You` left of the title `Plan & usage`); back → You; the same for `Privacy & data` (title `Privacy & data`) and `Acknowledgements` (title `Acknowledgements`); demo 86 (`/you/notifications`, under You) shows back `You`. Pick `Dark` on Appearance → `Appearance, Dark` visible.
  · must not: no row pushes `/you/settings` or any route other than its own; opening the picker and closing it without a pick writes nothing (`KV.appearance` stays unset) and keeps `System`; Restore never shows a toast before the restore result; no back button on these pages reads `Settings`.
  · edges: after "Delete all my data" (the store's KV wiped) Appearance reads `System` again. The sign-in row (`Back up and sync`, demo 141) opens `/sheets/sign-in?from=settings` and closing the sheet returns to You.
  · red: (test writer)

- **SY1.4** · `Privacy & data` appears exactly once on You.
  · how: component (render the whole `YouScreen`, free, beta and Pro with the paywall on) and flow
  · test: `youSettingsHome.test.tsx` › `SY1.4 · one Privacy & data on You, in the rows` (replaces youTonight YT2); `T34-you-settings-home.yaml` step "SY1.4"
  · expect: `screen.getAllByText('Privacy & data')` has length 1 and `screen.getAllByLabelText('Privacy & data')` has length 1, in each of free, beta and Pro with the paywall on; that one element is `you-row-privacy` inside `you-section-privacy` (after `you-today`). On the phone, demo 17 scrolled top to bottom: `Privacy & data` is found once, below `you-today`'s card, and no lock-icon card sits between the Today card and the rows.
  · must not: never 0 and never 2; no `Privacy & data` card between Today and the rows (the old `PrivacyRow`).
  · edges: with accounts on (demo 141) still once.
  · red: (test writer)

- **SY1.5** · The ScrollView is You's first view, so the iOS tab bar shrinks on scroll.
  · how: component (the rendered root) and Simulator state (screenshots before and after a scroll)
  · test: `youSettingsHome.test.tsx` › `SY1.5 · the screen's root is the ScrollView`; Simulator check in REPORT.md
  · expect: once loaded, the root of `YouScreen`'s rendered tree is the host ScrollView (`screen.toJSON()` root `type === 'RCTScrollView'`) with `testID="you-scroll"`, and every block (`you-style` … `you-version`) is inside it. On the Simulator (demo 17, light): before any scroll the full tab bar with four labels (`Stylist`, `Closet`, `Lookbook`, `You`); after a swipe up of at least half the screen on You, the bar has shrunk to the compact iOS 26 form (labels hidden); both screenshots in REPORT.md.
  · must not: the root is never a `View` wrapping the ScrollView, and nothing renders before it; the bar must not stay full after the scroll.
  · edges: with `at=settings` (demo 84) the page opens scrolled: the screenshot shows whether the bar is shrunk or full; either is acceptable, it is recorded.
  · red: (test writer)

- **SY1.6** · Light, dark and the largest text size: nothing clipped, no word broken mid-word; VoiceOver reads each row as a button with its value.
  · how: component (each row's role and label), flow (labels on the phone), Simulator screenshots (light, dark, the largest text size)
  · test: `youSettingsHome.test.tsx` › `SY1.6 · every row is one button read with its value`; `T34-you-settings-home.yaml` step "SY1.6 labels"; screenshots in REPORT.md
  · expect: each `you-row-*` `LinkRow` has `accessibilityRole: 'button'` and label exactly: `Plan & usage, Free plan` (free; `…, Kitted beta` on beta; `…, Kitted Pro` on Pro), `Privacy & data`, `Acknowledgements`, `Notifications` (built), `Manage subscription`, `Restore purchases`, `Report a wrong score`, `Contact support`, `Privacy policy`, `Terms of use`; the Appearance pill a button labelled `Appearance, System` (or the saved choice); the section labels `Help & about` and `Subscription` have role `header`. Screenshots of demo screens 17, 84, 141, 258, 270 and 271 in light, dark and at `accessibility-extra-extra-extra-large`: every row title and value whole (no `…`), no word split across lines inside the word, the chevron and value never overlapping the title (at accessibility sizes the value stacks under the title, as on the old Settings page), the version line whole.
  · must not: no row read as plain text or as two elements (title and value separately); no truncation; no row shorter than 44 pt; nothing hidden behind the tab bar at the bottom of the page (the version line can scroll clear of it).
  · edges: dark mode via `theme: dark` on the demo launch; the largest size via `xcrun simctl ui 111D0A09-C2CA-4F72-BF3C-44019A05C89D content_size accessibility-extra-extra-extra-large`, reset to `large` after.
  · red: (test writer)

## The flow (`app/e2e/flows/T34-you-settings-home.yaml`)
Replayed on every later task. Opens demo screens through `../common/open-demo.yaml`; reaches You by `openLink: "kitted://you"` (the dev menu's Tools button sits over the You tab). Steps, each named for its criterion: "SY1.1 header" (demo 17: no `Settings`), "SY1.1 old link" (`openLink: kitted://you/settings` → style card and `Plan & usage, Free plan` visible, no `This isn't here anymore.`), "SY1.2 rows" (demo 84, 141, 270, as above; demo 258 also runs `../common/beta-nothing-to-buy.yaml`), "SY1.3 back reads You" (Plan & usage, Privacy & data, Acknowledgements from demo 17; Notifications from demo 86), "SY1.4" (one `Privacy & data`), "SY1.6 labels" (the exact labels above as whole-label matches). The T14 flow's `tapOn: "Settings"` step becomes a `scrollUntilVisible` for `Plan & usage, Kitted beta` on You (the rest of that flow unchanged).

## UI inventory
Every visible element, per state. Anything on screen that isn't here is a defect; anything here that isn't on screen is a defect. Each state: light, dark and the largest text size. Elements T34 doesn't change (the style card's contents, the facts, the Today card's lines) keep their existing words and labels; they're listed so their place is checked.

### You, free, top · demo screen 17
- Nav bar · large title "You" · VoiceOver: "You", header · no button on either side
- Style card · "YOUR STYLE" (VoiceOver reads "Your style"), "Edit" (a cue, hidden from VoiceOver), his picks as numbered pills, the basics line when he gave a fit · VoiceOver: one button, `styleCardSpoken(profile)` · testID `you-style`
- What Kit knows header · "WHAT KIT KNOWS" · VoiceOver: "What Kit knows", header; link "See all {n}" · VoiceOver: "See all {n}", button · testID `you-knows`
- Up to 4 facts (the seed's: "Career fair on Oct 29", "You wear tees untucked", "Do you like muted colors more than bright ones?", "You like straight-leg pants"), as today
- Today card · as today on free (title, right side and line per `quotaSnapshot`; "Check my fit" or "Re-check" when due) · testID `you-today`
- Then the rows below (scrolled to) as in demo 84
- No Privacy & data card between Today and the rows; no gear

### You, settings rows, free · demo screen 84
- Card 1 (`you-section-main`): row "Appearance" with pill "System" · VoiceOver: "Appearance, System", button · testID `you-row-appearance`; row "Plan & usage" value "Free plan" › · VoiceOver: "Plan & usage, Free plan", button · testID `you-row-plan`
- Card 2 (`you-section-privacy`): row "Privacy & data" › · VoiceOver: "Privacy & data", button · testID `you-row-privacy`
- Label "HELP & ABOUT" · VoiceOver: "Help & about", header; card (`you-section-help`): row "Acknowledgements" › · VoiceOver: "Acknowledgements", button · testID `you-row-acknowledgements`
- Version line · "Kitted {version} ({build}) · Scoring v{n}" (the build's `versionLine()`) · VoiceOver: the same text · testID `you-version`
- Absent here: Notifications, Subscription, Manage subscription, Restore purchases, Report a wrong score, Contact support, Privacy policy, Terms of use, Account, Show me around

### Appearance menu open · demo screen 84, after tapping the pill
- The menu: "System", "Light", "Dark" · VoiceOver: each a button with its word · the current one marked as the pill marks it today

### You, Account signed out · demo screen 141
- Label "ACCOUNT" · VoiceOver: "Account", header; row "Back up and sync" value "Off · on this iPhone only" › · VoiceOver: "Back up and sync, Off · on this iPhone only", button · testID `you-section-account` (wrapper)
- Then the free rows as in demo 84

### You, Account signed in · demo screen 142
- Label "ACCOUNT"; row "Signed in with Apple" with the demo account's email (or "Hidden email" for a relay address) · VoiceOver: "Signed in with Apple, {email}", not a button; row "Sign out" · VoiceOver: "Sign out", button
- Then the free rows as in demo 84

### Beta, top · demo screen 257
- As demo 17, with the beta Today card (`Today`, `resets at 4 am`, `{c} of 3 fit checks left · {q} of 20 questions left`), no Try Pro

### Beta, settings rows · demo screen 258
- As demo 84 with "Plan & usage" value "Kitted beta" · VoiceOver: "Plan & usage, Kitted beta"
- Nothing to buy (the T14 banned list: no `Pro`, `free check`, `trial`, price; no Subscription, Manage subscription, Restore purchases)

### Pro with the paywall on, top · demo screen 271
- As demo 17, plus the Pro row right under the style card: woven label "KITTED PRO" and "Kitted Pro" › · VoiceOver: "Kitted Pro", button, hint "Plan & usage" · testID `you-pro`; the Today card's Pro lines

### Pro with the paywall on, settings rows · demo screen 270
- Card 1: "Appearance" "System"; "Plan & usage" "Kitted Pro" › · VoiceOver: "Plan & usage, Kitted Pro"
- Card 2: "Privacy & data" ›
- Label "SUBSCRIPTION" · VoiceOver: "Subscription", header; card (`you-section-subscription`): "Manage subscription" › · VoiceOver: "Manage subscription", button, hint "Opens your subscriptions in the App Store" · testID `you-row-manage`; "Restore purchases" (no chevron) · VoiceOver: "Restore purchases", button · testID `you-row-restore`
- "HELP & ABOUT": "Acknowledgements" ›; the version line

### Pages opened from You · demo screens 85 (Plan & usage), 86 (Notifications), 87 (Privacy & data); Acknowledgements from demo 17
- Each page unchanged, with the back button "‹ You" · VoiceOver: "You", button (iOS's back button)

### States with no demo screen (checked by the render tests only, until they can show on a build)
- Notifications built: row "Notifications" › first in card 1 · VoiceOver: "Notifications", button · testID `you-row-notifications`
- Addresses set: in Help & about, before Acknowledgements: "Report a wrong score" (hint "Opens Mail") `you-row-report`; "Contact support" (hint "Opens Mail") `you-row-support`; "Privacy policy" (hint "Opens the page in Safari") `you-row-privacy-policy`; "Terms of use" (hint "Opens the page in Safari") `you-row-terms`; each a button read by its title
- Loading: nothing drawn until profile, facts and usage load (as today); no spinner
- Empty What Kit knows (demo 165, first run): "I'll add what I learn here.", no "See all"
- Offline: identical to online (no row needs the network); no banner on You

## Not testable yet
Never dropped, never counted as pass.
- **SY1.2** (the `Show me around` row's place, first in Help & about) · why: T34 doesn't show it (IMPLEMENTATION.md T-1: a row with no behaviour would be a dead end) · would verify it: T35 adds the row with SY3's behaviour and extends `SY1.2`'s order test and the flow.
- **SY1.2 / SY1.3** (the Notifications row on a real screen) · why: `NOTIFICATIONS_BUILT` is false until the beta-notifications task lands; the row is checked only in the render test with `notificationsBuilt: true` · would verify it: that task's merge flips the switch; this flow's "SY1.2 rows" step then gains `Notifications` above `Appearance, System`.
- **SY1.2 / SY1.3** (Report a wrong score, Contact support, Privacy policy, Terms of use on a real screen, and the mail and Safari opening) · why: `SUPPORT_EMAIL`, `PRIVACY_URL` and `TERMS_URL` are null · would verify it: the founder's support address and hosted pages (needed before App Review); then a tap on each opens Mail with the subject above or Safari on the page.
- **SY1.2** (sign-in's rows on his phone) · why: `ACCOUNTS_BUILT` is false; demo 141 and 142 show them on demo builds · would verify it: the sign-in lane's task that turns accounts on.
- **SY1.6** (a real VoiceOver pass) · why: the render test and Maestro read labels and roles, not VoiceOver's spoken order · would verify it: the founder (or the verifier with the Simulator's Accessibility Inspector) swiping through demo 84 with VoiceOver on: each row is read once, as "{title}, {value}, button".
