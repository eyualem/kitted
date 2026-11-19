# Tailored, the 8th look

**Approved by the founder:** 2026-11-13

After this, a guy who dresses sharp on purpose finds a look for him: setup, You and the style game show an 8th look, Tailored, and a suit or a blazer with dress trousers reads as Tailored on his card. No score changes: only the name the card shows. *(Since scoring v16, the founder's taste rules follow the outfit's graded look, Tailored included; the founder's yes, Nov 17.)*

**Part of:** `specs.md` → F1 (Onboarding, "Tap 1 to 3 looks"), F2 (the result card's "Reads as"), F9.2 (picked looks order the fixes, never a score). The scoring rules in plain words live in `rubric/v5-styles.md`, which gains the Tailored section in the build (T94). The style game's own spec (after the founder's test, plan.md Y30) owns how the game uses the 8 looks; this spec only says Tailored is one of them.

## Why
- The founder, Nov 12: "We forgot to add formal wear, like suits and stuff." Setup's 7 looks have nothing for a guy who likes dressing sharp; the closest is Classic prep's blazer with chinos.
- Today the engine already knows a suit: a matching suit earns the "reads as" credit as "a matching suit" ([STY-1], [SHO-7]) and is kept out of smart casual ([SMC-2]). Blazers, trousers and loafers are signature pieces of smart casual, and blazers of classic prep. The tailored line fired on 6 of 74 saved real photos.
- Audience fit: college, first job, dates. Two of the founder's taste sources (Jaye Alexander, Frugal Aesthetic) lean tailored.
- Not named "Formal": that reads as black tie, which is an occasion (Interview and Event already expect tailoring).

## Scope
- **In:** what makes an outfit Tailored (TL1); the name on the card and how ties go (TL2); every score staying the same (TL3); the look everywhere looks are listed: setup's tile, You's Your style, Style profile, Going for, the style game (TL4); Kit's fixes and advice for a Tailored pick (TL5).
- **Out (non-goals):**
  - any new credit or charge for tailoring (a clean no-break hem under a suit, a full tailored outfit top to toe): no score moves in this version;
  - relaxed tailoring with no jacket (dress trousers, a knit, loafers): it stays minimal or smart casual;
  - black tie, tuxedos, morning dress;
  - new vision reading fields or a new AI call;
  - collecting new photos.
- **For the beta:** all of it, in the same TestFlight build as the style game. The build task (T94) can be done any time, but it merges to main together with the style game or after it, so one build brings both and setup changes once.

## TL1. What counts as Tailored
Tailored is jacket-led (the founder, Nov 12). It uses the same recognizer as the other seven looks: signature pieces 2 points, home pieces 1, a piece against it −1; top-and-jacket, bottoms and shoes each count their best piece; it needs a signature piece, points from at least two of the three, and a total of 3 (2 with only two in view).
- **Signature pieces:** a suit jacket, blazer, sport coat or unstructured blazer; suit trousers or trousers; loafers, derbies, dress shoes, Chelsea boots.
- **Home pieces:** white leather sneakers and other plain low leather sneakers (the founder: clean sneakers count); a dress shirt, oxford, knit, knit polo or plain tee under the jacket; an overcoat.
- **Its extra condition:** a tailored jacket (suit jacket, blazer, sport coat, unstructured blazer) **and** dress trousers (suit trousers or trousers). A matching suit always meets it.
- **Never Tailored with:** jeans, chinos, cargos, sweats, joggers, shorts; chunky, running or basketball sneakers, slides, work boots; a hoodie, sweatshirt, graphic tee, tank, jersey or fleece; any piece at roominess 5.
- So: a blazer with chinos stays classic prep; a blazer with dark jeans stays prep or smart casual; no jacket stays smart casual or minimal.

## TL2. The name on the card
- An outfit that reads as Tailored shows `Tailored` wherever a look's name shows: the card's "Reads as" line, How I scored, the Lookbook look page. Where the card said "a matching suit", it now says Tailored.
- **Ties:** when an outfit fits Tailored and smart casual or classic prep, the name is Tailored (a look-alike rule, applied before his picks). His picks break only the ties left over. The fixed order becomes: vintage sport, outdoor, workwear, streetwear, **tailored**, classic prep, minimal, smart casual.
- The name never changes a number (TL3).

## TL3. Every score stays the same
- Name only (the founder, Nov 12). Every part, every score and every fix stays exactly what the engine gives today, on every outfit. Tailored takes over the "reads as" credit those outfits already earn (as a suit or as smart casual); it adds no credit of its own anywhere, including "top to toe" ([STY-2]) and the look's own shoe ([SHO-7]).
- **An outfit that reads as no look today and would read as Tailored** gets no new credit. If the build finds any saved photo or test case whose score would change, it stops and shows the founder those cases before going on.
- The Python engine changes first; `@kitted/core` matches it on every parity case.

## TL4. Where he sees it
- **Setup's style screen:** an 8th tile, after Classic prep.
  - Name: `Tailored`. Line: `Suits, blazers, dress trousers, loafers`.
  - Two drawn outfits (the Closet's drawing code, never a person): a charcoal suit (jacket and trousers the same charcoal) with black derbies; a navy suit with white leather sneakers.
  - It behaves like every tile (up to 3 picks, in order; a 4th tap shakes). "Something else?" stays the last tile.
- **You's Your style and Style profile:** Tailored shows with its two drawings when picked, in his order, like every look (`specs/setup-and-you.md` SY1).
- **Going for:** Tailored is one of the looks he can say he's going for; it changes advice, never the score (as today).
- **The style game:** Tailored is one of its looks, with the same two drawings. How the rounds run is the game's own spec.
- VoiceOver reads the tile as every tile: `Tailored: Suits, blazers, dress trousers, loafers`.

## TL5. Kit and the fixes
- With Tailored among his picks, the fixes that are about tailoring lead when the outfit has them (sleeves over the hands under a jacket, the hem under the trousers, a tailored jacket with jeans from another world, a graphic tee under tailoring). Order only; the score is the same.
- Kit's style knowledge (`rubric/stylist-guide.md`) gains a short Tailored entry built from what it already says about jackets and suits (fit at the shoulders, a slightly relaxed jacket, a tailor is cheap, don't overdress for an errand). Kit says Tailored as a look name the same way it says the others.

## Rules
- Never rate faces, bodies, weight or skin; the drawings show clothes only.
- Picks never move a score (F9.2, [SCO-4]); a full suit at Everyday keeps its overdressed −0.25 ([OCC-2]) whether or not he picked Tailored.
- No new words beyond the tile's name and line, and `Tailored` wherever a look's name already shows.

## Data
- A new look key, `tailored`, in the engine's and the app's list of looks (`DetectedStyle` / `StyleKey`), the copy deck (`style.tailored`, `onb.looks.line.tailored`) and anything that checks look keys (the sync schema, the request builders).
- Picks are stored as today (ordered keys). Saved profiles need no change: no one has `tailored` yet.
- Saved checks keep their stored reading; a re-score of an old suit check may now say Tailored, with the same score.

## Acceptance criteria
**TL1. What counts**
- TL1.1 A charcoal suit jacket with matching suit trousers and black derbies reads as Tailored.
- TL1.2 A navy blazer over a white dress shirt with grey trousers and brown loafers reads as Tailored.
- TL1.3 The TL1.2 outfit with white leather sneakers reads as Tailored; with chunky sneakers, running sneakers, slides or work boots it doesn't.
- TL1.4 A navy blazer with khaki chinos and loafers reads as classic prep, not Tailored, as today.
- TL1.5 A sweater with dress trousers and loafers (no jacket) doesn't read as Tailored; it reads as it does today.
- TL1.6 A blazer with dark jeans doesn't read as Tailored.
- TL1.7 Each case above is a test in the Python engine and the same test in `@kitted/core`.

**TL2. The name**
- TL2.1 Where an outfit fits Tailored and smart casual or prep, the card names Tailored, whatever his picks.
- TL2.2 No card, How I scored sheet or look page says "a matching suit" any more; each says Tailored.

**TL3. Same scores**
- TL3.1 On every Python parity case and every saved real photo, every part, score and fix equals today's; only the look's name differs. Run at $0 (stored readings, no AI call).
- TL3.2 `@kitted/core` matches the Python engine on all parity cases, regenerated from the engine (never hand-edited).
- TL3.3 The 6 saved jacket-led photos are listed with each person's age band and picked looks, and what each now reads as. A photo that meets TL1 and doesn't read as Tailored is a failure.
- TL3.4 If any score would change, the build stops before merging and the founder sees the cases.

**TL4. Where he sees it**
- TL4.1 Setup's style screen shows 8 look tiles with Tailored after Classic prep, its name and line word for word and the two drawings in TL4; screenshots in light and dark and at the largest text size, nothing clipped.
- TL4.2 Picking Tailored saves `tailored` in his order; You's Your style and Style profile show it with its drawings.
- TL4.3 Going for offers Tailored, and choosing it changes no score.
- TL4.4 VoiceOver reads the tile as in TL4.

**TL5. Fixes**
- TL5.1 On a jacket-led outfit with sleeves over the hands, the sleeve fix moves up when Tailored is his first pick, and the score is identical with and without the pick.

## Touches
- **Scoring (strict, T94):** `extraction-test/rubric.py` and the parts engine's look tables, its tests and parity fixtures; `app/packages/kitted-core` (types, rubric and parts data, the detector, fix ordering), its tests; `rubric/v5-styles.md` (the eighth look, rule count).
- **App:** `app/src/data/types.ts` (STYLES), `app/src/features/onboarding/looks.ts` (the tile and its drawings), `en.ts` / the copy deck, `features/you/` (Your style, Style profile), Going for, the sync schema's look list, the tests that count looks, the Maestro setup flows if they count tiles.
- **Kit:** `rubric/stylist-guide.md`.

## Assumptions
- Tailored's tile sits after Classic prep (the dressy looks together); "Something else?" stays last, alone in the last row.
- The home pieces under the jacket (dress shirt, oxford, knit, plain tee) and the overcoat are Claude's reading of "jacket-led"; the build may trim them if a parity case would otherwise move.
- Kit's Tailored entry adds no new style rules, only the guide's existing advice gathered under the name.
- The saved set's 6 jacket-led photos are enough for this version (the founder, Nov 12: "Use the saved 6 only"); the test says plainly that it's a small sample.

## Later
- Tailoring's own credits and charges (a clean no-break hem under a suit, a full tailored outfit top to toe), once there are more real suit photos to test them on.
- Relaxed tailoring with no jacket as part of Tailored, if testers who pick Tailored mostly wear it that way.
