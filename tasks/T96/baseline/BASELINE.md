# T96 baseline: what the face hiding lets through today (Nov 14, $0, main at 1c34082d)

Measured by the coordinator before planning, with the app's own prep. Facts only; the plan decides the fix.

## How it was measured
- **The copy sent:** `kmeasure prep <photo> <root>` (the app's whole `Prep.run`: other people covered grey, then every hidden region blurred and pixelated), the upload JPEG kept per photo. `runprep.sh` here.
- **The thorough hunt (oracle):** `oracle.swift` here, compiled with the app's three Swift files. Apple Vision's face detector on the whole photo and on overlapping 2×2 and 3×3 tiles (each tile zoomed, so small faces become big enough to find), plus human rectangles the same way. Boxes in pixels on the 2048 px decode, origin top-left.
- **Leak test:** `compare.py` here. For each face the hunt found (confidence ≥ 0.5, de-duplicated), the same box in the original and the sent copy (both at 1024 px): if over half the box's pixels are unchanged (grey difference under 12), it's a suspect. `montage.py` puts every suspect on contact sheets.
- **Checked by eye:** all 230 suspect crops, at 3× size. Prints on T-shirts, cartoons, posters, a phone screen and boxes that were already pixelated were set aside; a photo counts as a leak when at least one real person's face is readable in the sent copy.

Note: the copies in `inputs/gold-judge/founder3/` (#468) came from `kmeasure zoom`, which blurs faces but **skips the grey cover over other people** that `Prep.run` applies. So #468's two background-people photos may leak less in the real app. Its 7 originals were deleted; re-downloading them waits on the founder (rule 4).

## Results (1,513 photos)
| Set | Photos | Sent (`ok`) | Sent with a stranger's face readable |
|---|---|---|---|
| Fashionpedia street and runway photos (every 8th of 3,200, `inputs/fashionpedia/images/test`) | 400 | 354 | **46 (13%)**: mostly the audience behind a runway model, some passers-by |
| YouTube frames (`inputs/youtube/shots`, from style videos; many are edits and collages) | 770 | 410 | **13**: a grid of 14 faces with only the main one hidden, people beside him in a store, a crowd |
| Phone-style photos: his 59 phone checks, ig 132, pinterest 74, reddit 21, stock 40, mirror set 12, phone-oct7 4 | 342 | 336 (6 "Which one is you?") | **0** (only prints on clothes) |

- 185 suspect face boxes on the 59 leak photos. Typical size in the 1024 px copy: 12–50 px. Every one was found by the same Vision face detector once the photo was tiled; the app runs it once on the whole 2048 px image, where faces this small are missed.
- The people behind are rarely covered: the human-rectangle detector doesn't find small, seated or cut-off people, so `others` stays empty and no grey cover is drawn.
- **Mirror reflections (a second mirror panel, a person down a hallway):** no example in the local photos; the only known ones are #468's deleted originals (pn5-6, pn1-15).

## The two sets (committed here; the photos are git-ignored under the main checkout's `inputs/` and `screenshots/`)
- `leak-set.json`: the 59 eye-confirmed leak photos. Per photo: path (relative to the main checkout, `/Users/eyu/Desktop/files/Kitted/`), source, size of the 2048 decode, `faces` (every face the hunt found, conf ≥ 0.5) and `leaked` (the suspect boxes in today's sent copy, some of them prints or already hidden).
- `normal-set.json`: 342 normal phone-style photos with today's status, for counting false refusals: 336 `ok`, 6 `multiplePeople` (5 of his own checks, 1 ig).

## Not covered by this set
- A face slice in a side mirror and a person far down a hallway reflected in the mirror (#468): no local originals.
- Faces the Vision detector can't find even zoomed (a strong profile, a face under 10 px): the hunt can't see them either, so they're not counted. Only the eye check catches those.
