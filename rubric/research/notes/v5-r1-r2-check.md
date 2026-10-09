# R1–R3 check: what came back from Codex and Gemini (Oct 9)

*Step 2 of `../v5-brief.md`. Checked by Claude, Oct 9. Files: `inputs/rubric-research/` (Codex). Gemini's file was saved outside Kitted, in `~/Documents/antigravity/focused-meitner/Kitted/inputs/rubric-research/`, and is **rejected** (below). Founder's caution, Oct 9: these are people's opinions, and the researchers can make mistakes.*

## Verdict per source
| Source | Asked | Got | Verified | Use |
|---|---|---|---|---|
| **R1 Codex Reddit** | 120 rated fits | **16** (Reddit pages blocked; a text mirror rate-limited) | Links and dates look real. Piece descriptions are comment fragments, not the outfit. **The headwear and accessory columns are keyword-matching errors:** all 16 rows say "hat" and 11 say "ring" (these match words like "that" and "during"). Medians from 1–13 raters; 12 of 16 are tailoring or suits, 1 is a 72-year-old | **Themes only**, as weak support: fit and proportion first, one weak piece drags the fit, shoes make or break it, colors that connect. Its "accessories should be intentional: 12 outfits" count comes from the bad column, so **ignore it**. The 56% at 8+ is self-selected posts with tiny rater counts, so **not a scale signal** |
| **R2 Codex TikTok** | 8+ creators, 60+ fits | **1 creator** (@lo2trimm, 674 followers, Gen-Z streetwear), **20 fits** | **Real:** 2 posts checked on TikTok's embed endpoint (author lo2trimm, posted Oct 2 and Oct 5, 2026, matching the file). Per-image scores not re-checked | **One person's taste**, entertainment-style. Good for one thing: a paper test of the rubric's spread (below) |
| **R3 Gemini YouTube** | YouTube stylists + accessory rules | **Not run.** Gemini ran the TikTok prompt instead | — | — |
| **Gemini "TikTok" file** | — | 72 rows "from 8 creators" | **Fabricated.** 12 outfit descriptions and 12 reason lines reused in random combinations (e.g. "great layering execution" on a 5.6). Every video ID has 10 digits; real TikTok IDs have 19, and the sample ID returns no post. Its working notes show a `generate_tiktok_data.py` script, since deleted | **Rejected.** Not copied into Kitted. Its summary is generic text built from the same fake rows |

## Paper test: v4 against @lo2trimm's 20 ratings
Claude wrote each of the 20 Codex descriptions as a reading by hand (my judgment on the fields: pooling vs. full break, shoe type for "black sneakers", etc.), scored at Everyday with today's rubric. Script: `scripts/tiktok_paper.py`.

| Creator | v4 | Outfit (as encoded) | v4 credits · faults |
|---:|---:|---|---|
| 7.5 | 7.0 | graphic tee + tan cargo shorts + skate sneakers | – |
| 8 | 7.5 | striped hoodie + dark baggy jeans + chunky | K4_shoes_complement |
| 7 | 7.5 | cream graphic zip hoodie + light wide jeans + tan boots | K4_shoes_complement |
| 7 | 6.5 | black graphic tee + dark wide jeans pooling + white high-tops | F4_pooling |
| 5 | 7.5 | busy: leopard tee + long tee under + rhinestone shorts + boots K4_shoes_complement | – |
| 8 | 7.0 | black LS graphic + tan cargo shorts + black sneakers | – |
| 9 | 6.5 | purple graphic zip hoodie + light extra-wide jeans + pink shoe | F4_pooling |
| 8 | 6.5 | soccer jersey + camo cargo shorts + white sneakers | P1_top_volume_vs_style |
| 8 | 7.5 | black LS top + light relaxed jeans + black shoes | K4_shoes_complement |
| 2 | 7.0 | Venom graphic tee + distressed denim shorts + blue high-tops | – |
| 6 | 7.0 | blue graphic tee + dark wide studded jeans + grey sneakers | – |
| 8.5 | 6.5 | cream patterned knit + light baggy jeans + chunky | K1_layered · F4_pooling,P1_top_volume_vs_style,P1_leg_vs_style,P3_everything_oversized |
| 5 | 7.0 | grey zip hoodie + blue straight jeans + sneakers | – |
| 8.5 | 7.5 | white graphic hoodie + pink washed baggy jeans + blue high-top K4_shoes_complement | – |
| 6.5 | 7.0 | hockey jersey + black slim joggers + sneakers | K3_point_of_interest · P1_top_volume_vs_style |
| 5 | 7.0 | black LS pink graphics + embellished shorts + runners | – |
| 8 | 7.5 | black Supreme jersey + black baggy pants + high-tops | K4_shoes_complement |
| 7 | 7.5 | black polo tucked + light wide jeans + sneakers | K2_elevated_piece,K4_shoes_complement · P1_leg_vs_style |
| 6 | 7.5 | camo hoodie + dark wide jeans + black/red sneakers | K3_point_of_interest |
| 9 | 7.5 | black graphic sweatshirt + ripped light wide jeans + tan boots K4_shoes_complement | – |

