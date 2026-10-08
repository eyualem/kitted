"""Compare the v5 answer format (v3 + style-council fields, RULEBOOK Part 6) with the locked v3 runs.

Pass bars (RULEBOOK Part 6): at least 90% of photos have every run's score within 0.5 of each other,
and the median API time stays within about 1 s of the locked format's.
Scores are computed twice: with rubric.py v3.1 (today's app) and with the v4 prototype's code-only rulings.
Run from extraction-test/:  /usr/bin/python3 compare_v5.py [v5|v5s]
"""
import copy, json, statistics, sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "rubric" / "research" / "style-council"))
import rubric_v4_proto as v4  # noqa: E402

FMT = sys.argv[1] if len(sys.argv) > 1 else "v5"   # v5 or v5s
SETS = [  # (name, v3 baseline, new-format run)
    ("stock-40", "results/lockin-oct6/B-stock", f"results/test5-stock-40-{FMT}"),
    ("mirror-12", "results/lockin-oct6/B-mirror", f"results/test5-mirror-12-{FMT}"),
    ("phone-4", "results/test5-phone-4-v3" + ("b" if FMT == "v5s" else ""), f"results/test5-phone-4-{FMT}"),
]
NEW_FIELDS = ["denim_wear", "waistband", "lightness", "shoe_profile", "sleeve_length", "shade", "logo_text", "details"]
OLD_FIELDS = ["subcategory", "color_family", "saturation", "pattern", "pattern_scale", "logo", "volume", "leg_shape", "hem",
              "tucked", "length", "sleeve_end", "strain", "condition", "distressed_by_design", "certainty"]
SLOTS = ["top", "outerwear", "bottom", "footwear"]


def load(folder):
    p = HERE / folder / "raw_results.json"
    return [r for r in json.loads(p.read_text()) if r.get("extraction")] if p.exists() else []


def photo_key(r):
    return (r["outfit"], r["file"])


def slot_garment(ext, slot):
    return next((g for g in ext.get("garments", []) if g.get("category") == slot), None)


def scores(runs, F):
    out = defaultdict(list)
    for r in runs:
        s = v4.score(copy.deepcopy(r["extraction"]), "everyday", {}, F=F)["overall"]
        out[photo_key(r)].append(s)
    return out


def consistency(by_photo):
    ok = [k for k, v in by_photo.items() if None in v or (max(v) - min(v) <= 0.5)]
    return len(ok), len(by_photo)


def field_flips(runs, fields):
    by = defaultdict(list)
    for r in runs:
        by[photo_key(r)].append(r["extraction"])
    flips, seen = Counter(), Counter()
    for exts in by.values():
        for slot in SLOTS:
            gs = [slot_garment(e, slot) for e in exts]
            if not all(gs):
                continue
            for f in fields:
                vals = [json.dumps(sorted(g.get(f) or []) if f == "details" else g.get(f)) for g in gs]
                seen[f] += 1
                flips[f] += len(set(vals)) > 1
    return {f: (flips[f], seen[f]) for f in fields}


def main():
    for name, base_dir, new_dir in SETS:
        base, new = load(base_dir), load(new_dir)
        if not new:
            print(f"\n## {name}: no v5 results yet ({new_dir})")
            continue
        print(f"\n## {name}: v3 {len(base)} readings, {FMT} {len(new)} readings")
        for label, runs in (("v3 locked", base), (FMT, new)):
            secs = [r["seconds_api"] for r in runs if r.get("seconds_api")]
            outt = [r["usage"].get("candidatesTokenCount", 0) for r in runs if r.get("usage")]
            c31, n = consistency(scores(runs, v4.V31))
            c4, _ = consistency(scores(runs, v4.BEFORE_BETA))
            print(f"- {label:9}: consistent {c31}/{n} (v3.1 rules) · {c4}/{n} (rulebook) · median {statistics.median(secs):.2f} s"
                  f" · p90 {sorted(secs)[int(len(secs) * 0.9) - 1]:.2f} s · median output {statistics.median(outt):.0f} tokens")
        # does the new prompt change the old readings? first run per photo, per slot
        b1 = {photo_key(r): r["extraction"] for r in base if r["run"] == 0}
        n1 = {photo_key(r): r["extraction"] for r in new if r["run"] == 0}
        changed = Counter()
        examples = defaultdict(list)
        for k in b1.keys() & n1.keys():
            for slot in SLOTS:
                gb, gn = slot_garment(b1[k], slot), slot_garment(n1[k], slot)
                if gb and gn:
                    for f in ("subcategory", "color_family", "hem", "leg_shape"):
                        if gb.get(f) != gn.get(f):
                            changed[f] += 1
                            examples[f].append(f"{k[0]} {slot}: {gb.get(f)} -> {gn.get(f)}")
        print("- first-run changes v3 -> v5: " + ", ".join(f"{f} {c}" for f, c in changed.items()) or "none")
        for f, ex in examples.items():
            print(f"    {f}: " + "; ".join(ex[:6]) + (" …" if len(ex) > 6 else ""))
        flips = field_flips(new, [f for f in NEW_FIELDS if any(f in g for r in new for g in r["extraction"]["garments"])] + ["hem", "subcategory", "color_family"])
        print("- v5 run-to-run flips (garment slots that changed between runs): " +
              ", ".join(f"{f} {a}/{b}" for f, (a, b) in flips.items()))
        hems = Counter(g.get("hem") for r in new for g in r["extraction"]["garments"] if g.get("category") == "bottom")
        print(f"- v5 bottom hems: {dict(hems)}")
        if name == "phone-4":
            for r in new:
                b = slot_garment(r["extraction"], "bottom")
                if r["outfit"] == "ph1" and b:
                    q = v4.ask_question(copy.deepcopy(r["extraction"]), "everyday", {}, F=v4.BEFORE_BETA)
                    print(f"    ph1 run {r['run']}: {b['subcategory']} hem={b['hem']} waistband={b.get('waistband')} "
                          f"certainty={b['certainty']} → tap: {q and [o['label'] for o in q['options']]}")


if __name__ == "__main__":
    main()
