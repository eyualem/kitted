#!/usr/bin/env python3
"""Gold set, step 3 helper (#227): which reading facts the panel cares about and the engine doesn't. TUNE half only.

  /usr/bin/python3 gold_features.py [engine]

For each candidate fact (code over the existing reading fields, nothing new asked of the AI): how many tune photos
have it on run 0, how often it holds on run 1 too (steadiness), the panel's mean, and the panel − app gap
(positive = the app is too harsh on photos with it). A fact worth a rule has a large gap, enough photos, and holds
across the two runs. Rule 7: profile unknown, the test profile, Everyday.
"""
import statistics as st
import sys

sys.dont_write_bytecode = True
import gold_tune as G  # noqa: E402
R, P = G.R, G.P


def gs(rd):
    return R.scored_garments(rd)


def first(rd, cat):
    return next((g for g in gs(rd) if g.get("category") == cat), None)


def tops(rd):
    return [g for g in gs(rd) if g.get("category") == "top"]


def outer(rd):
    return first(rd, "outerwear")


def bottom(rd):
    return first(rd, "bottom")


def shoes(rd):
    return first(rd, "footwear")


def leg(rd):
    b = bottom(rd)
    return b.get("leg_shape") if b else None


def det(rd):
    return R.detect_styles(gs(rd), {})["detected"]


FEATS = {
    "leg skinny": lambda r: leg(r) == "skinny",
    "leg slim": lambda r: leg(r) == "slim",
    "leg skinny or slim": lambda r: leg(r) in ("skinny", "slim"),
    "leg straight": lambda r: leg(r) == "straight",
    "leg wide": lambda r: leg(r) == "wide",
    "leg relaxed": lambda r: leg(r) == "relaxed",
    "bottom volume >=4": lambda r: bool(bottom(r)) and (bottom(r).get("volume") or 3) >= 4,
    "bottom volume <=2": lambda r: bool(bottom(r)) and (bottom(r).get("volume") or 3) <= 2,
    "jeans distressed": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") == "jeans" and bool(bottom(r).get("distressed_by_design")),
    "jeans distressed + narrow": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") == "jeans" and bool(bottom(r).get("distressed_by_design")) and leg(r) in ("skinny", "slim"),
    "no style detected": lambda r: not det(r),
    "tank top": lambda r: any(g.get("subcategory") == "tank_top" for g in tops(r)),
    "graphic tee, no layer": lambda r: any(g.get("subcategory") == "graphic_tee" for g in tops(r)) and outer(r) is None,
    "large logo": lambda r: any(g.get("logo") == "large" for g in gs(r) if g.get("category") != "footwear"),
    "bright top or outer": lambda r: any(R.is_bright(g) for g in gs(r) if g.get("category") in ("top", "outerwear")),
    "bright bottom": lambda r: bool(bottom(r)) and R.is_bright(bottom(r)),
    "large pattern": lambda r: any(g.get("pattern_scale") == "large" for g in gs(r) if g.get("category") != "footwear"),
    "pattern medium/large non-graphic": lambda r: any(g.get("pattern") not in (None, "solid", "graphic") and g.get("pattern_scale") in ("medium", "large") for g in gs(r) if g.get("category") != "footwear"),
    "top short (cropped/at_belt), no layer": lambda r: bool(tops(r)) and outer(r) is None and tops(r)[0].get("length") in ("cropped", "at_belt"),
    "top short over wide/relaxed": lambda r: bool(tops(r)) and outer(r) is None and tops(r)[0].get("length") in ("cropped", "at_belt") and leg(r) in ("wide", "relaxed"),
    "top mid_fly untucked, no layer": lambda r: bool(tops(r)) and outer(r) is None and tops(r)[0].get("length") == "mid_fly" and tops(r)[0].get("tucked") in ("none", None),
    "top tucked full": lambda r: bool(tops(r)) and tops(r)[0].get("tucked") == "full",
    "tucked + straight leg": lambda r: bool(tops(r)) and tops(r)[0].get("tucked") == "full" and leg(r) == "straight",
    "tucked + wide leg": lambda r: bool(tops(r)) and tops(r)[0].get("tucked") == "full" and leg(r) in ("wide", "relaxed"),
    "top volume >=4": lambda r: any((g.get("volume") or 3) >= 4 for g in tops(r)),
    "top volume <=2": lambda r: any((g.get("volume") or 3) <= 2 for g in tops(r)),
    "strain some/clear top": lambda r: any(g.get("strain") in ("some", "clear") for g in tops(r)),
    "strain some/clear bottom": lambda r: bool(bottom(r)) and bottom(r).get("strain") in ("some", "clear"),
    "covers_hand roomy (FF5)": lambda r: any(g.get("sleeve_end") == "covers_hand" and (g.get("volume") or 3) >= 4 for g in gs(r) if g.get("category") in ("top", "outerwear")),
    "hem pooling": lambda r: bool(bottom(r)) and bottom(r).get("hem") == "pooling",
    "hem pooling + wide": lambda r: bool(bottom(r)) and bottom(r).get("hem") == "pooling" and leg(r) in ("wide", "relaxed"),
    "hem full_break": lambda r: bool(bottom(r)) and bottom(r).get("hem") == "full_break",
    "hem full_break + narrow": lambda r: bool(bottom(r)) and bottom(r).get("hem") == "full_break" and leg(r) in ("skinny", "slim"),
    "slides": lambda r: bool(shoes(r)) and shoes(r).get("subcategory") == "slides_sandals",
    "runner": lambda r: bool(shoes(r)) and shoes(r).get("subcategory") == "performance_runner",
    "loafer/dress/derby": lambda r: bool(shoes(r)) and shoes(r).get("subcategory") in ("loafer", "dress_shoe", "derby"),
    "dress shoe + wide": lambda r: bool(shoes(r)) and shoes(r).get("subcategory") in ("loafer", "dress_shoe", "derby") and leg(r) == "wide",
    "worn shoes": lambda r: bool(shoes(r)) and shoes(r).get("condition") == "pilled_or_worn",
    "any wrinkled clothes": lambda r: any(g.get("condition") == "wrinkled" for g in gs(r) if g.get("category") != "footwear"),
    "shorts": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") in ("shorts", "athletic_shorts"),
    "lounge bottoms": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") in R.LOUNGE_BOTTOMS,
    "dress shirt, no layer": lambda r: bool(tops(r)) and outer(r) is None and tops(r)[0].get("subcategory") == "dress_shirt",
    "tailored outer": lambda r: bool(outer(r)) and outer(r).get("subcategory") in P.TAILORED,
    "suit": lambda r: {"suit_jacket", "suit_trousers"} <= {g.get("subcategory") for g in gs(r)},
    "two tops (layered under)": lambda r: len(tops(r)) >= 2,
    "outer layer": lambda r: outer(r) is not None,
    "all neutrals": lambda r: all(g.get("color_family") in R.NEUTRALS for g in gs(r) if g.get("category") in ("top", "outerwear", "bottom")),
    "chinos": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") == "chinos",
    "trousers": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") == "trousers",
    "jeans": lambda r: bool(bottom(r)) and bottom(r).get("subcategory") == "jeans",
    "mirror": lambda r: bool(r.get("scene", {}).get("mirror_selfie")),
    "label prep": lambda r: "classic_prep" in det(r),
    "label smart casual": lambda r: "smart_casual" in det(r),
    "label minimal": lambda r: "minimalist" in det(r),
    "label streetwear": lambda r: "streetwear" in det(r),
    "label workwear": lambda r: "workwear" in det(r),
}


