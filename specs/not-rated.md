# Not rated: outfits the scoring can't judge fairly

After this, a check never gets a made-up number. When the photo holds clothes the rules weren't built for (a dress, a skirt, traditional clothing, a costume or a uniform) or a main piece it can't make out, the card says "Not rated" with one honest line, and the check doesn't count toward his day. Heels or traditional shoes with menswear are scored like a photo without shoes. Everything else (niche styles, sportswear worn to play) is rated as today.

**Part of:** `specs.md` → F2.5 (traditional clothing and womenswear are "not rated"; a check with nothing ratable doesn't count), F2.6 (the partial check), F2.4 (nothing saved until it's read), F4 (fixing a misread), the "Nothing ratable" row of Failure and edge cases, and the Non-goals line "Scoring womenswear (dresses, skirts, heels): not rated yet". The scoring rules in plain words live in `rubric/v5-styles.md`, whose [SCO-6] changes in the build. This spec fills in F2.5; it changes nothing in `specs.md`.

## Why
- The founder, Nov 20, reviewing the rating system: the outfits it doesn't know must be solved before the App Store.
- Today the engine fails open: it drops a piece it can't judge and scores the rest. A kurta over jeans is scored on the jeans and shoes alone, and the card says nothing (`extraction-test/rubric.py` `_prepare`, the same in `@kitted/core`).
- The AI's list of piece names has no dress, skirt or heels (`app/assets/gemini/schema-v3.json`), so a dress is forced into the nearest menswear name and scored as if it were one.
- A piece the AI marks "unsure" is dropped without a word. It's rare (a main piece in 6 of 2,082 stored readings; shoes in 13), so a strict rule costs little.
- The niche-styles research (`rubric/research/niche-styles.md`, PR #147, Nov 18): old money, gorpcore, city boy and skater already score 7.0–8.5 and need nothing; sportswear gets its own look in its own spec; archive and western are too small.

## Scope
- **In:** which checks get no score (NR1); heels and traditional shoes (NR2); what the card shows (NR3); not counting (NR4); Closet and Lookbook (NR5); Kit (NR6); fixing a wrong "not rated" (NR7); what stays rated as today (NR8); the AI's new piece names and question (NR9).
- **Out (non-goals):**
  - scoring womenswear or traditional clothing for real;
  - judging a cosplay or costume (how close it is to the character);
  - a warning on niche styles, or a new look for any of them (Sportswear has its own spec);
  - guessing anything about the person: the app never decides from the photo who someone is, only what the clothes are;
  - collecting new photos.
- **For the beta:** all of it.

## NR1. When a check gets no score
A check gets **no score** when the reading holds any of these:
1. **A costume or a uniform**: Halloween or cosplay, scrubs, chef whites, a work uniform, a team kit with pads or a helmet.
2. **A traditional main piece**: a traditional top, bottom or one-piece (a kurta, a thobe, a kilt, a hanbok).
3. **A womenswear main piece**: a dress or a skirt.
4. **A main piece it can't read**: the top, a jacket or the pants marked "unsure".

The order above is also the order the card's line is picked in when two apply: a retake can't fix a dress, so the dress line wins over the retake line.

What's still scored around a missing part is unchanged: shoes out of the photo or a top-only photo stay partial checks (F2.6). Accessories and unsure accessories stay left out, as today.

## NR2. Heels and traditional shoes
When the clothes can be scored and only the shoes can't (heels, or traditional shoes such as juttis or mojaris), the check is scored **like a photo with no shoes in it**:
- the Shoes part drops out and the other parts' shares grow, as with shoes out of the photo ([SCO-1]);
- the label reads `Partial check: shoes not rated`;
- no shoe snap or Closet pick is offered (his shoes are in the photo; they just aren't rated);
- the check counts as a normal check.
Unsure shoes keep today's way: scored like no shoes, with the shoe-snap offer (F2.6).

## NR3. The card
Where the score normally sits: `Not rated`, in sentence case. Under it, one line from Kit, then the not-counted line, then (except for an unreadable piece) the link.

| Case | Kit's line |
|---|---|
| Costume or uniform | `That looks like a costume or a uniform. I rate outfits you put together, so this one gets no score.` |
| Traditional | `Traditional clothing has its own rules, and mine weren't made for it, so I won't score this.` |
| Womenswear | `I'm built for menswear for now, so I can't score this fairly.` |
| Can't read | `I can't make out your {piece} well enough to score it. Try more light, with your whole outfit in the shot.` ({piece}: `top`, `jacket` or `pants`) |

- Not-counted line, on every not-rated card: `It didn't count toward today's checks.`
- The link: `Read it wrong?` (not on the can't-read card; that card offers a retake).
- No fixes, no tips, no "Why", no re-check, no follow-up chips about the outfit.
- VoiceOver reads "Not rated", then the line, then the not-counted line; the link reads as a button.
- The words: no emoji, no all-caps; nothing about the person, only the clothes or the photo.

## NR4. Not counted
- A not-rated check never uses one of his checks, on the phone and on the live server (the server releases it the way it releases a failed call). The AI reading still happens, so it still counts toward the server's per-check call budget that guards against abuse.
- An NR2 check (shoes not rated) counts as a normal check.
- After "Read it wrong?" turns it into a scored check (NR7), it counts like any scored check; if he has none left that day, the limit card shows as for any other check.

## NR5. Closet and Lookbook
- A not-rated check keeps **nothing**: no Closet pieces, no Lookbook entry. The photo stays only in the chat, where he sent it.
- An NR2 check keeps the clothes in Closet as usual and skips the shoes it couldn't rate.
- Closet's writes go through the closet service as always (`patchCheckKeepCloset`).

## NR6. Kit
- Kit never gives a not-rated outfit a number, a score word or a fix. Asked to rate it, Kit answers with the card's line for that case.
- General style questions ("what shoes go with a kurta?") are answered like any style question and count as a question as usual.

## NR7. A wrong "not rated"
- `Read it wrong?` opens the existing correction sheet ("Wrong item") on the piece that blocked the score, with that slot's usual piece names (long shorts read as a skirt → shorts; a long coat read as a dress → an overcoat; for a costume or uniform, the sheet's "It's not a costume or uniform" choice).
- Once he picks, the check is scored from the corrected reading at once, as any correction (F4.1), and counts as in NR4.
- If what he picks still can't be rated, the card stays "Not rated" with the line for that case.

## NR8. Rated as today
- **Niche styles** (old money, gorpcore, techwear, city boy, amekaji, skater, grunge, Y2K, archive, western): scored with today's rules, no warning. A shoe the AI can't name keeps today's "Boots, sneakers or slides?" question.
- **Sportswear worn to play or train** (a jersey and gym shorts on the court, running gear): scored as today; the Gym occasion already relaxes runners, slides and shorts. Only protective gear (pads, helmets) counts as a uniform (NR1).

## NR9. What the AI reads
"The AI sees, the code judges": the AI only names the clothes; the code decides "not rated".
- New piece names: `dress` and `skirt` (main pieces), `heels` (shoes), `traditional_shoe` (shoes). The category `traditional` stays for traditional tops, bottoms and one-pieces.
- One new yes/no question for the photo: is it a costume or a uniform?
- The prompt keeps its rule: describe clothes only, never the person.

## Rules
- Never rate faces, bodies, weight or skin; nothing on the card speaks about the person.
- Same photo, same result: a not-rated reading is not rated every time.
- Traditional clothing is "not rated" (CLAUDE.md, hard lines).

## Data
- The reading gains the four piece names and the costume-or-uniform answer (NR9). Old stored readings have neither and score exactly as before, except that a stored traditional main piece or unsure main piece now gives no score.
- The scoring result says why it gave no score: one of `costume_or_uniform`, `traditional`, `womenswear`, `unreadable` (with the piece's slot), next to today's `not_fully_clothed` and `nothing_readable`. An NR2 check lists `shoes not rated` in what wasn't rated.
- A not-rated check is stored in the chat as a not-rated card with its reason; nothing goes to Closet, Lookbook or the check count.

## Acceptance criteria
**NR1. No score**
- NR1.1 A reading with a `dress` or a `skirt` gives no score, with the reason `womenswear`.
- NR1.2 A reading with a `traditional` piece (other than `traditional_shoe`) gives no score, with the reason `traditional`, even when the other pieces are menswear (a kurta over jeans and white sneakers).
- NR1.3 A reading answered "costume or uniform: yes" gives no score, with the reason `costume_or_uniform`, whatever its pieces.
- NR1.4 A reading whose top, jacket or pants is marked `unsure` gives no score, with the reason `unreadable` and that slot.
- NR1.5 When two apply, the reason follows NR1's order (a costume with a skirt → `costume_or_uniform`; a dress with an unsure jacket → `womenswear`).
- NR1.6 An unsure accessory, shoes out of the photo and a top-only photo behave exactly as today.
- NR1.7 Each case above is a test in the Python engine and the same test in `@kitted/core`; the parity fixtures for the new cases are generated from the engine, never hand-written.

**NR2. Shoes**
- NR2.1 A tee, jeans and `heels` scores the same as the tee and jeans with the shoes out of the photo, and its label is `Partial check: shoes not rated`, with no shoe-snap offer.
- NR2.2 The same with `traditional_shoe`.
- NR2.3 Unsure shoes behave exactly as today.

**Same scores elsewhere**
- NR8.1 On every existing parity case and every stored reading with no new piece name, no costume answer, no traditional main piece and no unsure main piece, every part, score and fix equals today's. Run at $0 on stored readings.
- NR8.2 The stored readings that change (traditional or unsure main pieces) are listed, each with its old score and its new reason; profile unknown for stock photos.

**NR3–NR7. What he sees** (screenshots, light and dark, largest text size, nothing clipped)
- NR3.1 Each of the four cases shows `Not rated`, its line word for word, `It didn't count toward today's checks.` and, except can't-read, `Read it wrong?`.
- NR3.2 No fixes, tips, Why, re-check or outfit chips on a not-rated card.
- NR4.1 A not-rated check leaves his checks left for the day unchanged, on the phone and on the server (server test in the emulator; deploying waits for the founder's OK).
- NR5.1 A not-rated check adds nothing to Closet or Lookbook; an NR2 check adds its clothes and not the shoes.
- NR6.1 Asked "rate this" about a not-rated check, Kit replies with that case's line and no number.
- NR7.1 A skirt corrected to shorts in the sheet scores at once, and the check then counts.
- NR9.1 The AI's schema has the four new names and the costume-or-uniform answer, and the prompt says when to use each. **How well the AI spots them is not verified** until a reader test on about 20 photos (a few cents, the founder's OK first).

## Touches
- **Scoring (strict, T61):** `extraction-test/rubric.py` (`_prepare`, the reasons), `extraction-test/rubrics/parts_proto.py` (the result's reason), their tests and the parity fixtures; `app/packages/kitted-core` (types, prepare, parts result, `partialLabel`), its tests; `app/assets/gemini/` and `extraction-test/` prompt and schema (NR9); `rubric/v5-styles.md` [SCO-6].
- **App (normal, T119):** the fit-check card and its states (`features/fitcheck/`, `stylist/cards/`), the correction sheet's choices (`features/correct/`), the closet service's keep (`features/closet/service.ts`, borrowed), the quota on the phone (`services/quota.ts`), Kit's rule (`ask/`, borrowed from the Kit lane), `en.ts`; the server's release (`firebase/functions/src/api/`), deployed only with the founder's OK.

## Assumptions
- The AI's new names and question are enough for v1; a reader test may show a dress read as a long coat or the reverse, and NR7 is the safety net.
- `traditional_shoe` and `heels` are the only shoes that need a name; other unknown shoes keep "Boots, sneakers or slides?".
- A not-rated card keeps no re-check, since there's no score to raise.
- The not-counted line sits on every not-rated card, his first check of the day included.

## Later
- Scoring womenswear for real, if women use the app enough to ask for it.
- Traditional clothing scored with its own rules, written with people who wear it.
- A not-rated look kept in Lookbook with no number, if testers ask for their photos there.
