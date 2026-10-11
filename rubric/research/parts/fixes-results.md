# The parts engine's fixes: before and after (Oct 11, 2026)

*Claude (subagent). No API calls, no money. Nothing on screen changed: the app still shows v4.1's score and fixes. Files:*
- *Engine (reference): `handoff/fixtures/parts_fixes.py`. Port: `app/packages/kitted-core/src/partsFixes.ts` (exact parity on 12,005 cases, `test/partsFixes.parity.test.ts`).*
- *The fixes and their words: `handoff/fixtures/fixes.json` → `"parts"`, copied word for word into `app/src/i18n/en.ts` (`pfix.*`, checked by `partsFixCopy.test.ts`).*
- *Fixtures: `handoff/fixtures/make_parts_fixes.py` → `parts_fixes.json`.*

**Who is in the photos (rule 7):**
- You: profile pending (no birth year or picked looks yet).
- Your friends (the chore coat ×3, the blazer d1967f): profile unknown.
- 703a8b (blue polo) and ebe23f (black quilted jacket): unknown. **Please tell me who they are.**

Everything was scored with **one stated test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. Picks never change a number or a fix, so a split by age band or picked look isn't possible yet. Each check uses its own occasion (Class for the Oct 10 pull, Everyday for the older photos), an empty closet (what a new user sees), and a cool day (October).

