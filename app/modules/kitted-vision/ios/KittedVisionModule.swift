// kitted-vision: on-device photo prep (05 §P3 C, 03 §8, ruling 11). Takes the photo he picked
// or shot and returns only what may leave the phone or be kept:
//   1. SHA-256 of the ORIGINAL bytes ("same photo, same score")
//   2. orientation fixed; Apple Vision finds the people, the body pose and any faces
//   3. crop to the main person, cut at the neck (the face never survives), pixelate any face
//      box still inside the crop (backup)
//   4. three re-encoded JPEGs, no metadata: the upload copy (1024 px long edge, q0.8, also
//      returned as base64), the neck-down copy kept on the phone (2048 px) and a 400 px thumb
//   5. the original is deleted when it's a temporary copy (picker / camera output)
import AVFoundation
import CoreImage
import CoreML
import CryptoKit
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

public class KittedVisionModule: Module {
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

    /// "Try again" after a failed read: the upload copy from the first prep (Caches/upload).
    AsyncFunction("reloadUpload") { (sha256: String) -> String? in
      let url = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("upload", isDirectory: true).appendingPathComponent("\(sha256).jpg")
      return (try? Data(contentsOf: url))?.base64EncodedString()
    }
  }
}

enum Prep {
  static let uploadPx: CGFloat = 1024
  static let keepPx: CGFloat = 2048
  static let thumbPx: CGFloat = 400
  /// A second person counts when their box is at least this share of the main person's area.
  static let otherPersonShare: CGFloat = 0.25

