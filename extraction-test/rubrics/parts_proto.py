"""Parts engine PROTOTYPE (Oct 10, 2026; DECISIONS-LOG #195-199). NOT the live rubric: rubric.py v4.1 stays live.

The plan it implements: ../../rubric/research/parts/SPEC.md (approved, #196-197) and the part reports beside it
(fit.md, proportions.md, color.md, shoes.md, occasion.md, cohesion.md, condition.md). Paper test: ../parts_test.py,
report: ../../rubric/research/parts/prototype-results.md.

"The AI sees, the code judges": this file reads only the AI's garment description (the live v3 reading format,
schema.json) plus, when passed in, the second look's two yes/no answers (look1: the peek and "rests on the shoe").
It never reads face, body, weight or skin, never reads his profile (age or picked looks), and never asks the AI to judge.

How a score is made:
  1. Five PARTS, each 1-10 from its own checks:  Proportions 30 · Fit 25 · Color 15 · Shoes 15 · Cohesion 15.
     A part that isn't in the photo is NA and drops out; the other weights scale up.
  2. The weighted average of the parts (exact part values; the card shows them rounded to the half).
  3. CONDITION: faults only, subtracted (wrinkled -0.4, worn -0.4, stain -1.2, cap -1.6; footwear excluded,
     Shoes owns it; an untucked dress shirt under tailoring -0.6).
  4. OCCASION: final = min(average - a small deduction, a ceiling). It can only hold a score down.
  5. The 5.0 floor at everyday/class/home/gym (no stain, wear or strain), the 3.0 floor, round to the half.

Rules for what may move points (the design rule from the batch-1 and look1 tests, #198-199):
  - A check moves points only when the facts it reads passed a 3-run steadiness test in the grouping it uses
    (see STEADY below and the paper test's table). Anything else is a TIP: it's reported, with what it would
    cost once its reading passes, and never moves the number.
  - One fact, one owner (SPEC "Who owns each fact"): Shoes owns shoe weight vs the leg (both ways), slides with a
    dragging hem and shoe condition; Proportions owns a top running long; Fit owns sleeves, strain, too big and
    pooling; Cohesion owns too many statements and a standout piece (pattern); Color owns a standout color;
    Condition owns an untucked dress shirt; Occasion owns sneakers under a blazer at an interview.
  - No hard cliffs on the shoe's dressiness: batch 1 found v4's K4 line (|shoe - outfit| <= 0.75) was the main
    source of score wobble, because his grey suede boots flip between work boot (2.5), chukka (3) and derby (4).
    Here every dressiness comparison is a ramp with a flat middle wide enough to hold the whole boot family.

Reuses rubric.py v4.1's helpers (formality, colors, style detection, prepare/normalize) by import; nothing copied.
Deterministic: same reading (+ same second look) -> same result.
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import rubric as R  # noqa: E402  (v4.1: the live helpers)

VERSION = "parts-proto-1 (Oct 10, 2026)"
WEIGHTS = {"proportions": 0.30, "fit": 0.25, "color": 0.15, "shoes": 0.15, "cohesion": 0.15}
PART_ORDER = ["proportions", "fit", "color", "shoes", "cohesion"]
PART_NAMES = {"proportions": "Proportions", "fit": "Fit", "color": "Color", "shoes": "Shoes", "cohesion": "Style"}
BASE = 7.0                     # every part starts at "fine, nothing off"

# Which reading groupings passed a 3-run steadiness test (>= 90% the same; sources: proportions.md §1 table on
# zoom1/zoom1-stock arm B, fit.md, look1/report.md, b1/report.md; re-measured in parts_test.py on zoom1 arm B).
# Kept here as documentation: every check below names the grouping it reads.
STEADY = {
    "garment type (top / bottom / outer)": "tops 100%, bottoms 100% with close-ups (#104)",
    "tucked full yes/no": "97%",
    "leg narrow (skinny/slim) vs straight-or-fuller": "94% (narrow right 94%)",
    "leg skinny": "right 9/9 when it fires",
    "leg loose (relaxed/wide) yes/no": "97%",
    "top or layer volume >= 4": "97-100%",
    "hem pooling yes/no": "98%",
    "shoe bulky (chunky/basketball)": "98%",
    "shoe kind (boots / sneakers / slides / dress)": "kind 77% right; type 53% (so no cliff may sit inside a kind)",
    "sleeve_end covers_hand": "same in 3 runs 36/39 his, 49/55 stock",
    "strain clear": "63/66, 84/94",
    "second look: peek yes/no": "100% the same, 86% right when it fires (look1)",
    "second look: rests on the shoe yes/no": "94% the same, 97% right when it fires (look1)",
}
# Readings that FAILED or were never tested, so they only make tips here: top length below the crotch (fired 2 of
# 192 runs, both wrong), outer-layer length (63%), the 6-class hem (64-68%; heavy vs light 83%), the stack under a
# blazer, shows_below_outer (0 of 5 peeks), shoulder seam (78%), lightness (passed alone in b1 but isn't in the live
# reading), large logos outside the interview check (flip-flop).

TAILORED = R.TAILORED_OUTER                                   # blazer, suit jacket, sport coat, unstructured blazer
TAILORED_FIT = TAILORED | {"overcoat"}                        # sleeves over the hands read worst on these
RIBBED = {"hoodie", "sweatshirt", "sweater", "cardigan", "quarter_zip", "fleece"}   # ribbed cuffs/hems by design
SHORT_SLEEVE_TYPES = {"tee", "graphic_tee", "tank_top"}       # a "covers_hand" on these is a misread: ignored
PRESSED = {"chinos", "trousers", "suit_trousers", "drawstring_trousers"}
NARROW = {"skinny", "slim"}
FULL_LEG = {"straight", "relaxed", "wide"}                    # flare/bootcut and barrel are aliased by rubric.py
SHORT_LAYERS = {"bomber", "denim_jacket", "leather_jacket"}   # cut to end at the waist/hip by type (R2 stand-in)
BULKY = {"chunky_sneaker", "basketball_sneaker"}
RUNNER = {"performance_runner"}
SLIDES = {"slides_sandals"}
SHORTS = {"shorts", "athletic_shorts"}
LOUNGE_OK = {"gym", "home"}
INTERVIEWISH = {"interview", "interview_corporate", "interview_tech"}
DRESSY_ROOM = INTERVIEWISH | {"event", "wedding_formal", "wedding_casual"}
LINEN_LIKELY = {"drawstring_trousers", "camp_collar_shirt"}
NO_TIE_IN = {"white", "black", "grey", "navy", "denim", "multicolor", None}   # repeat by accident, not a tie-in


def ramp(x, a, b):
    """0 at x <= a, 1 at x >= b, linear between (a < b)."""
    return R.clamp01((x - a) / (b - a))


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def round_half(x):
    return R.round_half(x)


def _fam(g):
    return R.FAMILY.get(g.get("color_family"), g.get("color_family")) if g else None


def _care_fault(g):
    """'stained' (sure) or 'worn' (not excused by a designed distress) or None. Wrinkles never block credits (ruling 46)."""
    c = g.get("condition")
    if c == "stained" and g.get("certainty") == "clear":
        return "stained"
    if c == "pilled_or_worn" and not (g.get("distressed_by_design") and g.get("category") != "footwear"):
        return "worn"           # designed distress excuses wear on clothes only, never scuffs on shoes (condition.md C2)
    return None


def _earns(g):
    """Ruling 46: a stained or worn piece earns no credit in any part."""
    return g is not None and _care_fault(g) is None


def _refile(garments):
    """Two code-only re-filings the cohesion research needed (cohesion.md), applied to copies for every part:
    - a tank top worn with a collared shirt is a sweater vest the schema can't name (P001): file it as a sweater;
    - a suit jacket without suit trousers is judged as a blazer (the AI's blazer/suit-jacket call is shaky)."""
    gs = [dict(g) for g in garments]
    subs = {g.get("subcategory") for g in gs}
    collared = subs & (R.COLLARED | {"oxford_shirt", "dress_shirt"})
    for g in gs:
        if g.get("subcategory") == "tank_top" and collared and g.get("category") in ("top", "outerwear"):
            g["subcategory"] = "sweater"; g["refiled"] = "tank_top->sweater (vest)"
        if g.get("subcategory") == "suit_jacket" and "suit_trousers" not in subs:
            g["subcategory"] = "blazer"; g["refiled"] = "suit_jacket->blazer (no suit trousers)"
    return gs


def _second_look(sl):
    """Normalize the optional second look. Accepts the raw look answers ({under_present, under_shows, covers_shoe})
    or the reduced yes/no form ({peek, rests_on_shoe}). Returns {peek: bool|None, rests_on_shoe: bool|None}."""
    out = {"peek": None, "rests_on_shoe": None}
    if not sl:
        return out
    if "peek" in sl or "rests_on_shoe" in sl:
        out.update({k: sl.get(k) for k in out if k in sl})
        return out
    if "under_shows" in sl:
        out["peek"] = bool(sl.get("under_present") == "yes" and sl.get("under_shows") in ("a_little", "clearly"))
    cs = sl.get("covers_shoe")
    if cs in ("partly", "mostly"):
        out["rests_on_shoe"] = True
    elif cs == "no":
        out["rests_on_shoe"] = False
    return out


class _Part:
    """One part's working state: score, reasons (checks that moved it), tips (checks that can't move it yet)."""

    def __init__(self, name):
        self.name, self.score, self.reasons, self.tips, self.na = name, BASE, [], [], None

    def add(self, delta, line, check):
        if abs(delta) < 1e-9:
            return
        self.score += delta
        self.reasons.append({"check": check, "points": round(delta, 3), "line": line})

    def tip(self, line, check, would=None):
        self.tips.append({"check": check, "line": line, "would_cost": would})

    def result(self, lo=2.0, hi=10.0):
        if self.na:
            return {"score": None, "display": None, "na": self.na, "reasons": [], "tips": self.tips}
        s = clamp(self.score, lo, hi)
        return {"score": round(s, 3), "display": round_half(s), "na": None, "reasons": self.reasons, "tips": self.tips}


# =====================================================================================================
# PROPORTIONS (30%): length against length, weight against weight. Never a width against his body.
# =====================================================================================================
def _proportions(o, sl):
    p = _Part("proportions")
    T, O, B, S = o["top"], o["outer"], o["bottom"], o["shoes"]
    if B is None:
        p.na = "legs not in the photo"; return p
    if B.get("subcategory") in SHORTS:
        p.na = "shorts (no shorts-length reading yet)"; return p
    leg = B.get("leg_shape")
    lounge = B.get("subcategory") in R.LOUNGE_BOTTOMS
    o_sub = O.get("subcategory") if O else None
    o_tailored = o_sub in TAILORED
    big_top = (T is not None and (T.get("volume") or 3) >= 4) or (O is not None and (O.get("volume") or 3) >= 4)

    # ---- faults that move points today
    faults = 0.0
    if big_top and leg == "skinny":                                   # proportions.md F5 (v4 P2), 1.5
        p.add(-1.5, "a roomy top over skinny legs", "PF5_big_top_skinny_leg"); faults += 1.5
    elif O is not None and leg == "skinny":                           # F6, a trend rule (review 2028)
        p.add(-0.5, f"the {o_sub.replace('_', ' ')} has nothing sturdy to sit on over skinny legs", "PF6_layer_over_skinny")
        faults += 0.5
    if sl["peek"]:                                                    # F10/F11 via the second look; -0.5 at most (look1)
        p.add(-0.5, "the top underneath shows below the outer piece", "PF10_peek")
        faults += 0.5

    # ---- tips: real rules whose readings haven't passed (they never move the number)
    if T is not None and O is None and T.get("tucked") in (None, "none", "na") and T.get("length") == "below_crotch":
        p.tip("the top may run long, past the bottom of the fly", "PF2_long_top", would=-2.0 if leg in R.LOOSE else -1.5)
    if O is not None and not o_tailored and O.get("length") == "below_crotch" and leg in R.LOOSE:
        p.tip("a long loose layer over loose legs can shorten the line", "PF3_long_layer_loose_leg", would=-1.5)
    if o_tailored and B.get("hem") in ("pooling", "full_break"):
        p.tip("check the hem: trousers that bunch on the shoes fight a tailored jacket", "PF1_heavy_hem_tailored",
              would=-2.0)
    if T is not None and O is None and T.get("subcategory") in ("oxford_shirt", "flannel_shirt", "camp_collar_shirt",
                                                               "dress_shirt") \
            and T.get("tucked") in (None, "none", "na") and leg == "wide" and (T.get("volume") or 3) <= 3:
        p.tip("an untucked shirt over wide legs can hang long; a front tuck gives it shape", "PF4_long_shirt_wide_leg",
              would=-1.0)

    # ---- rewards: a deliberate shape. Blocked by any fault of 1+ and by a pooling hem (a shape needs a clean finish).
    # (Heavy-vs-light hem is 83% steady and finds 45% of heavy hems, so it can't block; pooling is 98% steady.)
    blocked = faults >= 1.0 or B.get("hem") == "pooling" or lounge
    full = leg in FULL_LEG
    rewards = []
    if not blocked and full and T is not None:
        tuck = T.get("tucked") == "full"
        short = T.get("length") in ("cropped", "at_belt")
        ribbed_ok = T.get("subcategory") not in RIBBED or (T.get("volume") or 3) >= 4
        if O is None and _earns(T) and (tuck or (short and ribbed_ok)):
            rewards.append((1.0, "a tucked or short top over a full leg gives it a waist", "PR1_waist_break"))
        elif O is None and _earns(T) and T.get("tucked") == "half" and T.get("subcategory") not in RIBBED:
            rewards.append((0.5, "the front tuck gives it a waist", "PR1b_half_tuck"))
    if not blocked and full and O is not None and o_sub in SHORT_LAYERS and _earns(O) and not sl["peek"]:
        rewards.append((1.0, f"a short {o_sub.replace('_', ' ')} over full legs: a clean, strong shape", "PR2_short_layer"))
    if (not blocked and o_tailored and T is not None and T.get("tucked") == "full" and B.get("subcategory") in PRESSED
            and leg != "skinny" and _earns(O)):
        rewards.append((0.5, "a complete tailored line", "PR3_tailored_line"))
    total = 0.0
    for pts, line, check in rewards:
        pts = min(pts, 2.0 - total)                                   # reward cap +2.0
        if pts > 0:
            p.add(pts, line, check); total += pts
    if not p.reasons and T is not None and O is None and T.get("subcategory") not in RIBBED:
        p.tip("a front tuck, or a jacket that ends at the hip, would give it more shape", "P_next_level")
    return p


# =====================================================================================================
# FIT (25%): each piece's size against its cut. Worst piece counts, plus half of what the others lost.
# Today it can only find faults (no shoulder-seam reading), so a clean outfit tops out at 7.
# =====================================================================================================
MINOR, MODERATE, CLEAR, SEVERE = 0.5, 1.5, 2.0, 4.0


def _piece_faults(g, o):
    cat, sub = g.get("category"), g.get("subcategory") or ""
    out = []
    if cat in ("top", "outerwear"):
        if g.get("sleeve_end") == "covers_hand" and sub not in SHORT_SLEEVE_TYPES:
            vol = g.get("volume") or 3
            if sub in TAILORED_FIT:
                out.append((CLEAR, f"the {sub.replace('_', ' ')}'s sleeves cover the hands", "FF1_sleeves_tailored"))
            elif sub in RIBBED:
                out.append((MINOR, f"the {sub.replace('_', ' ')} cuffs bunch over the hands", "FF1_cuffs_ribbed"))
            elif vol >= 4:                       # today's "too big" stand-in: a roomy cut + sleeves past the hand
                out.append((CLEAR, f"the {sub.replace('_', ' ')} looks a size big: roomy, sleeves over the hands",
                            "FF5_too_big"))
            else:
                out.append((MODERATE, f"the {sub.replace('_', ' ')}'s sleeves run past the wrists", "FF1_sleeves_long"))
        if g.get("strain") == "clear":
            out.append((CLEAR, f"the {sub.replace('_', ' ')} pulls", "FF6_strain"))
    elif cat == "bottom":
        hem, leg = g.get("hem"), g.get("leg_shape")
        drags_on_slides = (sub in ("jeans", "cargos") and leg in R.LOOSE and o["shoes"] is not None
                           and o["shoes"].get("subcategory") in SLIDES)
        if hem == "pooling" and not drags_on_slides:          # loose jeans on slides: Shoes owns that hem
            sev = CLEAR if sub in PRESSED else MINOR if sub in R.LOUNGE_BOTTOMS else MODERATE
            out.append((sev, f"the {sub.replace('_', ' ')} pile up on the shoes", "FF7_pooling"))
        if g.get("strain") == "clear":
            sev = MODERATE if leg in NARROW else CLEAR
            out.append((sev, f"the {sub.replace('_', ' ')} pull", "FF6_strain"))
    return out


def _fit(o):
    p = _Part("fit")
    pieces = o["tops"] + o["outers"] + ([o["bottom"]] if o["bottom"] else [])
    if not pieces:
        p.na = "no clothes to check"; return p
    scored = []
    for g in pieces:
        fs = sorted(_piece_faults(g, o), key=lambda f: -f[0])
        drop = min(SEVERE, fs[0][0] + 0.5 * sum(f[0] for f in fs[1:])) if fs else 0.0
        scored.append((drop, g, fs))
        # tip: a full break on a narrow leg (the 6-class hem is 64-68% steady, so it can't move points)
        if g.get("category") == "bottom" and g.get("hem") == "full_break" and g.get("leg_shape") in NARROW \
                and g.get("certainty") == "clear":
            p.tip("slim pants with a full break run a little long; a hem to just touch the shoe", "FF7b_full_break_narrow",
                  would=-0.5)
    scored.sort(key=lambda x: -x[0])
    worst = scored[0][0]
    others = sum(d for d, _, _ in scored[1:])
    total = worst + 0.5 * others
    if total > 0:
        # one reason line per faulted piece, worst first; the points shown are what the part lost to it
        for i, (d, g, fs) in enumerate(scored):
            if d <= 0:
                continue
            p.add(-(d if i == 0 else 0.5 * d), fs[0][1], fs[0][2])
    return p


# =====================================================================================================
# COLOR (15%): the clothes' colors and patterns (the shoe's color is Shoes'). Faults block the positives.
# =====================================================================================================
def _color(o, boldness):
    p = _Part("color")
    main = [g for g in o["main"] if g.get("category") in ("top", "outerwear", "bottom")]
    if len(main) < 2:
        p.na = "fewer than two pieces of clothing in view"; return p
    colored = [g for g in main if g.get("color_family") and g.get("color_family") != "multicolor"]
    accents = {}
    for g in colored:
        c = g["color_family"]
        if c in R.NEUTRALS:
            continue
        accents[_fam(g)] = max(accents.get(_fam(g), 0), 0.5 if R.half_accent(g) else 1.0)
    n_acc = sum(accents.values())
    families = {_fam(g) for g in colored}
    street = "streetwear" in o["det"]
    if n_acc >= 3:
        p.add(-2.5, "too many colors competing", "CC1_too_many_accents")
    elif len(families) >= 5 and n_acc >= 2:
        p.add(-1.0, "a few too many colors", "CC1_busy")
    bright = [g for g in main if R.is_bright(g)]
    if len({_fam(g) for g in bright}) >= 2:
        p.add(-1.0 if (boldness == "bold" or street) else -2.0, "two bright colors fighting", "CC2_bright_clash")
    jacket = next((x for x in o["outers"] if x.get("subcategory") in R.SEPARATE_JACKETS), None)
    B = o["bottom"]
    if (jacket and B and B.get("subcategory") in ("trousers", "chinos") and jacket.get("color_family") in R.DARK_SUITING
            and B.get("color_family") in R.DARK_SUITING and jacket.get("color_family") != B.get("color_family")):
        p.add(-1.5, "the dark jacket and trousers almost match", "CC4_near_match")
    pats = [g for g in main if g.get("pattern") not in (None, "solid")]
    seen = {}
    for g in pats:
        if g.get("pattern") != "graphic":
            k = (g.get("pattern"), g.get("pattern_scale"))
            seen[k] = seen.get(k, 0) + 1
    if any(n >= 2 and k[1] not in (None, "na") for k, n in seen.items()):
        p.add(-1.5, "two of the same pattern at the same size", "CC6_same_pattern_scale")
    elif any(n >= 2 for n in seen.values()):
        p.add(-0.75, "the same pattern twice", "CC6_same_pattern")
    if len(pats) >= 3 and not street:
        p.add(-1.5, "three patterns at once", "CC6_three_patterns")
    fault = bool(p.reasons)
    # tips that need readings we don't have (lightness for muddy/tonal, measured wash for double denim)
    if len(families) == 1:
        p.tip("all one color: a lighter or darker piece would add depth", "CP3_tonal_flat")
    if sum(1 for g in main if R.is_denim(g)) >= 2:
        p.tip("double denim: make the washes clearly different", "CC5_denim_near_match", would=-1.0)
    if fault:
        return p
    # positives (only when no fault). P3/P4/P6 need the lightness word, which isn't in the live reading.
    non_neutral = [g for g in colored if g["color_family"] not in R.NEUTRALS]
    if len(bright) == 1 and len(non_neutral) == 1 and _earns(bright[0]):
        g = bright[0]
        p.add(1.0, f"the {g.get('color_family').replace('_', ' ')} {g.get('subcategory').replace('_', ' ')} is the one standout",
              "CP1_standout_color")
        o["credited"].add(id(g))
    elif not bright and len(non_neutral) == 1 and _earns(non_neutral[0]):
        g = non_neutral[0]
        p.add(0.5, f"the {g.get('color_family').replace('_', ' ')} {g.get('subcategory').replace('_', ' ')} is a quiet accent",
              "CP2_quiet_accent")
    S = o["shoes"]
    upper = [g for g in main if g.get("category") in ("top", "outerwear")]
    if S is not None and _fam(S) not in NO_TIE_IN and not R.is_bright(S) \
            and any(_fam(g) == _fam(S) for g in upper):
        p.add(0.5, f"the shoes pick up the {_fam(S).replace('_', ' ')} up top", "CP5_tie_in")
    return p


# =====================================================================================================
# SHOES (15%): are these the right shoes for these clothes? Same number at every occasion except Gym/Home.
# No cliffs on dressiness (ramps with a flat middle that holds the whole boot family).
# =====================================================================================================
def _match_window(gap):
    """How well the shoe's dressiness matches the clothes', 0..1. gap = clothes' mean - shoe (+ = shoe more casual).
    Flat 1.0 from -1.5 (dressier) to +0.75 (more casual): work boot / chukka / Chelsea under jeans and a hoodie all
    sit inside it. It fades out linearly over the next 0.75 on each side (v4's K4 was a hard 0.75 line)."""
    if gap < -1.5:
        return 1.0 - ramp(-gap, 1.5, 2.25)
    if gap > 0.75:
        return 1.0 - ramp(gap, 0.75, 1.5)
    return 1.0


def _shoes(o, occasion, sl):
    p = _Part("shoes")
    S, B = o["shoes"], o["bottom"]
    if S is None:
        p.na = "shoes not in the photo"; return p
    sub = S.get("subcategory")
    if sub == "other":                     # type lost: the app asks "Boots, sneakers or slides?"; on Skip, NA (#123)
        p.na = "shoe type unclear (ask: boots, sneakers or slides?)"; return p
    clothes = [g for g in o["main"] if g.get("category") in ("top", "outerwear", "bottom")]
    if not clothes:
        p.na = "shoes only"; return p
    fs = R.formality(S)
    mean = sum(R.formality(g) for g in clothes) / len(clothes)
    gap = mean - fs
    tailored = any(g.get("subcategory") in TAILORED for g in o["outers"])
    lounge_ok = occasion in LOUNGE_OK
    leg = B.get("leg_shape") if B else None
    loose_denim = bool(B and B.get("subcategory") in ("jeans", "cargos") and leg in R.LOOSE)
    athletic_bottom = bool(B and B.get("subcategory") in R.LOUNGE_BOTTOMS)
    up = 1.0                               # how much of the upward moves still apply (shrinks smoothly, never a switch)

    if sub in SLIDES and not lounge_ok:
        p.score = 2.5 if tailored else 4.5
        p.reasons.append({"check": "SK1_slides_out", "points": round(p.score - BASE, 3),
                          "line": "slides read as staying in" + (" under a tailored jacket" if tailored else "")})
        drag = sl["rests_on_shoe"] if sl["rests_on_shoe"] is not None else (B is not None and B.get("hem") in ("pooling", "full_break"))
        if loose_denim and drag:
            p.add(-0.5, "the loose jeans drag on the slides: the hem has nothing to sit on", "SK1b_hem_drags")
        up = 0.0
    elif sub in RUNNER and not lounge_ok and "outdoor" not in o["det"]:
        p.score = 4.5 if tailored else 6.0
        p.reasons.append({"check": "SK2_runners", "points": round(p.score - BASE, 3),
                          "line": "running shoes read gym" + (" under a tailored jacket" if tailored else " with these clothes")})
        up = 0.0
    else:
        if tailored and sub in BULKY:
            p.add(-2.0, "chunky sneakers fight a tailored jacket", "SD4_chunky_under_tailoring")
        # too casual for the clothes: a ramp from 1 to 3 levels (v4 S2 against the average, not the dressiest piece)
        too_casual = 1.5 * ramp(gap, 1.0, 2.0) + 1.0 * ramp(gap, 2.0, 3.0)
        if lounge_ok and sub in SLIDES | RUNNER:
            too_casual = 0.0               # at the gym or at home they're the right shoe (shoes.md)
        p.add(-too_casual, "the shoes are more casual than the clothes", "SD2_too_casual")
        # much dressier than the clothes (dress shoes with a hoodie): a ramp, and it fades the upward moves out
        too_dressy = ramp(-gap, 2.0, 2.5)
        p.add(-0.5 * too_dressy, "the shoes are much dressier than the clothes", "SD3_too_dressy")
        up = 1.0 - too_dressy
        # matches the clothes' dressiness (a real shoe; with sweats only a sneaker matches)
        real = ramp(fs, 2.0, 2.5)
        if athletic_bottom and sub not in R.FOOT_KIND["sneakers"]:
            real = 0.0
        p.add(0.5 * up * real * _match_window(gap), "the shoes match how dressed-up the clothes are", "SD1_matches")
        # chosen for this look: the shoe is an anchor or home shoe of a style the clothes read as WITHOUT the shoe
        # (detection without the shoe, so the shoe can't reward itself; cohesion.md / shoes.md S-C)
        c = R.Outfit(o["main"])
        role = max([R.STYLES[st][0](S, c)[0] for st in o["det_noshoe"]] or [0])
        if role and _earns(S):
            p.add(0.5 * up, f"a {R.STYLE_NAMES[o['det_noshoe'][0]]} shoe for a {R.STYLE_NAMES[o['det_noshoe'][0]]} outfit"
                  if len(o["det_noshoe"]) == 1 else "the shoes belong to the look", "SC_chosen_for_look")
    # shoe weight against the leg (Shoes owns both directions)
    if sub in BULKY and leg in NARROW:
        p.add(-1.5, "chunky sneakers look heavy under narrow legs", "SW1_chunky_narrow")
    elif sub in RUNNER and leg in NARROW:
        p.add(-0.5, "runners look heavy under narrow legs", "SW1_runner_narrow")
    if sub in BULKY and loose_denim and "streetwear" in o["det"] and B.get("hem") != "pooling" and up > 0:
        p.add(0.5 * up, "chunky sneakers carry the wide jeans", "SW2_weight_carries_leg")
    # color (not for slides: their stripes read multicolor in some runs)
    if sub not in SLIDES:
        loud = R.is_bright(S) or S.get("color_family") == "multicolor"
        loud_clothes = sum(1 for g in clothes if R.is_bright(g) or (g.get("pattern") not in (None, "solid") and (
            g.get("pattern_scale") in ("medium", "large") or g.get("pattern") in ("graphic", "camo", "floral"))))
        if loud and loud_clothes >= 1:
            p.add(-0.75, "a loud shoe competing with a loud piece", "SCol1_loud_vs_loud")
        elif loud and loud_clothes == 0 and up > 0 and p.score >= BASE:
            p.add(0.5 * up, "the shoes are the one accent", "SCol2_shoe_accent")
    # wear (Condition skips footwear). A flat -1.0, not shoes.md's cap at 6.0: the worn read flips between runs on
    # about half the photos where it fires (5 of 9 in batch 1) and reads his grey suede boots' nap as wear, so a cap
    # turned one flip-prone read into a 1.5-2 point drop. Work boots and suede (patina, nap) cost half.
    if _care_fault(S):
        half = sub in ("work_boot", "suede_chukka")
        p.add(-0.5 if half else -1.0, "the shoes look worn" if _care_fault(S) == "worn" else "the shoes look dirty", "SQ_worn")
    p.score = clamp(p.score, 2.0, 9.5)
    if leg == "wide" and sub in ("loafer", "dress_shoe", "derby"):      # needs shoe_profile (untested): tip only
        p.tip("check the shoe isn't swallowed by the wide legs (a slim shoe can look dainty)", "SW3_dainty_wide", would=-1.0)
    return p


# =====================================================================================================
# COHESION / STYLE (15%): a narrow, written-down version (the council's tables). "Is the mix deliberate?" stays out.
# =====================================================================================================
def _cohesion(o, boldness):
    p = _Part("cohesion")
    if len(o["slots"]) < 2:
        p.na = "fewer than two of top, bottoms and shoes in view"; return p
    det, label = o["det"], o["label"]
    subs = {g.get("subcategory") for g in o["main"]}
    suit = "suit_jacket" in subs and "suit_trousers" in subs
    if det or suit:
        p.add(0.5, f"reads as {R.STYLE_NAMES[label]}" if label else "a matching suit", "H1_reads_as_style")
    # H2: the label style has an anchor (role 2) in all three slots and nothing against it; or a suit over a top
    if label and len(o["slots"]) == 3:
        role = R.STYLES[label][0]
        c = R.Outfit(o["main"])
        best, against = {}, 0
        for g in o["main"]:
            pos, neg = role(g, c)
            sl = R.SLOT[g["category"]]
            best[sl] = max(best.get(sl, 0), pos)
            against += neg
        if all(best.get(s, 0) >= 2 for s in ("upper", "bottom", "shoes")) and against == 0:
            p.add(0.5, f"clearly {R.STYLE_NAMES[label]} top to toe", "H2_clear_top_to_toe")
    elif suit and o["tops"]:
        p.add(0.5, "a suit worn properly over a top", "H2_suit")
    # H3: a piece from another world (the larger of the jacket rule and the spread rule, never both)
    B = o["bottom"]
    h3, h3_line = 0.0, None
    if any(x.get("subcategory") in TAILORED for x in o["outers"]) and B and B.get("subcategory") == "jeans" and (
            B.get("leg_shape") in R.LOOSE or B.get("color_family") in ("denim_light", "denim_mid")
            or B.get("distressed_by_design")):
        h3, h3_line = 1.5, "the tailored jacket and the loose or washed jeans come from different worlds"
    nonshoe = [g for g in o["main"] if g.get("category") != "footwear"
               and not (g.get("category") == "bottom" and g.get("subcategory") in R.LOUNGE_BOTTOMS)]
    f = [R.formality(g) for g in nonshoe]
    if len(f) >= 2 and max(f) - min(f) >= 2.5:
        inner = [R.formality(g) for g in nonshoe if g.get("category") != "outerwear"]
        bridged = len(inner) >= 1 and (max(inner) - min(inner) < 2.5 if len(inner) >= 2 else True)
        if not bridged:                                   # an outer layer is the one place a high-low mix works
            amt = 4.0 if max(f) - min(f) >= 3.5 else 1.5
            if amt > h3:
                h3, h3_line = amt, "formal and very casual pieces fight"
    if h3:
        p.add(-h3, h3_line, "H3_another_world")
    # H5: too many statements (v4 B1's focal count, his boldness allowance)
    focal = 0.0
    for g in [x for x in o["main"] if x.get("category") in ("top", "bottom", "outerwear")]:
        focal += 1 if R.is_bright(g) else 0.5 if R.half_accent(g) else 0
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
    base_allow = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5)
    allow = base_allow + (1 if "streetwear" in det else 0)
    if focal > allow:
        p.add(-min(1.0, 0.5 * math.ceil(focal - allow)), "too many things compete for attention", "H5_too_many_statements")
    # H4: one standout piece by pattern (a bright color is Color's; one garment, one credit)
    if not o["color_fault"] and focal <= base_allow:
        pat = [g for g in o["main"] if g.get("category") in ("top", "bottom", "outerwear")
               and g.get("pattern") not in (None, "solid", "graphic", "other") and g.get("pattern_scale") not in ("small", "na", None)]
        if len(pat) == 1 and _earns(pat[0]) and id(pat[0]) not in o["credited"]:
            g = pat[0]
            p.add(0.5, f"the {g.get('pattern').replace('_', ' ')} {g.get('subcategory').replace('_', ' ')} is the one standout",
                  "H4_standout_piece")
    return p


