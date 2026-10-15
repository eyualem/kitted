#!/usr/bin/env python3
"""The hem from the body (founder, Oct 15; the brief in CLAUDE.md "The hem from the body"). Mac harness only: nothing
here is in the app, no photo is sent anywhere, no API call is made.

The waistline work (#264, #269) found the trick: use the body as a RULER and measure the clothes against it. This does
the same for where the pants meet the shoe, and tests six ideas against the blind hem labels (hem3_labels.csv) and the
AI's own hem-crop answers (results/hem3/raw.json, the same 78 photos):

  1. hem_cm      the pants' end, in cm above the floor, on a knee -> floor ruler (ANSUR II knee 48.0 cm + a stated sole)
                 and against the predicted ankle bone (7.3 cm + sole). A cropped hem sits above it, a break covers it.
  2. extra length: (a) widen, the outline's width in the last ~12 cm above the hem over its width at the shin, both in
                 ruler cm (pants against pants); (b) folds, horizontal light/dark bands in that window over the same
                 fabric's texture at mid-shin (fabric against itself), on the full-resolution photo
  3. shoe ruler  heel -> toe (MediaPipe) as a second ruler: the shoe showing below the hem, in shoe lengths
  4. outline     the hem line across the leg: its tilt (a break dips at the back) and how ragged it is (bunching)
  5. left/right  a stack is rarely the same on both legs; a clean hem usually is
  6. tape inseams (his pants' inseam minus his own) needs him with a tape measure: not testable yet

The body is only a ruler (CLAUDE.md "never rate bodies"; #187): joints say where to measure and what one cm is; every
output is a garment position or a garment-against-garment ratio, the same constants apply to everyone, and nothing
about the body is reported, scored or stored.

Inputs per photo: Apple Vision's joints from the waist runs (results/waist4/runs/<id>.p<pitch>.json, the app's own
Swift, at the 1024 statistics copy) for the shoulder -> knee ruler, and MediaPipe Pose Landmarker heavy (Apache 2.0,
inputs/mediapipe/, OK'd for #269) for the knees, ankles, heels, toes and his outline (segmentation mask).

  extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py extract      # MediaPipe, cached per photo + pitch
  extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py measure      # features -> results/hem4/features.json
  extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py report       # dev/test, the AI, the bar
"""
import csv, json, math, statistics as st, sys
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "hem4"
CACHE = OUT / "mp"
WAIST = HERE / "results" / "waist4"
MODEL = HERE.parent / "inputs" / "mediapipe" / "pose_landmarker_heavy.task"
LABELS = HERE / "hem3_labels.csv"
PITCHES = [0, 10, -10]
WORK = 2048  # the app's working size (Prep.workPx)

# MediaPipe pose landmark indices
L_KNEE, R_KNEE, L_ANK, R_ANK, L_HEEL, R_HEEL, L_TOE, R_TOE = 25, 26, 27, 28, 29, 30, 31, 32
SIDES = {"l": (L_KNEE, L_ANK, L_HEEL, L_TOE), "r": (R_KNEE, R_ANK, R_HEEL, R_TOE)}

# The ruler (ANSUR II men's means; vision/BodyRuler.swift): knee 48.0 cm, lateral malleolus 7.3 cm, barefoot. On shoes
# everything sits one sole higher; a stated 3 cm for everyone (a sneaker's heel), never measured per person.
H_KNEE, H_ANKLE, SOLE = 48.0, 7.29, 3.0


def labeled():
    return [r for r in csv.DictReader(open(LABELS)) if r["use"] == "yes"]


def manifest():
    return {m["id"]: m for m in json.loads((WAIST / "manifest.json").read_text())}


def load_work(path):
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)  # applies EXIF orientation, as Prep.decode does
    if img is None:
        return None
    h, w = img.shape[:2]
    s = min(1.0, WORK / max(h, w))
    if s < 1:
        img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    return img


