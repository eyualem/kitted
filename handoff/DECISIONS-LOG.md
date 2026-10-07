# Decisions log

Contradictions settled and decisions changed during the build. Newest last.

## Oct 6, 2026 · Phase 0 setup

1. **Project folder renamed Kempt → Kitted.** The handoff was written when the folder was `/Users/eyu/Desktop/files/Kempt`; it is now `/Users/eyu/Desktop/files/Kitted`. I replaced the old absolute path in every handoff `.md`, `.py`, `.ts` and `.swift` file. I then re-ran all five fixture generators (`04` §0): the regenerated JSON is byte-identical to the originals except for the path strings in the `provenance` fields of `expected_scores.json` and `readings/INDEX.json`. So `rubric.py` and the fixtures still agree.
2. **Mockup render tooling lives at the repo root** (`tools/mockshots/`, output in `screenshots/mock/`, scratch in `build/`), not under `app/tools/` as `05` §6 says. Reason: `create-expo-app` needs `app/` to be empty or missing, and the Expo project can't be created yet (Node 22 isn't approved). `screenshots/` and `build/` are git-ignored. Web and Simulator shots will go in `screenshots/web/`, `screenshots/sim/` and `screenshots/cmp/` the same way.
