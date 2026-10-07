# 12 · iOS 26 layout metrics (iPhone 17 family) + mockup scale audit

Oct 6, 2026. All values in points (pt). **C** = confirmed by Apple or measured and published by someone who cites a method. **E** = my estimate (secondary or community source, or no published number). No iOS 26 simulator runtime is installed on this Mac, so I couldn't measure anything myself. Install one in Xcode and check the E rows before you build.

## 1. Real metrics

| Item | Value | Src | Conf |
|---|---|---|---|
| iPhone 17 / 17 Pro screen | 402 × 874 @3x | [1] | C |
| iPhone 17 Pro Max | 440 × 956 @3x | [1] | C |
| iPhone Air | 420 × 912 @3x | [1] | C |
| Status bar height | 54 (all four) | [1] | C |
| Safe area top / bottom (portrait) | 62 / 34; **Air 68 / 34** | [1] | C |
| Home indicator | sits in the 34 pt bottom inset; designers draw a 21 pt "box"; the bar is about 134 × 5 | [10] | C box / E bar |
| Dynamic Island | about 126 × 37, 11 pt from top | — | E |
| Display corner radius | 55 on 14 Pro–15 Pro; 17 / 17 Pro about 55–62 (not published) | [14] | C 55 / E 17 |
| Side margin | 16 on 402-wide phones (grouped lists measured at 16 on iOS 26.5); 20 on Pro Max-width phones | [13] | C 16 list / E 20 |
| Grouped (inset) list | 26 corner radius (continuous), 52 row height, text 33 from screen edge | [13] | C (measured) |
| Min list row | 44 | [3] | C |
| Nav bar (inline) | 44 bar; title 17 semibold | [10][12] | C |
| Large title | 34 bold, left-aligned; bar about 96 total with the large title | [10] | C font / E height |
| Toolbar glass buttons | 44 platter, 36 item inside, 16 between items; icon-only buttons are circles | [12][8] | C (reverse-engineered) |
| Tab bar (floating) | **62 tall capsule**, 83 container; **21 from left, right, bottom** | [11][10] | C (dev measurement + designer) |
| Tab label / icon | label about 10–11 medium; SF Symbol about 24–28 | [10] | E |
| Tab selected state | a glass capsule highlight behind the selected tab plus the tint color on icon and label; only the selected tab is tinted | [4][11] | C pattern |
| Search tab | a separate glass circle to the right of the bar | [7][10] | C |
| Bottom accessory | a glass capsule above the bar (Music mini-player); goes inline with the bar when it minimizes | [4][8] | C pattern / height ~48 E |
| Buttons: shape | bordered and glass buttons are **capsules by default**; large and extraLarge are capsules | [8][16] | C |
| Button heights | small ~28, regular ~34–36, large ~50, extraLarge ~56–60 | — | **E** |
| Touch target | ≥ 44 × 44, even when the visible button is smaller | [3] | C |
| Sheets | medium and large detents (plus custom heights); partial-height sheets are **inset and floating** with all corners rounded, and the bottom corners nest into the display curve; large detent is full width | [5][8][15] | C |
| Sheet radius | concentric with the display (~device radius minus inset); side inset ~8 at medium | — | E |
| Grabber | 36 × 5, centered, ~5 from top | — | E (long-standing) |
| Search field | ~36 in a nav bar; ~44–48 glass capsule at the bottom | — | E |
| Messages composer (iOS 26) | ~36–40 "+" circle + ~36–40 capsule field | — | E |
| Concentric rule | inner radius = outer radius − padding; capsule = height ÷ 2 | [7] | C |
| Spacing | 8-pt-based convention: 4/8/12/16/20/24/32 | [10] | Convention, not an Apple rule |

**Dynamic Type at Large (default), iOS** [2] (C):

| Style | Size / leading | Weight |
|---|---|---|
| Large Title | 34 / 41 | Regular (Bold emphasized) |
| Title 1 | 28 / 34 | Regular |
| Title 2 | 22 / 28 | Regular |
| Title 3 | 20 / 25 | Regular |
| Headline | 17 / 22 | Semibold |
| Body | 17 / 22 | Regular |
| Callout | 16 / 21 | Regular |
| Subheadline | 15 / 20 | Regular |
| Footnote | 13 / 18 | Regular |
| Caption 1 | 12 / 16 | Regular |
| Caption 2 | 11 / 13 | Regular |

The minimum is 11 pt [2].

