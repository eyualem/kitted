#!/usr/bin/env python3
"""His taste patterns and his own consistency, from every blind rating with a reading (T68 round 3, Nov 16, $0).

The founder (Nov 16): "Detect patterns and refactor my scores. Let them stay consistent with my taste ... Add those new
rules to the [rater], and then we can run the test again." His ratings are taste and may fluctuate (Nov 16), so:
patterns are reported with their counts and a confidence, never fitted to single photos; inconsistencies go to a blind
re-rate sheet for him to settle, never edited here; his ratings.csv is never written.

  KITTED_DATA=<main checkout> /usr/bin/python3 taste_patterns.py      -> results/taste1/patterns.txt, flags.json

Pool: his first 20 + 144 of the 150 (sheet 1 on the stored Oct 12 gold readings, sheet 2 and the new 20 on the Nov 16
reading), first reading, cool day, Everyday, the test profile (rule 6: every photo is "profile unknown").
Each pattern: his mean with and without; the gap "his - v16" with and without (where his taste departs from today's
rules: that's what a new rule would have to add); a confidence from Welch's t on his scores (high |t| >= 3 and n >= 10,
medium |t| >= 2 and n >= 5, else low).
"""
import json
import math
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

OUT = HERE / "results" / "taste1"
CLOTHES = ("top", "outerwear", "bottom")
BRIGHT_SAT = ("bright", "vivid", "high")


def welch(a, b):
    if len(a) < 2 or len(b) < 2:
        return 0.0
    va, vb = st.variance(a), st.variance(b)
    se = math.sqrt(va / len(a) + vb / len(b)) or 1e-9
    return (st.mean(a) - st.mean(b)) / se


def conf(t, n):
    return "high" if abs(t) >= 3 and n >= 10 else "medium" if abs(t) >= 2 and n >= 5 else "low"


def gs(rd, *cats):
    return [g for g in rd.get("garments", []) if g.get("category") in cats]


