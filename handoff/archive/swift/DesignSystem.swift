//  DesignSystem.swift
//  Kitted — design tokens and core components (iOS 26+, SwiftUI, no dependencies).
//
//  Source of truth: /Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html
//  Spec:            /Users/eyu/Desktop/files/Kitted/handoff/03-design-system.md
//
//  Drop this file into the app target's DesignSystem/ group. It compiles without the
//  Archivo font (it falls back to SF Pro with a condensed/expanded width), so you can
//  build before the font is bundled. See §3.4 of the .md for bundling Archivo.

import SwiftUI
import UIKit
import CoreText

// MARK: - Color tokens

extension Color {
    /// Builds an asset-free dynamic color. `highContrast*` is used when the user turns on
    /// Settings › Accessibility › Display & Text Size › Increase Contrast.
    init(light: UInt32, dark: UInt32,
         lightAlpha: CGFloat = 1, darkAlpha: CGFloat = 1,
         highContrastLight: UInt32? = nil, highContrastDark: UInt32? = nil) {
        self.init(uiColor: UIColor { traits in
            let isDark = traits.userInterfaceStyle == .dark
            let high = traits.accessibilityContrast == .high
            let hex: UInt32
            if isDark { hex = (high ? highContrastDark : nil) ?? dark }
            else { hex = (high ? highContrastLight : nil) ?? light }
            return UIColor(hex: hex, alpha: isDark ? darkAlpha : lightAlpha)
        })
    }

    /// A color that is the same in light and dark (the always-dark "fixed" palette).
    init(fixed hex: UInt32, alpha: CGFloat = 1) {
        self.init(uiColor: UIColor(hex: hex, alpha: alpha))
    }

    // Surfaces
    static let kBg        = Color(light: 0xF3F4F6, dark: 0x0C0E14)   // "Chalk" / "Night": screen background
    static let kSurface   = Color(light: 0xFFFFFF, dark: 0x171A23)   // cards, sheets, chips, composer field
    static let kSurface2  = Color(light: 0xECEEF1, dark: 0x21252F)   // secondary buttons, tiles, steppers, bar tracks

    // Ink (text and glyphs)
    static let kInk       = Color(light: 0x121628, dark: 0xECEEF3)   // "Indigo ink": primary text, score numeral
    static let kInk2      = Color(light: 0x585E70, dark: 0xA1A7B5)   // secondary text
    /// Tertiary text. FIXED from the mockup (#848A99 / #6E7484 failed 4.5:1). Text-safe on every surface.
    static let kInk3      = Color(light: 0x646A7A, dark: 0x9096A5,
                                  highContrastLight: 0x585E70, highContrastDark: 0xA1A7B5)
    /// The mockup's original tertiary. DECORATION ONLY (seams, ghost-tile dashes, disabled glyphs). Never text.
    static let kInkFaint  = Color(light: 0x848A99, dark: 0x6E7484)
    static let kLine      = Color(light: 0xE0E3E8, dark: 0x2A2F3B,
                                  highContrastLight: 0xB9BEC8, highContrastDark: 0x474D5C) // hairlines, borders

    // The one accent: copper rivet
    static let kAccent     = Color(light: 0x9C5326, dark: 0xDE9762)
    /// Accent tint behind accent text. Light alpha lowered .11 → .09 so copper text on it passes 4.5:1 on kBg.
    static let kAccentSoft = Color(light: 0x9C5326, dark: 0xDE9762, lightAlpha: 0.09, darkAlpha: 0.15)

    // Actions
    static let kPrimary    = Color(light: 0x121628, dark: 0xECEEF3)  // primary button fill, camera circle
    static let kOnPrimary  = Color(light: 0xFFFFFF, dark: 0x0C0E14)  // text/icons on kPrimary and on kAccent

    // Chat bubble ("me")
    static let kMe         = Color(light: 0x1B2340, dark: 0x2A3150)
    static let kOnMe       = Color(light: 0xF2F3F7, dark: 0xEEF0F6)

