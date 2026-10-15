// The waist ruler (DECISIONS-LOG #264, Mac harness only): where the clothes put the visual waistline, read
// against an anatomical estimate from his joints. Written against the app's own Prep/Measure/Guide and the fit
// ruler's helpers (FitRuler.swift), so it could move into app/modules/kitted-vision/ios if it ever earns a place.
//
// The founder's idea (Oct 14): the anatomical waist and the visual waistline are different things. The body gives a
// RULER (his shoulders, hips and knees); the clothes set the visual waistline (a tuck, a short top, a belt, a long tee
// lowering it). This measures the second against the first.
//
// Rules it keeps (CLAUDE.md "The product", #187):
//   - The body is only a ruler. The joints and the landmark estimates are never reported as a judgment, never scored,
//     never stored; the same method and constants apply to everyone. Outputs are garment positions in body units.
//   - Garment against garment (top color vs pants color, pants width at the thigh vs the shin) or garment against
//     the skeleton. Never a garment width against the body, never a skin color.
//   - Every joint passes a confidence gate; anything it can't see or tell apart is "unsure".
//
// Geometry: the body axis runs from the middle of his hip joints H up to the middle of his shoulders S. T = |S − H|
// ("one torso"). A position s is measured along that axis from H, in torsos: s > 0 above the hip joints, s = 1 at
// the shoulders. The torso strip is sampled across the axis, ±`stripHalf` around it, inside his outline, his hands
// and the phone left out.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

enum Waist {
  typealias Lab = Measure.Lab

  // MARK: Settings (WAIST_<NAME>=value overrides, for tuning on the dev photos only)

  /// Anatomical landmarks from published adult-male proportions (rubric/research/notes/waist-research.md):
  /// the natural waist and the iliac crest above the hip joints in torsos, the crotch below them in hip→knee lengths.
  static var kWaist = 0.33, kCrest = 0.27, kCrotch = 0.20
  /// The waist shows (a tuck, a short top, a visible waistband) when the pants start at or above s = waistCut.
  static var waistCut = -0.02 // frozen on the dev photos, Oct 14 (#264)
  /// A band of "neither" color thinner than this (torsos) between the top and the pants is a waistband or belt.
  static var bandMax = 0.10
  /// Two garments closer than this (ΔE, lightness whole) can't be split by color.
  static var sameMax = 14.0
  /// The torso strip's half-width: this share of half the hip-joint spacing, at least `stripMin` torsos.
  static var stripShare = 0.9, stripMin = 0.10
  /// A row needs this share of its strip on his body to count.
  static var rowOn = 0.35
  static var hold = 0.06 // torsos a change must last
  static var edgeK = 2.2 // an edge peak must be this many times the strip's median edge strength

  static func applyOverrides() {
    let env = ProcessInfo.processInfo.environment
    func d(_ k: String) -> Double? { env["WAIST_\(k)"].flatMap(Double.init) }
    if let v = d("K_WAIST") { kWaist = v }
    if let v = d("K_CREST") { kCrest = v }
    if let v = d("K_CROTCH") { kCrotch = v }
    if let v = d("CUT") { waistCut = v }
    if let v = d("BAND") { bandMax = v }
    if let v = d("SAME") { sameMax = v }
    if let v = d("STRIP") { stripShare = v }
    if let v = d("STRIP_MIN") { stripMin = v }
    if let v = d("ROW_ON") { rowOn = v }
    if let v = d("HOLD") { hold = v }
    if let v = d("EDGE_K") { edgeK = v }
  }

  static func r3(_ x: Double) -> Double { (x * 1000).rounded() / 1000 }

  /// One row of the torso strip at position s.
  struct Row {
    let s: Double
    let n: Int // pixels on his body
    let on: Double // share of the strip on his body
    let top: Double // share of those closer to the top's color
    let bot: Double // share closer to the pants' color
    let edge: Double // mean |ΔL| across the row (lightness change along the axis): a hem casts a line
  }

  struct Geo {
    let H: CGPoint, S: CGPoint, up: CGVector, across: CGVector, T: CGFloat, thigh: CGFloat, half: CGFloat
    func at(_ s: Double, _ x: CGFloat) -> CGPoint {
      CGPoint(x: H.x + up.dx * CGFloat(s) * T + across.dx * x, y: H.y + up.dy * CGFloat(s) * T + across.dy * x)
    }
  }

