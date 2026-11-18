# T69 · The rescoring in the app (parts engine v16)

**Size:** strict (scoring) · **Branch:** `claude/t69-v16-port` (stacked on PR #124, main merged in) · **Plan:** `IMPLEMENTATION.md` (it is this task's "What changes") · **Tests:** `TESTING.md` · **Decisions:** #484 (v16 approved), #487 (Y47: v16 exactly as approved)

## Plan (short)
1. Python, output-only keys (no number moves), then `make_parts_json.py` → `gen-rubric-data.mjs` → `partsData.ts`.
2. Port v16 into core `parts.ts` (TUNE v16 with taste, graded looks, `_v16_taste`, `v16_finish`, the curve, 3–9.5 with no floor, `season`, `gradedLook`), with v15 byte-identical.
3. Fixtures from the engine only, in order: parity (v16 configs, the 15 named outfits) → fixes → rules conformance → steadiness.
4. The app: the leg-width look W (pants only, a tie-break), the season from weather or the month, old checks keep v15, the 3–4.5 band, Why's rows, demo screens 300–310.

## Coordinator's calls on the technical defaults (Nov 17)
Q-T1 to Q-T10 accepted as IMPLEMENTATION.md defaults them. Q-T5: committing the gold set's readings (garment descriptions only, no photos, no ratings) is fine. The lane-external files the plan names (`services/readingSource/*`, `data/types.ts`, `design-system/{tokens,score}.ts`, `components/Ledger.tsx` testID, `demo/scenarios.ts`) are OK'd for this task. Steadiness: the bar is 218/223 with each reading's own leg look; 217 (with looks U and L) is printed as information only.

## Built

## Disputes
- **Blocker (not a test dispute): the protect-tests hook vs IMPLEMENTATION.md → Files.** `.claude/hooks/protect-tests.sh` refuses any Edit/Write whose path is under the fixtures folder (`handoff/fixtures/`), and any Bash command that names that folder with a write verb. The plan lists five generator scripts in that folder as files the implementer changes: `make_parts_json.py` (VERSION 2.0.0, ENGINE v16, `rollback15`, the v16 tables), `make_parts_parity.py`, `make_parts_fixes.py`, `parts_fixes.py` (engine/season pass-through) and the new `make_parts_steadiness.py`. None can be edited, so Steps 2 and 4 are stopped, and everything that reads `parts.json` / `partsData.ts` (the whole core port) can't be tested. Not worked around. Needs the coordinator: allow edits to the generator scripts (they are not fixtures) or have them edited by someone the hook doesn't bind. The generated `*.json` stay hands-off either way. Done before the stop: Step 1 (Python output-only keys and the relabel in `parts_proto.py`; a v16 score still gives the same numbers, and the new keys are present).

## Review