    // Semantic (always paired with an icon or a sign; never color alone)
    static let kGood       = Color(light: 0x2B7651, dark: 0x5DC08F)  // "Credit": ledger +, "Closet updated", camera OK
    static let kCaution    = Color(light: 0x8A5A00, dark: 0xE2B356)  // warnings with exclamationmark.triangle only

    // Scrim behind sheets
    static let kDim        = Color(light: 0x0A0C14, dark: 0x000000, lightAlpha: 0.42, darkAlpha: 0.55)

    // Always-dark palette (camera, lock-screen previews, share card) — identical in both modes
    static let kFixedNight      = Color(fixed: 0x08090D)            // share screen background
    static let kFixedIndigo     = Color(fixed: 0x121628)            // share band, ink on white camera pills
    static let kFixedLabel      = Color(fixed: 0x1B2340)            // woven label, stylist avatar, app icon
    static let kFixedOnDark     = Color(fixed: 0xEEF0F5)            // woven label text
    static let kFixedCopper     = Color(fixed: 0xDE9762)            // copper on dark (share band delta, seams on dark)
    static let kFixedPhotoTag   = Color(fixed: 0x0E111C, alpha: 0.80) // solid-enough backing for text on photos
    static let kFixedPhotoTagDimText = Color(fixed: 0xC3C7D2)       // "Shoes…" pending tag text
    static let kFixedLightPill  = Color(fixed: 0xFFFFFF, alpha: 0.92) // camtip / "Only this is sent"
    static let kFixedGood       = Color(fixed: 0x2B7651)            // check icon on the white camera pill
}

extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255,
                  green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255,
                  alpha: alpha)
    }
}

// MARK: - Spacing, radii, sizes

nonisolated enum KSpace {
    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let s: CGFloat = 8
    static let m: CGFloat = 12
    static let l: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32

    static let gutter: CGFloat = 16          // screen side margin (thread, tabs, sheets)
    static let heroGutter: CGFloat = 24      // welcome + paywall
    static let cardPadH: CGFloat = 16        // .card-pad 14px 16px
    static let cardPadV: CGFloat = 14
    static let stack: CGFloat = 12           // between cards / thread items
    static let rowGap: CGFloat = 8           // between chips, buttons
}

nonisolated enum KRadius {
    static let card: CGFloat = 26            // .card
    static let cardSmall: CGFloat = 20       // floating mini card, plan rows, "today" row, read list frame
    static let tile: CGFloat = 18            // closet/outfit tiles, quick-start cards, share card
    static let thumb: CGFloat = 12           // 44–50 pt thumbs (.rt, .lr-ph, .pk)
    static let look: CGFloat = 13            // onboarding look photos
    static let calendarDay: CGFloat = 10
    static let bubble: CGFloat = 24          // .me bubble
    static let bubbleTail: CGFloat = 6       // the corner nearest the sender
    static let label: CGFloat = 2            // woven label
    // Buttons, chips, pills, fields and the composer are capsules: use Capsule(style: .continuous).
}

nonisolated enum KSize {
    static let hit: CGFloat = 44             // minimum hit area, always
    static let buttonLarge: CGFloat = 50     // .btn.lg
    static let button: CGFloat = 36          // .btn (hit area padded to 44)
    static let chip: CGFloat = 34            // .chip, .qc
    static let pill: CGFloat = 26            // .pill
    static let composer: CGFloat = 40        // .cam, .lib, .field, .fitbtn
    static let navCircle: CGFloat = 44       // .circ
    static let fixBadge: CGFloat = 26        // .fix .n
    static let stageDot: CGFloat = 24        // .st i
    static let seamInset: CGFloat = 18       // .seam margin
}

// MARK: - Fonts

enum KFont {
    /// Archivo is a variable font. Axis tags are four-char codes as integers.
    static let wdthTag: Int = 0x77647468 // 'wdth'
    static let wghtTag: Int = 0x77676874 // 'wght'
    static let family = "Archivo"

