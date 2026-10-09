// The fit ruler (DECISIONS-LOG #170, Mac harness only for now): where each garment ENDS, measured against
// his own body joints, without the AI. Written against the app's own Prep/Measure/Guide so it can move into
// app/modules/kitted-vision/ios unchanged if it earns a place.
//
// Rules it keeps:
//   - Positions only, as fractions of his own limb segments (shoulder→elbow→wrist, hip→knee, knee→ankle).
//     Never a garment width against the body: that scales with body size and would rate bodies.
//   - Never a skin color. Every boundary is a step AWAY from the garment's own pixels, sampled on the
//     garment's side of the segment (the upper arm for a sleeve, the shin for the pants, the chest for a top),
//     so it works on every skin tone and on a sleeve close to his skin color (that case comes back "unsure").
//   - Every joint it uses passes a confidence gate; anything it can't see or tell apart is "unsure".
// Walks run on the 1024-px statistics copy (Measure.rgb) inside Vision's person mask.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

enum Ruler {
  typealias Lab = Measure.Lab

  /// A body joint in statistics-copy pixels (origin top-left) and Vision's confidence for it.
  struct Joint {
    var p: CGPoint
    var c: Double
  }

  /// A garment box from the closet call (0–1000, [ymin, xmin, ymax, xmax]) and what the AI named it.
  struct Box {
    let category: String
    let subcategory: String
    let rect: CGRect // statistics-copy pixels
    var sleeveLength: String? = nil // the closet call's "long" / "short"
  }

  // MARK: Settings (one place, so the report can quote them)

  static var jointMin = 0.3 // every joint used (Prep keeps joints above 0.3 too)
  static var hipMin = 0.3 // hips: the least certain joint; raising this is the first knob for "unsure"
  static var sameTop = 14.0 // top vs bottoms closer than this (kL 1) can't be split
  static var stepMin = 10.0 // color distance (de) a boundary must clear (and 2.5× the garment's own spread)
  static var sameMax = 10.0 // two garments closer than this can't be told apart → unsure

  // MARK: Pose with confidences

  /// The main person's joints with Vision's confidences (the same person Prep.locate picks: neck inside
  /// the main box), scaled to the statistics copy.
  static func pose(_ img: CGImage, main: CGRect?, scale: CGFloat) -> [String: Joint] {
    let W = CGFloat(img.width), H = CGFloat(img.height)
    let req = VNDetectHumanBodyPoseRequest()
    Prep.cpuOnSimulator([req])
    do { try VNImageRequestHandler(cgImage: img, orientation: .up).perform([req]) } catch { return [:] }
    let bodies = req.results ?? []
    let body = bodies.first { b in
      guard let main, let n = try? b.recognizedPoint(.neck), n.confidence > 0.3 else { return false }
      return main.insetBy(dx: -main.width * 0.2, dy: -main.height * 0.1).contains(CGPoint(x: n.location.x * W, y: (1 - n.location.y) * H))
    } ?? bodies.first
    guard let b = body, let pts = try? b.recognizedPoints(.all) else { return [:] }
    let names: [(String, VNHumanBodyPoseObservation.JointName)] = [
      ("neck", .neck), ("lShoulder", .leftShoulder), ("rShoulder", .rightShoulder), ("lElbow", .leftElbow), ("rElbow", .rightElbow),
      ("lWrist", .leftWrist), ("rWrist", .rightWrist), ("root", .root), ("lHip", .leftHip), ("rHip", .rightHip),
      ("lKnee", .leftKnee), ("rKnee", .rightKnee), ("lAnkle", .leftAnkle), ("rAnkle", .rightAnkle),
    ]
    var out: [String: Joint] = [:]
    for (k, n) in names {
      guard let p = pts[n], p.confidence > 0.05 else { continue }
      out[k] = Joint(p: CGPoint(x: p.location.x * W * scale, y: (1 - p.location.y) * H * scale), c: Double(p.confidence))
    }
    return out
  }

  // MARK: Sampling along a segment

  struct Ctx {
    let rgb: Measure.RGB
    /// His outline, shrunk by 2 px so a band never takes in the background at its edge.
    let mask: Guide.Gray?
    /// Regions never sampled (his hands and the phone, for the torso walk).
    var skip: [CGRect] = []
  }

  /// The person mask, binarized and shrunk by `r` px (a box minimum), so sampled pixels are well inside him.
  static func erode(_ m: Guide.Gray, r: Int) -> Guide.Gray {
    var a = m.px.map { $0 >= 128 ? UInt8(255) : 0 }
    var b = a
    for y in 0..<m.h { for x in 0..<m.w {
      var v: UInt8 = 255
      for dx in -r...r { let xx = x + dx; if xx < 0 || xx >= m.w || a[y * m.w + xx] == 0 { v = 0; break } }
      b[y * m.w + x] = v
    } }
    for y in 0..<m.h { for x in 0..<m.w {
      var v: UInt8 = 255
      for dy in -r...r { let yy = y + dy; if yy < 0 || yy >= m.h || b[yy * m.w + x] == 0 { v = 0; break } }
      a[y * m.w + x] = v
    } }
    return Guide.Gray(w: m.w, h: m.h, px: a)
  }

  /// Centering for a limb walk: at each point the band moves to the middle of the run of his pixels it sits
  /// in (searched up to `shift` px across the line), so a pose line that runs along the sleeve's edge still
  /// samples the sleeve. A run wider than `run` px (the arm against his side) isn't moved. The run is only
  /// used to place the band; it is never reported.
  struct Center {
    let shift: CGFloat
    let run: CGFloat
  }

