#!/usr/bin/env python3
"""MediaPipe's pose as two more body rulers for the waist test (DECISIONS-LOG #269). Run with the sandboxed env:

  extraction-test/.venv-mp/bin/python -I extraction-test/waist_mediapipe.py results/waist2

For every photo and pitch already run by waist_rulers.py, it tilts the photo the same way (the same homography as
kmeasure's --pitch), runs MediaPipe Pose Landmarker (heavy; inputs/mediapipe/pose_landmarker_heavy.task, Apache 2.0),
and reads the clothes edge that kmeasure found against:
  mp_ansur  MediaPipe's 2D shoulders, knees and ankles with the ANSUR II heights (a projective fit, like ska_proj)
  mp_proj   MediaPipe's own 3D joint heights (meters) fit to where they land in the photo (like a3d_proj)
Writes <out>/mediapipe.json: {photo: {pitch: {ruler: {edge: t}}}}. The body is only a ruler; nothing is stored but t.
"""
import json, math, sys
from pathlib import Path

import cv2
import numpy as np
import mediapipe as mp

HERE = Path(__file__).resolve().parent
MODEL = HERE.parent / "inputs" / "mediapipe" / "pose_landmarker_heavy.task"
H_S, H_K, H_A, RIDGE = 144.07, 48.0, 7.29, 0.02
EDGES = ["top_end_s", "pants_start_s", "visual_s"]


def tilt(img, deg):
    if deg == 0:
        return img
    h, w = img.shape[:2]
    f = max(w, h) / 2 / math.tan(math.radians(34.5))
    a = math.radians(deg)
    K = np.array([[f, 0, w / 2], [0, f, h / 2], [0, 0, 1]])
    R = np.array([[1, 0, 0], [0, math.cos(a), -math.sin(a)], [0, math.sin(a), math.cos(a)]])
    Hm = K @ R @ np.linalg.inv(K)
    return cv2.warpPerspective(img, Hm, (w, h), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))


def projective(pts, ridge=0.0):
    """h = (a d + b) / (c d + 1), least squares, optional prior on c (as BodyRuler.projective)."""
    if len(pts) < 3:
        return None
    A = np.array([[d, 1, -d * h] for d, h in pts]); y = np.array([h for _, h in pts])
    ata, atb = A.T @ A, A.T @ y
    if ridge:
        ds, hs = [d for d, _ in pts], [h for _, h in pts]
        ata[2, 2] += (ridge * (max(ds) - min(ds)) * (max(hs) - min(hs))) ** 2
    try:
        a, b, c = np.linalg.solve(ata, atb)
    except np.linalg.LinAlgError:
        return None
    lo, hi = min(d for d, _ in pts), max(d for d, _ in pts)
    if (c * lo + 1) * (c * hi + 1) <= 0:
        return None
    return lambda d: (a * d + b) / (c * d + 1)


def main(out):
    out = Path(out)
    man = json.loads((out / "manifest.json").read_text())
    opts = mp.tasks.vision.PoseLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
                                                 running_mode=mp.tasks.vision.RunningMode.IMAGE, num_poses=3)
    det = mp.tasks.vision.PoseLandmarker.create_from_options(opts)
    res = {}
    for i, p in enumerate(man):
        img0 = cv2.imread(p["path"], cv2.IMREAD_COLOR)
        if img0 is None:
            continue
        for f in sorted((out / "runs").glob(f"{p['id']}.p*.json")):
            run = json.loads(f.read_text())
            w = run.get("waist") or {}
            j = run.get("joints") or {}
            if run.get("status") != "ok" or "T" not in w or not all(k in j for k in ("lHip", "rHip", "lShoulder", "rShoulder")):
                continue
            pitch = int(f.name.split(".p")[-1].split(".json")[0])
            sw, sh = run["w"], run["h"]                    # the statistics copy the joints and edges are in
            Hx, Hy = (j["lHip"]["x"] + j["rHip"]["x"]) / 2, (j["lHip"]["y"] + j["rHip"]["y"]) / 2
            Sx, Sy = (j["lShoulder"]["x"] + j["rShoulder"]["x"]) / 2, (j["lShoulder"]["y"] + j["rShoulder"]["y"]) / 2
            L = math.hypot(Sx - Hx, Sy - Hy)
            ux, uy = (Sx - Hx) / L, (Sy - Hy) / L
            T = w["T"]

            def down(x, y):
                return (x - Hx) * -ux + (y - Hy) * -uy

            img = tilt(img0, pitch)
            rgb = cv2.cvtColor(cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
            r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
            if not r.pose_landmarks:
                continue
            # The person whose hip midpoint is closest to Vision's (the same person kmeasure measured).
            best = min(range(len(r.pose_landmarks)), key=lambda k: math.hypot(
                (r.pose_landmarks[k][23].x + r.pose_landmarks[k][24].x) / 2 * sw - Hx, (r.pose_landmarks[k][23].y + r.pose_landmarks[k][24].y) / 2 * sh - Hy))
            lm, wl = r.pose_landmarks[best], r.pose_world_landmarks[best]

            def pt(a, b):
                if min(lm[a].visibility, lm[b].visibility) < 0.3:
                    return None
                return down((lm[a].x + lm[b].x) / 2 * sw, (lm[a].y + lm[b].y) / 2 * sh)

            dS, dK, dA = pt(11, 12), pt(25, 26), pt(27, 28)
            rulers = {}
            fa = projective([(dS, H_S), (dK, H_K), (dA, H_A)], RIDGE) if None not in (dS, dK, dA) else None
            if fa:
                rulers["mp_ansur"] = {e: round((H_S - fa(-w[e] * T)) / (H_S - H_K), 3) for e in EDGES if e in w}
            # MediaPipe world: meters from the hip center, y down. Heights up from the lower ankle.
            hw = {k: -wl[k].y for k in (11, 12, 23, 24, 25, 26, 27, 28)}
            floor = min(hw[27], hw[28])
            pts = [(down(lm[k].x * sw, lm[k].y * sh), hw[k] - floor) for k in (11, 12, 23, 24, 25, 26, 27, 28) if lm[k].visibility >= 0.3]
            fp = projective(pts, RIDGE)
            hS, hK = (hw[11] + hw[12]) / 2 - floor, (hw[25] + hw[26]) / 2 - floor
            if fp and hS - hK > 0.2:
                rulers["mp_proj"] = {e: round((hS - fp(-w[e] * T)) / (hS - hK), 3) for e in EDGES if e in w}
            if rulers:
                res.setdefault(p["id"], {})[pitch] = rulers
        if i % 25 == 0:
            print(i, "/", len(man), flush=True)
    (out / "mediapipe.json").write_text(json.dumps(res, indent=1))
    print("photos with MediaPipe rulers:", len(res))


if __name__ == "__main__":
    main(sys.argv[1])