    /// Returns Archivo at the given width (62–125) and weight (100–900), or nil if not bundled.
    static func archivo(size: CGFloat, width: CGFloat, weight: CGFloat) -> CTFont? {
        let variation: [NSNumber: NSNumber] = [
            NSNumber(value: wdthTag): NSNumber(value: Double(width)),
            NSNumber(value: wghtTag): NSNumber(value: Double(weight)),
        ]
        let attrs: [CFString: Any] = [
            kCTFontFamilyNameAttribute: family,
            kCTFontVariationAttribute: variation,
        ]
        let descriptor = CTFontDescriptorCreateWithAttributes(attrs as CFDictionary)
        let font = CTFontCreateWithFontDescriptor(descriptor, size, nil)
        // Core Text silently substitutes another family when Archivo is missing.
        guard (CTFontCopyFamilyName(font) as String) == family else { return nil }
        return font
    }

    /// Score / stat numeral: Archivo width 70, weight 640. Pass a size from @ScaledMetric(relativeTo: .largeTitle).
    static func scoreNumeral(size: CGFloat) -> Font {
        if let ct = archivo(size: size, width: 70, weight: 640) { return Font(ct).monospacedDigit() }
        return .system(size: size, weight: .semibold).width(.condensed).monospacedDigit()
    }

    /// The "was" numeral in a re-check (width 70, weight 500).
    static func scoreNumeralLight(size: CGFloat) -> Font {
        if let ct = archivo(size: size, width: 70, weight: 500) { return Font(ct).monospacedDigit() }
        return .system(size: size, weight: .medium).width(.condensed).monospacedDigit()
    }

    /// Wordmark: Archivo width 125, weight 700 (tracking is applied by WovenLabel).
    static func wordmark(size: CGFloat) -> Font {
        if let ct = archivo(size: size, width: 125, weight: 700) { return Font(ct) }
        return .system(size: size, weight: .bold).width(.expanded)
    }

    /// Care-label mono (SF Mono). Scales with Dynamic Type; never below 12 pt (caption1).
    static let mono = Font.system(.caption, design: .monospaced).weight(.medium)
    /// Mono numbers inside rows (gains, ledger amounts, "/10").
    static let monoValue = Font.system(.subheadline, design: .monospaced).weight(.medium)
}

/// Mono label (the mockup's `.tagline`). Default is sentence case with no tracking
/// (ruling 29: small uppercase mono fights Dynamic Type). FOUNDER DECIDES: set
/// `uppercaseAtNormalSizes = true` to get the mockup's uppercase look back. Uppercase is
/// display-only (`textCase`), so VoiceOver still reads the sentence-case string, and it
/// always drops to sentence case at accessibility sizes.
struct KMonoLabel: ViewModifier {
    static let uppercaseAtNormalSizes = false
    @Environment(\.dynamicTypeSize) private var typeSize
    var color: Color = .kInk3
    func body(content: Content) -> some View {
        let upper = Self.uppercaseAtNormalSizes && !typeSize.isAccessibilitySize
        content
            .font(KFont.mono)
            .textCase(upper ? .uppercase : nil)
            .tracking(upper ? 1.0 : 0)
            .foregroundStyle(color)
    }
}

extension View {
    func kMonoLabel(_ color: Color = .kInk3) -> some View { modifier(KMonoLabel(color: color)) }
}

// MARK: - Score words

nonisolated enum ScoreWord: String, CaseIterable, Sendable {
    case needsAFix = "Needs a fix"
    case gettingThere = "Getting there"
    case putTogether = "Put together"
    case sharp = "Sharp"
    case dialedIn = "Dialed in"

    /// Scores are shown rounded to the nearest 0.5. Thresholds (mockup scale, ruling 24):
    /// ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9+ Dialed in.
    init(score: Double) {
        let r = KScore.roundedToHalf(score)
        switch r {
        case ..<6.0: self = .needsAFix
        case ..<7.0: self = .gettingThere
        case ..<8.0: self = .putTogether
        case ..<9.0: self = .sharp
        default:     self = .dialedIn
        }
    }

    var bandLabel: String {
        switch self {
        case .needsAFix: "5.5 and under"
        case .gettingThere: "6–6.5"
        case .putTogether: "7–7.5"
        case .sharp: "8–8.5"
        case .dialedIn: "9–9.5"
        }
    }
}

