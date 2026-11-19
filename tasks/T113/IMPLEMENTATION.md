# T113 · The style game in setup

**Size:** normal · **From:** `plan.md` → T113 · **Spec:** `specs/style-game.md`, SG1–SG9 and its "Changes to other specs". It has no approval line: it is built on the founder's chat instruction of Nov 18 (DECISIONS-LOG #500; the founder in chat outranks the spec rule), so the spec is the contract and its words are drafts he confirms · **Also:** `specs.md` F1 (step 2, F1.1, already rewritten for the game), `specs/onboarding-screens.md` OS3.1–OS3.2 (still hold), `specs/tailored.md` TL4 (Tailored is one of the 8) · **Reference:** the mockup `tasks/style-quiz/src/{logic.js,views.js,page.html}` on the unmerged branch `claude/style-flow-test-f504ea` (the version with the three fail-safes; read with `git show origin/claude/style-flow-test-f504ea:tasks/style-quiz/src/logic.js`). Where it and the spec disagree, the spec wins · **Decisions:** #482–#488 and #507 (#486 fairness, #487 design pass, #507 the fail-safes) · **Lane:** Setup and You (`app/src/features/onboarding/`, `app/src/app/onboarding/`, `en.ts` shared, `app/e2e/`) · **Branch:** `claude/t113-style-game` · **Log number for this task's decisions:** #501

