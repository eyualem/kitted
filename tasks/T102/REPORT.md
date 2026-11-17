# T102 report

## Built (implementer, round 1)
223 of 225 locked tests pass; the 2 that fail are disputed below. The whole app Jest suite: 2 failed, 4 skipped, 2191 passed; only the two disputed tests fail. `npx tsc --noEmit` clean; `expo lint src/features/ask` clean. `npm run check` was not run as one command (the Mac had little free memory).

Files (all in `app/src/features/ask/`): `cards.ts` (new types, `KIND_SLOT`, `colorName`, `kindNoun`, `cardPiece`, `buildCard` for outfit / options / colors / buy with `why`, `storedCard`, `outfitNow`, `optionsNow`, `buyPiece`, `colorPieces`, `nextBuyFor`, `cardKey`, `shownKeysToday`, `askedAgain`, `exampleOutfit`, `checkFollowUps`, `cardControls`, `cardSpoken`), `closing.ts` (`followUps`), `pipeline.ts` (`AskPayload.followUps`, `latestFollowUps`), `prompt.ts` (closing format, `PROMPT_VERSION` 5), lane extensions `source.ts`, `gemini.ts`, `providers.ts`, `prepare.ts` (pass-throughs). No tests, fixtures, `kitted-core`, `closet/`, views, `en.ts` or demo touched.

### Deviations and reading choices
- `buildCard`'s `avoid` is closet ids; `exampleOutfit`'s `avoid` is kind keys (a card that becomes an Example converts ids to kinds).
- Example fallback: a look's outfits first, then the Starter outfit, then `null`.
- `cardPiece` handles "off white" itself (core reads it as `white`); one alias added: "chore jacket" or "chore coat" is `chore_coat`.
- Drawn piece name = spec color word + closet noun (`garmentName`); denim on jeans uses `colorWord` ("Dark jeans"); khaki reads "Beige chinos". A bare "jacket" is `field_jacket` named "Navy jacket"; a harrington alone is `null`.
- Options card: an unknown his-handle drops the card; an avoided piece's handle is skipped; an unresolved drawn entry is skipped; an outfit need that doesn't resolve drops the whole card.
- `latestFollowUps` reads the last answer row after his last message; a refused answer gives `null`.
- `cardSpoken` is `null` for an outfit only with non-empty `needs` or an Example.
- The 80% overlap rule of `checkFollowUps` is measured over the smaller word set, only when it has 2+ words.
- Drawn pieces reach `outfitValid` as synthetic garments (straight leg for bottoms).

## Disputes (round 1; sent to the test writer to judge against the spec)
1. `KC2.3 · example is true only on a card with none of his pieces, and itemIds is empty then`: the test builds `pieces: []` plus 3 needs on a closet that holds a white tee; by KC2.1 the tee meets the first need, so the card has 1 of his and 2 drawn, which KC2.3 says is not an Example.
2. `KC2.3 · 3 drawn clothing pieces with 1 of his is an example, and his piece is not in it`: `expect(JSON.stringify(card)).not.toContain('jeans"')` fails because the Starter fallback example legitimately draws dark jeans; his own piece is not in it (`itemIds` is empty, asserted separately).

## Summary for the founder
(written at the end)

