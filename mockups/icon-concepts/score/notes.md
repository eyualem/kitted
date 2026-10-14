# App icon concepts: the score and the measuring

Four concepts, each drawn as shapes only at 1024 × 1024, full bleed:
- `score-N.svg` is the main icon: an indigo gradient from #22305C to #1A2448, chalk-white #EEF0F5 and copper #DE9762.
- `score-N-dark.svg` is the dark version: a deeper indigo gradient from #1A2448 to #0E1328, never plain black.
- `score-N-tint.svg` is the tinted version: white shapes on a transparent background. The main shape is 100% white and the copper part is 55% white.

PNG renders and a contact sheet at 200, 60 and 29 px are in `png/`. `gen.py` rebuilds every file (`/usr/bin/python3 gen.py`).

The lead's research rules are applied to every concept:
- no "10" and no check mark as the main mark;
- any letter is clearly custom-built;
- copper is always one solid shape;
- ticks and cuts are at least 28–32 px wide;
- at most 3 layers (background, the white shape, the copper accent);
- no shadows or glows.

A first-round "seam check" (a check mark sewn like a denim seam) was dropped under the no-check rule.

## 1. Tape slash (`score-1`)
- **The idea:** the "/" of "/10", drawn as a leaning strip of tailor's tape. Ticks are notched into its left edge, and one solid copper tick crosses that edge as the reading mark.
- **Fit with Kitted:** it is the score's own punctuation plus the brand's tape measure. Copper is the reading itself.
- **At 60 px:** a slanted ruler with a copper mark. Clear, but the thinnest silhouette of the four. Of all of them it gains the most from the large app-icon sizes.
- **Tinted:** the white strip carries the shape, and the mark turns grey but stays visible because it sits in its own cut.
- **"Rates me" risk:** low. Two near-misses were fixed along the way: a copper top read as a pencil, and a long copper bar at the top read as a "7".

## 2. Tape K (`score-2`), recommended
- **The idea:** a K that is clearly custom-built. The stem is a tape with long and short ticks, the lower leg is plain, and the upper arm is a solid copper "gain" arrow rising out of the stem.
- **Fit with Kitted:** it combines the name, the measuring and the copper "→ 9.0" gain in one mark. It is distinct from the plain-K apps (Kick, KAYAK, Klarna) because the stem is a ruler and the arm is an arrow.
- **At 60 px:** the strongest of the four. The K, the copper arrow and the tick fringe all survive, and at 29 px it still reads as a K with copper.
- **Tinted:** the K reads fully in white. The arrow turns grey and still reads as the rising arm.
- **"Rates me" risk:** low. A rising arrow can drift toward "stocks or finance", but the K and the ruler anchor it to measuring.

## 3. Up-step (`score-3`)
- **The idea:** a band of tape that climbs one step. Two white treads with ticks are joined by a solid copper riser, which is the re-check gain.
- **Fit with Kitted:** "make the fix, go up a step", with copper used exactly as the app uses it, only for score movement.
- **At 60 px:** it reads as a step with a copper riser. At 29 px it gets abstract.
- **Tinted:** the step shape holds and the riser goes grey.
- **"Rates me" risk:** low. Its weakness is the reverse: it is the least specific of the four and could pass for a stats or a progress app.
- **Already fixed:** a first version with ticks on top of two blocks read as a castle tower or a bar chart.

## 4. Tape at 8 (`score-4`)
- **The idea:** a full-bleed strip of tape with a tall, narrow "8" above it, in the spirit of Archivo Condensed. One solid copper tick marks 8 on the tape: the score, read off a measure.
- **Fit with Kitted:** it is the most literal "fit score" and reads instantly as measuring.
- **At 60 px:** very clear. The 8 and the tape both hold at 29 px.
- **Tinted:** the 8 and the tape are both white and fully readable. The copper tick goes grey.
- **"Rates me" risk:** the highest of the four. A big number in the icon can read as "you're an 8", close to dating or looksmax ratings, and it fixes one particular score as the brand. Use it only if the store page's first line is clearly about the outfit.

## Ranking
1. **Tape K:** the most ownable, and it carries the name.
2. **Tape at 8:** the clearest, but it has the rating risk.
3. **Tape slash:** elegant but thin.
4. **Up-step:** generic.