  static func geometry(_ j: [String: Ruler.Joint]) -> (Geo?, String) {
    guard let ls = Ruler.ok(j["lShoulder"]), let rs = Ruler.ok(j["rShoulder"]) else { return (nil, "shoulders") }
    guard let lh = Ruler.ok(j["lHip"], Ruler.hipMin), let rh = Ruler.ok(j["rHip"], Ruler.hipMin) else { return (nil, "hips") }
    let knees = [Ruler.ok(j["lKnee"]), Ruler.ok(j["rKnee"])].compactMap { $0 }
    guard !knees.isEmpty else { return (nil, "knees") }
    let H = Ruler.lerp(lh, rh, 0.5), S = Ruler.lerp(ls, rs, 0.5)
    let K = CGPoint(x: knees.map(\.x).reduce(0, +) / CGFloat(knees.count), y: knees.map(\.y).reduce(0, +) / CGFloat(knees.count))
    let T = Ruler.dist(S, H)
    guard T > 20 else { return (nil, "torso too small") }
    let up = CGVector(dx: (S.x - H.x) / T, dy: (S.y - H.y) / T)
    // The axis should be near vertical in a standing photo; a lying or very tilted body is unsure.
    guard up.dy < -0.8 else { return (nil, "torso not upright") }
    let thigh = Ruler.dist(H, K)
    guard thigh / T > 0.45, thigh / T < 1.6 else { return (nil, "torso/thigh lengths") }
    let across = CGVector(dx: -up.dy, dy: up.dx)
    let half = max(CGFloat(stripMin) * T, Ruler.dist(lh, rh) / 2 * CGFloat(stripShare))
    return (Geo(H: H, S: S, up: up, across: across, T: T, thigh: thigh, half: half), "")
  }

  static func labAt(_ rgb: Measure.RGB, _ x: Int, _ y: Int) -> Lab {
    let i = (y * rgb.w + x) * 4
    return Measure.lab(rgb.px[i], rgb.px[i + 1], rgb.px[i + 2])
  }

  /// The pixels of the strip at position s: (Lab, the lightness a few px above minus below along the axis).
  static func stripPixels(_ c: Ruler.Ctx, _ g: Geo, _ s: Double) -> (labs: [Lab], dLs: [Double], total: Int) {
    let steps = max(6, Int(g.half / 1.5))
    var labs: [Lab] = [], dLs: [Double] = [], total = 0
    let dd = max(2, g.T * 0.015)
    for k in -steps...steps {
      let x = g.half * CGFloat(k) / CGFloat(steps)
      let p = g.at(s, x)
      total += 1
      let xi = Int(p.x.rounded()), yi = Int(p.y.rounded())
      guard Ruler.onMask(c, xi, yi) else { continue }
      let q = CGPoint(x: CGFloat(xi) + 0.5, y: CGFloat(yi) + 0.5)
      if c.skip.contains(where: { $0.contains(q) }) { continue }
      labs.append(labAt(c.rgb, xi, yi))
      let a = CGPoint(x: p.x + g.up.dx * dd, y: p.y + g.up.dy * dd), b = CGPoint(x: p.x - g.up.dx * dd, y: p.y - g.up.dy * dd)
      let ax = Int(a.x.rounded()), ay = Int(a.y.rounded()), bx = Int(b.x.rounded()), by = Int(b.y.rounded())
      if Ruler.onMask(c, ax, ay), Ruler.onMask(c, bx, by) { dLs.append(abs(labAt(c.rgb, ax, ay).L - labAt(c.rgb, bx, by).L)) }
    }
    return (labs, dLs, total)
  }

  // MARK: Legs (garment against garment): the pants' width at the shin over their width at the thigh

  /// The run of his outline across a leg at p (perpendicular to the leg), capped at `cap` px each way.
  static func runWidth(_ c: Ruler.Ctx, _ p: CGPoint, _ n: CGVector, cap: CGFloat) -> CGFloat? {
    guard Ruler.onMask(c, Int(p.x.rounded()), Int(p.y.rounded())) else { return nil }
    var w: CGFloat = 1
    for dir in [-1.0, 1.0] as [CGFloat] {
      var k: CGFloat = 1
      while k < cap, Ruler.onMask(c, Int((p.x + n.dx * k * dir).rounded()), Int((p.y + n.dy * k * dir).rounded())) { k += 1 }
      if k >= cap { return nil } // ran into the other leg or the arm: can't tell
      w += k - 1
    }
    return w
  }

