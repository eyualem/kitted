// Body rulers for the waist test (DECISIONS-LOG #269, Mac harness only). Each ruler maps a position down the body
// axis in the photo to a height on the body (cm, on the ANSUR II men's mean scale), correcting for the camera where
// it can, so a clothes edge can be placed against where the waist is on an average body of his proportions.
//
//   hips        the old ruler: the 2D hip and shoulder points, a straight line (no camera correction)
//   sk_linear   2D shoulders and knees, a straight line (no hips: the least certain points, and the ones the clothes move)
//   ska_proj    2D shoulders, knees and ankles, a projective fit: corrects camera tilt and height (a mirror selfie
//               from chest height shrinks the legs against the torso; three known heights fix the perspective)
//   a3d_proj    Apple's 3D body pose: its own estimate of his joint heights in meters (his proportions, not the
//               average's), fit projectively to where those joints land in the photo
//   a3d_ansur   Apple's 3D pose's image points for shoulders, knees and ankles, with the ANSUR heights (ska_proj on
//               Apple's 3D joint placement)
//
// Positions come out as t, the share of the way from the shoulders (0) to the knees (1). Across 4,082 men (ANSUR II,
// inputs/ansur2) the navel sits at t = 0.400 ± 2.1 cm, the top of the hip bone 0.394 ± 1.9, the hip joint
// (trochanter) 0.562 ± 2.2, the crotch 0.619 ± 2.0 (shoulder → knee = 96.1 cm). The body is only a ruler: nothing
// here is reported as a judgment, scored or stored, and the same constants apply to everyone.
import CoreGraphics
import Foundation
import Vision
import simd

enum BodyRuler {
  static let hShoulder = 144.07, hKnee = 48.0, hAnkle = 7.29, hHip = 89.3
  /// A hanging arm (ANSUR II: acromial height − acromion–radiale length; wrist height): the elbow 110.5 cm, the wrist
  /// 84.8 cm. Shoulders + a hanging arm place the navel to ±2.2–2.3 cm (shoulders + knees ±2.0; all of them ±1.9).
  static let hElbow = 110.5, hWrist = 84.8
  static let tNavel = 0.400, tCrest = 0.394, tHip = 0.562, tCrotch = 0.619
  static func t(fromHeight h: Double) -> Double { (hShoulder - h) / (hShoulder - hKnee) }

  /// Distance down the body axis from the hip midpoint, in pixels (positive = lower in the body).
  static func down(_ p: CGPoint, _ g: Waist.Geo) -> Double { Double((p.x - g.H.x) * -g.up.dx + (p.y - g.H.y) * -g.up.dy) }

  /// A ruler: position down the axis (px) → height (cm, or meters for a3d_proj before conversion) → t.
  struct Fit {
    let name: String
    let tOf: (Double) -> Double?
    var info: [String: Any] = [:]
    /// Height (cm on the ANSUR scale) at a position down the axis, when the ruler is in cm (for widths in cm).
    var height: ((Double) -> Double)? = nil
  }

  // MARK: Hanging arms (the backup anchors, #269)

  /// An arm counts only when it hangs straight down beside him: shoulder, elbow and wrist all found, the elbow bent
  /// less than `armBend`°, and the upper arm within `armTilt`° of the body axis. A phone arm, a hand in a pocket or
  /// on a hip fails the gate.
  static var armBend = Double(ProcessInfo.processInfo.environment["WAIST_ARM_BEND"] ?? "") ?? 10.0
  static var armTilt = Double(ProcessInfo.processInfo.environment["WAIST_ARM_TILT"] ?? "") ?? 12.0
  static func hangingArms(_ j: [String: Ruler.Joint], down axis: CGVector) -> [(name: String, p: CGPoint, h: Double)] {
    var out: [(String, CGPoint, Double)] = []
    for side in ["l", "r"] {
      guard let sh = Ruler.ok(j["\(side)Shoulder"]), let el = Ruler.ok(j["\(side)Elbow"]), let wr = Ruler.ok(j["\(side)Wrist"]) else { continue }
      let bend = Ruler.angle(sh, el, el, wr)
      let ua = CGVector(dx: el.x - sh.x, dy: el.y - sh.y), n = sqrt(ua.dx * ua.dx + ua.dy * ua.dy)
      guard n > 5 else { continue }
      let tilt = acos(max(-1, min(1, Double((ua.dx * axis.dx + ua.dy * axis.dy) / n)))) * 180 / .pi
      guard bend < armBend, tilt < armTilt else { continue }
      out.append(("\(side)Elbow", el, hElbow))
      out.append(("\(side)Wrist", wr, hWrist))
    }
    return out
  }

