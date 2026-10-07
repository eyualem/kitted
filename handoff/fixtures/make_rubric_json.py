"""Writes fixtures/rubric.json: every table and number of rubric.py v3.1 as data, for the Swift RubricEngine.

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
    "F4_pooling": {"sub": "fit", "amount": 1.0, "streetThreshold": 0.5, "streetSlim": 0.5, "streetRelaxedOrWide": 0.0},
    "F4b_full_break_narrow_leg": {"sub": "fit", "amount": 0.25, "legs": ["skinny", "slim"], "needsCertainty": "clear"},
    "F7_care": {"sub": "fit", "wrinkled": 0.5, "stainedClear": 1.5, "pilledOrWorn": 0.5, "pilledFootwearStreetish": 0.25,
                "streetishThreshold": 0.5, "cap": 2.0, "skipDistressedByDesign": True},
    "F6_top_too_long": {"sub": "fit", "amount": 1.0, "volumeBelow": 4, "volumeDefault": 3, "streetBelow": 0.5},
    "F8_too_big": {"sub": "fit", "amount": 0.75, "volumeAtLeast": 4, "volumeDefault": 0, "streetBelow": 0.5},
    "F9_sleeves_cover_hands": {"sub": "fit", "amount": 0.5, "streetCasualKnit": 0.25, "casualKnits": ["hoodie", "sweatshirt"], "firesOnce": True},
    "F10_visible_strain": {"sub": "fit", "amount": 0.75},
    "T1_dress_shirt_untucked": {"sub": "occasion", "amount": 0.5},
    "P1_top_volume_vs_style": {"sub": "proportion", "perStep": 0.75},
    "P1_leg_vs_style": {"sub": "proportion", "perStep": 0.75},
    "P2_big_top_skinny_leg": {"sub": "proportion", "amount": 0.5},
    "P3_everything_oversized": {"sub": "proportion", "amount": 0.5, "streetPlusGorpBelow": 0.5},
    "L1_shirt_hangs_below_blazer": {"sub": "fit", "amount": 0.75},
    "S1_bulky_shoe_narrow_leg": {"sub": "proportion", "amount": 0.75, "shoes": ["chunky_sneaker", "performance_runner"], "legs": ["skinny", "slim"]},
    "C1a_too_many_accent_colors": {"sub": "color", "amount": 1.5, "accentsAtLeast": 3},
    "C1b_too_many_colors": {"sub": "color", "amount": 0.5, "familiesAtLeast": 5, "accentsAtLeast": 2},
    "C3_bright_clash": {"sub": "color", "amount": 1.0, "boldOrStreet": 0.5, "shoeCountsAs": 0.5, "threshold": 2},
    "C4a_same_pattern_same_scale": {"sub": "color", "amount": 1.0},
    "C4a_same_pattern_type": {"sub": "color", "amount": 0.5},
    "C4b_three_plus_patterns": {"sub": "color", "amount": 1.0, "patternsAtLeast": 3, "streetBelow": 0.5},
    "B1_too_many_focal_points": {"sub": "color", "perExtra": 0.5, "max": 1.0, "allowance": {"subtle": 1, "a_little": 1.5, "bold": 2.5}, "allowanceDefault": 1.5, "streetBonus": 1},
    "C5_near_match_jacket_trousers": {"sub": "color", "amount": 0.85, "bottoms": ["trousers", "chinos"]},
    "O1_too_casual": {"sub": "occasion", "perLevel": 1.25, "max": 2.5, "margin": 0.5},
    "O1_too_formal": {"sub": "occasion", "amount": 0.5, "margin": 1.5},
    "O4_loungewear_out": {"sub": "occasion", "amount": 0.5, "streetPlusVintageBelow": 0.5},
    "S2_shoes_too_casual_for_outfit": {"sub": "occasion", "amount": 1.5, "gapAtLeast": 3, "exempt": ["white_leather_sneaker"]},
    "O3_large_logo": {"sub": "occasion", "amount": 1.1, "streetPlusVintageBelow": 0.3, "occasionPrefixes": ["work", "interview"], "needsCertainty": "clear"},
}


def main():
    sl = lambda s: sorted(s)
    out = {
        "version": "3.1.0", "engine": 3, "minAppBuild": 1, "source": "extraction-test/rubric.py",
        "rubricSha256": __import__("hashlib").sha256(open(os.path.join(K.KEMPT, "extraction-test/rubric.py"), "rb").read()).hexdigest(),
        "config": {"minAge": 18, "freeChecksPerDay": 1, "freeRechecksPerCheck": 1, "freeQuestionsPerDay": 5, "proChecksPerDay": 10,
                   "proQuestionsPerDay": 50, "dayRollsOverAt": "04:00"},
        "scoring": {"baseline": r.BASELINE, "weights": {"fit": 0.40, "color": 0.30, "proportion": 0.30}, "mistakeMultiplier": 2.0,
                    "occasionMultiplier": 1.2, "rawMin": 3.0, "rawMax": 10.0, "subMin": 1.0, "subMax": 10.0, "creditMax": r.CREDIT_MAX,
                    "partialScaling": "(1 + creditMax / visibleMax) / 2, applied as (earnedSum * (1 + creditMax / visibleMax)) / 2",
                    "displayRounding": "floor(x * 2 + 0.5) / 2", "nearest": "floor(x + 0.5)", "formalityDefault": 2, "darkUndistressedJeans": 2.5},
        "tables": {
            "FORMALITY": r.FORMALITY, "TAILORED_OUTER": sl(r.TAILORED_OUTER), "SEPARATE_JACKETS": sl(r.SEPARATE_JACKETS),
            "DARK_SUITING": sl(r.DARK_SUITING), "OCCASION_TARGET": {k: list(v) for k, v in r.OCCASION_TARGET.items()},
            "OCCASION_DEFAULT": [2, 3], "DRESSY_OCCASIONS": sl(r.DRESSY_OCCASIONS), "LEG_ORDER": r.LEG_ORDER, "LEG_ALIAS": r.LEG_ALIAS,
            "STYLE_BANDS": {k: {"volume": list(v[0]), "leg": list(v[1])} for k, v in r.STYLE_BANDS.items()},
            "DEFAULT_BAND": {"volume": list(r.DEFAULT_BAND[0]), "leg": list(r.DEFAULT_BAND[1])},
            "NEUTRALS": sl(r.NEUTRALS), "MUTED": sl(r.MUTED), "ALWAYS_BRIGHT": sl(r.ALWAYS_BRIGHT), "HUE_DEPENDS": sl(r.HUE_DEPENDS),
            "FAMILY": r.FAMILY, "LOUNGE_BOTTOMS": sl(r.LOUNGE_BOTTOMS), "LOUNGE_OK": sl(r.LOUNGE_OK), "KNIT_TOPS": sl(r.KNIT_TOPS),
            "CREDITS": [{"id": k, "points": v[0], "needs": list(v[1])} for k, v in r.CREDITS.items()],
        },
        "rules": {k: {"enabled": True, **v} for k, v in RULES.items()},
        "advice": {
            "ruleOfThirds": "tip: a front tuck or a cropped layer can lengthen your legs (rule of thirds)",
            "tonal": "tip: tonal outfit, vary texture or shade so it doesn't look flat",
            "nearMatch": "tip: pair a dark blazer with clearly different trousers (grey, tan, olive) or the matching suit trousers",
            "bigLogo": "tip: big logos read casual; a plain or small-logo piece looks more put together",
            "belt": "tip: match your belt to your shoes (same color family; black only with black)",
            "nextLevel": "next level: add one point of interest (a knit, a sneaker, a beanie)",
        },
        "fixes": K.FIXES,
    }
    with open(os.path.join(HERE, "rubric.json"), "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False); f.write("\n")
    print("rubric.json written:", len(out["tables"]["FORMALITY"]), "formality entries,", len(RULES), "rules,", len(K.FIXES["targets"]), "fix targets")


if __name__ == "__main__":
    main()
