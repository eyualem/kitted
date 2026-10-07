"""Schema v4: the short answer format (about 3x fewer output tokens than v3).

One slot per garment role instead of a list of 20-field garments:
  scene · top · outer[0-2] · bottom · shoes · extras
Values fold related fields together (dusty_pink = pink + muted, stripes_fine = stripes + small,
untucked_mid_fly = not tucked + length), and rare defects go in an `issues` list, so there is
no "na" filler. `to_extraction()` converts a v4 answer back into the v3 shape that rubric.py
reads, so the rules don't change. Design: ../brainstorm/07_detail-engineer.md §R2.5.

  /usr/bin/python3 v4.py   # writes schema_v4.json from the lists below
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

TOP_TYPES = ["tee", "graphic_tee", "polo", "knit_polo", "oxford_shirt", "dress_shirt", "flannel_shirt",
             "camp_collar_shirt", "rugby_shirt", "sweater", "quarter_zip", "hoodie", "sweatshirt", "tank_top",
             "jersey", "traditional", "other"]
OUTER_TYPES = ["overshirt", "flannel_shirt", "camp_collar_shirt", "oxford_shirt", "dress_shirt", "cardigan", "hoodie",
               "quarter_zip", "blazer", "unstructured_blazer", "sport_coat", "suit_jacket", "denim_jacket", "bomber",
               "leather_jacket", "chore_coat", "field_jacket", "puffer", "fleece", "overcoat", "rain_jacket",
               "shell_jacket", "traditional", "other"]
BOTTOM_TYPES = ["jeans", "chinos", "trousers", "drawstring_trousers", "suit_trousers", "cargos", "joggers",
                "sweatpants", "shorts", "athletic_shorts", "traditional", "other"]
SHOE_TYPES = ["white_leather_sneaker", "low_profile_sneaker", "canvas_sneaker", "retro_runner", "performance_runner",
              "chunky_sneaker", "basketball_sneaker", "loafer", "derby", "dress_shoe", "chelsea_boot", "suede_chukka",
              "work_boot", "slides_sandals", "other"]
COLORS = ["white", "off_white_cream", "light_grey", "grey", "charcoal", "black", "navy", "light_blue", "blue",
          "bright_blue", "denim_light", "denim_mid", "denim_dark", "olive", "green", "bright_green", "sage",
          "khaki_beige", "tan_camel", "brown", "burgundy", "red", "muted_red", "orange", "muted_orange", "yellow",
          "muted_yellow", "pink", "dusty_pink", "purple", "muted_purple", "multicolor"]
PATTERNS = ["solid", "stripes_fine", "stripes_medium", "stripes_bold", "check_fine", "check_medium", "check_bold",
            "graphic_print", "camo", "floral", "other"]
TOP_HEMS = ["tucked_full", "tucked_half", "untucked_cropped", "untucked_at_belt", "untucked_mid_fly",
            "untucked_below_crotch", "hidden"]
SLEEVES = ["short", "pushed_or_rolled", "at_wrist", "over_hand", "hidden"]
LEGS = ["skinny", "slim", "straight", "relaxed", "wide", "flare_bootcut", "barrel", "shorts"]
BOTTOM_HEMS = ["pooling", "full_break", "slight_break", "no_break", "cuffed", "cropped", "shorts", "hidden"]
ISSUES = ["faded", "tag_or_sticker", "wrinkled", "stain", "pilling", "stretched_neckline", "fraying",
          "collar_collapsed", "scuffed", "strain", "hangs_below_jacket", "distressed_by_design"]
EXTRAS = ["belt_black", "belt_brown", "belt_other", "watch", "hat", "bag", "tie", "jewelry"]
SURE = ["clear", "likely", "unsure"]


# ---------- schema ----------
def _enum(values):
    return {"type": "STRING", "enum": values}


def _obj(props, nullable=False):
    o = {"type": "OBJECT", "properties": props, "required": list(props), "propertyOrdering": list(props)}
    if nullable:
        o["nullable"] = True
    return o


def build_schema():
    issues = {"type": "ARRAY", "items": _enum(ISSUES)}
    color, pat, logo, sure = _enum(COLORS), _enum(PATTERNS), _enum(["none", "small", "large"]), _enum(SURE)
    props = {
        "scene": _obj({"clothed": _enum(["fully", "partial"]),
                       "framing": _enum(["full_body", "three_quarter", "upper_only"]),
                       "feet": _enum(["shoes_on", "socks_or_barefoot", "cut_off"])}),
        "top": _obj({"type": _enum(TOP_TYPES), "color": color, "pat": pat, "logo": logo,
                     "fit": {"type": "INTEGER"}, "hem": _enum(TOP_HEMS), "sleeve": _enum(SLEEVES),
                     "issues": issues, "sure": sure}, nullable=True),
        "outer": {"type": "ARRAY", "items": _obj({"type": _enum(OUTER_TYPES), "color": color, "pat": pat, "logo": logo,
                                                  "sleeve": _enum(SLEEVES), "issues": issues, "sure": sure})},
        "bottom": _obj({"type": _enum(BOTTOM_TYPES), "color": color, "pat": pat, "leg": _enum(LEGS),
                        "hem": _enum(BOTTOM_HEMS), "issues": issues, "sure": sure}, nullable=True),
        "shoes": _obj({"type": _enum(SHOE_TYPES), "color": color, "issues": issues, "sure": sure}, nullable=True),
        "extras": {"type": "ARRAY", "items": _enum(EXTRAS)},
    }
    return _obj(props)


# ---------- adapter: v4 answer -> v3-shaped extraction for rubric.py ----------
MUTED = {"burgundy", "sage"}
BRIGHT = {"red", "orange", "yellow", "pink", "purple"}
SLEEVE_END = {"pushed_or_rolled": "above_wrist", "at_wrist": "at_wrist", "over_hand": "covers_hand"}
WORN = {"pilling", "fraying", "stretched_neckline", "scuffed", "collar_collapsed"}


def _color(c):
    c = c or "multicolor"
    if c == "dusty_pink":
        return "pink", "muted"
    if c.startswith("bright_"):
        return c[7:], "bright"
    if c.startswith("muted_"):
        return c[6:], "muted"
    if c in MUTED:
        return c, "muted"
    if c in BRIGHT:
        return c, "bright"
    return c, "na"


def _pattern(p):
    p = p or "solid"
    if "_" in p and p.rsplit("_", 1)[1] in ("fine", "medium", "bold"):
        base, size = p.rsplit("_", 1)
        return {"stripes": "stripes", "check": "checks_plaid"}[base], {"fine": "small", "medium": "medium", "bold": "large"}[size]
    return {"graphic_print": "graphic"}.get(p, p), "na"


def _garment(category, slot):
    color, sat = _color(slot.get("color"))
    pattern, scale = _pattern(slot.get("pat"))
    issues = set(slot.get("issues") or [])
    # v4.1: "wrinkled" is advice-only. In the lock-in test (Oct 6) the model ticked it on borderline
    # creases inconsistently, which flipped the care rule on 25 of 104 photo runs. New issue flags
    # only move the score once they're proven on the gold set.
    condition = ("stained" if "stain" in issues else "pilled_or_worn" if issues & WORN else "clean")
    sub = slot.get("type")
    return {"category": "traditional" if sub == "traditional" else category, "subcategory": sub,
            "color_family": color, "saturation": sat, "pattern": pattern, "pattern_scale": scale,
            "logo": slot.get("logo", "none"), "volume": slot.get("fit", 3), "leg_shape": "na", "hem": "na",
            "tucked": "na", "length": "na", "sleeve_end": SLEEVE_END.get(slot.get("sleeve"), "na"),
            "strain": "clear" if "strain" in issues else "none", "condition": condition,
            "distressed_by_design": "distressed_by_design" in issues,
            "shows_below_outer": "hangs_below_jacket" in issues, "certainty": slot.get("sure", "clear"),
            # new v4 details, passed through for later rules (advice-only for now)
            "faded": "faded" in issues, "tag_or_sticker": "tag_or_sticker" in issues,
            "collar_collapsed": "collar_collapsed" in issues, "issues": sorted(issues)}


def to_extraction(v: dict) -> dict:
    scene = v.get("scene") or {}
    garments = []
    if v.get("top"):
        t = v["top"]; g = _garment("top", t); hem = t.get("hem", "hidden")
        if hem.startswith("tucked_"):
            g["tucked"] = hem[len("tucked_"):]
        elif hem.startswith("untucked_"):
            g["tucked"] = "none"; g["length"] = hem[len("untucked_"):]
        garments.append(g)
    for o in v.get("outer") or []:
        garments.append(_garment("outerwear", o))
    if v.get("bottom"):
        b = v["bottom"]; g = _garment("bottom", b)
        g["leg_shape"] = "na" if b.get("leg") == "shorts" else b.get("leg", "na")
        g["hem"] = "na" if b.get("hem") in ("shorts", "hidden") else b.get("hem", "na")
        garments.append(g)
    feet = scene.get("feet", "shoes_on")
    if v.get("shoes") and feet == "shoes_on":
        garments.append(_garment("footwear", v["shoes"]))
    for x in v.get("extras") or []:
        sub = x.split("_")[0]
        garments.append({"category": "accessory", "subcategory": sub, "certainty": "clear",
                         "color_family": {"belt_black": "black", "belt_brown": "brown"}.get(x, "multicolor")})
    return {"scene": {"clothed": scene.get("clothed", "fully"), "framing": scene.get("framing", "full_body"),
                      "shoes_visible": feet == "shoes_on", "feet": feet},
            "garments": garments}


if __name__ == "__main__":
    (HERE / "schema_v4.json").write_text(json.dumps(build_schema(), indent=1) + "\n")
    print("wrote schema_v4.json")
