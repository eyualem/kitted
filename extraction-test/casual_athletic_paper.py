#!/usr/bin/env python3
"""Casual and athletic fits, on paper (Oct 17, 2026; plan rubric/research/parts/casual-athletic.md). No API calls, no
app change, and parts_proto.py is NOT edited: the candidate rules live in this file and are swapped into the engine
only for the length of one score call.

  /usr/bin/python3 casual_athletic_paper.py          the self-check, the test outfits (pass/fail), the gold set and the
                                                      saved phone checks, before (v13) and after (the candidates);
                                                      writes results/casual-athletic/report.txt

Data: the gold readings and the panel (results/gold1/raw.json, inputs/gold-judge/) and the phone pulls
(screenshots/phone/*/SQLite/kitted.db) are git-ignored. They're read from KITTED_DATA (default: this checkout), so a
worktree runs it with KITTED_DATA=/Users/eyu/Desktop/files/Kitted.

The candidates (each a knob; CAND_OFF turns them all off, and the self-check proves that's exactly v13):
  CA1  Shorts get a Proportions part ([PRO-1] today skips it). Read only on the groupings that held across runs on the
       gold shorts (roominess >= 4: 23/24; loose vs not: 22/24): a roomy top worn on its own over loose shorts (the
       shorts shape), a tucked or short top over loose shorts (the waist), a short jacket over loose shorts (the
       layer); one shape credit, the largest. A roomy top over short, fitted shorts costs the band fault's 1.5. Any
       credit needs a real shoe (not slides; runners only at the gym or home). Length and socks aren't read: no rule.
  CA2  A sport or street sneaker (basketball, chunky, retro runner, canvas, low-profile, white leather) counts as the
       real shoe for "the shoes match how dressed-up the clothes are" ([SHO-2]'s SD1) under gym shorts, sweats,
       joggers and shorts. Today SD1 needs a shoe at dressiness 2.5 or more, so Jordans never earn it anywhere.
  CA3  Gym shorts with running shoes at Everyday and Class: held to ca3_runner_hold (v13: 5.5 by [LNG-2]).
  CA5  A matched tracksuit (a track jacket and track pants in the same colour family): +ca5 on Style. Future values:
       the reading can't name track pieces yet.
  CA6  A matched sweatsuit (a hoodie or sweatshirt with sweatpants or joggers in the same colour family) counts as the
       dressed-upper-half sign in the loungewear ladder ([LNG-2]): a set worn on purpose.

Rule 7: the gold photos are "profile unknown", scored with one stated test profile (picks Minimal + Smart casual,
0.5 each; boldness "a little"; no age) at Everyday, as gold_tune.py. The phone checks are scored at their own occasion
with no picks (the founder's profile is still pending). The test outfits are made-up readings with no person in them.
"""
import contextlib
import csv
import glob
import json
import os
import sqlite3
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
DATA = Path(os.environ.get("KITTED_DATA", K))
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import rules_conformance as RC  # noqa: E402  (its garment helpers and its 449 cases, for the self-check)

OUT = HERE / "results" / "casual-athletic"
PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")
ENGINE = "v13"

CAND_OFF = {"ca1": False, "ca1_shape": 0.0, "ca1_waist": 0.0, "ca1_layer": 0.0, "ca1_cap": 0.0, "ca1_slim_fault": 0.0,
            "ca1_need_shoes": False, "ca1_quiet_na": False, "ca2": False, "ca3_runner_hold": None, "ca5": 0.0, "ca6": False,
            # round 2, the founder's five answers (Oct 17; plan §9, DECISIONS-LOG #333): fit and context decide, not flat holds
            "ca1_fitted": 0.0, "ca3_unheld": False, "kit_cap": None, "kit_fit_rate": 0.0, "ca6_shape": 0.0,
            # round 3, "it should really depend on how good the components of the outfit come together" (#334): at Everyday
            # and Class dressing up never earns points by itself
            "d1": False, "d2": False, "d3": False, "d4": 0.0, "d5": False}
# The variants tried on the gold set (plan §6). V1 is the first draft; CAND (the recommendation) is V2: shorts are
# judged like pants (Proportions starts at 7), V3 is the cautious alternative (Proportions only when a credit or fault fires).
VARIANTS = {
    "V1 first draft": dict(CAND_OFF, ca1=True, ca1_shape=1.0, ca1_waist=1.0, ca1_layer=1.0, ca1_cap=1.5, ca1_slim_fault=1.5,
                           ca2=True, ca3_runner_hold=6.0, ca5=0.5, ca6=True),
}
VARIANTS["V2 no waist credit, shoes in view"] = dict(VARIANTS["V1 first draft"], ca1_waist=0.0, ca1_need_shoes=True)
VARIANTS["V3 = V2, Proportions only when it has something to say"] = dict(VARIANTS["V2 no waist credit, shoes in view"],
                                                                          ca1_quiet_na=True)
VARIANTS["V4 = V2 without CA3 (runners stay 5.5)"] = dict(VARIANTS["V2 no waist credit, shoes in view"], ca3_runner_hold=None)
VARIANTS["V5 = V2 without CA2 (no sneaker match)"] = dict(VARIANTS["V2 no waist credit, shoes in view"], ca2=False)
VARIANTS["V6 = V2 without CA1 (shorts stay NA)"] = dict(VARIANTS["V2 no waist credit, shoes in view"], ca1=False)
# Round 2 (the founder's answers, #333). V7 is the recommendation now; V8-V11 take one answer out each.
VARIANTS["V7 his answers (round 2)"] = dict(VARIANTS["V2 no waist credit, shoes in view"], ca3_runner_hold=None, ca3_unheld=True,
                                            ca1_fitted=1.0, kit_cap=6.0, kit_fit_rate=0.5, ca6_shape=1.0)
VARIANTS["V8 = V7 without the fitted-shorts charge"] = dict(VARIANTS["V7 his answers (round 2)"], ca1_fitted=0.0)
VARIANTS["V9 = V7 with runners held at 6.0 (round 1)"] = dict(VARIANTS["V7 his answers (round 2)"], ca3_unheld=False,
                                                               ca3_runner_hold=6.0)
VARIANTS["V10 = V7 with the kit at a flat 5.5 (today)"] = dict(VARIANTS["V7 his answers (round 2)"], kit_cap=None, kit_fit_rate=0.0)
VARIANTS["V11 = V7 without the sweatsuit shape"] = dict(VARIANTS["V7 his answers (round 2)"], ca6_shape=0.0)
# Round 3 (#334): the components, not the dressiness. V12 is the recommendation; V13-V17 take one change out each.
VARIANTS["V12 components, not dressiness (round 3)"] = dict(VARIANTS["V7 his answers (round 2)"], d1=True, d2=False, d3=True,
                                                            d4=0.5, d5=True)   # D2 tried and left out (plan §11)
VARIANTS["V13 = V12 without D1 (shoe match by dressiness)"] = dict(VARIANTS["V12 components, not dressiness (round 3)"], d1=False)
VARIANTS["V14 = V12 plus D2 (no too-casual deduction)"] = dict(VARIANTS["V12 components, not dressiness (round 3)"], d2=True)
VARIANTS["V15 = V12 without D3 (shoes chosen for the look)"] = dict(VARIANTS["V12 components, not dressiness (round 3)"], d3=False)
VARIANTS["V16 = V12 without D4 (the pieces go together)"] = dict(VARIANTS["V12 components, not dressiness (round 3)"], d4=0.0)
VARIANTS["V17 = V12 without D5 (a look counts as a sign)"] = dict(VARIANTS["V12 components, not dressiness (round 3)"], d5=False)
CAND = VARIANTS["V12 components, not dressiness (round 3)"]
CA2_BOTTOMS = {"athletic_shorts", "sweatpants", "joggers", "track_pants", "shorts"}
CA2_SHOES = {"basketball_sneaker", "chunky_sneaker", "retro_runner", "canvas_sneaker", "low_profile_sneaker",
             "white_leather_sneaker"}
