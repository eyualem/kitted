"""T96s · F2.2: a face printed on his own top is left alone; his own face stays hidden (strict, privacy).
The test writer's file, locked: tasks/T96s/TESTING.md.

  /Users/eyu/Desktop/files/Kitted/extraction-test/.venv-mp/bin/python extraction-test/vision/print_faces_test.py --full
  ... --quick                 every line but T96's re-run, fewer built photos: the implementer's loop, never a pass
  ... --full --only logic     one line (slugs in CHECKS); a line passes only on --full
  ... --new-from <dir>        compile the build under test from <dir>'s KittedPrep/Guide/Measure.swift instead of the
                              worktree's: only for showing a planted bug bites (TESTING.md red: fields); never a pass

Mac only, $0: no network, no AI. The photos are other people's and stay git-ignored in the main checkout; built photos
are made at run time in a private folder under /private/tmp and deleted. Writes extraction-test/results/t96s/<line>.json
(committed) and crops for the eye (images, git-ignored). Prints PASS/FAIL F2.2 · <name> per line; exits 1 on any fail.

Three builds, one Swift driver (below) compiled against each:
  new     the worktree's KittedPrep/Guide/Measure.swift, -D R3 -D T96S (the build under test)
  before  a00da29d's (T96 round 3: the build that greys prints), -D R3
  main    1c34082d's (what his phone runs today)

Measures (TESTING.md): eye boxes are set by eye at lock, at the 1024 upload's size, around the eyes, nose and mouth,
grown 10%. "Left alone": in the upload, the detail copy and every close-up whose zoomRect holds ≥ 80% of the box, the
box's unchanged share (grey within 12 of the original resized to that copy) is ≥ 0.90 and its new-grey share (pixels
within 10 of 128 on every channel in the copy that aren't in the original) is ≤ 0.02. The raw grey share is reported
too: P3's untouched print is already 2.5% flat grey by it (measured at lock), so the raw share can't tell a cover from
the print's own ink. "Hidden": T96's rule (face_leak_test.verdict, T = 0.5).
"""
import argparse
import hashlib
import json
import math
import os
import random
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import face_leak_test as fl  # noqa: E402  T96's locked file: helpers only, read-only, never edited

REPO = fl.REPO
KIT = fl.KIT
OUT = REPO / "extraction-test" / "results" / "t96s"
IOS = fl.IOS
SWIFT = fl.SWIFT
BEFORE_COMMIT = "a00da29d"
MAIN_COMMIT = "1c34082d"
SEED = 9696
NB = " "  # the narrow no-break space macOS puts before "PM" in screenshot names
REFUSAL_KEYS = fl.REFUSAL_KEYS
T = fl.T

# ---------------------------------------------------------------- the photos, and the boxes set by eye at lock
# Paths relative to the main checkout. Boxes at the fit upload's size (1024 long edge, never upscaled), [x, y, w, h].
PRINTS = {
    # P1: mirror selfie, white tee, black-and-white photo print of a woman (her face ~20 px). Tuning photo.
    "P1": (f"inputs/ig/Screenshot 2026-10-12 at 2.05.18{NB}PM.png", [[260, 261, 19, 21]]),
    # P2: band-style tee, printed man in a pink suit (his face ~22 px). Tuning photo.
    "P2": (f"inputs/ig/Screenshot 2026-10-12 at 1.44.56{NB}PM.png", [[246, 305, 20, 23]]),
    # P3: white tank, Nefertiti face print (~40 px). Held out for T96s: the implementer never opens it.
    "P3": ("inputs/fashionpedia/images/test/f6890fd9ddbb8cf2d17a332eb72e0ea2.jpg", [[319, 324, 40, 41]]),
}
# P4 (held out): top and trousers covered in small portrait prints; "Which one is you?". Four clear torso faces, and
# the model herself (the pick is the candidate that overlaps her most).
P4 = ("inputs/fashionpedia/images/test/6c1cf70085fef21a41cb374e84bfd6c3.jpg",
      [[309, 344, 10, 15], [339, 345, 11, 14], [368, 343, 10, 15], [341, 394, 11, 15]], [222, 165, 228, 700])
# Not a face on her chest (a necklace pendant): reported only.
PENDANT = f"inputs/pinterest/Screenshot 2026-10-12 at 2.51.33{NB}PM.png"
# His own face where the body pose lies (must stay hidden): the subject's face core.
SUBJECTS = {
    "S1": (f"inputs/pinterest/Screenshot 2026-10-12 at 2.55.27{NB}PM.png", [190, 108, 100, 74]),   # older man, hat
    "S2": ("inputs/fashionpedia/images/test/caa7c7b751d4acf2ef5a8aaf1896d3f0.jpg", [342, 294, 66, 44]),  # profile, no hips
    "S3": ("inputs/fashionpedia/images/test/cefdf3bda4f600792ddbed990887d837.jpg", [334, 320, 69, 40]),  # profile, no hips
    "S4": ("inputs/fashionpedia/images/test/d5da50f251cc2ba7d90e5ab8251d2b94.jpg", [474, 197, 46, 55]),  # tilted face
    "S5": ("inputs/fashionpedia/images/test/f304cfe8f41748fa2e35cb7b670b4a54.jpg", [267, 194, 117, 90]),  # pose behind her
    "S6": ("inputs/fashionpedia/images/test/956bd805fafef7524b88d3629224b151.jpg", [480, 96, 98, 53]),    # profile, one hip
    "S7": ("inputs/fashionpedia/images/test/4f90696201ecfc4a4fe2ca9dfacc42c8.jpg", [295, 157, 65, 57]),   # held out
}
# A stranger at her chest height, off her outline (the man in the green cap behind her).
X1 = ("inputs/fashionpedia/images/test/82d90f72c9745665b559a423f5e4e101.jpg", [380, 292, 32, 30])
# The leak-set photos the planner's probe listed for X2… (the line gates every leak photo whose cores qualify; this
# list is reported against what the line finds).
X2_LISTED = ["053888747f", "1646a045", "1851ff9e", "948f43eb", "ad3b7f7f", "ca395e77", "f79f1d0f", "a5faa285",
             "d96606ae", "3dda1140", "742ca0de", "5252d050", "cc046b02", "98f21cbd", "ebb38e79", "6c8834c6",
             "ove4zof6W2k/f-09-17", "4hwelpjhDTM/f-04-55", "3RdxtHvsuxk/f-08-13"]
# Cores in the strangers line that the test writer judged by eye at lock not to be a face (T96's EYE_NOT_FACES rule: a
# core leaves only where it matches a listed box, IoU ≥ 0.5 at the 1024 size). Both lie on the subject herself.
T96S_EYE_NOT_FACES = {
    "inputs/fashionpedia/images/test/2ddd0fbcbeb60656e0a46efe621b5a9f.jpg": [[308.5, 338.3, 16.2, 22.0]],   # her hair
    "inputs/fashionpedia/images/test/742ca0ded538281bfd2d1f3ea331773e.jpg": [[412.3, 819.2, 12.9, 6.7]],    # fabric
}
# Dispute D4: tile "faces" the test writer judged by eye to be his hand (TESTING.md → Scope: the known gap). Grey square (2)
# leaves out the head box the sweep drew for a swept face matching a listed box (IoU ≥ 0.5 at the 1024 size), nothing else.
T96S_EYE_HAND_FACES = {
    f"inputs/ig/Screenshot 2026-10-12 at 1.44.25{NB}PM.png": [[319.3, 425.9, 33.5, 33.5]],   # his left fist with a ring
}
HOSTS = ("his phone", "mirror-fit-check-1")

# Round 3's counts on T96's lines that are red there ("not worse", TESTING.md → T96 still holds).
R3_BUILT_SMALL = {"frontal 12-19": 13, "frontal 20-31": 21, "frontal 32-64": 19,
                  "profile 12-19": 4, "profile 20-31": 14, "profile 32-64": 15}
R3_VARIANTS = {"side": 0, "eyesIn": 4, "topEyesOut": 3}
R3_MISSED_GREY = 9
T96_STILL_PASSING = ["sweep logic", "old sends purged", "same photo", "leak set", "kmeasure copies", "false refusals",
                     "second mirror panel", "no regression", "held out and regression"]

CHECKS = [
    ("logic", "print rule logic"),
    ("real-prints", "real prints sent"),
    ("pose-lies", "his face when the pose lies"),
    ("strangers", "strangers at torso height"),
    ("built-prints", "built prints"),
    ("recheck", "re-check and prints"),
    ("grey-square", "grey square on him"),
    ("not-applied", "where the rule doesn't apply"),
    ("t96", "T96 still holds"),
    ("same-photo", "same photo"),
]

