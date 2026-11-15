"""T96 face-model test (Nov 15, $0, Mac only): do BlazeFace or YuNet find the faces the round-3 sweep still sends?

  PY=/Users/eyu/Desktop/files/Kitted/inputs/face-models/venv/bin/python
  $PY -I extraction-test/vision/face_model_probe.py collect [--sets built,leak,heldout,normal,extra]
  $PY -I extraction-test/vision/face_model_probe.py detect
  $PY -I extraction-test/vision/face_model_probe.py report

A test, not a build: nothing in the app changes. `collect` runs the round-3 build's own Prep.run (through the locked
face_leak_test.py's driver, imported unmodified) and keeps the fit upload each photo would send, in
inputs/face-models/run/ (git-ignored: other people's photos). `detect` runs every model config on those copies and
keeps every box. `report` scores them: leaks caught by list, and new boxes on the normal set (false alarms), split into
"on him" (inside his person box) and elsewhere, with crop sheets for the eye in extraction-test/results/t96-face-models/.
"""
import argparse
import json
import math
import os
import shutil
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import face_leak_test as flt  # the locked T96 harness, imported, never edited

REPO = flt.REPO
KIT = flt.KIT
FM = KIT / "inputs" / "face-models"
RUN = FM / "run"
OUT = REPO / "extraction-test" / "results" / "t96-face-models"
YUNET = FM / "yunet" / "face_detection_yunet_2023mar.onnx"
BLAZE = {"short": FM / "blazeface-short" / "blaze_face_short_range.tflite",
         "full": FM / "blazeface-full" / "blaze_face_full_range.tflite"}

# The held-out and baseline photos the round-3 eye check named (TASK.md -> Review -> The eye).
EXTRA = ["inputs/fashionpedia/images/test/" + f for f in sorted(os.listdir(flt.FP))
         if f.startswith(("5afdd6632b3d", "eaac0d86af82", "e915a35a67ac", "e58d6e9e4200"))] + \
        ["inputs/youtube/shots/FlQ3WZ-H2Ik/f-08-40.jpg"]


# ---------------------------------------------------------------- collect: the copies the round-3 build sends
class Args:
    full, quick = False, False


def save_upload(r, dest):
    src = flt.uri_path(r["uploadUri"])
    shutil.copyfile(src, dest)
    with Image.open(dest) as im:
        return im.size


def collect_plain(ctx, name, photos, meta, with_main=False):
    d = RUN / name
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True)
    recs = []
    for part in flt.chunks(photos, 15):
        tmp = ctx.scratch()
        res = ctx.new.call("prep", [{"photo": str(KIT / p), "root": flt.fresh_root(tmp)} for p in part])
        locs = ctx.new.call("locate", [{"photo": str(KIT / p)} for p in part]) if with_main else [None] * len(part)
        for p, r, loc in zip(part, res, locs):
            rec = {"photo": p, **meta.get(p, {}), "status": r.get("status"), "reason": r.get("reason")}
            if r.get("status") == "ok":
                f = d / f"{len(recs):04d}.jpg"
                uw, uh = save_upload(r, f)
                rec.update(upload=str(f), size=[uw, uh], hidden=r.get("hidden") or [])
                if loc and loc.get("main"):
                    W, H = loc["size"]
                    rec["him"] = [loc["main"][0] / W, loc["main"][1] / H, loc["main"][2] / W, loc["main"][3] / H]
            recs.append(rec)
        shutil.rmtree(tmp, ignore_errors=True)
        print(f"  {name}: {len(recs)}/{len(photos)}", flush=True)
    (RUN / f"{name}.json").write_text(json.dumps(recs, indent=1))


