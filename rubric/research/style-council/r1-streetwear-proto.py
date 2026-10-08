# Style council r1 (streetwear advocate) SCRATCH PROTOTYPE, Oct 7 2026. A patched copy of extraction-test/rubric.py v3.1.
# Not the live rubric. Run from extraction-test/ with: import importlib.util (or copy next to rubric.py). Flags in FLAGS.
"""Rubric v3.1 (Oct 6, 2026). The live rubric. Frozen older versions: rubrics/.
v3.1 = v3 + near-match blazer rule (R3) + partial checks scale missing credits only halfway (R4).

"The AI sees, the code judges": this file only reads the AI's garment description
and turns it into scores. Never reads face, body shape, weight or skin tone.

v3 = baseline + credits - mistakes (v2 only subtracted, so "no mistakes" was always 9.0):
  - a clean, basic outfit starts at BASELINE (7.0); put-together signals add CREDITS (max 3.0)
  - mistakes are the v2 rules, with fixes found in Tests 1-2 (see ../rubric/v3.md)
  - score out of what's visible: credits that need hidden parts (shoes) are scaled, never lost
Calibration is still provisional until we have human-labeled photos.
Plain-language version: ../rubric/v3.md. Evidence: ../rubric/v2-evidence/.
"""
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

# ---------- Colors ----------
NEUTRALS = {"white", "off_white_cream", "light_grey", "grey", "charcoal", "black", "navy", "khaki_beige", "tan_camel",
            "brown", "denim_light", "denim_mid", "denim_dark", "light_blue", "olive"}
MUTED = {"burgundy", "sage"}                               # never "loud"; half an accent
ALWAYS_BRIGHT = {"red", "orange", "yellow", "pink", "purple"}
HUE_DEPENDS = {"green", "blue"}                            # bright only if the extractor says saturation=bright
FAMILY = {"off_white_cream": "white", "light_grey": "grey", "charcoal": "grey", "denim_light": "denim",
          "denim_mid": "denim", "denim_dark": "denim", "tan_camel": "tan", "khaki_beige": "tan",
          "sage": "green", "olive": "green", "burgundy": "red", "light_blue": "blue_light"}


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


def is_bright(g):
    c = g.get("color_family")
    if c in ALWAYS_BRIGHT:
        return g.get("saturation") != "muted"
    if c in HUE_DEPENDS:
        return g.get("saturation") == "bright"
    return False


def formality(g):
    f = FORMALITY.get(g.get("subcategory"), 2)
    if g.get("subcategory") == "jeans" and g.get("color_family") == "denim_dark" and not g.get("distressed_by_design"):
        f = 2.5
    return f


BASELINE = 7.0          # clean basics with no mistakes (spec: "clean basics about 7")
LOUNGE_BOTTOMS = {"athletic_shorts", "sweatpants"}
LOUNGE_OK = {"gym", "home"}
KNIT_TOPS = {"sweater", "cardigan", "quarter_zip"}
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



# ---------- PROTOTYPE (streetwear advocate, style council r1): streetwear detection from garment fields ----------
FLAGS = {"detect": True, "anchor": True, "stack_shoe": True, "k4_street": True, "o1_o4_cap": False, "lounge_package": False, "lounge_cap": True, "k3_strict": True, "c6_competing": True, "s3_slides": True}
ST_TOP_CORE = {"hoodie", "graphic_tee", "sweatshirt"}
ST_OUTER_CORE = {"bomber", "puffer"}
ST_OUTER_MED = {"denim_jacket", "leather_jacket", "shell_jacket", "rain_jacket", "fleece"}
ST_BOTTOM_CORE = {"jeans", "cargos"}            # only with relaxed/wide/barrel legs
ST_BOTTOM_LOUNGE = {"sweatpants", "joggers"}     # need a street anchor
ST_SHOE_CORE = {"chunky_sneaker", "basketball_sneaker", "canvas_sneaker"}
ST_SHOE_MED = {"retro_runner", "performance_runner", "work_boot", "low_profile_sneaker"}
STACK_HOLDERS = ST_SHOE_CORE | ST_SHOE_MED | {"white_leather_sneaker", "chelsea_boot"}   # a shoe the hem can rest on
ANCHOR_SHOES = ST_SHOE_CORE | {"retro_runner", "low_profile_sneaker", "white_leather_sneaker", "work_boot"}
TAILORED = {"blazer", "sport_coat", "suit_jacket", "unstructured_blazer", "suit_trousers", "trousers", "dress_shirt", "overcoat"}
DRESS_SHOES = {"dress_shoe", "derby", "loafer"}
PREP_TOPS = {"polo", "knit_polo", "oxford_shirt", "cardigan", "rugby_shirt"}

