"""Rubric v4 PROTOTYPE (style council round 3, mediator, Oct 7 2026). NOT the live rubric.

A standalone patched copy of extraction-test/rubric.py v3.1 (it imports nothing from the repo).
Every change from v3.1 sits behind one switch in SWITCHES:
  - score(ext, occasion, styles, boldness, F=V31) reproduces rubric.py v3.1 exactly (checked on every saved reading).
  - score(ext, occasion, styles, boldness)          uses V4, the rulebook's ruling set (RULEBOOK.md).
Also here: detect_styles() (the one shared style detector) and ask_question() (the "one quick tap" trigger).

Lines marked "# PROTO" are prototype-only scaffolding (switch plumbing, phase flags, explanations);
the TypeScript port in @kitted/core should keep the V4 behaviour and drop the V31 branches.

Phase notes:
  - "Phase 1" = today's schema (code-only changes, ship before beta).
  - "Phase 2" = readings that carry the new fields (hem "stacked", denim_wear, ...). Mark such a reading with
    ext["schema"] = "v4". Without that marker the code never assumes the new fields exist.
Run from extraction-test/:  /usr/bin/python3 ../rubric/research/style-council/rubric_v4_proto.py
"""
import copy
import itertools
import math

# ---------- Formality (1 athletic · 2 casual · 3 smart casual · 4 business casual · 5 formal) ----------
FORMALITY = {
    "tank_top": 1, "jersey": 1, "sweatpants": 1, "athletic_shorts": 1, "joggers": 1, "slides_sandals": 1,
    "graphic_tee": 2, "tee": 2, "hoodie": 2, "sweatshirt": 2, "cargos": 2, "shorts": 2, "jeans": 2, "canvas_sneaker": 2,
    "basketball_sneaker": 2, "chunky_sneaker": 2, "performance_runner": 2, "retro_runner": 2, "flannel_shirt": 2,
    "puffer": 2, "rain_jacket": 2, "shell_jacket": 2, "fleece": 2, "rugby_shirt": 2, "denim_jacket": 2, "bomber": 2,
    "work_boot": 2,
    "low_profile_sneaker": 2.5, "leather_jacket": 2.5, "camp_collar_shirt": 2.5,
    "polo": 3, "oxford_shirt": 3, "overshirt": 3, "sweater": 3, "cardigan": 3, "quarter_zip": 3, "chinos": 3,
    "chore_coat": 3, "field_jacket": 3, "white_leather_sneaker": 3, "suede_chukka": 3,
    "knit_polo": 3.5, "loafer": 3.5, "chelsea_boot": 3.5, "unstructured_blazer": 3.5,
    "drawstring_trousers": 2.5,
    "dress_shirt": 4, "trousers": 4, "blazer": 4, "sport_coat": 4, "overcoat": 4, "derby": 4,
    "suit_jacket": 5, "suit_trousers": 5, "dress_shoe": 5,
}
# v4 (new values, schema batch). Each gets the dressiness of its likeliest look-alike ("flip-safe"),
# except track_pants (between sweatpants 1 and joggers 1 and jeans 2; fails toward the stricter score).
NEW_FORMALITY = {"trail_shoe": 2, "vest": 2, "work_pants": 2, "denim_shirt": 3, "technical_pants": 2,
                 "track_jacket": 2, "track_pants": 1.5}
TAILORED_OUTER = {"blazer", "suit_jacket", "sport_coat", "unstructured_blazer"}
SEPARATE_JACKETS = {"blazer", "sport_coat", "unstructured_blazer"}
DARK_SUITING = {"charcoal", "navy", "black"}
OCCASION_TARGET = {
    "everyday": (2, 3), "class": (2, 3),
    "work_casual": (2.5, 3.5), "work": (3, 4),                     # work = business casual
    "date": (2.5, 3.5), "going_out": (2.5, 3.5),
    "interview": (3.5, 4.5), "interview_corporate": (4, 5), "interview_tech": (3, 4),
    "event": (3.5, 4.5), "wedding_formal": (4, 5), "wedding_casual": (3, 4),
    "gym": (1, 2), "home": (1, 2.5),                             # v3: where loungewear is right
}
DRESSY_OCCASIONS = {"work", "interview", "interview_corporate", "interview_tech", "event", "wedding_formal", "wedding_casual"}
# v4 ruling 20: where "occasion beats style" (style waivers for loungewear and logos switch off)
OCCASION_FIRST = DRESSY_OCCASIONS | {"work_casual"}
# v4 ruling 8: where the 5.0 floor applies
FLOOR_OCCASIONS = {"everyday", "class", "home", "gym"}

# ---------- Style bands: (top volume min, max), (leg min, leg max) ----------
LEG_ORDER = ["skinny", "slim", "straight", "relaxed", "wide"]
LEG_ALIAS = {"flare_bootcut": "straight", "barrel": "wide"}
STYLE_BANDS = {
    "smart_casual": ((2, 3), ("slim", "relaxed")),
    "minimalist": ((2, 4), ("straight", "relaxed")),      # + Scandinavian
    "old_money": ((2, 3), ("straight", "relaxed")),
    "workwear": ((3, 4), ("straight", "relaxed")),        # + Japanese Americana
    "vintage_sport": ((3, 4), ("straight", "relaxed")),   # + athleisure (low confidence)
    "streetwear": ((3, 5), ("straight", "wide")),         # + skater
    "preppy": ((2, 3), ("slim", "straight")),
    "gorpcore": ((3, 4), ("straight", "wide")),           # + techwear (optional, low confidence)
}
DEFAULT_BAND = ((2, 3.5), ("slim", "relaxed"))           # no style picked: centred on straight / relaxed-straight
# v4: the bands of DETECTED styles (7 options). Combined with DEFAULT_BAND as a union (widen only, ruling 2).
V4_BANDS = {
    "smart_casual": ((2, 3), ("slim", "relaxed")),
    "minimalist": ((2, 4), ("straight", "wide")),
    "classic_prep": ((2, 3), ("slim", "relaxed")),
    "workwear": ((2, 4), ("straight", "wide")),
    "streetwear": ((3, 5), ("straight", "wide")),
    "vintage_sport": ((3, 4), ("straight", "wide")),
    "outdoor": ((3, 4), ("slim", "wide")),
}
PICK_ALIAS = {"preppy": "classic_prep", "old_money": "classic_prep", "gorpcore": "outdoor"}   # old onboarding keys

# ---------- Colors ----------
NEUTRALS = {"white", "off_white_cream", "light_grey", "grey", "charcoal", "black", "navy", "khaki_beige", "tan_camel",
            "brown", "denim_light", "denim_mid", "denim_dark", "light_blue", "olive"}
MUTED = {"burgundy", "sage"}                               # never "loud"; half an accent
ALWAYS_BRIGHT = {"red", "orange", "yellow", "pink", "purple"}
HUE_DEPENDS = {"green", "blue"}                            # bright only if the extractor says saturation=bright
FAMILY = {"off_white_cream": "white", "light_grey": "grey", "charcoal": "grey", "denim_light": "denim",
          "denim_mid": "denim", "denim_dark": "denim", "tan_camel": "tan", "khaki_beige": "tan",
          "sage": "green", "olive": "green", "burgundy": "red", "light_blue": "blue_light"}

