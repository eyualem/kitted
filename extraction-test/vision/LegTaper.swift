// The leg probe (Oct 9, Mac harness only; rubric/research/notes/leg-probe.md): can the phone tell a pant leg's
// shape (skinny / slim / straight / relaxed / wide) from the photo with no AI?
//
// Rules it keeps (founder, #164):
//   - Garment-to-garment ratios only: the pants' width at the hem over its width at the knee, the knee over the
//     thigh, the opening over the shoe's own width. Never a garment against his body (hips, thighs,
//     shoulders): that scales with body size and drifts toward rating bodies.
//   - Body joints only say WHERE to measure (each leg's hip → knee → ankle line, and the heights on it) and
//     whether a sample can be trusted (an arm or hand on the leg, legs merged, a side view). They are never
//     a denominator, and no body width is reported.
//   - Widths come from the person outline (Vision's segmentation) inside the closet call's bottoms box, so
//     dark-on-dark outfits don't need a color step. Color is used only to check that a sample is on the pants
//     (the pants' own color on the shin), never a skin color.
// The numbers go out raw with every gate's verdict; leg_probe.py picks the thresholds.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum LegTaper {
  typealias Joint = Ruler.Joint

  static var jointMin = 0.3
  /// Where on each leg (t along hip→knee for the thigh, knee→ankle for the hem).
  static var thighT = 0.25, hemT = 0.87
  /// Each width is the median over a short window of rows around its spot (± this share of the segment).
  static var window = 0.04
  /// A sample's color must stay within this ΔE (kL 1) of the pants' own color on the shin to count.
  static var sameGarment = 18.0

  struct Sample {
    var width: Double? // px of the statistics copy, across the leg's axis
    var why: String = "" // the gate that failed, when width is nil
    var split = false // the legs touch here: the width was cut halfway between the two legs' lines
    var t: Double? // where it was measured (hem: the lowest spot that still reads as the pants)
    var line: (CGPoint, CGPoint)? // the measured run, for the overlay
    var json: [String: Any] {
      var d: [String: Any] = [:]
      if let width { d["w"] = (width * 10).rounded() / 10 }
      if !why.isEmpty { d["why"] = why }
      if split { d["split"] = true }
      if let t { d["t"] = (t * 100).rounded() / 100 }
      return d
    }
  }

  // MARK: Geometry helpers

  static func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t) }
  static func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { hypot(a.x - b.x, a.y - b.y) }

  /// Do segments p1p2 and q1q2 cross?
  static func crosses(_ p1: CGPoint, _ p2: CGPoint, _ q1: CGPoint, _ q2: CGPoint) -> Bool {
    func o(_ a: CGPoint, _ b: CGPoint, _ c: CGPoint) -> CGFloat { (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) }
    let d1 = o(q1, q2, p1), d2 = o(q1, q2, p2), d3 = o(p1, p2, q1), d4 = o(p1, p2, q2)
    return (d1 > 0) != (d2 > 0) && (d3 > 0) != (d4 > 0)
  }

  static func segmentHitsRect(_ a: CGPoint, _ b: CGPoint, _ r: CGRect) -> Bool {
    if r.contains(a) || r.contains(b) { return true }
    let c = [CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.minY), CGPoint(x: r.maxX, y: r.maxY), CGPoint(x: r.minX, y: r.maxY)]
    return (0..<4).contains { crosses(a, b, c[$0], c[($0 + 1) % 4]) }
  }

  static func on(_ m: Guide.Gray, _ p: CGPoint) -> Bool {
    let x = Int(p.x.rounded()), y = Int(p.y.rounded())
    guard x >= 0, y >= 0, x < m.w, y < m.h else { return false }
    return m.px[y * m.w + x] >= 128
  }

  static func labAt(_ rgb: Measure.RGB, _ p: CGPoint) -> Measure.Lab? {
    let x = Int(p.x.rounded()), y = Int(p.y.rounded())
    guard x >= 0, y >= 0, x < rgb.w, y < rgb.h else { return nil }
    let j = (y * rgb.w + x) * 4
    return Measure.lab(rgb.px[j], rgb.px[j + 1], rgb.px[j + 2])
  }

  static func de1(_ a: Measure.Lab, _ b: Measure.Lab) -> Double {
    sqrt((a.L - b.L) * (a.L - b.L) + (a.a - b.a) * (a.a - b.a) + (a.b - b.b) * (a.b - b.b))
  }

  // MARK: One width across a leg

  struct Scene {
    let rgb: Measure.RGB
    let mask: Guide.Gray
    let box: CGRect // the bottoms box, a little grown
    let tops: [CGRect] // top and outer layer boxes
    let hands: [CGRect]
    let forearms: [(CGPoint, CGPoint)] // elbow → just past the wrist (into the hand)
    let wrists: [CGPoint]
  }

  /// The run of his outline across the segment a→b at t (perpendicular to it), inside the bottoms box.
  /// `other` is the other leg's matching point: a run that reaches it means the legs touch there.
  static func run(_ s: Scene, _ a: CGPoint, _ b: CGPoint, t: Double, other: CGPoint?, maxHalf: CGFloat) -> (lo: CGFloat, hi: CGFloat, p: CGPoint, n: CGPoint, merged: Bool, split: Bool)? {
    let dx = b.x - a.x, dy = b.y - a.y
    let len = max(1, hypot(dx, dy))
    let n = CGPoint(x: -dy / len, y: dx / len)
    var p = lerp(a, b, CGFloat(t))
    func at(_ off: CGFloat) -> CGPoint { CGPoint(x: p.x + n.x * off, y: p.y + n.y * off) }
    func inside(_ q: CGPoint) -> Bool { on(s.mask, q) && s.box.contains(q) }
    // The axis may run along the leg's edge: start from the nearest pixel of his inside the box.
    if !inside(p) {
      var found: CGFloat? = nil
      var k: CGFloat = 0.5
      while k <= maxHalf * 0.5 {
        if inside(at(k)) { found = k; break }
        if inside(at(-k)) { found = -k; break }
        k += 0.5
      }
      guard let f = found else { return nil }
      p = at(f)
    }
    var lo: CGFloat = 0, hi: CGFloat = 0
    let far = maxHalf * 2.5 // walk on past the limit so the other leg's line can be found inside a merged run
    while lo > -far, inside(at(lo - 0.5)) { lo -= 0.5 }
    while hi < far, inside(at(hi + 0.5)) { hi += 0.5 }
    var merged = false, split = false
    if let o = other {
      let s2 = (o.x - p.x) * n.x + (o.y - p.y) * n.y
      if s2 >= lo - 1, s2 <= hi + 1 {
        merged = true
        // Split variant: cut the run halfway between the two legs' lines (the legs touch; the inner edge is a guess).
        if abs(s2) > 4 { split = true; if s2 > 0 { hi = min(hi, s2 / 2) } else { lo = max(lo, s2 / 2) } }
      }
    }
    // Still at the search limit after any cut: it runs into an arm, a coat or the other leg's far side.
    if lo <= -maxHalf || hi >= maxHalf { return (lo, hi, p, n, true, false) }
    return (lo, hi, p, n, merged, split)
  }

  /// The median width over a short window around t, with every gate checked.
  static func width(_ s: Scene, _ a: CGPoint, _ b: CGPoint, t: Double, otherA: CGPoint?, otherB: CGPoint?, pantsRef: Measure.Lab?, checkTops: Bool, allowSplit: Bool = false) -> Sample {
    let seg = dist(a, b)
    let maxHalf = seg * 0.6
    var ws: [Double] = [], whys: [String: Int] = [:], splits = 0
    var line: (CGPoint, CGPoint)? = nil
    let ts = Swift.stride(from: t - window, through: t + window + 1e-9, by: window / 2).map { $0 }
    for tt in ts {
      let other = (otherA != nil && otherB != nil) ? lerp(otherA!, otherB!, CGFloat(tt)) : nil
      guard let r = run(s, a, b, t: tt, other: other, maxHalf: maxHalf) else { whys["off his outline", default: 0] += 1; continue }
      let e1 = CGPoint(x: r.p.x + r.n.x * r.lo, y: r.p.y + r.n.y * r.lo), e2 = CGPoint(x: r.p.x + r.n.x * r.hi, y: r.p.y + r.n.y * r.hi)
      if r.merged, !(allowSplit && r.split) { whys["legs merged", default: 0] += 1; continue }
      if r.merged { splits += 1 }
      if s.forearms.contains(where: { crosses(e1, e2, $0.0, $0.1) }) || s.hands.contains(where: { segmentHitsRect(e1, e2, $0) })
          || s.wrists.contains(where: { w in dist(w, lerp(e1, e2, 0.5)) < max(6, (r.hi - r.lo) * 0.7) }) {
        whys["arm or hand on the leg", default: 0] += 1; continue
      }
      if checkTops, s.tops.contains(where: { $0.maxY > r.p.y && $0.minX < max(e1.x, e2.x) && $0.maxX > min(e1.x, e2.x) }) {
        whys["top hangs over it", default: 0] += 1; continue
      }
      if let ref = pantsRef {
        // The middle of the run must be the pants' own color (not a sock, skin or the shoe).
        let labs = (0..<5).compactMap { k -> Measure.Lab? in
          let off = r.lo + (r.hi - r.lo) * (0.3 + 0.1 * CGFloat(k))
          return labAt(s.rgb, CGPoint(x: r.p.x + r.n.x * off, y: r.p.y + r.n.y * off))
        }
        if let m = Ruler.medianLab(labs), de1(m, ref) > sameGarment { whys["not the pants' color", default: 0] += 1; continue }
      }
      ws.append(Double(r.hi - r.lo + 1))
      if abs(tt - t) < 1e-6 { line = (e1, e2) }
      if line == nil { line = (e1, e2) }
    }
    if ws.count >= 3 { return Sample(width: Ruler.median(ws), split: splits * 2 > ws.count, t: t, line: line) }
    let why = whys.max { $0.value < $1.value }?.key ?? "no samples"
    return Sample(width: nil, why: why, line: nil)
  }

  // MARK: The shoe's own width

  /// The shoe under this leg: his outline inside the footwear box, in this leg's half (split halfway between
  /// the two ankles), widest steady row in the box's lower 60% (the 80th percentile of the row widths).
  static func shoeWidth(_ s: Scene, shoes: [CGRect], ankle: CGPoint, otherAnkle: CGPoint?) -> Sample {
    // This foot's box: the one around the ankle's x (the closet call boxes a pair or each shoe).
    func near(_ r: CGRect) -> Bool { ankle.x >= r.minX - r.width * 0.1 && ankle.x <= r.maxX + r.width * 0.1 }
    guard let shoe = shoes.filter(near).min(by: { abs($0.midY - ankle.y) < abs($1.midY - ankle.y) }) else { return Sample(width: nil, why: "no shoe box for this foot") }
    var minX = shoe.minX, maxX = shoe.maxX
    if let o = otherAnkle, o.x >= shoe.minX, o.x <= shoe.maxX, ankle.x >= shoe.minX, ankle.x <= shoe.maxX {
      // Both feet in one box: split it halfway between the ankles.
      let mid = (ankle.x + o.x) / 2
      if abs(ankle.x - o.x) < shoe.width * 0.2 { return Sample(width: nil, why: "feet overlap") }
      if o.x > ankle.x { maxX = min(maxX, mid) } else { minX = max(minX, mid) }
    }
    guard maxX - minX >= 4 else { return Sample(width: nil, why: "shoe box too narrow for this leg") }
    var widths: [Double] = []
    var bestLine: (CGPoint, CGPoint)? = nil
    let y0 = Int((shoe.minY + shoe.height * 0.4).rounded()), y1 = Int(shoe.maxY.rounded())
    let ya = max(0, y0), yb = min(s.mask.h - 1, y1)
    guard yb > ya else { return Sample(width: nil, why: "shoe box outside the photo") }
    for y in ya...yb {
      // The run through the column nearest the ankle's x that is on his outline.
      let cx = Int(min(max(ankle.x, minX), maxX).rounded())
      var start: Int? = nil
      for d in 0...Int(maxX - minX) {
        for x in [cx - d, cx + d] where x >= Int(minX) && x <= Int(maxX) && x >= 0 && x < s.mask.w {
          if s.mask.px[y * s.mask.w + x] >= 128 { start = x; break }
        }
        if start != nil { break }
      }
      guard let st = start else { continue }
      var a = st, b = st
      while a - 1 >= Int(minX), a - 1 >= 0, s.mask.px[y * s.mask.w + a - 1] >= 128 { a -= 1 }
      while b + 1 <= Int(maxX), b + 1 < s.mask.w, s.mask.px[y * s.mask.w + b + 1] >= 128 { b += 1 }
      widths.append(Double(b - a + 1))
      if bestLine == nil || Double(b - a + 1) > Double(dist(bestLine!.0, bestLine!.1)) { bestLine = (CGPoint(x: a, y: y), CGPoint(x: b, y: y)) }
    }
    guard widths.count >= 4 else { return Sample(width: nil, why: "shoe not on his outline") }
    let sorted = widths.sorted()
    let w = sorted[min(sorted.count - 1, Int(Double(sorted.count) * 0.8))]
    // A run that fills this leg's whole half of the box touches the other shoe or the box edge.
    if w >= Double(maxX - minX) - 1 { return Sample(width: w, why: "shoe fills its half of the box", line: bestLine) }
    return Sample(width: w, line: bestLine)
  }

  // MARK: The whole probe

  static func run(_ img: CGImage, boxes list: [[String: Any]]) -> (json: [String: Any], lines: [(CGPoint, CGPoint)], joints: [String: Joint], hide: [CGRect], rgb: Measure.RGB?) {
    let env = ProcessInfo.processInfo.environment
    if let v = env["LEG_HEM_T"].flatMap(Double.init) { hemT = v }
    if let v = env["LEG_THIGH_T"].flatMap(Double.init) { thighT = v }
    if let v = env["LEG_SAME"].flatMap(Double.init) { sameGarment = v }
    let t0 = CFAbsoluteTimeGetCurrent()
    let located = Prep.locate(img)
    guard located.status == "ok", let rgb = Measure.rgb(img, maxSide: Measure.statPx) else {
      return (["status": located.status], [], [:], [], nil)
    }
    let scale = CGFloat(rgb.w) / CGFloat(img.width)
    guard let mask = Measure.personMask(img, w: rgb.w, h: rgb.h) else { return (["status": "no person mask"], [], [:], [], nil) }
    let j = Ruler.pose(img, main: located.main, scale: scale)
    let hands = Measure.handBoxes(img).map { CGRect(x: $0.minX * scale, y: $0.minY * scale, width: $0.width * scale, height: $0.height * scale) }
    let W = CGFloat(rgb.w), H = CGFloat(rgb.h)
    struct B { let cat: String; let sub: String; let rect: CGRect }
    let boxes: [B] = list.compactMap { g in
      guard let c = g["category"] as? String, let b = g["box"] as? [Double], b.count == 4 else { return nil }
      return B(cat: c, sub: g["subcategory"] as? String ?? "", rect: CGRect(x: b[1] / 1000 * W, y: b[0] / 1000 * H, width: (b[3] - b[1]) / 1000 * W, height: (b[2] - b[0]) / 1000 * H))
    }
    func ok(_ k: String) -> CGPoint? { j[k].flatMap { $0.c >= jointMin ? $0.p : nil } }
    var out: [String: Any] = ["status": "ok", "w": rgb.w, "h": rgb.h,
                              "joints": j.mapValues { ["x": Int($0.p.x), "y": Int($0.p.y), "c": ($0.c * 100).rounded() / 100] }]
    var lines: [(CGPoint, CGPoint)] = []
    let bottom = boxes.filter { $0.cat == "bottom" }.max { $0.rect.height < $1.rect.height }
    let shoes = boxes.filter { $0.cat == "footwear" }.map(\.rect)
    out["bottom"] = bottom.map { $0.sub } ?? NSNull()
    out["box"] = bottom != nil
    // Without the closet call's bottoms box the probe would also measure a long coat or an arm: report the
    // numbers (inside the whole frame) but mark the gate.
    let grown = bottom.map { $0.rect.insetBy(dx: -$0.rect.width * 0.06, dy: -$0.rect.height * 0.03) } ?? CGRect(x: 0, y: 0, width: W, height: H)
    var forearms: [(CGPoint, CGPoint)] = [], wrists: [CGPoint] = []
    for side in ["l", "r"] {
      if let e = ok("\(side)Elbow"), let w = ok("\(side)Wrist") {
        forearms.append((e, lerp(e, w, 1.35))); wrists.append(w)
      } else if let w = ok("\(side)Wrist") { wrists.append(w) }
    }
    let scene = Scene(rgb: rgb, mask: mask, box: grown, tops: boxes.filter { $0.cat == "top" || $0.cat == "outerwear" }.map(\.rect),
                      hands: hands, forearms: forearms, wrists: wrists)
    // A side view (hips nearly on top of each other) shows a leg's depth, not its width.
    var side = false
    if let lh = ok("lHip"), let rh = ok("rHip"), let n = ok("neck") {
      let torso = abs((lh.y + rh.y) / 2 - n.y)
      if torso > 10 { side = dist(lh, rh) / torso < 0.18; out["sideView"] = side }
    }
    var legs: [[String: Any]] = []
    for s in ["l", "r"] {
      let o = s == "l" ? "r" : "l"
      var leg: [String: Any] = ["side": s]
      guard let hip = ok("\(s)Hip"), let knee = ok("\(s)Knee") else { leg["why"] = "hip or knee"; legs.append(leg); continue }
      let ankle = ok("\(s)Ankle")
      let conf = [j["\(s)Hip"]?.c, j["\(s)Knee"]?.c, j["\(s)Ankle"]?.c].map { $0 ?? 0 }.min() ?? 0
      leg["conf"] = (conf * 100).rounded() / 100
      if let a = ankle { leg["bend"] = Int(Ruler.angle(hip, knee, knee, a)) }
      let oHip = ok("\(o)Hip"), oKnee = ok("\(o)Knee"), oAnkle = ok("\(o)Ankle")
      // The pants' own color: the middle of the shin (or the lower thigh when the shin is missing).
      var refLabs: [Measure.Lab] = []
      if let a = ankle {
        for t in Swift.stride(from: 0.3, through: 0.6, by: 0.05) { if let r = run(scene, knee, a, t: t, other: nil, maxHalf: dist(knee, a) * 0.6), let l = labAt(rgb, r.p) { refLabs.append(l) } }
      }
      if refLabs.count < 3 {
        for t in Swift.stride(from: 0.55, through: 0.8, by: 0.05) { if let r = run(scene, hip, knee, t: t, other: nil, maxHalf: dist(hip, knee) * 0.6), let l = labAt(rgb, r.p) { refLabs.append(l) } }
      }
      let ref = Ruler.medianLab(refLabs)
      // Each width twice: strict (a spot where the legs touch is unsure) and split (cut halfway between the legs).
      func measureAll(_ split: Bool) -> [String: Sample] {
        var m: [String: Sample] = [:]
        m["thigh"] = width(scene, hip, knee, t: thighT, otherA: oHip, otherB: oKnee, pantsRef: nil, checkTops: true, allowSplit: split)
        if let a = ankle {
          m["knee"] = width(scene, knee, a, t: 0.0 + window, otherA: oKnee, otherB: oAnkle, pantsRef: ref, checkTops: true, allowSplit: split)
        } else {
          m["knee"] = width(scene, hip, knee, t: 1.0 - window, otherA: oHip, otherB: oKnee, pantsRef: ref, checkTops: true, allowSplit: split)
        }
        var hem = Sample(width: nil, why: "ankle not found")
        var opening = Sample(width: nil, why: "ankle not found")
        if let a = ankle {
          if a.y > H - 2 || a.x < 1 || a.x > W - 2 {
            hem.why = "ankle at the photo's edge"; opening.why = hem.why
          } else if let b = bottom, b.rect.maxY < lerp(knee, a, 0.7).y {
            hem.why = "pants end above the hem sample (cropped)"; opening.why = hem.why
          } else {
            // The hem: the lowest spot from `hemT` up to 0.7 of the shin that still reads as the pants (a rolled
            // cuff, a sock or the shoe below it fails the color gate). The opening: the same from 0.95.
            var firstWhy = ""
            for t in Swift.stride(from: hemT, through: 0.7, by: -0.03) {
              let x = width(scene, knee, a, t: t, otherA: oKnee, otherB: oAnkle, pantsRef: ref, checkTops: false, allowSplit: split)
              if x.width != nil { hem = x; break }
              if firstWhy.isEmpty { firstWhy = x.why }
            }
            if hem.width == nil { hem.why = firstWhy }
            for t in Swift.stride(from: 0.95, through: hemT, by: -0.03) {
              let x = width(scene, knee, a, t: t, otherA: oKnee, otherB: oAnkle, pantsRef: ref, checkTops: false, allowSplit: split)
              if x.width != nil { opening = x; break }
            }
            if opening.width == nil { opening = hem }
          }
        }
        m["hem"] = hem; m["opening"] = opening
        return m
      }
      let strict = measureAll(false), loose = measureAll(true)
      var shoeW = Sample(width: nil, why: "no shoe box")
      if !shoes.isEmpty, let a = ankle { shoeW = shoeWidth(scene, shoes: shoes, ankle: a, otherAnkle: oAnkle) }
      func ratio(_ a: Sample?, _ b: Sample?) -> Any {
        guard let x = a?.width, let y = b?.width, y > 0 else { return NSNull() }
        return (x / y * 1000).rounded() / 1000
      }
      for (name, m) in [("strict", strict), ("split", loose)] {
        var d: [String: Any] = [:]
        for (k, v) in m { d[k] = v.json }
        d["hemToKnee"] = ratio(m["hem"], m["knee"])
        d["kneeToThigh"] = ratio(m["knee"], m["thigh"])
        d["openToShoe"] = shoeW.why.isEmpty ? ratio(m["opening"], shoeW) : NSNull()
        leg[name] = d
      }
      leg["shoe"] = shoeW.json
      let thigh = loose["thigh"]!, kneeW = loose["knee"]!, hem = loose["hem"]!, opening = loose["opening"]!
      for smp in [thigh, kneeW, hem, opening, shoeW] { if let l = smp.line { lines.append(l) } }
      lines.append((hip, knee)); if let a = ankle { lines.append((knee, a)) }
      legs.append(leg)
    }
    out["legs"] = legs
    out["ms"] = Int((CFAbsoluteTimeGetCurrent() - t0) * 1000)
    return (out, lines, j, located.hide, rgb)
  }

  /// The measured runs drawn on the face-hidden copy (never the kept photo).
  static func overlay(_ img: CGImage, hide: [CGRect], lines: [(CGPoint, CGPoint)], to url: URL) throws {
    guard let hidden = Prep.hideRegions(img, hide), let rgb = Measure.rgb(hidden, maxSide: Measure.statPx) else { return }
    var px = rgb.px
    guard let ctx = px.withUnsafeMutableBytes({ raw in
      CGContext(data: raw.baseAddress, width: rgb.w, height: rgb.h, bitsPerComponent: 8, bytesPerRow: rgb.w * 4,
                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    }) else { return }
    ctx.translateBy(x: 0, y: CGFloat(rgb.h)); ctx.scaleBy(x: 1, y: -1)
    ctx.setStrokeColor(CGColor(srgbRed: 1, green: 0.1, blue: 0.6, alpha: 1)); ctx.setLineWidth(2)
    for (a, b) in lines { ctx.move(to: a); ctx.addLine(to: b); ctx.strokePath() }
    guard let out = ctx.makeImage(), let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, out, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
    CGImageDestinationFinalize(dest)
  }
}
