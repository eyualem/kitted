"""Writes fixtures/parts.json: every table and number of the parts engine (extraction-test/rubrics/parts_proto.py,
engine v15 = parts-proto-15, the default since Oct 28: v14 plus a hoodie or sweatshirt layered over a tee earning the short jacket's +1.5 on Proportions (PRO-17, DECISIONS-LOG #385); v14 = parts-proto-14, the default from Oct 17: v13 plus the casual and athletic fits (shorts get Proportions, a clean sneaker can earn "the shoes match", the look's own shoe for streetwear, "the pieces go together", the loungewear ladder by fit and context; rubric/research/parts/casual-athletic.md, DECISIONS-LOG #331-#335); v13 was the default from Oct 14: v12 plus wrinkled knit tops costing 0.2 on a minimal, smart casual or prep look (the wrinkle amounts are TUNE knobs; rubric/research/parts/v12.md -> "v13"); v12 was v11 plus the founder's Oct 14 calls (small bright graphics aren't loud, fitted legs cost 1.0 and a "straight" leg at roominess 2 or less is slim, light on light, wrinkles by garment and look; rubric/research/parts/v12.md); v11 was v10 plus a covered base top judged by the layer over it and skinny joggers charged (rubric/research/parts/v11.md); v10 was v9 plus the creators' rules (rubric/research/parts/v10.md); v9 was v8 plus four consensus fixes (#232); v8 was v7 retuned against the gold-set panel, DECISIONS-LOG #227-228,
rubric/research/parts/gold-retune.md; v7 was v6 plus "a condition read counts only on a garment read clear", #219) as data, for @kitted/core's scoreParts() (src/parts.ts, bundled as src/partsData.ts).

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_parts_json.py
Then: cd /Users/eyu/Desktop/files/Kitted/app/packages/kitted-core && node scripts/gen-rubric-data.mjs

Versioned on its own (`version`, starting 1.0.0); rubric.json (v4.1.0, engine 5) is not touched. Tables, the TUNE
block and module constants are read from parts_proto.py itself, so they can't drift. The fault and reward sizes that
live inside its code are transcribed below; parts_parity.json (make_parts_parity.py) is what proves the JSON + the
TypeScript equal Python. Sets are sorted lists (None becomes null); ordered things keep Python's order.
The parts engine also reads v4.1's shared helpers (formality, colors, style detection, prepare/normalize): those
come from rubric.json, so a v4 table change reaches both engines.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import hashlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
KEMPT = os.path.abspath(os.path.join(HERE, "../.."))
sys.path.insert(0, os.path.join(KEMPT, "extraction-test/rubrics"))
import parts_proto as P  # noqa: E402
R = P.R

VERSION = "1.14.0"   # 1.14.0 (#385): v15, a hoodie or sweatshirt layered over a tee earns the short jacket's credit (hl)
# 1.13.0 (#367): v14 counts only a top that clearly shows below the outer piece as a peek (peek_clearly_only)
# 1.12.0 (#336): v14 also lets a tucked open button-up set the waist (pr1_tucked_layer)
ENGINE = "v15"


def sl(s):
    """A set as a sorted list; None (allowed in NO_TIE_IN) sorts first and becomes null."""
    return sorted(s, key=lambda x: (x is not None, x or ""))


def tune_json(t):
    """TUNE[engine] as JSON (frozensets/tuples -> lists, None stays null)."""
    out = {}
    for k, v in t.items():
        if isinstance(v, (set, frozenset)):
            v = sl(v)
        elif isinstance(v, tuple):
            v = list(v)
        elif isinstance(v, dict):
            v = {kk: (list(vv) if isinstance(vv, tuple) else vv) for kk, vv in v.items()}
        out[k] = v
    return out


def data(engine=ENGINE):
    return {
        "version": VERSION, "engine": engine, "label": P.VERSIONS[engine], "source": "extraction-test/rubrics/parts_proto.py",
        "sourceSha256": hashlib.sha256(open(P.__file__, "rb").read()).hexdigest(),
        "rubricVersion": "4.1.0",            # the v4 helpers it was built on (rubric.json version)
        "weights": P.WEIGHTS, "partOrder": P.PART_ORDER, "partNames": P.PART_NAMES, "base": P.BASE,
        "partRange": {"default": [2.0, 10.0], "cohesion": [1.0, 10.0]},
        "tune": tune_json(P.TUNE[engine]),
        # v14: the one switch (core CASUAL_FITS_V14) rolls the app back to v13's numbers; same tables, only the tune differs
        "rollback": {"engine": "v13", "label": P.VERSIONS["v13"], "version": "1.10.0", "tune": tune_json(P.TUNE["v13"])},
        # v15: the second switch (core HOODIE_LAYER_V15) rolls back to v14's numbers (parts data 1.13.0)
        "rollback14": {"engine": "v14", "label": P.VERSIONS["v14"], "version": "1.13.0", "tune": tune_json(P.TUNE["v14"])},
        "sets": {
            "TAILORED": sl(P.TAILORED), "TAILORED_FIT": sl(P.TAILORED_FIT), "RIBBED": sl(P.RIBBED),
            "SHORT_SLEEVE_TYPES": sl(P.SHORT_SLEEVE_TYPES), "PRESSED": sl(P.PRESSED), "NARROW": sl(P.NARROW),
            "FULL_LEG": sl(P.FULL_LEG), "SHORT_LAYERS": sl(P.SHORT_LAYERS), "BULKY": sl(P.BULKY), "SUIT_SHOES": sl(P.SUIT_SHOES),
            "RUNNER": sl(P.RUNNER), "SLIDES": sl(P.SLIDES), "SHORTS": sl(P.SHORTS), "LOUNGE_OK": sl(P.LOUNGE_OK),
            "INTERVIEWISH": sl(P.INTERVIEWISH), "LINEN_LIKELY": sl(P.LINEN_LIKELY), "NO_TIE_IN": sl(P.NO_TIE_IN),
            "LOOSE": list(R.LOOSE),
            # literal sets inside the code
            "SHORT_TOP_LENGTHS": ["at_belt", "cropped"],                       # PR1 "short"
            "STREET_SHAPE_LENGTHS": ["at_belt", "cropped", "mid_fly"],         # PR4
            "STREET_SHAPE_BOTTOMS": ["cargos", "jeans"],                       # PR4
            "LOOSE_DENIM": ["cargos", "jeans"],                                # Shoes / Fit "loose jeans"
            "WORN_HALF_SHOES": ["suede_chukka", "work_boot"],                  # SQ_worn at half price
            "DAINTY_SHOES": ["derby", "dress_shoe", "loafer"],                 # SW3 tip
            "LONG_SHIRTS": ["camp_collar_shirt", "dress_shirt", "flannel_shirt", "oxford_shirt"],   # PF4 tip
            "DRESSY_ROOM": ["event", "interview", "interview_corporate", "interview_tech"],         # occasion ceilings
            "LOUD_PATTERNS": sl(P.LOUD_PRINTS),                                # v8 CL1: loud at a large scale (also v10 COL-11)
            "LOUD_LOGO_TOPS": ["graphic_tee", "tee"],                          # v8 CL1: a big logo is loud on these
            "INT_TOPS": sl(P.INT_TOPS), "INT_OUTERS": sl(P.INT_OUTERS), "HOODIES": sl(P.HOODIES),   # v9 the interview top
            "LOUD_NATIVE": sl(P.LOUD_NATIVE),                                  # v9 CL1: looks whose own pieces are loud
            "DARK_NEUTRALS": sl(P.DARK_NEUTRALS),                              # v10 COL-11: the dark base
            "BASE_TOPS": sl(P.BASE_TOPS), "COVER_TOPS": sl(P.COVER_TOPS),      # v11 STY-4: a base top under a layer
            "LIGHT_NEUTRALS": sl(P.LIGHT_NEUTRALS), "LL_DARK": sl(P.LL_DARK),  # v12 COL-12: light on light
            "WR_KNITS": sl(P.WR_KNITS), "WR_TEES": sl(P.WR_TEES), "WR_CASUAL": sl(P.WR_CASUAL),   # v12 CON-6
            "WR_DRESSY_OCC": sl(P.WR_DRESSY_OCC), "WR_CLEAN": sl(P.WR_CLEAN),   # v13 CON-6: the clean looks
            "SPORT_SNEAKERS": sl(P.SPORT_SNEAKERS), "BOOTS": sl(R.FOOT_KIND["boots"]),   # v14 SHO-4: any clean sneaker or boot
            "TUCKABLE_LAYERS": sl(P.TUCKABLE_LAYERS),                          # v14 PRO-4 (#336): a tucked open shirt
            "SWEAT_TOPS": sl(P.SWEAT_TOPS), "SWEAT_BOTTOMS": sl(P.SWEAT_BOTTOMS),          # v14 LNG-9: a matched sweatsuit
            "HL_LAYERS": sl(P.HL_LAYERS), "HL_TOPS": sl(P.HL_TOPS),            # v15 PRO-17: a hoodie layered over a tee
        },
        "boxyVolume": 4,                     # volume >= this is a roomy / boxy piece (every part)
        "proportions": {
            "bigTopSkinny": 1.5, "layerOverSkinny": 0.5, "peek": 0.5, "blockAt": 1.0,
            "tips": {"longTopLoose": -2.0, "longTop": -1.5, "longLayerLooseLeg": -1.5, "heavyHemTailored": -2.0,
                     "longShirtWideLeg": -1.0, "longShirtMaxVolume": 3},
        },
        "fit": {
            "severity": {"minor": P.MINOR, "moderate": P.MODERATE, "clear": P.CLEAR, "severe": P.SEVERE},
            "pieceOthersRate": 0.5, "othersRate": 0.5,   # within one piece; across pieces
            "tips": {"fullBreakNarrow": -0.5},
        },
        "color": {
            "accent": {"full": 1.0, "half": 0.5},
            "tooManyAccents": {"atLeast": 3, "points": 2.5},
            "busy": {"familiesAtLeast": 5, "accentsAtLeast": 2, "points": 1.0},
            "brightClash": {"boldOrStreet": 1.0, "points": 2.0, "familiesAtLeast": 2},
            "nearMatch": 1.5, "samePatternScale": 1.5, "samePattern": 0.75,
            "threePatterns": {"atLeast": 3, "points": 1.5},
            "lightness": {"tonalRange": 1.0, "tonalShoes": 0.5, "lightMidDark": 0.5},
            "tips": {"doubleDenim": -1.0},
        },
        "shoes": {
            "range": [2.0, 9.5],
            "slides": {"tailored": 2.5, "points": 4.5}, "hemDrags": 0.5, "dragHems": ["full_break", "pooling"],
            "runners": {"tailored": 4.5, "points": 6.0},
            "chunkyUnderTailoring": 2.0,
            "tooCasual": [{"points": 1.5, "from": 1.0, "to": 2.0}, {"points": 1.0, "from": 2.0, "to": 3.0}],
            "tooDressy": {"points": 0.5, "from": 2.0, "to": 2.5},
            "matches": {"points": 0.5, "realFrom": 2.0, "realTo": 2.5},
            "window": {"dressier": [1.5, 2.25], "casual": [0.75, 1.5]},     # flat middle; fades out between the two values
            "chosen": 0.5,
            "chunkyNarrow": 1.5, "runnerNarrow": 0.5,
            "loudVsLoud": 0.75, "accent": 0.5,
            "worn": {"points": 1.0, "half": 0.5},
            "tips": {"daintyWide": -1.0},
        },
        "cohesion": {
            "jacketJeans": 1.5,
            "spread": {"atLeast": 2.5, "bigAtLeast": 3.5, "points": 1.5, "bigPoints": 4.0},
            "statements": {"allowance": {"subtle": 1, "a_little": 1.5, "bold": 2.5}, "allowanceDefault": 1.5, "streetBonus": 1,
                           "perExtra": 0.5, "max": 1.0, "bright": 1, "half": 0.5, "pattern": 1},
        },
        "condition": {"stain": 1.2, "wrinkled": 0.4, "wrinkledLinen": 0.2, "worn": 0.4, "cap": 1.6, "untuckedDressShirt": 0.6,
                      "partRate": 2.5, "partFloor": 2.0},
        "occasion": {
            "o1Curve": [list(x) for x in P.O1_CURVE],
            "casual": {"points": 0.5, "from": 0.25, "to": 0.75},
            "overdressed": {"points": 0.5, "from": 1.5, "to": 2.0},
            "loungeAsCasual": 2,
            "ceilings": {"loungeDressy": 4.0, "loungeLadder": [5.5, 6.5, 7.5], "slidesDressy": 4.0, "sneakersBlazer": 7.0,
                         "bigLogo": 6.5},
            "default": [2, 3],
        },
        "final": {"floor": R.FLOOR, "floorOccasions": sl(R.FLOOR_OCCASIONS), "min": 3.0, "max": 10.0},
        "copy": {
            "lowestFallback": {"fit": "nothing looks the wrong size", "proportions": "a balanced, classic shape",
                               "color": "clean neutrals, nothing fighting", "shoes": "clean and easy with this",
                               "cohesion": "the pieces go together; nothing ties them to one look yet"},
            "solidLine": "Every part is solid: nothing off, nothing standing out yet.",
        },
    }


def main():
    out = data()
    with open(os.path.join(HERE, "parts.json"), "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False); f.write("\n")
    print(f"parts.json written: parts {out['version']} ({out['label']}), {len(out['sets'])} sets")


if __name__ == "__main__":
    main()