  /// One sample of a walk: its position along the segment, the median color of his pixels in a short band
  /// across the line there, and the share of the band that was on his body.
  struct Band {
    let t: Double
    let lab: Lab?
    let on: Double
  }

  /// Lightness counts half (kL = 2, the textile convention of CIE94), so a shadow along a sleeve or a
  /// fold isn't read as the garment ending; a real edge changes the color too, or the lightness a lot.
  static var kL = 2.0
  static func de(_ a: Lab, _ b: Lab) -> Double {
    let dl = (a.L - b.L) / kL
    return sqrt(dl * dl + (a.a - b.a) * (a.a - b.a) + (a.b - b.b) * (a.b - b.b))
  }
  /// Per measure: the sleeve walks one garment in changing light (kL 2); top vs bottoms and pants vs shoes are
  /// often told apart by lightness alone (a grey hoodie over black jeans), so those keep it whole (kL 1).
  static var kLSleeve = 2.0, kLTop = 1.0, kLHem = 1.0

  /// Harness only: RULER_<NAME>=value overrides a setting, for tuning on the dev photos.
  static func applyOverrides() {
    let env = ProcessInfo.processInfo.environment
    func d(_ k: String) -> Double? { env["RULER_\(k)"].flatMap(Double.init) }
    if let v = d("KL_SLEEVE") { kLSleeve = v }
    if let v = d("KL_TOP") { kLTop = v }
    if let v = d("KL_HEM") { kLHem = v }
    if let v = d("STEP") { stepMin = v }
    if let v = d("SAME") { sameMax = v }
    if let v = d("SAME_TOP") { sameTop = v }
    if let v = d("COVER_HAND") { coverHand = v }
    if let v = d("GAP") { gapMin = v }
    if let v = d("COVER_SHARE") { coverShare = v }
    if let v = d("BELT") { beltCut = v }
    if let v = d("CROTCH") { crotchCut = v }
    if let v = d("HIP_MIN") { hipMin = v }
    if let v = d("JOINT_MIN") { jointMin = v }
    if let v = d("TOP_LINES") { topLines = Int(v) }
    if let v = env["RULER_TOP_COMBINE"] { topCombine = v }
  }

  static func median(_ v: [Double]) -> Double {
    let s = v.sorted()
    return s.isEmpty ? 0 : s.count % 2 == 1 ? s[s.count / 2] : (s[s.count / 2 - 1] + s[s.count / 2]) / 2
  }

  static func medianLab(_ v: [Lab]) -> Lab? {
    v.isEmpty ? nil : (median(v.map(\.L)), median(v.map(\.a)), median(v.map(\.b)))
  }

  static func onMask(_ c: Ctx, _ x: Int, _ y: Int) -> Bool {
    guard x >= 0, y >= 0, x < c.rgb.w, y < c.rgb.h else { return false }
    if let m = c.mask { return m.px[y * m.w + x] >= 128 }
    return true
  }

  /// Bands along a→b at each t (t may run past 0 or 1), `half` px either side of the line.
  static func walk(_ c: Ctx, _ a: CGPoint, _ b: CGPoint, _ ts: [Double], half: CGFloat, center: Center? = nil) -> [Band] {
    let dx = b.x - a.x, dy = b.y - a.y
    let len = max(1, sqrt(dx * dx + dy * dy))
    let nx = -dy / len, ny = dx / len, ux = dx / len, uy = dy / len
    return ts.map { t in
      var q = CGPoint(x: a.x + dx * CGFloat(t), y: a.y + dy * CGFloat(t))
      var half = half
      if let ce = center, c.mask != nil {
        // The runs of his pixels across the line, from -shift to +shift.
        let n = Int(ce.shift.rounded())
        var runs: [(Int, Int)] = [], start: Int? = nil
        for s in -n...(n + 1) {
          let inside = s <= n && onMask(c, Int((q.x + nx * CGFloat(s)).rounded()), Int((q.y + ny * CGFloat(s)).rounded()))
          if inside, start == nil { start = s }
          if !inside, let st = start { runs.append((st, s - 1)); start = nil }
        }
        if let best = runs.min(by: { r1, r2 in
          func d(_ r: (Int, Int)) -> Int { r.0 <= 0 && r.1 >= 0 ? 0 : min(abs(r.0), abs(r.1)) }
          return d(r1) < d(r2)
        }) {
          let width = CGFloat(best.1 - best.0 + 1)
          // A run cut by the search window's edge is wider than it looks: treat it as merged with his body.
          let clipped = best.0 == -n || best.1 == n
          if width <= ce.run, !clipped {
            let mid = CGFloat(best.0 + best.1) / 2
            q = CGPoint(x: q.x + nx * mid, y: q.y + ny * mid)
            half = max(1, min(half, width / 2 - 1))
          } else if best.0 > 0 || best.1 < 0 {
            let to = CGFloat(best.0 > 0 ? best.0 + 2 : best.1 - 2)
            q = CGPoint(x: q.x + nx * to, y: q.y + ny * to)
          }
        }
      }
      let steps = max(2, Int(half.rounded()))
      var labs: [Lab] = [], total = 0
      for s in -steps...steps {
        for along in -1...1 {
          let x = Int((q.x + nx * half * CGFloat(s) / CGFloat(steps) + ux * CGFloat(along)).rounded())
          let y = Int((q.y + ny * half * CGFloat(s) / CGFloat(steps) + uy * CGFloat(along)).rounded())
          total += 1
          guard x >= 0, y >= 0, x < c.rgb.w, y < c.rgb.h else { continue }
          if let m = c.mask, m.px[y * m.w + x] < 128 { continue }
          let p = CGPoint(x: CGFloat(x) + 0.5, y: CGFloat(y) + 0.5)
          if c.skip.contains(where: { $0.contains(p) }) { continue }
          let j = (y * c.rgb.w + x) * 4
          labs.append(Measure.lab(c.rgb.px[j], c.rgb.px[j + 1], c.rgb.px[j + 2]))
        }
      }
      return Band(t: t, lab: labs.count >= max(3, total / 4) ? medianLab(labs) : nil, on: Double(labs.count) / Double(max(1, total)))
    }
  }

