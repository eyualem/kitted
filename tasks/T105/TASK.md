# T105 · Kit's words

**Size:** normal · **From:** `plan.md` → T105 · **Spec:** `specs/kit-stylist-chat.md` (approved 2026-11-17) · **Lane:** Kit's stylist chat

## What changes
- **Goal:** Kit's answers come out short and honest because the code enforces it: a map of the app built from the live switches, Kit seeing the cards it showed today, answers cut at a sentence end (40 words with a card, 60 without), colors limited to what the scoring rules allow, no brand, shop, link or product price, no "I can't add it" when the app can, a wrong color on his piece rewritten to its closet name, and a guide with the shop line, the short-answer rule and the knit/woven fix. No screen changes, no new words.
- **Files:** `app/src/features/ask/{prompt,context,evidence,gate}.ts`, `rubric/stylist-guide.md`, `app/src/features/ask/guide.generated.ts` (regenerated) · `prepare.ts` and `pipeline.ts` (outside the plan line's list: a few lines each, see IMPLEMENTATION.md) · new tests `app/src/__tests__/kitWords{Gate,Prompt,Pack}.test.ts`.
- **Done means:** KC1.1 the cut · KC1.4 no "can't" or false "added" lines · KC3.3 the allowed colors as evidence, gate and card check · KC3.5 no skin, hair or eye color talk · KC5.2 a wrong color on his piece rewritten, the pack with only new values · KC6.1 the app map from the switches · KC6.2 only mapped places · KC6.3 today's cards in what Kit sees · KC6.5 the knit/woven fix · KC8.1 no brand, shop, link or price · KC8.2 the shop line.
- **Must not break:** T117's body rules (`bodyDecline`, `bodyGate`, `bodyTaps`), T102's card checks and repeat key, "the code judges, the AI explains", same photo same score.

## Built
- **Changed:** `gate.ts` (the cut, prices, color names, deny/claim/place/brand/price/color rules, the piece-name rewrite, more body words), `prompt.ts` (app map from the live switches, new answer rules, version 6, one example shortened), `context.ts` (today's cards block), `evidence.ts` (today's card lines, the allowed colors as evidence and for a colors card), `prepare.ts` (switches, cards, colors, prices into the gate), `pipeline.ts` (4 lines: the cut after the card is known), `rubric/stylist-guide.md` and `guide.generated.ts` (regenerated).
- **Small deviations from IMPLEMENTATION.md:** (1) the rules say `<AppMap>`, not `<appmap>`: the tests read the first `<appmap>` in the system prompt as the map, so the rules text can't hold that exact tag. (2) `COLORING_BODY`'s complexion pattern skips "my complexion" so `kitFollowUps` (a merged test: the gate must not drop that tap) stays green; Kit's own sentences never say "my". (3) `colorEvidence` also runs for a question about his looks with color words ("does navy match my eyes") and, when no piece, kind or color is named, gives a one-line "no list" text plus the fixed coloring line (the KC3.5 test needs a non-null result). (4) A kind target reads "the <kind noun>" in the text (the Pack test pins it).
- **Tests added:**
- **Screenshots:** none (no screen changes)
- **Not done or not checked:** the model-behavior halves of each criterion wait for T110's paid run (see TESTING.md → Not testable yet)

## Disputes
- none yet

## Review
Written by the reviewer.
