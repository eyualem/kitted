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

### Round 1 (normal mode; diff and slices read, a throwaway probe test run and deleted, no screenshots: no screen)

**Criteria**
- KC1.1 cut: done. `cutAnswer` keeps the first sentence whole even over the limit, never splits "7.5" or "e.g.", 2 sentences and 40 words with a drawn card, 60 without; `pipeline.ts` runs it after the card is known and uses the cut text in the live row, the stored row and `spoken`. Probed: a 50-word first sentence plus another stays whole; "A. B. C. D." with a card gives "A. B."
- KC1.4 no "can't" / false "added": done for the gate half (deny, claim rules); the model half waits for T110.
- KC3.3 allowed colors as evidence, gate and card: done. `allowedForCard` covers a colors card when the question wasn't detected as a color question.
- KC3.5 no skin, hair or eye talk: done, with the "my complexion" note below (not a defect).
- KC5.2 wrong color on his piece rewritten, pack with only new values: **not done correctly**, see defect 1.
- KC6.1 / KC6.2 app map from the switches: done. `liveSwitches()` reads the real switch functions; with `outfits` off the map never says Outfits or Next best buy; every place name comes from `t(...)`. The gate's `place` rule covers only "next buy section" and "outfits tab" wording; anything else about places is the prompt's job (T110).
- KC6.3 today's cards in what Kit sees: done.
- KC6.5 knit/woven in the guide: done (guide and `guide.generated.ts` both changed).
- KC8.1 no brand, shop, link or product price: done for the gate; a price with no piece noun in the sentence ("Expect to pay about $80.") is not caught (small, below).
- KC8.2 the shop line: done, word for word, in the rules and the guide.

**Your five focus points**
1. T117 body rules: not loosened. `YOUR_BODY` only gained "eye/eyes/eye color"; `COLORING_BODY` is new and extra; `guards.ts`, `bodyTap` and the emptied-reply refusal are untouched. The "my complexion" carve-out (`(?!my\b)`) only lets Kit's own sentence through if it says "my complexion", which Kit (an AI speaking in the first person) has no reason to say; "your complexion", "a pale complexion", "skin tone", "undertone", "eye color", "hair color" all still drop. The tap "Does this suit my complexion?" is still dropped by `checkFollowUps`/`bodyTap` (`complexion` is in `BODY_PARTS`). Verdict: does not break the hard line. A sentence that starts with the bare word ("Complexion is not the point.") also passes; harmless.
2. False positives: probed about 45 sentences. Ambiguous shop words (Target, Gap, Express, Guess, Champion, Boss) drop only when capitalised after a pointing word ("Try Target"); "the target", "a gap", "Boss the look" pass. Brand list adds no everyday words (Tiffany blue and "Dior-style" drop, which is fine). Links drop only on a scheme, "www." or a web suffix. Price drops "$30 pair of jeans", "tee costs $115" unless the amount is in the pack or evidence; "20 dollars" with no piece noun passes. Deny drops "I can't show you every outfit" (arguably a false positive, small) but passes "I can't tell if it's wool" and "I can't see the lining". Claim passes "I've added a note", drops "I changed the look". The color sentence rule only runs on a color question with a non-empty list, and it also drops a color of a piece he doesn't own ("keep the white sole clean" when white isn't allowed or his): by design, and a whole-answer drop falls to T117's emptied-reply handling.
3. T102 `shownToday` repeat check in `prepare.ts`: intact (`askedAgain(question) ? new Set() : shownKeysToday(...)`, unchanged lines in the diff).
4. Hermes-unsafe regex: none. No lookbehind, `matchAll`, `replaceAll`, named groups or `\p{}` in the diff; `pricesIn` uses an `allMatches` exec loop; `(?!my\b)` is a lookahead (safe).
5. App map never names a switched-off screen: yes for the five switches. The `tabs` line names "today's limits" and "Settings" always; both exist in the beta (`you.today.*`, `settings.title`).
6. Cut keeps the first sentence: yes (probed).

**Defects**
1. **code** `gate.ts` `rewritePieceNames` (line ~120) / its call in `createSentenceStream` (line ~345). It also fires on "the / those / these / that", so buying or swapping advice is turned into nonsense. Probed with one owned "Black sneakers": "Swap your black sneakers for the white sneakers." becomes "Swap your black sneakers for the black sneakers."; "Try the white sneakers instead." becomes "Try the black sneakers instead." This is the commonest way Kit names a piece to buy, and before T105 the `fact` rule dropped such a sentence, which was safer. Fix: rewrite only after "your" (leave "the/those/these/that" to the `fact` rule), and add a test for "Try the white sneakers instead." with a black pair owned. The KC5.2 "wrong color on one of his pieces" case is "your ...", so the criterion is still met.

**Small things worth a later look (never block)**
- A price with no piece noun in the sentence passes the price rule ("Expect to pay about $80."); widen later if T110 shows it.
- "I can't show you every outfit." is dropped by `deny`; a sentence-level false positive that costs one sentence.
- The tabs map line says "today's limits" even when no plan screen is on; harmless, but check it when the paywall switch changes.
- `TASK.md` Built has an empty "Tests added" line; list the three kitWords test files.

**Verdict: not ready** (one code defect). Nothing was run beyond the probe; `npm run check` was the session's.


### Round 2 (normal mode; the fix commit 7579e28c only; a throwaway probe test run and deleted)

**Criteria**
- Defect 1 (rewrite after the/those/that): closed. Probed with one owned "Black sneakers": "Try the white sneakers instead." and "Swap your black sneakers for the white sneakers." come back unchanged from `rewritePieceNames` (the fact rule still flags the "the white sneakers" part, so the sentence is dropped as it was before T105, the safe outcome).
- KC5.2 for "your <wrong color> <kind>": still met. "Wear your white sneakers.", "Your white sneakers look right." and "Wear YOUR white sneakers." become "...your/Your/YOUR black sneakers..." (capital kept). `kitWordsGate.test.ts` and the probe: 61 passed.
- Test edits: not weakened. The one changed case ("The brown boots disappear..." to "Your brown boots disappear...", in both the table and the stream test) encoded the bug and still checks the KC5.2 rewrite; two cases were added to the "unchanged" list ("Try the brown boots instead.", "Swap your sneakers for the white sneakers."). No `.only` or `.skip`. The stream test's expected text changed only in the third sentence's first word.

**Defects**: none open.

**Small things (never block)**: a "the/those/these/that <wrong color> <piece he owns>" sentence is dropped, not corrected, even when it did mean his piece ("The brown boots look good" with black boots owned); one sentence lost, never wrong words. The three round 1 notes above stay open.

**Verdict: ready.**

## Fix round 1 (coordinator)
- Review defect 1 fixed: `rewritePieceNames` now rewrites only after "your" (`gate.ts`). "the/those/that white sneakers" can be a piece he'd buy, so those go to the `fact` rule as before.
- Two committed tests changed to match: the "The brown boots disappear…" cases now start with "Your"; added "Try the brown boots instead." and "Swap your sneakers for the white sneakers." as unchanged. No test was weakened for a wrong reason: the old case encoded the bug.
- Small review notes left open (not blocking): a price with no piece noun passes; "I can't show you every outfit." is dropped by `deny`; the tabs line says "today's limits" even with no plan screen.