  static func stride(_ a: Double, _ b: Double, _ step: Double) -> [Double] {
    Swift.stride(from: a, through: b + 1e-9, by: step).map { $0 }
  }

  /// The reference color of a garment: the median of the bands with t in `range`, and its spread (the
  /// median ΔE of those bands to it). nil when too few of them are on his body.
  static func reference(_ bands: [Band], _ range: ClosedRange<Double>) -> (lab: Lab, spread: Double)? {
    let inside = bands.filter { range.contains($0.t) }
    let labs = inside.compactMap(\.lab)
    guard labs.count >= max(2, inside.count / 2), let m = medianLab(labs) else { return nil }
    return (m, median(labs.map { de($0, m) }))
  }

  enum Step {
    case at(Double) // the first band that leaves the reference (and stays away)
    case offBody(Double) // the walk left his body (or the frame) before any step
    case none // no step along the whole walk
  }

  /// Walking from `from`, the first t where the band leaves `ref` by more than `thr` and at least 70% of
  /// the bands in the next `hold` stay that far away. A band off his body ends the walk. With `noReturn`,
  /// a step after which the garment's own color comes back (40%+ of the next `noReturn` on his body) is a
  /// stripe, a fold or a logo, not the end: the walk goes on.
  static func firstLeave(_ bands: [Band], ref: Lab, thr: Double, from: Double, hold: Double, noReturn: Double? = nil) -> Step {
    let walk = bands.filter { $0.t >= from - 1e-9 }
    for (i, b) in walk.enumerated() {
      guard let lab = b.lab else { return .offBody(b.t) }
      guard de(lab, ref) > thr else { continue }
      let ahead = walk[i...].filter { $0.t <= b.t + hold + 1e-9 }
      let away = ahead.filter { x in x.lab.map { de($0, ref) > thr } ?? true }.count
      guard Double(away) >= 0.7 * Double(ahead.count) else { continue }
      // A real edge is sharp: the bands just before and just after it differ too (a slow shade doesn't).
      let before = walk.filter { $0.t < b.t && $0.t >= b.t - hold - 1e-9 }.compactMap(\.lab)
      let after = ahead.compactMap(\.lab)
      if let mb = medianLab(before), let ma = medianLab(after), de(mb, ma) < thr * 0.7 { continue }
      if let nr = noReturn {
        let later = walk[i...].filter { $0.t > b.t + hold && $0.t <= b.t + hold + nr }.compactMap(\.lab)
        let back = later.filter { de($0, ref) <= thr * 0.8 }.count
        if later.count >= 3, Double(back) >= 0.4 * Double(later.count) { continue }
      }
      return .at(b.t)
    }
    return .none
  }

  /// The best single split of a walk into "top" above and "bottoms" below: each band votes for the
  /// reference it's closer to (bands far from both, like a logo or a hand, don't vote), and the split
  /// maximizes agreeing votes minus disagreeing ones. nil when the split isn't clear (score < 40% of votes).
  static func split(_ bands: [Band], top: Lab, bottom: Lab, from: Double, far: Double) -> (t: Double, score: Double)? {
    let walk = bands.filter { $0.t >= from - 1e-9 }
    let votes: [Int] = walk.map { b in
      guard let l = b.lab else { return 0 }
      let dt = de(l, top), db = de(l, bottom)
      if min(dt, db) > far { return 0 }
      return dt < db ? 1 : -1
    }
    let total = votes.filter { $0 != 0 }.count
    guard total >= 8 else { return nil }
    var best: (Int, Int)? = nil
    for k in 1..<walk.count {
      let above = votes[..<k].reduce(0, +), below = votes[k...].reduce(0, +)
      let s = above - below
      if best == nil || s > best!.1 { best = (k, s) }
    }
    guard let (k, sc) = best, Double(sc) >= 0.4 * Double(total) else { return nil }
    return (walk[k].t, Double(sc) / Double(total))
  }

  /// Walking from `from`, the first t where the band comes within `thr` of `target` and at least 70% of the
  /// bands in the next `hold` stay that close (the top meeting the pants).
  static func firstMatch(_ bands: [Band], target: Lab, thr: Double, from: Double, hold: Double) -> Double? {
    let walk = bands.filter { $0.t >= from - 1e-9 }
    for (i, b) in walk.enumerated() {
      guard let lab = b.lab, de(lab, target) < thr else { continue }
      let ahead = walk[i...].filter { $0.t <= b.t + hold + 1e-9 }
      let near = ahead.filter { x in x.lab.map { de($0, target) < thr } ?? false }.count
      if Double(near) >= 0.7 * Double(ahead.count) { return b.t }
    }
    return nil
  }

  // MARK: Results

  struct Reading {
    var value: String = "unsure"
    var why: String = ""
    var pos: Double? // the measured position in the measure's own units (see each measure)
    var detail: [String: Any] = [:]
    var lines: [(CGPoint, CGPoint)] = [] // walked segments, for the overlay
    var mark: CGPoint? // the boundary found
    var json: [String: Any] {
      var d = detail
      d["value"] = value
      if !why.isEmpty { d["why"] = why }
      if let pos { d["pos"] = (pos * 1000).rounded() / 1000 }
      return d
    }
  }