SWEAT_TOPS = {"hoodie", "sweatshirt"}
SWEAT_BOTTOMS = {"sweatpants", "joggers"}

_ORIG = {"_proportions": P._proportions, "_shoes": P._shoes, "_occasion": P._occasion, "_cohesion": P._cohesion,
         "combine": P.combine}


# ============================================================================================ the candidate rules
def _proportions_c(c):
    def f(o, sl, t):
        B = o["bottom"]
        if not (c["ca1"] and B is not None and B.get("subcategory") in P.SHORTS):
            p = _ORIG["_proportions"](o, sl, t)
            # ---- round 2, answer 4: a matched sweatsuit in a relaxed shape, finished by a real sneaker
            if (c["ca6_shape"] and not p.na and B is not None and B.get("subcategory") in SWEAT_BOTTOMS and _sweatsuit(o)
                    and not any(r["points"] < 0 for r in p.reasons)):
                top = next(g for g in o["tops"] + o["outers"] if g.get("subcategory") in SWEAT_TOPS)
                S = o["shoes"]
                good = (B.get("leg_shape") not in P.NARROW and (B.get("volume") or 3) >= 3 and (top.get("volume") or 3) >= 3
                        and ((top.get("volume") or 3) >= 4 or B.get("leg_shape") in R.LOOSE))
                shoe_ok = S is not None and S.get("subcategory") in CA2_SHOES and P._earns(S)
                if good and shoe_ok and P._earns(top):
                    p.add(c["ca6_shape"], "a matched set in a relaxed shape, finished by clean sneakers", "CA6_sweatsuit_shape")
            return p
        p = P._Part("proportions")
        T, O, S = o["top"], o["outer"], o["shoes"]
        vol = B.get("volume") or 3
        loose = B.get("leg_shape") in R.LOOSE or vol >= 4
        fitted = B.get("leg_shape") in P.NARROW or vol <= 2
        s_sub = S.get("subcategory") if S is not None else None
        real = (S is None and not c["ca1_need_shoes"]) or (S is not None and s_sub not in P.SLIDES and (s_sub not in P.RUNNER or o.get("occasion") in P.LOUNGE_OK))
        roomy_top = T is not None and O is None and (T.get("volume") or 3) >= 4
        if roomy_top and fitted and not loose:
            p.add(-c["ca1_slim_fault"], "a roomy top over short, fitted shorts: it wants a fuller pair", "CA1_roomy_over_fitted")
            return p
        strained = B.get("strain") == "clear"                         # round 2: shorts that clearly pull are undersized too
        if c["ca1_fitted"] and ((fitted and not loose) or strained):  # ---- round 2, answer 2: undersized shorts
            if strained:   # Fit's FF6 charges the pull too; without this the new Proportions part diluted it (F2c 6.5 -> 7.0)
                p.add(-c["ca1_fitted"], "the shorts pull: a size up would sit better", "CA1_fitted_shorts")
                return p
            p.add(-c["ca1_fitted"], "the shorts look short and tight; a fuller pair balances the outfit", "CA1_fitted_shorts")
            return p
        rewards = []
        if loose and real:
            o_sub = O.get("subcategory") if O is not None else None
            if O is None and T is not None and P._earns(T) and T.get("tucked") in (None, "none", "na") \
                    and T.get("length") != "below_crotch" and (T.get("volume") or 3) >= 4:
                rewards.append((c["ca1_shape"], f"a roomy {(T.get('subcategory') or 'top').replace('_', ' ')} over loose "
                                "shorts: a deliberate shape", "CA1_shorts_shape"))
            if O is None and T is not None and P._earns(T) and (T.get("tucked") == "full" or (
                    T.get("length") in ("cropped", "at_belt") and (T.get("subcategory") not in P.RIBBED
                                                                   or (T.get("volume") or 3) >= 4))):
                rewards.append((c["ca1_waist"], "a tucked or short top over loose shorts gives it a waist", "CA1_shorts_waist"))
            if O is not None and P._earns(O) and o_sub not in P.TAILORED and (
                    o_sub in (P.SHORT_LAYERS | {"track_jacket"}) or O.get("length") in ("cropped", "at_belt")):
                rewards.append((c["ca1_layer"], f"a short {(o_sub or 'layer').replace('_', ' ')} over loose shorts",
                                "CA1_shorts_layer"))
        rewards = [x for x in rewards if x[0] > 0]
        if rewards:
            pts, line, check = max(rewards, key=lambda x: x[0])
            p.add(min(pts, c["ca1_cap"]), line, check)
        elif c["ca1_quiet_na"]:
            p.na = "shorts (no shape credit or fault; length isn't read yet)"
        return p
    return f


