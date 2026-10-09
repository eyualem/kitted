#!/usr/bin/env python3
"""Leg probe (Oct 9; rubric/research/notes/leg-probe.md): can the phone tell a pant leg's shape (skinny / slim /
straight / relaxed / wide) from the photo with no AI, using garment-to-garment ratios only, and does it beat the
AI's `leg_shape`?

  vision/build.sh                                            (builds bin/kmeasure with vision/LegTaper.swift)
  /usr/bin/python3 leg_probe.py --out results/leg1           (runs the probe on every photo, then the report)
  /usr/bin/python3 leg_probe.py --report results/leg1        (re-analyze only)

Photos, garment boxes and the AI's readings come from fit_ruler.py (the same 76 photos; s18 has two people).
Labels: leg_labels.csv (Claude subagent, Oct 9, made before the probe ran; Oct 8 rows match truth.csv).
Measures per leg (LegTaper.swift): hem ÷ knee width, knee ÷ thigh width, opening ÷ the shoe's own width;
"strict" (legs touching = unsure) and "split" (a touching run cut halfway between the two legs' lines).
"""
import argparse, csv, json, subprocess, tempfile
from collections import Counter, defaultdict
from itertools import product
from pathlib import Path

import fit_ruler as fr

HERE = Path(__file__).resolve().parent
TOOL = HERE / "vision" / "bin" / "kmeasure"
LABELS = HERE / "leg_labels.csv"
ORDER = ["skinny", "slim", "straight", "relaxed", "wide"]
ALIAS = {"flare_bootcut": "flare", "barrel": "wide"}
VARIANTS = {"base": [], "again": [], "max1600": ["--max", "1600"], "crop3": ["--crop", "0.03"]}


def ai_leg(j):
    for g in j.get("garments") or []:
        if g.get("category") == "bottom":
            v = g.get("leg_shape")
            return ALIAS.get(v, v), g.get("subcategory")
    return None, None


def run_all(out: Path, variants):
    out.mkdir(parents=True, exist_ok=True)
    (out / "overlays").mkdir(exist_ok=True)
    (out / "runs").mkdir(exist_ok=True)
    c1 = fr.closet1_boxes()
    ai = fr.ai_readings()
    manifest = []
    for p in fr.photo_set():
        pid = p["id"]
        if p["group"] == "phone":
            boxes = fr.pull_boxes(p["pull"], p["hash"])
            if pid not in ai:
                ai[pid] = fr.pull_readings(p["pull"], p["hash"])
        else:
            boxes = c1.get(p["closet"], [])
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(boxes, f)
        for v in variants:
            dst = out / "runs" / f"{pid}.{v}.json"
            cmd = [str(TOOL), "legs", str(p["path"]), str(dst), "--boxes", f.name] + VARIANTS[v]
            if v == "base":
                cmd += ["--overlay", str(out / "overlays" / f"{pid}.jpg")]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode:
                dst.write_text(json.dumps({"status": f"crash {r.returncode}"}))
            if v == "base":
                print(pid, r.stdout.strip())
        manifest.append({"id": pid, "group": p["group"], "boxes": len(boxes)})
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
    (out / "ai.json").write_text(json.dumps({k: [ai_leg(j) for j in v] for k, v in ai.items()}, indent=1))


# ---------------------------------------------------------------- per-photo numbers

def legs_of(run, mode):
    """[(side, conf, bend, {hemToKnee, kneeToThigh, openToShoe, whys})] for one run."""
    out = []
    for leg in run.get("legs", []):
        d = leg.get(mode)
        if not d:
            out.append((leg["side"], 0, None, {"why": leg.get("why", "joints")}))
            continue
        whys = {k: d[k].get("why") for k in ("thigh", "knee", "hem", "opening") if isinstance(d.get(k), dict) and d[k].get("why")}
        if leg.get("shoe", {}).get("why"):
            whys["shoe"] = leg["shoe"]["why"]
        out.append((leg["side"], leg.get("conf", 0), leg.get("bend"), {"hk": d.get("hemToKnee"), "kt": d.get("kneeToThigh"), "os": d.get("openToShoe"), "whys": whys}))
    return out


