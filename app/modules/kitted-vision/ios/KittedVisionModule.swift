// kitted-vision: on-device photo prep (05 S16, 03 §8). DEMO STUB: returns "notImplemented".
// P8 fills it in with Apple Vision: body pose → neck-down crop, face rectangles → pixelation,
// person count, ImageIO re-encode (metadata stripped), SHA-256 of the original bytes.
import ExpoModulesCore

public class KittedVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KittedVision")

    AsyncFunction("prepare") { (_ uri: String) -> [String: Any] in
      return ["status": "notImplemented"]
    }
  }
}
