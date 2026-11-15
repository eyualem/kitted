// On-device photo prep (05 §P3 C, 03 §8, ruling 11). Takes the photo he picked or shot and
// returns only what may leave the phone or be kept:
//   1. SHA-256 of the ORIGINAL bytes ("same photo, same score")
//   2. orientation fixed; Apple Vision finds the people, the body pose and any faces
//   3. the full frame, with every face (his head and anyone else's) blurred and pixelated; if his
//      head can't be found, nothing is sent (ruling 10, DECISIONS-LOG #54)
//   4. re-encoded JPEGs, no metadata. A fit check: the face-hidden upload copy (1024 px long edge,
//      q0.8, also returned as base64); kept only on the phone, his photo unblurred (2048 px) and a
//      400 px thumb (DECISIONS-LOG #55); and a face-hidden 2048 px detail copy in Caches/detail
//      for a week, the source for closet crops (DECISIONS-LOG #83); and face-hidden close-ups of his upper
//      and lower body (or the whole of him) sent with the upload in the same scoring call (#104), also in
//      Caches/upload. A clothes scan (#88, #100):
//      kept + thumb + a face-hidden 2048 px copy for the item reading, all in Documents/scans.
//   5. the temporary original (picker / camera output) is deleted
// No UIKit or Expo here, so the Mac test harness compiles this same file (DECISIONS-LOG #100).
import CoreImage
import CryptoKit
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

enum Prep {
  /// The image Vision and the blur work on (long edge). The camera shoots 12 MP (DECISIONS-LOG #83);
  /// nothing we write is larger than 2048, so decoding at 4096 only cost time and memory.
  static let workPx: CGFloat = 2048
  static let uploadPx: CGFloat = 1024 // locked config (Oct 6): 1024 px, q0.8
  static let keepPx: CGFloat = 2048
  static let thumbPx: CGFloat = 400
  /// The face-hidden copy at full working size, kept a week in Caches/detail: the source for
  /// closet crops later. Never uploaded by itself.
  static let detailPx: CGFloat = 2048
  static let detailDays: Double = 7
  /// Another person is "comparable" (so we ask "Which one is you?") when their box is at least this share of the main
  /// person's area. Below it (the main person at least 4× bigger) he's clearly the subject: he's picked automatically
  /// and everyone else is masked out of what's sent (Oct 14).
  static let otherPersonShare: CGFloat = 0.25
  /// Another detection whose person pixels (the instance mask) are at least this share his is him found twice (his
  /// torso inside his whole-body box), not a second person.
  static let samePersonShare: CGFloat = 0.8
  /// A detection with person pixels on under this share of its box is no one the segmentation sees (a poster, a
  /// coat on a door): it's still covered, but never asked about.
  static let emptyBoxShare: CGFloat = 0.1
  /// The person he tapped must overlap a detected one by at least this (the same photo gives the same boxes).
  static let pickIoU: CGFloat = 0.5
  /// The cover over everyone else in the copy sent: a flat mid grey (blur would leave colors the reading could
  /// name as clothes).
  static let coverGray: CGFloat = 0.5
  /// One context for every prep (creating one per photo costs tens of ms).
  static let ciContext = CIContext()
  /// nil in the app (Documents and Caches); the Mac test harness points it at a scratch folder.
  static var rootOverride: URL?

  /// A fit check (a person must be in it), a clothes scan (no person needed; #88, #100), or a snap that finishes a
  /// partial check: his shoes, or his pants and shoes looked down at (no person needed, kept and sent like a fit
  /// photo, no close-ups; #313).
  enum Kind: String { case fit, items, snap }

  /// What Vision found, and whether the photo may be sent: "ok", "noPerson", "multiplePeople"
  /// or "couldNotFrame". `hide` is every region to blur, in pixels with the origin top-left.
  struct Located {
    var status: String
    var hide: [CGRect] = []
    var people: Int = 0
    var main: CGRect?
    var pose = "none"
    var errors: [String] = []
    /// The main person's body joints (confidence > 0.3), in pixels, origin top-left (KittedMeasure).
    var joints: [String: CGPoint] = [:]
    /// "multiplePeople": everyone he could be (largest first; the index he picks names the photo's hash), pixels.
    var candidates: [CGRect] = []
    /// Everyone else, covered in every copy sent (auto-picked or chosen); boxes in pixels.
    var others: [CGRect] = []
    /// The candidate he chose ("Which one is you?"), or nil.
    var picked: Int?
    /// Where the others are covered (> 127 = cover), at its own resolution; nil when there's no one else.
    var cover: Guide.Gray?
    /// Other bodies' heads from the body pose (T96), pixels, origin top-left: every body that isn't his (a fit photo,
    /// on the path that returns "ok") or every body (a snap or a scan). Hidden only in what's sent (`sweep`), so the
    /// camera's quick look and closet measuring see `hide` as before.
    var otherHeads: [CGRect] = []
  }

  /// A person mask with the cover's pixels taken out (another person's outline is never his), any two resolutions.
  static func excluding(_ m: Guide.Gray, _ cover: Guide.Gray?) -> Guide.Gray {
    guard let c = cover else { return m }
    var px = m.px
    for y in 0..<m.h {
      let cy = min(c.h - 1, (y * c.h) / m.h)
      for x in 0..<m.w where px[y * m.w + x] != 0 {
        let cx = min(c.w - 1, (x * c.w) / m.w)
        if c.px[cy * c.w + cx] > 127 { px[y * m.w + x] = 0 }
      }
    }
    return Guide.Gray(w: m.w, h: m.h, px: px)
  }

  static func area(_ r: CGRect) -> CGFloat { r.isNull ? 0 : r.width * r.height }
  static func iou(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let i = area(a.intersection(b))
    let u = area(a) + area(b) - i
    return u > 0 ? i / u : 0
  }

  /// Vision's person instance mask (up to 4 people): each pixel's person (0 = no one), top row first.
  struct Instances {
    let w: Int
    let h: Int
    let px: [UInt8]
    /// Pixels per person label inside a pixel rect (origin top-left) of a W×H image.
    func counts(_ r: CGRect, W: CGFloat, H: CGFloat) -> (labels: [UInt8: Int], all: Int) {
      let sx = CGFloat(w) / W, sy = CGFloat(h) / H
      let x0 = max(0, Int(r.minX * sx)), x1 = min(w - 1, Int(r.maxX * sx)), y0 = max(0, Int(r.minY * sy)), y1 = min(h - 1, Int(r.maxY * sy))
      guard x1 >= x0, y1 >= y0 else { return ([:], 0) }
      var out: [UInt8: Int] = [:]
      for y in y0...y1 { for x in x0...x1 { let l = px[y * w + x]; if l != 0 { out[l, default: 0] += 1 } } }
      return (out, (x1 - x0 + 1) * (y1 - y0 + 1))
    }
    /// Each person label's bounding box in a W×H image's pixels (origin top-left), and its pixel count on the grid.
    func boxes(W: CGFloat, H: CGFloat) -> [UInt8: (box: CGRect, n: Int)] {
      var lo: [UInt8: (Int, Int, Int, Int, Int)] = [:]
      for y in 0..<h { for x in 0..<w {
        let l = px[y * w + x]
        guard l != 0 else { continue }
        if let b = lo[l] { lo[l] = (min(b.0, x), min(b.1, y), max(b.2, x), max(b.3, y), b.4 + 1) } else { lo[l] = (x, y, x, y, 1) }
      } }
      let sx = W / CGFloat(w), sy = H / CGFloat(h)
      return lo.mapValues { b in (CGRect(x: CGFloat(b.0) * sx, y: CGFloat(b.1) * sy, width: CGFloat(b.2 - b.0 + 1) * sx, height: CGFloat(b.3 - b.1 + 1) * sy), b.4) }
    }
  }

  /// The instance mask's grid width (its height follows the photo).
  static let instanceW = 384

