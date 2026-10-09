// Leg width from the body outline (DECISIONS-LOG #106; moved out of the app's KittedMeasure.swift by #170).
// Harness only, never in the app: knee width over hip span measures his body as much as the pants (a width
// against the body would end up rating bodies), and on 50 stock photos it couldn't tell slim, straight and
// wide apart anyway. Kept so `kmeasure shape` can still reproduce the #106 numbers.
import CoreGraphics
import Foundation

extension Measure {
  /// Leg widths from the person mask at three heights per leg (thigh, knee, just above the ankle), in pixels
  /// of `mask`. A width is the run of mask pixels through the leg's own line (hip → knee → ankle); a run
  /// that also covers the other leg's point means the legs touch there, so it isn't used. Ratios: knee/thigh
  /// (slim legs taper, wide ones don't) and ankle/knee (joggers cuff in, wide and flared legs don't).
  struct LegShape {
    var thigh: [Double] = []
    var knee: [Double] = []
    var ankle: [Double] = []
    var kneeToThigh: Double?
    var ankleToKnee: Double?
    /// Leg width at the knee over the hip span: how much room the pants leave.
    var kneeToHips: Double?
  }

  static func legShape(joints: [String: CGPoint], mask: Guide.Gray, W: CGFloat, H: CGFloat) -> LegShape? {
    let sx = CGFloat(mask.w) / W, sy = CGFloat(mask.h) / H
    func p(_ k: String) -> CGPoint? { joints[k].map { CGPoint(x: $0.x * sx, y: $0.y * sy) } }
    guard let lh = p("lHip"), let rh = p("rHip") else { return nil }
    let hipSpan = Double(abs(lh.x - rh.x))
    guard hipSpan > 4 else { return nil }
    /// The run of mask pixels through `pt`; nil when it also covers `other` (the legs touch there).
    func run(at pt: CGPoint, other: CGPoint?) -> Double? {
      let y = Int(pt.y.rounded()), x = Int(pt.x.rounded())
      guard y >= 0, y < mask.h, x >= 0, x < mask.w, mask.px[y * mask.w + x] >= 128 else { return nil }
      var a = x, b = x
      while a > 0, mask.px[y * mask.w + a - 1] >= 128 { a -= 1 }
      while b < mask.w - 1, mask.px[y * mask.w + b + 1] >= 128 { b += 1 }
      if let o = other, Int(o.x.rounded()) >= a, Int(o.x.rounded()) <= b { return nil }
      return Double(b - a + 1)
    }
    func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t) }
    var out = LegShape()
    let legs = [("lHip", "lKnee", "lAnkle"), ("rHip", "rKnee", "rAnkle")]
    /// The three measuring points of one leg (nil where a joint is missing).
    func points(_ leg: (String, String, String)) -> [CGPoint?] {
      guard let hip = p(leg.0), let knee = p(leg.1) else { return [nil, nil, nil] }
      return [lerp(hip, knee, 0.3), knee, p(leg.2).map { lerp(knee, $0, 0.85) }]
    }
    let pts = legs.map(points)
    for (i, mine) in pts.enumerated() {
      let theirs = pts[1 - i]
      if let q = mine[0], let w = run(at: q, other: theirs[0]) { out.thigh.append(w) }
      if let q = mine[1], let w = run(at: q, other: theirs[1]) { out.knee.append(w) }
      if let q = mine[2], let w = run(at: q, other: theirs[2]) { out.ankle.append(w) }
    }
    func mean(_ v: [Double]) -> Double? { v.isEmpty ? nil : v.reduce(0, +) / Double(v.count) }
    if let t = mean(out.thigh), let k = mean(out.knee), t > 0 { out.kneeToThigh = k / t }
    if let k = mean(out.knee), let a = mean(out.ankle), k > 0 { out.ankleToKnee = a / k }
    if let k = mean(out.knee) { out.kneeToHips = k / hipSpan }
    return out
  }
}
