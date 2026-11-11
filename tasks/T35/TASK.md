# T35 · The feature guide: Kit's hello, tips at the moment, Show me around

**Size:** normal · **From:** `plan.md` → T35 · **Spec:** `specs/setup-and-you.md` → SY2, SY3 · **Lane:** Setup and You

## What changes
- **Goal:** a new user is told what Kitted does in Kit's first message, then gets one short tip the first time he reaches his first score, Closet, Lookbook and You; "Show me around" in You brings them all back.
- **Files:**
  - `app/src/features/onboarding/tips.ts` (new): which tip shows when, the done marks in kv, "Show me around".
  - `app/src/features/onboarding/TipCard.tsx` (new): the tip card, and the first-score tip under the score card.
  - `app/src/features/onboarding/complete.ts`: setup's end posts Kit's hello in place of the AI note.
  - `app/src/features/stylist/MessageView.tsx`: draws Kit's hello, and the first-score tip under that check's card.
  - `app/src/app/(tabs)/{closet,lookbook,you}/index.tsx`: the tab's tip at the top.
  - `app/src/features/settings/SettingsRows.tsx`: `Show me around` first in Help & about.
  - `app/src/i18n/en.ts` (shared): the approved words.
  - `app/src/demo/{scenarios,applyDemoScreen}.ts`: existing demo screens keep tips dismissed (they're an established user); new screens show each tip.
- **Done means:**
  - SY2.1 setup's end posts Kit's hello with the approved words, once, and no separate AI note.
  - SY2.2 the first-score tip shows under the first scored check's card only; Got it ends it for good; re-checking that fit ends it too.
  - SY2.3 / SY2.4 the Closet / Lookbook tip shows at the top while it has a piece / a look and the tip isn't done; never on the empty tab.
  - SY2.5 the You tip shows at the top of You until Got it.
  - SY2.6 an install that finished setup before this shows the tips not yet done, and gets no Kit's hello.
  - SY2.7 "Delete all my data" clears every done mark.
  - SY2.8 the words are exactly the approved ones; Got it is at least 44 pt; VoiceOver reads the tip, then Got it as a button.
  - SY2.9 no tip before his first scored check, on the camera, while a check is read, or over a score card.
  - SY3.1 Show me around clears every done mark, switches to Stylist and posts Kit's hello as the newest message.
  - SY3.2 tapping it again while the hello is still the newest message posts no second copy.
  - SY3.3 afterwards the first-score tip shows under the next scored check and no older one; the tab tips show again.
- **Must not break:** old AI-note messages still read as the AI note; Kit's hello is never sent to the server as part of a question's history; the You page's rows and landing (T34); the "Turn on fit checks" card after Not now.

## Built
- **Changed:** setup's end posts Kit's hello (a text-less Kit message drawn from `stylist.hello`, so it never reaches a question's history) in place of the AI note; old AI-note messages still read as before. A tip card (the words, then `Got it`) at the top of Closet (once it has a piece), Lookbook (once it has a look) and You, and under the score card of his first scored fit **that has a fix**, today's chat only. Every tip waits for his first scored check. The done marks are kv keys `tip.<id>.done`, phone-only (`tip.` is a local prefix in `sync/schema.ts`), cleared by "Delete all my data". `Show me around` is the first row of Help & about: it clears every mark, moves the first-score tip to the next check (`tip.firstScore.after`), posts Kit's hello as the newest message unless it already is, and opens Stylist. Demo screens: all existing ones are an established user with the tips dismissed; 272–276 are new.
- **Decided on the way (the founder, Nov 10):** a first fit with no fixes is skipped; the tip waits for the first fit with a fix ("Do one of the fixes" would read wrong). Added to `specs/setup-and-you.md` SY2 with his yes.
- **Outside the lane (needed):** `features/stylist/MessageView.tsx` (the hello and the tip under the card), `app/(tabs)/{closet,lookbook}/index.tsx` (one line each), `sync/schema.ts` (the `tip.` prefix), `demo/{scenarios,applyDemoScreen,prepareDemoScreen}.ts`.
- **Tests added:** `app/src/__tests__/tips.test.ts` (16). Changed on purpose: `stepFourBatch.test.ts` G23.1 (Kit's hello replaces the AI note), `youSettingsHome.test.tsx` (Show me around first in Help & about, in four row lists and the labels; the T34 "no Show me around" line becomes "shown once"), `syncSchema.test.ts` (the new kv keys classified). `npm run check`: types clean; lint 0 errors (6 warnings, all in other tasks' tests); core 853 of 853 (a first run under memory pressure failed 2, passed alone); Jest `Tests: 4 skipped, 1751 passed, 1755 total`.
- **Screenshots** (iPhone 17 Pro): `tasks/T35/shots/01-you-tip-{light,dark}.png` (demo 275), `02-first-score-tip-{light,dark}.png` (272), `03-closet-tip-{light,dark}.png` (273), `04-lookbook-tip-{light,dark}.png` (274), `05-show-me-around-{light,dark}.png` (276: Kit's hello newest after Show me around), `06-show-me-around-row-light.png` (84), `07-you-tip-largest-text-light.png` (275, accessibility XXXL).
- **Not done or not checked:** VoiceOver on a device (the tip is a text then a `Got it` button, unchecked by ear). Tapping `Got it` and `Show me around` on the Simulator (the logic is tested; the taps weren't driven). Kit's hello at the end of a real setup on the phone (the demo seeds it through `completeOnboarding`, shot 02's first screen). The dev build's Tools button sits over `Got it` on some screens; it isn't in the app.
- **Fix round (after review round 1):** `showMeAround` now compares against today's chat only (Stylist shows only today's), so a hello left yesterday doesn't stop today's; it takes the zone (`sessionClock.offset`), and a new test covers the yesterday case. `Got it` is its own Pressable at least 44 × 44 pt (it was a TextLink as wide as its two words). Main merged in (T38, T39, the explain-rating spec): Kit's hello ends "Tell me when I do." per that spec's change to SY2 (the founder's yes, Nov 10); a new test checks the hello sits above Kit's first-check offer card (OS5). Re-run: types clean; core 853 of 853; Jest `Tests: 1846 passed`-class run with 2 failures that were the demo-screen order (fixed: 272–276 moved before 280–284) and a 5 s timeout in `T39-setupScreens` OS3.1 under memory pressure (passes on rerun, 24 of 24; untouched screens). All shots 01–06 retaken on the merged code; 07 (largest text) is from before the merge (the You tip's words didn't change).

## Disputes

## Review

### Round 1 (reviewer, 2026-11-10)
- SY2.1 done: `completeOnboarding` posts one text-less Kit's hello in place of the AI note, on Agree and Not now (tips.test, stepFourBatch G23.1); `ask/context.ts` skips text-less rows, so the hello never reaches a question's history. Above Kit's offer card can't be told until T39 adds that card.
- SY2.2 done: under the earliest scored first check that has a fix, today's chat only; Got it is a kv mark (persists); a re-check (`recheckUsed` or a child row) ends it. Shot 02.
- SY2.3 / SY2.4 done: `hasContent` = a piece / a look; shots 03, 04.
- SY2.5 done: shot 01 (light, dark), 07 (largest text, nothing clipped).
- SY2.6 done: no marks on an existing install, so tips show; the hello is only posted by setup's end and Show me around.
- SY2.7 done: `tip.*` lives in `kv`, which the real `wipe()` empties (`TABLES` includes `kv`); tested on the memory store.
- SY2.8 **not done** (size): the words match the spec exactly and VoiceOver order is text then a button (not checked by ear); `Got it` is 44 pt tall but not 44 pt wide (defect 2).
- SY2.9 done: every tip waits for a scored check; the first-score tip sits below the card, never over it; nothing on the camera.
- SY3.1 **not done in one case** (defect 1); otherwise done: marks cleared, Stylist opened, hello newest (shot 05).
- SY3.2 done: no second copy while the hello is newest (tested).
- SY3.3 done: `tip.firstScore.after` moves the first-score tip to the next check (tested); tab tips return with their marks cleared.

**Defects**
1. **code** · `app/src/features/onboarding/tips.ts` `showMeAround` (the `newest` line): "already the newest message" is checked across every day, but Stylist shows only today's chat (`splitToday`). A new user who finished setup yesterday and sent nothing since (his newest message is setup's hello), or one who tapped Show me around yesterday, taps it today and lands on an empty Stylist with no hello. SY3.1 says "the newest message in today's chat". Compare only against today's messages (`dayKey(m.createdAt, sessionClock.offset)` against today's key), and add a test for the yesterday case.
2. **code** · `app/src/features/onboarding/TipCard.tsx` `TipCard`: `Got it` is a `TextLink` inside an `alignItems: 'flex-end'` row, so its touch area is the width of the words: about 38 pt in shots 01–04 (87 px at 920 wide, ×1.31 ÷3), less at smaller text sizes. SY2.8 asks for at least 44 × 44. A `minWidth: 44` (or a horizontal `hitSlop`) on it fixes it.

**Worth a later look (never blocks)**
- A very quick double tap on Show me around could post two hellos (both taps read the chat before either writes); the row navigates away on the first tap, so it's unlikely.
- Every fit-check card in today's chat runs its own live query over all checks for `FirstScoreTip`; fine at today's sizes.
- The dev build's Tools button covers `Got it` in shot 02 (not in the shipped app, as Built says).

**Not ready** (defects 1 and 2 open, both code).