  static func unsure(_ why: String) -> Reading { Reading(value: "unsure", why: why) }

  static func ok(_ j: Joint?, _ min: Double = jointMin) -> CGPoint? {
    guard let j, j.c >= min else { return nil }
    return j.p
  }

  static func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) }
  static func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t) }

  /// The angle (degrees) between two directions.
  static func angle(_ a: CGPoint, _ b: CGPoint, _ c: CGPoint, _ d: CGPoint) -> Double {
    let v1 = (b.x - a.x, b.y - a.y), v2 = (d.x - c.x, d.y - c.y)
    let n = sqrt(v1.0 * v1.0 + v1.1 * v1.1) * sqrt(v2.0 * v2.0 + v2.1 * v2.1)
    guard n > 0 else { return 180 }
    return acos(max(-1, min(1, Double((v1.0 * v2.0 + v1.1 * v2.1) / n)))) * 180 / .pi
  }

  // MARK: 1. Sleeve end (the hanging arm only)

  /// Position along shoulder→elbow (0–1) then elbow→wrist (1–2) and on into the hand (2+).
  /// mid_bicep < 0.8 ≤ at_elbow < 1.25 ≤ above_wrist < 1.8 ≤ at_wrist < 2.12 ≤ covers_hand.
  static let sleeveCuts: [(Double, String)] = [(0.8, "mid_bicep"), (1.25, "at_elbow"), (1.8, "above_wrist"), (2.12, "at_wrist")]

  static var coverHand = 2.25

  /// The class for a position. The closet call names the sleeve length (the AI names, the phone measures):
  /// a long sleeve ending above 1.8 is pushed or rolled up (above_wrist); a short sleeve past 1.25 is a misread.
  static func sleeveClass(_ pos: Double, length: String?) -> String {
    switch length {
    case "long": return pos < 1.8 ? "above_wrist" : pos < coverHand ? "at_wrist" : "covers_hand"
    case "short": return pos < 0.8 ? "mid_bicep" : pos < 1.25 ? "at_elbow" : "unsure"
    default: return pos < 0.8 ? "mid_bicep" : pos < 1.25 ? "at_elbow" : pos < 1.8 ? "above_wrist" : pos < coverHand ? "at_wrist" : "covers_hand"
    }
  }

  static func sleeve(_ c: Ctx, _ j: [String: Joint], side: String, length: String?) -> Reading {
    guard let s = ok(j["\(side)Shoulder"]), let e = ok(j["\(side)Elbow"]), let w = ok(j["\(side)Wrist"]) else { return unsure("joints") }
    let upper = dist(s, e), fore = dist(e, w)
    guard upper > 8, fore > 8, fore / upper > 0.5, fore / upper < 1.5 else { return unsure("arm lengths") }
    // Hanging: the elbow nearly straight and the arm pointing down (the phone arm in a mirror selfie fails).
    let bend = angle(s, e, e, w)
    let down = angle(s, w, CGPoint(x: 0, y: 0), CGPoint(x: 0, y: 1))
    guard bend <= 40, down <= 45, w.y > e.y, e.y > s.y else { return unsure("arm not hanging") }
    let half = max(2, fore * 0.08)
    let ce = Center(shift: fore * 0.3, run: fore * 0.6)
    let up = walk(c, s, e, stride(0.04, 1.0, 0.02), half: half, center: ce)
    let fo = walk(c, e, w, stride(0.02, 1.75, 0.02), half: half, center: ce).map { Band(t: 1 + $0.t, lab: $0.lab, on: $0.on) }
    let bands = up + fo
    var r = Reading()
    r.lines = [(s, e), (e, lerp(e, w, 1.75))]
    guard let ref = reference(bands, 0.12...0.4) else { r.why = "sleeve not on his body"; return r }
    let thr = max(stepMin, ref.spread * 2.5)
    r.detail = ["side": side, "bend": Int(bend), "refL": Int(ref.lab.L), "spread": (ref.spread * 10).rounded() / 10, "thr": (thr * 10).rounded() / 10]
    // A hand in a pocket: the forearm ends at his hip, so a step near the wrist is the pocket, not the cuff.
    let hips = [ok(j["lHip"], 0.2), ok(j["rHip"], 0.2)].compactMap { $0 }
    let pocket = hips.contains { dist($0, w) < fore * 0.5 }
    switch firstLeave(bands, ref: ref.lab, thr: thr, from: 0.4, hold: 0.14, noReturn: 0.4) {
    case .at(let t):
      r.pos = t
      r.mark = t <= 1 ? lerp(s, e, CGFloat(t)) : lerp(e, w, CGFloat(t - 1))
      if pocket, t >= 1.7 { r.why = "hand in pocket"; r.detail["pocket"] = true; return r }
      r.value = sleeveClass(t, length: length)
      if r.value == "unsure" { r.why = "a short sleeve that runs past the elbow" }
    case .offBody(let t):
      r.pos = t; r.why = "arm leaves his outline at \(String(format: "%.2f", t))"
    case .none:
      r.why = "no step (hand matches the sleeve, or the sleeve covers it)"
    }
    return r
  }

  /// Both arms; a hanging arm that reads wins, two that disagree by more than one class are unsure.
  static func sleeveEnd(_ c: Ctx, _ j: [String: Joint], length: String?) -> Reading {
    kL = kLSleeve
    let both = ["l", "r"].map { sleeve(c, j, side: $0, length: length) }
    let read = both.filter { $0.value != "unsure" }
    var out: Reading
    if read.count == 2 {
      let order = sleeveCuts.map(\.1) + ["covers_hand"]
      let ia = order.firstIndex(of: read[0].value)!, ib = order.firstIndex(of: read[1].value)!
      if abs(ia - ib) > 1 {
        out = unsure("arms disagree (\(read[0].value), \(read[1].value))")
      } else {
        // The lower position: a raised or bunched cuff on one side reads short.
        out = (read[0].pos ?? 0) >= (read[1].pos ?? 0) ? read[0] : read[1]
      }
    } else if let one = read.first {
      out = one
    } else {
      out = unsure(both.map { $0.why }.joined(separator: " / "))
    }
    out.lines = both.flatMap(\.lines)
    out.detail["arms"] = both.map { $0.json }
    return out
  }

  // MARK: Bottoms reference (shared by the top hem and the layers)

  /// The bottoms' own color: the shins (knee→ankle, 0.2–0.5) for pants, the upper thigh for shorts.
  static func bottomsRef(_ c: Ctx, _ j: [String: Joint], shorts: Bool) -> (lab: Lab, spread: Double)? {
    var labs: [Lab] = []
    for side in ["l", "r"] {
      if shorts {
        guard let h = ok(j["\(side)Hip"], hipMin), let k = ok(j["\(side)Knee"]) else { continue }
        let b = walk(c, h, k, stride(0.15, 0.4, 0.025), half: max(2, dist(h, k) * 0.07))
        labs += b.compactMap(\.lab)
      } else {
        guard let k = ok(j["\(side)Knee"]), let a = ok(j["\(side)Ankle"]) else { continue }
        let b = walk(c, k, a, stride(0.2, 0.5, 0.025), half: max(2, dist(k, a) * 0.07))
        labs += b.compactMap(\.lab)
      }
    }
    if labs.count < 6, !shorts {
      // The shins are out of the photo: the lower thigh (0.55–0.8 of hip→knee) is still the pants.
      for side in ["l", "r"] {
        guard let h = ok(j["\(side)Hip"], hipMin), let k = ok(j["\(side)Knee"]) else { continue }
        labs += walk(c, h, k, stride(0.55, 0.8, 0.025), half: max(2, dist(h, k) * 0.07)).compactMap(\.lab)
      }
    }
    guard labs.count >= 6, let m = medianLab(labs) else { return nil }
    return (m, median(labs.map { de($0, m) }))
  }

  // MARK: 2. Top hem (where the top meets the bottoms)

  /// Position u = (hem y − hip y) / (knee y − hip y): 0 at the hip joints, 1 at the knees.
  /// cropped < −0.3 ≤ at_belt < `beltCut` ≤ mid_fly < `crotchCut` ≤ below_crotch.
  static var beltCut = 0.06, crotchCut = 0.26
  static var topLines = 2, topCombine = "mean"

  static func topClass(_ u: Double) -> String { u < -0.3 ? "cropped" : u < beltCut ? "at_belt" : u < crotchCut ? "mid_fly" : "below_crotch" }

  static func topHem(_ c: Ctx, _ j: [String: Joint], shorts: Bool) -> Reading {
    kL = kLTop
    guard let n = ok(j["neck"]), let lh = ok(j["lHip"], hipMin), let rh = ok(j["rHip"], hipMin) else { return unsure("neck or hips") }
    let hipY = (lh.y + rh.y) / 2
    let knees = [ok(j["lKnee"]), ok(j["rKnee"])].compactMap { $0 }
    guard !knees.isEmpty else { return unsure("knees") }
    let kneeY = knees.map(\.y).reduce(0, +) / CGFloat(knees.count)
    let torso = hipY - n.y, thigh = kneeY - hipY
    guard torso > 10, thigh > 10, thigh / torso > 0.4, thigh / torso < 1.6 else { return unsure("torso/thigh lengths") }
    guard let bottoms = bottomsRef(c, j, shorts: shorts) else { return unsure("bottoms not visible") }
    var r = Reading()
    var us: [Double] = [], scores: [Double] = [], sides: [[String: Any]] = []
    let hipMid = lerp(lh, rh, 0.5)
    var lines: [(String, CGPoint, CGPoint)] = []
    for (side, hip) in [("l", lh), ("r", rh)] {
      // A line down the front of the torso halfway between his middle and this hip, from the chest to the knee level.
      let x0 = lerp(n, lerp(n, hip, 1), 0.5).x, xh = (hipMid.x + hip.x) / 2
      lines.append((side, CGPoint(x: (x0 + xh) / 2, y: n.y + torso * 0.35), CGPoint(x: xh + (hip.x - hipMid.x) * 0.3, y: kneeY)))
    }
    if topLines == 3 {
      // His middle, from the chest to just below the crotch (below that the legs part): an open jacket shows the shirt here.
      lines.append(("c", CGPoint(x: (n.x + hipMid.x) / 2, y: n.y + torso * 0.35), CGPoint(x: hipMid.x, y: hipY + thigh * 0.4)))
    }
    for (side, top, bottom) in lines {
      // t along top→bottom; convert to u afterwards.
      let bands = walk(c, top, bottom, stride(0, 1, 0.01), half: max(2, torso * 0.04))
      func u(_ t: Double) -> Double { Double((top.y + (bottom.y - top.y) * CGFloat(t) - hipY) / thigh) }
      r.lines.append((top, bottom))
      guard let topRef = reference(bands, 0.0...0.2) else { sides.append(["side": side, "why": "chest not on body"]); continue }
      let sep = de(topRef.lab, bottoms.lab)
      guard sep >= sameTop else { sides.append(["side": side, "why": "top and bottoms look the same", "sep": Int(sep)]); continue }
      if let sp = split(bands, top: topRef.lab, bottom: bottoms.lab, from: 0.1, far: max(30, sep)) {
        us.append(u(sp.t)); scores.append(sp.score)
        sides.append(["side": side, "u": (u(sp.t) * 1000).rounded() / 1000, "score": (sp.score * 100).rounded() / 100, "sep": Int(sep)])
        r.mark = lerp(top, bottom, CGFloat(sp.t))
      } else {
        sides.append(["side": side, "why": "no clear split", "sep": Int(sep)])
      }
    }
    r.detail = ["sides": sides, "bottomsL": Int(bottoms.lab.L)]
    guard !us.isEmpty else {
      r.why = (sides.compactMap { $0["why"] as? String }.first) ?? "no hem"
      return r
    }
    let u: Double
    switch topCombine {
    case "max": u = us.max()! // the lowest edge of the top stack
    case "median": u = median(us)
    default:
      // Two lines that agree: their mean. Apart by more than 0.2 (a raised arm lifts one side, a hand
      // covers the other): the clearer split.
      u = us.count == 2 && abs(us[0] - us[1]) <= 0.2 ? (us[0] + us[1]) / 2 : us[scores.firstIndex(of: scores.max()!)!]
    }
    r.pos = u
    r.value = topClass(u)
    return r
  }

  // MARK: 3. Pant hem (where the pants meet the shoe)

  /// Along knee→ankle (1 at the ankle joint): the hem is the first sharp step away from the shin's own color.
  /// The shoe's top comes from the closet call's shoe box (the AI points, the phone measures), projected onto
  /// the same line, and his outline's end below it is the sole. gap = the hem ends ≥ `gapMin` above the shoe's
  /// top (skin or a sock shows); covers = the hem comes down over ≥ `coverShare` of the shoe's height; else meets.
  /// Never the hem against the ankle joint alone: a dress shoe's top sits far lower than a boot's.
  static var gapMin = 0.05
  static var coverShare = 0.3

  static func pantHem(_ c: Ctx, _ j: [String: Joint], shoe: Box?) -> Reading {
    kL = kLHem
    var legs: [[String: Any]] = [], reads: [(cls: String, hem: Double, straight: Double)] = []
    var r = Reading()
    guard let shoe else { return unsure("no shoe box") }
    for side in ["l", "r"] {
      guard let k = ok(j["\(side)Knee"]), let a = ok(j["\(side)Ankle"]) else { legs.append(["side": side, "why": "joints"]); continue }
      let shin = dist(k, a)
      guard shin > 10, a.y > k.y + shin * 0.5 else { legs.append(["side": side, "why": "shin length"]); continue }
      let straight = ok(j["\(side)Hip"], 0.2).map { angle($0, k, k, a) } ?? 30
      let bands = walk(c, k, a, stride(0.15, 2.0, 0.01), half: max(2, shin * 0.06), center: Center(shift: shin * 0.3, run: shin * 0.9))
      r.lines.append((k, lerp(k, a, 2.0)))
      guard let pants = reference(bands, 0.2...0.5) else { legs.append(["side": side, "why": "shin not on body"]); continue }
      func tOf(_ y: CGFloat) -> Double { Double((y - k.y) / (a.y - k.y)) }
      let tBox = tOf(shoe.rect.minY)
      // His outline's end below the shoe's top: the sole (or the frame's edge).
      let onBody = bands.filter { $0.t > max(0.5, tBox) && $0.lab != nil }
      guard let footEnd = onBody.last?.t, footEnd > tBox + 0.05 else { legs.append(["side": side, "why": "feet not in the photo"]); continue }
      var leg: [String: Any] = ["side": side, "pantsL": Int(pants.lab.L), "footEnd": (footEnd * 100).rounded() / 100, "shoeTop": (tBox * 100).rounded() / 100, "bend": Int(straight)]
      // The shoe's own color: the lower 40% of it (the pants may cover its top).
      let shoeBands = bands.filter { $0.t >= footEnd - (footEnd - tBox) * 0.4 && $0.t <= footEnd }.compactMap(\.lab)
      if let sl = medianLab(shoeBands) {
        let sep = de(pants.lab, sl)
        leg["shoeSep"] = Int(sep)
        guard sep >= sameMax else { leg["why"] = "pants and shoes look the same"; legs.append(leg); continue }
      }
      let thr = max(stepMin, pants.spread * 2.5)
      switch firstLeave(bands, ref: pants.lab, thr: thr, from: 0.5, hold: 0.05, noReturn: 0.15) {
      case .at(let t):
        let height = footEnd - tBox
        let cls = tBox - t >= gapMin ? "gap" : t - tBox >= coverShare * height ? "covers" : "meets"
        leg["hem"] = (t * 1000).rounded() / 1000
        leg["over"] = ((t - tBox) / height * 100).rounded() / 100
        leg["class"] = cls
        reads.append((cls, t, straight))
        r.mark = lerp(k, a, CGFloat(t))
      case .offBody(let t):
        leg["why"] = "leg leaves his outline at \(String(format: "%.2f", t))"
      case .none:
        leg["why"] = "no step down to the sole"
      }
      legs.append(leg)
    }
    r.detail = ["legs": legs]
    guard !reads.isEmpty else { r.why = (legs.compactMap { $0["why"] as? String }.first) ?? "no hem"; return r }
    // Legs that disagree: the straighter leg (the one he stands on; a bent or striding leg lifts its hem).
    let pick = reads.min { $0.straight < $1.straight }!
    if reads.count == 2, reads[0].cls != reads[1].cls, abs(reads[0].straight - reads[1].straight) < 8 {
      r.why = "legs disagree"
      return r
    }
    r.value = pick.cls
    r.pos = pick.hem - 1
    return r
  }

  // MARK: 4. Shorts length (vs the knee joint)

  /// k = (hem y − knee y) / (knee y − hip y): 0 at the knee, negative above it.
  /// above_knee < −0.08 ≤ at_knee < 0.12 ≤ below_knee.
  static func shortsLength(_ c: Ctx, _ j: [String: Joint]) -> Reading {
    kL = kLHem
    var ks: [Double] = [], legs: [[String: Any]] = []
    var r = Reading()
    for side in ["l", "r"] {
      guard let h = ok(j["\(side)Hip"], hipMin), let k = ok(j["\(side)Knee"]) else { legs.append(["side": side, "why": "joints"]); continue }
      let thigh = dist(h, k)
      guard thigh > 10 else { continue }
      let a = ok(j["\(side)Ankle"]) ?? CGPoint(x: k.x + (k.x - h.x) * 0.9, y: k.y + (k.y - h.y) * 0.9)
      // t: 0–1 hip→knee, then 1–2 knee→ankle.
      let b1 = walk(c, h, k, stride(0.1, 1.0, 0.01), half: max(2, thigh * 0.06))
      let b2 = walk(c, k, a, stride(0.01, 0.6, 0.01), half: max(2, thigh * 0.06)).map { Band(t: 1 + $0.t, lab: $0.lab, on: $0.on) }
      let bands = b1 + b2
      r.lines += [(h, k), (k, lerp(k, a, 0.6))]
      guard let ref = reference(bands, 0.15...0.4) else { legs.append(["side": side, "why": "shorts not on body"]); continue }
      let thr = max(stepMin, ref.spread * 2.5)
      if case .at(let t) = firstLeave(bands, ref: ref.lab, thr: thr, from: 0.4, hold: 0.08) {
        let y = t <= 1 ? lerp(h, k, CGFloat(t)).y : lerp(k, a, CGFloat(t - 1)).y
        let kk = Double((y - k.y) / (k.y - h.y))
        ks.append(kk)
        legs.append(["side": side, "k": (kk * 1000).rounded() / 1000])
        r.mark = t <= 1 ? lerp(h, k, CGFloat(t)) : lerp(k, a, CGFloat(t - 1))
      } else {
        legs.append(["side": side, "why": "no step"])
      }
    }
    r.detail = ["legs": legs]
    guard !ks.isEmpty else { r.why = "no hem"; return r }
    let k = ks.reduce(0, +) / Double(ks.count)
    r.pos = k
    r.value = k < -0.08 ? "above_knee" : k < 0.12 ? "at_knee" : "below_knee"
    return r
  }

  // MARK: 5. Outer layer vs the layer under it (the closet call's two boxes)

  /// Whether the under layer hangs below the outer one: the boxes' bottoms compared, in torso units
  /// (neck → hips). yes when the under layer's box ends ≥ 0.05 torso lower.
  static func layers(_ boxes: [Box], _ j: [String: Joint]) -> Reading {
    let tops = boxes.filter { $0.category == "top" }, outers = boxes.filter { $0.category == "outerwear" }
    guard let outer = outers.max(by: { $0.rect.height < $1.rect.height }), let under = tops.max(by: { $0.rect.height < $1.rect.height }) else {
      return Reading(value: "na", why: "one layer")
    }
    guard let n = ok(j["neck"]), let lh = ok(j["lHip"], hipMin), let rh = ok(j["rHip"], hipMin) else { return unsure("neck or hips") }
    let torso = (lh.y + rh.y) / 2 - n.y
    guard torso > 10 else { return unsure("torso") }
    let d = Double((under.rect.maxY - outer.rect.maxY) / torso)
    var r = Reading()
    r.pos = d
    r.value = d >= 0.05 ? "yes" : "no"
    r.detail = ["outer": outer.subcategory, "under": under.subcategory]
    return r
  }

  // MARK: Box variants (the closet call's boxes on his body's scale; a comparison, not a ruler)

  /// The lowest top or outer layer box's bottom edge, in the top hem's u units (hip 0, knee 1).
  static func topLengthBox(_ boxes: [Box], _ j: [String: Joint]) -> Reading {
    let tops = boxes.filter { $0.category == "top" || $0.category == "outerwear" }
    guard let low = tops.max(by: { $0.rect.maxY < $1.rect.maxY }) else { return unsure("no top box") }
    guard let lh = ok(j["lHip"], hipMin), let rh = ok(j["rHip"], hipMin) else { return unsure("hips") }
    let knees = [ok(j["lKnee"]), ok(j["rKnee"])].compactMap { $0 }
    guard !knees.isEmpty else { return unsure("knees") }
    let hipY = (lh.y + rh.y) / 2, kneeY = knees.map(\.y).reduce(0, +) / CGFloat(knees.count)
    guard kneeY - hipY > 10 else { return unsure("thigh") }
    var r = Reading()
    r.pos = Double((low.rect.maxY - hipY) / (kneeY - hipY))
    r.value = topClass(r.pos!)
    return r
  }

  /// The bottoms box's lower edge against the shoe box: above its top by `gapMin` of the shoe's height = gap,
  /// down over `coverShare` of it = covers, else meets.
  static func hemBox(_ boxes: [Box]) -> Reading {
    guard let b = boxes.filter({ $0.category == "bottom" }).max(by: { $0.rect.height < $1.rect.height }),
          let s = boxes.first(where: { $0.category == "footwear" }), s.rect.height > 2 else { return unsure("no boxes") }
    var r = Reading()
    let over = Double((b.rect.maxY - s.rect.minY) / s.rect.height)
    r.pos = over
    r.value = over < -0.15 ? "gap" : over >= 0.5 ? "covers" : "meets"
    return r
  }

  // MARK: The whole ruler

  /// Every measure for one photo. `boxes`: the closet call's garments (category, subcategory, box 0–1000).
  static func run(_ img: CGImage, boxes list: [[String: Any]], shorts: Bool) -> (json: [String: Any], readings: [String: Reading], joints: [String: Joint], hide: [CGRect]) {
    let t0 = CFAbsoluteTimeGetCurrent()
    applyOverrides()
    let located = Prep.locate(img)
    guard located.status == "ok", let rgb = Measure.rgb(img, maxSide: Measure.statPx) else {
      return (["status": located.status], [:], [:], [])
    }
    let scale = CGFloat(rgb.w) / CGFloat(img.width)
    let mask = Measure.personMask(img, w: rgb.w, h: rgb.h).map { erode($0, r: 2) }
    let joints = pose(img, main: located.main, scale: scale)
    let hands = Measure.handBoxes(img).map { CGRect(x: $0.minX * scale, y: $0.minY * scale, width: $0.width * scale, height: $0.height * scale) }
    let W = CGFloat(rgb.w), H = CGFloat(rgb.h)
    let boxes: [Box] = list.compactMap { g in
      guard let c = g["category"] as? String, let b = g["box"] as? [Double], b.count == 4 else { return nil }
      return Box(category: c, subcategory: g["subcategory"] as? String ?? "", rect: CGRect(x: b[1] / 1000 * W, y: b[0] / 1000 * H, width: (b[3] - b[1]) / 1000 * W, height: (b[2] - b[0]) / 1000 * H),
                 sleeveLength: g["sleeve_length"] as? String)
    }
    // The sleeve that shows is the outermost layer's.
    let outer = boxes.first { $0.category == "outerwear" } ?? boxes.first { $0.category == "top" }
    let length = outer?.sleeveLength.flatMap { ["long", "short"].contains($0) ? $0 : nil }
    let plain = Ctx(rgb: rgb, mask: mask)
    var torso = plain
    torso.skip = hands
    var readings: [String: Reading] = [
      "sleeve_end": sleeveEnd(plain, joints, length: length),
      "top_length": topHem(torso, joints, shorts: shorts),
      "layers": layers(boxes, joints),
      "top_length_box": topLengthBox(boxes, joints),
      "hem_box": hemBox(boxes),
    ]
    if shorts {
      readings["shorts_length"] = shortsLength(plain, joints)
    } else {
      readings["hem"] = pantHem(plain, joints, shoe: boxes.first { $0.category == "footwear" })
    }
    var json: [String: Any] = [
      "status": "ok", "w": rgb.w, "h": rgb.h, "personMask": mask != nil,
      "joints": joints.mapValues { ["x": Int($0.p.x), "y": Int($0.p.y), "c": ($0.c * 100).rounded() / 100] },
      "ms": Int((CFAbsoluteTimeGetCurrent() - t0) * 1000),
    ]
    for (k, v) in readings { json[k] = v.json }
    return (json, readings, joints, located.hide)
  }

  // MARK: Overlay (for the report: the walks, the joints and each boundary found)

  /// Drawn on the face-hidden copy (`rgb` from Prep.hideRegions), never on the kept photo.
  static func overlay(_ rgb: Measure.RGB, _ readings: [String: Reading], _ joints: [String: Joint], to url: URL) throws {
    var px = rgb.px
    guard let ctx = px.withUnsafeMutableBytes({ raw in
      CGContext(data: raw.baseAddress, width: rgb.w, height: rgb.h, bitsPerComponent: 8, bytesPerRow: rgb.w * 4,
                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    }) else { return }
    ctx.translateBy(x: 0, y: CGFloat(rgb.h))
    ctx.scaleBy(x: 1, y: -1) // draw in top-left coordinates
    let colors: [String: CGColor] = [
      "sleeve_end": CGColor(srgbRed: 1, green: 0.55, blue: 0, alpha: 1), "top_length": CGColor(srgbRed: 0, green: 0.8, blue: 1, alpha: 1),
      "hem": CGColor(srgbRed: 1, green: 0.1, blue: 0.6, alpha: 1), "shorts_length": CGColor(srgbRed: 1, green: 0.1, blue: 0.6, alpha: 1),
    ]
    for (_, jt) in joints {
      ctx.setFillColor(jt.c >= jointMin ? CGColor(srgbRed: 0.2, green: 1, blue: 0.2, alpha: 1) : CGColor(srgbRed: 1, green: 0, blue: 0, alpha: 1))
      ctx.fillEllipse(in: CGRect(x: jt.p.x - 3, y: jt.p.y - 3, width: 6, height: 6))
    }
    for (k, r) in readings {
      guard let col = colors[k] else { continue }
      ctx.setStrokeColor(col)
      ctx.setLineWidth(1.5)
      for (a, b) in r.lines { ctx.move(to: a); ctx.addLine(to: b); ctx.strokePath() }
      if let m = r.mark {
        ctx.setLineWidth(3)
        ctx.move(to: CGPoint(x: m.x - 12, y: m.y)); ctx.addLine(to: CGPoint(x: m.x + 12, y: m.y)); ctx.strokePath()
      }
    }
    guard let img = ctx.makeImage() else { return }
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
    CGImageDestinationFinalize(dest)
  }
}
