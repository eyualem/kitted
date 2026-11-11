# T38 · Welcome and the Example check, drawn in code

**From:** `plan.md` → T38 · **Spec:** `specs/onboarding-screens.md` → OS1 (OS1.1–OS1.4), OS2 (OS2.1–OS2.2), approved 2026-11-09 · **Design:** `tasks/T38/DESIGN.md` (approved 2026-11-09; the contract for layout, words and motion; its frames are `tasks/T38/design/`) · **Lane:** Setup and You (`app/src/features/onboarding/`)

## Goal
Welcome and the Example check show an outfit drawn by Closet's code from the bundled s14 reading instead of a stranger's photo, and Welcome's mini card plays the engine's top fix once: 7.5 "Put together" → 8.0 "Sharp", "Swap the chunky sneakers for low-profile sneakers".

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `app/src/features/onboarding/welcomeExample.ts`: the before and after states, the top fix, the swap timeline, the card's VoiceOver line, Welcome's layout rule (all pure).
- `app/src/features/onboarding/exampleCheck.ts`: drops `photoId`, carries the `reading`; scored exactly as today.
- `app/src/features/onboarding/outfitDrawing.ts` (**new**, pure): the pieces of a reading as drawings, their placements, the bubble's VoiceOver line. Named `outfitDrawing.ts`, not `drawnOutfit.ts`: the Mac's disk ignores case, and `drawnOutfit.ts` next to `DrawnOutfit.tsx` breaks imports (CLAUDE.md coding traps).
- `app/src/features/onboarding/DrawnOutfit.tsx` (**new**): the drawn-outfit view (the spec's "drawn-outfit view built on `flats.ts`"), and `DrawnOutfitBubble`.
- `app/src/features/onboarding/useWelcomeSwap.ts` (**new**): the hook that runs the swap's clock once per mount.
- `app/src/features/onboarding/WelcomeScreen.tsx`: the photo, its gradient and the forced status bar go; the drawing, the new card and the one-scroll-view layout come in.
- `app/src/features/onboarding/ExampleCheckScreen.tsx`: the photo bubble becomes `DrawnOutfitBubble`; testIDs.
- `app/src/i18n/en.ts` (shared): two new keys, one override, one changed value (see Data).
- `app/e2e/flows/T38-drawn-welcome.yaml` (**new**, outside the plan line's file list; see Open questions, technical default 11).
- The bundled reading: **no new file.** The plan line's "a bundled reading" is today's `app/assets/demo-readings/s14.json`, read through `demoReadingById('s14')` (DESIGN.md "The outfit": "the bundled `s14` reading as it is today"). It is not edited.

Not touched: `features/closet/*` (StandingOutfit, GarmentArt, artSpec, flats, itemName are imported, never edited), `design-system/*` (Numeral, PhotoBubble), `demo/*`, `en.generated.ts`, `handoff/02-screens.md`, `@kitted/core`.

## Interfaces
What the tests call. The test writer reads only this section.

### `welcomeExample.ts`
```ts
import type { Reading } from '@kitted/core';

/** The bundled reading Welcome and the Example check draw and score (was WELCOME_PHOTO; there is no photo now). */
export const WELCOME_READING = 's14';

export interface WelcomeExample {
  /** demoReadingById(WELCOME_READING), unchanged. */
  reading: Reading;
  /** applyPartsFix(reading, fix) — the top fix's edits on the reading. */
  afterReading: Reading;
  /** Before: overallFor(reading, scoreOptions({ occasion: 'everyday', styles: [], boldness: null })). Kept as `score`
   *  and `word` so #276's test still reads them. */
  score: number;
  word: string;            // scoreWordLabel(score)
  after: { score: number; word: string };   // overallFor(afterReading, same options); scoreWordLabel(after.score)
  /** exampleCheck().fixes[0]: the card's top fix for a first check with an empty closet. */
  fix: { copy: string; tag: string; to: number };
  /** The one drawn slot whose garment differs between reading and afterReading ('shoes' today). */
  swapSlot: DrawnSlot;
}
/** null when the reading is missing, it doesn't score, it has no fix, or the fix's edits can't be applied. Memoised:
 *  the same object every call. */
export function welcomeExample(): WelcomeExample | null;

/** The swap's timeline in ms at slow = 1 (DESIGN.md phone 2). */
export const SWAP_MS: {
  shoesFrom: 600; shoesTo: 1200;     // the after piece's opacity 0 → 1, ease-in-out (the before piece's 1 → 0)
  countFrom: 900;                    // the first tenth shows at countFrom + step
  landBy: 1500;                      // the count is on the after score by here
  textFrom: 1500; textTo: 1700;      // word and detail line cross-fade, 200 ms
  doneAt: 2000;                      // still from here
};

export interface WelcomeSwapFrame {
  /** The numeral's text: before → after in tenths, toFixed(1) ("7.5", "7.6", … "8.0"). Never displayScore for the
   *  in-between tenths (it rounds to halves). */
  numeral: string;
  /** Opacity of the after piece (the swapSlot drawn from afterReading); the before piece is 1 − this. */
  pieceAfter: number;
  /** Opacity of the after word and the fix line; the before word and "Full check" are 1 − this. */
  textAfter: number;
  /** true from doneAt on: nothing moves again. */
  done: boolean;
}
/** The frame at `tMs` since Welcome mounted (slow = 1). t ≤ 600: the before state exactly. t ≥ 2000: the after state
 *  exactly. The count steps every min(100, 500 / tenths) ms from countFrom (tenths = round((after − before) × 10)), so
 *  for 7.5 → 8.0: 7.6 at 1000, 7.7 at 1100, 7.8 at 1200, 7.9 at 1300, 8.0 from 1400. pieceAfter is 0.5 at 900 and
 *  rises monotonically. If after ≤ before the numeral holds the before score until textFrom, then shows after. */
export function welcomeSwapFrame(tMs: number, ex: Pick<WelcomeExample, 'score' | 'after'>): WelcomeSwapFrame;
/** The after state as a frame (numeral displayScore(after), pieceAfter 1, textAfter 1, done true). */
export function welcomeAfterFrame(ex: Pick<WelcomeExample, 'after'>): WelcomeSwapFrame;

/** 'still' (the after state from the first frame, no timer) with Reduce Motion or an accessibility text size. */
export function welcomeMotion(o: { reduceMotion: boolean; accessibilitySize: boolean }): 'play' | 'still';

/** t('onb.welcome.cardA11y', { occasion: t('onb.welcome.cardOccasion'), before: spokenScore(score), beforeWord: word,
 *  fix: fix.copy, after: spokenScore(after.score), afterWord: after.word }). The same string in every frame. */
export function welcomeCardA11y(ex: WelcomeExample): string;

export interface WelcomeLayoutInput {
  width: number; height: number;   // the screen (onLayout of the root)
  safeTop: number;                 // insets.top
  bottomBlockHeight: number;       // the measured bottom block (wordmark … last button, with its bottom padding)
  cardAfterHeight: number;         // the measured mini card in its after state
  accessibilitySize: boolean;
}
export interface WelcomeLayout {
  k: number;                       // the drawing's scale
  drawing: { left: number; top: number; width: number; height: number };  // width 214k, height 324k
  card: { top: number; right: number; width: number | null };              // non-AX: right 20, width 188; AX: null (full width, left/right 24)
  bottomBlockTop: number;
  scrolls: boolean;                // the content is taller than the screen
}
/** DESIGN.md "How Welcome fits every phone", in content coordinates of the one scroll view.
 *  Non-AX: avail = height − safeTop − 48 − bottomBlockHeight; k = max(0.6, min(1, (width − 228) / 198, avail / 324));
 *  hero = max(324k, cardAfterHeight); scrolls = hero > avail; heroTop = safeTop + 24 + (scrolls ? 0 : (avail − hero) / 2);
 *  drawing.top = heroTop + (hero − 324k) / 2, drawing.left = 12; card.top = drawing.top + 162k − cardAfterHeight / 2,
 *  card.right = 20, card.width = 188; bottomBlockTop = scrolls ? heroTop + hero + 24 : height − bottomBlockHeight.
 *  AX: k = 0.69, the drawing centred ((width − 214k) / 2), then the card (full width) under it, then the bottom block,
 *  24 between each, scrolls = true when the stack is taller than the screen. */
export function welcomeLayout(i: WelcomeLayoutInput): WelcomeLayout;
```

### `exampleCheck.ts`
```ts
export interface ExampleCheck {
  reading: Reading;            // NEW: the same object as welcomeExample().reading (no photoId any more)
  score: number;
  summary: string | null;
  fixes: Fix[];
  nextLevel: string | null;
  why: WhyParts | null;
}
export function exampleCheck(): ExampleCheck | null;   // unchanged scoring; memoised (same object every call)
```

### `outfitDrawing.ts`
```ts
export type DrawnSlot = 'outer' | 'top' | 'bottom' | 'shoes';
export interface DrawnPiece {
  slot: DrawnSlot;
  garment: Garment;      // the reading's garment, untouched
  spec: ArtSpec;         // artSpec({ garment, hex: FAMILY_HEX[garment.color_family], art: null, name: '' })
  name: string;          // baseName(garment, null), e.g. "Charcoal denim jacket"
}
/** One piece per slot present, in the order outer, top, bottom, shoes (outerwear → 'outer', top → 'top',
 *  bottom → 'bottom', footwear → 'shoes'; anything else is left out; the first garment of each slot wins). */
export function drawnPieces(reading: Reading): DrawnPiece[];

export interface Placement { size: number; left: number; top: number }
/** Welcome's base box 214 × 324 (k = 1): outer {104, 0, 24} · top {134, 64, 0} · bottom {134, 64, 124} ·
 *  shoes {150, 56, 204}; every number × k. */
export const WELCOME_BOX: { width: 214; height: 324 };
export function welcomePlacement(slot: DrawnSlot, k: number): Placement;
/** The bubble's tile, by StandingOutfit's ratios (h = round(w × 4/3), piece = round(h / 3.2), shoes round(piece × 1.15)
 *  in a row of piece × 0.75, layer round(piece × 0.8) at left 2, piece × 0.15 below the first core piece), the core
 *  column centred in a `height`-tall tile. At 127 × 172: outer {42, 2, 21} · top {53, 37, 13} · bottom {53, 37, 66} ·
 *  shoes {61, 33, 109} (each within 1 pt). */
export function tilePlacement(slot: DrawnSlot, width: number, height: number): Placement;

/** t('onb.example.a11yOutfit', { occasion, pieces: names joined by ', ' in drawnPieces order }). */
export function drawnOutfitA11y(pieces: readonly DrawnPiece[], occasion: string): string;
```

### `DrawnOutfit.tsx`
```ts
export interface DrawnOutfitProps {
  pieces: readonly DrawnPiece[];
  layout: { kind: 'welcome'; k: number } | { kind: 'tile'; width: number; height: number };
  /** Welcome's swap: the after piece for one slot, drawn over the before piece. */
  swap?: { piece: DrawnPiece; opacity: number } | null;
  testID?: string;
}
/** Each piece through `GarmentArt` with `spec = piece.spec` and `size = placement.size`, absolutely placed. 'tile'
 *  draws the `surface2` tile with radii 17/17/4 (bottom right)/17; 'welcome' draws no tile. Hidden from VoiceOver
 *  (accessibilityElementsHidden, importantForAccessibility "no-hide-descendants"); no touch handling. With `swap`,
 *  the before piece of that slot is drawn at opacity 1 − swap.opacity and the after piece at swap.opacity; a piece
 *  at opacity 0 is not rendered. */
export function DrawnOutfit(props: DrawnOutfitProps): JSX.Element;

export interface DrawnOutfitBubbleProps {
  pieces: readonly DrawnPiece[];
  occasion: string;       // "Everyday"
  time: string;           // "Example"
  label: string;          // drawnOutfitA11y(pieces, occasion)
  testID?: string;
}
/** PhotoBubble's frame from the same tokens (width size.photoBubbleWidth 135, padding 4, fill `me`, radii
 *  radius.photoBubble ×3 / radius.bubbleTail bottom right), a 127 × 172 DrawnOutfit tile, and PhotoBubble's caption
 *  row (occasion left, time right, role photoCaption, onMe at 90%); at accessibility sizes the caption moves under the
 *  bubble as "{occasion} · {time}" (role dayStamp, ink2, in a maxWidth 88% wrapper, hidden from VoiceOver), as
 *  PhotoBubble does. One VoiceOver element: role "image", label = `label`. No onPress. */
export function DrawnOutfitBubble(props: DrawnOutfitBubbleProps): JSX.Element;
```

### `useWelcomeSwap.ts`
```ts
/** Runs Welcome's swap once per mount. 'still' mode (welcomeMotion) → welcomeAfterFrame from the first render and no
 *  timer. 'play' → a requestAnimationFrame loop computing welcomeSwapFrame(elapsed / slow, ex) from the time of mount,
 *  slow = revealSlow() from features/fitcheck/reveal (the existing -demoRevealSlow launch arg, 1 outside demo builds);
 *  stops at done. If reduceMotion or accessibilitySize turns true mid-play: the after frame at once, loop stopped.
 *  Coming back from the background never restarts it (elapsed only grows). Cancels its frame on unmount. Returns null
 *  when ex is null. */
export function useWelcomeSwap(ex: WelcomeExample | null, o: { reduceMotion: boolean; accessibilitySize: boolean }): WelcomeSwapFrame | null;
```

### `WelcomeScreen` (no props) and `ExampleCheckScreen({ mode?: 'screen' | 'sheet' })` (props unchanged)
Reads: `useTheme()` (`a11y.reduceMotion`, `isAccessibilitySize`, `colors`, `scheme`), `useAccountsOn()`, `welcomeExample()`, `useWelcomeSwap`, `store.setKv` (only on `Get started`), `router`.

**testIDs**
- Welcome: `welcome-root` (the ScrollView) · `welcome-drawing` (DrawnOutfit) · `drawn-piece-outer`, `drawn-piece-top`, `drawn-piece-bottom`, `drawn-piece-shoes` (each piece's wrapper; the before piece of the swap slot) · `drawn-piece-shoes-after` (the after piece; the id is `drawn-piece-<swapSlot>-after`) · `welcome-card` (the one accessible card element, carries the label) · `welcome-card-score` (the Numeral) · `welcome-card-word-before`, `welcome-card-word-after` · `welcome-card-detail-before` ("Full check"), `welcome-card-detail-after` (the fix) · `welcome-card-measure` (an invisible after-state copy used only to measure the card's after height: outside `welcome-card`, opacity 0, pointerEvents none, hidden from VoiceOver; optional if the implementer measures another way) · `welcome-bottom` (the bottom block).
  - Rule for the before/after layers: at rest only one layer of each pair is rendered (before: only `-before` ids and `drawn-piece-shoes`; done: only `-after` ids and `drawn-piece-shoes-after`); both exist only during their cross-fade.
- Example check: `example-root` · `example-bubble` (DrawnOutfitBubble; its tile's pieces use the `drawn-piece-*` ids) · `example-card` (the KCard) · `example-math` (a View wrapping PartsBreakdown, present only while open) · `example-note` (the caption) · `example-dock` (the dock View).
- Buttons and links keep their visible titles (KButton has no testID): `Get started`, `See an example check`, `I already have an account`, `Why 7.5?` / `Hide the math`, `Check my own fit`; the Back and Close circles by their labels `Back` / `Close`.

**Demo screens** (all existing; no new numbers, `demo/` isn't in the lane)
- `1` Welcome, accounts off: plays the swap live (before at 0–0.6 s, after from 2 s). Add `-demoRevealSlow 10` to hold the before state for 6 s and the mid-swap frame (7.7) at about 11 s.
- `130` Welcome with sign-in on (DESIGN.md phone 13's state, at the Simulator's own size).
- `131` the Example check from Welcome.
- `213` the Example check as a sheet.
- Largest text: any of these with the Simulator's content size at AX5 (`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`); Reduce Motion: the Simulator's Settings → Accessibility → Motion.

## Data
- No stored data. Welcome and the Example check read nothing from and write nothing to the store on open; `Get started` keeps writing `onboarding.step` = `looks` as today.
- `en.ts` (`addedInBuild`):
  - NEW `onb.welcome.cardA11y`: `Example fit check. {occasion}. {before} out of 10, {beforeWord}. One fix: {fix}. {after} out of 10, {afterWord}.`
  - NEW `onb.example.a11yOutfit`: `Drawn example outfit, {occasion}: {pieces}.`
  - OVERRIDE `onb.example.intro` (generated from 02 §5, so overridden here like `recheck.tell.confirmed`, not edited in `en.generated.ts`): `Here's an example check. This is what you'll get.`
  - CHANGED `onb.example.note`: `A drawn example, scored by the same code as your photos. Nothing was sent.`
  - Every other `onb.welcome.*` / `onb.example.*` value is unchanged (`onb.welcome.cardWord` stays, unused).

## Steps
1. `outfitDrawing.ts`: `drawnPieces`, `WELCOME_BOX`, `welcomePlacement`, `tilePlacement`, `drawnOutfitA11y`. Hex from core's `FAMILY_HEX`; names from Closet's `baseName`; drawings from Closet's `artSpec`.
2. `welcomeExample.ts`: rename the constant to `WELCOME_READING`; build `WelcomeExample` from `exampleCheck()` (the top fix) and `applyPartsFix` + `overallFor` (the after score); `swapSlot` by comparing `drawnPieces(reading)` with `drawnPieces(afterReading)`; add `SWAP_MS`, `welcomeSwapFrame`, `welcomeAfterFrame`, `welcomeMotion`, `welcomeCardA11y`, `welcomeLayout`. Watch the import cycle (exampleCheck imports the constant from welcomeExample today): move `WELCOME_READING` so neither module needs the other at load, or import lazily inside the functions.
3. `exampleCheck.ts`: `reading` in place of `photoId`; read `WELCOME_READING`.
4. `useWelcomeSwap.ts`.
5. `DrawnOutfit.tsx`: `DrawnOutfit` and `DrawnOutfitBubble`.
6. `WelcomeScreen.tsx`: delete `NeckDownPhoto`, `demoPhoto`, the gradient `Svg`, `HERO_H`/`HERO_NECK`, `setStatusBarStyle` and its `useFocusEffect`. One `ScrollView` (`welcome-root`, `contentContainerStyle` minHeight = screen, `bounces={false}`), positions from `welcomeLayout` (measure the bottom block and the after-state card with onLayout; until measured, lay out with the stated defaults and don't start the clock's visible motion before the 600 ms still anyway). The mini card: tag row (`MonoLabel` ×2, wraps at AX), score row (`Numeral` 52 with `style={{ fontVariant: ['tabular-nums'] }}` + the word, `subheadline` 600), then the detail line under it at full width (`caption`, ink2); no `numberOfLines` anywhere in the card; `KCard radius={radius.cardSmall}`. The card now shows at accessibility sizes (full width, the after state). `Get started`, `See an example check` and `I already have an account` unchanged.
7. `ExampleCheckScreen.tsx`: `DrawnOutfitBubble` with `drawnPieces(ex.reading)` in place of `PhotoBubble`; drop `demoPhoto`; add the testIDs; nothing else changes. **Keep the `go()` sheet branch's text exactly** (`if (sheet) {` / `router.back();` / `setTimeout(() => router.push('/sheets/consent'), 350);`): `stepFourBatch.test.ts` G23.1 reads it.
8. `en.ts`: the four entries above, in the onboarding block with a one-line comment (T38, #411).
9. The flow `app/e2e/flows/T38-drawn-welcome.yaml` (the test writer writes it; the implementer makes it pass).

## Must not break
- `uiFixBatch.test.ts` › "the Welcome card (#276)": `welcomeExample().score` equals `overallFor(s14, everyday)`, `.word` its word, and the reading is a full check (the test writer renames its `WELCOME_PHOTO` import to `WELCOME_READING`; the assertions stay).
- `onboardingAccount.test.ts` › "F7 · the example check": the Example's score equals Welcome's (before) score, the math strip has 5 parts, every fix has copy, `exampleCheck()` is memoised, and it touches no store.
- `stepFourBatch.test.ts` › G23.1: the sheet route exists and the sheet `go()` text above.
- `onboardingAccount.test.ts` › Q4: no "AI stylist", "unlimited" or emoji in `onb.example*` strings.
- Welcome's `Get started` writes step `looks` and pushes `/onboarding/looks`; `See an example check` pushes `/onboarding/example`; with accounts on, `I already have an account` pushes `/sheets/sign-in?from=welcome` (demo 130).
- The Example check from Consent (`?from=consent`) still goes back, and as a sheet `Check my own fit` still closes it and opens the agreement (T39 changes this path, not T38).
- The s14 photo stays bundled for the demo stories (demo screen 180's `s14b`, the sample-photos sheet, the service tests); only Welcome and the Example check stop using it.
- No change to scoring, fixtures or `@kitted/core` (same reading, same score).
- Closet's drawings look the same (StandingOutfit, GarmentArt, flats untouched).

## Open questions
**For the founder:** none open. DESIGN.md's six questions were answered in his approval (8.0 in ink, "Full check" before the swap, the s14 reading, `onb.example.a11yOutfit` as written, Closet's night-rim rule kept, the drawing kept at AX sizes).

**Technical defaults** (the coordinator logs them):
1. **The drawn-outfit view lives in `features/onboarding/`** (the lane). DESIGN.md says it "should share StandingOutfit's layout numbers, not copy them", but StandingOutfit is in the closet lane. Default: `tilePlacement` uses StandingOutfit's ratios (4/3, 3.2, 0.75, 1.15, 0.8, 0.15) as named constants with a comment pointing at StandingOutfit; StandingOutfit is not edited. Follow-up (closet lane): StandingOutfit imports them.
2. **The layer's top in the bubble tile is 21 (DESIGN.md), not StandingOutfit's 8.** StandingOutfit puts the layer 0.15 × piece from the tile's top; the design measures it from the first core piece (13 + 8). The approved design wins; noted so nobody "fixes" it back.
3. **`Numeral` gets no new prop:** WelcomeScreen passes `style={{ fontVariant: ['tabular-nums'] }}` through Numeral's existing `style` (design-system isn't in the lane). If Archivo's static cut has no tabular figures (seen on the Simulator: "Put together" shifts during the count), the numeral's box gets a fixed minWidth measured from "8.8" at its size instead.
4. **`DrawnOutfitBubble` re-creates PhotoBubble's frame from the same tokens** instead of letting PhotoBubble take children (DESIGN.md's "simplest build"), because `Chat.tsx` is in the design system, outside the lane. Risk: the two can drift; follow-up to merge them.
5. **`onb.example.intro` is overridden in `en.ts`**, as the existing overrides are; `en.generated.ts` and 02's copy deck are not edited (02 isn't in the lane). Follow-up: put the new line in 02 §5 next time it's regenerated.
6. **The bubble's VoiceOver pieces are in the order outer layer, top, bottoms, shoes.** DESIGN.md says "in the reading's order", but the s14 reading lists the sweater first; the approved string ("Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers") puts the jacket first. The approved words win.
7. **The hero group's height is max(324k, the card's after height)**, in both the centring and the scroll rule (the critic's round-2 polish, not folded into DESIGN.md's formula). Without it the card can run past the group at xLarge–xxxLarge on a short phone.
8. **At accessibility sizes the drawing's scale is 0.69, centred** (DESIGN.md's AX piece sizes: jacket 72, sweater 92, trousers 92, shoes 104 = the base sizes × 0.69). That makes the drawing about 224 pt tall; DESIGN.md says "about 250 pt" — the piece sizes are taken as the exact numbers.
9. **The swap honours `-demoRevealSlow`** (an existing demo launch arg, ×1–10, 1 in release) so the before and mid-swap frames can be screenshotted. Demo screens play the swap live; no new demo arg.
10. **If `welcomeExample()` is null** (the reading missing, unscored, or no fix): Welcome shows no drawing and no card, and the bottom block and buttons work as normal; the Example check shows the intro and caption only, as today. The spec doesn't cover it; it can't happen with the bundled reading, and a test pins that it doesn't.
11. **A new Maestro flow file**, `app/e2e/flows/T38-drawn-welcome.yaml`, though `e2e/` isn't on T38's file list (it's on T39's). The build-task rules want a flow for a screen he taps through; a new file collides with nothing.
12. **The count's step** is 100 ms per tenth, shortened to 500 / tenths when the gap is more than 5 tenths, so it always lands by 1500 ms (only matters if the engine's numbers change).
13. **A pinned-values test** holds today's engine output (7.5, "Put together", 8.0, "Sharp", the fix's words). If a later scoring change breaks it, the fix is to show the founder the new Welcome, never to edit the engine or fixtures to match.
