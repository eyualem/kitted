// Camera guidance measures (DECISIONS-LOG #100). This file only MEASURES: brightness, highlight
// share, motion between frames, sharpness, people, faces, clothes labels and piece boxes. The
// app's TypeScript (features/camera/guidance.ts) decides what the tip says, so thresholds can be
// tuned without a rebuild. No UIKit or Expo here, so the Mac test harness compiles this same file.
import Accelerate
import CoreImage
import CoreVideo
import Foundation
import Vision

enum Guide {
  /// A small grayscale copy, row-major, 0–255.
  struct Gray {
    let w: Int
    let h: Int
    let px: [UInt8]
  }

  /// The classifier labels that mean "clothes" (VNClassifyImageRequest has 1,303 labels; there is
  /// no shirt, pants or sweater label, so the general ones carry it). Checked on the Mac, Oct 8.
  static let clothesLabels: Set<String> = [
    "clothing", "textile", "hoodie", "jacket", "jeans", "polo", "suit", "shoes", "sneaker", "boot",
    "footwear", "sock", "hat", "baseball_hat", "cowboy_hat", "sunhat", "scarf", "necktie", "bowtie",
    "glove", "lab_coat", "swimsuit",
  ]

  // MARK: Gray copies

  /// From a camera frame: the luma plane of a YUV buffer, scaled down with vImage (fast even in a
  /// debug build). Video-range luma (16–235) is stretched to 0–255. nil for other formats.
  static func gray(_ pb: CVPixelBuffer, maxSide: Int = 96) -> Gray? {
    guard CVPixelBufferIsPlanar(pb) else { return nil }
    CVPixelBufferLockBaseAddress(pb, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(pb, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddressOfPlane(pb, 0) else { return nil }
    let W = CVPixelBufferGetWidthOfPlane(pb, 0), H = CVPixelBufferGetHeightOfPlane(pb, 0)
    let s = Double(maxSide) / Double(max(W, H))
    let w = max(1, Int(Double(W) * s)), h = max(1, Int(Double(H) * s))
    var src = vImage_Buffer(data: base, height: vImagePixelCount(H), width: vImagePixelCount(W), rowBytes: CVPixelBufferGetBytesPerRowOfPlane(pb, 0))
    var px = [UInt8](repeating: 0, count: w * h)
    let ok = px.withUnsafeMutableBytes { raw -> Bool in
      var dst = vImage_Buffer(data: raw.baseAddress, height: vImagePixelCount(h), width: vImagePixelCount(w), rowBytes: w)
      return vImageScale_Planar8(&src, &dst, nil, vImage_Flags(kvImageNoFlags)) == kvImageNoError
    }
    guard ok else { return nil }
    let fmt = CVPixelBufferGetPixelFormatType(pb)
    if fmt == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange || fmt == kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange {
      for i in 0..<px.count { px[i] = UInt8(max(0, min(255, (Int(px[i]) - 16) * 255 / 219))) }
    }
    return Gray(w: w, h: h, px: px)
  }

  /// From a still: drawn into a gray context with good interpolation.
  static func gray(_ img: CGImage, maxSide: Int) -> Gray? {
    let s = min(1, Double(maxSide) / Double(max(img.width, img.height)))
    let w = max(1, Int(Double(img.width) * s)), h = max(1, Int(Double(img.height) * s))
    var px = [UInt8](repeating: 0, count: w * h)
    let ok = px.withUnsafeMutableBytes { raw -> Bool in
      guard let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return false }
      ctx.interpolationQuality = .high
      ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
      return true
    }
    return ok ? Gray(w: w, h: h, px: px) : nil
  }

  // MARK: Light, motion, sharpness

  /// Mean brightness (0–1) and the share of near-white pixels (glare, a bright window), over the
  /// whole frame or a normalized region (origin top-left).
  static func light(_ g: Gray, in region: CGRect? = nil) -> (mean: Double, clipped: Double) {
    let r = (region ?? CGRect(x: 0, y: 0, width: 1, height: 1)).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
    guard !r.isNull else { return (0, 0) }
    let x0 = Int(r.minX * CGFloat(g.w)), x1 = max(x0 + 1, min(g.w, Int(r.maxX * CGFloat(g.w))))
    let y0 = Int(r.minY * CGFloat(g.h)), y1 = max(y0 + 1, min(g.h, Int(r.maxY * CGFloat(g.h))))
    var sum = 0, clipped = 0, n = 0
    g.px.withUnsafeBufferPointer { p in
      for y in y0..<min(y1, g.h) {
        for x in x0..<min(x1, g.w) {
          let v = Int(p[y * g.w + x])
          sum += v
          if v >= 250 { clipped += 1 }
          n += 1
        }
      }
    }
    guard n > 0 else { return (0, 0) }
    return (Double(sum) / Double(n) / 255, Double(clipped) / Double(n))
  }

  /// Mean absolute difference between two frames of the same size (0–1). Camera shake and a
  /// moving subject both raise it; both blur the photo.
  static func motion(_ a: Gray, _ b: Gray) -> Double? {
    guard a.w == b.w, a.h == b.h, !a.px.isEmpty else { return nil }
    var sum = 0
    a.px.withUnsafeBufferPointer { pa in
      b.px.withUnsafeBufferPointer { pb in
        for i in 0..<pa.count { sum += abs(Int(pa[i]) - Int(pb[i])) }
      }
    }
    return Double(sum) / Double(a.px.count) / 255
  }

  /// Variance of the Laplacian (high = crisp edges), and how much of it survives a light blur
  /// (`blurRatio`, near 1 when the photo was already soft). Measured on a ~512 px gray copy.
  static func sharpness(_ g: Gray) -> (lapVar: Double, blurRatio: Double) {
    let lv = lapVar(g)
    guard lv > 0 else { return (0, 1) }
    return (lv, lapVar(boxBlur(g)) / lv)
  }

  static func lapVar(_ g: Gray) -> Double {
    guard g.w > 2, g.h > 2 else { return 0 }
    var sum = 0.0, sq = 0.0, n = 0.0
    g.px.withUnsafeBufferPointer { p in
      for y in 1..<(g.h - 1) {
        for x in 1..<(g.w - 1) {
          let i = y * g.w + x
          let l = Double(4 * Int(p[i]) - Int(p[i - 1]) - Int(p[i + 1]) - Int(p[i - g.w]) - Int(p[i + g.w]))
          sum += l
          sq += l * l
          n += 1
        }
      }
    }
    let mean = sum / n
    return sq / n - mean * mean
  }

  static func boxBlur(_ g: Gray) -> Gray {
    var out = g.px
    g.px.withUnsafeBufferPointer { p in
      for y in 1..<max(1, g.h - 1) {
        for x in 1..<max(1, g.w - 1) {
          var s = 0
          for dy in -1...1 { for dx in -1...1 { s += Int(p[(y + dy) * g.w + x + dx]) } }
          out[y * g.w + x] = UInt8(s / 9)
        }
      }
    }
    return Gray(w: g.w, h: g.h, px: out)
  }

  // MARK: Pieces and labels

  struct Piece {
    /// Normalized, origin top-left.
    let box: CGRect
    /// Share of the frame this piece covers (its mask pixels).
    let share: Double
    /// Its box touches the frame edge: probably cut off.
    let edge: Bool
  }

  /// One box per foreground object, read from the low-res instance mask (each pixel holds its
  /// instance number, 0 = background).
  static func pieces(_ obs: VNInstanceMaskObservation) -> [Piece] {
    let mask = obs.instanceMask
    CVPixelBufferLockBaseAddress(mask, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(mask) else { return [] }
    let w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask), row = CVPixelBufferGetBytesPerRow(mask)
    let p = base.assumingMemoryBound(to: UInt8.self)
    var minX = [Int](repeating: Int.max, count: 256), minY = minX
    var maxX = [Int](repeating: -1, count: 256), maxY = maxX
    var count = [Int](repeating: 0, count: 256)
    for y in 0..<h {
      for x in 0..<w {
        let k = Int(p[y * row + x])
        guard k > 0 else { continue }
        count[k] += 1
        if x < minX[k] { minX[k] = x }
        if x > maxX[k] { maxX[k] = x }
        if y < minY[k] { minY[k] = y }
        if y > maxY[k] { maxY[k] = y }
      }
    }
    let total = Double(w * h)
    let margin = 2 // mask pixels from the edge
    return (1..<256).compactMap { k in
      guard count[k] > 0 else { return nil }
      let box = CGRect(x: CGFloat(minX[k]) / CGFloat(w), y: CGFloat(minY[k]) / CGFloat(h),
                       width: CGFloat(maxX[k] - minX[k] + 1) / CGFloat(w), height: CGFloat(maxY[k] - minY[k] + 1) / CGFloat(h))
      let edge = minX[k] < margin || minY[k] < margin || maxX[k] >= w - margin || maxY[k] >= h - margin
      return Piece(box: box, share: Double(count[k]) / total, edge: edge)
    }
  }

  /// The highest confidence among the clothes labels, and the top labels (for the dev log).
  static func clothes(_ results: [VNClassificationObservation]) -> (score: Double, top: [String]) {
    let score = results.filter { clothesLabels.contains($0.identifier) }.map { Double($0.confidence) }.max() ?? 0
    let top = results.sorted { $0.confidence > $1.confidence }.prefix(4).map { "\($0.identifier) \(String(format: "%.2f", $0.confidence))" }
    return (score, Array(top))
  }

  static func normalized(_ r: CGRect) -> CGRect { CGRect(x: r.minX, y: 1 - r.maxY, width: r.width, height: r.height) }

  static func boxDict(_ r: CGRect) -> [String: Double] {
    ["x": Double(r.minX), "y": Double(r.minY), "width": Double(r.width), "height": Double(r.height)]
  }

  static func pieceDicts(_ ps: [Piece]) -> [[String: Any]] {
    ps.map { ["box": boxDict($0.box), "share": $0.share, "edge": $0.edge] }
  }

  // MARK: The quick check after the shot (or a library pick)

  /// Measures a still for the after-shot check. kind "fit": light, sharpness and whether the photo
  /// could be sent (the same face rule as prep, at a smaller size, so it's quick). kind "scan":
  /// light, sharpness, people, faces, clothes labels and piece boxes.
  static func assess(uri: String, kind: String) throws -> [String: Any] {
    let t0 = CFAbsoluteTimeGetCurrent()
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    let data = try Data(contentsOf: url)
    let (_, sourceW, sourceH, decoded) = Prep.decode(data, maxPx: 1024)
    guard let image = decoded else { return ["ok": false] }
    var out: [String: Any] = ["ok": true, "kind": kind, "width": sourceW, "height": sourceH]
    if let g = gray(image, maxSide: 512) {
      let l = light(g)
      let s = sharpness(g)
      out["luma"] = l.mean
      out["clipped"] = l.clipped
      out["lapVar"] = s.lapVar
      out["blurRatio"] = s.blurRatio
    }
    if kind == "scan" {
      var sv = scanVision(image)
      sv["pieceObjects"] = nil // Swift values; JS gets "pieces"
      out.merge(sv) { _, b in b }
      let found = Prep.locate(image, kind: .items)
      out["frame"] = found.status
    } else {
      let found = Prep.locate(image, kind: .fit)
      out["frame"] = found.status
      out["pose"] = found.pose
      if let m = found.main, let g = gray(image, maxSide: 128) {
        let W = CGFloat(image.width), H = CGFloat(image.height)
        let r = CGRect(x: m.minX / W, y: m.minY / H, width: m.width / W, height: m.height / H)
        out["subjectLuma"] = light(g, in: r).mean
        out["bodyShare"] = Double(r.height)
      }
    }
    out["ms"] = Int(((CFAbsoluteTimeGetCurrent() - t0) * 1000).rounded())
    return out
  }

  /// People, faces, clothes labels and pieces in one image (a still, or a camera frame).
  static func scanVision(_ image: CGImage) -> [String: Any] {
    scanVision(handler: VNImageRequestHandler(cgImage: image, orientation: .up), classify: true, instances: true)
  }

  static func scanVision(handler: VNImageRequestHandler, classify: Bool, instances: Bool) -> [String: Any] {
    let humans = VNDetectHumanRectanglesRequest()
    humans.upperBodyOnly = true // a person holding a shirt up is often cut at the waist
    let faces = VNDetectFaceRectanglesRequest()
    let labels = VNClassifyImageRequest()
    let masks = VNGenerateForegroundInstanceMaskRequest()
    var reqs: [VNRequest] = [humans, faces]
    if classify { reqs.append(labels) }
    if instances { reqs.append(masks) }
    Prep.cpuOnSimulator(reqs)
    for r in reqs { try? handler.perform([r]) }
    let people = (humans.results ?? []).filter { $0.confidence > 0.5 }.map { normalized($0.boundingBox) }
    var out: [String: Any] = [
      "people": people.map(boxDict),
      "faces": (faces.results ?? []).map { boxDict(normalized($0.boundingBox)) },
    ]
    if classify {
      let c = clothes(labels.results ?? [])
      out["clothes"] = c.score
      out["labels"] = c.top
    }
    if instances {
      let ps = (masks.results ?? []).first.map(pieces) ?? []
      out["pieces"] = pieceDicts(ps)
      out["pieceObjects"] = ps // the live camera maps these to view points itself
    }
    return out
  }
}