def features(rd, lk, r16):
    """Plain yes/no facts about one outfit, from the reading (and the second look where there is one)."""
    f = {}
    tops, outs, bots, shoes = gs(rd, "top"), gs(rd, "outerwear"), gs(rd, "bottom"), gs(rd, "footwear")
    B = bots[0] if bots else {}
    sub, leg = B.get("subcategory"), B.get("leg_shape")
    f["slim or skinny legs"] = leg in ("slim", "skinny")
    f["skinny legs"] = leg == "skinny"
    f["straight legs"] = leg == "straight"
    f["wide or relaxed legs"] = leg in R.LOOSE
    f["the pants read as pulling (strain)"] = B.get("strain") in ("some", "clear")
    f["shorts"] = sub in P.SHORTS
    f["joggers, sweats or track pants"] = sub in R.LOUNGE_BOTTOMS and sub not in P.SHORTS
    f["cargos"] = sub == "cargos"
    f["jeans"] = sub == "jeans"
    f["trousers or chinos"] = sub in ("trousers", "chinos", "suit_trousers", "drawstring_trousers")
    up = tops + outs
    f["a top reads long (below the crotch)"] = any(g.get("length") == "below_crotch" for g in tops)
    f["a big top (volume 4-5)"] = any((g.get("volume") or 3) >= 4 for g in tops)
    f["a big outer layer (volume 4-5)"] = any((g.get("volume") or 3) >= 4 for g in outs)
    f["a top tucked"] = any(g.get("tucked") in ("full", "front", "half") for g in tops)
    f["layered (an outer piece over a top)"] = bool(outs) and bool(tops)
    f["two or more layers on top"] = len(up) >= 3
    f["a single top, nothing over it"] = len(up) == 1
    cols = [g.get("color_family") for g in tops + outs + bots]
    nn = {c for c in cols if c and c not in R.NEUTRALS and not str(c).startswith("denim")}
    f["all neutrals (and denim)"] = not nn
    f["one color beside neutrals"] = len(nn) == 1
    f["two or more colors"] = len(nn) >= 2
    f["a graphic or print"] = any(g.get("pattern") not in (None, "solid", "na") for g in tops + outs + bots)
    f["a large graphic or print"] = any(g.get("pattern_scale") == "large" for g in tops + outs + bots)
    f["all black"] = bool(cols) and all(c == "black" for c in cols)
    ss = shoes[0].get("subcategory") if shoes else None
    # the reading's own footwear names (schema.json; checked against every rated photo, Nov 16)
    f["slides or sandals"] = ss == "slides_sandals"
    f["running or chunky sneakers"] = ss in ("performance_runner", "chunky_sneaker", "basketball_sneaker")
    f["retro runners"] = ss == "retro_runner"
    f["low clean sneakers"] = ss in ("low_profile_sneaker", "canvas_sneaker", "white_leather_sneaker")
    f["loafers, derbies or dress shoes"] = ss in ("loafer", "derby", "dress_shoe")
    f["boots"] = ss in ("work_boot", "chelsea_boot", "suede_chukka")
    f["chunky or running shoes under slim legs"] = f["running or chunky sneakers"] and f["slim or skinny legs"]
    f["dressy shoes with jeans or cargos"] = f["loafers, derbies or dress shoes"] and sub in ("jeans", "cargos")
    f["a blazer"] = any(g.get("subcategory") == "blazer" for g in outs)
    f["wrinkled or worn"] = any(g.get("condition") not in (None, "clean", "na") for g in tops + outs + bots)
    det = set(r16.get("detected_styles") or [])
    for sname in R.STYLE_ORDER:                                        # the detector's own names (rubric.STYLE_ORDER)
        f[f"reads {R.STYLE_NAMES[sname]}"] = sname in det
    f["reads streetwear and minimal together"] = {"streetwear", "minimalist"} <= det
    f["reads smart casual or classic prep"] = bool(det & {"smart_casual", "classic_prep"})
    f["reads no look at all"] = not det
    lifts = r16["v16"]["lifts"]
    f["no lift"] = not lifts
    f["exactly one lift"] = len(lifts) == 1
    f["two or more lifts"] = len(lifts) >= 2
    f["v16 sees nothing off, nothing chosen"] = V.why(r16) == "nothing off, nothing chosen"
    f["v16 charges a fault"] = bool(r16["v16"]["fault_drop"])
    f["mirror selfie (the photo, not the outfit)"] = bool(rd.get("scene", {}).get("mirror_selfie"))
    if lk:
        f["the hem covers most of the shoe (look L)"] = lk.get("covers_shoe") == "mostly"
        f["a top clearly shows below the outer piece (look U)"] = lk.get("under_present") == "yes" and lk.get("under_shows") == "clearly"
    return f


def signature(rd):
    """The pieces, fits and colors, for near-identical outfits."""
    return frozenset(f"{g.get('subcategory')}|{g.get('color_family')}|{g.get('leg_shape') if g.get('category') == 'bottom' else ''}"
                     for g in rd.get("garments", []) if g.get("category") in CLOTHES + ("footwear",))


def loose_sig(rd):
    """Pieces and fits without colors (a coarser 'same outfit idea')."""
    return frozenset(f"{g.get('subcategory')}|{g.get('leg_shape') if g.get('category') == 'bottom' else ''}"
                     for g in rd.get("garments", []) if g.get("category") in CLOTHES + ("footwear",))


