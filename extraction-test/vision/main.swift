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
//   kmeasure ruler <photo.jpg> <out.json> [--boxes garments.json] [--shorts] [--overlay out.jpg] [--max px] [--crop share]
//       the fit ruler (FitRuler.swift): sleeve end, top hem, pant hem, shorts length, layers, from his own joints
//   kmeasure legs <photo.jpg> <out.json> [--boxes garments.json] [--overlay out.jpg] [--max px] [--crop share]
//       the leg probe (LegTaper.swift): pant widths at thigh, knee, hem and the shoe, as garment-to-garment ratios
//   kmeasure waist <photo.jpg> <out.json> [--overlay out.jpg] [--max px] [--crop share]
//       the waist ruler (WaistRuler.swift): the visual waistline against a ruler from his joints, and the pants' shin/thigh width
//   kmeasure hems <photo.jpg> <out.json> [--boxes garments.json] [--overlay out.jpg] [--max px] [--crop share]
//       the hem probe (HemProbe.swift): folds above the hem, fabric over the shoe, hem spread (M2)
import CoreImage
import Foundation
import ImageIO
import Vision

func load(_ path: String) -> CGImage? {
  guard let data = FileManager.default.contents(atPath: path) else { return nil }
  return Prep.decode(data, maxPx: Prep.workPx).image
}

func rectDict(_ r: CGRect) -> [String: Int] { ["x": Int(r.minX), "y": Int(r.minY), "w": Int(r.width), "h": Int(r.height)] }

func writeJSON(_ obj: Any, _ path: String) throws {
  let d = try JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted, .sortedKeys])
  try d.write(to: URL(fileURLWithPath: path))
}

