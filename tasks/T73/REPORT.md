# T73 · Report

## Summary for the founder
<filled after verification>

## Built (implementer)
- **Changed:** For the beta, Outfits, Next best buy and Goes with sit behind `OUTFITS_BUILT = false`. Closet opens on his pieces, head to toe, with no Pieces | Outfits control; a saved `closet.segment` is ignored and never written. A piece's page has no Outfits row and no Goes with (no outfit lists are built). Kit's buy card keeps its tag, name and price but drops "+N outfits with what you own", on screen and for VoiceOver; Kit's ranking and the stored gain are unchanged. Adding a basic from Starter essentials says "Added {item}." with Undo. The Next best buy route sends him to Closet. The piece page's note has the new words. Demo screens 182, 183, 184, 193 and 202 turn the switch on; every other screen turns it off.
- **Files:** `app/src/config/features.ts`, `app/src/features/closet/outfitsSwitch.ts` (new), `app/src/features/closet/outfits.ts`, `app/src/app/(tabs)/closet/index.tsx`, `app/src/features/closet/PiecePage.tsx`, `app/src/features/closet/NextBuySheet.tsx`, `app/src/features/ask/cards.ts`, `app/src/features/ask/AskCardView.tsx`, `app/src/features/finish/starterActions.ts`, `app/src/i18n/en.ts`, `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts`, `app/src/demo/applyDemoScreen.ts`
- **Deviations from IMPLEMENTATION.md:** `starterActions.ts` (Paywall lane) and the three demo files edited with the coordinator's OK (IMPLEMENTATION.md → Answers; DECISIONS-LOG #406). One helper the plan didn't name: `cards.ts` exports `buySpoken(card, on)`; `cardSpoken`'s buy case returns `buySpoken(card, outfitsOn())` (same output), and `BuyCard`'s VoiceOver label uses the same `on` as its visible line, so the React Compiler can't keep a label from before the switch flipped.
- **Not done:** the two Maestro flows (`T73-closet-no-outfits.yaml`, `T73-outfits-on.yaml`) and the 182/183/184/193/202 screenshot comparison with main were not run (the Mac had ~150 MB free and the iPhone 17e's launcher held a dead saved Metro address). Locked unit tests and `npm run check` (1,662 passed, 4 skipped; one existing lint warning in `tryOn.test.ts`) pass. Copied from the implementer's hand-back by the coordinator (the harness refused the implementer's write).
- **See it:** demo 260 (Closet with Outfits remembered, opening on the pieces) · 261 (B1's page, no Outfits row or Goes with, the new note) · 171 (the buy card with no gain line) · 161 (Starter's "Added {item}." toast) · 182, 183, 184, 193, 202 (switch on) · 25 and 13 (the morning card and Kit's idea, unchanged)

## Disputes
- none

## Verification (verifier)
