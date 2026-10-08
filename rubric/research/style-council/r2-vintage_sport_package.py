"""PROTOTYPE ONLY (vintage-sport advocate, style council ROUND 2 package, Oct 7 2026): r1 vintage proto minus the
matched-set signal, plus R2 ramp, R3 floor, R4 one credit per garment, R5, R6, C2 technical K1 0.5 (void over 0-signal
loungewear), R8 open overshirt, workwear A/B, one focal point per garment, streetwear K4 trigger (not over pooling).
Not implemented: R1 per-garment cap, other styles' detection allowances.
Original r1 note: Copy of rubric.py v3.1 with the
proposals in r1-vintage_sport.md patched in. Not the live rubric.

Original header: Rubric v3.1 (Oct 6, 2026). The live rubric. Frozen older versions: rubrics/.
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
    "tank_top": 1, "jersey": 2, "track_pants": 1.5, "track_jacket": 2, "sweatpants": 1, "athletic_shorts": 1, "joggers": 1, "slides_sandals": 1,
    "graphic_tee": 2, "tee": 2, "hoodie": 2, "sweatshirt": 2, "cargos": 2, "shorts": 2, "jeans": 2, "canvas_sneaker": 2,
    "basketball_sneaker": 2, "chunky_sneaker": 2, "performance_runner": 2, "retro_runner": 2, "flannel_shirt": 2,
    "puffer": 2, "rain_jacket": 2, "shell_jacket": 2, "fleece": 2, "rugby_shirt": 2, "denim_jacket": 2, "bomber": 2,
    "work_boot": 2.5,
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
    "vintage_sport": ((3, 4), ("straight", "wide")),   # + athleisure (low confidence)
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
    if g.get("subcategory") == "jeans" and g.get("color_family") == "black" and not g.get("distressed_by_design"):
        f = 2.5   # r2: workwear fix B
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



HERO_TOPS = {"jersey", "rugby_shirt"}
HERO_OUTER = {"track_jacket"}
ATH_BOTTOMS = {"sweatpants", "joggers", "track_pants", "athletic_shorts"}
FLEECE = {"hoodie", "sweatshirt"}
RETRO_SHOES = {"low_profile_sneaker", "retro_runner"}
CLEAN_SHOES = RETRO_SHOES | {"white_leather_sneaker", "canvas_sneaker", "loafer", "suede_chukka", "chelsea_boot", "work_boot"}
GYM_SHOES = {"performance_runner", "slides_sandals"}
ANCHOR_BOTTOMS = {"jeans", "cargos", "chinos", "shorts", "trousers", "drawstring_trousers"}
STRUCTURED_OUTER = {"denim_jacket", "bomber", "leather_jacket", "overcoat", "chore_coat", "field_jacket",
                    "overshirt", "blazer", "unstructured_blazer", "sport_coat", "track_jacket"}
DRESSED_TOPS = {"polo", "knit_polo", "oxford_shirt", "quarter_zip", "sweater", "cardigan", "camp_collar_shirt",
                "rugby_shirt", "jersey", "flannel_shirt", "overshirt"}

O4_BY_SIGNALS = {0: 1.0, 1: 0.5, 2: 0.0}   # occasion bucket (x1.2 on the score)

def intent_signals(garments):
    """0-2: a dressed upper half, and a non-gym shoe. Hidden shoes count as neither."""
    outs = [g.get("subcategory") for g in garments if g.get("category") == "outerwear"]
    tops = [g.get("subcategory") for g in garments if g.get("category") == "top"]
    shoe = next((g.get("subcategory") for g in garments if g.get("category") == "footwear"), None)
    bottom = next((g.get("subcategory") for g in garments if g.get("category") == "bottom"), None)
    if bottom == "athletic_shorts" and "jersey" in tops:
        return 0                     # a kit, not an outfit
    upper = any(s in STRUCTURED_OUTER for s in outs) or any(s in DRESSED_TOPS for s in tops)
    bcol = next((g.get("color_family") for g in garments if g.get("category") == "bottom"), None)
    matched_set = bottom in {"sweatpants", "joggers", "track_pants"} and any(g.get("subcategory") in FLEECE | HERO_OUTER and g.get("color_family") == bcol
                      for g in garments if g.get("category") in ("top", "outerwear"))
    return int(upper) + int(shoe is not None and shoe not in GYM_SHOES)   # r2: matched set no longer counts

def detect_vintage_sport(garments):
    """Returns (path, confidence) or (None, reason). Computed from garment fields only."""
    sub = lambda c: [g.get("subcategory") for g in garments if g.get("category") == c]
    tops, outs, bots, shoes = sub("top"), sub("outerwear"), sub("bottom"), sub("footwear")
    bottom = bots[0] if bots else None
    shoe = shoes[0] if shoes else None
    heroes = [s for s in tops if s in HERO_TOPS] + [s for s in outs if s in HERO_OUTER]
    if "tank_top" in tops and not outs:
        return None, "tank top as the main top"
    if bottom == "athletic_shorts" and any(s == "jersey" for s in tops):
        return None, "full kit (jersey + athletic shorts)"
    prep_side = heroes == ["rugby_shirt"] and bottom in {"chinos", "trousers"} and shoe not in RETRO_SHOES
    if prep_side:
        return None, "rugby shirt with chinos/trousers: reads as classic prep"
    if heroes and bottom in ANCHOR_BOTTOMS:
        return "terrace", ("high" if shoe in RETRO_SHOES else "medium")
    if "track_jacket" in outs and bottom in {"track_pants", "sweatpants", "joggers"} and shoe not in GYM_SHOES:
        return "tracksuit", ("high" if shoe in RETRO_SHOES else "medium")
    dressed_upper = any(s in STRUCTURED_OUTER for s in outs) or any(s in DRESSED_TOPS for s in tops) or bool(heroes)
    if bottom in {"sweatpants", "joggers", "track_pants"} and dressed_upper and shoe not in GYM_SHOES:
        return "sport_off_duty", "medium"
    if bottom == "athletic_shorts" and dressed_upper and shoe in RETRO_SHOES | {"canvas_sneaker"}:
        return "retro_shorts", "medium"
    if heroes and shoe in RETRO_SHOES:
        return "terrace", "medium"
    return None, "no sport hero + anchor"

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
    vs_path, vs_conf = detect_vintage_sport(garments)
    vs_on = vs_path is not None and vs_conf in ("high", "medium")
    if vs_on:   # judge it by what it's going for: widen, never narrow
        (bvlo, bvhi), (bl0, bl1) = STYLE_BANDS["vintage_sport"]
        vlo, vhi = min(vlo, bvlo), max(vhi, bvhi)
        llo, lhi = min(llo, LEG_ORDER.index(bl0)), max(lhi, LEG_ORDER.index(bl1))

    # ================= FIT =================
    if bottom and bottom.get("hem") == "pooling" and bottom.get("subcategory") in ATH_BOTTOMS:
        fire("F4_pooling", "fit", 0.0 if vs_on else 0.5)
    elif bottom and bottom.get("hem") == "pooling":
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
        fire("P1_top_volume_vs_style", "proportion", 0.75 * steps)   # v3: proportional (v2 rounded half steps up)
    if bottom and bottom.get("leg_shape") in LEG_ORDER:
        li = LEG_ORDER.index(bottom["leg_shape"])
        steps = max(0, llo - li, li - lhi)
        fire("P1_leg_vs_style", "proportion", 0.75 * steps)
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "skinny":
        fire("P2_big_top_skinny_leg", "proportion", 0.5)
    if top and bottom and (top.get("volume") or 0) >= 4 and bottom.get("leg_shape") == "wide" and (street + gorp) < 0.5 and not (vs_on and top.get("subcategory") in HERO_TOPS):
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
        f0 = focal
        if is_bright(g):
            focal += 1
        elif g.get("color_family") in MUTED:
            focal += 0.5
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
        focal = min(focal, f0 + 1)   # r2: any garment counts at most 1 focal point (prep proposal)
    # v3: logos no longer count as focal points; the "large" reading flip-flops between runs
    allowance = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5) + (1 if street >= 0.5 else 0)
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

    # ================= OCCASION =================
    core = [(2 if (g.get("subcategory") in ATH_BOTTOMS and occasion in ("everyday", "class")) else formality(g)) for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    if core:
        f = sum(core) / len(core)
        lo, hi = OCCASION_TARGET.get(occasion, (2, 3))
        if f < lo - 0.5:
            gap = lo - f
            fire("O1_too_casual", "occasion", min(2.5, 1.25 * (math.floor(gap) + min(1.0, max(0.0, (gap - math.floor(gap) - 0.25) / 0.5)))))
        elif f > hi + 1.5:
            fire("O1_too_formal", "occasion", 0.5)
    if bottom and bottom.get("subcategory") in ATH_BOTTOMS and occasion not in LOUNGE_OK and not vs_on:
        sig = intent_signals(garments)
        fire("O4_loungewear_out", "occasion", O4_BY_SIGNALS[min(sig, 2)])   # v3: gym shorts / sweats as a day outfit (about -0.6)
    if shoes:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if others and max(others) - formality(shoes) >= 3 and shoes.get("subcategory") != "white_leather_sneaker":
            fire("S2_shoes_too_casual_for_outfit", "occasion", 1.5)
    big_logo = [g for g in garments if g.get("logo") == "large"]
    if big_logo and street < 0.3 and not vs_on:
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
    TECH = {"shell_jacket", "rain_jacket", "puffer", "fleece", "vest"}
    main_g = [g for g in garments if g.get("category") in ("top", "bottom", "footwear", "outerwear")]
    real_outer = [o for o in outer if not (o.get("subcategory") == "track_jacket" and bottom is not None
                  and bottom.get("subcategory") in ATH_BOTTOMS and o.get("color_family") == bottom.get("color_family"))]
    lounge0 = (bottom is not None and bottom.get("subcategory") in ATH_BOTTOMS and occasion not in LOUNGE_OK
               and not vs_on and intent_signals(garments) == 0)
    k1c = [(id(o), 0.5 if o.get("subcategory") in TECH else 0.75) for o in real_outer
           if not (lounge0 and o.get("subcategory") in TECH)]   # r2: a technical layer over loungewear isn't styling
    k1c += [(id(t), 0.75) for t in tops if t.get("subcategory") in KNIT_TOPS]
    k1c += [(id(t), 0.5) for t in tops if t.get("subcategory") == "fleece"]
    if len(tops) >= 2:   # R8: an open overshirt/flannel/camp shirt over another top is a layer
        k1c += [(id(t), 0.75) for t in tops if t.get("subcategory") in ("overshirt", "flannel_shirt", "camp_collar_shirt")]
    k2c = [(id(g), 0.5) for g in main_g if formality(g) >= 3]
    kit = bottom is not None and bottom.get("subcategory") == "athletic_shorts" and any(t.get("subcategory") == "jersey" for t in tops)
    def g_interest(g):
        if kit and g.get("subcategory") == "jersey":
            return 0
        v = 1 if is_bright(g) else 0.5 if g.get("color_family") in MUTED else 0
        if g.get("pattern") not in (None, "solid", "graphic", "other") and g.get("pattern_scale") in ("medium", "large"):   # R5
            v += 1
        return min(v, 1)   # one garment, at most 1
    interest = sum(g_interest(g) for g in main)
    k3c = [(id(g), 0.5) for g in main if g_interest(g) > 0] if 1 <= interest <= allowance else []
    k4c = []
    if shoes and bottom:
        others = [formality(g) for g in garments if g.get("category") in ("top", "bottom", "outerwear")]
        if formality(shoes) >= 2.5 and others and abs(formality(shoes) - sum(others) / len(others)) <= 0.75:
            k4c = [(id(shoes), 0.5)]
        elif (shoes.get("subcategory") in ("chunky_sneaker", "basketball_sneaker", "canvas_sneaker")
              and bottom.get("subcategory") in ("jeans", "cargos") and bottom.get("leg_shape") in ("relaxed", "wide")
              and bottom.get("hem") != "pooling"):
            k4c = [(id(shoes), 0.5)]   # streetwear K4 alt trigger (amended: not over a pooling hem)
    import itertools
    names = ["K1_layered", "K2_elevated_piece", "K3_point_of_interest", "K4_shoes_complement"]
    best = (0, {})
    for combo in itertools.product(*[c + [None] for c in (k1c, k2c, k3c, k4c)]):
        ids = [c[0] for c in combo if c]
        if len(ids) != len(set(ids)):
            continue
        tot = sum(c[1] for c in combo if c)
        if tot > best[0]:
            best = (tot, {n: c[1] for n, c in zip(names, combo) if c})
    earned = best[1]
    # Score out of what's visible: credits that need hidden parts are scaled up, never simply lost.
    visible_max = sum(pts for pts, needs in CREDITS.values() if not hidden.intersection(needs))
    # v3.1 (R4): scale up only halfway; full scaling made partial checks wobble and over-score (m10)
    credit = sum(earned.values())   # R6: no partial up-scaling

    sub = {k: max(1.0, min(10.0, 10.0 - v)) for k, v in pen.items()}
    base = 0.40 * sub["fit"] + 0.30 * sub["color"] + 0.30 * sub["proportion"]
    mistakes = 2.0 * (10.0 - base) + 1.2 * occ_adj
    floor = 5.0 if (occasion in ("everyday", "class", "date", "going_out", "home") and "F7_care" not in fired
                    and "F10_visible_strain" not in fired) else 3.0   # R3
    raw = max(floor, min(10.0, BASELINE + credit - mistakes))
    display = round_half(raw)
    return {"overall": display, "raw_score": round(raw, 3), "subscores": {k: round_half(v) for k, v in sub.items()}, "occasion_adj": -occ_adj,
            "credits": list(earned), "credit_points": round(credit, 2), "mistake_points": round(mistakes, 2),
            "rules_fired": fired, "advice": advice, "vintage_sport": (vs_path, vs_conf), "partial": bool(not_rated), "not_rated": not_rated}