**Result: rank correlation −0.02, mean error 1.4 points. The creator spread his scores from 2 to 9; v4 put every one of the 20 between 6.5 and 7.5.** One creator with 674 followers is a weak judge, and my encoding adds noise. But the pattern is the founder's complaint from the other side: the score adds up checkboxes, so it can't tell a great fit from a plain or busy one.

What his ratings show that v4 can't see (each needs more sources before it becomes a rule):
1. **"Too much going on" (his 5s).** A leopard graphic tee + a long tee hanging under it + rhinestone shorts + chains scored 5; v4 gave 7.5 (it even earned the shoe credit). v4's focal-point count ignores graphics and accessories. Matches R4's "one statement piece, the rest quiet" (4 sources).
2. **"Basic fit" (his 5).** Grey zip hoodie + straight blue jeans + sneakers scored 5; v4 gives 7.0. This is the real level question (is plain clean basics a 7, or a 6?). Reddit commenters gave a plain beige-trousers fit 7 ("safe, classic… not personal enough"). The gold set decides.
3. **Stacked or pooled hems on wide jeans are the look in streetwear** (his 8.5 and 9). v4 charges `F4_pooling` −0.4 and, with a knit on top, 3 more faults (6.5 for his 8.5). This is the known gap from Oct 7 (the `stacked` hem reading, `proportions-color-style.md`).
4. **Bold color that's coordinated scores high** (purple hoodie + pink shoes: 9). v4 gave 6.5: no credit for the pairing, and pooling on top. Supports R4's color tie-in credit (one color echoed, Gray et al. 2014).
5. **Clashing loud pieces score very low** (Venom tee + distressed shorts + bright high-tops + durag: 2). v4 gave 7.0. v4 only floors at 5.0, but it found nothing wrong at all.

## What this changes in the v5 plan
- **A new pass bar for the gold set: spread, not just average error.** The score must spread fits the way people do (target: the standard deviation of our scores at least 70% of the friends' average), or a 7-for-everything rubric "passes" on average error.
- **Ledger priority:** (1) layer contrast (R4), (2) the color tie-in, (3) a clutter rule (graphics, patterns and visible accessories counted as focal points), (4) stacked hems on loose legs, (5) a "finished" credit. The "basic" level waits for the gold set.
- **More research needed:** a re-run of R3 on YouTube with fabrication guards, and R2 widened to more creators through the embed pages that worked. Reddit is blocked for Codex; don't re-run R1 as is.

## Re-runs (Oct 9, afternoon)
| Source | Got | Verified | Use |
|---|---|---|---|
| **R3b Gemini YouTube** | 14 rated outfits from **1 channel** (Brandon Balfour, "Rating My Followers Outfits (Brutally Honest)", `i0758MeMjSQ`) + 13 rules (10 from Fly With Johnny Thai's accessories ranking, `AgSRRTeSY58`; 3 from Brandon) | **Real this time:** all 4 listed videos exist with the right titles and channels (YouTube oEmbed); upload dates match (Sep 15 2024; May 22 2025); every timestamp falls inside the video's length (14:37; 16:53); the Balfour description links plain socks, matching the "non-branded socks" verdict. Quotes not checked word for word (YouTube blocked the caption download). The second Balfour video (`Y71miKP8yJE`) was opened but has no rows | **Verdicts are 3 tiers** ("clean" / "almost there" / "needs major improvement"), not numbers, so it's order evidence only. Rules count as 1 channel each |
| **R2b Codex TikTok** | Nothing added (Edge blanked TikTok pages, even a known-good post) | Honest stop | — |

What the YouTube rows add (each is 1–2 sources, so ledger candidates, not rules):
- **Chain with tailoring is a miss** ("chain doesn't fit the smart tailored look, just go with the watch"). With R4's "jewelry with tailoring is a miss", that's **2 independent sources**: an accessory credit has to depend on the style.
- **Too-slim pants knock a fit down** ("add about two more inches to the width"). Fits the fit research (skinny under anything reads dated).
- **Branded high socks + chunky sneakers under a smart top read as a formality clash.** v4 only charges shoes 2+ dressiness levels below the rest, so it misses this one (AF1s 2 vs. a polo 3).
- **Missing accessories cost a tier** for Balfour, and Johnny Thai says an outfit "is not complete" without jewelry. **Dissent:** R4's 6 editorial sources say restraint and nothing required, and the photo can't see small jewelry anyway. Kitted keeps "no accessories never costs points"; an accessory can earn, inside the cap.
- **Shoes decide** ("can't give you a solid rating cuz you got no shoes on"), which matches partial checks: no shoes, no shoe credit.

**Online collection is done.** Bot blocks stopped Codex on Reddit and TikTok, and big YouTube channels rate few real outfits. Across 4 tools we have 20 numeric ratings from 1 creator and 14 tier verdicts from 1 channel. That's enough for themes and a spread check, not for setting the level. **The gold set (friends rating blind, plus pairwise picks) is the calibration.** Optional, 5 minutes: ask Gemini to log the second Balfour video with the same honesty rules. Don't widen to 2021–2023: that's the skinny-jean era, and fit norms have moved.