  /// Each person's mask scaled to the photo by Vision itself (its raw instance mask is a fixed 384×512 that doesn't
  /// keep the photo's shape), sampled on a grid `instanceW` wide. Nil when it can't run or finds no one.
  static func personInstances(_ full: CGImage) -> Instances? {
    // Run on a small copy: the model works at 384×512 anyway, and each scaled mask is then small (−0.3 s on the Mac).
    let s = min(1, 768 / CGFloat(max(full.width, full.height)))
    let sw = max(1, Int((CGFloat(full.width) * s).rounded())), sh = max(1, Int((CGFloat(full.height) * s).rounded()))
    var img = full
    if s < 1, let ctx = CGContext(data: nil, width: sw, height: sh, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) {
      ctx.interpolationQuality = .medium
      ctx.draw(full, in: CGRect(x: 0, y: 0, width: sw, height: sh))
      if let small = ctx.makeImage() { img = small }
    }
    let req = VNGeneratePersonInstanceMaskRequest()
    cpuOnSimulator([req])
    let handler = VNImageRequestHandler(cgImage: img, orientation: .up)
    do { try handler.perform([req]) } catch { return nil }
    guard let obs = req.results?.first, !obs.allInstances.isEmpty else { return nil }
    let W = img.width, H = img.height
    let w = min(instanceW, W), h = max(1, Int((CGFloat(w) * CGFloat(H) / CGFloat(W)).rounded()))
    var px = [UInt8](repeating: 0, count: w * h)
    for i in obs.allInstances where i > 0 && i < 256 {
      guard let pb = try? obs.generateScaledMaskForImage(forInstances: IndexSet(integer: i), from: handler) else { continue }
      CVPixelBufferLockBaseAddress(pb, .readOnly)
      defer { CVPixelBufferUnlockBaseAddress(pb, .readOnly) }
      let mw = CVPixelBufferGetWidth(pb), mh = CVPixelBufferGetHeight(pb), row = CVPixelBufferGetBytesPerRow(pb)
      guard mw > 0, mh > 0, let base = CVPixelBufferGetBaseAddress(pb) else { continue }
      let format = CVPixelBufferGetPixelFormatType(pb)
      for y in 0..<h {
        let my = min(mh - 1, Int((CGFloat(y) + 0.5) * CGFloat(mh) / CGFloat(h)))
        for x in 0..<w {
          let mx = min(mw - 1, Int((CGFloat(x) + 0.5) * CGFloat(mw) / CGFloat(w)))
          let on: Bool
          switch format {
          case kCVPixelFormatType_OneComponent32Float: on = base.advanced(by: my * row + mx * 4).assumingMemoryBound(to: Float32.self).pointee > 0.5
          case kCVPixelFormatType_OneComponent8: on = base.advanced(by: my * row + mx).assumingMemoryBound(to: UInt8.self).pointee > 127
          default: return nil
          }
          if on { px[y * w + x] = UInt8(i) }
        }
      }
    }
    return Instances(w: w, h: h, px: px)
  }

  /// Who else is in a fit photo besides `main` (Oct 14). With the instance mask: a detection whose person pixels are
  /// mostly his is him found twice (dropped); one with almost no person pixels is covered but never asked about; the
  /// rest are other people, and those at least `otherPersonShare` of his size are comparable (we ask). Without it
  /// (it can't run), every other detection is someone else, as before.
  static func sortPeople(main: CGRect, rest: [CGRect], inst: Instances?, W: CGFloat, H: CGFloat) -> (his: UInt8?, others: [CGRect], comparable: [CGRect]) {
    var his: UInt8?
    if let inst {
      let c = inst.counts(main.insetBy(dx: main.width * 0.1, dy: main.height * 0.05), W: W, H: H).labels
      his = c.max { $0.value < $1.value }?.key
    }
    var others: [CGRect] = [], comparable: [CGRect] = []
    for o in rest {
      if let inst, let his {
        let c = inst.counts(o, W: W, H: H)
        let personPx = c.labels.values.reduce(0, +)
        if personPx > 0, CGFloat(c.labels[his] ?? 0) >= samePersonShare * CGFloat(personPx) { continue }
        others.append(o)
        if CGFloat(personPx) >= emptyBoxShare * CGFloat(max(1, c.all)), area(o) >= otherPersonShare * area(main) { comparable.append(o) }
      } else {
        others.append(o)
        if area(o) >= otherPersonShare * area(main) { comparable.append(o) }
      }
    }
    return (his, others, comparable)
  }

  /// Where to cover everyone else. With the instance mask: their boxes (grown a little) wherever it isn't him, and
  /// their own outlines (the person labels inside their boxes) a little further out, for an arm or a foot past the box;
  /// grown 2 px, never onto him. Only near their boxes: a stray label elsewhere (his bag, Oct 14) stays. Without the
  /// instance mask: their boxes outside his, and the top 30% of their boxes (their heads) everywhere.
  static func coverMasks(main: CGRect, others: [CGRect], inst: Instances?, his: UInt8?, W: CGFloat, H: CGFloat) -> Guide.Gray {
    let w = inst?.w ?? maskW, h = inst?.h ?? max(1, Int((CGFloat(maskW) * H / W).rounded()))
    let sx = CGFloat(w) / W, sy = CGFloat(h) / H
    let boxes = others.map { o in o.insetBy(dx: -o.width * 0.06, dy: -o.height * 0.04) }
      .map { CGRect(x: $0.minX * sx, y: $0.minY * sy, width: $0.width * sx, height: $0.height * sy) }
    let mainM = CGRect(x: main.minX * sx, y: main.minY * sy, width: main.width * sx, height: main.height * sy)
    // Without the instance mask, the top of each other box (where their head is) is covered even over his box.
    let heads = boxes.map { CGRect(x: $0.minX, y: $0.minY, width: $0.width, height: $0.height * 0.3) }
    let near = boxes.map { $0.insetBy(dx: -$0.width * 0.25, dy: -$0.height * 0.12) }
    // Their labels: any person label (not his) on at least 3% of one of their boxes.
    var theirs = Set<UInt8>()
    if let inst, let his {
      for o in others {
        let c = inst.counts(o, W: W, H: H)
        for (l, n) in c.labels where l != his && CGFloat(n) >= 0.03 * CGFloat(max(1, c.all)) { theirs.insert(l) }
      }
    }
    var cover = [UInt8](repeating: 0, count: w * h)
    var own = [UInt8](repeating: 0, count: w * h)
    for y in 0..<h {
      for x in 0..<w {
        let p = CGPoint(x: CGFloat(x) + 0.5, y: CGFloat(y) + 0.5)
        let inBox = boxes.contains { $0.contains(p) }
        if let inst, let his {
          let l = inst.px[y * w + x]
          if l == his { own[y * w + x] = 255; continue }
          if inBox || (theirs.contains(l) && near.contains { $0.contains(p) }) { cover[y * w + x] = 255 }
        } else if inBox, !mainM.contains(p) || heads.contains(where: { $0.contains(p) }) {
          cover[y * w + x] = 255
        }
      }
    }
    // Grow the cover 2 px (segmentation edges are soft), never onto him.
    var grown = cover
    for y in 0..<h {
      for x in 0..<w where cover[y * w + x] == 0 && own[y * w + x] == 0 {
        search: for dy in -2...2 {
          for dx in -2...2 {
            let xx = x + dx, yy = y + dy
            if xx >= 0, yy >= 0, xx < w, yy < h, cover[yy * w + xx] != 0 { grown[y * w + x] = 255; break search }
          }
        }
      }
    }
    return Guide.Gray(w: w, h: h, px: grown)
  }