# ---------- SWITCHES: one per ruling (RULEBOOK.md "What changes from v3.1"). Tag: B = ship before beta (code only),
# N = needs the new fields + extraction re-run, G = after the gold set, X = rejected (kept for measurement) ----------
SWITCHES = {
    # styles and detection
    "picks_unlock_nothing": "B",   # C1  his picks never change the score (label tie-breaks and suggestions only)
    "detect": "B",                 # C2  styles detected in code from garments; allowances key on detection
    "band_union": "B",             # C3  P1 band = default band + every detected style's band (widen only)
    "street_allow": "B",           # C4  streetwear allowances (garment-confirmed), see score()
    "vintage_allow": "B",          # C5  vintage sport: P3 skipped for a hero top; hero piece waives loungewear
    "minimal_allow": "B",          # C6  minimal: P3 skipped over pressed trousers/chinos; "vary texture" tip
    "outdoor_allow": "B",          # C7  outdoor: P3 skipped; no big-logo tip on technical pieces
    "occasion_first": "B",         # C8  at work / interviews / events: no style waiver for loungewear or logos
    # loungewear: one fact, one penalty
    "lounge_ladder": "B",          # C9  O4 by signs of intent: -1.2 / -0.6 / -0.3 / hero 0; joggers join; gym shorts max -0.6
    "ath_o1_as2": "B",             # C10 athletic bottoms count as dressiness 2 in O1 at everyday/class
    "ath_f4_half": "B",            # C11 pooling on sweats/joggers -0.4 for everyone
    # fit / proportion
    "slides_drag": "B",            # C12 loose jeans/cargos with a floor-length hem over slides: F4 -0.4
    "p3_cropped": "B",             # C13 P3 skipped when the top ends at the belt or is cropped
    "layer_any_category": "B",     # C14 an open overshirt/flannel/camp shirt/fleece over another top is a layer
    "distressed_narrow": "B",      # C15 distressed-by-design excuses only wear, never stains or wrinkles
    "worn_shoes_boot_only": "B",   # C16 worn shoes at half price only for work boots (no style halves care)
    # occasion
    "o1_ramp": "B",                # C17 R2: "too casual" ramps in (gap 0.25 -> 0.75 per level) instead of a cliff
    "s2_ramp": "B",                # C18 R9: S2 ramps between a 2- and 3-level gap
    # dressiness
    "work_boot_25": "B",           # C19 work boot 2.5
    "black_jeans_25": "B",         # C20 undistressed black jeans 2.5 (never charcoal)
    "jersey_2": "B",               # C21 jersey 2 (worn like a tee)
    "new_values": "N",             # C22 new garment values (trail_shoe, vest, ...) scored as their look-alikes
    # color
    "muted_half": "B",             # C23 any non-neutral color read as muted counts half an accent (accent count, focal points)
    # credits
    "one_credit": "B",             # C24 R4: each credit from a different garment (best assignment)
    "k2_no_shoes": "B",            # C25 K2 needs a top, layer or bottom at dressiness 3+
    "k3_medium_scale": "B",        # C26 R5: a pattern counts as interest only at medium/large scale
    "k3_strict": "B",              # C27 no K3 when a color mistake fired or focal points exceed his base boldness
    "k1_tier": "B",                # C28 technical layers (shell, rain, puffer, fleece, vest) earn K1 at 0.5
    "care_no_credit": "B",         # C29 a stained or worn garment earns no credit
    "k4_street_shoe": "B",         # C30 chunky/basketball sneakers under loose jeans/cargos earn K4
    # guardrails
    "loose_pool_half": "B",        # C33 pooled relaxed/wide jeans or cargos -0.4 for everyone (no style waiver)
    "garment_cap": "B",            # C31 R1: fit + proportion from one garment cost at most 1.0
    "floor5": "B",                 # C32 R3: 5.0 floor at everyday/class/home/gym with no care or strain fault
    # rejected or deferred (off in V4; switch kept so the effect can be measured)
    "no_partial_scale": "X",       # R6 (rejected: "what isn't in the photo never costs points")
    "street_pool_waiver": "X",     # streetwear's interim "pooling is free" waiver (rejected: a style excusing a fit fault)
    "s3_slides": "X",              # ST's slides -0.3 (rejected; slides_drag covers the fit fact)
    "prep_c3_half": "X",           # prep bright-clash halving (rejected)
    "wide_trousers_shared": "G",   # shared wide-trouser P1 waiver (deferred to the gold set)
    "one_focal_per_garment": "X",  # one garment = one focal point (rejected)
    "c6_competing": "X",           # streetwear competing statements -0.3 (rejected)
    "matched_set": "X",            # matched sweatsuit as a dressed upper (rejected)
    "nine_needs_interest": "G",    # 9+ only with a point of interest (taste call, off)
    "vs_tech_no_k1": "X",          # no K1 from a technical layer over 0-sign loungewear (rejected)
    "clean_palette_k3": "G",       # minimal clean-palette K3 (deferred to the gold set; not implemented)
}
V31 = {k: False for k in SWITCHES}
V4 = {k: (t in ("B", "N")) for k, t in SWITCHES.items()}
BEFORE_BETA = {k: (t == "B") for k, t in SWITCHES.items()}   # PROTO: code-only subset


def parse_styles(s: str) -> dict:
    out = {}
    for part in s.split(","):
        if ":" in part:
            k, v = part.split(":"); out[k.strip()] = float(v)
    return out


def round_half(x):
    return math.floor(x * 2 + 0.5) / 2


def nearest(x):
    return math.floor(x + 0.5)   # fixes Python's banker's rounding (round(0.5) == 0)


def clamp01(x):
    return max(0.0, min(1.0, x))


def blended_band(styles: dict):
    known = {s: w for s, w in (styles or {}).items() if s in STYLE_BANDS and w > 0}
    if not known:
        (vlo, vhi), (l0, l1) = DEFAULT_BAND
        return (vlo, vhi), (LEG_ORDER.index(l0), LEG_ORDER.index(l1))
    tot = sum(known.values())
    vlo = sum(STYLE_BANDS[s][0][0] * w for s, w in known.items()) / tot
    vhi = sum(STYLE_BANDS[s][0][1] * w for s, w in known.items()) / tot
    llo = sum(LEG_ORDER.index(STYLE_BANDS[s][1][0]) * w for s, w in known.items()) / tot
    lhi = sum(LEG_ORDER.index(STYLE_BANDS[s][1][1]) * w for s, w in known.items()) / tot
    return (vlo, vhi), (llo, lhi)


def band_of(style):
    (a, b), (l0, l1) = V4_BANDS[style]
    return (a, b), (LEG_ORDER.index(l0), LEG_ORDER.index(l1))


def is_bright(g):
    c = g.get("color_family")
    if c in ALWAYS_BRIGHT:
        return g.get("saturation") != "muted"
    if c in HUE_DEPENDS:
        return g.get("saturation") == "bright"
    return False


def half_accent(g, F):
    """Counts as half an accent (v3.1: burgundy/sage only; v4 C23: any non-neutral read as muted)."""
    c = g.get("color_family")
    if c in MUTED:
        return True
    return bool(F["muted_half"] and c not in NEUTRALS and c != "multicolor" and g.get("saturation") == "muted"
                and not is_bright(g))


def v4_schema(ext):
    return ext.get("schema") == "v4"   # PROTO: phase-2 marker (readings that carry the new fields)


def denim_wear(g, phase2):
    """none / faded / ripped / not_visible (phase 2), else derived from the old yes/no flag (phase 1)."""
    if phase2 and "denim_wear" in g:
        return g["denim_wear"]
    return "distressed" if g.get("distressed_by_design") else "none"


def is_denim(g):
    return g.get("subcategory") in ("jeans", "denim_jacket", "denim_shirt") or str(g.get("color_family", "")).startswith("denim")


def by_design(g, phase2):
    """True when wear is intended (fades, rips). Phase 2: denim uses denim_wear; other pieces keep the old flag."""
    if phase2 and is_denim(g) and "denim_wear" in g:
        return g["denim_wear"] in ("faded", "ripped")
    return bool(g.get("distressed_by_design"))


def formality(g, F=None, phase2=False):
    F = F or V31
    sub = g.get("subcategory")
    f = FORMALITY.get(sub, 2)
    if F["new_values"] and sub in NEW_FORMALITY:
        f = NEW_FORMALITY[sub]
    if F["jersey_2"] and sub == "jersey":
        f = 2
    if F["work_boot_25"] and sub == "work_boot":
        f = 2.5
    if sub == "jeans":
        dark = g.get("color_family") == "denim_dark" or (F["black_jeans_25"] and g.get("color_family") == "black")
        if phase2 and "denim_wear" in g:
            spoiled = g["denim_wear"] == "ripped"          # faded dark/black jeans still count as dark (C20 + new field)
        else:
            spoiled = bool(g.get("distressed_by_design"))
        if dark and not spoiled:
            f = 2.5
    return f


BASELINE = 7.0          # clean basics with no mistakes (spec: "clean basics about 7")
LOUNGE_BOTTOMS = {"athletic_shorts", "sweatpants"}
V4_LOUNGE = {"athletic_shorts", "sweatpants", "joggers", "track_pants"}
LOUNGE_OK = {"gym", "home"}
KNIT_TOPS = {"sweater", "cardigan", "quarter_zip"}
TECH_LAYERS = {"shell_jacket", "rain_jacket", "puffer", "fleece", "vest"}
LAYER_SHIRTS = {"overshirt", "flannel_shirt", "camp_collar_shirt", "denim_shirt", "fleece"}
# credit name: (points, parts of the photo it needs)
CREDITS = {
    "K1_layered": (0.75, ()),               # jacket / overshirt / blazer, or a knit
    "K2_elevated_piece": (0.5, ()),         # something past tee-and-jeans (dressiness 3+)
    "K3_point_of_interest": (0.5, ()),      # one standout color or pattern (not a graphic print), within his boldness
    "K4_shoes_complement": (0.5, ("shoes",)),   # considered shoes matching the outfit's dressiness
}
# Tried and dropped (Oct 6): a +0.5 "finishing touch" credit for a belt or watch. The model
# sees a watch in some runs and not others, which made scores flip (m03). Belts stay advice-only.
CREDIT_MAX = sum(v[0] for v in CREDITS.values())   # 2.25 -> best possible about 9.5; 10 stays rare
MULT = {"fit": 0.8, "color": 0.6, "proportion": 0.6, "occasion": 1.2}   # what the score moves per internal unit

# =====================================================================================================
# STYLE DETECTION (v4): one shared framework, computed in code from garment fields (no AI style label)
# =====================================================================================================
SLOT = {"top": "upper", "outerwear": "upper", "bottom": "bottom", "footwear": "shoes"}
LOOSE = ("relaxed", "wide")
CLEAN_HEMS = ("no_break", "slight_break", "cropped", "cuffed", "stacked")
ATHLETIC_BOTTOMS = {"sweatpants", "joggers", "athletic_shorts", "track_pants"}
TAILORED_ANY = {"blazer", "sport_coat", "suit_jacket", "unstructured_blazer", "suit_trousers", "trousers", "dress_shirt"}
DRESS_SHOES = {"dress_shoe", "derby", "loafer"}
COLLARED = {"polo", "knit_polo", "oxford_shirt", "rugby_shirt", "dress_shirt"}
DARK_TECH = {"black", "charcoal", "grey", "navy", "olive"}

