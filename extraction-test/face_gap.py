"""The face-hiding gap (09-ui-review §10, #304): what photo prep hides, before and after the fix, on every photo set.

  /usr/bin/python3 face_gap.py run before      # kmeasure-before locate on every photo -> results/facegap/before.json
  /usr/bin/python3 face_gap.py run after       # kmeasure locate (the fixed Swift)     -> results/facegap/after.json
  /usr/bin/python3 face_gap.py compare         # H1-H5 -> results/facegap/report.txt and new-cover overlays

Photos: the gold set (inputs/ig, pinterest, reddit; ids as gold_read.py), his and his friends' fit photos
(inputs/fitcheck-photos, mirror-fit-check-1, phone-oct7) and the app's demo photos. Nothing leaves the Mac.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MAIN = Path("/Users/eyu/Desktop/files/Kitted")  # inputs/ is git-ignored: it lives in the main checkout only
DATA = MAIN / "inputs"
OUT = HERE / "results" / "facegap"
BIN = HERE / "vision" / "bin"
EXTS = (".png", ".jpg", ".jpeg")
DUPLICATES = {"Screenshot 2026-10-12 at 2.04.53 PM.png"}

# ig-098's chin, mouth and nose, marked by eye on the original (pixels, origin top-left, x0 y0 x1 y1), before the fix.
H1_FACE = {"ig-098": (300, 0, 540, 175)}


def photos():
    rows = []
    for prefix, folder in (("ig", "ig"), ("pin", "pinterest"), ("rd", "reddit")):
        files = sorted(p for p in (DATA / folder).iterdir() if p.suffix.lower() in EXTS)
        n = 0
        for f in files:
            n += 1
            if f.name in DUPLICATES:
                continue
            rows.append((f"{prefix}-{n:03d}", f))
    for folder in ("fitcheck-photos", "mirror-fit-check-1", "phone-oct7"):
        for f in sorted((DATA / folder).rglob("*")):
            if f.suffix.lower() in EXTS:
                rows.append((f"{folder}/{f.relative_to(DATA / folder)}", f))
    for f in sorted((HERE.parent / "app" / "assets" / "demo-photos").glob("*.jpg")):
        rows.append((f"demo/{f.stem}", f))
    return rows


def run(which):
    exe = BIN / ("kmeasure-before" if which == "before" else "kmeasure")
    OUT.mkdir(parents=True, exist_ok=True)
    out = {}
    for pid, f in photos():
        r = subprocess.run([str(exe), "locate", str(f)], capture_output=True, text=True, timeout=120)
        try:
            out[pid] = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception:
            out[pid] = {"status": "error", "stderr": r.stderr[-300:]}
        out[pid]["file"] = str(f)
    (OUT / f"{which}.json").write_text(json.dumps(out, indent=1, sort_keys=True))
    print(f"{which}: {len(out)} photos")


def rects(d):
    return [(r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]) for r in d.get("hide", [])]


def covered(rs, W, H, step=4):
    """The hidden pixels on a grid (every `step` px): a set of (x, y)."""
    s = set()
    for x0, y0, x1, y1 in rs:
        x0, y0, x1, y1 = max(0, int(x0)), max(0, int(y0)), min(W, int(x1)), min(H, int(y1))
        for y in range(y0 - y0 % step, y1, step):
            for x in range(x0 - x0 % step, x1, step):
                if x >= x0 and y >= y0:
                    s.add((x, y))
    return s


def compare():
    b = json.loads((OUT / "before.json").read_text())
    a = json.loads((OUT / "after.json").read_text())
    lines, gained = [], []
    fails = {"H1": [], "H2": [], "H3": [], "H4": []}
    for pid in sorted(b):
        db, da = b[pid], a.get(pid, {})
        W, H = (db.get("size") or [0, 0])
        cb, ca = covered(rects(db), W, H), covered(rects(da), W, H)
        if not cb <= ca:
            fails["H2"].append(f"{pid}: {len(cb - ca)} grid px uncovered")
        if db.get("status") == "ok" and da.get("status") != "ok":
            fails["H3"].append(f"{pid}: ok -> {da.get('status')}")
        new = ca - cb
        if new:
            share = len(new) * 16 / max(1, W * H)
            top = (db.get("main") or {}).get("y", 1e9)
            gained.append((pid, share, da["file"]))
            if share > 0.25:
                fails["H4"].append(f"{pid}: new cover {share:.0%} of the frame")
            if top > 0.03 * H:
                fails["H4"].append(f"{pid}: new cover but his outline doesn't touch the top")
    for pid, (x0, y0, x1, y1) in H1_FACE.items():
        da = a.get(pid, {})
        W, H = da.get("size") or [0, 0]
        face = covered([(x0, y0, x1, y1)], W, H)
        left = face - covered(rects(da), W, H)
        if left:
            fails["H1"].append(f"{pid}: {len(left)} of {len(face)} face grid px still showing")
    lines.append(f"photos: {len(b)} · ok before {sum(v.get('status') == 'ok' for v in b.values())} · ok after {sum(v.get('status') == 'ok' for v in a.values())}")
    for k, v in fails.items():
        lines.append(f"{k}: {'PASS' if not v else 'FAIL'}" + "".join(f"\n  - {x}" for x in v))
    lines.append(f"gained a cover: {len(gained)}")
    for pid, share, f in sorted(gained, key=lambda g: -g[1]):
        lines.append(f"  {pid}: +{share:.1%} of the frame · {Path(f).name}")
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    (OUT / "gained.json").write_text(json.dumps([g[0] for g in gained]))
    print("\n".join(lines))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        run(sys.argv[2])
    elif sys.argv[1] == "compare":
        compare()