  /// The image with the cover (> 127) filled flat grey, at the image's size.
  static func coverOthers(_ image: CGImage, _ m: Guide.Gray) -> CGImage? {
    guard m.px.contains(where: { $0 > 127 }) else { return image }
    let data = Data(m.px)
    guard let provider = CGDataProvider(data: data as CFData),
          let maskCG = CGImage(width: m.w, height: m.h, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: m.w, space: CGColorSpaceCreateDeviceGray(),
                               bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue), provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
    else { return nil }
    let ci = CIImage(cgImage: image)
    let whole = ci.extent
    let mask = CIImage(cgImage: maskCG).samplingNearest()
      .transformed(by: CGAffineTransform(scaleX: whole.width / CGFloat(m.w), y: whole.height / CGFloat(m.h)))
    let gray = CIImage(color: CIColor(red: coverGray, green: coverGray, blue: coverGray)).cropped(to: whole)
    let out = gray.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: ci, kCIInputMaskImageKey: mask]).cropped(to: whole)
    return ciContext.createCGImage(out, from: whole)
  }

  /// The original's SHA-256, its upright size, and an upright image at most `maxPx` on the long edge.
  static func decode(_ data: Data, maxPx: CGFloat) -> (sha: String, sourceW: Int, sourceH: Int, image: CGImage?) {
    let sha = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    guard let src = CGImageSourceCreateWithData(data as CFData, nil) else { return (sha, 0, 0, nil) }
    // The original's size, upright (EXIF orientations 5–8 are rotated a quarter turn).
    let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
    var w = props[kCGImagePropertyPixelWidth] as? Int ?? 0, h = props[kCGImagePropertyPixelHeight] as? Int ?? 0
    if let o = props[kCGImagePropertyOrientation] as? Int, o >= 5 { swap(&w, &h) }
    let image = CGImageSourceCreateThumbnailAtIndex(src, 0, [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true, // bakes in the EXIF orientation
      kCGImageSourceThumbnailMaxPixelSize: maxPx,
    ] as CFDictionary)
    return (sha, w, h, image)
  }

  /// The Simulator has no Neural Engine: "Could not create inference context" unless Vision is
  /// told to run on the CPU. A real iPhone (and the Mac harness) keeps its default devices.
  static func cpuOnSimulator(_ requests: [VNRequest]) {
    #if targetEnvironment(simulator)
    for r in requests {
      if let stages = try? r.supportedComputeStageDevices {
        for (stage, devices) in stages {
          if let cpu = devices.first(where: { if case .cpu = $0 { return true } else { return false } }) { r.setComputeDevice(cpu, for: stage) }
        }
      }
    }
    #endif
  }

  /// Finds the people and faces and decides what must be hidden (DECISIONS-LOG #54, ruling 10). A fit photo with
  /// someone else in it: when he's clearly the subject he's picked and the others are covered; when two people are
  /// comparable it's "multiplePeople" with the candidates, until `pick` (pixels: the candidate he tapped) says which.
  static func locate(_ image: CGImage, kind: Kind = .fit, pick: CGRect? = nil) -> Located {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    let humans = VNDetectHumanRectanglesRequest()
    humans.upperBodyOnly = false
    let pose = VNDetectHumanBodyPoseRequest()
    let faces = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: image, orientation: .up)
    cpuOnSimulator([humans, pose, faces])
    // One request failing (body pose isn't available on every Simulator) mustn't stop the rest.
    var errors: [String] = []
    for r in [humans, pose, faces] as [VNRequest] {
      do { try handler.perform([r]) } catch { errors.append("\(type(of: r)): \(error.localizedDescription)") }
    }

    // Vision boxes are normalized with the origin bottom-left; convert to pixels, origin top-left.
    func px(_ r: CGRect) -> CGRect { CGRect(x: r.minX * W, y: (1 - r.maxY) * H, width: r.width * W, height: r.height * H) }
    var people = (humans.results ?? []).filter { $0.confidence > 0.3 }.map { px($0.boundingBox) }
      .sorted { $0.width * $0.height > $1.width * $1.height }
    let faceBoxes = (faces.results ?? []).map { px($0.boundingBox) }
    let bodies = pose.results ?? []
    var out = Located(status: "ok", errors: errors)
    out.hide = faceBoxes.map { headBox(around: $0) }
    out.people = people.count
    // A snap or a scan has no "him" to keep: every body's head is hidden in what's sent (T96), set before the early
    // return below (a body with only head points has no person box).
    if kind != .fit { out.otherHeads = bodies.compactMap { poseHead($0, W: W, H: H) } }

    guard var main = people.first ?? bodyBox(bodies.first, W, H) else {
      // A clothes scan or a snap needs no person; any face found (a mirror, a poster) is still hidden.
      if kind != .fit { return out }
      out.status = "noPerson"
      return out
    }
    out.main = main
    out.people = max(1, people.count)
    let others = people.dropFirst().filter { $0.width * $0.height >= otherPersonShare * main.width * main.height }
    // A fit photo with more than one detection (Oct 14): sort out who's who with the person instance mask.
    var inst: Instances?
    var his: UInt8?
    if kind == .fit, people.count >= 2 {
      inst = personInstances(image)
      // A person the outline sees but the person detector missed (pin-026: only two people far behind him were
      // found) joins the people, so the biggest one is really the biggest.
      if let inst {
        let found = people
        for (_, b) in inst.boxes(W: W, H: H).sorted(by: { $0.key < $1.key })
        where CGFloat(b.n) >= 0.25 * area(b.box) * CGFloat(inst.w * inst.h) / (W * H) && area(b.box) > area(found[0])
          && !found.contains(where: { iou($0, b.box) >= 0.3 || area($0.intersection(b.box)) >= 0.5 * area(b.box) }) {
          people.append(b.box)
        }
        people.sort { area($0) > area($1) }
        main = people[0]
        out.main = main
      }
      var sorted = sortPeople(main: main, rest: Array(people.dropFirst()), inst: inst, W: W, H: H)
      out.people = 1 + sorted.others.count
      if !sorted.comparable.isEmpty {
        out.candidates = [main] + sorted.comparable
        guard let pick else {
          out.status = "multiplePeople"
          return out
        }
        guard let best = out.candidates.indices.max(by: { iou(out.candidates[$0], pick) < iou(out.candidates[$1], pick) }),
              iou(out.candidates[best], pick) >= pickIoU else {
          out.status = "couldNotFrame"
          return out
        }
        if best != 0 {
          // He isn't the biggest: everyone but him (the biggest included) is someone else.
          main = out.candidates[best]
          out.main = main
          sorted = sortPeople(main: main, rest: people.filter { $0 != main }, inst: inst, W: W, H: H)
        }
        out.picked = best
      }
      his = sorted.his
      out.others = sorted.others
    }
    if kind == .fit, !out.others.isEmpty {
      out.cover = coverMasks(main: main, others: out.others, inst: inst, his: his, W: W, H: H)
    }
    // A clothes scan with someone else in it (#100): their face must have been found too (or
    // their body runs off the top edge), or it can't be sent.
    if kind != .fit, others.contains(where: { o in
      o.minY > H * 0.03 && !faceBoxes.contains { $0.intersects(o.insetBy(dx: -o.width * 0.1, dy: -o.height * 0.05)) }
    }) {
      out.status = "couldNotFrame"
      return out
    }

    // The body pose that belongs to the main person (its neck inside the main box).
    let body = bodies.first { b in
      guard let n = try? b.recognizedPoint(.neck), n.confidence > 0.3 else { return false }
      return main.insetBy(dx: -main.width * 0.2, dy: -main.height * 0.1).contains(CGPoint(x: n.location.x * W, y: (1 - n.location.y) * H))
    } ?? bodies.first
    func joint(_ name: VNHumanBodyPoseObservation.JointName) -> CGPoint? {
      guard let b = body, let p = try? b.recognizedPoint(name), p.confidence > 0.3 else { return nil }
      return CGPoint(x: p.location.x * W, y: (1 - p.location.y) * H)
    }

    // Full frame, every face hidden (founder, Oct 7; DECISIONS-LOG #54). His head comes from the
    // face detector, else the head joints of the body pose, else the space above his shoulders.
    // If none of those find it, we can't be sure the face is hidden: nothing is sent (ruling 10).
    //
    // #188: the top of his own outline (person segmentation) is always hidden too, and a face only counts as his when
    // it sits on that outline. A stock mirror selfie (camera over his face, T-shirts with a printed face on the wall)
    // had the face detector find the print, the body pose land on the shirts, and his real face sent unhidden.
    // With someone else in the photo, their covered outline is taken out, so their head is never taken for his.
    // A snap (#313) gets the same outline check whenever his upper body is in view (a mirror snap with his head in
    // it); a snap of his legs and shoes has no shoulders, and there the "top of the outline" is his shins or shoes.
    let upperBody = (joint(.leftShoulder) ?? joint(.rightShoulder)) != nil
    let mask = kind == .fit || (kind == .snap && upperBody)
      ? Measure.personMask(image, w: maskW, h: Int((CGFloat(maskW) * H / W).rounded()), quality: .balanced).map { excluding($0, out.cover) } : nil
    let band = mask.flatMap { headBand($0, main: main, W: W, H: H) }
    if let band { out.hide.append(band) }
    func onOutline(_ r: CGRect) -> Bool {
      guard let m = mask else { return true }
      return maskShare(m, r, W: W, H: H) >= 0.15 || (band?.intersects(r) ?? false)
    }
    func onOutline(_ p: CGPoint) -> Bool { onOutline(CGRect(x: p.x - 2, y: p.y - 2, width: 4, height: 4)) }
    let headJoints: [VNHumanBodyPoseObservation.JointName] = [.nose, .leftEye, .rightEye, .leftEar, .rightEar]
    let headPts = headJoints.compactMap { joint($0) }.filter { onOutline($0) }
    let shoulders = [joint(.leftShoulder), joint(.rightShoulder)].compactMap { $0 }.filter { onOutline($0) }
    let mainHasFace = faceBoxes.contains { $0.intersects(main.insetBy(dx: -main.width * 0.1, dy: -main.height * 0.05)) && onOutline($0) }
    if !mainHasFace {
      if headPts.count >= 2, let minX = headPts.map(\.x).min(), let maxX = headPts.map(\.x).max(),
         let minY = headPts.map(\.y).min(), let maxY = headPts.map(\.y).max() {
        let side = max(maxX - minX, maxY - minY, main.width * 0.18)
        out.hide.append(headBox(around: CGRect(x: (minX + maxX) / 2 - side / 2, y: (minY + maxY) / 2 - side / 2, width: side, height: side)))
      } else if shoulders.count == 2 {
        let span = abs(shoulders[0].x - shoulders[1].x)
        let top = min(shoulders[0].y, shoulders[1].y)
        out.hide.append(CGRect(x: (shoulders[0].x + shoulders[1].x) / 2 - span * 0.55, y: top - span * 1.25, width: span * 1.1, height: span * 1.25))
      } else if kind == .snap, shoulders.isEmpty {
        // A snap of his legs and shoes (#313): no upper body in view, so no head to look for; any face found is hidden
        // above. (A fit photo here can't be sent, and a top band would hide his waistband in a look-down shot.)
      } else if band == nil, main.minY > H * 0.03 {
        // A person whose top is inside the frame, but no face, head joints or shoulders: we can't
        // tell where the face is, so nothing is sent.
        out.status = "couldNotFrame"
        return out
      } else if band == nil, let top = topEdgeBand(mask, main: main, W: W, H: H, shoulderY: shoulders.map(\.y).min()) {
        // His body runs off the top edge with no face or head found (09-ui-review §10, #304). That used to mean "the
        // head is outside the photo", but a head cut off mid-face (ig-098: chin and mouth in, eyes out) looks the same
        // to the face detector. So the top of him is hidden down to just above his shoulders, unless his shoulders sit
        // at the very top (a true chest-down shot: nothing of the head is in the photo).
        out.hide.append(top)
      }
    }
    let named: [(String, VNHumanBodyPoseObservation.JointName)] = [
      ("neck", .neck), ("lShoulder", .leftShoulder), ("rShoulder", .rightShoulder), ("lElbow", .leftElbow), ("rElbow", .rightElbow),
      ("lWrist", .leftWrist), ("rWrist", .rightWrist), ("root", .root), ("lHip", .leftHip), ("rHip", .rightHip),
      ("lKnee", .leftKnee), ("rKnee", .rightKnee), ("lAnkle", .leftAnkle), ("rAnkle", .rightAnkle),
    ]
    for (key, name) in named { if let p = joint(name) { out.joints[key] = p } }
    let feet = [joint(.leftAnkle), joint(.rightAnkle)].compactMap { $0?.y }.max()
    out.pose = feet != nil ? "full" : (joint(.leftHip) ?? joint(.rightHip)) != nil ? "upper" : "none"
    // Everyone else the body pose sees (T96): a profile, a person the person detector missed, a second reflection.
    if kind == .fit { out.otherHeads = bodies.filter { $0 !== body }.compactMap { poseHead($0, W: W, H: H) } }
    return out
  }

  /// The largest head the shoulder distance can make (share of the long edge).
  static let poseHeadMaxShare: CGFloat = 0.12

  /// A body's head region from its head points (nose, eyes, ears at confidence > 0.3), pixels, origin top-left; nil
  /// without any (T96). A square on their mean, side max(2.2 × their spread, 0.9 × the shoulder span when both shoulders
  /// are seen, the distance from their centre to the nearest shoulder seen, 2% of the long edge), grown to the whole head
  /// like a face box.
  static func poseHead(_ b: VNHumanBodyPoseObservation, W: CGFloat, H: CGFloat) -> CGRect? {
    func pt(_ n: VNHumanBodyPoseObservation.JointName) -> CGPoint? {
      guard let p = try? b.recognizedPoint(n), p.confidence > 0.3 else { return nil }
      return CGPoint(x: p.location.x * W, y: (1 - p.location.y) * H)
    }
    let pts = [VNHumanBodyPoseObservation.JointName.nose, .leftEye, .rightEye, .leftEar, .rightEar].compactMap(pt)
    guard !pts.isEmpty else { return nil }
    let xs = pts.map(\.x), ys = pts.map(\.y)
    let spread = max(xs.max()! - xs.min()!, ys.max()! - ys.min()!)
    var side = max(2.2 * spread, 0.02 * max(W, H))
    let cx = xs.reduce(0, +) / CGFloat(pts.count), cy = ys.reduce(0, +) / CGFloat(pts.count)
    let shoulders = [pt(.leftShoulder), pt(.rightShoulder)].compactMap { $0 }
    if shoulders.count == 2 { side = max(side, 0.9 * hypot(shoulders[0].x - shoulders[1].x, shoulders[0].y - shoulders[1].y)) }
    // With few head points seen (a small or turned head), the head is about as tall as its centre is from the nearest
    // shoulder; capped, so a body put together wrongly can't hide half the photo.
    if let near = shoulders.map({ hypot($0.x - cx, $0.y - cy) }).min() { side = max(side, min(near, poseHeadMaxShare * max(W, H))) }
    return headBox(around: CGRect(x: cx - side / 2, y: cy - side / 2, width: side, height: side))
  }

  /// Each region: a heavy blur, then coarse pixels on top (a light blur alone can be undone, 09).
  static func hideRegions(_ image: CGImage, _ hide: [CGRect]) -> CGImage? {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    var ci = CIImage(cgImage: image)
    let whole = ci.extent
    for f in hide {
      let box = f.intersection(CGRect(x: 0, y: 0, width: W, height: H))
      guard !box.isNull, box.width > 2, box.height > 2 else { continue }
      let r = CGRect(x: box.minX, y: H - box.maxY, width: box.width, height: box.height) // CI origin is bottom-left
      let block = max(r.width, r.height) / 7
      let masked = ci.clampedToExtent()
        .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: block])
        .applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: block, kCIInputCenterKey: CIVector(x: r.midX, y: r.midY)])
        .cropped(to: r)
      ci = masked.composited(over: ci).cropped(to: whole)
    }
    return ciContext.createCGImage(ci, from: whole)
  }

  /// `pick`: the person he tapped on "Which one is you?" (normalized 0–1, origin top-left, [x, y, w, h]).
  static func run(uri: String, kind: Kind = .fit, pick: [Double]? = nil, detect: FaceDetect = Prep.detectFaces) throws -> [String: Any] {
    let t0 = CFAbsoluteTimeGetCurrent()
    func ms(since t: CFAbsoluteTime) -> Int { Int(((CFAbsoluteTimeGetCurrent() - t) * 1000).rounded()) }
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    let fm = FileManager.default
    let caches = rootOverride?.appendingPathComponent("Caches", isDirectory: true) ?? fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let docs = rootOverride?.appendingPathComponent("Documents", isDirectory: true) ?? fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
    // Retry payloads made before the sweep existed are never resent (T96), whatever this prep decides.
    purgeOldSends(caches: caches)
    let data = try Data(contentsOf: url)
    let (originalSha, sourceW, sourceH, decoded) = decode(data, maxPx: workPx)
    var sha = originalSha
    let source: [String: Any] = ["sourceWidth": sourceW, "sourceHeight": sourceH]
    guard let image = decoded else { return ["status": "couldNotFrame", "sha256": sha].merging(source) { a, _ in a } }
    let W = CGFloat(image.width), H = CGFloat(image.height)
    let pickRect = pick.flatMap { p in p.count == 4 ? CGRect(x: p[0] * W, y: p[1] * H, width: p[2] * W, height: p[3] * H) : nil }

    let tVision = CFAbsoluteTimeGetCurrent()
    let found = locate(image, kind: kind, pick: pickRect)
    let visionMs = ms(since: tVision)
    if found.status != "ok" {
      var r: [String: Any] = ["status": found.status, "sha256": sha]
      if found.status == "noPerson" { r["errors"] = found.errors }
      if found.status == "multiplePeople" {
        // "Which one is you?" (02 S23): everyone he could be, normalized, origin top-left, on the upright photo.
        r["people"] = found.people
        r["candidates"] = found.candidates.map { [Double($0.minX / W), Double($0.minY / H), Double($0.width / W), Double($0.height / H)] }
        r["width"] = image.width
        r["height"] = image.height
      }
      return r.merging(source) { a, _ in a }
    }
    // He picked someone on "Which one is you?": the same photo with another person picked is another photo, so it
    // gets its own hash (its own reading, files and score). Auto-picked photos keep the photo's own hash.
    if let i = found.picked {
      sha = SHA256.hash(data: Data("\(sha)|person \(i)".utf8)).map { String(format: "%02x", $0) }.joined()
    }
    // Everyone else covered first, then every face hidden (theirs too, under the cover), then the copy about to be sent
    // looked at again for any face still in it (T96). A cover or blur that can't be drawn, or a face that stays
    // findable, means nothing is sent.
    let swept = sweep(image, found: found, kind: kind, detect: detect)
    guard swept.status == "ok", let hidden = swept.image else {
      return ["status": "couldNotFrame", "reason": swept.reason ?? "sweepFailed", "sha256": sha].merging(source) { a, _ in a }
    }
    func norm(_ r: CGRect) -> [Double] { [Double(r.minX / W), Double(r.minY / H), Double(r.width / W), Double(r.height / H)] }

    var result: [String: Any] = [
      "status": "ok", "sha256": sha, "width": image.width, "height": image.height,
      "sourceWidth": sourceW, "sourceHeight": sourceH, "visionMs": visionMs,
      "people": kind == .fit ? max(1, found.people) : found.people, "faceBoxes": swept.hide.count, "pose": found.pose,
      // What the sweep added (T96): faces it found and hid, other bodies' heads, people covered the person detector missed.
      "sweptFaces": swept.swept.count, "otherHeads": found.otherHeads.count, "coveredExtra": swept.coveredExtra,
      "sweepMs": swept.ms, "hidden": swept.hide.map(norm),
      // Everyone else covered (Oct 14): how many, and whether he was picked automatically or chose himself.
      "masked": found.others.count, "autoPicked": found.picked == nil && !found.others.isEmpty,
    ]
    if let i = found.picked { result["picked"] = i }

    if kind == .items {
      // A clothes scan: everything stays in Documents/scans until the item reading exists (#100).
      let dir = docs.appendingPathComponent("scans", isDirectory: true)
      try fm.createDirectory(at: dir, withIntermediateDirectories: true)
      let keptURL = dir.appendingPathComponent("\(sha)-photo.jpg")
      let thumbURL = dir.appendingPathComponent("\(sha)-thumb.jpg")
      let sendURL = dir.appendingPathComponent("\(sha)-send.jpg")
      let kept = try writeJPEG(image, longEdge: keepPx, quality: 0.85, to: keptURL)
      _ = try writeJPEG(image, longEdge: thumbPx, quality: 0.8, to: thumbURL)
      let send = try writeJPEG(hidden, longEdge: detailPx, quality: 0.85, to: sendURL)
      deleteTemporary(url, keepingOut: [dir])
      result.merge([
        "keptUri": keptURL.absoluteString, "thumbUri": thumbURL.absoluteString, "sendUri": sendURL.absoluteString,
        "keptWidth": kept.width, "keptHeight": kept.height, "sendWidth": send.width, "sendHeight": send.height,
        "totalMs": ms(since: t0),
      ]) { _, b in b }
      return result
    }

    let keepDir = docs.appendingPathComponent("photos", isDirectory: true)
    let uploadDir = caches.appendingPathComponent("upload", isDirectory: true)
    let detailDir = caches.appendingPathComponent("detail", isDirectory: true)
    for d in [keepDir, uploadDir, detailDir] { try fm.createDirectory(at: d, withIntermediateDirectories: true) }
    let keptURL = keepDir.appendingPathComponent("\(sha)-photo.jpg")
    let thumbURL = keepDir.appendingPathComponent("\(sha)-thumb.jpg")
    let uploadURL = uploadDir.appendingPathComponent("\(sha).jpg")
    let detailURL = detailDir.appendingPathComponent("\(sha).jpg")
    // Sent: the face-hidden copy. Kept on his phone: his photo as he took it (no blur; founder,
    // Oct 7, DECISIONS-LOG #55), re-encoded so location and camera metadata are gone. The detail
    // copy is face-hidden too (closet crops may be sent later), and lives in Caches for a week.
    let upload = try writeJPEG(hidden, longEdge: uploadPx, quality: 0.8, to: uploadURL)
    let tZoom = CFAbsoluteTimeGetCurrent()
    // A snap is read on its own, with no close-ups (they're cut from his body pose, which a shoe photo doesn't have).
    let zoom = kind == .snap ? [] : try zoomCrops(image: image, hidden: hidden, found: found, sha: sha, in: uploadDir)
    let zoomMs = ms(since: tZoom)
    let kept = try writeJPEG(image, longEdge: keepPx, quality: 0.85, to: keptURL)
    _ = try writeJPEG(image, longEdge: thumbPx, quality: 0.8, to: thumbURL)
    let detail = try writeJPEG(hidden, longEdge: detailPx, quality: 0.85, to: detailURL)
    pruneDetail(in: detailDir, keep: detailURL)
    deleteTemporary(url, keepingOut: [uploadDir, detailDir])

    result.merge([
      "uploadUri": uploadURL.absoluteString,
      "uploadBase64": upload.data.base64EncodedString(),
      "keptUri": keptURL.absoluteString,
      "thumbUri": thumbURL.absoluteString,
      "detailUri": detailURL.absoluteString,
      "uploadWidth": upload.width,
      "uploadHeight": upload.height,
      "uploadBytes": upload.data.count,
      "keptWidth": kept.width,
      "keptHeight": kept.height,
      "detailWidth": detail.width,
      "detailHeight": detail.height,
      "zoomBase64": zoom.map { $0.data.base64EncodedString() },
      "zoomKinds": zoom.map(\.kind),
      "zoomSizes": zoom.map { [$0.width, $0.height] },
      "zoomRects": zoom.map { norm($0.rect) },
      "zoomMs": zoomMs,
      "totalMs": ms(since: t0),
    ]) { _, b in b }
    return result
  }

  /// The close-ups for the scoring call (#104), cut from the face-hidden image: upper and lower body split at
  /// the hips, or one of the whole person when the pose has no hips; none when there's no person box.
  /// Written as Caches/upload/<sha>-<kind>.jpg (long edge ≤ the upload's), so "Try again" can resend them.
  static let zoomKindsTried = [["upper", "lower"], ["body"]]

  static func zoomCrops(image: CGImage, hidden: CGImage, found: Located, sha: String, in dir: URL) throws -> [(kind: String, data: Data, width: Int, height: Int, rect: CGRect)] {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    let s = min(1, CGFloat(Measure.statPx) / max(W, H))
    // With someone else in the photo, only his outline sizes the close-ups (theirs is covered).
    let person = Measure.personMask(image, w: max(1, Int((W * s).rounded())), h: max(1, Int((H * s).rounded()))).map { excluding($0, found.cover) }
    let rects = Measure.zoomRects(located: found, person: person, W: W, H: H)
    guard let kinds = zoomKindsTried.first(where: { $0.allSatisfy { rects[$0] != nil } }) else { return [] }
    var out: [(kind: String, data: Data, width: Int, height: Int, rect: CGRect)] = []
    for k in kinds {
      guard let w = try Measure.cropJPEG(hidden, rects[k]!, longEdge: uploadPx, to: dir.appendingPathComponent("\(sha)-\(k).jpg")) else { return [] }
      // The part of the image this close-up shows (what cropJPEG cut), for the copy checks (T96).
      let shown = rects[k]!.integral.intersection(CGRect(x: 0, y: 0, width: hidden.width, height: hidden.height))
      out.append((k, w.data, w.width, w.height, shown))
    }
    return out
  }

  /// The close-ups written by an earlier prep, in order (for "Try again"); empty when they're gone.
  static func reloadZoom(sha: String) -> [String] {
    let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("upload", isDirectory: true)
    for kinds in zoomKindsTried {
      let datas = kinds.compactMap { try? Data(contentsOf: dir.appendingPathComponent("\(sha)-\($0).jpg")) }
      if datas.count == kinds.count { return datas.map { $0.base64EncodedString() } }
    }
    return []
  }

  /// The picker's / camera's temporary file is deleted; our re-encoded copy (no metadata) replaces it.
  static func deleteTemporary(_ url: URL, keepingOut ours: [URL]) {
    let fm = FileManager.default
    let caches = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let tmp = [fm.temporaryDirectory.path, caches.path]
    if url.isFileURL, tmp.contains(where: { url.path.hasPrefix($0) }), !ours.contains(where: { url.path.hasPrefix($0.path) }) {
      try? fm.removeItem(at: url)
    }
  }

  /// Detail copies older than a week are deleted (they're only a source for closet crops).
  static func pruneDetail(in dir: URL, keep: URL) {
    let fm = FileManager.default
    let cutoff = Date().addingTimeInterval(-detailDays * 86_400)
    guard let files = try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.contentModificationDateKey]) else { return }
    for f in files where f.lastPathComponent != keep.lastPathComponent {
      if let d = try? f.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate, d < cutoff {
        try? fm.removeItem(at: f)
      }
    }
  }

  /// The person mask's width for the head band (#188): coarse is enough to find the top of the outline.
  static let maskW = 256

  /// Share of a pixel rect (origin top-left) that lies on the person mask.
  static func maskShare(_ m: Guide.Gray, _ r: CGRect, W: CGFloat, H: CGFloat) -> CGFloat {
    let sx = CGFloat(m.w) / W, sy = CGFloat(m.h) / H
    let x0 = max(0, Int(r.minX * sx)), x1 = min(m.w - 1, Int(r.maxX * sx)), y0 = max(0, Int(r.minY * sy)), y1 = min(m.h - 1, Int(r.maxY * sy))
    guard x1 >= x0, y1 >= y0 else { return 0 }
    var on = 0, all = 0
    for y in y0...y1 { for x in x0...x1 { all += 1; if m.px[y * m.w + x] > 127 { on += 1 } } }
    return all > 0 ? CGFloat(on) / CGFloat(all) : 0
  }

  /// The top of his outline inside the main box, grown to cover the whole head and chin (#188), in pixels. Nil when
  /// the outline runs off the top edge (a chest-down shot: the head is outside the photo) or there's no outline.
  static func headBand(_ m: Guide.Gray, main: CGRect, W: CGFloat, H: CGFloat) -> CGRect? {
    let sx = CGFloat(m.w) / W, sy = CGFloat(m.h) / H
    let cx0 = max(0, Int((main.minX - main.width * 0.1) * sx)), cx1 = min(m.w - 1, Int((main.maxX + main.width * 0.1) * sx))
    guard cx1 > cx0 else { return nil }
    func span(_ y: Int) -> (Int, Int)? {
      var lo = -1, hi = -1
      for x in cx0...cx1 where m.px[y * m.w + x] > 127 { if lo < 0 { lo = x }; hi = x }
      return lo >= 0 && hi - lo + 1 >= 2 ? (lo, hi) : nil
    }
    guard let top = (0..<m.h).first(where: { span($0) != nil }), let bottom = (0..<m.h).last(where: { span($0) != nil }), bottom > top else { return nil }
    if top <= 1 { return nil }   // the outline touches the top edge: no head in the photo to find
    let height = bottom - top
    // The head's width: the widest span a little below the crown (a raised phone hand only makes it wider).
    let probe = (top + max(1, height * 4 / 100))...min(bottom, top + max(2, height * 9 / 100))
    let spans = probe.compactMap { span($0) }
    guard let lo = spans.map(\.0).min(), let hi = spans.map(\.1).max() else { return nil }
    let headW = CGFloat(hi - lo + 1) / sx
    let bandH = min(max(1.5 * headW, 0.12 * CGFloat(height) / sy), 0.30 * CGFloat(height) / sy)
    let x = CGFloat(lo) / sx - headW * 0.15, y = CGFloat(top) / sy - headW * 0.1
    return CGRect(x: x, y: y, width: headW * 1.3, height: bandH + headW * 0.1).intersection(CGRect(x: 0, y: 0, width: W, height: H))
  }

  /// The top of him when his outline runs off the top edge and no head was found (#304), in pixels: from the top edge
  /// down to a little above his highest shoulder (or, with no shoulder found, the top 18% of his outline), across the
  /// part of his outline in those rows (a raised phone arm included). Nil when his shoulders are at the very top (the
  /// head is outside the photo) or the band would be too thin to hold a face.
  static func topEdgeBand(_ m: Guide.Gray?, main: CGRect, W: CGFloat, H: CGFloat, shoulderY: CGFloat?) -> CGRect? {
    if let sy = shoulderY, sy < H * 0.06 { return nil }
    // His outline's height in pixels (the person box when there's no outline).
    var x0 = main.minX, x1 = main.maxX, outlineH = main.height
    var rowsOf: ((CGFloat) -> (CGFloat, CGFloat)?)? = nil
    if let m {
      let sx = CGFloat(m.w) / W, sy = CGFloat(m.h) / H
      let cx0 = max(0, Int((main.minX - main.width * 0.1) * sx)), cx1 = min(m.w - 1, Int((main.maxX + main.width * 0.1) * sx))
      guard cx1 > cx0 else { return nil }
      let rows = (0..<m.h).filter { y in (cx0...cx1).contains { m.px[y * m.w + $0] > 127 } }
      guard let first = rows.first, let last = rows.last, first <= 1 else { return nil }
      outlineH = CGFloat(last - first) / sy
      rowsOf = { depth in
        var lo = Int.max, hi = -1
        for y in 0...min(m.h - 1, Int(depth * sy)) {
          for x in cx0...cx1 where m.px[y * m.w + x] > 127 { lo = min(lo, x); hi = max(hi, x) }
        }
        return hi >= lo ? (CGFloat(lo) / sx, CGFloat(hi + 1) / sx) : nil
      }
    }
    let depth = shoulderY.map { $0 - 0.04 * outlineH } ?? 0.18 * outlineH
    guard depth >= H * 0.02 else { return nil }
    if let rowsOf {
      guard let (lo, hi) = rowsOf(depth) else { return nil }
      x0 = lo; x1 = hi
    }
    let pad = (x1 - x0) * 0.08
    return CGRect(x: x0 - pad, y: 0, width: x1 - x0 + 2 * pad, height: depth + outlineH * 0.02).intersection(CGRect(x: 0, y: 0, width: W, height: H))
  }

  /// A face box grown to the whole head (hair, ears, chin): 1.6× wide, 1.9× tall, centered a little high.
  static func headBox(around f: CGRect) -> CGRect {
    let w = f.width * 1.6, h = f.height * 1.9
    return CGRect(x: f.midX - w / 2, y: f.midY - h * 0.55, width: w, height: h)
  }

  /// A body-pose box when the person detector found nobody (tight crops, unusual poses).
  static func bodyBox(_ b: VNHumanBodyPoseObservation?, _ W: CGFloat, _ H: CGFloat) -> CGRect? {
    guard let b, let pts = try? b.recognizedPoints(.all) else { return nil }
    let ok = pts.values.filter { $0.confidence > 0.3 }.map { CGPoint(x: $0.location.x * W, y: (1 - $0.location.y) * H) }
    guard ok.count >= 4, let minX = ok.map(\.x).min(), let maxX = ok.map(\.x).max(),
          let minY = ok.map(\.y).min(), let maxY = ok.map(\.y).max() else { return nil }
    return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY).insetBy(dx: -(maxX - minX) * 0.15, dy: -(maxY - minY) * 0.05)
  }

  /// Re-encodes with no metadata (no EXIF, GPS or maker notes are copied).
  static func writeJPEG(_ img: CGImage, longEdge: CGFloat, quality: CGFloat, to url: URL) throws -> (data: Data, width: Int, height: Int) {
    let scale = min(1, longEdge / CGFloat(max(img.width, img.height)))
    let w = Int((CGFloat(img.width) * scale).rounded()), h = Int((CGFloat(img.height) * scale).rounded())
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { throw NSError(domain: "KittedVision", code: 1) }
    ctx.interpolationQuality = .high
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    guard let scaled = ctx.makeImage() else { throw NSError(domain: "KittedVision", code: 2) }
    let out = NSMutableData()
    guard let dest = CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil)
    else { throw NSError(domain: "KittedVision", code: 3) }
    CGImageDestinationAddImage(dest, scaled, [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary)
    guard CGImageDestinationFinalize(dest) else { throw NSError(domain: "KittedVision", code: 4) }
    try (out as Data).write(to: url, options: .atomic)
    return (out as Data, w, h)
  }
}

