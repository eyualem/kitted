# Do height and build make Kit's answers better? (Oct 24, DECISIONS-LOG #374)

**Asked by the founder:** "Check if it is [useful] or if it isn't." Run on his OK ("under 1 cent").

**Setup:** `app/src/__tests__/askBasics.manual.test.ts`.
- 7 fit, size and length questions, each asked under three profiles that differ only in height and build: none given, 6'4" broad, 5'6" slim.
- Fit preference "regular" in all three.
- Kit's own model, GPT-5.6 Luna, through the app's own pipeline (router, evidence, prompt, model, sentence gate), on the demo "full" scenario.
- **Rule 7:** a made-up test profile ("profile unknown"). The point is the difference between the three, not anyone's real answer.

**Cost:** 0.94¢ for 21 calls. Raw answers in `raw.json`.

**Blind judging:**
- Each question's three answers were shuffled under A/B/C (`judge-key.json` holds the key) and judged by a fresh Claude agent that didn't know which was which.
- It ranked them for a beginner, guessed each answer's profile, and flagged body talk.

## Result: height and build make no useful difference

| # | Question | Same advice? | Judge's ranking (unblinded) | Could the judge tell the profile? |
|---|---|---|---|---|
| 1 | How should chinos fit? | Same | tie | No |
| 2 | How long should my jeans be? | Same | slim > broad > none (a "don't drag behind the heel" line) | No |
| 3 | Is the overshirt too baggy? | Same | tie | No |
| 4 | What size hoodie should I get? | Different | slim > none > broad | Yes for broad ("roomy cut and longer sleeves"); the tailored answers hedged more |
| 5 | How long should a winter coat be on me? | Same length advice | slim > broad > none | Yes for broad, which **said his body back** |
| 6 | Should I get straight or slim jeans? | Same | none best | No |
| 7 | What should I buy next? | Different | none > broad > slim | No (see below) |

- **The judge couldn't place 5 of 7 answers.** The only answers it could place were two of the 6'4" broad ones.
- **No answer ever gave the shorter guy different advice.** Nothing said less break, a shorter coat or a closer leg.
- **The wins for the 5'6" answers came from incidental wording, not from his height.** With one answer per cell, they're noise.

## Found on the way

1. **The sentence gate missed a body comment.**
   - The 6'4" coat answer says "That length gives a taller frame clean coverage…" and "For a broad cut, keep the shoulders comfortable…".
   - `BUILD_BACK` in `app/src/features/ask/gate.ts` catches "for your build" and "since you're tall", but not "gives a taller frame".
   - With height and build in the pack, this kind of line can reach him.
2. **"What should I buy next?" named a navy polo once instead of the brown work boots.**
   - Height and build aren't the cause: the evidence was identical under all three profiles (boots +18, jeans +16, polo +12; checked with the prepare step, no model call).
   - So the model picked a lower item from the list. A chat follow-up: the buy answer should lead with the top piece, as Closet's Next best buy does (#309).