def _shoes_c(c):
    """v13's _shoes with one edit (CA2, marked). Everything else is a copy; the self-check proves the copy is exact."""
    def f(o, occasion, sl, t):
        p = P._Part("shoes")
        S, B = o["shoes"], o["bottom"]
        if S is None:
            p.na = "shoes not in the photo"; return p
        sub = S.get("subcategory")
        if sub == "other":
            p.na = "shoe type unclear (ask: boots, sneakers or slides?)"; return p
        clothes = [g for g in o["main"] if g.get("category") in ("top", "outerwear", "bottom")]
        if not clothes:
            p.na = "shoes only"; return p
        fs = R.formality(S)
        mean = sum(R.formality(g) for g in clothes) / len(clothes)
        gap = mean - fs
        tailored = any(g.get("subcategory") in P.TAILORED for g in o["outers"])
        lounge_ok = occasion in P.LOUNGE_OK
        leg = P._leg(B, o) if B else None
        loose_denim = bool(B and B.get("subcategory") in ("jeans", "cargos") and leg in R.LOOSE)
        athletic_bottom = bool(B and B.get("subcategory") in R.LOUNGE_BOTTOMS)
        up = 1.0
        if sub in P.SLIDES and not lounge_ok:
            p.score = 2.5 if tailored else 4.5
            p.reasons.append({"check": "SK1_slides_out", "points": round(p.score - P.BASE, 3),
                              "line": "slides read as staying in" + (" under a tailored jacket" if tailored else "")})
            drag = sl["rests_on_shoe"] if sl["rests_on_shoe"] is not None else (B is not None and B.get("hem") in ("pooling", "full_break"))
            if loose_denim and drag:
                p.add(-0.5, "the loose jeans drag on the slides: the hem has nothing to sit on", "SK1b_hem_drags")
            up = 0.0
        elif sub in P.RUNNER and not lounge_ok and "outdoor" not in o["det"]:
            p.score = 4.5 if tailored else (t["sk2_runner"] if t["sk2_runner"] is not None else 6.0)
            p.reasons.append({"check": "SK2_runners", "points": round(p.score - P.BASE, 3),
                              "line": "running shoes read gym" + (" under a tailored jacket" if tailored else " with these clothes")})
            up = 0.0
        else:
            if tailored and sub in P.BULKY:
                p.add(-2.0, "chunky sneakers fight a tailored jacket", "SD4_chunky_under_tailoring")
            too_casual = 1.5 * P.ramp(gap, 1.0, 2.0) + 1.0 * P.ramp(gap, 2.0, 3.0)
            if lounge_ok and sub in P.SLIDES | P.RUNNER:
                too_casual = 0.0
            p.add(-too_casual, "the shoes are more casual than the clothes", "SD2_too_casual")
            too_dressy = P.ramp(-gap, 2.0, 2.5)
            if t["sd3_off"] and not athletic_bottom:
                too_dressy = 0.0
            p.add(-0.5 * too_dressy, "the shoes are much dressier than the clothes", "SD3_too_dressy")
            up = 1.0 - too_dressy
            real = P.ramp(fs, 2.0, 2.5)
            if athletic_bottom and sub not in R.FOOT_KIND["sneakers"]:
                real = 0.0
            # ---- CA2 (the one edit): a sport or street sneaker is the real shoe for athletic bottoms and shorts
            if c["ca2"] and B is not None and B.get("subcategory") in CA2_BOTTOMS and sub in CA2_SHOES:
                real = 1.0
            # ---- round 3, D1: any clean sneaker or boot is a real shoe for the match, under any bottoms; whether it
            # matches is the window's job (how dressed-up the clothes are), not the shoe's own dressiness
            if c["d1"] and (sub in CA2_SHOES or sub in R.FOOT_KIND["boots"]):
                real = 1.0
            p.add(0.5 * up * real * P._match_window(gap), "the shoes match how dressed-up the clothes are", "SD1_matches")
            cc = R.Outfit(o["main"])
            role = max([R.STYLES[st_][0](S, cc)[0] for st_ in o["det_noshoe"]] or [0])
            subs = {g.get("subcategory") for g in o["main"]}
            suit = "suit_jacket" in subs and "suit_trousers" in subs
            if role and P._earns(S):
                p.add(0.5 * up, f"a {R.STYLE_NAMES[o['det_noshoe'][0]]} shoe for a {R.STYLE_NAMES[o['det_noshoe'][0]]} outfit"
                      if len(o["det_noshoe"]) == 1 else "the shoes belong to the look", "SC_chosen_for_look")
            elif t["sc_pair"] and P._earns(S) and any(
                    R.STYLES[st_][0](S, cc)[0] >= 2 and any(R.STYLES[st_][0](g, cc)[0] >= 2 for g in o["main"]
                                                            if g.get("category") != "footwear")
                    for st_ in o["det"]):
                p.add(0.5 * up, "the shoes belong to the look", "SC_chosen_for_look")
            elif t["suit_shoe"] and suit and sub in P.SUIT_SHOES and P._earns(S):
                p.add(0.5 * up, "the right shoes for a suit", "SC_chosen_for_look")
        if sub in P.BULKY and leg in P.NARROW:
            p.add(-1.5, "chunky sneakers look heavy under narrow legs", "SW1_chunky_narrow")
        elif sub in P.RUNNER and leg in P.NARROW:
            p.add(-0.5, "runners look heavy under narrow legs", "SW1_runner_narrow")
        if sub in P.BULKY and loose_denim and "streetwear" in o["det"] and B.get("hem") != "pooling" and up > 0:
            p.add(t["sw2"] * up, "chunky sneakers carry the wide jeans", "SW2_weight_carries_leg")
        if sub not in P.SLIDES:
            loud = R.is_bright(S) or S.get("color_family") == "multicolor"
            loud_clothes = sum(1 for g in clothes if R.is_bright(g) or (g.get("pattern") not in (None, "solid") and (
                g.get("pattern_scale") in ("medium", "large") or g.get("pattern") in ("graphic", "camo", "floral"))))
            if loud and loud_clothes >= 1:
                p.add(-0.75, "a loud shoe competing with a loud piece", "SCol1_loud_vs_loud")
            elif loud and loud_clothes == 0 and up > 0 and p.score >= P.BASE:
                p.add(0.5 * up, "the shoes are the one accent", "SCol2_shoe_accent")
        if P._care_fault(S):
            half = sub in ("work_boot", "suede_chukka")
            p.add(-0.5 if half else -1.0, "the shoes look worn" if P._care_fault(S) == "worn" else "the shoes look dirty", "SQ_worn")
        p.score = P.clamp(p.score, 2.0, 9.5)
        if leg == "wide" and sub in ("loafer", "dress_shoe", "derby") and not t["sw3_off"]:
            p.tip("check the shoe isn't swallowed by the wide legs (a slim shoe can look dainty)", "SW3_dainty_wide", would=-1.0)
        return p
    return f


def _sweatsuit(o):
    up = [g for g in o["tops"] + o["outers"] if g.get("subcategory") in SWEAT_TOPS]
    B = o["bottom"]
    return bool(up and B is not None and B.get("subcategory") in SWEAT_BOTTOMS
                and any(P._fam(g) == P._fam(B) for g in up))


