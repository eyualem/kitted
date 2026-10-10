// The hem probe (M2, Oct 10, Mac harness only; rubric/research/notes/hem-probe.md): can the phone tell how the
// pants end at the shoe (no break / slight / full break / stacked / pooling / cropped) with no AI?
//
// It works on the face-hidden copy at the working size (2048 px), in the region just above and over each shoe:
//   1. Folds: the fabric's own luminance along the leg's axis (knee → ankle), in the last ~22% of the shin above
//      the hem edge, detrended; folds sitting across the leg show up as light/dark bands. Compared with the
//      same measure on the same leg's mid-shin (the fabric against itself), so texture and light cancel out.
//      Also the share of gradient running along the leg (edges across the leg) against mid-shin.
//   2. Fabric over the shoe: where the pants' color ends along the axis (the hem edge), whether a sock or skin
//      gap follows before the shoe's own color starts, and how much of the shoe is still visible below the hem
//      (as a share of the shoe's own width: shoe against shoe).
//   3. Spread: the pants' width just above the hem over its width a little higher up (pants against pants).
// Rules it keeps (founder, #164): never a garment's width against his body. Body joints only say where to
// measure (the knee → ankle line, its length as the unit for "how far along") and whether a spot can be trusted.
// The numbers go out raw with every gate's verdict; hem_probe.py picks the thresholds (leave-one-out).
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum HemProbe {
  typealias Joint = Ruler.Joint
  typealias Lab = Measure.Lab

  // MARK: Settings (fixed before the first run; the report quotes them)

  static var jointMin = 0.3
  static var pantsDE = 16.0 // a step still reads as the pants within this (lightness weighted ½: fold shadows stay pants)
  static var shoeDE = 18.0 // a step reads as the shoe within this
  static var sameDE = 12.0 // pants vs shoes closer than this: no edge to find (dark on dark)
  static var winT = 0.22 // fold window: this share of the shin above the hem edge…
  static var skipT = 0.025 // …stopping this far above it (the hem edge itself is not a fold)
  static var minShin = 90.0 // px at the working size; smaller legs can't show folds
  static var maxBend = 35.0 // a knee bent more than this (seated, striding) lifts and twists the hem
  static var sharpMin = 3.0
  static var darkL = 6.0 // pants this dark (L*, JPEG-crushed black) show no fold shading; the fold measures are unsure // blur gate: the shoe region's 90th-percentile luminance step per px

  static func de2(_ a: Lab, _ b: Lab) -> Double {
    let dL = (a.L - b.L) / 2
    return sqrt(dL * dL + (a.a - b.a) * (a.a - b.a) + (a.b - b.b) * (a.b - b.b))
  }

  static func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t) }
  static func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { hypot(a.x - b.x, a.y - b.y) }

  struct Img {
    let rgb: Measure.RGB
    let mask: Guide.Gray
    func on(_ x: Int, _ y: Int) -> Bool { x >= 0 && y >= 0 && x < mask.w && y < mask.h && mask.px[y * mask.w + x] >= 128 }
    func on(_ p: CGPoint) -> Bool { on(Int(p.x.rounded()), Int(p.y.rounded())) }
    func lum(_ x: Int, _ y: Int) -> Double? {
      guard x >= 0, y >= 0, x < rgb.w, y < rgb.h else { return nil }
      let j = (y * rgb.w + x) * 4
      return Measure.lab(rgb.px[j], rgb.px[j + 1], rgb.px[j + 2]).L
    }
    func lab(_ x: Int, _ y: Int) -> Lab? {
      guard x >= 0, y >= 0, x < rgb.w, y < rgb.h else { return nil }
      let j = (y * rgb.w + x) * 4
      return Measure.lab(rgb.px[j], rgb.px[j + 1], rgb.px[j + 2])
    }
  }

  /// One step down the leg's axis: his outline's run across the axis there, and the colors in its middle.
  struct Step {
    var t: Double
    var on = false
    var lo: CGFloat = 0, hi: CGFloat = 0
    var c = CGPoint.zero // the run's middle
    var lab: Lab? = nil // median color of the run's middle 60%
    var row: [Double] = [] // luminance at 1 px spacing across the middle 60%, centered on c
    var merged = false // the run reached the other leg's line and was cut halfway
    var width: Double { Double(hi - lo + 1) }
  }

  static func walk(_ im: Img, k: CGPoint, a: CGPoint, ok: CGPoint?, oa: CGPoint?, from t0: Double, to t1: Double) -> [Step] {
    let S = dist(k, a)
    let u = CGPoint(x: (a.x - k.x) / S, y: (a.y - k.y) / S)
    let n = CGPoint(x: -u.y, y: u.x)
    var out: [Step] = []
    var t = t0
    let dt = 1.0 / Double(S)
    var lastC: CGFloat = 0 // the previous run's middle, as an offset along n (follows the leg as it drifts)
    while t <= t1 {
      var st = Step(t: t)
      let base = lerp(k, a, CGFloat(t))
      func at(_ off: CGFloat) -> CGPoint { CGPoint(x: base.x + n.x * off, y: base.y + n.y * off) }
      let search = S * (t > 1 ? 0.08 : 0.15)
      var start: CGFloat? = nil
      var d: CGFloat = 0
      while d <= search {
        if im.on(at(lastC + d)) { start = lastC + d; break }
        if im.on(at(lastC - d)) { start = lastC - d; break }
        d += 1
      }
      if let s0 = start {
        var lo = s0, hi = s0
        let far = S * 0.45
        while lo - s0 > -far, im.on(at(lo - 1)) { lo -= 1 }
        while hi - s0 < far, im.on(at(hi + 1)) { hi += 1 }
        if let ok, let oa {
          let o = lerp(ok, oa, CGFloat(t))
          let s2 = (o.x - base.x) * n.x + (o.y - base.y) * n.y
          if s2 >= lo - 1, s2 <= hi + 1, abs(s2) > 4 {
            st.merged = true
            if s2 > 0 { hi = min(hi, s2 / 2) } else { lo = max(lo, s2 / 2) }
          }
        }
        if hi - lo >= 4 {
          st.on = true; st.lo = lo; st.hi = hi
          let mid = (lo + hi) / 2
          lastC = mid
          st.c = at(mid)
          let half = Int(((hi - lo) * 0.3).rounded())
          var labs: [Lab] = []
          for kx in -half...half {
            let p = at(mid + CGFloat(kx))
            let x = Int(p.x.rounded()), y = Int(p.y.rounded())
            if let l = im.lab(x, y) { labs.append(l); st.row.append(l.L) }
          }
          st.lab = Ruler.medianLab(labs)
        }
      }
      out.append(st)
      t += dt
    }
    return out
  }

  // MARK: Profiles

  static func gauss(_ v: [Double], sigma: Double) -> [Double] {
    guard sigma > 0.3, v.count > 2 else { return v }
    let r = Int((sigma * 3).rounded(.up))
    let w = (-r...r).map { exp(-Double($0 * $0) / (2 * sigma * sigma)) }
    return (0..<v.count).map { i in
      var s = 0.0, ws = 0.0
      for k in -r...r { let j = i + k; if j >= 0, j < v.count { s += v[j] * w[k + r]; ws += w[k + r] } }
      return s / ws
    }
  }

  static func movingMean(_ v: [Double], half: Int) -> [Double] {
    (0..<v.count).map { i in
      let a = max(0, i - half), b = min(v.count - 1, i + half)
      return v[a...b].reduce(0, +) / Double(b - a + 1)
    }
  }

  static func std(_ v: [Double]) -> Double {
    guard v.count > 1 else { return 0 }
    let m = v.reduce(0, +) / Double(v.count)
    return sqrt(v.map { ($0 - m) * ($0 - m) }.reduce(0, +) / Double(v.count - 1))
  }

  /// Fold structure in steps[a..<b]: the row-mean luminance along the axis, smoothed and detrended; troughs
  /// (dark bands across the leg) with a prominence over `thr`; gradient along vs across the leg.
  struct Folds { var detStd = 0.0; var troughs: [Int] = []; var along = 0.0; var across = 0.0; var meanL = 0.0; var rows = 0
    var orient: Double { across > 0 ? along / across : 0 } }

  static func folds(_ st: [Step], _ a: Int, _ b: Int, S: Double, thr: Double?) -> Folds? {
    let rows = (max(0, a)..<min(st.count, b)).filter { st[$0].on && st[$0].row.count >= 5 }
    guard rows.count >= 12 else { return nil }
    let prof = rows.map { st[$0].row.reduce(0, +) / Double(st[$0].row.count) }
    let sm = gauss(prof, sigma: max(1.0, 0.006 * S))
    let trend = movingMean(sm, half: max(3, Int(0.05 * S)))
    let det = zip(sm, trend).map { $0 - $1 }
    var f = Folds()
    f.rows = rows.count
    f.meanL = prof.reduce(0, +) / Double(prof.count)
    f.detStd = std(det)
    // Troughs: a local minimum whose rise to the highest point on each side (before a lower point) is ≥ thr.
    let need = thr ?? max(1.0, f.detStd)
    let minGap = max(2, Int(0.02 * S))
    var lastT = -1000
    for i in 1..<(det.count - 1) where det[i] <= det[i - 1] && det[i] < det[i + 1] {
      var l = det[i], r = det[i]
      var j = i - 1
      while j >= 0, det[j] >= det[i] { l = max(l, det[j]); j -= 1 }
      j = i + 1
      while j < det.count, det[j] >= det[i] { r = max(r, det[j]); j += 1 }
      if min(l, r) - det[i] >= need, i - lastT >= minGap { f.troughs.append(rows[i]); lastT = i }
    }
    // Gradients: along the axis (row i vs i+1 at the same offset from the middle) and across (neighbours in a row).
    var al = 0.0, an = 0, ac = 0.0, cn = 0
    for (ri, i) in rows.enumerated() {
      let r0 = st[i].row
      for x in 1..<r0.count { ac += abs(r0[x] - r0[x - 1]); cn += 1 }
      if ri + 1 < rows.count, rows[ri + 1] == i + 1 {
        let r1 = st[i + 1].row
        let m = min(r0.count, r1.count), o0 = (r0.count - m) / 2, o1 = (r1.count - m) / 2
        for x in 0..<m { al += abs(r0[x + o0] - r1[x + o1]); an += 1 }
      }
    }
    f.along = an > 0 ? al / Double(an) : 0
    f.across = cn > 0 ? ac / Double(cn) : 0
    return f
  }

  // MARK: The shoe

  /// This foot's box (the one around the ankle's x, nearest in y), split halfway between the ankles when one box
  /// holds both feet.
  static func shoeRect(_ shoes: [CGRect], ankle: CGPoint, other: CGPoint?) -> CGRect? {
    func near(_ r: CGRect) -> Bool { ankle.x >= r.minX - r.width * 0.1 && ankle.x <= r.maxX + r.width * 0.1 }
    guard var r = shoes.filter(near).min(by: { abs($0.midY - ankle.y) < abs($1.midY - ankle.y) }) else { return nil }
    if let o = other, o.x >= r.minX, o.x <= r.maxX, ankle.x >= r.minX, ankle.x <= r.maxX, abs(o.x - ankle.x) >= r.width * 0.2 {
      let mid = (ankle.x + o.x) / 2
      r = o.x > ankle.x ? CGRect(x: r.minX, y: r.minY, width: mid - r.minX, height: r.height) : CGRect(x: mid, y: r.minY, width: r.maxX - mid, height: r.height)
    }
    return r
  }

  /// The shoe's own color (median over his outline in the box's lower 45%) and its sharpness (90th percentile of
  /// the luminance step between neighbours, a blur check: laces, soles and stitching are crisp unless the photo moved).
  static func shoeColor(_ im: Img, _ r: CGRect) -> (lab: Lab?, sharp: Double, clusters: [Measure.Cluster]) {
    var labs: [Lab] = [], steps: [Double] = []
    let y0 = Int(r.minY + r.height * 0.4), y1 = Int(r.maxY), x0 = Int(r.minX), x1 = Int(r.maxX)
    guard y1 > y0, x1 > x0 else { return (nil, 0, []) }
    var yy = max(1, y0)
    while yy <= min(im.mask.h - 2, y1) {
      var xx = max(1, x0)
      while xx <= min(im.mask.w - 2, x1) {
        if im.on(xx, yy), let l = im.lab(xx, yy) {
          labs.append(l)
          if let r1 = im.lum(xx + 1, yy), let d1 = im.lum(xx, yy + 1) { steps.append(max(abs(r1 - l.L), abs(d1 - l.L))) }
        }
        xx += 2
      }
      yy += 2
    }
    let s = steps.sorted()
    return (Ruler.medianLab(labs), s.isEmpty ? 0 : s[min(s.count - 1, Int(Double(s.count) * 0.9))], Measure.clusters(labs).filter { $0.share >= 0.15 })
  }

  // MARK: One leg

  static func leg(_ im: Img, side: String, j: [String: Joint], shoes: [CGRect], hands: [CGRect], coats: [CGRect],
                  marks: inout [(CGPoint, CGPoint, Int)]) -> [String: Any] {
    let o = side == "l" ? "r" : "l"
    func ok(_ k: String) -> CGPoint? { j[k].flatMap { $0.c >= jointMin ? $0.p : nil } }
    var out: [String: Any] = ["side": side]
    var whys: [String] = []
    guard let k = ok("\(side)Knee"), let a = ok("\(side)Ankle") else { out["why"] = "knee or ankle not found"; return out }
    let S = Double(dist(k, a))
    out["shin"] = Int(S)
    out["conf"] = ((min(j["\(side)Knee"]!.c, j["\(side)Ankle"]!.c)) * 100).rounded() / 100
    if S < minShin { whys.append("too small") }
    if let h = ok("\(side)Hip") {
      let bend = Ruler.angle(h, k, k, a)
      out["bend"] = Int(bend)
      if bend > maxBend { whys.append("leg bent") }
    }
    if a.y > CGFloat(im.mask.h) - 3 || a.x < 2 || a.x > CGFloat(im.mask.w) - 3 { out["why"] = "ankle at the photo's edge"; return out }
    let steps = walk(im, k: k, a: a, ok: ok("\(o)Knee"), oa: ok("\(o)Ankle"), from: 0.3, to: 1.9)
    func idx(_ t: Double) -> Int { max(0, min(steps.count - 1, Int(((t - 0.3) * S).rounded()))) }
    let refLabs = steps[idx(0.35)...idx(0.65)].filter { $0.on }.compactMap(\.lab)
    guard refLabs.count >= 8, let pants = Ruler.medianLab(refLabs) else { out["why"] = "no pants on the shin"; return out }
    out["pantsL"] = Int(pants.L)
    // The shoe: this foot's box and its own color; with no box for this foot (the closet call boxed one shoe),
    // the bottom of his outline along this leg stands in (reported as "outline").
    let otherAnkle = ok("\(o)Ankle")
    let box = shoeRect(shoes, ankle: a, other: otherAnkle)
    var shoeLab: Lab? = nil
    var shoeCl: [Lab] = []
    if shoes.isEmpty { whys.append("no shoe box") }
    if let b = box {
      let sc = shoeColor(im, b)
      shoeLab = sc.clusters.first?.lab ?? sc.lab
      shoeCl = sc.clusters.map(\.lab)
      out["shoeColors"] = sc.clusters.map { Measure.hex($0.lab) }
      out["sharp"] = (sc.sharp * 10).rounded() / 10
      if sc.sharp < sharpMin { whys.append("blurry") }
      out["box"] = ["y0": Int(b.minY), "y1": Int(b.maxY)]
    } else if !shoes.isEmpty {
      var lastOn = -1, offRun = 0
      for q in idx(0.9)..<steps.count { if steps[q].on { lastOn = q; offRun = 0 } else { offRun += 1; if Double(offRun) > 0.04 * S { break } } }
      if lastOn > 0 {
        let labs = steps[max(0, lastOn - Int(0.06 * S))...lastOn].filter(\.on).compactMap(\.lab)
        shoeLab = Ruler.medianLab(labs)
        shoeCl = shoeLab.map { [$0] } ?? []
        out["shoeFrom"] = "outline"
      }
    }
    var sep: Double? = nil
    if let sl = shoeLab {
      sep = LegTaper.de1(pants, sl)
      out["shoeSep"] = Int(sep!)
      if sep! < sameDE { whys.append("dark on dark (pants and shoes match)") }
    }
    // Each step is the pants, the shoe, or something else (a sock, skin, the floor), by its nearer color (ΔE, kL 1).
    func kind(_ q: Int) -> Int { // 0 pants, 1 shoe, 2 other, 3 off his outline
      guard steps[q].on, let l = steps[q].lab else { return 3 }
      let dP = LegTaper.de1(l, pants)
      if !shoeCl.isEmpty {
        let dS = shoeCl.map { LegTaper.de1(l, $0) }.min()!
        if dP <= dS { return dP <= pantsDE * 1.5 ? 0 : 2 }
        return dS <= shoeDE ? 1 : 2
      }
      return dP <= pantsDE ? 0 : 2
    }
    let kinds = (0..<steps.count).map(kind)
    // The hem edge: the one place between 0.6 of the shin and the middle of the shoe box (or just above the sole)
    // where the colors along the leg change most (a two-segment fit of Lab along the axis: the split with the
    // smallest within-segment spread). Then checked: the stretch just above must be closer to the pants than the
    // stretch just below, which must differ from the pants and from the stretch above by more than sameDE.
    var sole0 = idx(0.6), off0 = 0
    for q in idx(0.6)..<steps.count { if steps[q].on { sole0 = q; off0 = 0 } else { off0 += 1; if Double(off0) > 0.04 * S { break } } }
    var end = sole0 - Int(0.03 * S)
    if let b = box, let q = (0..<steps.count).last(where: { steps[$0].on && steps[$0].c.y <= b.minY + b.height * 0.5 }) { end = min(end, q) }
    let i0 = idx(0.6), minSeg = max(4, Int(0.03 * S))
    var h: Int? = nil
    if end - i0 >= 2 * minSeg {
      var xs: [Lab] = []
      var prev: Lab = pants
      for q in i0...end { if steps[q].on, let l = steps[q].lab { prev = l }; xs.append(prev) }
      var cs = [(0.0, 0.0, 0.0)], cq = [0.0]
      for x in xs { let c = cs.last!; cs.append((c.0 + x.L, c.1 + x.a, c.2 + x.b)); cq.append(cq.last! + x.L * x.L + x.a * x.a + x.b * x.b) }
      func sse(_ a: Int, _ b: Int) -> Double { // [a, b)
        let n = Double(b - a), s0 = cs[b].0 - cs[a].0, s1 = cs[b].1 - cs[a].1, s2 = cs[b].2 - cs[a].2
        return (cq[b] - cq[a]) - (s0 * s0 + s1 * s1 + s2 * s2) / n
      }
      var best: (Double, Int)? = nil
      for k in minSeg...(xs.count - minSeg) {
        let v = sse(0, k) + sse(k, xs.count)
        if best == nil || v < best!.0 { best = (v, k) }
      }
      if let (_, k) = best {
        let above = Ruler.medianLab(Array(xs[max(0, k - minSeg)..<k])), below = Ruler.medianLab(Array(xs[k..<min(xs.count, k + minSeg)]))
        if let ab = above, let bl = below {
          out["edgeStep"] = Int(LegTaper.de1(ab, bl))
          if LegTaper.de1(ab, pants) < LegTaper.de1(bl, pants), LegTaper.de1(bl, pants) > sameDE, LegTaper.de1(ab, bl) > sameDE { h = i0 + k }
        }
      }
    }
    guard let he = h else {
      whys.append("no hem edge")
      out["why"] = whys.first!
      out["whys"] = whys
      return out
    }
    let tHem = steps[he].t
    out["tHem"] = (tHem * 1000).rounded() / 1000
    if he > 0, steps[he - 1].on { marks.append((CGPoint(x: steps[max(0, he - 1)].c.x - 25, y: steps[max(0, he - 1)].c.y), CGPoint(x: steps[max(0, he - 1)].c.x + 25, y: steps[max(0, he - 1)].c.y), 1)) }
    if let b = box { out["coverBox"] = ((Double(steps[he].c.y - b.minY) / Double(max(1, b.height))) * 100).rounded() / 100 }
    // Below the hem: the shoe starts where 3 steps in a row read as the shoe (closer to it than to the pants).
    var shoeStart: Int? = nil, sole: Int? = nil
    if shoeLab != nil {
      var q = he
      while q < steps.count - 3, Double(q - he) <= 0.5 * S {
        if (q..<(q + 3)).allSatisfy({ kinds[$0] == 1 }) { shoeStart = q; break }
        q += 1
      }
    }
    // The sole: the last step on his outline before 4% of the shin off it.
    var last = he, offRun = 0
    for q in he..<steps.count {
      if steps[q].on { last = q; offRun = 0 } else { offRun += 1; if Double(offRun) > 0.04 * S { break } }
    }
    // The shoe box's bottom bounds the sole (his outline can run on into a shadow, a reflection or the floor).
    if let b = box, let q = (he..<steps.count).last(where: { steps[$0].on && steps[$0].c.y <= b.maxY }), q < last { last = q }
    sole = last
    let soleY = steps[last].c.y
    out["tSole"] = (steps[last].t * 1000).rounded() / 1000
    if soleY > CGFloat(im.mask.h) - 4 || (box == nil && steps[last].t >= 1.89) || (box.map { $0.maxY > CGFloat(im.mask.h) - 4 } ?? false) { whys.append("feet cut off") }
    if let s0 = shoeStart {
      out["gapT"] = (Double(s0 - he) / S * 1000).rounded() / 1000
      out["shoeVisT"] = (Double(sole! - s0) / S * 1000).rounded() / 1000
      marks.append((CGPoint(x: steps[s0].c.x - 20, y: steps[s0].c.y), CGPoint(x: steps[s0].c.x + 20, y: steps[s0].c.y), 2))
      // The shoe's own width (his outline across the box, widest steady row in its lower 60%): shoe vs shoe.
      if let b = box {
        let scene = LegTaper.Scene(rgb: im.rgb, mask: im.mask, box: CGRect(x: 0, y: 0, width: im.rgb.w, height: im.rgb.h), tops: [], hands: [], forearms: [], wrists: [])
        let sw = LegTaper.shoeWidth(scene, shoes: [b], ankle: a, otherAnkle: nil)
        if let w = sw.width, sw.why.isEmpty || sw.why == "shoe fills its half of the box" {
          out["shoeW"] = Int(w)
          out["shoeVisToW"] = ((Double(sole! - s0) / w) * 100).rounded() / 100
        }
      }
    } else if shoeLab != nil {
      whys.append("shoe not found below the hem")
    }
    marks.append((CGPoint(x: steps[last].c.x - 15, y: soleY), CGPoint(x: steps[last].c.x + 15, y: soleY), 3))
    // Spread: the pants' width just above the hem over the width a little higher (pants vs pants).
    func medW(_ t0: Double, _ t1: Double) -> (Double?, Bool) {
      let r = steps[idx(t0)...idx(t1)].filter { $0.on }
      guard r.count >= 4 else { return (nil, false) }
      return (Ruler.median(r.map(\.width)), r.contains { $0.merged })
    }
    let (wLow, mLow) = medW(tHem - 0.06, tHem - 0.02), (wHigh, mHigh) = medW(tHem - 0.30, tHem - 0.22)
    if let x = wLow, let y = wHigh, y > 0 {
      out["spread"] = ((x / y) * 1000).rounded() / 1000
      if mLow || mHigh { out["spreadMerged"] = true }
    }
    // Folds above the hem, against the same leg's mid-shin.
    let wa = he - Int(winT * S), wb = he - Int(skipT * S)
    let midLen = wb - wa
    let ma = idx(0.38), mb = min(idx(0.38) + midLen, idx(0.62))
    if wa >= 0, let mid = folds(steps, ma, mb, S: S, thr: nil), let fw = folds(steps, wa, wb, S: S, thr: max(1.0, 1.5 * mid.detStd)) {
      out["foldStd"] = (fw.detStd * 100).rounded() / 100
      out["midStd"] = (mid.detStd * 100).rounded() / 100
      out["foldRatio"] = (fw.detStd / max(0.3, mid.detStd) * 100).rounded() / 100
      out["folds"] = fw.troughs.count
      out["foldsAbs"] = (folds(steps, wa, wb, S: S, thr: 2.0)?.troughs.count) ?? 0
      out["orient"] = (fw.orient * 100).rounded() / 100
      out["orientMid"] = (mid.orient * 100).rounded() / 100
      out["orientRatio"] = mid.orient > 0 ? (fw.orient / mid.orient * 100).rounded() / 100 : NSNull()
      out["foldL"] = Int(fw.meanL)
      if fw.meanL < darkL { whys.append("pants too dark to show folds") }
      for tr in fw.troughs { marks.append((CGPoint(x: steps[tr].c.x - 12, y: steps[tr].c.y), CGPoint(x: steps[tr].c.x + 12, y: steps[tr].c.y), 4)) }
    } else {
      whys.append("fold window off his outline")
    }
    // Hands or a coat in the region (the fold window + the shoe).
    if wa >= 0 {
      let pts = [steps[wa], steps[he]].filter(\.on).map(\.c)
      if let y0 = pts.map(\.y).min() {
        let xs = steps[max(0, wa)..<he].filter(\.on).flatMap { [$0.c.x - CGFloat($0.width) / 2, $0.c.x + CGFloat($0.width) / 2] }
        if let x0 = xs.min(), let x1 = xs.max() {
          let region = CGRect(x: x0, y: y0, width: x1 - x0, height: soleY - y0)
          if hands.contains(where: { $0.intersects(region) }) { whys.append("hand in the region") }
          if coats.contains(where: { $0.maxY > y0 + region.height * 0.1 && $0.minX < x1 && $0.maxX > x0 }) { whys.append("coat over the region") }
        }
      }
    }
    if wa >= 0, steps[wa].on, steps[he - 1].on { marks.append((steps[wa].c, steps[he - 1].c, 0)) }
    if !whys.isEmpty { out["why"] = whys.first!; out["whys"] = whys }
    return out
  }

  // MARK: The whole probe

  static func run(_ img: CGImage, boxes list: [[String: Any]]) -> (json: [String: Any], hidden: CGImage?, marks: [(CGPoint, CGPoint, Int)]) {
    let env = ProcessInfo.processInfo.environment
    if let v = env["HEM_PANTS_DE"].flatMap(Double.init) { pantsDE = v }
    if let v = env["HEM_WIN"].flatMap(Double.init) { winT = v }
    let t0 = CFAbsoluteTimeGetCurrent()
    let located = Prep.locate(img)
    guard located.status == "ok", let hidden = Prep.hideRegions(img, located.hide) else { return (["status": located.status], nil, []) }
    // Everything is measured on the face-hidden copy, at the working size.
    guard let rgb = Measure.rgb(hidden, maxSide: max(img.width, img.height)),
          let mask = Measure.personMask(img, w: rgb.w, h: rgb.h) else { return (["status": "no person mask"], nil, []) }
    let im = Img(rgb: rgb, mask: mask)
    let j = Ruler.pose(img, main: located.main, scale: 1)
    let hands = Measure.handBoxes(img)
    let W = CGFloat(rgb.w), H = CGFloat(rgb.h)
    func rect(_ b: [Double]) -> CGRect { CGRect(x: b[1] / 1000 * W, y: b[0] / 1000 * H, width: (b[3] - b[1]) / 1000 * W, height: (b[2] - b[0]) / 1000 * H) }
    var shoes: [CGRect] = [], coats: [CGRect] = []
    var bottom: String? = nil
    for g in list {
      guard let c = g["category"] as? String, let b = g["box"] as? [Double], b.count == 4 else { continue }
      if c == "footwear" { shoes.append(rect(b)) }
      if c == "outerwear" || c == "top" { coats.append(rect(b)) }
      if c == "bottom" { bottom = g["subcategory"] as? String }
    }
    var marks: [(CGPoint, CGPoint, Int)] = []
    var legs: [[String: Any]] = []
    for s in ["l", "r"] { legs.append(leg(im, side: s, j: j, shoes: shoes, hands: hands, coats: coats, marks: &marks)) }
    let out: [String: Any] = ["status": "ok", "w": rgb.w, "h": rgb.h, "shoeBoxes": shoes.count, "bottom": bottom ?? NSNull(),
                              "legs": legs, "ms": Int((CFAbsoluteTimeGetCurrent() - t0) * 1000)]
    return (out, hidden, marks)
  }

  /// The measurements drawn on the face-hidden copy (never the kept photo), cropped to the lower legs.
  /// Colors: magenta = fold window, cyan = hem edge, yellow = shoe starts, red = sole, green = fold troughs.
  static func overlay(_ hidden: CGImage, marks: [(CGPoint, CGPoint, Int)], to url: URL) throws {
    guard let rgb = Measure.rgb(hidden, maxSide: max(hidden.width, hidden.height)), !marks.isEmpty else { return }
    var px = rgb.px
    guard let ctx = px.withUnsafeMutableBytes({ raw in
      CGContext(data: raw.baseAddress, width: rgb.w, height: rgb.h, bitsPerComponent: 8, bytesPerRow: rgb.w * 4,
                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    }) else { return }
    ctx.translateBy(x: 0, y: CGFloat(rgb.h)); ctx.scaleBy(x: 1, y: -1)
    let colors: [CGColor] = [CGColor(srgbRed: 1, green: 0.1, blue: 0.7, alpha: 1), CGColor(srgbRed: 0, green: 0.9, blue: 1, alpha: 1),
                             CGColor(srgbRed: 1, green: 0.9, blue: 0, alpha: 1), CGColor(srgbRed: 1, green: 0.1, blue: 0.1, alpha: 1),
                             CGColor(srgbRed: 0.1, green: 1, blue: 0.2, alpha: 1)]
    ctx.setLineWidth(3)
    for (a, b, c) in marks { ctx.setStrokeColor(colors[c]); ctx.move(to: a); ctx.addLine(to: b); ctx.strokePath() }
    guard let full = ctx.makeImage() else { return }
    let xs = marks.flatMap { [$0.0.x, $0.1.x] }, ys = marks.flatMap { [$0.0.y, $0.1.y] }
    let pad: CGFloat = 80
    let r = CGRect(x: xs.min()! - pad, y: ys.min()! - pad, width: xs.max()! - xs.min()! + 2 * pad, height: ys.max()! - ys.min()! + 2 * pad)
      .intersection(CGRect(x: 0, y: 0, width: rgb.w, height: rgb.h)).integral
    guard let crop = full.cropping(to: r), let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, crop, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
    CGImageDestinationFinalize(dest)
  }
}
