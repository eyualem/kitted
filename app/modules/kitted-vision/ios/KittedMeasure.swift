// On-device measuring (DECISIONS-LOG #104): the AI names each piece and draws its box; the phone
// measures. For each garment box from the closet call:
//   - which of his pixels belong to it: Vision's person mask, inside the box, where boxes overlap the
//     smallest box wins (a hoodie strip inside an open overshirt's box is the hoodie's), and every
//     face/head region removed (a face never appears in a cut-out)
//   - its dominant color (CIE L*a*b*, the largest of 3 clusters), so "cream vs tan" is a measurement
//   - a transparent cut-out from the face-hidden copy, quality numbers, and an image feature print
//     (Apple's built-in image fingerprint) for closet matching
// Also the zoom rectangles for the scoring call (his body, upper and lower half, from the pose).
// Statistics run on a small copy (1024 px); cut-outs render at full size
// with Core Image. No UIKit or Expo here, so the Mac harness (extraction-test/vision) compiles it.
import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

enum Measure {
  /// The long edge the statistics run at.
  static let statPx = 1024
  /// Head regions (Prep's, already grown to the whole head) are grown by this share again.
  static let headPad: CGFloat = 0.05

  /// Every head, grown: never in any cut-out.
  static func grownHeads(_ heads: [CGRect]) -> [CGRect] {
    heads.map { $0.insetBy(dx: -$0.width * headPad, dy: -$0.height * headPad) }
  }
  /// Layer order where boxes tie: outer layers sit over inner ones.
  static let layerRank: [String: Int] = ["outerwear": 4, "traditional": 4, "top": 3, "bottom": 2, "footwear": 1, "accessory": 0]

  struct Garment {
    let index: Int
    let category: String
    /// Pixels in the full image, origin top-left.
    let rect: CGRect
  }

  /// RGBX copy, row-major, origin top-left.
  struct RGB {
    let w: Int
    let h: Int
    let px: [UInt8]
  }