def _occasion_c(c):
    """v13's _occasion with two edits (CA3, CA6, marked). The self-check proves the copy is exact with them off."""
    def f(o, occasion, t):
        core = []
        for g in o["main"]:
            fm = R.formality(g)
            if g.get("category") == "bottom" and g.get("subcategory") in R.LOUNGE_BOTTOMS and occasion in R.ATHLETIC_AS_CASUAL:
                fm = max(fm, 2)
            core.append(fm)
        out = {"deduction": 0.0, "ceiling": None, "lines": [], "status": "right for it"}
        if not core:
            return out
        avg = sum(core) / len(core)
        lo, hi = t["occ_target"].get(occasion) or R.OCCASION_TARGET.get(occasion, (2, 3))
        gap = lo - avg
        ded = 0.5 * P.ramp(gap, 0.25, 0.75)
        ceilings = []
        c1 = P._o1_ceiling(gap)
        if c["d2"] and occasion in R.ATHLETIC_AS_CASUAL:              # ---- round 3, D2: no "too casual" at Everyday/Class
            c1, ded = None, 0.0                                       # (slides, tanks and sweats keep their own rules)
        subs_ = {g.get("subcategory") for g in o["main"]}
        suit_ = "suit_jacket" in subs_ and "suit_trousers" in subs_        # a suit has its own credits (H1, H2_suit)
        out["no_style_full"] = not o["det"] and not suit_ and len(o["slots"]) == 3   # read by D4 in combine
        if c1 is not None:
            ceilings.append((c1, f"too casual for {occasion.replace('_', ' ')}"))
        elif ded > 0:
            out["lines"].append(f"a bit casual for {occasion.replace('_', ' ')}")
        over = avg - hi
        od = 0.5 * P.ramp(over, 1.5, 2.0)
        if od > ded:
            ded = od; out["lines"].append(f"a bit dressy for {occasion.replace('_', ' ')}")
        B, S = o["bottom"], o["shoes"]
        dressy_room = occasion in ("interview", "interview_corporate", "interview_tech", "event")
        if B is not None and B.get("subcategory") in R.LOUNGE_BOTTOMS and occasion not in P.LOUNGE_OK:
            if dressy_room:
                ceilings.append((4.0, "athletic bottoms at a dressy occasion"))
            else:
                dressed = any(x.get("subcategory") in R.DRESSED_OUTER for x in o["outers"]) or \
                    any(x.get("subcategory") in R.DRESSED_TOPS for x in o["tops"])
                if c["ca6"] and _sweatsuit(o):                         # ---- CA6: a matched sweatsuit is a sign
                    dressed = True
                look_sign = False
                if c["d5"] and not dressed and o["det"] and occasion in R.ATHLETIC_AS_CASUAL:
                    dressed, look_sign = True, True                   # ---- round 3, D5: reading as a look is the sign
                real_shoe = bool(S is None or S.get("subcategory") not in R.NOT_REAL_SHOES)
                kit = B.get("subcategory") == "athletic_shorts" and any(x.get("subcategory") == "jersey" for x in o["tops"])
                signs = 0 if kit else int(dressed) + int(real_shoe)
                hero = signs == 2 and bool(R.Outfit(o["main"]).hero)
                gym_shorts_ok = B.get("subcategory") == "athletic_shorts" and not kit and real_shoe
                # ---- round 2, answer 1: gym shorts with running shoes at Everyday and Class aren't held; the parts decide
                if (c["ca3_unheld"] and B.get("subcategory") == "athletic_shorts" and not kit and S is not None
                        and S.get("subcategory") in P.RUNNER and occasion in R.ATHLETIC_AS_CASUAL):
                    gym_shorts_ok = True
                if kit and c["kit_cap"] is not None:                    # ---- round 2, answer 3: the kit's hold follows fit
                    ceilings.append((c["kit_cap"], "a full kit out of the game"))
                    out["kit_fit_rate"] = c["kit_fit_rate"]
                elif not hero and not gym_shorts_ok:
                    lift = t["lounge_style"] if (o["det"] and not look_sign) else 0.0
                    cap = {0: 5.5, 1: 6.5, 2: 7.5}[signs] + lift
                    # ---- CA3: gym shorts with running shoes at Everyday and Class
                    if (c["ca3_runner_hold"] is not None and B.get("subcategory") == "athletic_shorts" and not kit
                            and S is not None and S.get("subcategory") in P.RUNNER and occasion in R.ATHLETIC_AS_CASUAL):
                        cap = max(cap, c["ca3_runner_hold"])
                    ceilings.append((cap, "loungewear out of the house"))
        if dressy_room and S is not None and S.get("subcategory") in P.SLIDES:
            ceilings.append((4.0, "slides at a dressy occasion"))
        if occasion in P.INTERVIEWISH and S is not None and S.get("subcategory") in R.FOOT_KIND["sneakers"] \
                and any(x.get("subcategory") in P.TAILORED for x in o["outers"]):
            ceilings.append((7.0, "sneakers under a blazer at an interview"))
        if t["int_top"] is not None and occasion in P.INTERVIEWISH:
            jacket = any(x.get("subcategory") in P.INT_OUTERS for x in o["outers"])
            dressed_top = any(x.get("subcategory") in P.INT_TOPS for x in o["tops"])
            if not jacket and not dressed_top:
                if any(x.get("subcategory") in P.HOODIES for x in o["tops"] + o["outers"]):
                    ceilings.append((t["int_hoodie"], "a hoodie at an interview"))
                else:
                    ceilings.append((t["int_top"], "an interview wants a collared shirt, a knit or a jacket"))
        if occasion in P.INTERVIEWISH and any(g.get("logo") == "large" and g.get("certainty") == "clear" for g in o["main"]):
            ceilings.append((6.5, "a big logo at an interview"))
        out["deduction"] = round(ded, 3)
        if ceilings:
            cc, line = min(ceilings, key=lambda x: x[0])
            out["ceiling"] = round(cc, 3)
            out["lines"].append(f"{line}: held to {P.round_half(cc)}")
            out["status"] = out["lines"][-1]
        elif out["lines"]:
            out["status"] = out["lines"][0]
        out["dressiness"] = round(avg, 3)
        return out
    return f


def _combine_c(c):
    """v13's combine, with round 2's answer 3: a full kit's ceiling drops by kit_fit_rate x what Fit or Proportions lost."""
    def f(part_scores, cond, occ, occasion, care_or_strain, engine="v13", tune=None):
        # ---- round 3, D4: "the pieces go together": no look to read as, but every part is at least 7, the shoes earned
        # a credit and nothing is off. The credit a smart-casual basic gets for reading as its look, for any basics.
        if (c["d4"] and occ.get("no_style_full") and "cohesion" in part_scores and part_scores.get("shoes", 0) > P.BASE
                and all(v >= P.BASE for v in part_scores.values()) and not cond.get("faults")):
            part_scores = dict(part_scores, cohesion=part_scores["cohesion"] + c["d4"])
            occ["goes_together"] = True
        if occ.get("kit_fit_rate") and occ.get("ceiling") is not None:
            worst = min(part_scores.get(k, P.BASE) for k in ("proportions", "fit"))
            cut = occ["kit_fit_rate"] * max(0.0, P.BASE - worst)
            if cut > 0:
                occ["ceiling"] = round(min(occ["ceiling"], c["kit_cap"] - cut), 3)
                occ["status"] = f"a full kit out of the game, and it doesn't fit cleanly: held to {P.round_half(occ['ceiling'])}"
        return _ORIG["combine"](part_scores, cond, occ, occasion, care_or_strain, engine, tune)
    return f


def _cohesion_c(c):
    def f(o, boldness, t):
        p = _ORIG["_cohesion"](o, boldness, t)
        if c["ca5"] and not p.na:
            J = [g for g in o["outers"] if g.get("subcategory") == "track_jacket"]
            B = o["bottom"]
            if J and B is not None and B.get("subcategory") == "track_pants" and P._fam(J[0]) == P._fam(B):
                p.add(c["ca5"], "a matched tracksuit, worn as one set", "CA5_tracksuit")
        return p
    return f


@contextlib.contextmanager
def candidates(c):
    P._proportions, P._shoes, P._occasion, P._cohesion = _proportions_c(c), _shoes_c(c), _occasion_c(c), _cohesion_c(c)
    P.combine = _combine_c(c)
    try:
        yield
    finally:
        for k, v in _ORIG.items():
            setattr(P, k, v)


def score(reading, occasion="everyday", styles=None, cand=None, second_look=None, boldness="a_little"):
    if cand is None:
        return P.score_parts(reading, occasion, styles or {}, second_look, boldness, engine=ENGINE)
    # round 3, D3: v4's tested-but-off "sc_pair": the look's own shoe also counts when the look needs the shoe to be
    # detected, as long as another piece is that look's anchor (a hoodie over wide jeans with chunky sneakers)
    tune = {"sc_pair": True} if cand.get("d3") else None
    with candidates(cand):
        return P.score_parts(reading, occasion, styles or {}, second_look, boldness, engine=ENGINE, tune=tune)


def same(a, b):
    if a.get("overall") != b.get("overall") or a.get("raw_score") != b.get("raw_score"):
        return False
    return {k: v["score"] for k, v in (a.get("parts") or {}).items()} == {k: v["score"] for k, v in (b.get("parts") or {}).items()}


def row(r):
    return P.card_row(r) if r.get("parts") else "-"


# ============================================================================================ data
def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def half(x):
    return round(x * 2) / 2


