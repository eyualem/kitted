# ranking-undo (normal)

**Spec:** `specs/style-game.md` SG2 and SG2.3 (founder's words and yes, Nov 19; log #521).

**Plan:** (1) `game.order.line` → `Which one do you like more?`, title unchanged. (2) `Undo` text button under the ranking pair, calling the session's `back` (one step: the last pick, or card 8 from the first pair). (3) The 260 ms pause after a ranking tap registers with `holdAnswer` so Back/Undo in the pause cancels the tap. (4) Tests: line and Undo on the screen, binary insertion after an undo in the session. (5) Screenshots, T113 Maestro flow, one `npm run check`.

**Built:** `GameRanking.tsx` (button, pause hold), `GameResults.tsx` (exports `CappedLink`), `en.ts`, tests in `T113-styleGameSession.test.ts` and `T113-styleGameScreens.test.tsx` (the old line's test retargeted to the new words).

**Review / results:** see the PR.

**Results (Nov 19):** the founder said yes to the words and behaviour on the screenshot (`shots/rank-light.png`). `npm run check`: tsc, lint (0 errors) and core tests pass except one core parity test (`parts.parity`, "picks never move a number") that hit vitest's 5 s timeout while the Mac was short of memory; it passes alone (11/11, 60 s timeout) and no core file changed. The check's `&&` chain stopped there, so the app's `npx jest` was run alone afterwards: 179 suites, 2905 tests green. T113 Maestro flow on the iPhone 17 Pro (Metro on 8082): the new screen-323 steps (line, Undo after a pick, Undo to card 8) and screens 2, 320, 324, 330 pass; the fresh-install tail (SG1.4, SG8.1) was blocked by the dev client's first-run developer-menu popup after `clearState`, then by the server list not offering 8082 on a re-run, and was not completed (not verified; code untouched here). Light screenshot only; dark and largest-text not taken.
