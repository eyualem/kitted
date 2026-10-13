#!/usr/bin/env python3
"""The creators' own outfits (DECISIONS-LOG #235): does the app agree with Tim Dessaint, Wanhee Kim, Jaye Alexander
and Frugal Aesthetic on the outfits they judge on screen?

Photos: frames from their videos in inputs/youtube/shots/<video id>/ (git-ignored; internal only; the videos were
downloaded at 720p only to grab these frames and deleted). Rule 7: every photo is "profile unknown"; scored with the
one stated test profile every paper test uses (parts2_test.PROFILE / BOLD) at Everyday.

Same config and photo prep as the gold set (gold_read.py: the app's live reading, faces hidden, close-ups).

  /usr/bin/python3 creator_read.py --prep-only               (face-hidden copies, no calls)
  GEMINI_API_KEY=... /usr/bin/python3 creator_read.py         (3 readings per photo; resumable; about $0.45)
  /usr/bin/python3 creator_read.py --report                   (scores and the creator checks, no calls)
"""
import argparse, json, os, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from statistics import median

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import zoom_test as Z  # noqa: E402
import parts_proto as P  # noqa: E402
import parts2_test as Q  # noqa: E402

SHOTS = Path("/Users/eyu/Desktop/files/Kitted/inputs/youtube/shots")
OUT = HERE / "results" / "creators1"
CREATOR = {"wIib9hzVUuw": "Tim", "-V2bE8nDsdo": "Tim", "k6Gig6r7BSQ": "Frugal", "tNVdA_arEa8": "Wanhee", "Pxeeh-caTJg": "Jaye"}

# What each creator says about these outfits (from rubric/research/creators/notes/).
PAIRS = [  # (worse, better, who, why)
    ("wIib9hzVUuw/o1-before-04-10", "wIib9hzVUuw/o1-after-04-52", "Tim", "oversized tee + baggy denim jacket over skinny jeans → relaxed jeans, cropped jacket"),
    ("wIib9hzVUuw/o2-before-05-30", "wIib9hzVUuw/o2-after-06-14", "Tim", "knit on knit, multicolor scarf, slim dark jeans → one knit, plain scarf, relaxed light jeans"),
    ("wIib9hzVUuw/o3-before-07-26", "wIib9hzVUuw/o3-after-09-07", "Tim", "all-navy flannel + jeans, 'basic and predictable' → black flannel, white tank, pleated trousers, loafers"),
    ("wIib9hzVUuw/o4-before-09-30", "wIib9hzVUuw/o4-after-10-02", "Tim", "tight beige monochrome pulling at the thighs → wider trousers, tucked tee, relaxed overshirt, loafers"),
    ("wIib9hzVUuw/o5-before-10-18", "wIib9hzVUuw/o5-after-11-22", "Tim", "skinny faux-leather joggers, yellow trims → straight leather trousers, plain black sweater"),
    ("k6Gig6r7BSQ/before-longer-tee-10-47", "k6Gig6r7BSQ/after-shorter-tee-10-47", "Frugal", "the same tee 4 in shorter, ending at the waist"),
]
VERDICTS = {  # single photos: what the creator calls it
    "-V2bE8nDsdo/outfit01-02-44": "Tim: okay, 'men's basics 101'",
    "-V2bE8nDsdo/outfit10-05-08": "Tim: his favorite kind of outfit",
    "tNVdA_arEa8/red-jacket-dark-pants-01-21": "Wanhee: good, a bright piece toned down by dark pants",
    "tNVdA_arEa8/purple-under-dark-coat-00-33": "Wanhee: good, bright purple toned down by a dark coat",
    "tNVdA_arEa8/blue-hoodie-dark-jacket-01-25": "Wanhee: good, a bright hoodie toned down by a dark jacket",
    "Pxeeh-caTJg/perfect-all-black-19-38": "Jaye: 'perfect' (open blazer, pendant, flares, heavy boots)",
}


def manifest():
    rows = []
    for d in sorted(p for p in SHOTS.iterdir() if p.is_dir()):
        for f in sorted(d.glob("*.png")):
            rows.append({"id": f"{d.name}/{f.stem}", "creator": CREATOR.get(d.name, "?"), "path": str(f)})
    return rows


