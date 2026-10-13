# How the founder's taste sources judge an outfit, and where the app differs

*Oct 13, 2026. DECISIONS-LOG #234. Internal research only: nothing from these videos goes into app copy. No engine change has been made; the ranked proposals at the end wait for the founder's OK.*

**Sources.** 45 YouTube auto-caption transcripts the founder brought (`inputs/youtube/`, git-ignored). Cleaned by `tools/youtube/clean_vtt.py` into `inputs/youtube/clean/<id>.txt` (148k words); the channel per video was looked up with yt-dlp (metadata only, no download) into `inputs/youtube/clean/manifest.tsv`. Five readers (Claude subagents) read every kept transcript in full, one batch per creator, under one brief (`notes/BRIEF.md`); their notes, with short quotes and timestamps, are in `notes/`. Claude then read all five notes in full and wrote this file.

| Creator | Kept | Dates | Notes file |
|---|---|---|---|
| Tim Dessaint | 5 of 5 | Jun–Dec 2025 | `notes/tim-dessaint.md` (93 rules, 26 judged outfits, 25 on screen) |
| Wanhee Kim | 7 of 8 | Jul 2024 – Jun 2026 | `notes/wanhee-kim.md` (96 rules, 73 judged, 21 on screen) |
| Jaye Alexander | 13 of 25 | Dec 2024 – Aug 2026 | `notes/jaye-alexander-a.md` (styling, 126 rules, 22 judged), `-b.md` (wardrobes, jackets, aesthetics, accessories, 157 rules, 28 judged) |
| Frugal Aesthetic | 7 of 7 | Feb 2023 – Aug 2024 | `notes/frugal-aesthetic.md` (95 rules, 23 judged, 20 on screen) |

**Dropped (13):** bodies ("Body vs Style" graph), attractiveness (2), confidence and mindset talks (4), a channel update, a trailer, a sewing-gear promo, skin care, hair, and "How to take fire pictures of yourself" (camera tips, kept aside for the camera guidance). The full list with reasons is in the manifest.

**Weighting.** Frugal Aesthetic wasn't on the founder's list (Tim, Wanhee, Jaye), but his videos were in the folder, so he is counted as a fourth voice, not as a taste source: a rule only he holds is marked as such. Four of his seven videos are from 2023 (the earlier Gemini rule was "only 2024+ counts"); his 2024 pants and essentials videos repeat the core of the 2023 ones, so his rules stand, but the 2023 trend claims ("cropped is a cheat code right now") are treated as dated. **Jaye changed his mind on skinny jeans:** "do not wear skinny jeans at all" (Dec 2024, Feb 2025) became "jean cut doesn't matter" (Dec 2025) and "nobody dissing skinny jeans no more" (May 2026). His latest view is used.

