"""Writes fixtures/rubric_parity.json: many readings x configs with rubric.py's exact output, for the Swift
RubricParityTests. Swift must reproduce every case exactly (see 04-logic-and-demo-data.md section 4.9).

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_parity.py

Readings (deduplicated by canonical JSON of {scene, garments}):
  1. every saved reading in extraction-test/results/**/raw_results.json (real Gemini runs, all tests)
  2. the demo readings + variants in fixtures/readings/
  3. hand-written edge cases that force every rule, branch and early return
  4. a seeded random fuzz set (schema enums, plus missing keys / unknown values) for branch combinations
Configs: each reading is scored under 3 configs (its original test config for real readings, plus rotating
style mixes, boldness levels and every occasion key, including an unknown one).
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, glob, hashlib, json, os, random, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kitted_logic as K  # noqa: E402
rubric = K.rubric

KEMPT = K.KEMPT
RESULTS = os.path.join(KEMPT, "extraction-test/results")
SCHEMA = json.load(open(os.path.join(KEMPT, "extraction-test/schema.json")))
GP = SCHEMA["properties"]["garments"]["items"]["properties"]
ENUM = {k: v["enum"] for k, v in GP.items() if "enum" in v}
TEST_STYLES = [["minimalist", 0.5], ["smart_casual", 0.5]]
OCCASIONS = list(rubric.OCCASION_TARGET) + ["brunch"]          # "brunch" = unknown key -> default (2, 3)
STYLE_MIXES = [
    [["smart_casual", 0.5], ["workwear", 0.5]],
    [["streetwear", 0.6], ["vintage_sport", 0.4]],
    [],
    [["preppy", 0.5], ["old_money", 0.3], ["not_a_style", 0.2]],   # unknown key counts in tot_w, not in the band
    [["gorpcore", 1.0], ["streetwear", 1.0], ["minimalist", 1.0]],  # weights that don't sum to 1
    [["streetwear", 1.0]],
    [["workwear", 0.34], ["vintage_sport", 0.33], ["minimalist", 0.33]],
]
BOLD = ["a_little", "bold", "subtle"]


def canon(r):
    return json.dumps({"scene": r.get("scene"), "garments": r.get("garments")}, sort_keys=True, separators=(",", ":"))


def G(cat, sub, color, **kw):
    return K.G(cat, sub, color, **kw)


SCENE = {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good", "clothed": "fully"}


def R(*garments, **scene):
    s = dict(SCENE); s.update(scene)
    return {"scene": s, "garments": list(garments)}


TEE = lambda **kw: G("top", "tee", "white", **{"tucked": "none", "length": "at_belt", **kw})
JEANS = lambda **kw: G("bottom", "jeans", "denim_mid", **{"leg_shape": "straight", "hem": "slight_break", **kw})
SNK = lambda **kw: G("footwear", kw.pop("sub", "canvas_sneaker"), kw.pop("color", "white"), **kw)


def edge_cases():
    E = []
    add = lambda name, r, occ=None, styles=None, bold=None: E.append((name, r, occ, styles, bold))
    add("not_fully_clothed", R(TEE(), JEANS(), SNK(), clothed="partial"))
    add("nothing_readable_unsure", R(TEE(certainty="unsure"), JEANS(certainty="unsure")))
    add("nothing_readable_only_accessories", R(G("accessory", "watch", "black"), G("accessory", "hat", "red", saturation="bright")))
    add("no_scene_keys", {"scene": {"clothed": "fully"}, "garments": [TEE(), JEANS(), SNK()]})
    add("upper_only", R(TEE(), JEANS(hem="pooling"), SNK(), framing="upper_only", shoes_visible=False))
    add("upper_only_shoes_flag_true", R(TEE(), JEANS(), SNK(), framing="upper_only"))
    add("traditional", R(G("traditional", "other", "white"), JEANS(), SNK()))
    add("traditional_only", R(G("traditional", "other", "white")))
    add("leg_alias_flare", R(TEE(), JEANS(leg_shape="flare_bootcut"), SNK()))
    add("leg_alias_barrel", R(TEE(volume=4), JEANS(leg_shape="barrel"), SNK()), styles=[])
    add("F4_pooling", R(TEE(), JEANS(hem="pooling"), SNK()))
    add("F4_pooling_street_relaxed_zero", R(TEE(), JEANS(hem="pooling", leg_shape="relaxed"), SNK()), styles=[["streetwear", 1.0]])
    add("F4_pooling_street_slim_half", R(TEE(), JEANS(hem="pooling", leg_shape="slim"), SNK()), styles=[["streetwear", 1.0]])
    add("F4b", R(TEE(), JEANS(hem="full_break", leg_shape="skinny"), SNK()))
    add("F4b_likely_skip", R(TEE(), JEANS(hem="full_break", leg_shape="slim", certainty="likely"), SNK()))
    add("F7_cap", R(TEE(condition="stained"), JEANS(condition="wrinkled"), SNK(condition="pilled_or_worn"), G("outerwear", "overshirt", "navy", condition="wrinkled")))
    add("F7_street_shoes_half", R(TEE(), JEANS(), SNK(condition="pilled_or_worn")), styles=[["workwear", 0.5], ["streetwear", 0.5]])
    add("F7_distressed_skip", R(TEE(), JEANS(condition="pilled_or_worn", distressed_by_design=True), SNK()))
    add("F7_stained_likely_skip", R(TEE(condition="stained", certainty="likely"), JEANS(), SNK()))
    add("F6", R(TEE(length="below_crotch"), JEANS(), SNK()))
    add("F6_volume_missing", R({**TEE(length="below_crotch"), "volume": None}, JEANS(), SNK()))
    add("F6_tucked_missing", R({k: v for k, v in TEE(length="below_crotch").items() if k != "tucked"}, JEANS(), SNK()))
    add("F8", R(TEE(volume=5, sleeve_end="covers_hand"), JEANS(), SNK()))
    add("F9_street_hoodie", R(G("top", "hoodie", "grey", sleeve_end="covers_hand", tucked="none", length="mid_fly"), JEANS(), SNK()), styles=[["streetwear", 1.0]])
    add("F9_outer", R(TEE(), G("outerwear", "bomber", "black", sleeve_end="covers_hand"), JEANS(), SNK()))
    add("F10", R(TEE(strain="clear"), JEANS(), SNK()))
    add("T1_blazer", R(G("top", "dress_shirt", "white", tucked="none", length="mid_fly"), G("outerwear", "blazer", "navy"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SNK(sub="loafer", color="brown")))
    add("T1_occasion", R(G("top", "dress_shirt", "white", tucked="none"), JEANS(), SNK()), occ="interview")
    add("T1_tucked_missing", R({k: v for k, v in G("top", "dress_shirt", "white").items() if k != "tucked"}, G("bottom", "trousers", "grey", leg_shape="straight"), SNK(sub="derby", color="black")))
    add("P1_top_fractional", R(TEE(volume=4), JEANS(), SNK()), styles=[["smart_casual", 0.5], ["workwear", 0.5]])
    add("P1_leg_skinny", R(TEE(), JEANS(leg_shape="skinny"), SNK()))
    add("P2", R(TEE(volume=4), JEANS(leg_shape="skinny"), SNK()))
    add("P3", R(TEE(volume=5), JEANS(leg_shape="wide"), SNK()))
    add("L1", R(TEE(shows_below_outer=True), G("outerwear", "sport_coat", "grey"), G("bottom", "trousers", "navy", leg_shape="straight"), SNK(sub="derby", color="brown")))
    add("S1", R(TEE(), JEANS(leg_shape="slim"), SNK(sub="chunky_sneaker")))
    add("rule_of_thirds_tip", R(TEE(length="mid_fly"), JEANS(), SNK()))
    add("C1a", R(G("top", "tee", "red", saturation="bright"), G("bottom", "chinos", "green", leg_shape="straight"), SNK(color="blue"), G("outerwear", "bomber", "yellow")))
    add("C1a_muted_half", R(G("top", "tee", "burgundy"), G("bottom", "chinos", "sage", leg_shape="straight"), SNK(color="orange"), G("outerwear", "bomber", "purple")))
    add("C1b", R(G("top", "tee", "white"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SNK(color="black"), G("outerwear", "bomber", "orange"), G("top", "tee", "pink")))
    add("C3_bright_clash", R(G("top", "tee", "red"), G("bottom", "chinos", "yellow", leg_shape="straight"), SNK()))
    add("C3_bold_half", R(G("top", "tee", "red"), G("bottom", "chinos", "yellow", leg_shape="straight"), SNK()), bold="bold")
    add("C3_one_main_plus_shoe_no_fire", R(G("top", "tee", "red"), JEANS(), SNK(color="green", saturation="bright")))
    add("C3_red_muted_not_bright", R(G("top", "tee", "red", saturation="muted"), G("bottom", "chinos", "orange", saturation="muted", leg_shape="straight"), SNK()))
    add("C4a_same_scale", R(G("top", "flannel_shirt", "red", pattern="checks_plaid", pattern_scale="medium"), G("outerwear", "overshirt", "navy", pattern="checks_plaid", pattern_scale="medium"), JEANS(), SNK()))
    add("C4a_type_only", R(G("top", "tee", "white", pattern="stripes", pattern_scale="na"), G("outerwear", "overshirt", "navy", pattern="stripes", pattern_scale="na"), JEANS(), SNK()))
    add("C4b", R(G("top", "tee", "white", pattern="graphic"), G("outerwear", "overshirt", "navy", pattern="checks_plaid", pattern_scale="small"), G("bottom", "cargos", "olive", pattern="camo", leg_shape="relaxed"), SNK()))
    add("B1_focal", R(G("top", "tee", "white", pattern="floral"), G("outerwear", "bomber", "orange"), G("bottom", "chinos", "pink", leg_shape="straight"), SNK()), bold="subtle")
    add("C5_near_match", R(TEE(), G("outerwear", "blazer", "navy"), G("bottom", "trousers", "black", leg_shape="straight"), SNK(sub="derby", color="black")))
    add("tonal_tip", R(G("top", "tee", "black"), G("bottom", "jeans", "black", leg_shape="straight"), SNK(color="black")))
    add("O1_too_casual_interview", R(G("top", "tank_top", "white", tucked="none"), G("bottom", "athletic_shorts", "black"), SNK(sub="slides_sandals", color="black")), occ="interview_corporate")
    add("O1_too_formal", R(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "charcoal"), G("bottom", "suit_trousers", "charcoal", leg_shape="straight"), SNK(sub="dress_shoe", color="black")), occ="gym")
    add("O1_boundary_no_fire", R(G("top", "tee", "white", tucked="none"), G("bottom", "joggers", "grey")), occ="everyday")
    add("O4_lounge", R(G("top", "hoodie", "grey", tucked="none"), G("bottom", "sweatpants", "grey"), SNK()))
    add("O4_lounge_vintage_exempt", R(G("top", "hoodie", "grey", tucked="none"), G("bottom", "sweatpants", "grey"), SNK()), styles=[["vintage_sport", 1.0]])
    add("S2", R(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "navy"), G("bottom", "suit_trousers", "navy", leg_shape="straight"), SNK(sub="performance_runner")), occ="event")
    add("S2_white_leather_exempt", R(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "navy"), G("bottom", "suit_trousers", "navy", leg_shape="straight"), SNK(sub="white_leather_sneaker")), occ="event")
    add("O3_large_logo_work", R(TEE(logo="large"), JEANS(), SNK()), occ="work_casual")
    add("O3_large_logo_likely_tip", R(TEE(logo="large", certainty="likely"), JEANS(), SNK()), occ="interview")
    add("O3_large_logo_everyday_tip", R(TEE(logo="large"), JEANS(), SNK()))
    add("belt_tip_dressy", R(G("top", "oxford_shirt", "light_blue", tucked="full"), G("bottom", "chinos", "navy", leg_shape="straight"), SNK(sub="loafer", color="brown")), occ="work")
    add("next_level_subtle_none", R(TEE(), JEANS(), SNK()), bold="subtle")
    add("dark_jeans_2_5", R(TEE(), JEANS(color_family="denim_dark"), SNK(sub="low_profile_sneaker", color="white")))
    add("dark_jeans_distressed_2", R(TEE(), JEANS(color_family="denim_dark", distressed_by_design=True), SNK(sub="low_profile_sneaker", color="white")))
    add("unknown_subcategory_and_color", R(G("top", "kimono_wrap", "teal"), JEANS(), SNK()))
    add("missing_color_and_pattern", R({k: v for k, v in TEE().items() if k not in ("color_family", "pattern")}, JEANS(), SNK()))
    add("multicolor", R(G("top", "tee", "multicolor"), JEANS(), SNK(color="multicolor")))
    add("max_credits_9_5", R(G("top", "oxford_shirt", "light_blue", tucked="full"), G("outerwear", "chore_coat", "green", saturation="bright"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SNK(sub="suede_chukka", color="brown")))
    add("partial_scaling_shoes_hidden", R(G("top", "sweater", "navy", tucked="none"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), shoes_visible=False))
    add("clamp_min_3", R(G("top", "tank_top", "red", strain="clear", condition="stained", volume=5, length="below_crotch", sleeve_end="covers_hand"),
                          G("bottom", "athletic_shorts", "yellow", hem="pooling", leg_shape="skinny", condition="wrinkled"),
                          SNK(sub="slides_sandals", color="pink"), G("outerwear", "puffer", "orange", pattern="camo"), G("top", "graphic_tee", "purple", pattern="floral")), occ="interview_corporate", bold="subtle")
    add("second_top_ignored", R(G("top", "tee", "white"), G("top", "hoodie", "grey", volume=5, length="below_crotch"), JEANS(), SNK()))
    return E


def fuzz(n, seed=20261006):
    rnd = random.Random(seed)
    SUBS = {"top": ["tee", "graphic_tee", "polo", "knit_polo", "oxford_shirt", "dress_shirt", "flannel_shirt", "sweater", "hoodie", "sweatshirt",
                    "quarter_zip", "tank_top", "jersey", "cardigan", "rugby_shirt", "camp_collar_shirt"],
            "outerwear": ["overshirt", "blazer", "suit_jacket", "denim_jacket", "bomber", "chore_coat", "field_jacket", "puffer", "overcoat",
                          "rain_jacket", "unstructured_blazer", "sport_coat", "leather_jacket", "fleece", "shell_jacket"],
            "bottom": ["jeans", "chinos", "trousers", "drawstring_trousers", "suit_trousers", "cargos", "joggers", "sweatpants", "shorts", "athletic_shorts"],
            "footwear": ["white_leather_sneaker", "canvas_sneaker", "retro_runner", "performance_runner", "chunky_sneaker", "basketball_sneaker",
                         "loafer", "dress_shoe", "chelsea_boot", "work_boot", "slides_sandals", "low_profile_sneaker", "suede_chukka", "derby"],
            "accessory": ["belt", "hat", "bag", "watch"], "traditional": ["other"]}
    W = lambda opts, w: rnd.choices(opts, weights=w)[0]
    out = []
    for _ in range(n):
        scene = {"framing": W(["full_body", "three_quarter", "upper_only"], [70, 20, 10]), "shoes_visible": rnd.random() < 0.8,
                 "people_count": 1, "mirror_selfie": rnd.random() < 0.3, "lighting": W(["good", "dim", "harsh"], [80, 15, 5]),
                 "clothed": W(["fully", "partial"], [97, 3])}
        cats = []
        if rnd.random() < 0.92: cats.append("top")
        if rnd.random() < 0.15: cats.append("top")
        cats += ["outerwear"] * W([0, 1, 2], [50, 42, 8])
        if rnd.random() < 0.92: cats.append("bottom")
        if rnd.random() < 0.85: cats.append("footwear")
        if rnd.random() < 0.3: cats.append("accessory")
        if rnd.random() < 0.03: cats.append("traditional")
        rnd.shuffle(cats) if rnd.random() < 0.3 else None
        gs = []
        for c in cats:
            sub = rnd.choice(SUBS[c]) if rnd.random() < 0.93 else rnd.choice(ENUM["subcategory"])
            g = {"category": c, "subcategory": sub,
                 "color_family": W(ENUM["color_family"], [6 if x in rubric.NEUTRALS else 2 for x in ENUM["color_family"]]),
                 "pattern": W(ENUM["pattern"], [70, 6, 6, 6, 3, 3, 6]), "logo": W(ENUM["logo"], [70, 20, 10]),
                 "volume": W([1, 2, 3, 4, 5], [5, 25, 45, 18, 7]),
                 "leg_shape": W(ENUM["leg_shape"], [2, 6, 25, 30, 20, 10, 4, 3]) if c == "bottom" else "na",
                 "hem": W(ENUM["hem"], [2, 15, 15, 35, 15, 10, 8]) if c == "bottom" else "na",
                 "tucked": W(["none", "half", "full", "na"], [60, 10, 20, 10]) if c == "top" else "na",
                 "condition": W(ENUM["condition"], [80, 12, 3, 5]), "certainty": W(ENUM["certainty"], [70, 25, 5]),
                 "length": W(ENUM["length"], [10, 5, 30, 45, 10]) if c in ("top", "outerwear") else "na",
                 "pattern_scale": W(ENUM["pattern_scale"], [55, 15, 20, 10]), "saturation": W(ENUM["saturation"], [60, 25, 15]),
                 "sleeve_end": W(ENUM["sleeve_end"], [25, 15, 50, 10]), "strain": W(ENUM["strain"], [85, 10, 5]),
                 "distressed_by_design": rnd.random() < 0.07, "shows_below_outer": rnd.random() < 0.08}
            r = rnd.random()
            if r < 0.04:
                del g[rnd.choice([k for k in g if k not in ("category",)])]      # missing key -> .get() defaults
            elif r < 0.06:
                g["volume"] = None
            gs.append(g)
        out.append({"scene": scene, "garments": gs})
    return out


def expected(reading, occ, styles, bold):
    s = K.score(reading, occ, styles, bold)
    keep = ("overall", "reason", "partial", "rules_fired", "raw_score", "raw_unrounded", "subscores", "occasion_adj", "credits",
            "credit_points", "credit_unrounded", "mistake_points", "mistakes_unrounded", "advice", "not_rated")
    return {k: s[k] for k in keep if k in s}


def main():
    readings, prov, order = {}, {}, []

    def put(r, source, base_cfg=None):
        key = canon(r)
        if key not in readings:
            rid = "r" + hashlib.sha256(key.encode()).hexdigest()[:12]
            readings[key] = (rid, {"scene": r.get("scene"), "garments": r.get("garments")})
            prov[rid] = {"sources": [], "base_cfgs": []}
            order.append(key)
        rid = readings[key][0]
        if base_cfg and base_cfg not in prov[rid]["base_cfgs"]:
            prov[rid]["base_cfgs"].append(base_cfg)
        if len(prov[rid]["sources"]) < 5:
            prov[rid]["sources"].append(source)
        return rid

    n_real = 0
    fixes_occ = {}
    for fx in glob.glob(os.path.join(KEMPT, "inputs/*/fixes.csv")):
        for line in open(fx).read().splitlines()[1:]:
            parts = line.split(",")
            if len(parts) >= 3 and parts[2]:
                fixes_occ[parts[0]] = parts[2]
    for f in sorted(glob.glob(os.path.join(RESULTS, "**/raw_results.json"), recursive=True)):
        rel = os.path.relpath(f, RESULTS)
        for x in json.load(open(f)):
            if not x.get("extraction"):
                continue
            n_real += 1
            put(x["extraction"], f"{rel}:{x['outfit']}/{x['stage']}/run{x['run']}", {"occasion": fixes_occ.get(x["outfit"], "everyday"), "styles": TEST_STYLES, "boldness": "a_little"})
    n_unique_real = len(readings)
    for p in sorted(glob.glob(os.path.join(HERE, "readings/*.json")) + glob.glob(os.path.join(HERE, "readings/variants/*.json"))):
        if p.endswith("INDEX.json"):
            continue
        put(json.load(open(p)), "demo:" + os.path.relpath(p, HERE), {"occasion": "date" if "p01" in p else "everyday", "styles": STYLE_MIXES[0], "boldness": "a_little"})
    edge_cfg = {}
    for name, r, occ, styles, bold in edge_cases():
        rid = put(r, "edge:" + name, {"occasion": occ or "everyday", "styles": styles if styles is not None else TEST_STYLES, "boldness": bold or "a_little"})
        edge_cfg[rid] = True
    n_before_fuzz = len(readings)
    for i, r in enumerate(fuzz(900)):
        put(r, f"fuzz:{i}", None)

    cases = []
    for i, key in enumerate(order):
        rid, r = readings[key]
        cfgs = [(b["occasion"], b["styles"], b["boldness"]) for b in prov[rid]["base_cfgs"]]
        while len(cfgs) < 3:
            j = i * 3 + len(cfgs)
            cfgs.append((OCCASIONS[j % len(OCCASIONS)], STYLE_MIXES[j % len(STYLE_MIXES)], BOLD[j % len(BOLD)]))
        for occ, styles, bold in cfgs:
            e = expected(r, occ, styles, bold)
            case = {"reading": rid, "occasion": occ, "styles": styles, "boldness": bold, "expected": e}
            ru = e.get("raw_unrounded")
            if ru is not None:
                y = ru * 2 + 0.5
                if abs(y - round(y)) < 1e-9 and y != round(y):
                    case["fp_boundary"] = "below" if y < round(y) else "above"   # display flips if Swift's float differs by 1 ulp
            cases.append(case)

    cov = Counter()
    for c in cases:
        for rule in c["expected"].get("rules_fired", []):
            cov[rule] += 1
        for cr in c["expected"].get("credits", []):
            cov[cr] += 1
        if c["expected"]["overall"] is None:
            cov["(none) " + c["expected"]["reason"]] += 1
        for a in c["expected"].get("advice", []):
            cov["advice: " + a.split(":")[0] + ": " + a.split(":")[1][:28].strip()] += 1
    overall = Counter(c["expected"]["overall"] for c in cases)
    fpb = Counter(c.get("fp_boundary") for c in cases if c.get("fp_boundary"))
    all_rules = ["F4_pooling", "F4b_full_break_narrow_leg", "F7_care", "F6_top_too_long", "F8_too_big", "F9_sleeves_cover_hands", "F10_visible_strain",
                 "T1_dress_shirt_untucked", "P1_top_volume_vs_style", "P1_leg_vs_style", "P2_big_top_skinny_leg", "P3_everything_oversized",
                 "L1_shirt_hangs_below_blazer", "S1_bulky_shoe_narrow_leg", "C1a_too_many_accent_colors", "C1b_too_many_colors", "C3_bright_clash",
                 "C4a_same_pattern_same_scale", "C4a_same_pattern_type", "C4b_three_plus_patterns", "B1_too_many_focal_points",
                 "C5_near_match_jacket_trousers", "O1_too_casual", "O1_too_formal", "O4_loungewear_out", "S2_shoes_too_casual_for_outfit",
                 "O3_large_logo", "K1_layered", "K2_elevated_piece", "K3_point_of_interest", "K4_shoes_complement"]
    missing = [r for r in all_rules if cov[r] == 0]
    assert not missing, f"rules never fired in parity set: {missing}"

    out = {
        "_doc": "Rubric parity fixtures. For each case: score(readings[reading], occasion, styles, boldness) in Swift must equal `expected`: "
                "overall, reason, partial, rules_fired (same order), credits (same order), subscores, occasion_adj, advice (same strings, same order), "
                "not_rated exactly; raw_unrounded / credit_unrounded / mistakes_unrounded exactly as Double (tolerance 1e-9 allowed); "
                "raw_score / credit_points / mistake_points are Python round(x, 3/2/2) values, compare within 0.0005/0.005. "
                "styles are ordered [name, weight] pairs: iterate them in this order. Readings may lack keys or carry unknown values on purpose.",
        "rubric_sha256": hashlib.sha256(open(os.path.join(KEMPT, "extraction-test/rubric.py"), "rb").read()).hexdigest(),
        "counts": {"real_runs_read": n_real, "unique_real_readings": n_unique_real, "demo_and_edge_readings": n_before_fuzz - n_unique_real,
                   "fuzz_readings": len(readings) - n_before_fuzz, "readings": len(readings), "cases": len(cases),
                   "fp_boundary_cases": dict(fpb)},
        "coverage": dict(sorted(cov.items())), "overall_histogram": {str(k): v for k, v in sorted(overall.items(), key=lambda t: (t[0] is None, t[0] or 0))},
        "provenance": {rid: prov[rid]["sources"] for _, (rid, _) in readings.items()},
        "readings": {rid: r for _, (rid, r) in readings.items()},
        "cases": cases,
    }
    path = os.path.join(HERE, "rubric_parity.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(json.dumps(out["counts"]))
    print("file size MB:", round(os.path.getsize(path) / 1e6, 2))
    print("overall histogram:", out["overall_histogram"])
    print("coverage (cases where each fired):")
    for k, v in sorted(cov.items(), key=lambda t: t[0]):
        print(f"   {v:6d}  {k}")


if __name__ == "__main__":
    main()
