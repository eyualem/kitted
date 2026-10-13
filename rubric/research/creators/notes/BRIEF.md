# Brief for the transcript readers (Oct 13, 2026)

Context: Kitted is an iOS app that scores men's outfits from a photo (0–10, "the AI sees, the code judges"). The founder learned to judge outfits from these YouTube creators, so we want to know exactly how each creator judges. You are reading cleaned auto-caption transcripts (`inputs/youtube/clean/<id>.txt`, a `[mm:ss]` stamp about every 30 s). Auto-captions have errors (brand names, slang); read for intent and say "(caption unclear)" when you're guessing.

Read every assigned transcript in full (use the Read tool; they are 1–7k words each). Then write your notes file. Do not read other files, do not edit anything else.

## What to extract, per video
1. **Rules.** Every judging rule or principle about what makes an outfit look good or bad. For each:
   - the rule in plain words (one line), then a short quote in the creator's words (**≤15 words**, in quotes) with its timestamp `[mm:ss]` (the nearest stamp before it);
   - a tag: `fit` (size, how a piece fits) · `proportion` (silhouette, lengths, where things end, top vs bottom volume, cropping, tucking, rise, hem/break/stack) · `color` · `pattern/texture` · `shoes` · `layering` · `cohesion` (pieces from one world, style mixing, "main character piece", focal points) · `condition` (wrinkles, wear, quality, fabric) · `accessories` · `occasion/context` · `wardrobe` (buying, basics, building a closet; not judging one outfit) · `mindset` (identity, confidence, personal style);
   - **Photo-visible?** yes / partly / no: could you see it in a single full-body phone photo of the outfit? (Fabric quality, fit when moving, price: usually no.)
   - **Strength:** "hard rule" (said as always/never, or repeated), "preference", or "his own taste, says others differ".
2. **Good / great / bad.** What, in this creator's eyes, separates a merely okay outfit from a good one, and a good one from a great one. Use their words where you can. This matters most: the app can't tell an 8 from a 7 today.
3. **Outfits judged.** Any outfit they show or describe and give a verdict on (his own old outfits, viewers', "do this not that", before/after): timestamp, the pieces (as specific as said: colors, fits, shoes), the verdict and the reason. Mark `ON SCREEN` if it's clearly being shown (so the founder can screenshot it later).
4. **Contradictions inside the video or with common advice** (e.g. "skinny jeans are fine if…").
5. **Style names** they use (streetwear, minimal, workwear, old money, city boy, etc.) and what pieces define each.

## Ignore entirely
- Anything about bodies, faces, skin, hair, weight, height-as-attractiveness, "attractiveness" or what girls like. The app never rates the person. (Proportions *of the clothes* — where a jacket ends, how wide a leg is — are in scope. "Cropped makes you look taller" → record the clothing rule, not the body claim.)
- Sponsor segments, channel plugs, giveaways.
- Price and brand recommendations, except where a brand names a fit (e.g. Levi's 501 = straight).

## Output: `rubric/research/creators/notes/<file>.md`
```
# <Creator> — transcript notes
Videos read: <n> (ids). Reader's one-paragraph summary of how this creator judges an outfit.

## <Video title> [<id>] (<upload date>)
### Rules
- **<rule>** — "<quote>" [mm:ss] · tag · photo-visible: yes · hard rule
### Good vs great vs bad
### Outfits judged
- [mm:ss] ON SCREEN · <pieces> → <verdict>: <reason>
### Contradictions / caveats
### Style names

## Across this creator's videos
- The rules they repeat most (with how many videos each appears in).
- Their ladder: bad → okay → good → great, in 4–6 lines.
- Anything surprising or that contradicts usual men's-style advice.
```
Keep quotes short and sparse (one per rule at most); paraphrase everything else. Be exhaustive on rules and judged outfits, terse elsewhere. Finish by replying with: the file path, the number of rules, the number of judged outfits (and how many ON SCREEN), and the 5 rules this creator leans on hardest.