/// Convenience function form.
nonisolated func scoreWord(for score: Double) -> String { ScoreWord(score: score).rawValue }

nonisolated enum KScore {
    /// Same as rubric.py's round_half: floor(x * 2 + 0.5) / 2. Don't use `.rounded()` here:
    /// it differs from Python on the fp_boundary parity cases (04 §4.5). Normally you display
    /// `RubricResult.overall`, which KittedCore has already rounded this way.
    static func roundedToHalf(_ x: Double) -> Double { (x * 2 + 0.5).rounded(.down) / 2 }
    /// Display: always one decimal ("8.0", "6.5").
    static func display(_ x: Double) -> String { String(format: "%.1f", roundedToHalf(x)) }
    /// VoiceOver: "8" or "8.5" (avoids "eight point zero").
    static func spoken(_ x: Double) -> String {
        let r = roundedToHalf(x)
        return r == r.rounded() ? String(Int(r)) : String(format: "%.1f", r)
    }
}

// MARK: - KCard

struct KCardModifier: ViewModifier {
    @Environment(\.colorScheme) private var scheme
    var radius: CGFloat = KRadius.card
    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        content
            .background(Color.kSurface, in: shape)
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.kLine, lineWidth: 1))
            // Light mode only: --shadow: 0 1px 2px rgba(18,22,40,.05), 0 6px 18px rgba(18,22,40,.06)
            .shadow(color: scheme == .light ? Color(fixed: 0x121628, alpha: 0.05) : .clear, radius: 1, y: 1)
            .shadow(color: scheme == .light ? Color(fixed: 0x121628, alpha: 0.06) : .clear, radius: 9, y: 6)
    }
}

extension View {
    func kCard(radius: CGFloat = KRadius.card) -> some View { modifier(KCardModifier(radius: radius)) }
}

/// A card made of sections separated by Seams. Put `KCardSection`s and `Seam()`s inside.
struct KCard<Content: View>: View {
    var radius: CGFloat = KRadius.card
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .kCard(radius: radius)
    }
}

struct KCardSection<Content: View>: View {
    var spacing: CGFloat = 10
    var verticalPadding: CGFloat = KSpace.cardPadV
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: spacing) { content }
            .padding(.horizontal, KSpace.cardPadH)
            .padding(.vertical, verticalPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Seam (dashed stitching divider)

struct SeamLine: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.midY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        return p
    }
}

struct Seam: View {
    var inset: CGFloat = KSize.seamInset
    var color: Color = .kInkFaint
    var body: some View {
        SeamLine()
            .stroke(color.opacity(0.45), style: StrokeStyle(lineWidth: 1, dash: [5, 4]))
            .frame(height: 1)
            .padding(.horizontal, inset)
            .accessibilityHidden(true)
    }
}

// MARK: - WovenLabel (the wordmark as a woven neck label)

struct WovenLabel: View {
    enum Size { case regular, small }
    enum Tone { case indigo, copper }
    var text: String = "KITTED"
    var size: Size = .regular
    var tone: Tone = .indigo
    /// What VoiceOver says ("Kitted", "Kitted Pro"), so it is not spelled letter by letter.
    var spokenLabel: String = "Kitted"

    private var fontSize: CGFloat { size == .regular ? 12 : 11 }      // mockup .sm was 8.5; raised to the 11 pt floor
    private var stitchInset: CGFloat { size == .regular ? 7 : 5 }
    private var padding: EdgeInsets {
        size == .regular ? EdgeInsets(top: 8, leading: 25, bottom: 8, trailing: 22)
                         : EdgeInsets(top: 6, leading: 18, bottom: 6, trailing: 16)
    }

