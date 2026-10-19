// Prints an SVG path (y down, baseline at `ascent`) for a string set in a TTF, with letter spacing in em.
import CoreText
import Foundation
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1]) as CFURL
let text = args[2]
let size = CGFloat(Double(args[3]) ?? 100)
let tracking = CGFloat(Double(args.count > 4 ? args[4] : "0") ?? 0)
let descs = CTFontManagerCreateFontDescriptorsFromURL(url) as! [CTFontDescriptor]
let font = CTFontCreateWithFontDescriptor(descs[0], size, nil)
let ascent = CTFontGetAscent(font), descent = CTFontGetDescent(font)
var chars = Array(text.utf16)
var glyphs = [CGGlyph](repeating: 0, count: chars.count)
CTFontGetGlyphsForCharacters(font, &chars, &glyphs, chars.count)
var advances = [CGSize](repeating: .zero, count: glyphs.count)
CTFontGetAdvancesForGlyphs(font, .horizontal, glyphs, &advances, glyphs.count)
var d = ""
var x: CGFloat = 0
func f(_ v: CGFloat) -> String { String(format: "%.1f", Double(v)).replacingOccurrences(of: ".0", with: "") }
for (i, g) in glyphs.enumerated() {
  if let p = CTFontCreatePathForGlyph(font, g, nil) {
    p.applyWithBlock { el in
      let e = el.pointee
      let pt = { (k: Int) -> String in let q = e.points[k]; return "\(f(q.x + x)) \(f(ascent - q.y))" }
      switch e.type {
      case .moveToPoint: d += "M\(pt(0))"
      case .addLineToPoint: d += "L\(pt(0))"
      case .addQuadCurveToPoint: d += "Q\(pt(0)) \(pt(1))"
      case .addCurveToPoint: d += "C\(pt(0)) \(pt(1)) \(pt(2))"
      case .closeSubpath: d += "Z"
      @unknown default: break
      }
    }
  }
  x += advances[i].width + (i < glyphs.count - 1 ? tracking * size : 0)
}
print("{\"width\":\(f(x)),\"height\":\(f(ascent + descent)),\"ascent\":\(f(ascent)),\"d\":\"\(d)\"}")