/// The photo as the same camera would have taken it pitched by `degrees` (positive = tilted down), turning about its
/// own center: exactly a homography K·R·K⁻¹ (a phone's main lens, ~26 mm equivalent, ≈ 69° across the long side).
/// Waist test only (#270): a ruler that corrects for the camera should read the same clothes edge at the same t.
func tiltCamera(_ img: CGImage, degrees: Double) -> CGImage? {
  let W = Double(img.width), H = Double(img.height)
  let f = max(W, H) / 2 / tan(34.5 * .pi / 180)
  let a = degrees * .pi / 180
  // Map a source pixel (x, y; origin top-left) to the tilted image: rotate the ray about the x axis.
  func map(_ x: Double, _ y: Double) -> CGPoint {
    let X = x - W / 2, Y = y - H / 2, Z = f
    let Y2 = Y * cos(a) - Z * sin(a), Z2 = Y * sin(a) + Z * cos(a)
    return CGPoint(x: X * f / Z2 + W / 2, y: Y2 * f / Z2 + H / 2)
  }
  let ci = CIImage(cgImage: img)
  // CoreImage's origin is bottom-left.
  func v(_ p: CGPoint) -> CIVector { CIVector(x: p.x, y: CGFloat(H) - p.y) }
  guard let flt = CIFilter(name: "CIPerspectiveTransform") else { return nil }
  flt.setValue(ci, forKey: kCIInputImageKey)
  flt.setValue(v(map(0, 0)), forKey: "inputTopLeft")
  flt.setValue(v(map(W, 0)), forKey: "inputTopRight")
  flt.setValue(v(map(0, H)), forKey: "inputBottomLeft")
  flt.setValue(v(map(W, H)), forKey: "inputBottomRight")
  guard let out = flt.outputImage else { return nil }
  // Keep the original frame size, filled white outside (a background, so his outline stays his).
  let bg = CIImage(color: .white).cropped(to: CGRect(x: 0, y: 0, width: W, height: H))
  let comp = out.composited(over: bg).cropped(to: CGRect(x: 0, y: 0, width: W, height: H))
  return CIContext().createCGImage(comp, from: comp.extent)
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

case "locate":
  // kmeasure locate <photo.jpg>: what photo prep hides (Prep.locate), as JSON (#188).
  guard args.count == 3, let img = load(args[2]) else { print("bad args"); exit(2) }
  let f = Prep.locate(img)
  let d = try JSONSerialization.data(withJSONObject: ["status": f.status, "hide": f.hide.map(rectDict), "main": f.main.map(rectDict) ?? [:],
    "joints": f.joints.mapValues { [Int($0.x), Int($0.y)] }, "size": [img.width, img.height]] as [String: Any], options: [.sortedKeys])
  print(String(data: d, encoding: .utf8)!)

case "prep":
  // kmeasure prep <photo.jpg> <root>: the app's whole photo prep (Prep.run) with Documents/Caches under <root>.
  guard args.count == 4 else { print("bad args"); exit(2) }
  Prep.rootOverride = URL(fileURLWithPath: args[3])
  var r = try Prep.run(uri: args[2])
  r["uploadBase64"] = (r["uploadBase64"] as? String).map { "\($0.count) chars" }
  r["zoomBase64"] = (r["zoomBase64"] as? [String])?.map { "\($0.count) chars" }
  let d = try JSONSerialization.data(withJSONObject: r, options: [.sortedKeys, .prettyPrinted])
  print(String(data: d, encoding: .utf8)!)

case "ruler":
  // kmeasure ruler <photo.jpg> <out.json> [--boxes garments.json] [--shorts] [--overlay out.jpg] [--max px] [--crop share]
  //   The fit ruler (FitRuler.swift, DECISIONS-LOG #170). --max decodes smaller than the 2048 working size and
  //   --crop trims that share off every side first: the nuisance test (the same photo, slightly different input).
  guard args.count >= 4 else { print("bad args"); exit(2) }
  var boxes: [[String: Any]] = [], shorts = false, overlayPath: String?, maxPx = Prep.workPx, crop: CGFloat = 0
  var i = 4
  while i < args.count {
    switch args[i] {
    case "--boxes": if let d = FileManager.default.contents(atPath: args[i + 1]), let l = try JSONSerialization.jsonObject(with: d) as? [[String: Any]] { boxes = l }; i += 2
    case "--shorts": shorts = true; i += 1
    case "--overlay": overlayPath = args[i + 1]; i += 2
    case "--max": maxPx = CGFloat(Double(args[i + 1]) ?? 2048); i += 2
    case "--crop": crop = CGFloat(Double(args[i + 1]) ?? 0); i += 2
    default: print("unknown option \(args[i])"); exit(2)
    }
  }
  guard let data = FileManager.default.contents(atPath: args[2]), var image = Prep.decode(data, maxPx: maxPx).image else { print("unreadable"); exit(1) }
  if crop > 0 {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    let r = CGRect(x: W * crop, y: H * crop, width: W * (1 - 2 * crop), height: H * (1 - 2 * crop)).integral
    guard let c = image.cropping(to: r) else { exit(1) }
    image = c
    // The boxes are 0–1000 of the uncropped photo: move them into the crop.
    boxes = boxes.map { g in
      var g = g
      if let b = g["box"] as? [Double] {
        let f = Double(crop)
        g["box"] = b.map { (($0 / 1000 - f) / (1 - 2 * f)) * 1000 }
      }
      return g
    }
  }
  let res = Ruler.run(image, boxes: boxes, shorts: shorts)
  var out = res.json
  out["photo"] = args[2]; out["max"] = Int(maxPx); out["crop"] = Double(crop)
  try writeJSON(out, args[3])
  if let o = overlayPath, !res.readings.isEmpty, let hidden = Prep.hideRegions(image, res.hide), let rgb = Measure.rgb(hidden, maxSide: Measure.statPx) {
    try Ruler.overlay(rgb, res.readings, res.joints, to: URL(fileURLWithPath: o))
  }
  let summary = ["sleeve_end", "top_length", "hem", "shorts_length", "layers"].compactMap { k in (out[k] as? [String: Any]).map { "\(k)=\($0["value"] ?? "?")" } }
  print(summary.joined(separator: " "))

case "legs":
  // kmeasure legs <photo.jpg> <out.json> [--boxes garments.json] [--overlay out.jpg] [--max px] [--crop share]
  guard args.count >= 4 else { print("bad args"); exit(2) }
  var lboxes: [[String: Any]] = [], lover: String?, lmax = Prep.workPx, lcrop: CGFloat = 0
  var li = 4
  while li < args.count {
    switch args[li] {
    case "--boxes": if let d = FileManager.default.contents(atPath: args[li + 1]), let l = try JSONSerialization.jsonObject(with: d) as? [[String: Any]] { lboxes = l }; li += 2
    case "--overlay": lover = args[li + 1]; li += 2
    case "--max": lmax = CGFloat(Double(args[li + 1]) ?? 2048); li += 2
    case "--crop": lcrop = CGFloat(Double(args[li + 1]) ?? 0); li += 2
    default: print("unknown option \(args[li])"); exit(2)
    }
  }
  guard let ldata = FileManager.default.contents(atPath: args[2]), var limg = Prep.decode(ldata, maxPx: lmax).image else { print("unreadable"); exit(1) }
  if lcrop > 0 {
    let W = CGFloat(limg.width), H = CGFloat(limg.height)
    guard let c = limg.cropping(to: CGRect(x: W * lcrop, y: H * lcrop, width: W * (1 - 2 * lcrop), height: H * (1 - 2 * lcrop)).integral) else { exit(1) }
    limg = c
    let f = Double(lcrop)
    lboxes = lboxes.map { g in var g = g; if let b = g["box"] as? [Double] { g["box"] = b.map { (($0 / 1000 - f) / (1 - 2 * f)) * 1000 } }; return g }
  }
  let lres = LegTaper.run(limg, boxes: lboxes)
  var lout = lres.json
  lout["photo"] = args[2]; lout["max"] = Int(lmax); lout["crop"] = Double(lcrop)
  try writeJSON(lout, args[3])
  if let o = lover, !lres.lines.isEmpty { try LegTaper.overlay(limg, hide: lres.hide, lines: lres.lines, to: URL(fileURLWithPath: o)) }
  let lsum = ((lout["legs"] as? [[String: Any]]) ?? []).map { leg -> String in
    let d = leg["split"] as? [String: Any] ?? [:]
    return "\(leg["side"] ?? "?"): h/k=\(d["hemToKnee"] ?? "-") k/t=\(d["kneeToThigh"] ?? "-") o/s=\(d["openToShoe"] ?? "-")"
  }
  print(lsum.joined(separator: " · "))

case "hems":
  // kmeasure hems <photo.jpg> <out.json> [--boxes garments.json] [--overlay out.jpg] [--max px] [--crop share]
  guard args.count >= 4 else { print("bad args"); exit(2) }
  var hboxes: [[String: Any]] = [], hover: String?, hmax = Prep.workPx, hcrop: CGFloat = 0
  var hi = 4
  while hi < args.count {
    switch args[hi] {
    case "--boxes": if let d = FileManager.default.contents(atPath: args[hi + 1]), let l = try JSONSerialization.jsonObject(with: d) as? [[String: Any]] { hboxes = l }; hi += 2
    case "--overlay": hover = args[hi + 1]; hi += 2
    case "--max": hmax = CGFloat(Double(args[hi + 1]) ?? 2048); hi += 2
    case "--crop": hcrop = CGFloat(Double(args[hi + 1]) ?? 0); hi += 2
    default: print("unknown option \(args[hi])"); exit(2)
    }
  }
  guard let hdata = FileManager.default.contents(atPath: args[2]), var himg = Prep.decode(hdata, maxPx: hmax).image else { print("unreadable"); exit(1) }
  if hcrop > 0 {
    let W = CGFloat(himg.width), H = CGFloat(himg.height)
    guard let c = himg.cropping(to: CGRect(x: W * hcrop, y: H * hcrop, width: W * (1 - 2 * hcrop), height: H * (1 - 2 * hcrop)).integral) else { exit(1) }
    himg = c
    let f = Double(hcrop)
    hboxes = hboxes.map { g in var g = g; if let b = g["box"] as? [Double] { g["box"] = b.map { (($0 / 1000 - f) / (1 - 2 * f)) * 1000 } }; return g }
  }
  let hres = HemProbe.run(himg, boxes: hboxes)
  var hout = hres.json
  hout["photo"] = args[2]; hout["max"] = Int(hmax); hout["crop"] = Double(hcrop)
  try writeJSON(hout, args[3])
  if let o = hover, let hidden = hres.hidden { try HemProbe.overlay(hidden, marks: hres.marks, to: URL(fileURLWithPath: o)) }
  let hsum = ((hout["legs"] as? [[String: Any]]) ?? []).map { leg -> String in
    "\(leg["side"] ?? "?"): hem=\(leg["tHem"] ?? "-") gap=\(leg["gapT"] ?? "-") vis/w=\(leg["shoeVisToW"] ?? "-") folds=\(leg["folds"] ?? "-") fr=\(leg["foldRatio"] ?? "-") spread=\(leg["spread"] ?? "-") \(leg["why"] ?? "")"
  }
  print(hsum.joined(separator: " · "))

case "waist":
  // kmeasure waist <photo.jpg> <out.json> [--overlay out.jpg] [--max px] [--crop share]
  //   The waist ruler (WaistRuler.swift, DECISIONS-LOG #264): the visual waistline the clothes make, against a ruler from his joints.
  guard args.count >= 4 else { print("bad args"); exit(2) }
  var wover: String?, wmax = Prep.workPx, wcrop: CGFloat = 0, wpitch = 0.0
  var wi = 4
  while wi < args.count {
    switch args[wi] {
    case "--overlay": wover = args[wi + 1]; wi += 2
    case "--max": wmax = CGFloat(Double(args[wi + 1]) ?? 2048); wi += 2
    case "--crop": wcrop = CGFloat(Double(args[wi + 1]) ?? 0); wi += 2
    case "--pitch": wpitch = Double(args[wi + 1]) ?? 0; wi += 2
    default: print("unknown option \(args[wi])"); exit(2)
    }
  }
  guard let wdata = FileManager.default.contents(atPath: args[2]), var wimg = Prep.decode(wdata, maxPx: wmax).image else { print("unreadable"); exit(1) }
  if wcrop > 0 {
    let W = CGFloat(wimg.width), H = CGFloat(wimg.height)
    guard let c = wimg.cropping(to: CGRect(x: W * wcrop, y: H * wcrop, width: W * (1 - 2 * wcrop), height: H * (1 - 2 * wcrop)).integral) else { exit(1) }
    wimg = c
  }
  if wpitch != 0, let t = tiltCamera(wimg, degrees: wpitch) { wimg = t }
  let wres = Waist.run(wimg)
  var wout = wres.json
  wout["photo"] = args[2]; wout["max"] = Int(wmax); wout["crop"] = Double(wcrop); wout["pitch"] = wpitch
  try writeJSON(wout, args[3])
  if let o = wover, wres.rgb != nil, let hidden = Prep.hideRegions(wimg, wres.hide), let rgb = Measure.rgb(hidden, maxSide: Measure.statPx) {
    Waist.overlay(rgb, wout, wres.geo, to: URL(fileURLWithPath: o))
  }
  print(((wout["waist"] as? [String: Any])?["value"] as? String) ?? (wout["status"] as? String ?? "?"))

case "people":
  // kmeasure people [--out dir] <photo.jpg>...: who's in each fit photo (Oct 14, "Which one is you?"). One JSON line per
  // photo: the old rule (any other box at least 25% of the biggest → multiplePeople) and today's Prep.locate. With --out,
  // the copy that would be sent (everyone else covered, faces hidden) for every photo with someone else, as
  // <stem>.sent.jpg; a "multiplePeople" photo is written once per candidate picked (<stem>.pick<i>.jpg).
  var outDir: String? = nil
  var files = Array(args.dropFirst(2))
  if files.first == "--out", files.count >= 2 { outDir = files[1]; files = Array(files.dropFirst(2)) }
  for path in files {
    guard let img = load(path) else { print("{\"photo\":\"\(path)\",\"error\":\"unreadable\"}"); continue }
    let W = CGFloat(img.width), H = CGFloat(img.height)
    let req = VNDetectHumanRectanglesRequest()
    req.upperBodyOnly = false
    try? VNImageRequestHandler(cgImage: img, orientation: .up).perform([req])
    let det = (req.results ?? []).filter { $0.confidence > 0.3 }
      .map { (CGRect(x: $0.boundingBox.minX * W, y: (1 - $0.boundingBox.maxY) * H, width: $0.boundingBox.width * W, height: $0.boundingBox.height * H), $0.confidence) }
      .sorted { Prep.area($0.0) > Prep.area($1.0) }
    let oldMulti = det.count >= 2 && det.dropFirst().contains { Prep.area($0.0) >= Prep.otherPersonShare * Prep.area(det[0].0) }
    let f = Prep.locate(img)
    let inst = det.count >= 2 ? Prep.personInstances(img) : nil
    var row: [String: Any] = [
      "photo": path, "old": oldMulti ? "multiplePeople" : "-", "new": f.status, "others": f.others.count, "candidates": f.candidates.count,
      "boxes": det.map { d -> [String: Any] in
        var b: [String: Any] = ["share": Double((Prep.area(d.0) / Prep.area(det[0].0) * 100).rounded() / 100), "conf": Double((d.1 * 100).rounded() / 100),
          "inside": Double((Prep.area(d.0.intersection(det[0].0)) / max(1, Prep.area(d.0)) * 100).rounded() / 100),
          "box": [Int(d.0.minX / W * 100), Int(d.0.minY / H * 100), Int(d.0.width / W * 100), Int(d.0.height / H * 100)]]
        if let inst { let c = inst.counts(d.0, W: W, H: H); b["labels"] = Dictionary(uniqueKeysWithValues: c.labels.map { ("\($0.key)", Double((CGFloat($0.value) / CGFloat(max(1, c.all)) * 100).rounded() / 100)) }) }
        return b
      },
    ]
    if let inst { row["instanceMask"] = [inst.w, inst.h] }
    // The guarantees: every other person's box is covered (or is his own box), and picking candidate i makes i him.
    func coveredShare(_ found: Prep.Located, _ o: CGRect) -> Double {
      guard let c = found.cover, let main = found.main else { return 0 }
      var on = 0, all = 0
      let sx = CGFloat(c.w) / W, sy = CGFloat(c.h) / H
      for y in max(0, Int(o.minY * sy))..<min(c.h, Int(o.maxY * sy) + 1) {
        for x in max(0, Int(o.minX * sx))..<min(c.w, Int(o.maxX * sx) + 1) {
          all += 1
          if c.px[y * c.w + x] > 127 || main.contains(CGPoint(x: (CGFloat(x) + 0.5) / sx, y: (CGFloat(y) + 0.5) / sy)) { on += 1 }
        }
      }
      return all > 0 ? Double(on) / Double(all) : 1
    }
    if f.status == "ok", !f.others.isEmpty { row["coverMin"] = f.others.map { (coveredShare(f, $0) * 100).rounded() / 100 }.min() ?? 1 }
    if f.status == "multiplePeople" {
      row["picks"] = f.candidates.enumerated().map { i, c -> String in
        let p = Prep.locate(img, pick: c)
        return "\(p.status)\(p.status == "ok" ? (p.picked == i && p.main == c ? " him" : " WRONG") : "")\(p.status == "ok" ? " cover \(p.others.map { (coveredShare(p, $0) * 100).rounded() / 100 }.min() ?? 1)" : "")"
      }
    }
    let d = try JSONSerialization.data(withJSONObject: row, options: [.sortedKeys])
    print(String(data: d, encoding: .utf8)!)
    if let outDir {
      let stem = URL(fileURLWithPath: path).deletingPathExtension().lastPathComponent
      func write(_ found: Prep.Located, _ name: String) throws {
        guard found.status == "ok" else { return }
        let covered = found.cover.map { Prep.coverOthers(img, $0) } ?? img
        guard let c = covered, let hidden = Prep.hideRegions(c, found.hide) else { return }
        _ = try Prep.writeJPEG(hidden, longEdge: 1024, quality: 0.8, to: URL(fileURLWithPath: outDir).appendingPathComponent(name))
      }
      if f.status == "multiplePeople" {
        for (i, c) in f.candidates.enumerated() { try write(Prep.locate(img, pick: c), "\(stem).pick\(i).jpg") }
      } else if !f.others.isEmpty { try write(f, "\(stem).sent.jpg") }
    }
  }

default:
  print("unknown command"); exit(2)
}
