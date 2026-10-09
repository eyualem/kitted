"""Rubric v4.0 (Oct 8, 2026). The live rubric. Frozen older versions: rubrics/ (v3.1 = rubrics/rubric_v3_1.py).
v4.0 = the style council's rulebook, code-only rulings ("before beta", tag B in
../rubric/research/style-council/RULEBOOK.md Part 8). Plain-language version: ../rubric/v4.md.

"The AI sees, the code judges": this file only reads the AI's garment description
and turns it into scores. Never reads face, body shape, weight or skin tone.

What changed from v3.1, in short:
  - his style picks never change the score; the outfit's styles are DETECTED from the garments (detect_styles)
    and only ever widen what's allowed (the band is the default band plus every detected style's band)
  - one fact, one penalty: loungewear is one ladder charge sized by signs of intent; any one garment's
    fit + proportion penalties cost at most 1.0; a 5.0 floor at everyday/class/home/gym without care or strain faults
  - one garment, one credit (best assignment); "elevated piece" needs a top, layer or bottom; small patterns
    are not a point of interest; a stained or worn piece earns no credit
  - ramps instead of cliffs ("too casual", shoes too casual); work boots and undistressed black jeans 2.5, jerseys 2
  - ask_question(): the "one quick tap" for look-alike garments, computed in code, at most once per check
Only reads fields of the locked v3 reading format (schema.json). Readings with the planned new fields
(stacked hem, denim_wear, waistband, trail_shoe, vest) score as phase 1: those fields are ignored.
Reference prototype (every ruling behind a switch): ../rubric/research/style-council/rubric_v4_proto.py,
score(..., F=BEFORE_BETA). Port check: ../rubric/research/style-council/check_port.py (must be 100%).
Calibration is still provisional until we have human-labeled photos (the gold set).
"""
import itertools
import math

# ---------- Formality (1 athletic · 2 casual · 3 smart casual · 4 business casual · 5 formal) ----------
FORMALITY = {
    "tank_top": 1, "jersey": 2, "sweatpants": 1, "athletic_shorts": 1, "joggers": 1, "slides_sandals": 1,
    "graphic_tee": 2, "tee": 2, "hoodie": 2, "sweatshirt": 2, "cargos": 2, "shorts": 2, "jeans": 2, "canvas_sneaker": 2,
    "basketball_sneaker": 2, "chunky_sneaker": 2, "performance_runner": 2, "retro_runner": 2, "flannel_shirt": 2,
    "puffer": 2, "rain_jacket": 2, "shell_jacket": 2, "fleece": 2, "rugby_shirt": 2, "denim_jacket": 2, "bomber": 2,
    "work_boot": 2.5,                                            # v4: broken-in boots are a real shoe (was 2)
    "low_profile_sneaker": 2.5, "leather_jacket": 2.5, "camp_collar_shirt": 2.5,
    "polo": 3, "oxford_shirt": 3, "overshirt": 3, "sweater": 3, "cardigan": 3, "quarter_zip": 3, "chinos": 3,
    "chore_coat": 3, "field_jacket": 3, "white_leather_sneaker": 3, "suede_chukka": 3,
    "knit_polo": 3.5, "loafer": 3.5, "chelsea_boot": 3.5, "unstructured_blazer": 3.5,
    "drawstring_trousers": 2.5,
    "dress_shirt": 4, "trousers": 4, "blazer": 4, "sport_coat": 4, "overcoat": 4, "derby": 4,
    "suit_jacket": 5, "suit_trousers": 5, "dress_shoe": 5,
}
DARK_JEANS = {"denim_dark", "black"}                         # undistressed: 2.5 (v4: black too; never charcoal)
TAILORED_OUTER = {"blazer", "suit_jacket", "sport_coat", "unstructured_blazer"}
SEPARATE_JACKETS = {"blazer", "sport_coat", "unstructured_blazer"}
DARK_SUITING = {"charcoal", "navy", "black"}
OCCASION_TARGET = {
    "everyday": (2, 3), "class": (2, 3),
    "work_casual": (2.5, 3.5), "work": (3, 4),                     # work = business casual
    "date": (2.5, 3.5), "going_out": (2.5, 3.5),
    "interview": (3.5, 4.5), "interview_corporate": (4, 5), "interview_tech": (3, 4),
    "event": (3.5, 4.5), "wedding_formal": (4, 5), "wedding_casual": (3, 4),
    "gym": (1, 2), "home": (1, 2.5),                             # where loungewear is right
}
DRESSY_OCCASIONS = {"work", "interview", "interview_corporate", "interview_tech", "event", "wedding_formal", "wedding_casual"}
OCCASION_FIRST = DRESSY_OCCASIONS | {"work_casual"}          # occasion beats style: no style waiver here (ruling 20)
FLOOR_OCCASIONS = {"everyday", "class", "home", "gym"}       # the 5.0 floor (ruling 8)
ATHLETIC_AS_CASUAL = {"everyday", "class"}                   # athletic bottoms count as dressiness 2 in O1 (ruling 7)