    var body: some View {
        let bg: Color = tone == .indigo ? .kFixedLabel : .kAccent
        let fg: Color = tone == .indigo ? .kFixedOnDark : .kOnPrimary
        Text(text)
            .font(KFont.wordmark(size: fontSize))
            .tracking(fontSize * (size == .regular ? 0.34 : 0.32))
            .foregroundStyle(fg)
            .lineLimit(1)
            .fixedSize()
            .padding(padding)
            .background(bg, in: RoundedRectangle(cornerRadius: KRadius.label, style: .continuous))
            .overlay(alignment: .leading) { stitch(fg).padding(.leading, stitchInset) }
            .overlay(alignment: .trailing) { stitch(fg).padding(.trailing, stitchInset) }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text(spokenLabel))
    }

    private func stitch(_ c: Color) -> some View {
        StitchLine()
            .stroke(c.opacity(0.55), style: StrokeStyle(lineWidth: 1, dash: [2, 2]))
            .frame(width: 1)
            .padding(.vertical, 3)
    }
}

struct StitchLine: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        return p
    }
}

// MARK: - ScoreBlock

/// Score numeral + "/10" + score word + one-line verdict (+ optional partial label).
/// The numeral is always kInk: never red/green, never color-only.
struct ScoreBlock: View {
    var score: Double
    var verdict: String? = nil
    /// e.g. "shoes not included". Shows "Partial check: shoes not included".
    var partialMissing: String? = nil
    var showOutOf: Bool = true
    var word: String? = nil  // override (normally derived from the score)

    @ScaledMetric(relativeTo: .largeTitle) private var numeralSize: CGFloat = 76
    @Environment(\.dynamicTypeSize) private var typeSize

    private var resolvedWord: String { word ?? scoreWord(for: score) }
    private var cappedSize: CGFloat { min(numeralSize, 124) } // cap ≈ 1.6× so "9.5" never clips at AX5

    var body: some View {
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8))
            : AnyLayout(HStackLayout(alignment: .lastTextBaseline, spacing: 16))
        layout {
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(KScore.display(score))
                    .font(KFont.scoreNumeral(size: cappedSize))
                    .tracking(-cappedSize * 0.025)
                    .foregroundStyle(Color.kInk)
                if showOutOf {
                    Text("/10")
                        .font(KFont.monoValue)
                        .foregroundStyle(Color.kInk3)
                }
            }
            .fixedSize()
            VStack(alignment: .leading, spacing: 4) {
                Text(resolvedWord)
                    .font(.headline)
                    .foregroundStyle(Color.kInk)
                if let partialMissing {
                    Label("Partial check: \(partialMissing)", systemImage: "square.dashed")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.kInk)
                } else if let verdict {
                    Text(verdict)
                        .font(.subheadline)
                        .foregroundStyle(Color.kInk2)
                }
            }
            .padding(.bottom, typeSize.isAccessibilitySize ? 0 : 2)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(accessibilityText))
    }

    private var accessibilityText: String {
        var s = "Score \(KScore.spoken(score)) out of 10, \(resolvedWord)."
        if let partialMissing { s += " Partial check: \(partialMissing)." }
        else if let verdict { s += " \(verdict)" }
        return s
    }
}

// MARK: - Chip

struct KChip: View {
    enum State { case normal, selected, accent }
    var title: String
    var state: State = .normal
    var systemImage: String? = nil
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let systemImage { Image(systemName: systemImage).imageScale(.small) }
                Text(title).lineLimit(1)
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(fg)
            .padding(.horizontal, 14)
            .frame(minHeight: KSize.chip)
            .background(bg, in: Capsule(style: .continuous))
            .overlay(Capsule(style: .continuous).strokeBorder(border, lineWidth: 1))
            .padding(.vertical, (KSize.hit - KSize.chip) / 2)   // 44 pt hit area, 34 pt visual
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(state == .selected ? .isSelected : [])
    }

    private var fg: Color {
        switch state { case .normal: .kInk; case .selected: .kSurface; case .accent: .kAccent }
    }
    private var bg: Color {
        switch state { case .normal: .kSurface; case .selected: .kInk; case .accent: .kAccentSoft }
    }
    private var border: Color {
        switch state { case .normal: .kLine; case .selected: .kInk; case .accent: .kAccent }
    }
}

