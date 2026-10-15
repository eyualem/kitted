#!/usr/bin/env python3
"""Which body ruler places the clothes' waistline best? (DECISIONS-LOG #270). No labels needed for the first two tests.

  /usr/bin/python3 waist_rulers.py --out results/waist2            (runs every photo at pitch 0, +10°, −10°; then the report)
  /usr/bin/python3 waist_rulers.py --report results/waist2

Rulers (vision/BodyRuler.swift): hips (the old one), sk_linear, ska_proj, ska_proj_r, a3d_proj, a3d_ansur, and mp_proj
(MediaPipe's 3D pose, added by waist_mediapipe.py when its results exist). Every reading is t, the share of the
way from the shoulders (0) to the knees (1); on ANSUR II men the navel is t 0.400, the hip joint 0.562, the
crotch 0.619, and 0.01 of t = 0.96 cm.

Tests:
  1. Tilt: the same photo turned as a camera pitched ±10° (an exact homography). A ruler that corrects for the camera
     reads the clothes edge at the same t.
  2. Same outfit, other photo: his photos of one outfit (the hem doesn't move between shots). Spread of t within a set.
  3. The tucked shirts: a tuck sits at the pants' waistband, which on mid-rise pants is close to the navel; the spread
     of t over tucked photos (other people, other pants) bounds the ruler's noise from above.
  4. The labels (waist_labels/, both passes): how well each ruler's t separates "the waist shows" from "covered",
     tucked from an untucked hem at the waistband, and the waistband from mid-fly (AUC; dev / test as waist_test.py).
"""
import argparse, json, statistics as st, subprocess, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import waist_test as WT  # noqa: E402

TOOL = HERE / "vision" / "bin" / "kmeasure"
PITCHES = [0, 10, -10]
RULERS = ["hips", "sk_linear", "ska_proj", "ska_proj_r", "a3d_proj", "a3d_ansur", "mp_proj", "mp_ansur"]
EDGE = "pants_start_s"
CM = 96.1  # shoulder → knee on ANSUR II men
PICKS = ["phone-602c13", "phone-729b22", "phone-1f1b29", "phone-6bf356"]
# His photos of one outfit, taken separately (from the pass-1 notes; the hem may sit a little differently per shot).
SAME = {
    "grey hoodie, tee below, black joggers": ["phone-6b14db", "phone-a765e8", "phone-7de605"],
    "grey hoodie, wide black jeans (3 days)": ["phone-0d39d6", "phone-b0f0c8", "phone-d6559a", "oct7-ph1"],
    "red tee, wide black jeans": ["phone-6f1aee", "phone-e16ac6"],
    "navy chore jacket, white tee, black jeans": ["phone-f4870b", "phone-fb0b17"],
    "brown checked shirt, wide jeans": ["phone-5a9049", "phone-7f14a4"],
    "black oversized tee, black wide jeans": ["phone-403ade", "phone-8ad378"],
}


def photos():
    ps = WT.photos()
    for pid in PICKS:
        ps.append({"id": pid, "path": str(HERE / "results" / "waist1" / "picks" / f"{pid}.jpg"), "group": "phone", "set": "test", "pick": True})
    return ps


def run_all(out):
    (out / "runs").mkdir(parents=True, exist_ok=True)
    ps = photos()
    for i, p in enumerate(ps):
        for pt in PITCHES:
            dst = out / "runs" / f"{p['id']}.p{pt}.json"
            if dst.exists():
                continue
            env = {"WAIST_PICK": "0"} if p.get("pick") else {}
            r = subprocess.run([str(TOOL), "waist", p["path"], str(dst), "--pitch", str(pt)], capture_output=True, text=True,
                               env={**__import__("os").environ, **env})
            if r.returncode:
                print(p["id"], pt, "failed", r.stderr[-150:])
        if i % 25 == 0:
            print(i, "/", len(ps), flush=True)
    (out / "manifest.json").write_text(json.dumps(ps, indent=1, default=str))


def load(out):
    ps = json.loads((out / "manifest.json").read_text())
    R = {}
    for p in ps:
        R[p["id"]] = {}
        for pt in PITCHES:
            f = out / "runs" / f"{p['id']}.p{pt}.json"
            if f.exists():
                R[p["id"]][pt] = json.loads(f.read_text())
    mp = out / "mediapipe.json"   # mp_* rulers, merged by waist_mediapipe.py
    if mp.exists():
        for pid, by in json.loads(mp.read_text()).items():
            for pt, rul in by.items():
                d = R.get(pid, {}).get(int(pt))
                if d is not None:
                    d.setdefault("rulers", {}).update(rul)
    return ps, R


def t_of(run, ruler, edge=EDGE):
    return ((run or {}).get("rulers") or {}).get(ruler, {}).get(edge)


def q(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(p * len(v)))] if v else None


def auc(a, b):
    """P(a > b): a = the class expected lower on the body (larger t)."""
    if not a or not b:
        return None
    return sum((x > y) + 0.5 * (x == y) for x in a for y in b) / (len(a) * len(b))