# =====================================================================================================
# CONDITION: faults only, subtracted after the average (condition.md). Footwear excluded (Shoes owns it).
# =====================================================================================================
def _condition(o, scene, occasion):
    if scene.get("lighting") == "dim":
        return {"deduction": 0.0, "faults": [], "display": "couldn't check in this light", "part": None}
    care, faults = 0.0, []
    for g in o["main"]:
        if g.get("category") == "footwear":
            continue
        name = (g.get("subcategory") or "piece").replace("_", " ")
        c = g.get("condition")
        if c == "stained" and g.get("certainty") == "clear":
            care += 1.2; faults.append(f"a stain on the {name}")
        elif c == "wrinkled":
            care += 0.2 if g.get("subcategory") in LINEN_LIKELY else 0.4; faults.append(f"the {name} looks wrinkled")
        elif c == "pilled_or_worn" and not g.get("distressed_by_design"):
            care += 0.4; faults.append(f"the {name} looks worn")
    care = min(care, 1.6)
    T = o["top"]
    t1 = 0.0
    if T is not None and T.get("subcategory") == "dress_shirt" and T.get("tucked") in ("none", None) and (
            any(x.get("subcategory") in TAILORED for x in o["outers"])
            or (o["bottom"] is not None and o["bottom"].get("subcategory") in ("trousers", "suit_trousers"))
            or occasion in R.DRESSY_OCCASIONS):
        t1 = 0.6; faults.append("the dress shirt is untucked")
    ded = care + t1
    part = None if not care else round_half(max(2.0, BASE - 2.5 * care))
    return {"deduction": round(ded, 3), "faults": faults, "display": "clean" if not faults else "; ".join(faults),
            "part": part}