def _pid(r):  # file-system-safe id for the prep folder
    return r["id"].replace("/", "__")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--prep-only", action="store_true")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--engines", default="v9,v10")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rows = manifest()
    (OUT / "manifest.json").write_text(json.dumps(rows, indent=1))
    if a.report:
        return report(rows, a.engines.split(","))
    ready = Z.prepare([(_pid(r), Path(r["path"])) for r in rows], OUT / "images")
    (OUT / "ready.json").write_text(json.dumps(sorted(ready), indent=1))
    print(f"{len(ready)} of {len(rows)} photos prepared (the rest: no face to hide, or two people)")
    if a.prep_only:
        return
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    raw = OUT / "raw.json"
    results = [r for r in (json.loads(raw.read_text()) if raw.exists() else []) if r.get("json")]
    done = {(r["photo"], r["run"]) for r in results}
    jobs = [(pid, i) for i in range(a.runs) for pid in sorted(ready) if (pid, i) not in done]
    print(f"{len(jobs)} calls")

    def run(job):
        pid, i = job
        imgs = Z.images_for(pid, True, OUT / "images")
        line = {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[len(imgs)]
        r = Z.call(key, Z.prompt_for(False) + line, imgs)
        r.update({"photo": pid, "run": i, "images": len(imgs)})
        return r

    with ThreadPoolExecutor(a.workers) as ex:
        for n, r in enumerate(ex.map(run, jobs), 1):
            results.append(r)
            if r.get("error"):
                print(f"  {r['photo']} run {r['run']}: {str(r['error'])[:120]}")
            if n % 10 == 0 or n == len(jobs):
                raw.write_text(json.dumps(results, indent=1))
                print(f"  {n}/{len(jobs)}")
    raw.write_text(json.dumps(results, indent=1))
    (OUT / "run.json").write_text(json.dumps({"model": Z.MODEL, "runs": a.runs, "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))
    report(rows, a.engines.split(","))


def report(rows, engines):
    engines = [e for e in engines if e in P.TUNE]
    raw = json.loads((OUT / "raw.json").read_text())
    by = {}
    cost = 0.0
    for r in raw:
        u = r.get("usage") or {}
        cost += u.get("promptTokenCount", 0) * Z.PRICE_IN + u.get("candidatesTokenCount", 0) * Z.PRICE_OUT
        if r.get("json"):
            by.setdefault(r["photo"].replace("__", "/"), []).append(r)
    scores, lines = {}, [f"photos read {len(by)} of {len(rows)} · cost ${cost:.2f} · profile unknown, test profile, Everyday"]
    for pid, rs in sorted(by.items()):
        scores[pid] = {}
        for e in engines:
            runs = []
            for r in sorted(rs, key=lambda r: r["run"]):
                try:
                    s = P.score_parts(r["json"], "everyday", Q.PROFILE, None, Q.BOLD, engine=e)
                    runs.append({"score": s.get("overall"), "styles": s.get("detected_styles"),
                                 "parts": {k: (v or {}).get("display") for k, v in (s.get("parts") or {}).items()},
                                 "checks": sorted({c for v in (s.get("parts") or {}).values() for c in ((v or {}).get("checks") or [])})})
                except Exception as ex:
                    runs.append({"error": repr(ex)[:200]})
            scores[pid][e] = runs
    (OUT / "scores.json").write_text(json.dumps(scores, indent=1))

    def med(pid, e):
        v = [x["score"] for x in scores.get(pid, {}).get(e, []) if isinstance(x.get("score"), (int, float))]
        return median(v) if v else None

    for e in engines:
        lines.append(f"\n== engine {e} ==")
        agree = 0
        for worse, better, who, why in PAIRS:
            w, b = med(worse, e), med(better, e)
            ok = w is not None and b is not None and b > w
            agree += ok
            lines.append(f"  {who} pair: {w} → {b} {'AGREES' if ok else ('TIE' if w == b else 'DISAGREES')} · {why}")
        lines.append(f"  pairs where the app agrees (after scores higher): {agree}/{len(PAIRS)}")
        for pid, verdict in VERDICTS.items():
            lines.append(f"  {pid}: {med(pid, e)} · {verdict}")
        tim10 = [(p, med(p, e)) for p in sorted(scores) if p.startswith("-V2bE8nDsdo/")]
        lines.append("  Tim's 10 outfits: " + " · ".join(f"{p.split('/')[1][:8]} {s}" for p, s in tim10))
    txt = "\n".join(lines)
    (OUT / "report.txt").write_text(txt + "\n")
    print(txt)


if __name__ == "__main__":
    main()