# --- streetwear (absorbs skater, Y2K, grunge, techwear)
ST_TOP_A = {"hoodie", "sweatshirt", "graphic_tee"}
ST_OUT_A = {"bomber", "puffer"}
ST_OUT_H = {"denim_jacket", "leather_jacket", "shell_jacket", "rain_jacket", "fleece", "vest"}
ST_SHOE_A = {"chunky_sneaker", "basketball_sneaker"}
ST_SHOE_H = {"canvas_sneaker", "retro_runner", "work_boot", "low_profile_sneaker", "performance_runner", "trail_shoe"}
ST_STREET_SHOES = ST_SHOE_A | {"canvas_sneaker", "retro_runner", "low_profile_sneaker", "work_boot"}
ST_VETO = {"blazer", "sport_coat", "suit_jacket", "unstructured_blazer", "suit_trousers", "trousers", "dress_shirt", "overcoat"}
PREP_TOPS = {"polo", "knit_polo", "oxford_shirt", "cardigan", "rugby_shirt"}
STACK_HOLDERS = ST_SHOE_A | ST_SHOE_H | {"white_leather_sneaker", "chelsea_boot", "suede_chukka", "loafer", "derby", "dress_shoe"}
# --- workwear (absorbs Americana, amekaji, light western)
EARTH_OUTER = {"brown", "tan_camel", "khaki_beige", "olive", "off_white_cream", "navy", "denim_light", "denim_mid", "denim_dark"}
WW_VETO = {"sweatpants", "joggers", "athletic_shorts", "track_pants", "jersey", "tank_top", "suit_jacket", "suit_trousers",
           "dress_shoe", "slides_sandals", "track_jacket"}
WW_NEG = {"graphic_tee", "chunky_sneaker", "basketball_sneaker", "performance_runner", "puffer", "shell_jacket",
          "rain_jacket", "fleece", "vest", "blazer", "sport_coat", "trail_shoe"}
# --- vintage sport (absorbs blokecore/terrace, sporty rugby, retro tracksuits, athleisure)
RETRO_SHOES = {"low_profile_sneaker", "retro_runner"}
VS_BOTTOM_H = {"jeans", "cargos", "chinos", "shorts", "trousers", "drawstring_trousers", "sweatpants", "joggers"}
# --- outdoor (absorbs gorpcore, the outdoor end of techwear)
OUT_A = {"shell_jacket", "rain_jacket", "fleece", "vest", "trail_shoe"}
OUT_H = {"cargos", "technical_pants"}
OUT_VETO = {"blazer", "sport_coat", "suit_jacket", "unstructured_blazer", "dress_shirt", "trousers", "suit_trousers",
            "dress_shoe", "derby", "loafer", "sweatpants", "athletic_shorts", "jersey", "track_jacket", "track_pants"}
# --- minimal (absorbs Scandinavian, Korean minimal, city boy, modern uniform)
NEUT_MIN = {"white", "off_white_cream", "light_grey", "grey", "charcoal", "black", "navy", "khaki_beige", "tan_camel",
            "brown", "olive", "light_blue", "denim_dark", "burgundy", "sage"}
MIN_HOME_UP = {"sweater", "cardigan", "knit_polo", "oxford_shirt", "overshirt", "overcoat", "unstructured_blazer", "leather_jacket"}
MIN_HOME_BOTTOM = {"trousers", "drawstring_trousers", "chinos"}
MIN_HOME_SHOES = {"white_leather_sneaker", "low_profile_sneaker", "loafer", "chelsea_boot", "derby"}
MIN_AGAINST_SHOES = {"chunky_sneaker", "basketball_sneaker", "performance_runner", "slides_sandals", "trail_shoe"}
PRESSED = {"trousers", "chinos", "drawstring_trousers", "suit_trousers"}
# --- classic prep (Preppy + Old money)
PREP_ANCHOR_UP = {"oxford_shirt", "polo", "knit_polo", "cardigan", "blazer", "sport_coat", "unstructured_blazer"}
PREP_HOME_UP = {"sweater", "quarter_zip", "overcoat", "field_jacket", "vest"}
PREP_HOME_BOTTOM = {"chinos", "trousers", "shorts"}
PREP_HOME_SHOES = {"loafer", "suede_chukka", "white_leather_sneaker", "derby"}
PREP_VETO = {"sweatpants", "joggers", "athletic_shorts", "track_pants", "cargos", "chunky_sneaker", "basketball_sneaker",
             "performance_runner", "slides_sandals", "work_boot", "trail_shoe"}
# --- smart casual (the general lens; loses every tie)
SC_ANCHOR_UP = {"quarter_zip", "knit_polo", "polo", "oxford_shirt", "cardigan", "unstructured_blazer", "sport_coat", "blazer", "overshirt"}
SC_HOME_UP = {"sweater", "dress_shirt", "camp_collar_shirt", "chore_coat", "field_jacket", "overcoat", "leather_jacket", "vest", "denim_shirt"}
SC_ANCHOR_SHOES = {"loafer", "derby", "chelsea_boot", "suede_chukka", "white_leather_sneaker"}
SC_VETO = {"hoodie", "sweatshirt", "graphic_tee", "jersey", "rugby_shirt", "flannel_shirt", "fleece", "puffer", "shell_jacket",
           "rain_jacket", "sweatpants", "joggers", "athletic_shorts", "cargos", "slides_sandals", "track_jacket", "track_pants",
           "technical_pants", "trail_shoe"}

STYLE_ORDER = ["vintage_sport", "outdoor", "workwear", "streetwear", "classic_prep", "minimalist", "smart_casual"]
STYLE_NAMES = {"vintage_sport": "vintage sport", "outdoor": "outdoor", "workwear": "workwear", "streetwear": "streetwear",
               "classic_prep": "classic prep", "minimalist": "minimal", "smart_casual": "smart casual"}


class Ctx:
    def __init__(self, gs, phase2):
        self.gs = gs
        self.phase2 = phase2
        self.tops = [g for g in gs if g.get("category") == "top"]
        self.outer = [g for g in gs if g.get("category") == "outerwear"]
        self.bottom = next((g for g in gs if g.get("category") == "bottom"), None)
        self.shoes = next((g for g in gs if g.get("category") == "footwear"), None)
        self.main = [g for g in gs if g.get("category") in SLOT]
        self.subs = {g.get("subcategory") for g in self.main}
        self.bsub = self.bottom.get("subcategory") if self.bottom else None
        self.leg = self.bottom.get("leg_shape") if self.bottom else None
        self.shoe = self.shoes.get("subcategory") if self.shoes else None
        self.loose_street_bottom = self.bsub in ("jeans", "cargos", "work_pants") and self.leg in LOOSE
        nonshoe = [g for g in self.main if g.get("category") != "footwear"]
        self.techwear = (any(o.get("subcategory") in ("shell_jacket", "rain_jacket") for o in self.outer)
                         and self.bsub in ("cargos", "technical_pants")
                         and all(g.get("color_family") in DARK_TECH for g in nonshoe))
        self.visible_slots = {SLOT[g["category"]] for g in self.main}
        self.hero = self._heroes()

    def _heroes(self):
        out = []
        for g in self.main:
            s = g.get("subcategory")
            if s == "jersey" and g.get("category") == "top":
                out.append(g)
            elif s == "rugby_shirt" and (self.bsub in {"jeans", "cargos"} | ATHLETIC_BOTTOMS
                                         or (self.bsub is None and self.shoe in RETRO_SHOES)):
                out.append(g)   # ruling 26: the bottom decides (chinos/trousers/shorts -> classic prep)
            elif s in ("track_jacket", "track_pants"):
                out.append(g)
        return out


def _families(gs):
    return {FAMILY.get(g.get("color_family"), g.get("color_family")) for g in gs if g.get("color_family") and g.get("color_family") != "multicolor"}


# Each role function returns (positive, negative) for one garment: positive 2 = anchor, 1 = home piece; negative -1 per "against" signal.
def _role_street(g, c):
    s, cat, vol = g.get("subcategory"), g.get("category"), g.get("volume") or 3
    if cat == "top":
        if s in ST_TOP_A: return 2, 0
        if s in ("tee", "tank_top", "jersey", "flannel_shirt") and c.loose_street_bottom: return 1, 0   # incl. grunge flannel
        if s == "tee" and vol >= 4: return 1, 0
        if s == "fleece": return 1, 0
        return 0, 0
    if cat == "outerwear":
        if s in ST_OUT_A: return 2, 0
        if s in ("shell_jacket", "rain_jacket") and c.techwear: return 2, 0
        if s in ST_OUT_H: return 1, 0
        if vol >= 4 and s not in ("chore_coat", "field_jacket", "overshirt", "overcoat"): return 1, 0
        return 0, 0
    if cat == "bottom":
        if s in ("jeans", "cargos", "work_pants") and g.get("leg_shape") in LOOSE: return 2, 0
        if s == "cargos": return 1, 0
        if s == "shorts" and g.get("leg_shape") in LOOSE: return 1, 0
        if s in ATHLETIC_BOTTOMS and c.shoe in ST_STREET_SHOES: return 1, 0   # sweats count only with a street shoe
        if s == "chinos": return 0, -1
        return 0, 0
    if s in ST_SHOE_A: return 2, 0
    if s in ST_SHOE_H: return 1, 0
    return 0, 0


def _veto_street(c):
    if c.subs & ST_VETO: return "tailoring"
    if c.shoe in DRESS_SHOES: return "dress shoes"
    if c.leg == "skinny": return "skinny leg"
    if c.tops and c.tops[0].get("subcategory") in PREP_TOPS and not c.outer: return "prep top, no jacket"
    return None


