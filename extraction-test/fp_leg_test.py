#!/usr/bin/env python3
"""Leg probe on public truth (DECISIONS-LOG #222): does hem ÷ knee (and opening ÷ shoe) tell slim from straight
on Fashionpedia's labelled pants, with a cut frozen on our own photos first?

  vision/build.sh
  /usr/bin/python3 -I fp_leg_test.py --out results/fpleg1            (select, run the probe, analyze)
  /usr/bin/python3 -I fp_leg_test.py --report results/fpleg1         (re-analyze only)

Truth: Fashionpedia val 2020 (annotations CC BY 4.0, Jia et al. 2020; images keep their own licenses, internal
use only, inputs/fashionpedia/, git-ignored). A pants annotation counts when it's full length (maxi / floor),
isn't leggings, sweatpants, crop, capri, sailor, harem, peg (tapered: contradictory labels and jogger cuffs), flare, bootcut or bell bottom, and its photo has exactly one pants
annotation and at least one shoe. Classes: slim = "tight (fit)"; straight = "straight" (not tight);
wide = "wide leg" or "baggy". "regular (fit)" alone is left out. Boxes come from Fashionpedia's own boxes (truth
boxes, better than the closet call's), passed in the closet call's format.

No profile (rule 7): stock-like public photos, profile unknown; the probe uses no profile. Fashionpedia has no
gender field, so results are over all wearers (it's ~20% men by the paper); the measure is garment against
garment, but women's tight pants include jeggings, so treat "slim" here as narrower than the app's slim.
"""
import argparse, csv, json, subprocess, sys, tempfile
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import leg_probe as lp  # noqa: E402  (photo_value: the same per-photo pick and gates as #189)

DATA = Path("/Users/eyu/Desktop/files/Kitted/inputs/fashionpedia")
ANN = DATA / "raw" / "instances_attributes_val2020.json"
IMG = DATA / "images" / "test"
TOOL = HERE / "vision" / "bin" / "kmeasure"
TOPS = {"shirt, blouse": "top", "top, t-shirt, sweatshirt": "top", "sweater": "top", "cardigan": "outerwear",
        "jacket": "outerwear", "vest": "outerwear", "coat": "outerwear", "dress": "top", "jumpsuit": "top"}
SKIP_NICK = {"leggings", "crop (pants)", "capri (pants)", "sailor (pants)", "harem (pants)", "peg (pants)", "sweatpants"}
SKIP_SIL = {"flare", "bootcut", "bell bottom", "curved (fit)", "peg"}
G = {"box": True, "side": True}


def box1000(b, W, H):
    x, y, w, h = b
    return [y / H * 1000, x / W * 1000, (y + h) / H * 1000, (x + w) / W * 1000]


def select():
    d = json.loads(ANN.read_text())
    A = {a["id"]: a["name"] for a in d["attributes"]}
    C = {c["id"]: c["name"] for c in d["categories"]}
    ims = {i["id"]: i for i in d["images"]}
    by = {}
    for a in d["annotations"]:
        by.setdefault(a["image_id"], []).append(a)
    out = []
    for iid, anns in by.items():
        pants = [a for a in anns if C[a["category_id"]] == "pants"]
        shoes = [a for a in anns if C[a["category_id"]] == "shoe"]
        if len(pants) != 1 or not shoes:
            continue
        p = pants[0]
        names = {A[i] for i in p["attribute_ids"]}
        if names & SKIP_NICK or names & SKIP_SIL or not names & {"maxi (length)", "floor (length)"}:
            continue
        if names & {"wide leg", "baggy"}:
            cls = "wide"
        elif "tight (fit)" in names:
            cls = "slim"
        elif "straight" in names:
            cls = "straight"
        else:
            continue
        im = ims[iid]
        W, H = im["width"], im["height"]
        boxes = [{"index": 0, "category": "bottom", "subcategory": "jeans" if "jeans" in names else "pants", "box": box1000(p["bbox"], W, H)}]
        for k, s in enumerate(shoes):
            boxes.append({"index": 1 + k, "category": "footwear", "subcategory": "shoe", "box": box1000(s["bbox"], W, H)})
        for a in anns:
            t = TOPS.get(C[a["category_id"]])
            if t:
                boxes.append({"index": 10 + len(boxes), "category": t, "subcategory": C[a["category_id"]], "box": box1000(a["bbox"], W, H)})
        out.append({"id": im["file_name"].rsplit(".", 1)[0][:10], "file": im["file_name"], "cls": cls, "attrs": sorted(names),
                    "jeans": "jeans" in names, "size": [W, H], "license": im.get("license"), "boxes": boxes})
    return out


def run_all(out: Path):
    out.mkdir(parents=True, exist_ok=True)
    (out / "runs").mkdir(exist_ok=True)
    (out / "overlays").mkdir(exist_ok=True)
    sel = select()
    for s in sel:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(s["boxes"], f)
        for v, extra in (("base", ["--overlay", str(out / "overlays" / f"{s['id']}.jpg")]), ("crop3", ["--crop", "0.03"])):
            dst = out / "runs" / f"{s['id']}.{v}.json"
            r = subprocess.run([str(TOOL), "legs", str(IMG / s["file"]), str(dst), "--boxes", f.name] + extra, capture_output=True, text=True)
            if r.returncode:
                dst.write_text(json.dumps({"status": f"crash {r.returncode}"}))
        print(s["id"], s["cls"], r.stdout.strip()[:80])
    (out / "selection.json").write_text(json.dumps(sel, indent=1))