# ---------- Style bands: (top volume min, max), (leg min, leg max) ----------
LEG_ORDER = ["skinny", "slim", "straight", "relaxed", "wide"]
LEG_ALIAS = {"flare_bootcut": "straight", "barrel": "wide"}
DEFAULT_BAND = ((2, 3.5), ("slim", "relaxed"))           # the general standard: centred on straight / relaxed-straight
STYLE_BANDS = {                                          # the bands of DETECTED styles; joined to DEFAULT_BAND (widen only)
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

BASELINE = 7.0          # clean basics with no mistakes (spec: "clean basics about 7")
LOUNGE_BOTTOMS = {"athletic_shorts", "sweatpants", "joggers", "track_pants"}   # v4: joggers (and later track pants) join
LOUNGE_OK = {"gym", "home"}
KNIT_TOPS = {"sweater", "cardigan", "quarter_zip"}
TECH_LAYERS = {"shell_jacket", "rain_jacket", "puffer", "fleece", "vest"}      # "Layered" at 0.5, not 0.75
LAYER_SHIRTS = {"overshirt", "flannel_shirt", "camp_collar_shirt", "denim_shirt", "fleece"}   # a layer when worn over a top
BULKY_SHOES = {"chunky_sneaker", "performance_runner"}
# loungewear ladder: one sign of intent each for a dressed upper half and a real shoe
DRESSED_OUTER = {"denim_jacket", "bomber", "leather_jacket", "overcoat", "chore_coat", "field_jacket", "overshirt",
                 "blazer", "unstructured_blazer", "sport_coat", "track_jacket", "flannel_shirt", "camp_collar_shirt", "denim_shirt"}
DRESSED_TOPS = {"polo", "knit_polo", "oxford_shirt", "quarter_zip", "sweater", "cardigan", "camp_collar_shirt",
                "rugby_shirt", "jersey", "flannel_shirt", "overshirt", "dress_shirt", "denim_shirt"}
NOT_REAL_SHOES = {"performance_runner", "slides_sandals"}
LOUNGE_LADDER = {0: 1.0, 1: 0.5, 2: 0.25}      # occasion units: -1.2 / -0.6 / -0.3 on the score
# credit name: (points, parts of the photo it needs)
CREDITS = {
    "K1_layered": (0.75, ()),               # jacket / overshirt / blazer, or a knit (technical layers 0.5)
    "K2_elevated_piece": (0.5, ()),         # a top, layer or bottom past tee-and-jeans (dressiness 3+); never shoes
    "K3_point_of_interest": (0.5, ()),      # one standout color or medium/large pattern, within his own boldness
    "K4_shoes_complement": (0.5, ("shoes",)),   # considered shoes matching the outfit's dressiness
}
# Tried and dropped (Oct 6): a +0.5 "finishing touch" credit for a belt or watch. The model
# sees a watch in some runs and not others, which made scores flip (m03). Belts stay advice-only.
CREDIT_MAX = sum(v[0] for v in CREDITS.values())   # 2.25 -> best possible about 9.5; 10 stays rare
K1_TECH_LAYER = 0.5     # "Layered" for a shell, rain jacket, puffer, fleece or vest (ruling 5)
MULT = {"fit": 0.8, "color": 0.6, "proportion": 0.6}   # score points per penalty unit (2.0 x the sub-score weight)
GARMENT_CAP = 1.0       # fit + proportion penalties traced to one garment cost at most this (ruling R1)
FLOOR = 5.0

ADVICE = {
    "thirds": "tip: a front tuck or a cropped layer can lengthen your legs (rule of thirds)",
    "tonal": "tip: tonal outfit, vary texture or shade so it doesn't look flat",
    "near_match": "tip: pair a dark blazer with clearly different trousers (grey, tan, olive) or the matching suit trousers",
    "big_logo": "tip: big logos read casual; a plain or small-logo piece looks more put together",
    "belt": "tip: match your belt to your shoes (same color family; black only with black)",
    "next_level": "next level: add one point of interest (a knit, a sneaker, a beanie)",
    "next_level_minimal": "next level: vary texture or shade (a knit, suede, a heavier fabric)",
}


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


def band_index(band):
    """((vlo, vhi), (leg lo, leg hi)) with the legs as LEG_ORDER indices."""
    (a, b), (l0, l1) = band
    return (a, b), (LEG_ORDER.index(l0), LEG_ORDER.index(l1))


def is_bright(g):
    c = g.get("color_family")
    if c in ALWAYS_BRIGHT:
        return g.get("saturation") != "muted"
    if c in HUE_DEPENDS:
        return g.get("saturation") == "bright"
    return False


def half_accent(g):
    """Counts as half an accent in the penalty counts: burgundy/sage, or any non-neutral read as muted."""
    c = g.get("color_family")
    if c in MUTED:
        return True
    return bool(c not in NEUTRALS and c != "multicolor" and g.get("saturation") == "muted" and not is_bright(g))


def is_denim(g):
    return g.get("subcategory") in ("jeans", "denim_jacket", "denim_shirt") or str(g.get("color_family", "")).startswith("denim")


def formality(g):
    f = FORMALITY.get(g.get("subcategory"), 2)
    if g.get("subcategory") == "jeans" and g.get("color_family") in DARK_JEANS and not g.get("distressed_by_design"):
        f = 2.5
    return f


# =====================================================================================================
# STYLE DETECTION: one shared framework, computed in code from garment fields (no AI style label)
# =====================================================================================================
SLOT = {"top": "upper", "outerwear": "upper", "bottom": "bottom", "footwear": "shoes"}
LOOSE = ("relaxed", "wide")
CLEAN_HEMS = ("no_break", "slight_break", "cropped", "cuffed", "stacked")
ATHLETIC_BOTTOMS = {"sweatpants", "joggers", "athletic_shorts", "track_pants"}
DRESS_SHOES = {"dress_shoe", "derby", "loafer"}
COLLARED = {"polo", "knit_polo", "oxford_shirt", "rugby_shirt", "dress_shirt"}
DARK_TECH = {"black", "charcoal", "grey", "navy", "olive"}
# Some names below (trail_shoe, vest, track_*, work_pants, technical_pants, denim_shirt) are values the v3 reading
# can't produce yet; they are kept so the planned schema batch only adds values, not rules.
# --- streetwear (absorbs skater, Y2K, grunge, techwear)
ST_TOP_A = {"hoodie", "sweatshirt", "graphic_tee"}
ST_OUT_A = {"bomber", "puffer"}
ST_OUT_H = {"denim_jacket", "leather_jacket", "shell_jacket", "rain_jacket", "fleece", "vest"}
ST_SHOE_A = {"chunky_sneaker", "basketball_sneaker"}
# white_leather_sneaker: a plain white sneaker (Club C, AF1 Low) is a streetwear staple; without it a boxy tee +
# wide jeans + white sneakers read as no style and lost ~1.0 for "too baggy" (DECISIONS-LOG #183).
ST_SHOE_H = {"canvas_sneaker", "retro_runner", "work_boot", "low_profile_sneaker", "performance_runner", "trail_shoe",
             "white_leather_sneaker"}
ST_STREET_SHOES = ST_SHOE_A | {"canvas_sneaker", "retro_runner", "low_profile_sneaker", "work_boot"}
ST_VETO = {"blazer", "sport_coat", "suit_jacket", "unstructured_blazer", "suit_trousers", "trousers", "dress_shirt", "overcoat"}
PREP_TOPS = {"polo", "knit_polo", "oxford_shirt", "cardigan", "rugby_shirt"}
STREET_F8_TOPS = ("hoodie", "tee", "graphic_tee", "sweatshirt")
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
PREP_CASUAL_TOPS = ("hoodie", "sweatshirt", "graphic_tee", "tank_top", "jersey", "fleece")
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


class Outfit:
    """The scored garments, split into slots, with the facts the style tables share."""

    def __init__(self, gs):
        self.gs = gs
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

    def is_hero(self, g):
        return any(g is h for h in self.hero)


def _families(gs):
    return {FAMILY.get(g.get("color_family"), g.get("color_family")) for g in gs
            if g.get("color_family") and g.get("color_family") != "multicolor"}


# Each role function returns (positive, negative) for one garment: positive 2 = anchor, 1 = home piece;
# negative -1 per "against" signal. A veto function returns a reason or None; a gate gets (outfit, slots, total).
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
    # streetwear's own (stricter) threshold: total 4, and the upper body must carry a street piece (ruling 51)
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
    if c.is_hero(g): return 2, 0
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
        if s == "rugby_shirt" and not c.is_hero(g): return 2, 0
        if s in PREP_HOME_UP: return 1, 0
        return 0, 0
    if cat == "bottom": return (1 if s in PREP_HOME_BOTTOM else 0), 0
    return (1 if s in PREP_HOME_SHOES else 0), 0


def _veto_prep(c):
    if c.subs & PREP_VETO: return "sport/street piece"
    tailored = any(o.get("subcategory") in SEPARATE_JACKETS for o in c.outer)
    if not tailored and any(t.get("subcategory") in PREP_CASUAL_TOPS for t in c.tops):
        return "casual top, no jacket"
    if any((t.get("volume") or 3) >= 4 for t in c.tops): return "boxy top"
    if c.bottom and ((c.bsub == "jeans" and c.leg in LOOSE) or c.bottom.get("distressed_by_design")): return "loose or distressed jeans"
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


STYLES = {   # role, veto, gate, bonus
    "streetwear": (_role_street, _veto_street, _gate_street, None),
    "workwear": (_role_work, _veto_work, None, None),
    "vintage_sport": (_role_vintage, _veto_vintage, _gate_vintage, None),
    "outdoor": (_role_outdoor, _veto_outdoor, None, None),
    "minimalist": (_role_min, _veto_min, None, _bonus_min),
    "classic_prep": (_role_prep, _veto_prep, None, None),
    "smart_casual": (_role_sc, _veto_sc, _gate_sc, None),
}


def _evaluate(style, c):
    """A style is detected when no veto fires, there's an anchor, points come from 2+ slots, the total reaches
    3 (2 when only 2 slots are visible), and its gate passes. A slot's points = its best positive piece."""
    role, veto, gate, bonus = STYLES[style]
    if veto(c):
        return False
    slots, neg, anchors = {}, 0, 0
    for g in c.main:
        p, n = role(g, c)
        sl = SLOT[g["category"]]
        if p > 0:
            slots[sl] = max(slots.get(sl, 0), p); anchors += p == 2
        if n < 0:
            neg += n
    b, b_slot = bonus(c) if bonus else (0, False)
    total = sum(slots.values()) + neg + b
    nslots = len(slots) + (1 if b_slot and b > 0 else 0)
    need = 3 if len(c.visible_slots) >= 3 else 2
    return anchors >= 1 and nslots >= 2 and total >= need and (gate(c, slots, total) if gate else True)


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


def _label(detected, c, picks):
    """Card label: pairwise look-alike rules first (the more specific evidence wins), then his picks, then the fixed order."""
    cs = set(detected)

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


def detect_styles(garments, picks=None):
    """garments: the scored garments (see scored_garments). Returns {"detected": [styles in STYLE_ORDER], "label": style or None}.
    His picks (a {style: weight} dict, old keys accepted) only break label ties; they never change what's detected."""
    c = Outfit(garments)
    det = [s for s in STYLE_ORDER if _evaluate(s, c)]
    return {"detected": det, "label": _label(det, c, picks or {})}


def _prepare(ext):
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


def _normalize(garments):
    """Copies (never mutates the reading): leg aliases, and an open overshirt/flannel/camp shirt/fleece worn over
    another top re-filed as a layer, whatever box the model ticked (ruling 43)."""
    garments = [dict(g) for g in garments]
    for g in garments:
        if g.get("leg_shape") in LEG_ALIAS:
            g["leg_shape_raw"] = g["leg_shape"]; g["leg_shape"] = LEG_ALIAS[g["leg_shape"]]
    tops = [g for g in garments if g.get("category") == "top"]
    if len(tops) >= 2:
        inner = next((g for g in tops if g.get("subcategory") not in LAYER_SHIRTS), tops[-1])
        for g in tops:
            if g is not inner and g.get("subcategory") in LAYER_SHIRTS:
                g["category"] = "outerwear"; g["recategorized"] = "top->outerwear"
    return garments


def scored_garments(ext):
    """The garments score() judges (filters, aliases, re-filed layers), or [] when nothing is scored."""
    scene, garments, _ = _prepare(ext)
    if scene.get("clothed") != "fully" or not garments:
        return []
    return _normalize(garments)


def bands_for(ext):
    """The bands score() accepts for this reading: DEFAULT_BAND first, then each detected style's band (indices)."""
    det = detect_styles(scored_garments(ext))["detected"]
    return [band_index(DEFAULT_BAND)] + [band_index(STYLE_BANDS[s]) for s in det]


def band_steps(value, bands, which):
    """Steps outside the nearest accepted band. which: 0 = top volume, 1 = leg index."""
    return min(max(0, b[which][0] - value, value - b[which][1]) for b in bands)


def score(ext: dict, occasion: str = "everyday", styles: dict = None, boldness: str = "a_little") -> dict:
    """styles: his picks ({style: weight}). They never change the score; they only pick the label when two
    detected styles both fit (old keys preppy / old_money / gorpcore are accepted)."""
    styles = styles or {}
    scene, garments, not_rated = _prepare(ext)
    if scene.get("clothed") != "fully":
        return {"overall": None, "reason": "not_fully_clothed", "partial": False, "rules_fired": []}
    if not garments:
        return {"overall": None, "reason": "nothing_readable", "partial": True, "rules_fired": []}
    garments = _normalize(garments)

    pen = {"fit": 0.0, "color": 0.0, "proportion": 0.0}
    occ_adj = 0.0
    fired, advice, traced = [], [], []

    def fire(rule, sub, amount, garment=None):
        """garment: the slot ("top", "bottom", "shoes") a fit/proportion penalty is traced to, for the per-garment cap."""
        nonlocal occ_adj
        if amount <= 0:
            return
        if sub == "occasion":
            occ_adj += amount
        else:
            pen[sub] += amount
        fired.append(rule); traced.append((sub, amount, garment))

    tops = [g for g in garments if g.get("category") == "top"]
    top = tops[0] if tops else None
    bottom = next((g for g in garments if g.get("category") == "bottom"), None)
    shoes = next((g for g in garments if g.get("category") == "footwear"), None)
    outer = [g for g in garments if g.get("category") == "outerwear"]

    # ---- what the outfit is going for (detected in code; widens what's allowed, never adds a penalty)
    d = detect_styles(garments, styles)
    det, label = d["detected"], d["label"]
    outfit = Outfit(garments)
    occ_first = occasion in OCCASION_FIRST
    street = "streetwear" in det
    vintage = "vintage_sport" in det
    minimal = "minimalist" in det
    outdoor = "outdoor" in det
    athletic = bool(bottom and bottom.get("subcategory") in LOUNGE_BOTTOMS)
    loose_denim = bool(bottom and bottom.get("subcategory") in ("jeans", "cargos", "work_pants") and bottom.get("leg_shape") in LOOSE)

    # ================= FIT =================
    if bottom:
        hem = bottom.get("hem")
        slides = bool(shoes and shoes.get("subcategory") == "slides_sandals")
        if loose_denim and slides and hem in ("pooling", "stacked", "full_break"):
            fire("F4_hem_drags_over_slides", "fit", 0.5, "bottom")    # the hem has nothing to sit on, so it drags
        elif hem == "pooling":
            # sweats/joggers gather; loose jeans/cargos piled at the ankle (a stack and a pool look alike): -0.4
            fire("F4_pooling", "fit", 0.5 if (athletic or loose_denim) else 1.0, "bottom")
    if bottom and bottom.get("hem") == "full_break" and bottom.get("leg_shape") in ("skinny", "slim") and bottom.get("certainty") == "clear":
        fire("F4b_full_break_narrow_leg", "fit", 0.25, "bottom")
    care = 0.0
    care_ids = set()
    for g in garments:
        c = g.get("condition")
        if g.get("distressed_by_design") and c == "pilled_or_worn":
            continue                                  # fades and rips by design excuse wear, never stains or wrinkles
        if c == "wrinkled":
            care += 0.5
        elif c == "stained" and g.get("certainty") == "clear":
            care += 1.5; care_ids.add(id(g))
        elif c == "pilled_or_worn":
            boot = g.get("category") == "footwear" and g.get("subcategory") == "work_boot"   # broken-in boots: half price
            care += 0.25 if boot else 0.5; care_ids.add(id(g))
    if care:
        fire("F7_care", "fit", min(care, 2.0))
    street_top_over_loose = bool(street and top and top.get("subcategory") in STREET_F8_TOPS and bottom is not None
                                 and bottom.get("leg_shape") in LOOSE)
    if top and top.get("tucked") in (None, "none", "na") and top.get("length") == "below_crotch" and (top.get("volume") or 3) < 4:
        fire("F6_top_too_long", "fit", 1.0, "top")
    if top and (top.get("volume") or 0) >= 4 and not street_top_over_loose and (top.get("sleeve_end") == "covers_hand" or top.get("length") == "below_crotch"):
        fire("F8_too_big", "fit", 0.75, "top")
    for g in tops + outer:
        if g.get("sleeve_end") == "covers_hand":
            casual_knit = g.get("subcategory") in ("hoodie", "sweatshirt") and street
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
    bands = [band_index(DEFAULT_BAND)] + [band_index(STYLE_BANDS[s]) for s in det]   # widen only
    if top and top.get("volume"):
        fire("P1_top_volume_vs_style", "proportion", 0.75 * band_steps(top["volume"], bands, 0), "top")
    if bottom and bottom.get("leg_shape") in LEG_ORDER:
        fire("P1_leg_vs_style", "proportion", 0.75 * band_steps(LEG_ORDER.index(bottom["leg_shape"]), bands, 1), "bottom")
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "skinny":
        fire("P2_big_top_skinny_leg", "proportion", 0.5, "top")
    p3_skip = (street or outdoor or (vintage and top is not None and outfit.is_hero(top))
               or (minimal and ((top and top.get("length") in ("at_belt", "cropped"))
                                or (bottom and bottom.get("subcategory") in PRESSED)))
               or bool(top and top.get("length") in ("at_belt", "cropped")))
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "wide" and not p3_skip:
        fire("P3_everything_oversized", "proportion", 0.5)
    if top and top.get("shows_below_outer") and any(o.get("subcategory") in TAILORED_OUTER for o in outer):
        fire("L1_shirt_hangs_below_blazer", "fit", 0.75, "top")
    if shoes and bottom and shoes.get("subcategory") in BULKY_SHOES and bottom.get("leg_shape") in ("skinny", "slim"):
        fire("S1_bulky_shoe_narrow_leg", "proportion", 0.75, "shoes")
    if top and not outer and top.get("tucked") in ("none", None) and top.get("length") in ("mid_fly",) and bottom:
        advice.append(ADVICE["thirds"])

    # ================= COLOR =================
    colored = [g for g in garments if g.get("color_family") and g.get("color_family") != "multicolor"]
    accents = {}
    for g in colored:
        c = g["color_family"]
        if c in NEUTRALS:
            continue
        fam = FAMILY.get(c, c)
        accents[fam] = max(accents.get(fam, 0), 0.5 if half_accent(g) else 1.0)
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
        fire("C3_bright_clash", "color", 0.5 if (boldness == "bold" or street) else 1.0)
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
    if len(pats) >= 3 and not street:
        fire("C4b_three_plus_patterns", "color", 1.0)
    focal = 0.0
    for g in main:
        if is_bright(g):
            focal += 1
        elif half_accent(g):
            focal += 0.5
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
    # logos don't count as focal points; the "large" reading flip-flops between runs
    base_allow = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5)
    allowance = base_allow + (1 if street else 0)
    if focal > allowance:
        fire("B1_too_many_focal_points", "color", min(1.0, 0.5 * math.ceil(focal - allowance)))
    if len(families) == 1:
        advice.append(ADVICE["tonal"])
    jacket = next((o for o in outer if o.get("subcategory") in SEPARATE_JACKETS), None)
    if (jacket and bottom and bottom.get("subcategory") in ("trousers", "chinos")
            and jacket.get("color_family") in DARK_SUITING and bottom.get("color_family") in DARK_SUITING
            and jacket.get("color_family") != bottom.get("color_family")):
        # navy blazer + black trousers reads like a mismatched suit (about -0.5)
        fire("C5_near_match_jacket_trousers", "color", 0.85)
        advice.append(ADVICE["near_match"])
    color_fault = any(r.startswith(("C1", "C3", "C4", "B1", "C5")) for r in fired)

    # ================= OCCASION =================
    def dressiness(g):
        f = formality(g)
        if g.get("category") == "bottom" and g.get("subcategory") in LOUNGE_BOTTOMS and occasion in ATHLETIC_AS_CASUAL:
            f = max(f, 2)     # the loungewear ladder is their one penalty at everyday/class
        return f
    core = [dressiness(g) for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    if core:
        f = sum(core) / len(core)
        lo, hi = OCCASION_TARGET.get(occasion, (2, 3))
        gap = lo - f   # each level phases in between a gap of (level - 0.75) and (level - 0.25); max 2 levels
        fire("O1_too_casual", "occasion", 1.25 * clamp01((gap - 0.25) / 0.5) + 1.25 * clamp01((gap - 1.25) / 0.5))
        if f > hi + 1.5:
            fire("O1_too_formal", "occasion", 0.5)
    if bottom and occasion not in LOUNGE_OK and athletic:
        dressed = any(o.get("subcategory") in DRESSED_OUTER for o in outer) or any(t.get("subcategory") in DRESSED_TOPS for t in tops)
        real_shoe = bool(shoes and shoes.get("subcategory") not in NOT_REAL_SHOES)
        kit = bottom.get("subcategory") == "athletic_shorts" and any(t.get("subcategory") == "jersey" for t in tops)
        signs = 0 if kit else int(dressed) + int(real_shoe)               # a full kit is not an outfit
        a = LOUNGE_LADDER[signs]
        if signs == 2 and outfit.hero and not occ_first:
            a = 0.0                                                     # a sport hero piece makes it the look
        if bottom.get("subcategory") == "athletic_shorts" and not kit:
            a = min(a, 0.5)                                             # shorts/athletic-shorts flip guard
        fire("O4_loungewear_out", "occasion", a, "bottom")
    if shoes:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if others and shoes.get("subcategory") != "white_leather_sneaker":
            gap = max(others) - formality(shoes)
            fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5 * clamp01(gap - 2.0), "shoes")   # ramps from 2 to 3 levels
    big_logo = [g for g in garments if g.get("logo") == "large"]
    if big_logo:
        # only scored where it really matters, and only when the model is sure; otherwise a tip
        if occasion.startswith(("work", "interview")) and any(g.get("certainty") == "clear" for g in big_logo):
            fire("O3_large_logo", "occasion", 1.1)
        else:
            quiet = street or vintage or (outdoor and all(g.get("subcategory") in TECH_LAYERS | {"trail_shoe"} for g in big_logo))
            if not quiet:
                advice.append(ADVICE["big_logo"])
    if occasion in DRESSY_OCCASIONS and shoes and shoes.get("subcategory") in ("loafer", "derby", "dress_shoe", "chelsea_boot"):
        advice.append(ADVICE["belt"])

    # "Next level" idea only when the outfit is already clean (nothing to fix) and has no focal point
    if not fired and focal == 0 and boldness != "subtle":
        advice.append(ADVICE["next_level_minimal"] if minimal else ADVICE["next_level"])   # don't tell minimal to add color

    # ================= CREDITS: one garment, one credit =================
    hidden = {"shoes"} if "shoes" in not_rated or "bottom half" in not_rated else set()
    cg = [g for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    mg = [g for g in cg if g.get("category") in ("top", "bottom", "outerwear")]

    def earns(g):
        return id(g) not in care_ids             # a stained or worn piece earns no credit

    def layer_points(g):
        cat, s = g.get("category"), g.get("subcategory")
        if not (cat == "outerwear" or (cat == "top" and s in KNIT_TOPS) or s in ("fleece", "vest")):
            return 0
        return K1_TECH_LAYER if s in TECH_LAYERS else CREDITS["K1_layered"][0]

    def interest_of(g):
        # muted counts half only for burgundy/sage here: two muted pieces are not "one standout color"
        col = 1 if is_bright(g) else 0.5 if g.get("color_family") in MUTED else 0
        pat = g.get("pattern") not in (None, "solid", "graphic", "other") and g.get("pattern_scale") != "small"
        return col + (1 if pat else 0)

    cand = {"K1_layered": [(id(g), layer_points(g)) for g in cg if layer_points(g) > 0 and earns(g)],
            "K2_elevated_piece": [(id(g), 0.5) for g in mg if formality(g) >= 3 and earns(g)]}
    k3_pool = [g for g in main if earns(g)]
    interest = sum(interest_of(g) for g in k3_pool)
    k3_ok = 1 <= interest <= allowance and not (color_fault or focal > base_allow or interest > base_allow)
    cand["K3_point_of_interest"] = [(id(g), 0.5) for g in k3_pool if interest_of(g) > 0] if k3_ok else []
    k4 = []
    if shoes and bottom and earns(shoes):
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        fs = formality(shoes)
        if fs >= 2.5 and others and abs(fs - sum(others) / len(others)) <= 0.75:
            k4 = [(id(shoes), 0.5)]
        if shoes.get("subcategory") in ST_SHOE_A and loose_denim and bottom.get("hem") != "pooling" and shoes.get("condition") == "clean":
            k4 = [(id(shoes), 0.5)]                                    # the shoe's weight matches the leg
    cand["K4_shoes_complement"] = k4
    # best assignment: each credit from a different garment, maximizing the total (first best found wins ties)
    ks = [k for k in cand if cand[k]]
    best_v, earned = 0, {}
    for r in range(len(ks), 0, -1):
        for sub in itertools.combinations(ks, r):
            for pick in itertools.product(*[cand[k] for k in sub]):
                ids = [p[0] for p in pick]
                if len(set(ids)) == len(ids):
                    v = sum(p[1] for p in pick)
                    if v > best_v + 1e-9:
                        best_v, earned = v, {k: p[1] for k, p in zip(sub, pick)}
    # Score out of what's visible: credits that need hidden parts are scaled up halfway, never simply lost
    visible_max = sum(pts for pts, needs in CREDITS.values() if not hidden.intersection(needs))
    scale = (1 + CREDIT_MAX / visible_max) / 2
    credit = sum(earned.values()) * scale

    sub = {k: max(1.0, min(10.0, 10.0 - v)) for k, v in pen.items()}
    base = 0.40 * sub["fit"] + 0.30 * sub["color"] + 0.30 * sub["proportion"]
    mistakes = 2.0 * (10.0 - base) + 1.2 * occ_adj
    # one garment's fit + proportion penalties cost at most GARMENT_CAP on the score
    per = {}
    for bucket, amt, gk in traced:
        if gk and bucket in ("fit", "proportion"):
            per[gk] = per.get(gk, 0.0) + MULT[bucket] * amt
    capped = 0.0
    for t in per.values():
        if t > GARMENT_CAP:
            capped += t - GARMENT_CAP
    mistakes -= capped
    raw = max(3.0, min(10.0, BASELINE + credit - mistakes))
    if occasion in FLOOR_OCCASIONS and "F7_care" not in fired and "F10_visible_strain" not in fired and raw < FLOOR:
        raw = FLOOR                               # a misread or a style choice never produces a 3 on an ordinary day
    display = round_half(raw)
    return {"overall": display, "raw_score": round(raw, 3), "subscores": {k: round_half(v) for k, v in sub.items()}, "occasion_adj": -occ_adj,
            "credits": list(earned), "credit_points": round(credit, 2), "mistake_points": round(mistakes, 2),
            "rules_fired": fired, "advice": advice, "partial": bool(not_rated), "not_rated": not_rated,
            "detected_styles": det, "style_label": label}


def style_label_text(style):
    """'Reads as streetwear' wording for the card (None = no label: the general standard applied)."""
    return STYLE_NAMES.get(style) if style else None


# =====================================================================================================
# THE ONE QUICK TAP: computed in code, at most once per check, no extra AI call
# =====================================================================================================
TAP_PAIRS = {   # closed list, fixed at design time: (value a, value b, question)
    "bottom": [("jeans", "sweatpants", "Jeans or sweatpants?"), ("jeans", "joggers", "Jeans or joggers?"),
               ("jeans", "drawstring_trousers", "Jeans or pull-on trousers?"), ("chinos", "trousers", "Chinos or dress trousers?"),
               ("trousers", "suit_trousers", "Separate trousers or suit trousers?"), ("shorts", "athletic_shorts", "Regular shorts or gym shorts?"),
               ("jeans", "chinos", "Jeans or chinos?")],
    "top": [("sweater", "sweatshirt", "Knit sweater or sweatshirt?")],
    "footwear": [("chelsea_boot", "work_boot", "Chelsea boots or work boots?")],
}
JEANS_FAMILY = {"jeans", "sweatpants", "joggers", "drawstring_trousers"}
DARK_NONDENIM = {"black", "charcoal", "navy"}   # grey left out: grey sweatpants are too common to ask about every time
TAP_LABEL = {"jeans": "Jeans", "sweatpants": "Sweatpants", "joggers": "Joggers", "drawstring_trousers": "Pull-on trousers",
             "chinos": "Chinos", "trousers": "Dress trousers", "suit_trousers": "Suit trousers", "shorts": "Regular shorts",
             "athletic_shorts": "Gym shorts", "sweater": "Knit sweater", "sweatshirt": "Sweatshirt", "chelsea_boot": "Chelsea boots",
             "work_boot": "Work boots"}


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
    return None


def _with(reading, i, field, value):
    """The reading with one garment's field set to his answer. An "unsure" garment becomes "likely" (never "clear"):
    he told us what it is, so it's scored, but rules that need a certain read still can't start firing. The pair
    questions never ask about unsure garments, so for them this is only the field change."""
    alt = dict(reading)
    alt["garments"] = [dict(g) for g in reading.get("garments", [])]
    alt["garments"][i][field] = value
    if alt["garments"][i].get("certainty") == "unsure":
        alt["garments"][i]["certainty"] = "likely"
    return alt


# The shoe question (DECISIONS-LOG #120, tap v2): when the model lost the shoe type (his boots under wide jeans read
# "other" / "slides"), ask what kind they are. He answers the kind; code picks the type inside it.
FOOT_KIND = {
    "boots": ("work_boot", "suede_chukka", "chelsea_boot"),
    "sneakers": ("low_profile_sneaker", "white_leather_sneaker", "canvas_sneaker", "retro_runner", "performance_runner",
                 "chunky_sneaker", "basketball_sneaker"),
    "slides": ("slides_sandals",),
}
KIND_ORDER = ("boots", "sneakers", "slides")
KIND_QUESTION = "Boots, sneakers or slides?"
KIND_LABEL = {"boots": "Boots", "sneakers": "Sneakers", "slides": "Slides"}
KIND_LOST_SWING = 0.5    # the type was lost ("other", unsure, or a slides read that isn't clear): ask at a half point
# Not asked: a "likely" sneaker or boot read. Tried at a 1.0 swing; it fired mostly at dressy occasions ("were your
# sneakers boots?" for +1), which invites gaming and caught none of his misreads (#120).
KIND_SKIP_OCCASIONS = ("gym", "home")   # slides are right there; never ask "boots?" at the gym


def _kind_of(sub):
    return next((k for k in KIND_ORDER if sub in FOOT_KIND[k]), None)


def _kind_pick(reading, i, kind):
    """The type a kind answer scores as. His read type when it's already that kind; sneakers → low-profile; boots →
    the boot that matches how dressed-up the rest is (work boots ≤ 2.75 average dressiness, suede chukkas ≤ 3.25,
    else Chelsea boots; nothing else worn → work boots)."""
    cur = reading["garments"][i].get("subcategory")
    if cur in FOOT_KIND[kind]:
        return cur
    if kind != "boots":
        return FOOT_KIND[kind][0]
    rest = [formality(g) for j, g in enumerate(reading.get("garments", []))
            if j != i and g.get("category") in ("top", "bottom", "outerwear")]
    avg = sum(rest) / len(rest) if rest else 2.5
    return "work_boot" if avg <= 2.75 else ("suede_chukka" if avg <= 3.25 else "chelsea_boot")


def _shoe_question(reading, i, g, base, occasion, styles, boldness):
    """The shoe question for footwear garment i, or None (upward only: it never asks to take points away)."""
    sub, cert = g.get("subcategory"), g.get("certainty")
    lost = sub == "other" or cert == "unsure" or (sub == "slides_sandals" and cert != "clear")
    if sub != "other" and _kind_of(sub) is None:
        return None              # loafers, derbies, dress shoes: not a boots/sneakers/slides question
    if not lost:
        return None
    kinds = KIND_ORDER
    options = []
    for k in kinds:
        v = _kind_pick(reading, i, k)
        s = score(_with(reading, i, "subcategory", v), occasion, styles, boldness)["overall"]
        if s is None:
            return None
        options.append({"value": v, "label": KIND_LABEL[k], "score": s, "group": k})
    top = max(o["score"] for o in options)
    swing = top - base
    if swing < KIND_LOST_SWING:
        return None
    # Skip keeps what the photo showed when the model named a kind (slides stay slides: a skip never buys points the
    # read didn't see); only a lost type ("other") gets the benefit of the doubt, the highest score (ties: question order).
    mine = _kind_of(sub)
    default = (next(o for o in options if o["group"] == mine) if mine in kinds
               else sorted(options, key=lambda o: (-o["score"], kinds.index(o["group"])))[0])
    return {"pair": "/".join(kinds), "slot": "footwear", "field": "subcategory", "garment_index": i,
            "question": KIND_QUESTION, "options": options, "default": default["value"], "swing": swing,
            "doubt": "shoe type lost", "kind": "shoes"}


def ask_question(reading, occasion="everyday", styles=None, boldness="a_little", shoes=True):
    """None, or {pair, slot, field, garment_index, question, options: [{value, label, score[, group]}], default, swing,
    doubt[, kind]}. The closed list of look-alike pairs asks when the other reading moves the displayed score by
    1.0+ and a doubt signal is present (upward), or by 1.0+ downward when the model wasn't sure. With `shoes` (tap v2,
    #120) the shoe question joins (upward only), and a question that could raise the score always beats one that
    could lower it, and a Skip (`default`) keeps what was read (the shoe question: the kind that was read; the most
    generous answer only when the type was lost); v4.0's pairs skipped to the more generous reading. Same reading, same question,
    same default. `shoes=False` is v4.0 exactly (the frozen prototype check, check_port.py)."""
    base = score(reading, occasion, styles, boldness)["overall"]
    if base is None:
        return None
    scene = reading.get("scene", {}) or {}
    best = None

    def better(q):                # v2: upward first, then the bigger swing; ties keep the earlier question
        if best is None:
            return True
        if shoes and (q["swing"] > 0) != (best["swing"] > 0):
            return q["swing"] > 0
        return abs(q["swing"]) > abs(best["swing"])

    def pairs(i, g):              # the closed list's questions for garment i, in table order
        cat = g.get("category")
        if g.get("certainty") == "unsure" or cat not in TAP_PAIRS:
            return
        if cat == "footwear" and not scene.get("shoes_visible", True):
            return
        if cat in ("bottom", "footwear") and scene.get("framing") == "upper_only":
            return
        for a, b, q in TAP_PAIRS[cat]:
            if g.get("subcategory") == "jeans" and "jeans" in (a, b) and str(g.get("color_family", "")).startswith("denim"):
                continue     # blue-wash jeans read reliably as jeans; never ask "jeans or ...?" about them
            if g.get("subcategory") not in (a, b):
                continue
            other = b if g.get("subcategory") == a else a
            s_alt = score(_with(reading, i, "subcategory", other), occasion, styles, boldness)["overall"]
            if s_alt is None:
                continue
            swing = s_alt - base
            doubt = _doubt(reading, g, a, b)
            if (swing >= 1.0 and doubt) or (swing <= -1.0 and g.get("certainty") != "clear"):
                cur = g.get("subcategory")
                yield {"pair": f"{a}/{b}", "slot": cat, "field": "subcategory", "garment_index": i, "question": q,
                       "options": [{"value": cur, "label": TAP_LABEL.get(cur, cur), "score": base},
                                   {"value": other, "label": TAP_LABEL.get(other, other), "score": s_alt}],
                       # v2 (#125, founder Oct 8): Skip keeps what was read; v4.0 skipped to the more generous one
                       "default": cur if shoes or base >= s_alt else other, "swing": swing, "doubt": doubt or "model not sure"}

    for i, g in enumerate(reading.get("garments", [])):
        for q in pairs(i, g):
            if better(q):
                best = q
        if (shoes and g.get("category") == "footwear" and scene.get("shoes_visible", True)
                and scene.get("framing") != "upper_only" and occasion not in KIND_SKIP_OCCASIONS):
            q = _shoe_question(reading, i, g, base, occasion, styles, boldness)
            if q and better(q):
                best = q
    return best
