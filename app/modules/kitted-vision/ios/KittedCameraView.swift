// The live camera (05 §P3 B, 02 D5): an AVCaptureSession preview, Apple Vision body pose +
// face boxes about 10 times a second (events to JS that drive the framing guide; there is no
// live face blur, DECISIONS-LOG #54), and a 12 MP still (4:3, JPEG) written to a temporary file
// that photo prep reads and deletes (DECISIONS-LOG #83). Each event also carries the guidance
// measures (#100): brightness, glare, the camera's ISO and exposure, and motion; in scan mode,
// people, clothes labels and a box per piece instead of the body pose. The preview frames are
// analyzed on the phone and never stored or sent.
import AVFoundation
import ExpoModulesCore
import UIKit
import Vision

final class KittedCameraView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate, AVCapturePhotoCaptureDelegate {
  let onGuide = EventDispatcher()
  let onReady = EventDispatcher()
  let onCameraError = EventDispatcher()

  private let session = AVCaptureSession()
  private let preview: AVCaptureVideoPreviewLayer
  private let videoOutput = AVCaptureVideoDataOutput()
  private let photoOutput = AVCapturePhotoOutput()
  private let sessionQueue = DispatchQueue(label: "kitted.camera.session")
  private let visionQueue = DispatchQueue(label: "kitted.camera.vision")
  private var position: AVCaptureDevice.Position = .front
  private var configured = false
  private var lastVision: CFAbsoluteTime = 0
  private var pendingPhoto: Promise?
  private var captureStart: CFAbsoluteTime = 0
  /// The view's width / height, for judging left/right on what he actually sees (aspect fill
  /// crops the 3:4 frame's sides). Set on main in layoutSubviews, read on visionQueue.
  private var viewAspect: CGFloat = 402.0 / 874.0
  /// The longest photo edge we ask for: 12 MP on both cameras. 48 MP is wasted (prep works at 2048).
  static let maxPhotoEdge: Int32 = 4032
  /// false: the front camera's photo is saved in the true view (logos and text read correctly),
  /// while the preview and the guide's frames stay mirrored (founder, DECISIONS-LOG #82.4).
  static let mirrorFrontPhoto = false
  var torchOn = false {
    didSet { sessionQueue.async { self.applyTorch() } }
  }
  /// Scan mode (#100, the "kind" prop): clothes measures instead of the body pose. Read on visionQueue.
  var scanMode = false
  /// The active camera, for its ISO and exposure. Set on sessionQueue, read on visionQueue.
  private var device: AVCaptureDevice?
  private var prevGray: Guide.Gray?
  private var frameN = 0
  /// Scan mode's slower measures (people, labels, pieces), kept between the frames that run them.
  private var lastScan: (people: [Double], clothes: Double?, labels: [String], pieces: [Guide.Piece])?