def main(engine="v7"):
    D = G.load()
    sp = G.get_split()
    ps = [p for p in sp["tune"] if p in D["panel"]]
    S = G.score_all(D, ps, engine)
    ps = [p for p in ps if S[p][0]["overall"] is not None]
    gap = {p: D["panel_raw"][p] - S[p][0]["raw_score"] for p in ps}
    base = st.mean(gap.values())
    print(f"TUNE half n {len(ps)} · engine {engine} · mean panel − app (raw) {base:+.2f}\n")
    print(f"{'fact':40s} {'n':>4s} {'holds':>6s} {'panel':>6s} {'gap':>6s} {'gap-others':>10s}  by source (n, gap)")
    rows = []
    for name, f in FEATS.items():
        on = [p for p in ps if f(D["runs"][p][0])]
        if len(on) < 4:
            continue
        holds = sum(1 for p in on if len(D["runs"][p]) > 1 and f(D["runs"][p][1])) / len(on)
        off = [p for p in ps if p not in on]
        g_on = st.mean(gap[p] for p in on)
        g_off = st.mean(gap[p] for p in off) if off else 0
        src = " ".join(f"{s}:{len(x)},{st.mean(gap[p] for p in x):+.1f}" for s in ("ig", "pin", "rd")
                       for x in [[p for p in on if p.startswith(s)]] if x)
        rows.append((g_on - g_off, name, len(on), holds, st.mean(D["panel"][p] for p in on), g_on, src))
    for d, name, n, h, pan, g, src in sorted(rows):
        print(f"{name:40s} {n:4d} {100 * h:5.0f}% {pan:6.2f} {g:+6.2f} {d:+10.2f}  {src}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "v7")