  static func rgb(_ img: CGImage, maxSide: Int) -> RGB? {
    let s = min(1, Double(maxSide) / Double(max(img.width, img.height)))
    let w = max(1, Int((Double(img.width) * s).rounded())), h = max(1, Int((Double(img.height) * s).rounded()))
    var px = [UInt8](repeating: 0, count: w * h * 4)
    let ok = px.withUnsafeMutableBytes { raw -> Bool in
      guard let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return false }
      ctx.interpolationQuality = .high
      ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
      return true
    }
    return ok ? RGB(w: w, h: h, px: px) : nil
  }

  // MARK: Person mask

  /// Vision's person segmentation at w×h (0–255), or nil when it can't run.
  static func personMask(_ img: CGImage, w: Int, h: Int) -> Guide.Gray? {
    let req = VNGeneratePersonSegmentationRequest()
    req.qualityLevel = .accurate
    req.outputPixelFormat = kCVPixelFormatType_OneComponent8
    Prep.cpuOnSimulator([req])
    do { try VNImageRequestHandler(cgImage: img, orientation: .up).perform([req]) } catch { return nil }
    guard let pb = req.results?.first?.pixelBuffer else { return nil }
    let ci = CIImage(cvPixelBuffer: pb)
    guard let cg = Prep.ciContext.createCGImage(ci, from: ci.extent) else { return nil }
    // Drawn into a gray context: row 0 is the top of the image, like every other copy here.
    var px = [UInt8](repeating: 0, count: w * h)
    let ok = px.withUnsafeMutableBytes { raw -> Bool in
      guard let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return false }
      ctx.interpolationQuality = .medium
      ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
      return true
    }
    return ok ? Guide.Gray(w: w, h: h, px: px) : nil
  }

  // MARK: Color

  typealias Lab = (L: Double, a: Double, b: Double)

  static func lab(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Lab {
    func lin(_ c: UInt8) -> Double { let v = Double(c) / 255; return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
    let R = lin(r), G = lin(g), B = lin(b)
    let x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047
    let y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B
    let z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883
    let d = 6.0 / 29.0
    func f(_ t: Double) -> Double { t > d * d * d ? cbrt(t) : t / (3 * d * d) + 4.0 / 29.0 }
    return (116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z)))
  }

  static func hex(_ c: Lab) -> String {
    let d = 6.0 / 29.0
    func finv(_ t: Double) -> Double { t > d ? t * t * t : 3 * d * d * (t - 4.0 / 29.0) }
    let fy = (c.L + 16) / 116
    let x = 0.95047 * finv(fy + c.a / 500), y = finv(fy), z = 1.08883 * finv(fy - c.b / 200)
    let rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    let gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z
    let bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    func enc(_ v: Double) -> Int {
      let v = max(0, v)
      let s = v <= 0.0031308 ? 12.92 * v : 1.055 * pow(v, 1 / 2.4) - 0.055
      return max(0, min(255, Int((s * 255).rounded())))
    }
    return String(format: "#%02X%02X%02X", enc(rl), enc(gl), enc(bl))
  }

  struct Cluster {
    let lab: Lab
    let share: Double
  }

  /// k-means (k = 3) in Lab, deterministic: at most 6,000 samples taken at a fixed stride, centers
  /// started at the 1/6, 1/2 and 5/6 lightness quantiles. Largest cluster first.
  static func clusters(_ samples: [Lab], k: Int = 3) -> [Cluster] {
    guard !samples.isEmpty else { return [] }
    let stride = max(1, samples.count / 6000)
    var pts: [Lab] = []
    var i = 0
    while i < samples.count { pts.append(samples[i]); i += stride }
    let byL = pts.sorted { $0.L < $1.L }
    let kk = min(k, pts.count)
    var centers: [Lab] = (0..<kk).map { byL[min(byL.count - 1, (2 * $0 + 1) * byL.count / (2 * kk))] }
    var assign = [Int](repeating: 0, count: pts.count)
    for _ in 0..<12 {
      var changed = false
      for (j, p) in pts.enumerated() {
        var best = 0, bestD = Double.infinity
        for (c, m) in centers.enumerated() {
          let d = (p.L - m.L) * (p.L - m.L) + (p.a - m.a) * (p.a - m.a) + (p.b - m.b) * (p.b - m.b)
          if d < bestD { bestD = d; best = c }
        }
        if assign[j] != best { assign[j] = best; changed = true }
      }
      var sum = [(Double, Double, Double, Int)](repeating: (0, 0, 0, 0), count: kk)
      for (j, p) in pts.enumerated() { let c = assign[j]; sum[c] = (sum[c].0 + p.L, sum[c].1 + p.a, sum[c].2 + p.b, sum[c].3 + 1) }
      for c in 0..<kk where sum[c].3 > 0 { centers[c] = (sum[c].0 / Double(sum[c].3), sum[c].1 / Double(sum[c].3), sum[c].2 / Double(sum[c].3)) }
      if !changed { break }
    }
    var counts = [Int](repeating: 0, count: kk)
    for c in assign { counts[c] += 1 }
    return (0..<kk).filter { counts[$0] > 0 }
      .map { Cluster(lab: centers[$0], share: Double(counts[$0]) / Double(pts.count)) }
      .sorted { $0.share > $1.share }
  }

  // MARK: Garments

  struct Result {
    let index: Int
    /// Owned pixels (at the stats size) and their share of the box.
    var ownedPx = 0
    var coverage = 0.0
    /// Share of the box under boxes of outer layers (a hoodie under an overshirt: high).
    var overlapOuter = 0.0
    /// Share of the box inside a head or hand region (left out of the color; heads out of everything).
    var headOverlap = 0.0
    /// The box's size in the full image.
    var boxW = 0
    var boxH = 0
    /// Sharpness (variance of the Laplacian) over the box at the stats size.
    var lapVar = 0.0
    var clusters: [Cluster] = []
    var mask: [UInt8] = [] // stats size, whole frame: the pixels the color is measured on
    var tileMask: [UInt8] = [] // the same size: the display cut-out (no color dropping, hands kept)
    /// Pixels in the box (stats size), and the share dropped as the outer layer's colors.
    var boxPx = 0
    var droppedOuter = 0.0
  }

  static func layer(_ g: Garment) -> Int { layerRank[g.category] ?? 0 }

  /// Per garment: owned pixels, quality numbers and color clusters. `heads` (grown) are never used;
  /// `hands` (and the phone in them) are left out of the color but kept in the display cut-out.
  /// Two masks come back: `mask` for color (both steps below) and `tileMask` for display (step 1
  /// only, hands kept), so a picture has no holes where the color measurement had to skip.
  ///  1. A pixel belongs to a garment when it's on his body (person mask), inside the box, and that is
  ///     the smallest box containing it (ties: the outer layer).
  ///  2. Colors of the layer over it are then dropped: where an outer layer's box overlaps (an open
  ///     overshirt around a hoodie strip, the pant hem over a boot), the outer piece's main colors (its
  ///     pixels outside this box; clusters of 30%+, so a shirt's shadows don't count) are measured, and
  ///     this piece's color clusters within ΔE 12 of them are removed, unless that would remove more
  ///     than 60% (same-colored layers keep everything; the color then can't be told apart anyway).
  static func measure(image: CGImage, garments: [Garment], heads: [CGRect], hands: [CGRect], person: Guide.Gray?, rgb: RGB) -> [Result] {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    let sx = CGFloat(rgb.w) / W, sy = CGFloat(rgb.h) / H
    func small(_ r: CGRect) -> CGRect { CGRect(x: r.minX * sx, y: r.minY * sy, width: r.width * sx, height: r.height * sy) }
    let frame = CGRect(x: 0, y: 0, width: rgb.w, height: rgb.h)
    let boxes = garments.map { small($0.rect).intersection(frame) }
    let headBoxes = heads.map { small($0) }
    let handBoxes = hands.map { small($0) }
    var lum = [UInt8](repeating: 0, count: rgb.w * rgb.h)
    for j in 0..<lum.count {
      let r = Int(rgb.px[j * 4]) * 299, g = Int(rgb.px[j * 4 + 1]) * 587, b = Int(rgb.px[j * 4 + 2]) * 114
      lum[j] = UInt8((r + g + b) / 1000)
    }
    let gray = Guide.Gray(w: rgb.w, h: rgb.h, px: lum)
    func labAt(_ j: Int) -> Lab { lab(rgb.px[j * 4], rgb.px[j * 4 + 1], rgb.px[j * 4 + 2]) }
    func span(_ b: CGRect) -> (Int, Int, Int, Int) {
      (max(0, Int(b.minX)), min(rgb.w, Int(b.maxX.rounded(.up))), max(0, Int(b.minY)), min(rgb.h, Int(b.maxY.rounded(.up))))
    }

    // Pass 1: ownership.
    var owned = [[Int]](repeating: [], count: garments.count)
    var tile = [[Int]](repeating: [], count: garments.count)
    var results = garments.map { Result(index: $0.index, boxW: Int($0.rect.width.rounded()), boxH: Int($0.rect.height.rounded())) }
    for (gi, g) in garments.enumerated() {
      let box = boxes[gi]
      guard !box.isNull, box.width >= 2, box.height >= 2 else { continue }
      let outer = boxes.enumerated().filter { $0.offset != gi && layer(garments[$0.offset]) > layer(g) }.map(\.element)
      var inBox = 0, underOuter = 0, inExcluded = 0
      let (x0, x1, y0, y1) = span(box)
      for y in y0..<y1 {
        for x in x0..<x1 {
          let p = CGPoint(x: CGFloat(x) + 0.5, y: CGFloat(y) + 0.5)
          inBox += 1
          if outer.contains(where: { $0.contains(p) }) { underOuter += 1 }
          if headBoxes.contains(where: { $0.contains(p) }) { inExcluded += 1; continue }
          if let m = person, m.px[y * m.w + x] < 128 { continue }
          let owner = boxes.enumerated().filter { $0.element.contains(p) }.min { a, b in
            let aa = a.element.width * a.element.height, ba = b.element.width * b.element.height
            return aa != ba ? aa < ba : layer(garments[a.offset]) > layer(garments[b.offset])
          }?.offset
          guard owner == gi else { continue }
          tile[gi].append(y * rgb.w + x)
          if handBoxes.contains(where: { $0.contains(p) }) { inExcluded += 1; continue }
          owned[gi].append(y * rgb.w + x)
        }
      }
      results[gi].overlapOuter = inBox > 0 ? Double(underOuter) / Double(inBox) : 0
      results[gi].headOverlap = inBox > 0 ? Double(inExcluded) / Double(inBox) : 0
      results[gi].boxPx = inBox
      let bw = x1 - x0, bh = y1 - y0
      if bw > 2, bh > 2 {
        var sub = [UInt8](repeating: 0, count: bw * bh)
        for y in 0..<bh { for x in 0..<bw { sub[y * bw + x] = gray.px[(y0 + y) * rgb.w + x0 + x] } }
        results[gi].lapVar = Guide.lapVar(Guide.Gray(w: bw, h: bh, px: sub))
      }
    }

    for gi in garments.indices where !tile[gi].isEmpty {
      var t = [UInt8](repeating: 0, count: rgb.w * rgb.h)
      for j in tile[gi] { t[j] = 255 }
      results[gi].tileMask = t
    }

    // Pass 2: drop the colors of the layer over it.
    for (gi, g) in garments.enumerated() where !owned[gi].isEmpty {
      let box = boxes[gi]
      var outerColors: [Lab] = []
      for (oi, o) in garments.enumerated() where oi != gi && layer(o) > layer(g) && boxes[oi].intersects(box) {
        let own = owned[oi].filter { j in !box.contains(CGPoint(x: CGFloat(j % rgb.w) + 0.5, y: CGFloat(j / rgb.w) + 0.5)) }
        outerColors += clusters(own.map(labAt)).filter { $0.share >= 0.3 }.map(\.lab)
      }
      var keep = owned[gi]
      if !outerColors.isEmpty {
        let labs = keep.map(labAt)
        let cs = clusters(labs)
        func de(_ a: Lab, _ b: Lab) -> Double { sqrt((a.L - b.L) * (a.L - b.L) + (a.a - b.a) * (a.a - b.a) + (a.b - b.b) * (a.b - b.b)) }
        let drop = Set(cs.indices.filter { c in outerColors.contains { de($0, cs[c].lab) < 12 } })
        let dropShare = drop.reduce(0.0) { $0 + cs[$1].share }
        if !drop.isEmpty, dropShare <= 0.6 {
          keep = zip(keep, labs).filter { _, l in
            let nearest = cs.indices.min { de(l, cs[$0].lab) < de(l, cs[$1].lab) }!
            return !drop.contains(nearest)
          }.map(\.0)
          results[gi].droppedOuter = dropShare
        }
      }
      var mask = [UInt8](repeating: 0, count: rgb.w * rgb.h)
      for j in keep { mask[j] = 255 }
      results[gi].mask = mask
      results[gi].ownedPx = keep.count
      results[gi].coverage = results[gi].boxPx > 0 ? Double(keep.count) / Double(results[gi].boxPx) : 0
      results[gi].clusters = clusters(keep.map(labAt))
    }
    return results
  }

  /// His hands (and so the phone in a mirror selfie): the box around each hand's joints, grown 40%.
  static func handBoxes(_ img: CGImage) -> [CGRect] {
    let req = VNDetectHumanHandPoseRequest()
    req.maximumHandCount = 4
    Prep.cpuOnSimulator([req])
    do { try VNImageRequestHandler(cgImage: img, orientation: .up).perform([req]) } catch { return [] }
    let W = CGFloat(img.width), H = CGFloat(img.height)
    return (req.results ?? []).compactMap { obs in
      guard let pts = try? obs.recognizedPoints(.all) else { return nil }
      let ok = pts.values.filter { $0.confidence > 0.3 }.map { CGPoint(x: $0.location.x * W, y: (1 - $0.location.y) * H) }
      guard ok.count >= 5, let minX = ok.map(\.x).min(), let maxX = ok.map(\.x).max(), let minY = ok.map(\.y).min(), let maxY = ok.map(\.y).max() else { return nil }
      let r = CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
      let side = max(r.width, r.height)
      return r.insetBy(dx: -side * 0.4, dy: -side * 0.4)
    }
  }

  // MARK: Cut-outs and fingerprints

  /// The garment's pixels from `source` (the face-hidden copy), feathered, on a clear background,
  /// cropped to its box. Full size.
  static func cutout(source: CGImage, mask: [UInt8], maskW: Int, maskH: Int, rect: CGRect) -> CGImage? {
    let W = CGFloat(source.width), H = CGFloat(source.height)
    var m = mask
    guard let provider = CGDataProvider(data: Data(bytes: &m, count: m.count) as CFData),
          let maskCG = CGImage(width: maskW, height: maskH, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: maskW,
                               space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
                               provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent) else { return nil }
    let maskCI = CIImage(cgImage: maskCG)
      .transformed(by: CGAffineTransform(scaleX: W / CGFloat(maskW), y: H / CGFloat(maskH)))
      .clampedToExtent()
      .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: max(1.5, W / CGFloat(maskW) * 0.8)])
      .cropped(to: CGRect(x: 0, y: 0, width: W, height: H))
    let src = CIImage(cgImage: source)
    let out = src.applyingFilter("CIBlendWithMask", parameters: [
      kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: src.extent),
      kCIInputMaskImageKey: maskCI,
    ])
    let r = rect.intersection(CGRect(x: 0, y: 0, width: W, height: H))
    guard !r.isNull else { return nil }
    let ciRect = CGRect(x: r.minX, y: H - r.maxY, width: r.width, height: r.height) // CI origin is bottom-left
    return Prep.ciContext.createCGImage(out, from: ciRect, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB))
  }

  /// Shoes: the box usually holds both feet. The display cut-out shows the one with more of his pixels: the
  /// mask's columns are split at the widest empty gap in the middle half of the box, and the bigger side's own
  /// bounds (padded 8%) become the crop. nil (use the whole box) when there's no clear gap.
  static func singleShoeRect(mask: [UInt8], maskW: Int, maskH: Int, rect: CGRect, W: CGFloat, H: CGFloat) -> CGRect? {
    let sx = CGFloat(maskW) / W, sy = CGFloat(maskH) / H
    let x0 = max(0, Int(rect.minX * sx)), x1 = min(maskW, Int((rect.maxX * sx).rounded(.up)))
    let y0 = max(0, Int(rect.minY * sy)), y1 = min(maskH, Int((rect.maxY * sy).rounded(.up)))
    guard x1 - x0 >= 8, y1 > y0 else { return nil }
    var cols = [Int](repeating: 0, count: x1 - x0)
    for y in y0..<y1 { for x in x0..<x1 where mask[y * maskW + x] > 0 { cols[x - x0] += 1 } }
    // The widest run of empty columns inside the middle half.
    let lo = cols.count / 4, hi = cols.count * 3 / 4
    var best = (start: -1, len: 0), cur = (start: -1, len: 0)
    for i in lo..<hi {
      if cols[i] == 0 { cur = cur.start < 0 ? (i, 1) : (cur.start, cur.len + 1); if cur.len > best.len { best = cur } } else { cur = (-1, 0) }
    }
    guard best.len >= 2 else { return nil }
    let left = cols[..<best.start].reduce(0, +), right = cols[(best.start + best.len)...].reduce(0, +)
    let (a, b) = left >= right ? (0, best.start) : (best.start + best.len, cols.count)
    var minX = Int.max, maxX = -1, minY = Int.max, maxY = -1
    for y in y0..<y1 { for x in (x0 + a)..<(x0 + b) where mask[y * maskW + x] > 0 {
      minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
    } }
    guard maxX >= 0 else { return nil }
    let r = CGRect(x: CGFloat(minX) / sx, y: CGFloat(minY) / sy, width: CGFloat(maxX - minX + 1) / sx, height: CGFloat(maxY - minY + 1) / sy)
    return r.insetBy(dx: -r.width * 0.08, dy: -r.height * 0.08).intersection(rect)
  }

  /// Apple's image feature print of a cut-out laid on mid grey (so the background never counts).
  static func featurePrint(_ cutout: CGImage) -> VNFeaturePrintObservation? {
    let w = cutout.width, h = cutout.height
    guard w > 4, h > 4, let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                                            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return nil }
    ctx.setFillColor(CGColor(srgbRed: 0.5, green: 0.5, blue: 0.5, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(cutout, in: CGRect(x: 0, y: 0, width: w, height: h))
    guard let flat = ctx.makeImage() else { return nil }
    let req = VNGenerateImageFeaturePrintRequest()
    req.imageCropAndScaleOption = .scaleFit
    Prep.cpuOnSimulator([req])
    do { try VNImageRequestHandler(cgImage: flat, orientation: .up).perform([req]) } catch { return nil }
    return req.results?.first
  }

  /// The print as plain floats (for storage), and the distance between two stored prints.
  static func floats(_ fp: VNFeaturePrintObservation) -> [Float] {
    switch fp.elementType {
    case .float: return fp.data.withUnsafeBytes { Array($0.bindMemory(to: Float.self)) }
    case .double: return fp.data.withUnsafeBytes { $0.bindMemory(to: Double.self).map { Float($0) } }
    default: return []
    }
  }

  static func distance(_ a: [Float], _ b: [Float]) -> Double? {
    guard a.count == b.count, !a.isEmpty else { return nil }
    var s = 0.0
    for i in 0..<a.count { let d = Double(a[i] - b[i]); s += d * d }
    return sqrt(s)
  }

  // MARK: Zoom rectangles for the scoring call

  /// His body (person box, joints and person mask together), and its upper and lower parts split at
  /// the hips, in full-image pixels. Empty when there's no person.
  static func zoomRects(located: Prep.Located, person: Guide.Gray?, W: CGFloat, H: CGFloat) -> [String: CGRect] {
    guard let main = located.main else { return [:] }
    var body = main
    if !located.joints.isEmpty {
      let xs = located.joints.values.map(\.x), ys = located.joints.values.map(\.y)
      body = body.union(CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()! - xs.min()!, height: ys.max()! - ys.min()!))
    }
    // The mask finds his feet when the person box stops at the ankles.
    if let m = person {
      let near = body.insetBy(dx: -body.width * 0.15, dy: -body.height * 0.08)
      let sx = CGFloat(m.w) / W, sy = CGFloat(m.h) / H
      var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1
      let x0 = max(0, Int(near.minX * sx)), x1 = min(m.w, Int(near.maxX * sx))
      let y0 = max(0, Int(near.minY * sy)), y1 = min(m.h, Int(near.maxY * sy))
      if x0 < x1, y0 < y1 {
        for y in y0..<y1 { for x in x0..<x1 where m.px[y * m.w + x] >= 128 {
          minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
        } }
      }
      if maxX >= 0 { body = body.union(CGRect(x: CGFloat(minX) / sx, y: CGFloat(minY) / sy, width: CGFloat(maxX - minX + 1) / sx, height: CGFloat(maxY - minY + 1) / sy)) }
    }
    let frame = CGRect(x: 0, y: 0, width: W, height: H)
    body = body.insetBy(dx: -body.width * 0.08, dy: -body.height * 0.03).intersection(frame)
    var out = ["body": body]
    let hips = [located.joints["lHip"], located.joints["rHip"], located.joints["root"]].compactMap { $0?.y }
    if let hipY = hips.isEmpty ? nil : hips.reduce(0, +) / CGFloat(hips.count), hipY > body.minY + body.height * 0.2, hipY < body.maxY - body.height * 0.2 {
      out["upper"] = CGRect(x: body.minX, y: body.minY, width: body.width, height: hipY + body.height * 0.06 - body.minY).intersection(frame)
      out["lower"] = CGRect(x: body.minX, y: hipY - body.height * 0.04, width: body.width, height: body.maxY - (hipY - body.height * 0.04)).intersection(frame)
    }
    return out
  }

  /// The app's entry (after the closet call returns its boxes). `garments`: [{key, category, box}] with
  /// box = [ymin, xmin, ymax, xmax] 0–1000. Finds the heads on his kept photo (unblurred, never leaves
  /// the phone), cuts from the face-hidden detail copy, and writes Documents/closet/<sha>-<key>.png (the
  /// display cut-out) and .print (the feature print, raw Float32). Per garment: the dominant color, its
  /// L*, the quality numbers and the two file URIs.
  static func run(keptUri: String, detailUri: String, sha: String, garments list: [[String: Any]]) throws -> [String: Any] {
    let t0 = CFAbsoluteTimeGetCurrent()
    func url(_ u: String) -> URL { u.hasPrefix("file://") ? URL(string: u)! : URL(fileURLWithPath: u) }
    guard let keptData = try? Data(contentsOf: url(keptUri)), let kept = Prep.decode(keptData, maxPx: Prep.workPx).image,
          let detailData = try? Data(contentsOf: url(detailUri)), let detail = Prep.decode(detailData, maxPx: Prep.workPx).image
    else { return ["status": "missing"] }
    // Both copies come from the same working image; anything else isn't the same photo.
    guard kept.width == detail.width, kept.height == detail.height else { return ["status": "mismatch"] }
    let W = CGFloat(kept.width), H = CGFloat(kept.height)
    var keys: [String] = []
    let garments: [Garment] = list.enumerated().compactMap { n, g in
      guard let c = g["category"] as? String, let b = g["box"] as? [Double], b.count == 4, b[2] > b[0], b[3] > b[1] else { return nil }
      keys.append((g["key"] as? String) ?? String(n))
      return Garment(index: n, category: c, rect: CGRect(x: b[1] / 1000 * W, y: b[0] / 1000 * H, width: (b[3] - b[1]) / 1000 * W, height: (b[2] - b[0]) / 1000 * H))
    }
    guard !garments.isEmpty, let rgb = rgb(kept, maxSide: statPx) else { return ["status": "ok", "garments": [Any]()] }
    let located = Prep.locate(kept)
    let person = personMask(kept, w: rgb.w, h: rgb.h)
    let results = measure(image: kept, garments: garments, heads: grownHeads(located.hide), hands: handBoxes(kept), person: person, rgb: rgb)
    let fm = FileManager.default
    let docs = Prep.rootOverride?.appendingPathComponent("Documents", isDirectory: true) ?? fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let dir = docs.appendingPathComponent("closet", isDirectory: true)
    try fm.createDirectory(at: dir, withIntermediateDirectories: true)
    func r3(_ v: Double) -> Double { (v * 1000).rounded() / 1000 }
    var rows: [[String: Any]] = []
    for (k, (g, r)) in zip(keys, zip(garments, results)) {
      var row: [String: Any] = [
        "key": k, "ownedPx": r.ownedPx, "coverage": r3(r.coverage), "overlapOuter": r3(r.overlapOuter), "headOverlap": r3(r.headOverlap),
        "droppedOuter": r3(r.droppedOuter), "boxW": r.boxW, "boxH": r.boxH, "lapVar": Int(r.lapVar), "personMask": person != nil,
        "clusters": r.clusters.map { ["hex": hex($0.lab), "L": r3($0.lab.L), "share": r3($0.share)] as [String: Any] },
      ]
      if let top = r.clusters.first { row["hex"] = hex(top.lab); row["L"] = (top.lab.L * 10).rounded() / 10 }
      let cropRect = g.category == "footwear" ? singleShoeRect(mask: r.tileMask, maskW: rgb.w, maskH: rgb.h, rect: g.rect, W: W, H: H) ?? g.rect : g.rect
      if !r.tileMask.isEmpty, let cut = cutout(source: detail, mask: r.tileMask, maskW: rgb.w, maskH: rgb.h, rect: cropRect) {
        let png = dir.appendingPathComponent("\(sha)-\(k).png")
        try writePNG(cut, to: png)
        row["cropUri"] = png.absoluteString
        row["cropW"] = cut.width; row["cropH"] = cut.height
        if let fp = featurePrint(cut) {
          var f = floats(fp)
          let pf = dir.appendingPathComponent("\(sha)-\(k).print")
          try Data(bytes: &f, count: f.count * MemoryLayout<Float>.size).write(to: pf, options: .atomic)
          row["printUri"] = pf.absoluteString
          row["printLength"] = f.count
        }
      }
      rows.append(row)
    }
    return ["status": "ok", "garments": rows, "ms": Int((CFAbsoluteTimeGetCurrent() - t0) * 1000)]
  }

  /// Distance between two stored prints (.print files); nil when either is missing or they differ in length.
  static func printDistance(_ a: String, _ b: String) -> Double? {
    func load(_ u: String) -> [Float]? {
      let url = u.hasPrefix("file://") ? URL(string: u)! : URL(fileURLWithPath: u)
      guard let d = try? Data(contentsOf: url), d.count % MemoryLayout<Float>.size == 0 else { return nil }
      return d.withUnsafeBytes { Array($0.bindMemory(to: Float.self)) }
    }
    guard let fa = load(a), let fb = load(b) else { return nil }
    return distance(fa, fb)
  }

  // MARK: Shape from the body outline (shadow mode: logged and compared, never scored yet)

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

  static func writePNG(_ img: CGImage, to url: URL) throws {
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { throw NSError(domain: "KittedVision", code: 5) }
    CGImageDestinationAddImage(dest, img, nil)
    guard CGImageDestinationFinalize(dest) else { throw NSError(domain: "KittedVision", code: 6) }
  }

  /// A region of `img` as a JPEG at most `longEdge` px (the zoom crops; `img` is the face-hidden copy).
  static func cropJPEG(_ img: CGImage, _ r: CGRect, longEdge: CGFloat, to url: URL) throws -> (data: Data, width: Int, height: Int)? {
    let rr = r.integral.intersection(CGRect(x: 0, y: 0, width: img.width, height: img.height))
    guard !rr.isNull, rr.width > 8, rr.height > 8, let c = img.cropping(to: rr) else { return nil }
    return try Prep.writeJPEG(c, longEdge: longEdge, quality: 0.85, to: url)
  }
}
