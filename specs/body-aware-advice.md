# Body-aware advice

After this, a guy who tells Kit how shirts and jeans off the rack fit him, and his height band, gets fixes, answers and outfit ideas that lead with the cuts that suit his frame, while his score stays about the outfit, and nothing in the app ever says anything about his body.

**Part of:** `specs.md` → F17 (new), F5 (Kit), F6 (morning card), F9 (You), Data. Interview: T97, Nov 16, 2026.

## Why
The founder (Nov 16): "We have to tailor whatever advice we're giving to people based on their body type instead of just making it an all-rounder. For example, what I wear may not look good on a skinnier person, or what the skinnier person wears may not look good on me. Same goes for a bigger person."

**Tried once before.** Height and build were sent to Kit from Oct 15 (DECISIONS-LOG #267) and removed on Oct 24 (#375) after a blind test (#374): the advice was the same on 5 of 7 questions, the shorter profile never got different advice, and one answer said the body back ("gives a taller frame"). It failed because nothing in the code or Kit's knowledge changed with build, so the model had nothing to act on. This spec fixes that at the root: **the code** picks suited cuts from a table sourced from the founder's creators, the AI never sees the answers, and a test proves the advice changes.

**What the creators say.** Frugal Aesthetic gives tee cuts by build (`FlQ3WZ-H2Ik` [04:22]–[07:29]); Wanhee Kim gives a few notes on one-color outfits and looser fits (`ew3gCk1zkso` [10:11]–[10:42]); Tim Dessaint calls "dress for your body type" over-prescribed and keeps one part of it: take the silhouette you like and "find pieces with the right proportions for your body" (`vQd36IKIkOg` [00:36]–[03:25]). The rulebook (T95) left these segments out on purpose; nothing yet covers jeans by build, jackets by build or tall guys. So the table is researched first (BA3) and the founder marks every row.

## Scope
- **In:** three optional questions Kit asks once each, at the moment they matter (BA1); rows to change them in Style profile and What Kit knows (BA2); the suited-cuts table, researched and marked by the founder (BA3); the score card's fix order (BA4); Kit's answers (BA5); the morning and evening card and Swap (BA6); Kit's words and the sentence gate (BA7); privacy, sync and what's sent (BA8); the pass bar (BA9).
- **Out (non-goals):**
  - Any change to a score. Same photo, same score. The Python engine and the parity tests don't change.
  - Reading height, build or anything about his body from a photo, or inferring it from his sizes, his closet or his questions.
  - Weight, body measurements, body shape names (slim, athletic, broad, bigger) as options or in any words the app shows.
  - Forbidding a cut. Kit leads with what suits; it never says "you can't wear" anything.
  - Asking in setup.
  - Next best buy in suited cuts (off for the beta; Later).
  - Sizes by brand, or a size calculator.
  - Fitness, diet or body advice of any kind (F5.2's decline stays).
- **When:** in the TestFlight build the beta testers get, before the beta invites go out (the founder, Nov 16). This holds the invites (T85) until it passes.

## What he sees

### BA1. Kit asks, once, when it matters
Three cards, each a Kit tap card in Stylist with one question, a reason line, the options and `Not now`. Nothing is picked to start.

| Card | Question | Reason line | Options |
|---|---|---|---|
| Shirts | `How do shirts off the rack usually fit you?` | `So I can pick cuts that suit you.` | `Loose in the chest and arms` · `About right` · `Tight in the shoulders and chest` · `Tight around the middle` · `Not now` |
| Jeans | `How do jeans off the rack usually fit you?` | `So I can pick cuts that suit you.` | `Loose in the legs` · `About right` · `Tight in the thighs` · `Tight in the seat and waist` · `Not now` |
| Height | `How tall are you?` | `So I can get lengths right.` | `Under 5′8″` · `5′8″ to 6′0″` · `6′1″ or taller` · `Not now` |

Words: the shirts card is the founder's pick (set A, Nov 16); the jeans and height cards are drafts he approved with this spec.

**When a card shows.** A card shows only when his answer would change what he's being shown right then:
- **After a scored check or re-check:** the code runs BA4 with every possible answer to that card; if any answer would change the fix shown first or its tag, the card posts under the score card, once that card has landed.
- **With Kit's answer:** when he asks a fit, buy, "what goes with" or "can I wear" question about tops (shirts card), pants (jeans card) or a length, hem, break or jacket length (height card), the card is Kit's one attachment to that answer.
- **Never:** in setup; on his first-ever scored check; more than one ask card in a day; a card he has answered, tapped `Not now` on or already been shown. A card he scrolls past unanswered counts as shown, and still works if he taps it later.

**On a tap.** The answer saves at once. Kit's line under it: `Got it.` (code-written). If the card sits under a score card, that card's fixes re-order at once (BA4); the score doesn't change. `Not now` saves nothing and the card is never shown again; he can still set it in Style profile.

### BA2. Changing or removing it
- **Style profile → Basics** gets three rows below `Fit you like`: `Height`, `Shirts off the rack`, `Jeans off the rack`. Each shows his answer or `Not set`, and opens the same options plus `Clear`. (`Fit you like` is his taste and stays as it is; these say how clothes fit him.)
- **Privacy & data → What Kit knows** lists each answer he gave as a fact, with its source (`You told Kit` and the date) and Remove. Remove clears it, as `Clear` does.
- **Privacy & data → See what I send** shows the cuts line exactly as it's sent with questions (BA8), or nothing when he hasn't answered.
- Clearing or removing an answer never brings its card back; Style profile is the way to set it again.
- `Delete all my data` clears all three answers and the shown marks; `Delete account and all data` also removes the server copy.

### BA3. The suited-cuts table
A table from each answer to the cuts that suit it: which top cuts, which leg shapes, which lengths, each with a one-line reason in clothing words and its sources.
- **Lives in** `rubric/suited-cuts.md` (the founder's copy, with sources) and `@kitted/core` (the code's copy); a test fails when the two differ.
- **Sourced** from the founder's four creators, videos from 2023 on, read as transcripts in the in-app browser: each row has a creator, a video id, a `[mm:ss]` stamp and a quote of 12 words or fewer. No AI summaries. Where a row has no creator behind it, it says so and isn't used until the founder marks it.
- **Marked by the founder:** every row Keep, Change or Drop before the build uses it. Only Keep rows (and Change rows as changed) are in the code.
- **Rows say what suits, never what's forbidden:** a cut is either "suits" (leads) or not mentioned. `About right` and `5′8″ to 6′0″` have no rows: they change nothing.
- **Starting points the research builds on (from the sources above; nothing here is in the code until marked):** shirts loose in the chest and arms: a slim or a boxy, oversized tee both work, a regular cut a size down; tight in the shoulders and chest: slim or boxy tees, room in the shoulders; tight around the middle: boxy or oversized tees, looser cuts. Under 5′8″: tops ending at the belt or hip, cropped jackets, one clean break, one color head to toe reads as one long line. Jeans rows and 6′1″-or-taller rows: no source yet.

### BA4. The score card's fix
- The fix engine's fixes are unchanged: every fix shown still really raises the score (the engine's own rule).
- Among them, a fix that matches a suited cut for his answers is **suited**. A suited fix moves ahead of an unsuited one when both are the same kind (free, from his closet, free if he owns one, tailor) and the suited one raises the score by at least half as much. Otherwise the engine's order stands.
- When the engine offers swaps to two leg shapes or two top cuts with gains that pass the same test, the suited one shows.
- A suited fix shows the tag `Picked for your fit` in small grey text under it; tapping the tag opens Style profile.
- With no answers, the card is exactly as today.
- The score, its word and every number on the card are the same with or without answers.

### BA5. Kit's answers
- Kit gets one extra evidence line when he's answered: `Cuts that suit him: {cuts}.` (for example `straight or relaxed legs; boxy or regular tees; tops that end at the belt or hip`). The phone builds it from BA3; his answers themselves are never sent.
- Kit leads with the suited cut and may give the other as the twist ("Once that feels easy, try…", stylist guide §0).
- He asks for a cut that isn't suited ("should I get slim jeans?"): Kit says how to make it work in proportions that suit him, never that he can't.
- His answers decide nothing Kit can say about him: "Am I too skinny for oversized?" still gets `I rate outfits, never people.` and the clothes part answered, now with his suited cuts.
- Not answered yet and asking a fit or buy question: Kit answers as today, with the right card attached (BA1).

### BA6. The morning and evening card, and Swap
- Between outfits from his closet that work equally well (the same result from the code's checks), the one whose pieces match more of his suited cuts goes first, and Swap tries those first.
- An outfit picked this way shows `Picked for your fit` under its pieces (tap: Style profile).
- Nothing else about the card changes (weather, warm layer, the closet threshold of F6.2).

### BA7. Kit's words
Only what the clothes do, never what they do to him (the founder, Nov 16).
- **OK:** "A straight leg gives the thigh room and falls clean to the shoe." "One color head to toe makes one long line." "A boxy tee hangs straight from the shoulders."
- **Never, in any sentence the app shows (code-written or Kit's):** his answers said back ("since your shirts run tight"), his height, a build or shape word aimed at him (slim, skinny, thin, athletic, broad, big, bigger, stocky, heavy, tall, short, frame, build, figure, body type), or a body effect: look taller, look shorter, look slimmer, look bigger, slimming, hides or hide, flattering, elongates you, adds height.
- The sentence gate (`ask/gate.ts`) drops any sentence that breaks this, and every code-written line is checked by the same test. The gate already catches "since you're tall"; it gains the body-effect words and the "frame" phrasings it missed in October ("gives a taller frame").
- The stylist guide's waistline example ("so your legs look shorter", §4) is reworded to the line the clothes draw.

### BA8. Privacy, sync and what's sent
- **His answers:** on the phone, and in his profile on Firestore when he's signed in (restored on a new phone). Never sent to Google (Gemini), OpenAI or PostHog; never in an analytics event.
- **Sent to OpenAI with questions:** only the cuts line of BA5, kept by OpenAI up to 30 days for abuse checks, as every question is.
- **Consent** for questions (draft, the founder approves the words with this spec): `questions you type to Kit, to OpenAI, with your style picks, the fit you like if you gave it, the cuts that suit you if you told Kit, what you've told Kit, and your closet as words (never your photos)`. Sending more means `CONSENT_VERSION` goes to 3, so everyone who agreed before sees the agreement once more.
- **The App Store privacy label** adds Other Data Types (collected when signed in, linked to him, used for app functionality, never for tracking); the privacy manifest and the privacy policy say the same (the founder approves the policy's words).
- **Not health data:** a height band and how clothes fit aren't health data under the strictest US law (Washington's My Health My Data Act; the analysis in #267). Weight is never asked for, stored or sent.

## States
| State | When | What's shown |
|---|---|---|
| Not asked | before a card's moment | nothing; today's advice |
| Card shown | BA1's moment | the card, as in BA1 |
| Answered | a tap | `Got it.`; fixes re-ordered if under a score card; tags where suited |
| Not now | a tap | nothing more; never asked again |
| Cleared or removed | Style profile or What Kit knows | today's advice; the card isn't shown again |
| About right / 5′8″ to 6′0″ | that answer | today's advice (no rows) |
| Offline | a tap | the answer saves on the phone; syncs later if signed in |

## Data
- New on his profile, each optional: `heightBand` (`under_5_8` · `5_8_to_6_0` · `6_1_plus`), `shirtsFit` (`loose` · `about_right` · `tight_shoulders` · `tight_middle`), `jeansFit` (`loose` · `about_right` · `tight_thighs` · `tight_seat`), each with the date he set it. Synced with the profile when signed in (`specs/sign-in-and-backup.md`'s profile).
- New on the phone only: which cards have been shown (and the day of the last one, for one a day).
- The old, empty `height_cm` and `build` columns (#375) stay unread; the new fields don't reuse them.

## Acceptance criteria
**BA1. Asking**
- BA1.1 No setup screen asks for height or how clothes fit; F1.1's tap count is unchanged.
- BA1.2 After a scored check (not his first), a card posts only when some answer to it would change the first fix or its tag (a test runs a fixed set of readings with every answer); otherwise none posts.
- BA1.3 A fit, buy, "what goes with" or "can I wear" question about tops, pants or lengths attaches the matching card when it hasn't been shown, and no card when it has.
- BA1.4 At most one ask card a day; never on the first scored check; a card shown, answered or dismissed with `Not now` never shows again.
- BA1.5 A tap saves the answer, posts `Got it.`, and re-orders that score card's fixes at once; its score and every number on it are unchanged.
- BA1.6 Each card's words are exactly the table's; nothing is pre-picked; VoiceOver reads each option as a button.

**BA2. Changing or removing**
- BA2.1 Style profile shows `Height`, `Shirts off the rack` and `Jeans off the rack` with his answer or `Not set`; each changes or clears it.
- BA2.2 What Kit knows lists each answer with `You told Kit` and its date; Remove clears it.
- BA2.3 See what I send shows the exact cuts line sent with questions, or nothing with no answers.
- BA2.4 `Delete all my data` clears all three and the shown marks; `Delete account and all data` also removes them from the server (a server test).

**BA3. The table**
- BA3.1 Every row in `rubric/suited-cuts.md` has a creator, a 2023+ video id, a stamp and a quote of 12 words or fewer, or says it has none; every quote is found in its transcript within 40 seconds of its stamp (a script).
- BA3.2 Every row the code uses is marked Keep or Change by the founder; a test fails if the code's table and the founder's copy differ.
- BA3.3 No row names a body shape or says a cut is forbidden; `About right` and `5′8″ to 6′0″` have no rows.

**BA4. The card's fix**
- BA4.1 For every reading in the parity fixtures and every combination of answers, the score is identical to the score with no answers.
- BA4.2 Every fix shown with answers is a fix the engine returns without them, with the same gain (nothing invented).
- BA4.3 A suited fix leads over an unsuited one only when both are the same kind and its gain is at least half the other's; a test covers both sides of the line.
- BA4.4 Every answer that has rows changes the first fix on at least one fixed test reading (the October failure can't repeat silently).
- BA4.5 A suited fix shows `Picked for your fit`; tapping it opens Style profile; with no answers no tag shows.
- BA4.6 The Python engine, its fixtures and the parity tests are unchanged.

**BA5. Kit's answers**
- BA5.1 Kit's evidence pack carries `Cuts that suit him: …` when he's answered and no line when he hasn't; no request to any server contains his answers, his height band or the words of the card options (a test over every request builder).
- BA5.2 On the blind re-run (BA9), Kit leads with a suited cut on the questions where his answers have rows.

**BA6. The morning card**
- BA6.1 With two outfits that pass the code's checks equally, the one with more suited pieces is posted first and Swap tries it first; with no answers, today's order.
- BA6.2 An outfit picked this way shows `Picked for your fit`.

**BA7. Words**
- BA7.1 The gate drops every sentence in a red-team list (his answers said back, his height, each build or shape word aimed at him, each body-effect phrase in BA7, and October's "gives a taller frame") and keeps the clothing sentences in BA7's OK list.
- BA7.2 Every code-written line (cards, tags, `Got it.`, fixes' copy, the morning card) passes the same check.
- BA7.3 On the blind re-run, no sentence names his body, height or answers.

**BA8. Privacy**
- BA8.1 No PostHog event, Gemini request or OpenAI request carries an answer (a test over every builder; the cuts line is the only addition, and only to questions).
- BA8.2 Signed in, the answers restore on a new phone; signed out, they stay on the phone.
- BA8.3 The consent line names the cuts; `CONSENT_VERSION` is 3; agreeing to 2 shows the agreement once more.
- BA8.4 The privacy manifest and the App Store label list Other Data Types; the privacy policy says what's kept and why.

**BA9. The pass bar (before it ships)**
- BA9.1 `npm run check` green with every test above.
- BA9.2 October's blind test re-run (the founder's OK first; under 2 cents): 7 fit, size and length questions × 4 profiles (no answers; loose shirts and jeans, under 5′8″; tight in the shoulders and thighs, about right height; tight around the middle and in the seat, 6′1″ or taller), on Kit's own model through the app's pipeline, judged blind. Passes when the advice differs from the no-answer profile on at least 5 of 7 questions, the judge places at least 4 in 5 tailored answers with the right profile, and no sentence breaks BA7.

## Touches
- `@kitted/core`: a new suited-cuts table and a layer applied after the fix engine (`partsFixes.ts` / `fixes.ts` unchanged) and after `ideas.ts`'s outfit order; their tests.
- `app/src/features/ask/` (the pack, the gate, the card attachment), `stylist/` (the cards under the score card), `fitcheck/` (the tag), `morning/` (the order and tag), `you/` (Style profile rows), `privacy/` (What Kit knows, See what I send, wipe), `sync/` (the profile fields), `data/types.ts`, `en.ts`, `onboarding/complete.ts` (`CONSENT_VERSION`).
- `__tests__/heightBuildRemoved.test.ts` guards October's removal; its checks that consent never names height or build stay true (the cuts aren't height or build), and its checks on the old columns stay. Any check it holds that this spec changes is replaced with this spec's criterion in the same commit, never just deleted.
- `rubric/stylist-guide.md` §0 and §4 (the words), `rubric/suited-cuts.md` (new).
- Must not break: the score, the parity tests, F1.1's tap count, F5.2's decline, F5.3, F16.1.

## Assumptions
- What Kit knows lists the answers as well as Style profile (both remove the same data).
- A card scrolled past unanswered counts as shown.
- The build is a strict task (it changes what leaves the phone), split into the core-and-privacy part and the screens part.
- "The same kind" of fix is the engine's own fix classes.

## Later
- Next best buy in suited cuts, when it's back after the beta.
- Jacket and coat lengths by height, if the research finds sources.
- Measuring whether suited fixes get re-checked more often (with PostHog, T91).