  /// Least squares h = a + b d through the points (a straight ruler).
  static func line(_ pts: [(d: Double, h: Double)]) -> ((Double) -> Double)? {
    guard pts.count >= 2 else { return nil }
    let md = pts.map(\.d).reduce(0, +) / Double(pts.count), mh = pts.map(\.h).reduce(0, +) / Double(pts.count)
    let sxx = pts.map { ($0.d - md) * ($0.d - md) }.reduce(0, +), sxy = pts.map { ($0.d - md) * ($0.h - mh) }.reduce(0, +)
    guard sxx > 25 else { return nil }
    let b = sxy / sxx
    return { d in mh + (d - md) * b }
  }

  /// h = (a d + b) / (c d + 1), least squares over the points (exact for 3). nil when it doesn't solve or isn't monotonic.
  /// A gentle prior that the camera's tilt is modest: the perspective term c is pulled toward 0 with weight `ridge`
  /// × the body's length in px × the height range, so a scale change of 10% along the body costs ~`ridge`×10 of
  /// the height range and a wild fit (the scale flipping between two joints) can't win on three noisy points.
  static var ridge = Double(ProcessInfo.processInfo.environment["WAIST_RIDGE"] ?? "") ?? 0.02
  static func projective(_ pts: [(d: Double, h: Double)], ridge: Double = 0) -> ((Double) -> Double, [Double])? {
    guard pts.count >= 3 else { return nil }
    // h = a d + b − c d h  →  rows [d, 1, −d h] · [a, b, c] = h
    var ata = simd_double3x3(0), atb = SIMD3<Double>(0, 0, 0)
    for p in pts {
      let r = SIMD3<Double>(p.d, 1, -p.d * p.h)
      ata += simd_double3x3(rows: [r * r.x, r * r.y, r * r.z])
      atb += r * p.h
    }
    if ridge > 0, let dl = pts.map(\.d).min(), let dh = pts.map(\.d).max(), let hl = pts.map(\.h).min(), let hh = pts.map(\.h).max() {
      let lam = ridge * (dh - dl) * (hh - hl)
      ata[2][2] += lam * lam
    }
    guard abs(ata.determinant) > 1e-12 else { return nil }
    let x = ata.inverse * atb
    let f: (Double) -> Double = { d in (x.x * d + x.y) / (x.z * d + 1) }
    // Monotonic over the body: the denominator mustn't cross zero between the highest and lowest point.
    let ds = pts.map(\.d)
    guard let lo = ds.min(), let hi = ds.max(), (x.z * lo + 1) * (x.z * hi + 1) > 0 else { return nil }
    return (f, [x.x, x.y, x.z])
  }

  static func linear(_ p: (d: Double, h: Double), _ q: (d: Double, h: Double)) -> ((Double) -> Double)? {
    guard abs(q.d - p.d) > 5 else { return nil }
    let k = (q.h - p.h) / (q.d - p.d)
    return { d in p.h + (d - p.d) * k }
  }

  static func mid(_ a: CGPoint?, _ b: CGPoint?) -> CGPoint? {
    switch (a, b) {
    case let (a?, b?): return Ruler.lerp(a, b, 0.5)
    case let (a?, nil): return a
    case let (nil, b?): return b
    default: return nil
    }
  }

  // MARK: Apple's 3D body pose

  struct Pose3D {
    var height: [String: Double] = [:] // meters up from the lowest ankle
    var image: [String: CGPoint] = [:] // statistics-copy pixels
    var bodyHeight: Double = 0
    var measured = false
  }