# =====================================================================================================
# OCCASION: a step after the average that only holds a score down (occasion.md). Never averaged in.
# =====================================================================================================
O1_CURVE = [(0.75, 7.0), (1.0, 6.0), (1.5, 5.0), (2.0, 4.0), (2.5, 3.5)]   # gap -> ceiling, linear between points


def _o1_ceiling(gap):
    if gap <= O1_CURVE[0][0]:
        return None
    for (g0, c0), (g1, c1) in zip(O1_CURVE, O1_CURVE[1:]):
        if gap <= g1:
            return c0 + (c1 - c0) * (gap - g0) / (g1 - g0)
    return O1_CURVE[-1][1]


def _occasion(o, occasion):
    core = []
    for g in o["main"]:
        f = R.formality(g)
        if g.get("category") == "bottom" and g.get("subcategory") in R.LOUNGE_BOTTOMS and occasion in R.ATHLETIC_AS_CASUAL:
            f = max(f, 2)                      # loungewear is O-2's one charge at everyday/class
        core.append(f)
    out = {"deduction": 0.0, "ceiling": None, "lines": [], "status": "right for it"}
    if not core:
        return out
    avg = sum(core) / len(core)
    lo, hi = R.OCCASION_TARGET.get(occasion, (2, 3))
    gap = lo - avg
    ded = 0.5 * ramp(gap, 0.25, 0.75)
    ceilings = []
    c1 = _o1_ceiling(gap)
    if c1 is not None:
        ceilings.append((c1, f"too casual for {occasion.replace('_', ' ')}"))
    elif ded > 0:
        out["lines"].append(f"a bit casual for {occasion.replace('_', ' ')}")
    over = avg - hi
    od = 0.5 * ramp(over, 1.5, 2.0)                       # overdressed (> 1.5 above the band): up to -0.5, a ramp
    if od > ded:
        ded = od; out["lines"].append(f"a bit dressy for {occasion.replace('_', ' ')}")
    B, S = o["bottom"], o["shoes"]
    dressy_room = occasion in ("interview", "interview_corporate", "interview_tech", "event")
    if B is not None and B.get("subcategory") in R.LOUNGE_BOTTOMS and occasion not in LOUNGE_OK:
        if dressy_room:
            ceilings.append((4.0, "athletic bottoms at a dressy occasion"))
        else:
            dressed = any(x.get("subcategory") in R.DRESSED_OUTER for x in o["outers"]) or \
                any(t.get("subcategory") in R.DRESSED_TOPS for t in o["tops"])
            # shoes out of the photo count as a real shoe: what isn't in the photo never costs points
            real_shoe = bool(S is None or S.get("subcategory") not in R.NOT_REAL_SHOES)
            kit = B.get("subcategory") == "athletic_shorts" and any(t.get("subcategory") == "jersey" for t in o["tops"])
            signs = 0 if kit else int(dressed) + int(real_shoe)
            hero = signs == 2 and bool(R.Outfit(o["main"]).hero)
            gym_shorts_ok = B.get("subcategory") == "athletic_shorts" and not kit and real_shoe
            if not hero and not gym_shorts_ok:
                ceilings.append(({0: 5.5, 1: 6.5, 2: 7.5}[signs], "loungewear out of the house"))
    if dressy_room and S is not None and S.get("subcategory") in SLIDES:
        ceilings.append((4.0, "slides at a dressy occasion"))
    if occasion in INTERVIEWISH and S is not None and S.get("subcategory") in R.FOOT_KIND["sneakers"] \
            and any(x.get("subcategory") in TAILORED for x in o["outers"]):
        ceilings.append((7.0, "sneakers under a blazer at an interview"))
    if occasion in INTERVIEWISH and any(g.get("logo") == "large" and g.get("certainty") == "clear" for g in o["main"]):
        ceilings.append((6.5, "a big logo at an interview"))
    out["deduction"] = round(ded, 3)
    if ceilings:
        c, line = min(ceilings, key=lambda x: x[0])
        out["ceiling"] = round(c, 3)
        out["lines"].append(f"{line}: held to {round_half(c)}")
        out["status"] = out["lines"][-1]
    elif out["lines"]:
        out["status"] = out["lines"][0]
    out["dressiness"] = round(avg, 3)
    return out


