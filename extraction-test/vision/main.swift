// kmeasure: the app's own Swift (KittedPrep.swift + KittedMeasure.swift + KittedGuide.swift) on the Mac,
// for tests and tuning (DECISIONS-LOG #104). Build with ./build.sh.
//
//   kmeasure crops <kept.jpg> <detail.jpg> <garments.json> <outdir> <prefix>
//       garments.json: [{"index":0,"category":"top","box":[ymin,xmin,ymax,xmax]}] (0-1000, the closet call's boxes)
//       writes <prefix>-<index>.png (transparent cut-outs from the face-hidden copy) and <prefix>.json
//       (quality numbers, color clusters, feature prints)
//   kmeasure zoom <photo.jpg> <outdir> <stem>
//       writes <stem>.full.jpg (faces hidden, 1024), <stem>.body/.upper/.lower.jpg (faces hidden, 1024)
//       and <stem>.json (rects, joints)
import CoreImage
import Foundation
import ImageIO

func load(_ path: String) -> CGImage? {
  guard let data = FileManager.default.contents(atPath: path) else { return nil }
  return Prep.decode(data, maxPx: Prep.workPx).image
}

func rectDict(_ r: CGRect) -> [String: Int] { ["x": Int(r.minX), "y": Int(r.minY), "w": Int(r.width), "h": Int(r.height)] }

func writeJSON(_ obj: Any, _ path: String) throws {
  let d = try JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted, .sortedKeys])
  try d.write(to: URL(fileURLWithPath: path))
}

let args = CommandLine.arguments
guard args.count >= 2 else { print("usage: kmeasure crops|zoom ..."); exit(2) }

