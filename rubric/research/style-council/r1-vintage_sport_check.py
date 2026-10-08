"""Vintage-sport advocate (round 1): re-score saved readings and the anchor outfits with
rubric.py v3.1 (now) vs r1-vintage_sport_proto.py (proposed).
Run from the repo root:  /usr/bin/python3 rubric/research/style-council/r1-vintage_sport_check.py
"""
import copy, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path[:0] = [os.path.join(ROOT, "extraction-test"), HERE]
from rubric import score as now
import importlib.util
spec = importlib.util.spec_from_file_location("proto", os.path.join(HERE, "r1-vintage_sport_proto.py"))
proto = importlib.util.module_from_spec(spec); spec.loader.exec_module(proto)
MIXES = {"default": {"minimalist": .5, "smart_casual": .5}, "none": {}, "vintage": {"vintage_sport": 1}}

def G(cat, sub, color, **kw):
    g = dict(category=cat, subcategory=sub, color_family=color, pattern="solid", logo="none", volume=3, leg_shape="na",
             hem="na", tucked="na", condition="clean", certainty="clear", length="na", pattern_scale="na", saturation="na",
             sleeve_end="na", strain="none", distressed_by_design=False, shows_below_outer=False)
    if cat == "top":
        g.update(tucked="none", length="at_belt", sleeve_end="at_wrist")
    g.update(kw); return g

def R(*gs, shoes=True):
    return {"scene": {"framing": "full_body", "shoes_visible": shoes, "people_count": 1, "mirror_selfie": True,
                      "lighting": "good", "clothed": "fully"}, "garments": list(gs)}

ANCHORS = {
 "4.0  pilled hoodie, sleeves over hands + pooling grey sweats + dirty runners": R(
     G("top", "hoodie", "grey", condition="pilled_or_worn", sleeve_end="covers_hand", volume=4, length="mid_fly"),
     G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="pooling", volume=4),
     G("footwear", "performance_runner", "white", condition="pilled_or_worn")),
 "5.0  hoodie + black sweats + slides (founder photo AS MISREAD)": R(
     G("top", "hoodie", "grey", logo="small", length="mid_fly"),
     G("bottom", "sweatpants", "black", leg_shape="wide", hem="pooling", volume=4, certainty="likely"),
     G("footwear", "slides_sandals", "black")),
 "5.5  full kit: red football shirt + gym shorts + slides": R(
     G("top", "jersey", "red", saturation="bright", logo="large", sleeve_end="na"),
     G("bottom", "athletic_shorts", "black"), G("footwear", "slides_sandals", "black")),
 "6.5  navy football shirt + black joggers + gym runners": R(
     G("top", "jersey", "navy", logo="large", sleeve_end="na"),
     G("bottom", "joggers", "black", leg_shape="straight", hem="cuffed"), G("footwear", "performance_runner", "black")),
 "7.0  grey sweatshirt + black track pants (new) + Sambas": R(
     G("top", "sweatshirt", "grey"),
     G("bottom", "track_pants", "black", leg_shape="straight", hem="slight_break"), G("footwear", "low_profile_sneaker", "black")),
 "7.5  matching navy tracksuit (new types) over white tee + Sambas": R(
     G("top", "tee", "white", sleeve_end="na"), G("outerwear", "track_jacket", "navy", logo="small"),
     G("bottom", "track_pants", "navy", leg_shape="straight", hem="slight_break"), G("footwear", "low_profile_sneaker", "white")),
 "7.5  multicolor football shirt + mid-wash relaxed jeans + Sambas": R(
     G("top", "jersey", "multicolor", logo="large", volume=4, sleeve_end="na"),
     G("bottom", "jeans", "denim_mid", leg_shape="relaxed", hem="slight_break"), G("footwear", "low_profile_sneaker", "black")),
 "8.0  bright red football shirt + light wide jeans + Sambas": R(
     G("top", "jersey", "red", saturation="bright", logo="large", volume=4, sleeve_end="na"),
     G("bottom", "jeans", "denim_light", leg_shape="wide", hem="slight_break"), G("footwear", "low_profile_sneaker", "white")),
 "8.5  forest track jacket (new) + white tee + dark straight jeans + Sambas": R(
     G("top", "tee", "white", sleeve_end="na"), G("outerwear", "track_jacket", "green", saturation="muted", logo="small"),
     G("bottom", "jeans", "denim_dark", leg_shape="straight", hem="slight_break"), G("footwear", "low_profile_sneaker", "white")),
 "8.5  quarter-zip + charcoal overcoat + grey straight sweats + retro runners": R(
     G("top", "quarter_zip", "navy"), G("outerwear", "overcoat", "charcoal", length="below_crotch"),
     G("bottom", "sweatpants", "grey", leg_shape="straight", hem="slight_break"), G("footwear", "retro_runner", "grey")),
 "9.5  red football shirt + navy unstructured blazer + dark jeans + Sambas": R(
     G("top", "jersey", "red", saturation="bright", logo="large", sleeve_end="na"), G("outerwear", "unstructured_blazer", "navy"),
     G("bottom", "jeans", "denim_dark", leg_shape="straight", hem="slight_break"), G("footwear", "low_profile_sneaker", "black")),
 "9.5  red/navy striped rugby + camel overcoat + dark jeans + Sambas": R(
     G("top", "rugby_shirt", "red", saturation="bright", pattern="stripes", pattern_scale="medium"),
     G("outerwear", "overcoat", "tan_camel", length="below_crotch"),
     G("bottom", "jeans", "denim_dark", leg_shape="straight", hem="slight_break"), G("footwear", "low_profile_sneaker", "white")),
 "look-alike: rugby + chinos + loafers (should NOT read as vintage sport)": R(
     G("top", "rugby_shirt", "navy", pattern="stripes", pattern_scale="medium"),
     G("bottom", "chinos", "khaki_beige", leg_shape="straight", hem="slight_break"), G("footwear", "loafer", "brown")),
}