  static func pose3D(_ img: CGImage, main: CGRect?, statW: Int, statH: Int) -> Pose3D? {
    let req = VNDetectHumanBodyPose3DRequest()
    do { try VNImageRequestHandler(cgImage: img, orientation: .up).perform([req]) } catch { return nil }
    let W = CGFloat(img.width), H = CGFloat(img.height)
    let all = req.results ?? []
    // The main person: the one whose root lands inside his box.
    let obs = all.first { o in
      guard let main, let p = try? o.pointInImage(.root) else { return false }
      return main.contains(CGPoint(x: p.x * W, y: (1 - p.y) * H))
    } ?? all.first
    guard let o = obs else { return nil }
    let names: [(String, VNHumanBodyPose3DObservation.JointName)] = [
      ("topHead", .topHead), ("centerHead", .centerHead), ("centerShoulder", .centerShoulder), ("lShoulder", .leftShoulder), ("rShoulder", .rightShoulder),
      ("spine", .spine), ("root", .root), ("lHip", .leftHip), ("rHip", .rightHip), ("lKnee", .leftKnee), ("rKnee", .rightKnee),
      ("lAnkle", .leftAnkle), ("rAnkle", .rightAnkle),
    ]
    var p = Pose3D()
    var ys: [String: Double] = [:]
    for (k, n) in names {
      guard let rp = try? o.recognizedPoint(n) else { continue }
      ys[k] = Double(rp.position.columns.3.y) // model space, y up, relative to the root
      if let ip = try? o.pointInImage(n) {
        p.image[k] = CGPoint(x: CGFloat(ip.x) * CGFloat(statW), y: (1 - CGFloat(ip.y)) * CGFloat(statH))
      }
    }
    let floor = [ys["lAnkle"], ys["rAnkle"]].compactMap { $0 }.min() ?? (ys.values.min() ?? 0)
    p.height = ys.mapValues { $0 - floor }
    p.bodyHeight = Double(o.bodyHeight)
    p.measured = o.heightEstimation == .measured
    return p
  }

  // MARK: The rulers

