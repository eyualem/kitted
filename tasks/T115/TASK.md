# T115 · Nothing about his body: the question gate, Kit's sentence gate, the decline, the follow-up taps

**Size:** strict (the hard line: never rate faces, bodies, weight or skin) · **From:** `plan.md` → T115 · **Spec:** `specs/kit-stylist-chat.md` → KC11.2 ("nothing about his body: 100%"), KC1.3 (taps about clothes), KC3.5 (skin) · **Lane:** Kit's stylist chat

## What changes
- **Goal:** a typed question that is only about him ("Do I look old?", "Is my stomach ok?", "Do you like my face?") gets `I rate outfits, never people.` on the phone, nothing sent, not counted; Kit's reply loses more body shapes before he sees them; a reply the body rules empty shows that same line instead of "I couldn't answer that" with Retry; a follow-up tap where he is the subject of look/seem/feel/am stays only with a clothes verdict ("Do I look good in this coat?" stays, "Do I look chunky in this coat?" goes). Clothes questions stay answered.
- **Source:** the founder's "fix with body" (Nov 18) on `reports/2026-11-17-body-questions-check.md` (branch `claude/nifty-dewdney-9e79d2`, PR #139): its 34-row table is the core of the test cases.
- **Files:** `app/src/features/ask/guards.ts` (`isBodyRating`: person-only shapes, only with no garment word) · `app/src/features/ask/gate.ts` (the `body` rule's new shapes) · `app/src/features/ask/pipeline.ts` (the all-dropped path only) · `app/src/features/ask/cards.ts` (`checkFollowUps` and its helpers `aboutHim`/`bodyTap` only) · optionally one new small file in `ask/` for a garment word set shared by `guards.ts` and `cards.ts` (no import cycle: `cards.ts` already imports `guards.ts`) · new test files in `app/src/__tests__/`.
- **Not touched:** `en.ts`/`en.generated.ts` (no new words), `prompt.ts`, `prepare.ts`, `PROMPT_VERSION` (T105), `AskCardView.tsx`, `MessageView.tsx`, `StylistScreen.tsx`, `demo/scenarios.ts` (T104 is running on them).
- **Done means:** every row in TESTING.md passes; the existing ask, gate and follow-up tests stay green.
- **Must not break:** fit questions about the clothes ("Does this jacket fit my shoulders?", "Is it too tight?", "How should chinos fit on a short guy?", "Rate my fit", "Do I look put together?") reach the model; "Do I look fat in this?" reaches the model (it declines, then gives a clothes tip); the guide's line "The jacket is a size big in your shoulders." shows; "pale blue" and "you look good / great" show; distress and under-18 checks unchanged; T102's kept taps stay kept.

## Pending choice for the founder (not built)
- A second sentence on the new person-only phone declines, `Send me a photo and I'll score the outfit.` (the report's suggestion). New words users read, so it waits on his yes. This task uses only the approved `I rate outfits, never people.` (`ask.refuseFace`).

## Technical calls (settled here, logged)
- The decline replaces the fail line when **every** sentence was dropped and **at least one** drop was `body`, `build` or `height` (a reply emptied by a mix of brand and body rules is still a body reply). Emptied by other rules only: the fail line with Retry, as today.
- That decline is stored like the phone's own refusal (`askRefused`, no Retry, not counted, no follow-up taps), in the failed line's place on a Retry.
- The new typed-gate shapes are whole-message shapes, like the old ones; "this", "that", "it" are not garment words. A tail "in this/that/it" is allowed only on attractiveness asks ("Am I good looking in this?", "Would girls find me attractive in this?"); "Do I look fat in this?" and "Do I look old in this jacket?" still go to the model.
- "Do I look gay?" stays with the model (not a body question; the report's row 16).

## Built
- **Changed:**
  - `app/src/features/ask/guards.ts` · `isBodyRating` gets new whole-message shapes. It now covers his stomach, belly, gut, hairline and weight ("Is my belly showing?", "Is my gut ok?"), "Do I look old / young / good / bad / 30?", "Do you like my face?", "Am I a 6 on looks?" and "Would girls find me attractive?". An "in this / that / it" ending is allowed only on attractiveness asks ("Am I good looking in this?"). Any garment, or any other ending, still goes to the model ("Do I look old in this jacket?", "Do I look fat in this?").
  - `app/src/features/ask/gate.ts` · the `body` rule catches more shapes:
    - age, size and comparative words said of him, with up to three modifiers ("you're not too skinny", "makes you look taller", "you look about 25"; "old-school" still passes)
    - "your" plus his thighs, hairline, age, coloring or complexion
    - a cut that hides, slims or flatters a body part ("hides the gut", "hides a receding hairline"; "hides the belt" and "hides the waistband" still pass, and "my" never fills the adjective slot)
    - skin named by its color ("Pale skin…"; "pale blue" still passes)
    - what girls or women like ("Women's sizes" still passes)
    - "a 7 on looks"
  - `app/src/features/ask/pipeline.ts` · when every sentence of a reply is dropped and at least one drop is `body`, `build` or `height`, the row is `ask.refuseFace` with `askRefused`, not the fail line. It has no Retry, isn't counted, gets no taps, and on a Retry it takes the failed line's place (same id and time). The result is `answered` with `counted: false`, like the model's own refusal. A reply emptied only by other rules still gets `fail.ask` with Retry.
  - `app/src/features/ask/cards.ts` · `aboutHim` gets a new `selfVerdict` step, an allowlist that runs before the garment keep. Wherever he is the subject of look/seem/feel/appear/am/I'm, the next word (after "too", "a bit" and similar) must be a clothes verdict (good, ok, right, sharp, formal, casual, warm, dressed…). If it isn't, the tap is dropped. "Dressed / overdressed / underdressed" keeps the tap even with no garment ("Am I dressed right for it?"). Other verdicts still need a garment, so "Do I look sharp?" is still dropped (T102's test). `bodyTap`'s phrase list also gets "muffin top" and "double chin".
- **Tests added:** none by the builder. The locked tests are `bodyGate.test.ts`, `bodyDecline.test.ts` and `bodyTaps.test.ts`: 123 tests, all passing.
- **Screenshots:** none: no screen changes shape; the decline line already exists in the chat (the phone's refusal). 
- **Deviations:** none. No new shared file was needed: the typed-gate shapes are whole-message, so they never need a garment word list.
- **Not done or not checked:**
  - The live-model check (~5¢) is parked for T110.
  - The full `npm run check` wasn't run because the Mac had about 0.2–0.7 GB of free memory, under the 1.5 GB line. Run instead, all passing: `tsc --noEmit`; `expo lint src/features/ask`; the 3 new suites; `kitFollowUps`, `kitCards`, `kitCardsStored`, `askGuards`, `askPipeline`, `askVoice`, `askC2`, `askJudge`; and 29 other suites that use the ask feature (`askC3`/`C4`/`C7`, card*, `scenarios`, `chatUi`, `heightBuildRemoved`, `copyChecks`, `fitDoubt`, `nextBuy` and more).
  - The `@kitted/core` typecheck and parity tests weren't run; core wasn't touched.

## Disputes

## Review