  static func legs(_ c: Ruler.Ctx, _ j: [String: Ruler.Joint]) -> [String: Any] {
    var out: [[String: Any]] = [], ratios: [Double] = []
    for side in ["l", "r"] {
      guard let h = Ruler.ok(j["\(side)Hip"], Ruler.hipMin), let k = Ruler.ok(j["\(side)Knee"]), let a = Ruler.ok(j["\(side)Ankle"]) else { continue }
      let other = side == "l" ? "r" : "l"
      let thighLen = Ruler.dist(h, k), shinLen = Ruler.dist(k, a)
      guard thighLen > 10, shinLen > 10 else { continue }
      func width(_ p0: CGPoint, _ p1: CGPoint, _ t: CGFloat, _ cap: CGFloat) -> CGFloat? {
        let d = Ruler.dist(p0, p1), n = CGVector(dx: -(p1.y - p0.y) / d, dy: (p1.x - p0.x) / d)
        return runWidth(c, Ruler.lerp(p0, p1, t), n, cap: cap)
      }
      // Cap: half the gap to the other leg's same point, so touching legs come back unsure, not merged.
      var capThigh = thighLen * 0.45, capShin = shinLen * 0.45
      if let oh = Ruler.ok(j["\(other)Hip"], Ruler.hipMin), let ok2 = Ruler.ok(j["\(other)Knee"]) {
        capThigh = min(capThigh, Ruler.dist(Ruler.lerp(h, k, 0.55), Ruler.lerp(oh, ok2, 0.55)) * 0.6)
      }
      if let ok2 = Ruler.ok(j["\(other)Knee"]), let oa = Ruler.ok(j["\(other)Ankle"]) {
        capShin = min(capShin, Ruler.dist(Ruler.lerp(k, a, 0.5), Ruler.lerp(ok2, oa, 0.5)) * 0.6)
      }
      let wt = width(h, k, 0.55, capThigh), ws = width(k, a, 0.55, capShin)
      var row: [String: Any] = ["side": side]
      if let wt { row["thigh"] = Int(wt) }
      if let ws { row["shin"] = Int(ws) }
      if let wt, let ws, wt > 4 { let r = Double(ws / wt); ratios.append(r); row["ratio"] = r3(r) }
      out.append(row)
    }
    var d: [String: Any] = ["legs": out]
    if !ratios.isEmpty { d["shin_over_thigh"] = r3(ratios.reduce(0, +) / Double(ratios.count)) } else { d["why"] = "legs not separable" }
    return d
  }

  // MARK: The waistline

