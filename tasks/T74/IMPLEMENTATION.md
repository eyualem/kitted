# T74 · The piece questions, one card at a time

**From:** `plan.md` → T74 · **Spec:** `specs/closet-beta.md` → CB2 and CB2.1–CB2.10 (approved by the founder 2026-11-08; CB2 item 5 and CB2.4 changed with his yes on 2026-11-10, DECISIONS-LOG #432) · **Design:** `tasks/T74/DESIGN.md` (approved 2026-11-10; frames `tasks/T74/design.html`, `tasks/T74/design/*.png`) · **Lane:** Closet · **Stacked on:** T73 (`claude/t73-closet-no-outfits`, PR #84)

## Goal
Closet's To confirm card shows one question at a time with `{n} of {total}` in its tag line; he answers with today's buttons (the next card slides in, toast with Undo) or moves on with `Skip ›` or a sideways swipe, which never answer; the pictures are 96 × 110 so the card is about 312 pt tall instead of about 378.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `app/src/features/closet/toConfirm.ts`: rewritten as the deck's pure rules (below). `TO_CONFIRM_MAX` and the 3-at-a-time `toConfirm(open)` go.
- `app/src/features/closet/ConfirmDeck.tsx` (new): the deck component: which card shows, the tag line, Skip/answer moves, the swipe, the slide or cross-fade, the haptic, VoiceOver focus.
- `app/src/features/closet/DuplicateQuestion.tsx`: a `deck` mode (new optional prop). Without `deck` it renders exactly as today (the score card's `compact` question and the Added sheet keep today's look; spec Scope → Out).
- `app/src/features/closet/FitQuestion.tsx`: a `deck` mode (new optional prop). Without `deck` it renders exactly as today (the Outfits fit card, switch on, CB1.5).
- `app/src/app/(tabs)/closet/index.tsx`: the To confirm block becomes `<ConfirmDeck>`; the ScrollView locks while a swipe is under way; VoiceOver focus goes to the first section title after the last card leaves.
- `app/src/i18n/en.ts` (shared): two strings in `addedInBuild` (below).
- `app/src/design-system/components/KButton.tsx` (shared design system, used by every lane; **needs the coordinator's OK**, see Open questions): `TextLink` gets an optional `trailingIcon`; a small exported helper `trailingIconMetrics`.
- `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts` (outside the plan line's list; the spec's Touches names "a demo screen with 5 questions"; see Open questions): screens 262, 263, 264 and their stories.
- `app/src/__tests__/closetBatch287.test.ts` › `C2` is a spec-driven test change done by the **test writer**, not the implementer (see Must not break).

Not touched (the verifier checks the diff): `features/closet/service.ts`, `features/closet/answerToast.ts`, `features/closet/fitDoubt.ts`, `features/closet/askEvidence.ts`, `features/closet/askText.ts`, `features/added/AddedSheet.tsx`, `features/stylist/cards/FitCheckCard.tsx`, `features/toast/**`, `design-system/components/{Chip,MonoLabel,KText,KCard,Icon}.tsx`, `design-system/theme.tsx`, `app/src/app/_layout.tsx`, `@kitted/core`, the Python engine. No new package.

## Interfaces
What the tests call. The test writer reads only this section.

### The deck's rules (`features/closet/toConfirm.ts`, pure; imports nothing from React Native)
**Never write the word `FitQuestion` or `fitCard(` in this file or in `ConfirmDeck.tsx`, not even in a comment**: `fitDoubt.test.ts` › "never on a score card" lists every file that mentions either and expects exactly `app/(tabs)/closet/index.tsx`, `features/closet/FitQuestion.tsx`, `features/closet/fitDoubt.ts`.

- `type DeckCard<Q, F> = { kind: 'dup'; key: string; q: Q } | { kind: 'fit'; key: string; fit: F }`
- `dupKey(obsId: string): string` → `` `dup:${obsId}` `` · `fitKey(itemId: string): string` → `` `fit:${itemId}` ``
- `toConfirm<Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>(open: readonly Q[], fit: F | null): DeckCard<Q, F>[]`: every open question in the order given (the screen passes `openAsks()` order, newest first, as today), then the fit question last if there is one. Keys `dupKey(q.ask.obsId)` / `fitKey(fit.item.id)`. No cap: 4 open + a fit → 5 cards; `([], null)` → `[]`.
- `showsSkip(cards: readonly { kind: 'dup' | 'fit' }[]): boolean`: `false` only when the deck is exactly one `dup` card; `true` for 2+ cards and for a lone `fit` card. (`[]` → `false`.)
- `deckCount(keys: readonly string[], key: string): { n: number; total: number }` → `{ n: keys.indexOf(key) + 1, total: keys.length }`.
- `stepDeck(keys: readonly string[], key: string, dir: 1 | -1): string`: the next (`1`) or previous (`-1`) key, wrapping at both ends. One key → that key. Examples on `['a','b','c','d','e']`: `('e', 1)` → `'a'`; `('a', -1)` → `'e'`; `('b', 1)` → `'c'`.
- `interface DeckState { key: string | null; undoKey: string | null }`
- `startDeck(keys: readonly string[]): DeckState` → `{ key: keys[0] ?? null, undoKey: null }` (a fresh mount always starts on card 1).
- `markAnswered(state: DeckState, key: string): DeckState` → `{ ...state, undoKey: key }` (remembered so Undo can bring it back).
- `type DeckMove = 'none' | 'forward' | 'back' | 'appear' | 'empty'`
- `reconcileDeck(prev: DeckState, prevKeys: readonly string[], keys: readonly string[]): { state: DeckState; move: DeckMove }`: what shows after the deck's cards change (an answer landed, Undo, a Skip on the fit card, a question answered elsewhere, a new question). Rules, first match wins:
  1. `keys` empty → `{ key: null, undoKey: prev.undoKey }`, move `'empty'` if `prevKeys` was non-empty, else `'none'`.
  2. `prevKeys` empty → key = `prev.undoKey` if it is in `keys`, else `keys[0]`; `undoKey: null`; move `'appear'`.
  3. `prev.undoKey` is in `keys` and was not in `prevKeys` (Undo) → key = `prev.undoKey`, `undoKey: null`, move `'back'`.
  4. `prev.key` is in `keys` → unchanged key, move `'none'` (a new question arriving or another one leaving only changes the numbers).
  5. `prev.key` is gone → key = the first key after `prev.key` in `prevKeys` that is still in `keys`, else `keys[0]` (wrap); `undoKey` kept; move `'forward'`.
  - Examples: prev `{key:'b'}`, `['a','b','c','d','e']` → `['a','c','d','e']`: key `'c'`, `deckCount` `2 of 4`, `'forward'`. Then Undo (prev `{key:'c', undoKey:'b'}`, → `['a','b','c','d','e']`): key `'b'`, `2 of 5`, `'back'`. prev `{key:'e'}` (fit, last) → `['a','b','c','d']`: key `'a'`, `1 of 4`, `'forward'`. prev `{key:'b'}`, a new `'z'` in front → `['z','a','b','c','d','e']`: key `'b'`, `3 of 6`, `'none'`. prev `{key:'a'}`, `['a']` → `[]`: `'empty'`; then Undo (prev `{key:null, undoKey:'a'}`, `[]` → `['a']`): key `'a'`, `1 of 1`, `'appear'`.
- `swipeStart(dx: number, dy: number): 'claim' | 'fail' | 'wait'`: `|dy| >= 10` → `'fail'` (checked first); else `|dx| >= 12` → `'claim'`; else `'wait'`. The deck keeps a `'fail'` until the finger lifts.
- `swipeStep(dx: number, vx: number, width: number, count: number): -1 | 0 | 1` (`dx` in pt, `vx` in pt/s, `width` the card's width): `count <= 1` or `dx === 0` → `0`; it commits when `|dx| >= width / 3`, or `|vx| >= 500` with `vx` the same sign as `dx`; a commit returns `1` (next) for a finger moving left (`dx < 0`) and `-1` (previous) for right. Examples, width 362: `(-121, 0, 362, 5)` → `1`; `(-120, 0, 362, 5)` → `0`; `(40, 600, 362, 5)` → `-1`; `(40, -600, 362, 5)` → `0`; `(-200, 0, 362, 1)` → `0`.
- `cardMotion(reduceMotion: boolean): { kind: 'slide' | 'fade'; ms: number }` → `false`: `{ kind: 'slide', ms: 240 }`; `true`: `{ kind: 'fade', ms: 150 }`.
- `followsFinger(reduceMotion: boolean): boolean` → `!reduceMotion` (with Reduce Motion the card doesn't track the drag; a committed swipe cross-fades).
- Constants: `DECK_MOTION = { slideMs: 240, fadeMs: 150, springMs: 200, gap: 16 }`, `SWIPE = { startX: 12, failY: 10, commit: 1 / 3, flick: 500 }`.
- `deckTag(n: number, total: number): string` → `t('closet.confirm.count', { n, total })`, e.g. `deckTag(2, 5)` → `2 of 5`.
- `deckA11y(n: number, total: number): string` → `t('closet.confirm.a11y.question', { n, total })`, e.g. `Question 2 of 5.`

### The deck (`features/closet/ConfirmDeck.tsx`)
- `interface DeckSlot` (what each card gets):
  - `n: number`, `total: number`: this card's place now.
  - `a11yPrefix: string`: `deckA11y(n, total)`.
  - `showSkip: boolean`: `showsSkip(cards)`.
  - `next(): void`: a dup card's Skip and its VoiceOver "Skip" action: shows `stepDeck(keys, key, 1)`, saves nothing, no haptic.
  - `willAnswer(): boolean`: an answer chip calls it before saving. `true`: light haptic (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`, iOS only, as other haptics in the app are gated), and `markAnswered` for this card's key. `false` (a second answer tap on the same card within 1000 ms of the first): the tap is ignored, nothing saved.
  - `focusRef(node: View | null): void`: the card attaches its question's accessible element so VoiceOver focus can move to it.
- `interface ConfirmDeckProps<Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>`:
  - `cards: readonly DeckCard<Q, F>[]`
  - `tag: string`: the tag line's left words (the screen passes `t('closet.confirm.tag')`).
  - `renderCard(card: DeckCard<Q, F>, slot: DeckSlot): ReactNode`: the card's body (the screen renders `DuplicateQuestion` / `FitQuestion` here, so the R10 `onAnswer` line stays in `index.tsx`).
  - `onSwipingChange?(swiping: boolean): void`: `true` when a pan is claimed, `false` when it ends or is cancelled (the screen sets its ScrollView's `scrollEnabled`).
  - `onEmptied?(): void`: called once when the deck goes from 1+ cards to none (the last answer, the lone fit card's Skip or pick, or answered elsewhere).
- `ConfirmDeck<Q, F>(props): ReactElement | null`:
  - No cards → renders `null`, **and stays mounted** (the screen always renders it in the pieces branch), so Undo after the last answer can bring the card back.
  - Otherwise one `KCard` (never a second card or a peek, except the neighbour card during a drag or a move), with `KCardSection gap={12}`: the tag line `TagLine left={tag} right={deckTag(n, total)}` inside a `View` with `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` (`testID="closet-confirm-tag"`), then `renderCard(card, slot)`.
  - State: `useState(() => startDeck(keys))`; on every change of `cards`' keys, `reconcileDeck(state, prevKeys, keys)`; `move` picks the animation: `'forward'` outgoing to the leading side, incoming from the trailing side; `'back'` the reverse; `'appear'` fade in (150 ms) and the pieces pushed down; `'empty'` fade out (150 ms) while the pieces move up (240 ms), then `onEmptied()`; with Reduce Motion every move is `cardMotion(true)` (cross-fade 150 ms) and heights jump.
  - Skip (dup) and swipe set the key directly (`stepDeck`), move `'forward'` for next, `'back'` for previous.
  - Swipe: React Native `PanResponder` on the card's outer `View` (`testID="closet-confirm-card"`), using `onMoveShouldSetPanResponderCapture` with `swipeStart` (so a pan that starts on a chip, on Skip or on the fit row takes the touch and cancels that press), `onPanResponderTerminationRequest: () => false`, `onSwipingChange(true)` on grant and `(false)` on release/terminate. While dragging (unless Reduce Motion) the card follows `dx` and the neighbour card (`dx < 0`: next, `dx > 0`: previous) follows 16 pt behind, top-aligned, absolutely positioned so the section keeps the current card's height. On release `swipeStep(dx, vx × 1000, width, count)`: `0` springs back (~200 ms), else the move finishes (the rest of 240 ms) or cross-fades with Reduce Motion. A swipe never calls `willAnswer`, never writes anything, and on the fit card never skips it.
  - VoiceOver focus: after every card change (Skip, swipe, answer landed, Undo, answered elsewhere when it was the shown card), `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(node))` on the new card's `focusRef` node, once the move's animation ends. After an answer, it first waits for `AccessibilityInfo`'s `announcementFinished` event or 1500 ms, whichever comes first, so the toast's line isn't cut off. Nothing moves focus on `'none'` (a new question arriving).
  - Height: the card section's height eases to the new card's over 240 ms and the pieces below move with it (e.g. Reanimated `LinearTransition` on the deck's wrapper and on the pieces' wrapper in `index.tsx`); none with Reduce Motion.
  - testIDs: `closet-confirm-deck` (the wrapper), `closet-confirm-card` (the shown card's outer View, with the pan handlers), `closet-confirm-tag` (the hidden tag line's wrapper).

### `DuplicateQuestion` (`features/closet/DuplicateQuestion.tsx`)
- `DuplicateQuestionProps` gains `deck?: DeckSlot`. Without it: exactly today's output (pictures `min(compact ? 120 : 150, …)` wide, ratio `compact ? 1 : 1.15`; question `KText` with `accessibilityRole="header"` and label `closet.q.a11y`; no Skip).
- With `deck`:
  - The question and its reason sit in one `View` with `accessible`, `accessibilityRole="header"`, `accessibilityLabel={`${deck.a11yPrefix} ${t('closet.q.a11y', { question, item, reason })}`}` (e.g. `Question 2 of 5. Is this your brown crewneck? They look a lot alike. This photo and your brown crewneck are shown side by side.`), `ref={deck.focusRef}`, `testID="closet-confirm-question"`, and when `deck.showSkip` `accessibilityActions={[{ name: 'skip', label: t('tap.skip') }]}` with `onAccessibilityAction` → `deck.next()` for `actionName === 'skip'`. Gap 3 between question and reason. The score line (`closet.q.scoreSame`, while `ev.answered < SCORE_LINE_UNTIL`) stays its own element under them (gap 3), read after the question.
  - Pictures: margin top 10, side by side gap 12, left-aligned, each **96 wide × 110 tall** (`Frame` gets `w=96`, `h=110`), radius 14, hidden from VoiceOver as today; captions `caption` `ink2`, gap 4, centred under the picture; at accessibility sizes the pictures stack (gap 10), stay 96 × 110, left-aligned, and each caption runs the card's full width, leading-aligned (frame phone 8). testIDs on the two frames' wrappers: `closet-confirm-photo`, `closet-confirm-incloset`.
  - Answers: `ChipFlow` (label = the question), margin top 4, today's `Chip small` answers (`item.dup.yes`, `item.dup.no`, `item.dup.runnerUp` when there's a runner-up). Each answer's press: `if (!deck.willAnswer()) return;` then `onAnswer(a)` (today's `setChanging(false)` kept).
  - Skip (only when `deck.showSkip`): a `View` 44 pt tall (`minHeight: 44`, centred), `testID="closet-confirm-skip"`, holding `<TextLink title={t('tap.skip')} trailingIcon="next" compact onPress={deck.next} />` (VoiceOver: `Skip`, button, no hint).
    - **Two answers, default sizes:** the Skip box is the `ChipFlow`'s last child with `marginLeft: 'auto'`, so it trails on the answers' row and wraps to a line of its own by itself when it doesn't fit (a 375 pt phone, Bold Text), still trailing; no negative margin in that case (critic round 2, polish 3).
    - **A third answer (runner-up) or accessibility sizes:** the Skip box is its own row under the `ChipFlow`, trailing (`alignItems: 'flex-end'`); `marginBottom: -12` only at non-accessibility sizes (its target uses the card's bottom padding; the visible gap under it stays 16), `0` at accessibility sizes (critic round 2, polish 2).
    - Not shown, and no "Skip" action, when `deck.showSkip` is false (a lone "Is this your …?" question).

### `FitQuestion` (`features/closet/FitQuestion.tsx`)
- `FitQuestion({ item, doubt, deck }: { item; doubt; deck?: DeckSlot })`. Without `deck`: exactly today's output (Skip at the leading side under the question, label `${question} ${seen}`).
- With `deck`: the `Pressable` row as today (tile 64 × 64, `callout` 600 question, `footnote` `ink3` seen line, chevron `next` 13 pt semibold `ink3`; tap → `router.push(editHref(item, doubt.field, 'card'))`) plus `accessibilityLabel={`${deck.a11yPrefix} ${question} ${seen}`}`, hint `closet.unsure.a11y.hint` as today, `ref={deck.focusRef}`, `testID="closet-confirm-fit"`, and `accessibilityActions={[{ name: 'skip', label: t('tap.skip') }]}` → its own `skip()`. Skip is a separate row under the fit row, trailing, the same 44 pt Skip box (`testID="closet-confirm-skip"`, `TextLink` `trailingIcon="next" compact`), `marginBottom: -12` at non-accessibility sizes. Its press is today's `skip()` (writes `FIT_SKIP_KEY` with `withSkip(skips, item.id, doubt, sessionClock.nowMs())`); no toast, no haptic. `deck.showSkip` is always true for a fit card.

### `TextLink` (`design-system/components/KButton.tsx`)
- `TextLinkProps` gains `trailingIcon?: SymKey` (a key of the symbol table, e.g. `'next'`).
- When set, the title is followed by `Icon name={trailingIcon}`, weight `semibold`, in the link's colour, size and gap from `trailingIconMetrics(fontScale)`, in a row (`flexDirection: 'row'`, `alignItems: 'center'`); the icon is decorative (no label), so VoiceOver still reads `accessibilityLabel ?? title`.
- `trailingIconMetrics(fontScale: number): { size: number; gap: number }` (exported) → `{ size: Math.round(13 * fontScale), gap: Math.round(4 * fontScale) }`: `1` → `{ size: 13, gap: 4 }`; `3.25` → `{ size: 42, gap: 13 }`.
- Without `trailingIcon`: exactly today's output.

### Closet screen (`app/(tabs)/closet/index.tsx`)
- In the pieces branch: `const deck = toConfirm(open, fit)` and `<ConfirmDeck cards={deck} tag={t('closet.confirm.tag')} onSwipingChange={setSwiping} onEmptied={focusFirstSection} renderCard={(card, slot) => … } />` before the pieces' `View`, always rendered (it draws nothing when empty).
- `renderCard`: for `kind === 'dup'`: `const { checkId, ask, photo, candidate, runnerUp } = card.q;` and `<DuplicateQuestion ask={ask} photo={photo} candidate={candidate} runnerUp={runnerUp} deck={slot} onAnswer={(a) => void answerWithUndo(answerDeps, checkId, ask, a, candidate, runnerUp)} />`; for `kind === 'fit'`: `<FitQuestion item={card.fit.item} doubt={card.fit.doubt} deck={slot} />`.
- **Kept character for character:** `onAnswer={(a) => void answerWithUndo(answerDeps, checkId, ask, a, candidate, runnerUp)}` (releaseSafety R10), `answerDeps` with `toast: (text, undo) => void showToast(text, undo)` (toast U3), exactly one `<DuplicateQuestion` in the file and after `segment === 'pieces'`, the Outfits fit card `segment === 'outfits' && fit ? (… <FitQuestion item={fit.item} doubt={fit.doubt} /> …)` (fitLine BX7), `closet.confirm.tag` before `<PieceSections` and the `ScrollView` first in the returned tree (closetSections P7–P8).
- `const [swiping, setSwiping] = useState(false)`; the `ScrollView` gets `scrollEnabled={!swiping}`.
- `focusFirstSection`: `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref))` on the first section title's `View` (`PieceSectionTitle`'s accessible header, label e.g. `Jackets and layers, 4 pieces` from `pieceSectionLabel`), or the first tile when the closet is one plain grid.
- The 3-at-a-time `queue` and its `RowDivider`s go.

### Words (`i18n/en.ts`, `addedInBuild`)
- `'closet.confirm.count': '{n} of {total}'`
- `'closet.confirm.a11y.question': 'Question {n} of {total}.'`
- No other new strings.

### testIDs (all new)
`closet-confirm-deck`, `closet-confirm-card`, `closet-confirm-tag`, `closet-confirm-question`, `closet-confirm-fit`, `closet-confirm-skip`, `closet-confirm-photo`, `closet-confirm-incloset`. Maestro on iOS sees only elements VoiceOver can reach: the flows match the question's label (`Question 2 of 5\. …`), the answers' and Skip's words, and `id: closet-confirm-card` for the swipe; the hidden tag line (`closet-confirm-tag`) and the pictures are for component tests and screenshots only.

### Demo screens (new; scenario `full`, onboarded, `href: '/closet'`, id `C1`, appended after 261 in order)
- **262** `Closet · To confirm, 5 questions`: exactly 4 open "Is this your …?" questions and 1 "How do your … fit?" question (§19's `DOUBT_STORY`: s12's mid-wash jeans read slim, wide, wide → `How do your mid-wash jeans fit?` · `Seen as slim and as wide.`), so the deck reads `1 of 5` … `5 of 5`, the fit card last. He has answered fewer than 3 questions before (the score line shows). If a real story can give one of the four a runner-up, it is card 2 (frame phone 2).
- **263** `Closet · To confirm, the fit question only`: `DOUBT_STORY`, then `closetYes` if s12's check left any open question, so the deck is the lone fit card (`1 of 1`, with Skip).
- **264** `Closet · To confirm, one question`: exactly 1 open "Is this your …?" question and no fit question (screen 38's story: the p01b check at 07:42, as of 07:41, now `2026-10-22T07:45:00`), so `1 of 1` and no Skip.
- Stories use only today's step kinds that run the real code (`closet`, `check`, `recheck`, `sightings`, `closetYes`/`closetNo`); see Open questions if four real questions can't be made.
- If 262–264 are taken on main when this merges, take the next free numbers and say so in REPORT.md.

## Data
None new. Answers go through the closet service as today (`fitCheck.answerDuplicate` / `unanswerDuplicate` via `answerWithUndo`); the fit card's Skip writes today's `FIT_SKIP_KEY`. Which card shows (`DeckState`) is component state only: never stored, lost on a fresh launch (card 1), kept while the tab screen stays mounted. Skipped questions stay open in the store.

## Steps
1. `toConfirm.ts`: replace the cap with the pure rules above (`toConfirm`, keys, `showsSkip`, `deckCount`, `stepDeck`, `startDeck`, `markAnswered`, `reconcileDeck`, `swipeStart`, `swipeStep`, `cardMotion`, `followsFinger`, constants, `deckTag`, `deckA11y`). New header comment (CB2; DECISIONS-LOG #432), without the forbidden words.
2. `en.ts`: the two strings in `addedInBuild`.
3. `KButton.tsx`: `trailingIcon` and `trailingIconMetrics`.
4. `DuplicateQuestion.tsx`: the `deck` mode (question block, 96 × 110 pictures, AX captions, the answer guard, Skip placement rules). Today's path untouched.
5. `FitQuestion.tsx`: the `deck` mode (label prefix, action, ref, trailing Skip row). Today's path untouched.
6. `ConfirmDeck.tsx`: state + reconcile, tag line, Skip/answer/Undo moves, `PanResponder` swipe with the start and commit rules, slide/cross-fade/height (Reanimated, `.set()` only, no `Date.now()` in render: use a ref set in the handler for the 1000 ms guard), haptic, focus moves, `onSwipingChange`, `onEmptied`.
7. `index.tsx`: `toConfirm(open, fit)`, `<ConfirmDeck … renderCard>` with the R10 line, `scrollEnabled={!swiping}`, the focus target ref, drop the queue and dividers; update the header comment (one card at a time, CB2).
8. Demo: screens 262, 263, 264 in `scenarios.ts` and their stories in `prepareDemoScreen.ts`; check each on the Simulator shows the deck it should.
9. `npm run check` in `app/` (on its own; memory is tight).

## Must not break
- The score card's question (`FitCheckCard`, `DuplicateQuestion compact`) and the Added sheet's questions (`AddedSheet`, `DuplicateQuestion` without `deck`): same pictures (120 × 120 compact; up to 150 × 172), same layout, no Skip, no `Question n of total.` prefix.
- The Outfits fit card (switch on, demo 202): `FitQuestion` without `deck`, tag `1`, exactly as before (CB1.5; `T73-outfits-on.yaml`, `closetNoOutfits.test.tsx`).
- Source-text tests on `index.tsx` and friends, unedited: `releaseSafety.test.ts` R10, `toast.test.ts` U3, `fitLine.test.ts` BX7, `closetSections.test.ts` P7–P8, `stepFourBatch.test.ts` (the empty state's buttons), `fitDoubt.test.ts` "never on a score card" (the users list).
- `answerWithUndo`/`answerLine` (R10's behaviour test), the closet service and its tests (`closetService.test.ts`, `closetBatch287.test.ts` other than C2), `fitDoubt.test.ts` (Skip and the "newer photo disagrees" rule), `closetNoOutfits.test.tsx` (it mocks `DuplicateQuestion`, `FitQuestion` and the design system; `ConfirmDeck` must render under those mocks: keep its imports to `react-native`, `react-native-reanimated`, `expo-haptics`, `@/design-system`, `@/i18n/en` and `./toConfirm`), `scenarios.test.ts` (sorted, unique).
- Every other `TextLink` in the app looks the same (no `trailingIcon` → today's tree).
- The tab bar's shrink-on-scroll: the ScrollView stays the screen's first child; `scrollEnabled` is false only during a claimed swipe.
- Spec-driven test change (the test writer does it, with the reason in REPORT.md; never to weaken): `closetBatch287.test.ts` › `C2` ("To confirm shows at most 3", #111) tests the rule CB2 replaces (founder, Nov 8). It becomes a CB2.1 check on the same real five-question set-up: `toConfirm(open, null)` holds all 5 in `openAsks()` order, and answering one leaves 4 in the same order without it; its source assertions (`toConfirm(`, `.shown.map(`) are replaced by "the screen builds the deck with `toConfirm(open, fit)`".

## Open questions
None for the founder: the design settled every taste and word question on Nov 10 (DESIGN.md → Open questions for the founder). Technical defaults, for the coordinator to log:
- **The swipe uses React Native's `PanResponder`, not `react-native-gesture-handler`.** The app has no `GestureHandlerRootView` (DECISIONS-LOG #35; the Kit facts list avoided swipes for the same reason), and `GestureDetector` throws without one; adding it means changing `app/_layout.tsx`, outside this lane, for the whole app. `PanResponder` capture plus locking the Closet ScrollView while a swipe is claimed gives the design's start rule (12 pt sideways, fails at 10 pt vertical) and cancels a chip's press. · **default:** PanResponder. If it can't hold the touch against the native ScrollView on iOS, stop and ask the coordinator before touching `_layout.tsx`.
- **The card moves when the store drops the question, not on the tap.** The haptic fires on the tap; the slide starts when `useLive` reloads without that question (as today's card did), so an answer that didn't land leaves the card where it is (DESIGN.md → States that don't apply). · **default:** as written; the verifier notes in REPORT.md whether the slide visibly lags the tap on the Simulator.
- **A second answer tap on the same card within 1000 ms is ignored** (the card is still on screen until the reload; a double tap would save twice). · **default:** as written.
- **Skip's chevron and gap scale with the text** (critic round 2, polish 1: DESIGN.md says "gap 4, scaling with the text" and phone 9 shows a larger gap): `trailingIconMetrics` = 13 × fontScale and 4 × fontScale, uncapped (`Icon`'s own `scalesWithText` caps at 2×, which would leave a 26 pt chevron beside 49 pt words at AX5, against the frame's ~42).
- **Skip's row rules** (critic round 2, polishes 2 and 3) as written under `DuplicateQuestion`.
- **The tag line is hidden by a wrapping View** (no `TagLine` change), and **the question and reason are one accessible View** (`KText` takes no ref, actions or testID; the design system stays as it is apart from `TextLink`).
- **VoiceOver focus after an answer waits for the toast's announcement** (`announcementFinished`, capped at 1500 ms); after Skip or a swipe it moves when the motion ends.
- **Files outside the plan line's list:** `KButton.tsx` (design system, shared with every lane; the approved design names the change; one session at a time, so the coordinator confirms nobody else has it open), the demo files (`scenarios.ts`, `prepareDemoScreen.ts`; the spec's Touches names the demo screen), and `closetBatch287.test.ts` C2 (test writer). · **default:** edit them as above, each named in REPORT.md as a deviation.
- **Demo 262 needs four real open questions.** No existing story makes more than one; the implementer builds them from real checks against seed pieces (as screens 37 and 96 do). · **default:** real steps only. If four can't be made, the fallback is a demo-only step that copies a real question onto look-alike pieces the way `closetBatch287` C2's set-up does, which writes a check's `closetSummary` outside the closet service (CLAUDE.md's closet trap): **ask the coordinator before adding it.** The same goes for a runner-up on card 2: if no real story gives one, the runner-up card is checked by the component test and its look is "not verified" on the Simulator (TESTING.md → Not testable yet).
- **Undo while he has moved on** shows the returned card (rule 3), even if he skipped to another one in between: the spec says Undo "shows that card".

### Answers (coordinator, 2026-11-10)
- **No founder questions:** the approved design settled the words and taste.
- **`design-system/components/KButton.tsx` (`TextLink`'s `trailingIcon`):** OK. No open pull request touches it and no session holds it; name it in REPORT.md as a deviation.
- **Demo 262's four open questions:** first try making them through the real closet service (a demo story whose readings produce asks). If that can't make four, a demo-only step that copies a question as C2's test set-up does is allowed. It writes only demo data, runs only on a demo screen, and is not fit-check code, so CLAUDE.md's closet rule (fit-check code writes through `patchCheckKeepCloset`) isn't what it guards. Say which you used in REPORT.md. No need to stop and ask.
- **The demo files and `closetBatch287.test.ts` C2:** OK as planned (the test writer rewrites C2 as a CB2.1 check, with the reason in REPORT.md).
- **Technical defaults 1–7:** accepted. If `PanResponder` can't hold the touch inside the Closet ScrollView on iOS, stop and report rather than touching `_layout.tsx`.
- **DESIGN.md phone 7's VoiceOver words:** the code's "Jackets and layers, 4 pieces" wins (a factual slip in the design, not a new string).
