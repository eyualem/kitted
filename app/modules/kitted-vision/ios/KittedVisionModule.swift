// kitted-vision: on-device photo prep (05 §P3 C, 03 §8, ruling 11). Takes the photo he picked
// or shot and returns only what may leave the phone or be kept:
//   1. SHA-256 of the ORIGINAL bytes ("same photo, same score")
//   2. orientation fixed; Apple Vision finds the people, the body pose and any faces
//   3. the full frame, with every face (his head and anyone else's) blurred and pixelated; if his
//      head can't be found, nothing is sent (ruling 10, DECISIONS-LOG #54)
//   4. four re-encoded JPEGs, no metadata: the face-hidden upload copy (1024 px long edge,
//      q0.8, also returned as base64); kept only on the phone, his photo unblurred (2048 px)
//      and a 400 px thumb (DECISIONS-LOG #55); and a face-hidden 2048 px detail copy in
//      Caches/detail for a week, the source for closet crops (DECISIONS-LOG #83)
//   5. the temporary original (picker / camera output) is deleted
import AVFoundation
import CoreImage
import CoreML
import CryptoKit
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

public class KittedVisionModule: Module {
  private var dictation: KittedDictation?

  public func definition() -> ModuleDefinition {
    Name("KittedVision")

    AsyncFunction("prepare") { (uri: String) -> [String: Any] in
      return try Prep.run(uri: uri)
    }

    /// false on the Simulator (no camera): the app shows the simulated camera instead.
    Function("hasCamera") { () -> Bool in
      AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) != nil
        || AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    /// "granted" / "denied"; asks the system the first time (02 D5: only from the camera).
    AsyncFunction("requestCameraPermission") { (promise: Promise) in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized: promise.resolve("granted")
      case .notDetermined: AVCaptureDevice.requestAccess(for: .video) { promise.resolve($0 ? "granted" : "denied") }
      default: promise.resolve("denied")
      }
    }

    View(KittedCameraView.self) {
      Events("onGuide", "onReady", "onCameraError")
      Prop("facing") { (view: KittedCameraView, facing: String) in view.setFacing(facing) }
      Prop("torch") { (view: KittedCameraView, on: Bool) in view.torchOn = on }
      AsyncFunction("takePhoto") { (view: KittedCameraView, promise: Promise) in view.takePhoto(promise) }
    }

    // Voice input (DECISIONS-LOG #70): on-device dictation for the composer's mic.
    Events("onDictation")

    AsyncFunction("dictationSupported") { () async -> Bool in
      await KittedDictation.isSupported()
    }

    AsyncFunction("requestMicrophone") { () async -> String in
      await KittedDictation.requestMicrophone() ? "granted" : "denied"
    }

    AsyncFunction("startDictation") { () async throws in
      if self.dictation == nil {
        self.dictation = KittedDictation { [weak self] event in
          switch event {
          case let .text(text, isFinal): self?.sendEvent("onDictation", ["type": "text", "text": text, "final": isFinal])
          case let .level(level): self?.sendEvent("onDictation", ["type": "level", "level": level])
          case let .ended(error): self?.sendEvent("onDictation", ["type": "end", "error": error as Any])
          }
        }
      }
      try await self.dictation?.start()
    }

    AsyncFunction("stopDictation") { () async in
      await self.dictation?.stop()
    }

