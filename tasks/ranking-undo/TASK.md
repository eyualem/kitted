# ranking-undo (normal)

**Spec:** `specs/style-game.md` SG2 and SG2.3 (founder's words and yes, Nov 19; log #521).

**Plan:** (1) `game.order.line` → `Which one do you like more?`, title unchanged. (2) `Undo` text button under the ranking pair, calling the session's `back` (one step: the last pick, or card 8 from the first pair). (3) The 260 ms pause after a ranking tap registers with `holdAnswer` so Back/Undo in the pause cancels the tap. (4) Tests: line and Undo on the screen, binary insertion after an undo in the session. (5) Screenshots, T113 Maestro flow, one `npm run check`.

**Built:** `GameRanking.tsx` (button, pause hold), `GameResults.tsx` (exports `CappedLink`), `en.ts`, tests in `T113-styleGameSession.test.ts` and `T113-styleGameScreens.test.tsx` (the old line's test retargeted to the new words).

**Review / results:** see the PR.