def collect_built(ctx):
    d = RUN / "built"
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True)
    kept = {}
    real_judge = flt.judge

    def judge(res, kind, orig, cores, names=None):
        p = res.get("_photo", "")
        if p.startswith("/private/tmp/t96-built-") and res.get("status") == "ok" and p not in kept:
            f = d / f"{len(kept):04d}.jpg"
            uw, uh = save_upload(res, f)
            kept[p] = {"upload": str(f), "size": [uw, uh], "hidden": res.get("hidden") or [], "work": [orig.shape[1], orig.shape[0]]}
        return real_judge(res, kind, orig, cores, names)

    flt.judge = judge
    ctx.full = True
    try:
        fails, rep = flt.check_built_small(ctx)
    finally:
        flt.judge = real_judge
    recs = []
    for b in rep.get("photos_detail", []):
        k = kept.get(b["file"])
        rec = {"photo": b["file"], "host": b["host"], "status": b["status"]}
        if k:
            s = k["size"][0] / k["work"][0]
            rec.update(upload=k["upload"], size=k["size"], hidden=k["hidden"])
            hb = None
            rec["faces"] = [{"kind": f["kind"], "px": f["px"], "band": f["band"], "where": f["where"], "variant": f["variant"],
                             "edge": f["edge"], "eyesInFrame": f["eyesInFrame"], "caught": f["caught"],
                             "core": [v * s for v in f["core"]]} for f in b["faces"]]
        recs.append(rec)
    # his box on each built photo: the host's person box (the host photos are his own normal photos)
    hosts = sorted({r["host"] for r in recs})
    locs = ctx.new.call("locate", [{"photo": str(KIT / h)} for h in hosts])
    him = {h: ([l["main"][0] / l["size"][0], l["main"][1] / l["size"][1], l["main"][2] / l["size"][0], l["main"][3] / l["size"][1]]
               if l.get("main") else None) for h, l in zip(hosts, locs)}
    for r in recs:
        r["him"] = him.get(r["host"])
    (RUN / "built.json").write_text(json.dumps({"fails": fails, "photos": recs}, indent=1))
    print(f"  built: {len(recs)} photos, {sum(len(r.get('faces', [])) for r in recs)} faces; harness fails: {fails}", flush=True)


def collect_masks(ctx):
    """The person mask (Measure.personMask, the app's own) of each normal photo and each built photo's host, for the
    "never on his outline" rule. Built photos use their host's mask (the pasted faces aren't in it)."""
    d = RUN / "masks"
    d.mkdir(parents=True, exist_ok=True)
    for s in ("normal", "built", "leak", "heldout", "extra"):
        data = json.loads((RUN / f"{s}.json").read_text())
        recs = data["photos"] if isinstance(data, dict) else data
        todo = [r for r in recs if "upload" in r and not (r.get("mask") and os.path.exists(r["mask"]))]
        for part in flt.chunks(todo, 20):
            if s in ("leak", "heldout", "extra"):  # his box: locate's main, as on the normal set
                for r, l in zip(part, ctx.new.call("locate", [{"photo": str(KIT / r["photo"])} for r in part])):
                    if l.get("main"):
                        W, H = l["size"]
                        r["him"] = [l["main"][0] / W, l["main"][1] / H, l["main"][2] / W, l["main"][3] / H]
            jobs = [{"photo": str(KIT / (r["host"] if s == "built" else r["photo"])), "png": str(d / f"{s}-{Path(r['upload']).stem}.png"), "w": 384}
                    for r in part]
            rows = ctx.main.call("mask", jobs)
            for r, j, row in zip(part, jobs, rows):
                r["mask"] = j["png"] if "error" not in row else None
        (RUN / f"{s}.json").write_text(json.dumps(data, indent=1))
        print(f"  masks {s}: {sum(1 for r in recs if r.get('mask'))}/{sum(1 for r in recs if 'upload' in r)}", flush=True)


def cmd_collect(sets):
    RUN.mkdir(parents=True, exist_ok=True)
    flt.OUT = OUT / "harness-sheets"  # the harness's own sheets go here, never over results/t96
    ctx = flt.Ctx(Args())
    try:
        if "extra" in sets:
            collect_plain(ctx, "extra", EXTRA, {})
        if "leak" in sets:
            rows = json.loads((flt.BASE / "leak-set.json").read_text())
            collect_plain(ctx, "leak", [r["photo"] for r in rows], {r["photo"]: {"source": r["source"]} for r in rows})
        if "normal" in sets:
            rows = [r for r in json.loads((flt.BASE / "normal-set.json").read_text()) if r["before"] == "ok"]
            collect_plain(ctx, "normal", [r["photo"] for r in rows], {r["photo"]: {"source": r["source"]} for r in rows}, with_main=True)
        if "heldout" in sets:
            collect_plain(ctx, "heldout", [flt.no_kit(p) for p in flt.heldout_photos()], {})
        if "built" in sets:
            collect_built(ctx)
        if "masks" in sets:
            collect_masks(ctx)
    finally:
        shutil.rmtree(ctx.tmp, ignore_errors=True)
        if getattr(ctx, "_built", None):
            shutil.rmtree(ctx._built, ignore_errors=True)


# ---------------------------------------------------------------- detect: every model config on every copy
FLOOR = 0.25