  static func fits(_ j: [String: Ruler.Joint], _ g: Waist.Geo, _ p3: Pose3D?) -> [Fit] {
    var out: [Fit] = []
    let S = mid(Ruler.ok(j["lShoulder"]), Ruler.ok(j["rShoulder"]))
    let K = mid(Ruler.ok(j["lKnee"]), Ruler.ok(j["rKnee"]))
    let A = mid(Ruler.ok(j["lAnkle"]), Ruler.ok(j["rAnkle"]))
    // hips: shoulder line to hip joints, straight.
    if !g.hipsEstimated, let S, let f = linear((down(S, g), hShoulder), (0, hHip)) { out.append(Fit(name: "hips", tOf: { t(fromHeight: f($0)) })) }
    if let S, let K, let f = linear((down(S, g), hShoulder), (down(K, g), hKnee)) {
      out.append(Fit(name: "sk_linear", tOf: { t(fromHeight: f($0)) }, height: f))
    }
    if let S, let K, let A, let (f, c) = projective([(down(S, g), hShoulder), (down(K, g), hKnee), (down(A, g), hAnkle)]) {
      // The perspective term, as the ratio of scale at the knees to the shoulders (1 = no tilt).
      out.append(Fit(name: "ska_proj", tOf: { t(fromHeight: f($0)) }, info: ["persp": (c[2] * 1e4).rounded() / 1e4]))
    }
    if let S, let K, let A, let (f, _) = projective([(down(S, g), hShoulder), (down(K, g), hKnee), (down(A, g), hAnkle)], ridge: ridge) {
      out.append(Fit(name: "ska_proj_r", tOf: { t(fromHeight: f($0)) }))
    }
    // The arms as a backup (#269): shoulders + hanging elbows and wrists, straight.
    let downVec = CGVector(dx: -g.up.dx, dy: -g.up.dy)
    let arms = hangingArms(j, down: downVec)
    if let S, !arms.isEmpty, let f = line([(down(S, g), hShoulder)] + arms.map { (down($0.p, g), $0.h) }) {
      out.append(Fit(name: "arm_linear", tOf: { t(fromHeight: f($0)) }, info: ["arms": arms.count / 2], height: f))
    }
    // body_fit: every anchor it has (shoulders, hanging arms, knees, ankles). Projective with the tilt prior when
    // the anchors span the legs (knees or ankles), straight otherwise. This is the one ruler to use: knees when
    // they're there, the arms when they aren't.
    if let S {
      var pts: [(d: Double, h: Double)] = [(down(S, g), hShoulder)] + arms.map { (down($0.p, g), $0.h) }
      if let K { pts.append((down(K, g), hKnee)) }
      if let A { pts.append((down(A, g), hAnkle)) }
      let legs = K != nil || A != nil
      if legs, pts.count >= 3, let (f, _) = projective(pts, ridge: ridge) {
        out.append(Fit(name: "body_fit", tOf: { t(fromHeight: f($0)) }, info: ["anchors": pts.count, "from": arms.isEmpty ? "legs" : "legs+arms"], height: f))
      } else if let f = line(pts) {
        out.append(Fit(name: "body_fit", tOf: { t(fromHeight: f($0)) }, info: ["anchors": pts.count, "from": legs ? "legs" : "arms"], height: f))
      }
    }
    if let p3 {
      func img(_ k: String) -> CGPoint? { p3.image[k] }
      func h(_ k: String) -> Double? { p3.height[k] }
      // a3d_proj: his own joint heights from the 3D pose, fit to their image positions.
      var pts: [(d: Double, h: Double)] = []
      for k in ["centerShoulder", "spine", "root", "lHip", "rHip", "lKnee", "rKnee", "lAnkle", "rAnkle"] {
        if let ip = img(k), let hh = h(k) { pts.append((down(ip, g), hh)) }
      }
      let hS = [h("lShoulder"), h("rShoulder")].compactMap { $0 }, hK = [h("lKnee"), h("rKnee")].compactMap { $0 }
      if !hS.isEmpty, !hK.isEmpty, let (f, _) = projective(pts, ridge: ridge) {
        let s = hS.reduce(0, +) / Double(hS.count), k = hK.reduce(0, +) / Double(hK.count)
        if s - k > 0.2 { out.append(Fit(name: "a3d_proj", tOf: { d in (s - f(d)) / (s - k) }, info: ["bodyHeight": (p3.bodyHeight * 100).rounded() / 100, "measured": p3.measured])) }
      }
      let S3 = mid(img("lShoulder"), img("rShoulder")), K3 = mid(img("lKnee"), img("rKnee")), A3 = mid(img("lAnkle"), img("rAnkle"))
      if let S3, let K3, let A3, let (f, _) = projective([(down(S3, g), hShoulder), (down(K3, g), hKnee), (down(A3, g), hAnkle)], ridge: ridge) {
        out.append(Fit(name: "a3d_ansur", tOf: { t(fromHeight: f($0)) }))
      }
    }
    return out
  }

  /// Each ruler's reading of the measured clothes edges (s in torsos from the hip midpoint → px down the axis).
  static func readings(_ fits: [Fit], g: Waist.Geo, edges: [String: Double]) -> [String: Any] {
    var out: [String: Any] = [:]
    for f in fits {
      var r: [String: Any] = f.info
      for (k, s) in edges {
        if let tv = f.tOf(-s * Double(g.T)), tv.isFinite { r[k] = (tv * 1000).rounded() / 1000 }
      }
      // Where this ruler puts the hip midpoint (0 px), as a check on the 2D hip points.
      if let th = f.tOf(0), th.isFinite { r["hips_at"] = (th * 1000).rounded() / 1000 }
      out[f.name] = r
    }
    return out
  }

  // MARK: The silhouette (#269): how wide the clothes are, in cm on the body ruler's scale

