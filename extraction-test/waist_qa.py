#!/usr/bin/env python3
"""Variants of the clothes-edge finder, scored against the line check (DECISIONS-LOG #275). No labels beyond the check.

The line check (waist_labels/qa/, blind reviewers on results/waist4/overlays) judged where the orange line sits:
`on` (within ~2 cm), `low_*` / `high_*` (2–6 cm, or more), `wrong_thing`. A variant of the edge finder is run on the
same photos and its line compared with the reviewed one (t of the visual waistline on the sk_linear ruler; 0.01 t ≈ 1 cm):
  kept    an `on` line that stays within 2.5 cm
  broke   an `on` line that moves more than 2.5 cm (or is lost)
  fixed   a `low_*` line that moves up ≥ 2 cm (a `high_*` line down ≥ 2 cm)
  worse   a `low_*` line that moves further down (a `high_*` further up) by ≥ 2 cm

  /usr/bin/python3 waist_qa.py NAME [ENV=VALUE ...]      e.g.  waist_qa.py gap WAIST_GAP=1
"""
import csv, glob, json, os, subprocess, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOOL = HERE / "vision" / "bin" / "kmeasure"
CM = 96.1


def t_vis(d):
    return ((d.get("rulers") or {}).get("sk_linear") or {}).get("visual_s")


def main(name, envs):
    qa = {}
    for f in sorted((HERE / "waist_labels" / "qa").glob("qa-*.csv")):
        for r in csv.DictReader(f.open()):
            qa[r["photo"].strip()] = r
    man = {p["id"]: p for p in json.loads((HERE / "results" / "waist4" / "manifest.json").read_text())}
    out = HERE / "results" / "waist-qa" / name
    out.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, "WAIST_NO3D": "1", **dict(e.split("=", 1) for e in envs)}
    c = Counter()
    moved = []
    for pid, r in qa.items():
        base = json.loads((HERE / "results" / "waist4" / "runs" / f"{pid}.p0.json").read_text())
        t0 = t_vis(base)
        dst = out / f"{pid}.json"
        e = dict(env)
        if man[pid].get("pick"):
            e["WAIST_PICK"] = "0"
        subprocess.run([str(TOOL), "waist", man[pid]["path"], str(dst)], env=e, capture_output=True)
        t1 = t_vis(json.loads(dst.read_text())) if dst.exists() else None
        v = r["verdict"]
        if t0 is None:
            continue
        delta = None if t1 is None else (t1 - t0) * CM   # + = the line moved down the body
        if v == "on":
            c["kept" if delta is not None and abs(delta) <= 2.5 else "broke"] += 1
        elif v.startswith("low"):
            c["fixed" if delta is not None and delta <= -2 else "worse" if delta is not None and delta >= 2 else "same"] += 1
            c["low"] += 1
        elif v.startswith("high"):
            c["fixed" if delta is not None and delta >= 2 else "worse" if delta is not None and delta <= -2 else "same"] += 1
            c["high"] += 1
        else:
            c[f"other ({v})"] += 1
        if delta is not None and abs(delta) > 2:
            moved.append(f"{pid} {v} {delta:+.1f} cm")
    print(f"{name}: on kept {c['kept']} broke {c['broke']} · off ({c['low']} low, {c['high']} high): fixed {c['fixed']} worse {c['worse']} same {c['same']}")
    (out / "moved.txt").write_text("\n".join(moved) + "\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
