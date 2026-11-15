"""T96 · F2.2: no stranger's face in anything sent (strict, privacy). The test writer's file, locked: tasks/T96/TESTING.md.

  /Users/eyu/Desktop/files/Kitted/extraction-test/.venv-mp/bin/python extraction-test/vision/face_leak_test.py --full
  ... --quick                      the implementer's loop (stub checks, leak set, 60 normal, 40 built photos): never a pass
  ... --full --only leak-set       one check (slugs below); a line passes only on --full
  ... --calibrate                  how T (the "hidden" threshold) was set, from today's code (main at 1c34082d)

Mac only, $0: no network, no AI. The photos are other people's and stay git-ignored in the main checkout; built photos
are made at run time in a temp folder and deleted. Writes extraction-test/results/t96/<check>.json (committed) and
contact sheets of suspects (images, git-ignored). Prints PASS/FAIL F2.2 · <name> per check; exits 1 on any fail.

How "a face remains" is judged without the fix's own detector (TESTING.md → Independence): pasted faces at known
places, MediaPipe pose heads, a denser Vision hunt (1, 2×2, 3×3 and 4×4 tiles) run by main's code, and the eye on the
sheets. "Hidden" (TESTING.md): (a) ≥ 80% of the face core is the flat cover grey (each channel within 10 of 128), or
(b) ≥ 90% of it lies inside the union of run's `hidden` rects and its unchanged share (grey differs from the original
by under 12) is at most T.
"""
import argparse
import hashlib
import json
import math
import os
import random
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.parse
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO = Path(__file__).resolve().parents[2]
KIT = Path("/Users/eyu/Desktop/files/Kitted")  # the main checkout: inputs/ and screenshots/ are git-ignored there
BASE = REPO / "tasks" / "T96" / "baseline"
OUT = REPO / "extraction-test" / "results" / "t96"
IOS = "app/modules/kitted-vision/ios"
SWIFT = ("KittedPrep.swift", "KittedGuide.swift", "KittedMeasure.swift")
MAIN_COMMIT = "1c34082d"
MODEL = KIT / "inputs" / "mediapipe" / "pose_landmarker_heavy.task"
FP = KIT / "inputs" / "fashionpedia" / "images" / "test"
PINS = {
    "tasks/T96/baseline/leak-set.json": "581624d22411a99011eb10eeb29fc331413aba3ea49fc58b1933ce892cee8f1c",
    "tasks/T96/baseline/normal-set.json": "be113a8afea740c70fde311ad48a6090570dadee3c05dc81caddbb8f2bf98d01",
    "tasks/T96/baseline/before/prep.jsonl": "0aca9f9f5c432ef27559c24eff87d44779382227fd7b9ec3800b161d6ffa3df5",
}
# The "hidden" threshold (rule b), set by the test writer before the lock from today's positive controls (--calibrate):
# the strictest value at which every face locate hides today on the normal set passes, never looser than 0.5.
T = 0.5
SEED = 9620
MAX_NEW_REFUSALS = 6           # founder Q1 (log #470): of the 336 normal photos sent today
SWEEP_MEDIAN_MS, SWEEP_P95_MS = 400, 800
HIS = ("his phone", "mirror-fit-check-1")
# Pool photos whose side-view "face" is no face to find (by eye, Nov 14): all hair; a face under a hat brim.
NOT_FACES = {"638e742038f5a8be2c5d0d95e5aab053.jpg", "ec70fb7cfec6289c068c4e59574638e5.jpg"}

CHECKS = [
    ("sweep-logic", "sweep logic"),
    ("old-sends-purged", "old sends purged"),
    ("same-photo", "same photo"),
    ("leak-set", "leak set"),
    ("kmeasure-copies", "kmeasure copies"),
    ("false-refusals", "false refusals"),
    ("time", "time"),
    ("built-small-faces", "built small faces"),
    ("second-mirror-panel", "second mirror panel"),
    ("held-out-and-regression", "held out and regression"),
    ("no-regression", "no regression"),
]

DRIVER = r'''// T96 test driver (written and compiled by extraction-test/vision/face_leak_test.py; never edit by hand).
// Compiled twice: with the worktree's KittedPrep/Guide/Measure and -D T96NEW (the build under test), and with
// main's (1c34082d) files and no flag (today). Every command reads a JSON job list and prints one JSON line per job.
import CoreImage
import CryptoKit
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

setvbuf(stdout, nil, _IOLBF, 0)

func emit(_ o: [String: Any]) {
  let d = try! JSONSerialization.data(withJSONObject: o, options: [.sortedKeys])
  print(String(data: d, encoding: .utf8)!)
  fflush(stdout)
}
func jobs(_ path: String) -> [[String: Any]] {
  let d = FileManager.default.contents(atPath: path)!
  return try! JSONSerialization.jsonObject(with: d) as! [[String: Any]]
}
func r4(_ r: CGRect) -> [Double] { [Double(r.minX), Double(r.minY), Double(r.width), Double(r.height)] }
func rect(_ a: Any?) -> CGRect? {
  guard let v = a as? [Double], v.count == 4 else { return nil }
  return CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
}
func hex(_ d: Data) -> String { SHA256.hash(data: d).map { String(format: "%02x", $0) }.joined() }

/// The image as RGBA8 sRGB bytes, top row first.
func rgba(_ img: CGImage) -> [UInt8] {
  let w = img.width, h = img.height
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  buf.withUnsafeMutableBytes { p in
    let ctx = CGContext(data: p.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  }
  return buf
}
func hashImg(_ img: CGImage) -> String { "\(img.width)x\(img.height):" + String(hex(Data(rgba(img))).prefix(20)) }
func writePNG(_ img: CGImage, _ path: String) {
  let w = img.width, h = img.height
  let provider = CGDataProvider(data: Data(rgba(img)) as CFData)!
  let out = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.noneSkipLast.rawValue), provider: provider, decode: nil,
                    shouldInterpolate: false, intent: .defaultIntent)!
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, out, nil)
  CGImageDestinationFinalize(dest)
}
func load(_ path: String) -> (sha: String, sw: Int, sh: Int, image: CGImage?) {
  guard let d = FileManager.default.contents(atPath: path) else { return ("", 0, 0, nil) }
  let r = Prep.decode(d, maxPx: Prep.workPx); return (r.sha, r.sourceW, r.sourceH, r.image)
}
/// Share of the pixels of `r` (whole pixels, clipped) whose grey differs between a and b (RGBA, width w) by under 12.
func unchangedShare(_ a: [UInt8], _ b: [UInt8], w: Int, h: Int, _ r: CGRect) -> Double {
  let x0 = max(0, Int(r.minX.rounded(.down))), y0 = max(0, Int(r.minY.rounded(.down)))
  let x1 = min(w, Int(r.maxX.rounded(.up))), y1 = min(h, Int(r.maxY.rounded(.up)))
  guard x1 > x0, y1 > y0 else { return 1 }
  var same = 0
  for y in y0..<y1 { for x in x0..<x1 {
    let i = (y * w + x) * 4
    let ga = 0.299 * Double(a[i]) + 0.587 * Double(a[i + 1]) + 0.114 * Double(a[i + 2])
    let gb = 0.299 * Double(b[i]) + 0.587 * Double(b[i + 1]) + 0.114 * Double(b[i + 2])
    if abs(ga - gb) < 12 { same += 1 }
  } }
  return Double(same) / Double((x1 - x0) * (y1 - y0))
}
func pickRect(_ j: [String: Any], _ W: CGFloat, _ H: CGFloat) -> CGRect? {
  guard let p = j["pick"] as? [Double], p.count == 4 else { return nil }
  return CGRect(x: p[0] * W, y: p[1] * H, width: p[2] * W, height: p[3] * H)
}
func kindOf(_ j: [String: Any]) -> Prep.Kind { Prep.Kind(rawValue: (j["kind"] as? String) ?? "fit")! }
func coverInfo(_ g: Guide.Gray?) -> Any { g.map { ["w": $0.w, "h": $0.h, "sha": hex(Data($0.px))] as [String: Any] } ?? NSNull() }
func locateRow(_ f: Prep.Located, _ img: CGImage) -> [String: Any] {
  var row: [String: Any] = [
    "status": f.status, "hide": f.hide.map(r4), "main": f.main.map(r4) ?? NSNull(), "candidates": f.candidates.map(r4),
    "others": f.others.map(r4), "people": f.people, "pose": f.pose, "picked": f.picked ?? NSNull(),
    "joints": f.joints.mapValues { [Double($0.x), Double($0.y)] }, "cover": coverInfo(f.cover), "size": [img.width, img.height],
  ]
  #if T96NEW
  row["otherHeads"] = f.otherHeads.map(r4)
  #endif
  return row
}
/// Run's result with the base64 payloads replaced by their SHA-256 (equal payloads stay equal).
func sanitize(_ r: [String: Any]) -> [String: Any] {
  var o = r
  if let s = r["uploadBase64"] as? String { o["uploadBase64"] = "sha:" + hex(Data(s.utf8)) }
  if let z = r["zoomBase64"] as? [String] { o["zoomBase64"] = z.map { "sha:" + hex(Data($0.utf8)) } }
  return o
}

#if T96NEW
/// Counts and logs every call a stand-in detector gets.
final class Probe {
  var n = 0
  var calls: [[String: Any]] = []
  let hashImages: Bool
  init(hashImages: Bool) { self.hashImages = hashImages }
}
/// "real" | "none" | "always:x,y,w,h" | "throwAt:n" | "unhidden" (sees B while B is unchanged from the original).
func detector(_ spec: String, _ probe: Probe, B: CGRect?, orig: CGImage?) -> Prep.FaceDetect {
  let parts = spec.split(separator: ":", maxSplits: 1).map(String.init)
  let name = parts[0]
  let arg = parts.count > 1 ? parts[1] : ""
  var fixed: CGRect?
  if name == "always" {
    let v = arg.split(separator: ",").compactMap { Double($0) }
    fixed = CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
  }
  let throwAt = Int(arg) ?? 0
  var origB: [UInt8]?
  if name == "unhidden", let orig, let B, let c = orig.cropping(to: B) { origB = rgba(c) }
  return { image, r in
    probe.n += 1
    var entry: [String: Any] = ["rect": r4(r)]
    if probe.hashImages { entry["img"] = hashImg(image) }
    probe.calls.append(entry)
    switch name {
    case "real": return try Prep.detectFaces(image, in: r)
    case "none": return []
    case "always": return [Prep.Face(box: fixed!, confidence: 0.9)]
    case "throwAt":
      if probe.n == throwAt { throw NSError(domain: "T96 stand-in detector", code: 7) }
      return []
    case "unhidden":
      guard let B, let origB, r.contains(B), let c = image.cropping(to: B) else { return [] }
      let now = rgba(c)
      let share = unchangedShare(origB, now, w: c.width, h: c.height, CGRect(x: 0, y: 0, width: c.width, height: c.height))
      return share > 0.5 ? [Prep.Face(box: B, confidence: 0.9)] : []
    default: fatalError("unknown detector \(spec)")
    }
  }
}
/// The most textured 40×40 box in the background: outside the main box grown 10%, every region locate hides and the
/// cover, with its head box inside the image.
func pickB(_ img: CGImage, _ px: [UInt8], _ f: Prep.Located) -> CGRect? {
  let W = img.width, H = img.height
  guard let main = f.main else { return nil }
  let avoid = [main.insetBy(dx: -main.width * 0.1, dy: -main.height * 0.1)] + f.hide + f.otherHeads
  var best: (Double, CGRect)?
  for y in stride(from: 16, to: H - 56, by: 16) {
    for x in stride(from: 16, to: W - 56, by: 16) {
      let b = CGRect(x: x, y: y, width: 40, height: 40), hb = Prep.headBox(around: b)
      guard hb.minX >= 0, hb.minY >= 0, hb.maxX <= CGFloat(W), hb.maxY <= CGFloat(H), !avoid.contains(where: { $0.intersects(hb) }) else { continue }
      if let c = f.cover {
        let cx0 = x * c.w / W, cx1 = (x + 40) * c.w / W, cy0 = y * c.h / H, cy1 = (y + 40) * c.h / H
        var hit = false
        for cy in cy0...min(c.h - 1, cy1) { for cx in cx0...min(c.w - 1, cx1) where c.px[cy * c.w + cx] > 127 { hit = true } }
        if hit { continue }
      }
      var s = 0.0, s2 = 0.0, n = 0.0
      for yy in stride(from: y, to: y + 40, by: 2) { for xx in stride(from: x, to: x + 40, by: 2) {
        let i = (yy * W + xx) * 4
        let g = 0.299 * Double(px[i]) + 0.587 * Double(px[i + 1]) + 0.114 * Double(px[i + 2])
        s += g; s2 += g * g; n += 1
      } }
      let sd = (s2 / n - (s / n) * (s / n)).squareRoot()
      if best == nil || sd > best!.0 { best = (sd, b) }
    }
  }
  return best?.1
}
#endif

let args = CommandLine.arguments
switch args[1] {
case "truth":
  // [{photo, png?, grids?}]: the 2048 decode (as PNG) and the dense hunt (Vision faces on n×n tiles, oracle geometry).
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      let (sha, sw, sh, img) = load(path)
      guard let img else { emit(["photo": path, "error": "unreadable"]); return }
      if let png = j["png"] as? String { writePNG(img, png) }
      let W = CGFloat(img.width), H = CGFloat(img.height)
      var faces: [[Double]] = []
      for n in (j["grids"] as? [Int]) ?? [1, 2, 3, 4] {
        let tw = W / (CGFloat(n) * 0.75 + 0.25), th = H / (CGFloat(n) * 0.75 + 0.25)
        for i in 0..<n { for k in 0..<n {
          let c = CGRect(x: CGFloat(i) * tw * 0.75, y: CGFloat(k) * th * 0.75, width: tw, height: th).integral
            .intersection(CGRect(x: 0, y: 0, width: W, height: H))
          guard let tile = img.cropping(to: c) else { continue }
          let req = VNDetectFaceRectanglesRequest()
          try? VNImageRequestHandler(cgImage: tile, orientation: .up).perform([req])
          for o in req.results ?? [] {
            let b = o.boundingBox
            faces.append([Double(c.minX + b.minX * c.width), Double(c.minY + (1 - b.maxY) * c.height), Double(b.width * c.width),
                          Double(b.height * c.height), Double(o.confidence), Double(n)])
          }
        } }
      }
      emit(["photo": path, "sha256": sha, "sourceWidth": sw, "sourceHeight": sh, "size": [img.width, img.height], "faces": faces])
    }
  }

case "locate":
  // [{photo, kind?, pick? (normalized)}]: Prep.locate's whole result.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let f = Prep.locate(img, kind: kindOf(j), pick: pickRect(j, CGFloat(img.width), CGFloat(img.height)))
      var row = locateRow(f, img)
      row["photo"] = path
      emit(row)
    }
  }

case "prep":
  // [{photo, root, kind?, pick?, detector?, temp?, warm?}]: Prep.run, the app's own path, files under root.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      Prep.rootOverride = URL(fileURLWithPath: j["root"] as! String, isDirectory: true)
      var uri = path
      let fm = FileManager.default
      if (j["temp"] as? Bool) == true {
        let t = fm.temporaryDirectory.appendingPathComponent("t96-\(UUID().uuidString).\(URL(fileURLWithPath: path).pathExtension)")
        try! fm.copyItem(at: URL(fileURLWithPath: path), to: t)
        uri = t.path
      }
      var row: [String: Any]
      var calls = 0
      do {
        #if T96NEW
        let probe = Probe(hashImages: false)
        let det = detector((j["detector"] as? String) ?? "real", probe, B: nil, orig: nil)
        let r = try Prep.run(uri: uri, kind: kindOf(j), pick: j["pick"] as? [Double], detect: det)
        calls = probe.n
        #else
        let r = try Prep.run(uri: uri, kind: kindOf(j), pick: j["pick"] as? [Double])
        #endif
        row = sanitize(r)
      } catch { row = ["error": "\(error)"] }
      row["_photo"] = path
      row["_calls"] = calls
      if (j["temp"] as? Bool) == true {
        row["_tempExists"] = fm.fileExists(atPath: uri)
        try? fm.removeItem(atPath: uri)
      }
      if (j["warm"] as? Bool) != true { emit(row) }
    }
  }

#if T96NEW
case "bcontrol":
  // [{photo}]: the box the "unhidden" stand-in detector uses, and the share of it today's hiding leaves unchanged.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let found = Prep.locate(img)
      var row: [String: Any] = ["photo": path, "status0": found.status]
      let px = rgba(img)
      if found.status == "ok", let B = pickB(img, px, found) {
        let covered = found.cover == nil ? img : Prep.coverOthers(img, found.cover!)
        row["B"] = r4(B)
        if let c = covered, let today = Prep.hideRegions(c, found.hide), let ctl = Prep.hideRegions(today, [Prep.headBox(around: B)]) {
          row["controlShare"] = unchangedShare(px, rgba(ctl), w: img.width, h: img.height, B)
        }
      }
      emit(row)
    }
  }

case "tiles":
  // tiles <W> <H> <g,g,...>
  let t = Prep.tiles(W: CGFloat(Double(args[2])!), H: CGFloat(Double(args[3])!), grids: args[4].split(separator: ",").map { Int($0)! })
  emit(["tiles": t.map(r4), "faceGrids": Prep.faceGrids])

case "sweep":
  // [{photo, kind?, detector, out?}]: locate, then Prep.sweep with a stand-in detector, every call logged.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let kind = kindOf(j), spec = j["detector"] as! String
      let found = Prep.locate(img, kind: kind)
      var row: [String: Any] = ["photo": path, "detector": spec, "status0": found.status, "otherHeads": found.otherHeads.map(r4),
                                "hide0": found.hide.map(r4), "main": found.main.map(r4) ?? NSNull(), "coverNil0": found.cover == nil]
      guard found.status == "ok" else { emit(row); return }
      let W = CGFloat(img.width), H = CGFloat(img.height)
      let tiles = Prep.tiles(W: W, H: H, grids: Prep.faceGrids)
      let covered = found.cover == nil ? img : Prep.coverOthers(img, found.cover!)
      let today = covered.flatMap { Prep.hideRegions($0, found.hide) }
      let origPx = rgba(img)
      var B: CGRect?
      if spec == "unhidden" {
        B = pickB(img, origPx, found)
        if let B {
          let hb = Prep.headBox(around: B)
          row["B"] = r4(B)
          row["headB"] = r4(hb)
          row["recheckExpected"] = tiles.filter { $0.intersects(hb) }.map(r4)
          if let today, let ctl = Prep.hideRegions(today, [hb]) {
            row["controlShare"] = unchangedShare(origPx, rgba(ctl), w: img.width, h: img.height, B)
          }
        }
      }
      let probe = Probe(hashImages: true)
      let s = Prep.sweep(img, found: found, kind: kind, detect: detector(spec, probe, B: B, orig: img))
      row["status"] = s.status
      row["reason"] = s.reason ?? NSNull()
      row["hide"] = s.hide.map(r4)
      row["swept"] = s.swept.map { r4($0.box) + [Double($0.confidence)] }
      row["coveredExtra"] = s.coveredExtra
      row["ms"] = s.ms
      row["imageNil"] = s.image == nil
      row["coverNil"] = s.cover == nil
      row["calls"] = probe.calls
      row["tiles"] = tiles.map(r4)
      row["todayHash"] = today.map(hashImg) ?? NSNull()
      row["sweptHash"] = s.image.map(hashImg) ?? NSNull()
      if let out = j["out"] as? String {
        try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
        writePNG(img, out + "/orig.png")
        if let today { writePNG(today, out + "/today.png") }
        if let si = s.image { writePNG(si, out + "/swept.png") }
      }
      emit(row)
    }
  }
#endif

default:
  print("unknown command \(args[1])")
  exit(2)
}
'''