## 2. Mockup audit

The `.screen` is 282 px wide for a 402 pt phone, so **1 pt = 0.7015 px** (pt = px × 1.4255).

**Aspect bug:** the screen is 632 px tall. 874 pt at this scale is **613 px**, so the canvas shows a 901 pt-tall phone, 27 pt more room than a real iPhone 17. Vertical density looks easier than it really is.

| Component (CSS) | Mockup pt | iOS 26 pt | Verdict |
|---|---|---|---|
| Body / chat text 13px | **18.5** | 17 | Too big (+9%) |
| Summary, fix titles 12.5px | 17.8 | 15–17 | Slightly big |
| Secondary labels (`.who`, fix sub, segs) 10.5px | 15.0 | 12–13 (caption/footnote) | Too big |
| Mono taglines 9.5px | 13.5 | 11–12 | Slightly big |
| Smallest text (`.sub .k` 9px, stamp 10px) | 12.8–14.3 | 11–13 | OK (all ≥ 11) |
| `.btn` height 34px | **48.5** | ~34–36 regular | **Too big (+40%)** |
| `.btn` label 12px | 17.1 | 15–17 | OK |
| `.btn.lg` 44px | **62.7** | ~50 large | **Too big (+25%)** |
| `.chip` / `.qc` 32px | **45.6** | ~32–36 | **Too big** |
| `.chip` label 11.5px | 16.4 | 15 | Slightly big |
| `.pill` 20px | 28.5 | ~20–24 | Too big |
| Quick-start `.q` 44px | **62.7** | 44–52 | **Too big** |
| `.fitbtn` 38px | 54.2 | ~50 | Slightly big |
| Composer `.cam`/`.lib`/`.field` 38px | **54.2** | ~36–40 (Messages) | **Too big (+40%)** |
| Composer placeholder 12.5px | 17.8 | 17 | OK |
| Card padding 13/14px | 18.5/20 | 16–20 | OK |
| Card radius 20px | 28.5 | 26 (grouped list) | OK |
| Thread gutter 14px | 20 | 16–20 | OK |
| Dock gutter 12px | 17 | 16 | OK |
| Nav bar height 40px | **57** | 44 | **Too big** |
| Nav title 13.5px | 19.2 | 17 | Too big |
| `.circ` nav buttons 34px | 48.5 | 44 platter / 36 item | Too big |
| `.bigtitle` 26px | 37.1 | 34 | Slightly big |
| Content top 44px | 62.7 | 62 safe area | OK |
| Island 84×24px | 120×34 | ~126×37 | OK |
| Home bar 104×4px | 148×5.7 | ~134×5 | Slightly big |
| Screen radius 41px | 58.4 | 55–62 | OK |
| Tab bar height 56px | **79.8** | 62 | **Too big (+29%)** |
| Tab bar side inset 14px | 20 | 21 | OK |
| Tab bar bottom 20px | 28.5 | 21 | Slightly high |
| Tab icon 21px | 29.9 | ~24–28 | Too big |
| Tab label 9.3px | 13.3 | ~10–11 | Too big |
| Tab selected: accent-soft pill | — | glass capsule + tint | OK in concept |
| Score numeral 58px | 82.7 | custom display | OK (hero number) |
| Verdict 14px | 20 | 17 headline | Slightly big |
| Sheet: full-width, top radius only | — | inset floating sheet at medium | **Wrong shape** |
| Sheet radius 30px | 42.8 | ~concentric, ~40–50 | OK |
| Sheet padding 18px | 25.7 | 16–20 | Too big |
| Sheet title 18px | 25.7 | 17 (headline) to 22 (title 2) | Too big |
| Grabber 36×5px | **51×7** | 36×5 | **Too big (+43%)** |
| Stepper 34px | 48.5 | ~32–36 | Too big |
| Shutter 68px | 97 | ~70–75 (Camera) | Too big (E) |

**Verdict: the founder is right.** Every control is about **1.3–1.45×** too large: buttons, chips, composer, tab bar, nav bar and grabber. Text runs only about 5–15% large.

The cause is mechanical. The CSS uses **real iOS pt values as px**: 34 (regular button), 44 (touch target), 32 (chip), 36×5 (grabber), 56 (tab bar). The canvas is drawn at 0.70 px/pt, so these values come out 1/0.70 = 1.43× too big. The fonts were partly scaled down (17 → 13 px) but not all the way (17 pt should be 11.9 px).