**Caveats.** Auto-captions garble names and slang (the Korean terms in Wanhee's videos especially); the readers marked guesses "(caption unclear)". Everything about bodies, faces, skin, hair or attractiveness was ignored at reading time. Most of what these creators call "great" (fabric, drape, how clothes move, "character", worn-in softness) can't be seen in one photo; this file says so rule by rule.

---

## 1. How they judge, in one page

All four describe the same ladder, in different words:

- **Bad:** a proportion extreme (a big top or jacket over skinny pants), clothes too tight (pulling, creases, a muscle-fit tee), pants that are too long and drag, busy or loud color, big logos or one brand head to toe, too many statement pieces, wrong for the occasion, dirty shoes.
- **Okay (their 7):** clean basics that fit, with nothing wrong and nothing chosen. Their own words: "basic and predictable" (Tim), "not great, not bad", "the boyfriend look… boring" (Wanhee), "basic as hell", "a walking shadow", "a white canvas" (Jaye), "inoffensive… jack of all trades, master of none" (Frugal).
- **Good:** the details right: one clean break or a clean landing on the shoe, room in the leg, a top that isn't too long, neutral or tonal color with small ties, and **one** quiet point.
- **Great (their 8+):** a **deliberate silhouette** (a short or tucked top over a fuller leg; "tight waist, wide leg"; flares as an "hourglass"; a smart piece dressed down, or a casual piece dressed up, on purpose) plus **one focal point on a quiet base** (a statement piece, one accent color, a chain, a subtle design detail), and it looks effortless. The rest of "great" (fabric, drape, character, being worn in) is invisible in a photo.

**What this means for the app.** The app's base of 7.0 for clean basics matches their "okay" exactly. Its paths to 8 are the shape credits (the waist break, a short jacket over full legs, the tailored line, the streetwear and workwear shapes), which match their first ingredient of "great". What's missing is the second ingredient: **since v8 the app has no reward for one focal point** (the one-bright-piece and one-standout-pattern credits were removed because the gold-set panel rated those photos lower, #227), and it can't read accessories. That's the clearest place where the panel and the founder's own sources disagree (§5, proposal 4).

---

## 2. Rules all four agree on

"App today" uses the rule IDs in `rubric/v5-styles.md`. **Sees it?** = can today's reading see what the rule needs.

| # | Rule (plain words) | Who says it | App today | Sees it? |
|---|---|---|---|---|
| A1 | **Fit and proportion come first; nothing else saves an outfit that's off.** Proportion outranks color: the same palette goes from bad to great on shape alone (Tim). | All 4 (Frugal "fitment is the end-all-be-all", Jaye "the patty", Tim "the power of good proportions") | **Agrees.** Proportions is the biggest part (30%). | Yes, partly |
| A2 | **Nothing tight:** no pulling at the thighs or chest, no muscle-fit tee, no skin-tight jacket, no super-fitted hoodie. | All 4 | **Agrees.** [FIT-3] a piece that clearly pulls, −2.0 / −1.5. | Yes ("clearly pulls") |
| A3 | **A big top or jacket over narrow pants is the classic bad shape.** Frugal's version: the top should be no wider than the widest part of the pants. | All 4 (Tim's "too extreme a shift", Frugal's width rule, Jaye's "oversized jackets need balance", Jaye's dated skinny jeans + chunky runners + boxy tee) | **Agrees.** [PRO-2], [PRO-11], [SHO-9]. | Yes |
| A4 | **Where the pants meet the shoes makes or breaks the outfit.** Too long and dragging ruins an outfit that's right everywhere else. | Tim, Wanhee, Frugal strongly ("make or break", "the silent killer", "it all falls apart"); Jaye ("pants should connect your top half to your shoes smoothly") | **Partly.** [FIT-4] charges pooling on straight and narrow legs; the hem tips ([PRO-10], `tip_cuff`, `tip_hem`) fire only when the reading notices the hem. | **Mostly no:** the hem reading is unsteady (64–68%, KD-8). The second look's "pants rest on the shoe" passed (97% right, #199) but isn't sent. |
| A5 | **A top that's too long is a fault; a shorter top (to the waist), a tuck, or a cropped jacket breaks the outfit into sections.** Jaye: no extra-long tee under a leather jacket. | All 4 (Frugal's crop and rule-of-thirds videos, Wanhee's tee "ending at the hip bone", Jaye's cropped tee under a leather jacket, Tim's slightly cropped jacket as the fix) | **Partly.** Rewarded: [PRO-4] the waist break, [PRO-6] the short jacket, [PRO-14]. Missing: a too-long top is a tip ([PRO-10]); a shirt hanging below a jacket ([PRO-9]) never fires because the second look isn't sent (KD-15). | Top length: no (74%). The peek below a jacket: **yes** in the second look (86–100%, #199). |
| A6 | **One focal point on a quiet base.** Exactly one statement or accent; several cancel each other out. "Take one thing off" before you leave. | All 4 (Wanhee's "point", in 5 of 7 videos; Tim's statement piece and "3% rule"; Jaye's "one statement makes a basic fit not basic"; Frugal's "take one thing off") | **Half.** Too many is charged ([STY-6]). One quiet accent earns +0.5 ([COL-5]). **One bright piece or one standout pattern earns nothing since v8** ([COL-5], [STY-7], KD-18). | Colors and patterns: yes. Accessories: no. |
| A7 | **Loud logos and big graphics read as try-hard; one brand head to toe is never good.** | All 4 (Wanhee "whisper, don't shout", Tim "not screaming for attention", Jaye "all in one is never good", Frugal "a cool graphic on a bad fit looks childish") | **Agrees** on loud prints ([COL-8], with streetwear's own pieces excused, [COL-9]) and on a big logo at an interview ([OCC-5]). One brand head to toe isn't checked. | Logos: yes (the closet call reads logo text) |
| A8 | **A neutral base.** Black, white, navy, grey, beige, brown, olive; all black "never fails" (Jaye); neutrals "anchor" the look (Tim); at most 3 colors with black and white as half (Wanhee). | Tim, Wanhee, Jaye; Frugal treats color as secondary | **Agrees.** [COL-1] too many colors; neutrals cost nothing. | Yes |
| A9 | **Mixing smart and casual is good when it's deliberate and muted.** Tim's favorite outfit is an oversized tee tucked into tailored trousers; a tank under a blazer; sweatpants with minimal loafers. Wanhee's "wit": sneakers with tailoring, a print shirt under a black blazer. Jaye's "business core": a dress shirt and tie with jeans and a leather jacket. Frugal: "visual satisfaction takes priority over style cues". | All 4 | **Mostly agrees.** Tim's favorite is free in the app *when the trousers read straight or wide* ([MIN-6] "city boy"; a tuck earns [PRO-4] +1.5). [STY-5] only charges a graphic or roomy top over narrow legs with two dressy pieces. **Risk:** Tim's "wider in the thigh with a precise taper" could read slim, and then it's −3.0 Style plus −1.0 ([PRO-13]). | Yes |
| A10 | **Dress for the occasion.** Fashion is communication; overdressing a casual errand is as wrong as underdressing an interview. | All 4 (Jaye "a suit to the gas station", Wanhee "time and place", Tim "creative vs corporate") | **Agrees.** The occasion rules, including overdressed ([OCC-2]). | Yes (he picks the occasion) |
| A11 | **Fabric and drape matter**: how a piece falls, stiff vs soft, cheap sheen. | All 4 | **Can't see it**, and none of them claims it shows in a photo except as stiffness or shine. | No |

## 3. Rules one or two of them hold

| # | Rule | Who | App today | Sees it? |
|---|---|---|---|---|
| B1 | **Trousers: room in the thigh, straight cut, one clean break on the shoe.** Stacking reads "sloppier and more casual" but works in some styles. | Tim (his "ideal trouser", 2 videos) | **Agrees:** pooling is charged on straight and narrow legs, free on loose ones ([FIT-4], [STR-12]). | Hem: no |
| B2 | **A soft, drapey stack on sneakers or boots is beautiful;** only pants that are too long, stiff and dragging behind the heel are bad. A slight heel bite is good. | Frugal | **Agrees** on loose legs ([FIT-4] v8). Missing: a stiff drag on a wide leg costs nothing today. | No |
| B3 | **In the loose, flowy style, trousers should rest on the shoelaces and cover the ankle;** a bit of ankle or too much sock "falls apart". | Wanhee | **Missing.** The app has no "too short" check; its `tip_cuff` line suggests cuffing jeans that pile up. | No |
| B4 | **Cuffed jeans over a sneaker of a different color pull the eye to the feet;** a shoe matched to the trouser color, with the trouser meeting it cleanly, streamlines the outfit. | Tim | **Contradicts** `tip_cuff` mildly (the tip fires on jeans read as pooling or full break). Frugal and Tim both name **hemming** as the real fix. | Partly |
| B5 | **No skinny jeans.** | Wanhee (5 videos, "dated"), Tim ("definitely not the skinny jeans"), Jaye until 2025 | **Agrees:** [PRO-13] skinny −2.0. | Yes (94% steady) |
| B6 | **Slim is fine.** Frugal "loves" his slim pair with a tight top; slim only limits which tops work. Jaye 2026: any cut. Tim and Wanhee prefer straight but accept tapered. **None of them calls slim "dated".** | Frugal, Jaye (2026); Tim and Wanhee lean straight | **Contradicts** [PRO-13]: slim −1.0 everywhere, and the card says "the slim jeans read dated". | Yes |
| B7 | **Tight waist, wide leg:** a fitted tee or tank over wide, high-waisted trousers. | Frugal ("his bread and butter"), Tim (tucked tee into wide trousers), Jaye (high rise with a tucked or cropped top) | **Partly:** a tucked or at-the-belt top over a loose leg earns [PRO-4] +1.5. A fitted top worn **untucked** over wide legs earns nothing. | Roominess 1–2 vs 3 isn't proven steady (KD-17) |
| B8 | **One bright accent on a dark base is good** (orange socks with all black, a bright red scarf, a bright scarf on all black, a well-colored hoodie). **Tone down:** surround a bright piece with black, dark brown or navy. | Wanhee (hard rule), Jaye, Frugal | **Contradicts** v8 ([COL-5]: one bright piece earns nothing). | Yes (color names) |
| B9 | **Muted, deeper colors look more premium than bright ones** (burgundy over red, olive over bright green); the color wheel doesn't work in practice. | Tim | **Agrees:** a quiet accent earns +0.5 ([COL-5]); two brights fighting −2.0 ([COL-2]). Tim would **not** reward the bright accent of B8. | Yes |
| B10 | **Tone-in-tone:** one color family at different lightness (grey + charcoal + black; indigo jeans + light blue shirt) is a reliable win. All one shade with no range (all navy) is "basic and predictable". | Wanhee (hard rule), Tim, Jaye (all black in different materials) | **Missing:** tonal outfits earn nothing; one family is a tip only ([COL-7], KD-6). The light/mid/dark reading isn't live. | Lightness passed on its own (#198) and the phone already measures each piece's lightness after the card (#104) |
| B11 | **Tone-on-tone:** different colors at the same lightness and saturation is the "fashion icon" look, but unbalanced if one is off. | Wanhee (advanced) | **Contradicts** the Oct 7 color research's "muddy" gap (different colors at the same middle lightness). Nothing in the engine either way. | No (needs lightness) |
| B12 | **Accessories finish the outfit.** No jewelry is "bland"; you need a bag "95% of the time"; a bare neck on a black tee is a miss. But accessories must never be louder than the clothes, and 1–2 beat 4–6. | Jaye (5 videos); Tim (accessories that are "yours"); Wanhee (a ring or necklace can be the point, but take one off) | **Missing by design:** accessories never count ([SCO-6], KD-14). **Absence costing points is Jaye's view alone.** | No reading; head pieces are hidden |
| B13 | **Layer with a purpose:** a clean close base, 2–3 layers at most, each adding color, pattern or material contrast; random stacking looks bulky. A knit over a knit looks odd (contrast textures). Lighter colors close to the body, darker further out. | Jaye (hard rules), Tim | **Missing.** No layer count, no texture contrast. | Layer count and types: yes. Texture: no. |
| B14 | **Worn-in beats brand-new.** Soft, molded clothes look best; stiff new pieces with fold creases look like a beginner's. Fading and patina help. | Wanhee (4 videos), Frugal (fading; vintage character) | **Partly contradicts** Condition: wear costs −0.4 ([CON-1]), though designed distress, work boots and suede are excused. | Mostly no |
| B15 | **Wrinkles, destroyed or ugly-faded jeans, and dirty shoes ruin a good outfit.** | Jaye (hard rule) | **Agrees:** [CON-1], [SHO-11]. | Partly (flips; only counted when the AI is clear, [CON-5]) |
| B16 | **The shoes make or break it:** a good outfit with bad shoes is ruined, a bad one with good shoes passes. | Frugal (top tier), Jaye | **Agrees in direction:** Shoes is 15%, and it's the one part that tracks the gold panel (r 0.61, #224). | Yes |
| B17 | **A blazer with jeans is a good daytime look** ("cool professor"; flannel under a blazer with blue jeans and white sneakers). | Tim | **Partly contradicts** [STY-3]: a blazer with light or mid-wash jeans costs −1.5 Style. | Yes |
| B18 | **Hoodies should be relaxed;** a boxy hoodie is good but don't drown in it. | Frugal | **Agrees** (no charge on a regular hoodie). | Yes |
| B19 | **Super-cropped, super-wide boxy tees are the "influencer" look;** a tee should end at the hip bone with no hem flare. | Wanhee (his own taste) | **Contradicts** in taste: [STR-5] rewards a roomy top over wide jeans. He says oversized "can look good"; it's his own lane. | Partly |

## 4. Where they contradict each other

- **Slim pants:** fine (Frugal, Jaye 2026) vs "straight, not too slim" (Tim, Wanhee).
- **A narrow leg with a tight top:** good (Frugal: slim pants with a fitted tee) vs the worst silhouette (Wanhee: skinny jeans with a muscle tee). The difference is probably skinny vs slim.
- **The stack:** "sloppier, more casual" (Tim) vs "beautiful when it drapes" (Frugal). Both allow it in loose, deliberate styles, which is what v8 does.
- **How short a top:** crop it to the waist (Frugal, Jaye, Tim) vs never like a crop top, end at the hip bone (Wanhee).
- **A bright accent:** good on a dark base (Wanhee, Jaye, Frugal) vs muted is more premium (Tim).
- **A loud shoe as the accent:** good (Jaye, Wanhee) vs match the shoe to the trousers (Tim). The app gives +0.5 for a loud shoe as the one accent ([SHO-10]).
- **Wear:** wear is a plus (Wanhee) vs wrinkled, destroyed or faded is bad (Jaye). Both are against fresh fold creases and dirty shoes.
- **Accessories:** near-required (Jaye) vs "take one item off" (Wanhee, Frugal).
- **Color theory:** complementary contrast is satisfying (Frugal, as a beginner guide) vs the color wheel doesn't work in practice (Tim).
- **Rules at all:** each of them says style is personal, then gives hard rules. Read their rules as beginner defaults with an expert exception, which is the app's audience.

## 5. Proposed engine changes, ranked (for the founder's OK; nothing built)

Ranked by how many of the three taste sources back it, whether today's reading can see it, and how much it could separate an 8 from a 7 (the gap from #229).

1. **Send the second look, so a shirt hanging below a jacket counts** ([PRO-9], KD-15). Backed by all four (A5; Jaye calls it a hard rule). The peek reading already passed (100% the same, 86% right when it fires; #199), and "pants rest on the shoe" passed too (97% right), which also feeds A4. Cost: +0.24¢ per check, and 1 check in 8 finishes after the card (the card would need to update or wait). Start it as the `tip_peek` tip plus −0.5 at most, as #199 decided. *Needs:* the founder's OK on the cost (a new per-check cost, on top of the approved 0.57¢) and a rule for the late 1 in 8.
2. **Design the hem close-up test around the creators' three cases** (A4, B1–B4; already step 3 of #229). Ask the hem crop three yes/no questions instead of one: does the hem touch the shoe; does it drag or bunch behind the heel; is the ankle or sock showing. Then: dragging costs on every leg (Frugal), a soft stack on a loose leg stays free (v8), ankle showing in a wide trouser is a tip (Wanhee). About $0.30–0.50 to test. Also lead the hem tip with **hemming** and keep cuffing as the alternative (B4: both Tim and Frugal name the hem as the fix). *Needs:* the founder's OK to spend.
3. **Take "dated" off slim jeans, and test slim at −0.5** ([PRO-13], B6). None of the three taste sources calls slim dated; skinny stays at −2.0 with "dated" (B5). The −1.0 came from the founder's own notes and the panel (#227), so **this is the founder's call**: his one-outfit variants (the gold-set shoot) can settle it with a slim vs straight pair. Default: change the slim line to "a straight leg would balance the outfit" now (copy, outward-facing: his OK), keep −1.0 until his photos.
4. **Bring back a narrow "one point" credit** (A6, B8). +0.5 Color for **exactly one** bright piece, or one standout pattern, or a loud shoe, as the only statement, when every other piece is a dark neutral (black, charcoal, navy, dark brown, dark denim: Wanhee's "tone down"), with no color fault and no logo. The panel rated the old, wider credit's photos lower (6.6–6.7, #227), but the panel is confounded by photo source (#229) and this version is narrower. *Needs:* an accent pair in the founder's variants shoot (the same dark outfit with and without one accent) before any points move. Until then: no change.
5. **Reward tone-in-tone with a range of shade** (B10, KD-6). +0.5 Color when one or two color families span light, mid and dark; the flat all-one-shade outfit keeps its tip. The phone already measures each piece's lightness (#104), steadily across photos; using it means measuring before the score is final (M6 in the measure plan). Backed by Wanhee as a hard rule, plus Jaye and Tim. *Needs:* moving the lightness measure ahead of scoring, then a steadiness check.
6. **Credit a fitted top worn untucked over wide legs** (B7, Frugal's "tight waist, wide leg"). Only if roominess "close" (1–2) against "regular" (3) proves steady; today it isn't proven (KD-17). *Needs:* a ~$1 steadiness test. Lower: one taste source (Tim) only backs the tucked version, which the app already rewards.
7. **A "finishing touch" tip, never points, for a clean outfit with no point** (B12): "A simple chain or a watch would finish it." Jaye's strongest lever, but only he wants it required, and the app can't read accessories. Copy is outward-facing: the founder's call. Also two more tips the reading can already support: a knit over a knit ("contrast the textures", Tim) and more than three layers (Jaye).
8. **Test Shoes at 20%** on the gold set (B16). Two voices plus the panel (Shoes is the one part that tracks it). Low: the gold set can't separate 8 from 7 yet (#229), so this waits.

**Not proposed:** charging for missing accessories (one voice; the head is hidden); rewarding wear (not visible; B14); softening [STY-3] for blazers over mid-wash jeans (one voice, against the earlier research); anything about fabric or drape (not visible).

## 6. Outfits to screenshot, then the within-creator test (step 5)

The test: for each creator, score their on-screen outfits with the app and check that **their "after" beats their "before" and their great beats their okay**. All are "profile unknown" (CLAUDE.md rule 7); run them with one stated test profile. The best videos, in order of value:

| Video | Timestamps | What's there |
|---|---|---|
| **Tim: Recreating & Improving My Old Outfits** `wIib9hzVUuw` | 04:04, 04:35–05:06, 05:06, 05:36–06:07, 07:07, 07:37–08:38, 09:10, 09:40, 10:10, 10:40–11:10 | **5 before/after pairs**, every piece named, all on screen. The single best test in the folder. |
| **Tim: 10 Items, 10 Outfits** `-V2bE8nDsdo` | 02:34, 03:04, 03:34, 04:07, 04:37, 05:07 | 9 outfits from the same 10 pieces, from "basics 101" to "my favorite kind of outfit". |
| **Frugal: Why You Always Look Bad in Pants** `XtcY-zmoS-E` | 03:37, 04:07, 04:38, 06:38, 07:11, 08:41 | Wide trousers with a tight top; slim pants with a tight vs a wide top; the same trousers before and after hemming; a soft stack. |
| **Frugal: Why Cropped Clothes Look Better** `k6Gig6r7BSQ` | 10:22, 10:53 | The same shirt folded to different lengths; two tops of the same width, one 4 in shorter. |
| **Wanhee: Why Koreans Dress Better Pt.2** `tNVdA_arEa8` | 00:31, 01:02, 02:06, 08:40 | A yellow outfit with and without a black blazer; a print shirt under a black blazer; the "boyfriend look". |
| **Jaye: How To Build A Fire Wardrobe** `Pxeeh-caTJg` | 09:06, 19:39–22:43, 20:11 | His "perfect" outfit (open blazer, pendant, flares, heavy boots) and an all-black fit. |
| **Jaye: How To Master Accessorizing** `ctdMGExbNws` | 01:02, 07:11, 09:42, 14:16 | The same blazer outfit with and without accessories (the app ignores accessories, so expect a tie: that's the point of the test). |

Wanhee judges many outfits but mostly by description (52 of 73 aren't on screen), so his test set will be small.

## 7. What changed in this session
- New: `tools/youtube/clean_vtt.py`; `inputs/youtube/clean/` (transcripts, `index.tsv`, `manifest.tsv`, `channels.txt`; git-ignored); `rubric/research/creators/notes/` (brief + 5 notes); this file.
- No app or engine change.