DRIVER = r'''// T96s test driver (written and compiled by extraction-test/vision/print_faces_test.py; never edit by hand).
// Compiled three times: the worktree's KittedPrep/Guide/Measure with -D R3 -D T96S (the build under test), a00da29d's
// with -D R3 (T96 round 3), and 1c34082d's with no flag (main). Every command reads a JSON job list and prints one JSON
// line per job.
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
func num(_ a: Any?) -> Double? { (a as? NSNumber)?.doubleValue }
func nums(_ a: Any?) -> [Double]? { (a as? [Any])?.compactMap(num) }
func r4(_ r: CGRect) -> [Double] { [Double(r.minX), Double(r.minY), Double(r.width), Double(r.height)] }
func rect(_ a: Any?) -> CGRect? {
  guard let v = nums(a), v.count == 4 else { return nil }
  return CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
}
func point(_ a: Any?) -> CGPoint? {
  guard let v = nums(a), v.count == 2 else { return nil }
  return CGPoint(x: v[0], y: v[1])
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
func writeGray(_ m: Guide.Gray, _ path: String) {
  let provider = CGDataProvider(data: Data(m.px) as CFData)!
  let g = CGImage(width: m.w, height: m.h, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: m.w, space: CGColorSpaceCreateDeviceGray(),
                  bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue), provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)!
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, g, nil)
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
  guard let p = nums(j["pick"]), p.count == 4 else { return nil }
  return CGRect(x: p[0] * W, y: p[1] * H, width: p[2] * W, height: p[3] * H)
}
func kindOf(_ j: [String: Any]) -> Prep.Kind { Prep.Kind(rawValue: (j["kind"] as? String) ?? "fit")! }
func locateRow(_ f: Prep.Located, _ img: CGImage) -> [String: Any] {
  var row: [String: Any] = [
    "status": f.status, "hide": f.hide.map(r4), "main": f.main.map(r4) ?? NSNull(), "candidates": f.candidates.map(r4),
    "others": f.others.map(r4), "people": f.people, "pose": f.pose, "picked": f.picked ?? NSNull(),
    "joints": f.joints.mapValues { [Double($0.x), Double($0.y)] }, "coverNil": f.cover == nil, "size": [img.width, img.height],
  ]
  #if R3
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

#if R3
/// "real" | "none" | "always:x,y,w,h" | "throwAt:n" | "pb:px,py,pw,ph;bx,by,bw,bh" (sees P on every tile that holds it,
/// and B on every tile that holds it while B's pixels are unchanged from the original).
func detector(_ spec: String, orig: CGImage?, calls: UnsafeMutablePointer<Int>) -> Prep.FaceDetect {
  let parts = spec.split(separator: ":", maxSplits: 1).map(String.init)
  let name = parts[0]
  let arg = parts.count > 1 ? parts[1] : ""
  func box(_ s: Substring) -> CGRect {
    let v = s.split(separator: ",").compactMap { Double($0) }
    return CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
  }
  var fixed: CGRect?, P: CGRect?, B: CGRect?
  if name == "always" { fixed = box(Substring(arg)) }
  if name == "pb" { let s = arg.split(separator: ";"); P = box(s[0]); B = box(s[1]) }
  let throwAt = Int(arg) ?? 0
  var origB: [UInt8]?
  if let orig, let B, let c = orig.cropping(to: B) { origB = rgba(c) }
  return { image, r in
    calls.pointee += 1
    switch name {
    case "real": return try Prep.detectFaces(image, in: r)
    case "none": return []
    case "always": return [Prep.Face(box: fixed!, confidence: 0.9)]
    case "throwAt":
      if calls.pointee == throwAt { throw NSError(domain: "T96s stand-in detector", code: 7) }
      return []
    case "pb":
      var out: [Prep.Face] = []
      if r.contains(P!) { out.append(Prep.Face(box: P!, confidence: 0.9)) }
      if let B, let origB, r.contains(B), let c = image.cropping(to: B) {
        let share = unchangedShare(origB, rgba(c), w: c.width, h: c.height, CGRect(x: 0, y: 0, width: c.width, height: c.height))
        if share > 0.5 { out.append(Prep.Face(box: B, confidence: 0.9)) }
      }
      return out
    default: fatalError("unknown detector \(spec)")
    }
  }
}
/// The most textured 40×40 box in the background: outside the main box grown 10%, every region locate hides and the
/// cover, with its head box inside the image (T96's pickB).
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

#if T96S
func grayOf(_ a: Any?, W: CGFloat, H: CGFloat) -> Guide.Gray? {
  guard let j = a as? [String: Any] else { return nil }
  let w = j["w"] as! Int, h = j["h"] as! Int
  var px = [UInt8](repeating: 0, count: w * h)
  func paint(_ rs: Any?, _ v: UInt8) {
    for r in (rs as? [Any]) ?? [] {
      guard let b = rect(r) else { continue }
      let x0 = max(0, Int((b.minX * CGFloat(w) / W).rounded())), x1 = min(w, Int((b.maxX * CGFloat(w) / W).rounded()))
      let y0 = max(0, Int((b.minY * CGFloat(h) / H).rounded())), y1 = min(h, Int((b.maxY * CGFloat(h) / H).rounded()))
      guard x1 > x0, y1 > y0 else { continue }
      for y in y0..<y1 { for x in x0..<x1 { px[y * w + x] = v } }
    }
  }
  paint(j["fill"], 255)
  paint(j["empty"], 0)
  return Guide.Gray(w: w, h: h, px: px)
}
func instancesOf(_ a: Any?, W: CGFloat, H: CGFloat) -> Prep.Instances? {
  guard let j = a as? [String: Any] else { return nil }
  let w = j["w"] as! Int, h = j["h"] as! Int
  var px = [UInt8](repeating: 0, count: w * h)
  for l in (j["labels"] as? [[String: Any]]) ?? [] {
    let v = UInt8(l["label"] as! Int)
    for r in (l["rects"] as? [Any]) ?? [] {
      guard let b = rect(r) else { continue }
      let x0 = max(0, Int((b.minX * CGFloat(w) / W).rounded())), x1 = min(w, Int((b.maxX * CGFloat(w) / W).rounded()))
      let y0 = max(0, Int((b.minY * CGFloat(h) / H).rounded())), y1 = min(h, Int((b.maxY * CGFloat(h) / H).rounded()))
      guard x1 > x0, y1 > y0 else { continue }
      for y in y0..<y1 { for x in x0..<x1 { px[y * w + x] = v } }
    }
  }
  return Prep.Instances(w: w, h: h, px: px)
}
func joints(_ a: Any?) -> [String: CGPoint] {
  var out: [String: CGPoint] = [:]
  for (k, v) in (a as? [String: Any]) ?? [:] { if let p = point(v) { out[k] = p } }
  return out
}
/// A Located built by hand (the logic line): no Vision.
func handLocated(_ j: [String: Any], W: CGFloat, H: CGFloat) -> Prep.Located {
  var f = Prep.Located(status: j["status"] as! String)
  f.main = rect(j["main"])
  f.people = 1
  f.pose = "full"
  f.hide = ((j["hide"] as? [Any]) ?? []).compactMap(rect)
  f.joints = joints(j["joints"])
  f.torsoJoints = joints(j["torsoJoints"])
  f.faces = ((j["faces"] as? [Any]) ?? []).compactMap(rect)
  f.headBand = rect(j["headBand"])
  f.headPoints = ((j["headPoints"] as? [Any]) ?? []).compactMap(point)
  f.fallbackHead = rect(j["fallbackHead"])
  f.otherHeads = ((j["otherHeads"] as? [Any]) ?? []).compactMap(rect)
  f.outline = grayOf(j["mask"], W: W, H: H)
  return f
}
func zoneRow(_ z: Prep.PrintZone?) -> Any {
  guard let z else { return NSNull() }
  return ["torso": r4(z.torso), "shoulderSpan": Double(z.shoulderSpan), "head": z.head.map(r4), "headWidth": Double(z.headWidth),
          "headPoints": z.headPoints.map { [Double($0.x), Double($0.y)] }] as [String: Any]
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

case "mask":
  // [{photo, png, w}]: the person mask (Measure.personMask, accurate) w wide, as a grey PNG.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let w = j["w"] as! Int, h = max(1, Int((CGFloat(w) * CGFloat(img.height) / CGFloat(img.width)).rounded()))
      guard let m = Measure.personMask(img, w: w, h: h) else { emit(["photo": path, "error": "no mask"]); return }
      writeGray(m, j["png"] as! String)
      emit(["photo": path, "w": m.w, "h": m.h])
    }
  }

case "locate":
  // [{photo, kind?, pick? (normalized)}]: Prep.locate's result.
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

case "hostinfo":
  // [{photo, png}]: locate (fit), and the outline it uses (Measure.personMask balanced at maskW, the cover taken out)
  // written as a grey PNG, with the head band it makes (recomputed the way locate does).
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let W = CGFloat(img.width), H = CGFloat(img.height)
      let f = Prep.locate(img)
      var row = locateRow(f, img)
      row["photo"] = path
      if f.status == "ok", let main = f.main,
         let m = Measure.personMask(img, w: Prep.maskW, h: Int((CGFloat(Prep.maskW) * H / W).rounded()), quality: .balanced).map({ Prep.excluding($0, f.cover) }) {
        writeGray(m, j["png"] as! String)
        row["outline"] = [m.w, m.h]
        row["band"] = Prep.headBand(m, main: main, W: W, H: H).map(r4) ?? NSNull()
      }
      emit(row)
    }
  }

case "prep":
  // [{photo, root, kind?, pick?, detector?}]: Prep.run, the app's own path, files under root.
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      Prep.rootOverride = URL(fileURLWithPath: j["root"] as! String, isDirectory: true)
      var row: [String: Any]
      var calls = 0
      do {
        #if R3
        let spec = (j["detector"] as? String) ?? "real"
        let orig = spec.hasPrefix("pb:") ? load(path).image : nil
        let r = try withUnsafeMutablePointer(to: &calls) { c in
          try Prep.run(uri: path, kind: kindOf(j), pick: nums(j["pick"]), detect: detector(spec, orig: orig, calls: c))
        }
        #else
        let r = try Prep.run(uri: path, kind: kindOf(j), pick: nums(j["pick"]))
        #endif
        row = sanitize(r)
      } catch { row = ["error": "\(error)"] }
      row["_photo"] = path
      row["_calls"] = calls
      emit(row)
    }
  }

#if R3
case "bpick":
  // [{photo}]: the background box B the "pb" detector uses, and what today's hiding leaves of it.
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
        row["headB"] = r4(Prep.headBox(around: B))
        if let c = covered, let today = Prep.hideRegions(c, found.hide), let ctl = Prep.hideRegions(today, [Prep.headBox(around: B)]) {
          row["controlShare"] = unchangedShare(px, rgba(ctl), w: img.width, h: img.height, B)
        }
      }
      emit(row)
    }
  }
#endif

#if T96S
case "zone":
  // [{photo, kind?, pick?, boxes: [[x,y,w,h]] (working pixels)}]: locate, printZone and isPrint on each box (reports).
  for j in jobs(args[2]) {
    autoreleasepool {
      let path = j["photo"] as! String
      guard let img = load(path).image else { emit(["photo": path, "error": "unreadable"]); return }
      let W = CGFloat(img.width), H = CGFloat(img.height)
      let kind = kindOf(j)
      let f = Prep.locate(img, kind: kind, pick: pickRect(j, W, H))
      let z = Prep.printZone(f, kind: kind, W: W, H: H)
      let boxes = ((j["boxes"] as? [Any]) ?? []).compactMap(rect)
      emit(["photo": path, "status": f.status, "zone": zoneRow(z), "isPrint": boxes.map { Prep.isPrint($0, zone: z, found: f, instances: nil) },
            "faces": f.faces.map(r4), "headBand": f.headBand.map(r4) ?? NSNull(), "fallbackHead": f.fallbackHead.map(r4) ?? NSNull(),
            "headPoints": f.headPoints.map { [Double($0.x), Double($0.y)] }, "torsoJoints": f.torsoJoints.mapValues { [Double($0.x), Double($0.y)] },
            "outlineNil": f.outline == nil])
    }
  }

case "logic":
  // [{name, W, H, kind, found, instances?, boxes: {name: rect}}]: printZone and isPrint on a hand-built Located,
  // each twice (the rule must be pure), and isPrint with a nil zone.
  for j in jobs(args[2]) {
    let W = CGFloat(num(j["W"])!), H = CGFloat(num(j["H"])!)
    let kind = kindOf(j)
    let f = handLocated(j["found"] as! [String: Any], W: W, H: H)
    let inst = instancesOf(j["instances"], W: W, H: H)
    let boxes = ((j["boxes"] as? [String: Any]) ?? [:]).compactMapValues(rect)
    let z1 = Prep.printZone(f, kind: kind, W: W, H: H)
    let z2 = Prep.printZone(f, kind: kind, W: W, H: H)
    var p1: [String: Bool] = [:], p2: [String: Bool] = [:], pn: [String: Bool] = [:]
    for (k, b) in boxes {
      p1[k] = Prep.isPrint(b, zone: z1, found: f, instances: inst)
      p2[k] = Prep.isPrint(b, zone: z2, found: f, instances: inst)
      pn[k] = Prep.isPrint(b, zone: nil, found: f, instances: inst)
    }
    emit(["name": j["name"] as! String, "zone": zoneRow(z1), "zone2": zoneRow(z2), "print": p1, "print2": p2, "printNilZone": pn])
  }
#endif

default:
  print("unknown command \(args[1])")
  exit(2)
}
'''


# ---------------------------------------------------------------- small helpers
iou, overlaps, inter, grow, uri_path, rgb, resize, dedupe = fl.iou, fl.overlaps, fl.inter, fl.grow, fl.uri_path, fl.rgb, fl.resize, fl.dedupe
grey, Crash, Fail, chunks, fresh_root, files_under, no_kit, sha_file = fl.grey, fl.Crash, fl.Fail, fl.chunks, fl.fresh_root, fl.files_under, fl.no_kit, fl.sha_file


def area(r):
    return max(0.0, r[2]) * max(0.0, r[3])


def centre(r):
    return (r[0] + r[2] / 2, r[1] + r[3] / 2)


def inside(pt, r):
    return r[0] <= pt[0] <= r[0] + r[2] and r[1] <= pt[1] <= r[1] + r[3]


def headbox(f):
    """Prep.headBox(around:)."""
    w, h = f[2] * 1.6, f[3] * 1.9
    return [f[0] + f[2] / 2 - w / 2, f[1] + f[3] / 2 - h * 0.55, w, h]


def up_scale(W, H):
    """Working pixels → the 1024 upload's pixels (never upscaled)."""
    return min(1, 1024 / max(W, H))


def to_work(box, W, H):
    s = up_scale(W, H)
    return [v / s for v in box]


def denorm(r, W, H):
    return [r[0] * W, r[1] * H, r[2] * W, r[3] * H]


def same_rect(a, b, tol=0.5):
    return max(abs(x - y) for x, y in zip(a, b)) <= tol


def lower_shoulder(loc):
    j = loc.get("joints") or {}
    ys = [j[k][1] for k in ("lShoulder", "rShoulder") if k in j]
    return max(ys) if ys else None


def his_head_regions(loc):
    """main's `locate` regions for his head: its hide rects centred above his lower shoulder (TESTING.md), or, with no
    shoulder found, those overlapping his box and starting in its top 35%."""
    sh = lower_shoulder(loc)
    main = loc.get("main")
    if sh is not None:
        return [h for h in loc["hide"] if centre(h)[1] < sh]
    if not main:
        return []
    return [h for h in loc["hide"] if overlaps(h, main) and h[1] < main[1] + 0.35 * main[3]]


def his_head_any(loc):
    """His head regions by either reading: centred above his lower shoulder, or overlapping his box and starting in its
    top 35% (a pose that lies can put a shoulder above his face: S1)."""
    main = loc.get("main")
    top = [h for h in loc["hide"] if main and overlaps(h, main) and h[1] < main[1] + 0.35 * main[3]]
    return his_head_regions(loc) + [h for h in top if h not in his_head_regions(loc)]


def region_share(img, orig, r, s):
    """Unchanged share of rect r (working pixels) in img (a copy at scale s of the working image) vs orig resized."""
    c = inter([v * s for v in r], [0, 0, img.shape[1], img.shape[0]])
    if not c or c[2] < 2 or c[3] < 2:
        return None
    x0, y0, x1, y1 = int(c[0]), int(c[1]), int(math.ceil(c[0] + c[2])), int(math.ceil(c[1] + c[3]))
    return float((np.abs(grey(img[y0:y1, x0:x1]) - grey(orig[y0:y1, x0:x1])) < 12).mean())


def copies(res, kind, W, H):
    """face_leak_test.copies, with each close-up's zoomRect mapped back by rounding (run writes whole-pixel rects; floor
    after normalizing can land one pixel off, which a 10 px print can't absorb)."""
    cps, errs = fl.copies(res, kind, W, H)
    zr = res.get("zoomRects") or []
    out = []
    for k, c in enumerate(cps):
        if c[0] in ("upload", "detail", "send") or k - 2 >= len(zr):
            out.append(c)
            continue
        r = zr[k - 2]
        x0, y0 = int(round(r[0] * W)), int(round(r[1] * H))
        x1, y1 = int(round((r[0] + r[2]) * W)), int(round((r[1] + r[3]) * H))
        out.append((c[0], c[1], (x0, y0, x1 - x0, y1 - y0)))
    return out, errs


def alone(res, kind, orig, box):
    """Is `box` (working pixels) left alone in each copy that shows it? [{copy, unchanged, newGrey, grey, ok}], errors.
    Copies: the upload, the detail copy (or a scan's send copy), and every close-up whose zoomRect holds ≥ 80% of it."""
    H, W = orig.shape[:2]
    cps, errs = copies(res, kind, W, H)
    out = []
    for name, path, src in cps:
        if name not in ("upload", "detail", "send"):
            it = inter(box, src)
            if not it or area(it) < 0.8 * area(box):
                continue
        if not os.path.exists(path):
            errs.append(f"{name} copy missing")
            continue
        cp = rgb(path)
        ch, cw = cp.shape[:2]
        sx, sy = cw / src[2], ch / src[3]
        o = resize(np.ascontiguousarray(orig[src[1]:src[1] + src[3], src[0]:src[0] + src[2]]), cw, ch)
        b = [(box[0] - src[0]) * sx, (box[1] - src[1]) * sy, box[2] * sx, box[3] * sy]
        x0, y0 = max(0, math.floor(b[0])), max(0, math.floor(b[1]))
        x1, y1 = min(cw, math.ceil(b[0] + b[2])), min(ch, math.ceil(b[1] + b[3]))
        if x1 - x0 < 2 or y1 - y0 < 2:
            continue
        c, oo = cp[y0:y1, x0:x1].astype(np.int16), o[y0:y1, x0:x1].astype(np.int16)
        unch = float((np.abs(grey(c) - grey(oo)) < 12).mean())
        gc, go = np.all(np.abs(c - 128) <= 10, axis=2), np.all(np.abs(oo - 128) <= 10, axis=2)
        newg = float((gc & ~go).mean())
        out.append({"copy": name, "unchanged": round(unch, 3), "newGrey": round(newg, 3), "grey": round(float(gc.mean()), 3),
                    "ok": unch >= 0.90 and newg <= 0.02})
    return out, errs


def hidden_all(res, kind, orig, cores, names=None):
    """T96's rule on each core in each copy: (all hidden, the verdicts). As in T96, only "leak" fails ("tiny": the core
    is under 3 px where that copy cuts it)."""
    vs, errs = fl.judge(res, kind, orig, cores, names=names)
    bad = [v for v in vs if v["v"] == "leak"]
    return not bad and not errs, vs, errs


def prints_of(res):
    H, W = res.get("height"), res.get("width")
    return [denorm(p, W, H) for p in (res.get("prints") or [])] if W else []


def strip(r, root=None):
    """A result without timings, driver keys, and (when given) its root path."""
    def f(v):
        if isinstance(v, str) and root:
            return v.replace(root, "<root>")
        if isinstance(v, list):
            return [f(x) for x in v]
        if isinstance(v, dict):
            return {k: f(x) for k, x in v.items()}
        return v
    return {k: f(v) for k, v in r.items() if not k.endswith("Ms") and not k.startswith("_")}