  static func measure(_ c: Ruler.Ctx, _ j: [String: Ruler.Joint], g: Geo) -> [String: Any] {
    Ruler.kL = 1 // top vs pants: lightness counts whole (a grey hoodie over black jeans)
    var d: [String: Any] = ["T": Int(g.T), "thigh_over_T": r3(Double(g.thigh / g.T)), "strip_half_T": r3(Double(g.half / g.T))]
    // The anatomical estimates, in s (torsos above the hip joints): the ruler.
    let crotchS = -kCrotch * Double(g.thigh / g.T)
    d["ruler"] = ["natural_waist": r3(kWaist), "iliac_crest": r3(kCrest), "crotch": r3(crotchS)]
    // The pants' own crotch: going down the middle from the hip joints, where the background first shows between
    // the legs and stays (garment geometry, not the body). The pants' visible rise = the waistline above it.
    var crotchFound: Double? = nil
    for s in Swift.stride(from: 0.0, through: -1.0 * Double(g.thigh / g.T), by: -0.01) {
      let offs = (-2...2).map { k -> Bool in let p = g.at(s, CGFloat(k)); return !Ruler.onMask(c, Int(p.x.rounded()), Int(p.y.rounded())) }
      guard offs.filter({ $0 }).count >= 3 else { continue }
      let ahead = Swift.stride(from: s, through: s - 0.1, by: -0.01).filter { t in let p = g.at(t, 0); return !Ruler.onMask(c, Int(p.x.rounded()), Int(p.y.rounded())) }.count
      if ahead >= 8 { crotchFound = s; break }
    }
    if let cf = crotchFound { d["crotch_mask_s"] = r3(cf) }
    // References: the top from the chest/upper belly, the pants from the shins (or the lower thigh).
    let chest = Ruler.stride(0.3, 0.55, 0.01).flatMap { stripPixels(c, g, $0).labs }
    guard chest.count >= 20, let topRef = Ruler.medianLab(chest) else { d["value"] = "unsure"; d["why"] = "chest not on body"; return d }
    guard let bot = Ruler.bottomsRef(c, j, shorts: false) else { d["value"] = "unsure"; d["why"] = "pants not visible"; return d }
    let sep = Ruler.de(topRef, bot.lab)
    d["sep"] = Int(sep); d["topL"] = Int(topRef.L); d["botL"] = Int(bot.lab.L)
    let far = max(30, sep)
    // The profile, chest → mid-thigh.
    let lowest = -0.6 * Double(g.thigh / g.T)
    var rows: [Row] = []
    for s in Swift.stride(from: 0.45, through: lowest, by: -0.01) {
      let px = stripPixels(c, g, s)
      var t = 0, b = 0
      for l in px.labs {
        let dt = Ruler.de(l, topRef), db = Ruler.de(l, bot.lab)
        if min(dt, db) > far { continue }
        if dt < db { t += 1 } else { b += 1 }
      }
      let n = px.labs.count
      rows.append(Row(s: s, n: n, on: Double(n) / Double(max(1, px.total)), top: n > 0 ? Double(t) / Double(n) : 0,
                      bot: n > 0 ? Double(b) / Double(n) : 0, edge: px.dLs.isEmpty ? 0 : Ruler.median(px.dLs)))
    }
    // The truth shoot (#269): a strip of blue painter's tape on his shirt at navel height. Found by its color only
    // (blue well above red and green), in the torso strip; its middle row is the true navel line.
    if ProcessInfo.processInfo.environment["WAIST_TAPE"] != nil {
      var tapeRows: [Double] = []
      for s in Swift.stride(from: 0.7, through: lowest, by: -0.005) {
        let steps = max(6, Int(g.half / 1.5))
        var n = 0, blue = 0
        for k in -steps...steps {
          let p = g.at(s, g.half * CGFloat(k) / CGFloat(steps))
          let xi = Int(p.x.rounded()), yi = Int(p.y.rounded())
          guard xi >= 0, yi >= 0, xi < c.rgb.w, yi < c.rgb.h else { continue }
          n += 1
          let i = (yi * c.rgb.w + xi) * 4
          let r = Int(c.rgb.px[i]), gg = Int(c.rgb.px[i + 1]), b = Int(c.rgb.px[i + 2])
          if b > r + 45, b > gg + 15, b > 90 { blue += 1 }
        }
        if n > 0, Double(blue) / Double(n) > 0.25 { tapeRows.append(s) }
      }
      if tapeRows.count >= 2 { d["tape_s"] = r3(Ruler.median(tapeRows)); d["tape_rows"] = tapeRows.count }
    }
    let live = rows.filter { $0.on >= rowOn }
    d["profile"] = rows.enumerated().filter { $0.offset % 3 == 0 }.map { ["s": r3($0.element.s), "on": r3($0.element.on), "top": r3($0.element.top), "bot": r3($0.element.bot), "edge": r3($0.element.edge)] }
    guard live.count >= rows.count / 2 else { d["value"] = "unsure"; d["why"] = "torso hidden (arm, hand or bag)"; return d }
    let holdN = max(3, Int((hold / 0.01).rounded()))

    // The strongest horizontal edge in the waist window (dark on dark has no color step, but a hem casts a line).
    let window = live.filter { $0.s <= kWaist + 0.05 && $0.s >= crotchS - 0.1 }
    let medEdge = Ruler.median(live.map(\.edge))
    if let peak = window.max(by: { $0.edge < $1.edge }), medEdge > 0 {
      d["edge_peak"] = ["s": r3(peak.s), "x": r3(peak.edge / medEdge)]
    }

    guard sep >= sameMax else {
      d["why"] = "top and pants look the same"
      // Dark on dark: only the edge line can say anything; reported separately ("edge_value").
      if let p = d["edge_peak"] as? [String: Double], let x = p["x"], x >= edgeK, let s = p["s"] {
        d["edge_value"] = cls(s, crotchS)
        d["edge_s"] = s
      }
      d["value"] = "unsure"
      return d
    }
    // Where the top's color ends (first row going down where it stops dominating and stays below).
    func lasting(_ i: Int, _ ok: (Row) -> Bool) -> Bool {
      let ahead = live[i..<min(live.count, i + holdN)]
      return ahead.count >= 2 && Double(ahead.filter(ok).count) >= 0.7 * Double(ahead.count)
    }
    let topEnd = live.indices.first { i in live[i].top < 0.5 && lasting(i) { $0.top < 0.5 } }.map { live[$0].s }
    let pantsStart = live.indices.first { i in live[i].bot >= 0.5 && lasting(i) { $0.bot >= 0.5 } }.map { live[$0].s }
    if let topEnd { d["top_end_s"] = r3(topEnd) }
    if let pantsStart { d["pants_start_s"] = r3(pantsStart) }
    guard let ps = pantsStart else { d["value"] = "unsure"; d["why"] = "pants never start in the window (a long top or a coat)"; d["visual_s"] = lowest; d["class4"] = "below_crotch"; return d }
    // A thin band of a third color between the top and the pants: a belt or the waistband.
    let te = topEnd ?? ps
    let band = max(0, te - ps)
    d["band"] = r3(band)
    let belt = band > 0.015 && band <= bandMax
    d["belt_band"] = belt
    // The visual waistline: the top of a belt/waistband band, else where the pants start.
    let vis = belt ? te : ps
    d["visual_s"] = r3(vis)
    d["under_layer_band"] = band > bandMax
    // The visual split: shoulder line → waistline over waistline → ankles, along the axis.
    let ankles = [Ruler.ok(j["lAnkle"]), Ruler.ok(j["rAnkle"])].compactMap { $0 }
    if !ankles.isEmpty {
      let A = CGPoint(x: ankles.map(\.x).reduce(0, +) / CGFloat(ankles.count), y: ankles.map(\.y).reduce(0, +) / CGFloat(ankles.count))
      let sA = Double(((A.x - g.H.x) * g.up.dx + (A.y - g.H.y) * g.up.dy) / g.T) // the ankles' s (negative)
      let upper = 1 - vis, lower = vis - sA
      if lower > 0.2 { d["split_upper_share"] = r3(upper / (upper + lower)) }
    }
    if let cf = crotchFound { d["rise_T"] = r3(vis - cf) }
    d["value"] = (belt || ps >= waistCut) ? "waist_shows" : "covered"
    d["class4"] = belt ? "waist" : cls(ps, crotchS)
    return d
  }