## The short version
- **The mockup's check passes.** Your friend's blazer (d1967f) now gets **"Swap the jeans for navy chinos → 8.0"** (raises Proportions and Style), with **"Smaller step: Dark straight jeans lift Style to 7.5, but the score stays 7.0."** v4.1 called it 8.5 "dialed in" with no fix.
- **Every number on a fix row is the parts engine's own.** A fix shows only when the rounded score goes up. An edit that lifts a part but not the score becomes the one "Smaller step" line, with no number.
- **The layer bias is mostly gone, but watch it.** v4.1 led with "Add a layer / a jacket" on 6 of these 26 cards. The new engine leads with it on 1. It still appears lower down on 12 cards, because a short jacket over full-length pants is a shape the parts engine really rewards (+1.5 on Proportions, #202). The overshirt and the knit are gone from that line: the engine gives nothing for just wearing a layer, so it never promises one.
- **Free moves come first:** a tuck (your black tee and the oxford, 7.0 → 7.5), steaming the overshirt or sport coat, buttoning the overshirt's cuffs.
- **Streetwear gets its own move:** white leather → chunky sneakers lifts your green sweatshirt fit to 8.0 and your black tee fits to 7.5 (the streetwear shape, #203).
- **8 of 26 checks have no fix** (v4.1: 5). The card then says **"No quick fixes for this one."**, plus the Smaller step when one exists (7 of the 8), or a Next level line (1). Details below.

## How a fix is found
1. Every candidate is an edit to a copy of the reading: free actions (tuck, push sleeves, button cuffs, cuff the pants, steam, de-pill, clean the shoes, wear the jacket in your hand), your closet's pieces, generic swaps (5 shoes, 4 pants, a better fit, a neutral color or a solid color), adding a short jacket, and one tailor job (a hem).
2. Each copy is re-scored by the parts engine with the same occasion and second look. A tuck also hides a peek; a cuff lifts the hem off the shoe.
3. **A fix** = the rounded score rises. It names the parts it raises: "Raises Shoes to 8", "Raises Proportions and Style", or "Clears the condition point" / "Fits the occasion better" when no part moved.
4. **A Smaller step** = a part's half point rises but the rounded score doesn't, nothing drops. A smaller version of a shown fix's move comes first (the jeans next to the chinos), then the biggest raw lift.
5. **Order:** free first, then your closet, then "free if you own one", then tailor. Inside a class, the bigger gain comes first. One fix per kind (shoes, pants, layer and so on). A later class of the same kind shows only when its gain is strictly bigger: "Swap to your white leather sneakers → 7.0" and "Swap the slides for chunky sneakers → 7.5" can both show. At most 3 fixes.
6. **#162's rules stay:**
   - On a warm day there's no layer and no boots.
   - No boots with shorts.
   - Never one everyday sneaker for another.
   - At the gym or at home, only the free care and sleeve fixes.
   - The warm flag works as today.
7. **New guard:** no swap involving a shoe or closet piece whose type was never read (`other`). It would turn a part on that the photo couldn't judge.

## Your and your friends' checks
v4.1 = today's app (rubric 4.1, `kitted_logic.suggest_fixes`, empty closet). New = parts engine v3 with the new fix engine, empty closet. The tip column is the line under the fixes.

| Check | Who | Occasion | Outfit (as read) | v4.1: score, fixes | New: score, fixes | Tip line |
|---|---|---|---|---|---|---|
| 8bc29d | you (profile pending) | class | cream overshirt, grey hoodie, black jeans, shoes unclear | 7.5: Steam out the wrinkles → 8.0 | 6.5: Steam the overshirt → 7.0 (Clears the condition point) | |
| d6559a | you (profile pending) | class | grey hoodie, black jeans, shoes unclear | 7.0: Add a jacket over it: denim, bomber or chore coat → 8.0 | 7.0: Add a short jacket: a bomber or a denim jacket → 7.5 (Raises Proportions to 8.5) | Smaller step: Navy chinos lift Style to 7.5, but the score stays 7.0. |
| f07193 | you (profile pending) | class | grey tee, tan overshirt, black wide jeans, shoes unclear | 7.5: Push your sleeves up → 8.0 | 6.5: Button your cuffs → 7.0 (Raises Fit to 7) | Smaller step: Navy chinos lift Style to 7.5, but the score stays 6.5. |
| e026de | you (profile pending) | class | tan overshirt, grey sweatshirt, black wide jeans, grey slides | 7.5: Swap the slides for chunky sneakers → 8.5 | 6.5: Swap the slides for chunky sneakers → 7.5 (Raises Shoes and Style) | Smaller step: A cuff lifts Shoes to 4.5, but the score stays 6.5. |
| 1f1997 | you (profile pending) | class | black hoodie, black wide jeans, black slides | 7.0: Swap the slides for chunky sneakers → 7.5; Add a jacket over it → 8.0 | 6.5: Swap the slides for chunky sneakers → 7.5 (Raises Shoes and Style); Add a short jacket → 7.0 (Raises Proportions to 8.5) | |
| d58b14 | you (profile pending) | class | black hoodie, black straight jeans, black slides | 7.0: Swap the slides for boots → 7.5; Add a jacket over it → 8.0 | 6.5: Swap the slides for boots → 7.0 (Raises Shoes to 7.5); Add a short jacket → 7.0 (Raises Proportions to 8.5) | |
| d918c0 | you (profile pending) | class | olive fleece, orange flannel (tucked), black wide jeans, beige chukkas | 7.5: Swap the chukkas for boots → 8.0 | 7.5: none | No quick fixes for this one. |
| 968016 | you (profile pending) | class | green sweatshirt, black wide jeans, white leather sneakers | 7.5: Add a jacket over it → 8.0 | 7.5: Swap the leather sneakers for chunky sneakers → 8.0 (Raises Proportions and Style); Add a short jacket → 8.0 (Raises Proportions to 8.5) | |
| fb0b17 | friend (profile unknown) | class | navy chore coat, white tee, charcoal jeans, navy low-profile sneakers | 8.5: none ("dialed in") | 7.0: none | No quick fixes for this one. Smaller step: Boots lift Shoes to 8, but the score stays 7.0. |
| f4870b | friend (profile unknown) | class | the same chore coat outfit | 8.5: none ("dialed in") | 7.0: none | the same as fb0b17 |
| e438d4 | friend (profile unknown) | class | the same chore coat outfit | 8.5: none ("dialed in") | 7.0: none | the same as fb0b17 |
| 403ade | you (profile pending) | class | black boxy tee, black wide jeans, white leather sneakers | 7.5: Add a layer: an overshirt or a knit → 8.5 | 7.0: Tuck in your tee → 7.5 (Raises Proportions to 8.5); Add a short jacket → 7.5; Swap the leather sneakers for chunky sneakers → 7.5 (Raises Proportions to 8) | Smaller step: A cuff lifts Shoes to 8, but the score stays 7.0. |
| 8ad378 | you (profile pending) | class | the same black tee outfit | 7.5: Add a layer: an overshirt or a knit → 8.5 | 7.0: the same three as 403ade | the same as 403ade |
| **d1967f** | **friend (profile unknown)** | class | navy blazer (read as a suit jacket), black tee tucked, mid-wash relaxed jeans, grey suede chukkas | 8.5: none ("dialed in") | **7.0: Swap the jeans for navy chinos → 8.0 (Raises Proportions and Style)** | **Smaller step: Dark straight jeans lift Style to 7.5, but the score stays 7.0.** |
| 703a8b | unknown: who is this? | class | blue polo (tucked), mid-wash jeans, shoes not in the photo | 7.5: Add a layer: an overshirt or a knit → 8.5 | 7.5: none | No quick fixes for this one. Smaller step: Navy chinos lift Style to 7.5, but the score stays 7.5. |
| ebe23f | unknown: who is this? | class | black jacket (type unclear), charcoal jeans, white leather sneakers | 8.0: Swap the leather sneakers for boots → 8.5 | 7.0: none | No quick fixes for this one. Smaller step: Navy chinos lift Shoes to 8, but the score stays 7.0. |
| a765e8 | you (profile pending) | everyday | charcoal hoodie, white tee, black sweatpants, black slides | 6.0: Swap to jeans or chino shorts → 7.0 | 5.5: Swap the slides for chunky sneakers → 6.5 (Raises Shoes and Style); Swap the sweatpants for navy chinos → 6.5 (Fits the occasion better); Add a short jacket → 6.5 (Fits the occasion better) | |
| 7de605 | you (profile pending) | everyday | the same hoodie + sweatpants + slides | 6.0: Swap to jeans or chino shorts → 7.0 | 5.5: the same three as a765e8 | |
| b0f0c8 | you (profile pending) | everyday | grey hoodie, black jeans, grey work boots | 7.0: De-pill it or wipe your shoes → 7.5 | 7.0: none | No quick fixes for this one. Smaller step: Chunky sneakers lift Shoes to 8, but the score stays 7.0. |
| 6b14db | you (profile pending) | everyday | grey hoodie, black sweatpants, black slides | 5.5: Swap the sweatpants for something dressier → 7.5; Swap to jeans or chino shorts → 7.0 | 5.5: Swap the slides for chunky sneakers → 6.5 (Raises Shoes to 5.5); Swap the sweatpants for navy chinos → 6.5; Add a short jacket → 6.5 (both: Fits the occasion better) | |
| 5a9049 | you (profile pending) | everyday | brown oxford, black jeans, grey work boots | 7.5: De-pill it or wipe your shoes → 8.0 | 7.0: Tuck in your oxford → 7.5 (Raises Proportions to 8.5); Add a short jacket → 7.5; Swap the work boots for loafers → 7.5 (Raises Shoes and Color) | Smaller step: Low-profile sneakers lift Shoes to 8, but the score stays 7.0. |
| 0d39d6 | you (profile pending) | everyday | grey hoodie, black jeans, slides | 6.5: Swap the slides for chunky sneakers → 7.5 | 6.5: Swap the slides for chunky sneakers → 7.5 (Raises Shoes and Style); Add a short jacket → 7.0 | Smaller step: A cuff lifts Shoes to 4.5, but the score stays 6.5. |
| oct7-ph1 | you (profile pending) | everyday | grey hoodie, black sweatpants, black slides | 5.0: Swap the sweatpants for something dressier → 7.0; Swap the slides for low-profile sneakers → 6.5; Swap to relaxed-leg pants → 5.5 | 5.5: Swap the sweatpants for navy chinos → 6.5; Swap the slides for chunky sneakers → 6.5; Add a short jacket → 6.5 | |
| oct7-ph2 | you (profile pending) | everyday | white dress shirt, navy suit trousers (slim), shoes not in the photo | 7.5: Add a layer: an overshirt or a knit → 8.5 | 7.0: Swap to straight-leg suit trousers → 7.5 (Raises Proportions to 8.5) | |
| oct7-ph3 | you (profile pending) | everyday | light blue sport coat, cream dress shirt, navy suit trousers, black loafers | 8.0: Steam out the wrinkles → 8.5 | 7.5: Steam the sport coat → 8.0 (Clears the condition point) | |
| oct7-ph4 | you (profile pending) | everyday | brown field jacket, light blue tee, charcoal jeans, shoes not in the photo | 8.0: none ("dialed in") | 7.0: none | No quick fixes for this one. Next level: One standout color, like a rust knit, lifts Color. The score may not move yet. |

The first 16 rows are the app's own readings from the Oct 10 pull. The last 10 are older photos of yours (Oct 7 and Oct 8) in their zoom1 re-readings, which aren't the readings the app used that day.

## Checks with no fix, and what the card says
| Check | Card |
|---|---|
| d918c0 (fleece + orange flannel) | "No quick fixes for this one." and nothing else. Every edit either leaves each part where it is or doesn't move the score. The flannel is already the color standout, so there's no Next level line either. |
| the chore coat ×3 (friends) | "No quick fixes for this one." + "Smaller step: Boots lift Shoes to 8, but the score stays 7.0." |
| 703a8b (blue polo) | "No quick fixes for this one." + "Smaller step: Navy chinos lift Style to 7.5, but the score stays 7.5." |
| ebe23f (quilted jacket) | "No quick fixes for this one." + "Smaller step: Navy chinos lift Shoes to 8, but the score stays 7.0." |
| b0f0c8 (grey hoodie + work boots) | "No quick fixes for this one." + "Smaller step: Chunky sneakers lift Shoes to 8, but the score stays 7.0." |
| oct7-ph4 (field jacket) | "No quick fixes for this one." + "Next level: One standout color, like a rust knit, lifts Color. The score may not move yet." |

The Next level line shows only when there's no fix and no smaller step, and only when its edit (the outer layer in one standout color, or in a plaid) really lifts that part. "Dialed in. Nothing to fix." is kept for 9 and up, but nothing reaches 9 today: Fit tops out at 7 until the fit cues pass.

## With the phone's closet
The Oct 10 pull's closet holds 21 live pieces: yours, plus what your friends' checks added on your phone. With that closet:
- **Your own pieces join where they help:**
  - 8bc29d gets "Swap to your Tan overshirt → 7.0" (the cream one reads wrinkled).
  - The slides fits get "Swap to your White leather sneakers 2 → 7.0" before the chunky-sneaker swap, which still shows because it's bigger (→ 7.5).
  - The black tee fits get "Swap to your Green Champion sweatshirt → 7.5".
- **d1967f keeps the chinos fix and the jeans Smaller step**, because the smaller version of the shown move wins the tip line.
- Pieces whose type was never read ("Grey shoes", "Black layer") are never offered.
- v4.1 with the same closet mostly says "Add your Navy chore coat → 8.0–8.5", and it lists "Swap to your Beige chukkas" twice on three cards: a v4.1 duplicate, not touched here.

## On a warm day
Everything that adds a layer and every boot swap drops out:
- Your slides fits keep the chunky-sneaker swap.
- d58b14 gets "Swap the slides for low-profile sneakers → 7.0" in place of boots.
- d6559a (grey hoodie, shoes unclear) has no fix left and shows only its Smaller step.

## Known oddities (real engine behavior, worth a look before the card ships)
- **"A cuff lifts Shoes to …"** (403ade, 8ad378, e026de, 0d39d6) is true but reads oddly:
  - On the slides fits, cuffing the wide jeans clears "the hem drags on the slides", which the Shoes part owns.
  - On the black tee fits, cuffed jeans also read as minimal, so the shoes count as that look's own shoe.
  - A fix for the wording would be to name the reason, not only the part. That's a copy call; I left it.
- **"Navy chinos lift Shoes to 8"** (ebe23f, the chore coat on a warm day): chinos bring the outfit's dressiness up to the shoes'. True, but a pants swap naming Shoes may confuse.
- **"Add a short jacket" is frequent** (12 of 26 cards, first on 1). That's the engine's +1.5 short-layer reward, not the fix engine. If the gold set shows it's over-rewarded, tune PR2 and the fixes follow on their own.
- **oct7-ph2** gets "Swap to straight-leg suit trousers": the slim leg blocks the waist-break reward. It's a fair call, but it rests on the leg reading, which is the shakiest one (#189).

## How to re-run
```bash
/usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_parts_fixes.py
```
```bash
cd /Users/eyu/Desktop/files/Kitted/app/packages/kitted-core && node scripts/gen-rubric-data.mjs && npx vitest run test/partsFixes.parity.test.ts
```
The fixtures cover:
- the real corpus and the newest pull (82 readings), plus 254 edge readings and 33 fix edge cases;
- all 8 app occasions, warm on and off, an empty closet and the seed closet, plus the first check;
- **12,005 cases, all equal in TypeScript.**