    /// "Try again" after a failed read: the upload copy from the first prep (Caches/upload).
    AsyncFunction("reloadUpload") { (sha256: String) -> String? in
      let url = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("upload", isDirectory: true).appendingPathComponent("\(sha256).jpg")
      return (try? Data(contentsOf: url))?.base64EncodedString()
    }
  }
}

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
  /// A second person counts when their box is at least this share of the main person's area.
  static let otherPersonShare: CGFloat = 0.25
  /// One context for every prep (creating one per photo costs tens of ms).
  static let ciContext = CIContext()

  static func run(uri: String) throws -> [String: Any] {
    let t0 = CFAbsoluteTimeGetCurrent()
    func ms(since t: CFAbsoluteTime) -> Int { Int(((CFAbsoluteTimeGetCurrent() - t) * 1000).rounded()) }
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    let data = try Data(contentsOf: url)
    let sha = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()

    // The original's size, upright (EXIF orientations 5–8 are rotated a quarter turn).
    guard let src = CGImageSourceCreateWithData(data as CFData, nil) else { return ["status": "couldNotFrame", "sha256": sha] }
    let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
    var sourceW = props[kCGImagePropertyPixelWidth] as? Int ?? 0, sourceH = props[kCGImagePropertyPixelHeight] as? Int ?? 0
    if let o = props[kCGImagePropertyOrientation] as? Int, o >= 5 { swap(&sourceW, &sourceH) }
    let source: [String: Any] = ["sourceWidth": sourceW, "sourceHeight": sourceH]

    guard let image = CGImageSourceCreateThumbnailAtIndex(src, 0, [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true, // bakes in the EXIF orientation
            kCGImageSourceThumbnailMaxPixelSize: workPx,
          ] as CFDictionary)
    else { return ["status": "couldNotFrame", "sha256": sha].merging(source) { a, _ in a } }

    let W = CGFloat(image.width), H = CGFloat(image.height)
    let tVision = CFAbsoluteTimeGetCurrent()
    let humans = VNDetectHumanRectanglesRequest()
    humans.upperBodyOnly = false
    let pose = VNDetectHumanBodyPoseRequest()
    let faces = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: image, orientation: .up)
    // One request failing (body pose isn't available on every Simulator) mustn't stop the rest.
    var errors: [String] = []
    #if targetEnvironment(simulator)
    // The Simulator has no Neural Engine: "Could not create inference context" unless Vision is
    // told to run on the CPU. A real iPhone keeps its default (faster) devices.
    for r in [humans, pose, faces] as [VNRequest] {
      if let stages = try? r.supportedComputeStageDevices {
        for (stage, devices) in stages {
          if let cpu = devices.first(where: { if case .cpu = $0 { return true } else { return false } }) { r.setComputeDevice(cpu, for: stage) }
        }
      }
    }
    #endif
    for r in [humans, pose, faces] as [VNRequest] {
      do { try handler.perform([r]) } catch { errors.append("\(type(of: r)): \(error.localizedDescription)") }
    }
    let visionMs = ms(since: tVision)

    // Vision boxes are normalized with the origin bottom-left; convert to pixels, origin top-left.
    func px(_ r: CGRect) -> CGRect { CGRect(x: r.minX * W, y: (1 - r.maxY) * H, width: r.width * W, height: r.height * H) }
    let people = (humans.results ?? []).filter { $0.confidence > 0.3 }.map { px($0.boundingBox) }
      .sorted { $0.width * $0.height > $1.width * $1.height }
    let faceBoxes = (faces.results ?? []).map { px($0.boundingBox) }
    let bodies = pose.results ?? []

    guard let main = people.first ?? bodyBox(bodies.first, W, H) else {
      return ["status": "noPerson", "sha256": sha, "errors": errors, "faces": faceBoxes.count].merging(source) { a, _ in a }
    }
    let others = people.dropFirst().filter { $0.width * $0.height >= otherPersonShare * main.width * main.height }
    if !others.isEmpty { return ["status": "multiplePeople", "sha256": sha, "people": people.count].merging(source) { a, _ in a } }

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
    let headJoints: [VNHumanBodyPoseObservation.JointName] = [.nose, .leftEye, .rightEye, .leftEar, .rightEar]
    let headPts = headJoints.compactMap { joint($0) }
    let shoulders = [joint(.leftShoulder), joint(.rightShoulder)].compactMap { $0 }
    var hide: [CGRect] = faceBoxes.map { headBox(around: $0) }
    let mainHasFace = faceBoxes.contains { $0.intersects(main.insetBy(dx: -main.width * 0.1, dy: -main.height * 0.05)) }
    if !mainHasFace {
      if headPts.count >= 2, let minX = headPts.map(\.x).min(), let maxX = headPts.map(\.x).max(),
         let minY = headPts.map(\.y).min(), let maxY = headPts.map(\.y).max() {
        let side = max(maxX - minX, maxY - minY, main.width * 0.18)
        hide.append(headBox(around: CGRect(x: (minX + maxX) / 2 - side / 2, y: (minY + maxY) / 2 - side / 2, width: side, height: side)))
      } else if shoulders.count == 2 {
        let span = abs(shoulders[0].x - shoulders[1].x)
        let top = min(shoulders[0].y, shoulders[1].y)
        hide.append(CGRect(x: (shoulders[0].x + shoulders[1].x) / 2 - span * 0.55, y: top - span * 1.25, width: span * 1.1, height: span * 1.25))
      } else if main.minY > H * 0.03 {
        // A person whose top is inside the frame, but no face, head joints or shoulders: we can't
        // tell where the face is, so nothing is sent.
        return ["status": "couldNotFrame", "sha256": sha].merging(source) { a, _ in a }
      }
      // Otherwise his body runs off the top edge with no face or head found: the head is outside
      // the photo (a chest-down mirror shot), so there's nothing to hide.

    }
    let feet = [joint(.leftAnkle), joint(.rightAnkle)].compactMap { $0?.y }.max()

    // Each region: a heavy blur, then coarse pixels on top (a light blur alone can be undone, 09).
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
    guard let hidden = ciContext.createCGImage(ci, from: whole) else { return ["status": "couldNotFrame", "sha256": sha].merging(source) { a, _ in a } }
    let pixelated = hide.count

    let fm = FileManager.default
    let caches = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let keepDir = fm.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("photos", isDirectory: true)
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
    let kept = try writeJPEG(image, longEdge: keepPx, quality: 0.85, to: keptURL)
    _ = try writeJPEG(image, longEdge: thumbPx, quality: 0.8, to: thumbURL)
    let detail = try writeJPEG(hidden, longEdge: detailPx, quality: 0.85, to: detailURL)
    pruneDetail(in: detailDir, keep: detailURL)

    // The picker's / camera's temporary file is deleted; our re-encoded copy (no metadata) replaces it.
    let tmp = [fm.temporaryDirectory.path, caches.path]
    if url.isFileURL, tmp.contains(where: { url.path.hasPrefix($0) }), !url.path.hasPrefix(uploadDir.path), !url.path.hasPrefix(detailDir.path) {
      try? fm.removeItem(at: url)
    }

    let poseKind = feet != nil ? "full" : (joint(.leftHip) ?? joint(.rightHip)) != nil ? "upper" : "none"
    return [
      "status": "ok",
      "sha256": sha,
      "uploadUri": uploadURL.absoluteString,
      "uploadBase64": upload.data.base64EncodedString(),
      "keptUri": keptURL.absoluteString,
      "thumbUri": thumbURL.absoluteString,
      "detailUri": detailURL.absoluteString,
      "width": image.width,
      "height": image.height,
      "sourceWidth": sourceW,
      "sourceHeight": sourceH,
      "uploadWidth": upload.width,
      "uploadHeight": upload.height,
      "uploadBytes": upload.data.count,
      "keptWidth": kept.width,
      "keptHeight": kept.height,
      "detailWidth": detail.width,
      "detailHeight": detail.height,
      "visionMs": visionMs,
      "totalMs": ms(since: t0),
      "people": max(1, people.count),
      "faceBoxes": pixelated,
      "pose": poseKind,
    ]
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