def _gate_street(c, slots, total):
    volume = c.leg in LOOSE or c.techwear or any((g.get("volume") or 0) >= 4 for g in c.tops + c.outer)
    # streetwear's own threshold (its round-1 "2.0 points" in this scale): total 4, and the upper body must carry a street piece
    return volume and slots.get("upper", 0) > 0 and total >= 4


def _role_work(g, c):
    s, col = g.get("subcategory"), g.get("color_family")
    neg = (-1 if s in WW_NEG else 0) + (-1 if g.get("logo") == "large" else 0) + (-1 if (g.get("volume") or 3) >= 5 else 0)
    pos = 0
    if s in ("chore_coat", "work_boot", "work_pants"): pos = 2
    elif s in ("field_jacket", "denim_jacket") and col in EARTH_OUTER: pos = 2
    elif s == "flannel_shirt" and c.bsub in ("jeans", "cargos", "work_pants"): pos = 2
    elif s in ("field_jacket", "denim_jacket", "overshirt", "flannel_shirt", "suede_chukka", "cargos", "leather_jacket", "denim_shirt"): pos = 1
    elif s == "jeans" and g.get("leg_shape") != "skinny": pos = 1
    return pos, neg


def _veto_work(c):
    if c.subs & WW_VETO: return "sport/lounge/suit piece"
    if sum(1 for g in c.main if g.get("category") != "footwear" and is_bright(g)) >= 2: return "2 brights"
    return None


def _role_vintage(g, c):
    s, cat = g.get("subcategory"), g.get("category")
    if any(g is h for h in c.hero): return 2, 0
    if cat == "footwear":
        if s in RETRO_SHOES: return 1, 0
        if s in ST_SHOE_A or s == "slides_sandals": return 0, -1
        if s == "performance_runner" and c.bsub in ATHLETIC_BOTTOMS: return 0, -1   # training kit
        return 0, 0
    if cat == "bottom" and s in VS_BOTTOM_H and g.get("leg_shape") != "skinny": return 1, 0
    return 0, 0


def _veto_vintage(c):
    if c.bsub == "athletic_shorts" and any(t.get("subcategory") == "jersey" for t in c.tops): return "full kit"
    if c.tops and all(t.get("subcategory") == "tank_top" for t in c.tops) and not c.outer: return "tank top"
    return None


def _gate_vintage(c, slots, total):
    return bool(c.hero)


def _role_outdoor(g, c):
    s = g.get("subcategory")
    if s in OUT_A: return 2, 0
    if s in OUT_H: return 1, 0
    if s in ("work_boot", "chore_coat", "denim_jacket"): return 0, -1
    return 0, 0


def _veto_outdoor(c):
    return "tailored or sport piece" if c.subs & OUT_VETO else None


def _palette_min(c):
    main = c.main
    for g in main:
        col = g.get("color_family")
        if g.get("category") == "footwear" and col == "multicolor":
            continue                              # counted as "against" instead
        if col not in NEUT_MIN: return False
    if any(is_bright(g) for g in main): return False
    if sum(1 for g in main if g.get("color_family") not in NEUTRALS and g.get("color_family") != "multicolor") >= 2: return False
    return len(_families(main)) <= 3


def _role_min(g, c):
    s, cat = g.get("subcategory"), g.get("category")
    neg = 0
    if cat == "footwear":
        neg -= (1 if s in MIN_AGAINST_SHOES else 0) + (1 if g.get("color_family") == "multicolor" else 0)
        return (1 if s in MIN_HOME_SHOES else 0), neg
    neg -= (1 if g.get("logo") == "small" else 0) + (1 if g.get("pattern") == "other" else 0)
    if cat == "bottom":
        leg, hem = g.get("leg_shape"), g.get("hem")
        if leg in LOOSE and hem in CLEAN_HEMS: return 2, neg
        if leg == "straight" and s in PRESSED: return 2, neg
        return (1 if s in MIN_HOME_BOTTOM else 0), neg
    if (g.get("volume") or 3) >= 4 and g.get("length") in ("at_belt", "cropped"): return 2, neg   # boxy, cropped top
    return (1 if s in MIN_HOME_UP else 0), neg


def _veto_min(c):
    for g in c.main:
        if g.get("pattern") in ("graphic", "camo", "floral", "checks_plaid"): return "loud pattern"
        if g.get("logo") == "large": return "large logo"
        if g.get("color_family") in ("denim_mid", "denim_light"): return "mid/light-wash denim"
        if g.get("category") != "footwear" and not is_denim(g) and g.get("distressed_by_design"): return "distressed piece"
        if c.phase2 and is_denim(g) and g.get("denim_wear") == "ripped": return "ripped denim"
    if c.bsub in ATHLETIC_BOTTOMS: return "athletic bottom"
    if c.subs & {"suit_jacket", "blazer", "sport_coat"}: return "structured tailoring"
    if not _palette_min(c): return "palette"
    if c.tops and c.tops[0].get("subcategory") in COLLARED | {"quarter_zip"} and (c.tops[0].get("volume") or 3) < 4 \
            and c.leg in ("skinny", "slim", "straight"):
        return "collared top on a narrow leg (smart casual's)"
    return None


def _bonus_min(c):
    return (1, True) if len(_families(c.main)) <= 2 else (0, False)   # tonal: counts as its own "palette" slot


def _role_prep(g, c):
    s, cat = g.get("subcategory"), g.get("category")
    if cat in ("top", "outerwear"):
        if s in PREP_ANCHOR_UP: return 2, 0
        if s == "rugby_shirt" and not any(g is h for h in c.hero): return 2, 0
        if s in PREP_HOME_UP: return 1, 0
        return 0, 0
    if cat == "bottom": return (1 if s in PREP_HOME_BOTTOM else 0), 0
    return (1 if s in PREP_HOME_SHOES else 0), 0


def _veto_prep(c):
    if c.subs & PREP_VETO: return "sport/street piece"
    tailored = any(o.get("subcategory") in SEPARATE_JACKETS for o in c.outer)
    if not tailored and any(t.get("subcategory") in ("hoodie", "sweatshirt", "graphic_tee", "tank_top", "jersey", "fleece") for t in c.tops):
        return "casual top, no jacket"
    if any((t.get("volume") or 3) >= 4 for t in c.tops): return "boxy top"
    if c.bottom and ((c.bsub == "jeans" and c.leg in LOOSE) or by_design(c.bottom, c.phase2)): return "loose or distressed jeans"
    if c.hero and all(h.get("subcategory") == "rugby_shirt" for h in c.hero): return "rugby with jeans/athletic bottom (vintage sport's)"
    return None


def _role_sc(g, c):
    s, cat, col = g.get("subcategory"), g.get("category"), g.get("color_family")
    if cat in ("top", "outerwear"):
        return (2 if s in SC_ANCHOR_UP else 1 if s in SC_HOME_UP else 0), 0
    if cat == "bottom":
        if s in ("chinos", "trousers", "suit_trousers"): return 2, 0
        if s == "drawstring_trousers" or (s == "jeans" and col in ("denim_dark", "black", "charcoal")): return 1, 0
        return 0, 0
    return (2 if s in SC_ANCHOR_SHOES else 1 if s in ("low_profile_sneaker", "dress_shoe") else 0), 0


def _veto_sc(c):
    if c.subs & SC_VETO: return "casual/sport piece"
    if any(g.get("logo") == "large" or g.get("pattern") == "camo" or (g.get("volume") or 3) >= 5 for g in c.main): return "loud piece"
    if "tank_top" in c.subs and not c.outer: return "tank top"
    sj = [g for g in c.outer if g.get("subcategory") == "suit_jacket"]
    if sj and c.bottom and c.bsub in ("suit_trousers", "trousers") and c.bottom.get("color_family") == sj[0].get("color_family"):
        return "a suit (general lens)"
    return None


def _gate_sc(c, slots, total):
    return (slots.get("upper", 0) > 0 or slots.get("bottom", 0) == 2) and total >= (4 if c.shoes else 3)


STYLES = {
    "streetwear": (_role_street, _veto_street, _gate_street, None),
    "workwear": (_role_work, _veto_work, None, None),
    "vintage_sport": (_role_vintage, _veto_vintage, _gate_vintage, None),
    "outdoor": (_role_outdoor, _veto_outdoor, None, None),
    "minimalist": (_role_min, _veto_min, None, _bonus_min),
    "classic_prep": (_role_prep, _veto_prep, None, None),
    "smart_casual": (_role_sc, _veto_sc, _gate_sc, None),
}


def _evaluate(style, c):
    role, veto, gate, bonus = STYLES[style]
    v = veto(c)
    if v:
        return {"detected": False, "veto": v}
    slots, neg, anchors, ev = {}, 0, 0, []
    for g in c.main:
        p, n = role(g, c)
        sl = SLOT[g["category"]]
        if p > 0:
            slots[sl] = max(slots.get(sl, 0), p); anchors += p == 2; ev.append(("A:" if p == 2 else "H:") + g.get("subcategory", "?"))
        if n < 0:
            neg += n; ev.append(f"-{g.get('subcategory')}")
    b, b_slot = bonus(c) if bonus else (0, False)
    total = sum(slots.values()) + neg + b
    nslots = len(slots) + (1 if b_slot and b > 0 else 0)
    need = 3 if len(c.visible_slots) >= 3 else 2
    ok = anchors >= 1 and nslots >= 2 and total >= need and (gate(c, slots, total) if gate else True)
    return {"detected": bool(ok), "total": total, "slots": nslots, "anchors": anchors, "evidence": ev}


