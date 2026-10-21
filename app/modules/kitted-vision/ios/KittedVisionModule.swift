// kitted-vision: the Expo module. Photo prep (KittedPrep.swift: faces hidden, metadata
// stripped), the after-shot check (KittedGuide.swift, DECISIONS-LOG #100), the live camera view
// (KittedCameraView.swift) and on-device dictation (KittedDictation.swift).
import AVFoundation
import ExpoModulesCore

public class KittedVisionModule: Module {
  private var dictation: KittedDictation?

  private func dictationEngine() -> KittedDictation {
    if let d = dictation { return d }
    let d = KittedDictation { [weak self] event in
      switch event {
      case let .text(text, isFinal): self?.sendEvent("onDictation", ["type": "text", "text": text, "final": isFinal])
      case let .level(level): self?.sendEvent("onDictation", ["type": "level", "level": level])
      case let .ended(error): self?.sendEvent("onDictation", ["type": "end", "error": error as Any])
      case let .log(line): self?.sendEvent("onDictation", ["type": "log", "line": line])
      }
    }
    dictation = d
    return d
  }

  public func definition() -> ModuleDefinition {
    Name("KittedVision")

    AsyncFunction("prepare") { (uri: String) -> [String: Any] in
      return try Prep.run(uri: uri)
    }

    /// "Which one is you?" (02 S23): the same prep with the person he tapped ([x, y, w, h], 0–1, origin top-left);
    /// everyone else is covered in every copy sent.
    AsyncFunction("preparePerson") { (uri: String, pick: [Double]) -> [String: Any] in
      return try Prep.run(uri: uri, pick: pick)
    }

    /// A snap that finishes a partial check (#313): his shoes, or his pants and shoes looked down at. Prepared like a
    /// fit photo (kept, uploaded at 1024, faces hidden) but no person is needed and no close-ups are cut.
    AsyncFunction("prepareSnap") { (uri: String) -> [String: Any] in
      return try Prep.run(uri: uri, kind: .snap)
    }

    /// A clothes scan (#88, #100): no person needed; any face is still hidden.
    AsyncFunction("prepareItems") { (uri: String) -> [String: Any] in
      return try Prep.run(uri: uri, kind: .items)
    }

    /// The quick check after a shot or a library pick: measures only (#100).
    // On-device measuring after the closet call (KittedMeasure.swift, DECISIONS-LOG #104).
    AsyncFunction("measureGarments") { (keptUri: String, detailUri: String, sha: String, garments: [[String: Any]], mirrored: Bool?) -> [String: Any] in
      return try Measure.run(keptUri: keptUri, detailUri: detailUri, sha: sha, garments: garments, mirrored: mirrored ?? false)
    }

    AsyncFunction("printDistance") { (a: String, b: String) -> Double? in
      return Measure.printDistance(a, b)
    }

    AsyncFunction("assess") { (uri: String, kind: String) -> [String: Any] in
      return try Guide.assess(uri: uri, kind: kind)
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
      Prop("kind") { (view: KittedCameraView, kind: String) in view.scanMode = kind == "scan" }
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
      try await self.dictationEngine().start(contextWords: [])
    }

    // Round 2 (#302): the closet's piece names as context words, the final words handed back on stop, and the
    // speech model installed ahead of time. New names, so an older JS bundle and an older build keep working.
    AsyncFunction("startDictationWith") { (words: [String]) async throws in
      try await self.dictationEngine().start(contextWords: words)
    }

    AsyncFunction("stopDictation") { () async in
      _ = await self.dictation?.stop()
    }

    AsyncFunction("stopDictationText") { () async -> String in
      await self.dictation?.stop() ?? ""
    }

    AsyncFunction("prepareDictation") { () async -> String in
      await KittedDictation.prepare()
    }

    /// "Try again" after a failed read: the upload copy from the first prep (Caches/upload).
    AsyncFunction("reloadUpload") { (sha256: String) -> String? in
      let url = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("upload", isDirectory: true).appendingPathComponent("\(sha256).jpg")
      return (try? Data(contentsOf: url))?.base64EncodedString()
    }

    /// "Try again": the close-ups from the first prep (#104), in order; empty when they're gone.
    AsyncFunction("reloadZoom") { (sha256: String) -> [String] in
      return Prep.reloadZoom(sha: sha256)
    }
  }
}