def load_gold():
    """As gold_tune.load() (the panel = median of the five judges' part-weighted means), from KITTED_DATA."""
    G, J = DATA / "extraction-test/results/gold1", DATA / "inputs/gold-judge"
    raw = json.load(open(G / "raw.json"))
    runs = defaultdict(dict)
    for x in raw:
        if x.get("json"):
            runs[x["photo"]][x["run"]] = x["json"]
    runs = {p: [v[i] for i in sorted(v)] for p, v in runs.items()}
    W = {"fit": 25, "proportion": 25, "color": 15, "shoes": 15, "cohesion": 15, "condition": 5}
    photo_of = {m["gid"]: m["photo"] for m in json.load(open(J / "manifest.json"))}
    rows = defaultdict(dict)
    for f in sorted(J.glob("judge-*-b*.csv")):
        for r in csv.DictReader(f.open()):
            if r.get("id"):
                rows[f.stem.split("-")[1]][r["id"].strip()] = r
    per = defaultdict(lambda: defaultdict(list))
    reasons = defaultdict(list)
    for j in rows:
        for g, r in rows[j].items():
            p = photo_of.get(g)
            if p is None:
                continue
            got = {k: num(r.get(k)) for k in W}
            got = {k: v for k, v in got.items() if v is not None}
            if got:
                per[p][j].append(sum(v * W[k] for k, v in got.items()) / sum(W[k] for k in got))
            reasons[p].append((j, r.get("reason", "")))
    panel = {p: half(st.median(st.mean(x) for x in v.values())) for p, v in per.items() if len(v) == len(rows)}
    fman = {m["fid"]: m["photo"] for m in json.load(open(J / "founder" / "manifest.json"))}
    founder = {fman[r["id"]]: float(r["score"]) for r in csv.DictReader(open(J / "founder" / "ratings.csv"))}
    split = json.load(open(HERE / "results/gold-tune/split.json"))
    return runs, panel, founder, reasons, set(split["test"])


