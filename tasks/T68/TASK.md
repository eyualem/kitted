# T68 · Rescoring v16 on paper

*Session rescoring-v16, Nov 14, 2026. Budget $0: stored readings and made-up readings only, no API calls. Plan: DECISIONS-LOG #464; rules: #462, #465, #466 and the founder's marks on the sheet (L1–L8 marked Yes there, L9 the stacking rule left blank, so #464's default stands). Yardstick: the creators' rulebook (PR #123, not merged).*

## What gets built

Engine `v16` in `extraction-test/rubrics/parts_proto.py`, beside v15 (v15 and every older engine score exactly as before). Script `extraction-test/v16_paper.py`, results in `extraction-test/results/v16/`. Nothing in `@kitted/core` or the app (that is T69, after his yes).

1. **The scale:** no 5.0 floor; the score is clamped to 3.0–9.5; 10 is never given.
2. **Faults stop averaging away:** each part's charges count at half their size on the score for the worst part and a quarter for the rest (v15 multiplied them by 15–30%).
3. **Dealbreaker caps** from #466 (sinks 5.5, three or more brights 4.5, holds 6.5, chunky sneakers under narrow legs 6.0; two sinks make a redo at 4.5), on reliable reads only. The "depends" rows (a blazer or leather jacket with gym shorts, a blazer with plain shorts) are a Style charge that grows with a weak color or shape and shrinks with a strong one.
4. **Lifts and stacking** (L1–L7, the creators' versions): with nothing else, the best an outfit can reach is 7.5 with no lift, 8 with one, 8.5 with two, 9 with three in one look, and 9.5 with four in one look and nothing off. L4 (tonal range) and L8 (texture) need reads the scoring call doesn't have: listed, not faked.
5. **The season:** a temperature band input (`warm`, or `cool` for mild and cold days, the default). Layering lifts count on cool days; on warm days only a light open shirt counts, summer has its own lifts (a fitted top over loose trousers, a light tonal outfit) and a heavy layer costs. Every photo is scored for both.
6. **Nuance (rulebook §5):** two brights are charged only with no dark or neutral piece beside them, a loud print or a third color, and a strong shape halves the charge; a blazer with loose or washed jeans is no longer charged (suit.9, "cool professor").
7. **A curve:** a fixed, monotone two-slope map from the raw score to the shown score, anchored so plain basics stay 7, fitted once on the gold set to the target shares, then checked on his saved checks.

## The bars (written Nov 14 before the first v16 run; never loosened)

| # | Bar | Pass when |
|---|---|---|
| B1 | His blind ratings | v16 within 1 point of his score on at least 8 in 10 photos, and r with him at least 0.69 (the panel's r with him), or a plain reason why not. Today: his 20. When his 60 (Y32) arrive as `~/Downloads/ratings.csv`, the same bar on all 80; until then this bar is only partly checked. |
| B2 | The creators' pairs | All 6 stored before/after pairs (`results/creators1`, median of the 3 readings): the after scores higher than the before. |
| B3 | The creators' anchors with stored readings | Each lands on the right side of the creator's step (median of its readings): step 5.5 or lower → v16 6.0 or lower; step 6–7.5 → v16 6.0–8.0; step 8 or higher → v16 7.5 or higher. Every one passes. |
| B4 | The dealbreaker examples | Each sheet row with a reliable read, on a made-up clean example (Everyday, no picks, as `rules_conformance.py`), lands exactly at its cap; the "depends" rows land between 5.5 and 7.0, and lower with a weak color than with a strong one. Rows that can't fire are listed, with the read they need. |
| B5 | Band shares | On the gold set (all photos, first reading, cool day) and on his 62 saved checks (his profile, their own occasion, cool day), every band within 5 points of its target: 3–4.5 5%, 5–5.5 15%, 6–6.5 30%, 7–7.5 30%, 8–8.5 15%, 9–9.5 5%. |
| B6 | Steadiness | At least 218 of 223 gold photos within 0.5 between their two stored readings (cool day). If the set holds a different count, the same share: at most 5 photos off. |
| B7 | v15 untouched | `rules_conformance.py` and `hoodie_layer_paper.py` still pass, and v15 scores every gold photo exactly as before. |

The curve (point 7) is fitted on the gold set, so B5 on gold is partly by construction; his saved checks are the honest test of it.

## Results

*(filled in after the run)*