# ---------------------------------------------------------------- small helpers
def sha_file(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def grey(a):
    a = a.astype(np.float32)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def iou(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    i = max(0, x1 - x0) * max(0, y1 - y0)
    u = a[2] * a[3] + b[2] * b[3] - i
    return i / u if u > 0 else 0


def overlaps(a, b):
    return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]


def inter(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    return [x0, y0, x1 - x0, y1 - y0] if x1 > x0 and y1 > y0 else None


def grow(r, f):
    return [r[0] - r[2] * f, r[1] - r[3] * f, r[2] * (1 + 2 * f), r[3] * (1 + 2 * f)]


def uri_path(u):
    return urllib.parse.unquote(urllib.parse.urlparse(u).path)


def rgb(path):
    with Image.open(path) as im:
        return np.asarray(im.convert("RGB"))


def resize(arr, w, h):
    if arr.shape[1] == w and arr.shape[0] == h:
        return arr
    return np.asarray(Image.fromarray(arr).resize((w, h), Image.LANCZOS))


def dedupe(boxes, thr=0.5):
    out = []
    for b in boxes:
        if all(iou(b, u) < thr for u in out):
            out.append(b)
    return out


def oracle_tiles(W, H, grids):
    """oracle.swift's geometry: n×n tiles of side W/(0.75n+0.25), stepped 0.75 of a side, integral, clipped."""
    out = []
    for n in grids:
        tw, th = W / (n * 0.75 + 0.25), H / (n * 0.75 + 0.25)
        for i in range(n):
            for k in range(n):
                x, y = i * tw * 0.75, k * th * 0.75
                x0, y0, x1, y1 = max(0, math.floor(x)), max(0, math.floor(y)), min(W, math.ceil(x + tw)), min(H, math.ceil(y + th))
                out.append([x0, y0, x1 - x0, y1 - y0])
    return out


def pctl(v, p):
    return float(np.percentile(np.asarray(v, dtype=float), p)) if v else float("nan")


class Crash(Exception):
    pass


class Fail(Exception):
    pass


# ---------------------------------------------------------------- the Swift driver
class Driver:
    def __init__(self, exe, tmp):
        self.exe, self.tmp = Path(exe), Path(tmp)

    def call(self, cmd, jobs=None, extra=(), timeout=6 * 3600):
        args = [str(self.exe), cmd]
        if jobs is not None:
            f = self.tmp / f"jobs-{uuid.uuid4().hex}.json"
            f.write_text(json.dumps(jobs))
            args.append(str(f))
        args += list(extra)
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        rows = []
        for line in p.stdout.splitlines():
            if line.startswith("{"):
                try:
                    rows.append(json.loads(line))
                except ValueError:
                    pass
        if p.returncode != 0:
            err = [l for l in p.stderr.splitlines() if "Fatal error" in l or "error" in l.lower()]
            raise Crash(f"driver `{cmd}` crashed: {(err[-1] if err else p.stderr[-300:]).strip()}")
        if jobs is not None and cmd != "prep" and len(rows) != len(jobs):
            raise Crash(f"driver `{cmd}` returned {len(rows)} rows for {len(jobs)} jobs")
        return rows


def build(tmp, fresh):
    srcs = {
        "new": {f: (REPO / IOS / f).read_text() for f in SWIFT},
        "main": {f: subprocess.check_output(["git", "-C", str(REPO), "show", f"{MAIN_COMMIT}:{IOS}/{f}"], text=True) for f in SWIFT},
    }
    out = {}
    for name, flags in (("new", ["-D", "T96NEW"]), ("main", [])):
        h = hashlib.sha256((DRIVER + json.dumps(srcs[name], sort_keys=True) + " ".join(flags)).encode()).hexdigest()[:16]
        d = Path(tempfile.gettempdir()) / f"t96-{name}-{h}"
        exe = d / "driver"
        if fresh or not exe.exists():
            shutil.rmtree(d, ignore_errors=True)
            d.mkdir(parents=True)
            for f, s in srcs[name].items():
                (d / f).write_text(s)
            (d / "main.swift").write_text(DRIVER)
            p = subprocess.run(["xcrun", "swiftc", "-O", *flags, "-o", str(exe), *[str(d / f) for f in SWIFT], str(d / "main.swift")],
                               capture_output=True, text=True)
            if p.returncode != 0:
                errs = [l for l in p.stderr.splitlines() if "error:" in l][:5]
                raise Fail(f"the {name} build doesn't compile: " + " | ".join(errs))
        out[name] = Driver(exe, tmp)
    return out


# ---------------------------------------------------------------- MediaPipe heads (the second model)
def core_of(pts):
    """The face core: the box around eyes, nose, mouth and any visible ear, grown 10% (no side under half the other)."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    m = max(w, h, 2.0)
    w, h = max(w, 0.5 * m) * 1.1, max(h, 0.5 * m) * 1.1
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    return [cx - w / 2, cy - h / 2, w, h]


def head_core(p):
    """A head is a pose with the nose and at least one eye or ear at visibility ≥ 0.5."""
    if p[0][2] < 0.5 or not any(p[i][2] >= 0.5 for i in range(1, 9)):
        return None
    return core_of([p[i] for i in range(11) if p[i][2] >= 0.5])


class Pose:
    def __init__(self):
        import mediapipe as mp
        self.mp = mp
        opts = mp.tasks.vision.PoseLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
                                                     running_mode=mp.tasks.vision.RunningMode.IMAGE, num_poses=5)
        self.det = mp.tasks.vision.PoseLandmarker.create_from_options(opts)

    def poses(self, arr, off=(0, 0)):
        img = self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=np.ascontiguousarray(arr))
        res = self.det.detect(img)
        h, w = arr.shape[:2]
        return [[(off[0] + l.x * w, off[1] + l.y * h, float(l.visibility or 0)) for l in pose] for pose in res.pose_landmarks]

    def heads(self, arr):
        """Every head on the original and its 2×2 tiles (the larger kept when two overlap)."""
        H, W = arr.shape[:2]
        found = []
        for x, y, w, h in [[0, 0, W, H]] + oracle_tiles(W, H, [2]):
            for p in self.poses(arr[y:y + h, x:x + w], (x, y)):
                c = head_core(p)
                if c:
                    found.append(c)
        found.sort(key=lambda b: -b[2] * b[3])
        return dedupe(found, 0.3)


# ---------------------------------------------------------------- copies and the "hidden" verdict
def copies(res, kind, W, H):
    """Every copy run made that can leave the phone: (name, path, the working-image rect it shows)."""
    errs = []
    if kind == "items":
        return [("send", uri_path(res["sendUri"]), (0, 0, W, H))], errs
    out = [("upload", uri_path(res["uploadUri"]), (0, 0, W, H)), ("detail", uri_path(res["detailUri"]), (0, 0, W, H))]
    kinds, zr = res.get("zoomKinds") or [], res.get("zoomRects")
    if kinds:
        if not isinstance(zr, list) or len(zr) != len(kinds):
            errs.append("close-ups without zoomRects: can't map faces into them")
        else:
            up = Path(uri_path(res["uploadUri"])).parent
            for k, r in zip(kinds, zr):
                x0, y0 = max(0, math.floor(r[0] * W)), max(0, math.floor(r[1] * H))
                x1, y1 = min(W, math.ceil((r[0] + r[2]) * W)), min(H, math.ceil((r[1] + r[3]) * H))
                out.append((k, str(up / f"{res['sha256']}-{k}.jpg"), (x0, y0, x1 - x0, y1 - y0)))
    return out, errs


def verdict(core, cp, orig, rects):
    """core and rects in the copy's pixels; cp and orig: the copy and the original at the copy's size."""
    Hc, Wc = cp.shape[:2]
    x0, y0 = max(0, math.floor(core[0])), max(0, math.floor(core[1]))
    x1, y1 = min(Wc, math.ceil(core[0] + core[2])), min(Hc, math.ceil(core[1] + core[3]))
    if x1 - x0 < 3 or y1 - y0 < 3:
        return "tiny", {}
    c, o = cp[y0:y1, x0:x1].astype(np.int16), orig[y0:y1, x0:x1].astype(np.int16)
    g = float(np.all(np.abs(c - 128) <= 10, axis=2).mean())
    if g >= 0.8:
        return "covered", {"grey": round(g, 3)}
    m = np.zeros((y1 - y0, x1 - x0), bool)
    xc, yc = np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5
    for r in rects:
        mx = (xc >= r[0]) & (xc < r[0] + r[2])
        my = (yc >= r[1]) & (yc < r[1] + r[3])
        m |= my[:, None] & mx[None, :]
    inside = float(m.mean())
    unchanged = float((np.abs(grey(c) - grey(o)) < 12).mean())
    info = {"grey": round(g, 3), "inside": round(inside, 3), "unchanged": round(unchanged, 3), "px": [x1 - x0, y1 - y0]}
    return ("hidden" if inside >= 0.9 and unchanged <= T else "leak"), info


def judge(res, kind, orig, cores, names=None):
    """Each face core (working pixels) in each copy of an ok result: [{core, copy, v, ...}], errors."""
    H, W = orig.shape[:2]
    hid = [[r[0] * W, r[1] * H, r[2] * W, r[3] * H] for r in (res.get("hidden") or [])]
    cps, errs = copies(res, kind, W, H)
    if names and not (names - {"upload", "detail", "send"}):
        errs = [e for e in errs if "zoomRects" not in e]  # close-ups aren't judged here
    out = []
    for name, path, src in cps:
        if names and name not in names:
            continue
        if not os.path.exists(path):
            errs.append(f"{name} copy missing")
            continue
        cp = rgb(path)
        ch, cw = cp.shape[:2]
        sx, sy = cw / src[2], ch / src[3]
        o = resize(np.ascontiguousarray(orig[src[1]:src[1] + src[3], src[0]:src[0] + src[2]]), cw, ch)

        def m(r):
            return [(r[0] - src[0]) * sx, (r[1] - src[1]) * sy, r[2] * sx, r[3] * sy]
        hr = [m(r) for r in hid]
        for i, c in enumerate(cores):
            if not overlaps(c, src):
                continue
            v, info = verdict(m(c), cp, o, hr)
            out.append({"core": i, "copy": name, "v": v, "box": [round(x, 1) for x in m(c)], "path": path, **info})
    return out, errs


class Sheet:
    """Suspect crops at 3× (montage.py style), for the eye."""

    def __init__(self, name):
        self.dir = OUT / name
        shutil.rmtree(self.dir, ignore_errors=True)
        (self.dir / "crops").mkdir(parents=True)
        self.items = []

    def add(self, label, path, box):
        with Image.open(path) as im:
            im = im.convert("RGB")
            W, H = im.size
            pad = max(box[2], box[3], 8)
            r = (max(0, int(box[0] - pad)), max(0, int(box[1] - pad)), min(W, int(box[0] + box[2] + pad)), min(H, int(box[1] + box[3] + pad)))
            if r[2] <= r[0] or r[3] <= r[1]:
                return
            c = im.crop(r)
            c = c.resize((c.width * 3, c.height * 3))
            f = self.dir / "crops" / f"{len(self.items):04d}.png"
            c.save(f)
            self.items.append((label[:34], f))

    def finish(self):
        T_, cols, rows = 200, 6, 5
        per = cols * rows
        for page in range(0, len(self.items), per):
            sheet = Image.new("RGB", (cols * T_, rows * (T_ + 16)), "white")
            d = ImageDraw.Draw(sheet)
            for i, (lab, p) in enumerate(self.items[page:page + per]):
                with Image.open(p) as im:
                    im.thumbnail((T_, T_))
                    x, y = (i % cols) * T_, (i // cols) * (T_ + 16)
                    sheet.paste(im, (x, y + 16))
                d.text((x + 2, y + 2), lab, fill="black")
            sheet.save(self.dir / f"sheet{page // per:02d}.jpg", quality=85)
        return f"{len(self.items)} crops in {self.dir.relative_to(REPO)}"


# ---------------------------------------------------------------- the shared context
class Ctx:
    def __init__(self, args):
        self.full, self.quick = args.full, args.quick
        self.tmp = Path(tempfile.mkdtemp(prefix="t96-"))
        self.d = build(self.tmp, fresh=args.full)
        self.new, self.main = self.d["new"], self.d["main"]
        self._pose = None
        self.leak_rows = json.loads((BASE / "leak-set.json").read_text())
        self.normal_rows = json.loads((BASE / "normal-set.json").read_text())
        for r in self.leak_rows + self.normal_rows:
            r["path"] = str(KIT / r["photo"])
        self.before = [json.loads(l) for l in (BASE / "before" / "prep.jsonl").read_text().splitlines() if l.strip()]
        self.leak = None       # photo -> leak-set record
        self.normal = None     # photo -> normal-set record
        self.picks = {}        # (photo, i) -> run's result with that candidate picked (+ files kept for kmeasure)
        self.status1513 = None
        self.kmeasure = None

    @property
    def pose(self):
        if self._pose is None:
            self._pose = Pose()
        return self._pose

    def scratch(self):
        d = self.tmp / uuid.uuid4().hex[:10]
        d.mkdir()
        return d

    def built_dir(self):
        """Built photos are handed to run like his own photos, so they live outside the temp and cache folders (run
        deletes a sent photo there: the camera's temporary original). Private, deleted at the end of the run."""
        if getattr(self, "_built", None) is None:
            self._built = Path("/private/tmp") / f"t96-built-{uuid.uuid4().hex[:10]}"
            self._built.mkdir(mode=0o700)
        d = self._built / uuid.uuid4().hex[:8]
        d.mkdir()
        return d

    def truth(self, photos, d, grids=(1, 2, 3, 4), mp=True):
        """main's decode (PNG) and dense hunt, and MediaPipe heads, per photo."""
        rows = self.main.call("truth", [{"photo": p, "png": str(d / f"o{i}.png"), "grids": list(grids)} for i, p in enumerate(photos)])
        out = {}
        for i, (p, r) in enumerate(zip(photos, rows)):
            if "error" in r:
                out[p] = None
                continue
            r["png"] = str(d / f"o{i}.png")
            r["hunt"] = [f[:4] for f in sorted(r["faces"], key=lambda f: -f[4]) if f[4] >= 0.5]
            r["heads"] = self.pose.heads(rgb(r["png"])) if mp else []
            out[p] = r
        return out

    def kmeasure_bin(self):
        if self.kmeasure is None:
            p = subprocess.run(["sh", str(REPO / "extraction-test" / "vision" / "build.sh")], capture_output=True, text=True)
            if p.returncode != 0:
                raise Fail("kmeasure doesn't build: " + p.stderr[-300:])
            self.kmeasure = REPO / "extraction-test" / "vision" / "bin" / "kmeasure"
        return self.kmeasure


def chunks(xs, n):
    for i in range(0, len(xs), n):
        yield xs[i:i + n]


def fresh_root(d):
    r = d / f"root-{uuid.uuid4().hex[:8]}"
    r.mkdir()
    return str(r)


def files_under(root):
    return sorted(str(Path(dp, f).relative_to(root)) for dp, _, fs in os.walk(root) for f in fs)


def no_kit(p):
    return p.replace(str(KIT) + "/", "")


# ---------------------------------------------------------------- F2.2 · sweep logic
def check_sweep_logic(ctx):
    fails, rep = [], {}
    # (1) the tiles
    try:
        t = ctx.new.call("tiles", extra=["2048", "1536", "1,2,3"])[0]
        tl, exp = t["tiles"], oracle_tiles(2048, 1536, [1, 2, 3])
        if t["faceGrids"] != [1, 2, 3]:
            fails.append(f"(1) faceGrids {t['faceGrids']}, expected [1, 2, 3]")
        if len(tl) != 14:
            fails.append(f"(1) tiles([1,2,3]) gave {len(tl)} rects, expected 14")
        else:
            if tl[0] != [0, 0, 2048, 1536]:
                fails.append(f"(1) the first tile is {tl[0]}, not the whole image")
            bad = [(a, e) for a, e in zip(tl, exp) if max(abs(x - y) for x, y in zip(a, e)) > 1]
            if bad:
                fails.append(f"(1) {len(bad)} tiles off the oracle geometry/order, first {bad[0][0]} vs {bad[0][1]}")
        for W, H, rects in ((2048, 1536, tl), (640, 360, ctx.new.call("tiles", extra=["640", "360", "1,2,3"])[0]["tiles"])):
            cov = np.zeros((H, W), bool)
            for x, y, w, h in rects:
                if x < -1e-6 or y < -1e-6 or x + w > W + 1e-6 or y + h > H + 1e-6:
                    fails.append(f"(1) tile {[x, y, w, h]} outside the {W}×{H} image")
                cov[max(0, int(y)):int(math.ceil(y + h)), max(0, int(x)):int(math.ceil(x + w))] = True
            if not cov.all():
                fails.append(f"(1) the tiles of {W}×{H} leave {int((~cov).sum())} px uncovered")
        t2 = ctx.new.call("tiles", extra=["2048", "1536", "2"])[0]["tiles"]
        sw, sh = 2048 / 1.75, 1536 / 1.75
        if len(t2) != 4:
            fails.append(f"(1) tiles([2]) gave {len(t2)} rects")
        else:
            want = [(0, 0), (0, 0.75 * sh), (0.75 * sw, 0), (0.75 * sw, 0.75 * sh)]
            for r, (wx, wy) in zip(t2, want):
                if abs(r[0] - wx) > 1 or abs(r[1] - wy) > 1 or abs(r[2] - min(sw, 2048 - r[0])) > 1 or abs(r[3] - min(sh, 1536 - r[1])) > 1:
                    fails.append(f"(1) tiles([2]) rect {r}: expected origin ({wx:.1f}, {wy:.1f}) side {sw:.1f}×{sh:.1f}")
        rep["tiles"] = tl
    except Crash as e:
        fails.append(f"(1) {e}")

    # the 4 photos: his phone, sent today, no other heads and no extra cover under the build
    cands = [r["path"] for r in ctx.normal_rows if r["source"] == "his phone" and r["before"] == "ok"]
    d = ctx.scratch()
    chosen = []
    try:
        for part in chunks(cands, 6):
            rows = ctx.new.call("sweep", [{"photo": p, "detector": "none", "out": str(d / f"none-{cands.index(p)}")} for p in part])
            locs = ctx.new.call("locate", [{"photo": p, "kind": k} for p in part for k in ("items", "snap")])
            for i, row in enumerate(rows):
                ok_other = locs[2 * i]["status"] == "ok" and locs[2 * i + 1]["status"] == "ok"
                if row.get("status0") == "ok" and not row["otherHeads"] and row.get("coveredExtra") == 0 and ok_other:
                    chosen.append(row)
            if len(chosen) >= 4:
                break
        chosen = chosen[:4]
        if len(chosen) < 4:
            fails.append(f"(setup) only {len(chosen)} of his photos have no other heads and no extra cover")
    except Crash as e:
        fails.append(f"(2–5) {e}")
    rep["photos"] = [no_kit(r["photo"]) for r in chosen]

    def calls_ok(calls, rects, img, label):
        if [c["rect"] for c in calls] != rects:
            fails.append(f"{label}: detector called on {len(calls)} rects {[c['rect'] for c in calls][:3]}…, expected {len(rects)} tiles in order")
        elif any(c["img"] != img for c in calls):
            fails.append(f"{label}: the detector was given an image other than the copy {'about to be sent' if img else '?'}")

    for k, row in enumerate(chosen):
        name = f"photo {k + 1}"
        out = Path(row.get("photo"))
        # (2) a detector that finds nothing
        if row["status"] != "ok" or row["reason"] is not None or row["swept"] or row["imageNil"]:
            fails.append(f"(2) {name}: status {row['status']}, reason {row['reason']}, swept {row['swept']}")
        calls_ok(row["calls"], row["tiles"], row["todayHash"], f"(2) {name}")
        if row["sweptHash"] != row["todayHash"]:
            fails.append(f"(2) {name}: the swept image isn't today's copy (hash {row['sweptHash']} vs {row['todayHash']})")
        dd = d / f"none-{cands.index(row['photo'])}"
        if (dd / "swept.png").exists() and (dd / "today.png").exists():
            if not np.array_equal(rgb(dd / "swept.png"), rgb(dd / "today.png")):
                fails.append(f"(2) {name}: the swept image isn't pixel-identical to today's copy")
        # (3) a detector that finds the face while it's unhidden
        try:
            u = ctx.new.call("sweep", [{"photo": row["photo"], "detector": "unhidden", "out": str(d / f"un-{k}")}])[0]
            B = u.get("B")
            if not B:
                fails.append(f"(3 setup) {name}: no background box B")
            elif u.get("controlShare", 1) > T:
                fails.append(f"(3 setup) {name}: hiding B's head box today leaves {u['controlShare']:.2f} unchanged (> T)")
            else:
                if u["status"] != "ok" or u["reason"] is not None:
                    fails.append(f"(3) {name}: status {u['status']} reason {u['reason']}, expected ok")
                sw_ = u["swept"]
                if len(sw_) != 1 or max(abs(a - b) for a, b in zip(sw_[0][:4], B)) > 0.5:
                    fails.append(f"(3) {name}: swept {sw_}, expected [B] = {B}")
                hide = u["hide"]
                def has(r):
                    return any(max(abs(a - b) for a, b in zip(r, h)) < 0.01 for h in hide)
                if not has(u["headB"]):
                    fails.append(f"(3) {name}: hide lacks headBox(around: B) {u['headB']}")
                if not all(has(r) for r in u["hide0"]):
                    fails.append(f"(3) {name}: a region locate hid is missing from Swept.hide")
                if u["imageNil"] or not (d / f"un-{k}" / "swept.png").exists():
                    fails.append(f"(3) {name}: no image")
                else:
                    o, s = rgb(d / f"un-{k}" / "orig.png"), rgb(d / f"un-{k}" / "swept.png")
                    x, y, w, h = [int(round(v)) for v in B]
                    sh_ = float((np.abs(grey(o[y:y + h, x:x + w]) - grey(s[y:y + h, x:x + w])) < 12).mean())
                    if sh_ > T:
                        fails.append(f"(3) {name}: B is {sh_:.2f} unchanged in the swept image (> T {T})")
                calls = u["calls"]
                calls_ok(calls[:14], u["tiles"], u["todayHash"], f"(3 first pass) {name}")
                calls_ok(calls[14:], u["recheckExpected"], u["sweptHash"], f"(3 re-check) {name}")
            # (4) always B; (5) throws on the 7th call
            bb = B or [100, 100, 40, 40]
            a = ctx.new.call("sweep", [{"photo": row["photo"], "detector": "always:" + ",".join(str(v) for v in bb)},
                                       {"photo": row["photo"], "detector": "throwAt:7"}])
            if (a[0]["status"], a[0]["reason"], a[0]["imageNil"]) != ("couldNotFrame", "faceRemains", True):
                fails.append(f"(4) {name}: {a[0]['status']}/{a[0]['reason']}, image nil {a[0]['imageNil']}; expected couldNotFrame/faceRemains, nil")
            if (a[1]["status"], a[1]["reason"], a[1]["imageNil"]) != ("couldNotFrame", "sweepFailed", True):
                fails.append(f"(5) {name}: {a[1]['status']}/{a[1]['reason']}, image nil {a[1]['imageNil']}; expected couldNotFrame/sweepFailed, nil")
        except Crash as e:
            fails.append(f"(3–5) {name}: {e}")

    # (6) through run: refusals write nothing; a found-nothing sweep sends today's upload byte for byte
    six = [r["photo"] for r in chosen] or cands[:4]
    try:
        jobs = [{"photo": p, "root": fresh_root(d), "kind": k, "detector": det, "temp": True}
                for p in six for det in ("always:10,10,40,40", "throwAt:7") for k in ("fit", "snap", "items")]
        res = ctx.new.call("prep", jobs)
        for j, r in zip(jobs, res):
            lab = f"(6) {Path(j['photo']).name[:10]} {j['kind']} {j['detector'].split(':')[0]}"
            keys = sorted(k for k in r if not k.startswith("_"))
            want_reason = "faceRemains" if j["detector"].startswith("always") else "sweepFailed"
            if keys != ["reason", "sha256", "sourceHeight", "sourceWidth", "status"]:
                fails.append(f"{lab}: keys {keys}")
            if r.get("status") != "couldNotFrame" or r.get("reason") != want_reason:
                fails.append(f"{lab}: {r.get('status')}/{r.get('reason')}, expected couldNotFrame/{want_reason}")
            if r.get("sha256") != sha_file(j["photo"]):
                fails.append(f"{lab}: sha256 isn't the original's")
            left = files_under(j["root"])
            if left != ["Caches/upload/.sweep-v1"]:
                fails.append(f"{lab}: files under the root: {left[:4]}{'…' if len(left) > 4 else ''}")
            if r.get("_tempExists") is not True:
                fails.append(f"{lab}: the photo passed in was deleted")
        jobs = [{"photo": p, "root": fresh_root(d), "detector": "none"} for p in six]
        newr = ctx.new.call("prep", jobs)
        mainr = ctx.main.call("prep", [{"photo": p, "root": fresh_root(d)} for p in six])
        for p, a, b in zip(six, newr, mainr):
            lab = f"(6) {Path(p).name[:10]} none"
            if a.get("status") != "ok" or a.get("sweptFaces") != 0:
                fails.append(f"{lab}: status {a.get('status')}, sweptFaces {a.get('sweptFaces')}; expected ok, 0")
            elif b.get("status") == "ok" and Path(uri_path(a["uploadUri"])).read_bytes() != Path(uri_path(b["uploadUri"])).read_bytes():
                fails.append(f"{lab}: the upload differs from today's (main {MAIN_COMMIT})")
        # edges: locate's own refusals never reach the sweep
        nop = d / "noperson.jpg"
        rng = np.random.default_rng(SEED)
        yy, xx = np.mgrid[0:900, 0:1200]
        img = np.stack([(xx / 1200 * 200 + 30), (yy / 900 * 180 + 40), np.full_like(xx, 120.0)], -1)
        for _ in range(12):
            x, y = rng.integers(0, 1100), rng.integers(0, 800)
            img[y:y + 100, x:x + 100] = rng.integers(0, 255, 3)
        Image.fromarray(img.astype(np.uint8)).save(nop, quality=92)
        mp1 = next(r["path"] for r in ctx.normal_rows if r["before"] == "multiplePeople")
        e = ctx.new.call("prep", [{"photo": str(nop), "root": fresh_root(d), "detector": "always:10,10,40,40"},
                                  {"photo": mp1, "root": fresh_root(d), "detector": "always:10,10,40,40"}])
        for r, want in zip(e, ("noPerson", "multiplePeople")):
            if r.get("status") != want or "reason" in r or r.get("_calls") != 0:
                fails.append(f"(edge) a {want} photo through run: status {r.get('status')}, reason {r.get('reason')}, detector calls {r.get('_calls')}")
    except Crash as e:
        fails.append(f"(6) {e}")
    return fails, rep


# ---------------------------------------------------------------- F2.2 · old sends purged
def check_purge(ctx):
    fails = []
    d = ctx.scratch()
    a, b = [r["path"] for r in ctx.normal_rows if r["source"] == "his phone" and r["before"] == "ok"][:2]
    old = Path(a).read_bytes()

    def seed(root):
        up, de = Path(root) / "Caches" / "upload", Path(root) / "Caches" / "detail"
        up.mkdir(parents=True)
        de.mkdir(parents=True)
        for f in (up / "old.jpg", up / "old-upper.jpg", de / "old.jpg"):
            f.write_bytes(old)
        return up, de
    try:
        root = fresh_root(d)
        up, de = seed(root)
        r1 = ctx.new.call("prep", [{"photo": a, "root": root}])[0]
        if (up / "old.jpg").exists() or (up / "old-upper.jpg").exists():
            fails.append("an upload file made before the update survived the first prep")
        if not (de / "old.jpg").exists():
            fails.append("Caches/detail/old.jpg was deleted")
        if not (up / ".sweep-v1").exists():
            fails.append("no Caches/upload/.sweep-v1 marker")
        if r1.get("status") != "ok":
            fails.append(f"the first prep: {r1.get('status')}")
        else:
            mine = [uri_path(r1[k]) for k in ("uploadUri", "detailUri", "keptUri", "thumbUri")]
            mine += [str(up / f"{r1['sha256']}-{k}.jpg") for k in r1.get("zoomKinds") or []]
            if not all(os.path.exists(f) for f in mine):
                fails.append("the new photo's files don't all exist")
            r2 = ctx.new.call("prep", [{"photo": b, "root": root}])[0]
            gone = [Path(f).name[:24] for f in mine if not os.path.exists(f)]
            if gone or r2.get("status") != "ok":
                fails.append(f"a second prep ({r2.get('status')}) deleted the first's files: {gone}")
        # the purge runs even when the first prep is refused
        root = fresh_root(d)
        up, de = seed(root)
        r3 = ctx.new.call("prep", [{"photo": a, "root": root, "detector": "always:10,10,40,40"}])[0]
        if r3.get("status") != "couldNotFrame":
            fails.append(f"(edge) a refused first prep returned {r3.get('status')}")
        if (up / "old.jpg").exists() or (up / "old-upper.jpg").exists() or not (up / ".sweep-v1").exists():
            fails.append("(edge) a refused first prep left the old upload files or wrote no marker")
        if not (de / "old.jpg").exists():
            fails.append("(edge) Caches/detail/old.jpg was deleted")
    except Crash as e:
        fails.append(str(e))
    return fails, {}


# ---------------------------------------------------------------- F2.2 · same photo
def check_same_photo(ctx):
    fails, rep = [], {}
    rng = random.Random(SEED + 1)
    normal = rng.sample([r["path"] for r in ctx.normal_rows if r["before"] == "ok"], 10)
    leak = rng.sample([r["path"] for r in ctx.leak_rows], 10)
    d = ctx.scratch()

    def norm(r, root):
        def f(v):
            if isinstance(v, str):
                return v.replace(root, "<root>")
            if isinstance(v, list):
                return [f(x) for x in v]
            if isinstance(v, dict):
                return {k: f(x) for k, x in v.items()}
            return v
        return {k: f(v) for k, v in r.items() if not k.endswith("Ms") and not k.startswith("_")}

    def files(r):
        if r.get("status") != "ok":
            return []
        out = [uri_path(r["uploadUri"]), uri_path(r["detailUri"])]
        up = Path(uri_path(r["uploadUri"])).parent
        return out + [str(up / f"{r['sha256']}-{k}.jpg") for k in r.get("zoomKinds") or []]

    try:
        photos = normal + leak
        jobs = [{"photo": p, "root": fresh_root(d)} for p in photos for _ in (0, 1)]
        res = ctx.new.call("prep", jobs)
        # a picked person today's code sends (the second person on his own photos can't be framed today)
        mp1 = pick = None
        for r in [r for r in ctx.normal_rows if r["before"] == "multiplePeople"]:
            loc = ctx.main.call("locate", [{"photo": r["path"]}])[0]
            for c in range(1, len(loc["candidates"])):
                if ctx.main.call("prep", [{"photo": r["path"], "root": fresh_root(d), "pick": pick_of(loc, c)}])[0].get("status") == "ok":
                    mp1, pick, pc_ = r["path"], pick_of(loc, c), c
                    break
            if pick:
                break
        if not pick:
            raise Crash("(setup) no picked person today's code sends")
        pj = [{"photo": mp1, "root": fresh_root(d), "pick": pick} for _ in (0, 1)]
        pr = ctx.new.call("prep", pj)
        pairs = [(photos[i // 2], jobs[i], jobs[i + 1], res[i], res[i + 1]) for i in range(0, len(jobs), 2)]
        pairs.append((mp1 + f" (picked {pc_})", pj[0], pj[1], pr[0], pr[1]))
        for p, j1, j2, a, b in pairs:
            lab = Path(p.split(" (")[0]).stem[-16:] + (" picked" if "picked" in p else "")
            if norm(a, j1["root"]) != norm(b, j2["root"]):
                diff = sorted(k for k in set(norm(a, j1["root"])) | set(norm(b, j2["root"])) if norm(a, j1["root"]).get(k) != norm(b, j2["root"]).get(k))
                fails.append(f"{lab}: results differ in {diff[:5]}")
            fa, fb = files(a), files(b)
            if len(fa) != len(fb) or any(Path(x).read_bytes() != Path(y).read_bytes() for x, y in zip(fa, fb)):
                fails.append(f"{lab}: the sent copies differ between two preps")
            orig = sha_file(p.split(" (")[0])
            want = hashlib.sha256(f"{orig}|person {pc_}".encode()).hexdigest() if "picked" in p else orig
            if a.get("sha256") != want:
                fails.append(f"{lab}: sha256 {a.get('sha256', '')[:12]} isn't {'the picked hash' if 'picked' in p else 'the file bytes'} {want[:12]}")
        rep["photos"] = [no_kit(p) for p in photos] + [no_kit(mp1) + f" picked {pc_}"]
    except Crash as e:
        fails.append(str(e))
    return fails, rep


# ---------------------------------------------------------------- the leak set (shared by three checks)
def ensure_leak(ctx):
    if getattr(ctx, "leak_fail", None):
        raise Crash(ctx.leak_fail)
    if ctx.leak is not None:
        return
    try:
        _leak(ctx)
    except Crash as e:
        ctx.leak, ctx.leak_fail = None, str(e)
        raise


def _leak(ctx):
    ctx.leak = {}
    sheet = Sheet("leak-set")
    for part in chunks(ctx.leak_rows, 10):
        d = ctx.scratch()
        photos = [r["path"] for r in part]
        tr = ctx.truth(photos, d)
        jobs = [{"photo": p, "root": fresh_root(d), "kind": k} for p in photos for k in ("fit", "snap", "items")]
        res = ctx.new.call("prep", jobs)
        for i, row in enumerate(part):
            p, t = row["path"], tr[row["path"]]
            orig = rgb(t["png"])
            H, W = orig.shape[:2]
            s = W / row["size"][0]
            sc = lambda b: [v * s for v in b[:4]]
            cores = dedupe([sc(b) for b in row["faces"]] + t["hunt"] + t["heads"], 0.5)
            rec = {"photo": no_kit(p), "source": row["source"], "size": [W, H], "cores": cores, "kinds": {}}
            for k, r in zip(("fit", "snap", "items"), res[3 * i:3 * i + 3]):
                kr = {"status": r.get("status"), "reason": r.get("reason"), "error": r.get("error")}
                for key in ("hidden", "sweepMs", "sweptFaces", "otherHeads", "coveredExtra", "sha256"):
                    if key in r:
                        kr[key] = r[key]
                if r.get("status") == "ok":
                    vs, errs = judge(r, k, orig, cores)
                    kr["errors"] = errs
                    kr["leaks"] = [v for v in vs if v["v"] == "leak"]
                    for v in kr["leaks"]:
                        sheet.add(f"{len(ctx.leak)}-{k}-{v['copy']} {row['source'][:5]}", v["path"], v["box"])
                    if k == "fit":
                        lk = [sc(b) for b in row["leaked"]]
                        gv, _ = judge(r, k, orig, lk, names={"upload"})
                        kr["gate"] = [v for v in gv if v["v"] == "leak"]
                rec["kinds"][k] = kr
            ctx.leak[p] = rec
        shutil.rmtree(d, ignore_errors=True)
        print(f"  leak set: {len(ctx.leak)}/{len(ctx.leak_rows)}", flush=True)
    if len(ctx.leak) != len(ctx.leak_rows):
        raise Crash(f"leak set incomplete: {len(ctx.leak)} of {len(ctx.leak_rows)}")
    ctx.leak_sheet = sheet.finish()


def check_leak_set(ctx):
    fails = []
    try:
        ensure_leak(ctx)
    except Crash as e:
        return [str(e)], {}
    per = {k: {"sent": 0, "refused": {}} for k in ("fit", "snap", "items")}
    leaks = []
    for p, rec in ctx.leak.items():
        for k, kr in rec["kinds"].items():
            if kr["status"] == "ok":
                per[k]["sent"] += 1
                for e in kr.get("errors", []):
                    fails.append(f"{rec['photo']} {k}: {e}")
                leaks += [(rec["photo"], k, v["copy"], v["box"], v.get("unchanged"), v.get("inside")) for v in kr["leaks"]]
            else:
                key = f"{kr['status']}/{kr.get('reason')}" if not kr.get("error") else f"error {kr['error'][:40]}"
                per[k]["refused"][key] = per[k]["refused"].get(key, 0) + 1
    photos_leaking = sorted({x[0] for x in leaks})
    if leaks:
        fails.append(f"{len(leaks)} face cores not hidden in {len(photos_leaking)} photos (first: {leaks[0][0]} {leaks[0][1]} "
                     f"{leaks[0][2]}, unchanged {leaks[0][4]}, inside hidden {leaks[0][5]})")
    if per["fit"]["sent"] < 40:
        fails.append(f"only {per['fit']['sent']} of 59 fit checks sent (≥ 40: hide, don't just refuse)")
    gate = sum(len(rec["kinds"]["fit"].get("gate", [])) for rec in ctx.leak.values())
    return fails, {"per_kind": per, "leaks": len(leaks), "photos_leaking": photos_leaking, "sheet": ctx.leak_sheet,
                   "gate_185_not_hidden (the held-out line's automatic gate)": gate,
                   "leak_list": leaks[:300]}


# ---------------------------------------------------------------- the normal set (false refusals, time, no regression)
def normal_photos(ctx):
    rows = ctx.normal_rows
    if ctx.full:
        return rows
    mp = [r for r in rows if r["before"] != "ok"]
    rest = random.Random(SEED + 2).sample([r for r in rows if r["before"] == "ok"], 60 - len(mp))
    return mp + rest


def pick_of(loc, i):
    W, H = loc["size"]
    c = loc["candidates"][i]
    return [c[0] / W, c[1] / H, c[2] / W, c[3] / H]


def ensure_normal(ctx):
    if getattr(ctx, "normal_fail", None):
        raise Crash(ctx.normal_fail)
    if ctx.normal is not None:
        return
    try:
        ctx.normal = _normal(ctx)
    except Crash as e:
        ctx.normal, ctx.normal_fail = None, str(e)
        raise


def _normal(ctx):
    normal = {}
    warm = [{"photo": r["path"], "warm": True} for r in ctx.normal_rows[:3]]
    sheet_r, sheet_b, sheet_p = Sheet("false-refusals"), Sheet("body-newly-hidden"), Sheet("picked")
    rows = normal_photos(ctx)
    for part in chunks(rows, 19):
        d = ctx.scratch()
        photos = [r["path"] for r in part]
        mpp = [r["path"] for r in part if r["before"] != "ok"]
        tr = ctx.truth(photos, d, grids=(), mp=False)
        if mpp:
            tr2 = ctx.truth(mpp, ctx.scratch())
            for p in mpp:
                tr[p]["hunt"], tr[p]["heads"] = tr2[p]["hunt"], tr2[p]["heads"]
        lj = [{"photo": p, "kind": k} for p in photos for k in ("fit", "items")]
        lm, ln = ctx.main.call("locate", lj), ctx.new.call("locate", lj)
        for w in warm:
            w["root"] = fresh_root(d)
        mres = ctx.main.call("prep", warm + [{"photo": p, "root": fresh_root(d)} for p in photos])
        nres = ctx.new.call("prep", warm + [{"photo": p, "root": fresh_root(d)} for p in photos])
        # "Which one is you?" photos: each candidate picked
        pj, pk = [], []
        for i, p in enumerate(photos):
            loc = lm[2 * i]
            if loc["status"] == "multiplePeople":
                for c in range(len(loc["candidates"])):
                    pj.append({"photo": p, "pick": pick_of(loc, c)})
                    pk.append((p, c))
        plm = ctx.main.call("locate", pj) if pj else []
        pln = ctx.new.call("locate", pj) if pj else []
        proot = ctx.scratch()
        for j in pj:
            j["root"] = fresh_root(proot)
        pres = ctx.new.call("prep", pj) if pj else []
        pmain = ctx.main.call("prep", [dict(j, root=fresh_root(proot)) for j in pj]) if pj else []
        refused = [p for i, p in enumerate(photos) if part[i]["before"] == "ok" and nres[i].get("status") != "ok"]
        try:
            sw = {r["photo"]: r for r in ctx.new.call("sweep", [{"photo": p, "detector": "real"} for p in refused])} if refused else {}
        except Crash as e:
            sw = {p: {"swept": [], "error": str(e)} for p in refused}
        for i, row in enumerate(part):
            p, t, m, n = row["path"], tr[row["path"]], mres[i], nres[i]
            orig = rgb(t["png"])
            H, W = orig.shape[:2]
            rec = {"photo": no_kit(p), "source": row["source"], "before": row["before"], "main": m.get("status"),
                   "new": n.get("status"), "reason": n.get("reason"), "error": n.get("error"),
                   "candMain": m.get("candidates"), "candNew": n.get("candidates"),
                   "tMain": {k: m.get(k) for k in ("visionMs", "totalMs")},
                   "tNew": {k: n.get(k) for k in ("visionMs", "sweepMs", "totalMs")},
                   "counts": {k: n.get(k) for k in ("sweptFaces", "otherHeads", "coveredExtra")}, "locate": [], "shares": []}
            for k, a, b in (("fit", lm[2 * i], ln[2 * i]), ("items", lm[2 * i + 1], ln[2 * i + 1])):
                b = {x: y for x, y in b.items() if x != "otherHeads"}
                if a != b:
                    rec["locate"].append(f"{k}: {sorted(x for x in set(a) | set(b) if a.get(x) != b.get(x))}")
            for (pp, c), a, b in zip(pk, plm, pln):
                if pp == p:
                    b = {x: y for x, y in b.items() if x != "otherHeads"}
                    if a != b:
                        rec["locate"].append(f"pick {c}: {sorted(x for x in set(a) | set(b) if a.get(x) != b.get(x))}")
            if p in sw:
                s = sw[p]
                rec["swept"] = s.get("swept")
                for f in (s.get("swept") or [])[:6]:
                    sheet_r.add(f"{rec['photo'][-20:]} {n.get('reason')}", t["png"], f[:4])
            if m.get("status") == "ok" and n.get("status") == "ok":
                mu, nu = rgb(uri_path(m["uploadUri"])), rgb(uri_path(n["uploadUri"]))
                uh, uw = mu.shape[:2]
                o = resize(orig, uw, uh)
                s = uw / W
                for h in lm[2 * i]["hide"]:
                    c = inter([v * s for v in h], [0, 0, uw, uh])
                    if not c:
                        continue
                    x0, y0, x1, y1 = int(c[0]), int(c[1]), int(math.ceil(c[0] + c[2])), int(math.ceil(c[1] + c[3]))
                    if x1 - x0 < 2 or y1 - y0 < 2:
                        continue
                    go = grey(o[y0:y1, x0:x1])
                    rec["shares"].append([round(float((np.abs(grey(mu[y0:y1, x0:x1]) - go) < 12).mean()), 3),
                                          round(float((np.abs(grey(nu[y0:y1, x0:x1]) - go) < 12).mean()), 3)])
                main = lm[2 * i]["main"]
                if main:
                    top = [h for h in lm[2 * i]["hide"] if overlaps(h, main) and h[1] < main[1] + 0.35 * main[3]]
                    y0 = max([h[1] + h[3] for h in top] + [main[1]])
                    bx = [main[0] * s, y0 * s, main[2] * s, (main[1] + main[3] - y0) * s]
                    c = inter(bx, [0, 0, uw, uh])
                    if c and c[2] > 2 and c[3] > 2:
                        x0, yy0, x1, yy1 = int(c[0]), int(c[1]), int(c[0] + c[2]), int(c[1] + c[3])
                        ch = float((np.abs(grey(mu[yy0:yy1, x0:x1]) - grey(nu[yy0:yy1, x0:x1])) >= 12).mean())
                        rec["bodyNew"] = round(ch, 4)
                        if ch > 0.05:
                            sheet_b.add(f"{rec['photo'][-18:]} {ch:.0%}", uri_path(n["uploadUri"]), bx)
            picks = []
            for (pp, c), j, r, rm in zip(pk, pj, pres, pmain):
                if pp != p:
                    continue
                pc = {"cand": c, "status": r.get("status"), "picked": r.get("picked"), "mainStatus": rm.get("status")}
                if r.get("status") == "ok":
                    loc = lm[2 * i]
                    up = rgb(uri_path(r["uploadUri"]))
                    uh, uw = up.shape[:2]
                    s = uw / W
                    me = loc["candidates"][c]
                    cov = []
                    for oc, other in enumerate(loc["candidates"]):
                        if oc == c:
                            continue
                        x0, y0 = max(0, int(other[0] * s)), max(0, int(other[1] * s))
                        x1, y1 = min(uw, int(math.ceil((other[0] + other[2]) * s))), min(uh, int(math.ceil((other[1] + other[3]) * s)))
                        reg = up[y0:y1, x0:x1].astype(np.int16)
                        g = np.all(np.abs(reg - 128) <= 10, axis=2)
                        xc, yc = (np.arange(x0, x1) + 0.5) / s, (np.arange(y0, y1) + 0.5) / s
                        mine = ((yc >= me[1]) & (yc < me[1] + me[3]))[:, None] & ((xc >= me[0]) & (xc < me[0] + me[2]))[None, :]
                        out_ = ~mine
                        cov.append(round(float(g[out_].mean()) if out_.any() else 1.0, 3))
                    pc["cover"] = cov
                    vs, errs = judge(r, "fit", orig, t["hunt"] + t["heads"])
                    pc["leaks"] = [v for v in vs if v["v"] == "leak"]
                    pc["errors"] = errs
                    for v in pc["leaks"][:4]:
                        sheet_p.add(f"{rec['photo'][-14:]} pick{c} {v['copy']}", v["path"], v["box"])
                    ctx.picks[(p, c)] = {"result": r, "cores": t["hunt"] + t["heads"], "png": None}
                    pc["leaks"] = [{k: v[k] for k in ("copy", "box", "unchanged", "inside", "grey") if k in v} for v in pc["leaks"]]
                picks.append(pc)
            rec["picks"] = picks
            normal[p] = rec
        shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(proot, ignore_errors=True)
        print(f"  normal set: {len(normal)}/{len(rows)}", flush=True)
    if len(normal) != len(rows):
        raise Crash(f"normal set incomplete: {len(normal)} of {len(rows)}")
    ctx.normal_sheets = [sheet_r.finish(), sheet_b.finish(), sheet_p.finish()]
    return normal


def check_false_refusals(ctx):
    try:
        ensure_normal(ctx)
    except Crash as e:
        return [str(e)], {}
    fails = []
    recs = list(ctx.normal.values())
    newly = [r for r in recs if r["before"] == "ok" and r["new"] != "ok"]
    his = [r for r in newly if r["source"] in HIS]
    if len(newly) > MAX_NEW_REFUSALS:
        fails.append(f"{len(newly)} of the photos sent today newly refused (≤ {MAX_NEW_REFUSALS})")
    if his:
        fails.append(f"{len(his)} of his own sent phone checks or mirror-set photos refused: {[r['photo'][-24:] for r in his][:4]}")
    asked = [r for r in newly if r["new"] == "multiplePeople"]
    if asked:
        fails.append(f"'Which one is you?' newly asked on {len(asked)} photos")
    for r in recs:
        if r["before"] != "ok" and (r["new"] != r["before"] or r["candNew"] != r["candMain"]):
            fails.append(f"{r['photo'][-24:]}: was {r['before']} with {len(r['candMain'] or [])} candidates, now {r['new']} with {len(r['candNew'] or [])}")
    for r in recs:
        for pc in r["picks"]:
            lab = f"{r['photo'][-20:]} pick {pc['cand']}"
            if pc["status"] != pc["mainStatus"]:
                fails.append(f"{lab}: {pc['status']}, today {pc['mainStatus']}")
                continue
            if pc["status"] != "ok":
                continue
            if pc["picked"] != pc["cand"]:
                fails.append(f"{lab}: picked {pc['picked']}")
                continue
            if any(c < 0.8 for c in pc["cover"]):
                fails.append(f"{lab}: another candidate only {min(pc['cover']):.0%} covered grey outside his box")
            if pc["leaks"]:
                fails.append(f"{lab}: {len(pc['leaks'])} face cores not hidden (first {pc['leaks'][0]})")
            for e in pc["errors"]:
                fails.append(f"{lab}: {e}")
    counts = {k: sum((r["counts"].get(k) or 0) for r in recs) for k in ("sweptFaces", "otherHeads", "coveredExtra")}
    body = [r.get("bodyNew") for r in recs if r.get("bodyNew") is not None]
    rep = {"photos": len(recs), "newly_refused": [{k: r[k] for k in ("photo", "source", "new", "reason", "swept") if k in r} for r in newly],
           "totals": counts, "photos_with": {k: sum(1 for r in recs if r["counts"].get(k)) for k in counts},
           "body_newly_hidden_over_5pct": sum(1 for b in body if b > 0.05), "body_newly_hidden_median": statistics.median(body) if body else None,
           "sheets": ctx.normal_sheets, "picks": {r["photo"]: r["picks"] for r in recs if r["picks"]}}
    return fails, rep


def check_time(ctx):
    try:
        ensure_normal(ctx)
    except Crash as e:
        return [str(e)], {}
    fails = []
    recs = [r for r in ctx.normal.values() if r["new"] == "ok" and r["main"] == "ok"]
    sw = [r["tNew"]["sweepMs"] for r in recs if isinstance(r["tNew"].get("sweepMs"), (int, float))]
    if len(sw) < len(recs):
        fails.append(f"sweepMs missing on {len(recs) - len(sw)} of {len(recs)} sent photos")
    vm, vn = [r["tMain"]["visionMs"] for r in recs], [r["tNew"]["visionMs"] for r in recs]
    tm, tn = [r["tMain"]["totalMs"] for r in recs], [r["tNew"]["totalMs"] for r in recs]
    rep = {"n": len(recs), "visionMs": {"main": [statistics.median(vm), pctl(vm, 95)], "new": [statistics.median(vn), pctl(vn, 95)]},
           "totalMs": {"main": [statistics.median(tm), pctl(tm, 95)], "new": [statistics.median(tn), pctl(tn, 95)]}} if recs else {}
    if sw:
        rep["sweepMs"] = [statistics.median(sw), pctl(sw, 95)]
        if statistics.median(sw) > SWEEP_MEDIAN_MS:
            fails.append(f"sweepMs median {statistics.median(sw):.0f} ms (≤ {SWEEP_MEDIAN_MS})")
        if pctl(sw, 95) > SWEEP_P95_MS:
            fails.append(f"sweepMs p95 {pctl(sw, 95):.0f} ms (≤ {SWEEP_P95_MS})")
    if recs:
        a, b = statistics.median(vm), statistics.median(vn)
        if abs(b - a) > max(0.1 * a, 20):
            fails.append(f"visionMs median {b:.0f} ms vs main's {a:.0f} ms (within max(10%, 20 ms))")
    if ctx.leak:
        grid = max(ctx.leak.values(), key=lambda r: len(r["cores"]))
        small = next((r for r in ctx.leak.values() if r["size"] == [640, 360]), None)
        rep["edges"] = {f"{x['photo']} ({len(x['cores'])} faces, {x['size'][0]}×{x['size'][1]})": x["kinds"]["fit"].get("sweepMs")
                        for x in (grid, small) if x}
    return fails, rep


# ---------------------------------------------------------------- the 1,513 baseline statuses and the held-out set
def heldout_photos():
    fs = sorted(os.listdir(FP))
    return [str(FP / f) for i, f in enumerate(fs) if i % 8 == 4]


def check_heldout(ctx):
    fails = []
    try:
        ensure_leak(ctx)
    except Crash as e:
        return [str(e)], {}
    gate = [(rec["photo"], v["box"], v.get("unchanged"), v.get("inside")) for rec in ctx.leak.values()
            for v in rec["kinds"]["fit"].get("gate", [])]
    if gate:
        fails.append(f"{len(gate)} of the 185 baseline boxes still not hidden in the fit upload (first {gate[0]})")
    sets = [("held-out", heldout_photos()), ("baseline", [b["photo"] for b in ctx.before])]
    sheets = {n: Sheet(f"held-out-{n}") for n, _ in sets}
    rep = {}
    ctx.status1513 = {}
    for name, photos in sets:
        st, sus = {}, 0
        for part in chunks(photos, 15):
            d = ctx.scratch()
            try:
                tr = ctx.truth(part, d)
                res = ctx.new.call("prep", [{"photo": p, "root": fresh_root(d)} for p in part])
            except Crash as e:
                return fails + [str(e)], rep
            for p, r in zip(part, res):
                s = r.get("status") if "error" not in r else "error"
                key = s if s == "ok" else f"{s}/{r.get('reason')}"
                st[key] = st.get(key, 0) + 1
                if name == "baseline":
                    ctx.status1513[p] = s
                t = tr.get(p)
                if s == "ok" and t:
                    orig = rgb(t["png"])
                    vs, errs = judge(r, "fit", orig, dedupe(t["hunt"] + t["heads"], 0.5), names={"upload"})
                    for v in vs:
                        if v["v"] == "leak":
                            sus += 1
                            sheets[name].add(f"{Path(p).parent.name[:8]}/{Path(p).stem[:12]}", v["path"], v["box"])
            shutil.rmtree(d, ignore_errors=True)
            print(f"  {name}: {sum(st.values())}/{len(photos)}", flush=True)
        rep[name] = {"photos": len(photos), "statuses": st, "suspects": sus, "sheet": sheets[name].finish()}
    rep["gate_185"] = {"not_hidden": len(gate), "list": gate[:50]}
    rep["eye"] = "every suspect on the sheets needs the reviewer's verdict (print, poster, screen, already pixelated, real) in TASK.md → Review"
    return fails, rep


# ---------------------------------------------------------------- F2.2 · no regression
def check_no_regression(ctx):
    try:
        ensure_normal(ctx)
    except Crash as e:
        return [str(e)], {}
    fails, rep = [], {}
    for r in ctx.normal.values():
        for x in r["locate"]:
            fails.append(f"{r['photo'][-24:]} locate differs from main: {x}")
        for a, b in r["shares"]:
            if b > a + 0.05:
                fails.append(f"{r['photo'][-24:]}: a hidden region is {b:.2f} unchanged now vs {a:.2f} on main")
    if ctx.full:
        if ctx.status1513 is None:
            ctx.status1513 = {}
            photos = [b["photo"] for b in ctx.before]
            for part in chunks(photos, 40):
                d = ctx.scratch()
                try:
                    res = ctx.new.call("prep", [{"photo": p, "root": fresh_root(d)} for p in part])
                except Crash as e:
                    return fails + [str(e)], rep
                for p, r in zip(part, res):
                    ctx.status1513[p] = r.get("status") if "error" not in r else "error"
                shutil.rmtree(d, ignore_errors=True)
                print(f"  baseline statuses: {len(ctx.status1513)}/{len(photos)}", flush=True)
        loosened = [b["photo"] for b in ctx.before if b["status"] != "ok" and ctx.status1513.get(b["photo"]) == "ok"]
        if loosened:
            fails.append(f"{len(loosened)} baseline photos not sendable today are sent now: {[no_kit(p) for p in loosened[:3]]}")
        rep["baseline_loosened"] = len(loosened)
        try:
            ctx.kmeasure_bin()
            fg = REPO / "extraction-test" / "face_gap.py"
            a = subprocess.run(["/usr/bin/python3", str(fg), "run", "after"], capture_output=True, text=True, cwd=REPO)
            b = subprocess.run(["/usr/bin/python3", str(fg), "compare"], capture_output=True, text=True, cwd=REPO)
            lines = [l for l in b.stdout.splitlines() if l[:1] == "H" and ":" in l]
            rep["face_gap"] = lines
            if a.returncode or b.returncode or len(lines) < 4 or any("FAIL" in l for l in lines):
                fails.append(f"face_gap.py: {lines or (a.stderr + b.stderr)[-200:]}")
        except Fail as e:
            fails.append(str(e))
    else:
        rep["skipped_in_quick"] = "the 1,513 baseline statuses and face_gap.py"
    return fails, rep


# ---------------------------------------------------------------- F2.2 · kmeasure copies
def check_kmeasure(ctx):
    fails, rep = [], {}
    try:
        ensure_leak(ctx)
        ensure_normal(ctx)
        km = ctx.kmeasure_bin()
    except (Crash, Fail) as e:
        return [str(e)], {}
    d = ctx.scratch()
    zdir = d / "zoom"
    zdir.mkdir()
    n_written = 0
    for i, row in enumerate(ctx.leak_rows):
        rec = ctx.leak[row["path"]]
        subprocess.run([str(km), "zoom", row["path"], str(zdir), f"L{i}"], capture_output=True, text=True)
        f = zdir / f"L{i}.full.jpg"
        fit = rec["kinds"]["fit"]
        if f.exists() != (fit["status"] == "ok"):
            fails.append(f"zoom {rec['photo'][-28:]}: copy written {f.exists()}, but run's status is {fit['status']}")
        if not f.exists():
            continue
        n_written += 1
        W, H = rec["size"]
        cp = rgb(f)
        ch, cw = cp.shape[:2]
        png = ctx.scratch() / "o.png"
        ctx.main.call("truth", [{"photo": row["path"], "png": str(png), "grids": []}])
        o = resize(rgb(png), cw, ch)
        s = cw / W
        hr = [[r[0] * cw, r[1] * ch, r[2] * cw, r[3] * ch] for r in (fit.get("hidden") or [])]
        bad = [v for v in (verdict([x * s for x in c], cp, o, hr) for c in rec["cores"]) if v[0] == "leak"]
        if bad:
            fails.append(f"zoom {rec['photo'][-28:]}: {len(bad)} face cores not hidden in <stem>.full.jpg (first {bad[0][1]})")
        shutil.rmtree(png.parent, ignore_errors=True)
    rep["zoom_written"] = n_written
    pdir = d / "people"
    pdir.mkdir()
    mps = [r["path"] for r in ctx.normal_rows if r["before"] == "multiplePeople"]
    subprocess.run([str(km), "people", "--out", str(pdir), *mps], capture_output=True, text=True)
    for p in mps:
        stem = Path(p).stem
        loc = ctx.main.call("locate", [{"photo": p}])[0]
        for c in range(len(loc["candidates"])):
            f = pdir / f"{stem}.pick{c}.jpg"
            pr = ctx.picks.get((p, c))
            if f.exists() != (pr is not None):
                fails.append(f"people {stem[:12]} pick {c}: copy written {f.exists()}, run ok {pr is not None}")
            if not f.exists() or pr is None:
                continue
            cp = rgb(f)
            ch, cw = cp.shape[:2]
            png = ctx.scratch() / "o.png"
            ctx.main.call("truth", [{"photo": p, "png": str(png), "grids": []}])
            orig = rgb(png)
            H, W = orig.shape[:2]
            o = resize(orig, cw, ch)
            s = cw / W
            hr = [[r[0] * cw, r[1] * ch, r[2] * cw, r[3] * ch] for r in (pr["result"].get("hidden") or [])]
            bad = [v for v in (verdict([x * s for x in cc], cp, o, hr) for cc in pr["cores"]) if v[0] == "leak"]
            if bad:
                fails.append(f"people {stem[:12]} pick {c}: {len(bad)} face cores not hidden (first {bad[0][1]})")
            shutil.rmtree(png.parent, ignore_errors=True)
    shutil.rmtree(d, ignore_errors=True)
    return fails, rep


# ---------------------------------------------------------------- built photos: the face pool and the hosts
def ensure_pool(ctx):
    if getattr(ctx, "pool", None) is not None:
        return
    fs = sorted(os.listdir(FP))
    photos = [str(FP / f) for i, f in enumerate(fs) if i % 8 == 2]
    pool = []
    for part in chunks(photos, 20):
        d = ctx.scratch()
        tr = ctx.truth(part, d, grids=(1, 2), mp=False)
        for p in part:
            t = tr[p]
            if not t:
                continue
            arr = rgb(t["png"])
            H, W = arr.shape[:2]
            poses = ctx.pose.poses(arr)
            noses = [q[0] for q in poses if q[0][2] >= 0.5]
            vis = [f[:4] for f in t["faces"] if f[4] >= 0.5]
            for k, q in enumerate(poses):
                v = [x[2] for x in q]
                kind = None
                # A profile: the near ear, eye and nose in that order across, the two eyes almost on top of each other
                # (spread under 0.35 of ear-to-nose). MediaPipe gives both ears ~1.0 visibility on nearly every pose here
                # (5th percentile 0.99), so TESTING.md's ear-visibility rule picks none; this is its geometric reading.
                if v[0] >= 0.5:
                    ear = 7 if v[7] >= v[8] else 8
                    eye = 2 if ear == 7 else 5
                    dn, de = q[0][0] - q[ear][0], q[eye][0] - q[ear][0]
                    if (v[ear] >= 0.5 and v[eye] >= 0.5 and dn * de > 0 and abs(dn) > abs(de)
                            and abs(q[2][0] - q[5][0]) < 0.35 * abs(dn) and Path(p).name not in NOT_FACES):
                        kind = "profile"
                if not kind and v[0] >= 0.5 and v[2] >= 0.8 and v[5] >= 0.8:
                    core = core_of([q[i] for i in range(11) if q[i][2] >= 0.5])
                    if any(overlaps(grow(core, 0.5), f) and core[0] - core[2] < f[0] + f[2] / 2 < core[0] + 2 * core[2] for f in vis):
                        kind = "frontal"
                if not kind:
                    continue
                core = core_of([q[i] for i in range(11) if q[i][2] >= 0.5])
                if core[3] < 28:
                    continue
                side = 2.2 * max(core[2], core[3])
                sq = [core[0] + core[2] / 2 - side / 2, core[1] + core[3] / 2 - side * 0.62, side, side]
                if sq[0] < 0 or sq[1] < 0 or sq[0] + side > W or sq[1] + side > H:
                    continue
                if sum(1 for n in noses if sq[0] <= n[0] <= sq[0] + side and sq[1] <= n[1] <= sq[1] + side) > 1:
                    continue
                x0, y0 = int(sq[0]), int(sq[1])
                head = arr[y0:y0 + int(side), x0:x0 + int(side)].copy()
                hs = None
                if v[11] >= 0.5 and v[12] >= 0.5:
                    span = abs(q[11][0] - q[12][0])
                    cx = core[0] + core[2] / 2
                    bx0, bx1 = max(0, int(cx - 0.8 * max(span, 2 * core[2]))), min(W, int(cx + 0.8 * max(span, 2 * core[2])))
                    by0, by1 = max(0, int(core[1] - 1.0 * core[3])), min(H, int(max(q[11][1], q[12][1]) + 0.5 * span))
                    if bx1 - bx0 > core[2] * 2 and by1 - by0 > core[3] * 2:
                        hs = (arr[by0:by1, bx0:bx1].copy(), [core[0] - bx0, core[1] - by0, core[2], core[3]])
                pool.append({"photo": Path(p).name, "pose": k, "kind": kind, "head": head,
                             "core": [core[0] - x0, core[1] - y0, core[2], core[3]], "hs": hs})
        shutil.rmtree(d, ignore_errors=True)
    ctx.pool = pool
    print(f"  face pool: {sum(1 for x in pool if x['kind'] == 'frontal')} frontal, {sum(1 for x in pool if x['kind'] == 'profile')} profile", flush=True)


def host_info(ctx, rows, d):
    """main's decode, locate and dense hunt, and MediaPipe, for each host photo: his head region and his own face cores."""
    photos = [r["path"] for r in rows]
    tr = ctx.truth(photos, d)
    locs = ctx.main.call("locate", [{"photo": p} for p in photos])
    today = ctx.main.call("prep", [{"photo": p, "root": fresh_root(d)} for p in photos])
    out = []
    for r, p, loc, td in zip(rows, photos, locs, today):
        t = tr[p]
        if not t or loc["status"] != "ok" or not loc["main"] or td.get("status") != "ok":
            continue
        main = loc["main"]
        top = [h for h in loc["hide"] if overlaps(h, main) and h[1] < main[1] + 0.35 * main[3]]
        if top:
            x0, y0 = min(h[0] for h in top), min(h[1] for h in top)
            x1, y1 = max(h[0] + h[2] for h in top), max(h[1] + h[3] for h in top)
            head = [x0, y0, x1 - x0, y1 - y0]
        else:
            continue
        mine = [c for c in t["hunt"] + t["heads"] if overlaps(c, grow(head, 0.2))]
        # A host whose own face today's copy doesn't already hide by the rule above is no control: skipped.
        W, H = loc["size"]
        fake = dict(td, hidden=[[h[0] / W, h[1] / H, h[2] / W, h[3] / H] for h in loc["hide"]])
        vs, _ = judge(fake, "fit", rgb(t["png"]), mine, names={"upload", "detail"})
        if any(v["v"] == "leak" for v in vs):
            continue
        heads_in_main = [h for h in t["heads"] if overlaps(h, main)]
        out.append({"row": r, "photo": p, "png": t["png"], "main": main, "hide": loc["hide"], "head": head, "mine": dedupe(mine, 0.5),
                    "mphead": max(heads_in_main, key=lambda h: h[3]) if heads_in_main else None})
    return out


def soft_oval(w, h):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse([w * 0.06, h * 0.04, w * 0.94, h * 0.96], fill=255)
    return m.filter(ImageFilter.GaussianBlur(max(1, w * 0.06)))


def paste(canvas, patch, mask, x, y):
    """Paste with a mask, clipped to the canvas (PIL handles negative offsets)."""
    canvas.paste(Image.fromarray(patch), (int(round(x)), int(round(y))), mask)


def eval_built(ctx, builds, d, label):
    """Run (fit) on each built photo; per pasted face: hidden in the upload and detail copy, or the photo refused."""
    res = ctx.new.call("prep", [{"photo": b["file"], "root": fresh_root(d)} for b in builds])
    # "Which one is you?" sends nothing only until he taps himself: then that copy is judged (him = the candidate that
    # overlaps his own box most).
    again = []
    for k, (b, r) in enumerate(zip(builds, res)):
        if r.get("status") == "multiplePeople" and r.get("candidates") and b.get("him"):
            W, H = r["width"], r["height"]
            hb = [b["him"][0] / W, b["him"][1] / H, b["him"][2] / W, b["him"][3] / H]
            best = max(r["candidates"], key=lambda c: iou(c, hb))
            again.append((k, {"photo": b["file"], "root": fresh_root(d), "pick": best}))
    if again:
        for (k, _), r2 in zip(again, ctx.new.call("prep", [j for _, j in again])):
            r2["_pickedHim"] = True
            res[k] = r2
    out = []
    for b, r in zip(builds, res):
        orig = rgb(b["file"])
        st = r.get("status") if "error" not in r else "error"
        his = []
        if st == "ok":
            vs, errs = judge(r, "fit", orig, [f["core"] for f in b["faces"]] + b["mine"], names={"upload", "detail"})
            nf = len(b["faces"])
            for k, f in enumerate(b["faces"]):
                vk = [v for v in vs if v["core"] == k]
                f["caught"] = "hidden" if vk and all(v["v"] in ("hidden", "covered", "tiny") for v in vk) else "missed"
                f["detail"] = [{x: v.get(x) for x in ("copy", "v", "unchanged", "inside", "grey")} for v in vk]
                f["miss"] = [v for v in vk if v["v"] == "leak"]
            his = [v for v in vs if v["core"] >= nf and v["v"] == "leak"]
            for e in errs:
                b.setdefault("errors", []).append(e)
        else:
            for f in b["faces"]:
                f["caught"] = f"refused ({st}/{r.get('reason')})"
        out.append({"file": b["file"], "host": b["host"], "status": st, "reason": r.get("reason"), "pickedHim": bool(r.get("_pickedHim")),
                    "counts": {k: r.get(k) for k in ("sweptFaces", "otherHeads", "coveredExtra")},
                    "faces": b["faces"], "his": his, "errors": b.get("errors", [])})
    return out


# ---------------------------------------------------------------- F2.2 · built small faces
def check_built_small(ctx):
    try:
        ensure_pool(ctx)
    except Crash as e:
        return [str(e)], {}
    fails = []
    rng = random.Random(SEED + 3)
    hosts_rows = [r for r in ctx.normal_rows if r["before"] == "ok" and r["source"] in HIS + ("phone-oct7",)]
    rng.shuffle(hosts_rows)
    want = 60 if ctx.full else 20
    combos = [(k, b) for k in ("frontal", "profile") for b in ((12, 19), (20, 31), (32, 64))]
    plan = [combos[i % 6] for i in range(2 * want)]
    rng.shuffle(plan)
    frontal = [x for x in ctx.pool if x["kind"] == "frontal"]
    profile = [x for x in ctx.pool if x["kind"] == "profile"]
    if len(frontal) < 10 or len(profile) < 10:
        return [f"(setup) face pool too small: {len(frontal)} frontal, {len(profile)} profile"], {}
    sheet = Sheet("built-small-faces")
    results = []
    slot = 0
    hi = 0
    while len(results) < want and hi < len(hosts_rows):
        part = hosts_rows[hi:hi + 10]
        hi += 10
        d = ctx.scratch()
        try:
            hosts = host_info(ctx, part, d)
        except Crash as e:
            return [str(e)], {}
        builds = []
        for h in hosts:
            if len(results) + len(builds) >= want:
                break
            base = Image.open(h["png"]).convert("RGB")
            W, H = base.size
            up = min(1, 1024 / max(W, H))
            mgrow = grow(h["main"], 0.1)
            faces, placed = [], []
            n_host = len(results) + len(builds)
            together = n_host % 6 == 5
            for which in ("bg", "bg2" if together else "beside"):
                kind, band = plan[slot % len(plan)]
                src = rng.choice(frontal if kind == "frontal" else profile)
                ht = rng.randint(band[0], band[1])
                f = (ht / up) / src["core"][3]
                side = max(4, int(round(src["head"].shape[0] * f)))
                patch = resize(src["head"], side, side)
                core0 = [c * f for c in src["core"]]
                pos = None
                for _ in range(300):
                    if which == "beside":
                        hd = h["head"]
                        u = rng.uniform(1, 2)
                        right = rng.random() < 0.5
                        cx = hd[0] + hd[2] + u * hd[2] if right else hd[0] - u * hd[2]
                        cy = hd[1] + hd[3] / 2 + rng.uniform(-0.3, 0.3) * hd[3]
                    elif which == "bg2" and placed:
                        p0 = placed[0]
                        cx = p0[0] + p0[2] / 2 + rng.choice((-1, 1)) * rng.uniform(1.05, 1.6) * max(side, p0[2])
                        cy = p0[1] + p0[3] / 2 + rng.uniform(-0.5, 0.5) * side
                    else:
                        edge = n_host % 10 == 3
                        cx = rng.choice((0, W)) if edge else rng.uniform(0, W)
                        cy = rng.uniform(0, H)
                    x, y = cx - (core0[0] + core0[2] / 2), cy - (core0[1] + core0[3] / 2)
                    box = [x, y, side, side]
                    core = [x + core0[0], y + core0[1], core0[2], core0[3]]
                    vis = inter(core, [0, 0, W, H])
                    if not vis or vis[2] * up < 4 or vis[3] * up < 4 or not (0 <= cx <= W and 0 <= cy <= H):
                        continue
                    if overlaps(box, mgrow) and which != "beside":
                        continue
                    if which == "beside" and overlaps(box, h["head"]):
                        continue
                    if any(overlaps(box, r) for r in h["hide"]) or any(overlaps(box, q) for q in placed):
                        continue
                    pos = (x, y, box, core)
                    break
                if not pos:
                    continue
                slot += 1
                x, y, box, core = pos
                g = grey(np.asarray(base)[max(0, int(box[1])):int(box[1] + box[3]), max(0, int(box[0])):int(box[0] + box[2])])
                paste(base, patch, soft_oval(side, side), x, y)
                placed.append(box)
                faces.append({"kind": kind, "px": round(core[3] * up, 1), "band": f"{band[0]}-{band[1]}", "where": which,
                              "core": core, "src": src["photo"], "edge": core[0] < 0 or core[1] < 0 or core[0] + core[2] > W or core[1] + core[3] > H,
                              "busy": float(g.std()) > 50 if g.size else False})
            if len(faces) < 2:
                continue
            f_ = ctx.built_dir() / f"built-{len(results) + len(builds)}.jpg"
            base.save(f_, quality=95)
            builds.append({"file": str(f_), "host": no_kit(h["photo"]), "faces": faces, "mine": h["mine"], "him": h["main"]})
        try:
            results += eval_built(ctx, builds, d, "small")
        except Crash as e:
            return [str(e)], {}
        for b in results[-len(builds):] if builds else []:
            for f in b["faces"]:
                if f["caught"] == "missed":
                    for v in f["miss"][:1]:
                        sheet.add(f"{f['kind'][:4]} {f['px']}px {f['where']}", v["path"], v["box"])
                f.pop("miss", None)
            for v in b["his"][:1]:
                sheet.add(f"HIS face {v['copy']}", v["path"], v["box"])
            b["his"] = len(b["his"])
        shutil.rmtree(d, ignore_errors=True)
        print(f"  built small faces: {len(results)}/{want} photos", flush=True)
    faces = [f for b in results for f in b["faces"]]
    if len(results) < want:
        fails.append(f"(setup) built {len(results)} of {want} photos")
    stats = {}
    for kind in ("frontal", "profile"):
        for band in ("12-19", "20-31", "32-64"):
            fs = [f for f in faces if f["kind"] == kind and f["band"] == band]
            caught = [f for f in fs if f["caught"] != "missed"]
            stats[f"{kind} {band}"] = {"faces": len(fs), "caught": len(caught), "refused": sum(1 for f in fs if f["caught"].startswith("refused"))}
            if (kind == "frontal" or band == "32-64") and len(caught) < len(fs):
                fails.append(f"{kind} {band} px: {len(fs) - len(caught)} of {len(fs)} pasted faces sent unhidden")
    his = sum(b["his"] for b in results)
    if his:
        fails.append(f"his own face unhidden in {his} copies after a paste")
    errs = [e for b in results for e in b["errors"]]
    if errs:
        fails.append(f"copy errors: {errs[:3]}")
    prof = stats.get("profile 12-19", {}), stats.get("profile 20-31", {})
    rep = {"photos": len(results), "faces": len(faces), "by_kind_and_size": stats,
           "profile_12_31_share": round(sum(p.get("caught", 0) for p in prof) / max(1, sum(p.get("faces", 0) for p in prof)), 3),
           "edges": {"clipped": sum(1 for f in faces if f["edge"]), "two_in_one_tile": sum(1 for f in faces if f["where"] == "bg2"),
                     "busy": sum(1 for f in faces if f["busy"])},
           "refused_photos": sum(1 for b in results if b["status"] != "ok"), "sheet": sheet.finish(),
           "eye": "a profile 12–31 px miss the eye calls readable fails this line (TASK.md → Review)",
           "photos_detail": results}
    return fails, rep


# ---------------------------------------------------------------- F2.2 · second mirror panel
def check_mirror_panel(ctx):
    try:
        ensure_pool(ctx)
    except Crash as e:
        return [str(e)], {}
    fails = []
    rng = random.Random(SEED + 4)
    rows = [r for r in ctx.normal_rows if r["before"] == "ok" and r["source"] in HIS + ("phone-oct7",)]
    rng.shuffle(rows)
    want = 40 if ctx.full else 20
    quota = {"a": round(want * 14 / 40), "b": round(want * 13 / 40)}
    quota["c"] = want - quota["a"] - quota["b"]
    hs = [x for x in ctx.pool if x["hs"] is not None]
    if len(hs) < 8:
        return [f"(setup) only {len(hs)} head-and-shoulders crops in the pool"], {}
    sheet = Sheet("second-mirror-panel")
    results = []
    hi = 0
    while len(results) < want and hi < len(rows):
        part = rows[hi:hi + 10]
        hi += 10
        d = ctx.scratch()
        try:
            hosts = host_info(ctx, part, d)
        except Crash as e:
            return [str(e)], {}
        builds = []
        for h in hosts:
            n = len(results) + len(builds)
            if n >= want:
                break
            base = Image.open(h["png"]).convert("RGB")
            W, H = base.size
            up_ = min(1, 1024 / max(W, H))
            types = sorted((t for t in quota if quota[t] > 0), key=lambda t: -quota[t])
            if not types:
                break
            typ = types[0]
            if typ == "c" and not h["mphead"]:
                typ = next((t for t in types if t != "c"), None)
                if not typ:
                    continue
            s = rng.uniform(0.15, 0.35)
            P = int(round(s / (1 - s) * W))
            left = n % 2 == 0
            canvas = Image.new("RGB", (W + P, H))
            ox = P if left else 0
            canvas.paste(base, (ox, 0))
            px0 = 0 if left else W
            strip = [0, 0, P, H] if left else [W - P, 0, P, H]
            arr = np.asarray(base)
            if overlaps(strip, grow(h["main"], 0.1)) or P > W:
                col = arr[:, 0:1] if left else arr[:, W - 1:W]
                bg = np.repeat(col, P, axis=1)
            else:
                bg = arr[:, strip[0]:strip[0] + P][:, ::-1]
            bgim = Image.fromarray(np.clip(bg.astype(np.float32) * 0.86, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
            panel = Image.new("RGB", (P, H))
            panel.paste(bgim, (0, 0))
            his_scale = None
            if typ in ("a", "b"):
                src = rng.choice(hs)
                img, c0 = src["hs"]
                ht = rng.uniform(24, 120)
                f = (ht / up_) / c0[3]
                pw, ph = max(4, int(img.shape[1] * f)), max(4, int(img.shape[0] * f))
                patch = resize(img, pw, ph)
                c = [v * f for v in c0]
                if typ == "a":
                    cx = rng.uniform(c[2] / 2 + 4, max(c[2] / 2 + 5, P - c[2] / 2 - 4))
                else:
                    share = rng.uniform(0.4, 0.7)
                    # the inner edge (next to his photo) cuts the face so `share` of the core's width is in the panel
                    cx = (P - share * c[2] + c[2] / 2) if left else (share * c[2] - c[2] / 2)
                cut_top = typ == "a" and n % 8 == 3
                cy = -0.1 * c[3] if cut_top else rng.uniform(0.12 * H, 0.5 * H)
                x, y = cx - (c[0] + c[2] / 2), cy - (c[1] + c[3] / 2)
                m = Image.new("L", (pw, ph), 255).filter(ImageFilter.GaussianBlur(0))
                ImageDraw.Draw(m).rectangle([0, 0, pw - 1, ph - 1], outline=160, width=2)
                paste(panel, patch, m, x, y)
                core = [x + c[0], y + c[1], c[2], c[3]]
                what = src["kind"]
            else:
                mh = h["mphead"]
                f_need = (24 / up_) / mh[3]
                lo = max(0.5, f_need)
                if lo > 0.8:
                    typ = "a" if quota["a"] > 0 else "b"
                    continue
                f = rng.uniform(lo, 0.8)
                flip = np.asarray(base)[:, ::-1]
                fw, fh = int(W * f), int(H * f)
                small = resize(flip, fw, fh)
                hc = [(W - mh[0] - mh[2]) * f, mh[1] * f, mh[2] * f, mh[3] * f]
                cx = P / 2
                x, y = cx - (hc[0] + hc[2] / 2), (H - fh) * 0.3
                paste(panel, small, Image.new("L", (fw, fh), 255), x, y)
                core = [x + hc[0], y + hc[1], hc[2], hc[3]]
                what = "his reflection"
                his_scale = f
            canvas.paste(panel, (px0, 0))
            dr = ImageDraw.Draw(canvas)
            lx = P - 3 if left else W
            dr.rectangle([lx, 0, lx + 2, H], fill=(25, 25, 25))
            vis = inter(core, [0, 0, P, H])
            core_c = [core[0] + px0, core[1], core[2], core[3]]
            vis_c = [vis[0] + px0, vis[1], vis[2], vis[3]] if vis else None
            CW, CH = W + P, H
            g = min(1, 2048 / max(CW, CH))
            if g < 1:
                canvas = canvas.resize((int(round(CW * g)), int(round(CH * g))), Image.LANCZOS)
            sc = lambda r: [v * g for v in r]
            mine = [sc([m_[0] + ox, m_[1], m_[2], m_[3]]) for m_ in h["mine"]]
            upc = min(1, 1024 / max(canvas.size))
            if not vis_c or vis_c[3] * g * upc < 24 or vis_c[2] * g * upc < 3:
                continue
            quota[typ] -= 1
            f_ = ctx.built_dir() / f"panel-{n}.jpg"
            canvas.save(f_, quality=95)
            builds.append({"file": str(f_), "host": no_kit(h["photo"]), "mine": mine, "him": sc([h["main"][0] + ox, h["main"][1], h["main"][2], h["main"][3]]),
                           "faces": [{"type": typ, "what": what, "side": "left" if left else "right", "panel": round(s, 2),
                                      "core": sc(vis_c), "px": round(vis_c[3] * g * upc, 1), "cutTop": core[1] < 0}]})
        try:
            got = eval_built(ctx, builds, d, "panel")
        except Crash as e:
            return [str(e)], {}
        for b in got:
            for f in b["faces"]:
                if f["caught"] == "missed":
                    for v in f["miss"][:1]:
                        sheet.add(f"({f['type']}) {f['what'][:8]} {f['px']}px", v["path"], v["box"])
                f.pop("miss", None)
            for v in b["his"][:1]:
                sheet.add(f"HIS main face {v['copy']}", v["path"], v["box"])
            b["his"] = len(b["his"])
        results += got
        shutil.rmtree(d, ignore_errors=True)
        print(f"  second mirror panel: {len(results)}/{want} photos", flush=True)
    if len(results) < want:
        fails.append(f"(setup) built {len(results)} of {want} panel photos")
    stats = {}
    for typ in ("a", "b", "c"):
        fs = [f for b in results for f in b["faces"] if f["type"] == typ]
        miss = [f for f in fs if f["caught"] == "missed"]
        stats[typ] = {"faces": len(fs), "missed": len(miss), "refused": sum(1 for f in fs if f["caught"].startswith("refused"))}
        if miss:
            fails.append(f"({typ}) {len(miss)} of {len(fs)} panel faces sent unhidden (first {miss[0]['what']} {miss[0]['px']} px)")
    his = sum(b["his"] for b in results)
    if his:
        fails.append(f"his main reflection's face unhidden in {his} copies")
    errs = [e for b in results for e in b["errors"]]
    if errs:
        fails.append(f"copy errors: {errs[:3]}")
    caught = {}
    for b in results:
        if b["status"] != "ok":
            k = f"refused {b['status']}/{b['reason']}" + (" (after picking him)" if b["pickedHim"] else "")
        elif b["pickedHim"]:
            k = "sent after picking him"
        else:
            c = b["counts"]
            k = "+".join(x for x in ("coveredExtra", "otherHeads", "sweptFaces") if c.get(x)) or "none of the new layers"
        caught[k] = caught.get(k, 0) + 1
    return fails, {"photos": len(results), "by_type": stats, "how_caught": caught,
                   "sides": {s: sum(1 for b in results if b["faces"][0]["side"] == s) for s in ("left", "right")},
                   "cut_top": sum(1 for b in results if b["faces"][0]["cutTop"]), "sheet": sheet.finish(), "photos_detail": results}


# ---------------------------------------------------------------- calibration of T (how the constant above was set)
def calibrate(ctx):
    rows = [r for r in ctx.normal_rows if r["before"] == "ok"]
    shares, covered, n = [], 0, 0
    for part in chunks(rows, 20):
        d = ctx.scratch()
        photos = [r["path"] for r in part]
        tr = ctx.truth(photos, d, grids=(1,), mp=False)
        locs = ctx.main.call("locate", [{"photo": p} for p in photos])
        res = ctx.main.call("prep", [{"photo": p, "root": fresh_root(d)} for p in photos])
        for p, loc, r in zip(photos, locs, res):
            t = tr[p]
            if r.get("status") != "ok":
                continue
            orig = rgb(t["png"])
            H, W = orig.shape[:2]
            fake = dict(r, hidden=[[h[0] / W, h[1] / H, h[2] / W, h[3] / H] for h in loc["hide"]])
            faces = [f[:4] for f in t["faces"]]
            vs, _ = judge(fake, "fit", orig, faces, names={"upload"})
            for v in vs:
                n += 1
                if v["v"] == "covered":
                    covered += 1
                elif v.get("inside", 0) >= 0.9:
                    shares.append(v["unchanged"])
        shutil.rmtree(d, ignore_errors=True)
        print(f"  calibrate: {len(shares)} faces", flush=True)
    mx = max(shares) if shares else 0
    print(json.dumps({"faces": n, "covered": covered, "rule_b": len(shares), "max_unchanged": mx,
                      "p50": pctl(shares, 50), "p95": pctl(shares, 95), "T": min(0.5, math.ceil(mx * 100) / 100)}))
    cands = [r["path"] for r in ctx.normal_rows if r["source"] == "his phone" and r["before"] == "ok"]
    rows = ctx.new.call("bcontrol", [{"photo": p} for p in cands])
    ctl = [r.get("controlShare") for r in rows]
    print(json.dumps({"B controls (his phone)": len(ctl), "max": max(c for c in ctl if c is not None),
                      "missing": sum(1 for c in ctl if c is None)}))


# ---------------------------------------------------------------- main
FUNCS = {"sweep-logic": check_sweep_logic, "old-sends-purged": check_purge, "same-photo": check_same_photo,
         "leak-set": check_leak_set, "kmeasure-copies": check_kmeasure, "false-refusals": check_false_refusals,
         "time": check_time, "built-small-faces": check_built_small, "second-mirror-panel": check_mirror_panel,
         "held-out-and-regression": check_heldout, "no-regression": check_no_regression}
QUICK = ("sweep-logic", "old-sends-purged", "same-photo", "leak-set", "kmeasure-copies", "false-refusals", "time",
         "built-small-faces", "second-mirror-panel", "no-regression")


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--full", action="store_true")
    g.add_argument("--quick", action="store_true")
    g.add_argument("--calibrate", action="store_true")
    ap.add_argument("--only", action="append", choices=[c[0] for c in CHECKS])
    args = ap.parse_args()
    bad = [p for p, h in PINS.items() if sha_file(REPO / p) != h]
    if bad:
        print(f"FAIL F2.2 · pinned inputs changed: {bad}")
        sys.exit(1)
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        ctx = Ctx(args)
    except Fail as e:
        for _, name in CHECKS:
            print(f"FAIL F2.2 · {name}: {e}")
        sys.exit(1)
    if args.calibrate:
        calibrate(ctx)
        return
    todo = [c for c in CHECKS if (not args.only or c[0] in args.only) and (args.full or c[0] in QUICK)]
    failed = 0
    summary = {}
    for slug, name in todo:
        t0 = time.time()
        try:
            fails, rep = FUNCS[slug](ctx)
        except Exception as e:  # a harness bug still fails the line, loudly
            import traceback
            traceback.print_exc()
            fails, rep = [f"harness error: {type(e).__name__}: {e}"], {}
        rep = {"mode": "full" if args.full else "quick", "fails": fails, "seconds": round(time.time() - t0), **rep}
        (OUT / f"{slug}.json").write_text(json.dumps(rep, indent=1, default=str))
        summary[slug] = not fails
        if fails:
            failed += 1
            print(f"FAIL F2.2 · {name}: {fails[0]}" + (f" (+{len(fails) - 1} more, see results/t96/{slug}.json)" if len(fails) > 1 else ""), flush=True)
        else:
            print(f"PASS F2.2 · {name}" + ("" if args.full else " (quick: not a pass)"), flush=True)
    shutil.rmtree(ctx.tmp, ignore_errors=True)
    if getattr(ctx, "_built", None):
        shutil.rmtree(ctx._built, ignore_errors=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