  static func run(uri: String) throws -> [String: Any] {
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    let data = try Data(contentsOf: url)
    let sha = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()

    guard let src = CGImageSourceCreateWithData(data as CFData, nil),
          let image = CGImageSourceCreateThumbnailAtIndex(src, 0, [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true, // bakes in the EXIF orientation
            kCGImageSourceThumbnailMaxPixelSize: 4096,
          ] as CFDictionary)
    else { return ["status": "couldNotFrame", "sha256": sha] }

    let W = CGFloat(image.width), H = CGFloat(image.height)
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

    // Vision boxes are normalized with the origin bottom-left; convert to pixels, origin top-left.
    func px(_ r: CGRect) -> CGRect { CGRect(x: r.minX * W, y: (1 - r.maxY) * H, width: r.width * W, height: r.height * H) }
    let people = (humans.results ?? []).filter { $0.confidence > 0.3 }.map { px($0.boundingBox) }
      .sorted { $0.width * $0.height > $1.width * $1.height }
    let faceBoxes = (faces.results ?? []).map { px($0.boundingBox) }
    let bodies = pose.results ?? []

    guard let main = people.first ?? bodyBox(bodies.first, W, H) else {
      return ["status": "noPerson", "sha256": sha, "errors": errors, "faces": faceBoxes.count]
    }
    let others = people.dropFirst().filter { $0.width * $0.height >= otherPersonShare * main.width * main.height }
    if !others.isEmpty { return ["status": "multiplePeople", "sha256": sha, "people": people.count] }

    // The body pose that belongs to the main person (its neck inside the main box).
    let body = bodies.first { b in
      guard let n = try? b.recognizedPoint(.neck), n.confidence > 0.3 else { return false }
      return main.insetBy(dx: -main.width * 0.2, dy: -main.height * 0.1).contains(CGPoint(x: n.location.x * W, y: (1 - n.location.y) * H))
    } ?? bodies.first
    func joint(_ name: VNHumanBodyPoseObservation.JointName) -> CGPoint? {
      guard let b = body, let p = try? b.recognizedPoint(name), p.confidence > 0.3 else { return nil }
      return CGPoint(x: p.location.x * W, y: (1 - p.location.y) * H)
    }

    // Neck line: the lowest of the neck joint and the bottom of a face over the main person.
    let mainFaces = faceBoxes.filter { $0.intersects(main.insetBy(dx: -main.width * 0.1, dy: -main.height * 0.05)) }
    var neckY: CGFloat? = joint(.neck)?.y
    if let chin = mainFaces.map({ $0.maxY }).max() { neckY = max(neckY ?? chin, chin) }
    if neckY == nil, let sh = [joint(.leftShoulder), joint(.rightShoulder)].compactMap({ $0?.y }).min() { neckY = sh }
    // No neck, face or shoulders: we can't be sure the face is gone, so nothing is sent
    // (ruling 10, 02 S3 "Couldn't frame this one. Try again.").
    guard let neck = neckY else { return ["status": "couldNotFrame", "sha256": sha] }
    let top = max(0, neck)
    let feet = [joint(.leftAnkle), joint(.rightAnkle)].compactMap { $0?.y }.max()
    let bottom = min(H, max(main.maxY, (feet ?? 0) + H * 0.04) + H * 0.012)
    guard bottom - top > H * 0.15 else { return ["status": "couldNotFrame", "sha256": sha] }

    // Width: the person box plus a margin, at least 0.42 × the crop height, centered on the body.
    let cx = main.midX
    let width = min(W, max(main.width * 1.3, (bottom - top) * 0.42))
    let left = min(max(0, cx - width / 2), W - width)
    let crop = CGRect(x: left, y: top, width: width, height: bottom - top).integral

    var ci = CIImage(cgImage: image)
    // Pixelate every face box that reaches into the crop (backup for a face above a low neck line).
    var pixelated = 0
    for f in faceBoxes where f.maxY > crop.minY && f.intersects(crop) {
      let r = CGRect(x: f.minX, y: H - f.maxY, width: f.width, height: f.height) // CI origin is bottom-left
      let block = max(f.width, f.height) / 6
      let pix = ci.cropped(to: r).applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: block, kCIInputCenterKey: CIVector(x: r.midX, y: r.midY)]).cropped(to: r)
      ci = pix.composited(over: ci)
      pixelated += 1
    }
    let ciCrop = ci.cropped(to: CGRect(x: crop.minX, y: H - crop.maxY, width: crop.width, height: crop.height))
    let ctx = CIContext()
    guard let cropped = ctx.createCGImage(ciCrop, from: ciCrop.extent) else { return ["status": "couldNotFrame", "sha256": sha] }

    let fm = FileManager.default
    let keepDir = fm.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("photos", isDirectory: true)
    let uploadDir = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("upload", isDirectory: true)
    try fm.createDirectory(at: keepDir, withIntermediateDirectories: true)
    try fm.createDirectory(at: uploadDir, withIntermediateDirectories: true)
    let neckURL = keepDir.appendingPathComponent("\(sha)-neck.jpg")
    let thumbURL = keepDir.appendingPathComponent("\(sha)-thumb.jpg")
    let uploadURL = uploadDir.appendingPathComponent("\(sha).jpg")
    let upload = try writeJPEG(cropped, longEdge: uploadPx, quality: 0.8, to: uploadURL)
    _ = try writeJPEG(cropped, longEdge: keepPx, quality: 0.85, to: neckURL)
    _ = try writeJPEG(cropped, longEdge: thumbPx, quality: 0.8, to: thumbURL)

    // The full-face original is never kept: delete it when it's our temporary copy.
    let tmp = [fm.temporaryDirectory.path, fm.urls(for: .cachesDirectory, in: .userDomainMask)[0].path]
    if url.isFileURL, tmp.contains(where: { url.path.hasPrefix($0) }), !url.path.hasPrefix(uploadDir.path) {
      try? fm.removeItem(at: url)
    }

    let poseKind = feet != nil ? "full" : (joint(.leftHip) ?? joint(.rightHip)) != nil ? "upper" : "none"
    return [
      "status": "ok",
      "sha256": sha,
      "uploadUri": uploadURL.absoluteString,
      "uploadBase64": upload.base64EncodedString(),
      "neckDownUri": neckURL.absoluteString,
      "thumbUri": thumbURL.absoluteString,
      "width": Int(crop.width),
      "height": Int(crop.height),
      "people": max(1, people.count),
      "faceBoxes": pixelated,
      "pose": poseKind,
    ]
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
  static func writeJPEG(_ img: CGImage, longEdge: CGFloat, quality: CGFloat, to url: URL) throws -> Data {
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
    return out as Data
  }
}
