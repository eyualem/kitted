#!/usr/bin/env python3
"""Checks for round 3's graded look (T68, Nov 16, $0): specs/tailored.md TL1.1-TL1.6 on the engine's tailored test,
graded_look as an argument (same photo + same look = same score), and his profile picks never moving a score."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402


def g(cat, sub, color="black", leg="na", vol=3, **k):
    d = {"category": cat, "subcategory": sub, "color_family": color, "pattern": "solid", "logo": "none", "volume": vol,
         "leg_shape": leg, "hem": "slight_break" if cat == "bottom" else "na", "tucked": "na", "condition": "clean",
         "certainty": "clear", "length": "at_belt" if cat == "top" else "na", "pattern_scale": "na", "saturation": "na",
         "sleeve_end": "na", "strain": "none", "distressed_by_design": False, "shows_below_outer": False}
    d.update(k)
    return d


def rd(*gs):
    return {"scene": {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False,
                      "lighting": "good", "clothed": "fully"}, "garments": list(gs)}


def looks(r, **kw):
    return P.score_parts(r, "everyday", {}, None, engine="v16", **kw)["v16"]["graded_look"]


CASES = [
    ("TL1.1 a charcoal suit, black derbies", rd(g("outerwear", "suit_jacket", "charcoal"), g("top", "dress_shirt", "white"),
     g("bottom", "suit_trousers", "charcoal", "straight"), g("footwear", "derby")), True),
    ("TL1.2 navy blazer, white dress shirt, grey trousers, brown loafers", rd(g("outerwear", "blazer", "navy"),
     g("top", "dress_shirt", "white"), g("bottom", "trousers", "grey", "straight"), g("footwear", "loafer", "brown")), True),
    ("TL1.3 the same with white leather sneakers", rd(g("outerwear", "blazer", "navy"), g("top", "dress_shirt", "white"),
     g("bottom", "trousers", "grey", "straight"), g("footwear", "white_leather_sneaker", "white")), True),
]
for bad in ("chunky_sneaker", "performance_runner", "slides_sandals", "work_boot"):
    CASES.append((f"TL1.3 with {bad}", rd(g("outerwear", "blazer", "navy"), g("top", "dress_shirt", "white"),
                  g("bottom", "trousers", "grey", "straight"), g("footwear", bad)), False))
CASES += [
    ("TL1.4 navy blazer, khaki chinos, loafers", rd(g("outerwear", "blazer", "navy"), g("top", "oxford_shirt", "white"),
     g("bottom", "chinos", "khaki_beige", "straight"), g("footwear", "loafer", "brown")), False),
    ("TL1.5 sweater, dress trousers, loafers (no jacket)", rd(g("top", "sweater", "grey"),
     g("bottom", "trousers", "black", "straight"), g("footwear", "loafer")), False),
    ("TL1.6 blazer with dark jeans", rd(g("outerwear", "blazer", "navy"), g("top", "tee", "white"),
     g("bottom", "jeans", "denim_dark", "straight"), g("footwear", "loafer")), False),
]
fails = 0
for name, r, want in CASES:
    got = "tailored" in looks(r)
    fails += got != want
    print(f"{'PASS' if got == want else 'FAIL'}  {name}: tailored {got} (want {want})  graded {looks(r)}")
# graded_look as an argument; picks never move a score (with the taste rules on)
T = {"taste": {"leg_wide": 0.5, "hem_plus": 0.5, "color": 0.5, "one_lift": 0.5, "long_top": 0.5, "shorts_wide": 0.5}}
wide = rd(g("top", "tee", "red"), g("bottom", "trousers", "black", "wide"), g("footwear", "loafer"))
by = {lk: P.score_parts(wide, "everyday", {}, None, engine="v16", tune=T, graded_look=lk)["overall"]
      for lk in ("streetwear", "tailored", "classic_prep", "none")}
print("graded_look moves the taste rules:", by)
same = all(P.score_parts(wide, "everyday", picks, None, engine="v16", tune=T)["overall"] ==
           P.score_parts(wide, "everyday", {}, None, engine="v16", tune=T)["overall"]
           for picks in ({"streetwear": 1.0}, {"classic_prep": 1.0}, {"minimalist": 0.5, "smart_casual": 0.5}))
print(f"{'PASS' if same else 'FAIL'}  his picks never move the score (3 pick sets, taste rules on)")
twice = P.score_parts(wide, "everyday", {}, None, engine="v16", tune=T, graded_look="streetwear")["overall"] == by["streetwear"]
print(f"{'PASS' if twice else 'FAIL'}  same photo + same graded look = same score")
fails += (not same) + (not twice)
print(f"{'ALL PASS' if not fails else f'{fails} FAIL'}")
sys.exit(1 if fails else 0)