  /// The 3-way class from where the pants start: "waist" (tucked / short / at the waistband), mid_fly, below_crotch.
  static func cls(_ s: Double, _ crotchS: Double) -> String {
    s >= waistCut ? "waist" : s > crotchS ? "mid_fly" : "below_crotch"
  }

  // MARK: The whole run

  static func run(_ img: CGImage) -> (json: [String: Any], joints: [String: Ruler.Joint], hide: [CGRect], geo: Geo?, rgb: Measure.RGB?) {
    let t0 = CFAbsoluteTimeGetCurrent()
    applyOverrides()
    var located = Prep.locate(img)
    // Harness only: WAIST_PICK=i scores candidate i of a two-person photo, as the app does after "Which one is you?".
    if located.status == "multiplePeople", let i = ProcessInfo.processInfo.environment["WAIST_PICK"].flatMap(Int.init), i < located.candidates.count {
      located = Prep.locate(img, pick: located.candidates[i])
    }
    guard located.status == "ok", let rgb = Measure.rgb(img, maxSide: Measure.statPx) else { return (["status": located.status], [:], [], nil, nil) }
    let scale = CGFloat(rgb.w) / CGFloat(img.width)
    let mask = Measure.personMask(img, w: rgb.w, h: rgb.h).map { Ruler.erode($0, r: 2) }
    let joints = Ruler.pose(img, main: located.main, scale: scale)
    let hands = Measure.handBoxes(img).map { CGRect(x: $0.minX * scale, y: $0.minY * scale, width: $0.width * scale, height: $0.height * scale) }
    var ctx = Ruler.Ctx(rgb: rgb, mask: mask)
    ctx.skip = hands
    var json: [String: Any] = ["status": "ok", "w": rgb.w, "h": rgb.h, "hands": hands.count,
                               "joints": joints.mapValues { ["x": Int($0.p.x), "y": Int($0.p.y), "c": ($0.c * 100).rounded() / 100] }]
    let (g, why) = geometry(joints)
    if let g {
      let w = measure(ctx, joints, g: g)
      json["waist"] = w
      // The body rulers (#269): the same clothes edges read against shoulders/knees/ankles and Apple's 3D pose.
      let p3 = ProcessInfo.processInfo.environment["WAIST_NO3D"] == nil ? BodyRuler.pose3D(img, main: located.main, statW: rgb.w, statH: rgb.h) : nil
      var edges: [String: Double] = [:]
      for k in ["top_end_s", "pants_start_s", "visual_s", "tape_s"] { if let v = w[k] as? Double { edges[k] = v } }
      json["rulers"] = BodyRuler.readings(BodyRuler.fits(joints, g, p3), g: g, edges: edges)
      // For the overlay: where the shoulder–knee ruler puts the navel and the hip joint (s, torsos from the hip points).
      if let S = BodyRuler.mid(Ruler.ok(joints["lShoulder"]), Ruler.ok(joints["rShoulder"])), let K = BodyRuler.mid(Ruler.ok(joints["lKnee"]), Ruler.ok(joints["rKnee"])) {
        let dS = BodyRuler.down(S, g), dK = BodyRuler.down(K, g)
        func sOf(_ t: Double) -> Double { -(dS + t * (dK - dS)) / Double(g.T) }
        json["sk_lines"] = ["navel": r3(sOf(BodyRuler.tNavel)), "hip_joint": r3(sOf(BodyRuler.tHip)), "crotch": r3(sOf(BodyRuler.tCrotch))]
      }
      if let p3 {
        json["pose3d"] = ["bodyHeight": (p3.bodyHeight * 100).rounded() / 100, "measured": p3.measured,
                          "heights": p3.height.mapValues { ($0 * 1000).rounded() / 1000 }]
      }
    } else {
      json["waist"] = ["value": "unsure", "why": why]
    }
    json["legs"] = legs(Ruler.Ctx(rgb: rgb, mask: mask), joints)
    json["ms"] = Int((CFAbsoluteTimeGetCurrent() - t0) * 1000)
    return (json, joints, located.hide, g, rgb)
  }

