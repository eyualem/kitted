# T61 · Testing contract (strict)

Written by the session; tests written and locked by the test writer. The task's logic criteria go here, never words, labels or layout. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `<commit SHA>` · <date> · tests: `<path>`, `<path>`

## How it's tested
- **Python first:** the engine's tests in `extraction-test/` (pytest or the existing test style there), on hand-built readings: a plain base outfit (a white tee, dark straight jeans, white leather sneakers, `clothed: fully`, `framing: full_body`, `shoes_visible: true`, every piece `certainty: clear`), changed one field at a time. Both the parts engine (`rubrics/parts_proto.py` `score`, the app's engine) and the old `rubric.py` `score` (they share `_prepare`).
- **Core:** the same cases in `app/packages/kitted-core/test/` on `scoreParts` and `score`, run with jest (`--maxWorkers=2`; the Mac is short on memory).
- **Parity:** the new cases are added to the parity fixture generator (`handoff/fixtures/make_parts_parity.py`, and `make_parity.py` if it covers `rubric.py`), the fixtures regenerated from the Python engine, and core's parity tests pass on them. Never hand-edit a fixture.
- $0: no AI call anywhere.

## Criteria
- **NR1.1** · a `dress` (category `top`) or a `skirt` (category `bottom`) in the base outfit → `overall: null`, `reason: "womenswear"` · how: unit, both engines, Python and core · must not: a number · test: `NR1.1 · …` · red: <first run>
- **NR1.2** · a `traditional` piece (subcategory `other` or anything but `traditional_shoe`) with jeans and white leather sneakers (the kurta case) → `overall: null`, `reason: "traditional"` · must not: today's score of the jeans and sneakers · red:
- **NR1.3** · the base outfit with `scene.costume_or_uniform: true` → `overall: null`, `reason: "costume_or_uniform"`; with `false` or the field missing → today's score · red:
- **NR1.4** · the base top, an added outer layer, or the jeans marked `unsure` → `overall: null`, `reason: "unreadable"`, `unreadableSlot` `"top"`, `"jacket"`, `"pants"` respectively (Python key `unreadable_slot`) · must not: a top-only photo (`framing: upper_only`) with unsure jeans is NOT blocked (the jeans are filtered out first, as today) · red:
- **NR1.5** · the order: costume flag + a skirt → `costume_or_uniform`; a traditional piece + a dress → `traditional`; a dress + an unsure jacket → `womenswear`; a dress marked `unsure` → `womenswear` (not `unreadable`) · red:
- **NR1.6** · unchanged: an unsure accessory (a watch) changes nothing; `shoes_visible: false` and `framing: upper_only` give today's parts, score, fixes and `notRated` (`shoes`, `bottom half`); `not_fully_clothed` and `nothing_readable` as today · red: exists (parity), bites via a deliberate bug
- **NR1.7** · every NR1/NR2 case is a parity fixture generated from Python, and core matches on all of them (reason, slot, overall, parts, notRated) · how: parity · red:
- **NR2.1** · the base outfit with the sneakers changed to `heels` → every part, the overall and the fixes equal the base with `shoes_visible: false`, except `notRated` is `["shoes not rated"]` (not `"shoes"`); core `partialLabel(["shoes not rated"])` → `"Partial check: shoes not rated"` · must not: `"shoes"` in `notRated` (that would offer a shoe snap) · red:
- **NR2.2** · the same with footwear subcategory `traditional_shoe`, and with category `traditional` + subcategory `traditional_shoe` · red:
- **NR2.3** · unsure shoes give today's result exactly · red: exists (parity)
- **NR5.1 (core half)** · core's Closet keep never offers or adds a piece with subcategory `dress`, `skirt`, `heels` or `traditional_shoe` (as it skips `traditional` today); the tee and jeans of the heels outfit are still kept · how: unit on the closet function that picks a reading's keepable pieces · red:
- **NR8.1** · every existing parity case keeps its committed expected values (only new cases are added; no existing case changes unless it has a traditional main piece or an unsure top, jacket or pants) · how: parity · red: exists
- **NR8.2** · a script over the stored readings (`extraction-test/results/**`, `handoff/fixtures/readings/`), $0, lists each reading whose result changes, with its old score and its new reason; every change is a traditional main piece or an unsure main piece; written to `tasks/T61/changed-readings.md` · how: the implementer's script, checked by the reviewer · red: n/a (a report)
- **NR9.1** · `app/assets/gemini/schema-v3.json`: the garment subcategory enum has `dress`, `skirt`, `heels`, `traditional_shoe`; `scene` has a boolean `costume_or_uniform` (required, like the other scene fields); `prompt-v3.json` names each new value and the flag in one line each, and still says describe clothes only, never the person · how: jest on the JSON files · red:

## Not testable yet
Never dropped, never counted as done.
- **NR9.1 (accuracy)** · why: whether Gemini names a dress, a skirt, heels, traditional shoes or a costume right on real photos needs a paid reader run, and billing is down · would verify it: Y55 (about 20 photos, a few cents, the founder's OK)
- **NR3–NR7 (the card, not counting, Kit, the correction)** · why: T119 · would verify it: T119
