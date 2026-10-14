# App icon concepts: clothing and tailoring objects

These are four concepts. Each has a color version (`object-N.svg`, on an indigo gradient from `#22305C` to `#1A2448`), a dark version (`-dark`, on night `#0C0E14`) and a tinted version (`-tint`, white shapes on transparent, for iOS tinted mode). Every SVG has a PNG render next to it. All are 1024 px and full-bleed, drawn only with shapes. The main content sits inside the central 80%.

Each one uses at most 3 colors: indigo, chalk and copper. A darker copper `#9C5326` shows up only as a detail on the copper shape. Copper always appears as one solid shape, never just as a line. Stitches are 30 px thick with 62–64 px dashes, and every other stroke is at least 28 px. There are no shadows or glows. Lead research says no rival uses indigo or sewing motifs, and 7 of 23 use a tee or a hanger, so none of these use either.

## 1. Hang Tag
- **The idea:** a blank chalk swing tag with a dashed stitch border, hanging from a copper eyelet on a copper string. Kitted means "kitted out" and ready.
- **Why it fits:** the stitch and the copper eyelet are the brand's woven label and rivet. A blank tag also says "new and ready", not "judged".
- **At 60 px:** a tilted white tag with a copper dot. It reads at once, and the stitch turns into a soft texture.
- **Tinted:** the tag is solid white with the stitch and the eyelet cut out. The string and the ring are at 55%. It stays clear.
- **Risk:** a price tag is the stock icon for shopping, sale and price-tracker apps, so it can read as "deals". This is the least ownable of the four. No trademark look-alike.

## 2. Tape Coil
- **The idea:** a coiled tailor's tape. Its tail runs out with ticks along it and ends in a solid copper end tab, with a copper rivet at the centre of the coil.
- **Why it fits:** a tape measure is the tailor's tool, and it's already the motif on the height screen. "Measured, not guessed" fits "same photo, same score".
- **At 60 px:** a white spiral with a short tail and a copper tip. The ticks are lost at that size, but the tab carries the meaning.
- **Tinted:** the coil and tail are white with the ticks cut out. The tab and the centre are at 55%.
- **Risk:** at a glance the spiral can look like a snail or an "@" sign, and it's close to the generic emoji for a tape measure. No trademark look-alike.

## 3. Pocket Rivet (recommended)
- **The idea:** the corner of a jeans front pocket, with a double row of chalk stitching along the scoop and one big domed copper rivet where it ends. The rivet has a ring and a centre.
- **Why it fits:** it is the brand line itself, "ink on chalk with one copper rivet". The copper is the hero shape, and it is the most ownable of the four.
- **At 60 px:** a copper dot on dark denim with a white L-curve. It is the strongest silhouette and color pop of the set.
- **Tinted:** the rivet is a solid white disc with a ring cut out. The pocket region is at 22% and the stitches at 70%.
- **Risk:** this draws the front pocket scoop that every pair of jeans has. It does not use Levi's Arcuate back-pocket stitch or the red Tab, and a plain rivet is generic. Keep the stitch rows plain and parallel. The flat darker pocket region is part of the background.

## 4. Chalk Check
- **The idea:** a bold chalk check mark, with the copper tailor's chalk (the flat triangle) that just drew it at the end of the stroke.
- **Why it fits:** it is literally a "fit check", marked the way a tailor marks a garment. It also reads as approval without a score or a word.
- **At 60 px:** a white check with a copper triangle. It is very legible.
- **Tinted:** the check is white and the triangle is at 55%. In tinted mode the triangle can read as a "play" arrow.
- **Risk:** check marks are the stock icon for to-do apps, and the triangle may not say "tailor's chalk" to beginners. Keep the check angular so it never looks like the Nike Swoosh. I also tried a chalky edge texture (small bites along the stroke), but it read as noise and was dropped.

Generator: `gen_object.py` in the session scratchpad (`objicons/`). It is not part of the repo.
