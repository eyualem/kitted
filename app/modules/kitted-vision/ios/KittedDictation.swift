// Voice input for the Stylist composer (founder, Oct 8; DECISIONS-LOG #70). Apple's on-device
// SpeechAnalyzer + DictationTranscriber (iOS 26): the audio never leaves the phone, there's no
// new package, and the transcript only goes anywhere when he taps send.
//
// Flow: AVAudioEngine mic tap → converted to the analyzer's format → AnalyzerInput stream.
// Results stream back as volatile (in-progress) and final text; the JS side shows them live and
// drops the whole text into the field on stop. Never auto-sent.
//
// Round 2 (#302, handoff/07-stylist-chat.md §15.3), the fixes for "voice doesn't really work":
//   - stop() waits for the analyzer's last result (capped at 1.5 s) and returns the words, so tapping
//     stop right after talking no longer loses the end of the sentence (or all of it);
//   - the speech model is installed ahead of time (prepare(), when the composer opens), not inside
//     start() with no feedback, and isSupported() no longer needs the model to be there already;
//   - the audio session is set up before the analyzer starts, in .default mode (.measurement turned
//     off the mic's voice processing);
//   - his closet's piece names and a clothing word list go in as context words;
//   - every stage is reported as a log event ([mic] lines in Metro and Documents/logs/mic.log).
import AVFoundation
import Speech

final class KittedDictation {
  enum Event {
    case text(String, isFinal: Bool)
    case level(Float)
    case ended(String?)
    case log(String)
  }

  private var engine: AVAudioEngine?
  private var analyzer: SpeechAnalyzer?
  private var input: AsyncStream<AnalyzerInput>.Continuation?
  private var results: Task<Void, Never>?
  private var finalized = ""
  private var volatile = ""
  private var startedAt = Date()
  private var firstBuffer = false
  private var firstWords = false
  private let emit: (Event) -> Void

  /// Clothing words the general model mishears ("chinos" as "keen-oes"); added to his own piece names.
  static let clothingWords = [
    "chinos", "overshirt", "chore coat", "Chelsea boots", "chukkas", "loafers", "derbies", "oxford", "crewneck",
    "quarter-zip", "cardigan", "bomber", "trucker jacket", "selvedge", "raw denim", "cargos", "joggers", "inseam",
    "cuff", "hem", "tuck", "boxy", "relaxed fit", "straight leg", "wide leg", "fit check",
  ]

  init(emit: @escaping (Event) -> Void) {
    self.emit = emit
  }

  static func requestMicrophone() async -> Bool {
    await AVAudioApplication.requestRecordPermission()
  }

  private func log(_ line: String) { emit(.log(line)) }
  private var ms: Int { Int(Date().timeIntervalSince(startedAt) * 1000) }

  func start(contextWords: [String]) async throws {
    _ = await stop(silently: true)
    finalized = ""
    volatile = ""
    firstBuffer = false
    firstWords = false
    startedAt = Date()
    try await startAnalyzer(contextWords: contextWords)
  }

  /// Whether this phone has an on-device dictation model for his language (installed or installable). We never fall
  /// back to SFSpeechRecognizer: its system prompt says speech is sent to Apple, which breaks our promise that his
  /// voice stays on the phone (DECISIONS-LOG #70).
  static func isSupported() async -> Bool {
    await DictationTranscriber.supportedLocale(equivalentTo: Locale.current) != nil
  }