  /// Widths of his outline (the clothes' silhouette) across the body, each turned into cm with the ruler's local
  /// scale at that height (so a mirror selfie's smaller legs aren't read as narrower pants). Garment against garment:
  /// the pants' width is compared with the top's (the founder: "the lower part has to be close to as wide as the top").
  /// Reported for the test only; nothing is scored. Widths include whatever is under the clothes, so the ratios, not
  /// the cm, are what a rule could use, and they're audited for body-size bias before any use.
  static func silhouette(_ c: Ruler.Ctx, _ j: [String: Ruler.Joint], _ g: Waist.Geo, _ f: Fit?, visualS: Double?) -> [String: Any] {
    guard let f, let h = f.height else { return ["why": "no ruler"] }
    func cmPerPx(_ p: CGPoint) -> Double { let d = down(p, g); return abs(h(d + 3) - h(d - 3)) / 6 }
    func across(_ p: CGPoint, cap: CGFloat) -> CGFloat? { Waist.runWidth(c, p, g.across, cap: cap) }
    var out: [String: Any] = [:]
    func put(_ k: String, _ w: CGFloat?, _ p: CGPoint) { if let w { out[k] = (Double(w) * cmPerPx(p) * 10).rounded() / 10 } }
    // Shoulders: just under the shoulder joints, the outline across (sleeve caps and all).
    let ps = g.at(1 - 0.08, 0)
    put("shoulder_cm", across(ps, cap: g.T * 1.2), ps)
    // The top at its hem: just above the visual waistline.
    if let v = visualS { let pt = g.at(v + 0.05, 0); put("top_hem_cm", across(pt, cap: g.T * 1.2), pt) }
    // Each leg, across the leg, capped at the gap to the other leg so touching legs come back unsure.
    var legs: [String: [Double]] = [:]
    for side in ["l", "r"] {
      let other = side == "l" ? "r" : "l"
      guard let k = Ruler.ok(j["\(side)Knee"]) else { continue }
      let hip = Ruler.ok(j["\(side)Hip"], Ruler.hipMin) ?? CGPoint(x: g.H.x + g.across.dx * (side == "l" ? 1 : -1) * g.half / 0.9, y: g.H.y + g.across.dy * (side == "l" ? 1 : -1) * g.half / 0.9)
      let ank = Ruler.ok(j["\(side)Ankle"])
      func w(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat, _ oa: CGPoint?, _ ob: CGPoint?) -> (CGFloat, CGPoint)? {
        let L = Ruler.dist(a, b); guard L > 10 else { return nil }
        let n = CGVector(dx: -(b.y - a.y) / L, dy: (b.x - a.x) / L), p = Ruler.lerp(a, b, t)
        var cap = L * 0.45
        if let oa, let ob { cap = min(cap, Ruler.dist(p, Ruler.lerp(oa, ob, t)) * 0.6) }
        return Waist.runWidth(c, p, n, cap: cap).map { ($0, p) }
      }
      let ok = Ruler.ok(j["\(other)Knee"]), oh = Ruler.ok(j["\(other)Hip"], Ruler.hipMin), oa = Ruler.ok(j["\(other)Ankle"])
      let parts: [(String, (CGFloat, CGPoint)?)] = [
        ("thigh", w(hip, k, 0.5, oh, ok)), ("knee", w(hip, k, 0.92, oh, ok)),
        ("shin", ank.flatMap { w(k, $0, 0.5, ok, oa) }), ("low", ank.flatMap { w(k, $0, 0.85, ok, oa) }),
      ]
      for (name, v) in parts { if let (px, p) = v { legs[name, default: []].append(Double(px) * cmPerPx(p)) } }
    }
    for (k, v) in legs { out["\(k)_cm"] = ((v.reduce(0, +) / Double(v.count)) * 10).rounded() / 10 }
    if let sh = out["shoulder_cm"] as? Double, sh > 0 {
      for k in ["thigh", "knee", "shin", "low"] { if let v = out["\(k)_cm"] as? Double { out["\(k)_over_shoulder"] = (v / sh * 1000).rounded() / 1000 } }
    }
    if let th = out["thigh_cm"] as? Double, th > 0, let lo = out["low_cm"] as? Double { out["low_over_thigh"] = (lo / th * 1000).rounded() / 1000 }
    if let top = out["top_hem_cm"] as? Double, top > 0, let kn = out["knee_cm"] as? Double { out["knee_over_top"] = (kn / top * 1000).rounded() / 1000 }
    out["ruler"] = f.name
    return out
  }
}