def photo_value(run, mode, key, gates):
    """One number per photo: the more confident leg that has it (straighter leg on a tie); None + reason."""
    if run.get("status") != "ok":
        return None, run.get("status", "no run")
    if gates.get("box") and not run.get("box"):
        return None, "no bottoms box"
    if gates.get("side") and run.get("sideView"):
        return None, "side view"
    cands, whys = [], []
    for side, conf, bend, m in legs_of(run, mode):
        if m.get(key) is None:
            need = {"hk": ("hem", "knee"), "kt": ("knee", "thigh"), "os": ("opening", "shoe")}[key]
            w = [m.get("whys", {}).get(n) for n in need]
            whys.append(next((x for x in w if x), m.get("why") or "joints"))
            continue
        if gates.get("bend") and bend is not None and bend > gates["bend"]:
            whys.append("leg bent")
            continue
        cands.append((conf, -(bend or 0), m[key]))
    if not cands:
        return None, Counter(whys).most_common(1)[0][0] if whys else "no legs"
    if gates.get("agree") and len(cands) == 2 and abs(cands[0][2] - cands[1][2]) > gates["agree"]:
        return None, "legs disagree"
    return max(cands)[2], ""


def classify(x, cuts):
    """cuts: ascending thresholds between the classes in `names` (len(cuts)+1 classes)."""
    for i, c in enumerate(cuts):
        if x < c:
            return i
    return len(cuts)


def load_labels():
    return {r["photo"]: r for r in csv.DictReader(LABELS.open())}


GROUPS = {"phone": "his phone checks (founder + 2 friends)", "oct7": "his Oct 7 mirror photos", "mirror": "web mirror selfies", "stock": "stock photos"}


def pct(a, b):
    return f"{a}/{b} ({round(100 * a / b)}%)" if b else "–"


def analyze(out: Path):
    labels = load_labels()
    manifest = {m["id"]: m for m in json.loads((out / "manifest.json").read_text())}
    ai = json.loads((out / "ai.json").read_text())
    runs = {}
    for pid in manifest:
        runs[pid] = {}
        for v in VARIANTS:
            f = out / "runs" / f"{pid}.{v}.json"
            if f.exists():
                runs[pid][v] = json.loads(f.read_text())
    L = []
    lines = ["# Leg probe", "", f"Run: {out.name}. Labels: `leg_labels.csv` (Claude subagent, Oct 9, before the probe ran). "
             "AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) or the phone's own reading (1 run). "
             "'a|b' labels accept either.", ""]

    labeled = {pid: labels[pid] for pid in manifest if pid in labels and labels[pid]["leg_shape"] not in ("na", "unsure", "")}
    five = {pid: r for pid, r in labeled.items() if r["leg_shape"] != "flare"}

    # ---- 1. ranges per label (primary label = first)
    for mode in ("strict", "split"):
        lines += [f"## Ranges per label ({mode})", "", "| Measure | " + " | ".join(ORDER + ["flare"]) + " |", "|---|" + "---|" * 6]
        for key, name in (("hk", "hem ÷ knee"), ("kt", "knee ÷ thigh"), ("os", "opening ÷ shoe")):
            cells = []
            for lab in ORDER + ["flare"]:
                vals = sorted(v for pid, r in labeled.items() if r["leg_shape"].split("|")[0] == lab
                              for v in [photo_value(runs[pid]["base"], mode, key, {})[0]] if v is not None)
                n = sum(1 for r in labeled.values() if r["leg_shape"].split("|")[0] == lab)
                cells.append(f"{len(vals)}/{n}: " + (f"{vals[0]:.2f}–{vals[-1]:.2f} (med {vals[len(vals)//2]:.2f})" if vals else "–"))
            lines.append(f"| {name} | " + " | ".join(cells) + " |")
        lines.append("")

    # ---- 2. per-photo table
    lines += ["## Every labeled photo (base run, split mode)", "", "| Photo | Group | Label | Hem | hem÷knee | knee÷thigh | open÷shoe | unsure because | AI runs |", "|---|---|---|---|---|---|---|---|---|"]
    for pid in sorted(labeled, key=lambda p: (manifest[p]["group"], p)):
        r = runs[pid]["base"]
        vals = [photo_value(r, "split", k, {}) for k in ("hk", "kt", "os")]
        why = "; ".join(sorted({w for v, w in vals if v is None and w}))
        fmt = lambda v: "–" if v[0] is None else f"{v[0]:.2f}"
        lines.append(f"| {pid} | {manifest[pid]['group']} | {labeled[pid]['leg_shape']} | {labeled[pid]['hem']} | {fmt(vals[0])} | {fmt(vals[1])} | {fmt(vals[2])} | {why} | {'/'.join(str(a[0]) for a in ai.get(pid, []))} |")
    lines.append("")
    (out / "report.md").write_text("\n".join(lines) + "\n")
    return labeled, five, runs, manifest, ai


