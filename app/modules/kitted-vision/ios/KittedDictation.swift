// Voice input for the Stylist composer (founder, Oct 8; DECISIONS-LOG #70). Apple's on-device
// SpeechAnalyzer + DictationTranscriber (iOS 26): the audio never leaves the phone, there's no
// new package, and the transcript only goes anywhere when he taps send.
//
// Flow: AVAudioEngine mic tap → converted to the analyzer's format → AnalyzerInput stream.
// Results stream back as volatile (in-progress) and final text; the JS side shows them live and
// drops the whole text into the field on stop. Never auto-sent.
import AVFoundation
import Speech

final class KittedDictation {
  enum Event {
    case text(String, isFinal: Bool)
    case level(Float)
    case ended(String?)
  }

  private var engine: AVAudioEngine?
  private var analyzer: SpeechAnalyzer?
  private var input: AsyncStream<AnalyzerInput>.Continuation?
  private var results: Task<Void, Never>?
  private var finalized = ""
  private let emit: (Event) -> Void

  init(emit: @escaping (Event) -> Void) {
    self.emit = emit
  }

  static func requestMicrophone() async -> Bool {
    await AVAudioApplication.requestRecordPermission()
  }

  func start() async throws {
    await stop(silently: true)
    finalized = ""
    try await startAnalyzer()
  }

  /// Whether this phone has an on-device dictation model for his language. We never fall back to
  /// SFSpeechRecognizer: its system prompt says speech is sent to Apple, which breaks our promise
  /// that his voice stays on the phone (DECISIONS-LOG #70).
  static func isSupported() async -> Bool {
    guard let locale = await DictationTranscriber.supportedLocale(equivalentTo: Locale.current) else { return false }
    let probe = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    return await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [probe]) != nil
  }

  private func startAnalyzer() async throws {
    guard let locale = await DictationTranscriber.supportedLocale(equivalentTo: Locale.current) else {
      throw NSError(domain: "KittedDictation", code: 3, userInfo: [NSLocalizedDescriptionKey: "No dictation model for this language"])
    }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    // The language model is downloaded on first use (needs a connection once).
    if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
      try await request.downloadAndInstall()
    }
    let analyzer = SpeechAnalyzer(modules: [transcriber])
    guard let format = await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [transcriber]) else {
      throw NSError(domain: "KittedDictation", code: 1, userInfo: [NSLocalizedDescriptionKey: "No audio format for dictation"])
    }
    let (stream, continuation) = AsyncStream<AnalyzerInput>.makeStream()
    self.analyzer = analyzer
    self.input = continuation

    results = Task { [weak self] in
      do {
        for try await result in transcriber.results {
          guard let self else { return }
          let text = String(result.text.characters)
          if result.isFinal {
            self.finalized += text
            self.emit(.text(self.finalized, isFinal: true))
          } else {
            self.emit(.text(self.finalized + text, isFinal: false))
          }
        }
      } catch {
        self?.emit(.ended(error.localizedDescription))
      }
    }
    try await analyzer.start(inputSequence: stream)

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let engine = AVAudioEngine()
    let mic = engine.inputNode
    let micFormat = mic.outputFormat(forBus: 0)
    guard let converter = AVAudioConverter(from: micFormat, to: format) else {
      throw NSError(domain: "KittedDictation", code: 2, userInfo: [NSLocalizedDescriptionKey: "Can't convert the microphone audio"])
    }
    mic.installTap(onBus: 0, bufferSize: 2048, format: micFormat) { [weak self] buffer, _ in
      guard let self else { return }
      self.emit(.level(Self.level(of: buffer)))
      // Without converting to bestAvailableAudioFormat the analyzer fails silently.
      if let converted = Self.convert(buffer, with: converter, to: format) {
        continuation.yield(AnalyzerInput(buffer: converted))
      }
    }
    engine.prepare()
    try engine.start()
    self.engine = engine
  }

  /// Stops listening; the last final text has already been sent as an event.
  func stop(silently: Bool = false) async {
    let wasRunning = engine != nil
    engine?.inputNode.removeTap(onBus: 0)
    engine?.stop()
    engine = nil
    input?.finish()
    input = nil
    if let analyzer {
      try? await analyzer.finalizeAndFinishThroughEndOfInput()
    }
    analyzer = nil
    results = nil
    // Let the camera's spoken 3-2-1 (expo-speech) and any music come back.
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    if wasRunning && !silently { emit(.ended(nil)) }
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