def _prep_marker(c):
    subs = c.subs
    if subs & {"rugby_shirt", "cardigan"}: return True
    collared = [g for g in c.tops + c.outer if g.get("subcategory") in COLLARED]
    if collared and c.bsub == "shorts": return True
    for g in collared + ([c.bottom] if c.bsub == "shorts" else []):
        if g.get("pattern") in ("stripes", "checks_plaid") and g.get("pattern_scale") in ("medium", "large"): return True
        if g.get("color_family") not in NEUTRALS and g.get("color_family") != "multicolor": return True
    if any(o.get("subcategory") in SEPARATE_JACKETS for o in c.outer) and c.bsub in ("chinos", "jeans"): return True
    return False


def _tie_break(cands, c, picks):
    """Card label: pairwise look-alike rules first (the more specific evidence wins), then his picks, then the fixed order."""
    cs = set(cands)
    def drop(loser, winner):
        if loser in cs and winner in cs: cs.discard(loser)
    technical_outer = any(o.get("subcategory") in TECH_LAYERS - {"puffer"} for o in c.outer)
    if "outdoor" in cs and "streetwear" in cs:          # ruling 27
        if c.shoe == "trail_shoe" or not (c.shoe in ST_SHOE_A): drop("streetwear", "outdoor")
        else: drop("outdoor", "streetwear")
    if "outdoor" in cs and "workwear" in cs:            # ruling 28
        if c.shoe == "trail_shoe" or technical_outer: drop("workwear", "outdoor")
        else: drop("outdoor", "workwear")
    if "workwear" in cs and "streetwear" in cs:         # chore coat over a hoodie: the shoe decides
        street_upper = any(t.get("subcategory") in ST_TOP_A for t in c.tops) or any(o.get("subcategory") in ST_OUT_A for o in c.outer)
        if street_upper and c.shoe in ST_SHOE_A | {"canvas_sneaker"}: drop("workwear", "streetwear")
        else: drop("streetwear", "workwear")
    if "classic_prep" in cs and "smart_casual" in cs:   # ruling 31
        if _prep_marker(c): drop("smart_casual", "classic_prep")
        else: drop("classic_prep", "smart_casual")
    if "minimalist" in cs and "classic_prep" in cs and len(_families(c.main)) <= 2 and c.leg in LOOSE:
        drop("classic_prep", "minimalist")
    ranked = [s for s in STYLE_ORDER if s in cs]
    if len(ranked) > 1 and picks:
        pw = {}
        for k, v in picks.items():
            k = PICK_ALIAS.get(k, k); pw[k] = pw.get(k, 0) + v
        picked = [s for s in ranked if pw.get(s, 0) > 0]
        if picked:
            return max(picked, key=lambda s: (pw[s], -STYLE_ORDER.index(s)))
    return ranked[0] if ranked else None


def detect_styles(gs, phase2=False, picks=None):
    """gs: visible garments (after the usual filters). Returns detected styles, the card label and per-style evidence."""
    c = Ctx(gs, phase2)
    res = {s: _evaluate(s, c) for s in STYLES}
    det = {s for s, r in res.items() if r["detected"]}
    return {"detected": det, "label": _tie_break(det, c, picks or {}), "detail": res}


# =====================================================================================================
# SCORE
# =====================================================================================================
def _prepare(ext, F):
    scene = ext.get("scene", {}) or {}
    garments = [g for g in ext.get("garments", []) if g.get("certainty") != "unsure" and g.get("category") != "accessory"]
    not_rated = []
    if not scene.get("shoes_visible", True):
        garments = [g for g in garments if g.get("category") != "footwear"]; not_rated.append("shoes")
    if scene.get("framing") == "upper_only":
        garments = [g for g in garments if g.get("category") not in ("bottom", "footwear")]; not_rated.append("bottom half")
    if any(g.get("category") == "traditional" for g in garments):
        not_rated.append("traditional garment (not rated)")
    garments = [g for g in garments if g.get("category") != "traditional"]
    return scene, garments, not_rated