class YuNet:
    def __init__(self):
        import cv2
        self.cv2 = cv2
        self.det = cv2.FaceDetectorYN.create(str(YUNET), "", (320, 320), FLOOR, 0.3, 5000)

    def run(self, arr):  # RGB array -> [[x, y, w, h, score]] in its pixels
        h, w = arr.shape[:2]
        self.det.setInputSize((w, h))
        _, f = self.det.detect(np.ascontiguousarray(arr[:, :, ::-1]))
        return [] if f is None else [[float(v) for v in (*r[:4], r[14])] for r in f]


class Blaze:
    def __init__(self, which):
        import mediapipe as mp
        self.mp = mp
        o = mp.tasks.vision.FaceDetectorOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(BLAZE[which])),
                                                min_detection_confidence=FLOOR, min_suppression_threshold=0.3)
        self.det = mp.tasks.vision.FaceDetector.create_from_options(o)

    def run(self, arr):
        r = self.det.detect(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=np.ascontiguousarray(arr)))
        return [[float(x.bounding_box.origin_x), float(x.bounding_box.origin_y), float(x.bounding_box.width),
                 float(x.bounding_box.height), float(x.categories[0].score)] for x in r.detections]


# name -> (model, grids, long edge each tile is scaled to; None = the tile as it is)
CONFIGS = {
    "yunet-1x1-1024": ("yunet", [1], None),
    "yunet-123-640": ("yunet", [1, 2, 3], 640),
    "yunet-123-1024": ("yunet", [1, 2, 3], 1024),
    "blaze-full-123": ("full", [1, 2, 3], None),
    "blaze-full-12345": ("full", [1, 2, 3, 4, 5], None),
    "blaze-short-12345": ("short", [1, 2, 3, 4, 5], None),
}


def run_config(model, grids, edge, arr):
    H, W = arr.shape[:2]
    out = []
    for x, y, w, h in flt.oracle_tiles(W, H, grids):
        t = arr[y:y + h, x:x + w]
        z = 1.0
        if edge:
            z = edge / max(w, h)
            t = np.asarray(Image.fromarray(t).resize((max(1, round(w * z)), max(1, round(h * z))), Image.BILINEAR))
        for b in model.run(t):
            out.append([x + b[0] / z, y + b[1] / z, b[2] / z, b[3] / z, b[4]])
    return out


def cmd_detect(only):
    sets = [s for s in ("extra", "leak", "built", "normal", "heldout") if (RUN / f"{s}.json").exists()]
    models = {}
    for name, (m, grids, edge) in CONFIGS.items():
        if only and name not in only:
            continue
        if m not in models:
            models[m] = YuNet() if m == "yunet" else Blaze(m)
        for s in sets:
            data = json.loads((RUN / f"{s}.json").read_text())
            recs = data["photos"] if isinstance(data, dict) else data
            res, ms = {}, []
            for r in recs:
                if "upload" not in r:
                    continue
                arr = flt.rgb(r["upload"])
                t0 = time.perf_counter()
                res[r["upload"]] = run_config(models[m], grids, edge, arr)
                ms.append((time.perf_counter() - t0) * 1000)
            (RUN / f"det-{s}-{name}.json").write_text(json.dumps({"boxes": res, "ms": ms}))
            print(f"  {name} on {s}: {len(res)} photos, median {np.median(ms):.0f} ms", flush=True)


# ---------------------------------------------------------------- report
THRESH = {"yunet": [0.3, 0.5, 0.6, 0.7, 0.8, 0.9], "full": [0.3, 0.5, 0.7], "short": [0.3, 0.5, 0.7]}


def head_box(b):
    """KittedPrep.headBox(around:): 1.6 × the width, 1.9 × the height, centred a little above the box's middle."""
    w, h = b[2] * 1.6, b[3] * 1.9
    return [b[0] + b[2] / 2 - w / 2, b[1] + b[3] / 2 - h * 0.55, w, h]


def area(r):
    return max(0, r[2]) * max(0, r[3])


def inside_share(r, rects, W, H):
    """Share of r (clipped to the image) inside the union of rects (pixels), on a 1 px grid."""
    x0, y0 = max(0, int(math.floor(r[0]))), max(0, int(math.floor(r[1])))
    x1, y1 = min(W, int(math.ceil(r[0] + r[2]))), min(H, int(math.ceil(r[1] + r[3])))
    if x1 <= x0 or y1 <= y0:
        return 0.0
    m = np.zeros((y1 - y0, x1 - x0), bool)
    for q in rects:
        a0, b0 = max(x0, int(math.floor(q[0]))), max(y0, int(math.floor(q[1])))
        a1, b1 = min(x1, int(math.ceil(q[0] + q[2]))), min(y1, int(math.ceil(q[1] + q[3])))
        if a1 > a0 and b1 > b0:
            m[b0 - y0:b1 - y0, a0 - x0:a1 - x0] = True
    return float(m.mean())