// T96: every face that isn't hidden gets found before the copy leaves the phone (tasks/T96/TASK.md). Vision's face
// detector, run once on the whole 2048 px photo, misses faces 12–50 px in the copy sent; the person detector misses
// small, seated, cut-off or reflected people. So after `locate`, the copy about to be sent is covered further (people
// the outline sees but the box detector missed), every other body's head is hidden, and the copy is looked at again in
// tiles: any face found is hidden, and if one can still be found after that, nothing is sent (ruling 10).
extension Prep {
  /// One face the detector found: its box (pixels, origin top-left, in the whole image) and Vision's confidence.
  struct Face { var box: CGRect; var confidence: Float }

  /// Finds faces inside `rect` of `image` and returns them in the whole image's pixels. Throws when the request fails.
  typealias FaceDetect = (_ image: CGImage, _ rect: CGRect) throws -> [Face]

  /// The real detector: Vision's face rectangles on the tile (each tile is scaled by Vision, so a face too small for one
  /// look at the whole photo is findable in a tile). Every result kept, no confidence floor.
  static func detectFaces(_ image: CGImage, in rect: CGRect) throws -> [Face] {
    let r = rect.integral.intersection(CGRect(x: 0, y: 0, width: image.width, height: image.height))
    guard !r.isNull, r.width >= 1, r.height >= 1, let tile = image.cropping(to: r) else {
      throw NSError(domain: "KittedVision", code: 20, userInfo: [NSLocalizedDescriptionKey: "face tile \(r) can't be cut"])
    }
    let req = VNDetectFaceRectanglesRequest()
    cpuOnSimulator([req])
    try VNImageRequestHandler(cgImage: tile, orientation: .up).perform([req])
    return (req.results ?? []).map { o in
      let b = o.boundingBox // normalized to the tile, origin bottom-left
      return Face(box: CGRect(x: r.minX + b.minX * r.width, y: r.minY + (1 - b.maxY) * r.height, width: b.width * r.width, height: b.height * r.height),
                  confidence: o.confidence)
    }
  }

