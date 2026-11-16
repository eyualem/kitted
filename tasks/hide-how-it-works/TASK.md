# Hide how Kitted works inside: the audit

**Status:** audit only (Nov 16, 2026). No app code, copy, spec or legal text was changed. Every "Proposed" line below is a **draft for the founder's OK**; nothing ships until he says yes in chat (CLAUDE.md: words users read are his call; `specs.md` and approved specs change only with his yes).

**His words (Nov 16):** "we can tell them that we use AI, but we don't have to tell them how we work." The friends' beta is paused, so this is not urgent for testers, but it must land before launch.

## 1. The short version

- **What a user can read today that explains how Kitted works:** (a) which AI companies get their photos and questions, in 6 consent keys, the You → Privacy page and the live privacy page; (b) the engine's own names: the five scoring parts (Proportions, Fit, Color, Shoes, Style), their weights in percent, "everyone starts at 7.0", "the best score today is 9.5", 28 named rules, 33 "...lifts" fix lines; (c) the version line "Scoring v1.8.0"; (d) the privacy page's and App Store draft's description of the pipeline ("the AI describes the clothes, the app's rules score it").
- **Two different kinds of "secret":** the vendor names are not really secret (the privacy policy must name them and is public; anyone can read the app's network traffic). The real trade secret is the scoring: the parts, weights, rules and numbers. The proposal protects the second hard and the first as far as Apple allows.
- **The one hard constraint is Apple 5.1.2(i)** (section 3). The recommended split is generic words in the app, names on the privacy policy page, **but I could not confirm Apple accepts a consent screen with no provider name**, so section 3 gives a safer fallback and asks him to pick.
- **The consent version does not need a bump** for a rewording (section 4).
- **A tension to decide:** the approved Explain-rating spec has Kit name rules in plain words ("the rule of thirds") in chat. That is advice, not the formula, and I recommend keeping it. But it does show which rules exist. See D3.

## 2. The inventory

"Key" = the string key in `app/src/i18n/en.ts` (the merged table is `en.generated.ts`, built from `handoff/02-screens.md` §5, plus overrides in `en.ts`; the live words are the merged ones). Where it shows is what a tester sees on their phone. No user-visible vendor or engine string is hard-coded in `app/src` outside `en.ts`/`en.generated.ts`: the other hits (`SamplePhotosSheet.tsx`, `closet/session.ts`, `complete.ts`, `ask/*`, `services/*`) are code comments, file names or internal constants.

### A. AI companies named (vendors)

| # | Key / file | Where it shows | Current words | Proposed (draft for his OK) |
|---|---|---|---|---|
| A1 | `onb.consent.sentBody` | Consent screen, "What gets sent" | "To score your outfit and answer your questions, Kitted sends these to two AI services:" | "To score your outfit and answer your questions, Kitted sends these to trusted third-party AI services:" |
| A2 | `onb.consent.sent1` | Consent screen | "your outfit photo, to Google's Gemini, with your face blurred first (if we can't blur it, we don't send it)" | "your outfit photo, to a trusted AI partner, with your face blurred first (if we can't blur it, we don't send it)" |
| A3 | `onb.consent.sent2` | Consent screen | "photos of clothes you add to your closet, to Google's Gemini" | "photos of clothes you add to your closet, to the same AI partner" |
| A4 | `onb.consent.sent3` | Consent screen | "questions you type to Kit, to OpenAI, with your style picks, the fit you like if you gave it, what you've told Kit, and your closet as words (never your photos)" | "questions you type to Kit, to a trusted AI partner, with your style picks, the fit you like if you gave it, what you've told Kit, and your closet as words (never your photos)" |
| A5 | `onb.consent.kept2` | Consent screen, "What happens to it" | "Google and OpenAI use them only to give you an answer and don't use them to train their AI." | "Our AI partners use them only to give you an answer and don't use them to train their AI." |
| A6 | `onb.consent.kept3` | Consent screen | "Google keeps them up to 55 days and OpenAI up to 30 days, only to check for misuse, then they're deleted." | "They may keep them for up to 55 days, only to check for misuse, then they're deleted." (**keep the retention honest:** the longest of the two, 55 days; or keep both numbers if he prefers) |
| A7 | `onb.consent.footer` / `onb.consent.footerPath` / link | Consent screen | Privacy Policy link shows when `PRIVACY_URL` is set (it is: the page is live) | **Add one line under the list:** "Who these partners are is in our Privacy Policy." with the link, so "who gets it" is one tap away (D1) |
| A8 | `privacy.promise` | You → Privacy & data, top | "Your photos are saved only on this iPhone. To score a fit, a copy with your face blurred goes to Google's Gemini. Google keeps it up to 55 days to check for misuse and doesn't train on it. Questions you type to Kit go to OpenAI, which keeps them up to 30 days to check for misuse and doesn't train on them either." | "Your photos are saved only on this iPhone. To score a fit, a copy with your face blurred goes to a trusted AI partner. Questions you type to Kit go to one too. They keep them up to 55 days, only to check for misuse, and don't train on them." |
| A9 | `privacy.consentSub` (+ `{provider}`) | You → Privacy & data, under the "Score my fits" switch | "Face-blurred photos go to {provider}, questions to OpenAI" (`{provider}` = "Google's Gemini API") | "Face-blurred photos and your questions go to our AI partners" |
| A10 | `config.providerDefault` | feeds `{provider}` in A9, `noConsent.body`, `privacy.sent.body`, the consent screen | "Google's Gemini API" | "our AI partner" (one key change covers the three places below) |
| A11 | `noConsent.body` | Chat card after "Not now" | "To score a photo, I need your OK to send a face-free copy to {provider}." | "To score a photo, I need your OK to send a face-blurred copy to our AI partner." (also moves "face-free" to the "face blurred" wording the log already settled, #233) |
| A12 | `privacy.sent.body` | You → Privacy → See what I send | "This is the copy your last check sent to {provider}. Your face is blurred on this iPhone before anything leaves it." | "This is the copy your last check sent. Your face is blurred on this iPhone before anything leaves it." |
| A13 | `privacy.a11y.consentOffHint` | VoiceOver on the switch | "Stops sending photos to Google and questions to OpenAI" | "Stops sending photos and questions to our AI partners" |
| A14 | `privacy.google` (unused key) | not shown | "A face-free copy of each check goes to {provider}. Google keeps it up to 55 days..." | delete or reword with the others so nobody wires it back |
| A15 | `en.generated.ts` copies of `onb.consent.kept2/kept3`, `config.providerDefault`, `privacy.google`, `privacy.consentToggle` ("Send to Google for fit checks and questions") | not shown (overridden by `en.ts`) | name Google | The deck `handoff/02-screens.md` §5 is the source, so fix the deck rows too, or a regeneration brings the names back |
| A16 | `acct.google`, `acct.provider.google` | Sign-in sheet | "Continue with Google" | **Leave.** This is a login choice, not how Kitted works |
| A17 | Kit's chat answers (`app/src/features/ask/prompt.ts`, `ANSWER_RULES`) | A user asks "what model are you?" or "how do you score?" | The prompt only says "if he asks who you are... say plainly that you're Kit, an AI that helps with clothes". Nothing tells Kit not to name its vendor or recite rules | Add one line to the prompt (and bump `PROMPT_VERSION`): "If he asks which AI or model you are, or how scoring works inside, say you're Kit, an AI that helps with clothes, that how you work inside stays private, and offer to explain his score." Words users read, so it needs his OK. Needs a test with the prompt's existing guards |

### B. Rules, parts, weights and numbers (engine words)

The `why.*` and `pwhy.*` keys, the Why sheet and the parts strip are being replaced by the approved Explain-rating spec (T58, T65, T66; `specs/explain-rating.md`). **I am not redesigning them; this is only the list**, so the replacement is checked against it.

| # | Key / file | Where it shows | Current words | Proposed |
|---|---|---|---|---|
| B1 | `pfix.*.step`, 33 keys (`pfix.tuck.step`, `pfix.cuff_pants.step`, `pfix.fit_better.step`, `pfix.hem_tailor.step`...) | A fix line's "step" half, joined to a part: "A full tuck lifts" + "Proportions to 7.5" | "A full tuck lifts", "A cuff lifts", "Steaming it lifts", "Wearing your {item} lifts"... | Drop the "lifts {part}" half. Fix lines say the move and, if needed, the plain reason, with no engine part or number: "Tuck in your tee. It gives you a waistline." Whether the step text stays at all is T66's call (one fix, no gain). |
| B2 | `pfix.copy.raisesOne`, `raisesOneSame`, `raisesTwo`, `smallerStep` | Fix card's "why this fix" line | "Raises {part} to {to}", "Raises {part} and {part2}", "{step} {part} to {to}. Not enough to move the score yet." | "Makes it look more put together" style lines with no part name and no number. T66 removes gains anyway; this makes sure the part names go with them. |
| B3 | `pfix.next_street_jacket`, `next_workwear_coat`, `next_minimal_tuck`, `next_prep_blazer`, `next_smart_tuck`, `next_color` | "Next level" line on a card | "...gives it the streetwear shape and lifts Proportions." ... "lifts Color." | "...gives it the streetwear shape." (drop "and lifts Proportions/Color"; keep the style advice) |
| B4 | `PARTS_DATA.partNames` in `@kitted/core`, shown by `PartsBreakdown.tsx` and `partsRows.ts` | Why sheet's parts strip, VoiceOver ("Parts: Proportions 7.0, Fit 7.0...") | Proportions, Fit, Color, Shoes, Style (+ "Condition", the occasion floor) | Gone with the Why sheet (T66). If a part word survives anywhere, use plain words ("the shape", "the fit") never the engine's five. |
| B5 | `pwhy.weight` ("{n}%") and the rows around it | Why sheet, each part's share | e.g. "Proportions 30%" (the real weights) | Never shown. **Highest-value item in this audit: the weights are the formula.** |
| B6 | `why.how.title`, `why.how.body1`-`body5`, `why.howLink` ("How I score ›") | Why sheet's "How I score" panel | "Everyone starts at 7.0. That's a clean, basic outfit." / "Credits add points: a layer, an elevated piece, a point of interest, and shoes that match." / "Mistakes take points off..." / "The best score today is 9.5. The same photo always gets the same score." / "I never score your face, body, weight or skin." | Whole panel goes with the Why sheet (T66). Keep only the last line's promise in the privacy words: "I never score your face, body, weight or skin." |
| B7 | `why.sub`, `pwhy.sub` | Why sheet subtitle | "Same photo, same score. Here's the math." / "Same photo, same score. Every part starts at 7." | Gone with the sheet. |
| B8 | `why.credit.*`, `why.example.*`, `why.partialRow`, `why.total`, `why.rounded`, `why.adjust`, `why.reason.*` (9), `why.noMistakes`, `why.mistakes` | Why sheet rows | "Everyone starts at", "Elevated piece", "Shoes that match", "Layered", "Point of interest", "Rounded to the nearest half", "Score limits", "not in the photo, so no points lost"... | Gone with the sheet. |
| B9 | `why.rule.*`, 28 keys (`F4_pooling`, `C1b_too_many_colors`, `O4_loungewear_out`...) | Why sheet's mistake rows | "Pants pool at the shoe", "Too many colors", "Loungewear outside the gym"... | Replaced by T65's plain-name table (about 74 names, Y24 is his OK). These are advice words, not numbers; see D3. |
| B10 | `pwhy.fitNote`, `pwhy.average`, `pwhy.bonus`, `pwhy.piled`, `pwhy.floor`, `pwhy.condition*`, `pwhy.partsAlone`, `pwhy.rounded`, `pwhy.na*`, `pwhy.strip.*`, `card.score.hint` ("Shows the breakdown.") | Why sheet | "I can spot a bad fit, not a great one yet, so Fit stops at 7." / "Average of the parts" / "Strong in more than one part" / "Lowest score at {occasion}"... | Gone with the sheet. `pwhy.fitNote` is the sharpest leak (admits an engine limit). `card.score.hint` goes with the tap-for-breakdown. |
| B11 | `card.why` ("Why {score}?"), `onb.example.whyHide` ("Hide the math") | Result card button; the Example check on Welcome | "Why 7.5?" / "Hide the math" | T66 removes both buttons; Explain rating is the replacement. "Hide the math" goes with the Example's Why. |
| B12 | `settings.versionLine` | You → Settings, footer | "Kitted 0.1.0 (1) · Scoring v1.8.0" (the deck's "Rules v{rules}" is overridden) | "Kitted 0.1.0 (1)". The scoring version helps Claude and the founder debug beta reports; keep it in the "Report a wrong score" email body (`settings.report.subject` already carries the app version) rather than on screen. |
| B13 | `card.rulesNote` ("Scored with rules v{version}"), `settings.version`, `share.watermark` | not shown (unused today) | "Scored with rules v..." | delete the unused keys |
| B14 | `onb.example.note` | Welcome's Example check | "A drawn example, scored by the same code as your photos. Nothing was sent." | "A drawn example. Nothing was sent." |
| B15 | Lookbook look page: "How I scored" | **Not in the app yet.** No string exists today; Explain-rating ER3.2 and T75 add a "How I scored" row ("today's math sheet, unchanged") | (planned) "How I scored" opening the math sheet | **Flag for the founder:** the spec's wish to keep the math sheet behind a Lookbook row would keep all of B4-B10 reachable. Recommend T75 not add it and keep only "Fix what I read". Spec line `ER3.2` and `specs/explain-rating.md` line 77 would change: needs his yes. |
| B16 | `pfix.tag.*`, `pfix.copy.dialedIn`, `fix.*`, `recheck.*`, `rescore.*`, `nqr.*` ("Score stays {score}", "Same photo. It would be {after} instead of {before}.") | Cards, re-score sheet | Score numbers and "Same photo" | **Leave.** The score and "same photo" are the product, not the method. |
| B17 | "Same photo, same score." (marketing: `why.sub`; App Store promo text and description) | Promo text, description | A promise that the score is deterministic | Founder's call (D4). It says "a fixed method", not what it is. I'd keep it: it is a trust feature (the AI cannot move your score) and a reason to come back and re-check. |

### C. Outside the app

| # | File / place | Where it shows | Current words | Proposed |
|---|---|---|---|---|
| C1 | `legal/public/privacy.html`, "What the app sends, and to whom" (lines 31-35) | Public page `kitted-a5b45.web.app/privacy` (the founder OKed it Nov 11, #454) | "...a copy of your photo goes to Google's Gemini API...", "...goes to OpenAI's API as text...", "Google up to 55 days, OpenAI up to 30 days", "never goes to Google or OpenAI" | **Keep the names here.** This is where the split puts them. Only reword "to read your clothes" if he wants the method out too. |
| C2 | `legal/public/privacy.html`, "Kit is an AI" (line 41) | Same page | "Scores are computed by the app's own rules, the same way every time; the AI describes the clothes and puts the result into words." | "Kit, the stylist in the app, is an AI. Kitted never rates faces, bodies, weight or skin." (drop the pipeline sentence). The "describes the clothes" half still appears truthfully in the data lines above ("to read your clothes"), which a policy must say. |
| C3 | `legal/public/privacy.html`, "What the app sends" intro | Same page | "to read your clothes" | Keep: Apple wants what the data is used for. |
| C4 | `market/app-store-connect.md` §3 description, "SAME PHOTO, SAME SCORE" | App Store page (draft, nothing submitted) | "The score comes from fixed rules about fit, shape, color, shoes and how the pieces work together, so the same photo always gets the same number. Tap the score to see exactly where every point came from." | "Send a photo, get a score. The same photo always gets the same number." Drop the rules list and "see exactly where every point came from" (it also stops being true once the Why sheet is replaced). |
| C5 | `market/app-store-connect.md` §4 review notes, "The AI:" paragraph | Seen only by App Review, not public | "outfit photos (face blurred) go to Google's Gemini API, which only describes the garments in fixed categories; the score is computed by rules in the app. Questions go as text to OpenAI's API. Both are named on the consent screen (5.1.2(i))..." | **Keep the vendor names here** (reviewers need them) and change "Both are named on the consent screen" to the new truth (named on the privacy policy, one tap from the consent screen). Drop "which only describes the garments in fixed categories; the score is computed by rules in the app" unless Apple asks (it argues the data is low-risk, so I'd keep one short version). Also step 4 "tap Why 7.5? to see how the score adds up" goes with T66. |
| C6 | `market/app-store-connect.md` §5-6 privacy label rows (Photos, Other User Content), age note | Internal; Apple's label itself does not name vendors | names Gemini, OpenAI, "Gemini's terms require 18+" | Internal notes: leave. The label's own words don't name vendors. |
| C7 | `app/app.config.ts` permission strings | iOS permission prompts | "Kitted uses the camera to check your outfit. Faces are blurred before anything is sent." | **Leave.** The face-blur promise is a trust feature. (The lines naming Gemini and OpenAI at `app.config.ts:117-119` are code comments.) |
| C8 | `specs.md` lines 40, 53, 77, 178-182, 213; `specs/setup-and-you.md:63`; `specs/sign-in-and-backup.md:111`; `specs/explain-rating.md:100` | Internal docs, not users | Name Gemini, OpenAI, PostHog | Internal. **Only `specs.md` line 53** ("Consent... names Google (photos), OpenAI (questions) and PostHog (usage counts)") would then disagree with the build; it needs the founder's yes to change, and I would not touch it until he approves section 3. |
| C9 | T33 in `plan.md` ("consent names PostHog", check SY5/F1.1) | Planned consent line | "consent names PostHog" | Same treatment: "anonymous usage counts to an analytics partner", PostHog named on the privacy page only. Update T33 when the founder decides. |
| C10 | Landing page (`web/`, another branch) | Public | not read here | Check the landing copy for the same words before it ships (the repo's `legal/README.md` says its `/privacy` replaces this page's). |

## 3. Apple 5.1.2(i): what the consent must still say

**The rule** (new language, Nov 13, 2025): an app has to say clearly where it sends personal data, including to third-party AI, and get the user's permission first. Reported by [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai) and many developer write-ups. I did not read Apple's guidelines page itself.

**What Apple's reviewers actually write** (a rejection quoted in [Apple Developer Forums thread 816140](https://developer.apple.com/forums/thread/816140), a developer's quote, not Apple's own page): the app "does not clearly explain what data is sent, identify who the data is sent to, and ask the user's permission before sharing the data." The privacy policy "must also identify what data the app collects... including if it is shared with a third-party AI service."

**What that means for "a trusted AI partner":**
- It satisfies *what is sent*, *permission before sending* and *that it is a third-party AI*.
- **"Identify who the data is sent to" is the risk.** I found no Apple text saying the vendor must be named on the consent screen, and no resolved case either way. One developer in that thread added a consent screen with generic wording and was still rejected (the thread doesn't say why). A blog ([stora.sh](https://stora.sh/blog/2026-05-06-apple-ai-consent-rule-5-1-2-i-implementation-guide)) says it must name the provider, with no source; treat that as opinion.
- So: **generic words are probably OK if the screen makes "who" one tap away, but this is unconfirmed, and a rejection costs days.**

**What I recommend, in order:**
1. **Generic in the app, names one tap away** (what he asked for, plus the safety valve): consent screen and You → Privacy say "a trusted third-party AI service" and carry a line "Who these partners are is in our Privacy Policy" with the link (A7). The privacy page names Google (Gemini) and OpenAI. The App Review notes name them too. Nothing is sent before the explicit "Agree", with "Not now" the same size (already built and unchanged).
2. **If App Review rejects under 5.1.2(i)** (the likely wording: "identify who the data is sent to"), the fallback is to put the two company names back on the consent screen only ("to Google and OpenAI") and keep everything else generic. It is a one-line change per key (A1-A6) and the privacy page already has the names.
3. **Not recommended:** removing the third-party AI language or going vague on *what* is sent. The face-blur promise stays word for word (A2, C7): it is a trust feature and the best reason to agree.

## 4. Does changing the consent words need a version bump?

**No, for a rewording. Here is why, from the code:**
- `CONSENT_VERSION = '2'` (`app/src/features/onboarding/complete.ts:26`), saved in the profile with the date when he agrees. Its doc comment says "a changed text asks again".
- The gates: `mayUpload` (`wipe.ts:28`) accepts any saved version; `mayAsk` (`wipe.ts:34`) needs `Number(consentVersion) >= QUESTIONS_CONSENT_FROM` (2). `QUESTIONS_CONSENT_FROM` is why #329 bumped to 2: questions started going to a *new company* (OpenAI), so people who had agreed to Google only had to agree again.
- **A bump to '3' alone would change nothing for existing users**: version 2 still passes both gates. To re-ask everyone you would also raise `QUESTIONS_CONSENT_FROM` and `mayUpload`'s check. That is a bigger change than a rewording needs.
- **Precedent:** the `en.ts` comment above the consent keys says height and build were dropped in #375: "less is sent, so the version stays 2". The same logic applies: the rule is **a new recipient, new kind of data, or longer retention bumps the version; the same data to the same kinds of recipients with different words does not.**
- Someone who agreed to version 2 already agreed to a *more specific* text (named companies); the generic text is a subset of what they accepted, and nothing new is sent. I'd record that in DECISIONS-LOG when it ships.

**When a bump would be needed:**
- T33/T91 adds analytics (PostHog) to the consent: a new recipient, so it needs the bump (and is the moment to raise the gates), whatever the wording.
- If the retention shown in A6 changes (e.g. showing 55 days for both when OpenAI's is 30): showing a *longer* time than true is safe; showing a *shorter* time is not.

**If a bump is chosen anyway:** change the constant in `complete.ts`, and the three tests that pin it, `app/src/__tests__/askC2.test.ts:320`, `birthYearStep.test.ts:26` and `heightBuildRemoved.test.ts:174` (`onboardingFlow.test.ts` reads the constant). That is updating an expected value to a deliberate new value, not weakening a test, but say so in the PR.

## 5. How it fits the planned tasks

- **T58 / T65 / T66 (Explain rating, approved):** they replace B1-B11 and B15's math sheet. When T66 lands, check that no `why.*`, `pwhy.*`, part-name or weight key is still reachable, then delete the dead keys (the key-usage tests will tell). B1-B3 (`pfix.*` "lifts {part}") are also T66's: its criteria say one fix and no gain, but don't say "no part names", so **add that line to T66's check list** (needs his yes: it's a spec edit).
- **T75 (Lookbook's "How I scored" row):** see B15, ask before building it.
- **T33 / T91 (analytics in the consent):** see C9.
- **T94 and the style game:** their copy follows the same rule once decided: never name a rule, a weight or a number.

## 6. Decisions for the founder

- **D1. Vendor names in the app.** (a) Generic in the app + names on the privacy page + a "who are they?" link on the consent screen (recommended; small risk of one App Review rejection, which the fallback fixes in an hour), (b) generic everywhere except the consent screen and You → Privacy, which keep the two company names (zero review risk, but the names stay in the app), (c) names everywhere (today).
- **D2. The "Scoring v1.8.0" line.** Remove it from You → Settings (recommended), keep it in the "Report a wrong score" email.
- **D3. Does Kit keep naming rules in the chat?** The approved Explain-rating spec says yes (plain names, about 74, "the rule of thirds"). I recommend yes: that is the product's value and it is advice anyone could read in a style guide. But it never shows numbers, weights, rule IDs or the five parts, and A17's prompt line keeps Kit from reciting the method if asked.
- **D4. "Same photo, same score."** Keep it in marketing (recommended) or cut it.
- **D5. Lookbook's "How I scored" row (T75).** Don't add it (recommended).
- **D6. Where the words go first.** The privacy page change (C2) is public and needs his OK before deploy (`legal/README.md`: `firebase deploy --only hosting --project kitted-a5b45`). The App Store drafts (C4, C5) are not submitted.

## 7. What I did not check

- Apple's current guidelines page (only forum threads and news); no resolved 5.1.2(i) case either way.
- The Explain-rating spec's final copy for the new card lines; `specs/explain-rating.md` is approved but its fix and card copy is T66's.
- The landing page branch (`web/`), the screenshots in `market/`, and the mockups, which are not what users read.
- TestFlight's "What to Test" note and any text the founder typed into App Store Connect directly.
- Nothing was run; no app, test or server was started. The string tables were read by merging `en.generated.ts` with `en.ts` in a scratch script (1,802 keys).
