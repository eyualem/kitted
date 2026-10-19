// Counts faces in images with Apple Vision (handoff/14-share-card.md §5, check M5): a share card saved "Neck down"
// must have none. usage: swift tools/share/faces.swift <image> [<image> …]   prints "<faces>\t<file>" per image.
import AppKit
import Vision

var failed = false
for path in CommandLine.arguments.dropFirst() {
  guard let image = NSImage(contentsOfFile: path), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("ERR\t\(path)")
    failed = true
    continue
  }
  let request = VNDetectFaceRectanglesRequest()
  do {
    try VNImageRequestHandler(cgImage: cg).perform([request])
    print("\(request.results?.count ?? 0)\t\(path)")
  } catch {
    print("ERR\t\(path)\t\(error)")
    failed = true
  }
}
exit(failed ? 1 : 0)
