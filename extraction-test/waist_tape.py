#!/usr/bin/env python3
"""The tape shoot (DECISIONS-LOG #270): how far each body ruler's navel line is from his real navel.

He wears a plain shirt that isn't blue and dark pants, with a strip of blue painter's tape straight across the shirt
at navel height, and takes ~12 photos (mirror at face / chest / waist height and tilted, propped low / waist / chest /
far, one or two with a hand in a pocket). Name each file with how it was taken, e.g. `mirror-chest.jpg`, `propped-floor.jpg`.

  /usr/bin/python3 waist_tape.py [folder]      (default inputs/gold-set/me/tape)

For each photo, `kmeasure waist` (WAIST_TAPE=1) finds the tape by its color in the torso strip, and each ruler reads it
as t (shoulders 0 → knees 1). The navel on ANSUR II men is t 0.400, so error = (t_tape − 0.400) × 96.1 cm (+ = the ruler
puts his navel higher than the tape). One person can't separate his own proportions (±2 cm) from the ruler's offset;
a friend's photos would. Rule 7: these are his photos; his profile (birth year, picks) is still pending.
"""
import json, os, statistics as st, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOOL = HERE / "vision" / "bin" / "kmeasure"
RULERS = ["hips", "sk_linear", "ska_proj", "ska_proj_r", "a3d_ansur", "a3d_proj"]


def main(folder):
    rows = []
    for f in sorted(Path(folder).glob("*")):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".heic"):
            continue
        with tempfile.NamedTemporaryFile(suffix=".json") as out:
            subprocess.run([str(TOOL), "waist", str(f), out.name], env={**os.environ, "WAIST_TAPE": "1"}, capture_output=True)
            d = json.loads(Path(out.name).read_text() or "{}")
        tape = ((d.get("waist") or {}).get("tape_s"))
        errs = {ru: round(((d.get("rulers") or {}).get(ru, {}).get("tape_s") - 0.400) * 96.1, 1)
                for ru in RULERS if (d.get("rulers") or {}).get(ru, {}).get("tape_s") is not None}
        rows.append((f.name, tape, errs))
        print(f.name, "tape not found" if tape is None else errs)
    for kind in ("mirror", "propped", ""):
        sub = [r for r in rows if kind in r[0] and r[2]]
        if not sub:
            continue
        print(f"\n{kind or 'all'} ({len(sub)} photos): mean error · spread (cm)")
        for ru in RULERS:
            v = [r[2][ru] for r in sub if ru in r[2]]
            if v:
                print(f"  {ru:11s} {st.mean(v):+5.1f} · {st.pstdev(v):4.1f}  (n {len(v)})")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / "inputs" / "gold-set" / "me" / "tape")