def load_phone():
    """Every scored check in every phone pull, deduped by image hash (the newest pull wins)."""
    out = {}
    for db in sorted(glob.glob(str(DATA / "screenshots/phone/*/SQLite/kitted.db"))):
        cx = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        try:
            q = cx.execute("select f.image_hash, f.occasion, r.reading_json from fit_checks f join readings r "
                           "on r.id = f.reading_id where f.status = 'scored' order by f.created_at").fetchall()
        except sqlite3.Error:
            continue
        for h, occ, js in q:
            if js:
                out["phone-" + h[:6]] = {"reading": json.loads(js), "occ": occ}
    return out


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    n = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    d = (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
    return n / d if d else float("nan")


def bottom_sub(rd):
    return next((g.get("subcategory") for g in rd.get("garments", []) if g.get("category") == "bottom"), None)


def desc(rd):
    return " + ".join(f"{g.get('subcategory')} ({g.get('color_family')}, roominess {g.get('volume')}"
                      + (f", {g.get('leg_shape')}" if g.get("category") == "bottom" else "") + ")"
                      for g in rd.get("garments", []) if g.get("category") in ("top", "outerwear", "bottom", "footwear"))


# ============================================================================================ the test outfits
G, top, outer, bottom, shoe, Rd = RC.G, RC.top, RC.outer, RC.bottom, RC.shoe, RC.Rd
GYM = bottom("athletic_shorts", "black", "relaxed", "na", volume=4)
JORDANS = shoe("basketball_sneaker", "white")
RUNNERS = shoe("performance_runner", "grey")
SLIDES = shoe("slides_sandals", "black")
JORTS = bottom("shorts", "denim_mid", "wide", "na", volume=4)
JORTS_REG = bottom("shorts", "denim_mid", "relaxed", "na")
CHINO_SH = bottom("shorts", "khaki_beige", "straight", "na")
FITTED_SH = bottom("shorts", "khaki_beige", "slim", "na", volume=2)
TRACK_J = outer("track_jacket", "navy")
TRACK_P = bottom("track_pants", "navy", "straight", "slight_break")

# (id, what, reading, occasion, check(before, after) -> (ok, the bar in words), future values)
# The bars were written before the candidates were run (plan §5); "after" is the candidate engine.
OUTFITS = [
    ("A1", "plain white tee + black gym shorts + white Jordans, Class", Rd(RC.TEE, GYM, JORDANS), "class",
     lambda b, a: (a["overall"] in (7.0, 7.5), "stays Put together (7.0 or 7.5)"), []),
    ("A2", "oversized grey hoodie (roominess 4) + gym shorts + Jordans, Class", Rd(top("hoodie", "grey", 4), GYM, JORDANS), "class",
     None, []),   # its bar compares with A1, filled in below
    ("A3", "regular grey hoodie (roominess 3) + gym shorts + Jordans, Class", Rd(top("hoodie", "grey", 3), GYM, JORDANS), "class",
     None, []),   # bar vs A1
    ("A4", "plain tee + gym shorts + running shoes, Class", Rd(RC.TEE, GYM, RUNNERS), "class",
     lambda b, a: (a["overall"] == 6.5 and a["occasion"]["ceiling"] is None,
                   "round 2: not held; the parts decide (6.5, Shoes 5.0 for the runners)"), []),
    ("A5", "plain tee + gym shorts + slides, Class", Rd(RC.TEE, GYM, SLIDES), "class",
     lambda b, a: (a["overall"] == b["overall"] == 5.5, "stays 5.5 Needs a fix"), []),
    ("A6", "oversized black graphic tee + wide mid-wash jorts + chunky sneakers, Everyday",
     Rd(top("graphic_tee", "black", 4), JORTS, shoe("chunky_sneaker", "white")), "everyday",
     lambda b, a: (a["overall"] >= b["overall"] + 0.5, "up at least 0.5: the shorts shape shows"), []),
    ("A7", "plain tee + relaxed jorts + black canvas sneakers, Everyday", Rd(RC.TEE, JORTS_REG, RC.CANVAS), "everyday",
     lambda b, a: (a["overall"] in (7.0, 7.5), "stays Put together, no shape credit (regular tee)"), []),
    ("A8", "boxy white tee ending at the belt + wide khaki shorts + white leather sneakers, Everyday",
     Rd(top("tee", "white", 4, length="at_belt"), bottom("shorts", "khaki_beige", "wide", "na", volume=4), RC.WLS), "everyday",
     lambda b, a: (a["overall"] >= b["overall"] + 0.5, "up at least 0.5: the waist over loose shorts"), []),
    ("A9", "grey bomber over a white tee + wide cream shorts + chunky sneakers, Everyday",
     Rd(RC.TEE, outer("bomber", "light_grey"), bottom("shorts", "off_white_cream", "wide", "na", volume=4),
        shoe("chunky_sneaker", "black")), "everyday",
     lambda b, a: (a["overall"] >= b["overall"], "not down: a short jacket over loose shorts"), []),
    ("A10", "navy polo + straight khaki shorts + white leather sneakers, Everyday",
     Rd(top("polo", "navy"), CHINO_SH, RC.WLS), "everyday",
     lambda b, a: (abs(a["overall"] - b["overall"]) <= 0.5, "within 0.5 (Proportions now counts, at 7)"), []),
    ("A11", "grey hoodie + grey sweatpants (a set) + white leather sneakers, Everyday",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "grey", "relaxed", "cuffed"), RC.WLS), "everyday",
     lambda b, a: (a["overall"] >= b["overall"] + 0.5, "up at least 0.5: a matched set is a sign of intent"), []),
    ("A12", "grey hoodie + black sweatpants + black slides, Everyday (his own Oct 8 outfit, made up here)",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "black", "relaxed", "full_break"), SLIDES), "everyday",
     lambda b, a: (a["overall"] == b["overall"] == 5.5, "stays 5.5"), []),
    ("A13", "navy track jacket + navy track pants + grey retro runners, Everyday",
     Rd(RC.TEE, TRACK_J, TRACK_P, RC.RETRO), "everyday",
     lambda b, a: (a["overall"] >= 7.5, "reads as a look: 7.5 or more"), ["track_jacket", "track_pants"]),
    ("A14", "navy track jacket + navy track pants + running shoes, Everyday",
     Rd(RC.TEE, TRACK_J, TRACK_P, RUNNERS), "everyday",
     lambda b, a: (a["overall"] <= 7.0, "running shoes still hold it (7.0 or less)"), ["track_jacket", "track_pants"]),
    ("A15", "green jersey + black gym shorts + Jordans (a full kit), Everyday",
     Rd(top("jersey", "green"), GYM, JORDANS), "everyday",
     lambda b, a: (a["overall"] == 6.0, "round 2: a clean kit is held to 6.0 (v13 5.5)"), []),
    ("A16", "tank top + gym shorts + running shoes, Gym", Rd(top("tank_top", "white"), GYM, RUNNERS), "gym",
     lambda b, a: (a["overall"] >= 7.0, "fine at the gym (7.0 or more)"), []),
    ("A17", "oversized hoodie (roominess 4) + short, fitted khaki shorts + Jordans, Class",
     Rd(top("hoodie", "grey", 4), FITTED_SH, JORDANS), "class", None, []),   # bar vs A2
    ("A18", "plain tee + gym shorts + Jordans, Interview", Rd(RC.TEE, GYM, JORDANS), "interview",
     lambda b, a: (a["overall"] == b["overall"] and a["overall"] <= 4.0, "unchanged, held to 4.0"), []),
    ("A19", "oversized hoodie + gym shorts + Jordans, Going out", Rd(top("hoodie", "grey", 4), GYM, JORDANS), "going_out",
     lambda b, a: (a["overall"] <= 7.0, "going out in gym shorts stays 7.0 or less"), []),
    ("A20", "white tee + wide black jeans + white Jordans (control: no shorts), Everyday",
     Rd(RC.TEE, bottom("jeans", "black", "wide", "slight_break"), JORDANS), "everyday",
     lambda b, a: (a["overall"] >= b["overall"], "round 3 restated: not down (rounds 1-2 left it unchanged)"), []),
    # ---- round 2: one or more per answer of the founder's (Oct 17, #333); bars written before the run
    ("F1a", "answer 1: plain tee + gym shorts + running shoes, Everyday", Rd(RC.TEE, GYM, RUNNERS), "everyday",
     lambda b, a: (a["overall"] == 6.5 and a["occasion"]["ceiling"] is None, "not held; 6.5 from the parts"), []),
    ("F1b", "answer 1: the same at the Gym", Rd(RC.TEE, GYM, RUNNERS), "gym",
     lambda b, a: (a["overall"] >= 7.0, "fine at the gym, 7.0 or more"), []),
    ("F1c", "answer 1: the same, going out", Rd(RC.TEE, GYM, RUNNERS), "going_out",
     lambda b, a: (a["overall"] <= 6.0, "context still counts: 6.0 or less going out"), []),
    ("F1d", "answer 1: plain tee + gym shorts + slides, Class (not in his answer: kept)", Rd(RC.TEE, GYM, SLIDES), "class",
     lambda b, a: (a["overall"] == 5.5, "slides keep today's 5.5 hold"), []),
    ("F2a", "answer 2: plain tee + short, tight khaki shorts (slim, roominess 2) + Jordans, Class",
     Rd(RC.TEE, FITTED_SH, JORDANS), "class", None, []),          # bar vs A1
    ("F2b", "answer 2: plain tee + loose khaki shorts (relaxed) + Jordans, Class",
     Rd(RC.TEE, bottom("shorts", "khaki_beige", "relaxed", "na"), JORDANS), "class",
     lambda b, a: (a["overall"] in (7.0, 7.5), "stays Put together"), []),
    ("F2c", "answer 2: plain tee + gym shorts that clearly pull + Jordans, Class",
     Rd(RC.TEE, RC.mod(GYM, strain="clear"), JORDANS), "class",
     lambda b, a: (a["overall"] <= 6.5, "6.5 or less (Fit: they pull)"), []),
    ("F3a", "answer 3: jersey + loose gym shorts + Jordans, Class", Rd(top("jersey", "green"), GYM, JORDANS), "class",
     lambda b, a: (a["overall"] == 6.0, "a clean kit: held to 6.0"), []),
    ("F3b", "answer 3: jersey + short, tight gym shorts (slim, roominess 2) + Jordans, Class",
     Rd(top("jersey", "green"), bottom("athletic_shorts", "black", "slim", "na", volume=2), JORDANS), "class",
     lambda b, a: (a["overall"] <= 5.5, "fit moves it under the kit's hold: 5.5 or less"), []),
    ("F3c", "answer 3: the clean kit at the Gym", Rd(top("jersey", "green"), GYM, JORDANS), "gym",
     lambda b, a: (a["overall"] >= 7.0, "no hold at the gym, 7.0 or more"), []),
    ("F4a", "answer 4: matched grey set, roomy hoodie (4) + relaxed sweats + white leather sneakers, Everyday",
     Rd(top("hoodie", "grey", 4), bottom("sweatpants", "grey", "relaxed", "cuffed"), RC.WLS), "everyday",
     lambda b, a: (a["overall"] >= 7.5, "a good shape: 7.5 or more"), []),
    ("F4b", "answer 4: matched grey set, regular hoodie + relaxed sweats + white leather sneakers, Everyday",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "grey", "relaxed", "cuffed"), RC.WLS), "everyday",
     lambda b, a: (a["overall"] >= 7.0, "7.0 or more"), []),
    ("F4c", "answer 4: matched grey set, regular hoodie + slim joggers + white leather sneakers, Everyday",
     Rd(top("hoodie", "grey"), bottom("joggers", "grey", "slim", "cuffed"), RC.WLS), "everyday",
     lambda b, a: (a["overall"] <= 7.0, "a weak shape: 7.0 or less"), []),
    ("F4d", "answer 4: matched grey set, regular hoodie + skinny joggers + white leather sneakers, Everyday",
     Rd(top("hoodie", "grey"), bottom("joggers", "grey", "skinny", "cuffed"), RC.WLS), "everyday",
     lambda b, a: (a["overall"] <= 6.5, "skinny joggers: 6.5 or less"), []),
    ("F4e", "answer 4: matched grey set, roomy hoodie + relaxed sweats + slides, Everyday",
     Rd(top("hoodie", "grey", 4), bottom("sweatpants", "grey", "relaxed", "full_break"), SLIDES), "everyday",
     lambda b, a: (a["overall"] <= 6.5, "slides: no shape credit, 6.5 or less"), []),
    ("F5a", "answer 5: oversized black tee + wide black jorts + grey chunky sneakers, Everyday",
     Rd(top("tee", "black", 4), bottom("shorts", "black", "wide", "na", volume=5), shoe("chunky_sneaker", "grey")), "everyday",
     lambda b, a: (a["overall"] >= 7.5, "the shape counts, the length costs nothing: 7.5 or more"), []),
    ("F5b", "answer 5: the same shape in a red tee and purple jorts", Rd(top("tee", "red", 4),
     bottom("shorts", "purple", "wide", "na", volume=5), shoe("chunky_sneaker", "grey")), "everyday", None, []),   # bar vs F5a
    # ---- round 3 (#334): components, not dressiness; bars written before the run
    ("D1a", "round 3: white tee + dark straight jeans + black canvas sneakers, Class", Rd(RC.TEE, RC.DJEANS, RC.CANVAS), "class",
     lambda b, a: (a["parts"]["shoes"]["score"] > b["parts"]["shoes"]["score"] and a["overall"] in (7.0, 7.5),
                   "the canvas sneakers now earn the match (Shoes up); still Put together"), []),
    ("D1b", "round 3: white tee + dark straight jeans + derbies, Class (a shoe far dressier than the clothes)",
     Rd(RC.TEE, RC.DJEANS, RC.DERBY), "class",
     lambda b, a: (a["overall"] <= 7.5, "dressing up the shoe alone doesn't lift it past 7.5"), []),
    ("D2a", "round 3: grey hoodie + wide black jeans + white chunky sneakers, Class (streetwear, the look's own shoe)",
     Rd(top("hoodie", "grey"), RC.mod(RC.WJEANS, color_family="black"), RC.CHUNKY), "class",
     lambda b, a: (a["overall"] >= b["overall"], "not down"), []),
    ("D2b", "round 3: boxy white tee ending at the belt + wide mid-wash jeans + white chunky sneakers, Class (a deliberate casual shape)",
     Rd(top("tee", "white", 4, length="at_belt"), RC.WJEANS, RC.CHUNKY), "class",
     lambda b, a: (a["overall"] >= 8.0, "a put-together casual fit reaches 8"), []),
    ("D2c", "round 3: white oxford tucked + straight khaki chinos + brown loafers, Class (the dressy counterpart)",
     Rd(top("oxford_shirt", "white", tucked="full", length="na"), RC.CHINOS, RC.LOAFER), "class", None, []),   # bar vs D2b
    ("D3a", "round 3: grey hoodie + black sweatpants (wide) + white chunky sneakers, Class (reads as streetwear)",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "black", "wide", "cuffed"), RC.CHUNKY), "class",
     lambda b, a: (a["overall"] >= b["overall"] and a["overall"] >= 7.0, "a look counts as the sign: 7.0 or more, not down"), []),
    ("D3b", "round 3: the same at a Date (the date's rules unchanged)",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "black", "wide", "cuffed"), RC.CHUNKY), "date",
     lambda b, a: (a["occasion"]["ceiling"] == b["occasion"]["ceiling"], "the date's hold is unchanged"), []),
    ("D4a", "round 3: tank top + khaki shorts + slides, Class", Rd(top("tank_top", "white"),
     bottom("shorts", "khaki_beige", "relaxed", "na"), SLIDES), "class",
     lambda b, a: (a["overall"] <= 6.0, "slides and a tank still cost: 6.0 or less"), []),
    ("D4b", "round 3: plain tee + dark jeans + canvas sneakers at an Interview (unchanged)", Rd(RC.TEE, RC.DJEANS, RC.CANVAS),
     "interview", lambda b, a: (a["occasion"]["ceiling"] == b["occasion"]["ceiling"] and a["overall"] <= 6.0,
                                "the interview's hold is unchanged"), []),
]