def result_files(r, kind):
    """Every file run wrote for an ok result: (name, path)."""
    if r.get("status") != "ok":
        return []
    if kind == "items":
        return [(k, uri_path(r[k])) for k in ("sendUri", "keptUri", "thumbUri")]
    out = [(k, uri_path(r[k])) for k in ("uploadUri", "detailUri", "keptUri", "thumbUri")]
    up = Path(uri_path(r["uploadUri"])).parent
    return out + [(z, str(up / f"{r['sha256']}-{z}.jpg")) for z in r.get("zoomKinds") or []]


class Sheet:
    """Crops at 3× for the eye (images: git-ignored)."""

    def __init__(self, name):
        self.dir = OUT / name
        shutil.rmtree(self.dir, ignore_errors=True)
        self.n = 0

    def add(self, label, path, box):
        try:
            with Image.open(path) as im:
                im = im.convert("RGB")
                W, H = im.size
                pad = max(box[2], box[3], 8)
                r = (max(0, int(box[0] - pad)), max(0, int(box[1] - pad)), min(W, int(box[0] + box[2] + pad)), min(H, int(box[1] + box[3] + pad)))
                if r[2] <= r[0] or r[3] <= r[1]:
                    return
                c = im.crop(r)
                c = c.resize((c.width * 3, c.height * 3))
                self.dir.mkdir(parents=True, exist_ok=True)
                safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in label)[:60]
                c.save(self.dir / f"{self.n:03d}-{safe}.png")
                self.n += 1
        except OSError:
            pass

    def note(self):
        return f"{self.n} crops in {self.dir.relative_to(REPO)}" if self.n else "no crops"


# ---------------------------------------------------------------- the builds
def build(tmp, fresh, new_from=None):
    new_dir = Path(new_from) if new_from else REPO / IOS
    srcs = {
        "new": {f: (new_dir / f).read_text() for f in SWIFT},
        "before": {f: subprocess.check_output(["git", "-C", str(REPO), "show", f"{BEFORE_COMMIT}:{IOS}/{f}"], text=True) for f in SWIFT},
        "main": {f: subprocess.check_output(["git", "-C", str(REPO), "show", f"{MAIN_COMMIT}:{IOS}/{f}"], text=True) for f in SWIFT},
    }
    flags = {"new": ["-D", "R3", "-D", "T96S"], "before": ["-D", "R3"], "main": []}
    out = {}
    for name in ("new", "before", "main"):
        h = hashlib.sha256((DRIVER + json.dumps(srcs[name], sort_keys=True) + " ".join(flags[name])).encode()).hexdigest()[:16]
        d = Path(tempfile.gettempdir()) / f"t96s-{name}-{h}"
        exe = d / "driver"
        if fresh or not exe.exists():
            shutil.rmtree(d, ignore_errors=True)
            d.mkdir(parents=True)
            for f, s in srcs[name].items():
                (d / f).write_text(s)
            (d / "main.swift").write_text(DRIVER)
            p = subprocess.run(["xcrun", "swiftc", "-O", *flags[name], "-o", str(exe), *[str(d / f) for f in SWIFT], str(d / "main.swift")],
                               capture_output=True, text=True)
            if p.returncode != 0:
                errs = [l for l in p.stderr.splitlines() if "error:" in l][:5]
                raise Fail(f"the {name} build doesn't compile: " + " | ".join(errs))
        out[name] = fl.Driver(exe, tmp)
    return out


# ---------------------------------------------------------------- the shared context (results cached per run)
class Ctx:
    def __init__(self, args):
        self.full, self.quick = args.full, args.quick
        self.planted = args.new_from
        self.tmp = Path(tempfile.mkdtemp(prefix="t96s-"))
        d = build(self.tmp, fresh=args.full, new_from=args.new_from)
        self.new, self.before, self.main = d["new"], d["before"], d["main"]
        self.builds = d
        self._pose = None
        self.normal_rows = json.loads((fl.BASE / "normal-set.json").read_text())
        self.leak_rows = json.loads((fl.BASE / "leak-set.json").read_text())
        for r in self.normal_rows + self.leak_rows:
            r["path"] = str(KIT / r["photo"])
        self._prep, self._loc, self._truth, self._mask, self._host = {}, {}, {}, {}, {}
        self.cache_dir = self.tmp / "cache"
        self.cache_dir.mkdir()

    @property
    def pose(self):
        if self._pose is None:
            self._pose = fl.Pose()
        return self._pose

    def scratch(self):
        d = self.tmp / uuid.uuid4().hex[:10]
        d.mkdir()
        return d

    def built_dir(self):
        """Built photos live outside the temp and cache folders (run deletes a sent photo there: the camera's temporary
        original). Private, deleted at the end of the run."""
        if getattr(self, "_built", None) is None:
            self._built = Path("/private/tmp") / f"t96s-built-{uuid.uuid4().hex[:10]}"
            self._built.mkdir(mode=0o700)
        d = self._built / uuid.uuid4().hex[:8]
        d.mkdir()
        return d

    # cached driver calls -------------------------------------------------------
    def prep(self, build, photos, kind="fit", pick=None, detector=None):
        """run's result per photo on `build` (files kept under the run's cache)."""
        key = lambda p: (build, p, kind, json.dumps(pick), detector)
        todo = [p for p in dict.fromkeys(photos) if key(p) not in self._prep]
        for part in chunks(todo, 12):
            jobs = []
            for p in part:
                j = {"photo": p, "root": fresh_root(self.cache_dir), "kind": kind}
                if pick:
                    j["pick"] = pick
                if detector:
                    j["detector"] = detector
                jobs.append(j)
            rows = self.builds[build].call("prep", jobs)
            if len(rows) != len(jobs):
                raise Crash(f"driver `prep` ({build}) returned {len(rows)} rows for {len(jobs)} jobs")
            for p, j, r in zip(part, jobs, rows):
                r["_root"] = j["root"]
                self._prep[key(p)] = r
        return {p: self._prep[key(p)] for p in photos}

    def locate(self, build, photos, kind="fit", pick=None):
        key = lambda p: (build, p, kind, json.dumps(pick))
        todo = [p for p in dict.fromkeys(photos) if key(p) not in self._loc]
        for part in chunks(todo, 20):
            rows = self.builds[build].call("locate", [dict({"photo": p, "kind": kind}, **({"pick": pick} if pick else {})) for p in part])
            for p, r in zip(part, rows):
                self._loc[key(p)] = r
        return {p: self._loc[key(p)] for p in photos}

    def truth(self, photos, d=None, grids=(1, 2, 3, 4), mp=True):
        """main's decode (PNG) and dense hunt, and MediaPipe heads (face_leak_test's), per photo."""
        key = lambda p: (p, tuple(grids), mp)
        todo = [p for p in dict.fromkeys(photos) if key(p) not in self._truth]
        for part in chunks(todo, 10):
            dd = self.cache_dir
            jobs = [{"photo": p, "png": str(dd / f"o-{uuid.uuid4().hex[:10]}.png"), "grids": list(grids)} for p in part]
            rows = self.main.call("truth", jobs)
            for p, j, r in zip(part, jobs, rows):
                if "error" in r:
                    self._truth[key(p)] = None
                    continue
                r["png"] = j["png"]
                r["hunt"] = [f[:4] for f in sorted(r["faces"], key=lambda f: -f[4]) if f[4] >= 0.5]
                r["whole"] = [f[:4] for f in r["faces"] if f[5] == 1]
                r["heads"] = self.pose.heads(rgb(r["png"])) if mp else []
                self._truth[key(p)] = r
        return {p: self._truth[key(p)] for p in photos}

    def masks(self, photos, w=384):
        """main's person mask (Measure.personMask, accurate) per photo, as a PNG path (None when there's none)."""
        todo = [p for p in dict.fromkeys(photos) if (p, w) not in self._mask]
        for part in chunks(todo, 20):
            jobs = [{"photo": p, "png": str(self.cache_dir / f"m-{uuid.uuid4().hex[:10]}.png"), "w": w} for p in part]
            for p, j, r in zip(part, jobs, self.main.call("mask", jobs)):
                self._mask[(p, w)] = j["png"] if "error" not in r else None
        return {p: self._mask[(p, w)] for p in photos}

    def hostinfo(self, photos):
        todo = [p for p in dict.fromkeys(photos) if p not in self._host]
        for part in chunks(todo, 20):
            jobs = [{"photo": p, "png": str(self.cache_dir / f"h-{uuid.uuid4().hex[:10]}.png")} for p in part]
            for p, j, r in zip(part, jobs, self.main.call("hostinfo", jobs)):
                if r.get("outline"):
                    r["png"] = j["png"]
                self._host[p] = r
        return {p: self._host[p] for p in photos}


def K(rel):
    return str(KIT / rel)


# ---------------------------------------------------------------- F2.2 · print rule logic (hand-built, no Vision)
LW, LH = 1000, 2000
HIM = [300, 200, 400, 1700]
TORSO = {"neck": [500, 520], "lShoulder": [380, 540], "rShoulder": [620, 540], "lHip": [420, 1100], "rHip": [580, 1100]}
BAND = [400, 200, 200, 300]
HEADPTS = [[470, 380], [530, 380], [500, 420]]
OK_BOX = [450, 700, 80, 80]
ALL_BOXES = {
    "ok": OK_BOX, "aboveShoulder": [450, 500, 80, 80], "pastHem": [450, 1150, 80, 80], "centreOut": [300, 700, 60, 60],
    "tooWide": [380, 700, 200, 200], "onShoulderLine": [450, 540, 80, 80], "onHemLine": [450, 1104, 80, 80],
    "pxAboveShoulder": [450, 539, 80, 80], "pxPastHem": [450, 1105, 80, 80], "under560": [450, 560, 80, 80],
}


def joint_box(pts, main):
    """locate's head-joint box (≥ 2 head points), else None."""
    if len(pts) < 2:
        return None
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    side = max(max(xs) - min(xs), max(ys) - min(ys), main[2] * 0.18)
    return headbox([(min(xs) + max(xs)) / 2 - side / 2, (min(ys) + max(ys)) / 2 - side / 2, side, side])


def shoulder_box(t):
    a, b = t["lShoulder"], t["rShoulder"]
    span, top = abs(a[0] - b[0]), min(a[1], b[1])
    return [(a[0] + b[0]) / 2 - span * 0.55, top - span * 1.25, span * 1.1, span * 1.25]


def hand_found(**kw):
    """A Located as locate would fill it for him on the 1000×2000 canvas, with any field replaced."""
    f = {"status": "ok", "main": HIM, "torso": dict(TORSO), "band": BAND, "points": [list(p) for p in HEADPTS], "faces": [],
         "otherHeads": [], "mask": {"w": 1000, "h": 2000, "fill": [HIM], "empty": []}, "fallback": "auto"}
    f.update(kw)
    t = f["torso"]
    fb = f["fallback"]
    if fb == "auto":
        fb = joint_box(f["points"], f["main"]) or (shoulder_box(t) if "lShoulder" in t and "rShoulder" in t else None)
    his_face = [x for x in f["faces"] if overlaps(x, f["main"])]
    hide = [headbox(x) for x in f["faces"]] + ([f["band"]] if f["band"] else []) + ([fb] if fb and not his_face else [])
    joints = dict(t)
    return {"status": f["status"], "main": f["main"], "hide": hide, "joints": joints, "torsoJoints": t, "faces": f["faces"],
            "headBand": f["band"], "headPoints": f["points"], "fallbackHead": fb, "otherHeads": f["otherHeads"], "mask": f["mask"]}