  /// Installs the speech model if it's missing. "ready", "needsNetwork" (the download failed) or "unsupported".
  static func prepare() async -> String {
    guard let locale = await DictationTranscriber.supportedLocale(equivalentTo: Locale.current) else { return "unsupported" }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    do {
      if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
        try await request.downloadAndInstall()
      }
      return "ready"
    } catch {
      return "needsNetwork"
    }
  }

  private func startAnalyzer(contextWords: [String]) async throws {
    guard let locale = await DictationTranscriber.supportedLocale(equivalentTo: Locale.current) else {
      throw NSError(domain: "KittedDictation", code: 3, userInfo: [NSLocalizedDescriptionKey: "No dictation model for this language"])
    }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    // Normally installed already by prepare(); this covers a first tap that beat it.
    if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
      log("model · installing")
      try await request.downloadAndInstall()
      log("model · installed +\(ms) ms")
    }
    let analyzer = SpeechAnalyzer(modules: [transcriber])
    guard let format = await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [transcriber]) else {
      throw NSError(domain: "KittedDictation", code: 1, userInfo: [NSLocalizedDescriptionKey: "No audio format for dictation"])
    }
    let words = Array(Set(contextWords + Self.clothingWords)).prefix(120)
    let context = AnalysisContext()
    context.contextualStrings[.general] = Array(words)
    do {
      try await analyzer.setContext(context)
      log("context · \(words.count) words")
    } catch {
      log("context · not set: \(error.localizedDescription)")
    }

    // The session first: the mic's format is only real once the session is active.
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .default, options: [.duckOthers, .defaultToSpeaker, .allowBluetoothHFP])
    try session.setActive(true, options: .notifyOthersOnDeactivation)
    log("audio · \(session.currentRoute.inputs.first?.portType.rawValue ?? "no input") · \(Int(session.sampleRate)) Hz")

    let (stream, continuation) = AsyncStream<AnalyzerInput>.makeStream()
    self.analyzer = analyzer
    self.input = continuation

    results = Task { [weak self] in
      do {
        for try await result in transcriber.results {
          guard let self else { return }
          let text = String(result.text.characters)
          if !self.firstWords && !text.trimmingCharacters(in: .whitespaces).isEmpty {
            self.firstWords = true
            self.log("first words +\(self.ms) ms")
          }
          if result.isFinal {
            self.finalized += text
            self.volatile = ""
            self.emit(.text(self.finalized, isFinal: true))
          } else {
            self.volatile = text
            self.emit(.text(self.finalized + text, isFinal: false))
          }
        }
      } catch {
        self?.log("results · error: \(error.localizedDescription)")
        self?.emit(.ended(error.localizedDescription))
      }
    }
    try await analyzer.start(inputSequence: stream)

    let engine = AVAudioEngine()
    let mic = engine.inputNode
    let micFormat = mic.outputFormat(forBus: 0)
    guard micFormat.sampleRate > 0, let converter = AVAudioConverter(from: micFormat, to: format) else {
      throw NSError(domain: "KittedDictation", code: 2, userInfo: [NSLocalizedDescriptionKey: "Can't convert the microphone audio"])
    }
    mic.installTap(onBus: 0, bufferSize: 2048, format: micFormat) { [weak self] buffer, _ in
      guard let self else { return }
      if !self.firstBuffer {
        self.firstBuffer = true
        self.log("first audio +\(self.ms) ms")
      }
      self.emit(.level(Self.level(of: buffer)))
      // Without converting to bestAvailableAudioFormat the analyzer fails silently.
      if let converted = Self.convert(buffer, with: converter, to: format) {
        continuation.yield(AnalyzerInput(buffer: converted))
      }
    }
    engine.prepare()
    try engine.start()
    self.engine = engine
    log("listening +\(ms) ms")
  }

  /// Stops listening and returns every word heard, after the analyzer's last result (capped at 1.5 s).
  @discardableResult
  func stop(silently: Bool = false) async -> String {
    let wasRunning = engine != nil
    engine?.inputNode.removeTap(onBus: 0)
    engine?.stop()
    engine = nil
    input?.finish()
    input = nil
    if let analyzer {
      try? await analyzer.finalizeAndFinishThroughEndOfInput()
    }
    // The last final result can land after finalize returns: wait for the results to end, briefly.
    if let task = results {
      let done = await withTaskGroup(of: Bool.self) { group -> Bool in
        group.addTask { await task.value; return true }
        group.addTask { try? await Task.sleep(nanoseconds: 1_500_000_000); return false }
        let first = await group.next() ?? false
        group.cancelAll()
        return first
      }
      if !done { log("stop · results still open after 1.5 s") }
    }
    analyzer = nil
    results = nil
    let heard = (finalized + volatile).trimmingCharacters(in: .whitespacesAndNewlines)
    // Let the camera's spoken 3-2-1 (expo-speech) and any music come back.
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    if wasRunning {
      log("stopped +\(ms) ms · \(heard.split(separator: " ").count) words")
      if !silently { emit(.ended(nil)) }
    }
    return heard
  }

  private static func convert(_ buffer: AVAudioPCMBuffer, with converter: AVAudioConverter, to format: AVAudioFormat) -> AVAudioPCMBuffer? {
    let ratio = format.sampleRate / buffer.format.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1
    guard let out = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else { return nil }
    var error: NSError?
    var fed = false
    converter.convert(to: out, error: &error) { _, status in
      if fed {
        status.pointee = .noDataNow
        return nil
      }
      fed = true
      status.pointee = .haveData
      return buffer
    }
    return error == nil && out.frameLength > 0 ? out : nil
  }

  /// 0…1 loudness for the waveform (RMS of the first channel, gently scaled).
  private static func level(of buffer: AVAudioPCMBuffer) -> Float {
    guard let data = buffer.floatChannelData?[0], buffer.frameLength > 0 else { return 0 }
    var sum: Float = 0
    for i in 0..<Int(buffer.frameLength) { sum += data[i] * data[i] }
    let rms = sqrt(sum / Float(buffer.frameLength))
    return min(1, rms * 12)
  }
}
