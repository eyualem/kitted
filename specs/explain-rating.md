# Explain rating, and a quieter result card

**Approved by the founder:** 2026-11-10

After this, the result card shows one number and one fix, and a tap on **Explain rating** has Kit say in the chat, in his own voice, the one or two rules that made the score, so a guy learns why he got a 7.0 without reading a ledger.

**Part of:** `specs.md` → "A fit check", F2 (the fit check), F3 (re-check), F4 (fixing a misread), F5 (Kit), F8 (Lookbook). Works with `rubric/v5-styles.md` (the rules), `rubric/stylist-guide.md` §0 (Kit's voice) and `handoff/07-stylist-chat.md` §5 (the explain and feedback kinds) and §15 (the voice and the gate, built Oct 16–17).

## Why
On Nov 9 a friend testing the app felt overwhelmed by the numbers on the result card: the score, a gain on every fix ("→ 7.0"), "+1.0" pills, and a "Why 8.0" sheet of rows that add up. He said it felt "like sports betting". The founder: Kit should "explain why the person got that rating… rules should get mentioned… not too many rules at the same time, maybe one or two", the way a friend would say "it would have been nice if you'd tucked that in" or "bright blue and bright red are fighting". Apple-like restraint: one number, the detail folded away until he asks for it.

## Scope
- **In:** the Explain rating button on the result card and the re-check card; Kit's explanation in the Stylist chat (which rules, the voice, the checks on it, the code-written fallback); the plain names of the rules; what comes off the card and what the card says instead; the re-check's was → now; fixing a misread by telling Kit; two rows on Lookbook's look page (How I scored, Fix what I read); the server not counting an explanation.
- **Out (non-goals):**
  - The card's visual shape (corners, boxes, type): the redesign stage.
  - Share cards: cancelled until after launch (`specs.md` F12, edited separately).
  - Explain rating on Lookbook's look page (it has How I scored instead).
  - Any change to a score, a rule or a fix's order beyond the one rule below: this changes what the card **says**, never what the code computes.
  - A new kind of chat card: the explanation is an ordinary Kit answer, and the re-score offer uses Kit's existing tap card.

## What the user sees

### The result card (a first check)
1. The score and its word ("7.0 Put together"). The only number on the card.
2. The summary line under it, with no number:
   - a free move: `Good base. One easy change sharpens it.`
   - something he owns: `Good base. Something you own would sharpen it.`
   - a swap: `Good base. Swapping one piece would sharpen it.`
   - the other summary lines (`Clean and finished. Nothing to fix.`, `No quick fixes for this one.`, the loungewear and held-layer lines) stay as they are; none carries a number.
3. **One fix**, numbered 1, with its title and detail and no gain. When the card has a free fix, the one shown is a free fix **(assumed: keeps F2.7 true with one fix in view)**.
4. `2 more fixes` (or `1 more fix`) when there are more, which opens them in place, numbered 2 and 3, still with no gains. The "Next level" and weather tips sit behind the same tap **(assumed)**. With one fix and a tip, the tap reads `More`.
5. `Re-check after fixing` (as today, only while a re-check is open and there's a fix).
6. `Explain rating`, under Re-check; on its own where Re-check isn't shown (a 9+, no fixes, or the 30 minutes ran out).
7. Unchanged: the Going-for line, the closet summary row, the duplicate question, the finish row, `Later` on his first-ever check, the "re-scored from" footnote, and the partial-check label.

**Off the card:** `Why 7.5?` and the math sheet it opened; `Not quite right?`; the unsure-piece line (`Not sure about your mid-wash jeans' leg? Tap.`); the share button; every fix gain (`→ 7.0`); any `+1.0` pill.

### The re-check card
1. The score moving: the old score small, the new one big with its word, `6.5 → 7.5 Put together`. No `+1.0` pill, no gain on the fix he made.
2. Unchanged: what he did (`You tucked the tee.`), `Didn't catch the change? Tell me` (F3.3), `Try another photo`, the new-problem and not-seen lines.
3. `Explain rating`.
4. **Off:** `Why 7.5?`, `Not quite right?`, `Share the before and after`.

### Tapping Explain rating
1. The Stylist chat scrolls to the bottom and Kit's answer streams in, like any Kit answer (the dots, then the words), with his pieces as chips under it, as answers already show them.
2. **Tapping it again** on the same card doesn't ask again: the chat scrolls to the explanation already posted.
3. If he types a follow-up ("why does the tuck matter?"), that's a normal question.

### What Kit says
**Which rules (picked by the code, never the model):**
- **A first check:** the rule that cost the most points, with the card's first fix for it, then the rule that earned the most.
- **No rule cost anything:** the two rules that earned the most.
- **No rule fired at all:** why clean basics are "Put together" (nothing wrong and nothing chosen), and the card's first fix or tip as the way up.
- **A re-check:** the rule the fix cleared (or the credit it earned), then the biggest cost still left; when the score didn't move or went down, the biggest cost now.
- Costs include the occasion hold and the condition deduction; a piece that isn't in the photo never counts as a cost (F2.6).
- Biggest means the most score points; a tie goes to the rule that comes first in `rubric/v5-styles.md`.

**How it sounds** (the founder's pick, Nov 10: "the friend who's good at clothes", naming the rule):
- The friend voice in `rubric/stylist-guide.md` §0: warm, direct, a little dry; the move first, then the reason; his pieces by their Closet names; at most 3 sentences, no lists.
- It names the rule by its plain name, and by its known name too when the rule has one ("It's missing a waist break, the rule of thirds…").
- The only number it says is the check's score.
- The founder's two samples set the tone:
  - his flannel check, 7.0: `7.0, Put together. It's missing a waist break: the flannel and tee hang past your belt, so the outfit reads as one long block. Tuck the front of the tee and it gets a shape. The navy and light denim already work, so leave the colors.`
  - bright blue with bright red: `Two bright colors are fighting here. The blue and the red both shout, so neither wins. Keep the one you like more and make the other navy or black.`

**The code-written fallback** (offline, the model fails, or no answer within 6 s; also when Kit's answer fails a check below): a fixed template from the same picks.
- With a cost: `{score}, {word}. Holding it back: {cost name}. {fix}. Working: {credit name}.` e.g. `7.0, Put together. Holding it back: no waist break (the rule of thirds). Tuck the front of the tee. Working: navy and light denim go together.`
- With no cost: `{score}, {word}. Working: {credit name}, and {credit name}.`
- Nothing fired: `{score}, {word}. Clean basics: nothing wrong, nothing chosen yet. {first fix or tip}.`
- The fallback is never labelled as one and never counted.

### Fixing a misread (replaces "Not quite right?" on the card)
- **By telling Kit:** "those jeans are straight, not slim", "that's an overshirt, not a jacket". Kit's answer offers a tap card, `Re-score with straight jeans`; the tap opens the existing correction for that piece with his answer filled in, and it shows the new number before Save (F4.1). Saying it to Kit is free when it changes the piece (`specs/kit-stylist-chat.md` KC5.5, Nov 17); the re-score itself is free.
- **On Lookbook's look page:** a quiet row, `Fix what I read`, opens the same correction for that check.

### Lookbook's look page
Two quiet rows after the fixes: `How I scored` (today's math sheet, unchanged) and `Fix what I read`.

## States
| State | When | What he sees |
|---|---|---|
| Explaining | after the tap, before the first words | Kit's typing dots in the chat |
| Explained | the answer passed every check | Kit's answer, with piece chips |
| Fallback | offline, the model failed, 6 s passed, or the answer failed a check | the code-written line, as a Kit message |
| Already explained | he taps Explain rating again on that card | the chat scrolls to the earlier explanation |
| Not scored | a "not rated", unclothed or unreadable check | no Explain rating (there's no score to explain) |
| Folded card | an older card folded to its rating | the button shows once the card is opened |

## Rules
- **The AI sees, the code judges, the AI explains.** The model is handed only what the code picked: the score and word, the two rules (plain name, known name if any, the engine's own line for it), the card's first fix, his pieces' Closet names, and the occasion. It never sees the other rules or any other number, and it never adds a rule.
- **Checks on Kit's answer before it shows** (the existing gate, plus three):
  1. it names the first picked rule, by its plain or known name;
  2. the only number in it is the check's score;
  3. it says nothing about his face, body, weight, height, skin or hair (the existing gate).
  An answer that fails any of them is replaced by the fallback, whole.
- **Free and once per check.** An explanation never uses a question, on the phone or on the server. Each check (and each re-check) gets one; the answer is kept in the chat like any message. The server allows at most 2 uncounted explanations per fit check it counted that day (a check and its re-check), so the free call can't be used as free questions.
- **Rule names live in `@kitted/core`**, one entry per engine rule (about 74, plus the occasion hold, the condition deduction and the loungewear holds), each with a plain name and, for a few, a known name (the waist break: "the rule of thirds"). A test fails when an engine rule has no name. The names are words users read, so the founder OKs the list before it ships. The names never change a score; the Python engine stays the scoring truth and has no names.
- **A typed "why my 7?"** uses the same picks and the same voice, and counts as a question (as today).
- **Cost:** one explanation is about the size of a question, about 0.04¢ on GPT-5.6 Luna (measured at 0.035¢ a question, `handoff/07` §16.6): 1,000 explanations ≈ $0.40. It falls under the daily AI spend cap like any call.
- **Privacy:** what goes to OpenAI is the same kind of thing a question sends (clothes and rules as words, no photo, no name).
- **VoiceOver:** the button reads "Explain rating" (no hint, the founder's call); the re-check score reads "Score went from 6.5 to 7.5, Put together"; Kit's explanation reads as one element, as answers already do.

## Data
- **Chat message:** a Kit answer gains the check it explains (`explainsCheckId`), which is how a second tap finds it. No new table.
- **Server usage:** an explanation is logged as uncounted, against the day's counted fit checks, for the 2-per-check limit.
- Nothing about a check's score, reading or fixes changes.

## Acceptance criteria
**ER1. Explain rating**
- ER1.1 Kit's explanation talks about at most two rules, and every rule it names fired in `@kitted/core`'s result for that check: the biggest cost and the biggest credit by score points, or the other cases above.
- ER1.2 The only number in Kit's explanation is that check's score; an answer with another number, or one that doesn't name the first picked rule, is replaced by the fallback.
- ER1.3 An explanation never uses a question on the phone or on the server, and a second tap on the same card makes no new call and posts nothing new.
- ER1.4 Offline, on a model error, or after 6 s with no answer, the fallback is posted in Kit's voice from the same picks, and nothing is counted.
- ER1.5 On a re-check, the explanation leads with the rule the fix cleared or earned.
- ER1.6 Every engine rule has a plain name in `@kitted/core`; no score changes (core parity stays 100%).
- ER1.7 Nothing in an explanation is about his face, body, weight, height, skin or hair.
- ER1.8 The server refuses an uncounted explanation beyond 2 per fit check counted that day.

**ER2. The quieter card**
- ER2.1 A result card shows exactly one number: the score. A re-check card shows two: the old score and the new one. No fix gain, no pill, no math sheet link.
- ER2.2 One fix shows; the rest open from one tap; the one shown is a free fix whenever the card has one.
- ER2.3 Neither card shows "Not quite right?", the unsure-piece line or a share button.
- ER2.4 Explain rating shows on every scored result card and re-check card, and on no "not rated" or unscored card.

**ER3. Fixing a misread**
- ER3.1 Telling Kit a piece was read wrong offers a re-score for that piece; the tap opens the correction with his answer filled in, and the new score shows before Save.
- ER3.2 Lookbook's look page opens the correction (Fix what I read) and the math sheet (How I scored) for that check.

## Touches
- `@kitted/core`: the picks (biggest cost, biggest credit, the re-check's cleared rule) and the names table, read from the scoring result that already exists. Strict: it reads scoring output. No change to `parts.ts` scores; parity stays green.
- `app/src/features/ask/`: the explanation (an explain call with the picks as its only evidence), the three checks, the fallback, once per check, not counted; the feedback kind offering a re-score instead of opening "Not quite right?".
- `app/src/features/stylist/cards/FitCheckCard.tsx`, `RecheckCard.tsx`, `app/src/features/fitcheck/explain.ts` (the summary lines), `en.ts`: the quieter card and the button.
- `app/src/features/lookbook/`: the two rows.
- `firebase/functions/src/api/`: the uncounted explain call and its limit.
- The onboarding Example check (`specs/onboarding-screens.md` OS2) follows the same card rules: no gain on its fix, no Why.
- Must not break: same photo, same score (F2.1); every card with a fix has a free fix (F2.7); the re-check bar (F3.1); the correction's number before Save (F4.1).

## Assumptions
- The fix shown is a free one whenever the card has one (keeps F2.7 with one fix in view; the founder saw it in the ledger).
- The tips go behind the same tap as the extra fixes.
- 6 s before the fallback (Kit's first words land at a 0.66 s median on GPT-5.6 Luna, so 6 s is generous).
- ~~Saying a misread to Kit counts as a question; the re-score is free.~~ Replaced Nov 17 (the founder's yes, `specs/kit-stylist-chat.md` KC5.5): a message in which the code changed one of his pieces is free; the re-score is free.

## Open questions
- The plain and known names of all ~74 rules: drafted in the core task, OK'd by the founder (about 10 minutes) before the button ships.

## Later
- Explain rating on Lookbook's look page, posting into today's chat.
- A short "see the math" link under Kit's explanation, if testers ask where the numbers went.
