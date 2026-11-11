# T34 · You becomes the settings home: Settings' rows move into You; the gear and the Settings page go

**From:** `plan.md` → T34 · **Spec:** `specs/setup-and-you.md` → SY1 (approved by the founder Nov 9; `specs.md` F9 agrees, DECISIONS-LOG #405) · **Lane:** Setup and You

## Goal
He opens You and finds every setting there under his style card, What Kit knows and Today: no gear, no separate Settings page, and each row works exactly as it did on the Settings page.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.

**In the lane:**
- `app/src/app/(tabs)/you/_layout.tsx`: the gear (`SettingsButton`) and `headerRight` go; the `settings` `Stack.Screen` goes. Every other screen and title stays as it is (the index keeps `title: t('tab.you')`, large title).
- `app/src/app/(tabs)/you/settings.tsx`: **deleted**.
- `app/src/app/(tabs)/you/index.tsx`: the `PrivacyRow` component and its use go; `<SettingsRows />` goes after the Today card; testID wrappers on each block; the `at=settings` scroll. The header comment is updated (no gear, no Settings).
- `app/src/features/settings/SettingsRows.tsx` (new): the Settings page's body, moved here and regrouped per SY1 step 5, plus the version line.
- `app/src/features/settings/SettingsList.tsx`: `LinkRow` and `PickerRow` take an optional `testID` (passed to the row's outer `Pressable` / `View`). Comments that say "You › Settings" say "You". No other change (Plan & usage, Notifications, Privacy & data and Acknowledgements also use this file).
- `app/src/i18n/en.ts` (shared): **no change** (every string already exists; see "Strings"). Named on the plan line; left alone.

**Outside the lane (each a minimal edit; the coordinator must OK them, see Open questions T-4 and T-6):**
- `app/src/app/+native-intent.tsx`: one rule: an incoming `/you/settings` link becomes `/you?at=settings` (SY "Rules": a link that opened Settings opens You).
- `app/src/demo/scenarios.ts`: demo screens 84, 141, 142 and 258 point at `/you?at=settings` (no `under`), renamed; new screens 270 and 271.

**Tests and flows (the test writer's, not the implementer's):** a new `app/src/__tests__/youSettingsHome.test.tsx`, a new flow `app/e2e/flows/T34-you-settings-home.yaml`, and on-purpose edits to four existing checks that read the deleted `settings.tsx` or tap the gone gear (Must not break, and TESTING.md).

Not touched: `you/notifications.tsx` (the beta-notifications session's), `you/plan.tsx`, `you/privacy.tsx`, `you/acknowledgements.tsx`, `you/profile.tsx`, `you/knows.tsx`, `features/account/AccountRows.tsx` (rendered as is), `config/features.ts`, `config/links.ts`, `en.generated.ts`.

## Interfaces
What the tests call. The test writer reads only this section.

### The You screen (`app/src/app/(tabs)/you/index.tsx`, default export `YouScreen`)
- Reads (unchanged): `useLive(['profile'], …)`, `useLive(['facts'], …)`, `useLive(['usage', 'fitChecks'], () => quota.snapshot(), [isPro])` (from `@/data/useLive`, `@/features/fitcheck/session`), `useIsPro()` (`@/services/entitlements`), `usePaywallOn()` (`@/features/paywall/switch`). New: `useLocalSearchParams<{ at?: string }>()` from `expo-router`.
- Renders `null` until profile, facts and usage have loaded (as today). Once loaded, its **root element is the `ScrollView`** (`testID="you-scroll"`, `contentInsetAdjustmentBehavior="automatic"`), never wrapped in a `View`.
- Children of the ScrollView, in this order, each wrapped in a plain `View` with the testID (not `accessible`, so VoiceOver is unchanged):
  1. `you-style`: the style card (unchanged: `Pressable`, role button, label `styleCardSpoken(p)`, opens `/you/profile`).
  2. `you-pro`: the Pro row, only while `usage.purchased` (unchanged; the expression `usage.purchased ? <PlanRow />` stays literally, serverProxy A10 reads it). It stays where it is today, between the style card and What Kit knows (Open question T-3).
  3. `you-knows`: What Kit knows (unchanged: `What Kit knows` header, `See all {n}` when n > 0 → `/you/knows`, up to 4 facts; empty: `I'll add what I learn here.`).
  4. `you-today`: the Today card (unchanged; the testID already exists).
  5. `<SettingsRows />` (below), whose root carries `you-rows`.
- No other Privacy & data element on the screen: the old `PrivacyRow` card is gone.
- `at=settings` (`/you?at=settings`): once the `you-rows` block has laid out, the ScrollView scrolls once, unanimated, so the block's top sits at the top of the visible area (y = the block's layout y minus `space.m`, floored at 0). Any other value, or none: no scroll. It scrolls only on the first layout after the screen mounts with the param (not again on re-render).

### The rows (`app/src/features/settings/SettingsRows.tsx`, new)
```ts
export interface SettingsRowsProps {
  /** Defaults to NOTIFICATIONS_BUILT (@/config/features). Tests pass it. */
  notificationsBuilt?: boolean;
  /** Defaults to SUPPORT_EMAIL, PRIVACY_URL, TERMS_URL (@/config/links). Tests pass them. */
  links?: { support: string | null; privacy: string | null; terms: string | null };
}
export function SettingsRows(props?: SettingsRowsProps): JSX.Element
```
- Reads: `usePlan()` (`@/features/settings/usePlan`), `usePaywallOn()`, `loadAppearance(store)` on mount (`@/data/db` `store`), `appVersion()` / `versionLine()` (`@/features/settings/plan`).
- Root: a `View` `testID="you-rows"` with the Settings page's section spacing (`gap: space.xxl`), then, in this order (a section with no rows renders nothing, via `Section`):
  1. `<AccountSection />` from `@/features/account/AccountRows`, unchanged (it shows only while `useAccountsOn() || settingsAccountOn()`; label `Account`).
  2. Section (no label), wrapper `you-section-main`:
     - `notifications`: only when `notificationsBuilt`. `LinkRow` title `Notifications`, chevron, `testID="you-row-notifications"`, press → `router.push('/you/notifications')`.
     - `appearance`: `PickerRow` title `Appearance`, value = the loaded choice (default `system`), options `System` / `Light` / `Dark` (`APPEARANCE_OPTIONS` as on the Settings page), `testID="you-row-appearance"`. Pick → the shown value changes at once and `saveAppearance(store, choice)` (writes `KV.appearance`, applies it on iOS).
     - `plan`: `LinkRow` title `Plan & usage`, value `planShortName(plan)` (`Free plan` / `Kitted beta` / `Kitted Pro` / `Pro trial`), chevron, `testID="you-row-plan"`, press → `router.push('/you/plan')`.
  3. Section (no label), wrapper `you-section-privacy`: `privacy`: `LinkRow` title `Privacy & data`, chevron, `testID="you-row-privacy"`, press → `router.push('/you/privacy')`.
  4. Section label `Subscription`, wrapper `you-section-subscription`, only while `usePaywallOn()`:
     - `manage`: `LinkRow` `Manage subscription`, hint `Opens your subscriptions in the App Store`, `testID="you-row-manage"`, press → `openManageSubscription()` (`@/features/settings/actions`).
     - `restore`: `LinkRow` `Restore purchases`, `chevron={false}`, `testID="you-row-restore"`, press → `showToast(restoreToast(await restorePurchases(isProNow)))`.
  5. Section label `Help & about`, wrapper `you-section-help`:
     - `report`: only when `links.support`. `Report a wrong score`, hint `Opens Mail`, `testID="you-row-report"`, press → `openLink(mailtoUrl(support, 'A wrong score (Kitted {version})'))` (key `settings.report.subject`, version from `appVersion()`).
     - `support`: only when `links.support`. `Contact support`, hint `Opens Mail`, `testID="you-row-support"`, press → `openLink(mailtoUrl(support, 'Kitted {version} ({build})'))` (key `settings.support.subject`).
     - `privacyPolicy`: only when `links.privacy`. `Privacy policy`, hint `Opens the page in Safari`, `testID="you-row-privacy-policy"`, press → `openLink(privacy)`.
     - `terms`: only when `links.terms`. `Terms of use`, hint `Opens the page in Safari`, `testID="you-row-terms"`, press → `openLink(terms)`.
     - `acknowledgements`: always. `Acknowledgements`, chevron, `testID="you-row-acknowledgements"`, press → `router.push('/you/acknowledgements')`.
     - **No `Show me around` row in T34** (Open question T-1; T35 adds it first in this section).
  6. The version line: `View testID="you-version"` around `KText` footnote, ink3, tabular, centred: `versionLine(appVersion())` = `Kitted {version} ({build}) · Scoring v{n}`.
- The section "wrapper" testIDs sit on a plain `View` around each `Section` (rendered only when the section has rows).
- VoiceOver (unchanged from `LinkRow` / `PickerRow`): a `LinkRow` is one button labelled `{title}` or, with a value, `{title}, {value}` (`settings.a11y.value`), with its hint; the Appearance pill is a button labelled `Appearance, {System|Light|Dark}`; section labels are headers read in sentence case (`Help & about`, `Subscription`, `Account`), drawn in spaced capitals at normal sizes.

### `SettingsList.tsx`
- `LinkRow({ …, testID?: string })`: the `testID` goes on its `Pressable`.
- `PickerRow({ …, testID?: string })`: the `testID` goes on its outer `View`.

### Navigation (`_layout.tsx`)
- The You stack's `index` has no `headerRight` (no gear, no button). Screens: `index`, `profile`, `knows`, `plan`, `notifications`, `acknowledgements`, `privacy` (titles unchanged). No `settings` screen; the file `you/settings.tsx` does not exist.
- Pages pushed from You (Plan & usage, Notifications, Privacy & data, Acknowledgements) show the system back button titled `You` (iOS takes it from the index's title; seen on the Simulator Nov 9: `< You` over Plan & usage).

### Incoming links (`+native-intent.tsx`)
- `redirectSystemPath({ path: 'kitted://you/settings', initial })` → `'/you?at=settings'`; the same for `/you/settings`, `/you/settings/` and either with a query (the query is dropped). Every other path as today (`/closet` → `/closet`, demo links unchanged).

### Demo screens (`app/src/demo/scenarios.ts`)
All `scenario: 'full'`, `onboarded: true`, `now: '2026-10-22T12:22:00'`, no `under`.
- `17` You (existing, unchanged): free, top of You; now without the gear.
- `84` `You · settings rows` (id `Y1`, was "Settings"): `href: '/you?at=settings'`; free (`Plan & usage` reads `Free plan`).
- `141` `You · Account, signed out` (id `Y1`): `/you?at=settings`, `accounts: { script: 'ok' }`.
- `142` `You · Account, signed in` (id `Y1`): `/you?at=settings`, `accounts: { script: 'ok', signedIn: 'apple' }`.
- `257` Beta · You (existing, unchanged): top of You on beta.
- `258` `Beta · You, settings rows` (id `Y1`, was "Beta · Settings"): `/you?at=settings`, `tier: 'beta'`.
- `270` `You · Pro, settings rows` (new, id `Y1`): `/you?at=settings`, Pro bought and the paywall on (`finish: { paywall: 'ok', pro: true }`, as screen 157 does; if `finish` doesn't apply on a `full` screen, the implementer uses the same two calls, `setDemoPaywall('ok')` and `demoEntitlements.setPro(true)`, through a scenario field and says so in REPORT.md). `Plan & usage` reads `Kitted Pro`; the Subscription section shows.
- `271` `You · Pro` (new, id `Y1`): `/you`, the same Pro and paywall set-up: the Pro row under the style card.

### Strings
No new keys. Used as they are: `tab.you` `You`, `you.style.label` `Your style`, `common.edit` `Edit`, `you.knows` `What Kit knows`, `you.seeAll` `See all {n}`, `you.facts.empty` `I'll add what I learn here.`, `settings.notifications` `Notifications`, `settings.appearance` `Appearance`, `appearance.system|light|dark` `System` / `Light` / `Dark`, `settings.plan` `Plan & usage`, `you.plan.free|beta|pro|trial`, `settings.privacy` `Privacy & data`, `settings.subscription` `Subscription`, `settings.manage` `Manage subscription`, `settings.restore` `Restore purchases`, `settings.helpAbout` `Help & about`, `settings.report` `Report a wrong score`, `settings.support` `Contact support`, `common.privacyPolicy` `Privacy policy`, `common.termsOfUse` `Terms of use`, `settings.acknowledgements` `Acknowledgements`, `settings.versionLine`, the hints `settings.a11y.*`, the restore toasts `settings.restore.done|none|failed`. `settings.title` (`Settings`) is no longer shown anywhere; it stays in the generated deck.

## Data
None. Appearance stays in `KV.appearance` (`system` | `light` | `dark`, default `system`). No migration.

## Steps
1. `SettingsList.tsx`: the optional `testID` on `LinkRow` and `PickerRow`.
2. `SettingsRows.tsx`: move the body of `settings.tsx` here, regrouped as above (Appearance joins Notifications and Plan & usage; Privacy & data gets its own card), plus the version line and the testIDs; the `notificationsBuilt` / `links` props with their defaults.
3. `you/index.tsx`: remove `PrivacyRow`; add the block wrappers, `<SettingsRows />` after Today, and the `at=settings` scroll (a `ref` on the ScrollView, `onLayout` on the rows block). Keep the ScrollView the first view.
4. `_layout.tsx`: remove the gear and the `settings` screen. Delete `you/settings.tsx`.
5. `+native-intent.tsx`: the `/you/settings` rule.
6. `scenarios.ts`: repoint 84, 141, 142, 258; add 270 and 271.
7. Check each demo screen on the Simulator (17, 84, 141, 142, 257, 258, 270, 271, then 85, 87 and acknowledgements reached from You), light, dark and the largest text size (`xcrun simctl ui 111D0A09-C2CA-4F72-BF3C-44019A05C89D content_size accessibility-extra-extra-extra-large`, reset to `large` after).
8. `npm run check` in `app/` (on its own), then the flows (`T34-you-settings-home.yaml`, `T14-beta-limits.yaml`, `smoke.yaml`).

## Must not break
- Plan & usage, Notifications (`/you/notifications`, the beta-notifications session's screen, untouched), Privacy & data and Acknowledgements open and work as before; their own tests (`settingsPrefs`, `betaLimits` FP7.6–FP7.7, `privacyWipe`) unchanged.
- The beta's Plan row value `Kitted beta` (FP7.7) and "nothing to buy" on beta: no Subscription section while the tier is `beta` (paywall off).
- Notifications row hidden while `NOTIFICATIONS_BUILT` is false; mail and web rows hidden while their address is null; account rows hidden while accounts are off (as on the Settings page, 09 §20.7 R5, #323: hidden, not dead).
- Sign-in from the Account row (`/sheets/sign-in?from=settings`) closes back onto You.
- `serverProxy.test.ts` A10 (reads `usage.purchased ? <PlanRow />` in `you/index.tsx`).
- youTonight YT1, YT3–YT7 (YT7 walks every file in `app/(tabs)/you/` for the small card corner: `SettingsRows.tsx` is in `features/settings/`, so it uses `radius.cardSmall` only through `Section`).
- `scenarios.test.ts` (numbers unique and ascending: 270 and 271 go after 259).
- The iOS 26 tab bar shrinks on scroll on You (ScrollView first).
- Existing checks that change **on purpose** (the test writer does it and says why in REPORT.md; each tested the Settings page SY1 removes):
  - `youTonight.test.ts` YT2 ("still in Settings too"; reads `settings.tsx`): becomes SY1.4's check.
  - `releaseSafety.test.ts` R5 (reads `settings.tsx`): the same rule (Notifications only once built; Subscription only with the paywall) checked on `SettingsRows`.
  - `heightBuildRemoved.test.ts` line 91 (reads `settings.tsx` for units): reads `features/settings/SettingsRows.tsx` instead.
  - `app/e2e/flows/T14-beta-limits.yaml` (`tapOn: "Settings"`): scrolls You to `Plan & usage, Kitted beta` instead.

## Open questions
**Technical defaults (the coordinator logs them):**
- **T-1** · "Show me around" in T34: **not shown.** T34 has no behaviour for it (SY3 is T35), and the app's rule is hidden, not dead (09 §20.7 R5, #323): a row that does nothing is a defect. T35 adds it as the first row of Help & about with its behaviour, and extends SY1.2's order check to include it. Until then SY1.2 passes without it, and TESTING.md lists its position as not testable yet.
- **T-2** · Grouping of SY1 step 5: one card per spec bullet: [Notifications, Appearance, Plan & usage] · [Privacy & data] · `Subscription` [Manage, Restore] · `Help & about` [...], after the Account section. Matches DECISIONS-LOG #405's summary ("Notifications, Appearance, Plan & usage · Privacy & data · Help & about"). The Settings page had Privacy & data in the first card and Appearance alone; this regroups them. No heading over the rows (the spec gives none).
- **T-3** · The Pro row: SY1 says "the Pro row above it [Today], as today". Today it sits right under the style card, which is above Today; kept there (least change; serverProxy A10 also reads it). Only on a bought Pro, so never on the beta.
- **T-4** · The Settings route is deleted (SY1.1: "the Settings page no longer exists"); an incoming `kitted://you/settings` is rewritten to `/you?at=settings` in `+native-intent.tsx` (out of lane, one rule) instead of landing on "This isn't here anymore.". Inside the app the gear was the only link to it. If the coordinator refuses the out-of-lane edit, the rule drops and SY1.1's link check covers in-app links and demo screens only (REPORT.md says so).
- **T-5** · `/you?at=settings` lands on You scrolled to the rows: the demo screens need it (a screenshot can't scroll), and an old Settings link lands where Settings' rows now are. Not shown to him anywhere as words.
- **T-6** · `app/src/demo/scenarios.ts` is outside the lane (as in T14): four hrefs repointed and two new screens (270, 271), from a new block above 259 (no branch uses 260+ today).
- **T-7** · Section spacing: inside the rows block, the Settings page's `space.xxl` between sections; the block follows Today at You's own `space.stack` gap, and the version line keeps the Settings page's bottom room (`space.xxxl` padding at the end of the ScrollView).

**For the founder:** none blocking. Every word on these screens already exists and was approved with the Settings page; T34 only moves them.