/// Wrapping chip layout. Vertical spacing is 0 because each chip already carries 5 pt of
/// hit-area padding above and below (visual gap between rows = 10 pt).
struct ChipFlow: Layout {
    var spacing: CGFloat = KSpace.rowGap
    var lineSpacing: CGFloat = 0

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, widest: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            let w = min(s.width, maxWidth)
            if x > 0 && x + w > maxWidth { y += rowHeight + lineSpacing; x = 0; rowHeight = 0 }
            x += w + spacing
            rowHeight = max(rowHeight, s.height)
            widest = max(widest, x - spacing)
        }
        return CGSize(width: proposal.width ?? widest, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            let w = min(s.width, bounds.width)
            if x > bounds.minX && x + w > bounds.maxX { y += rowHeight + lineSpacing; x = bounds.minX; rowHeight = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(width: w, height: s.height))
            x += w + spacing
            rowHeight = max(rowHeight, s.height)
        }
    }
}

// MARK: - Buttons

/// Primary (filled ink) and secondary (surface-2) capsule buttons.
/// `.large` = 50 pt full width (.btn.lg). `.regular` = 36 pt visual with a 44 pt hit area (.btn).
struct KButtonStyle: ButtonStyle {
    enum Kind { case primary, secondary, outline, ghost }
    enum Size { case large, regular }
    var kind: Kind = .primary
    var size: Size = .large
    var fullWidth: Bool = true

    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        let height = size == .large ? KSize.buttonLarge : KSize.button
        configuration.label
            .font(size == .large ? .headline : .subheadline.weight(.semibold))
            .multilineTextAlignment(.center)
            .foregroundStyle(fg)
            .padding(.horizontal, size == .large ? 20 : 16)
            .padding(.vertical, 6)
            .frame(maxWidth: fullWidth ? .infinity : nil, minHeight: height)
            .background(bg, in: Capsule(style: .continuous))
            .overlay {
                if kind == .outline { Capsule(style: .continuous).strokeBorder(Color.kLine, lineWidth: 1) }
            }
            .padding(.vertical, size == .regular ? (KSize.hit - KSize.button) / 2 : 0)
            .contentShape(Rectangle())
            .opacity(isEnabled ? (configuration.isPressed ? 0.82 : 1) : 0.4)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }

    private var fg: Color {
        switch kind { case .primary: .kOnPrimary; case .secondary, .outline: .kInk; case .ghost: .kInk2 }
    }
    private var bg: Color {
        switch kind { case .primary: .kPrimary; case .secondary: .kSurface2; case .outline, .ghost: .clear }
    }
}

extension ButtonStyle where Self == KButtonStyle {
    static var kPrimary: KButtonStyle { KButtonStyle(kind: .primary, size: .large) }
    static var kSecondary: KButtonStyle { KButtonStyle(kind: .secondary, size: .large) }
    static func kPrimarySmall(fullWidth: Bool = false) -> KButtonStyle { KButtonStyle(kind: .primary, size: .regular, fullWidth: fullWidth) }
    static func kSecondarySmall(fullWidth: Bool = false) -> KButtonStyle { KButtonStyle(kind: .secondary, size: .regular, fullWidth: fullWidth) }
    static var kGhost: KButtonStyle { KButtonStyle(kind: .ghost, size: .large) }
}

