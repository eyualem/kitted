// Body rulers for the waist test (DECISIONS-LOG #270, Mac harness only). Each ruler maps a position down the body
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
  static let tNavel = 0.400, tCrest = 0.394, tHip = 0.562, tCrotch = 0.619
  static func t(fromHeight h: Double) -> Double { (hShoulder - h) / (hShoulder - hKnee) }

  /// Distance down the body axis from the hip midpoint, in pixels (positive = lower in the body).
  static func down(_ p: CGPoint, _ g: Waist.Geo) -> Double { Double((p.x - g.H.x) * -g.up.dx + (p.y - g.H.y) * -g.up.dy) }

  /// A ruler: position down the axis (px) → height (cm, or meters for a3d_proj before conversion) → t.
  struct Fit {
    let name: String
    let tOf: (Double) -> Double?
    var info: [String: Any] = [:]
  }

  /// h = (a d + b) / (c d + 1), least squares over the points (exact for 3). nil when it doesn't solve or isn't monotonic.
  /// A gentle prior that the camera's tilt is modest: the perspective term c is pulled toward 0 with weight `ridge`
  /// × the body's length in px × the height range, so a scale change of 10% along the body costs ~`ridge`×10 of
  /// the height range and a wild fit (the scale flipping between two joints) can't win on three noisy points.
  static var ridge = Double(ProcessInfo.processInfo.environment["WAIST_RIDGE"] ?? "") ?? 0.2
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
    if let S, let f = linear((down(S, g), hShoulder), (0, hHip)) { out.append(Fit(name: "hips", tOf: { t(fromHeight: f($0)) })) }
    if let S, let K, let f = linear((down(S, g), hShoulder), (down(K, g), hKnee)) {
      out.append(Fit(name: "sk_linear", tOf: { t(fromHeight: f($0)) }))
    }
    if let S, let K, let A, let (f, c) = projective([(down(S, g), hShoulder), (down(K, g), hKnee), (down(A, g), hAnkle)]) {
      // The perspective term, as the ratio of scale at the knees to the shoulders (1 = no tilt).
      out.append(Fit(name: "ska_proj", tOf: { t(fromHeight: f($0)) }, info: ["persp": (c[2] * 1e4).rounded() / 1e4]))
    }
    if let S, let K, let A, let (f, _) = projective([(down(S, g), hShoulder), (down(K, g), hKnee), (down(A, g), hAnkle)], ridge: ridge) {
      out.append(Fit(name: "ska_proj_r", tOf: { t(fromHeight: f($0)) }))
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
}