def logic_cases():
    """(name, kind, found, instances, boxes, zone expected?, {box: expected isPrint})."""
    C = []

    def add(name, found, expect, zone=True, kind="fit", inst=None, boxes=None):
        bx = dict(ALL_BOXES)
        bx.update(boxes or {})
        C.append({"name": name, "kind": kind, "found": found, "instances": inst, "boxes": bx, "zone": zone, "expect": expect})

    no = {k: False for k in ALL_BOXES}
    # (1)–(3): the base case, and each rule turning one box away
    add("base", hand_found(), {"ok": True, "aboveShoulder": False, "pastHem": False, "centreOut": False, "tooWide": False,
                               "onShoulderLine": True, "onHemLine": True, "pxAboveShoulder": False, "pxPastHem": False,
                               "under560": True})
    add("band reaches 580 (rule 5: inside his head region)", hand_found(band=[400, 200, 200, 380]), {"under560": False, "ok": True})
    add("band ends at the shoulder line (rule 5: the 25% gap)", hand_found(band=[400, 200, 200, 340]),
        {"gap550": False, "gap566": True}, boxes={"gap550": [450, 550, 80, 80], "gap566": [450, 566, 80, 80]})
    # (his left shoulder is off the outline here too, so a nil zone is as good as a "no")
    add("mask emptied left of x 500 (rule 6)", hand_found(mask={"w": 1000, "h": 2000, "fill": [HIM], "empty": [[0, 0, 500, 2000]]}), {"ok": False}, zone=None)
    add("mask emptied left of x 500 below the shoulders only (rule 6 alone)",
        hand_found(mask={"w": 1000, "h": 2000, "fill": [HIM], "empty": [[0, 600, 500, 400]]}), {"ok": False})
    add("mask emptied left of x 454 below the shoulders (95% on: rule 6 passes)",
        hand_found(mask={"w": 1000, "h": 2000, "fill": [HIM], "empty": [[0, 600, 454, 400]]}), {"ok": True})
    near = {f"y{y}": [450, y, 80, 80] for y in range(610, 900, 40)}
    add("mask emptied left of x 456 below the shoulders (about 92% on: rule 6 passes, every time)",
        hand_found(mask={"w": 1000, "h": 2000, "fill": [HIM], "empty": [[0, 600, 456, 400]]}), {k: True for k in near}, boxes=near)
    add("another head over the box (rule 7)", hand_found(otherHeads=[[440, 690, 100, 100]]), {"ok": False, "clear900": True},
        boxes={"clear900": [450, 900, 80, 80]})
    add("a head point inside the box (rule 5)", hand_found(points=[list(p) for p in HEADPTS] + [[490, 740]]), {"ok": False})
    add("a head point inside the box grown 1.5× (rule 5)", hand_found(points=[list(p) for p in HEADPTS] + [[435, 690]]), {"ok": False})
    add("tilted shoulders: the lower one is the line (rule 4)",
        hand_found(torso=dict(TORSO, lShoulder=[380, 520], rShoulder=[620, 560])), {"t545": False, "t565": True},
        boxes={"t545": [450, 545, 80, 80], "t565": [450, 565, 80, 80]})
    inst_his = {"w": 250, "h": 500, "labels": [{"label": 1, "rects": [HIM]}]}
    inst_two = {"w": 250, "h": 500, "labels": [{"label": 1, "rects": [HIM]}, {"label": 2, "rects": [[450, 700, 40, 80]]}]}
    add("instance mask: only his label (rule 7 passes)", hand_found(), {"ok": True}, inst=inst_his)
    add("instance mask: another label over half the box (rule 7)", hand_found(), {"ok": False}, inst=inst_two)
    # edges: a head band only (the phone over his face); a face above his shoulders as his only head region
    add("head band only (no head points)", hand_found(points=[]), {"ok": True})
    add("a face above his shoulders as his only head region", hand_found(band=None, points=[], faces=[[460, 330, 80, 80]]), {"ok": True})
    add("hips 280 below the shoulders (≥ 15% of his box)", hand_found(torso=dict(TORSO, lHip=[420, 820], rHip=[580, 820])), {"ok": True})
    add("shoulder span 60 (≥ 10% of his box)", hand_found(torso=dict(TORSO, lShoulder=[470, 540], rShoulder=[530, 540])),
        {"narrow": True, "ok": False}, boxes={"narrow": [480, 700, 40, 40]})
    # (4): no zone
    add("kind snap", hand_found(), no, zone=False, kind="snap")
    add("kind items", hand_found(), no, zone=False, kind="items")
    for st in ("couldNotFrame", "multiplePeople", "noPerson"):
        add(f"status {st}", hand_found(status=st), no, zone=False)
    for j in ("neck", "lShoulder", "rShoulder", "lHip", "rHip"):
        t = dict(TORSO)
        del t[j]
        add(f"no {j}", hand_found(torso=t), no, zone=False)
    add("a shoulder outside his box (on the outline)",
        hand_found(torso=dict(TORSO, lShoulder=[290, 540]), mask={"w": 1000, "h": 2000, "fill": [[250, 200, 450, 1700]], "empty": []}), no, zone=False)
    add("hips 250 below the shoulders (under 15% of his box)", hand_found(torso=dict(TORSO, lHip=[420, 790], rHip=[580, 790])), no, zone=False)
    add("shoulder span 35 (under 10% of his box)", hand_found(torso=dict(TORSO, lShoulder=[482, 540], rShoulder=[517, 540])),
        dict(no, narrow=False), zone=False, boxes={"narrow": [480, 700, 30, 30]})
    add("no outline", hand_found(mask=None), no, zone=False)
    add("no head region (no band, points, faces or fallback)", hand_found(band=None, points=[], fallback=None), no, zone=False)
    add("no head region (only the shoulder box locate would draw)", hand_found(band=None, points=[]), no, zone=False)
    add("no head region (only a face below his shoulders: the print itself)", hand_found(band=None, points=[], faces=[OK_BOX]), no, zone=False)
    return C


def check_logic(ctx):
    fails, rep = [], {}
    cases = logic_cases()
    jobs = [{"name": c["name"], "W": LW, "H": LH, "kind": c["kind"], "found": c["found"], "instances": c["instances"], "boxes": c["boxes"]}
            for c in cases]
    try:
        a = ctx.new.call("logic", jobs)
        b = ctx.new.call("logic", jobs)
    except Crash as e:
        return [f"(1–6) {e}"], {}
    rows = {}
    for c, r, r2 in zip(cases, a, b):
        n = c["name"]
        z = r["zone"]
        rows[n] = {"zone": z, "print": r["print"]}
        # (6) pure: the same found twice, in one process and in two, gives equal zones and answers
        if r["zone"] != r["zone2"] or r["print"] != r["print2"] or r != r2:
            fails.append(f"(6) {n}: the same found gave different zones or answers")
        if c["zone"] is True and z is None:
            fails.append(f"(1/edge) {n}: printZone is nil, expected a zone")
        if c["zone"] is False and z is not None:
            fails.append(f"(4) {n}: printZone {z['torso']}, expected nil")
        for k, want in c["expect"].items():
            got = r["print"].get(k)
            if got is not want:
                fails.append(f"({'5' if not c['zone'] else '2/3'}) {n}: isPrint({c['boxes'][k]}) {got}, expected {want}")
        # (5) a nil zone: never a print
        bad = [k for k, v in r["printNilZone"].items() if v is not False]
        if bad:
            fails.append(f"(5) {n}: isPrint with a nil zone true for {bad}")
        # every box not named in `expect` that the zone-less cases ask about is false (covered by `no`)
    base = rows.get("base", {}).get("zone")
    if base:
        want = [380, 540, 240, 644]
        if not same_rect(base["torso"], want, 1):
            fails.append(f"(1) torso {base['torso']}, expected x 380…620, y 540…1184 ({want}) ±1 px")
        if abs(base["shoulderSpan"] - 240) > 1e-6:
            fails.append(f"(1) shoulderSpan {base['shoulderSpan']}, expected 240")
    tilt = rows.get("tilted shoulders: the lower one is the line (rule 4)", {}).get("zone")
    if tilt and abs(tilt["torso"][1] - 560) > 1:
        fails.append(f"(1) tilted shoulders: torso starts at y {tilt['torso'][1]}, expected 560 (the lower shoulder)")
    rep["cases"] = rows
    return fails, rep


# ---------------------------------------------------------------- shared: the real photos through three builds
def run_three(ctx, photos, kind="fit", pick=None):
    return {b: ctx.prep(b, photos, kind=kind, pick=pick) for b in ("new", "before", "main")}


def head_hidden_as_main(loc_main, res_new, res_main, orig, regions=None, orig_main=None):
    """Each of main's regions (his head by default): unchanged share in the new upload and detail ≤ main's + 0.05.
    orig_main: main's photo when it isn't the same one (a built photo measured against main on the photo without it)."""
    H, W = orig.shape[:2]
    om = orig if orig_main is None else orig_main
    regs = his_head_regions(loc_main) if regions is None else regions
    out, bad = [], []
    if res_new.get("status") != "ok" or res_main.get("status") != "ok":
        return out, bad
    for key in ("uploadUri", "detailUri"):
        a, b = rgb(uri_path(res_new[key])), rgb(uri_path(res_main[key]))
        s = a.shape[1] / W
        o = resize(orig, a.shape[1], a.shape[0])
        o2 = o if orig_main is None else resize(om, b.shape[1], b.shape[0])
        for r in regs:
            sn, sm = region_share(a, o, r, s), region_share(b, o2, r, s)
            if sn is None or sm is None:
                continue
            out.append({"copy": key[:-3], "region": [round(v, 1) for v in r], "new": round(sn, 3), "main": round(sm, 3)})
            if sn > sm + 0.05:
                bad.append(out[-1])
    return out, bad


def p4_pick(ctx):
    """P4's pick: the candidate (main's locate) that overlaps the model most; None when locate doesn't ask."""
    p = K(P4[0])
    loc = ctx.locate("main", [p])[p]
    if loc["status"] != "multiplePeople":
        return loc, None
    W, H = loc["size"]
    model = to_work(P4[2], W, H)
    c = max(loc["candidates"], key=lambda c: iou(c, model))
    return loc, [c[0] / W, c[1] / H, c[2] / W, c[3] / H]


# ---------------------------------------------------------------- F2.2 · real prints sent
def check_real_prints(ctx):
    fails, rep = [], {}
    sheet = Sheet("real-prints")
    photos = {n: K(v[0]) for n, v in PRINTS.items()}
    try:
        res = run_three(ctx, list(photos.values()))
        tr = ctx.truth(list(photos.values()), mp=False, grids=(1,))
        locm = ctx.locate("main", list(photos.values()))
    except Crash as e:
        return [str(e)], {}
    cases = [(n, photos[n], PRINTS[n][1], None) for n in PRINTS]
    # P4 behind the pick (gated only when the round-3 build sends that pick)
    p4p = K(P4[0])
    try:
        loc4, pick4 = p4_pick(ctx)
        r4 = run_three(ctx, [p4p], pick=pick4)
        tr.update(ctx.truth([p4p], mp=False, grids=(1,)))
        locm[p4p] = ctx.locate("main", [p4p], pick=pick4)[p4p]
        res = {b: dict(res[b], **{p4p: r4[b][p4p]}) for b in res}
        p4_gated = r4["before"][p4p].get("status") == "ok"
        cases.append(("P4", p4p, P4[1], pick4))
        rep["P4 pick"] = {"locate": loc4["status"], "pick": pick4, "before": r4["before"][p4p].get("status"), "gated": p4_gated}
    except Crash as e:
        rep["P4 pick"] = {"error": str(e)}
        p4_gated = False
    for name, p, boxes, pick in cases:
        gated = name != "P4" or p4_gated
        t = tr[p]
        orig = rgb(t["png"])
        H, W = orig.shape[:2]
        rn, rb, rm = res["new"][p], res["before"][p], res["main"][p]
        rec = {"photo": no_kit(p), "status": {"new": rn.get("status"), "before": rb.get("status"), "main": rm.get("status")},
               "reason": rn.get("reason"), "printsKept": rn.get("printsKept"), "gated": gated, "boxes": []}
        f = []
        if rn.get("status") != "ok" or "reason" in rn:
            f.append(f"{name}: status {rn.get('status')}/{rn.get('reason')}, expected ok with no reason")
        work = [to_work(b, W, H) for b in boxes]
        before_changed = []
        for k, b in enumerate(work):
            br = {"box": boxes[k]}
            if rb.get("status") == "ok":
                br["before"], _ = alone(rb, "fit", orig, b)
                if not all(x["ok"] for x in br["before"]):
                    before_changed.append(k)
            if rn.get("status") == "ok":
                al, errs = alone(rn, "fit", orig, b)
                br["new"] = al
                f += [f"{name}: {e}" for e in errs]
                if not al or not all(x["ok"] for x in al):
                    if name != "P4" or k in before_changed:
                        miss = [x for x in al if not x["ok"]] or [{"copy": "none measured"}]
                        f.append(f"{name}: print {k + 1} not left alone ({miss[0]['copy']}: unchanged {miss[0].get('unchanged')}, "
                                 f"new grey {miss[0].get('newGrey')}; ≥ 0.90 and ≤ 0.02)")
                        for x in al:
                            if not x["ok"]:
                                sheet.add(f"{name}-{k}-{x['copy']}", uri_path(rn["uploadUri"]) if x["copy"] == "upload" else uri_path(rn["detailUri"]),
                                          [v * (up_scale(W, H) if x["copy"] == "upload" else 1) for v in b])
            # whole-photo: did main's locate blur it?
            whole = [w for w in t["whole"] if iou(w, b) >= 0.2 or (overlaps(w, b) and inside(centre(b), w))]
            br["mainWholePhotoFace"] = whole
            br["inMainHide"] = any(any(same_rect(headbox(w), h, 0.5) for h in locm[p]["hide"]) for w in whole)
            rec["boxes"].append(br)
        if rn.get("status") == "ok":
            pr = prints_of(rn)
            rec["prints"] = [[round(v, 1) for v in x] for x in pr]
            need = range(len(work)) if name != "P4" else before_changed
            if "printsKept" not in rn or "prints" not in rn:
                f.append(f"{name}: run's result has no printsKept/prints keys")
            elif need and rn["printsKept"] < 1:
                f.append(f"{name}: printsKept {rn['printsKept']}, expected ≥ 1")
            for k in need:
                s = up_scale(W, H)
                if not any(iou([v * s for v in x], boxes[k]) >= 0.3 for x in pr):
                    f.append(f"{name}: no prints rect overlaps print {k + 1}'s eye box (IoU ≥ 0.3 at 1024)")
            hh, bad = head_hidden_as_main(locm[p], rn, rm, orig)
            rec["head"] = hh
            if bad:
                f.append(f"{name}: his head less hidden than on main ({bad[0]['copy']} region {bad[0]['region']}: unchanged {bad[0]['new']} vs main {bad[0]['main']} + 0.05)")
        rec["fails"] = f
        rep[name] = rec
        if gated:
            fails += f
    # reported only: a necklace pendant the tile pass calls a face
    try:
        pp = K(PENDANT)
        r = ctx.prep("new", [pp])[pp]
        rep["pendant"] = {k: r.get(k) for k in ("status", "reason", "printsKept", "prints", "sweptFaces")}
    except Crash as e:
        rep["pendant"] = {"error": str(e)}
    rep["P3 in main's found.hide"] = rep.get("P3", {}).get("boxes", [{}])[0].get("inMainHide")
    rep["sheet"] = sheet.note()
    return fails, rep


# ---------------------------------------------------------------- F2.2 · his face when the pose lies
def check_pose_lies(ctx):
    fails, rep = [], {}
    sheet = Sheet("pose-lies")
    photos = {n: K(v[0]) for n, v in SUBJECTS.items()}
    try:
        res = run_three(ctx, list(photos.values()))
        tr = ctx.truth(list(photos.values()), mp=False, grids=(1,))
        locm = ctx.locate("main", list(photos.values()))
    except Crash as e:
        return [str(e)], {}
    for name, p in photos.items():
        orig = rgb(tr[p]["png"])
        H, W = orig.shape[:2]
        face = to_work(SUBJECTS[name][1], W, H)
        rn, rb, rm = res["new"][p], res["before"][p], res["main"][p]
        rec = {"photo": no_kit(p), "status": {b: f"{res[b][p].get('status')}/{res[b][p].get('reason')}" for b in res},
               "joints": sorted(locm[p].get("joints", {}))}
        if (rn.get("status"), rn.get("reason")) != (rb.get("status"), rb.get("reason")):
            fails.append(f"{name}: status {rn.get('status')}/{rn.get('reason')}, the round-3 build's {rb.get('status')}/{rb.get('reason')}")
        if rn.get("status") == "ok":
            pr = prints_of(rn)
            rec["prints"] = [[round(v, 1) for v in x] for x in pr]
            if any(overlaps(x, face) for x in pr):
                fails.append(f"{name}: a prints rect overlaps the subject's own face")
            ok, vs, errs = hidden_all(rn, "fit", orig, [face], names={"upload", "detail"})
            rec["face"] = [{k: v.get(k) for k in ("copy", "v", "unchanged", "inside", "grey")} for v in vs]
            if not ok:
                bad = [v for v in vs if v["v"] == "leak"]
                fails.append(f"{name}: the subject's own face isn't hidden ({bad[0]['copy']}: {bad[0]['v']}, unchanged {bad[0].get('unchanged')})"
                             if bad else f"{name}: {errs}")
                for v in bad:
                    sheet.add(f"{name}-{v['copy']}", v["path"], v["box"])
            hh, bad = head_hidden_as_main(locm[p], rn, rm, orig, regions=locm[p]["hide"])
            rec["regions"] = hh
            if bad:
                fails.append(f"{name}: a region main hides is less hidden ({bad[0]['copy']} {bad[0]['region']}: {bad[0]['new']} vs main {bad[0]['main']} + 0.05)")
        rep[name] = rec
    # Rule 2 on its own: none of these poses is whole and upright (one shoulder, no hips, one hip, shoulders outside her
    # box), so printZone is nil on every one (the head band also covers most of these faces, so the lines above alone
    # can't tell a build that skips rule 2).
    try:
        z = ctx.new.call("zone", [{"photo": p} for p in photos.values()])
        for (name, p), r in zip(photos.items(), z):
            rep[name]["zone"] = r.get("zone")
            if r.get("zone") is not None:
                fails.append(f"{name}: printZone {r['zone'].get('torso')}, expected nil (the pose isn't whole and upright: {rep[name]['joints']})")
    except Crash as e:
        fails.append(f"(rule 2) {e}")
    rep["sheet"] = sheet.note()
    return fails, rep


