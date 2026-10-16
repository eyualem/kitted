# E0 · the stylist's first live answers (Oct 17, 2026, #310)

**What ran:** 22 questions × 2 runs, twice (round 1 as built in #303; round 2 after the fixes it showed), through the app's own pipeline (router → evidence → prompt → `gemini-3.5-flash-lite` → sentence gate → card), on the full demo scenario. Harness: `app/src/__tests__/askLive.manual.test.ts` (`ASK_LIVE=1`). Raw answers: `raw-round1.json`, `raw-round2.json`. Plus 3 questions typed in the web preview with `CHAT_LIVE` on.

**Profile (rule 7): profile unknown.** The demo scenario's made-up profile: smart casual (1st), workwear, regular fit, 5′10″, average build, $30–60 budget. No age band or picked-look split is possible from one invented profile.

| | Round 1 (#303) | Round 2 (fixes) |
|---|---|---|
| Answered | 44 of 44 | 44 of 44 |
| Cost | $0.054 · 0.123¢ a question | $0.055 · 0.126¢ a question |
| Tokens in / out (mean) | 4,227 / 75 (24% cached) | 4,537 / 71 (27% cached) |
| First words, median / p90 | 0.96 s / 2.1 s | 1.01 s / 1.7 s |
| Whole answer, median / max | 1.2 s / 3.5 s | 1.2 s / 7.3 s |
| Voice checks flagged (code) | 4 (3 long leads, 1 false alarm) | 3 (long leads) |
| Sentences the gate dropped | 1 ("body", a fit line about legs) | 1 |

All spend together, with the smoke test and the web preview: **about $0.12** of the $0.50 OK'd.

**What round 1 got wrong (all code-side, fixed for round 2):**
1. The live model was refused outright before any of this: Flash-Lite 3.5 rejects `thinkingBudget: 0` (HTTP 400), so every answer on the phone would have failed. Now `thinkingLevel: "minimal"`.
2. "What if I wore the Chelsea boots instead of the loafers?": the evidence never said he wore white sneakers on that check, so the answer argued about loafers he wasn't wearing. The what-if evidence now lists what that photo shows.
3. "Is my outfit today good?" reached the model with no check; it suggested adding the layer he was already wearing. It now routes to today's check ("Yes, it scored a 9.0 today…").
4. "Is the overshirt too baggy?" (he owns two, no photo): it claimed the navy one fits fine. Now: "I can't see the fit… Send me a fit check photo".
5. Piece names kept their capital mid-sentence ("your Navy overshirt"): lowered by code.
6. It copied the prompt's examples word for word and steered unrelated answers to his career fair: two prompt rules.
7. A rude message got "I'm here for it.": a new example ("Fair, I missed that one. Tell me where you're headed…").
8. (Web preview, `CHAT_LIVE` on) one answer wrote the internal handles "(P13)": the gate now cuts them, and a sentence with a bare handle is dropped. `expo/fetch` doesn't work in a browser; the web preview uses the browser's fetch.

**What's still off in round 2 (the model, not the code):**
- An invented detail now and then: "the chunky black leather" (the boots aren't read as chunky), "your straight jeans" (his dark jeans are slim). The advice around them was right.
- "I can't see the fit in that photo" when there is no photo (should be "without a photo").
- "Do I look fat…" still reuses the example's "go up a size so it hangs instead of clinging" (the refusal line itself is meant to be fixed).
- Leads over 20 words on 3 answers.

**How it sounds (Claude's read; the founder's blind pick is E2):** close to voice 1. Short, plain, the move first, his pieces by name, the "can I wear" answers follow the rules' verdicts (the interview tee → "Skip the tee for an interview… swap it for your light-blue oxford"; the slim jeans → "works, with a better option"). Brand fishing never named a brand. Steady between runs: the same advice for the same question on every pair (olive overshirt, date, career fair, buy next: a grey quarter-zip, +12, matching the code's count). Weakest: the fit how-tos, which are generic.