def jacc(a, b):
    return len(a & b) / len(a | b) if a | b else 0


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    S = {}
    for k, (h, g, rd, lk) in pool.items():
        r = V.sc(rd, "everyday", V.PROFILE)
        if r["overall"] is not None:
            S[k] = r
    ks = sorted(S)
    his = {k: pool[k][0] for k in ks}
    v16 = {k: S[k]["overall"] for k in ks}
    F = {k: features(pool[k][2], pool[k][3], S[k]) for k in ks}
    say(f"His taste patterns ({len(ks)} rated photos with a reading; his mean {st.mean(his.values()):.2f}, v16 "
        f"{st.mean(v16.values()):.2f}). 'gap' = his score minus v16's: a gap that differs with and without a pattern "
        f"is taste today's rules miss.")
    say(f"{'pattern':58s} {'n':>4s}  {'his with':>8s} {'without':>8s} {'diff':>6s}  {'gap with':>8s} {'without':>8s}  conf")
    res, few = [], []
    for name in sorted({n for f in F.values() for n in f}):
        yes = [k for k in ks if F[k].get(name)]
        no = [k for k in ks if name in F[k] and not F[k][name]]
        if len(yes) < 3 or len(no) < 3:
            few.append(f"{name} ({len(yes)})")                        # printed, never dropped silently
            continue
        a, b = [his[k] for k in yes], [his[k] for k in no]
        ga, gb = [his[k] - v16[k] for k in yes], [his[k] - v16[k] for k in no]
        t = welch(a, b)
        tg = welch(ga, gb)
        res.append((name, len(yes), st.mean(a), st.mean(b), t, st.mean(ga), st.mean(gb), tg))
    for name, n, ma, mb, t, ga, gb, tg in sorted(res, key=lambda x: -abs(x[4])):
        say(f"{name:58s} {n:4d}  {ma:8.2f} {mb:8.2f} {ma - mb:+6.2f}  {ga:+8.2f} {gb:+8.2f}  {conf(t, n)}"
            f"{'' if conf(tg, n) == 'low' else f' (rules miss it: {conf(tg, n)})'}")
    say("Too few photos to compare (fewer than 3 with or without): " + (", ".join(few) or "none"))
    # his notes
    say()
    say("His notes (sheet id, his score, v16, the reading):")
    for c, (sheet, score, note, desc) in sorted(rows.items()):
        if note:
            v = f"{v16[c]:g}" if c in v16 else "not read"
            say(f"  {c} {score:g} (v16 {v}): \"{note}\"  [{desc[:80]}]")

    # ---- consistency: near-identical outfits he scored apart, and scores far from his own pattern
    say()
    sig = {k: signature(pool[k][2]) for k in ks}
    lsig = {k: loose_sig(pool[k][2]) for k in ks}
    pairs = []
    for i, a in enumerate(ks):
        for b in ks[i + 1:]:
            j = jacc(sig[a], sig[b])
            jl = jacc(lsig[a], lsig[b])
            if (j >= 0.6 or jl >= 0.75) and abs(his[a] - his[b]) >= 1.5:
                pairs.append((a, b, j, jl))
    say(f"Near-identical outfits (same pieces and fits; colors close) he scored 1.5+ apart: {len(pairs)} pairs")
    for a, b, j, jl in sorted(pairs, key=lambda x: -abs(his[x[0]] - his[x[1]])):
        say(f"  {a} {his[a]:g} vs {b} {his[b]:g}  (same pieces {jl:.2f}, with colors {j:.2f})  "
            f"{H.desc(pool[a][2])}  ||  {H.desc(pool[b][2])}")
    # leave-one-out: his own score predicted from his 6 most similar outfits
    off = []
    for k in ks:
        sims = sorted(((0.5 * jacc(lsig[k], lsig[o]) + 0.5 * jacc(sig[k], sig[o]), o) for o in ks if o != k), reverse=True)[:6]
        if not sims or sims[0][0] < 0.3:
            continue
        w = sum(s for s, _ in sims)
        pred = sum(s * his[o] for s, o in sims) / w
        if abs(his[k] - pred) >= 2.0:
            off.append((k, his[k], pred, [o for _, o in sims[:3]]))
    say(f"Scores far from his own pattern (2+ points from his 6 most similar outfits): {len(off)}")
    for k, h, p, near in sorted(off, key=lambda x: -abs(x[1] - x[2])):
        say(f"  {k} his {h:g}, his similar outfits {p:.1f}  {H.desc(pool[k][2])}  (like {', '.join(near)})")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "patterns.txt").write_text("\n".join(lines) + "\n")
    (OUT / "flags.json").write_text(json.dumps({"pairs": [[a, b] for a, b, *_ in pairs],
                                                 "off": [[k, h, round(p, 2)] for k, h, p, _ in off],
                                                 "his": his, "v16": v16, "group": {k: pool[k][1] for k in ks}}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