  /// The tile grids the sweep looks at: 1 = the whole image, n = n×n overlapping tiles.
  static let faceGrids: [Int] = [1, 2, 3, 4]

  /// The tiles for `grids`, grid by grid, then column, then row: each n×n tile is W/(0.75n+0.25) × H/(0.75n+0.25),
  /// stepped by 0.75 of a side (a quarter overlap), whole pixels, clipped to the image. Their union is the image.
  static func tiles(W: CGFloat, H: CGFloat, grids: [Int]) -> [CGRect] {
    let whole = CGRect(x: 0, y: 0, width: W, height: H)
    var out: [CGRect] = []
    for n in grids where n > 0 {
      let tw = W / (CGFloat(n) * 0.75 + 0.25), th = H / (CGFloat(n) * 0.75 + 0.25)
      for i in 0..<n {
        for k in 0..<n {
          let t = CGRect(x: CGFloat(i) * tw * 0.75, y: CGFloat(k) * th * 0.75, width: tw, height: th).integral.intersection(whole)
          if !t.isNull, t.width > 0, t.height > 0 { out.append(t) }
        }
      }
    }
    return out
  }

  /// Fit only: an outline label from the instance mask that isn't his is covered when its pixels are at least this
  /// share of the mask grid (0.2%: smaller ones are left to the face pass).
  static let instanceMinShare: CGFloat = 0.002
  /// A face found on the original with at least this share of its box inside one region `locate` hid is already hidden.
  static let alreadyHiddenShare: CGFloat = 0.95
  /// A label at least this much under the cover `locate` drew is someone `locate` already covered.
  static let alreadyCoveredShare: CGFloat = 0.8