  required init(appContext: AppContext? = nil) {
    preview = AVCaptureVideoPreviewLayer(session: session)
    super.init(appContext: appContext)
    backgroundColor = .black
    preview.videoGravity = .resizeAspectFill
    layer.addSublayer(preview)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    preview.frame = bounds
    if bounds.height > 0 { viewAspect = bounds.width / bounds.height }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      sessionQueue.async {
        if !self.configured { self.configure() }
        if !self.session.isRunning { self.session.startRunning() }
      }
    } else {
      sessionQueue.async { if self.session.isRunning { self.session.stopRunning() } }
    }
  }

  func setFacing(_ facing: String) {
    let p: AVCaptureDevice.Position = facing == "back" ? .back : .front
    guard p != position else { return }
    position = p
    sessionQueue.async { if self.configured { self.configure() } }
  }

  /// Portrait, upright buffers; the front camera's video mirrored like the preview, so Vision's
  /// coordinates line up with what he sees. `.photo` gives the 4:3 photo format (the whole
  /// outfit, wider than the 16:9 preview crop) and preview-sized video frames for the guide.
  private func configure() {
    session.beginConfiguration()
    for input in session.inputs { session.removeInput(input) }
    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
          let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input)
    else {
      session.commitConfiguration()
      DispatchQueue.main.async { self.onCameraError(["code": "noCamera"]) }
      return
    }
    session.addInput(input)
    self.device = device
    if session.canSetSessionPreset(.photo) { session.sessionPreset = .photo }
    if !configured {
      videoOutput.alwaysDiscardsLateVideoFrames = true
      videoOutput.setSampleBufferDelegate(self, queue: visionQueue)
      if session.canAddOutput(videoOutput) { session.addOutput(videoOutput) }
      if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
      photoOutput.maxPhotoQualityPrioritization = .quality // each shot asks for .balanced
    }
    // A plain JPEG: no Live Photo, depth, ProRAW or deferred delivery.
    if photoOutput.isLivePhotoCaptureSupported { photoOutput.isLivePhotoCaptureEnabled = false }
    if photoOutput.isDepthDataDeliverySupported { photoOutput.isDepthDataDeliveryEnabled = false }
    if photoOutput.isAppleProRAWSupported { photoOutput.isAppleProRAWEnabled = false }
    if photoOutput.isAutoDeferredPhotoDeliverySupported { photoOutput.isAutoDeferredPhotoDeliveryEnabled = false }
    let photoConnection = photoOutput.connection(with: .video)
    for c in [videoOutput.connection(with: .video), photoConnection].compactMap({ $0 }) {
      if c.isVideoRotationAngleSupported(90) { c.videoRotationAngle = 90 }
      if c.isVideoMirroringSupported {
        c.automaticallyAdjustsVideoMirroring = false
        c.isVideoMirrored = position == .front && (c !== photoConnection || Self.mirrorFrontPhoto)
      }
    }
    session.commitConfiguration()
    // Only after the commit is the new device's format active; a size not in its list crashes.
    let sizes = device.activeFormat.supportedMaxPhotoDimensions
    let fits = sizes.filter { max($0.width, $0.height) <= Self.maxPhotoEdge }
    let area = { (d: CMVideoDimensions) in Int(d.width) * Int(d.height) }
    if let pick = fits.max(by: { area($0) < area($1) }) ?? sizes.min(by: { area($0) < area($1) }) {
      photoOutput.maxPhotoDimensions = pick
    }
    configured = true
    applyTorch()
    let photo = photoOutput.maxPhotoDimensions
    let vs = videoOutput.videoSettings ?? [:]
    let frames = [vs[kCVPixelBufferWidthKey as String], vs[kCVPixelBufferHeightKey as String]].map { ($0 as? Int).map(String.init) ?? "?" }
    let thermal: String = switch ProcessInfo.processInfo.thermalState {
    case .nominal: "nominal"
    case .fair: "fair"
    case .serious: "serious"
    case .critical: "critical"
    @unknown default: "unknown"
    }
    let ready: [String: Any] = [
      "facing": position == .front ? "front" : "back",
      "photo": "\(photo.width)×\(photo.height)",
      "photoSizes": sizes.map { "\($0.width)×\($0.height)" },
      "frames": frames.joined(separator: "×"),
      "zsl": photoOutput.isZeroShutterLagEnabled,
      "thermal": thermal,
    ]
    DispatchQueue.main.async {
      if let c = self.preview.connection, c.isVideoRotationAngleSupported(90) { c.videoRotationAngle = 90 }
      self.onReady(ready)
    }
  }

  private func applyTorch() {
    guard let device = (session.inputs.first as? AVCaptureDeviceInput)?.device, device.hasTorch else { return }
    try? device.lockForConfiguration()
    device.torchMode = torchOn && position == .back ? .on : .off
    device.unlockForConfiguration()
  }

  // MARK: Guide (about 10 per second)

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    let now = CFAbsoluteTimeGetCurrent()
    guard now - lastVision >= 0.1, let pb = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    lastVision = now
    frameN += 1
    let W = CGFloat(CVPixelBufferGetWidth(pb)), H = CGFloat(CVPixelBufferGetHeight(pb))

    // Light and motion on every analyzed frame (#100), from a 96 px copy of the luma plane.
    var measures: [String: Any] = [:]
    let gray = Guide.gray(pb)
    if let g = gray {
      let l = Guide.light(g)
      measures["luma"] = l.mean
      measures["clipped"] = l.clipped
      if let p = prevGray, let m = Guide.motion(p, g) { measures["motion"] = m }
    }
    prevGray = gray
    if let d = device {
      measures["iso"] = Double(d.iso)
      measures["maxIso"] = Double(d.activeFormat.maxISO)
      measures["exposure"] = CMTimeGetSeconds(d.exposureDuration)
    }
    if scanMode {
      scanFrame(pb, W, H, measures)
      return
    }

    let pose = VNDetectHumanBodyPoseRequest()
    let faces = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cvPixelBuffer: pb, orientation: .up).perform([pose, faces])

    // Normalized, origin top-left.
    func pt(_ p: VNRecognizedPoint) -> CGPoint { CGPoint(x: p.location.x, y: 1 - p.location.y) }
    let body = (pose.results ?? []).max { ($0.confidence) < ($1.confidence) }
    var joints: [VNHumanBodyPoseObservation.JointName: CGPoint] = [:]
    if let body, let all = try? body.recognizedPoints(.all) {
      for (name, p) in all where p.confidence > 0.3 { joints[name] = pt(p) }
    }
    let shoulders = [joints[.leftShoulder], joints[.rightShoulder]].compactMap { $0 }
    let hips = [joints[.leftHip], joints[.rightHip]].compactMap { $0 }
    let ankles = [joints[.leftAnkle], joints[.rightAnkle]].compactMap { $0 }
    let core = shoulders + hips
    let cx = core.isEmpty ? 0.5 : core.map(\.x).reduce(0, +) / CGFloat(core.count)
    // Left/right is judged on screen: aspect fill shows only the middle `shown` share of the
    // 3:4 frame's width (about 61% on an iPhone 17 Pro).
    let shown = min(1, viewAspect / (W / H))
    let sx = (cx - (1 - shown) / 2) / shown

    let state: String
    if shoulders.isEmpty { state = "noPerson" }
    else if hips.isEmpty { state = "tooClose" }
    else if sx < 0.3 { state = "moveRight" }
    else if sx > 0.7 { state = "moveLeft" }
    else if ankles.count == 2 { state = "goodFull" }
    else { state = "good" }

    var bodyBox: CGRect?
    if !joints.isEmpty {
      let xs = joints.values.map(\.x), ys = joints.values.map(\.y)
      let w = xs.max()! - xs.min()!, h = ys.max()! - ys.min()!
      bodyBox = CGRect(x: xs.min()!, y: ys.min()!, width: w, height: h).insetBy(dx: -w * 0.25 - 0.02, dy: -h * 0.06 - 0.02)
      // His height in the frame (shoulders to ankles; "too far" below about 30%), and his own
      // brightness (a window behind him makes the frame bright and him dark).
      if !shoulders.isEmpty, !hips.isEmpty { measures["bodyShare"] = Double(h) }
      if let g = gray, let b = bodyBox { measures["subjectLuma"] = Guide.light(g, in: b).mean }
    }
    let faceBoxes = (faces.results ?? []).map {
      CGRect(x: $0.boundingBox.minX, y: 1 - $0.boundingBox.maxY, width: $0.boundingBox.width, height: $0.boundingBox.height)
    }

    DispatchQueue.main.async {
      let view = self.viewMapper(W, H)
      var payload: [String: Any] = measures
      payload["state"] = state
      payload["faces"] = faceBoxes.map(view)
      if let b = bodyBox { payload["body"] = view(b) }
      self.onGuide(payload)
    }
  }

  /// Scan mode: people + faces and the piece boxes about 3 times a second, the clothes label once
  /// a second; light and motion on every event.
  private func scanFrame(_ pb: CVPixelBuffer, _ W: CGFloat, _ H: CGFloat, _ measures: [String: Any]) {
    let heavy = frameN % 3 == 0, classify = frameN % 10 == 1
    var faceBoxes: [CGRect] = []
    if heavy || classify {
      let r = Guide.scanVision(handler: VNImageRequestHandler(cvPixelBuffer: pb, orientation: .up), classify: classify, instances: heavy)
      let people = (r["people"] as? [[String: Double]] ?? []).map { ($0["width"] ?? 0) * ($0["height"] ?? 0) }
      faceBoxes = (r["faces"] as? [[String: Double]] ?? []).map { CGRect(x: $0["x"] ?? 0, y: $0["y"] ?? 0, width: $0["width"] ?? 0, height: $0["height"] ?? 0) }
      var next = lastScan ?? (people: [], clothes: nil, labels: [], pieces: [])
      next.people = people
      if classify {
        next.clothes = r["clothes"] as? Double
        next.labels = r["labels"] as? [String] ?? []
      }
      if heavy, let ps = r["pieceObjects"] as? [Guide.Piece] { next.pieces = ps }
      // Pieces are only known after the first heavy frame; until then the tip says "Looking…".
      if heavy || lastScan != nil { lastScan = next }
    }
    let scan = lastScan
    DispatchQueue.main.async {
      let view = self.viewMapper(W, H)
      var payload: [String: Any] = measures
      payload["state"] = "noPerson"
      payload["faces"] = faceBoxes.map(view)
      if let s = scan {
        var d: [String: Any] = [
          "people": s.people, "labels": s.labels,
          "pieces": s.pieces.map { ["box": view($0.box), "share": $0.share, "edge": $0.edge] as [String: Any] },
        ]
        if let c = s.clothes { d["clothes"] = c }
        payload["scan"] = d
      }
      self.onGuide(payload)
    }
  }

  /// Normalized buffer box → view points under aspect fill. Call on main (reads bounds).
  private func viewMapper(_ W: CGFloat, _ H: CGFloat) -> (CGRect) -> [String: CGFloat] {
    let vw = bounds.width, vh = bounds.height
    let s = max(vw / W, vh / H)
    let dx = (W * s - vw) / 2, dy = (H * s - vh) / 2
    return { r in ["x": r.minX * W * s - dx, "y": r.minY * H * s - dy, "width": r.width * W * s, "height": r.height * H * s] }
  }

  // MARK: Capture

  func takePhoto(_ promise: Promise) {
    sessionQueue.async {
      guard self.session.isRunning, self.pendingPhoto == nil else {
        promise.reject("E_CAMERA", "The camera isn't ready")
        return
      }
      self.pendingPhoto = promise
      let settings = self.photoOutput.availablePhotoCodecTypes.contains(.jpeg)
        ? AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
        : AVCapturePhotoSettings()
      settings.maxPhotoDimensions = self.photoOutput.maxPhotoDimensions
      settings.photoQualityPrioritization = .balanced // .quality's extra fusion time isn't worth it here
      settings.flashMode = .off // the front "flash" is the white screen (JS); the rear uses the torch
      self.captureStart = CFAbsoluteTimeGetCurrent()
      self.photoOutput.capturePhoto(with: settings, delegate: self)
    }
  }

  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    let promise = pendingPhoto
    pendingPhoto = nil
    guard error == nil, let data = photo.fileDataRepresentation() else {
      promise?.reject("E_CAPTURE", error?.localizedDescription ?? "No photo data")
      return
    }
    let ms = Int(((CFAbsoluteTimeGetCurrent() - captureStart) * 1000).rounded())
    // photoDimensions are in sensor orientation (landscape); the file is upright via its EXIF tag.
    let d = photo.resolvedSettings.photoDimensions
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("kitted-capture-\(UUID().uuidString).jpg")
    do {
      try data.write(to: url, options: .atomic)
      promise?.resolve([
        "uri": url.absoluteString,
        "width": Int(min(d.width, d.height)), "height": Int(max(d.width, d.height)),
        "bytes": data.count, "ms": ms,
      ] as [String: Any])
    } catch {
      promise?.reject("E_CAPTURE", error.localizedDescription)
    }
  }
}