def tilt(img, deg):
    """The same exact homography as kmeasure --pitch (a camera pitched by deg, turning about its own center)."""
    if deg == 0:
        return img
    h, w = img.shape[:2]
    f = max(w, h) / 2 / math.tan(math.radians(34.5))
    a = math.radians(deg)
    K = np.array([[f, 0, w / 2], [0, f, h / 2], [0, 0, 1]])
    R = np.array([[1, 0, 0], [0, math.cos(a), -math.sin(a)], [0, math.sin(a), math.cos(a)]])
    return cv2.warpPerspective(img, K @ R @ np.linalg.inv(K), (w, h), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))


def vision_run(pid, pitch):
    f = WAIST / "runs" / f"{pid}.p{pitch}.json"
    return json.loads(f.read_text()) if f.exists() else None


# ---------------------------------------------------------------- stage 1: MediaPipe, cached

def extract():
    import mediapipe as mp
    CACHE.mkdir(parents=True, exist_ok=True)
    man = manifest()
    opts = mp.tasks.vision.PoseLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
                                                 running_mode=mp.tasks.vision.RunningMode.IMAGE, num_poses=3,
                                                 output_segmentation_masks=True)
    det = mp.tasks.vision.PoseLandmarker.create_from_options(opts)
    rows = labeled()
    for i, r in enumerate(rows):
        pid = r["photo"]
        img0 = None
        for pitch in PITCHES:
            dst = CACHE / f"{pid}.p{pitch}.npz"
            if dst.exists():
                continue
            if img0 is None:
                img0 = load_work(man[pid]["path"])
            img = tilt(img0, pitch)
            h, w = img.shape[:2]
            res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))))
            if not res.pose_landmarks:
                np.savez_compressed(dst, ok=False)
                continue
            # The same person Vision measured: the hip midpoint closest to Vision's.
            vr = vision_run(pid, pitch) or {}
            j = vr.get("joints") or {}
            if "lHip" in j and "rHip" in j:
                sc = w / vr["w"]
                hx, hy = (j["lHip"]["x"] + j["rHip"]["x"]) / 2 * sc, (j["lHip"]["y"] + j["rHip"]["y"]) / 2 * sc
            else:
                hx, hy = w / 2, h / 2
            best = min(range(len(res.pose_landmarks)), key=lambda k: math.hypot(
                (res.pose_landmarks[k][23].x + res.pose_landmarks[k][24].x) / 2 * w - hx, (res.pose_landmarks[k][23].y + res.pose_landmarks[k][24].y) / 2 * h - hy))
            lm = np.array([[p.x * w, p.y * h, p.z, p.visibility] for p in res.pose_landmarks[best]], dtype=np.float32)
            mask = (res.segmentation_masks[best].numpy_view()[..., 0] * 255).astype(np.uint8)
            np.savez_compressed(dst, ok=True, lm=lm, mask=mask, w=w, h=h)
        if i % 10 == 0:
            print(i, "/", len(rows), flush=True)


# ---------------------------------------------------------------- stage 2: the measurements

def bgr_lab(img):
    return cv2.cvtColor(img.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)  # L 0-100


def gsmooth(x, sigma):
    if sigma < 0.5 or len(x) < 3:
        return x.copy()
    r = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    return np.convolve(np.pad(x, r, mode="edge"), k, mode="valid")