def boxes_at(raw, thr):
    keep = sorted([b for b in raw if b[4] >= thr], key=lambda b: -b[4])
    return flt.dedupe(keep, 0.5)


RULE = {"outline": False}
_outlines = {}


def his_outline(rec):
    """His outline in the upload's pixels: the person mask inside his box grown 10% (None when either is missing)."""
    k = rec["upload"]
    if k not in _outlines:
        o = None
        if rec.get("mask") and rec.get("him") and os.path.exists(rec["mask"]):
            W, H = rec["size"]
            m = np.asarray(Image.open(rec["mask"]).convert("L").resize((W, H), Image.NEAREST)) > 127
            hb = flt.grow([rec["him"][0] * W, rec["him"][1] * H, rec["him"][2] * W, rec["him"][3] * H], 0.1)
            box = np.zeros_like(m)
            x0, y0 = max(0, int(hb[0])), max(0, int(hb[1]))
            box[y0:max(y0, int(math.ceil(hb[1] + hb[3]))), x0:max(x0, int(math.ceil(hb[0] + hb[2])))] = True
            o = m & box
        _outlines[k] = o
    return _outlines[k]


def on_outline(rec, b):
    o = his_outline(rec)
    if o is None:
        return 0.0
    H, W = o.shape
    x0, y0 = max(0, int(math.floor(b[0]))), max(0, int(math.floor(b[1])))
    x1, y1 = min(W, int(math.ceil(b[0] + b[2]))), min(H, int(math.ceil(b[1] + b[3])))
    return float(o[y0:y1, x0:x1].mean()) if x1 > x0 and y1 > y0 else 0.0


def new_boxes(rec, boxes):
    """Model boxes that would add hiding: less than half inside what the round-3 copy already hides, and (with the
    outline rule) less than half on his own outline."""
    W, H = rec["size"]
    hid = [[q[0] * W, q[1] * H, q[2] * W, q[3] * H] for q in rec["hidden"]]
    out = [b for b in boxes if inside_share(b, hid, W, H) < 0.5]
    if RULE["outline"]:
        out = [b for b in out if on_outline(rec, b) < 0.5]
    return out


def on_him(rec, b):
    if not rec.get("him"):
        return False
    W, H = rec["size"]
    m = rec["him"]
    cx, cy = b[0] + b[2] / 2, b[1] + b[3] / 2
    return m[0] * W <= cx <= (m[0] + m[2]) * W and m[1] * H <= cy <= (m[1] + m[3]) * H


