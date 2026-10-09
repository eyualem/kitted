#!/usr/bin/env python3
"""Cut-outs + measurements for every closet sighting in a phone pull (tools/phone/pull.sh output).

  /usr/bin/python3 crops_from_pull.py ../../screenshots/phone/20261008-165206 ../../screenshots/crops/oct8

For each check with closet boxes and both photo copies on the Mac (kept = unblurred, for finding faces;
detail = face-hidden, the cut-out source), runs `bin/kmeasure crops`. Writes <hash8>-<index>.png and
<hash8>.json, then summary.json (one row per garment, no prints) and distances.json (feature-print
distance between every pair of garments of the same slot).
"""
import json, sqlite3, subprocess, sys, tempfile
from itertools import combinations
from pathlib import Path

HERE = Path(__file__).resolve().parent
SLOT = {"top": "top", "outerwear": "top", "bottom": "bottom", "footwear": "footwear"}


def main():
    pull, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(pull / "SQLite" / "kitted.db")
    rows = db.execute("""select f.image_hash, o.garment_index, o.garment_json, o.closet_json from closet_observations o
                         join fit_checks f on f.id = o.fit_check_id where o.closet_json is not null and o.is_deleted = 0
                         order by f.created_at, o.garment_index""").fetchall()
    # A mirror selfie (the scoring reading says so) gets its cut-outs flipped back to true view (#109).
    mirrored = {h for h, m in db.execute("""select f.image_hash, json_extract(r.reading_json, '$.scene.mirror_selfie')
                                             from fit_checks f join readings r on r.id = f.reading_id""") if m == 1}
    by_hash = {}
    for h, i, gj, cj in rows:
        g, c = json.loads(gj), json.loads(cj)
        if not c.get("visible") or len(c.get("box") or []) != 4:
            continue
        by_hash.setdefault(h, {})[i] = {"index": i, "category": g["category"], "subcategory": g["subcategory"],
                                       "color_family": g["color_family"], "box": c["box"], "shade": c.get("shade")}
    summary = []
    for h, gs in by_hash.items():
        kept, detail = pull / "photos" / f"{h}-photo.jpg", pull / "detail" / f"{h}.jpg"
        if not kept.exists() or not detail.exists():
            print(f"{h[:8]}: photo copies missing, skipped")
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(list(gs.values()), f)
        cmd = [str(HERE / "bin" / "kmeasure"), "crops", str(kept), str(detail), f.name, str(out), h[:8]]
        subprocess.run(cmd + (["mirrored"] if h in mirrored else []), check=True)
        m = json.loads((out / f"{h[:8]}.json").read_text())
        for r in m["garments"]:
            g = gs[r["index"]]
            summary.append({"photo": h[:8], **{k: g[k] for k in ("index", "category", "subcategory", "color_family", "shade")},
                            **{k: v for k, v in r.items() if k not in ("print", "index", "category")}, "print": r.get("print")})
    dist = []
    for a, b in combinations([s for s in summary if s.get("print")], 2):
        if SLOT.get(a["category"]) != SLOT.get(b["category"]) or a["photo"] == b["photo"]:
            continue
        pa, pb = a["print"], b["print"]
        d = sum((x - y) ** 2 for x, y in zip(pa, pb)) ** 0.5
        dist.append({"a": f"{a['photo']}-{a['index']} {a['subcategory']}", "b": f"{b['photo']}-{b['index']} {b['subcategory']}", "distance": round(d, 3)})
    dist.sort(key=lambda r: r["distance"])
    for s in summary:
        s.pop("print", None)
    (out / "summary.json").write_text(json.dumps(summary, indent=1))
    (out / "distances.json").write_text(json.dumps(dist, indent=1))
    print(f"{len(summary)} garments, {len(dist)} same-slot pairs → {out}")


if __name__ == "__main__":
    main()
