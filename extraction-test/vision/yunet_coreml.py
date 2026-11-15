"""YuNet (ONNX) -> Core ML, and the check that the converted model gives the same boxes (T96 face-model test, Nov 15).

  PY=/Users/eyu/Desktop/files/Kitted/inputs/face-models/venv/bin/python
  $PY -I extraction-test/vision/yunet_coreml.py convert SIZE      writes inputs/face-models/coreml/YuNet<SIZE>-fp16/-fp32.mlpackage
  $PY -I extraction-test/vision/yunet_coreml.py compare SIZE N    raw outputs and decoded boxes vs OpenCV on N sent copies, and time

The graph is 8 op types (Conv, Relu, MaxPool, nearest Resize ×2, Add, Transpose, Reshape, Sigmoid), so it is
translated node by node with coremltools' MIL builder: no onnx or torch package needed. Input: 1×3×640×640 BGR 0–255,
as OpenCV's FaceDetectorYN feeds it. The decoding (score = sqrt(cls·obj), boxes from strides 8/16/32) and NMS are
plain code, as they would be in Swift.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import onnx_lite  # noqa: E402

KIT = Path("/Users/eyu/Desktop/files/Kitted")
FM = KIT / "inputs" / "face-models"
YUNET = FM / "yunet" / "face_detection_yunet_2023mar.onnx"
CM = FM / "coreml"
S = 640


def build_program(g):
    from coremltools.converters.mil import Builder as mb
    I = g["inits"]
    outs = [o[0] for o in g["outputs"]]

    @mb.program(input_specs=[mb.TensorSpec(shape=(1, 3, S, S))])
    def prog(input):
        env = {"input": input}
        for n in g["nodes"]:
            a, op = n["attr"], n["op"]
            x = env[n["in"][0]]
            if op == "Conv":
                w = I[n["in"][1]].astype(np.float32)
                b = I[n["in"][2]].astype(np.float32) if len(n["in"]) > 2 else None
                p = a.get("pads", [0, 0, 0, 0])
                y = mb.conv(x=x, weight=w, bias=b, strides=a.get("strides", [1, 1]), pad_type="custom",
                            pad=[p[0], p[2], p[1], p[3]], dilations=a.get("dilations", [1, 1]), groups=a.get("group", 1))
            elif op == "Relu":
                y = mb.relu(x=x)
            elif op == "MaxPool":
                assert not any(a.get("pads", [0])) and not a.get("ceil_mode", 0)
                y = mb.max_pool(x=x, kernel_sizes=a["kernel_shape"], strides=a["strides"], pad_type="valid")
            elif op == "Resize":
                sc = I[n["in"][2]]
                assert a["mode"] == "nearest" and list(sc) == [1, 1, 2, 2]
                y = mb.upsample_nearest_neighbor(x=x, scale_factor_height=2, scale_factor_width=2)
            elif op == "Add":
                y = mb.add(x=x, y=env[n["in"][1]])
            elif op == "Transpose":
                y = mb.transpose(x=x, perm=a["perm"])
            elif op == "Reshape":
                y = mb.reshape(x=x, shape=[int(v) for v in I[n["in"][1]]])
            elif op == "Sigmoid":
                y = mb.sigmoid(x=x)
            else:
                raise ValueError(op)
            nm = n["out"][0]
            if nm in outs:
                y = mb.identity(x=y, name=nm)
            env[nm] = y
        return tuple(env[o] for o in outs)

    return prog


def convert():
    import coremltools as ct
    g = onnx_lite.load(YUNET)
    CM.mkdir(parents=True, exist_ok=True)
    info = {}
    for prec, tag in ((ct.precision.FLOAT16, "fp16"), (ct.precision.FLOAT32, "fp32")):
        m = ct.convert(build_program(g), convert_to="mlprogram", compute_precision=prec, minimum_deployment_target=ct.target.iOS16)
        m.short_description = f"YuNet 2023mar face detector (opencv_zoo, MIT), {S}x{S} BGR 0-255, converted for the T96 test"
        p = CM / f"YuNet{S}-{tag}.mlpackage"
        m.save(str(p))
        size = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
        info[tag] = {"path": str(p), "bytes": size}
        print(tag, size)
    (CM / f"convert-{S}.json").write_text(json.dumps(info, indent=1))


# ---------------------------------------------------------------- decoding, as FaceDetectorYN does it
def decode(outs, W, H, thr=0.25, nms=0.3):
    """outs: name -> array. Boxes [x, y, w, h, score] in the 640 input's pixels, NMS'd."""
    boxes = []
    for s in (8, 16, 32):
        cols, rows = S // s, S // s
        cls = np.clip(outs[f"cls_{s}"].reshape(-1), 0, 1)
        obj = np.clip(outs[f"obj_{s}"].reshape(-1), 0, 1)
        bb = outs[f"bbox_{s}"].reshape(-1, 4)
        score = np.sqrt(cls * obj)
        idx = np.nonzero(score >= thr)[0]
        r, c = idx // cols, idx % cols
        cx, cy = (c + bb[idx, 0]) * s, (r + bb[idx, 1]) * s
        w, h = np.exp(bb[idx, 2]) * s, np.exp(bb[idx, 3]) * s
        for k in range(len(idx)):
            boxes.append([float(cx[k] - w[k] / 2), float(cy[k] - h[k] / 2), float(w[k]), float(h[k]), float(score[idx[k]])])
    boxes.sort(key=lambda b: -b[4])
    keep = []
    for b in boxes:
        if all(iou(b, k) <= nms for k in keep):
            keep.append(b)
    return [b for b in keep if b[0] + b[2] > 0 and b[1] + b[3] > 0 and b[0] < W and b[1] < H]


def iou(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    i = max(0, x1 - x0) * max(0, y1 - y0)
    u = a[2] * a[3] + b[2] * b[3] - i
    return i / u if u > 0 else 0


def letterbox(rgb_tile):
    """A tile scaled so its long edge is S, top-left in a black S×S BGR blob (1×3×S×S float)."""
    from PIL import Image
    h, w = rgb_tile.shape[:2]
    z = S / max(w, h)
    nw, nh = max(1, round(w * z)), max(1, round(h * z))
    t = np.asarray(Image.fromarray(rgb_tile).resize((nw, nh), Image.BILINEAR))
    blob = np.zeros((S, S, 3), np.float32)
    blob[:nh, :nw] = t[:, :, ::-1]
    return blob.transpose(2, 0, 1)[None], z, nw, nh


def compare(n):
    import coremltools as ct
    import cv2
    import face_leak_test as flt
    g = onnx_lite.load(YUNET)
    outs = [o[0] for o in g["outputs"]]
    net = cv2.dnn.readNetFromONNX(str(YUNET))
    yn = cv2.FaceDetectorYN.create(str(YUNET), "", (S, S), 0.25, 0.3, 5000)
    models = {tag: ct.models.MLModel(str(CM / f"YuNet{S}-{tag}.mlpackage"), compute_units=cu)
              for tag, cu in (("fp16", ct.ComputeUnit.ALL), ("fp32", ct.ComputeUnit.CPU_ONLY))}
    recs = []
    for s in ("normal", "built", "heldout"):
        data = json.loads((FM / "run" / f"{s}.json").read_text())
        rs = [r for r in (data["photos"] if isinstance(data, dict) else data) if "upload" in r]
        recs += rs[: max(1, n // 3)]
    rep = {"tiles": 0, "raw_max_abs_diff": {}, "boxes": {}, "ms": {}}
    stats = {tag: {"matched": 0, "cv_only": 0, "cm_only": 0, "iou": [], "dscore": []} for tag in models}
    gate = {"cv": [], "yn": 0, "yn_match": 0}
    ms = {tag: [] for tag in models}
    ms["opencv"] = []
    rawd = {tag: 0.0 for tag in models}
    for r in recs:
        arr = flt.rgb(r["upload"])
        H, W = arr.shape[:2]
        for x, y, w, h in flt.oracle_tiles(W, H, [1, 2, 3]):
            blob, z, nw, nh = letterbox(arr[y:y + h, x:x + w])
            rep["tiles"] += 1
            t0 = time.perf_counter()
            net.setInput(blob)
            ref = dict(zip(outs, net.forward(outs)))
            ms["opencv"].append((time.perf_counter() - t0) * 1000)
            rb = decode(ref, nw, nh)
            # our decoding vs FaceDetectorYN on the same 640×640 blob: the decoder itself must match first
            yb = yn.detect(np.ascontiguousarray(blob[0].transpose(1, 2, 0).astype(np.uint8)))[1]
            yb = [] if yb is None else [list(map(float, (*q[:4], q[14]))) for q in yb]
            yb = [b for b in yb if b[0] + b[2] > 0 and b[1] + b[3] > 0 and b[0] < nw and b[1] < nh]
            gate["yn"] += len(yb)
            gate["yn_match"] += sum(1 for b in yb if any(iou(b, q) > 0.95 and abs(b[4] - q[4]) < 0.01 for q in rb))
            for tag, m in models.items():
                t0 = time.perf_counter()
                o = m.predict({"input": blob})
                ms[tag].append((time.perf_counter() - t0) * 1000)
                rawd[tag] = max(rawd[tag], max(float(np.abs(o[k].reshape(ref[k].shape) - ref[k]).max()) for k in outs if k.startswith(("cls", "obj"))))
                cb = decode(o, nw, nh)
                st = stats[tag]
                used = set()
                for b in rb:
                    j = max(range(len(cb)), key=lambda j: iou(b, cb[j]), default=None)
                    if j is not None and j not in used and iou(b, cb[j]) >= 0.5:
                        used.add(j)
                        st["matched"] += 1
                        st["iou"].append(iou(b, cb[j]))
                        st["dscore"].append(abs(b[4] - cb[j][4]))
                    elif b[4] >= 0.5:
                        st["cv_only"] += 1
                st["cm_only"] += sum(1 for j, b in enumerate(cb) if j not in used and b[4] >= 0.5)
    for tag, st in stats.items():
        rep["boxes"][tag] = {"matched (IoU >= 0.5)": st["matched"], "opencv-only, score >= 0.5": st["cv_only"],
                             "coreml-only, score >= 0.5": st["cm_only"],
                             "IoU median / min": [round(float(np.median(st["iou"])), 4), round(float(np.min(st["iou"])), 4)] if st["iou"] else None,
                             "score diff max": round(float(np.max(st["dscore"])), 4) if st["dscore"] else None}
        rep["raw_max_abs_diff"][tag] = round(rawd[tag], 5)
    rep["decoder_vs_FaceDetectorYN"] = f"{gate['yn_match']} of {gate['yn']} boxes identical (IoU > 0.95, score within 0.01)"
    rep["ms"] = {k: {"median_per_tile": round(float(np.median(v)), 2), "per_photo_14_tiles": round(float(np.median(v)) * 14)} for k, v in ms.items()}
    rep["photos"] = len(recs)
    rep["size"] = S
    (CM / f"compare-{S}.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    S = int(sys.argv[2])
    if sys.argv[1] == "convert":
        convert()
    else:
        compare(int(sys.argv[3]) if len(sys.argv) > 3 else 30)
