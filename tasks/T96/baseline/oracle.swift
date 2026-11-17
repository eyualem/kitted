// oracle <photo>...: a thorough face/person hunt on the original (decoded like Prep, 2048 long edge):
// Vision faces on the whole image and on overlapping 2x2 and 3x3 tiles, human rectangles likewise.
// One JSON line per photo; boxes in pixels, origin top-left.
import CoreImage
import Foundation
import Vision

func run(_ img: CGImage, crop: CGRect) -> (faces: [[Double]], humans: [[Double]]) {
  guard let tile = img.cropping(to: crop) else { return ([], []) }
  let f = VNDetectFaceRectanglesRequest()
  let h = VNDetectHumanRectanglesRequest(); h.upperBodyOnly = true
  let handler = VNImageRequestHandler(cgImage: tile, orientation: .up)
  try? handler.perform([f]); try? handler.perform([h])
  func px(_ r: CGRect) -> CGRect { CGRect(x: crop.minX + r.minX * crop.width, y: crop.minY + (1 - r.maxY) * crop.height, width: r.width * crop.width, height: r.height * crop.height) }
  let fs = (f.results ?? []).map { o -> [Double] in let r = px(o.boundingBox); return [r.minX, r.minY, r.width, r.height, Double(o.confidence)].map { Double($0) } }
  let hs = (h.results ?? []).filter { $0.confidence > 0.2 }.map { o -> [Double] in let r = px(o.boundingBox); return [r.minX, r.minY, r.width, r.height, Double(o.confidence)].map { Double($0) } }
  return (fs, hs)
}
for path in CommandLine.arguments.dropFirst() {
  autoreleasepool {
    guard let d = FileManager.default.contents(atPath: path), let img = Prep.decode(d, maxPx: Prep.workPx).image else { print("{\"photo\":\"\(path)\",\"error\":1}"); return }
    let W = CGFloat(img.width), H = CGFloat(img.height)
    var faces: [[Double]] = [], humans: [[Double]] = []
    for n in [1, 2, 3] {
      let tw = W / (CGFloat(n) * 0.75 + 0.25), th = H / (CGFloat(n) * 0.75 + 0.25)
      for i in 0..<n { for j in 0..<n {
        let c = CGRect(x: CGFloat(i) * tw * 0.75, y: CGFloat(j) * th * 0.75, width: tw, height: th).integral.intersection(CGRect(x: 0, y: 0, width: W, height: H))
        let r = run(img, crop: c); faces += r.faces.map { $0 + [Double(n)] }; humans += r.humans.map { $0 + [Double(n)] }
      } }
    }
    let o: [String: Any] = ["photo": path, "size": [img.width, img.height], "faces": faces, "humans": humans]
    print(String(data: try! JSONSerialization.data(withJSONObject: o), encoding: .utf8)!)
  }
}