  /// What the sweep decided.
  struct Swept {
    var status: String          // "ok" | "couldNotFrame"
    var reason: String?         // nil when ok; "faceRemains" | "sweepFailed" when refused
    var image: CGImage?         // the copy to send (covered, then every region hidden); nil when refused
    var hide: [CGRect]          // every region hidden in `image`: found.hide + found.otherHeads + headBox of each swept face
    var cover: Guide.Gray?      // the final cover (found.cover plus missed people), nil when none
    var swept: [Face]           // faces the tile pass found in the covered, hidden copy (then hidden)
    var coveredExtra: Int       // people covered that locate didn't cover (missed by the person detector)
    var ms: Int                 // the sweep's time
  }

  /// People the outline sees and `locate` didn't cover (fit only): how many, and the cover drawn for them. Every
  /// instance label that isn't his, at least `instanceMinShare` of the grid and not already under `found.cover`, is
  /// covered like any other person (its box and outline, never onto him). Nothing is covered when his own outline
  /// can't be told apart (no instance mask, or no label inside his box).
  static func missedPeople(_ image: CGImage, found: Located) -> (count: Int, cover: Guide.Gray?) {
    guard let main = found.main, let inst = personInstances(image) else { return (0, nil) }
    let W = CGFloat(image.width), H = CGFloat(image.height)
    guard let his = inst.counts(main.insetBy(dx: main.width * 0.1, dy: main.height * 0.05), W: W, H: H).labels.max(by: { $0.value < $1.value })?.key
    else { return (0, nil) }
    let w = inst.w, h = inst.h
    // Each label's pixels already under locate's cover.
    var under: [UInt8: Int] = [:]
    if let c = found.cover {
      for y in 0..<h {
        let cy = min(c.h - 1, (y * c.h) / h)
        for x in 0..<w {
          let l = inst.px[y * w + x]
          guard l != 0, l != his, c.px[cy * c.w + min(c.w - 1, (x * c.w) / w)] > 127 else { continue }
          under[l, default: 0] += 1
        }
      }
    }
    let boxes = inst.boxes(W: W, H: H).sorted { $0.key < $1.key }
      .filter { l, b in l != his && CGFloat(b.n) >= instanceMinShare * CGFloat(w * h) && CGFloat(under[l] ?? 0) < alreadyCoveredShare * CGFloat(b.n) }
      .map(\.value.box)
    guard !boxes.isEmpty else { return (0, nil) }
    return (boxes.count, coverMasks(main: main, others: boxes, inst: inst, his: his, W: W, H: H))
  }