def combine(part_scores, cond, occ, occasion, care_or_strain):
    """The steps after the parts: weighted average of the live parts (weights rescaled over the parts present),
    minus condition, minus the occasion deduction, held under the occasion ceiling, the 5.0 floor at everyday/class/
    home/gym (not when a stain, wear or strain fault fired), the 3.0 floor. Returns (average, raw final, floored, wsum).
    Public so the paper test can ask "what if a part read differently" without a second copy of these steps."""
    wsum = sum(WEIGHTS[k] for k in part_scores)
    avg = sum(WEIGHTS[k] * v for k, v in part_scores.items()) / wsum
    x = avg - cond["deduction"] - occ["deduction"]
    if occ["ceiling"] is not None:
        x = min(x, occ["ceiling"])
    floored = False
    if occasion in R.FLOOR_OCCASIONS and not care_or_strain and x < R.FLOOR:
        x, floored = R.FLOOR, True
    return avg, max(3.0, min(10.0, x)), floored, wsum


# =====================================================================================================
# THE ENTRY POINT
# =====================================================================================================
def _outfit(garments, styles):
    gs = garments
    tops = [g for g in gs if g.get("category") == "top"]
    outers = [g for g in gs if g.get("category") == "outerwear"]
    bottom = next((g for g in gs if g.get("category") == "bottom"), None)
    shoes = next((g for g in gs if g.get("category") == "footwear"), None)
    main = [g for g in gs if g.get("category") in R.SLOT]
    d = R.detect_styles(gs, styles)
    nd = R.detect_styles([g for g in gs if g.get("category") != "footwear"], styles)
    return {"tops": tops, "outers": outers, "top": tops[0] if tops else None, "outer": outers[0] if outers else None,
            "bottom": bottom, "shoes": shoes, "main": main, "det": d["detected"], "label": d["label"],
            "det_noshoe": nd["detected"], "slots": {R.SLOT[g["category"]] for g in main}, "credited": set(),
            "color_fault": False}