class Sheet:
    def __init__(self, name):
        self.dir = OUT / name
        shutil.rmtree(self.dir, ignore_errors=True)
        self.dir.mkdir(parents=True)
        self.items = []

    def add(self, label, path, box):
        with Image.open(path) as im:
            im = im.convert("RGB")
            W, H = im.size
            pad = max(box[2], box[3], 12)
            r = (max(0, int(box[0] - pad)), max(0, int(box[1] - pad)), min(W, int(box[0] + box[2] + pad)), min(H, int(box[1] + box[3] + pad)))
            if r[2] <= r[0] or r[3] <= r[1]:
                return
            c = im.crop(r)
            ImageDraw.Draw(c).rectangle([box[0] - r[0], box[1] - r[1], box[0] - r[0] + box[2], box[1] - r[1] + box[3]], outline=(255, 0, 0))
            s = max(1, min(4, int(180 / max(c.width, c.height)) or 1))
            self.items.append((label[:36], c.resize((c.width * s, c.height * s), Image.NEAREST)))

    def finish(self):
        T_, cols, rows = 200, 6, 5
        per = cols * rows
        for page in range(0, len(self.items), per):
            sheet = Image.new("RGB", (cols * T_, rows * (T_ + 16)), "white")
            d = ImageDraw.Draw(sheet)
            for i, (lab, im) in enumerate(self.items[page:page + per]):
                im = im.copy()
                im.thumbnail((T_, T_))
                x, y = (i % cols) * T_, (i // cols) * (T_ + 16)
                sheet.paste(im, (x, y + 16))
                d.text((x + 2, y + 2), f"{page + i} {lab}", fill="black")
            sheet.save(self.dir / f"sheet{page // per:02d}.jpg", quality=88)
        return len(self.items)


def load(s, cfg):
    f = RUN / f"det-{s}-{cfg}.json"
    return json.loads(f.read_text()) if f.exists() else None


def recs_of(s):
    data = json.loads((RUN / f"{s}.json").read_text())
    return [r for r in (data["photos"] if isinstance(data, dict) else data) if "upload" in r]


def caught(rec, face, boxes):
    W, H = rec["size"]
    c = face["core"]
    vis = flt.inter(c, [0, 0, W, H])
    if not vis:
        return False
    return inside_share(vis, [head_box(b) for b in (new_boxes(rec, boxes) if RULE["outline"] else boxes)], W, H) >= 0.9


def cmd_report(sheet_cfgs, outline=False):
    RULE["outline"] = outline
    otag = "+outline" if outline else ""
    OUT.mkdir(parents=True, exist_ok=True)
    built = recs_of("built")
    normal = recs_of("normal")
    leak = recs_of("leak")
    held = recs_of("heldout") if (RUN / "heldout.json").exists() else []
    summary = {"built": {"photos": len(built), "faces": sum(len(r["faces"]) for r in built),
                         "missed_by_round3": sum(1 for r in built for f in r["faces"] if f["caught"] == "missed")},
               "normal_photos": len(normal), "leak_photos": len(leak), "heldout_photos": len(held), "configs": {}}
    for cfg, (m, grids, edge) in CONFIGS.items():
        db, dn, dl, dh = load("built", cfg), load("normal", cfg), load("leak", cfg), load("heldout", cfg)
        if not (db and dn):
            continue
        rows = {}
        for thr in THRESH[m]:
            row = {}
            # built faces: the ones round 3 still sends, by group; and every pasted face (the model alone)
            groups = {"missed: frontal 12-19": lambda f: f["kind"] == "frontal" and f["band"] == "12-19",
                      "missed: frontal 20-64": lambda f: f["kind"] == "frontal" and f["band"] != "12-19",
                      "missed: profile 12-19": lambda f: f["kind"] == "profile" and f["band"] == "12-19",
                      "missed: profile 20-31": lambda f: f["kind"] == "profile" and f["band"] == "20-31",
                      "missed: profile 32-64": lambda f: f["kind"] == "profile" and f["band"] == "32-64",
                      "missed: cut by the edge": lambda f: f["edge"]}
            for g, fn in groups.items():
                fs = [(r, f) for r in built for f in r["faces"] if f["caught"] == "missed" and fn(f)]
                row[g] = [sum(1 for r, f in fs if caught(r, f, boxes_at(db["boxes"][r["upload"]], thr))), len(fs)]
            miss = [(r, f) for r in built for f in r["faces"] if f["caught"] == "missed"]
            row["missed: all"] = [sum(1 for r, f in miss if caught(r, f, boxes_at(db["boxes"][r["upload"]], thr))), len(miss)]
            # false alarms: new boxes on the built photos that aren't a pasted face, and on the normal set
            fa_built_him = fa_built_else = 0
            for r in built:
                for b in new_boxes(r, boxes_at(db["boxes"][r["upload"]], thr)):
                    if any(flt.overlaps(b, flt.grow(f["core"], 0.3)) for f in r["faces"]):
                        continue
                    if on_him(r, b):
                        fa_built_him += 1
                    else:
                        fa_built_else += 1
            nb = {r["upload"]: new_boxes(r, boxes_at(dn["boxes"][r["upload"]], thr)) for r in normal}
            row["normal: photos with a new box"] = sum(1 for v in nb.values() if v)
            row["normal: new boxes on him"] = sum(1 for r in normal for b in nb[r["upload"]] if on_him(r, b))
            row["normal: photos with a box on him"] = sum(1 for r in normal if any(on_him(r, b) for b in nb[r["upload"]]))
            row["normal: new boxes elsewhere"] = sum(1 for r in normal for b in nb[r["upload"]] if not on_him(r, b))
            his = [r for r in normal if r["source"] in flt.HIS]
            row["his own photos (phone + mirror set): with a new box"] = [sum(1 for r in his if nb[r["upload"]]), len(his)]
            row["built: new boxes on him"], row["built: new boxes elsewhere (not a pasted face)"] = fa_built_him, fa_built_else
            if dl:
                lb = {r["upload"]: new_boxes(r, boxes_at(dl["boxes"][r["upload"]], thr)) for r in leak}
                row["leak set: photos with a new box"] = sum(1 for v in lb.values() if v)
                row["leak set: new boxes"] = sum(len(v) for v in lb.values())
            if dh:
                hb = {r["upload"]: new_boxes(r, boxes_at(dh["boxes"][r["upload"]], thr)) for r in held}
                row["held out: photos with a new box"] = sum(1 for v in hb.values() if v)
                row["held out: new boxes"] = sum(len(v) for v in hb.values())
            rows[str(thr)] = row
        ms = dn["ms"]
        summary["configs"][cfg] = {"model": m, "grids": grids, "tile_edge": edge, "calls_per_photo": sum(n * n for n in grids),
                                   "ms_median_normal": round(float(np.median(ms))), "ms_p95_normal": round(float(np.percentile(ms, 95))),
                                   "by_threshold": rows}
    # crop sheets for the eye
    sheets = {}
    for spec in sheet_cfgs:
        cfg, thr = spec.split("@")
        thr = float(thr)
        for s, recs in (("normal", normal), ("leak", leak), ("heldout", held), ("built", built), ("extra", recs_of("extra") if (RUN / "extra.json").exists() else [])):
            d = load(s, cfg)
            if not d or not recs:
                continue
            sh = Sheet(f"{cfg}@{thr}{otag}/{s}")
            for i, r in enumerate(recs):
                for b in new_boxes(r, boxes_at(d["boxes"][r["upload"]], thr)):
                    if s == "built" and any(flt.overlaps(b, flt.grow(f["core"], 0.3)) for f in r["faces"]):
                        continue
                    tag = "HIM" if on_him(r, b) else "bg"
                    sh.add(f"{tag} {b[4]:.2f} {Path(r['photo']).stem[:10]}", r["upload"], b)
            if s == "built":  # and the round-3 misses: caught (green label) or not
                sh2 = Sheet(f"{cfg}@{thr}{otag}/built-misses")
                for r in recs:
                    bx = boxes_at(d["boxes"][r["upload"]], thr)
                    for f in r["faces"]:
                        if f["caught"] == "missed":
                            ok = caught(r, f, bx)
                            sh2.add(f"{'CAUGHT' if ok else 'missed'} {f['kind'][:4]} {f['px']}px {f['variant'] or f['where']}", r["upload"], f["core"])
                sheets[f"{cfg}@{thr}{otag}/built-misses"] = sh2.finish()
            sheets[f"{cfg}@{thr}{otag}/{s}"] = sh.finish()
        # the eye-list photos whole, every box drawn: red = would add hiding, blue = already hidden in round 3's copy
        d = load("extra", cfg)
        if d:
            od = OUT / f"{cfg}@{thr}{otag}" / "extra-whole"
            od.mkdir(parents=True, exist_ok=True)
            for r in recs_of("extra"):
                bx = boxes_at(d["boxes"][r["upload"]], thr)
                nb = new_boxes(r, bx)
                with Image.open(r["upload"]) as im:
                    im = im.convert("RGB")
                    dr = ImageDraw.Draw(im)
                    for b in bx:
                        dr.rectangle([b[0], b[1], b[0] + b[2], b[1] + b[3]], outline=(255, 0, 0) if b in nb else (0, 90, 255), width=2)
                        dr.text((b[0], b[1] - 10), f"{b[4]:.2f}", fill=(255, 0, 0) if b in nb else (0, 90, 255))
                    im.save(od / (Path(r["photo"]).stem[:16] + ".jpg"), quality=90)
    summary["sheets"] = sheets
    summary["outline_rule"] = outline
    (OUT / f"summary{otag}.json").write_text(json.dumps(summary, indent=1))
    print(json.dumps(summary, indent=1))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("collect")
    c.add_argument("--sets", default="extra,leak,normal,heldout,built")
    dd = sub.add_parser("detect")
    dd.add_argument("--only", action="append")
    r = sub.add_parser("report")
    r.add_argument("--sheet", action="append", default=[], help="config@threshold to draw crop sheets for")
    r.add_argument("--outline", action="store_true", help="drop model boxes that are mostly on his own outline")
    a = ap.parse_args()
    if a.cmd == "collect":
        cmd_collect(a.sets.split(","))
    elif a.cmd == "detect":
        cmd_detect(a.only)
    else:
        cmd_report(a.sheet, a.outline)


if __name__ == "__main__":
    main()
