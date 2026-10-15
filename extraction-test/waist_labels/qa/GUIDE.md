# Waistline line check (Oct 15, 2026, DECISIONS-LOG #275)

Each image is an outfit photo (faces hidden) with lines drawn on it by a measuring script. Judge only the **thick
orange line**. Ignore the white, grey and dark-grey lines (a body ruler) and the thin green lines (the strip it searched).
Label the clothes only; never comment on the body, face, weight or skin.

**What the orange line is meant to mark:** the visual waistline the clothes make at the front, which is where the top
the pants meet ends and the pants begin.
- An untucked top: its lower hem at the front.
- A tucked top: the top of the pants' waistband (or the belt's top edge).
- A top over another top that shows below it: where the lowest one ends.
- An open jacket over a top: the inner top's end, not the jacket's.

For each image (Read tool), answer:
- `on`: the orange line sits on that place, within about a finger's width (≈ 2 cm on the person).
- `high_small` / `low_small`: off by about 2–6 cm (two to three fingers).
- `high_big` / `low_big`: off by more than that.
- `wrong_thing`: it marks something else, e.g. a pocket, a hand, a logo, a jacket hem, the crotch, the background.
- `cant_tell`: you can't see where the top meets the pants yourself.

Also note `dark_on_dark` (yes / no: the top and pants are nearly the same color) and `shot` (mirror / propped / other).

Write a CSV with header `photo,verdict,dark_on_dark,shot,notes` (photo = the file name without `.jpg`; notes = a few
plain words, quoted if they contain a comma) with the Write tool to the output path given. Reply with only the row
count and the count of each verdict.
