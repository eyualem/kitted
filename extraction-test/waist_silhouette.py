#!/usr/bin/env python3
"""The pants silhouette (DECISIONS-LOG #269): can widths in body-ruler cm tell slim, straight and wide pants apart,
and does "the lower body about as wide as the top" track the judges? No app change, no API calls.

  /usr/bin/python3 waist_silhouette.py results/waist3

Widths come from `kmeasure waist` → "silhouette" (vision/BodyRuler.swift): the outline across each leg at the
thigh, knee, shin and just above the shoe, and across the shoulders and the top's hem, in cm on the body ruler's
local scale. Labels: pass-1 `leg` (waist_labels/, blind) and leg_labels.csv; the AI's leg_shape for comparison;
the 5 judges' Proportions on the gold set. Dev/test as waist_test.py.
"""
import csv, json, statistics as st, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import waist_test as WT  # noqa: E402
import gold_tune as G  # noqa: E402

METRICS = ["low_over_thigh", "knee_over_shoulder", "low_over_shoulder", "knee_over_top", "low_cm", "knee_cm", "thigh_cm"]
ORDER = {"slim": 0, "straight": 1, "wide": 2}


def auc(a, b):
    if not a or not b:
        return None
    return sum((x > y) + 0.5 * (x == y) for x in a for y in b) / (len(a) * len(b))


def main(out):
    out = Path(out)
    man = json.loads((out / "manifest.json").read_text())
    labels = WT.load_labels()
    legl = {r["photo"]: r["leg_shape"] for r in csv.DictReader(open(HERE / "leg_labels.csv"))}
    ai = WT.ai_readings(man)
    D = G.load()
    rows = []
    for p in man:
        f = out / "runs" / f"{p['id']}.p0.json"
        if not f.exists():
            continue
        d = json.loads(f.read_text())
        sil = d.get("silhouette") or {}
        lab = labels.get(p["id"], {})
        leg = lab.get("leg") if lab.get("leg") in ORDER else legl.get(p["id"]) if legl.get(p["id"]) in ORDER else None
        if lab.get("bottoms") == "shorts":
            leg = None
        ai_legs = []
        for j in ai.get(p["id"], []):
            b = [g for g in j.get("garments", []) if g.get("category") == "bottom"]
            if b and b[0].get("leg_shape") in ("skinny", "slim", "straight", "wide", "relaxed"):
                ai_legs.append({"skinny": "slim", "relaxed": "wide"}.get(b[0]["leg_shape"], b[0]["leg_shape"]))
        rows.append({"id": p["id"], "set": p["set"], "group": p["group"], "leg": leg, "ai": ai_legs, "sil": sil,
                     "shot": lab.get("shot"), "prop": D["jparts"].get(p["id"], {}).get("proportion"), "panel": D["panel_raw"].get(p["id"])})
    L = ["# The pants silhouette", "", f"Run `{out.name}`. Widths in cm on the body ruler's scale; labels pass 1 + leg_labels.csv.", ""]
    L += ["## Separating leg shapes (AUC; dev · test; 0.5 = chance)", "", "| Measure | answers | straight vs slim | wide vs straight | median slim · straight · wide |", "|---|---|---|---|---|"]
    for m in METRICS:
        cells = []
        for a_, b_ in (("straight", "slim"), ("wide", "straight")):
            parts = []
            for s_ in ("dev", "test"):
                va = [r["sil"][m] for r in rows if r["set"] == s_ and r["leg"] == a_ and m in r["sil"]]
                vb = [r["sil"][m] for r in rows if r["set"] == s_ and r["leg"] == b_ and m in r["sil"]]
                v = auc(va, vb)
                parts.append(f"{v:.2f}" if v is not None else "–")
            cells.append(" · ".join(parts))
        med = " · ".join(f"{st.median(v):.2f}" if (v := [r['sil'][m] for r in rows if r['leg'] == k and m in r['sil']]) else "–" for k in ORDER)
        n = sum(1 for r in rows if r["leg"] and m in r["sil"])
        L.append(f"| {m} | {n}/{sum(1 for r in rows if r['leg'])} | {cells[0]} | {cells[1]} | {med} |")
    # The AI on the same labels.
    for s_ in ("dev", "test"):
        a = [(x, r["leg"]) for r in rows if r["set"] == s_ and r["leg"] for x in r["ai"]]
        L.append(f"\nThe AI's leg_shape on the {s_} labels: {sum(x == y for x, y in a)}/{len(a)} ({100 * sum(x == y for x, y in a) // max(1, len(a))}%) of runs right.")
    # Best single metric as a 3-way classifier: cuts on dev, scored on test.
    L += ["", "## Best 3-way classifier (cuts picked on dev, scored once on test) vs the AI on the same photos", ""]
    for m in METRICS:
        dev = [r for r in rows if r["set"] == "dev" and r["leg"] and m in r["sil"]]
        test = [r for r in rows if r["set"] == "test" and r["leg"] and m in r["sil"]]
        vals = sorted({round(r["sil"][m], 3) for r in dev})
        best = None
        for i, a in enumerate(vals):
            for b in vals[i:]:
                acc = sum((0 if r["sil"][m] < a else 1 if r["sil"][m] < b else 2) == ORDER[r["leg"]] for r in dev)
                if best is None or acc > best[0]:
                    best = (acc, a, b)
        if not best or not test:
            continue
        _, a, b = best
        right = sum((0 if r["sil"][m] < a else 1 if r["sil"][m] < b else 2) == ORDER[r["leg"]] for r in test)
        ai_same = [(x, r["leg"]) for r in test for x in r["ai"]]
        L.append(f"- {m}: cuts {a:.3f} / {b:.3f}; test {right}/{len(test)} ({100 * right // len(test)}%); the AI on the same photos "
                 f"{100 * sum(x == y for x, y in ai_same) // max(1, len(ai_same))}%")
    # Judges: does the lower/upper balance track Proportions?
    L += ["", "## Against the judges' Proportions (gold photos, rank correlation)", ""]
    for m in METRICS:
        sub = [r for r in rows if r["prop"] is not None and m in r["sil"]]
        if len(sub) > 20:
            L.append(f"- {m}: n {len(sub)}, rho {G.spearman([r['sil'][m] for r in sub], [r['prop'] for r in sub]):+.2f} (panel {G.spearman([r['sil'][m] for r in sub], [r['panel'] for r in sub]):+.2f})")
    # Mirror vs propped bias (the same labels should give the same widths).
    L += ["", "## Mirror vs propped, by label (median low_over_thigh · knee_over_shoulder)", ""]
    for k in ORDER:
        for shot in ("mirror", "propped", "other"):
            v = [r for r in rows if r["leg"] == k and r["shot"] == shot]
            a = [r["sil"]["low_over_thigh"] for r in v if "low_over_thigh" in r["sil"]]
            b = [r["sil"]["knee_over_shoulder"] for r in v if "knee_over_shoulder" in r["sil"]]
            if len(a) >= 3:
                L.append(f"- {k}, {shot}: n {len(a)} · {st.median(a):.2f} · {st.median(b) if b else float('nan'):.2f}")
    # His photos: what each reads.
    L += ["", "## His photos", ""]
    for r in rows:
        if r["group"] in ("phone", "oct7") and r["sil"].get("low_over_thigh") is not None:
            L.append(f"- {r['id']}: label {r['leg']} · AI {'/'.join(r['ai'])} · low/thigh {r['sil'].get('low_over_thigh')} · knee/shoulder {r['sil'].get('knee_over_shoulder')} · low {r['sil'].get('low_cm')} cm")
    (out / "silhouette.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main(sys.argv[1])