switch args[1] {
case "crops":
  // An optional 8th argument "mirrored" flips the cut-outs back to true view (a mirror selfie, #109).
  guard args.count == 7 || args.count == 8, let kept = load(args[2]), let detail = load(args[3]),
        let gdata = FileManager.default.contents(atPath: args[4]),
        let glist = try JSONSerialization.jsonObject(with: gdata) as? [[String: Any]] else { print("bad args"); exit(2) }
  let out = args[5], prefix = args[6], mirrored = args.count == 8 && args[7] == "mirrored"
  let W = CGFloat(kept.width), H = CGFloat(kept.height)
  let garments: [Measure.Garment] = glist.compactMap { g in
    guard let i = g["index"] as? Int, let c = g["category"] as? String, let b = g["box"] as? [Double], b.count == 4 else { return nil }
    return Measure.Garment(index: i, category: c, rect: CGRect(x: b[1] / 1000 * W, y: b[0] / 1000 * H, width: (b[3] - b[1]) / 1000 * W, height: (b[2] - b[0]) / 1000 * H))
  }
  let t0 = CFAbsoluteTimeGetCurrent()
  let located = Prep.locate(kept)
  guard let rgb = Measure.rgb(kept, maxSide: Measure.statPx) else { exit(1) }
  let person = Measure.personMask(kept, w: rgb.w, h: rgb.h)
  let heads = Measure.grownHeads(located.hide), hands = Measure.handBoxes(kept)
  let results = Measure.measure(image: kept, garments: garments, heads: heads, hands: hands, person: person, rgb: rgb)
  let statsMs = Int((CFAbsoluteTimeGetCurrent() - t0) * 1000)
  var rows: [[String: Any]] = []
  for (g, r) in zip(garments, results) {
    var row: [String: Any] = [
      "index": g.index, "category": g.category, "ownedPx": r.ownedPx,
      "coverage": (r.coverage * 1000).rounded() / 1000, "overlapOuter": (r.overlapOuter * 1000).rounded() / 1000,
      "headOverlap": (r.headOverlap * 1000).rounded() / 1000, "droppedOuter": (r.droppedOuter * 100).rounded() / 100, "boxW": r.boxW, "boxH": r.boxH, "lapVar": Int(r.lapVar),
      "clusters": r.clusters.map { ["hex": Measure.hex($0.lab), "L": Int($0.lab.L.rounded()), "a": Int($0.lab.a.rounded()), "b": Int($0.lab.b.rounded()), "share": ($0.share * 100).rounded() / 100] },
    ]
    let t1 = CFAbsoluteTimeGetCurrent()
    // The display cut-out (<prefix>-<i>.png) and the one the color was measured on (-color.png).
    let cropRect = g.category == "footwear" ? Measure.singleShoeRect(mask: r.tileMask, maskW: rgb.w, maskH: rgb.h, rect: g.rect, W: W, H: H) ?? g.rect : g.rect
    if !r.tileMask.isEmpty, let raw = Measure.cutout(source: detail, mask: r.tileMask, maskW: rgb.w, maskH: rgb.h, rect: cropRect),
       let cut = mirrored ? Measure.flippedHorizontally(raw) : raw {
      let file = "\(prefix)-\(g.index).png"
      try Measure.writePNG(cut, to: URL(fileURLWithPath: out).appendingPathComponent(file))
      row["file"] = file
      row["cutW"] = cut.width; row["cutH"] = cut.height
      if let fp = Measure.featurePrint(cut) { row["print"] = Measure.floats(fp) }
    }
    if r.ownedPx > 0, let cut = Measure.cutout(source: detail, mask: r.mask, maskW: rgb.w, maskH: rgb.h, rect: g.rect) {
      try Measure.writePNG(cut, to: URL(fileURLWithPath: out).appendingPathComponent("\(prefix)-\(g.index)-color.png"))
    }
    row["cutMs"] = Int((CFAbsoluteTimeGetCurrent() - t1) * 1000)
    rows.append(row)
  }
  try writeJSON(["prefix": prefix, "width": Int(W), "height": Int(H), "personMask": person != nil, "heads": heads.map(rectDict), "hands": hands.map(rectDict), "statsMs": statsMs, "garments": rows], "\(out)/\(prefix).json")
  print("\(prefix): \(rows.count) garments · stats \(statsMs) ms")

case "zoom":
  guard args.count == 5, let image = load(args[2]) else { print("bad args"); exit(2) }
  let out = URL(fileURLWithPath: args[3]), stem = args[4]
  let W = CGFloat(image.width), H = CGFloat(image.height)
  let located = Prep.locate(image)
  guard located.status == "ok", let hidden = Prep.hideRegions(image, located.hide) else {
    try writeJSON(["status": located.status], out.appendingPathComponent("\(stem).json").path)
    print("\(stem): \(located.status)"); exit(0)
  }
  let gray = Measure.rgb(image, maxSide: Measure.statPx)
  let person = gray.flatMap { Measure.personMask(image, w: $0.w, h: $0.h) }
  let rects = Measure.zoomRects(located: located, person: person, W: W, H: H)
  _ = try Prep.writeJPEG(hidden, longEdge: Prep.uploadPx, quality: 0.8, to: out.appendingPathComponent("\(stem).full.jpg"))
  var sizes: [String: Any] = [:]
  for (name, r) in rects {
    if let w = try Measure.cropJPEG(hidden, r, longEdge: Prep.uploadPx, to: out.appendingPathComponent("\(stem).\(name).jpg")) { sizes[name] = [w.width, w.height] }
  }
  try writeJSON([
    "status": "ok", "width": Int(W), "height": Int(H), "pose": located.pose,
    "rects": rects.mapValues(rectDict), "sizes": sizes,
    "joints": located.joints.mapValues { [Int($0.x), Int($0.y)] },
  ], out.appendingPathComponent("\(stem).json").path)
  print("\(stem): \(rects.keys.sorted().joined(separator: ","))")

case "shape":
  // kmeasure shape <photo.jpg>...: one JSON line per photo with the leg ratios (shadow mode).
  for path in args.dropFirst(2) {
    guard let image = load(path) else { print("{\"photo\": \"\(path)\", \"status\": \"unreadable\"}"); continue }
    let located = Prep.locate(image)
    let W = CGFloat(image.width), H = CGFloat(image.height)
    var row: [String: Any] = ["photo": path, "status": located.status, "pose": located.pose]
    if let small = Measure.rgb(image, maxSide: Measure.statPx), let mask = Measure.personMask(image, w: small.w, h: small.h),
       let s = Measure.legShape(joints: located.joints, mask: mask, W: W, H: H) {
      func r(_ v: Double?) -> Any { v.map { ($0 * 100).rounded() / 100 } ?? NSNull() }
      row["kneeToThigh"] = r(s.kneeToThigh); row["ankleToKnee"] = r(s.ankleToKnee); row["kneeToHips"] = r(s.kneeToHips)
      row["thigh"] = s.thigh.map { Int($0) }; row["knee"] = s.knee.map { Int($0) }; row["ankle"] = s.ankle.map { Int($0) }
    }
    let d = try JSONSerialization.data(withJSONObject: row, options: [.sortedKeys])
    print(String(data: d, encoding: .utf8)!)
  }

case "prep":
  // kmeasure prep <photo.jpg> <root>: the app's whole photo prep (Prep.run) with Documents/Caches under <root>.
  guard args.count == 4 else { print("bad args"); exit(2) }
  Prep.rootOverride = URL(fileURLWithPath: args[3])
  var r = try Prep.run(uri: args[2])
  r["uploadBase64"] = (r["uploadBase64"] as? String).map { "\($0.count) chars" }
  r["zoomBase64"] = (r["zoomBase64"] as? [String])?.map { "\($0.count) chars" }
  let d = try JSONSerialization.data(withJSONObject: r, options: [.sortedKeys, .prettyPrinted])
  print(String(data: d, encoding: .utf8)!)

default:
  print("unknown command"); exit(2)
}