  // MARK: Overlay: the strip, the ruler's landmarks (thin, grey) and the visual waistline found (thick)

  static func overlay(_ rgb: Measure.RGB, _ json: [String: Any], _ g: Geo?, to url: URL) {
    var px = rgb.px
    guard let ctx = px.withUnsafeMutableBytes({ raw in
      CGContext(data: raw.baseAddress, width: rgb.w, height: rgb.h, bitsPerComponent: 8, bytesPerRow: rgb.w * 4,
                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    }) else { return }
    ctx.translateBy(x: 0, y: CGFloat(rgb.h))
    ctx.scaleBy(x: 1, y: -1)
    if let g, let w = json["waist"] as? [String: Any] {
      func line(_ s: Double, _ col: CGColor, _ width: CGFloat, _ ext: CGFloat = 1.4) {
        ctx.setStrokeColor(col); ctx.setLineWidth(width)
        ctx.move(to: g.at(s, -g.half * ext)); ctx.addLine(to: g.at(s, g.half * ext)); ctx.strokePath()
      }
      let grey = CGColor(srgbRed: 0.75, green: 0.75, blue: 0.75, alpha: 1)
      ctx.setStrokeColor(CGColor(srgbRed: 0.2, green: 1, blue: 0.2, alpha: 0.8)); ctx.setLineWidth(1)
      ctx.move(to: g.at(0.45, -g.half)); ctx.addLine(to: g.at(-0.5, -g.half)); ctx.strokePath()
      ctx.move(to: g.at(0.45, g.half)); ctx.addLine(to: g.at(-0.5, g.half)); ctx.strokePath()
      if let sk = json["sk_lines"] as? [String: Double] {
        // The body ruler from his shoulders and knees: navel (white), hip joint (grey), crotch (dark grey).
        if let v = sk["navel"] { line(v, CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1), 2, 2.2) }
        if let v = sk["hip_joint"] { line(v, grey, 2, 2.2) }
        if let v = sk["crotch"] { line(v, CGColor(srgbRed: 0.4, green: 0.4, blue: 0.4, alpha: 1), 2, 2.2) }
      }
      if let s = w["visual_s"] as? Double { line(s, CGColor(srgbRed: 1, green: 0.55, blue: 0, alpha: 1), 3, 1.8) }
      if let s = w["edge_s"] as? Double { line(s, CGColor(srgbRed: 1, green: 1, blue: 0, alpha: 1), 2, 1.6) }
    }
    guard let img = ctx.makeImage(), let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
    CGImageDestinationFinalize(dest)
  }
}
