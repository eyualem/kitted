"""Rubric v2 (Oct 6, 2026), FROZEN copy for comparison. The live rubric is ../rubric.py.

"The AI sees, the code judges": this file only reads the AI's garment description
and turns it into scores. Never reads face, body shape, weight or skin tone.
Calibration is a placeholder until we have labeled photos (an outfit with no issues = 9.0).
Sources and reasoning: ../../rubric/v2-evidence/ (fit.md, color.md, proportion_occasion.md) and ../../rubric/v2.md.
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
    "dress_shirt": 4, "trousers": 4, "blazer": 4, "sport_coat": 4, "overcoat": 4, "derby": 4,
    "suit_jacket": 5, "suit_trousers": 5, "dress_shoe": 5,
}
TAILORED_OUTER = {"blazer", "suit_jacket", "sport_coat", "unstructured_blazer"}
OCCASION_TARGET = {
    "everyday": (2, 3), "class": (2, 3),
    "work_casual": (2.5, 3.5), "work": (3, 4),                     # work = business casual
    "date": (2.5, 3.5), "going_out": (2.5, 3.5),
    "interview": (3.5, 4.5), "interview_corporate": (4, 5), "interview_tech": (3, 4),
    "event": (3.5, 4.5), "wedding_formal": (4, 5), "wedding_casual": (3, 4),
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

    def fire(rule, sub, amount):
        nonlocal occ_adj
        if amount <= 0:
            return
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

    # ================= FIT =================
    if bottom and bottom.get("hem") == "pooling":
        if street >= 0.5:
            fire("F4_pooling", "fit", 0.0 if bottom.get("leg_shape") in ("relaxed", "wide") else 0.5)
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
        fire("P1_top_volume_vs_style", "proportion", 0.75 * nearest(steps))
    if bottom and bottom.get("leg_shape") in LEG_ORDER:
        li = LEG_ORDER.index(bottom["leg_shape"])
        steps = max(0, llo - li, li - lhi)
        fire("P1_leg_vs_style", "proportion", 0.75 * nearest(steps))
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "skinny":
        fire("P2_big_top_skinny_leg", "proportion", 0.5)
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "wide" and (street + gorp) < 0.5:
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
    focal += sum(1 for g in garments if g.get("logo") == "large")
    allowance = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5) + (1 if street >= 0.5 else 0)
    if focal > allowance:
        fire("B1_too_many_focal_points", "color", min(1.0, 0.5 * math.ceil(focal - allowance)))
    if len(families) == 1:
        advice.append("tip: tonal outfit, vary texture or shade so it doesn't look flat")

    # ================= OCCASION =================
    core = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    if core:
        f = sum(core) / len(core)
        lo, hi = OCCASION_TARGET.get(occasion, (2, 3))
        if f < lo - 0.5:
            fire("O1_too_casual", "occasion", min(2.5, 1.25 * nearest(lo - f)))
        elif f > hi + 1.5:
            fire("O1_too_formal", "occasion", 0.5)
    if shoes:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if others and max(others) - formality(shoes) >= 3 and shoes.get("subcategory") != "white_leather_sneaker":
            fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5)
    if any(g.get("logo") == "large" for g in garments) and (street + vintage) < 0.3:
        fire("O3_large_logo", "occasion", 0.75 * (1.5 if occasion.startswith(("work", "interview")) else 1))
    if occasion in DRESSY_OCCASIONS and shoes and shoes.get("subcategory") in ("loafer", "derby", "dress_shoe", "chelsea_boot"):
        advice.append("tip: match your belt to your shoes (same color family; black only with black)")

    # "Next level" idea only when the outfit is already clean (nothing to fix) and has no focal point
    if not fired and focal == 0 and boldness != "subtle":
        advice.append("next level: add one point of interest (a knit, a sneaker, a beanie)")

    sub = {k: max(1.0, min(10.0, 10.0 - v)) for k, v in pen.items()}
    base = 0.40 * sub["fit"] + 0.30 * sub["color"] + 0.30 * sub["proportion"]
    display = round_half(max(3.0, min(10.0, 9.0 - 2.0 * (10.0 - base) - 1.2 * occ_adj)))
    return {"overall": display, "subscores": {k: round_half(v) for k, v in sub.items()}, "occasion_adj": -occ_adj,
            "rules_fired": fired, "advice": advice, "partial": bool(not_rated), "not_rated": not_rated}