def own_cut(key="hk"):
    """The slim | straight-or-fuller cut fit on OUR photos only (results/leg1, leg_labels.csv), then frozen."""
    labels = {r["photo"]: set(r["leg_shape"].split("|")) for r in csv.DictReader(open(HERE / "leg_labels.csv"))}
    pts = []
    for pid, ok in labels.items():
        f = HERE / "results" / "leg1" / "runs" / f"{pid}.base.json"
        if not f.exists():
            continue
        side = "a" if ok <= {"skinny", "slim"} else "b" if ok <= {"straight", "relaxed", "wide"} else None
        x, _ = lp.photo_value(json.loads(f.read_text()), "split", key, G)
        if side and x is not None:
            pts.append((x, side))
    best = (0, None)
    for x, _ in pts:
        for c in (x - 1e-6, x + 1e-6):
            best = max(best, (sum((v >= c) == (s == "b") for v, s in pts), c))
    return best[1], best[0], len(pts)


def analyze(out: Path):
    sel = json.loads((out / "selection.json").read_text())
    runs = {s["id"]: {v: json.loads((out / "runs" / f"{s['id']}.{v}.json").read_text()) for v in ("base", "crop3")} for s in sel}
    L = []
    n_cls = Counter(s["cls"] for s in sel)
    L.append(f"Selected pants: {len(sel)} ({dict(n_cls)}); jeans {sum(s['jeans'] for s in sel)}")
    status = Counter(runs[s["id"]]["base"].get("status") for s in sel)
    L.append(f"Probe status: {dict(status)}  (not ok = photo prep refuses it: no face to hide, two people, …)")
    for key, name in (("hk", "hem ÷ knee"), ("os", "opening ÷ shoe")):
        L.append(f"\n## {name}")
        vals = {s["id"]: lp.photo_value(runs[s["id"]]["base"], "split", key, G) for s in sel}
        whys = Counter(w for x, w in vals.values() if x is None)
        for c in ("slim", "straight", "wide"):
            xs = sorted(round(vals[s["id"]][0], 2) for s in sel if s["cls"] == c and vals[s["id"]][0] is not None)
            med = xs[len(xs) // 2] if xs else None
            L.append(f"  {c:9s} measured {len(xs):3d}/{n_cls[c]:3d}  median {med}  range {xs[:1]}–{xs[-1:]}")
        L.append(f"  unsure reasons: {dict(whys.most_common(6))}")
        # slim vs straight-or-fuller, and slim vs straight
        for title, A_, B_ in (("slim | straight or wide", {"slim"}, {"straight", "wide"}), ("slim | straight", {"slim"}, {"straight"})):
            pts = [(vals[s["id"]][0], "a" if s["cls"] in A_ else "b") for s in sel if s["cls"] in A_ | B_]
            n_all = len(pts)
            pts = [(x, c) for x, c in pts if x is not None]
            if len(pts) < 4:
                continue
            # leave-one-out cut on Fashionpedia itself
            right = 0
            for i, (x, c) in enumerate(pts):
                rest = pts[:i] + pts[i + 1:]
                best = (0, None)
                for y, _ in rest:
                    for cc in (y - 1e-6, y + 1e-6):
                        best = max(best, (sum((v >= cc) == (s == "b") for v, s in rest), cc))
                right += (x >= best[1]) == (c == "b")
            line = f"  {title}: LOO {right}/{len(pts)} ({100 * right // len(pts)}%), unsure {n_all - len(pts)}/{n_all} ({100 * (n_all - len(pts)) // n_all}%)"
            if key == "hk" or key == "os":
                cut, r_own, n_own = own_cut(key)
                if cut is not None:
                    fr_ = sum((x >= cut) == (c == "b") for x, c in pts)
                    line += f" · cut frozen on our photos ({cut:.3f}, {r_own}/{n_own} there): {fr_}/{len(pts)} ({100 * fr_ // len(pts)}%)"
            L.append(line)
        # repeatability under a 3% crop
        same = tot = 0
        for s in sel:
            a, b = lp.photo_value(runs[s["id"]]["base"], "split", key, G)[0], lp.photo_value(runs[s["id"]]["crop3"], "split", key, G)[0]
            if a is not None and b is not None:
                tot += 1; same += abs(a - b) <= 0.05
        L.append(f"  3% crop: within ±0.05 on {same}/{tot}")
    txt = "\n".join(L)
    (out / "analysis.txt").write_text(txt + "\n")
    print(txt)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path)
    ap.add_argument("--report", type=Path)
    a = ap.parse_args()
    if a.out:
        run_all(a.out)
        analyze(a.out)
    elif a.report:
        analyze(a.report)