def report(out):
    ps, R = load(out)
    labels = WT.load_labels()
    WT.SECOND.clear(); WT.SECOND.update(WT.load_second())
    L = ["# Body rulers for the waistline", "", f"Run `{out.name}`. t = share of the way from the shoulders (0) to the knees (1); "
         f"ANSUR II men: navel 0.400, hip joint 0.562, crotch 0.619; 0.01 of t ≈ {CM / 100:.2f} cm. Edge: where the pants start.", ""]
    # 1. tilt
    L += ["## 1. Tilt: the same photo as a camera pitched ±10°", "", "| Ruler | Photos read at 0° | Also read at ±10° | Median shift (cm) | 80% shift (cm) | Mean signed shift +10° / −10° (cm) |", "|---|---|---|---|---|---|"]
    for ru in RULERS:
        base = [p["id"] for p in ps if t_of(R[p["id"]].get(0), ru) is not None]
        if not base:
            continue
        sh, sp, sm, both = [], [], [], 0
        for pid in base:
            t0 = t_of(R[pid][0], ru)
            got = 0
            for pt, acc in ((10, sp), (-10, sm)):
                tv = t_of(R[pid].get(pt), ru)
                if tv is not None:
                    sh.append(abs(tv - t0) * CM); acc.append((tv - t0) * CM); got += 1
            both += got == 2
        L.append(f"| {ru} | {len(base)} | {both} | {q(sh, 0.5):.1f} | {q(sh, 0.8):.1f} | {st.mean(sp):+.1f} / {st.mean(sm):+.1f} |")
    # 2. same outfit
    L += ["", "## 2. Same outfit, another photo (his)", "", "| Outfit | Shots | " + " | ".join(RULERS) + " |", "|---|---|" + "---|" * len(RULERS)]
    spreads = defaultdict(list)
    for name, ids in SAME.items():
        cells = []
        for ru in RULERS:
            v = [t_of(R.get(i, {}).get(0), ru) for i in ids]
            v = [x for x in v if x is not None]
            if len(v) >= 2:
                s = (max(v) - min(v)) * CM
                spreads[ru].append(s)
                cells.append(f"{s:.1f} cm ({len(v)})")
            else:
                cells.append("–")
        L.append(f"| {name} | {len(ids)} | " + " | ".join(cells) + " |")
    L.append("| **Median range** | | " + " | ".join(f"**{st.median(spreads[ru]):.1f}**" if spreads[ru] else "–" for ru in RULERS) + " |")
    # 3/4. labels
    def lab_t(ru, keep):
        out_ = defaultdict(list)
        for p in ps:
            lab = labels.get(p["id"])
            if not lab or not keep(p):
                continue
            tv = t_of(R[p["id"]].get(0), ru)
            if tv is None:
                continue
            te = lab.get("top_end", "")
            if lab.get("bottoms") == "shorts":
                continue
            if te == "tucked":
                out_["tucked"].append(tv)
            elif te == "at_waistband" and lab.get("tuck") in ("none", ""):
                out_["hem at waistband"].append(tv)
            elif te in ("mid_fly", "below_crotch", "mid_fly|below_crotch"):
                out_["mid-fly or lower"].append(tv)
            tr = WT.truth(dict(lab, photo=p["id"]))
            if tr:
                out_[tr].append(tv)
        return out_
    L += ["", "## 3. Where each ruler puts the edge, by label (median t and the middle 80%; navel 0.400, hip joint 0.562)", "",
          "| Ruler | tucked | hem at the waistband | mid-fly or lower | tucked spread, 10–90% (cm) |", "|---|---|---|---|---|"]
    for ru in RULERS:
        d = lab_t(ru, lambda p: True)
        if not d:
            continue
        def cell(k):
            v = d.get(k, [])
            return f"{st.median(v):.3f} ({q(v, .1):.2f}–{q(v, .9):.2f}), n {len(v)}" if len(v) >= 3 else "–"
        tk = d.get("tucked", [])
        L.append(f"| {ru} | {cell('tucked')} | {cell('hem at waistband')} | {cell('mid-fly or lower')} | {((q(tk, .9) - q(tk, .1)) * CM) if len(tk) >= 3 else float('nan'):.1f} |")
    L += ["", "## 4. Separating the labels (AUC, 0.5 = chance, 1 = perfect; dev · test)", "",
          "| Ruler | waist shows vs covered (both passes) | tucked vs hem at the waistband | waistband vs mid-fly | answers (of labeled) |", "|---|---|---|---|---|"]
    for ru in RULERS:
        cells = []
        n_all = n_ans = 0
        for a_, b_ in (("covered", "waist_shows"), ("hem at waistband", "tucked"), ("mid-fly or lower", "hem at waistband")):
            parts = []
            for s_ in ("dev", "test"):
                d = lab_t(ru, lambda p, s_=s_: p["set"] == s_)
                v = auc(d.get(a_, []), d.get(b_, []))
                parts.append(f"{v:.2f}" if v is not None else "–")
            cells.append(" · ".join(parts))
        lab_ids = [p["id"] for p in ps if labels.get(p["id"]) and WT.truth(dict(labels[p["id"]], photo=p["id"]))]
        n_all = len(lab_ids); n_ans = sum(t_of(R[i].get(0), ru) is not None for i in lab_ids)
        L.append(f"| {ru} | " + " | ".join(cells) + f" | {n_ans}/{n_all} |")
    (out / "report.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "results" / "waist2"))
    ap.add_argument("--report")
    a = ap.parse_args()
    if a.report:
        report(Path(a.report))
    else:
        run_all(Path(a.out))
        report(Path(a.out))