def score_parts(reading, occasion="everyday", styles=None, second_look=None, boldness="a_little"):
    """reading: the live v3 reading. occasion: the app key. styles: his picks ({style: weight}); like v4.1 they only
    pick the "Reads as" label on a tie and never change a number. second_look: optional look1 answers (see
    _second_look). Returns every part with its reasons and tips, the NA parts, condition, occasion and the final score."""
    styles = styles or {}
    sl = _second_look(second_look)
    scene, garments, not_rated = R._prepare(reading)
    if scene.get("clothed") != "fully":
        return {"overall": None, "reason": "not_fully_clothed", "parts": {}, "na_parts": PART_ORDER[:]}
    if not garments:
        return {"overall": None, "reason": "nothing_readable", "parts": {}, "na_parts": PART_ORDER[:]}
    garments = _refile(R._normalize(garments))
    o = _outfit(garments, styles)

    color = _color(o, boldness)
    o["color_fault"] = bool(color.reasons) and any(r["points"] < 0 for r in color.reasons)
    parts = {"proportions": _proportions(o, sl), "fit": _fit(o), "color": color,
             "shoes": _shoes(o, occasion, sl), "cohesion": _cohesion(o, boldness)}
    res = {k: (v.result(lo=1.0) if k == "cohesion" else v.result()) for k, v in parts.items()}
    live = {k: r for k, r in res.items() if r["score"] is not None}
    if not live:
        return {"overall": None, "reason": "no_part_readable", "parts": res, "na_parts": PART_ORDER[:]}
    cond = _condition(o, scene, occasion)
    occ = _occasion(o, occasion)
    care_or_strain = any(_care_fault(g) for g in o["main"]) or any(g.get("strain") == "clear" for g in o["main"])
    avg, x, floored, wsum = combine({k: r["score"] for k, r in live.items()}, cond, occ, occasion, care_or_strain)
    overall = round_half(x)

    # the lowest part leads the card, with its one-line reason (ties: the heavier part)
    low_k = min(live, key=lambda k: (live[k]["score"], -WEIGHTS[k]))
    lr = live[low_k]
    neg = [r for r in lr["reasons"] if r["points"] < 0]
    line = (neg[0]["line"] if neg else lr["reasons"][0]["line"] if lr["reasons"] else
            {"fit": "nothing looks the wrong size", "proportions": "a balanced, classic shape",
             "color": "clean neutrals, nothing fighting", "shoes": "clean and easy with this",
             "cohesion": "the pieces go together; nothing ties them to one look yet"}[low_k])
    return {
        "overall": overall, "raw_score": round(x, 3), "average": round(avg, 3), "version": VERSION,
        "parts": res, "na_parts": [k for k in PART_ORDER if res[k]["score"] is None],
        "weights_used": {k: round(WEIGHTS[k] / wsum, 3) for k in live},
        "condition": cond, "occasion": occ, "floored": floored, "care_or_strain": care_or_strain,
        "lowest": {"part": low_k, "score": lr["display"], "line": f"{PART_NAMES[low_k]} {lr['display']:g}: {line}"},
        "second_look": sl, "detected_styles": o["det"], "style_label": o["label"], "not_rated": not_rated,
        "partial": bool(not_rated),
    }


def card_row(result):
    """'Proportions 7 · Fit 5.5 · Color 7 · Shoes 7.5 · Style 7.5' (NA parts left out)."""
    return " · ".join(f"{PART_NAMES[k]} {result['parts'][k]['display']:g}" for k in PART_ORDER
                      if result["parts"].get(k, {}).get("display") is not None)
