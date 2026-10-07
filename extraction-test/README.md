# Extraction test: can the AI read outfits reliably?

This answers the question everything depends on: **can a cheap AI vision model describe an outfit from a phone photo consistently enough that the same photo gets the same score, and does it notice when you change something?**

**Pass bars:**
- **Consistency:** for 90%+ of photos, every run's score is within ±0.5 of that photo's median
- **Fix detection:** 80%+ of "after" photos are recognized as changed

**Results so far:** `results/INDEX.md`.

## How it works
1. `run_test.py` sends each photo to Gemini several times. The AI only **describes** the clothes in fixed categories (`schema.json` + `prompt.txt`). It never gives a score.
2. `rubric.py` (rubric v3) turns each description into a score. Plain-language rules: `../rubric/v3.md`.
3. Because the code does the judging, `rescore.py` can re-judge saved answers after a rule change **without any API calls**.

## Folder layout
```
extraction-test/
  run_test.py          the test runner (calls the API)
  rescore.py           re-judges saved answers with the current rubric (free)
  rubric.py            the live rubric (v3)
  rubrics/rubric_v2.py frozen older version, for comparison
  schema.json          the categories the AI must use
  prompt.txt           the instructions the AI gets
  fixes.csv            example fixes file (real ones live in each photo folder)
  results/
    INDEX.md           log of every test
    <test-name>/       report.md + raw_results.json (+ rescored-v3/)
../inputs/<photo-set>/ the photos for each test
../rubric/             v2.md, v3.md, v2-evidence/
```

## Photo folders
One sub-folder per outfit, named `before_<method>.jpg` or `after_<method>.jpg`. The method is `mirror`, `phone`, `propped`, `street` or `studio`.
```
inputs/my-photos/
  o01/before_mirror.jpg
  o01/after_mirror.jpg      (optional: the same outfit after one change)
  o02/before_propped.jpg
  fixes.csv                 one row per before/after pair (can be header-only)
  metadata.csv              optional notes; a `claude_stylist_estimate` column is compared in rescore
```
`fixes.csv`:
```
outfit_id,fix_type,occasion,notes
o01,cuffed,everyday,rolled jeans once
```
Fix types: `cuffed`, `tucked`, `removed_layer`, `added_layer`, `swapped_shoes`, `swapped_top`, `swapped_bottom`, `rolled_sleeves`.
Occasions: `everyday`, `class`, `work`, `date`, `going_out`, `interview`, `event`, `gym`, `home`.

## Run it
In Terminal, from this folder. Use **`/usr/bin/python3`**: the python.org Python on this Mac is missing its HTTPS certificates.
```
read -s GEMINI_API_KEY && export GEMINI_API_KEY
/usr/bin/python3 run_test.py --photos ../inputs/my-photos --runs 3 --out results/test3-my-photos
```
- The first line lets you paste the key without it showing on screen or in your history. **Never paste the key into chat.**
- Default model: `gemini-3.8-flash` (2.5 Flash is retired for new accounts). Use `--model <name>` to try another.
- `--runs 3` is enough for quick tests; 5 is the full test.
- `--delay` sets seconds between calls (default 6, for the free tier; use 1 with billing on). **The free tier allows only 20 calls per model per day**, so real tests need billing.
- `/usr/bin/python3 run_test.py --selftest` checks the code without any API calls (output goes to `results/selftest/`).

Re-score saved answers after changing `rubric.py`:
```
/usr/bin/python3 rescore.py results/test2-mirror-12 --photos ../inputs/mirror-fit-check-1
```
Then add a row to `results/INDEX.md`.