def score(ext: dict, occasion: str = "everyday", styles: dict = None, boldness: str = "a_little", F: dict = None) -> dict:
    F = {**V31, **(V4 if F is None else F)}
    styles = styles or {}
    phase2 = v4_schema(ext)
    scene, garments, not_rated = _prepare(ext, F)
    if scene.get("clothed") != "fully":
        return {"overall": None, "reason": "not_fully_clothed", "partial": False, "rules_fired": []}
    if not garments:
        return {"overall": None, "reason": "nothing_readable", "partial": True, "rules_fired": []}
    if F["detect"] or F["layer_any_category"]:
        garments = [copy.copy(g) for g in garments]   # PROTO: never mutate the caller's reading in v4 mode
    for g in garments:  # normalize leg aliases
        if g.get("leg_shape") in LEG_ALIAS:
            g = g; g["leg_shape_raw"] = g["leg_shape"]; g["leg_shape"] = LEG_ALIAS[g["leg_shape"]]
    if F["layer_any_category"]:
        # C14: an open overshirt / flannel / camp shirt / fleece worn over another top is a layer, whatever box the model ticked
        tops_ = [g for g in garments if g.get("category") == "top"]
        if len(tops_) >= 2:
            inner = next((g for g in tops_ if g.get("subcategory") not in LAYER_SHIRTS), tops_[-1])
            for g in tops_:
                if g is not inner and g.get("subcategory") in LAYER_SHIRTS:
                    g["category"] = "outerwear"; g["recategorized"] = "top->outerwear"

    pen = {"fit": 0.0, "color": 0.0, "proportion": 0.0}
    occ_adj = 0.0
    fired, advice, amounts = [], [], []

    def fire(rule, sub, amount, garment=None):
        nonlocal occ_adj
        if amount <= 0:
            return
        if sub == "occasion":
            occ_adj += amount
        else:
            pen[sub] += amount
        fired.append(rule); amounts.append([rule, sub, amount, garment])

    tot_w = sum(styles.values()) or 1
    w = lambda s: styles.get(s, 0) / tot_w
    if F["picks_unlock_nothing"]:
        w = lambda s: 0.0          # C1: picks never unlock an allowance
    street, gorp, vintage, workwear = w("streetwear"), w("gorpcore"), w("vintage_sport"), w("workwear")
    tops = [g for g in garments if g.get("category") == "top"]
    top = tops[0] if tops else None
    bottom = next((g for g in garments if g.get("category") == "bottom"), None)
    shoes = next((g for g in garments if g.get("category") == "footwear"), None)
    outer = [g for g in garments if g.get("category") == "outerwear"]
    if F["picks_unlock_nothing"]:
        (vlo, vhi), (llo, lhi) = DEFAULT_BAND[0], (LEG_ORDER.index(DEFAULT_BAND[1][0]), LEG_ORDER.index(DEFAULT_BAND[1][1]))
    else:
        (vlo, vhi), (llo, lhi) = blended_band(styles)

    # ---- v4 detection (C2) ----
    det, label, det_detail = set(), None, {}
    if F["detect"]:
        d = detect_styles(garments, phase2, styles)
        det, label, det_detail = d["detected"], d["label"], d["detail"]
    occ_first = F["occasion_first"] and occasion in OCCASION_FIRST
    st_on = "streetwear" in det and F["street_allow"]
    vs_on = "vintage_sport" in det and F["vintage_allow"]
    min_on = "minimalist" in det and F["minimal_allow"]
    out_on = "outdoor" in det and F["outdoor_allow"]
    hero = Ctx(garments, phase2).hero if F["detect"] else []
    street_like = street >= 0.5 or st_on           # where v3.1 asked "street >= 0.5"
    athletic = bool(bottom and bottom.get("subcategory") in (V4_LOUNGE if F["lounge_ladder"] else LOUNGE_BOTTOMS))
    loose_denim = bool(bottom and bottom.get("subcategory") in ("jeans", "cargos", "work_pants") and bottom.get("leg_shape") in LOOSE)

    # ================= FIT =================
    if bottom:
        hem = bottom.get("hem")
        slides = bool(shoes and shoes.get("subcategory") == "slides_sandals")
        if F["slides_drag"] and loose_denim and slides and hem in ("pooling", "stacked", "full_break"):
            fire("F4_hem_drags_over_slides", "fit", 0.5, "bottom")           # C12: the hem has nothing to sit on
        elif hem == "stacked" and phase2:
            # phase 2 hem table: stacked loose jeans/cargos/sweats 0; stacked trousers/chinos -0.4
            if not (loose_denim or athletic):
                fire("F4_stacked_trousers", "fit", 0.5, "bottom")
        elif hem == "pooling":
            if F["detect"] or F["ath_f4_half"]:
                if F["ath_f4_half"] and athletic:
                    a = 0.5                                                  # C11: elastic sweats gather; -0.4 for all
                elif loose_denim and F["loose_pool_half"]:
                    a = 0.5          # C33: loose jeans/cargos piled at the ankle: -0.4 for everyone (a stack and a pool look alike)
                elif loose_denim and F["street_pool_waiver"] and st_on:
                    a = 0.0 if (not shoes or shoes.get("subcategory") in STACK_HOLDERS) else 0.5   # rejected interim waiver
                elif street >= 0.5:
                    a = 0.0 if bottom.get("leg_shape") in ("relaxed", "wide") else 0.5
                else:
                    a = 1.0
                fire("F4_pooling", "fit", a, "bottom")
            elif street >= 0.5:
                fire("F4_pooling", "fit", 0.0 if bottom.get("leg_shape") in ("relaxed", "wide") else 0.5, "bottom")
            else:
                fire("F4_pooling", "fit", 1.0, "bottom")
    if bottom and bottom.get("hem") == "full_break" and bottom.get("leg_shape") in ("skinny", "slim") and bottom.get("certainty") == "clear":
        fire("F4b_full_break_narrow_leg", "fit", 0.25, "bottom")
    care = 0.0
    care_ids = set()
    for g in garments:
        c = g.get("condition")
        if by_design(g, phase2):
            if not F["distressed_narrow"] or c == "pilled_or_worn":
                continue
        if c == "wrinkled":
            care += 0.5
        elif c == "stained" and g.get("certainty") == "clear":
            care += 1.5; care_ids.add(id(g))
        elif c == "pilled_or_worn":
            if F["worn_shoes_boot_only"]:
                half = g.get("category") == "footwear" and g.get("subcategory") == "work_boot"
            else:
                half = g.get("category") == "footwear" and (street + workwear + vintage) >= 0.5
            care += 0.25 if half else 0.5; care_ids.add(id(g))
    if care:
        fire("F7_care", "fit", min(care, 2.0))
    if F["detect"]:
        f6_skip = street >= 0.5                       # (always False under C1)
        f8_skip = street >= 0.5 or (st_on and top and top.get("subcategory") in ("hoodie", "tee", "graphic_tee", "sweatshirt")
                                    and bottom is not None and bottom.get("leg_shape") in LOOSE)
    else:
        f6_skip = f8_skip = street >= 0.5
    if top and top.get("tucked") in (None, "none", "na") and top.get("length") == "below_crotch" and (top.get("volume") or 3) < 4 and not f6_skip:
        fire("F6_top_too_long", "fit", 1.0, "top")
    if top and (top.get("volume") or 0) >= 4 and not f8_skip and (top.get("sleeve_end") == "covers_hand" or top.get("length") == "below_crotch"):
        fire("F8_too_big", "fit", 0.75, "top")
    for g in tops + outer:
        if g.get("sleeve_end") == "covers_hand":
            casual_knit = g.get("subcategory") in ("hoodie", "sweatshirt") and street_like
            fire("F9_sleeves_cover_hands", "fit", 0.25 if casual_knit else 0.5, "top")
            break
    if any(g.get("strain") == "clear" for g in garments):
        fire("F10_visible_strain", "fit", 0.75)

    # ================= TUCK =================
    if top and top.get("subcategory") == "dress_shirt" and top.get("tucked") in ("none", None) and (
            any(o.get("subcategory") in TAILORED_OUTER for o in outer)
            or (bottom and bottom.get("subcategory") in ("trousers", "suit_trousers")) or occasion in DRESSY_OCCASIONS):
        fire("T1_dress_shirt_untucked", "occasion", 0.5, "top")

    # ================= PROPORTION =================
    bands = [((vlo, vhi), (llo, lhi))]
    if F["band_union"]:
        bands += [band_of(s) for s in det]
    if top and top.get("volume"):
        steps = min(max(0, b[0] - top["volume"], top["volume"] - b[1]) for b, _ in bands)
        fire("P1_top_volume_vs_style", "proportion", 0.75 * steps, "top")   # v3: proportional (v2 rounded half steps up)
    if bottom and bottom.get("leg_shape") in LEG_ORDER:
        li = LEG_ORDER.index(bottom["leg_shape"])
        steps = min(max(0, l[0] - li, li - l[1]) for _, l in bands)
        if F["wide_trousers_shared"] and bottom.get("subcategory") in ("trousers", "drawstring_trousers", "suit_trousers") \
                and bottom["leg_shape"] == "wide" and not (top and top.get("subcategory") in ("hoodie", "sweatshirt", "graphic_tee")) \
                and (not shoes or shoes.get("subcategory") in SC_ANCHOR_SHOES | {"low_profile_sneaker", "dress_shoe"}):
            steps = 0
        fire("P1_leg_vs_style", "proportion", 0.75 * steps, "bottom")
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "skinny":
        fire("P2_big_top_skinny_leg", "proportion", 0.5, "top")
    p3_skip = (street + gorp) >= 0.5
    if F["detect"]:
        p3_skip = p3_skip or st_on or out_on or (vs_on and top is not None and any(top is h for h in hero))
        if min_on and ((top and top.get("length") in ("at_belt", "cropped")) or (bottom and bottom.get("subcategory") in PRESSED)):
            p3_skip = True
    if F["p3_cropped"] and top and top.get("length") in ("at_belt", "cropped"):
        p3_skip = True
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "wide" and not p3_skip:
        fire("P3_everything_oversized", "proportion", 0.5)
    if top and top.get("shows_below_outer") and any(o.get("subcategory") in TAILORED_OUTER for o in outer):
        fire("L1_shirt_hangs_below_blazer", "fit", 0.75, "top")
    bulky = ("chunky_sneaker", "performance_runner") + (("trail_shoe",) if F["new_values"] else ())
    if shoes and bottom and shoes.get("subcategory") in bulky and bottom.get("leg_shape") in ("skinny", "slim"):
        fire("S1_bulky_shoe_narrow_leg", "proportion", 0.75, "shoes")
    if top and not outer and top.get("tucked") in ("none", None) and top.get("length") in ("mid_fly",) and bottom:
        advice.append("tip: a front tuck or a cropped layer can lengthen your legs (rule of thirds)")

    # ================= COLOR =================
    colored = [g for g in garments if g.get("color_family") and g.get("color_family") != "multicolor"]
    accents = {}
    for g in colored:
        c = g["color_family"]
        if c in NEUTRALS:
            continue
        fam = FAMILY.get(c, c)
        accents[fam] = max(accents.get(fam, 0), 0.5 if half_accent(g, F) else 1.0)
    n_accents = sum(accents.values())
    families = {FAMILY.get(g["color_family"], g["color_family"]) for g in colored}
    if n_accents >= 3:
        fire("C1a_too_many_accent_colors", "color", 1.5)
    elif len(families) >= 5 and n_accents >= 2:
        fire("C1b_too_many_colors", "color", 0.5)
    main = [g for g in colored if g.get("category") in ("top", "bottom", "outerwear")]
    bright_fams = {FAMILY.get(g["color_family"], g["color_family"]) for g in main if is_bright(g)}
    shoe_bright = 0.5 if (shoes and is_bright(shoes) and FAMILY.get(shoes.get("color_family"), shoes.get("color_family")) not in bright_fams) else 0
    if len(bright_fams) + shoe_bright >= 2:
        fire("C3_bright_clash", "color", 0.5 if (boldness == "bold" or street_like) else 1.0)
    pats = [g for g in garments if g.get("pattern") not in (None, "solid")]
    non_graphic = [g for g in pats if g.get("pattern") != "graphic"]
    seen = {}
    for g in non_graphic:
        key = (g.get("pattern"), g.get("pattern_scale"))
        seen[key] = seen.get(key, 0) + 1
    if any(n >= 2 and k[1] not in (None, "na") for k, n in seen.items()):
        fire("C4a_same_pattern_same_scale", "color", 1.0)
    elif any(n >= 2 for k, n in seen.items()):
        fire("C4a_same_pattern_type", "color", 0.5)
    if len(pats) >= 3 and not street_like:
        fire("C4b_three_plus_patterns", "color", 1.0)
    focal = 0.0
    for g in main:
        if is_bright(g):
            focal += 1
        elif half_accent(g, F):
            focal += 0.5
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
    # v3: logos no longer count as focal points; the "large" reading flip-flops between runs
    base_allow = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5)
    allowance = base_allow + (1 if street_like else 0)
    if focal > allowance:
        fire("B1_too_many_focal_points", "color", min(1.0, 0.5 * math.ceil(focal - allowance)))
    if len(families) == 1:
        advice.append("tip: tonal outfit, vary texture or shade so it doesn't look flat")
    jacket = next((o for o in outer if o.get("subcategory") in SEPARATE_JACKETS), None)
    if (jacket and bottom and bottom.get("subcategory") in ("trousers", "chinos")
            and jacket.get("color_family") in DARK_SUITING and bottom.get("color_family") in DARK_SUITING
            and jacket.get("color_family") != bottom.get("color_family")):
        # v3.1 (R3): navy blazer + black trousers reads like a mismatched suit (about -0.5)
        fire("C5_near_match_jacket_trousers", "color", 0.85)
        advice.append("tip: pair a dark blazer with clearly different trousers (grey, tan, olive) or the matching suit trousers")
    color_fault = any(r.startswith(("C1", "C3", "C4", "B1", "C5")) for r in fired)

    # ================= OCCASION =================
    def fval(g):
        f = formality(g, F, phase2)
        if F["ath_o1_as2"] and g.get("category") == "bottom" and g.get("subcategory") in V4_LOUNGE and occasion in ("everyday", "class"):
            f = max(f, 2)     # C10: the loungewear rule is their penalty at everyday/class
        return f
    core = [fval(g) for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    if core:
        f = sum(core) / len(core)
        lo, hi = OCCASION_TARGET.get(occasion, (2, 3))
        if F["o1_ramp"]:
            gap = lo - f   # each level phases in between a gap of (level - 0.75) and (level - 0.25); max 2 levels
            fire("O1_too_casual", "occasion", 1.25 * clamp01((gap - 0.25) / 0.5) + 1.25 * clamp01((gap - 1.25) / 0.5))
        elif f < lo - 0.5:
            fire("O1_too_casual", "occasion", min(2.5, 1.25 * nearest(lo - f)))
        if f > hi + 1.5:
            fire("O1_too_formal", "occasion", 0.5)
    if bottom and occasion not in LOUNGE_OK:
        if F["lounge_ladder"] and athletic:
            # C9: one sign of intent each for a dressed upper half and a real shoe
            dressed = any(o.get("subcategory") in VS_STRUCTURED for o in outer) or any(t.get("subcategory") in VS_DRESSED_TOPS for t in tops)
            if F["matched_set"]:
                dressed = dressed or any(g.get("subcategory") in ("hoodie", "sweatshirt") and g.get("color_family") == bottom.get("color_family") for g in tops + outer)
            real_shoe = bool(shoes and shoes.get("subcategory") not in ("performance_runner", "slides_sandals"))
            kit = bottom.get("subcategory") == "athletic_shorts" and any(t.get("subcategory") == "jersey" for t in tops)
            signs = 0 if kit else int(dressed) + int(real_shoe)               # a full kit is not an outfit
            a = {0: 1.0, 1: 0.5, 2: 0.25}[signs]
            if signs == 2 and hero and not occ_first:
                a = 0.0                                                     # a sport hero piece makes it the look
            if bottom.get("subcategory") == "athletic_shorts" and not kit:
                a = min(a, 0.5)                                             # shorts/athletic-shorts flip guard
            fire("O4_loungewear_out", "occasion", a, "bottom")
        elif bottom.get("subcategory") in LOUNGE_BOTTOMS and (street + vintage) < 0.5:
            fire("O4_loungewear_out", "occasion", 0.5, "bottom")   # v3: gym shorts / sweats as a day outfit (about -0.6)
    if F["s3_slides"] and shoes and shoes.get("subcategory") == "slides_sandals" and bottom and bottom.get("subcategory") in ("jeans", "cargos", "sweatpants") \
            and occasion not in LOUNGE_OK:
        fire("S3_slides", "proportion", 0.5, "shoes")
    if shoes:
        others = [formality(g, F, phase2) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if others and shoes.get("subcategory") != "white_leather_sneaker":
            gap = max(others) - formality(shoes, F, phase2)
            if F["s2_ramp"]:
                fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5 * clamp01(gap - 2.0), "shoes")
            elif gap >= 3:
                fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5, "shoes")
    big_logo = [g for g in garments if g.get("logo") == "large"]
    logo_waived = (street + vintage) >= 0.3 if not F["detect"] else ((street + vintage) >= 0.3 and not occ_first)
    if big_logo and not logo_waived:
        # v3: only scored where it really matters, and only when the model is sure; otherwise a tip
        if occasion.startswith(("work", "interview")) and any(g.get("certainty") == "clear" for g in big_logo):
            fire("O3_large_logo", "occasion", 1.1)
        else:
            quiet = F["detect"] and (st_on or vs_on or (out_on and all(g.get("subcategory") in TECH_LAYERS | {"trail_shoe"} for g in big_logo)))
            if not quiet:
                advice.append("tip: big logos read casual; a plain or small-logo piece looks more put together")
    if occasion in DRESSY_OCCASIONS and shoes and shoes.get("subcategory") in ("loafer", "derby", "dress_shoe", "chelsea_boot"):
        advice.append("tip: match your belt to your shoes (same color family; black only with black)")

    # "Next level" idea only when the outfit is already clean (nothing to fix) and has no focal point
    if not fired and focal == 0 and boldness != "subtle":
        if min_on:
            advice.append("next level: vary texture or shade (a knit, suede, a heavier fabric)")   # C6: don't tell minimal to add color
        else:
            advice.append("next level: add one point of interest (a knit, a sneaker, a beanie)")

    # ================= CREDITS (v3) =================
    hidden = {"shoes"} if "shoes" in not_rated or "bottom half" in not_rated else set()
    cg = [g for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    mg = [g for g in cg if g.get("category") in ("top", "bottom", "outerwear")]
    allowance_k3 = allowance

    def no_credit(g):
        return F["care_no_credit"] and id(g) in care_ids

    def interest_of(g):
        # C23 stays on the penalty side only: two muted pieces are not "one standout color" (s23 would gain K3)
        col = 1 if is_bright(g) else 0.5 if g.get("color_family") in MUTED else 0
        pat_ok = g.get("pattern") not in (None, "solid", "graphic", "other")
        if F["k3_medium_scale"] and g.get("pattern_scale") == "small":
            pat_ok = False
        p = 1 if pat_ok else 0
        return max(col, p) if F["one_focal_per_garment"] else col + p

    if not (F["one_credit"] or F["k2_no_shoes"] or F["k3_medium_scale"] or F["k3_strict"] or F["k1_tier"]
            or F["care_no_credit"] or F["k4_street_shoe"] or F["layer_any_category"] or F["muted_half"] or F["work_boot_25"]
            or F["black_jeans_25"] or F["jersey_2"] or F["new_values"] or F["one_focal_per_garment"]):
        # ---- exact v3.1 credits ----
        earned = {}
        if outer or (top and top.get("subcategory") in KNIT_TOPS):
            earned["K1_layered"] = CREDITS["K1_layered"][0]
        if any(formality(g) >= 3 for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")):
            earned["K2_elevated_piece"] = CREDITS["K2_elevated_piece"][0]
        # graphic prints don't count: "graphic tee" vs "plain tee" flips between runs, and a print isn't a styling choice
        interest = sum(1 if is_bright(g) else 0.5 if g.get("color_family") in MUTED else 0 for g in main)
        interest += sum(1 for g in main if g.get("pattern") not in (None, "solid", "graphic", "other"))
        if 1 <= interest <= allowance:
            earned["K3_point_of_interest"] = CREDITS["K3_point_of_interest"][0]
        if shoes and bottom:
            others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
            if formality(shoes) >= 2.5 and others and abs(formality(shoes) - sum(others) / len(others)) <= 0.75:
                earned["K4_shoes_complement"] = CREDITS["K4_shoes_complement"][0]
        credit_from = {}
    else:
        # ---- v4 credits: candidates per credit, each named by its garment ----
        def k1_val(g):
            cat, s = g.get("category"), g.get("subcategory")
            base = cat == "outerwear" or (cat == "top" and s in KNIT_TOPS) or (F["layer_any_category"] and s in ("fleece", "vest"))
            if not F["layer_any_category"] and cat == "top" and g is not top:
                base = False     # v3.1 only looked at the first top
            if not base:
                return 0
            if F["new_values"] and s == "track_jacket" and bottom is not None and bottom.get("subcategory") == "track_pants" \
                    and FAMILY.get(bottom.get("color_family"), bottom.get("color_family")) == FAMILY.get(g.get("color_family"), g.get("color_family")):
                return 0         # a matched tracksuit is one garment in two halves, not a layer
            return 0.5 if (F["k1_tier"] and s in TECH_LAYERS) else 0.75
        cand = {"K1_layered": [(id(g), k1_val(g)) for g in cg if k1_val(g) > 0 and not no_credit(g)],
                "K2_elevated_piece": [(id(g), 0.5) for g in (mg if F["k2_no_shoes"] else cg)
                                      if formality(g, F, phase2) >= 3 and not no_credit(g)]}
        k3_pool = [g for g in main if not no_credit(g)] if F["care_no_credit"] else main
        interest = sum(interest_of(g) for g in k3_pool)
        k3_ok = 1 <= interest <= allowance_k3
        if F["k3_strict"] and (color_fault or focal > base_allow or interest > base_allow):
            k3_ok = False    # a style may tolerate loudness (no B1) but never turns it into a credit
        cand["K3_point_of_interest"] = [(id(g), 0.5) for g in k3_pool if interest_of(g) > 0] if k3_ok else []
        k4 = []
        if shoes and bottom and not no_credit(shoes):
            others = [formality(g, F, phase2) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
            fs = formality(shoes, F, phase2)
            if fs >= 2.5 and others and abs(fs - sum(others) / len(others)) <= 0.75:
                k4 = [(id(shoes), 0.5)]
            if F["k4_street_shoe"] and shoes.get("subcategory") in ST_SHOE_A and loose_denim and bottom.get("hem") != "pooling" \
                    and shoes.get("condition") == "clean":
                k4 = [(id(shoes), 0.5)]                                    # C30: shoe weight matches the leg
        cand["K4_shoes_complement"] = k4
        if F["one_credit"]:
            ks = [k for k in cand if cand[k]]
            best = (0, {}, {})
            for r in range(len(ks), 0, -1):
                for sub in itertools.combinations(ks, r):
                    for pick in itertools.product(*[cand[k] for k in sub]):
                        idx = [p[0] for p in pick]
                        if len(set(idx)) == len(idx):
                            v = sum(p[1] for p in pick)
                            if v > best[0] + 1e-9:
                                best = (v, {k: p[1] for k, p in zip(sub, pick)}, {k: p[0] for k, p in zip(sub, pick)})
            earned, credit_from = best[1], best[2]
        else:
            earned = {k: max(v for _, v in cand[k]) for k in cand if cand[k]}
            credit_from = {}
    # Score out of what's visible: credits that need hidden parts are scaled up, never simply lost.
    visible_max = sum(pts for pts, needs in CREDITS.values() if not hidden.intersection(needs))
    # v3.1 (R4): scale up only halfway; full scaling made partial checks wobble and over-score (m10)
    scale = 1.0 if F["no_partial_scale"] else (1 + CREDIT_MAX / visible_max) / 2
    credit = sum(earned.values()) * scale

    sub = {k: max(1.0, min(10.0, 10.0 - v)) for k, v in pen.items()}
    base = 0.40 * sub["fit"] + 0.30 * sub["color"] + 0.30 * sub["proportion"]
    mistakes = 2.0 * (10.0 - base) + 1.2 * occ_adj
    capped = 0.0
    if F["garment_cap"]:
        # C31 (R1): fit + proportion penalties traced to one garment cost at most 1.0 on the score
        per = {}
        for rule, bucket, amt, gk in amounts:
            if gk and bucket in ("fit", "proportion"):
                per[gk] = per.get(gk, 0.0) + MULT[bucket] * amt
        for gk, t in per.items():
            if t > 1.0:
                capped += t - 1.0
        mistakes -= capped
    raw = max(3.0, min(10.0, BASELINE + credit - mistakes))
    floored = False
    if F["floor5"] and occasion in FLOOR_OCCASIONS and "F7_care" not in fired and "F10_visible_strain" not in fired and raw < 5.0:
        raw = 5.0; floored = True
    display = round_half(raw)
    if F["nine_needs_interest"] and display >= 9.0 and "K3_point_of_interest" not in earned:
        display = 8.5
    out = {"overall": display, "raw_score": round(raw, 3), "subscores": {k: round_half(v) for k, v in sub.items()}, "occasion_adj": -occ_adj,
           "credits": list(earned), "credit_points": round(credit, 2), "mistake_points": round(mistakes, 2),
           "rules_fired": fired, "advice": advice, "partial": bool(not_rated), "not_rated": not_rated}
    if F["detect"] or any(F.values()):   # PROTO: explanation fields (not part of the v3.1 return value)
        out.update({"detected": sorted(det), "label": label, "cap_returned": round(capped, 2), "floored": floored,
                    "points": [(r, round(MULT[b] * a, 2)) for r, b, a, _ in amounts]})
    return out


# dressed-upper lists for the loungewear ladder (vintage sport's round-1 lists; technical layers excluded on purpose)
VS_STRUCTURED = {"denim_jacket", "bomber", "leather_jacket", "overcoat", "chore_coat", "field_jacket", "overshirt",
                 "blazer", "unstructured_blazer", "sport_coat", "track_jacket", "flannel_shirt", "camp_collar_shirt", "denim_shirt"}
VS_DRESSED_TOPS = {"polo", "knit_polo", "oxford_shirt", "quarter_zip", "sweater", "cardigan", "camp_collar_shirt",
                   "rugby_shirt", "jersey", "flannel_shirt", "overshirt", "dress_shirt", "denim_shirt"}


# =====================================================================================================
# THE ONE QUICK TAP (founder decision 2): computed in code, at most once per check, no extra AI call
# =====================================================================================================
TAP_PAIRS = {   # closed list, fixed at design time: (value a, value b, question)
    "bottom": [("jeans", "sweatpants", "Jeans or sweatpants?"), ("jeans", "joggers", "Jeans or joggers?"),
               ("jeans", "drawstring_trousers", "Jeans or pull-on trousers?"), ("chinos", "trousers", "Chinos or dress trousers?"),
               ("trousers", "suit_trousers", "Separate trousers or suit trousers?"), ("shorts", "athletic_shorts", "Regular shorts or gym shorts?"),
               ("jeans", "chinos", "Jeans or chinos?")],
    "top": [("sweater", "sweatshirt", "Knit sweater or sweatshirt?")],
    "footwear": [("chelsea_boot", "work_boot", "Chelsea boots or work boots?")],
}
HEM_PAIR = ("pooling", "stacked", "Stacked on purpose, or dragging on the floor?")   # phase 2 only
JEANS_FAMILY = {"jeans", "sweatpants", "joggers", "drawstring_trousers"}
DARK_NONDENIM = {"black", "charcoal", "navy"}   # grey left out: grey sweatpants are too common to ask about every time
LABEL = {"jeans": "Jeans", "sweatpants": "Sweatpants", "joggers": "Joggers", "drawstring_trousers": "Pull-on trousers",
         "chinos": "Chinos", "trousers": "Dress trousers", "suit_trousers": "Suit trousers", "shorts": "Regular shorts",
         "athletic_shorts": "Gym shorts", "sweater": "Knit sweater", "sweatshirt": "Sweatshirt", "chelsea_boot": "Chelsea boots",
         "work_boot": "Work boots", "pooling": "Dragging", "stacked": "Stacked on purpose"}


def _doubt(reading, g, a, b):
    scene = reading.get("scene", {}) or {}
    if g.get("certainty") != "clear":
        return "certainty " + str(g.get("certainty"))
    if scene.get("lighting") == "dim":
        return "dim light"
    if {a, b} <= JEANS_FAMILY and g.get("subcategory") in JEANS_FAMILY and g.get("color_family") in DARK_NONDENIM:
        return "dark non-denim color"
    if g.get("subcategory") in ("sweatpants", "joggers") and any(x.get("subcategory") == "belt" for x in reading.get("garments", [])):
        return "a belt is visible"                                       # sweatpants don't take belts
    if v4_schema(reading) and g.get("subcategory") in ("sweatpants", "joggers") and g.get("waistband") == "belt_or_loops":
        return "belt loops visible"
    return None


def ask_question(reading, occasion="everyday", styles=None, F=None):
    """None, or {pair, slot, garment_index, question, options:[{value,label,score}], default, swing, doubt}.
    Asks only on the closed list of look-alike pairs, when the other reading moves the displayed score by 1.0+
    and a doubt signal is present (upward), or by 1.0+ downward when the model wasn't sure. If he skips, the card
    scores the more generous reading (`default`)."""
    F = {**V31, **(V4 if F is None else F)}
    base = score(copy.deepcopy(reading), occasion, styles, F=F)["overall"]
    if base is None:
        return None
    scene = reading.get("scene", {}) or {}
    best = None
    for i, g in enumerate(reading.get("garments", [])):
        cat = g.get("category")
        if g.get("certainty") == "unsure" or cat not in TAP_PAIRS and cat != "bottom":
            continue
        if cat == "footwear" and not scene.get("shoes_visible", True):
            continue
        if cat in ("bottom", "footwear") and scene.get("framing") == "upper_only":
            continue
        options = []
        for a, b, q in TAP_PAIRS.get(cat, []):
            if g.get("subcategory") == "jeans" and "jeans" in (a, b) and str(g.get("color_family", "")).startswith("denim"):
                continue     # blue-wash jeans read reliably as jeans; never ask "jeans or ...?" about them
            if g.get("subcategory") in (a, b):
                other = b if g.get("subcategory") == a else a
                options.append(("subcategory", other, q, a, b))
        if cat == "bottom" and v4_schema(reading) and g.get("hem") in HEM_PAIR[:2]:
            other = HEM_PAIR[1] if g.get("hem") == HEM_PAIR[0] else HEM_PAIR[0]
            options.append(("hem", other, HEM_PAIR[2], HEM_PAIR[0], HEM_PAIR[1]))
        for field, other, q, a, b in options:
            alt = copy.deepcopy(reading); alt["garments"][i][field] = other
            s_alt = score(alt, occasion, styles, F=F)["overall"]
            if s_alt is None:
                continue
            swing = s_alt - base
            doubt = _doubt(reading, g, a, b)
            ok = (swing >= 1.0 and doubt) or (swing <= -1.0 and g.get("certainty") != "clear")
            if ok and (best is None or abs(swing) > abs(best["swing"])):
                cur = g.get(field)
                best = {"pair": f"{a}/{b}", "slot": cat, "field": field, "garment_index": i, "question": q,
                        "options": [{"value": cur, "label": LABEL.get(cur, cur), "score": base},
                                    {"value": other, "label": LABEL.get(other, other), "score": s_alt}],
                        "default": cur if base >= s_alt else other, "swing": swing, "doubt": doubt or "model not sure"}
    return best


if __name__ == "__main__":   # PROTO: quick parity check and the founder's photo
    import json, os, sys
    here = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, os.path.join(here, "..", "..", "..", "extraction-test"))
    import rubric as R31
    n = bad = 0
    for t in ("test3-stock-40-v3", "test4-mirror-12-v3"):
        for r in json.load(open(os.path.join(here, "..", "..", "..", "extraction-test", "results", t, "raw_results.json"))):
            for occ in ("everyday", "work", "date", "interview", "gym"):
                for st in ({}, {"streetwear": 0.5, "workwear": 0.5}, {"minimalist": .5, "smart_casual": .5}, {"vintage_sport": 1}):
                    a = R31.score(copy.deepcopy(r["extraction"]), occ, dict(st))
                    b = score(copy.deepcopy(r["extraction"]), occ, dict(st), F=V31)
                    n += 1; bad += a != b
    print(f"parity with rubric.py v3.1: {n - bad}/{n} identical")
    pc = json.load(open(os.path.join(here, "phone-checks-oct7.json")))
    e = pc[0]["reading"]
    print("founder as read:", score(copy.deepcopy(e))["overall"], ask_question(e))
    j = copy.deepcopy(e); j["garments"][1]["subcategory"] = "jeans"; j["garments"][1]["certainty"] = "clear"
    print("founder as jeans:", {k: v for k, v in score(j).items() if k in ("overall", "raw_score", "label", "points", "credits")})