/// Copper text link ("Why 8.0?", "Not quite right?", "Review").
struct KTextLink: View {
    var title: String
    var action: () -> Void = {}
    var body: some View {
        Button(title, action: action)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Color.kAccent)
            .buttonStyle(.plain)
            .frame(minHeight: KSize.hit)
            .contentShape(Rectangle())
    }
}

/// Circular icon button. `.solid` = nav circle on surface-2. `.glass` = camera controls only.
struct KIconButton: View {
    enum Style { case solid, glass }
    var systemImage: String
    var label: String               // VoiceOver label, required
    var style: Style = .solid
    var diameter: CGFloat = KSize.navCircle
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: diameter * 0.42, weight: .medium))
                .frame(width: diameter, height: diameter)
                .foregroundStyle(style == .glass ? Color.white : Color.kInk)
                .modifier(IconBackground(style: style))
                .frame(minWidth: KSize.hit, minHeight: KSize.hit)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(label))
    }

    private struct IconBackground: ViewModifier {
        var style: Style
        @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
        func body(content: Content) -> some View {
            switch style {
            case .solid:
                content.background(Color.kSurface2, in: Circle())
            case .glass:
                if reduceTransparency {
                    content.background(Color(fixed: 0x000000, alpha: 0.6), in: Circle())
                } else {
                    content.glassEffect(.regular.tint(Color(fixed: 0x000000, alpha: 0.3)).interactive(), in: Circle())
                }
            }
        }
    }
}

// MARK: - FixRow

struct FixRow: View {
    var number: Int
    var title: String
    var detail: String? = nil       // "Free · it's already in your hand"
    var gain: String                // "→ 9.0" (pending) or "+0.75" (done)
    var isDone: Bool = false

    @ScaledMetric(relativeTo: .footnote) private var badge: CGFloat = KSize.fixBadge
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        HStack(alignment: typeSize.isAccessibilitySize ? .top : .center, spacing: 12) {
            badgeView
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(isDone ? Color.kInk2 : Color.kInk)
                    .strikethrough(isDone, color: .kInk3)
                if let detail, !isDone {
                    Text(detail).font(.footnote).foregroundStyle(Color.kInk2)
                }
                if typeSize.isAccessibilitySize { gainView }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if !typeSize.isAccessibilitySize { gainView }
        }
        .padding(.vertical, 10)
        .frame(minHeight: KSize.hit)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(spoken))
    }

    private var badgeView: some View {
        ZStack {
            Circle()
                .fill(isDone ? Color.kInk : Color.clear)
                .overlay(Circle().strokeBorder(Color.kInk, lineWidth: 1.3))
            if isDone {
                Image(systemName: "checkmark").font(.footnote.weight(.bold)).foregroundStyle(Color.kSurface)
            } else {
                Text("\(number)").font(.footnote.weight(.bold)).foregroundStyle(Color.kInk)
            }
        }
        .frame(width: badge, height: badge)
    }

    private var gainView: some View {
        Text(gain)
            .font(KFont.monoValue)
            .foregroundStyle(Color.kAccent)
            .lineLimit(1)
            .fixedSize()
    }

    private var spoken: String {
        if isDone { return "Done: \(title). Gained \(gain.replacingOccurrences(of: "+", with: "plus "))." }
        var s = "Fix \(number): \(title)."
        if let detail { s += " \(detail.replacingOccurrences(of: " · ", with: ", "))." }
        s += " Score goes to \(gain.replacingOccurrences(of: "→ ", with: ""))."
        return s
    }
}

// MARK: - Previews

#Preview("Tokens") {
    let rows: [(String, Color)] = [
        ("bg", .kBg), ("surface", .kSurface), ("surface2", .kSurface2), ("ink", .kInk),
        ("ink2", .kInk2), ("ink3", .kInk3), ("inkFaint", .kInkFaint), ("line", .kLine),
        ("accent", .kAccent), ("accentSoft", .kAccentSoft), ("good", .kGood), ("caution", .kCaution),
        ("me", .kMe),
    ]
    return ScrollView {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(rows, id: \.0) { row in
                HStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(row.1)
                        .frame(width: 40, height: 40)
                        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.kLine))
                    Text(row.0).kMonoLabel(.kInk2)
                }
            }
        }
        .padding(KSpace.gutter)
    }
    .background(Color.kBg)
}