## Verification (verifier, Nov 17)
**Lock:** `git diff eaa78fa0..HEAD` on the three test files, `app/e2e/` and TESTING.md: only the two KC2.3 test bodies named in Disputes 1 and 2 (re-locked at `a07bce51`) and the TESTING.md lock note; `app/src/testing/kitCardsHelpers.ts` unchanged. · banned shortcuts: none found (no `.only`, `.skip`, `xit`, `it.todo`, snapshots, test-environment checks; no test's expected value hard-coded in app code) · files outside the list: none. The task's commits touch only `app/src/features/ask/{cards,closing,gemini,pipeline,prepare,prompt,providers,source}.ts`, the three tests plus helper, `plan.md`, `handoff/DECISIONS-LOG.md` (entry 462) and `tasks/T102/`. No change to `closet/`, `app/packages/kitted-core`, `AskCardView.tsx`, `en.ts` or `demo/`. The lane extensions are 1 to 2 line pass-throughs (a conditional spread of `followUps` in three `done` yields, one optional field on the `done` type, one `shownToday:` line in `prepare.ts`).
**Suites:** `npm run check` **did not run**: the Mac had 74 to 638 MB unused (CLAUDE.md rule 8), so I ran the parts separately, in band with `--no-watchman`. Server and parity: not touched. Note: `app/node_modules` is a symlink to the main checkout, so this tested the main checkout's `@kitted/core` (unchanged by this task).
```
npx jest --no-watchman -i kitCards kitCardsStored kitFollowUps
Test Suites: 3 passed, 3 total   Tests: 225 passed, 225 total
npx jest --no-watchman -i ask* stepFourBatch closetNoOutfits oneCount serverProxy kit*
Test Suites: 3 skipped, 18 passed, 18 of 21 total   Tests: 4 skipped, 598 passed, 602 total
npx tsc --noEmit              -> exit 0, no output
npx expo lint src/features/ask -> exit 0, no output
```
The 4 skipped tests are existing ones (not this task's). The whole app Jest suite and the Maestro flows were not run (memory; and no screen changed).

### Criteria
- **KC1.2** · pass · proof: planted "an array of cards builds its first card" in `buildCard` → red in `KC1.2 · a block whose card is an array of two valid cards gives no card`; planted "model block of type add builds a card" → red in `KC1.2 · exists: model blocks of type add or changed never build a card`. Reverted.
- **KC1.3** · pass for what code can prove (the "about clothes" part is not mechanical, see below) · proof: 3 → 4 kept → 3 red; 30 → 31 chars → red in `exactly 30 characters passes, 31 fails`; `latestFollowUps` ignoring his newer message → 3 red; emoji check disabled → red in `dropped: an emoji`; sentence-case check disabled → 5 red; taps stored on a refused answer → red in `a refused model answer is stored with no taps`. **One mutant survived** (see Break it on purpose). **One gap found** (see Defects).
- **KC1.5** · pass · proof: add button in Past chats → red in `add, asked: every button flag is false in Past chats`; `storedCard` accepting an unknown color family → red in `a colors card with a family outside the 25`; old outfit shape rejected → 2 red (round trip); `outfitNow` losing `needs` → 3 red. Old stored shapes (outfit with `itemIds` and `occasion` only, check, ask, buy with no `why`, link, correct) still read back: compared the old `storedCard` (at `eaa78fa0`) with the new one, every old accepted shape is still accepted, and the new function only adds the new shapes and optional fields.
- **KC2.1** · pass · proof: his-piece substitution removed → 3 red; `avoid` ignored in outfits → 2 red; `avoid` ignored in options → red in `a piece in avoid is not an entry`.
- **KC2.2** · pass (the data side; the drawing and tile are T101/T104, not verified here) · proof: `Off-white` → `Off white` → 3 red; a brown word changed to `Black` → 4 red.
- **KC2.3** · pass · proof: drawn threshold `> 2` → `> 3` → red in the re-locked `3 drawn clothing pieces with 1 of his is an example` (caught only by that test); `example: false` on the card → 4 red; example chooser ignoring `shown` → 5 red.
- **KC2.4** · pass · proof: 3 → 4 options kept → red in `a fourth entry is cut`; replaced piece not excluded → 3 red (KC2.4 and KC2.5).
- **KC2.5** · pass (on the code; the real model's 100% is T110) · proof: drawn piece of another slot kept → 3 red, including `100% of the table gives a card in the asked slot`.
- **KC2.6** · pass · proof: repeat check removed → 2 red (`buildCard` and the `createPrepare` test); 4 am rollover broken → 4 red including `shownKeysToday holds the keys of today's stored outfit cards and none from yesterday`.
- **KC2.9** · pass · proof: six clothing allowed → red in `six clothing pieces give no card`; three accessories allowed → red; accessories placed first → 2 red.

### Break it on purpose
Thirty mutation runs (one needed a rewrite because it broke compilation), each reverted with `git checkout -- <file>`; the tree was clean after every run (`git status --short` empty at the end).
- Caught (each at least one red): all of those in the Criteria lines above.
- **Not caught: `checkFollowUps` without the `n === asked` line** (a tap equal to his question): 225 of 225 still pass. Reason: for a tap of 2 or more words, the 80% word-overlap rule catches the repeat anyway, so the exact-equality line only matters for a one-word tap against a one-word question (e.g. his question "Dressier?" and the tap "Dressier"), which no test covers. **Test defect, low:** add a case where his question is one word and the tap is the same word, expected dropped.

### Screens
None: the task has no screens (T104 draws them); no Simulator was started, as instructed. VoiceOver: `cardSpoken` returns `null` for the new shapes and for an outfit with `needs` or an example (confirmed in code); T104 owns those lines.

### Tried to break it
- **Follow-up check against emoji, body and score text** (a throwaway test, deleted; tree clean): dropped correctly: `Make it dressier 🔥`, `🔥 Make it dressier`, `✨`, `❤️`, `👍` and `☺` endings, `Is it a 7?`, `Why 7.5?`, `Why a six?`, `Make it a 10`, `Score it 8/10`, `Try Nike`, `Is my belly OK?`. **Passed through the check (kept as taps):** `Rate my body`, `Do I look fat?`, `Am I too skinny?`, `Is my build ok?`, and `Do you like my face?` (and also `What is my score?`, which the gate has no rule against). The first four are caught by `isBodyRating` in `guards.ts` (it returns true for each, so a typed one would be declined), but `checkFollowUps` calls only `checkSentence`, whose body rules are written for "your body" and "you look fat", not his first person. **Code defect, medium** (hard line: never rate bodies or faces; a Kit tap would invite it). `Do you like my face?` also passes `isBodyRating` (a gap in `guards.ts`, outside this task's files; report it to whoever owns `guards.ts`). `Is my belly OK?` was dropped by the gate.
- **Past chats read the old stored shapes:** checked by the old-vs-new `storedCard` comparison and the passing round-trip tests; no regression.
- **Closet changes after a card is stored:** merged piece counts as gone, drawn pieces always redraw: covered by existing tests (and my `outfitNow` mutant).
- **Offline or failure mid-answer, double taps, killed app, Delete all my data, clock past 4 am:** the 4 am rule is covered (above); a failed answer row having no `followUps` is covered by the `createAsk` test; the rest are screen or app-level behaviours with nothing new in this task (no store, service or screen was added), not tried.
- **Integration risk before T104 lands (not a T102 defect, but a sequencing one):** `prompt.ts` (`PROMPT_VERSION` 5) now tells the model to write the new outfit, options and colors cards, and `buildCard` builds them, but `AskCardView.tsx` still draws only the old shapes. Merged and shipped alone, an Example card (empty `itemIds`) would reach the old view, which has no case for options or colors and shows an outfit with no tiles. The plan orders T104 right after, so keep T102 off any TestFlight build until T104 is in. Also: `PROMPT_VERSION` and `prepare.ts` are shared with T105 (second merger sets 6; DECISIONS-LOG 462 may need renumbering before merge).

Proposed tests (not written; for the test writer):
1. `checkFollowUps(['Rate my body', 'Do I look fat?', 'Am I too skinny?', 'Is my build ok?'], ...)` returns `[]` (body phrasings in his first person). Expected after the code fix: all dropped.
2. His question is one word ("Dressier?") and the tap is "Dressier": dropped.

### Implementer's claims
- "223 of 225 locked tests pass, the other 2 disputed" → confirmed at the time; now 225 of 225 after the re-lock (my run).
- "The whole app Jest suite: 2 failed, 4 skipped, 2191 passed" → not re-run by me (memory); the 18 ask-related suites I ran: 598 passed, 4 skipped.
- "`npx tsc --noEmit` clean; lint on `src/features/ask` clean" → confirmed.
- "`npm run check` was not run as one command" → true; I did not run it either.
- "No tests, fixtures, `kitted-core`, `closet/`, views, `en.ts` or demo touched" → confirmed.
- "`cardSpoken` is `null` for an outfit only with non-empty `needs` or an Example" → confirmed in code.
- "`cardPiece` handles 'off white' itself, one alias added (chore jacket)" → confirmed.

**Verdict: not ready.** One code defect, one test gap, one weak-test note:
1. **code** · `app/src/features/ask/cards.ts` `checkFollowUps`: first-person body phrasings ("Rate my body", "Do I look fat?", "Am I too skinny?", "Is my build ok?") pass. Fix: also drop a tap for which `isBodyRating(text)` (from `guards.ts`) is true. Small, in the lane.
2. **test** · add proposed test 1 above (the fix needs a test that fails without it), and proposed test 2 (the surviving `n === asked` mutant).
Everything else passes; every "not verified" names its verifier (drawing and tile: T101/T104; Example title: T104 screenshots; real-model 100% and block failures: T110; Past-chats words: T104; phone: Y33). `npm run check` itself did not run (memory): run it once the Mac has memory, before merge. · rounds: 1 of 3

## Round 2 build
- Fixed the verifier's code defect (item 1): `checkFollowUps` in `app/src/features/ask/cards.ts` now also drops a tap when `isBodyRating(text)` (from `./guards`) is true. Two lines: one import, one extra condition beside `checkSentence`. No other file touched.
- Tests: `kitFollowUps.test.ts` now passes (the 4 that were red). 14 ask-related suites run with `npx jest --no-watchman -i` (kitFollowUps, kitCards, kitCardsStored, kitArrives, askC2/C3/C4/C7, askGuards, askJudge, askPipeline, askProviders, askRotation, askVoice): 527 passed, 0 failed.
- `npx tsc --noEmit` clean; `eslint src/features/ask` clean. `npm run check` not run (597 MB unused memory at the time, under the 1 GB bar): run it once before merge.
- Deviations: none. Disputes: none.

## Round 2 · Verification
Verifier, no Simulator (no screens). `npm run check` did not run (unused memory 614 MB to 731 MB, under the 1 GB bar): run it once before merge.

- **Lock:** `git diff a07bce51..HEAD` on the three test files, `app/e2e/` and `app/src/testing/` shows only the +22 lines added at `f8ae795b` (`isBodyRating` import, 4 first-person body taps via `it.each`, 1 one-word repeat test). Nothing loosened or removed; no `.only`, `.skip`, `xit`, `it.todo`, snapshot. TESTING.md changed only in the lock line (records the strengthening). Round 2 code change is 2 lines in `cards.ts` (import, `|| isBodyRating(text)`), a file in IMPLEMENTATION.md Files.
- **Suites:** `npx jest --no-watchman kitFollowUps kitCards kitCardsStored` 230 of 230 pass. Ask suites (`ask*`, `stepFourBatch`, `closetNoOutfits`, `oneCount`, `serverProxy`): 14 suites pass, 3 skipped (existing), 358 pass, 4 skipped. `npx tsc --noEmit` exit 0, no output. `npx expo lint src/features/ask` no output. Maestro and the whole app Jest suite not run (memory; no screen changed).
- **Planted bugs (each reverted with `git checkout`, tree clean):**
  - KC1.3: remove `isBodyRating` → 4 red (the 4 body taps). Limit 3 to 4 → 3 red. Length 30 to 31 → 1 red. Drop the sentence-case check → 1 red. Drop the duplicate check → 1 red. **Drop the all-caps line → 0 red (survives).** It only matters for a one-word all-capitals tap ("WARMER", "DRESSIER"), which today is dropped by that line alone; every multi-word all-caps tap is caught by the capital-word check above it. Weak test (test defect, low): see proposed test 1.
  - KC2.9: clothing > 5 to > 6 → 1 red; accessories > 2 to > 3 → 1 red; accessories before clothing → 2 red.
  - KC2.3: drawn > 2 to > 3 → 1 red (the re-locked test).
  - KC2.1: drop the color-family match → 2 red.
  - KC2.4: keep 4 → 1 red; minimum 2 to 1 → 2 red.
  - KC2.6: allow a repeat → 2 red; unsorted `cardKey` → 3 red.
  - KC2.2: name built from a fixed color → 4 red.
  - KC1.2: removing the `Array.isArray` guard in `buildCard` → 0 red, but it is an equivalent mutant (an array has no `.type`, so `buildCard` still returns null); the round 1 plant (build the first card of an array) was caught and still holds.
  - KC1.5: raise the stored colors-card family cap 5 to 6 → 0 red. The cap is not in the spec or TESTING.md, so not a defect; noted only.
- **Getting text past `checkFollowUps` (probe through a throwaway test, deleted; 60 phrasings, run alone, question "What goes with my jeans?"):**
  - Dropped: Rate my body, Do I look fat?, Am I too skinny?, Is my build ok?, Am I ugly?, Am I fat?, Am I too short?, Do I look too fat?, Am I overweight?, Do I look chubby?, Am I attractive?, Do I look hot?, Am I cute?, Is my body ok?, Rate my face, Is my skin bad?, Is my hair ok?; every score phrasing tried ("Is it a 9 out of 10?", "Make it a 10", "Can I get a 9?", "Score it 8.5", "Is that a 6?", "Get to 9/10?", "Why not an 8?"); emoji in U+1F000 to 1FAFF and 2600 to 27BF (fire, heart, sparkles); WARMER, DRESSIER, OK.
  - **Passes (body, first person, out of lane): Do I look old?, Is my stomach ok?, Do you like my face?, Am I too tall?, Am I too thin?, Do I look good?, Do I look younger?, Is my belly big?, Do my legs look ok?, Do my arms look big?, Do my thighs look big?, Is my waist too big?, Is my chest flat?, Is my face round?, Do I look bulky?, Does my weight show?, Am I in shape?, How is my body?, What about my body?, Would this hide my belly?, Hide my stomach?, Cover my gut?, Make me look thinner, Make me look taller, Does it make me look fat?** Cause: `isBodyRating` in `app/src/features/ask/guards.ts` is a whole-message list kept narrow by design (its header says so) and `checkSentence` only catches the model talking about his body, not a question from him. A tap sent through `ask()` reaches the same narrow guard and then the model, which declines, so no body rating is produced; the cost is that the app would show a body-question button. Out of lane: report only, not fixed. Needs a founder/spec call on how far the guard should reach ("Make me look thinner" and "Do I look good?" are clothes-adjacent, which is why it is narrow). The prompt and the model's refusal are the backstop.
  - **Passes (emoji): "Add a watch ⌚"** (U+231A). `EMOJI` in `app/src/features/ask/gate.ts` covers U+1F000 to 1FAFF, 2600 to 27BF, 2B00 to 2BFF but not U+2300 to 23FF (watch, hourglass, alarm clock: exactly what a watch tap would carry) or the arrows and symbols block. Hard line "no emoji" and KC1.3 "emoji dropped": a **code** defect, low to medium. Fix in `gate.ts` (add `\u{2300}-\u{23FF}`, and consider `\p{Extended_Pictographic}`) or locally in `checkFollowUps`. `gate.ts` is shared with the sentence gate, so check it is in lane first. ":)" passes; it is an emoticon, not an emoji, and fine.
- **Proposed tests (for the test writer):**
  1. `checkFollowUps(['WARMER'])` and `(['DRESSIER'])` give `[]` (kills the all-caps mutant). Also `(['OK'])` gives `[]`.
  2. `checkFollowUps(['Add a watch ⌚'])` gives `[]`, and `['Hourglass ⏳']`, `['Nice ❤']` (the last passes today only because 2764 is in range; keep it as a control).
  3. If the founder wants the body list wider: `Do I look old?`, `Is my stomach ok?`, `Do you like my face?` give `[]` (needs the `guards.ts` change first; not a T102 task).
- **Round 1 findings:** defect 1 (first-person body taps) fixed and proven (4 red when the line is removed, green with it). Defect 2 (one-word repeat) the new test passes against the unchanged code, as the test writer noted (bites against the 0.8 overlap rule only for multi-word taps); not a code defect.
- **Not verified:** screens, VoiceOver, light/dark/large text (T104); Maestro flows and the full `npm run check` (memory; run before merge); `isBodyRating` reach in real model output (T110).

**Verdict (round 2): not ready for one reason, small.** One **code** defect: `⌚` (and anything in U+2300 to 23FF) passes the emoji rule (`gate.ts` `EMOJI`, or `checkFollowUps` locally). One **test** gap: a one-word all-capitals tap is not covered (proposed test 1). The round 1 body-tap defect is fixed and proven, the lock holds, no uncaught planted bug except the two notes above. Out of lane and for the founder: `guards.ts` does not catch many first-person body questions ("Do I look old?", "Is my stomach ok?", "Do you like my face?"); the model's refusal is the backstop. Rounds: 2 of 3.

## Round 3 build

Two defects from the round 2 verification, both in `checkFollowUps` (`app/src/features/ask/cards.ts`, the only file touched besides this report). Tests are the locked ones in `app/src/__tests__/kitFollowUps.test.ts`; none edited.

- **Emoji outside the gate's ranges.** `checkFollowUps` now runs its own emoji check on every tap (`TAP_EMOJI`), before the sentence gate. It uses explicit code-point ranges, no `\p{...}` property escapes: U+2300-23FF (watch, hourglass, alarm clock), U+2600-27BF, U+2B00-2BFF, U+1F000-1FAFF, plus U+FE0F, U+200D, U+20E3, arrows (U+2190-21FF), enclosed numbers (U+2460-24FF), geometric shapes (U+25A0-25FF), U+2900-297F and the CJK symbols U+3030, U+303D, U+3297, U+3299. Emoticons such as ":)" are not emoji and still pass.
- **First-person body taps wider than `isBodyRating`.** A new `bodyTap` check works on meaning, not on a list of phrases. A tap is dropped when it has a first-person word (I, I'm, I'd, me, my, mine, myself) together with either a body part or body word (body, belly, stomach, gut, waist, chest, thighs, legs, arms, face, weight, height, build, shape, skin, and so on) or a body attribute (tall, short, thin, skinny, fat, heavy, bulky, old, young, big, small, and so on, applied to him through the first person). It also drops "look fat/thin/thinner/skinny/bigger/smaller/old..." forms with no first person ("Does that look fat?"). "fit" and "hot" are everyday clothes words, so they count only after "look" ("Do I look fit?"). Kept: Make it dressier, Try a darker color, Which is most versatile?, What goes with my jeans?, Show me my boots, Do these fit my style?, Is this warm enough?. It leans strict: a tap like "Show me something shorter" or "Is this too big on me?" is now dropped; that costs one button, never a wrong answer.
- **Why the shared `isBodyRating` in `guards.ts` was not enough.** `isBodyRating` is a deliberately narrow whole-message list (its header says so; "Make me look thinner" and "Do I look good?" are clothes-adjacent for something he types). How far the guard reaches for typed messages is a founder/spec call, and `guards.ts` and `gate.ts` are out of this task's lane, so neither was edited. Taps come only from the model and a dropped tap costs little, so the stricter check lives locally in `cards.ts`. `isBodyRating` is still called after the new checks.

Results: `kitFollowUps.test.ts` 89 of 89 pass (was 23 red); with the other T102 files and the existing ask suites (14 suites) 563 of 563 pass; `tsc --noEmit` clean; eslint on `src/features/ask` clean. `npm run check` not run: unused memory was 101 to 250 MB (the Mac is short, the rule is over 1 GB); run it before merge. No server or core files touched. Deviations: none. Disputes: none. Not done: nothing in scope; the typed-message reach of `guards.ts` is unchanged, for the founder.
