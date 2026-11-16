# T96s · A face printed on his own clothes is left alone; his own face stays hidden

**Size:** strict (privacy) · **Branch:** `claude/T96-face-leaks` (same PR as T96) · **Plan:** `IMPLEMENTATION.md` · **Tests:** `TESTING.md` (locked at `907e1fdb`) · **Decisions:** #474 (the rule), #477 (T96's re-scope)

## Plan (short)
1. `locate` fills the new `Located` fields from values it already computes (`faces`, `headBand`, `headPoints`, `fallbackHead`, `outline`, `torsoJoints`); everything it returned before stays byte for byte.
2. `printZone` (rules 1–3) and `isPrint` (rules 4–7), with the four constants from IMPLEMENTATION.md.
3. `sweep`: whole-photo prints leave `hide` (his fallback head box drawn when a print stood in for his face), tile prints are neither hidden nor greyed, the grey fill runs only on regions still hidden, and the re-check skips prints. `run` adds `printsKept` and `prints`.
4. The grey square on his head: a narrower "him again" test for `otherHeads`, and the `poseHead` cap for fit photos only (the test writer's two findings).
5. `kmeasure locate` prints `faces`, `fallbackHead`, `torsoJoints` and `zone`.

## Built
(filled in below as the work lands)

## Disputes
None.