#Preview("KCard + Seam") {
    KCard {
        KCardSection {
            HStack { Text("Fit check · Full"); Spacer(); Text("Date").foregroundStyle(Color.kInk2) }
                .kMonoLabel()
            Text("Clean base. The overshirt in your hand finishes it.")
                .font(.callout).foregroundStyle(Color.kInk)
        }
        Seam()
        KCardSection { Text("Section two").font(.body).foregroundStyle(Color.kInk) }
    }
    .padding(KSpace.gutter)
    .background(Color.kBg)
}

#Preview("WovenLabel") {
    VStack(spacing: 20) {
        WovenLabel()
        WovenLabel(size: .small)
        WovenLabel(text: "KITTED PRO", size: .small, tone: .copper, spokenLabel: "Kitted Pro")
    }
    .padding(40)
    .background(Color.kBg)
}

#Preview("ScoreBlock") {
    VStack(alignment: .leading, spacing: 24) {
        ScoreBlock(score: 8.0, verdict: "Clean base. The overshirt in your hand finishes it.")
        ScoreBlock(score: 6.5, partialMissing: "shoes not included")
        ForEach([5.0, 6.0, 7.0, 8.5, 9.5], id: \.self) { s in
            Text("\(KScore.display(s)) → \(scoreWord(for: s))").font(.subheadline)
        }
    }
    .padding(KSpace.gutter)
    .frame(maxWidth: .infinity, alignment: .leading)
    .kCard()
    .padding(KSpace.gutter)
    .background(Color.kBg)
}

#Preview("Chips") {
    ChipFlow {
        KChip(title: "Everyday")
        KChip(title: "Class/Work")
        KChip(title: "Date", state: .selected)
        KChip(title: "Interview", state: .accent)
        KChip(title: "Event")
        KChip(title: "Gym")
        KChip(title: "Home")
    }
    .padding(KSpace.gutter)
    .background(Color.kBg)
}

#Preview("Buttons") {
    VStack(spacing: 8) {
        Button("Get started") {}.buttonStyle(.kPrimary)
        Button("Try Pro · 14 days free") {}.buttonStyle(.kSecondary)
        HStack {
            Button { } label: { Label("Re-check after fixing", systemImage: "arrow.clockwise") }
                .buttonStyle(.kPrimarySmall(fullWidth: true))
            KIconButton(systemImage: "square.and.arrow.up", label: "Share", diameter: 36)
        }
        Button("Continue free") {}.buttonStyle(.kGhost)
        Button("Disabled") {}.buttonStyle(.kPrimary).disabled(true)
        HStack(spacing: 24) { KTextLink(title: "Why 8.0?"); KTextLink(title: "Not quite right?") }
    }
    .padding(KSpace.gutter)
    .background(Color.kBg)
}

#Preview("FixRow") {
    KCard {
        KCardSection(spacing: 0, verticalPadding: 4) {
            FixRow(number: 1, title: "Wear the overshirt, open", detail: "Free · it's already in your hand", gain: "→ 9.0")
            Divider().overlay(Color.kLine)
            FixRow(number: 1, title: "Wear the overshirt, open", gain: "+0.75", isDone: true)
        }
    }
    .padding(KSpace.gutter)
    .background(Color.kBg)
}

#Preview("Camera glass") {
    ZStack {
        LinearGradient(colors: [.white, .gray], startPoint: .top, endPoint: .bottom)
        HStack(spacing: 40) {
            KIconButton(systemImage: "xmark", label: "Close", style: .glass)
            KIconButton(systemImage: "camera.rotate", label: "Switch camera", style: .glass, diameter: 52)
        }
    }
    .ignoresSafeArea()
}