# ---------------------------------------------------------------- the leak set (shared by two lines)
def ensure_leak(ctx):
    if getattr(ctx, "leak", None) is not None:
        return ctx.leak
    photos = [r["path"] for r in ctx.leak_rows]
    tr = ctx.truth(photos)
    locm = ctx.locate("main", photos)
    locb = ctx.locate("before", photos)
    locn = ctx.locate("new", photos)
    res = {b: ctx.prep(b, photos) for b in ("new", "before")}
    leak = {}
    for row in ctx.leak_rows:
        p, t = row["path"], tr[row["path"]]
        orig = rgb(t["png"])
        H, W = orig.shape[:2]
        s = W / row["size"][0]
        cores, _ = fl.eye_drop(p, dedupe([[v * s for v in b[:4]] for b in row["faces"]] + t["hunt"] + t["heads"], 0.5), W, H)
        leak[p] = {"row": row, "png": t["png"], "cores": cores, "locm": locm[p], "locb": locb[p], "locn": locn[p],
                   "new": res["new"][p], "before": res["before"][p]}
    ctx.leak = leak
    return leak


# ---------------------------------------------------------------- F2.2 · strangers at torso height
def check_strangers(ctx):
    fails, rep = [], {"photos": []}
    sheet = Sheet("strangers")
    try:
        leak = ensure_leak(ctx)
        x1 = K(X1[0])
        r1 = {b: ctx.prep(b, [x1])[x1] for b in ("new", "before")}
        t1 = ctx.truth([x1], mp=False, grids=(1,))[x1]
    except Crash as e:
        return [str(e)], {}
    items = []
    o1 = rgb(t1["png"])
    items.append(("X1", x1, o1, [to_work(X1[1], o1.shape[1], o1.shape[0])], r1["new"], r1["before"]))
    found_listed = set()
    for p, L in leak.items():
        loc = L["locm"]
        sh = lower_shoulder(loc)
        if loc["status"] != "ok" or not loc["main"] or sh is None:
            continue
        W, H = loc["size"]
        u = up_scale(W, H)
        cores = [c for c in L["cores"] if inside(centre(c), loc["main"]) and c[1] >= sh
                 and not any(iou([v * u for v in c], e) >= 0.5 for e in T96S_EYE_NOT_FACES.get(no_kit(p), []))]
        if not cores:
            continue
        items.append(("X2", p, rgb(L["png"]), cores, L["new"], L["before"]))
        for x in X2_LISTED:
            if x in p:
                found_listed.add(x)
    for tag, p, orig, cores, rn, rb in items:
        rec = {"photo": no_kit(p), "tag": tag, "cores": [[round(v, 1) for v in c] for c in cores],
               "new": f"{rn.get('status')}/{rn.get('reason')}", "before": f"{rb.get('status')}/{rb.get('reason')}"}
        lab = f"{tag} {Path(p).stem[:12]}"
        if (rn.get("status"), rn.get("reason")) != (rb.get("status"), rb.get("reason")):
            fails.append(f"{lab}: status {rec['new']}, the round-3 build's {rec['before']}")
        if rn.get("status") == "ok":
            ok, vs, errs = hidden_all(rn, "fit", orig, cores)
            bad = [v for v in vs if v["v"] == "leak"]
            rec["notHidden"] = [{k: v.get(k) for k in ("core", "copy", "v", "unchanged", "inside")} for v in bad]
            if bad:
                fails.append(f"{lab}: {len(bad)} stranger face(s) not hidden (first core {bad[0]['core']} in the {bad[0]['copy']}: "
                             f"{bad[0]['v']}, unchanged {bad[0].get('unchanged')})")
                for v in bad[:3]:
                    sheet.add(f"{tag}-{Path(p).stem[:10]}-{v['copy']}", v["path"], v["box"])
            if errs:
                fails.append(f"{lab}: {errs[0]}")
            pr = prints_of(rn)
            if any(overlaps(x, c) for x in pr for c in cores):
                fails.append(f"{lab}: a prints rect overlaps a stranger's face")
            if rb.get("status") == "ok":
                okb, vb, _ = hidden_all(rb, "fit", orig, cores)
                rec["beforeHidesAll"] = okb
        rep["photos"].append(rec)
    rep["X2 photos gated"] = sum(1 for i in items if i[0] == "X2")
    rep["listed X2 not qualifying here"] = sorted(set(X2_LISTED) - found_listed)
    rep["sheet"] = sheet.note()
    if rep["X2 photos gated"] < 10:
        fails.append(f"(setup) only {rep['X2 photos gated']} leak-set photos have a face core in the subject's box below her shoulders")
    return fails, rep


# ---------------------------------------------------------------- built photos: the pool, the hosts, the pastes
def ensure_pool(ctx, need):
    """Frontal faces from the T96 pool (Fashionpedia index % 8 = 2), face_leak_test's frontal rule, in file order, until
    `need` are found. Each: its 2.2× head square and the face core in it."""
    if getattr(ctx, "pool", None) is not None and len(ctx.pool) >= need:
        return ctx.pool
    fs = sorted(os.listdir(fl.FP))
    photos = [str(fl.FP / f) for i, f in enumerate(fs) if i % 8 == 2]
    pool = []
    for part in chunks(photos, 20):
        tr = ctx.truth(part, grids=(1, 2), mp=False)
        for p in part:
            t = tr[p]
            if not t:
                continue
            arr = rgb(t["png"])
            H, W = arr.shape[:2]
            poses = ctx.pose.poses(arr)
            noses = [q[0] for q in poses if q[0][2] >= 0.5]
            vis = [f[:4] for f in t["faces"] if f[4] >= 0.5]
            for q in poses:
                v = [x[2] for x in q]
                if not (v[0] >= 0.5 and v[2] >= 0.8 and v[5] >= 0.8):
                    continue
                core = fl.core_of([q[i] for i in range(11) if q[i][2] >= 0.5])
                if not any(overlaps(grow(core, 0.5), f) and core[0] - core[2] < f[0] + f[2] / 2 < core[0] + 2 * core[2] for f in vis):
                    continue
                if core[3] < 28 or Path(p).name in fl.NOT_FACES or any(iou(core, b) >= 0.5 for b in fl.NOT_FACE_BOXES.get(Path(p).name, [])):
                    continue
                side = 2.2 * max(core[2], core[3])
                sq = [core[0] + core[2] / 2 - side / 2, core[1] + core[3] / 2 - side * 0.62, side, side]
                if sq[0] < 0 or sq[1] < 0 or sq[0] + side > W or sq[1] + side > H:
                    continue
                if sum(1 for n in noses if sq[0] <= n[0] <= sq[0] + side and sq[1] <= n[1] <= sq[1] + side) > 1:
                    continue
                x0, y0 = int(sq[0]), int(sq[1])
                pool.append({"photo": Path(p).name, "head": arr[y0:y0 + int(side), x0:x0 + int(side)].copy(),
                             "core": [core[0] - x0, core[1] - y0, core[2], core[3]]})
        if len(pool) >= need:
            break
    ctx.pool = pool
    return pool


def print_patch(src, core_h_work, side_share=1.6):
    """A hard-edged square print: the face with side_share × its core around it, scaled so the core is core_h_work tall.
    Returns (patch array, the core inside it)."""
    head, c = src["head"], src["core"]
    m = max(c[2], c[3])
    side = side_share * m
    cx, cy = c[0] + c[2] / 2, c[1] + c[3] / 2
    x0, y0 = max(0, int(round(cx - side / 2))), max(0, int(round(cy - side / 2)))
    x1, y1 = min(head.shape[1], int(round(cx + side / 2))), min(head.shape[0], int(round(cy + side / 2)))
    crop = head[y0:y1, x0:x1]
    f = core_h_work / c[3]
    pw, ph = max(4, int(round(crop.shape[1] * f))), max(4, int(round(crop.shape[0] * f)))
    patch = resize(np.ascontiguousarray(crop), pw, ph)
    return patch, [(c[0] - x0) * f, (c[1] - y0) * f, c[2] * f, c[3] * f]


def real_print_sources(ctx):
    """The real print crops (P1–P3) as pool-like entries: the eye box is the core."""
    out = []
    try:
        tr = ctx.truth([K(v[0]) for v in PRINTS.values()], mp=False, grids=(1,))
    except Crash:
        return out
    for n, (rel, boxes) in PRINTS.items():
        t = tr[K(rel)]
        arr = rgb(t["png"])
        H, W = arr.shape[:2]
        b = to_work(boxes[0], W, H)
        side = 2.2 * max(b[2], b[3])
        x0, y0 = int(max(0, b[0] + b[2] / 2 - side / 2)), int(max(0, b[1] + b[3] / 2 - side / 2))
        head = arr[y0:min(H, int(y0 + side)), x0:min(W, int(x0 + side))].copy()
        out.append({"photo": n, "head": head, "core": [b[0] - x0, b[1] - y0, b[2], b[3]]})
    return out


def ensure_hosts(ctx, need):
    """His phone's sent photos and the mirror set where main's locate gives neck, both shoulders, both hips and his head
    band, main and the new build send the photo, and today's copy hides his own face (face_leak_test.host_info)."""
    if getattr(ctx, "hosts", None) is not None and len(ctx.hosts) >= need:
        return ctx.hosts
    rows = [r for r in ctx.normal_rows if r["before"] == "ok" and r["source"] in HOSTS]
    random.Random(SEED).shuffle(rows)
    hosts = getattr(ctx, "hosts", None) or []
    done = getattr(ctx, "_host_i", 0)
    while len(hosts) < need and done < len(rows):
        part = rows[done:done + 10]
        done += 10
        info = ctx.hostinfo([r["path"] for r in part])
        ok_rows = []
        for r in part:
            h = info[r["path"]]
            j = h.get("joints") or {}
            if h.get("status") == "ok" and h.get("band") and all(k in j for k in ("neck", "lShoulder", "rShoulder", "lHip", "rHip")):
                ok_rows.append(r)
        if not ok_rows:
            continue
        hi = fl.host_info(ctx, ok_rows, ctx.scratch())
        newr = ctx.prep("new", [h["photo"] for h in hi])
        for h in hi:
            if newr[h["photo"]].get("status") != "ok":
                continue
            x = info[h["photo"]]
            h.update({"joints": x["joints"], "band": x["band"], "outline": x["png"], "size": x["size"], "locm": x,
                      "headRegions": his_head_regions(x)})
            hosts.append(h)
    ctx.hosts, ctx._host_i = hosts, done
    return hosts


def outline_arr(h):
    """main's outline (the one locate uses) at the working size, as booleans."""
    W, H = h["size"]
    m = Image.open(h["outline"]).convert("L").resize((W, H), Image.NEAREST)
    return np.asarray(m) > 127


def on_mask(m, r, share=0.999):
    x0, y0, x1, y1 = int(math.floor(r[0])), int(math.floor(r[1])), int(math.ceil(r[0] + r[2])), int(math.ceil(r[1] + r[3]))
    if x0 < 0 or y0 < 0 or x1 > m.shape[1] or y1 > m.shape[0]:
        return False
    return float(m[y0:y1, x0:x1].mean()) >= share


def place_chest(h, m, rng, pw, ph, count=1):
    """(a): squares pw×ph between the shoulders, top ≥ 15% of shoulder→hip below the lower shoulder, bottom above the
    hip line, wholly on his outline, clear of his head regions grown by 25% of their width, each no wider than 0.75 of his
    shoulder span (the face box the detector draws inside must stay under rule 4's 0.8). None when nothing fits."""
    j = h["joints"]
    ls, rs = j["lShoulder"], j["rShoulder"]
    if pw > 0.75 * abs(ls[0] - rs[0]):
        return None
    sh = max(ls[1], rs[1])
    hip = min(j["lHip"][1], j["rHip"][1])
    x_lo, x_hi = min(ls[0], rs[0]), max(ls[0], rs[0])
    top_min = sh + 0.15 * (hip - sh)
    heads = [[r[0] - 0.25 * r[2], r[1] - 0.25 * r[2], r[2] * 1.5, r[3] + 0.5 * r[2]] for r in h["headRegions"]]
    total = pw * count + 8 * (count - 1)
    for _ in range(200):
        cx = rng.uniform(x_lo + total / 2, x_hi - total / 2) if x_hi - x_lo > total else None
        if cx is None or hip - top_min < ph:
            return None
        y = rng.uniform(top_min, hip - ph)
        rects = [[cx - total / 2 + k * (pw + 8), y, pw, ph] for k in range(count)]
        if all(on_mask(m, r) and not any(overlaps(r, g) for g in heads) and x_lo <= centre(r)[0] <= x_hi for r in rects):
            return rects
    return None


def place_head(h, rng, pw, ph, core):
    """(b): the pasted face itself touches his head: its core's top edge inside his head band (from 40% down the band to
    2 px above its bottom), the core's centre across the band's middle 40%. (Dispute D2: at the lock the square's top
    edge was placed there, which could leave the face 65–100 px below the band, a chest print by rule 5.)"""
    b = h["band"]
    W, H = h["size"]
    for _ in range(100):
        cy = rng.uniform(b[1] + 0.4 * b[3], b[1] + b[3] - 2)
        cx = rng.uniform(b[0] + 0.3 * b[2], b[0] + 0.7 * b[2])
        r = [cx - core[0] - core[2] / 2, cy - core[1], pw, ph]
        if r[0] >= 0 and r[0] + pw <= W and r[1] >= 0 and r[1] + ph <= H:
            return r
    return None


