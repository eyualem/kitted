# Brief for the T95 transcript readers (Nov 14, 2026)

Context: Kitted is an iOS app that scores men's outfits from one photo, 3 to 9.5 (never 10). A vision AI only describes the clothes; fixed rules compute the score. The founder's taste comes from four YouTubers: **Tim Dessaint, Wanhee Kim, Jaye Alexander, Frugal Aesthetic**, videos from 2023 on. You are building the rulebook the new scoring is tuned on. **Nuance matters most**: how the parts of an outfit change each other (the founder's example: red with blue "sounds like" a clash, but a red shirt with good proportions over somewhat baggy blue pants "might be a 7.8… or an 8").

You read transcripts taken from YouTube's own transcript panel (`/Users/eyu/Desktop/files/Kitted/inputs/youtube/clean/<id>.txt`; a `[mm:ss]` stamp about every 30 s; auto-captions garble names and slang, so mark guesses "(caption unclear)"). Read each assigned transcript **in full** with the Read tool. **Every rule must come from the transcript text itself, at its timestamp.** Write only your one notes file; edit nothing else.

## Ignore entirely
Anything about bodies, faces, skin, hair, weight, height, attractiveness, "what girls like", confidence or mindset. The app never rates the person. (Proportions *of the clothes* are in scope: where a jacket ends, how wide a leg is. "Cropped makes you look taller" → record the clothing rule only.) Sponsor segments, plugs, prices and brand picks (except where a brand names a fit, e.g. 501 = straight).

## The parts of fashion (tag each rule with one; silhouette and proportions first and deepest)
`silhouette` (overall shape, visual weight, top-heavy vs bottom-heavy, the classic shapes) · `proportion` (lengths, volumes, the waist break, rule of thirds, tuck, crop, rise, hem against shoe) · `tailoring` (suits, blazers, dress trousers) · `fit` · `color` (color theory, value contrast light vs dark, saturation, warm vs cool, complementary and clashing pairs, tonal, accents, how many colors) · `contrast` (between pieces: color, texture, formality) · `pattern` · `layering-texture` · `shoes` (against the outfit) · `cohesion` (style worlds, one focal point) · `condition` · `occasion-season` (summer vs fall/winter, what lifts a hot-weather fit with no layers, what a layer adds or costs by season).

## For each rule, one block:
```
- **R<n>. <the rule in plain words>** · part: <tag> · strength: dealbreaker | fault | lift | nuance
  - holds when / doesn't: <conditions, exceptions, what bends it>
  - interacts with: <the other parts that change it, and how: what softens it, what makes it worse>
  - source: <creator> · <video id> · [mm:ss] · "<quote, 12 words or fewer, exact from the transcript>"
  - on screen: yes (what's shown at that moment: pieces, colors) | no (described only)
  - others: <does it agree or clash with the other three creators, if you know from these or October's notes>
```
Strength: **dealbreaker** = they say it ruins an outfit whatever else is right; **fault** = it costs; **lift** = it raises a good outfit toward great; **nuance** = a condition on another rule (when a risky choice works, or when a good one fails).

## Also, per video
- **Ideas named in passing** (rule of thirds, the waist break, visual weight, value contrast, color temperature, 60-30-10, "the anchor", etc.): quote how *this creator* defines it, with timestamp. Don't define it yourself.
- **Outfits judged**: `[mm:ss] ON SCREEN | described · pieces (colors, fits, shoes) → verdict and why`. These become frames; list every on-screen one with the best timestamp to screenshot.
- **Interactions**: every example where two parts change each other (a risky color saved by the shape, a good shape spoiled by the shoe, a layer that fixes the proportions). These matter most.
- **Season**: anything about summer vs fall/winter, heat, layering by weather.
- **Ladder**: what separates bad / okay (their 7) / good (their 8) / great (their 9+), in their words.

## Output: `rubric/research/creators/notes/2026/<your file>.md`
```
# <batch name>: transcript notes (T95)
Videos read: <id> (<upload date>, <creator>, <title>) …
## <title> [<id>] (<date>) · <creator>
### Rules
### Ideas named in passing
### Outfits judged
### Interactions
### Season
### Ladder
## Across this batch
- The rules said most often; the strongest interactions; anything that contradicts the other creators (name both sides with ids and timestamps).
```
Quotes: 12 words or fewer, exact, one per rule at most; paraphrase everything else. Be exhaustive on rules, interactions and judged outfits; terse elsewhere. Finish by replying with: the file path, the number of rules, interactions and on-screen outfits, and the 5 most important rules about silhouette, proportions or color in this batch.

## Addendum (Nov 14, the founder widened the scope): every judged outfit is a worked example
The founder wants every on-screen outfit the creators judge, good or bad, recorded as a worked example; these tune the score ladder and the paper test. In "Outfits judged", give each one its own block:
```
- **E<n>.** [mm:ss] · ON SCREEN | likely | described
  - pieces: <every piece named or shown, with colors and fits as said>
  - verdict: "<the creator's own words, 12 words or fewer>" → bad | okay | good | great
  - why: <the reason they give>
  - frame: <the best second to screenshot, e.g. 03:41, a few seconds after the stamp if he says "here"> 
```
Mark guest or commenter outfits as such. Skip outfits on strangers when the creator comments on their bodies.