## Goal
After Welcome, he plays instead of reading style names: 8 "Me or not me?" cards (one drawn outfit each, a tap shows the look's other outfit), then a few this-or-thats between his Me's, then "Here's your style", where he can drag, remove or add a look, type his own words, play again, or Continue to About you. His picks still never move a score. You → Style profile keeps its tiles.

## Running constraints (implementer and verifier)
- **Memory and disk are tight** (under 100 MB free, 5.7 GB of disk on Nov 18). Before any heavy job run `top -l 1 | grep PhysMem` and `pgrep -fl 'xcodebuild|jest|vitest|pytest'`; never stack `npm run check`, Metro, a Simulator or another session's test run. Slower is fine. Prefer `npx jest --no-watchman src/__tests__/T113-*` while building; `npm run check` once at the end, on its own.
- **This worktree has no `node_modules`.** Borrow the main checkout's (handoff/15-build-notes.md #296). After the rebase onto T94 (below) the app needs T94's core (`tailored` in `DetectedStyle`): make `app/node_modules` a folder of symlinks to the main one's entries with `@kitted/core` pointing at this worktree's `app/packages/kitted-core` (#358). Don't commit any of it.
- **Metro:** port 8081 belongs to another session's leftover Metro serving other code. Don't stop it and don't use it. Run this worktree's Metro on 8082 (`npx expo start --dev-client --port 8082`) with its own cache (a temporary, uncommitted `metro.config.js` with `cacheStores` in the scratchpad and the main `node_modules` in `watchFolders`, #377). Point the dev build at it as #296 says. Flows run with `maestro --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D test -e PORT=8082 app/e2e/flows/<file>`. If Metro on 8082 can't run (memory), use the web preview for layout only and write down what wasn't seen on iOS.
- **Simulator:** the main one, `111D0A09-C2CA-4F72-BF3C-44019A05C89D`. Never `EF7ADF2A`. Shut down anything you booted.
- **JS only:** no native rebuild, no EAS, no new package. `expo-haptics`, React Native's `Animated` and `PanResponder` are enough (the app has no gesture-handler root; `features/closet/ConfirmDeck.tsx` is the swipe pattern to copy).

## Picking up T94 (Tailored)
T94 (`claude/t94-tailored-8a3084`, strict, in progress) adds `tailored` to `STYLES` in `data/types.ts`, the copy keys `style.tailored` and `onb.looks.line.tailored`, Tailored's entry and three redraws in `features/onboarding/looks.ts`, and core's `DetectedStyle` gains `tailored`. **T113 edits none of those three files' T94 parts; it doesn't touch `looks.ts` or `types.ts` at all.**
1. **Until T94 pushes its app commit:** build and test the pure logic first (`styleGame.ts`, `styleGameSession.ts`). It names `tailored` as a `StyleKey`, so `tsc` fails on that one word until T94 lands; jest still runs (babel strips types). Don't add a stand-in Tailored, a cast or a local `STYLES`. The screens need `LOOKS` to hold Tailored's drawings, so they wait.
2. **Ask the coordinator** to have T94 push its app-side change (types.ts, en.ts's two keys, looks.ts) as one commit as early as it can.
3. **Then rebase** `claude/t113-style-game` onto T94's branch (`git rebase origin/claude/t94-tailored-8a3084`). If T94 has merged by then, rebase onto `main` instead. Re-run the T113 tests after each rebase.
4. **The merge:** T113 merges with T94 or after it, never before (the game needs 8 looks). Expected text conflicts: `en.ts` (both add keys to `addedInBuild`; keep both), `handoff/DECISIONS-LOG.md` (renumber to the next free number on main, CLAUDE.md trap), `plan.md`.
5. **T94's tests that T113 makes stale (for the coordinator, before T94 locks):** T94's TESTING.md plans `T94-tailored.test.tsx` › `TL4.1 · Looks shows 8 tiles, Tailored right after Classic prep, then Something else? last` (it renders `PickLooksScreen`) and the flow `T94-tailored-tile.yaml` (screen 2, taps the Tailored tile, expects `Continue · 1 of 3`). T113 removes that grid, so both would fail after T113. T94's tests are strict and locked, so T113 must not edit them. **Recommended:** before T94 locks, its test writer points TL4.1's component test at `LOOKS` order plus Style profile's tiles (`app/(tabs)/you/profile.tsx`, which T113 doesn't touch), and the flow at screen 80 (Style profile) instead of screen 2. Otherwise T113 needs a dispute ruling to retarget them (open question T1).

## Files
Only these. Anything else is a deviation written in TASK.md.

**In the lane**
- `app/src/features/onboarding/styleGame.ts` (**new**, pure): the 8 looks in the deal's starting order, the look-alike pairs, the seeded random generator (an exact port of the mockup's), the deal, answers, the ranking by binary insertion, the results operations (move, remove, add with the full-list swap), the drag target, the swipe and tap rules, which line the results show, Continue's rule, the Not me list to save, the card descriptions' keys.
- `app/src/features/onboarding/styleGameSession.ts` (**new**): the game in memory for this app session (the stage, Back's history, the outfit shown, his words), a `useSyncExternalStore` hook, the results draft in kv, saving on Continue, Play again, and the demo and test seams.
- `app/src/features/onboarding/StyleGameScreen.tsx` (**new**): the Looks route's screen. It draws the stage: cards, ranking or results.
- `app/src/features/onboarding/GameCard.tsx` (**new**): one card (the drawing, the two outfit dots, the stamps, the swipe, the tap for the other outfit, the first card's lean, VoiceOver's actions).
- `app/src/features/onboarding/GameRanking.tsx` (**new**): "Now put them in order".
- `app/src/features/onboarding/GameResults.tsx` (**new**): "Here's your style" and "Nothing clicked yet": rows with drag, ×, Add a look, his words, Continue, Play again.
- `app/src/features/onboarding/AddLookSheet.tsx` (**new**): the Add a look sheet (SheetScaffold, today's `LookTile`s).
- `app/src/features/onboarding/LookTile.tsx`: an optional `testID` prop, passed to its `Pressable`. Nothing else changes (Style profile renders it too).
- `app/src/features/onboarding/PickLooksScreen.tsx`: **deleted** (the grid; only the Looks route used it). `looks.ts` stays as it is: `LOOKS`, `picksToStyles`, `cleanOtherWords`, `togglePick` and `MAX_PICKS` are still used by You and by the game.
- `app/src/features/onboarding/aboutStep.ts`: `finishSetup` also deletes kv `onboarding.styleGame` and calls `endStyleGame()` (the game in memory goes). It keeps `onboarding.otherStyle` and `looks.notMe`.
- `app/src/features/onboarding/basics.ts`: the two new key constants (`NOT_ME_KEY`, `GAME_DRAFT_KEY`) next to `LOOKS_KEY` (spec Touches: "basics.ts (the Not me key)").
- `app/src/app/onboarding/looks.tsx`: exports `StyleGameScreen`.
- `app/src/app/onboarding/add-look.tsx` (**new**): the sheet route, exports `AddLookSheet`.
- `app/src/app/onboarding/_layout.tsx`: registers `add-look` as a form sheet: `presentation: 'formSheet'`, `sheetGrabberVisible: true`, `sheetAllowedDetents: isAccessibilitySize ? [1] : [0.75, 1]` (from `useTheme()`, #377). Registers `looks` with `gestureEnabled: false` (technical default 6).
- `app/src/i18n/en.ts` (shared): the new keys in `addedInBuild`, in one block with a T113 comment (Data → Words). No key is deleted (`onb.looks.*` stay; You uses some).
- `app/src/testing/styleGameTestKit.ts` (**new**, test support): `playStyleGame(...)` for render tests (below).
- Tests: `app/src/__tests__/T113-styleGame.test.ts` (pure), `T113-styleGameSession.test.ts` (memory store), `T113-styleGameScreens.test.tsx` (render). Updated: `T39-setupScreens.test.tsx`, `T39-offerCard.test.tsx`, `looksOwnWords.test.tsx`, `scenarios.test.ts` (see Steps → 8).
- Flows: `app/e2e/flows/T113-style-game.yaml` (**new**, the demo screens and taps), `app/e2e/common/play-style-game.yaml` (**new**, a subflow), and the four setup flows that walked the grid: `T39-setup-fresh.yaml` (becomes F1.1's 17-tap walk), `T39-setup-later.yaml`, `T39-setup-not-now.yaml`, `T39-under-18.yaml`, plus `T39-screens.yaml`'s screen 2 block.

**Outside the lane, needed (each a technical default in Open questions)**
- `app/src/sync/schema.ts` (Sign-in and backup lane): `'looks.notMe': {}` in `KV_SYNCED` ("synced like his looks", SG8); `'onboarding.styleGame'` in `KV_LOCAL` (a draft of this phone's setup). Without them `syncSchema.test.ts` fails ("every kv key the app writes is classified").
- `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts` (unowned): screen 2 renamed and given a fixed deal, screens 300–313 added (Demo screens).
- `privacy/wipe.ts`: **not touched.** The spec's Touches names it for "one key", but `deleteAllData` empties the whole kv table (`store.wipe()`), so `looks.notMe` already goes. SG8.1's test proves it.

**Not touched:** `features/onboarding/looks.ts` (T94's), `data/types.ts` (T94's), `features/you/*` and `app/(tabs)/you/*` (Style profile keeps its tiles), `BasicsScreen.tsx`, `WelcomeScreen.tsx`, `complete.ts`, `resume.ts` (the `looks` step already resumes here), `@kitted/core`, scoring, the camera, Stylist.

## Interfaces
What the tests call. The test writer reads only this section.

### `features/onboarding/basics.ts` (two constants added)
```ts
/** SG8: the looks he said Not me to (a JSON array of look keys), saved on Continue, kept after setup, synced. */
export const NOT_ME_KEY = 'looks.notMe';
/** The results draft (local): written while he is on Here's your style, so a close reopens it (SG8). */
export const GAME_DRAFT_KEY = 'onboarding.styleGame';
```
Every `setKv` of these two keys is written with the **string literal** (`store.setKv('looks.notMe', …)`), as `saveAbout` does, so `syncSchema.test.ts`'s scan can classify it.

### `features/onboarding/styleGame.ts` (pure, no store, no React)
```ts
import type { StyleKey } from '@/data/types';

/** The 8 looks, in the order the deal shuffles from (the mockup's ORDER; equals LOOKS' order after T94). */
export const GAME_LOOKS: readonly StyleKey[];
// ['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport']
export const CARD_COUNT = 8;
/** Never side by side in a deal, counting the last card as next to the first (SG1). */
export const LOOK_ALIKES: readonly (readonly [StyleKey, StyleKey])[];
// [['classic_prep','tailored'], ['minimalist','smart_casual'], ['workwear','outdoor'], ['streetwear','vintage_sport'], ['smart_casual','classic_prep']]
export function areAlike(a: StyleKey, b: StyleKey): boolean; // either order

/** The mockup's rng32 (mulberry32), ported exactly: same seed, same numbers. */
export function seededRandom(seed: number): () => number;
/** A new game's seed: 1 + floor(random() × 0x7FFFFFFE). `random` defaults to Math.random (never called in render). */
export function newSeed(random?: () => number): number;

export interface Deal { order: readonly StyleKey[]; /** 1: the first this-or-that puts the newcomer on the right. */ flip: 0 | 1 }
/** The mockup's dGameFor, exactly: Fisher–Yates on a copy of GAME_LOOKS with seededRandom(seed), repeated until no
 *  look-alikes are adjacent (cyclically); then flip = next random() < 0.5 ? 1 : 0. Memoized by seed. */
export function dealFor(seed: number): Deal;
// Golden values (from the mockup's code, Nov 18):
// dealFor(1)  = { order: ['tailored','vintage_sport','classic_prep','outdoor','smart_casual','workwear','minimalist','streetwear'], flip: 0 }
// dealFor(42) = { order: ['workwear','classic_prep','streetwear','minimalist','tailored','outdoor','vintage_sport','smart_casual'], flip: 1 }

export interface Answer { look: StyleKey; me: boolean }
export interface Round { pair: readonly [StyleKey, StyleKey]; win: StyleKey }
export interface Game { seed: number; answers: readonly Answer[]; rounds: readonly Round[] }
export function newGame(seed: number): Game;                       // no answers, no rounds
/** The look on the card he's on (deal order[answers.length]); null once all 8 are answered. */
export function currentCard(g: Game): StyleKey | null;
/** Records Me or Not me for the current card. Returns g unchanged when all 8 are answered. */
export function answerCard(g: Game, me: boolean): Game;
export function mesOf(g: Game): StyleKey[];                        // his Me's, in card order
export function notMesOf(g: Game): StyleKey[];                     // his Not me's, in card order

export type RankStep =
  | { done: true; top: StyleKey[] }                                // at most 3, best first
  | { done: false; pair: readonly [StyleKey, StyleKey] };          // [left, right]
/** The mockup's ranker, replayed from g.rounds: each Me (in card order) is placed into a top 3 by binary insertion
 *  (lo/hi bisection over the current top; the list is cut to 3 after each insert). Round i asks [newcomer, other]
 *  when (i + flip) is even, else [other, newcomer]. With 0 or 1 Me's: done at once (top [] or [that look]). Before all
 *  8 cards are answered it ranks the Me's so far (callers only ask after card 8). */
export function rankStep(g: Game): RankStep;
/** Records the tap on the current pair. Throws if `win` isn't in the current pair or the ranking is done. */
export function pickRound(g: Game, win: StyleKey): Game;
export type Stage = 'cards' | 'ranking' | 'results';
/** 'cards' until 8 answers; then 'ranking' while rankStep isn't done; then 'results'. */
export function stageOf(g: Game): Stage;

// ── Here's your style ──
export const MAX_LOOKS = 3;
export function moveLook(picks: readonly StyleKey[], from: number, to: number): StyleKey[]; // out of range or from === to → a copy, unchanged
export function removeLook(picks: readonly StyleKey[], i: number): { picks: StyleKey[]; removed: StyleKey | null };
/** SG4 / FS2: a look not on the list goes last; on a full list (3) it takes #3's place and `replaced` is the old #3.
 *  A look already on the list: unchanged, replaced null. */
export function addLook(picks: readonly StyleKey[], s: StyleKey): { picks: StyleKey[]; replaced: StyleKey | null };
/** The sheet's looks: GAME_LOOKS minus his list, in GAME_LOOKS order. */
export function lookChoices(picks: readonly StyleKey[]): StyleKey[];
/** Where a dragged row lands: the number of other rows whose middle is above the dragged row's middle. */
export function dragTarget(from: number, draggedMidY: number, rowMidYs: readonly number[]): number;

export type ResultsHead = 'top' | 'one' | 'empty' | 'none';
/** 'none': he said Not me to all 8 and has no look on his list (SG6). 'top': 2+ looks. 'one': 1 look. 'empty': no look
 *  left after he had Me's (technical default 3; its words are founder question F3). */
export function resultsHead(picks: readonly StyleKey[], mes: readonly StyleKey[]): ResultsHead;
/** SG3.2 / #449: a look, or his words (cleanOtherWords not null). */
export function canContinue(picks: readonly StyleKey[], words: string): boolean;
/** SG8: the Not me's to save: notMesOf(g) minus any look on his final list, in GAME_LOOKS order. */
export function notMeToSave(g: Game, picks: readonly StyleKey[]): StyleKey[];

// ── The card's gesture (SG1, FS1) ──
export const TAP_SLOP = 6;    // pt: a press that moves less is a tap
export const SWIPE_LINE = 90; // pt: past it, a swipe answers
/** On release: hypot(dx, dy) < 6 → 'peek' (the other outfit); dx > 90 → 'me'; dx < −90 → 'notMe'; else 'spring'. */
export function cardRelease(dx: number, dy: number): 'peek' | 'me' | 'notMe' | 'spring';
/** While dragging: the stamps' opacities (Me: clamp(dx / 90, 0, 1), Not me: clamp(−dx / 90, 0, 1)) and which button
 *  is lit (dx > 90 'me', dx < −90 'notMe', else null). */
export function swipeFeedback(dx: number): { me: number; notMe: number; lit: 'me' | 'notMe' | null };
/** The card gives the touch to the scroll view when it moved 10 pt up or down before 12 pt sideways (ConfirmDeck's rule). */
export function cardYields(dx: number, dy: number): boolean;
/** SG1.3: the lean runs only on card 1 of a game, once, never under Reduce Motion. */
export function shouldLean(answered: number, leanedThisGame: boolean, reduceMotion: boolean): boolean;
/** SG9: how an answered card leaves: fly 240 ms from where it is, or fade 150 ms under Reduce Motion. */
export function cardExit(reduceMotion: boolean): { kind: 'fly' | 'fade'; ms: number };
/** The VoiceOver description key of a look's drawing: `game.desc.<look>.<0|1>`. */
export function descKey(look: StyleKey, outfit: 0 | 1): StringKey;
```

### `features/onboarding/styleGameSession.ts`
The game lives in memory for this app session (a module value), so Back to Welcome and Get started again resumes the same deal and answers (FS Back). A relaunch empties memory: mid-game he starts at card 1 with a new deal, and on results the kv draft brings them back (SG8).
```ts
export interface ResultsState { picks: StyleKey[]; mes: StyleKey[]; notMes: StyleKey[] }
export interface SessionState {
  game: Game;
  stage: Stage;
  /** Shown while stage is 'results' (from rankStep's top, then his changes, or from the draft). */
  results: ResultsState | null;
  /** The outfit on the current card: 0 first, 1 the other (FS1). Not part of Back's history. */
  peek: 0 | 1;
  /** The first card has leaned (or been touched) in this game. */
  leaned: boolean;
  /** His words as typed (the field's text). */
  words: string;
  editingWords: boolean;
  /** Back can undo something here (false on card 1 and on results reopened after a relaunch). */
  canUndo: boolean;
}
export function getStyleGame(): SessionState | null;
export function useStyleGame(): SessionState | null;                  // useSyncExternalStore over the module value

/** Looks' mount: keeps a session already in memory; else, when kv onboarding.styleGame holds a valid draft, opens
 *  results from it (no history) with words = kv onboarding.otherStyle ?? ''; else a new game with newSeed(random).
 *  words also come from onboarding.otherStyle for a new game (Play again and a close keep his words). */
export function startOrResumeStyleGame(store: KittedStore, random?: () => number): Promise<SessionState>;

/** Card answer (tap or swipe). Pushes Back's history first; peek back to 0. On the 8th: to 'ranking', or straight to
 *  'results' when rankStep is done (0 or 1 Me). Entering results writes the draft. Ignored outside 'cards'. */
export function answer(store: KittedStore, me: boolean): Promise<void>;
/** A this-or-that tap. Pushes history; on the last one enters results (writes the draft). */
export function pickInRanking(store: KittedStore, win: StyleKey): Promise<void>;
/** FS1: switches the card's outfit. No history entry. */
export function togglePeek(): void;
export function markLeaned(): void;

/** Back (the nav's circle). Undoes exactly one thing: a results change, else the last this-or-that, else the last
 *  card (the card shows again with the outfit it had when answered). Leaving 'results' deletes the draft; a change
 *  inside results rewrites it. Returns 'exit' when there's nothing to undo (the screen goes to Welcome; the session
 *  stays in memory). His words are never undone by Back. */
export function back(store: KittedStore): Promise<'undone' | 'exit'>;

/** Results changes: each pushes history and rewrites the draft. Each returns an undo token for the toast. */
export function moveInResults(store: KittedStore, from: number, to: number): Promise<number | null>;
export function removeFromResults(store: KittedStore, i: number): Promise<{ token: number; removed: StyleKey } | null>;
export function addToResults(store: KittedStore, s: StyleKey): Promise<{ token: number; replaced: StyleKey | null } | null>;
/** The toast's Undo: undoes that change if it is still the last thing in history; otherwise does nothing. */
export function undoChange(store: KittedStore, token: number): Promise<boolean>;

export function setWords(text: string): void;                          // the field's text; Continue reads it at once
export function openWords(): void;
/** Done: trims (cleanOtherWords); saves kv onboarding.otherStyle, or deletes it when blank; closes the field. */
export function saveWords(store: KittedStore): Promise<void>;

/** Play again: a new game (newSeed), empty history, results null, the draft deleted, leaned false. Words stay. */
export function playAgain(store: KittedStore, random?: () => number): Promise<void>;

/** Continue (only when canContinue): writes, in order, kv onboarding.looks = JSON(picks), onboarding.otherStyle =
 *  cleanOtherWords(words) (or deletes it), looks.notMe = JSON(notMeToSave(game, picks)), the resume step 'basics'.
 *  Keeps the draft (Back from About you after a relaunch reopens results). Throws, writing nothing, when it can't
 *  continue. Sends nothing. The screen then pushes /onboarding/basics. */
export function continueToAbout(store: KittedStore): Promise<void>;

/** finishSetup and tests: forget the game in memory. */
export function endStyleGame(): void;

/** Demo screens only: sets the session as given (called by prepareDemoScreen before the route opens). */
export interface StyleGameDemo {
  seed: number;
  /** Looks he says Me to; every other card he passes is Not me. `cards` = how many cards are answered (default 8). */
  me: readonly StyleKey[];
  cards?: number;
  /** His order for the this-or-thats (best first); every pair is decided by it. `rounds` = how many are made (default all). */
  prefer?: readonly StyleKey[];
  rounds?: number;
  peek?: 0 | 1;
  /** Results changes after the game, in order. */
  then?: readonly ({ remove: number } | { add: StyleKey } | { move: [number, number] })[];
  words?: string;
  editingWords?: boolean;
  /** Draw the card dragged this far (pt), held, for a screenshot of the stamps and the lit button. */
  dragDx?: number;
  /** Show the last change's toast held (demoHeldAtMs). */
  toast?: boolean;
}
export function seedStyleGameForDemo(store: KittedStore, d: StyleGameDemo): Promise<void>;
```
Draft format (kv `onboarding.styleGame`): `{"v":1,"picks":[…],"mes":[…],"notMes":[…]}`. A bad or unknown draft is ignored (a new game), never a crash.

### `features/onboarding/aboutStep.ts` (`finishSetup`, one change)
After today's deletes it also deletes kv `onboarding.styleGame` and calls `endStyleGame()`. It keeps `onboarding.otherStyle` (as today) and `looks.notMe` (new; kept with his style profile).

### `StyleGameScreen` (no props; route `/onboarding/looks`)
- Root: as today's Looks (`paddingTop: insets.top`, `bg`), `OnboardingNav step={2}` on every stage. Back: `back(store)`; on `'exit'`: `router.canGoBack() ? router.back() : router.replace('/onboarding/welcome')`.
- On mount: `startOrResumeStyleGame(store)`; renders nothing until it resolves (no flash of card 1).
- **Cards stage** (a ScrollView; the dock with the buttons sits under it):
  - `game-title` (KText largeTitle, header) `Me or not me?`; `game-line` (body, ink2) `One outfit at a time. Would you wear something like this?`.
  - `GameCard` (below).
  - `game-progress` (hidden from VoiceOver): 8 dots `game-progress-dot-0` … `-7`; `i < answered` filled `ink` (6 × 6), `i === answered` the pill (22 × 6, `ink`), others `faint`.
  - `game-hint` (footnote, ink2, centered) `Swipe right for Me, left for Not me.`; `game-peek-hint` under it `Not sure? Tap it for another outfit.`.
  - Dock: `game-notme` (a View around `KButton kind="secondary" title="Not me"`) and `game-me` (around `KButton kind="primary" title="Me"`), side by side, Not me on the left (it mirrors the swipe), 50 pt (`size="large"`); at accessibility sizes stacked, Me on top. Taps while a card is leaving are ignored.
- **Ranking stage:** `rank-title` (largeTitle, header) `Now put them in order`; `rank-line` `You said Me to {n}. Tap the one that's more you.` (n = his Me's). Two Pressables mid-screen, `rank-pick-left` and `rank-pick-right`, each the look's **second** drawing (`Outfit`, w ≈ 150) on `surface2`, role `button`, label `t(descKey(look, 1))`. A tap: `Haptics.impactAsync(Light)`, the picked one gets a 2.5 pt ink ring and the other fades to 0.35 for 260 ms (120 ms under Reduce Motion), then `pickInRanking`. Taps during that wait are ignored. No dots.
- **Results stage:** `GameResults` (below).
- VoiceOver focus: after an answer, the new card; on entering ranking, `rank-title`; on entering results, `results-title`.

### `GameCard({ look, index, peek, lean, dragDx?, onAnswer, onPeek, onLeaned })`
- `game-card`: the card (surface, 1 pt line border, radius 18, shadow; about 300 pt wide, 240 at accessibility sizes), the drawing `Outfit` of `LOOKS[look].outfits[peek]` (w ≈ 170) on `surface2`.
- `game-card-dot-0`, `game-card-dot-1` (hidden from VoiceOver): the shown outfit's dot `ink` at 0.85, the other `faint` at 0.5.
- `game-stamp-me` (`Me`, filled primary, on the card's left, rotated −10°) and `game-stamp-notme` (`Not me`, outlined ink, on the right, +10°), both hidden from VoiceOver; opacity from `swipeFeedback(dx)`.
- VoiceOver: one element, `accessible`, label `t('game.card.a11y', { n: index + 1, view: peek + 1, desc })` (`Outfit 3 of 8, view 1 of 2. {description}`; founder question F2), `accessibilityActions=[{ name: 'anotherOutfit', label: 'Another outfit' }]`, `onAccessibilityAction` → `onPeek`. After a peek the new label is announced (`AccessibilityInfo.announceForAccessibility`).
- Gesture (PanResponder): it claims the touch on start, and gives it up to the scroll view when `cardYields(dx, dy)`. While moving: `translateX = dx`, `rotate = dx / 22` degrees, the stamps and the lit button follow `swipeFeedback`, and `Haptics.selectionAsync()` fires each time `|dx|` crosses 90 outward. On release, `cardRelease(dx, dy)`: `peek` → `onPeek` (no answer); `me` / `notMe` → `onAnswer`; `spring` → back to 0. An answer (tap or swipe): `Haptics.impactAsync(Light)`, the matching stamp shows, and the card leaves from where it is per `cardExit` (fly off to the answered side, or fade under Reduce Motion); then the session moves on.
- Lean: when `shouldLean(...)` is true, 1400 ms after it appears the card leans right then left once (≈ ±18 pt, the stamps peeking with it, as page.html's `nudge`), then `onLeaned`. Any touch first cancels it and marks it leaned.
- `dragDx` (demo only): drawn held at that offset.

### `GameResults` (no props; reads the session)
- `results-title` (largeTitle, header) and `results-line` (body, ink2), by `resultsHead`:
  - `top`: `Here's your style` / `Your top looks, in order. Not quite right? Drag, remove or add one.`
  - `one`: `Here's your style` / `Your top look. Not quite right? Add one, or play again.`
  - `empty`: `Here's your style` / founder question F3 (draft `Add a look, or tell me in your words.`)
  - `none`: `Nothing clicked yet` / `Add a look you like, play again, or tell me in your words.`
- `results-list`; rows `results-row-0` … `-2`. Each row is one VoiceOver element: label `t('game.results.rowA11y', { n, total, name, line })` (`1 of 3, Classic prep. Blazers, polos, knits, chinos, loafers`), `accessibilityActions` = Move up (not on the first row), Move down (not on the last), Remove, with names `moveUp`, `moveDown`, `remove`. Inside, hidden from VoiceOver: the first drawing (`Outfit` w ≈ 42 on `surface2`) with `results-row-<i>-number` (a 22 pt ink disc with `1`/`2`/`3`) on its top-left corner, the name (`styleLabel`, body 600) and line (`lookLine`, footnote ink3), `results-row-<i>-remove` (×: a 44 × 44 pressable holding a 28 pt `surface2` circle, icon `close`), `results-row-<i>-handle` (44 × 44, icon `line.3.horizontal`). At accessibility sizes the name and line go under the drawing.
- Drag (the handle's PanResponder): the row lifts (shadow, zIndex) and follows the finger; the others slide by one row's pitch to make room; `dragTarget` gives the landing place, and `Haptics.selectionAsync()` fires each time it changes. On release: `Haptics.impactAsync(Light)` and `moveInResults(from, to)` when they differ, else everything slides back. The ScrollView stops scrolling while a row is held.
- A move (drag or VoiceOver) announces `t('game.results.moved', { name, n, total })` (founder question F4).
- ×: `removeFromResults(i)`, then `showToast(t('game.results.removed', { name }), () => undoChange(token))` (the app's toast, 5 s, 10 s with VoiceOver, #36). Focus moves to the next row's element, or to `results-add` when none is left.
- `results-add` (`Add a look`, always shown, 50 pt, a dashed `faint` border, radius 18, plus icon): `router.push('/onboarding/add-look')`.
- His words, under it:
  - no words, field closed: `results-words-link` (`Not quite you? Tell me in your words`, a text link, 44 pt tall) → `openWords()`.
  - field open: `results-words-input` (placeholder `Like skater, or all black`, `maxLength` 80, `returnKeyType="done"`, label founder question F5 (draft `Your style in your words`), `maxFontSizeMultiplier` = `CONTROL_TEXT_MAX_SCALE`), focused 50 ms after it mounts (the Nov 11 lesson in `looksOwnWords.test.tsx`); a blur doesn't close it; `results-words-done` (`Done`) and the keyboard's Done call `saveWords`. Each change calls `setWords` (Continue turns on at once).
  - saved: `results-words-saved` (`In your words: "{words}"`) and `results-words-edit` (`Edit`) → `openWords()`.
- Dock: `results-continue` (a View around the full-width primary `KButton` `Continue`, disabled unless `canContinue(picks, words)`) → `continueToAbout(store)` → `router.push('/onboarding/basics')`; a failed write leaves him here with Continue working again. `results-play-again` (`Play again`, a text button under it, 44 pt) → `playAgain(store)`.
- The ScrollView rides the keyboard as today's Looks did (`KeyboardAvoidingView behavior="padding"`; the dock isn't absolutely positioned), and scrolls the field into view when it opens.

### `AddLookSheet` (route `/onboarding/add-look`, a form sheet)
- `SheetScaffold` titled `Add a look` with its X (`Close`), its ScrollView the root (CLAUDE.md trap).
- One `LookTile` per `lookChoices(picks)`, two columns (one at accessibility sizes), `selected={false}`, `shake={0}`, `testID` `addlook-tile-<look>`, VoiceOver as today's tile (`{name}: {line}`).
- A tap: `addToResults(store, look)`, `Haptics.selectionAsync()`, `router.back()`. When `replaced` isn't null: `showToast(t('game.results.swapped', { name, old }), () => undoChange(token))`. When it was added last: announce founder question F4's add line (draft `Added {name}`).
- Opened with no session in results (a stale link): closes at once.

### `LookTile` (one prop added)
`testID?: string` on the tile's `Pressable`. Everything else unchanged.

### Demo screens
| n | name | set-up (`styleGame:` in the scenario, all `firstRun`, `onboarded: false`, `/onboarding/looks` unless said) |
|---|---|---|
| 2 | Style game · card 1 (was "Pick looks") | `{ seed: 42, me: [], cards: 0 }` (card 1 is Workwear) |
| 300 | Style game · card 3 | `{ seed: 42, me: ['workwear'], cards: 2 }` (card 3, Streetwear, first outfit) |
| 301 | Style game · the other outfit | as 300, `peek: 1` |
| 302 | Style game · swiped past the line | as 300, `dragDx: 120` (the Me stamp, Me lit) |
| 303 | Style game · put them in order | `{ seed: 42, me: ['workwear','streetwear','outdoor','vintage_sport'], rounds: 0 }` |
| 304 | Here's your style · three looks | as 303, `prefer: ['streetwear','vintage_sport','outdoor','workwear']` (Streetwear, Vintage sport, Outdoor) |
| 305 | Here's your style · one look | `{ seed: 42, me: ['minimalist'] }` |
| 306 | Here's your style · removed, Undo | as 304, `then: [{ remove: 1 }]`, `toast: true` (`Removed Vintage sport`) |
| 307 | Here's your style · in and out, Undo | `{ seed: 42, me: ['outdoor','vintage_sport','workwear'], prefer: ['outdoor','vintage_sport','workwear'], then: [{ add: 'streetwear' }], toast: true }` |
| 308 | Here's your style · typing his words | as 304, `editingWords: true`, `words: 'skater but clean'` |
| 309 | Here's your style · his words saved | as 304, `words: 'all black'` (saved) |
| 310 | Nothing clicked yet | `{ seed: 42, me: [] }` |
| 311 | Nothing clicked yet · his words | as 310, `words: 'all black'` (Continue on) |
| 312 | Add a look | as 305 plus `{ add: 'workwear' }` (two looks); href `/onboarding/add-look` under `/onboarding/looks` |
| 313 | Here's your style · every look removed | as 305, `then: [{ remove: 0 }]` |
`scenarios.test.ts`'s "only the onboarding screens run before onboarding" list becomes `[1, 2, 3, 4, 130…137, 300…313]` (numbers checked free on Nov 18: main's highest is 291; T94 takes 292–296).

## Data
- **kv:** `looks.notMe` (new, synced, kept after setup, wiped with "Delete all my data"); `onboarding.styleGame` (new, local, deleted by `finishSetup`); `onboarding.looks`, `onboarding.otherStyle` as today (written on Continue; his words also on Done); `onboarding.step` as today (Welcome writes `looks`, Continue writes `basics`). No table or profile column changes.
- **Sent:** nothing. The game makes no request. Kit gets his looks (`profile.styles`) and words (`onboarding.otherStyle`) as today; `looks.notMe` isn't read by anything yet.
- **Words** (`en.ts`, `addedInBuild`, one T113 block; drafts the founder confirms, #487 and #507):
  - `game.title` `Me or not me?` · `game.line` `One outfit at a time. Would you wear something like this?` · `game.me` `Me` · `game.notMe` `Not me` · `game.hint` `Swipe right for Me, left for Not me.` · `game.peekHint` `Not sure? Tap it for another outfit.` · `game.card.a11y` `Outfit {n} of 8, view {view} of 2. {desc}` (F2) · `game.anotherOutfit` `Another outfit`
  - `game.order.title` `Now put them in order` · `game.order.line` `You said Me to {n}. Tap the one that's more you.`
  - `game.results.title` `Here's your style` · `game.results.line` `Your top looks, in order. Not quite right? Drag, remove or add one.` · `game.results.lineOne` `Your top look. Not quite right? Add one, or play again.` · `game.results.lineEmpty` (F3) · `game.none.title` `Nothing clicked yet` · `game.none.line` `Add a look you like, play again, or tell me in your words.`
  - `game.results.add` `Add a look` · `game.results.words` `Not quite you? Tell me in your words` · `game.results.wordsSaved` `In your words: "{words}"` · `game.results.wordsA11y` (F5) · `game.results.playAgain` `Play again` · `game.results.removed` `Removed {name}` · `game.results.swapped` `{name} in, {old} out` · `game.results.rowA11y` `{n} of {total}, {name}. {line}` · `game.results.moveUp` `Move up` · `game.results.moveDown` `Move down` · `game.results.remove` `Remove` · `game.results.moved` (F4) · `game.results.added` (F4) · `game.sheet.title` `Add a look`
  - Reused: `onb.looks.continue` `Continue`, `onb.looks.else.placeholder` `Like skater, or all black`, `common.edit`, `common.done`, `common.close`, `common.undo`, `common.back`, `onb.looks.tileA11y`, `style.*`, `onb.looks.line.*`.
  - `game.desc.<look>.<0|1>`, 16 VoiceOver descriptions (F1): the spec's one, `Grey hoodie, washed wide jeans, chunky white sneakers`, and the mockup's `DESC` for the rest in the app's spelling (grey), corrected for T94's three redraws: streetwear.1 `Black crewneck, wide olive cargos, chunky black sneakers`; outdoor.0 `Slate blue zip jacket, grey cargos, grey trail shoes`; outdoor.1 `Oatmeal zip pullover, dark olive cargos, orange trail shoes`.

## Steps
1. Read `logic.js` and `views.js` on the fail-safe branch, `page.html` for sizes, and `ConfirmDeck.tsx` for the PanResponder pattern. Check memory.
2. `styleGame.ts` and `T113-styleGame.test.ts`. The port must reproduce the golden deals for seeds 1 and 42 before anything else.
3. `styleGameSession.ts`, the two keys in `basics.ts`, `sync/schema.ts`'s two lines, `finishSetup`'s change, and `T113-styleGameSession.test.ts` (memory store).
4. **Wait for T94's app commit and rebase** (Picking up T94). Re-run 2–3.
5. The screens: `StyleGameScreen`, `GameCard`, `GameRanking`, `GameResults`, `AddLookSheet`, the routes, `_layout.tsx`, `LookTile`'s testID; delete `PickLooksScreen.tsx`; `en.ts`.
6. `styleGameTestKit.ts` and `T113-styleGameScreens.test.tsx`.
7. The demo screens (scenarios, prepareDemoScreen).
8. Update the T39 tests that walked the grid (keeping every assertion that still holds):
   - `T39-setupScreens.test.tsx`: OS3.1 mounts `StyleGameScreen` and checks `game-title` = `Me or not me?` (no bubble, no Kit, same 4 looks × 2 account states); OS3.2's Looks part plays the game (`playStyleGame`) and checks `onboarding.step` = `basics` and `router.push('/onboarding/basics')`; F1.1's walk plays the game. **Retired:** the two OS3.3 tests (the grid's title and tiles): superseded by the spec's "Changes to other specs" (OS3's Looks bullet gives way to the game). Their SG replacements are in TESTING.md. Write the retirement and its reason in TASK.md.
   - `T39-offerCard.test.tsx` › OS5.7's `walkToCard` plays the game.
   - `looksOwnWords.test.tsx`: the three tests move to the results screen's words link and field (the blur and focus lessons hold there).
   - `scenarios.test.ts`: the before-onboarding list.
9. Flows: `play-style-game.yaml`, `T113-style-game.yaml`, and the four T39 setup flows plus `T39-screens.yaml`'s screen 2 block. The fresh-install flows tap the server as `http://.*:${PORT || '8081'}` (today they hard-code 8081).
10. `npm run check` alone; then the flows on the Simulator on 8082 (one at a time); then screenshots of every demo screen in light, dark and AX5 into `tasks/T113/shots/`.
11. TASK.md: what was built, retired tests, the defaults used (for the coordinator to log as #501), what wasn't seen on iOS.

## Must not break
- Style profile's tiles (`app/(tabs)/you/profile.tsx`): unchanged, all 8 after T94.
- About you, Restore ("Welcome back"), the under-18 stop, Kit's first-check offer, the camera's agreement (OS4, OS5): unchanged. `finishSetup` still saves looks in order as `picksToStyles` weights and keeps `onboarding.otherStyle`.
- Nothing is sent before Agree (OS5.7, F1.3), and no request builder reads `looks.notMe`.
- Resume: a close on About you still reopens About you; Back from it reopens results (from the draft after a relaunch).
- Picks never change a score (F9.2): the game writes only kv; scoring and core are untouched.
- No emoji, no all-caps, no person in any drawing (the drawings are the closet's flats).

## Open questions
**For the founder** (taste and words; each has a recommended draft the build uses until he answers)
- **F1 · The 16 VoiceOver descriptions.** The spec gives one (`Grey hoodie, washed wide jeans, chunky white sneakers`); the mockup's `DESC` has the rest but spells it "Gray", orders "wide washed", and still describes the three drawings T94 redraws. Recommended: the spec's line, the mockup's others in the app's spelling (grey, as the closet's colors), with the three redrawn: `Black crewneck, wide olive cargos, chunky black sneakers`; `Slate blue zip jacket, grey cargos, grey trail shoes`; `Oatmeal zip pullover, dark olive cargos, orange trail shoes`.
- **F2 · What VoiceOver reads on a card.** SG9 says `Outfit 3 of 8. {description}`; FS1 (SG7) says `Outfit 3 of 8, view 2 of 2. {description}`. Recommended: always `Outfit 3 of 8, view 1 of 2. …` (the mockup's, and it tells a VoiceOver user there's a second outfit before he looks for one).
- **F3 · Results after he removes every look he had.** The spec has no words for this state. Recommended: title `Here's your style`, line `Add a look, or tell me in your words.` (the mockup's).
- **F4 · What VoiceOver announces after a move and an add.** "Moves and removals are announced" (SG9), no words given; a removal announces its toast. Recommended: `{name}, now {n} of {total}` after a move; `Added {name}` after an add that doesn't replace one.
- **F5 · The words field's VoiceOver label.** Recommended: `Your style in your words` (the mockup's).
- **F6 · Quote marks in `In your words: "…"`.** The spec uses straight quotes, the mockup curly. Recommended: straight, like today's `"{words}"` on the old tile.

**Technical defaults** (Claude's, for the coordinator to log as #501)
1. **The game lives in memory, the results in kv.** Back to Welcome and forward resumes the same deal and answers (FS Back, SG7.4); a relaunch mid-game deals a new game (SG8.1); results are drafted in local kv `onboarding.styleGame` and reopen after a relaunch with no Back history (Back there goes to Welcome).
2. **Back never undoes his words,** and Play again clears Back's history (so Back on its card 1 goes to Welcome, as SG1 says for card 1). The mockup did both differently (its Back reverted saved words and undid Play again). Words have their own Edit, and SG1 sends card 1's Back to Welcome.
3. **A results list emptied by ×** (he had Me's) shows `Here's your style` with F3's line; the Nothing clicked title is only for Not me to all 8 (the mockup's rule). Once he adds a look from Nothing clicked, the title becomes `Here's your style`.
4. **Not me's saved** = the cards he said Not me to, minus any look on his final list (a look he adds back isn't a Not me), in `GAME_LOOKS` order; `[]` when there are none.
5. **A card restored by Back** shows the outfit it showed when he answered (the mockup's); the next new card always starts on its first outfit (FS1).
6. **The native swipe-back is off on the Looks route** (`gestureEnabled: false`): a Me swipe that starts near the left edge would otherwise pop the screen. The Back circle does everything.
7. **A tap is a press that moves less than 6 pt in any direction** (hypot), not only sideways (the mockup measured dx only); the spec says "moves under 6 pt".
8. **The card claims the touch on start and yields to the scroll view on a vertical move** (ConfirmDeck's 10 pt / 12 pt rule), so the screen still scrolls at AX5 where the card sits under the fold (#487's known limit).
9. **The Add a look sheet is a route in the onboarding stack** (`/onboarding/add-look`, a form sheet) rather than `app/sheets/`, which keeps the root `_layout.tsx` (outside the lane) untouched.
10. **`sync/schema.ts` gets two lines** (outside the lane): `looks.notMe` synced, `onboarding.styleGame` local. `privacy/wipe.ts` gets none (the wipe already empties every kv key).
11. **The toast** is the app's (5 s, 10 s with VoiceOver, #36), not the 8 s removal window (#118): Back also undoes it.
12. **Haptics:** selection on crossing the swipe line outward and on a dragged row changing place; light impact on an answer, a this-or-that tap and a row drop. None on peek or on opening the sheet.
13. **Demo screens 300–313** and a fixed deal (seed 42) on screen 2, so screenshots repeat.
14. **The T39 OS3.3 tests are retired, not rewritten:** the criterion's text ("its tiles and buttons behave as before") describes the grid the game replaces. The spec's OS3.3 line itself should be marked superseded in `specs/onboarding-screens.md` in the founder's review (T112's file, not this task's).

**For the coordinator**
- **T1 · T94's TL4.1 test and flow** render the grid T113 removes (Picking up T94 → 5). Recommended: T94's test writer points them at `LOOKS` and Style profile before T94 locks.
- **T2 · The plan line has no "checks:".** This plan covers every acceptance criterion the spec lists (SG1.1–SG9.1, SG7.1–SG7.4, F1.1); add them to T113's line.
- **T3 · SG1.1's sample size.** "Over 2,000 seeded deals every look is first 12.5% ± 1.5%" is about two standard errors, so a correct but differently seeded shuffle would fail it about 3 times in 10. With the mockup's generator ported exactly, seeds 1–2000 give 11.50–13.35% (checked Nov 18), so the test is stable *because* the port must be exact (the golden deals pin it). TESTING.md adds #486's stronger check (80,000 deals, every look at every position 12.5% ± 0.5) beside it.

## Coordinator's answers (Nov 18, overnight; the founder is asleep)
The founder told the coordinator to build tonight and show him in the morning (#500). His questions F1–F6 take the planner's recommended drafts, all marked `draft, founder to confirm (specs/style-game.md)` in `en.ts`, and listed for him in the PR:
- **F1:** the planner's 16 descriptions, including the three rewritten for T94's redraws. **F2:** always `Outfit 3 of 8, view 1 of 2. …`. **F3:** `Here's your style` / `Add a look, or tell me in your words.`. **F4:** `{name}, now {n} of {total}` and `Added {name}`. **F5:** `Your style in your words`. **F6:** straight quotes.
- **Technical defaults 1–14:** accepted as written (logged as #501).
- **T1:** asked T94's session to point TL4.1's test and flow at `LOOKS` and Style profile before its tests lock, and to push its app-facing commit early. **T2:** checks added to the plan line. **T3:** keep the 80,000-deal check beside SG1.1 (golden deals pin the port).
