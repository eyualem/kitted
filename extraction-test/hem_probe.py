#!/usr/bin/env python3
"""Hem probe (M2, Oct 10; rubric/research/notes/hem-probe.md): can the phone tell how the pants end at the shoe
(no break / slight break / full break / stacked / pooling / cropped) with no AI, and does it beat the AI's `hem`?

  vision/build.sh                                            (builds bin/kmeasure with vision/HemProbe.swift)
  /usr/bin/python3 hem_probe.py --out results/hem1           (runs the probe on every photo, then the report)
  /usr/bin/python3 hem_probe.py --report results/hem1        (re-analyze only)
  /usr/bin/python3 hem_probe.py --only phone-d1967f ...      (run a few photos, print the numbers)

Photos, garment boxes and the AI's readings come from fit_ruler.py (the same 76 photos; s18 has two people).
Labels: hem_labels.csv (Claude subagent, Oct 10, made before the probe was written or run, blind to it and to
the AI). Measures per leg (HemProbe.swift): fold structure above the hem against mid-shin, the hem edge and any
sock/skin gap before the shoe, how much shoe shows below the hem (÷ the shoe's own width), hem spread.
"""
import argparse, csv, json, subprocess, tempfile
from collections import Counter, defaultdict
from pathlib import Path

import fit_ruler as fr

HERE = Path(__file__).resolve().parent
TOOL = HERE / "vision" / "bin" / "kmeasure"
LABELS = HERE / "hem_labels.csv"
VARIANTS = {"base": [], "again": [], "max1600": ["--max", "1600"], "crop3": ["--crop", "0.03"]}
HEAVY, LIGHT = {"full_break", "stacked", "pooling"}, {"no_break", "slight_break", "cropped"}
AI_MAP = {"cuffed": "cropped"}  # the AI's "cuffed" (joggers, rolled jeans) ends above the shoe: our "cropped"
GROUPS = {"phone": "his phone checks", "oct7": "his Oct 7 mirror photos", "mirror": "web mirror selfies", "stock": "stock photos"}


def ai_hem(j):
    for g in j.get("garments") or []:
        if g.get("category") == "bottom":
            v = g.get("hem")
            return AI_MAP.get(v, v) if v and v != "na" else None
    return None


def boxes_for(p, c1):
    return fr.pull_boxes(p["pull"], p["hash"]) if p["group"] == "phone" else c1.get(p["closet"], [])