## 3. How to fix

1. **Author in true points, then scale once.**
   - Make `.screen` 402 × 874 CSS px with `transform: scale(.7015); transform-origin: top left` inside a 282 × 613 wrapper (or use `zoom: .7015`).
   - From then on, every number in the CSS is a real pt value from §1: body 17, buttons 34/50, tab bar 62, nav 44, grabber 36×5.
   - This removes all future guesswork.
2. **Fix the aspect.** Make the screen 613 px tall, so the phone is 631 px instead of 650.
3. If you keep px authoring instead, **multiply by 0.70.** Then:

   | Element | Use (px) |
   |---|---|
   | Body | 11.9 |
   | Footnote | 9.1 |
   | Caption 1 | 8.4 |
   | Regular button | 24 high |
   | Large button | 35 high |
   | Chip | 23 high |
   | Composer | 27 high |
   | Nav bar | 31 high |
   | Nav circles | 31 |
   | Tab bar | 43.5 high, 14.7 from the sides and bottom |
   | Tab label | 7.4 |
   | Tab icon | 17.5 |
   | Grabber | 25 × 3.5 |
   | Sheet title | 12–15.4 |

4. **Map text to Dynamic Type styles and nothing else.**

   | Mockup text | Style |
   |---|---|
   | Chat text | Body 17 |
   | Fix titles | Subheadline 15 semibold |
   | Fix subtitles, `.who` | Footnote 13 |
   | Mono tags | Caption 2 11 |
   | Verdict | Headline 17 |
   | Sheet title | Title 3 20 or Headline 17 |

5. **Redraw the sheet as an iOS 26 inset sheet** at medium:
   - about 8 pt side and bottom inset, all four corners rounded and concentric with the display;
   - a 36 × 5 grabber;
   - 16–20 content padding.
6. **Keep touch targets ≥ 44 pt** after shrinking: a 34 pt button keeps a 44 pt hit area.
7. **Tab bar:** 62 tall capsule, 21 pt insets. Reserve 83 + 8 pt under the thread, not today's 122 pt (`.dock` 86 px).
8. **Things to keep:**
   - 20 pt gutters;
   - card radius 26–28 (concentric with a 16–20 inset);
   - the hero score size;
   - the island and screen radius.

## Sources

1. Use Your Loaf, "iPhone 17 Screen Sizes": https://useyourloaf.com/blog/iphone-17-screen-sizes/
2. Apple HIG, Typography (Dynamic Type tables, updated Dec 16, 2025): https://developer.apple.com/design/human-interface-guidelines/typography
3. Apple HIG, Buttons (44×44 hit region): https://developer.apple.com/design/human-interface-guidelines/buttons
4. Apple HIG, Tab bars (accessory, minimize): https://developer.apple.com/design/human-interface-guidelines/tab-bars
5. Apple HIG, Sheets (detents, grabber): https://developer.apple.com/design/human-interface-guidelines/sheets
6. Apple HIG, Toolbars (concentric radii): https://developer.apple.com/design/human-interface-guidelines/toolbars
7. WWDC25 "Get to know the new design system": https://developer.apple.com/videos/play/wwdc2025/356/
8. WWDC25 "Build a SwiftUI app with the new design": https://developer.apple.com/videos/play/wwdc2025/323/
9. Apple Design Resources, iOS 26 kits: https://developer.apple.com/news/?id=pnfbj8je
10. Learn UI Design, "iOS 26 Design Guidelines" (Apr 22, 2026): https://www.learnui.design/blog/ios-design-guidelines-templates.html
11. Apple Developer Forums, "UITabBar in iOS 26 is Too Big…" (62/83 pt): https://developer.apple.com/forums/thread/796986
12. innei, UIKitCore reverse-engineering report (44 platter / 36 item): https://innei.in/zh-TW/posts/tinkering/uikitcore-reverse-engineering-report
13. gariasf/green-friends #32 (iOS 26.5 simulator measurements): https://github.com/gariasf/green-friends/issues/32
14. kylebshr/ScreenCorners (display radii): https://swiftpackageregistry.com/kylebshr/ScreenCorners
15. Sarunw, "How native SwiftUI controls look different in iOS 26": https://sarunw.com/posts/swiftui-native-controls-ios-26/
16. Expo docs, SwiftUI Button (control sizes and shapes): https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/button/

I did not read "Meet Liquid Glass" (WWDC25 219), and no number in this note comes from it.
