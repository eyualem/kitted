// The outline probe (T98, Nov 17; harness only, never in the app): widths of his person cutout (Apple's person
// segmentation, the mask iOS uses for cutouts) along each leg and down the torso, in pixels, with the joints they
// hang from. Python turns them into scale-free ratios (ankle against knee, knee against thigh, the top against the
// legs); nothing here is a judgment, and no width is ever turned into cm (the cutout includes the body under the
// clothes, so a width alone would judge body size).
//
//   kmeasure outline <photo.jpg> <out.json> [--max px] [--crop share] [--shift share]
//
// A width comes back null with a reason when the run hits its cap: the other leg, an arm or a bag merged into it.
import CoreGraphics
import Foundation
import Vision

enum Outline {
  static let thighT: [CGFloat] = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]   // hip (0) -> knee (1)
  static let shinT: [CGFloat] = [0.1, 0.3, 0.5, 0.7, 0.85, 0.95]     // knee (0) -> ankle (1)
  static let torsoS: [CGFloat] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]  // shoulders (0) -> hips (1)

  /// The outline's width across a line at p (direction n), both ways to the edge. nil past the cap.
  static func run(_ c: Ruler.Ctx, _ p: CGPoint, _ n: CGVector, cap: CGFloat) -> (Double?, String?) {
    guard Ruler.onMask(c, Int(p.x.rounded()), Int(p.y.rounded())) else { return (nil, "off the outline") }
    var w: CGFloat = 1
    for dir in [-1.0, 1.0] as [CGFloat] {
      var k: CGFloat = 1
      while k < cap, Ruler.onMask(c, Int((p.x + n.dx * k * dir).rounded()), Int((p.y + n.dy * k * dir).rounded())) { k += 1 }
      if k >= cap { return (nil, "merged") }
      w += k - 1
    }
    return (Double(w), nil)
  }

  static func r1(_ x: Double) -> Double { (x * 10).rounded() / 10 }

  static func run(_ img: CGImage) -> [String: Any] {
    Ruler.applyOverrides()
    let located = Prep.locate(img)
    guard located.status == "ok", let rgb = Measure.rgb(img, maxSide: Measure.statPx) else { return ["status": located.status] }
    let scale = CGFloat(rgb.w) / CGFloat(img.width)
    guard let mask = Measure.personMask(img, w: rgb.w, h: rgb.h).map({ Ruler.erode($0, r: 2) }) else { return ["status": "no person mask"] }
    let c = Ruler.Ctx(rgb: rgb, mask: mask)
    let j = Ruler.pose(img, main: located.main, scale: scale)
    let hands = Measure.handBoxes(img).map { CGRect(x: $0.minX * scale, y: $0.minY * scale, width: $0.width * scale, height: $0.height * scale) }
    var out: [String: Any] = ["status": "ok", "w": rgb.w, "h": rgb.h, "hands": hands.map { [Int($0.minX), Int($0.minY), Int($0.width), Int($0.height)] },
                              "joints": j.mapValues { ["x": r1(Double($0.p.x)), "y": r1(Double($0.p.y)), "c": ($0.c * 100).rounded() / 100] }]
    // Legs: perpendicular to the bone, capped at 0.45 of the bone and at 0.6 of the gap to the other leg's same point.
    var legs: [String: Any] = [:]
    for side in ["l", "r"] {
      let o = side == "l" ? "r" : "l"
      var row: [String: Any] = [:]
      let hip = Ruler.ok(j["\(side)Hip"], Ruler.hipMin), knee = Ruler.ok(j["\(side)Knee"]), ank = Ruler.ok(j["\(side)Ankle"])
      let oh = Ruler.ok(j["\(o)Hip"], Ruler.hipMin), ok2 = Ruler.ok(j["\(o)Knee"]), oa = Ruler.ok(j["\(o)Ankle"])
      func seg(_ a: CGPoint, _ b: CGPoint, _ oa_: CGPoint?, _ ob_: CGPoint?, _ ts: [CGFloat]) -> [[String: Any]] {
        let L = Ruler.dist(a, b)
        guard L > 10 else { return [] }
        let n = CGVector(dx: -(b.y - a.y) / L, dy: (b.x - a.x) / L)
        return ts.map { t in
          let p = Ruler.lerp(a, b, t)
          var cap = L * 0.45
          if let oa_, let ob_ { cap = min(cap, Ruler.dist(p, Ruler.lerp(oa_, ob_, t)) * 0.6) }
          let (w, why) = run(c, p, n, cap: cap)
          var d: [String: Any] = ["t": Double(t)]
          if let w { d["w"] = w } else { d["why"] = why ?? "?" }
          if hands.contains(where: { $0.insetBy(dx: -4, dy: -4).contains(p) }) { d["hand"] = true }
          return d
        }
      }
      if let hip, let knee {
        row["thigh"] = seg(hip, knee, oh, ok2, thighT)
        row["thigh_len"] = r1(Double(Ruler.dist(hip, knee)))
      }
      if let knee, let ank {
        row["shin"] = seg(knee, ank, ok2, oa, shinT)
        row["shin_len"] = r1(Double(Ruler.dist(knee, ank)))
      }
      legs[side] = row
    }
    out["legs"] = legs
    // Torso: across the body axis (shoulder midpoint -> hip midpoint), from the shoulders to past the hips.
    if let ls = Ruler.ok(j["lShoulder"]), let rs = Ruler.ok(j["rShoulder"]) {
      let S = CGPoint(x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2)
      let span = Ruler.dist(ls, rs)
      out["shoulder_span"] = r1(Double(span))
      var H: CGPoint?
      if let lh = Ruler.ok(j["lHip"], Ruler.hipMin), let rh = Ruler.ok(j["rHip"], Ruler.hipMin) {
        H = CGPoint(x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2)
        out["hip_span"] = r1(Double(Ruler.dist(lh, rh)))
      }
      if let H {
        let L = Ruler.dist(S, H)
        out["torso_len"] = r1(Double(L))
        if L > 10 {
          let n = CGVector(dx: -(H.y - S.y) / L, dy: (H.x - S.x) / L)
          out["torso"] = torsoS.map { s -> [String: Any] in
            let p = CGPoint(x: S.x + (H.x - S.x) * s, y: S.y + (H.y - S.y) * s)
            let (w, why) = run(c, p, n, cap: span * 1.6)
            var d: [String: Any] = ["s": Double(s)]
            if let w { d["w"] = w } else { d["why"] = why ?? "?" }
            return d
          }
        }
      }
    }
    return out
  }
}