def run_outfits(say):
    say("== The test outfits (bars written before the candidates ran) ==")
    res, fails = {}, 0
    for oid, what, rd, occ, bar, fut in OUTFITS:
        b, a = score(rd, occ), score(rd, occ, cand=CAND)
        res[oid] = (b, a)
    bars = {
        "A2": lambda b, a: (a["overall"] >= res["A1"][1]["overall"] + 0.5, "at least 0.5 above A1 (the plain tee)"),
        # round 3 restated (plan §11): the hoodie's Jordans now "belong to the look" (D3), so the total can differ from A1;
        # what A3 guards is the shape credit, so it compares Proportions
        "A3": lambda b, a: (a["parts"]["proportions"]["score"] == res["A1"][1]["parts"]["proportions"]["score"]
                            and res["A2"][1]["overall"] >= a["overall"],
                            "round 3 restated: no shape credit (Proportions as A1), and the oversized A2 at least as high"),
        "A17": lambda b, a: (a["overall"] <= res["A2"][1]["overall"] - 1.0, "at least 1.0 below A2 (loose shorts)"),
        "F2a": lambda b, a: (a["overall"] <= res["A1"][1]["overall"] - 0.5, "at least 0.5 below A1 (loose gym shorts)"),
        "F5b": lambda b, a: (a["overall"] <= res["F5a"][1]["overall"] - 0.5, "at least 0.5 below F5a: the colors clash"),
        "D2c": lambda b, a: (res["D2b"][1]["overall"] >= a["overall"], "the casual shape D2b scores at least as high as this"),
    }
    for oid, what, rd, occ, bar, fut in OUTFITS:
        b, a = res[oid]
        ok, words = (bar or bars[oid])(b, a)
        fails += not ok
        say(f"{'PASS' if ok else 'FAIL'} {oid} {what}{'  [future: ' + ', '.join(fut) + ']' if fut else ''}")
        say(f"     v13 {b['overall']:g} ({row(b)}) -> candidates {a['overall']:g} ({row(a)})   bar: {words}")
        ch = [r["line"] for k, v in a["parts"].items() for r in v["reasons"] if r["check"].startswith(("CA", "SD1"))]
        if a["occasion"]["ceiling"] is not None:
            ch.append(a["occasion"]["status"])
        if ch:
            say("     " + "; ".join(ch))
    say(f"{len(OUTFITS) - fails}/{len(OUTFITS)} test outfits pass")
    return fails


