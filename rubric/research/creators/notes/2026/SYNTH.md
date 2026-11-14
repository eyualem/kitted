# Brief for the T95 rulebook synthesizers (Nov 14, 2026)

Kitted scores a man's outfit from one photo, 3 to 9.5 (never 10). A vision AI only describes the clothes; fixed rules compute the score. The founder's taste comes from four YouTubers, **Tim Dessaint, Wanhee Kim, Jaye Alexander, Frugal Aesthetic** (videos from 2023 on): they are the yardstick. Outsiders (The Armoury, GQ's tailors, Justin Kwan) fill the suit gap only, and lose any clash with the four. Sixteen readers read 123 transcripts and wrote notes; the rule blocks are split by part in `notes/2026/by-part/` (each block is prefixed with `<!-- notes-file · video-id -->`). You turn one or more parts into the final rulebook sections. **Nuance matters most**: how the parts of an outfit change each other (red with blue "sounds like" a clash, but a red shirt with good proportions over somewhat baggy blue pants "might be a 7.8… or an 8").

## Hard lines
Never anything about faces, bodies, skin, hair or weight; clothes only. Quotes 12 words or fewer, exact. Take rules only from the notes' transcript quotes; when a block looks doubtful, open the transcript (`/Users/eyu/Desktop/files/Kitted/inputs/youtube/clean/<id>.txt`, `[mm:ss]` stamps) and check it. Do not invent sources.

## What to do
1. Read your assigned `by-part/` files in full. Merge duplicates: the same rule said by several creators (or one creator in several videos) becomes ONE rule with several sources. Keep genuinely different conditions as separate rules. Keep contradictions visible: if the four disagree, write the rule as the majority or newest view and state the other side with its source; date wins ties (a 2026 view beats a 2023 one from the same creator).
2. Drop what can't help score a photo (intent, story, price, brand prestige) into one short "Not scorable from a photo" list at the end, one line each.
3. Map each rule to today's engine: read `/Users/eyu/Desktop/files/Kitted/.claude/worktrees/creators-rulebook-5129be/rubric/v5-styles.md` (rule IDs in brackets like [PRO-4]). Say: **has it** ([ID]), **has it differently** ([ID] and how), or **lacks it**.
4. Say whether the AI reader can see what the rule needs. Live per-garment fields: category, subcategory, color_family (25 families incl. denim_light/mid/dark, charcoal, cream, sage, olive…), pattern, pattern_scale, logo, volume (1–5), leg_shape (skinny/slim/straight/relaxed/wide/flare_bootcut/barrel), hem (pooling/full_break/slight_break/no_break/cuffed/cropped), tucked (none/half/full), length (cropped/at_belt/mid_fly/below_crotch), saturation (muted/bright), sleeve_end, strain, condition, shows_below_outer; plus two second looks (a top peeking below the outer piece; pants resting on the shoe). Reads poorly: volume 4–5, slim vs straight, top length (below_crotch almost never fires), hem, strain. Not read at all: fabric/texture, light vs dark value, socks, rise, accessories (accessories never count). Write **yes (fields)**, **weakly (why)** or **no (what's missing)**.
5. Frames: frames are in `/Users/eyu/Desktop/files/Kitted/inputs/youtube/shots/<id>/f-MM-SS.jpg` (a still a few seconds after the note's timestamp). Do this step LAST: list the folder for each rule's on-screen source and give the nearest frame 0–20 s after the stamp as `inputs/youtube/shots/<id>/f-MM-SS.jpg`. If none exists, write `frame: none (described only)` when the creator only describes it, or `frame: pending` when the source was on screen but no still is in the folder yet.

## Output format (Markdown), per rule
```
#### <id>. <the rule in plain words>
- **Strength:** dealbreaker | fault | lift | nuance. **Holds when:** … **Doesn't:** …
- **Interacts with:** <the parts that change it, and how>
- **Sources:** Tim · `<video id>` · [mm:ss] · "<quote>"; Frugal · `<id>` · [mm:ss] · "<quote>" (as many as support it; outsiders marked "(outsider)")
- **The four:** all agree | <who> agree, <who> differ (<their view, id, [mm:ss]>) | only <who> (others silent)
- **Engine today:** has it [ID] | has it differently [ID]: … | lacks it
- **AI can see it:** yes (fields) | weakly (…) | no (…)
- **Frame:** `inputs/youtube/shots/<id>/f-MM-SS.jpg` | none (described only) | pending
```
Rule ids are lowercase with a dot so they never clash with the engine's bracketed IDs: `sil.1`, `prop.1`, `fit.1`, `suit.1`, `color.1`, `contrast.1`, `pattern.1`, `layer.1`, `shoe.1`, `world.1` (cohesion and style worlds), `cond.1`, `season.1`, `ix.1` (interactions), `ex.1` (worked examples). Order rules within a part from most important (most creators, strongest effect on the score) to least.

**Strength discipline:** a dealbreaker only when a creator says it ruins the outfit whatever else is right, or all four treat it as disqualifying. A lift only when they say it raises a good outfit. Most things are faults or nuances.

Start your file with a 5–8 line summary of the part in plain words (what the four agree on, the main disagreement). End with "Not scorable from a photo" and, if your part touches it, a short "For the dealbreakers sheet" list: for each row of `/Users/eyu/Desktop/files/Kitted/.claude/worktrees/creators-rulebook-5129be/rubric/research/dealbreakers.md` (S1–S9, H1–H11, N1–N4, L1–L8) that your rules bear on, one line: `<row>: creators agree | creators say change: <what> (<rule ids>)`.

Write only your one output file in `notes/2026/synth/`. No git, no browser, no other edits. Reply with the path, the number of rules, and the 5 most important rules of your part in one line each.