def run_all(out: Path, variants, only=None):
    out.mkdir(parents=True, exist_ok=True)
    (out / "overlays").mkdir(exist_ok=True)
    (out / "runs").mkdir(exist_ok=True)
    c1 = fr.closet1_boxes()
    ai = fr.ai_readings()
    manifest = []
    for p in fr.photo_set():
        pid = p["id"]
        if only and pid not in only:
            continue
        boxes = boxes_for(p, c1)
        if p["group"] == "phone" and pid not in ai:
            ai[pid] = fr.pull_readings(p["pull"], p["hash"])
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(boxes, f)
        for v in variants:
            dst = out / "runs" / f"{pid}.{v}.json"
            cmd = [str(TOOL), "hems", str(p["path"]), str(dst), "--boxes", f.name] + VARIANTS[v]
            if v == "base":
                cmd += ["--overlay", str(out / "overlays" / f"{pid}.jpg")]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode:
                dst.write_text(json.dumps({"status": f"crash {r.returncode}"}))
            if v == "base":
                print(pid, r.stdout.strip())
        manifest.append({"id": pid, "group": p["group"], "boxes": len(boxes), "shoeBoxes": sum(b["category"] == "footwear" for b in boxes)})
    if not only:
        (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
        (out / "ai.json").write_text(json.dumps({k: [ai_hem(j) for j in v] for k, v in ai.items()}, indent=1))



# ---------------------------------------------------------------- per-photo numbers

BASIC = {"knee or ankle not found", "ankle at the photo's edge", "no pants on the shin", "too small", "leg bent"}
# Which gates make which measure unsure (a gate that only spoils the folds doesn't spoil the shoe cover, and back).
GATES = {
    "fold": BASIC | {"no hem edge", "fold window off his outline", "pants too dark to show folds", "hand in the region", "coat over the region", "blurry"},
    "cover": BASIC | {"no hem edge", "no shoe box", "dark on dark (pants and shoes match)", "shoe not found below the hem", "feet cut off", "blurry", "hand in the region"},
    "spread": BASIC | {"no hem edge", "hand in the region", "coat over the region"},
    "edge": BASIC | {"no hem edge", "dark on dark (pants and shoes match)", "feet cut off", "blurry", "hand in the region"},
}
FEATURES = {  # feature: (json key, gate set)
    "foldRatio": ("foldRatio", "fold"), "foldStd": ("foldStd", "fold"), "folds": ("folds", "fold"), "orientRatio": ("orientRatio", "fold"),
    "shoeVisToW": ("shoeVisToW", "cover"), "gapT": ("gapT", "cover"), "coverBox": ("coverBox", "cover"), "tHem": ("tHem", "edge"),
    "spread": ("spread", "spread"),
}
# The direction each measure was expected to go BEFORE the run (part of the hypothesis, never fit): +1 = a higher
# number means heavier (more folds, hem lower on the leg, wider at the bottom), -1 = a lower number means heavier
# (less shoe showing below the hem; a sock/skin gap means cropped, i.e. light).
DIRECTION = {"foldRatio": 1, "foldStd": 1, "folds": 1, "orientRatio": 1, "shoeVisToW": -1, "gapT": -1, "coverBox": 1, "tHem": 1, "spread": 1}


def leg_whys(leg):
    w = list(leg.get("whys") or ([leg["why"]] if leg.get("why") else []))
    return w


def value(run, feat, gates=True):
    """(photo value, reason): mean over the legs that pass this measure's gates."""
    if not run or run.get("status") != "ok":
        return None, (run or {}).get("status", "no run")
    key, gset = FEATURES[feat]
    vals, whys = [], []
    for leg in run.get("legs", []):
        bad = [w for w in leg_whys(leg) if w in GATES[gset]] if gates else []
        if feat == "spread" and gates and leg.get("spreadMerged"):
            bad.append("legs touch")
        if bad:
            whys.append(bad[0]); continue
        v = leg.get(key)
        if v is None:
            whys.append("not measured"); continue
        vals.append(float(v))
    if not vals:
        return None, Counter(whys).most_common(1)[0][0] if whys else "no legs"
    return sum(vals) / len(vals), ""


def load_labels():
    return {r["photo"]: r for r in csv.DictReader(LABELS.open())}


def pct(a, b):
    return f"{a}/{b} ({round(100 * a / b)}%)" if b else "–"


def ai_side(v):
    return "heavy" if v in ("full_break", "pooling") else "light" if v in LIGHT else None


# ---------------------------------------------------------------- cuts, judged leave-one-out

def best_cut(pts, sign=None):
    """pts: [(x, is_heavy)]. Best single threshold (and direction, unless `sign` fixes it): (cut, sign), +1 = x ≥ cut is heavy."""
    xs = sorted({x for x, _ in pts})
    cands = [xs[0] - 1e-6] + [(a + b) / 2 for a, b in zip(xs, xs[1:])] + [xs[-1] + 1e-6]
    best = None
    for c in cands:
        for sg in ((sign,) if sign else (1, -1)):
            right = sum(((x >= c) if sg > 0 else (x < c)) == y for x, y in pts)
            if best is None or right > best[0]:
                best = (right, c, sg)
    return best[1], best[2]


def says(x, cut, sg):
    return (x >= cut) if sg > 0 else (x < cut)


def loo_single(pts, sign=None):
    """pts: {pid: (x, is_heavy)}. Each photo judged with the cut fit on the others."""
    res, cuts = {}, []
    for p, (x, y) in pts.items():
        rest = [v for q, v in pts.items() if q != p]
        if len({yy for _, yy in rest}) < 2:
            continue
        c, sg = best_cut(rest, sign)
        cuts.append(c * sg)
        res[p] = says(x, c, sg) == y
    return res, cuts


def or_rule_fit(pts, signs=None):
    """pts: [(a, b, y)] with a or b None. Heavy if a says heavy OR b says heavy (each with its own cut; direction fixed by `signs`)."""
    A = sorted({a for a, _, _ in pts if a is not None}); B = sorted({b for _, b, _ in pts if b is not None})
    ca = [A[0] - 1e-6] + [(x + y) / 2 for x, y in zip(A, A[1:])] + [A[-1] + 1e-6] if A else [None]
    cb = [B[0] - 1e-6] + [(x + y) / 2 for x, y in zip(B, B[1:])] + [B[-1] + 1e-6] if B else [None]
    best = None
    for c1 in ca:
        for s1 in ((signs[0],) if signs else (1, -1)):
            for c2 in cb:
                for s2 in ((signs[1],) if signs else (1, -1)):
                    right = 0
                    for a, b, y in pts:
                        h = (a is not None and c1 is not None and says(a, c1, s1)) or (b is not None and c2 is not None and says(b, c2, s2))
                        right += h == y
                    if best is None or right > best[0]:
                        best = (right, c1, s1, c2, s2)
    return best[1:]


def or_says(a, b, r):
    c1, s1, c2, s2 = r
    return (a is not None and says(a, c1, s1)) or (b is not None and says(b, c2, s2))


def report(out: Path):
    labels = load_labels()
    manifest = {m["id"]: m for m in json.loads((out / "manifest.json").read_text())}
    ai = json.loads((out / "ai.json").read_text())
    runs = {pid: {v: json.loads(f.read_text()) for v in VARIANTS if (f := out / "runs" / f"{pid}.{v}.json").exists()} for pid in manifest}
    lab = {p: labels[p] for p in manifest if p in labels}
    acc = {p: set(r["hem"].split("|")) for p, r in lab.items()}
    binl = {p: r["heavy"] for p, r in lab.items()}
    judged = [p for p in lab if binl[p] in ("heavy", "light")]
    six = [p for p in lab if lab[p]["hem"] not in ("na", "unsure")]
    L = ["# Hem probe", "", f"Run: {out.name}. Labels: `hem_labels.csv` (Claude subagent, Oct 10, written before the probe existed; blind to it and to the AI). "
         "AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) or the phone's own reading (1 run); the AI's `cuffed` counts as cropped. "
         "'Heavy' = full break, stacked or pooling; 'light' = no break, slight break or cropped. Labels like 'slight_break|full_break' accept either and are left out of heavy-vs-light.", ""]
    L += [f"Photos: {len(manifest)} run, {len(six)} with a hem label, {len(judged)} on one side of heavy vs light "
          f"({sum(binl[p] == 'heavy' for p in judged)} heavy, {sum(binl[p] == 'light' for p in judged)} light).", ""]

    # ---- 1. ranges by label
    def prim(p):
        return lab[p]["hem"].split("|")[0]
    classes = ["no_break", "slight_break", "full_break", "stacked", "pooling", "cropped"]
    for gates in (False, True):
        L += [f"## How each measure spreads by label (first label; gates {'on' if gates else 'off'})", "",
              "| Measure | " + " | ".join(classes) + " |", "|---|" + "---|" * len(classes)]
        for f in FEATURES:
            cells = []
            for c in classes:
                ps = [p for p in six if prim(p) == c]
                vs = sorted(v for p in ps for v in [value(runs[p].get("base"), f, gates)[0]] if v is not None)
                cells.append(f"{len(vs)}/{len(ps)}: " + (f"{vs[0]:.2f}–{vs[-1]:.2f} (med {vs[len(vs)//2]:.2f})" if vs else "–"))
            L.append(f"| {f} | " + " | ".join(cells) + " |")
        L.append("")
    # heavy vs light medians
    L += ["## Heavy vs light, medians (gates on)", "", "| Measure | light: n, median, range | heavy: n, median, range |", "|---|---|---|"]
    for f in FEATURES:
        cells = []
        for side in ("light", "heavy"):
            vs = sorted(v for p in judged if binl[p] == side for v in [value(runs[p].get("base"), f)[0]] if v is not None)
            cells.append(f"{len(vs)}, {vs[len(vs)//2]:.2f}, {vs[0]:.2f}–{vs[-1]:.2f}" if vs else "–")
        L.append(f"| {f} | " + " | ".join(cells) + " |")
    L.append("")

    # ---- 2. heavy vs light, one measure, leave-one-out (direction fixed in advance; free direction as a side note)
    def ai_bin(ps):
        n = r = 0
        for p in ps:
            for v in ai.get(p, []):
                s_ = ai_side(v)
                if s_ is None:
                    continue
                n += 1; r += s_ == binl[p]
        return r, n
    V = {f: {p: value(runs[p].get("base"), f)[0] for p in lab} for f in FEATURES}
    L += ["## Heavy vs light, one measure each (leave-one-out)", "",
          "Each photo is judged with the best cut fit on all the other photos; the direction (more folds = heavier, less shoe showing = heavier, "
          "hem lower on the leg = heavier, wider at the bottom = heavier) was fixed before the run. Unsure = the measure's gates failed. "
          "AI = every AI run on exactly the photos the probe answered. Last column: the same with the direction also fit (to show where the expected direction is wrong).", "",
          "| Measure | Photos | Probe sure | Probe right | Unsure | AI right, same photos | AI right, all judged | Cut range | Free direction: right |", "|---|---|---|---|---|---|---|---|---|"]
    single = {}
    ar_all = ai_bin(judged)
    for f in FEATURES:
        pts = {p: (V[f][p], binl[p] == "heavy") for p in judged if V[f][p] is not None}
        res, cuts = loo_single(pts, DIRECTION[f])
        free, _ = loo_single(pts)
        single[f] = res
        ar = ai_bin(list(res))
        L.append(f"| {f} | {len(judged)} | {len(res)} | {pct(sum(res.values()), len(res))} | {pct(len(judged) - len(res), len(judged))} | {pct(*ar)} | {pct(*ar_all)} | "
                 + (f"{min(cuts) * DIRECTION[f]:.2f}–{max(cuts) * DIRECTION[f]:.2f}" if cuts else "–") + f" | {pct(sum(free.values()), len(free))} |")
    L.append("")

    # The hem edge's position with the shoe box required (tHem's first gate assignment, "cover": the search for the
    # edge stops at the middle of the shoe box, so without a box it can run on to the sole).
    FEATURES["tHemBox"] = ("tHem", "cover"); DIRECTION["tHemBox"] = 1
    V["tHemBox"] = {p: value(runs[p].get("base"), "tHemBox")[0] for p in lab}
    pts = {p: (V["tHemBox"][p], binl[p] == "heavy") for p in judged if V["tHemBox"][p] is not None}
    res_tb, cuts_tb = loo_single(pts, 1)
    L += ["### The hem edge's position along the shin, shoe box required", "",
          f"tHem (where the pants' color ends, as a share of knee → ankle; 1 = the ankle joint) on photos with a shoe box and none of the cover gates: "
          f"right {pct(sum(res_tb.values()), len(res_tb))}, unsure {pct(len(judged) - len(res_tb), len(judged))}, cut {min(cuts_tb):.3f}–{max(cuts_tb):.3f}; "
          f"AI on the same photos {pct(*ai_bin(list(res_tb)))}.", ""]
    for name, ps in [(GROUPS[g], [p for p in res_tb if manifest[p]["group"] == g]) for g in GROUPS] + [("founder", [p for p in res_tb if lab[p]["person"] == "founder"]), ("not the founder", [p for p in res_tb if lab[p]["person"] != "founder"])]:
        if ps:
            L.append(f"- {name}: probe {pct(sum(res_tb[p] for p in ps), len(ps))} (heavy {sum(binl[p] == 'heavy' for p in ps)}, light {sum(binl[p] == 'light' for p in ps)}); AI {pct(*ai_bin(ps))}")
    L += ["", "| Photo | Label | tHem | right? |", "|---|---|---|---|"] + [f"| {p} | {lab[p]['hem']} | {V['tHemBox'][p]:.3f} | {'y' if res_tb[p] else 'n'} |" for p in sorted(res_tb, key=lambda q: V['tHemBox'][q])] + [""]
    # As a tie-breaker: when an AI run says slight_break and the hem position (box required) is sure, take its heavy/light.
    cut_tb = 1.11
    tot = ai_r = tb_r = 0; changes = []
    for p in judged:
        t = V["tHemBox"][p]
        for v in ai.get(p, []):
            s_ = ai_side(v)
            if s_ is None:
                continue
            new = ("heavy" if t >= cut_tb else "light") if (t is not None and v == "slight_break") else s_
            tot += 1; ai_r += s_ == binl[p]; tb_r += new == binl[p]
            if new != s_:
                changes.append(f"{p} ({'fixed' if new == binl[p] else 'broken'})")
    L += [f"As a tie-breaker for the AI's slight_break (cut {cut_tb}): AI runs right {pct(ai_r, tot)} → {pct(tb_r, tot)}; changed: " + ", ".join(changes) + ".", ""]
    del FEATURES["tHemBox"]

    # ---- 3. pairs (heavy if either says heavy), and the honest version: the measure or pair is ALSO chosen without the held-out photo
    PAIRS = [("foldRatio", "shoeVisToW"), ("folds", "shoeVisToW"), ("foldRatio", "tHem"), ("folds", "tHem"), ("spread", "shoeVisToW"), ("shoeVisToW", "tHem")]
    def pair_pts(fa, fb, ps):
        return {p: (V[fa][p], V[fb][p], binl[p] == "heavy") for p in ps if V[fa][p] is not None or V[fb][p] is not None}
    L += ["## Heavy vs light, two measures together (leave-one-out)", "",
          "Heavy when either measure says heavy (each with its own cut, fit on the other photos; directions fixed). Unsure only when both are.", "",
          "| Measures | Probe sure | Probe right | Unsure | AI right, same photos |", "|---|---|---|---|---|"]
    pair_res = {}
    for fa, fb in PAIRS:
        pts = pair_pts(fa, fb, judged)
        res = {p: or_says(a_, b_, or_rule_fit([v for q, v in pts.items() if q != p], (DIRECTION[fa], DIRECTION[fb]))) == y for p, (a_, b_, y) in pts.items()}
        pair_res[(fa, fb)] = (res, or_rule_fit(list(pts.values()), (DIRECTION[fa], DIRECTION[fb])))
        L.append(f"| {fa} or {fb} | {len(res)} | {pct(sum(res.values()), len(res))} | {pct(len(judged) - len(res), len(judged))} | {pct(*ai_bin(list(res)))} |")
    L.append("")
    # Nested: for each held-out photo, pick the measure or pair with the best (right − wrong) on the others, fit its cut there, then judge.
    CANDS = [(f,) for f in FEATURES] + PAIRS
    def fit_cand(c, ps):
        if len(c) == 1:
            pts = [(V[c[0]][p], binl[p] == "heavy") for p in ps if V[c[0]][p] is not None]
            if len({y for _, y in pts}) < 2:
                return None, -1e9
            cut = best_cut(pts, DIRECTION[c[0]])
            sc = sum(1 if says(x, *cut) == y else -1 for x, y in pts)
            return cut, sc
        pts = list(pair_pts(*c, ps).values())
        r = or_rule_fit(pts, (DIRECTION[c[0]], DIRECTION[c[1]]))
        return r, sum(1 if or_says(a_, b_, r) == y else -1 for a_, b_, y in pts)
    def cand_says(c, model, p, v="base"):
        if len(c) == 1:
            x = value(runs[p].get(v), c[0])[0]
            return None if x is None else says(x, *model)
        a_, b_ = value(runs[p].get(v), c[0])[0], value(runs[p].get(v), c[1])[0]
        return None if a_ is None and b_ is None else or_says(a_, b_, model)
    nested, chosen = {}, Counter()
    for p in judged:
        rest = [q for q in judged if q != p]
        fits = [(fit_cand(c, rest), c) for c in CANDS]
        (model, sc), c = max(fits, key=lambda t: t[0][1])
        chosen[" or ".join(c)] += 1
        y = cand_says(c, model, p)
        if y is not None:
            nested[p] = y == (binl[p] == "heavy")
    L += ["### The honest number: measure chosen without the held-out photo", "",
          f"For each photo, the measure or pair (of the {len(CANDS)} above) with the most right-minus-wrong answers on the other photos is picked and its cut fit there; then the held-out photo is judged. "
          f"Picked: " + ", ".join(f"{k} ({n}×)" for k, n in chosen.most_common()) + ".", "",
          f"- **Probe: right {pct(sum(nested.values()), len(nested))} when sure, unsure on {pct(len(judged) - len(nested), len(judged))}.** AI on the same photos: {pct(*ai_bin(list(nested)))}; AI on all judged photos: {pct(*ar_all)}.", ""]
    final_c = max(((fit_cand(c, judged), c) for c in CANDS), key=lambda t: t[0][1])
    final_model, final_cand = final_c[0][0], final_c[1]
    L += [f"Fit on every judged photo, the pick is **{' or '.join(final_cand)}** with {final_model} (for the record; the number above is the one to quote).", ""]

    # ---- 4. by group and by person (nested answers)
    L += ["## By photo group and person (heavy vs light, the nested answers)", "",
          "| Group | Judged | Probe sure | Probe right | AI right (runs), same photos | AI right (runs), all |", "|---|---|---|---|---|---|"]
    def person(p):
        return lab[p]["person"]
    sets = [(GROUPS[g], [p for p in judged if manifest[p]["group"] == g]) for g in GROUPS]
    sets += [("founder (all his photos)", [p for p in judged if person(p) == "founder"]),
             ("friends (2 people)", [p for p in judged if person(p).startswith("friend")]),
             ("stock + web (profile unknown)", [p for p in judged if person(p) in ("stock photo", "web photo")])]
    for name, ps in sets:
        if not ps:
            continue
        rs = [nested[p] for p in ps if p in nested]
        L.append(f"| {name} | {len(ps)} | {len(rs)} | {pct(sum(rs), len(rs))} | {pct(*ai_bin([p for p in ps if p in nested]))} | {pct(*ai_bin(ps))} |")
    heavy_sure = [p for p in nested if binl[p] == "heavy"]
    L += ["", f"Heavy photos the probe answered: {len(heavy_sure)}, of which {sum(person(p) == 'founder' for p in heavy_sure)} are the founder's (one or two pairs of black wide jeans): "
          + ", ".join(f"{p} ({'right' if nested[p] else 'wrong'})" for p in heavy_sure) + ".", ""]
    pre_closet = [p for p in judged if manifest[p]["shoeBoxes"] == 0 and manifest[p]["group"] == "phone"]
    nj = [p for p in judged if p not in pre_closet]
    L += [f"Leaving out his {len(pre_closet)} checks from before the closet call (no garment boxes; every check has them now): unsure {pct(sum(p not in nested for p in nj), len(nj))}, right {pct(sum(nested[p] for p in nj if p in nested), sum(p in nested for p in nj))}.", ""]

    # ---- 5. six classes
    # Tree: cropped if gapT ≥ a cut; else heavy by the nested pick → stacked if folds ≥ a cut, else full break; else slight break.
    def tree_fit(ps):
        pts = [(V["gapT"][p], "cropped" in acc[p]) for p in ps if V["gapT"][p] is not None]
        g = best_cut(pts, 1) if len({y for _, y in pts}) == 2 else (9, 1)
        hj = [p for p in ps if binl[p] in ("heavy", "light")]
        (model, _), c = max(((fit_cand(c, hj), c) for c in CANDS), key=lambda t: t[0][1])
        sp = [(V["folds"][p], "stacked" in acc[p]) for p in ps if (acc[p] == {"stacked"} or acc[p] == {"full_break"}) and V["folds"][p] is not None]
        k = best_cut(sp, 1) if len({y for _, y in sp}) == 2 else (99, 1)
        return g, (c, model), k
    def tree_says(p, m, v="base"):
        g, (c, model), k = m
        gap = value(runs[p].get(v), "gapT")[0]
        if gap is not None and says(gap, *g):
            return "cropped"
        h = cand_says(c, model, p, v)
        if h is None:
            return None
        if h:
            f = value(runs[p].get(v), "folds")[0]
            return "stacked" if f is not None and says(f, *k) else "full_break"
        return "slight_break"
    six_res, six_ans = {}, {}
    for p in six:
        y = tree_says(p, tree_fit([q for q in six if q != p]))
        if y:
            six_res[p] = y in acc[p]; six_ans[p] = y
    ai6 = [(v in acc[p]) for p in six_res for v in ai.get(p, []) if v]
    ai6all = [(v in acc[p]) for p in six for v in ai.get(p, []) if v]
    L += ["## Six classes (leave-one-out, everything fit without the held-out photo)", "",
          "Rule: a sock/skin gap (gapT) over a cut → cropped; else the heavy-vs-light pick → heavy: stacked if folds ≥ a cut, else full break; light: slight break. "
          "Right = one of the photo's accepted labels. The AI has no `stacked` value (its `cuffed` counts as cropped).", "",
          "| | Photos | Probe sure | Probe right | Unsure | AI right, same photos (runs) | AI right, all labeled (runs) |", "|---|---|---|---|---|---|---|",
          f"| all | {len(six)} | {len(six_res)} | {pct(sum(six_res.values()), len(six_res))} | {pct(len(six) - len(six_res), len(six))} | {pct(sum(ai6), len(ai6))} | {pct(sum(ai6all), len(ai6all))} |"]
    for g in GROUPS:
        ps = [p for p in six if manifest[p]["group"] == g]
        rs = [six_res[p] for p in ps if p in six_res]
        a6 = [(v in acc[p]) for p in ps if p in six_res for v in ai.get(p, []) if v]
        a6b = [(v in acc[p]) for p in ps for v in ai.get(p, []) if v]
        L.append(f"| {GROUPS[g]} | {len(ps)} | {len(rs)} | {pct(sum(rs), len(rs))} | {pct(len(ps) - len(rs), len(ps))} | {pct(sum(a6), len(a6))} | {pct(sum(a6b), len(a6b))} |")
    L.append("")
    full_model = tree_fit(six)
    L += [f"Fit on every labeled photo (for the record): gap cut {full_model[0]}, heavy rule {full_model[1]}, stacked folds {full_model[2]}. "
          f"Answers given: {dict(Counter(six_ans.values()))}.", ""]
    best_pair = final_cand if len(final_cand) == 2 else (final_cand[0], final_cand[0])
    pair_res.setdefault(best_pair, (nested, final_model))

    # stacked vs pooling / stacked vs full
    st_only = [p for p in six if acc[p] == {"stacked"}]
    po = [p for p in six if "pooling" in acc[p]]
    fb_only = [p for p in six if acc[p] == {"full_break"}]
    L += ["## Stacked vs pooling, stacked vs full break", "",
          f"- Photos labeled only stacked: {len(st_only)} ({', '.join(st_only)}); labeled pooling (even as a second choice): {len(po)} ({', '.join(po)}); only full break: {len(fb_only)}.",
          "- Folds above the hem, stacked-only vs full-break-only (gates on): "
          + "; ".join(f"{p}: folds {value(runs[p].get('base'), 'folds')[0]}, foldRatio {value(runs[p].get('base'), 'foldRatio')[0]}" for p in st_only),
          "- Full-break-only photos, folds: " + ", ".join(str(value(runs[p].get('base'), 'folds')[0]) for p in fb_only), ""]

    # ---- 6. unsure reasons
    L += ["## Why the probe is unsure (judged photos, per measure)", ""]
    for gset, f in (("fold", "foldRatio"), ("cover", "shoeVisToW")):
        why = Counter(value(runs[p].get("base"), f)[1] for p in judged if value(runs[p].get("base"), f)[0] is None)
        L.append(f"- **{gset}** ({f}): " + ", ".join(f"{k} {v}" for k, v in why.most_common()))
    both = Counter()
    for p in six:
        if cand_says(final_cand, final_model, p) is None:
            whs = [value(runs[p].get("base"), f)[1] for f in final_cand]
            both[next((w for w in whs if w), "?")] += 1
    L += [f"- **the final pick ({' or '.join(final_cand)}), unsure** (all {len(six)} labeled): " + ", ".join(f"{k} {v}" for k, v in both.most_common()), ""]

    # ---- 7. dark on dark, mirror vs propped
    def pantsL(p):
        ls = [l.get("pantsL") for l in runs[p]["base"].get("legs", []) if l.get("pantsL") is not None]
        return min(ls) if ls else None
    dark = [p for p in judged if (pantsL(p) is not None and pantsL(p) < 20)]
    L += ["## Dark pants (shin L* under 20), mirror selfies, propped/stock", ""]
    for name, ps in (("dark pants", dark), ("not dark", [p for p in judged if p not in dark]),
                     ("mirror selfies (his phone, Oct 7, web)", [p for p in judged if manifest[p]["group"] in ("phone", "oct7", "mirror") and p != "phone-d1967f"]),
                     ("propped / photographer (stock + the friend's propped landscape shot)", [p for p in judged if manifest[p]["group"] == "stock" or p == "phone-d1967f"])):
        s2 = [nested[p] for p in ps if p in nested]
        L.append(f"- **{name}** ({len(ps)} judged): probe sure on {pct(len(s2), len(ps))}, right {pct(sum(s2), len(s2))}; AI {pct(*ai_bin(ps))}")
    L.append("")

    # ---- 8. repeatability (the pair's class, cuts fit on all; and numbers)
    L += ["## Repeatability", "", "| Variant | Same heavy/light answer as base (incl. unsure) | Numbers within ±5% (foldRatio, shoeVisToW, tHem) |", "|---|---|---|"]
    for v in ("again", "max1600", "crop3"):
        same = n = num = numn = 0
        for p in six:
            def cls(var):
                return cand_says(final_cand, final_model, p, var)
            n += 1; same += cls("base") == cls(v)
            for f in ("foldRatio", "shoeVisToW", "tHem"):
                x0, x1 = value(runs[p].get("base"), f)[0], value(runs[p].get(v), f)[0]
                if x0 is not None or x1 is not None:
                    numn += 1; num += x0 is not None and x1 is not None and abs(x0 - x1) <= 0.05 * max(abs(x0), 1e-6)
        L.append(f"| {v} | {pct(same, n)} | {pct(num, numn)} |")
    ai_same = [len(set(ai[p])) == 1 for p in six if len(ai.get(p, [])) >= 2]
    L += ["", f"AI: same `hem` on all its runs for {pct(sum(ai_same), len(ai_same))} photos.", ""]

    # ---- 9. AI confusion, and every labeled photo
    conf = Counter((lab[p]["hem"], v) for p in six for v in ai.get(p, []))
    L += ["## The AI's hem by label (every run)", ""] + [f"- {k[0]} → {k[1]}: {n}" for k, n in sorted(conf.items(), key=lambda x: (x[0][0], str(x[0][1])))] + [""]
    L += ["## Every labeled photo (base run)", "", "Probe = the final pick fit on every judged photo; LOO = the nested leave-one-out answer was right (y) or wrong (n).", "",
          "| Photo | Group | Person | Label | foldRatio | folds | shoeVisToW | gapT | tHem | spread | Probe | LOO | Six-class | Unsure because | AI runs |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for p in sorted(six, key=lambda q: (manifest[q]["group"], q)):
        b = runs[p]["base"]
        def fm(f):
            v = value(b, f)[0]
            return "–" if v is None else f"{v:.2f}"
        h = cand_says(final_cand, final_model, p)
        cls = "unsure" if h is None else ("heavy" if h else "light")
        why = "; ".join(sorted({x for x in (value(b, "foldRatio")[1], value(b, "shoeVisToW")[1], value(b, "tHem")[1]) if x}))
        loo = "" if p not in nested else ("y" if nested[p] else "n")
        L.append(f"| {p} | {manifest[p]['group']} | {lab[p]['person']} | {lab[p]['hem']} | {fm('foldRatio')} | {fm('folds')} | {fm('shoeVisToW')} | {fm('gapT')} | {fm('tHem')} | {fm('spread')} | {cls} | {loo} | {six_ans.get(p, 'unsure')} | {why} | {'/'.join(str(x) for x in ai.get(p, []))} |")
    L.append("")
    (out / "report.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "results" / "hem1"))
    ap.add_argument("--report", help="re-analyze this results folder; no runs")
    ap.add_argument("--fast", action="store_true", help="base run only")
    ap.add_argument("--only", nargs="*")
    a = ap.parse_args()
    out = Path(a.report or a.out)
    if not a.report:
        run_all(out, ["base"] if (a.fast or a.only) else list(VARIANTS), a.only)
    if not a.only:
        report(out)