# ---------------------------------------------------------------- evaluation (thresholds, accuracy vs the AI)

NARROW, FULL = {"skinny", "slim"}, {"relaxed", "wide"}


def side_of(labels, a, b):
    """'a' / 'b' when every accepted label is on one side, else None (the label straddles the line)."""
    s = {("a" if l in a else "b" if l in b else "x") for l in labels}
    return s.pop() if len(s) == 1 and "x" not in s else None


def tree(os_, hk, c):
    """The 5-class rule: opening ÷ shoe says how full the leg is, hem ÷ knee whether it tapers."""
    if os_ is None:
        return None
    if os_ < c["narrow"]:
        return None if hk is None else ("skinny" if hk < c["skinny"] else "slim")
    if os_ < c["full"]:
        return "straight"
    return None if hk is None else ("relaxed" if hk < c["relaxed"] else "wide")


def evaluate(out: Path, labeled, five, runs, manifest, ai):
    G = {"box": True, "side": True}
    dev = {p for p in five if manifest[p]["group"] in ("stock", "mirror")}
    test = {p for p in five if manifest[p]["group"] in ("phone", "oct7")}
    oks = {p: set(r["leg_shape"].split("|")) for p, r in labeled.items()}

    def vals(p, v="base", mode="split"):
        r = runs[p].get(v, runs[p]["base"])
        return {k: photo_value(r, mode, k, G) for k in ("hk", "kt", "os")}

    lines = ["", "# Evaluation", "", "Gates on: a bottoms box from the closet call, not a side view. Split mode (touching legs cut halfway) "
             "unless noted. dev = stock + web mirror (tuned on); test = his phone checks + his Oct 7 photos (held out).", ""]

    # ---- binary separations, one measure at a time: best single cut (on dev) and how the test photos fall
    def best_cut(ps, key, a, b, mode):
        pts = [(vals(p, mode=mode)[key][0], side_of(oks[p], a, b)) for p in ps]
        pts = [(x, s) for x, s in pts if x is not None and s]
        if not pts:
            return None, 0, 0
        best = (0, None)
        for x, _ in pts:
            for c in (x - 1e-6, x + 1e-6):
                right = sum((v >= c) == (s == "b") for v, s in pts)
                best = max(best, (right, c))
        return best[1], best[0], len(pts)

    def score_cut(ps, key, a, b, cut, mode):
        n = right = uns = 0
        for p in ps:
            s = side_of(oks[p], a, b)
            if not s:
                continue
            n += 1
            x = vals(p, mode=mode)[key][0]
            if x is None:
                uns += 1
            else:
                right += (x >= cut) == (s == "b")
        return right, n - uns, n

    def ai_binary(ps, a, b, only_sure=None):
        n = right = 0
        for p in ps:
            s = side_of(oks[p], a, b)
            if not s:
                continue
            if only_sure is not None and vals(p, mode=only_sure[1])[only_sure[0]][0] is None:
                continue
            for v, _sub in ai.get(p, []):
                if v in a or v in b:
                    n += 1; right += (v in b) == (s == "b")
                elif v:
                    n += 1
        return right, n

    lines += ["## Two questions, one measure each", "",
              "| Question | Measure | Mode | Best cut (dev) | Dev right | Test right (sure) | Test unsure | AI right, test photos the probe read | AI right, all test photos |",
              "|---|---|---|---|---|---|---|---|---|"]
    for qname, a, b in (("slim-or-narrower vs straight-or-fuller", NARROW, {"straight", "relaxed", "wide"}),
                        ("straight vs wide", {"straight"}, {"wide"}), ("slim vs straight", {"slim"}, {"straight"})):
        for key in ("os", "hk", "kt"):
            for mode in ("strict", "split"):
                cut, dr, dn = best_cut(dev, key, a, b, mode)
                if cut is None:
                    continue
                tr, tn, tall = score_cut(test, key, a, b, cut, mode)
                ar, an = ai_binary(test, a, b, (key, mode))
                ar2, an2 = ai_binary(test, a, b)
                lines.append(f"| {qname} | {key} | {mode} | {cut:.2f} | {pct(dr, dn)} | {pct(tr, tn)} | {pct(tall - tn, tall)} | {pct(ar, an)} | {pct(ar2, an2)} |")
    lines.append("")

    # ---- leave-one-out over every labeled photo (the cut is fit on all the others), with the AI on the same photos
    lines += ["## Two questions, leave-one-out over all labeled photos", "",
              "Each photo is judged with the best cut fit on all the other photos (so no photo grades itself). "
              "The AI column is every AI run on exactly the photos the probe answered.", "",
              "| Question | Measure | Mode | Photos | Probe sure | Probe right (of sure) | Unsure | AI right, same photos | Cut range |", "|---|---|---|---|---|---|---|---|---|"]
    allps = dev | test
    loo_rows = {}
    for qname, a, b in (("slim-or-narrower vs straight-or-fuller", NARROW, {"straight", "relaxed", "wide"}),
                        ("slim vs straight", {"slim"}, {"straight"}), ("straight vs wide", {"straight"}, {"wide"})):
        for key in ("os", "hk", "kt"):
            for mode in ("strict", "split"):
                ps = [p for p in allps if side_of(oks[p], a, b)]
                sure = [p for p in ps if vals(p, mode=mode)[key][0] is not None]
                right, cuts, per = 0, [], {}
                for p in sure:
                    cut, _, _ = best_cut([q for q in sure if q != p], key, a, b, mode)
                    if cut is None:
                        continue
                    cuts.append(cut)
                    ok = (vals(p, mode=mode)[key][0] >= cut) == (side_of(oks[p], a, b) == "b")
                    right += ok; per[p] = ok
                ar, an = ai_binary(sure, a, b)
                loo_rows[(qname, key, mode)] = per
                if cuts:
                    lines.append(f"| {qname} | {key} | {mode} | {len(ps)} | {len(sure)} | {pct(right, len(sure))} | {pct(len(ps) - len(sure), len(ps))} | {pct(ar, an)} | {min(cuts):.2f}–{max(cuts):.2f} |")
    lines.append("")
    for g in GROUPS:
        bits = []
        for (qname, key, mode), per in loo_rows.items():
            if mode != "strict" or key not in ("os", "hk"):
                continue
            ps = [p for p in per if manifest[p]["group"] == g]
            if ps:
                a, b = {"slim-or-narrower vs straight-or-fuller": (NARROW, {"straight", "relaxed", "wide"}), "slim vs straight": ({"slim"}, {"straight"}), "straight vs wide": ({"straight"}, {"wide"})}[qname]
                ar, an = ai_binary(ps, a, b)
                bits.append(f"{qname} by {key}: probe {pct(sum(per[p] for p in ps), len(ps))}, AI {pct(ar, an)}")
        if bits:
            lines.append(f"- **{GROUPS[g]}**: " + "; ".join(bits))
    lines.append("")

    # ---- the 5-class tree: grid on dev; then test; plus the in-sample best on everything (an upper bound)
    grid = {"narrow": [x / 100 for x in range(80, 121, 2)], "full": [x / 100 for x in range(100, 141, 2)],
            "skinny": [x / 100 for x in range(55, 81, 2)], "relaxed": [x / 100 for x in range(60, 101, 2)]}

    def tree_score(ps, c, v="base"):
        right = sure = 0
        for p in ps:
            x = vals(p, v)
            y = tree(x["os"][0], x["hk"][0], c)
            if y:
                sure += 1; right += y in oks[p]
        return right, sure

    def fit(ps):
        best = None
        for n_, f_, s_, r_ in product(grid["narrow"], grid["full"], grid["skinny"], grid["relaxed"]):
            if f_ <= n_:
                continue
            c = {"narrow": n_, "full": f_, "skinny": s_, "relaxed": r_}
            r, s = tree_score(ps, c)
            key = (r - 0.5 * (s - r), r)  # right answers, wrong ones cost half
            if best is None or key > best[0]:
                best = (key, c)
        return best[1]

    cdev = fit(dev)
    call = fit(dev | test)
    lines += ["## Five shapes (skinny / slim / straight / relaxed / wide)", "",
              f"Rule: opening ÷ shoe < narrow → (hem ÷ knee < skinny → skinny, else slim); < full → straight; else (hem ÷ knee < relaxed → relaxed, else wide). "
              f"Cuts tuned on dev: {cdev}. Tuned on everything (in-sample, an upper bound): {call}.", "",
              "| Photos | Labeled | Probe sure | Probe right (of sure) | Unsure | AI right, same sure photos (every run) | AI right, all labeled (every run) |", "|---|---|---|---|---|---|---|"]

    def ai_rate(ps, only=None):
        n = r = 0
        for p in ps:
            if only is not None and p not in only:
                continue
            for v, _ in ai.get(p, []):
                n += 1; r += v in oks[p]
        return r, n

    for name, ps, c in (("dev (tuned on)", dev, cdev), ("test (held out)", test, cdev), ("all, dev cuts", dev | test, cdev), ("all, cuts fit on all (upper bound)", dev | test, call)):
        r, s = tree_score(ps, c)
        sure_ps = {p for p in ps if tree(vals(p)["os"][0], vals(p)["hk"][0], c)}
        lines.append(f"| {name} | {len(ps)} | {s} | {pct(r, s)} | {pct(len(ps) - s, len(ps))} | {pct(*ai_rate(sure_ps))} | {pct(*ai_rate(ps))} |")
    lines.append("")
    for g in GROUPS:
        ps = {p for p in dev | test if manifest[p]["group"] == g}
        if not ps:
            continue
        r, s = tree_score(ps, cdev)
        sure_ps = {p for p in ps if tree(vals(p)["os"][0], vals(p)["hk"][0], cdev)}
        lines.append(f"- **{GROUPS[g]}** ({len(ps)} labeled): probe sure on {s}, right {pct(r, s)}; AI right on the same photos {pct(*ai_rate(sure_ps))}, on all {pct(*ai_rate(ps))}.")
    lines.append("")

    # ---- unsure reasons (the tree needs opening ÷ shoe, and hem ÷ knee outside the straight band)
    why = Counter()
    for p in dev | test:
        x = vals(p)
        if x["os"][0] is None:
            why[x["os"][1]] += 1
    lines += ["## Why the probe is unsure (opening ÷ shoe missing, all labeled 5-shape photos)", ""] + [f"- {k}: {v}" for k, v in why.most_common()] + [""]

    # ---- repeatability
    lines += ["## Repeatability (same photo; class from the dev cuts)", "", "| Variant | Same class as base | Same number (±0.02) |", "|---|---|---|"]
    for v in ("again", "max1600", "crop3"):
        same = n = num = numn = 0
        for p in dev | test:
            a0, b0 = vals(p), vals(p, v)
            ya, yb = tree(a0["os"][0], a0["hk"][0], cdev), tree(b0["os"][0], b0["hk"][0], cdev)
            n += 1; same += ya == yb
            for k in ("os", "hk"):
                if a0[k][0] is not None or b0[k][0] is not None:
                    numn += 1
                    num += a0[k][0] is not None and b0[k][0] is not None and abs(a0[k][0] - b0[k][0]) <= 0.02
        lines.append(f"| {v} | {pct(same, n)} | {pct(num, numn)} |")
    ai_same = [len({v for v, _ in ai[p]}) == 1 for p in dev | test if len(ai.get(p, [])) >= 2]
    lines += ["", f"AI same over its runs: {pct(sum(ai_same), len(ai_same))} photos.", ""]

    # ---- the AI's own confusion on these photos
    conf = Counter()
    for p in dev | test:
        for v, _ in ai.get(p, []):
            conf[(labeled[p]["leg_shape"], v)] += 1
    lines += ["## The AI's readings by label (every run)", ""] + [f"- {k[0]} → {k[1]}: {n}" for k, n in sorted(conf.items())] + [""]
    with (out / "report.md").open("a") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    return cdev


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "results" / "leg1"))
    ap.add_argument("--report", help="re-analyze this results folder; no runs")
    ap.add_argument("--fast", action="store_true", help="base run only")
    a = ap.parse_args()
    out = Path(a.report or a.out)
    if not a.report:
        run_all(out, ["base"] if a.fast else list(VARIANTS))
    evaluate(out, *analyze(out))
