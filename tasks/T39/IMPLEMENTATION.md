# T39 · Setup as plain screens, About you, and Kit's first-check offer

**From:** `plan.md` → T39 · **Spec:** `specs/onboarding-screens.md` → OS3 (OS3.1–OS3.3), OS4 (OS4.1–OS4.7), OS5 (OS5.1–OS5.7), approved 2026-11-09; `specs.md` → F1.1–F1.3; `specs/setup-and-you.md` → SY4.1, SY4.2, SY4.4 (read from `origin/main`, approved 2026-11-09, SY4 changed with his yes the same day) · **Design:** `tasks/T39/DESIGN.md`, the **working layout only** (DECISIONS-LOG #422): its states, flow and VoiceOver order hold; every word comes from the approved specs or is already in the app; the agreement on the camera keeps today's camera words · **Lane:** Setup and You (`app/src/features/{onboarding,you}`, `app/src/app/onboarding/`, the Style profile screen, `data/types.ts`, `data/tables.ts`, `en.ts`, `app/e2e/flows/`)

## Goal
After Welcome, setup is two plain screens (Looks, About you: an optional first name and five age choices, nothing picked), with no chat bubbles and no agreement step; Continue lands him in Stylist, where Kit's first message is followed by "Want to check a fit now?" (`Check my fit` / `Later`), and the camera opens only when he taps. Style profile shows his `Name` (editable) and his `Age` band.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.

**In the lane**
- `app/src/features/onboarding/aboutStep.ts` (**new**, pure apart from the store calls): the age choices, their words, the name rule, the About you draft, the band from a birth year, and `finishSetup` (the end of setup). Named `aboutStep.ts`, not `aboutYou.ts`: `features/aboutYou/` is a different feature (Kit's "About you" card after the first score).
- `app/src/features/onboarding/firstCheckOffer.ts` (**new**): posting the offer card, the rule for its buttons, `Later`, and the "Turn on fit checks" post after `Not now` on the agreement.
- `app/src/features/onboarding/FirstCheckOfferCard.tsx` (**new**): the card.
- `app/src/features/onboarding/ChoiceList.tsx` (**new**): the single-choice list with checkmarks (DESIGN.md "New parts"). It lives here, not in `design-system/` (outside the lane); technical default 1.
- `app/src/features/onboarding/BasicsScreen.tsx`: becomes About you (and Restore's "Welcome back"): title, name field, age list, footnote, hint, Continue; no bubbles, no birth-year card or sheet.
- `app/src/features/onboarding/PickLooksScreen.tsx`: Kit's bubble becomes the large title and the line under it. Nothing else changes.
- `app/src/features/onboarding/OnboardingNav.tsx`: 3 segments; testIDs.
- `app/src/features/onboarding/resume.ts`: `ONBOARDING_STEPS = 3`; steps `looks`, `basics`; an old `consent` step reads as `basics`.
- `app/src/features/onboarding/ConsentScreen.tsx`: the `onboarding` mode goes; the intro is plain text (camera and sheet modes); in camera mode `Not now` and the X call `declineAgreement` before closing. The camera mode's words stay today's (`onb.consent.introLater`, `onb.consent.agreeLater`, no `See an example first`).
- `app/src/features/onboarding/basics.ts`: `loadDraft` also returns the About you draft. The echo helpers (`looksEcho`, `looksReply`, `basicsEcho`) stay, unused (technical default 10).
- `app/src/features/onboarding/complete.ts` (**shared with the you-and-first-run session**, which owns Kit's hello on the `aiNote` line): only `OnboardingAnswers` (a `'later'` consent value and two optional fields) and the profile row `completeOnboarding` and `giveConsent` write. The `aiNote` line (today line 30) and the `turnOnChecks` line are not touched.
- `app/src/app/onboarding/consent.tsx`: a `<Redirect href="/onboarding/basics" />` (an old link or resume never shows the old step).
- `app/src/features/you/profile.ts`: the draft gains `name`; the Age value helper.
- `app/src/app/(tabs)/you/profile.tsx` (the Style profile screen; the plan line's "you/ (Style profile)"): the `Name` row, the `Age` row, the new footnote.
- `app/src/data/types.ts` (shared): `AgeBand`; `'firstCheckOffer'` in `CardType`; three optional `ProfileRow` fields.
- `app/src/data/tables.ts`: the three profile fields in `profileSpec`.
- `app/src/i18n/en.ts` (shared): the new keys in `addedInBuild` (see Data → Words).
- `app/e2e/flows/T39-*.yaml` (**new**, five flows; see TESTING.md).

**Outside the lane, needed (each in Open questions → technical defaults)**
- `app/src/data/migrations.ts`: V9 adds the three profile columns (default 4).
- `app/src/sync/schema.ts` (Sign-in and backup lane): the three profile fields never sync; the two new kv keys are local (default 5).
- `app/src/features/stylist/MessageView.tsx` (one line, the chat's card switch, named by the spec's Touches) (default 6).
- `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts` (unowned; T34 also adds rows): screen 4 retitled, screens 280–284 added (default 7).

**Not touched:** `features/account/RestoreScreen.tsx` (default 8), `features/onboarding/{WelcomeScreen,ExampleCheckScreen,welcomeExample,exampleCheck,DrawnOutfit,outfitDrawing,useWelcomeSwap}` (T38), `AgeStopScreen.tsx`, `NoConsentCard.tsx`, `BirthYearSheet.tsx` and `app/sheets/birth-year.tsx` (left unreachable, default 9), `features/stylist/thread.ts`, `app/camera.tsx`, `design-system/*`, `en.generated.ts`, `@kitted/core`.

## Interfaces
What the tests call. The test writer reads only this section.

### `data/types.ts`
```ts
export type AgeBand = '18-21' | '22-25' | '26-30' | '31+';
export type CardType = /* today's */ | 'firstCheckOffer';
export interface ProfileRow {
  // …today's fields, unchanged…
  /** OS4: his band from About you; phone only, never synced. Absent or null on older profiles. */
  ageBand?: AgeBand | null;
  /** When About you saved it (epoch ms). */
  ageBandAt?: number | null;
  /** SY4: his first name, trimmed, at most 30 characters; null = none. Never in a request; never synced. */
  name?: string | null;
}
```

### `features/onboarding/aboutStep.ts`
```ts
export type AgeChoice = 'under18' | AgeBand;
/** In the order shown. */
export const AGE_CHOICES: readonly AgeChoice[]; // ['under18', '18-21', '22-25', '26-30', '31+']
export function isAgeBand(x: unknown): x is AgeBand;
/** "Under 18" · "18–21" · "22–25" · "26–30" · "31 or older" (en dashes). */
export function ageChoiceLabel(c: AgeChoice): string;
/** VoiceOver's label for a choice. Today it equals ageChoiceLabel (founder question 1). */
export function ageChoiceSpoken(c: AgeChoice): string;
/** testID of a row: 'age-under18' · 'age-18-21' · 'age-22-25' · 'age-26-30' · 'age-31plus'. */
export function ageChoiceTestID(c: AgeChoice): string;

/** SY4.2: trimmed; at most 30 characters (code points, Array.from), cut then trimmed again; blank or spaces → null. */
export const NAME_MAX = 30;
export function cleanName(raw: string | null | undefined): string | null;

/** The About you draft, kv `onboarding.about` (local, never synced): his pick and the field's text as typed. */
export const ABOUT_KEY = 'onboarding.about';
export interface AboutDraft { age: AgeChoice | null; name: string }
export const EMPTY_ABOUT: AboutDraft; // { age: null, name: '' }
export function parseAbout(raw: string | null): AboutDraft;           // bad JSON or an unknown age → that field empty
export function saveAbout(store: Pick<KittedStore, 'setKv'>, d: AboutDraft): Promise<void>;

/** An older profile's band: age = currentYear − birthYear (the same rule as isUnderAge); under 18 → 'under18'. */
export function bandFromBirthYear(birthYear: number, currentYear: number): AgeChoice;
/** What Style profile shows: p.ageBand, else the band from p.birthYear, else null ("Not set"). Never 'under18' (→ null). */
export function profileAgeBand(p: Pick<ProfileRow, 'ageBand' | 'birthYear'>, currentYear: number): AgeBand | null;

/**
 * About you's Continue with an 18+ band (not restore). In order: completeOnboarding with
 * { styles: picksToStyles(looks draft), fitPreference: older basics draft's fit ?? '', birthYear: null,
 *   ageBand, name: cleanName(draft.name), consent: 'later' };
 * then postFirstCheckOffer; then deletes kv onboarding.looks, onboarding.basics, onboarding.about and the resume step.
 * Keeps onboarding.otherStyle (as today). Rejects (throws, writes nothing) when the draft's age is null or 'under18'.
 * Sends nothing. The screen then calls setOnboarded(true) and router.replace('/').
 */
export function finishSetup(store: KittedStore, nowMs: number, ids: (prefix: string) => string): Promise<void>;
```

### `features/onboarding/complete.ts` (only these lines change)
```ts
export interface OnboardingAnswers {
  styles: Styles; fitPreference: string; birthYear: number | null;
  ageBand?: AgeBand | null;   // saved as ageBand, with ageBandAt = nowMs when given; else both null
  name?: string | null;       // saved as given (callers pass cleanName's result); else null
  /** true / undefined: agreed (as today). false: "Not now" (as today: no consent, posts "Turn on fit checks").
   *  'later' (new, setup's end): no consent saved, and no "Turn on fit checks" card. */
  consent?: boolean | 'later';
}
```
`completeOnboarding` still posts the one `aiNote` message at `nowMs` (the you-and-first-run session replaces it with Kit's hello). `giveConsent`'s blank profile writes `ageBand: null, ageBandAt: null, name: null`. `hasConsent` unchanged.

### `features/onboarding/firstCheckOffer.ts`
```ts
/** kv: when he tapped Later (String(epoch ms)). Read by the notifications spec (NT1.8); "Delete all my data" clears it (the wipe drops all kv). */
export const OFFER_LATER_KEY = 'firstCheckOffer.laterAt';
/** Posts Kit's offer: { role 'stylist', kind 'card', cardType 'firstCheckOffer', text null, chips [], payload {} },
 *  createdAt = max(nowMs, the newest chat message's createdAt) + 1, so it is always under Kit's first message. */
export function postFirstCheckOffer(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<ChatMessage>;
export interface OfferState { laterAt: number | null; hasScoredCheck: boolean; declined: boolean }
/** hasScoredCheck: any fitChecks row with status 'scored' (a re-check counts; 'failed', 'held', 'unreadable',
 *  'notClothed', 'scoring', 'asking' don't). declined: a 'turnOnChecks' message created after the offer card. */
export function loadOfferState(store: KittedStore): Promise<OfferState>;
/** Buttons show only when all three are clear. */
export function offerButtonsShow(s: OfferState): boolean;
/** Later: once only. Saves OFFER_LATER_KEY = String(nowMs) and posts Kit's line (role 'stylist', kind 'text',
 *  text "No rush. Tap the camera button whenever you're ready.") at max(nowMs, newest) + 1. A second call does nothing. */
export function tapLater(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<void>;
/** Not now (or the X) on the agreement in the camera: when an offer card exists and no 'turnOnChecks' message does,
 *  posts today's "Turn on fit checks" message exactly as completeOnboarding({consent:false}) does
 *  ({ ...textMessage(id, at, 'stylist', t('noConsent.greeting')), kind: 'card', cardType: 'turnOnChecks' }), at
 *  max(nowMs, newest) + 1. Otherwise does nothing. Saves no consent, sends nothing. */
export function declineAgreement(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<void>;
```

### `FirstCheckOfferCard({ m, readOnly }: { m: ChatMessage; readOnly?: boolean })`
- Rendered by `MessageView`'s card switch: `if (m.cardType === 'firstCheckOffer') return <FirstCheckOfferCard m={m} readOnly={readOnly} />;`
- Reads `loadOfferState` live (`useLive(['fitChecks', 'chat', 'kv'], …)`). Buttons show only when loaded, `offerButtonsShow` is true and `readOnly` is false.
- testIDs: `offer-card` (the card), `offer-text` (one VoiceOver element, `accessible`, label "Want to check a fit now? Stand back so your shoes are in the shot. Not dressed for it? Later works.", no header role), `offer-title`, `offer-body` (the two texts inside it), `offer-buttons` (a View around both buttons; absent when they're gone).
- `Check my fit`: `KButton` primary, `size="regular"`, `fullWidth`, icon camera, `accessibilityLabel` "Check my fit. Opens the camera." → `router.push('/camera')`.
- `Later`: `KButton` secondary, regular, full width → `tapLater(store, sessionClock.nowMs(), newId)`.

### `ChoiceList<T extends string>`
```ts
export interface Choice<T extends string> { value: T; label: string; spoken: string; testID: string }
export function ChoiceList<T extends string>(p: {
  label: string;                // the radiogroup's accessibilityLabel ("How old are you?")
  choices: readonly Choice<T>[];
  value: T | null;              // null: nothing picked
  onChange: (v: T) => void;     // also Haptics.selectionAsync() and Keyboard.dismiss()
  testID?: string;              // the list
}): JSX.Element;
```
Each row: a `Pressable` with `testID` = `choice.testID`, `accessibilityRole="radio"`, `accessibilityLabel` = `choice.spoken`, `accessibilityState={{ selected }}`, `minHeight` 52, label `body`, weight `'600'` when picked else `'400'`, a checkmark (testID `${choice.testID}-check`) only on the picked row, pressed fill `surface2`. The list: `accessibilityRole="radiogroup"`, `accessibilityLabel` = `label`. Rows differ only in the picked one's weight and checkmark.

### `BasicsScreen` (no props; route `/onboarding/basics`; `?restore=<fits>,<pieces>,<chats>` = Restore)
- On open: reads `onboarding.about` (his pick and name kept after a close).
- testIDs: `about-title` (largeTitle, header: "About you"; Restore: "Welcome back"), `restore-line` (Restore only: "Your age first, then I'll bring back your fits."), `about-name-label` ("What should Kit call you?", hidden from VoiceOver), `about-name-input` (TextInput; not on Restore), `about-age-label` ("How old are you?", its own element, `accessibilityRole="header"`), `about-age-list` (the ChoiceList), rows `age-under18` … `age-31plus`, `about-footnote`, `about-hint` (only while nothing is picked; hidden from VoiceOver), `about-continue` (a View wrapping the Continue `KButton`).
- Name field props: `placeholder` "First name (optional)", `accessibilityLabel` "What should Kit call you?", `maxLength` 30, `autoCapitalize="words"`, `autoComplete="given-name"`, `textContentType="givenName"`, `autoCorrect={false}`, `returnKeyType="done"`, `clearButtonMode="while-editing"`, `maxFontSizeMultiplier` = `CONTROL_TEXT_MAX_SCALE`. Each change writes the draft (`saveAbout`).
- A pick writes the draft at once.
- Continue: `KButton` "Continue", `disabled` while nothing is picked, `accessibilityHint` "Pick your age to go on." while disabled (none once picked).
  - 18+ band, setup: `finishSetup(store, sessionClock.nowMs(), newId)` → `setOnboarded(true)` → `router.replace('/')`. Never `router.push('/camera')`; no timer opens it.
  - 18+ band, Restore: `router.replace({ pathname: '/onboarding/restore', params: { fits, pieces, chats } })` (as today).
  - `under18`: `Alert.alert('Under 18?', 'Kitted is for ages 18 and up.', [{ text: 'Change', style: 'cancel' }, { text: "That's right", style: 'destructive', onPress }])`, once per tap. `Change`: nothing (pick, draft, gate, route unchanged). `That's right`: `setAgeBlocked(true)` → `router.replace('/')` (the gate shows today's stop screen).
- Back: as today (Looks; Restore → Welcome). Progress: `OnboardingNav step={3}` (Restore: no bar).
- Root: `KeyboardAvoidingView behavior="padding"`; the ScrollView has `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`.

### `PickLooksScreen` (no props)
- testIDs: `looks-title` (largeTitle, header: "Which of these would you actually wear?"), `looks-line` ("Tap up to 3."). No `StylistMessage`. Everything else as today.

### `OnboardingNav({ step, onBack })` (props unchanged)
- `ONBOARDING_STEPS` = 3. testIDs `onb-progress` (the bar, label "Step {step} of 3"), `onb-progress-seg-0` … `-2`.

### `resume.ts`
- `type ResumeStep = 'looks' | 'basics'`; `parseStep('consent')` → `'basics'`; `parseStep('1')` → `'looks'` (as today); `resumeHref('basics')` → `'/onboarding/basics'`.

### `ConsentScreen({ mode, after, onAgreed })`
- `mode: 'sheet' | 'camera'` (`'onboarding'` removed). The intro is `KText` `body` `ink` with testID `consent-intro` (no `StylistMessage`, no "Kit" mark), words unchanged: "Before I score a photo, here's what happens to it." The camera button stays "Agree"; `Not now` unchanged.
- Camera mode, `Not now` or the X: `await declineAgreement(store, now, newId)`, then `router.back()`. `Agree`: as today (`giveConsent`, then `onAgreed`).

### `features/you/profile.ts`
```ts
export interface ProfileDraft { fit: FitPref | null; picks: StyleKey[]; budget: Budget | null; name: string }
// draftOf: name = p.name ?? ''. isDirty: also cleanName(d.name) !== (p.name ?? null).
// applyDraft: name = cleanName(d.name) when it changed, else p.name ?? null. ageBand, ageBandAt, birthYear never change here.
export function ageRowValue(p: Pick<ProfileRow, 'ageBand' | 'birthYear'>, currentYear: number): { shown: string; spoken: string };
// shown: ageChoiceLabel(band) or "Not set"; spoken: "Age, " + ageChoiceSpoken(band) or "Age, Not set".
```

### Style profile screen (`app/(tabs)/you/profile.tsx`)
- Basics card, in order: `Name` row (testID `profile-name-row`; a `TextInput` testID `profile-name-input`, `accessibilityLabel` "Name", placeholder "First name (optional)", the About you field's input settings, right-aligned, `ink`; a tap anywhere on the row focuses it), Fit you like (unchanged), `Age` row (testID `profile-age-row`, one VoiceOver element "Age, {spoken band}", value testID `profile-age-value`).
- Footnote under the card: "Age can't be changed here." (testID `profile-basics-note`).
- Saving: as today (Done, Back, a swipe: `saveDraft`).

### Demo screens
- `2` Pick looks (existing): Looks, plain.
- `3` About you (existing, renamed from "Basics"): on open, nothing picked.
- `4` **About you · ready** (was "Consent"; still not onboarded, so the "before onboarding" list stays 1–4, 130–137): `/onboarding/basics` with the draft `{ age: '22-25', name: 'Alex' }`.
- `136` Basics · welcome back (existing): Restore.
- `280` **Stylist · Kit's offer** (new): firstRun, set up through `finishSetup` with looks `['smart_casual', 'workwear']`, no agreement.
- `281` **Stylist · after Later** (new): as 280, then `tapLater`.
- `282` **Stylist · after Not now** (new): as 280, then `declineAgreement`.
- `283` **Stylist · after a scored check** (new): as 280, then the agreement and one scored check (the first-check story screens 150–162 use).
- `284` **Style profile · Name and Age** (new): full, `/you/profile` under `/you`, profile `name: 'Alex'`, `ageBand: '22-25'`.
- `80` Style profile (existing): an older profile (birth year 2005, no band; the demo clock is 2026) → Age "18–21".
- `12` Stylist home and `212` Turn on fit checks (existing): set up before this change → no offer card.
- New scenario fields: `about?: AboutDraft`, `offer?: 'open' | 'later' | 'notNow' | 'checked'`, `profilePatch?: Partial<Pick<ProfileRow, 'name' | 'ageBand' | 'ageBandAt'>>`.
- **Demo screens skip the agreement** on the camera (`app/camera.tsx` opens the camera at once for any demo screen), so `Check my fit` on 280 opens the camera directly; the agreement on the camera is reached only by a fresh install (the flows start from a cleared app).

## Data
- **Profile** (SQLite, migration V9): `age_band TEXT`, `age_band_at INTEGER`, `name TEXT`, all nullable, no default; existing rows get NULL. `birth_year` stays; an older install keeps it. New setups write `birthYear: null`.
- **Sync:** `profile.omit` gains `ageBand: null, ageBandAt: null, name: null` (never sent; a pulled row keeps this phone's values). `onboarding.about` and `firstCheckOffer.laterAt` join `KV_LOCAL`. `onboarding.basics`' outgoing rule is unchanged.
- **kv:** `onboarding.about` (the draft; deleted at setup's end) and `firstCheckOffer.laterAt` (kept; the wipe clears it).
- **Chat:** the offer card (`cardType: 'firstCheckOffer'`), Kit's Later line (plain stylist text), and, after `Not now` on the camera's agreement, today's `turnOnChecks` card once.
- **Resume:** `onboarding.step` = `consent` (an install closed on the old agreement step) reopens on About you.
- **Words** (new keys in `en.ts` `addedInBuild`; values exact):
  - `onb.looks.title` "Which of these would you actually wear?" · `onb.looks.line` "Tap up to 3."
  - `onb.about.title` "About you" · `onb.about.nameLabel` "What should Kit call you?" · `onb.about.namePlaceholder` "First name (optional)" · `onb.about.ageLabel` "How old are you?"
  - `onb.about.age.under18` "Under 18" · `onb.about.age.18to21` "18–21" · `onb.about.age.22to25` "22–25" · `onb.about.age.26to30` "26–30" · `onb.about.age.31plus` "31 or older"
  - `onb.about.footnote` "Stays on your phone. It never changes your score." · `onb.about.hint` "Pick your age to go on."
  - `onb.about.under18.title` "Under 18?" (body: the existing `onb.age.title`; buttons: the existing `onb.age.confirm.change`, `onb.age.confirm.yes`)
  - `onb.restore.title` "Welcome back" · `onb.restore.line` "Your age first, then I'll bring back your fits."
  - `offer.title` "Want to check a fit now?" · `offer.body` "Stand back so your shoes are in the shot. Not dressed for it? Later works." · `offer.later` "Later" · `offer.laterLine` "No rush. Tap the camera button whenever you're ready." (`Check my fit` reuses `composer.check`; its VoiceOver `composer.a11y.camera`.)
  - `profile.name` "Name" · `profile.age` "Age" · `profile.ageNote` "Age can't be changed here."
  - Kept unchanged (old tests read them): `onb.basics.never`, `onb.basics.yearHint`, `onb.age.confirm.title`, `acct.restore.basics`, `profile.birthYearNote`, `onb.looks.prompt`.

## Steps
1. `data/types.ts`, `data/tables.ts`, `data/migrations.ts` (V9), `sync/schema.ts`: the fields, the column migration, never synced, the kv keys local.
2. `aboutStep.ts` and `en.ts` words.
3. `complete.ts`: `'later'` and the two fields (leave the `aiNote` and `turnOnChecks` lines as they are).
4. `firstCheckOffer.ts`, `FirstCheckOfferCard.tsx`, the one `MessageView` line.
5. `ChoiceList.tsx`; `BasicsScreen.tsx` as About you and Restore; `OnboardingNav`/`resume.ts` to 3 steps; `PickLooksScreen` title; `app/onboarding/consent.tsx` redirect.
6. `ConsentScreen.tsx`: drop the onboarding mode, plain-text intro, `declineAgreement` on Not now / X.
7. Style profile: `profile.ts` draft and Age value; the screen's Name and Age rows and footnote.
8. Demo screens 3, 4, 280–284.
9. The flows (the test writer writes them; the implementer makes them pass).

## Must not break
- `completeOnboarding` with `consent: true` / `false` / undefined behaves exactly as today (`stepFourBatch.test.ts`, `onboardingFlow.test.ts` consent tests); RestoreScreen compiles and works unchanged.
- The `aiNote` message is posted once, first, by `completeOnboarding` (until the other session's hello replaces it); T39 posts nothing above it.
- Looks: tiles, `Something else?`, `Not sure`, the 4th-tap buzz and "Up to 3.", `Continue · {n} of 3` (`onboardingLooks.test.ts`).
- Welcome and the Example check (T38's locked tests).
- The age stop and its Keychain flag, kept through "Delete all my data" (`privacyWipe.test.ts`).
- The camera's agreement: `Agree` saves consent and turns the camera live in place; the sheet mode and its held-photo resume (`resumeAfterConsent` / `dropAfterConsent`).
- "Turn on fit checks" (`NoConsentCard`, demo 212) unchanged.
- Sync: every kv key classified, `birthYear`/height/build never sent (`syncSchema.test.ts`, HB11); migrations run in order (`migrations.test.ts`).
- Style profile: leaving saves, Done saves, a 4th look buzzes (`profileLeave.test.ts`, `youTab.test.ts`).
- Demo screens: 1–38 contiguous, sorted, unique; the not-onboarded list stays `[1, 2, 3, 4, 130…137]` (`scenarios.test.ts`).
- **Superseded tests** (they pin the removed birth-year step by reading source text): `birthYearStep.test.ts` BY1, BY2, BY3; `onboardingAccount.test.ts` "the bar has a segment per step and fills on Consent (step 4)"; `youTonight.test.ts` YT6 "the birth-year row reads…"; `heightBuildRemoved.test.ts` HB3's last line (`profile.tsx` matches `onb.basics.birthYear`). The test writer replaces each with its T39 behaviour test and names it in REPORT.md; nothing else in those files changes.

## Open questions
**For the founder** (each has a default the build uses meanwhile):
1. **What VoiceOver says for the age choices.** The design proposed "18 to 21" etc.; those words aren't in the approved spec. · default: VoiceOver reads the visible words ("18–21"; iOS usually says "18 to 21" for an en-dash range anyway). · decides: the founder (words).
2. **Does his name come back on a new phone?** SY4 says the name is "never in any request to the server", so the default leaves it out of backup, like his age; signing in with Apple refills an empty one (F1.4, T41). · default: not backed up. · decides: the founder (privacy wording).
3. **The agreement's words on the camera.** SY5 names `Agree & check my fit` and `See an example first`; DECISIONS-LOG #422 keeps today's camera words ("Before I score a photo, here's what happens to it.", `Agree`, no example link). SY5 isn't on T39's plan line (T33). · default: #422 (today's camera words). · decides: the founder.
4. **`Pick by name instead` on Looks.** The spec says it "stays as it is", but today's Looks doesn't show it. · default: Looks as today, no link. · decides: the founder.
5. **The offer card after the 4 am day change.** Stylist shows only today's chat, so if he taps nothing tonight, tomorrow the card is in Past chats (read-only, no buttons) and Stylist starts empty. The spec is silent. · default: the thread's existing day rule (no re-post). · decides: the founder (it may belong with the Later reminder in the notifications spec).

**Technical defaults** (the coordinator logs them):
1. `ChoiceList` lives in `features/onboarding/` (design-system is outside the lane); follow-up: move it to the design system.
2. About you's draft is a new local kv key, `onboarding.about`, written on each pick and each change of the name, so a close keeps both; it never syncs (unlike `onboarding.basics`).
3. The three `ProfileRow` fields are optional (`?: … | null`), so the seed loader, the demo, RestoreScreen and ~30 test fixtures need no edit; read them as `p.ageBand ?? null`.
4. Migration **V9** in `data/migrations.ts` (not on the plan line). No other branch has a V9 today; renumber before merge if one lands first.
5. `sync/schema.ts` (Sign-in and backup lane): `profile.omit` adds the three fields; `KV_LOCAL` adds the two keys. Without it the sync test fails and the age band would back up, against the spec. The open backup branch (#57, `backup-sync-au1`) edits the same file: additive lines, merge by hand.
6. The one `MessageView` line (stylist lane), as the spec's Touches name it. `thread.ts` needs no change: the card isn't a "stylist line", so it sits 12 below Kit's message and Kit's Later line gets its own "Kit" mark.
7. Demo: screen 4 is retitled "About you · ready" (its route is gone), and screens 280–284 are added (T34 holds 270–271). Three optional scenario fields.
8. `RestoreScreen` (account lane, unreachable while `ACCOUNTS_BUILT` is false) is not edited: a restore saves no age band yet (Style profile would show "Not set"). Follow-up for T41: pass `ageBand` from `loadDraft(store).about` and delete `onboarding.about`.
9. `BirthYearSheet` and `/sheets/birth-year` stay in place, unreachable; deleting the route file is outside the lane. Follow-up.
10. The echo helpers and their old strings stay, unused, so older passing tests keep passing; follow-up to delete them with their tests.
11. `Not now` (or the X) on the camera's agreement posts "Turn on fit checks" only for a new setup (an offer card exists) and only once (no `turnOnChecks` yet), so someone who later turns "Score my fits" off isn't handed a new card.
12. The plain-text intro applies to the agreement sheet as well as the camera (one component; OS3 says "the agreement").
13. `ageBandAt` is Continue's time in epoch ms ("the day he picked it", stored to the millisecond).
14. An old draft's birth year doesn't preselect a band (OS4: nothing picked) and isn't saved (new setups leave `birthYear` empty); an old draft's fit is still saved, as today.
15. The name's 30 counts code points (Array.from), cut then trimmed; the field's `maxLength` 30 stops typing earlier for emoji-heavy input, which is harmless.
16. The fresh-install flows clear the app's data and the Simulator's Keychain (`clearState`, `clearKeychain`); the under-18 flow ends by clearing them again so the Simulator isn't left on the stop screen.