  /// Two covers as one, on the finer of their grids (a pixel is covered when either covers it).
  static func union(_ a: Guide.Gray, _ b: Guide.Gray) -> Guide.Gray {
    let w = max(a.w, b.w), h = max(a.h, b.h)
    var px = [UInt8](repeating: 0, count: w * h)
    for y in 0..<h {
      let ay = min(a.h - 1, (y * a.h) / h), by = min(b.h - 1, (y * b.h) / h)
      for x in 0..<w {
        let ax = min(a.w - 1, (x * a.w) / w), bx = min(b.w - 1, (x * b.w) / w)
        if a.px[ay * a.w + ax] > 127 || b.px[by * b.w + bx] > 127 { px[y * w + x] = 255 }
      }
    }
    return Guide.Gray(w: w, h: h, px: px)
  }

  /// A hidden face whose pixels the blur left at least this unchanged (grey within 12 of the original) is covered flat
  /// grey instead: a very dark or washed-out face keeps its look through any blur (T96).
  static let hiddenMaxUnchanged: CGFloat = 0.4

  /// The face inside a head region (the box `headBox(around:)` grew it from), pixels.
  static func faceIn(_ head: CGRect) -> CGRect {
    let w = head.width / 1.6, h = head.height / 1.9
    return CGRect(x: head.midX - w / 2, y: head.minY + 0.55 * head.height - h / 2, width: w, height: h)
  }