def detect_street(top, outer, bottom, shoes):
    ev, pts, core = [], 0.0, 0
    mains = [g for g in [top, bottom, shoes] + list(outer) if g]
    if any(g.get("subcategory") in TAILORED for g in mains) or (shoes and shoes.get("subcategory") in DRESS_SHOES):
        return {"reads": False, "anchor": False, "veto": "tailored", "points": 0, "evidence": []}
    if bottom and bottom.get("leg_shape") == "skinny":
        return {"reads": False, "anchor": False, "veto": "skinny_leg", "points": 0, "evidence": []}
    anchor = bool(outer) or bool(shoes and shoes.get("subcategory") in ANCHOR_SHOES)
    # upper slot: best of top / outer
    up = 0.0
    loose_street_bottom = bool(bottom and bottom.get("subcategory") in ST_BOTTOM_CORE and bottom.get("leg_shape") in ("relaxed", "wide"))
    if top and top.get("subcategory") in ST_TOP_CORE:
        up = 1.0; ev.append("top:" + top.get("subcategory"))
    elif top and top.get("subcategory") in ("tee", "tank_top", "jersey") and loose_street_bottom:
        up = 0.5; ev.append("top~:" + top.get("subcategory") + " over loose denim/cargos")   # tee vs graphic_tee flips; don't hinge on it
    for o in outer:
        if o.get("subcategory") in ST_OUTER_CORE or (o.get("volume") or 0) >= 4:
            up = 1.0; ev.append("outer:" + o.get("subcategory"))
        elif o.get("subcategory") in ST_OUTER_MED:
            up = max(up, 0.5); ev.append("outer~:" + o.get("subcategory"))
    if top and top.get("subcategory") in PREP_TOPS and not outer:
        up -= 0.5; ev.append("neg:prep_top")
    pts += up; core += up >= 1
    leg = bottom.get("leg_shape") if bottom else None
    loose_leg = leg in ("relaxed", "wide")
    if bottom and bottom.get("subcategory") in ST_BOTTOM_CORE and loose_leg:
        pts += 1; core += 1; ev.append("bottom:" + bottom["subcategory"] + "/" + leg)
    elif bottom and bottom.get("subcategory") in (ST_BOTTOM_LOUNGE | {"athletic_shorts"}) and anchor:
        pts += 0.5; ev.append("bottom~:" + bottom["subcategory"])
    elif bottom and bottom.get("subcategory") == "shorts" and loose_leg:
        pts += 0.5; ev.append("bottom~:baggy_shorts")
    elif bottom and bottom.get("subcategory") == "chinos":
        pts -= 0.5; ev.append("neg:chinos")
    if shoes and shoes.get("subcategory") in ST_SHOE_CORE:
        pts += 1; core += 1; ev.append("shoe:" + shoes["subcategory"])
    elif shoes and shoes.get("subcategory") in ST_SHOE_MED:
        pts += 0.5; ev.append("shoe~:" + shoes["subcategory"])
    if any(g.get("pattern") in ("graphic", "camo") or g.get("logo") == "large" for g in mains if g.get("category") != "footwear"):
        pts += 0.5; ev.append("graphic/logo")
    DARK = {"black", "charcoal", "grey", "navy", "olive"}
    tech = any(o.get("subcategory") in ("shell_jacket", "rain_jacket") for o in outer) and bottom is not None \
        and bottom.get("subcategory") in ("cargos", "joggers", "sweatpants") \
        and all(g.get("color_family") in DARK for g in mains if g.get("category") != "footwear")
    if tech:
        up2 = 1.0 - up; pts += max(0, up2); core += up < 1; ev.append("techwear:dark_shell+utility_bottom")
    volume = loose_leg or tech or any((g.get("volume") or 0) >= 4 for g in [top] + list(outer) if g)
    reads = volume and core >= 1 and pts >= 2 and up >= 0.5 and not (top and top.get("subcategory") in PREP_TOPS and not outer)   # the upper body must carry a street piece
    return {"reads": bool(reads), "anchor": anchor, "veto": None, "points": pts, "evidence": ev, "volume_gate": bool(volume)}