def place_beside(h, m, rng, pw, ph):
    """(c): at chest height, wholly off his outline by ≥ 10 px."""
    j = h["joints"]
    W, H = h["size"]
    sh = max(j["lShoulder"][1], j["rShoulder"][1])
    hip = min(j["lHip"][1], j["rHip"][1])
    far = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 127
    for _ in range(300):
        x = rng.uniform(0, W - pw)
        y = rng.uniform(sh, max(sh + 1, hip - ph))
        r = [x, y, pw, ph]
        if r[1] + ph <= H and on_mask(~far, r, 1.0):
            return r
    return None


def paste_square(base, patch, x, y):
    base.paste(Image.fromarray(patch), (int(round(x)), int(round(y))))


def make_built(ctx, want, d):
    """The built photos: (a) on his chest (every 5th: two side by side), (b) touching his head, (c) beside him, and (L)
    large prints on his chest that main's whole-photo pass must find (kept only where main's locate blurs them)."""
    rng = random.Random(SEED + 1)
    pool = ensure_pool(ctx, 24)
    if len(pool) < 8:
        raise Crash(f"(setup) only {len(pool)} frontal faces in the pool")
    real = real_print_sources(ctx)
    hosts = ensure_hosts(ctx, max(8, want // 2))
    if len(hosts) < 4:
        raise Crash(f"(setup) only {len(hosts)} host photos with a whole pose and a head band")
    builds = {"a": [], "b": [], "c": [], "L": []}
    hi = 0
    tries = 0
    while min(len(builds[k]) for k in "abc") < want and tries < want * 12:
        tries += 1
        h = hosts[hi % len(hosts)]
        hi += 1
        m = outline_arr(h)
        W, H = h["size"]
        up = up_scale(W, H)
        typ = min("abc", key=lambda k: len(builds[k]))
        src = pool[rng.randrange(len(pool))]
        core_h = rng.uniform(24, 80) / up
        patch, core = print_patch(src, core_h)
        ph, pw = patch.shape[:2]
        if typ == "a":
            two = len(builds["a"]) % 5 == 4
            rects = place_chest(h, m, rng, pw, ph, 2 if two else 1)
            while rects is None and core_h * up > 25:
                core_h *= 0.8
                patch, core = print_patch(src, core_h)
                ph, pw = patch.shape[:2]
                rects = place_chest(h, m, rng, pw, ph, 2 if two else 1)
        elif typ == "b":
            r = place_head(h, rng, pw, ph, core)
            rects = [r] if r else None
        else:
            r = place_beside(h, m, rng, pw, ph)
            rects = [r] if r else None
        if not rects:
            continue
        img = Image.open(h["png"]).convert("RGB")
        faces = []
        for r in rects:
            paste_square(img, patch, r[0], r[1])
            faces.append({"core": [r[0] + core[0], r[1] + core[1], core[2], core[3]], "square": r, "px": round(core[3] * up, 1)})
        f = ctx.built_dir() / f"{typ}-{len(builds[typ])}.jpg"
        img.save(f, quality=95)
        builds[typ].append({"file": str(f), "host": h, "type": typ, "faces": faces, "src": src["photo"], "two": len(rects) > 1})
    # (L): large prints, from the pool and the real print crops, as large as his chest allows
    lt = 0
    sources = pool[:12] + real
    while len(builds["L"]) < max(6, want // 2 + 1) and lt < want * 6:
        lt += 1
        h = hosts[(hi + lt) % len(hosts)]
        m = outline_arr(h)
        W, H = h["size"]
        up = up_scale(W, H)
        src = sources[rng.randrange(len(sources))]
        j = h["joints"]
        span = abs(j["lShoulder"][0] - j["rShoulder"][0])
        core_h = min(0.42 * span, 160 / up)
        rects = None
        while core_h * up >= 40:
            patch, core = print_patch(src, core_h, 1.35)
            ph, pw = patch.shape[:2]
            rects = place_chest(h, m, rng, pw, ph)
            if rects:
                break
            core_h *= 0.88
        if not rects:
            continue
        img = Image.open(h["png"]).convert("RGB")
        r = rects[0]
        paste_square(img, patch, r[0], r[1])
        f = ctx.built_dir() / f"L-{lt}.jpg"
        img.save(f, quality=95)
        builds["L"].append({"file": str(f), "host": h, "type": "L", "src": src["photo"], "two": False,
                            "faces": [{"core": [r[0] + core[0], r[1] + core[1], core[2], core[3]], "square": r, "px": round(core[3] * up, 1)}]})
    return builds


def ensure_built(ctx):
    if getattr(ctx, "built", None) is None:
        want = 30 if ctx.full else 10
        ctx.built = make_built(ctx, want, ctx.scratch())
    return ctx.built


# ---------------------------------------------------------------- F2.2 · built prints
def check_built(ctx):
    fails, rep = [], {}
    sheet = Sheet("built-prints")
    try:
        B = ensure_built(ctx)
        files = [b["file"] for k in B for b in B[k]]
        rn = ctx.prep("new", files)
        rb = ctx.prep("before", files)
        rm = ctx.prep("main", [b["file"] for b in B["L"]])
        la = ctx.locate("main", [b["file"] for b in B["a"]])
        lm = ctx.locate("main", [b["file"] for b in B["L"]])
        wt = ctx.truth([b["file"] for b in B["L"]], mp=False, grids=(1,))
    except Crash as e:
        return [str(e)], {}
    zone_rep = {}
    stats = {}
    for typ in "abcL":
        items = B[typ]
        if typ == "L":
            kept = []
            for b in items:
                core = b["faces"][0]["core"]
                sq = b["faces"][0]["square"]
                whole = [w for w in wt[b["file"]]["whole"] if inside(centre(w), sq)]
                b["mainFound"] = bool(whole)
                b["inMainHide"] = any(any(same_rect(headbox(w), hh, 0.5) for hh in lm[b["file"]]["hide"]) for w in whole)
                # a print on his chest by rule 4, judged from main's own face box and the host's pose
                jj = b["host"]["joints"]
                ls_, rs_ = jj["lShoulder"], jj["rShoulder"]
                sh_, hip_ = max(ls_[1], rs_[1]), (jj["lHip"][1] + jj["rHip"][1]) / 2
                b["onChestByRule4"] = any(w[2] <= 0.8 * abs(ls_[0] - rs_[0]) and w[1] >= sh_ and w[1] + w[3] <= hip_ + 0.15 * (hip_ - sh_)
                                          and min(ls_[0], rs_[0]) <= centre(w)[0] <= max(ls_[0], rs_[0]) for w in whole)
                if b["inMainHide"] and b["onChestByRule4"]:
                    kept.append(b)
            stats["L_built"] = len(items)
            stats["L_found_by_main_whole_photo_pass"] = sum(1 for b in items if b["mainFound"])
            stats["L_in_main_hide"] = sum(1 for b in items if b["inMainHide"])
            stats["L_in_main_hide and on his chest by rule 4 (kept)"] = len(kept)
            need = 5 if ctx.full else 2
            if len(kept) < need:
                fails.append(f"(L setup) only {len(kept)} of {len(items)} large prints are blurred by main's locate (≥ {need} needed)")
            items = kept
        n_ok = n_faces = 0
        misses = []
        before_alone = before_found = 0
        pose_broken = []
        for b in items:
            h = b["host"]
            orig = rgb(b["file"])
            r, r0 = rn[b["file"]], rb[b["file"]]
            host_status = ctx.prep("new", [h["photo"]])[h["photo"]].get("status")
            # (a), dispute D3: when main's own pose on the pasted photo no longer has his neck, both shoulders and both
            # hips (the paste broke the pose), rule 2 rightly treats the print as today: it leaves the 90% count. It must
            # still not be refused, and his face is still checked below. Judged from main's locate, never the build's.
            broken = typ == "a" and not all(k_ in (la[b["file"]].get("joints") or {}) for k_ in ("neck", "lShoulder", "rShoulder", "lHip", "rHip"))
            if broken:
                pose_broken.append(Path(b["file"]).name)
            for k, fc in enumerate(b["faces"]):
                lab = f"({typ}) {Path(b['file']).name} face {k + 1} {fc['px']} px"
                if typ in ("a", "L"):
                    if r.get("status") != host_status:
                        n_faces += 1
                        misses.append((lab, f"refused: {r.get('status')}/{r.get('reason')} (host {host_status})"))
                        continue
                    if broken:
                        continue
                n_faces += 1
                if typ in ("a", "L"):
                    al, errs = alone(r, "fit", orig, fc["core"])
                    if al and all(x["ok"] for x in al) and not errs:
                        n_ok += 1
                    else:
                        x = next((x for x in al if not x["ok"]), {"copy": errs[0] if errs else "none measured"})
                        misses.append((lab, f"{x['copy']}: unchanged {x.get('unchanged')}, new grey {x.get('newGrey')}"))
                        if x.get("copy") == "upload":
                            sheet.add(f"{typ}-{k}-{Path(b['file']).stem}", uri_path(r["uploadUri"]), [v * up_scale(orig.shape[1], orig.shape[0]) for v in fc["core"]])
                    if r0.get("status") == "ok":
                        a0, _ = alone(r0, "fit", orig, fc["core"])
                        before_alone += bool(a0 and all(x["ok"] for x in a0))
                    before_found += r0.get("sweptFaces", 0) > 0
                else:
                    if r.get("status") != "ok":
                        n_ok += 1  # refused: nothing sent
                        continue
                    ok, vs, errs = hidden_all(r, "fit", orig, [fc["core"]], names={"upload", "detail"})
                    if ok:
                        n_ok += 1
                    else:
                        bad = [v for v in vs if v["v"] == "leak"]
                        misses.append((lab, f"{bad[0]['copy']}: {bad[0]['v']}, unchanged {bad[0].get('unchanged')}" if bad else str(errs)))
                        for v in bad[:1]:
                            sheet.add(f"{typ}-{Path(b['file']).stem}-{v['copy']}", v["path"], v["box"])
            # his own face and head: never less hidden because of a paste
            if r.get("status") == "ok":
                mine = h["mine"]
                ok, vs, errs = hidden_all(r, "fit", orig, mine, names={"upload", "detail"})
                if not ok:
                    fails.append(f"({typ}) {Path(b['file']).name}: his own face not hidden in a sent copy")
                if typ == "b":
                    # (b) pastes a face over his head regions, so the photo without it is no reference there: main on
                    # this same built photo is (a face touching his head is hidden as today).
                    hm = ctx.prep("main", [b["file"]])[b["file"]]
                    _, bad = head_hidden_as_main(h["locm"], r, hm, orig, regions=h["headRegions"])
                else:
                    hm = ctx.prep("main", [h["photo"]])[h["photo"]]
                    _, bad = head_hidden_as_main(h["locm"], r, hm, orig, regions=h["headRegions"], orig_main=rgb(h["png"]))
                if bad:
                    fails.append(f"({typ}) {Path(b['file']).name}: his head less hidden than main hides it on the photo without the print "
                                 f"({bad[0]['copy']} {bad[0]['region']}: {bad[0]['new']} vs {bad[0]['main']} + 0.05)")
            if typ == "L":
                stood_in = [g for g in h["headRegions"] if not any(same_rect(g, x, 0.5) for x in lm[b["file"]]["hide"])]
                b["mainDroppedHeadRegions"] = len(stood_in)
        stats[typ] = {"faces": n_faces, "ok": n_ok, "misses": misses[:40]}
        if typ == "a":
            stats["a"]["pose broken by the paste (main's locate): out of the count"] = pose_broken
            counted = len(items) - len(pose_broken)
            stats["a"]["photos counted"] = counted
            if counted < (24 if ctx.full else 8):
                fails.append(f"(a setup) only {counted} of {len(items)} (a) photos keep a whole pose under the paste (≥ {24 if ctx.full else 8})")
        if typ in ("a", "L"):
            stats[typ]["before_left_alone"] = before_alone
            stats[typ]["before_sweep_found_faces"] = before_found
        if typ == "a":
            if n_faces and n_ok < 0.9 * n_faces:
                fails.append(f"(a) {n_ok} of {n_faces} prints on his chest left alone (≥ 90%); first miss {misses[0][0]}: {misses[0][1]}")
            refused = [m for m in misses if m[1].startswith("refused")]
            if refused:
                fails.append(f"(a) {len(refused)} photos refused because of a print on his chest (first {refused[0][0]}: {refused[0][1]})")
        elif typ == "L":
            if misses:
                fails.append(f"(L) {len(misses)} of {n_faces} large prints main's locate blurs not left alone (first {misses[0][0]}: {misses[0][1]})")
            stats["L_photos where main's hide on the built photo lacks one of its head regions on the photo without the print"] = sum(1 for b in items if b.get("mainDroppedHeadRegions"))
        elif misses:
            fails.append(f"({typ}) {len(misses)} of {n_faces} faces {'touching his head' if typ == 'b' else 'beside him'} sent unhidden "
                         f"(first {misses[0][0]}: {misses[0][1]})")
        if not n_faces and typ != "L":
            fails.append(f"({typ} setup) no built photos")
    # reported: why (a) and (L) misses missed (printZone nil, or isPrint false on the face boxes locate found there)
    try:
        miss_files = sorted({m[0].split()[1] for t_ in ("a", "L") for m in stats.get(t_, {}).get("misses", [])})
        rows = [b for b in B["a"] + B["L"] if Path(b["file"]).name in miss_files]
        if rows:
            z = ctx.new.call("zone", [{"photo": b["file"], "boxes": [f["core"] for f in b["faces"]]} for b in rows])
            for b, r in zip(rows, z):
                sq = b["faces"][0]["square"]
                zone_rep[Path(b["file"]).name] = {
                    "zone": r.get("zone") and {k: r["zone"][k] for k in ("torso", "shoulderSpan", "head", "headWidth")},
                    "isPrint(core)": r.get("isPrint"), "torsoJoints": r.get("torsoJoints"), "square": sq,
                    "locateFacesOnThePrint": [f_ for f_ in r.get("faces", []) if overlaps(f_, sq)]}
    except Crash as e:
        zone_rep = {"error": str(e)}
    rep.update({"stats": stats, "a_miss_reasons": zone_rep, "sheet": sheet.note(),
                "built": {k: [{"file": Path(b["file"]).name, "host": no_kit(b["host"]["photo"]), "src": b["src"], "two": b["two"],
                               "faces": b["faces"], **({"inMainHide": b.get("inMainHide"), "onChestByRule4": b.get("onChestByRule4")} if k == "L" else {})} for b in B[k]] for k in B}})
    return fails, rep


# ---------------------------------------------------------------- F2.2 · re-check and prints (stand-in detectors)
def torso_half_box(ctx, p, P, loc):
    """A box P's size between his shoulders, in his torso band, clear of his head regions, with the least of it on the
    outline locate uses (the line wants one under 80%: rule 6 fails)."""
    h = ctx.hostinfo([p])[p]
    if not h.get("png"):
        return None, None
    W, H = h["size"]
    m = np.asarray(Image.open(h["png"]).convert("L").resize((W, H), Image.NEAREST)) > 127
    j = loc["joints"]
    if not all(k in j for k in ("lShoulder", "rShoulder", "lHip", "rHip")):
        return None, None
    ls, rs = j["lShoulder"], j["rShoulder"]
    sh, hip = max(ls[1], rs[1]), min(j["lHip"][1], j["rHip"][1])
    heads = [grow(r, 0.3) for r in his_head_regions(loc)]
    best = None
    for y in np.arange(sh + 2, hip - P[3], 4):
        for cx in np.arange(min(ls[0], rs[0]) + 1, max(ls[0], rs[0]) - 1, 3):
            r = [float(cx - P[2] / 2), float(y), P[2], P[3]]
            if any(overlaps(r, g) for g in heads):
                continue
            x0, y0 = int(r[0]), int(r[1])
            share = float(m[y0:y0 + int(P[3]), max(0, x0):x0 + int(P[2])].mean())
            if 0.3 <= share and (best is None or share < best[1]):
                best = (r, share)
    return best if best else (None, None)


def check_recheck(ctx):
    fails, rep = [], {}
    d = ctx.scratch()
    targets = []
    try:
        tr = ctx.truth([K(PRINTS[n][0]) for n in ("P1", "P2")], mp=False, grids=(1,))
        for n in ("P1", "P2"):
            p = K(PRINTS[n][0])
            W, H = tr[p]["size"]
            targets.append((n, p, to_work(PRINTS[n][1][0], W, H)))
        # built (a) photos where the real detector's prep left the print alone (so the rule calls it a print)
        B = ensure_built(ctx)
        rn = ctx.prep("new", [b["file"] for b in B["a"]])
        for b in B["a"]:
            if len(targets) >= 6:
                break
            r = rn[b["file"]]
            fc = b["faces"][0]
            if r.get("status") == "ok" and not b["two"]:
                al, _ = alone(r, "fit", rgb(b["file"]), fc["core"])
                if al and all(x["ok"] for x in al):
                    targets.append((f"built {Path(b['file']).name}", b["file"], fc["core"]))
    except Crash as e:
        return [str(e)], {}
    rep["targets"] = [t[0] for t in targets]
    for name, p, P in targets:
        rec = {}
        try:
            bp = ctx.before.call("bpick", [{"photo": p}])[0]
            Bx = bp.get("B")
            if not Bx or bp.get("controlShare", 1) > T:
                fails.append(f"(setup) {name}: no background box B that hiding its head covers (control {bp.get('controlShare')})")
                continue
            if overlaps(headbox(Bx), P):
                fails.append(f"(setup) {name}: B's head box touches the print")
                continue
            spec = "pb:" + ",".join(f"{v:.3f}" for v in P) + ";" + ",".join(f"{v:.3f}" for v in Bx)
            orig = rgb(ctx.truth([p], mp=False, grids=(1,))[p]["png"])
            for build in ("new", "before"):
                r = ctx.builds[build].call("prep", [{"photo": p, "root": fresh_root(d), "detector": spec}])[0]
                st = f"{r.get('status')}/{r.get('reason')}"
                rec[f"(1) {build}"] = st
                if build != "new":
                    if r.get("status") == "ok":
                        al, _ = alone(r, "fit", orig, P)
                        rec["(1) before print left alone"] = bool(al and all(x["ok"] for x in al))
                    continue
                if r.get("status") != "ok" or "reason" in r:
                    fails.append(f"(1) {name}: {st} with the print and B seen, expected ok (a print never forces a refusal)")
                    continue
                pr = prints_of(r)
                if not any(iou(x, P) >= 0.5 for x in pr):
                    fails.append(f"(1) {name}: prints {[[round(v) for v in x] for x in pr]} doesn't hold the print box {[round(v) for v in P]}")
                Wd, Hd = r["width"], r["height"]
                hid = [denorm(x, Wd, Hd) for x in r.get("hidden") or []]
                if not any(same_rect(x, headbox(Bx), 0.5) for x in hid):
                    fails.append(f"(1) {name}: B's head box isn't in hidden")
                det = rgb(uri_path(r["detailUri"]))
                o = resize(orig, det.shape[1], det.shape[0])
                sh_ = region_share(det, o, Bx, det.shape[1] / orig.shape[1])
                rec["(1) B unchanged in the detail copy"] = sh_
                if sh_ is None or sh_ > T:
                    fails.append(f"(1) {name}: B is {sh_} unchanged in the detail copy (≤ T {T})")
                al, _ = alone(r, "fit", orig, P)
                if not al or not all(x["ok"] for x in al):
                    fails.append(f"(1) {name}: the print isn't left alone with the stand-in detector")
            if not name.startswith("built"):
                loc = ctx.locate("main", [p])[p]
                Q, qshare = torso_half_box(ctx, p, P, loc)
                rec["Q"], rec["Q on outline"] = Q, qshare
                jobs = [("(2) B", "always:" + ",".join(f"{v:.3f}" for v in Bx), "faceRemains"),
                        ("(4) throws on the 7th call", "throwAt:7", "sweepFailed")]
                if Q and qshare < 0.8:
                    jobs.insert(1, ("(3) half on his outline", "always:" + ",".join(f"{v:.3f}" for v in Q), "faceRemains"))
                else:
                    fails.append(f"(3 setup) {name}: no torso box under 80% on his outline (best {qshare})")
                roots = [fresh_root(d) for _ in jobs]
                rows = ctx.new.call("prep", [{"photo": p, "root": rt, "detector": spec_} for (_, spec_, _), rt in zip(jobs, roots)])
                for (lab, _, want), r, rt in zip(jobs, rows, roots):
                    keys = sorted(k for k in r if not k.startswith("_"))
                    rec[lab] = f"{r.get('status')}/{r.get('reason')}"
                    if r.get("status") != "couldNotFrame" or r.get("reason") != want:
                        fails.append(f"{lab} {name}: {r.get('status')}/{r.get('reason')}, expected couldNotFrame/{want}")
                    if keys != REFUSAL_KEYS:
                        fails.append(f"{lab} {name}: keys {keys}, expected exactly {REFUSAL_KEYS}")
                    left = files_under(rt)
                    if left != ["Caches/upload/.sweep-v1"]:
                        fails.append(f"{lab} {name}: files written: {left[:4]}")
        except Crash as e:
            fails.append(f"{name}: {e}")
        rep[name] = rec
    return fails, rep


# ---------------------------------------------------------------- F2.2 · grey square on him
def check_grey_square(ctx):
    fails, rep = [], {}
    s1 = K(SUBJECTS["S1"][0])
    # (1) S1: no hidden rect bigger than 1.5× main's largest head region, centred inside his head region
    try:
        rn = ctx.prep("new", [s1])[s1]
        rb = ctx.prep("before", [s1])[s1]
        lm = ctx.locate("main", [s1])[s1]
    except Crash as e:
        return [str(e)], {}
    heads = his_head_any(lm)
    big = max((area(h) for h in heads), default=0)
    if not heads:
        fails.append("(1 setup) S1: main's locate gives no head region for him")

    def squares(r):
        if r.get("status") != "ok":
            return None
        W, H = r["width"], r["height"]
        return [[round(v, 1) for v in x] for x in (denorm(x, W, H) for x in r.get("hidden") or [])
                if area(x) > 1.5 * big and any(inside(centre(x), g) for g in heads)]
    rep["(1) S1"] = {"his head regions (main)": heads, "new": squares(rn), "before": squares(rb),
                     "status": {"new": rn.get("status"), "before": rb.get("status")}}
    sq = squares(rn)
    if sq is None:
        fails.append(f"(1) S1: status {rn.get('status')}/{rn.get('reason')}: no copy to look at")
    elif sq:
        fails.append(f"(1) S1: a hidden rect {sq[0]} larger than 1.5× his largest head region lies on his head")
    # (2) every normal photo sent by main and now: the flat grey on his outline ≤ main's + 0.02
    rows = [r for r in ctx.normal_rows if r["before"] == "ok"]
    if not ctx.full:
        rows = random.Random(SEED + 2).sample(rows, 60)
    photos = [r["path"] for r in rows]
    per, worse = [], []
    for part in chunks(photos, 20):
        try:
            mres, nres = ctx.prep("main", part), ctx.prep("new", part)
            locs = ctx.locate("main", part)
            mk = ctx.masks(part)
        except Crash as e:
            return fails + [str(e)], rep
        for p in part:
            m, n, loc = mres[p], nres[p], locs[p]
            if m.get("status") != "ok" or n.get("status") != "ok" or not loc.get("main") or not mk.get(p):
                continue
            W, H = loc["size"]
            mu, nu = rgb(uri_path(m["uploadUri"])), rgb(uri_path(n["uploadUri"]))
            s = mu.shape[1] / W
            hide0 = fl.norm_rects(loc["hide"], W, H)
            gap = legs_gap(n, loc, p)
            box = [v * s for v in loc["main"]]
            a, b = fl.outline_grey(mu, mk[p], box, hide0 + gap), fl.outline_grey(nu, mk[p], box, hide0 + gap)
            if a is None or b is None:
                continue
            per.append((no_kit(p), round(a, 4), round(b, 4)) + ((f"{len(gap)} leg/foot face(s) left out",) if gap else ()))
            if b > a + 0.02:
                worse.append(per[-1])
        print(f"  grey square: {len(per)} photos measured", flush=True)
    rep["(2) photos measured"] = len(per)
    rep["(2) worse"] = worse
    rep["(2) S1"] = [x for x in per if "2.55.27" in x[0]]
    if worse:
        fails.append(f"(2) {len(worse)} photos with more flat grey on his outline than main + 0.02 (first {worse[0][0][-40:]}: "
                     f"{worse[0][2]:.1%} vs {worse[0][1]:.1%})")
    if len(per) < (300 if ctx.full else 50):
        fails.append(f"(2 setup) only {len(per)} photos measured")
    # S1 is a pinterest photo in the normal set: make sure it's measured even in --quick
    if not rep["(2) S1"]:
        try:
            m, n, loc, mk = ctx.prep("main", [s1])[s1], rn, lm, ctx.masks([s1])[s1]
            if m.get("status") == "ok" and n.get("status") == "ok" and mk:
                W, H = loc["size"]
                mu, nu = rgb(uri_path(m["uploadUri"])), rgb(uri_path(n["uploadUri"]))
                s = mu.shape[1] / W
                hide0 = fl.norm_rects(loc["hide"], W, H) + legs_gap(n, loc, s1)
                a, b = fl.outline_grey(mu, mk, [v * s for v in loc["main"]], hide0), fl.outline_grey(nu, mk, [v * s for v in loc["main"]], hide0)
                rep["(2) S1"] = [(no_kit(s1), a, b)]
                if a is not None and b is not None and b > a + 0.02:
                    fails.append(f"(2) S1: {b:.1%} of his outline flat grey vs main's {a:.1%} + 2%")
        except Crash as e:
            fails.append(f"(2) S1: {e}")
    # (3) every other head T96 hid is still hidden (leak set, S1, built second-mirror-panel reflections)
    try:
        leak = ensure_leak(ctx)
        extra = [s1]
        lb, ln, lmx = ctx.locate("before", extra), ctx.locate("new", extra), ctx.locate("main", extra)
        items = [(p, L["locb"], L["locn"], L["locm"], L["new"]) for p, L in leak.items()]
        items.append((s1, lb[s1], ln[s1], lmx[s1], rn))
        panels = make_panels(ctx)
        pf = [x["file"] for x in panels]
        pb, pn, pm = ctx.locate("before", pf), ctx.locate("new", pf), ctx.locate("main", pf)
        pr = ctx.prep("new", pf)
        items += [(f, pb[f], pn[f], pm[f], pr[f]) for f in pf]
    except Crash as e:
        return fails + [f"(3) {e}"], rep
    lost, checked = [], 0
    for p, b, n, m, r in items:
        if b.get("status") != "ok" or r.get("status") != "ok":
            continue
        W, H = b["size"]
        mine = his_head_any(m)
        hid = [denorm(x, W, H) for x in r.get("hidden") or []]
        cap = 1.6 * 0.12 * max(W, H) - 1
        for R in b.get("otherHeads") or []:
            if any(inside(centre(R), g) for g in mine):
                continue
            checked += 1
            match = [x for x in n.get("otherHeads") or [] if abs(centre(x)[0] - centre(R)[0]) <= 1
                     and (same_rect(x, R, 0.5) or (x[2] < R[2] and x[2] >= cap))]
            if not match or not any(any(same_rect(x, h, 0.5) for h in hid) for x in match):
                lost.append((no_kit(p), [round(v, 1) for v in R]))
    rep["(3) other heads checked"] = checked
    rep["(3) lost"] = lost
    if lost:
        fails.append(f"(3) {len(lost)} heads beside him round 3 hid aren't hidden now (first {lost[0][0][-40:]} {lost[0][1]})")
    # the reflection's own face in each panel photo stays hidden
    refl_bad = []
    for x in panels:
        r = pr[x["file"]]
        if r.get("status") != "ok":
            continue
        ok, vs, errs = hidden_all(r, "fit", rgb(x["file"]), [x["core"]], names={"upload", "detail"})
        if not ok:
            refl_bad.append(Path(x["file"]).name)
    rep["(3) panels"] = len(panels)
    if refl_bad:
        fails.append(f"(3) his second reflection's face unhidden in {len(refl_bad)} panel photos (first {refl_bad[0]})")
    if not panels:
        fails.append("(3 setup) no second-mirror-panel photos built")
    return fails, rep


def face_in(r):
    """Prep.faceIn: the face a head box was grown from."""
    w, h = r[2] / 1.6, r[3] / 1.9
    return [r[0] + r[2] / 2 - w / 2, r[1] + 0.55 * r[3] - h / 2, w, h]


def legs_gap(res, loc, photo=None):
    """The known gap, out of this task's scope (TESTING.md → Scope): the head boxes the sweep drew for "faces" it found
    below his hip line (his shoes, jeans, a cuff). Normalized, from the end of `hidden` (T96 orders it locate's regions,
    other heads, then each swept face's head). Empty with no hips found."""
    j = loc.get("joints") or {}
    hips = [j[k][1] for k in ("lHip", "rHip") if k in j]
    n = res.get("sweptFaces") or 0
    if not n:
        return []
    W, H = loc["size"]
    swept = (res.get("hidden") or [])[-n:]
    out = [r for r in swept if hips and (r[1] + r[3] / 2) * H > sum(hips) / len(hips)]
    u = up_scale(W, H)
    hands = T96S_EYE_HAND_FACES.get(no_kit(photo), []) if photo else []
    out += [r for r in swept if r not in out and any(iou([v * u for v in face_in(denorm(r, W, H))], e) >= 0.5 for e in hands)]
    return out


def make_panels(ctx):
    """T96's panel (c): his own photo flipped and shrunk into a mirror panel beside him (his second reflection)."""
    if getattr(ctx, "panels", None) is not None:
        return ctx.panels
    rng = random.Random(SEED + 4)
    want = 10 if ctx.full else 5
    hosts = ensure_hosts(ctx, want)
    out = []
    for n, h in enumerate(hosts):
        if len(out) >= want:
            break
        mh = h.get("mphead")
        if not mh:
            continue
        base = Image.open(h["png"]).convert("RGB")
        W, H = base.size
        up = up_scale(W, H)
        lo = max(0.5, (24 / up) / mh[3])
        if lo > 0.8:
            continue
        s = rng.uniform(0.25, 0.35)
        P = int(round(s / (1 - s) * W))
        left = n % 2 == 0
        canvas = Image.new("RGB", (W + P, H))
        ox = P if left else 0
        canvas.paste(base, (ox, 0))
        arr = np.asarray(base)
        col = arr[:, 0:1] if left else arr[:, W - 1:W]
        panel = Image.fromarray(np.clip(np.repeat(col, P, axis=1).astype(np.float32) * 0.86, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
        f = rng.uniform(lo, 0.8)
        small = resize(np.asarray(base)[:, ::-1].copy(), int(W * f), int(H * f))
        hc = [(W - mh[0] - mh[2]) * f, mh[1] * f, mh[2] * f, mh[3] * f]
        x, y = P / 2 - (hc[0] + hc[2] / 2), (H - int(H * f)) * 0.3
        panel.paste(Image.fromarray(small), (int(round(x)), int(round(y))))
        px0 = 0 if left else W
        canvas.paste(panel, (px0, 0))
        ImageDraw.Draw(canvas).rectangle([P - 3 if left else W, 0, (P - 3 if left else W) + 2, H], fill=(25, 25, 25))
        core = [px0 + int(round(x)) + hc[0], int(round(y)) + hc[1], hc[2], hc[3]]
        CW, CH = canvas.size
        g = min(1, 2048 / max(CW, CH))
        if g < 1:
            canvas = canvas.resize((int(round(CW * g)), int(round(CH * g))), Image.LANCZOS)
            core = [v * g for v in core]
        fp = ctx.built_dir() / f"panel-{n}.jpg"
        canvas.save(fp, quality=95)
        out.append({"file": str(fp), "core": core, "host": no_kit(h["photo"])})
    ctx.panels = out
    return out


# ---------------------------------------------------------------- F2.2 · where the rule doesn't apply
def check_not_applied(ctx):
    fails, rep = [], {}
    photos = [K(PRINTS[n][0]) for n in ("P1", "P2", "P3")]

    def compare(lab, p, kind, rn, rb):
        out = []
        if rn.get("status") == "ok":
            if rn.get("printsKept") != 0 or rn.get("prints") != []:
                out.append(f"{lab}: printsKept {rn.get('printsKept')}, prints {rn.get('prints')}; expected 0 and []")
        a = {k: v for k, v in strip(rn, rn["_root"]).items() if k not in ("printsKept", "prints")}
        b = {k: v for k, v in strip(rb, rb["_root"]).items() if k not in ("printsKept", "prints")}
        if a != b:
            diff = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
            out.append(f"{lab}: the result differs from the round-3 build's in {diff[:6]}")
        fa, fb = result_files(rn, kind), result_files(rb, kind)
        if [x[0] for x in fa] != [x[0] for x in fb]:
            out.append(f"{lab}: different files written ({[x[0] for x in fa]} vs {[x[0] for x in fb]})")
        else:
            for (nm, x), (_, y) in zip(fa, fb):
                if Path(x).read_bytes() != Path(y).read_bytes():
                    out.append(f"{lab}: the {nm} copy isn't byte-identical to the round-3 build's")
        return out
    # (1) snaps and clothes scans
    for kind in ("snap", "items"):
        try:
            rn, rb = ctx.prep("new", photos, kind=kind), ctx.prep("before", photos, kind=kind)
        except Crash as e:
            fails.append(f"(1) {kind}: {e}")
            continue
        for p in photos:
            lab = f"(1) {Path(p).stem[-14:]} {kind}"
            rep[lab] = f"{rn[p].get('status')}/{rn[p].get('reason')}"
            fails += compare(lab, p, kind, rn[p], rb[p])
    # (2) his head out of the frame: P1 and P2 cropped at his shoulders
    d = ctx.built_dir()
    crops = []
    try:
        tr = ctx.truth([K(PRINTS[n][0]) for n in ("P1", "P2")], mp=False, grids=(1,))
        for n in ("P1", "P2"):
            p = K(PRINTS[n][0])
            loc = ctx.locate("main", [p])[p]
            j = loc.get("joints") or {}
            ys = [j[k][1] for k in ("lShoulder", "rShoulder") if k in j]
            if not ys:
                fails.append(f"(2 setup) {n}: main's locate finds no shoulder to crop at")
                continue
            top = int(round(min(ys)))
            img = Image.open(tr[p]["png"]).convert("RGB")
            c = img.crop((0, top, img.width, img.height))
            f = d / f"{n}-headless.jpg"
            c.save(f, quality=95)
            crops.append((n, str(f), top))
        rn = ctx.prep("new", [c[1] for c in crops])
        rb = ctx.prep("before", [c[1] for c in crops])
    except Crash as e:
        return fails + [f"(2) {e}"], rep
    for n, f, top in crops:
        lab = f"(2) {n} cropped at y {top}"
        rep[lab] = {"new": f"{rn[f].get('status')}/{rn[f].get('reason')}", "before": f"{rb[f].get('status')}/{rb[f].get('reason')}"}
        fails += compare(lab, f, "fit", rn[f], rb[f])
    return fails, rep


# ---------------------------------------------------------------- F2.2 · T96 still holds (T96's file, run unchanged)
def t96_verdict(lines, built, missed):
    """T96's PASS/FAIL lines and its built-small-faces and missed-people JSON → this line's fails."""
    fails = []
    for name in T96_STILL_PASSING:
        got = [l for l in lines if l.startswith(f"PASS F2.2 · {name}") or l.startswith(f"FAIL F2.2 · {name}:") or l.startswith(f"FAIL F2.2 · {name} ")]
        if not got:
            fails.append(f"T96 '{name}': no PASS/FAIL line")
        elif not got[0].startswith("PASS"):
            fails.append(f"T96 '{name}' is red: {got[0][:200]}")
    if built is None:
        fails.append("T96 built-small-faces.json missing")
    else:
        by = built.get("by_kind_and_size", {})
        for k, want in R3_BUILT_SMALL.items():
            got = by.get(k, {}).get("caught", -1)
            if got < want:
                fails.append(f"T96 built small faces: {k} caught {got}, round 3 caught {want}")
        var = built.get("edges", {}).get("by_variant", {})
        for k, want in R3_VARIANTS.items():
            v = var.get(k)
            got = v[0] - v[1] if v else -1
            if got < want:
                fails.append(f"T96 built small faces: {k} caught {got}, round 3 caught {want}")
    if missed is None:
        fails.append("T96 missed-people.json missing")
    else:
        g = sum(1 for r in missed.get("detail", []) if r.get("status") == "ok" and r.get("strangerGrey") and min(r["strangerGrey"]) >= 0.8)
        if g < R3_MISSED_GREY:
            fails.append(f"T96 missed people: {g} of {len(missed.get('detail', []))} fully grey, round 3 {R3_MISSED_GREY}")
    return fails


def check_t96(ctx):
    if not ctx.full:
        return ["not run in --quick (T96's --full takes about an hour): never a pass"], {}
    if ctx.planted:
        return ["not run with --new-from"], {}
    t96 = REPO / "extraction-test" / "results" / "t96"
    snap = ctx.scratch() / "t96-before"
    shutil.copytree(t96, snap)
    py = sys.executable
    t0 = time.time()
    p = subprocess.run([py, str(REPO / "extraction-test" / "vision" / "face_leak_test.py"), "--full"], capture_output=True, text=True, cwd=str(REPO))
    lines = [l for l in p.stdout.splitlines() if l.startswith(("PASS F2.2", "FAIL F2.2"))]
    keep = OUT / "t96-run"
    shutil.rmtree(keep, ignore_errors=True)
    keep.mkdir(parents=True)
    for f in t96.glob("*.json"):
        shutil.copy(f, keep / f.name)
    built = json.loads((t96 / "built-small-faces.json").read_text()) if (t96 / "built-small-faces.json").exists() else None
    missed = json.loads((t96 / "missed-people.json").read_text()) if (t96 / "missed-people.json").exists() else None
    # T96's committed round-3 results stay as they are (its baseline): restored after the run
    for f in t96.glob("*.json"):
        f.unlink()
    for f in snap.glob("*.json"):
        shutil.copy(f, t96 / f.name)
    fails = t96_verdict(lines, built, missed)
    tl = [l for l in lines if "· time" in l]
    return fails, {"lines": lines, "time (reported, not gated while the Mac has under 1 GB free)": tl, "minutes": round((time.time() - t0) / 60),
                   "results": str(keep.relative_to(REPO))}


# ---------------------------------------------------------------- F2.2 · same photo
def check_same_photo(ctx):
    fails, rep = [], {}
    d = ctx.scratch()
    photos = [K(PRINTS[n][0]) for n in ("P1", "P2", "P3")] + [K(SUBJECTS["S1"][0])]
    try:
        B = ensure_built(ctx)
        photos += [b["file"] for b in B["a"][:4]]
        jobs = [{"photo": p, "root": fresh_root(d)} for p in photos for _ in (0, 1)]
        res = ctx.new.call("prep", jobs)
    except Crash as e:
        return [str(e)], {}
    for i in range(0, len(jobs), 2):
        p = jobs[i]["photo"]
        a, b = res[i], res[i + 1]
        lab = Path(p).stem[-16:]
        if a.get("status") == "ok" and ("prints" not in a or "printsKept" not in a):
            fails.append(f"{lab}: run's result has no prints/printsKept keys")
        if strip(a, jobs[i]["root"]) != strip(b, jobs[i + 1]["root"]):
            sa, sb = strip(a, jobs[i]["root"]), strip(b, jobs[i + 1]["root"])
            fails.append(f"{lab}: results differ in {sorted(k for k in set(sa) | set(sb) if sa.get(k) != sb.get(k))[:5]}")
        if a.get("prints") != b.get("prints"):
            fails.append(f"{lab}: prints differ between two preps")
        fa, fb = result_files(a, "fit"), result_files(b, "fit")
        sent = lambda fs: [x for x in fs if x[0] not in ("keptUri", "thumbUri")]
        if len(fa) != len(fb) or any(Path(x[1]).read_bytes() != Path(y[1]).read_bytes() for x, y in zip(sent(fa), sent(fb))):
            fails.append(f"{lab}: the sent copies differ between two preps")
        if a.get("sha256") != sha_file(p) or b.get("sha256") != a.get("sha256"):
            fails.append(f"{lab}: sha256 isn't the file's")
        rep[lab] = {"status": a.get("status"), "prints": a.get("prints")}
    return fails, rep


# ---------------------------------------------------------------- main
FUNCS = {"logic": check_logic, "real-prints": check_real_prints, "pose-lies": check_pose_lies, "strangers": check_strangers,
         "built-prints": check_built, "recheck": check_recheck, "grey-square": check_grey_square, "not-applied": check_not_applied,
         "t96": check_t96, "same-photo": check_same_photo}


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--full", action="store_true")
    g.add_argument("--quick", action="store_true")
    ap.add_argument("--only", action="append", choices=[c[0] for c in CHECKS])
    ap.add_argument("--new-from", help="compile the build under test from this folder (bite demos only; never a pass)")
    args = ap.parse_args()
    bad = [p for p, h in fl.PINS.items() if sha_file(REPO / p) != h]
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
    todo = [c for c in CHECKS if not args.only or c[0] in args.only]
    failed = 0
    tag = " (planted build: not a pass)" if args.new_from else ("" if args.full else " (quick: not a pass)")
    for slug, name in todo:
        t0 = time.time()
        try:
            fails, rep = FUNCS[slug](ctx)
        except Exception as e:  # a harness bug still fails the line, loudly
            import traceback
            traceback.print_exc()
            fails, rep = [f"harness error: {type(e).__name__}: {e}"], {}
        rep = {"mode": "full" if args.full else "quick", "planted": args.new_from, "fails": fails, "seconds": round(time.time() - t0), **rep}
        if not args.new_from:
            (OUT / f"{slug}.json").write_text(json.dumps(rep, indent=1, default=str))
        else:
            (ctx.tmp.parent / f"t96s-planted-{slug}.json").write_text(json.dumps(rep, indent=1, default=str))
        if fails:
            failed += 1
            print(f"FAIL F2.2 · {name}: {fails[0]}" + (f" (+{len(fails) - 1} more, see results/t96s/{slug}.json)" if len(fails) > 1 else "") + tag, flush=True)
        else:
            print(f"PASS F2.2 · {name}{tag}", flush=True)
    shutil.rmtree(ctx.tmp, ignore_errors=True)
    if getattr(ctx, "_built", None):
        shutil.rmtree(ctx._built, ignore_errors=True)
    sys.exit(1 if failed or args.new_from or not args.full else 0)


if __name__ == "__main__":
    main()