  /// Share of the pixels of `r` (pixels, origin top-left) whose grey differs between `a` and `b` (same size) by under 12.
  static func unchangedShare(_ a: CGImage, _ b: CGImage, in r: CGRect) -> CGFloat? {
    let rr = r.integral.intersection(CGRect(x: 0, y: 0, width: min(a.width, b.width), height: min(a.height, b.height)))
    guard !rr.isNull, rr.width >= 4, rr.height >= 4, let ca = a.cropping(to: rr), let cb = b.cropping(to: rr) else { return nil }
    let w = Int(rr.width), h = Int(rr.height)
    func grey(_ img: CGImage) -> [UInt8]? {
      var buf = [UInt8](repeating: 0, count: w * h * 4)
      let ok = buf.withUnsafeMutableBytes { p -> Bool in
        guard let ctx = CGContext(data: p.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return false }
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
        return true
      }
      return ok ? buf : nil
    }
    guard let pa = grey(ca), let pb = grey(cb) else { return nil }
    var same = 0
    for i in stride(from: 0, to: w * h * 4, by: 4) {
      let ga = 0.299 * Double(pa[i]) + 0.587 * Double(pa[i + 1]) + 0.114 * Double(pa[i + 2])
      let gb = 0.299 * Double(pb[i]) + 0.587 * Double(pb[i + 1]) + 0.114 * Double(pb[i + 2])
      if abs(ga - gb) < 12 { same += 1 }
    }
    return CGFloat(same) / CGFloat(w * h)
  }

  /// The regions filled flat cover grey, at the image's size.
  static func fillRegions(_ image: CGImage, _ rects: [CGRect]) -> CGImage? {
    let W = CGFloat(image.width), H = CGFloat(image.height)
    var ci = CIImage(cgImage: image)
    let whole = ci.extent
    let gray = CIImage(color: CIColor(red: coverGray, green: coverGray, blue: coverGray))
    for f in rects {
      let box = f.intersection(CGRect(x: 0, y: 0, width: W, height: H))
      guard !box.isNull, box.width > 0, box.height > 0 else { continue }
      ci = gray.cropped(to: CGRect(x: box.minX, y: H - box.maxY, width: box.width, height: box.height)).composited(over: ci).cropped(to: whole)
    }
    return ciContext.createCGImage(ci, from: whole)
  }

  /// Faces found on several tiles are one face: a box overlapping a kept one by IoU ≥ 0.5 keeps the larger of the two.
  static func dedupe(_ faces: [Face]) -> [Face] {
    var out: [Face] = []
    for f in faces {
      if let i = out.firstIndex(where: { iou($0.box, f.box) >= 0.5 }) {
        if area(f.box) > area(out[i].box) { out[i] = f }
      } else {
        out.append(f)
      }
    }
    return out
  }

  /// After `locate` (status "ok"), on the upright working image: the copy that may be sent, or a refusal. Never changes
  /// found.status; it only covers and hides more, or refuses.
  ///  1. F = the faces `detect` finds on every tile of `faceGrids` in today's copy (`locate`'s cover and hiding),
  ///     de-duplicated. Looked at before the new layers below: a face half under a new cover or a pose head box is
  ///     still found whole, and so hidden whole.
  ///  2. cover = found.cover, plus (fit) every person the outline sees that isn't him and locate didn't cover
  ///  3. hide = found.hide + found.otherHeads + each face's head; the copy = hideRegions(coverOthers(image, cover), hide),
  ///     then any hidden face the blur barely changed is filled flat grey
  ///  4. F non-empty: the tiles touching the faces' heads are looked at again in the copy: any face → "faceRemains".
  ///  Any detector error, or a cover or blur that can't be drawn → "sweepFailed".
  static func sweep(_ image: CGImage, found: Located, kind: Kind, detect: FaceDetect = detectFaces) -> Swept {
    let t0 = CFAbsoluteTimeGetCurrent()
    let W = CGFloat(image.width), H = CGFloat(image.height)
    var out = Swept(status: "couldNotFrame", reason: "sweepFailed", image: nil, hide: found.hide + found.otherHeads, cover: found.cover,
                    swept: [], coveredExtra: 0, ms: 0)
    func finish(_ status: String, _ reason: String?, _ img: CGImage?) -> Swept {
      out.status = status
      out.reason = reason
      out.image = status == "ok" ? img : nil
      out.ms = Int(((CFAbsoluteTimeGetCurrent() - t0) * 1000).rounded())
      return out
    }

    // 1. Today's copy, looked at in tiles.
    let coveredToday: CGImage? = found.cover == nil ? image : coverOthers(image, found.cover!)
    guard let coveredToday, let today = hideRegions(coveredToday, found.hide) else { return finish("couldNotFrame", "sweepFailed", nil) }
    let grid = tiles(W: W, H: H, grids: faceGrids)
    var faces: [Face] = []
    do {
      for t in grid { try autoreleasepool { faces += try detect(image, t) } }
    } catch {
      return finish("couldNotFrame", "sweepFailed", nil)
    }
    // A face wholly inside one region locate hid (his own, a poster's) is hidden as today; one only partly inside
    // (a stranger half under his head box) is hidden in full.
    out.swept = dedupe(faces).filter { f in !found.hide.contains { area($0.intersection(f.box)) >= alreadyHiddenShare * area(f.box) } }
    let heads = out.swept.map { headBox(around: $0.box) }
    out.hide += heads

    // 2. People the person detector missed.
    if kind == .fit {
      let missed = autoreleasepool { missedPeople(image, found: found) }
      if let extra = missed.cover {
        out.cover = found.cover.map { union($0, extra) } ?? extra
        out.coveredExtra = missed.count
      }
    }

    // 3. The copy to send: today's when nothing was added, else drawn again with everything covered and hidden. A hidden
    // face the blur barely changed (very dark or washed out) is filled flat grey.
    var sent = today
    if out.coveredExtra > 0 || out.hide.count > found.hide.count {
      let covered: CGImage? = out.cover == nil ? image : coverOthers(image, out.cover!)
      guard let covered, let drawn = hideRegions(covered, out.hide) else { return finish("couldNotFrame", "sweepFailed", nil) }
      sent = drawn
    }
    // Filled flat grey: every head the sweep added (another body's, or a face found in today's copy: never his face
    // as locate hid it), like everyone else's body under the cover; and any of locate's regions the blur barely changed.
    let added = Array(out.hide.dropFirst(found.hide.count))
    let weak = found.hide.filter { r in (unchangedShare(image, sent, in: faceIn(r)) ?? 0) >= hiddenMaxUnchanged }
    if !(added + weak).isEmpty {
      guard let filled = autoreleasepool(invoking: { fillRegions(sent, weak + added) }) else { return finish("couldNotFrame", "sweepFailed", nil) }
      sent = filled
    }

    // 4. The faces found are hidden now: the tiles touching them are looked at again (pixels elsewhere were only covered
    // or blurred more, which can't make a face findable).
    do {
      for t in grid where heads.contains(where: { $0.intersects(t) }) {
        let again = try autoreleasepool { try detect(sent, t) }
        if !again.isEmpty { return finish("couldNotFrame", "faceRemains", nil) }
      }
    } catch {
      return finish("couldNotFrame", "sweepFailed", nil)
    }
    return finish("ok", nil, sent)
  }

  /// Retry payloads made before this sweep existed are never resent (an upgrade with a failed check waiting).
  static let sweepVersion = 1

  /// If `<caches>/upload/.sweep-v<sweepVersion>` is missing: every *.jpg in `<caches>/upload` is deleted, then the marker
  /// is written. Caches/detail is left (never sent by itself).
  static func purgeOldSends(caches: URL) {
    let fm = FileManager.default
    let dir = caches.appendingPathComponent("upload", isDirectory: true)
    let marker = dir.appendingPathComponent(".sweep-v\(sweepVersion)")
    guard !fm.fileExists(atPath: marker.path) else { return }
    var purged = true
    if let files = try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) {
      for f in files where f.pathExtension.lowercased() == "jpg" {
        do { try fm.removeItem(at: f) } catch { purged = false }
      }
    }
    // The marker only once every old payload is gone (a file that couldn't be deleted is tried again next time).
    guard purged else { return }
    try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
    try? Data().write(to: marker)
  }
}