def visible(e):
    g = [x for x in e["garments"] if x.get("certainty") != "unsure" and x.get("category") != "accessory"]
    if not e["scene"].get("shoes_visible", True):
        g = [x for x in g if x["category"] != "footwear"]
    return g

def line(name, e):
    out = []
    for k, m in MIXES.items():
        a = now(copy.deepcopy(e), "everyday", m); b = proto.score(copy.deepcopy(e), "everyday", m)
        out.append(f"{k} {a['overall']}->{b['overall']}")
    b = proto.score(copy.deepcopy(e), "everyday", MIXES["default"])
    return f"{name}\n    {' | '.join(out)}  detect={proto.detect_vintage_sport(visible(e))} signals={proto.intent_signals(visible(e))} proto_rules={b['rules_fired']} credits={b['credits']}"

if __name__ == "__main__":
    print("== Anchors (target score first) ==")
    for k, e in ANCHORS.items():
        print(line(k, e))
    print("\n== Saved readings whose score changes, or that are detected ==")
    rows = []
    for f in ["results/test3-stock-40-v3/raw_results.json", "results/test4-mirror-12-v3/raw_results.json"]:
        for r in json.load(open(os.path.join(ROOT, "extraction-test", f))):
            if r.get("extraction"):
                rows.append((f"{r['outfit']}/{r.get('stage', '')}{r.get('run')}", r["extraction"]))
    for p in json.load(open(os.path.join(HERE, "phone-checks-oct7.json"))):
        rows.append(("phone " + p["check"][3:11], p["reading"]))
    det = 0
    for name, e in rows:
        d = proto.detect_vintage_sport(visible(e))
        det += d[0] is not None
        changed = any(now(copy.deepcopy(e), "everyday", m)["overall"] != proto.score(copy.deepcopy(e), "everyday", m)["overall"] for m in MIXES.values())
        if changed or d[0]:
            print(line(name, e))
    print(f"\nreads as vintage sport: {det} of {len(rows)} saved readings")