def score(ext: dict, occasion: str = "everyday", styles: dict = None, boldness: str = "a_little") -> dict:
    styles = styles or {}
    scene = ext.get("scene", {}) or {}
    if scene.get("clothed") != "fully":
        return {"overall": None, "reason": "not_fully_clothed", "partial": False, "rules_fired": []}
    garments = [g for g in ext.get("garments", []) if g.get("certainty") != "unsure" and g.get("category") != "accessory"]
    not_rated = []
    if not scene.get("shoes_visible", True):
        garments = [g for g in garments if g.get("category") != "footwear"]; not_rated.append("shoes")
    if scene.get("framing") == "upper_only":
        garments = [g for g in garments if g.get("category") not in ("bottom", "footwear")]; not_rated.append("bottom half")
    if any(g.get("category") == "traditional" for g in garments):
        not_rated.append("traditional garment (not rated)")
    garments = [g for g in garments if g.get("category") != "traditional"]
    if not garments:
        return {"overall": None, "reason": "nothing_readable", "partial": True, "rules_fired": []}
    for g in garments:  # normalize leg aliases
        if g.get("leg_shape") in LEG_ALIAS:
            g = g; g["leg_shape_raw"] = g["leg_shape"]; g["leg_shape"] = LEG_ALIAS[g["leg_shape"]]

    pen = {"fit": 0.0, "color": 0.0, "proportion": 0.0}
    occ_adj = 0.0
    fired, advice = [], []
    AMTS = {}

    def fire(rule, sub, amount):
        nonlocal occ_adj
        if amount <= 0:
            return
        AMTS[rule] = AMTS.get(rule, 0) + amount * {"fit": 0.8, "color": 0.6, "proportion": 0.6, "occasion": 1.2}[sub]
        if sub == "occasion":
            occ_adj += amount
        else:
            pen[sub] += amount
        fired.append(rule)

    tot_w = sum(styles.values()) or 1
    w = lambda s: styles.get(s, 0) / tot_w
    street, gorp, vintage, workwear = w("streetwear"), w("gorpcore"), w("vintage_sport"), w("workwear")
    tops = [g for g in garments if g.get("category") == "top"]
    top = tops[0] if tops else None
    bottom = next((g for g in garments if g.get("category") == "bottom"), None)
    shoes = next((g for g in garments if g.get("category") == "footwear"), None)
    outer = [g for g in garments if g.get("category") == "outerwear"]
    (vlo, vhi), (llo, lhi) = blended_band(styles)
    DET = detect_street(top, outer, bottom, shoes)
    LOUNGE = bool(FLAGS["lounge_package"] and bottom and bottom.get("subcategory") in LOUNGE_BOTTOMS | {"joggers"}
                  and occasion not in LOUNGE_OK and not outer and not (shoes and shoes.get("subcategory") in ANCHOR_SHOES)
                  and w("vintage_sport") < 0.5)
    if FLAGS["detect"] and DET["reads"]:
        street = 1.0
        (vlo, vhi), (llo, lhi) = blended_band({"streetwear": 1})

    # ================= FIT =================
    if bottom and bottom.get("hem") == "pooling" and not LOUNGE:
        if street >= 0.5:
            amt = 0.0 if bottom.get("leg_shape") in ("relaxed", "wide") else 0.5
            if FLAGS["stack_shoe"] and amt == 0.0 and shoes and shoes.get("subcategory") not in STACK_HOLDERS:
                amt = 0.5   # nothing for the stack to rest on (slides, sandals): the hem drags
            fire("F4_pooling", "fit", amt)
        else:
            fire("F4_pooling", "fit", 1.0)
    if bottom and bottom.get("hem") == "full_break" and bottom.get("leg_shape") in ("skinny", "slim") and bottom.get("certainty") == "clear":
        fire("F4b_full_break_narrow_leg", "fit", 0.25)
    care = 0.0
    for g in garments:
        if g.get("distressed_by_design"):
            continue
        c = g.get("condition")
        if c == "wrinkled":
            care += 0.5
        elif c == "stained" and g.get("certainty") == "clear":
            care += 1.5
        elif c == "pilled_or_worn":
            half = g.get("category") == "footwear" and (street + workwear + vintage) >= 0.5
            care += 0.25 if half else 0.5
    if care:
        fire("F7_care", "fit", min(care, 2.0))
    if top and top.get("tucked") in (None, "none", "na") and top.get("length") == "below_crotch" and (top.get("volume") or 3) < 4 and street < 0.5:
        fire("F6_top_too_long", "fit", 1.0)
    if top and (top.get("volume") or 0) >= 4 and street < 0.5 and (top.get("sleeve_end") == "covers_hand" or top.get("length") == "below_crotch"):
        fire("F8_too_big", "fit", 0.75)
    for g in tops + outer:
        if g.get("sleeve_end") == "covers_hand":
            casual_knit = g.get("subcategory") in ("hoodie", "sweatshirt") and street >= 0.5
            fire("F9_sleeves_cover_hands", "fit", 0.25 if casual_knit else 0.5)
            break
    if any(g.get("strain") == "clear" for g in garments):
        fire("F10_visible_strain", "fit", 0.75)

    # ================= TUCK =================
    if top and top.get("subcategory") == "dress_shirt" and top.get("tucked") in ("none", None) and (
            any(o.get("subcategory") in TAILORED_OUTER for o in outer)
            or (bottom and bottom.get("subcategory") in ("trousers", "suit_trousers")) or occasion in DRESSY_OCCASIONS):
        fire("T1_dress_shirt_untucked", "occasion", 0.5)

    # ================= PROPORTION =================
    if top and top.get("volume"):
        steps = max(0, vlo - top["volume"], top["volume"] - vhi)
        fire("P1_top_volume_vs_style", "proportion", 0.75 * steps)   # v3: proportional (v2 rounded half steps up)
    if bottom and bottom.get("leg_shape") in LEG_ORDER and not LOUNGE:
        li = LEG_ORDER.index(bottom["leg_shape"])
        steps = max(0, llo - li, li - lhi)
        fire("P1_leg_vs_style", "proportion", 0.75 * steps)
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "skinny":
        fire("P2_big_top_skinny_leg", "proportion", 0.5)
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "wide" and (street + gorp) < 0.5 and not LOUNGE:
        fire("P3_everything_oversized", "proportion", 0.5)
    if top and top.get("shows_below_outer") and any(o.get("subcategory") in TAILORED_OUTER for o in outer):
        fire("L1_shirt_hangs_below_blazer", "fit", 0.75)
    if shoes and bottom and shoes.get("subcategory") in ("chunky_sneaker", "performance_runner") and bottom.get("leg_shape") in ("skinny", "slim"):
        fire("S1_bulky_shoe_narrow_leg", "proportion", 0.75)
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
        accents[fam] = max(accents.get(fam, 0), 0.5 if c in MUTED else 1.0)
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
        fire("C3_bright_clash", "color", 0.5 if (boldness == "bold" or street >= 0.5) else 1.0)
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
    if len(pats) >= 3 and street < 0.5:
        fire("C4b_three_plus_patterns", "color", 1.0)
    focal = 0.0
    for g in main:
        if is_bright(g):
            focal += 1
        elif g.get("color_family") in MUTED:
            focal += 0.5
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
    # v3: logos no longer count as focal points; the "large" reading flip-flops between runs
    allowance = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5) + (1 if street >= 0.5 else 0)
    if focal > allowance:
        fire("B1_too_many_focal_points", "color", min(1.0, 0.5 * math.ceil(focal - allowance)))
    if FLAGS["c6_competing"] and street >= 0.5 and top and bottom:
        loud_top = any(g.get("pattern") in ("graphic", "camo", "floral") or g.get("logo") == "large" for g in [top] + outer)
        loud_bottom = bottom.get("pattern") in ("graphic", "camo", "floral") or (bottom.get("pattern") not in (None, "solid") and bottom.get("pattern_scale") == "large")
        if loud_top and loud_bottom:
            fire("C6_competing_statements", "color", 0.5)   # proto: graphic up top AND a loud bottom (about -0.3)
    if len(families) == 1:
        advice.append("tip: tonal outfit, vary texture or shade so it doesn't look flat")
    jacket = next((o for o in outer if o.get("subcategory") in SEPARATE_JACKETS), None)
    if (jacket and bottom and bottom.get("subcategory") in ("trousers", "chinos")
            and jacket.get("color_family") in DARK_SUITING and bottom.get("color_family") in DARK_SUITING
            and jacket.get("color_family") != bottom.get("color_family")):
        # v3.1 (R3): navy blazer + black trousers reads like a mismatched suit (about -0.5)
        fire("C5_near_match_jacket_trousers", "color", 0.85)
        advice.append("tip: pair a dark blazer with clearly different trousers (grey, tan, olive) or the matching suit trousers")

    # ================= OCCASION =================
    core = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    if core:
        f = sum(core) / len(core)
        lo, hi = OCCASION_TARGET.get(occasion, (2, 3))
        if LOUNGE:
            fire("O4L_loungewear_outfit", "occasion", 2.0 / 1.2)   # proto: one verdict (about -2.0), replaces O1/O4/P1-leg/P3/F4
        elif f < lo - 0.5:
            fire("O1_too_casual", "occasion", min(2.5, 1.25 * nearest(lo - f)))
        elif f > hi + 1.5:
            fire("O1_too_formal", "occasion", 0.5)
    if bottom and bottom.get("subcategory") in LOUNGE_BOTTOMS and occasion not in LOUNGE_OK and vintage < 0.5 and not LOUNGE:
        if street >= 0.5 and (DET["anchor"] or not FLAGS["anchor"]):
            fire("O4_loungewear_out", "occasion", 0.25 if FLAGS["anchor"] else 0)   # proto: sweats + a street anchor = half
        else:
            fire("O4_loungewear_out", "occasion", 0.5)   # v3: gym shorts / sweats as a day outfit (about -0.6)
    if shoes:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if others and max(others) - formality(shoes) >= 3 and shoes.get("subcategory") != "white_leather_sneaker":
            fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5)
    if FLAGS["s3_slides"] and shoes and shoes.get("subcategory") == "slides_sandals" and bottom \
            and bottom.get("subcategory") in ("jeans", "cargos") and occasion not in LOUNGE_OK:
        fire("S3_slides_with_jeans", "occasion", 0.25)   # proto, low confidence: house shoes under denim (about -0.3)
    big_logo = [g for g in garments if g.get("logo") == "large"]
    if big_logo and (street + vintage) < 0.3:
        # v3: only scored where it really matters, and only when the model is sure; otherwise a tip
        if occasion.startswith(("work", "interview")) and any(g.get("certainty") == "clear" for g in big_logo):
            fire("O3_large_logo", "occasion", 1.1)
        else:
            advice.append("tip: big logos read casual; a plain or small-logo piece looks more put together")
    if occasion in DRESSY_OCCASIONS and shoes and shoes.get("subcategory") in ("loafer", "derby", "dress_shoe", "chelsea_boot"):
        advice.append("tip: match your belt to your shoes (same color family; black only with black)")

    # "Next level" idea only when the outfit is already clean (nothing to fix) and has no focal point
    if not fired and focal == 0 and boldness != "subtle":
        advice.append("next level: add one point of interest (a knit, a sneaker, a beanie)")

    # ================= CREDITS (v3) =================
    hidden = {"shoes"} if "shoes" in not_rated or "bottom half" in not_rated else set()
    earned = {}
    if outer or (top and top.get("subcategory") in KNIT_TOPS):
        earned["K1_layered"] = CREDITS["K1_layered"][0]
    if any(formality(g) >= 3 for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")):
        earned["K2_elevated_piece"] = CREDITS["K2_elevated_piece"][0]
    # graphic prints don't count: "graphic tee" vs "plain tee" flips between runs, and a print isn't a styling choice
    interest = sum(1 if is_bright(g) else 0.5 if g.get("color_family") in MUTED else 0 for g in main)
    interest += sum(1 for g in main if g.get("pattern") not in (None, "solid", "graphic", "other"))
    base_allow = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5)
    color_fault = any(r.startswith(("C1", "C3", "B1")) for r in fired)
    if FLAGS["k3_strict"] and (color_fault or focal > base_allow):
        pass   # proto: loudness the style tolerates is not rewarded
    elif 1 <= interest <= allowance:
        earned["K3_point_of_interest"] = CREDITS["K3_point_of_interest"][0]
    if FLAGS["k4_street"] and shoes and bottom and shoes.get("subcategory") in ST_SHOE_CORE \
            and bottom.get("leg_shape") in ("relaxed", "wide") and bottom.get("subcategory") in ("jeans", "cargos"):   # general, not gated on detection
        earned["K4_shoes_complement"] = CREDITS["K4_shoes_complement"][0]   # street sneaker weight matches the leg
    elif shoes and bottom:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if formality(shoes) >= 2.5 and others and abs(formality(shoes) - sum(others) / len(others)) <= 0.75:
            earned["K4_shoes_complement"] = CREDITS["K4_shoes_complement"][0]
    # Score out of what's visible: credits that need hidden parts are scaled up, never simply lost.
    visible_max = sum(pts for pts, needs in CREDITS.values() if not hidden.intersection(needs))
    # v3.1 (R4): scale up only halfway; full scaling made partial checks wobble and over-score (m10)
    credit = sum(earned.values()) * (1 + CREDIT_MAX / visible_max) / 2

    sub = {k: max(1.0, min(10.0, 10.0 - v)) for k, v in pen.items()}
    base = 0.40 * sub["fit"] + 0.30 * sub["color"] + 0.30 * sub["proportion"]
    SOFT_TOPS = {"hoodie", "sweatshirt", "tee", "graphic_tee", "tank_top", "jersey"}
    lounge_outfit = bool(bottom and bottom.get("subcategory") in LOUNGE_BOTTOMS | {"joggers"} and occasion not in LOUNGE_OK
                         and (top is None or top.get("subcategory") in SOFT_TOPS) and not outer
                         and not (shoes and shoes.get("subcategory") in ANCHOR_SHOES))
    lounge_cost = sum(v for k, v in AMTS.items() if k in ("O1_too_casual", "O4_loungewear_out", "P1_leg_vs_style", "P3_everything_oversized", "F4_pooling"))
    LOUNGE_CAP_APPLIED = 0.0
    if FLAGS["lounge_cap"] and lounge_outfit and lounge_cost > 2.0:
        LOUNGE_CAP_APPLIED = lounge_cost - 2.0   # proto: a loungewear outfit is one verdict, at most about -2.0
    if FLAGS["o1_o4_cap"] and "O4_loungewear_out" in fired and "O1_too_casual" in fired:
        occ_adj = min(occ_adj, 1.25)   # same sweatpants, counted once-ish
    mistakes = 2.0 * (10.0 - base) + 1.2 * occ_adj
    mistakes -= LOUNGE_CAP_APPLIED
    raw = max(3.0, min(10.0, BASELINE + credit - mistakes))
    display = round_half(raw)
    return {"overall": display, "raw_score": round(raw, 3), "subscores": {k: round_half(v) for k, v in sub.items()}, "occasion_adj": -occ_adj,
            "credits": list(earned), "credit_points": round(credit, 2), "mistake_points": round(mistakes, 2),
            "rules_fired": fired, "street": DET, "lounge_outfit": lounge_outfit, "lounge_cap": round(LOUNGE_CAP_APPLIED, 2), "advice": advice, "partial": bool(not_rated), "not_rated": not_rated}