# ============================================================================================ main
def main():
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    # ---- P0 the self-check: candidates off == v13, on every conformance case and every gold reading
    bad = 0
    for c in RC.CASES:
        b = score(c["reading"], c["occasion"], dict(c["styles"]), second_look=c["second_look"], boldness=c["boldness"])
        z = score(c["reading"], c["occasion"], dict(c["styles"]), cand=CAND_OFF, second_look=c["second_look"],
                  boldness=c["boldness"])
        bad += not same(b, z)
    have_gold = (DATA / "extraction-test/results/gold1/raw.json").exists()
    if have_gold:
        runs, panel, founder, reasons, test = load_gold()
        for p, rs in runs.items():
            for rd in rs:
                bad += not same(score(rd, "everyday", PROFILE), score(rd, "everyday", PROFILE, cand=CAND_OFF))
    say(f"P0 self-check (candidates off == {ENGINE}): {'PASS' if not bad else f'FAIL ({bad} differ)'} on "
        f"{len(RC.CASES)} conformance cases" + (" and every gold reading" if have_gold else " (no gold data found)"))
    fails = bool(bad)
    say()
    fails += run_outfits(say)
    say()
    if not have_gold:
        say(f"No gold data under {DATA}; set KITTED_DATA to the main checkout.")
        return 1

    # ---- the gold set, before and after
    ATH = {"shorts", "athletic_shorts", "sweatpants", "joggers", "track_pants"}
    B, A = {}, {}
    for p, rs in runs.items():
        B[p] = [score(rd, "everyday", PROFILE) for rd in rs]
        A[p] = [score(rd, "everyday", PROFILE, cand=CAND) for rd in rs]
    moved = [p for p in runs if any(not same(x, y) for x, y in zip(B[p], A[p]))]
    V7c = VARIANTS["V7 his answers (round 2)"]       # G1 guards rounds 1-2 (shorts only); round 3 moves casual fits on purpose
    moved7 = [p for p in runs if any(not same(score(rd, "everyday", PROFILE), score(rd, "everyday", PROFILE, cand=V7c))
                                     for rd in runs[p])]
    outside = [p for p in moved7 if not any(bottom_sub(rd) in ATH for rd in runs[p])]
    say("== The gold set (5-judge AI panel; profile unknown, one stated test profile, Everyday) ==")
    say(f"   (round 3: {len(moved)} photos move in all, by design)")
    say(f"G1 rounds 1-2 (V7) photos that moved: {len(moved7)}; outside shorts, sweats and track pieces: {len(outside)} "
        f"{'PASS' if not outside else 'FAIL ' + str(outside)}")
    fails += bool(outside)

    def metr(S, photos):
        ps = [p for p in photos if p in panel and S[p] and S[p][0]["overall"] is not None]
        app = [S[p][0]["overall"] for p in ps]
        pan = [panel[p] for p in ps]
        return {"n": len(ps), "r": pearson(app, pan) if len(ps) > 2 else float("nan"),
                "w05": sum(abs(x - y) <= 0.5 for x, y in zip(app, pan)), "sd": st.pstdev(app) if app else 0,
                "mean": st.mean(app) if app else 0, "pmean": st.mean(pan) if pan else 0}
    sub = [p for p in runs if any(bottom_sub(rd) in ATH for rd in runs[p])]
    shorts = [p for p in sub if any(bottom_sub(rd) in ("shorts", "athletic_shorts") for rd in runs[p])]
    for name, ps in (("all photos", list(runs)), ("held-out test half", [p for p in runs if p in test]),
                     ("shorts, sweats, joggers", sub), ("shorts only", shorts)):
        mb, ma = metr(B, ps), metr(A, ps)
        say(f"  {name:26s} n {mb['n']:3d}  r {mb['r']:.2f} -> {ma['r']:.2f}   within 0.5 {mb['w05']} -> {ma['w05']}   "
            f"app sd {mb['sd']:.2f} -> {ma['sd']:.2f} (panel mean {mb['pmean']:.2f}; app mean {mb['mean']:.2f} -> {ma['mean']:.2f})")
    mb, ma = metr(B, [p for p in runs if p in test]), metr(A, [p for p in runs if p in test])
    g2 = ma["r"] >= mb["r"] - 0.03
    say(f"G2 held-out r doesn't drop by more than 0.03: {'PASS' if g2 else 'FAIL'}")
    fails += not g2
    fp = [p for p in founder if p in runs and B[p][0]["overall"] is not None]
    fb = [B[p][0]["overall"] for p in fp]
    fa = [A[p][0]["overall"] for p in fp]
    fr = [founder[p] for p in fp]
    wb, wa = sum(abs(x - y) <= 0.5 for x, y in zip(fb, fr)), sum(abs(x - y) <= 0.5 for x, y in zip(fa, fr))
    say(f"G3 the founder's {len(fp)} blind ratings: r {pearson(fb, fr):.2f} -> {pearson(fa, fr):.2f}; within 0.5 {wb} -> {wa}: "
        f"{'PASS' if wa >= wb else 'FAIL'}")
    fails += wa < wb

    def steady(S, ps):
        two = [p for p in ps if len(S[p]) >= 2 and all(x["overall"] is not None for x in S[p][:2])]
        return sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in two), len(two)
    sb, sa = steady(B, sub), steady(A, sub)
    say(f"G4 the two runs within 0.5 on shorts/sweats photos: {sb[0]}/{sb[1]} -> {sa[0]}/{sa[1]}: "
        f"{'PASS' if sa[0] >= sb[0] else 'FAIL'}")
    fails += sa[0] < sb[0]
    say()
    say("  The variants (held-out r · all r · shorts/sweats r · within 0.5 on shorts/sweats · founder's 20 within 0.5):")
    tp = [p for p in runs if p in test]
    for vn, vc in [("v13 today", None)] + list(VARIANTS.items()):
        S = B if vc is None else {p: [score(rd, "everyday", PROFILE, cand=vc) for rd in runs[p][:1]] for p in runs}
        m1, m2, m3 = metr(S, tp), metr(S, list(runs)), metr(S, sub)
        fw = sum(abs(S[p][0]["overall"] - founder[p]) <= 0.5 for p in fp)
        say(f"    {vn:58s} {m1['r']:.2f} · {m2['r']:.2f} · {m3['r']:.2f} · {m3['w05']}/{m3['n']} · {fw}/{len(fp)}")
    say()
    say("  Round 3: by how dressy the clothes are (mean dressiness of tops, jackets and bottoms; athletic = an athletic bottom):")
    def band(rd):
        gs = [g for g in rd.get("garments", []) if g.get("category") in ("top", "outerwear", "bottom")]
        if not gs:
            return None
        if any(g.get("subcategory") in R.LOUNGE_BOTTOMS for g in gs):
            return "athletic"
        m = st.mean(R.formality(g) for g in gs)
        return "casual" if m < 2.5 else "in-between" if m < 3.0 else "dressy"
    bands = {p: band(runs[p][0]) for p in runs}
    V7 = VARIANTS["V7 his answers (round 2)"]
    S7 = {p: [score(runs[p][0], "everyday", PROFILE, cand=V7)] for p in runs}
    for bn in ("athletic", "casual", "in-between", "dressy"):
        ps = [p for p in runs if bands[p] == bn and B[p][0]["overall"] is not None]
        def st8(S):
            v = [S[p][0]["overall"] for p in ps]
            return f"{st.mean(v):.2f} · 8+ {sum(x >= 8 for x in v)} ({100 * sum(x >= 8 for x in v) / len(v):.0f}%)"
        pv = [panel[p] for p in ps if p in panel]
        say(f"    {bn:10s} n {len(ps):3d}   v13 {st8(B)}   round 2 {st8(S7)}   round 3 {st8(A)}   panel {st.mean(pv):.2f} · 8+ "
            f"{sum(x >= 8 for x in pv)} ({100 * sum(x >= 8 for x in pv) / len(pv):.0f}%)")
        md = [(A[p][0]["overall"] - panel[p]) for p in ps if p in panel]
        mb = [(B[p][0]["overall"] - panel[p]) for p in ps if p in panel]
        say(f"               mean app - panel: v13 {st.mean(mb):+.2f} -> round 3 {st.mean(md):+.2f}")
    say(f"  8+ share, all gold: {sum(B[p][0]['overall'] >= 8 for p in runs if B[p][0]['overall'] is not None)} -> "
        f"{sum(A[p][0]['overall'] >= 8 for p in runs if A[p][0]['overall'] is not None)} photos")
    say()
    say("  photo    panel  founder  v13 (2 runs)  ->  candidates (2 runs)   reading (run 1)")
    for p in sorted(sub):
        b2 = "/".join(f"{x['overall']:g}" if x["overall"] is not None else "-" for x in B[p])
        a2 = "/".join(f"{x['overall']:g}" if x["overall"] is not None else "-" for x in A[p])
        mark = " *" if p in moved else ""
        say(f"  {p:8s} {panel.get(p, float('nan')):4.1f}   {founder.get(p, '')!s:5s}   {b2:9s} -> {a2:9s}{mark}   {desc(runs[p][0])}")
        if p in moved:
            ch = [r["line"] for k, v in A[p][0]["parts"].items() for r in v["reasons"] if r["check"].startswith(("CA", "SD1"))]
            if ch:
                say("           " + "; ".join(ch))
    say()

    # ---- the saved phone checks
    ph = load_phone()
    say(f"== The saved phone checks ({len(ph)}, every pull, deduped; each at its own occasion, no picks) ==")
    mv = 0
    for k, v in sorted(ph.items()):
        b, a = score(v["reading"], v["occ"]), score(v["reading"], v["occ"], cand=CAND)
        if b.get("overall") is None:
            continue
        if not same(a, b) or bottom_sub(v["reading"]) in ATH:
            mv += not same(a, b)
            say(f"  {k} {v['occ']:9s} v13 {b['overall']:g} -> {a['overall']:g}  {desc(v['reading'])}")
    say(f"G5 saved checks that moved: {mv}")
    say()
    say(f"{'ALL CHECKS PASS' if not fails else f'{fails} CHECK(S) FAIL'}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
