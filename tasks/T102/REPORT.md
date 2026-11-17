# T102 report

## Built (implementer, round 1)
223 of 225 locked tests pass; the 2 that fail are disputed below. The whole app Jest suite: 2 failed, 4 skipped, 2191 passed; only the two disputed tests fail. `npx tsc --noEmit` clean; `expo lint src/features/ask` clean. `npm run check` was not run as one command (the Mac had little free memory).

Files (all in `app/src/features/ask/`): `cards.ts` (new types, `KIND_SLOT`, `colorName`, `kindNoun`, `cardPiece`, `buildCard` for outfit / options / colors / buy with `why`, `storedCard`, `outfitNow`, `optionsNow`, `buyPiece`, `colorPieces`, `nextBuyFor`, `cardKey`, `shownKeysToday`, `askedAgain`, `exampleOutfit`, `checkFollowUps`, `cardControls`, `cardSpoken`), `closing.ts` (`followUps`), `pipeline.ts` (`AskPayload.followUps`, `latestFollowUps`), `prompt.ts` (closing format, `PROMPT_VERSION` 5), lane extensions `source.ts`, `gemini.ts`, `providers.ts`, `prepare.ts` (pass-throughs). No tests, fixtures, `kitted-core`, `closet/`, views, `en.ts` or demo touched.

### Deviations and reading choices
- `buildCard`'s `avoid` is closet ids; `exampleOutfit`'s `avoid` is kind keys (a card that becomes an Example converts ids to kinds).
- Example fallback: a look's outfits first, then the Starter outfit, then `null`.
- `cardPiece` handles "off white" itself (core reads it as `white`); one alias added: "chore jacket" or "chore coat" is `chore_coat`.
- Drawn piece name = spec color word + closet noun (`garmentName`); denim on jeans uses `colorWord` ("Dark jeans"); khaki reads "Beige chinos". A bare "jacket" is `field_jacket` named "Navy jacket"; a harrington alone is `null`.
- Options card: an unknown his-handle drops the card; an avoided piece's handle is skipped; an unresolved drawn entry is skipped; an outfit need that doesn't resolve drops the whole card.
- `latestFollowUps` reads the last answer row after his last message; a refused answer gives `null`.
- `cardSpoken` is `null` for an outfit only with non-empty `needs` or an Example.
- The 80% overlap rule of `checkFollowUps` is measured over the smaller word set, only when it has 2+ words.
- Drawn pieces reach `outfitValid` as synthetic garments (straight leg for bottoms).

## Disputes (round 1; sent to the test writer to judge against the spec)
1. `KC2.3 · example is true only on a card with none of his pieces, and itemIds is empty then`: the test builds `pieces: []` plus 3 needs on a closet that holds a white tee; by KC2.1 the tee meets the first need, so the card has 1 of his and 2 drawn, which KC2.3 says is not an Example.
2. `KC2.3 · 3 drawn clothing pieces with 1 of his is an example, and his piece is not in it`: `expect(JSON.stringify(card)).not.toContain('jeans"')` fails because the Starter fallback example legitimately draws dark jeans; his own piece is not in it (`itemIds` is empty, asserted separately).

## Summary for the founder
(written at the end)