def lasting_first(flags, start, n_hold, share=0.7):
    """First index >= start where flags holds for share of the next n_hold rows."""
    for i in range(start, len(flags)):
        if not flags[i]:
            continue
        w = flags[i:i + n_hold]
        if len(w) >= max(2, n_hold // 2) and w.mean() >= share:
            return i
    return None


def leg(side, lm, mask, lab, gy, gx, other_axis):
    kI, aI, hI, tI = SIDES[side]
    K, A, Hh, Tt = lm[kI, :2].astype(float), lm[aI, :2].astype(float), lm[hI, :2].astype(float), lm[tI, :2].astype(float)
    if lm[kI, 3] < 0.5 or lm[aI, 3] < 0.5:
        return {"why": "knee or ankle not seen"}
    H, W = mask.shape
    u = A - K
    L = float(np.hypot(*u))
    if L < 60:
        return {"why": "leg too small"}
    u /= L
    n = np.array([-u[1], u[0]])
    if abs(u[0]) > 0.45:
        return {"why": "leg not upright"}

    def on(p):
        x, y = int(round(p[0])), int(round(p[1]))
        return 0 <= x < W and 0 <= y < H and mask[y, x] > 127

    def d_of(p):
        return float((p - K) @ u)

    # The floor: walk down from the heel, the toe and the ankle along the leg until his outline (shoe) ends.
    dF, cut = 0.0, False
    for p0 in (Hh, Tt, A):
        p = p0.copy()
        if not on(p):
            continue
        k = 0
        while on(p + u * (k + 1)) and k < L * 0.12:  # a sole sits a few cm under the heel point; further is a shadow or the floor
            k += 1
        q = p + u * k
        if q[1] >= H - 3:
            cut = True
        dF = max(dF, d_of(q))
    if cut:
        return {"why": "feet cut off"}
    if dF < L * 1.0:
        return {"why": "no floor below the ankle"}
    cmpx = (H_KNEE + SOLE) / dF  # the knee -> floor ruler: cm per px along the leg

    def hgt(d):
        return (dF - d) * cmpx

    # Walk down the leg row by row (1 px), following the middle of his outline.
    oth = None
    if other_axis is not None:
        oth = other_axis
    d0 = int(dF * 0.25)
    rows = []
    c = 0.0
    for d in range(d0, int(dF)):
        base = K + u * d
        p = base + n * c
        if not on(p):
            # look sideways a little for the leg
            found = None
            for s in range(1, int(0.25 * L)):
                for sg in (1, -1):
                    if on(p + n * s * sg):
                        found = c + s * sg
                        break
                if found is not None:
                    break
            if found is None:
                rows.append(None)
                continue
            c = found
            p = base + n * c
        cap = 0.45 * L
        if oth is not None:
            ok, ou = oth
            q = ok + ou * d  # the other leg's axis at the same depth (roughly)
            cap = min(cap, 0.6 * abs(float((q - base) @ n)) + 1)
        lo = 0
        while lo < cap and on(p - n * (lo + 1)):
            lo += 1
        hi = 0
        while hi < cap and on(p + n * (hi + 1)):
            hi += 1
        capped = lo >= cap or hi >= cap
        w = lo + hi + 1
        c = c + (hi - lo) / 2.0
        mid = base + n * c
        half = max(1.5, 0.3 * w)
        offs = np.linspace(-half, half, max(5, int(2 * half)))
        pts = mid[None, :] + offs[:, None] * n[None, :]
        xs = np.clip(np.round(pts[:, 0]).astype(int), 0, W - 1)
        ys = np.clip(np.round(pts[:, 1]).astype(int), 0, H - 1)
        lb = lab[ys, xs]
        g_al = np.abs(gx[ys, xs] * u[0] + gy[ys, xs] * u[1])
        g_ac = np.abs(gx[ys, xs] * n[0] + gy[ys, xs] * n[1])
        cols = np.linspace(-0.38 * w, 0.38 * w, 9)
        cp = mid[None, :] + cols[:, None] * n[None, :]
        cxs = np.clip(np.round(cp[:, 0]).astype(int), 0, W - 1)
        cys = np.clip(np.round(cp[:, 1]).astype(int), 0, H - 1)
        rows.append({"d": d, "w": w, "capped": capped, "lab": np.median(lb, axis=0), "gal": float(g_al.mean()), "gac": float(g_ac.mean()),
                     "cols": lab[cys, cxs]})
    good = [r for r in rows if r is not None]
    if len(good) < 0.6 * len(rows):
        return {"why": "leg outline lost"}
    D = np.array([r["d"] for r in good], float)
    Hc = hgt(D)
    LAB = np.array([r["lab"] for r in good])
    Wd = np.array([r["w"] for r in good], float)
    CAP = np.array([r["capped"] for r in good])
    out = {"dF_px": round(dF, 1), "cm_per_px": round(cmpx, 4), "knee_vis": round(float(lm[kI, 3]), 2)}
    # The pants' own color: mid-shin (22-38 cm above the floor).
    ref_m = (Hc >= 22) & (Hc <= 38)
    if ref_m.sum() < 5:
        return {**out, "why": "no mid-shin"}
    ref = np.median(LAB[ref_m], axis=0)
    spread = float(np.median(np.linalg.norm(LAB[ref_m] - ref, axis=1)))
    out["pantL"] = round(float(ref[0]), 1)
    dE = gsmooth(np.linalg.norm(LAB - ref, axis=1), 0.6 / cmpx)
    thr = max(10.0, 2.5 * spread)
    below = Hc < 22
    hold = max(3, int(1.5 / cmpx))
    i0 = int(np.argmax(below)) if below.any() else None
    i_end = lasting_first(dE > thr, i0, hold) if i0 is not None else None
    # Shoe color (the bottom 2 cm): how far it is from the pants. Dark on dark = can't split by color.
    shoe_m = Hc <= 2.5
    shoe = np.median(LAB[shoe_m], axis=0) if shoe_m.sum() >= 2 else None
    if shoe is not None:
        out["pants_vs_shoe_dE"] = round(float(np.linalg.norm(shoe - ref)), 1)
    if i_end is not None:
        h_end = float(Hc[i_end])
        out["hem_cm"] = round(h_end, 1)
    # Idea 1b, the outline: where the width first drops under 75% of the pants' width just above (pants -> shoe).
    wref_m = (Hc >= 14) & (Hc <= 24) & ~CAP
    if wref_m.sum() >= 5:
        wref = float(np.median(Wd[wref_m]))
        wsm = gsmooth(Wd, 0.5 / cmpx)
        iw = lasting_first((wsm < 0.75 * wref) & ~CAP, i0, hold) if i0 is not None else None
        if iw is not None:
            out["hem_w_cm"] = round(float(Hc[iw]), 1)
    hem = out.get("hem_cm")
    if hem is None:
        out["why"] = "no hem by color"
        return out
    out["hem_vs_ankle_cm"] = round(hem - (H_ANKLE + SOLE), 1)
    out["hem_vs_mp_ankle_cm"] = round(float((d_of(A) - D[i_end]) * cmpx), 1)
    # Idea 3: the shoe as a second ruler (heel -> toe in the photo).
    shoe_len = float(np.hypot(*(Tt - Hh)))
    out["shoe_len_cm"] = round(shoe_len * cmpx, 1)
    if shoe_len > 5:
        out["shoe_below_hem_in_shoes"] = round(float((dF - D[i_end]) / shoe_len), 2)
    # Idea 2a, widen: the outline's width in the 12 cm above the hem over 18-30 cm above it (pants against pants).
    low = (Hc > hem + 1) & (Hc <= hem + 12) & ~CAP
    hiw = (Hc > hem + 18) & (Hc <= hem + 30) & ~CAP
    if low.sum() >= 4 and hiw.sum() >= 4:
        out["widen"] = round(float(np.median(Wd[low]) / np.median(Wd[hiw])), 3)
        out["hem_width_cm"] = round(float(np.median(Wd[low]) * cmpx), 1)
    # Idea 2b, folds: light/dark bands along the leg in the 13 cm above the hem, over the same fabric's at 16-32 cm
    # above it (fabric against itself); contrast relative to the fabric's lightness so black jeans aren't "flat".
    def band_energy(m):
        if m.sum() < 8:
            return None, None
        Lr = LAB[m, 0]
        res = Lr - gsmooth(Lr, 2.0 / cmpx)
        res = gsmooth(res, 0.25 / cmpx)
        e = float(np.std(res) / (np.mean(Lr) + 4))
        gal = np.array([r["gal"] for r, k in zip(good, m) if k]).mean()
        gac = np.array([r["gac"] for r, k in zip(good, m) if k]).mean()
        return e, float(gal / (gac + 1e-6))
    fl = (Hc > hem + 1) & (Hc <= hem + 14)
    fr = (Hc > hem + 16) & (Hc <= hem + 32)
    e1, o1 = band_energy(fl)
    e2, o2 = band_energy(fr)
    if e1 is not None and e2 is not None and e2 > 0:
        out["fold_ratio"] = round(e1 / e2, 3)
        out["orient_ratio"] = round(o1 / o2, 3)
        out["fold_abs"] = round(e1, 4)
    # Idea 4, the hem line across the leg: each of 9 columns' own pant end (cm); tilt and raggedness.
    ends = []
    xs = np.linspace(-0.38, 0.38, 9)
    for ci in range(9):
        cl = np.array([r["cols"][ci] for r in good])
        dc = gsmooth(np.linalg.norm(cl - ref, axis=1), 0.6 / cmpx)
        j = lasting_first(dc > thr, i0, hold)
        ends.append(float(Hc[j]) if j is not None else np.nan)
    ends = np.array(ends)
    okc = ~np.isnan(ends)
    if okc.sum() >= 6:
        A_ = np.vstack([xs[okc], np.ones(okc.sum())]).T
        sl, ic = np.linalg.lstsq(A_, ends[okc], rcond=None)[0]
        resid = ends[okc] - (sl * xs[okc] + ic)
        out["hem_tilt_cm"] = round(float(abs(sl) * 0.76), 2)  # cm of drop across the leg's middle 76%
        out["hem_ragged_cm"] = round(float(np.std(resid)), 2)
        out["hem_span_cm"] = round(float(np.max(ends[okc]) - np.min(ends[okc])), 2)
    return out


def sk_ruler(vr, sc, pt_img):
    """Vision's shoulders + knees (the waist ruler's sk_linear) extrapolated down: height (cm above the floor, on soles)
    of a point. A check on the knee -> floor ruler: where it puts the floor."""
    j = vr.get("joints") or {}
    need = ["lShoulder", "rShoulder", "lKnee", "rKnee"]
    if not all(k in j and j[k]["c"] >= 0.3 for k in need):
        return None
    S = np.array([(j["lShoulder"]["x"] + j["rShoulder"]["x"]) / 2, (j["lShoulder"]["y"] + j["rShoulder"]["y"]) / 2]) * sc
    Kn = np.array([(j["lKnee"]["x"] + j["rKnee"]["x"]) / 2, (j["lKnee"]["y"] + j["rKnee"]["y"]) / 2]) * sc
    ax = Kn - S
    Lk = float(np.hypot(*ax))
    ax /= Lk
    t = float((pt_img - S) @ ax) / Lk
    return (144.07 + SOLE) + t * ((H_KNEE + SOLE) - (144.07 + SOLE))


def measure_one(pid, pitch, man):
    f = CACHE / f"{pid}.p{pitch}.npz"
    z = np.load(f)
    if not bool(z["ok"]):
        return {"why": "no pose"}
    lm, mask = z["lm"], z["mask"]
    img = tilt(load_work(man[pid]["path"]), pitch)
    if img.shape[:2] != mask.shape:
        mask = cv2.resize(mask, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR)
    lab = bgr_lab(img)
    Lc = np.ascontiguousarray(lab[..., 0])
    gx = cv2.Sobel(Lc, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(Lc, cv2.CV_32F, 0, 1, ksize=3)
    axes = {}
    for s, (kI, aI, _, _) in SIDES.items():
        K, A = lm[kI, :2].astype(float), lm[aI, :2].astype(float)
        L = np.hypot(*(A - K))
        if L > 1:
            axes[s] = (K, (A - K) / L)
    res = {"legs": {}}
    for s in SIDES:
        res["legs"][s] = leg(s, lm, mask, lab, gy, gx, axes.get("r" if s == "l" else "l"))
    vr = vision_run(pid, pitch)
    if vr and vr.get("status") == "ok":
        sc = img.shape[1] / vr["w"]
        fl = []
        for s, lg in res["legs"].items():
            if "dF_px" in lg:
                kI, aI = SIDES[s][0], SIDES[s][1]
                K, A = lm[kI, :2].astype(float), lm[aI, :2].astype(float)
                u = (A - K) / np.hypot(*(A - K))
                v = sk_ruler(vr, sc, K + u * lg["dF_px"])
                if v is not None:
                    fl.append(v)
        if fl:
            res["sk_floor_cm"] = round(float(np.mean(fl)), 1)
    return res


def measure():
    man = manifest()
    out = {}
    for i, r in enumerate(labeled()):
        pid = r["photo"]
        out[pid] = {str(p): measure_one(pid, p, man) for p in PITCHES}
        if i % 10 == 0:
            print(i, flush=True)
    (OUT / "features.json").write_text(json.dumps(out, indent=1, default=float))
    print("wrote", OUT / "features.json")




# ---------------------------------------------------------------- stage 3: the report

def split_of(r):
    """The waist test's split (waist_test.split_of): stock + web mirror + odd gold = tune; his phone + oct7 + even gold = test."""
    import re
    g = r["group"]
    if g in ("stock", "mirror"):
        return "dev"
    if g in ("phone", "oct7"):
        return "test"
    n = int(re.sub(r"\D", "", r["photo"]) or 0)
    return "dev" if n % 2 else "test"


def truth(r, q):
    if q == "piles_or_drags":
        a, b = r["folds_above_shoe"], r["drags_at_heel"]
        return "yes" if "yes" in (a, b) else "no" if (a, b) == ("no", "no") else "unsure"
    return r[q]


def ai_runs():
    out = defaultdict(list)
    for x in json.loads((HERE / "results" / "hem3" / "raw.json").read_text()):
        j = x.get("json")
        if isinstance(j, dict):
            j = dict(j)
            a, b = j.get("folds_above_shoe"), j.get("drags_at_heel")
            j["piles_or_drags"] = "yes" if "yes" in (a, b) else "no" if (a, b) == ("no", "no") else "cant_see"
            out[x["photo"]].append(j)
    return out


def legs_of(F, pid, p="0"):
    v = F.get(pid, {}).get(p, {})
    return list((v.get("legs") or {}).values())


def feat(F, pid, name, p="0"):
    """Photo-level value of a feature; None = unsure. Directions fixed before any cut: higher = heavier for every name."""
    L = legs_of(F, pid, p)
    def vals(k):
        return [lg[k] for lg in L if k in lg]
    if name == "low_hem":          # 1. the hem's height above the floor, negated (lower hem = heavier)
        v = vals("hem_cm"); return -min(v) if v else None
    if name == "below_mp_ankle":   # 1b. the hem against MediaPipe's ankle point, negated
        v = vals("hem_vs_mp_ankle_cm"); return -min(v) if v else None
    if name == "low_hem_outline":  # 1c. the hem by the outline's width drop (pants -> shoe), negated
        v = vals("hem_w_cm"); return -min(v) if v else None
    if name == "widen":            # 2a
        v = vals("widen"); return max(v) if v else None
    if name == "folds":            # 2b
        v = vals("fold_ratio"); return max(v) if v else None
    if name == "fold_orient":      # 2b, the bands' direction
        v = vals("orient_ratio"); return max(v) if v else None
    if name == "shoe_hidden":      # 3. the shoe showing under the hem in shoe lengths, negated
        v = vals("shoe_below_hem_in_shoes"); return -min(v) if v else None
    if name == "ragged":           # 4. the hem line's raggedness
        v = vals("hem_ragged_cm"); return max(v) if v else None
    if name == "tilt":             # 4. the hem line's tilt across the leg
        v = vals("hem_tilt_cm"); return max(v) if v else None
    if name == "asym_hem":         # 5. left vs right
        v = vals("hem_cm"); return abs(v[0] - v[1]) if len(v) == 2 else None
    if name == "asym_widen":
        v = vals("widen"); return abs(v[0] - v[1]) if len(v) == 2 else None
    if name == "asym_folds":
        v = vals("fold_ratio"); return abs(v[0] - v[1]) if len(v) == 2 else None
    raise KeyError(name)


FEATS = ["low_hem", "below_mp_ankle", "low_hem_outline", "widen", "folds", "fold_orient", "shoe_hidden", "ragged", "tilt",
         "asym_hem", "asym_widen", "asym_folds"]
TARGETS = ["folds_above_shoe", "drags_at_heel", "piles_or_drags", "ankle_shows"]


def auc(pos, neg):
    if not pos or not neg:
        return None
    s = sum(1 if a > b else 0.5 if a == b else 0 for a in pos for b in neg)
    return s / len(pos) / len(neg)


def best_cut(pairs):
    """pairs [(value, is_yes)]: the cut (yes when value >= cut) with the best balanced accuracy on these photos."""
    vs = sorted({v for v, _ in pairs})
    best = (None, -1)
    for c in vs:
        tp = sum(1 for v, y in pairs if y and v >= c); fn = sum(1 for v, y in pairs if y and v < c)
        tn = sum(1 for v, y in pairs if not y and v < c); fp = sum(1 for v, y in pairs if not y and v >= c)
        if tp + fn == 0 or tn + fp == 0:
            continue
        ba = (tp / (tp + fn) + tn / (tn + fp)) / 2
        if ba > best[1]:
            best = (c, ba)
    return best


def report():
    F = json.loads((OUT / "features.json").read_text())
    rows = labeled()
    R = {r["photo"]: r for r in rows}
    AI = ai_runs()
    lines = ["# Hem ruler (hem4): report", "",
             f"{len(rows)} labeled photos (hem3_labels.csv); tune = stock + web mirror + odd gold, test = his phone + oct7 + even gold.",
             "Every feature's direction (higher = heavier) was fixed before any cut; cuts are chosen on tune only (best balanced accuracy), then applied once to test.",
             "The AI = the hem-crop yes/no answers (hem3, 3 runs, gemini-3.8-flash), every run counted, on the same photos the ruler answers.", ""]

    # --- the ruler itself
    lines += ["## The ruler", ""]
    why = Counter(lg.get("why", "measured") for pid in F for lg in legs_of(F, pid))
    nopose = sum(1 for pid in F if "legs" not in F[pid]["0"])
    lines.append(f"- Legs (2 per photo, untilted): {dict(why)}; no pose at all: {nopose} photos.")
    sk = [F[p]["0"]["sk_floor_cm"] for p in F if "sk_floor_cm" in F[p]["0"]]
    if sk:
        lines.append(f"- Shoulders + knees (the waistline ruler) extrapolated to the floor: median {st.median(sk):+.1f} cm, "
                     f"middle 80% {np.percentile(sk, 10):+.1f} to {np.percentile(sk, 90):+.1f} cm (n {len(sk)}). The knee -> floor ruler is used for the hem instead.")
    dt = defaultdict(list)
    for pid in F:
        for side in ("l", "r"):
            a = (F[pid]["0"].get("legs") or {}).get(side, {})
            for p in ("10", "-10"):
                b = (F[pid][p].get("legs") or {}).get(side, {})
                if "hem_cm" in a and "hem_cm" in b:
                    dt["hem_cm"].append(abs(a["hem_cm"] - b["hem_cm"]))
                for k in ("widen", "fold_ratio"):
                    if k in a and k in b:
                        dt[k].append(abs(a[k] - b[k]))
    for k, v in dt.items():
        lines.append(f"- Tilted ±10°, |change| in {k}: median {st.median(v):.2f}, 90th pct {np.percentile(v, 90):.2f} (n {len(v)} leg-pairs).")
    co = [abs(lg["hem_cm"] - lg["hem_w_cm"]) for pid in F for lg in legs_of(F, pid) if "hem_cm" in lg and "hem_w_cm" in lg]
    if co:
        lines.append(f"- Hem by color vs hem by the outline's width drop: median |diff| {st.median(co):.1f} cm, within 3 cm on {np.mean(np.array(co) <= 3):.0%} (n {len(co)}).")
    clean_lr = [abs(feat(F, p, "asym_hem")) for p in R if p in F and truth(R[p], "piles_or_drags") == "no" and feat(F, p, "asym_hem") is not None]
    if clean_lr:
        lines.append(f"- Left vs right hem height on clean hems (no folds, no drag): median {st.median(clean_lr):.1f} cm (n {len(clean_lr)}).")
    hems = [lg["hem_cm"] for pid in F for lg in legs_of(F, pid) if "hem_cm" in lg]
    lines.append(f"- Hem heights found: median {st.median(hems):.1f} cm above the floor (the ankle bone on shoes ~{H_ANKLE + SOLE:.1f}); "
                 f"middle 80% {np.percentile(hems, 10):.1f}-{np.percentile(hems, 90):.1f} cm.")
    # His same outfit, different photos (waist_rulers.SAME): the same pants should read the same hem height.
    same = {"grey hoodie, wide black jeans": ["phone-0d39d6", "phone-b0f0c8", "phone-d6559a", "oct7-ph1"],
            "black oversized tee, black wide jeans": ["phone-403ade", "phone-8ad378"],
            "brown checked shirt, wide jeans": ["phone-5a9049", "phone-7f14a4"],
            "grey hoodie, black joggers": ["phone-6b14db", "phone-a765e8", "phone-7de605"],
            "navy chore jacket, black jeans": ["phone-f4870b", "phone-fb0b17"]}
    for name, ids in same.items():
        v = [(i, -feat(F, i, "low_hem")) for i in ids if i in F and feat(F, i, "low_hem") is not None]
        if len(v) >= 2:
            lines.append(f"- Same outfit ({name}): lowest hem {', '.join(f'{x:.1f}' for _, x in v)} cm (spread {max(x for _, x in v) - min(x for _, x in v):.1f}).")
    lines.append("")

    # --- each idea against each label
    for q in TARGETS:
        lines += [f"## {q}", "", "| idea | AUC tune | AUC test | cut (tune) | test right | test unsure | AI right on those photos (runs) | flips at ±10° |", "|---|---|---|---|---|---|---|---|"]
        for f in FEATS:
            sgn = -1 if q == "ankle_shows" else 1  # a high hem shows the ankle
            data = {s: [] for s in ("dev", "test")}
            uns = {s: 0 for s in ("dev", "test")}
            for pid, r in R.items():
                t = truth(r, q)
                if t not in ("yes", "no"):
                    continue
                v = feat(F, pid, f) if pid in F else None
                if v is None:
                    uns[split_of(r)] += 1
                    continue
                data[split_of(r)].append((pid, sgn * v, t == "yes"))
            def a(s):
                x = auc([v for _, v, y in data[s] if y], [v for _, v, y in data[s] if not y])
                return f"{x:.2f}" if x is not None else "-"
            cut, _ = best_cut([(v, y) for _, v, y in data["dev"]])
            if cut is None:
                lines.append(f"| {f} | {a('dev')} | {a('test')} | - | - | - | - | - |")
                continue
            tr = [(pid, (v >= cut) == y) for pid, v, y in data["test"]]
            right = sum(ok for _, ok in tr)
            n_t = len(data["test"]) + uns["test"]
            # the AI on the same test photos
            ai_n = ai_c = 0
            for pid, _ in tr:
                t = truth(R[pid], q)
                for run in AI.get(pid, []):
                    if run.get(q) in ("yes", "no"):
                        ai_n += 1; ai_c += run[q] == t
            # repeatability: does the answer flip when the photo is tilted ±10°?
            fl = tot = 0
            for pid, v, _ in data["dev"] + data["test"]:
                for p in ("10", "-10"):
                    w = feat(F, pid, f, p)
                    if w is not None:
                        tot += 1; fl += (sgn * w >= cut) != (v >= cut)
            lines.append(f"| {f} | {a('dev')} | {a('test')} | {sgn * cut:.3g} | {right}/{len(tr)} ({right / max(1, len(tr)):.0%}) | "
                         f"{uns['test']}/{n_t} ({uns['test'] / max(1, n_t):.0%}) | {ai_c}/{ai_n} ({ai_c / max(1, ai_n):.0%}) | {fl}/{tot} |")
        lines.append("")
    (OUT / "report.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "extract":
        extract()
    elif cmd == "measure":
        measure()
    elif cmd == "report":
        report()
