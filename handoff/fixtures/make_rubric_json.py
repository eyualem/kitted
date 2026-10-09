"""Writes fixtures/rubric.json: every table and number of rubric.py (v4.0) as data, for the @kitted/core engine.

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_rubric_json.py
Tables are read from rubric.py itself (so they can't drift). Rule amounts live inside rubric.py's code, so they
are transcribed below; the parity test (rubric_parity.json) is what proves the JSON + Swift logic equal Python.
Sets are exported as sorted lists; anything whose ORDER matters is exported as a list in Python's order.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kitted_logic as K  # noqa: E402
r = K.rubric

RULES = {  # transcribed from rubric.score(); keys = rule ids as they appear in rules_fired
    "F4_hem_drags_over_slides": {"sub": "fit", "amount": 0.5, "hems": ["pooling", "stacked", "full_break"], "shoes": ["slides_sandals"]},
    "F4_pooling": {"sub": "fit", "amount": 1.0, "looseOrAthletic": 0.5},
    "F4b_full_break_narrow_leg": {"sub": "fit", "amount": 0.25, "legs": ["skinny", "slim"], "needsCertainty": "clear"},
    "F7_care": {"sub": "fit", "wrinkled": 0.5, "stainedClear": 1.5, "pilledOrWorn": 0.5, "wornWorkBoot": 0.25, "cap": 2.0,
                "distressedExcusesWearOnly": True},
    "F6_top_too_long": {"sub": "fit", "amount": 1.0, "volumeBelow": 4, "volumeDefault": 3},
    "F8_too_big": {"sub": "fit", "amount": 0.75, "volumeAtLeast": 4, "volumeDefault": 0, "streetTops": list(r.STREET_F8_TOPS)},
    "F9_sleeves_cover_hands": {"sub": "fit", "amount": 0.5, "streetCasualKnit": 0.25, "casualKnits": ["hoodie", "sweatshirt"], "firesOnce": True},
    "F10_visible_strain": {"sub": "fit", "amount": 0.75},
    "T1_dress_shirt_untucked": {"sub": "occasion", "amount": 0.5},
    "P1_top_volume_vs_style": {"sub": "proportion", "perStep": 0.75},
    "P1_leg_vs_style": {"sub": "proportion", "perStep": 0.75, "freeLoose": sorted(r.LEG_FREE_LOOSE), "closeTopMaxVolume": 2,
                        "shortLengths": ["cropped", "at_belt"]},
    "P2_big_top_skinny_leg": {"sub": "proportion", "amount": 0.5},
    "P3_everything_oversized": {"sub": "proportion", "amount": 0.5},
    "L1_shirt_hangs_below_blazer": {"sub": "fit", "amount": 0.75},
    "S1_bulky_shoe_narrow_leg": {"sub": "proportion", "amount": 0.75, "shoes": sorted(r.BULKY_SHOES), "legs": ["skinny", "slim"]},
    "C1a_too_many_accent_colors": {"sub": "color", "amount": 1.5, "accentsAtLeast": 3},
    "C1b_too_many_colors": {"sub": "color", "amount": 0.5, "familiesAtLeast": 5, "accentsAtLeast": 2},
    "C3_bright_clash": {"sub": "color", "amount": 1.0, "boldOrStreet": 0.5, "shoeCountsAs": 0.5, "threshold": 2},
    "C4a_same_pattern_same_scale": {"sub": "color", "amount": 1.0},
    "C4a_same_pattern_type": {"sub": "color", "amount": 0.5},
    "C4b_three_plus_patterns": {"sub": "color", "amount": 1.0, "patternsAtLeast": 3},
    "B1_too_many_focal_points": {"sub": "color", "perExtra": 0.5, "max": 1.0, "allowance": {"subtle": 1, "a_little": 1.5, "bold": 2.5}, "allowanceDefault": 1.5, "streetBonus": 1},
    "C5_near_match_jacket_trousers": {"sub": "color", "amount": 0.85, "bottoms": ["trousers", "chinos"]},
    "O1_too_casual": {"sub": "occasion", "perLevel": 1.25, "levelStarts": [0.25, 1.25], "rampWidth": 0.5,
                      "formula": "perLevel * clamp01((gap - 0.25) / 0.5) + perLevel * clamp01((gap - 1.25) / 0.5), gap = lo - mean dressiness"},
    "O1_too_formal": {"sub": "occasion", "amount": 0.5, "margin": 1.5},
    "O4_loungewear_out": {"sub": "occasion", "ladder": [r.LOUNGE_LADDER[0], r.LOUNGE_LADDER[1], r.LOUNGE_LADDER[2]], "heroBothSigns": 0.0, "gymShortsMax": 0.5},
    "S2_shoes_too_casual_for_outfit": {"sub": "occasion", "amount": 1.5, "rampFrom": 2.0, "exempt": ["white_leather_sneaker"],
                                       "tailoredFloor": r.S2_TAILORED_FLOOR, "tailoredFloorOccasions": sorted(r.S2_TAILORED_FLOOR_OCCASIONS),
                                       "tailoredFloorShoes": list(r.FOOT_KIND["sneakers"]),
                                       "formula": "amount * clamp01(gap - rampFrom), gap = max(other dressiness) - shoe dressiness"},
    "O3_large_logo": {"sub": "occasion", "amount": 1.1, "occasionPrefixes": ["work", "interview"], "needsCertainty": "clear"},
}

# every set the style detector and the tap read (rubric.py names), exported as sorted lists
DETECTION_SETS = ["ATHLETIC_BOTTOMS", "DRESS_SHOES", "COLLARED", "DARK_TECH", "ST_TOP_A", "ST_OUT_A", "ST_OUT_H", "ST_SHOE_A", "ST_SHOE_H",
                  "ST_STREET_SHOES", "ST_VETO", "PREP_TOPS", "EARTH_OUTER", "WW_VETO", "WW_NEG", "RETRO_SHOES", "VS_BOTTOM_H", "OUT_A",
                  "OUT_H", "OUT_VETO", "NEUT_MIN", "MIN_HOME_UP", "MIN_HOME_BOTTOM", "MIN_HOME_SHOES", "MIN_AGAINST_SHOES", "PRESSED",
                  "PREP_ANCHOR_UP", "PREP_HOME_UP", "PREP_HOME_BOTTOM", "PREP_HOME_SHOES", "PREP_VETO", "PREP_CASUAL_TOPS",
                  "SC_ANCHOR_UP", "SC_HOME_UP", "SC_ANCHOR_SHOES", "SC_VETO", "JEANS_FAMILY", "DARK_NONDENIM"]


def main():
    sl = lambda s: sorted(s)
    out = {
        "version": "4.1.0", "engine": 5, "minAppBuild": 1, "source": "extraction-test/rubric.py",
        "rubricSha256": __import__("hashlib").sha256(open(os.path.join(K.KEMPT, "extraction-test/rubric.py"), "rb").read()).hexdigest(),
        "config": {"minAge": 18, "freeChecksPerDay": 1, "freeRechecksPerCheck": 1, "freeQuestionsPerDay": 5, "proChecksPerDay": 10,
                   "proQuestionsPerDay": 50, "dayRollsOverAt": "04:00"},
        "scoring": {"baseline": r.BASELINE, "weights": {"fit": 0.40, "color": 0.30, "proportion": 0.30}, "mistakeMultiplier": 2.0,
                    "occasionMultiplier": 1.2, "rawMin": 3.0, "rawMax": 10.0, "subMin": 1.0, "subMax": 10.0, "creditMax": r.CREDIT_MAX,
                    "partialScaling": "earnedSum * ((1 + creditMax / visibleMax) / 2)",
                    "displayRounding": "floor(x * 2 + 0.5) / 2", "nearest": "floor(x + 0.5)", "formalityDefault": 2, "darkUndistressedJeans": 2.5,
                    "mult": r.MULT, "garmentCap": r.GARMENT_CAP, "floor": r.FLOOR, "loungeAthleticAsCasual": 2,
                    "k1TechLayer": r.K1_TECH_LAYER},
        "tables": {
            "FORMALITY": r.FORMALITY, "DARK_JEANS": sl(r.DARK_JEANS), "TAILORED_OUTER": sl(r.TAILORED_OUTER), "SEPARATE_JACKETS": sl(r.SEPARATE_JACKETS),
            "DARK_SUITING": sl(r.DARK_SUITING), "OCCASION_TARGET": {k: list(v) for k, v in r.OCCASION_TARGET.items()},
            "OCCASION_DEFAULT": [2, 3], "DRESSY_OCCASIONS": sl(r.DRESSY_OCCASIONS), "OCCASION_FIRST": sl(r.OCCASION_FIRST),
            "FLOOR_OCCASIONS": sl(r.FLOOR_OCCASIONS), "ATHLETIC_AS_CASUAL": sl(r.ATHLETIC_AS_CASUAL),
            "LEG_ORDER": r.LEG_ORDER, "LEG_ALIAS": r.LEG_ALIAS,
            "STYLE_BANDS": {k: {"volume": list(v[0]), "leg": list(v[1])} for k, v in r.STYLE_BANDS.items()},
            "DEFAULT_BAND": {"volume": list(r.DEFAULT_BAND[0]), "leg": list(r.DEFAULT_BAND[1])},
            "NEUTRALS": sl(r.NEUTRALS), "MUTED": sl(r.MUTED), "ALWAYS_BRIGHT": sl(r.ALWAYS_BRIGHT), "HUE_DEPENDS": sl(r.HUE_DEPENDS),
            "FAMILY": r.FAMILY, "LOUNGE_BOTTOMS": sl(r.LOUNGE_BOTTOMS), "LOUNGE_OK": sl(r.LOUNGE_OK), "KNIT_TOPS": sl(r.KNIT_TOPS),
            "TECH_LAYERS": sl(r.TECH_LAYERS), "LAYER_SHIRTS": sl(r.LAYER_SHIRTS), "DRESSED_OUTER": sl(r.DRESSED_OUTER),
            "DRESSED_TOPS": sl(r.DRESSED_TOPS), "NOT_REAL_SHOES": sl(r.NOT_REAL_SHOES),
            "CREDITS": [{"id": k, "points": v[0], "needs": list(v[1])} for k, v in r.CREDITS.items()],
        },
        "styles": {
            "order": r.STYLE_ORDER, "names": r.STYLE_NAMES, "pickAlias": r.PICK_ALIAS,
            "sets": {k: sl(getattr(r, k)) for k in DETECTION_SETS},
        },
        "tap": {"pairs": {k: [list(p) for p in v] for k, v in r.TAP_PAIRS.items()}, "labels": r.TAP_LABEL,
                # tap v2 (#120): the shoe question
                "shoes": {"kinds": {k: list(v) for k, v in r.FOOT_KIND.items()}, "order": list(r.KIND_ORDER),
                          "question": r.KIND_QUESTION, "labels": r.KIND_LABEL, "lostSwing": r.KIND_LOST_SWING,
                          "skipOccasions": list(r.KIND_SKIP_OCCASIONS)}},
        "rules": {k: {"enabled": True, **v} for k, v in RULES.items()},
        "advice": {
            "ruleOfThirds": r.ADVICE["thirds"], "tonal": r.ADVICE["tonal"], "nearMatch": r.ADVICE["near_match"],
            "bigLogo": r.ADVICE["big_logo"], "belt": r.ADVICE["belt"], "nextLevel": r.ADVICE["next_level"],
            "nextLevelMinimal": r.ADVICE["next_level_minimal"],
        },
        "fixes": K.FIXES,
    }
    with open(os.path.join(HERE, "rubric.json"), "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False); f.write("\n")
    print("rubric.json written:", len(out["tables"]["FORMALITY"]), "formality entries,", len(RULES), "rules,", len(K.FIXES["targets"]), "fix targets")


if __name__ == "__main__":
    main()
