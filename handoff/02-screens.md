# 02 · Screens: the screen-by-screen UI spec

*Written Oct 6, 2026 for a new Claude chat that has no memory of how these decisions were made. You build the React Native (Expo) demo from this file. Read `/CLAUDE.md` and `01-product-brief.md` first.*

> **Stack note (React Native + Expo):** this file was first written in SwiftUI terms (`TabView`, `NavigationStack`, `.sheet`, text styles like `.headline`, `PhotosPicker`, `SFSafariViewController`…). The layout, sizes, copy, states and rules all stand; translate every SwiftUI/iOS API name with **`06-react-native-mapping.md`**. SF Symbol names are used as-is (expo-symbols). Lines that named a Swift-only build step (StoreKit's `SubscriptionStoreView`, a `.storekit` file, SwiftData, the Swift design-system file) have been rewritten for React Native.

**Sources this file was built from** (all absolute paths):
- Visual source of truth: `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html` (20 phones; photos in `/Users/eyu/Desktop/files/Kitted/mockups/img/`)
- Rulings that override older docs: `/Users/eyu/Desktop/files/Kitted/brainstorm/13_setup-decisions.md` (cited below as "ruling N")
- Canonical engineering spec: `/Users/eyu/Desktop/files/Kitted/app-build-spec.md` §4 and §6
- App map, state matrix and flows: `/Users/eyu/Desktop/files/Kitted/brainstorm/10_app-setup-product.md`
- Photos in the UI: `/Users/eyu/Desktop/files/Kitted/brainstorm/09_photos-in-the-ui.md`
- iOS 26 metrics: `/Users/eyu/Desktop/files/Kitted/brainstorm/12_ios26-metrics.md`
- Consent text: `/Users/eyu/Desktop/files/Kitted/inputs/app-store-and-age-rules.md` §3

**How to use it:** the mockup wins on layout, size and copy, except where a screen below says **"Differs from mockup because…"**. Those are deliberate fixes from the rulings. Copy in `code font` or in the copy deck (§5) is exact; don't paraphrase it. Where this file writes new copy for an undrawn screen, that copy is now the spec too.

---

## 0. Conventions used in this file

### 0.1 Points, not pixels
Inside each `.phone` in the mockup, **1 CSS px = 1 iOS pt**. The phone is authored at true iPhone 17 size (402 × 874 pt) and shrunk with CSS `zoom: .735`. So every number below comes straight from the CSS.

> Note: `brainstorm/12_ios26-metrics.md` §2 audits an **older** version of the mockup (a 282 px wide screen at 0.70 px/pt) and calls the controls 1.3–1.45× too big. That has already been fixed. The current file is authored in real points (buttons 36/50, chips 34, nav 44, tab bar 62, composer 40, grabber 36×5). Use the numbers here, not 12's "too big" column. 12 §1 is still right about real iOS sizes.

Measure from the 402 pt wide screen. The safe area is 62 pt on top and 34 pt on the bottom. The mockup's `.content` starts at y = 62.

`03-design-system.md` §4 snaps odd CSS values to a 4-pt scale (for example 18 → 16 side margins, 10.5 → 10). That's allowed: the comparison tolerance in `05-build-plan.md` §3.3 is 4 pt. Use the `space` / `radius` constants from `ts/design-system/tokens.ts` (copied to `app/src/design-system/`) rather than retyping the CSS numbers.

### 0.2 Fonts: mockup px → iOS text style (the `variant`/`role` names in `ts/design-system/typography.ts`)
Use Dynamic Type styles everywhere, never fixed sizes, except the Archivo score numerals and the wordmark (ruling 29: Archivo only for the score and the wordmark, SF Pro for text, SF Mono instead of DM Mono, sentence case, never under 12 pt).

| Mockup px | SwiftUI style | Typical use |
|---|---|---|
| 34–35, bold | `.largeTitle.bold()` | Large tab titles, welcome headline |
| 31, bold | `.largeTitle.bold()` | Paywall headline |
| 22, bold | `.title2.bold()` | Sheet titles |
| 19.5, semibold | `.title3.weight(.semibold)` | Limit card headline |
| 17–18, semibold | `.headline` | Verdict word, nav title, sheet "total" row, plan names |
| 17, regular | `.body` | Chat text, composer placeholder, large button label (`.headline`) |
| 16 | `.callout` | Card summary, fix titles (`.callout.weight(.semibold)`), perks |
| 14.5–15.5 | `.subheadline` | Chips, buttons (`.subheadline.weight(.semibold)`), verdict detail, ledger rows, links |
| 13–13.5 | `.footnote` | Fix subtitles, "Your stylist" header, photo captions, day stamps, pills, minilabels |
| 11.5–12.5, mono | `.caption.monospaced()` (12 pt) | Card taglines ("Fit check · Full"), "/10", gains (`.subheadline.monospaced()` for 14.5) |
| 10–11 | system-managed | Tab bar labels (don't style them) |

**Taglines are sentence case.** The mockup's CSS uppercases `.tagline` text (`text-transform: uppercase`, DM Mono). Per ruling 29, render the HTML's own sentence-case text ("Fit check · Full") in SF Mono 12 pt. *Differs from mockup because ruling 29 (small uppercase mono fights Dynamic Type).*

**Score numerals:** Archivo, tabular, drawn with `<Numeral>` from the design system. The mockup's variable font (width ~70, weight ~640) can't be set in React Native on SDK 57, so the app uses the static **Archivo Condensed SemiBold** cut (width 75, weight 600; 03 §3.3–§3.4). The base size is the mockup's px value (03 rounds the hero to 76), scaled on the `largeTitle` Dynamic Type ramp and capped at 1.6× (`typography.ts → numeralMaxScale`). Sizes used: 75.5 (card hero), 73 (share card), 67.5 (Rotation), 52 (sheet total, welcome mini-card), 44 (Lookbook counters, "was" score, item "fits" count), 31 (correction preview number, next-buy "+9 fits"). **Plan prices and the height stepper value are SF Pro, not Archivo** (`03-design-system.md` §3.3, ruling 29), even though the mockup draws them in Archivo. Whether the stat numerals (Rotation, Lookbook counters, fits counts, countdown) may use Archivo is an open founder decision; the default is yes (README, open decisions).

### 0.3 Color tokens
Names follow the mockup CSS (`--bg` → `bg`). The values live in `handoff/03-design-system.md`; summary: `bg` chalk #F3F4F6 / #0C0E14, `surface` #FFFFFF / #171A23, `surface2` #ECEEF1 / #21252F, `ink` #121628 / #ECEEF3, `ink2` #585E70 / #A1A7B5, `ink3` #646A7A / #9096A5 (fixed, see below), `inkFaint` #848A99 / #6E7484 (decoration only), `line` #E0E3E8 / #2A2F3B, `accent` (rivet copper) #9C5326 / #DE9762, `accentSoft` (accent at 9% light / 15% dark; the mockup's 11% failed contrast), `primary` (= ink), `onPrimary`, `good` #2B7651 / #5DC08F, `me` (his bubble) #1B2340 / #2A3150, `onMe`, `dim` (sheet scrim).

**Contrast fix:** the mockup's `ink3` (#848A99 light, #6E7484 dark) fails the 4.5:1 text rule in `app-build-spec.md` §4 (about 2.97–3.46:1 light, 3.28–4.13:1 dark). Use `ink3` = **#646A7A light / #9096A5 dark** (4.65–5.41:1 and 5.18–6.51:1; exact numbers in `03-design-system.md` §2.1) for text **and** for glyphs that carry meaning (chevrons, the pencil, the lock, empty-state icons). Keep the original values as `inkFaint` (`colors.inkFaint`) for decoration only: seams, ghost-tile and missing-piece dashes, disabled glyphs. `03` owns the values; `ts/design-system/tokens.ts` already uses them. Token names in this file match the TypeScript tokens (`ink3` = `colors.ink3`; 03 still writes the Swift-era `kInk3`). *Differs from mockup because of the 4.5:1 text-contrast rule.*

**Fixed-dark screens:** the camera (D5), lock screen (D14) and share card (D20) are `.phone.fixed` in the mockup, which means always dark tokens, whatever the appearance setting. Wrap those route trees in `<FixedDark>` from `ts/design-system/theme.tsx` (it forces the dark token set inside) and set native props to dark explicitly (`<StatusBar style="light" />`, `GlassView colorScheme="dark"`). Don't call `Appearance.setColorScheme` for this: that would flip the whole app.

### 0.4 Photo crop modes
The mockup's JS places each photo with `data-crop` and a per-photo table (`PH`: `neck` = chin line, `foot`, `cx` = body center, `fx/fy/fr` = face center and radius, as fractions of the image).

| Mode | What it shows | Used in v1 |
|---|---|---|
| `neck` (the default when `data-crop` is missing) | From the chin line down to just below the feet, centered on the body | **Everywhere a check photo appears**: chat bubble, card, Lookbook, share card, paywall, welcome hero, onboarding look tiles |
| `blur` | From just above the head, with the face blurred | **Not used in v1** (see below) |
| `full` | The whole frame | Only the live camera preview (with the face blurred on screen) |

**Superseded Oct 7 (DECISIONS-LOG #55): the founder chose to keep his photo unblurred on the phone and show it in full in the thread, card and viewer; only the upload is face-blurred.** Was: ruling 11's default is **never store the face**: the app keeps only a 2048 px neck-down copy and a 400 px thumbnail, and 13 §2 puts "the neck-down copy in the chat bubble, card, Lookbook, share card and paywall." The mockup draws his own chat bubbles (D7, D8, D10, D19) in `blur` mode. **Render those bubbles in `neck` mode.** *Differs from mockup because ruling 11 + 13 §2 (the face is never stored, so there is nothing to blur).* In the demo, crop the bundled photos at runtime with the same `PH` fractions: copy the table (near line 1341 of the mockup HTML) into `app/assets/demo-photos/demo-photos.json` (`05-build-plan.md` §4.7). Don't hand-edit `seed.json`; it's generated.

### 0.5 The glyphs
The mockup draws its own SVG icons. Map them to SF Symbols. **`03-design-system.md` §7 is the canonical icon table** (every name there was verified against this Mac's symbol list); this table agrees with it:

| Mockup `#i-…` | SF Symbol |
|---|---|
| chat | `bubble.left` (Stylist tab; the mockup draws one bubble) |
| hanger | `hanger` (tab) |
| book (a 2×2 grid) | `square.grid.2x2` (Lookbook tab). *`app-build-spec.md` §6 says `book.closed`; the mockup draws a grid, and the mockup wins on visuals.* |
| person | `person` (You tab) |
| camera | `camera` |
| photo | `photo` |
| x | `xmark` |
| back / next | `chevron.left` / `chevron.right` |
| gear | `gearshape` |
| check | `checkmark` (`checkmark.circle.fill` for "good" states) |
| tee | `tshirt` |
| bag | `bag` |
| q | `questionmark.circle` |
| share | `square.and.arrow.up` |
| redo | `arrow.clockwise` for Re-check buttons |
| info | `info.circle` |
| pencil | `pencil` |
| shoe | `shoe` (`shoe.2` for "your shoes") |
| lock | `lock` |
| bookmark | `bookmark` / `bookmark.fill` |
| plus | `plus` |
| shield | `checkmark.shield` |
| blur | `face.dashed` (consent row 1) |
| phone | `iphone` |
| trash | `trash` |
| partial | `square.dashed` (the partial label) |
| flash | `bolt` / `bolt.slash` |
| flip | `camera.rotate` |
| bell | `bell` |
| cal | `calendar` |
| up | `square.and.arrow.down` for "Save" on the share screen (the mockup's up-arrow reads as upload; Save means save to Photos) |

Garment tiles (`data-gi`: tee, oxford, overshirt, jacket, sweater, hoodie, chino, jeans, trouser, cargo, sneaker, runner, boot, loafer) are drawn icons standing in for cut-outs. In the demo, draw them as a `GarmentIcon(type:color:)` view (vector shapes in the item's color). This is also the real app's fallback when there is no usable cut-out (09 §2).

---

## 1. How to read this spec: the navigation model

### 1.1 Root structure
```
KittedApp
└── RootView
    ├── if ageBlocked (Keychain flag) → AgeStopView (O4, terminal, replaces everything; checked first)
    ├── if !profile.onboardingDone → OnboardingFlow (fullScreenCover, no tab bar)
    └── TabView (iOS 26 Tab API, floating Liquid Glass tab bar, labels always on)
        ├── Tab "Stylist"  → NavigationStack(path: $router.stylistPath)  → S1
        ├── Tab "Closet"   → NavigationStack(path: $router.closetPath)   → C1
        ├── Tab "Lookbook" → NavigationStack(path: $router.lookbookPath) → L1
        └── Tab "You"      → NavigationStack(path: $router.youPath)      → Y1
```
- **Tab bar:** use the system `TabView`. iOS 26 draws the 62 pt floating capsule, 21 pt from the left, right and bottom edges, by itself. Set `.tint(accent)`. The mockup's selected tab is accent text on an `accentSoft` pill; the system's glass highlight plus the tint is the native version of that, so don't hand-draw a tab bar. Labels: `Stylist`, `Closet`, `Lookbook`, `You`. The Stylist tab is selected at launch.
- **One NavigationStack per tab.** Each has a typed path enum (`StylistRoute`, `ClosetRoute`, `LookbookRoute`, `YouRoute`). Re-tapping the selected tab pops to its root (system behavior).
- **Stylist uses an inline title.** Closet, Lookbook and You use **large titles** (34 pt bold, left-aligned, the mockup's `.bigtitle`) with one trailing toolbar button each.

### 1.2 Presentation types

| Type | SwiftUI | Escape | Used for |
|---|---|---|---|
| **Push** | `NavigationLink(value:)` / `path.append` | Back button + edge swipe | Item detail, look detail, Starter essentials, settings pages, onboarding steps |
| **Sheet** | `.sheet` with detents; the iOS 26 inset floating sheet at partial heights | Grabber + swipe down + an X (36 pt circle, 44 pt hit area) or Done | Why this score, Not quite right?, Added items, Edit item, Pick shoes, Rotation explainer, Next best buy, Describe it, fact detail |
| **Full-screen cover** | `.fullScreenCover` | A visible **X from the first frame** (top-left, 44 pt) | Camera, shoe snap, share card, paywall, photo viewer, onboarding |
| **Inline card** | A `ChatMessage` of kind `.card` in the Stylist thread | Scroll | Fit check, re-check, outfit idea, item, plan, question, limit, held, failure, turn-on-fit-checks |
| **Toast** | An overlay capsule above the tab bar | Auto-dismiss after 5 s; VoiceOver announces it | Undo, "+N fits", "Logged for today.", "Pro is on." |
| **Confirmation dialog** | `.confirmationDialog` | Cancel (the default) | Destructive actions, the "I bought something" and "+" menus |
| **System** | `PhotosPicker`, permission alerts, `manageSubscriptionsSheet`, `offerCodeRedemption`, share sheet | System | |

House rules (10 and the mockup's "Rules every screen follows"): camera, paywall and sheets show an X from the first frame; **onboarding uses Back**, not X. Nothing that fails ever uses up a free check.

### 1.3 The rule: do things in Stylist, look at things in the other tabs
- Closet, Lookbook and You are for **looking and light editing**. Any button there that **does** something (Style this, Wear this again, Re-check, Start a move, Check my fit from an empty state, Show in chat) **switches to the Stylist tab with the item attached**.
- **The one exception** is data entry that iOS users expect in place: Closet "+" (C4), Starter essentials taps (C5), edits (C3) and deleting.
- No tab acts as a button. The camera is a control in the Stylist composer, never a tab.

### 1.4 Cross-tab jumps
Use one `AppRouter` (`@Observable`) holding `selectedTab`, the four paths and `pendingStylistAction: StylistAction?`. A cross-tab button sets the action and switches the tab; `StylistView` consumes the action in `.onChange` and clears it.

| From | Button | `StylistAction` | What Stylist does |
|---|---|---|---|
| C1 empty state, L1 empty state, Stylist "Turn on fit checks" | Check my fit | `.checkMyFit` | Opens the camera (S2), or consent (O5) first if not agreed |
| C2 Item detail | Style this | `.styleItem(itemID)` | Posts his bubble "Style my navy crewneck" and an Outfit card built around it (code, free) |
| L2 Look detail | Wear this again | `.wearAgain(lookID)` | Posts an Outfit card with that look's items, then logs the day on "Wear this" |
| L2 Look detail | Re-check (only inside the re-check window) | `.recheck(lookID)` | Opens the camera in the same mode and occasion |
| L2 Look detail | Show in chat | `.scrollTo(messageID)` | Scrolls the thread to that card and pulses it once (cross-fade with Reduce Motion) |
| L3 / Y1 Your moves | Start | `.startMove(moveID)` | Move 1 is the exception: it pushes C5 in the Closet tab. Others post the move's chat message |
| Notification tap | (system) | `.openCard(messageID)` | Daily idea and "fit check ready" open that card; "trial ending" opens Y5 instead |

Switching tabs keeps the other stacks as they were.

### 1.5 Global rules (apply to every screen; not repeated)
- Touch targets ≥ 44 × 44 pt, even when the visible shape is smaller (`.contentShape` + `.frame(minWidth: 44, minHeight: 44)`).
- Text contrast ≥ 4.5:1; glyphs ≥ 3:1 (see the `ink3` fix in §0.3).
- Dynamic Type to AX5. At accessibility sizes, rows stack vertically, grids drop columns (3 → 2 → 1) and button pairs become stacked full-width buttons.
- Meaning is never carried by color alone: scores always show number + word; states always show icon + text.
- Reduce Motion: count-ups, scans, shimmer and spinners become cross-fades or static states. Reduce Transparency / Increase Contrast: glass becomes solid `surface`.
- Every icon-only button has a VoiceOver label (listed per screen).
- All strings come from `src/i18n/en.ts` with the keys in §5, with plurals through `Intl.PluralRules` ("1 fit" / "37 fits").
- No emoji. Never "AI stylist." The stylist says "I."
- Scores in VoiceOver strings go through `spokenScore()` (`ts/design-system/score.ts`; "8", "8.5"), so where a label below writes "8.0 out of 10", VoiceOver says "8 out of 10".

### 1.6 Screen index

IDs come from `brainstorm/10_app-setup-product.md` §1 where they exist. New IDs (S20+, C8+, L4+, Y10+, N, G, K) are added here. **Cut from 10's map (ruling 8, no accounts in v1): O6 Restore, S16 Save your progress, Y8 Delete account, Y9 Account, and the "I've used Kitted before" button.**

| Mockup # | ID | Name | Presentation | Section |
|---|---|---|---|---|
| 1 | O1 | Welcome | Onboarding cover | §2 |
| 2 | O2 | Pick looks | Onboarding push | §2 |
| 3 | O3 | Basics | Onboarding push | §2 |
| 4 | O5 | Consent | Onboarding push | §2 |
| 5 | S2 | Camera | Full-screen cover | §2 |
| 6 | S5 | Reading (now an inline state in S1) | Inline card | §2 |
| 7 | S6 | Fit check card (result) | Inline card | §2 |
| 8 | S7 | Why this score | Sheet | §2 |
| 9 | S8 | Not quite right? | Sheet | §2 |
| 10 | S6r | Re-check card | Inline card | §2 |
| 11 | S6p | Partial check card + Finish the check | Inline card | §2 |
| 12 | S1 | Stylist home (idle) | Tab root | §2 |
| 13 | S20 | What should I wear? → Outfit card | Inline flow | §2 |
| 14 | N1–N3 | Notifications (3 kinds) | System (local) | §2 |
| 15 | C1 | Closet | Tab root | §2 |
| 16 | L1 | Lookbook (Calendar segment) | Tab root | §2 |
| 17 | Y1 | You | Tab root | §2 |
| 18 | P1 | Paywall (page 1 of 2) | Full-screen cover | §2 |
| 19 | S17 | Limit card | Inline card | §2 |
| 20 | S12 | Share card | Full-screen cover | §2 |
| — | O1e | Example check | Onboarding push | §3 |
| — | O4 | Age stop | Replaces root | §3 |
| — | O3w | Birth-year wheel | Sheet | §3 |
| — | O2n | Pick by name | Sheet | §3 |
| — | S3 | Retake prompt | Inline in S2 | §3 |
| — | S4 | Photo picker | System | §3 |
| — | S9 | Shoe snap camera | Full-screen cover | §3 |
| — | S10 | Pick shoes from Closet | Sheet | §3 |
| — | S11 | Added items review | Sheet | §3 |
| — | S13 | Photo viewer | Full-screen cover | §3 |
| — | S14 | Your first 3 moves (Plan card) | Inline card | §3 |
| — | S15 | Notification ask (Question card) | Inline card | §3 |
| — | S17h | Held check ("Waiting to score") | Inline card | §3 |
| — | S18 | Camera off | Inline card | §3 |
| — | S19 | Failure cards (failed, timeout, offline, paused, couldn't frame) | Inline card | §3 |
| — | S21 | Re-check: change not seen + "Tell me" | Inline + sheet | §3 |
| — | S22 | Dialed-in card | Inline card | §3 |
| — | S23 | Not rated / unreadable / not clothed / "Which one is you?" | Inline card | §3 |
| — | S24 | I bought something → Item card | Inline flow | §3 |
| — | S25 | Ask a question | Inline flow | §3 |
| — | S26 | Turn on fit checks + See an example (no consent) | Inline card | §3 |
| — | S27 | Support card and refusals | Inline card | §3 |
| — | S28 | Swap one | Sheet | §3 |
| — | S29 | Unopened ideas question | Inline card | §3 |
| — | S30 | Buy suggestion card | Inline card | §3 |
| — | C1e | Closet empty | Tab root state | §3 |
| — | C2 | Item detail | Push | §3 |
| — | C3 | Edit item | Sheet | §3 |
| — | C4 | Add item (menu, item camera, review) | Menu + cover + sheet | §3 |
| — | C4d | Describe it | Sheet | §3 |
| — | C5 | Starter essentials | Push | §3 |
| — | C6 | How Rotation is counted | Sheet | §3 |
| — | C7 | Next best buy | Sheet | §3 |
| — | L1a | Lookbook: Looks segment | Tab root state | §3 |
| — | L1b | Lookbook: Saved segment | Tab root state | §3 |
| — | L1e | Lookbook empty / Welcome back | Tab root state | §3 |
| — | L2 | Look detail | Push | §3 |
| — | L3 | Your moves | Push | §3 |
| — | Y2 | Style profile | Push | §3 |
| — | Y3 | What your stylist knows (+ fact sheet) | Push + sheet | §3 |
| — | Y4 | Settings | Push | §3 |
| — | Y5 | Plan & usage | Push | §3 |
| — | Y6 | Notifications | Push | §3 |
| — | Y7 | Privacy & data (+ delete dialogs) | Push + dialogs | §3 |
| — | P1b | Paywall page 2 (plans) | Push inside P1 | §3 |
| — | P1s | Paywall states | Inside P1 | §3 |
| — | G1 | Offline banner | Overlay | §4 |
| — | G2 | Toasts (Undo and info) | Overlay | §4 |
| — | G3 | "Latest" pill | Overlay in S1 | §4 |

---

## 2. The 20 drawn screens (mockup order)

Every layout list runs top to bottom. "Pad" means padding. The screen is 402 pt wide.

### D1 · O1 Welcome
- **Presentation:** first screen of the onboarding `fullScreenCover`. No nav bar, no tab bar, no Back.
- **Entry:** cold launch while onboarding isn't done. **Exit:** "Get started" pushes O2; "See an example check" pushes O1e (§3).
- **Progress:** caption "1/6" in the mockup is the board's label, not UI. O1 has no progress bar.

**Layout**
1. **Hero photo** `s15`, crop `neck`, absolutely positioned at the top, full width, **455 pt tall**, ignoring the top safe area.
2. **Fade:** a gradient from transparent to `bg`, from y = 208 to y = 457.5.
3. **Mini score card** (a `KCard`), top 125, right inset 21, width 171.5, pad 13 / 14.5, radius 21, internal gap 8:
   - Tagline row (mono 11 → caption mono 12): left `Fit check`, right `Everyday`.
   - Score row, gap 10.5: Archivo **52** `8.5`; verdict stack: `Sharp` (15.5 semibold → `.subheadline.weight(.semibold)`), `Full check` (12.5 → `.caption`, `ink2`).
4. **Bottom block**, pinned to the bottom, pad 0 / 28.5 / 44 (sides 28.5, bottom 44), gap 15.5:
   - Woven label `KITTED` (small): the wordmark, see §4. Leading-aligned.
   - Headline `.largeTitle.bold()` (35 px), tracking −0.025 em, line height 1.08, three lines: `Look put together.` / `Without trying` / `too hard.` (Use one string with explicit line breaks.)
   - Body `.body`, `ink2`, line height 1.45: `Send a fit. Get a score out of 10 and the two or three moves that raise it.`
   - Buttons, 8 pt above, gap 8:
     - `Get started`: PrimaryButton large (50 tall, capsule, full width, `primary` fill, `.headline` label).
     - `See an example check`: ghost button, 44 tall, `.subheadline.weight(.semibold)`, `ink2`.
- **Status bar:** dark content in both appearances (the mockup forces `#121628` because it sits on the light photo).

**Interactions**
| Element | Action |
|---|---|
| Get started | Push O2. Logs `onboarding_step` = 1 |
| See an example check | Push O1e (bundled example; no API, no consent needed) |

**States:** none (static). At AX sizes the hero shrinks to 40% of the height and the bottom block scrolls; the buttons stay pinned at the bottom (build spec O1).

**VoiceOver:** hero photo `accessibilityHidden(true)`. Mini card is one element: "Example fit check. Everyday. 8.5 out of 10, Sharp. Full check." Wordmark: "Kitted". Headline is a header trait.

**Differs from mockup:** none. (The mockup already has no "I've used Kitted before" button, per ruling 8.)

> **Update Oct 15 (DECISIONS-LOG #289, `10-onboarding.md`; built):** `See an example check` is live (O1e). Under it, once accounts exist (`ACCOUNTS_BUILT`), a text link `I already have an account` opens A1 (sign-in); hidden in real builds until Firebase. The hero is s14 (#278).

---

### D2 · O2 Pick looks
- **Presentation:** onboarding push. **Entry:** O1. **Exit:** Continue → O3; "Not sure" → O3 with no styles; "Pick by name instead" → O2n sheet; Back → O1.

**Layout**
1. **Onboarding nav** (44 tall, pad 0 16): leading Back circle (44, `surface2`, `chevron.left` 19.5); center a **progress bar**: 6 segments, gap 5, 4 pt tall, radius 2.5, margin 0 18, filled = `ink`, empty = `line`. O2 fills 2 of 6. Trailing a 44 pt spacer.
2. **Thread** (pad 4 / 16 / 0, gap 12):
   - Stylist message (`say`, max width 92%, `.body`): header row "who" (18 × 18 rounded-5 tile, `#1B2340`, letter `K` in Archivo wide 10.5 white; then `Your stylist` in `.footnote.weight(.semibold)` `ink3`, gap 8, 4 pt below), text: `Hey. I'm your stylist. Tap up to 3 looks you'd actually wear. No style words needed.`
   - **Look grid:** 3 columns, gap 8. Each tile is 3:4, radius 13, crop `neck`. Photos in order: `s05`, `s22`, `s14`, `s10`, `s13`, `s09` (the mockup shows `s22` and `s10` selected).
     - Selected: a 2.5 pt `bg` ring inside a 5 pt `ink` ring (`box-shadow: 0 0 0 2.5px bg, 0 0 0 5px ink`), plus a 23.5 pt `ink` circle at top-right (8 pt inset) holding a white checkmark (15.5).
   - Link row, `space-between`, `.subheadline.weight(.semibold)`, `accent`: left `Pick by name instead`, right `Not sure`.
3. **Dock** (pad 8 / 16 / 39): PrimaryButton large, label `Continue · 2 of 3` (count of picks).

**Style tags for the six photos** (internal keys from `rubric.py` `STYLE_BANDS`; confirm visually and adjust in seed data): s05 `minimalist` ("Minimal"), s22 `smart_casual` ("Smart casual"), s14 `gorpcore` ("Outdoor"), s10 `workwear` ("Workwear"), s13 `streetwear` ("Streetwear"), s09 `old_money` ("Old money"). These match `fixtures/seed.json → onboardingLooks`, which wins if they ever differ. The echo in O3 must read "Smart casual with some workwear" for the s22 + s10 pick, so those two are fixed.

**Interactions**
| Element | Action |
|---|---|
| Look tile | Toggle selection (light haptic). A 4th tap shakes the tile gently and shows the inline text `Up to 3.` under the grid for 2 s |
| Continue · N of 3 | Disabled at 0 picks, label `Continue`. With 1–3 picks: label `Continue · N of 3`. Saves styles as weights (1st pick 0.5, others split the rest; logic in `04`), pushes O3 |
| Pick by name instead | Opens O2n (sheet with the 8 style names as chips, max 3, Done) |
| Not sure | Saves no styles (the rubric's balanced `DEFAULT_BAND`) and pushes O3. O3's echo bubble reads `Not sure yet` |
| Back | Pop to O1 |

**States:** images loading → `surface2` placeholders. At AX sizes the grid becomes 2 columns, then 1.

**VoiceOver:** each tile: "Outfit: smart casual" + selected trait; never describes the person. Progress bar: "Step 2 of 6". Back: "Back".

**Update Oct 9 (DECISIONS-LOG #173; founder asked for pictures that explain each style, Claude chose the medium):** the six stock photos are replaced by **one tile per style, 7 tiles, each showing two code-drawn outfits** (the Closet's drawings, `features/closet/flats.ts`; no person, no face, no body, no avatar) **plus the style name and one plain line** ("Hoodies, graphic tees, baggy jeans or cargos, big sneakers"). Two outfits per tile so a style reads as a range, not a uniform. Grid 2 columns. An 8th tile, `Something else? Tell me in your words`, opens a one-line text field; the words are logged (no style is guessed from them) so missing styles show up. Names follow #85: Streetwear, Minimal, Smart casual, Classic prep, Workwear, Outdoor, Vintage sport (O2n's 8 chips become these 7). The stylist line becomes `Which of these would you actually wear? Tap up to 3.` Fit (fitted vs. relaxed) stays a separate question in O3 Basics, because every style comes in both. The `Pick by name instead` link is dropped (the names are on the tiles); `Not sure` stays. Continue is enabled with 1–3 picks or with words typed in `Something else?`; the picks save to kv `onboarding.looks` and the words to `onboarding.otherStyle` until O5 saves the profile. Selected tile: a 2.5 pt `ink` border and the check circle. At AX sizes, 1 column. Sketch: `screenshots/style-picker/light.html` (git-ignored). The outfits per style are seed data, checked against RULEBOOK Part 2 anchors.

**Differs from mockup:** none.

---

### D3 · O3 Basics
> **Built Oct 21 (#373):** O3 is the birth-year step only (one card, `Birth year` / `Choose`, the footnote `Kitted is for 18 and up. It never changes your score.`, the button `Continue`); height, build and fit moved to Kit's optional "About you" card after the first score. Plan, copy, checks and results: `10-onboarding.md` §10. The layout below (the height stepper, Build, Fit, the silhouette) is superseded. **Oct 24 (#375):** height and build are no longer asked anywhere (not in Kit's card, not in You → Style profile); Kit's card asks only the fit, one tap. `10-onboarding.md` §11.

- **Presentation:** onboarding push. **Entry:** O2. **Exit:** "Looks right" → O5 (or O4 if under 18); Back → O2 (undoes the last answer).

**Layout**
1. Onboarding nav, progress 3 of 6.
2. **Thread:**
   - **His echo bubble** (right-aligned, `me` fill, pad 4, radius 18 / 18 / 6.5 / 18, row with gap 4): the two picked looks as 49.5 × 65 thumbnails (crop `neck`, radii 14.5/4/4/14.5 and 4/14.5/4/4). With "Not sure", a text bubble `Not sure yet` instead.
   - Stylist message with the "who" header: `Smart casual with some workwear. Good mix. Now your basics, so the advice fits your frame.` (Template: `{style1} with some {style2}. Good mix.` / one style: `{style1}. Good pick.` / none: `No problem. I'll learn your style from your checks.` Each followed by ` Now your basics, so the advice fits your frame.`)
   - **Basics card** (`KCard`, pad 14 / 16), a 2-column grid `1fr | 75.5`, gap 13:
     - Left column, 4 field rows, gap 13. Each row: label (13.5 → `.footnote.weight(.semibold)`, `ink2`), 6.5 gap, control.
       - `Height`: stepper (36 tall, radius 18, `surface2`, pad 0 4): `−` circle (30, `surface`, 18 medium) · value SF Pro `.title3.weight(.semibold).monospacedDigit()` `5′ 10″` (the mockup draws Archivo 21; 03 §3.3) · `+` circle.
       - `Build`: segmented control (`surface2`, radius 13, pad 2.5, gap 2.5; segment 13 → `.footnote`, pad 7 0, radius 10.5; selected = `surface` fill, semibold, small shadow): `Slim` · `Average` (selected) · `Broad`.
       - `Fit you like`: same control: `Fitted` · `Regular` (selected) · `Relaxed`.
       - `Birth year`: stepper shell with the placeholder `Choose` (15, `ink3`, medium) in place of a value.
     - Right column: the **silhouette with tailor's tape** (§4 `Silhouette`), full height, with the height caption under it in mono 12 `accent` (`5′10″`).
3. **Dock:** PrimaryButton large `Looks right`.

**Interactions**
| Element | Action |
|---|---|
| Height − / + | Steps 1 inch (or 1 cm in metric). Range 4′10″–7′0″. The silhouette's tape caption updates |
| Build / Fit segments | Select; the silhouette redraws (width by build, clothing ease by fit) |
| Birth year control (whole control) | Opens O3w, the year wheel sheet (§3). After a year is picked, the value shows in the same SF Pro style as height and − / + step one year |
| Looks right | **Disabled until a birth year is chosen.** Then: if `currentYear − birthYear < config.minAge` (18) or Declared Age Range reports under 18 (`AgeAssurance`; a stub in the demo, `expo-age-range` from M4, ruling 3) → set the age flag in `expo-secure-store` and replace everything with O4. Otherwise push O5 |
| Back | Pop to O2 |

**States:** the wheel never preselects; Back after O4 is impossible (O4 is terminal).

**VoiceOver:** Height stepper is an adjustable element: "Height, 5 feet 10 inches". Birth year: "Birth year, not chosen, button". Silhouette: "Silhouette: average build, regular fit." Segments: standard segmented-control traits.

**Differs from mockup because…**
- **Height starts blank too**, showing `Add` in `ink3` until the first − / + tap (which seeds 5′10″). *Because `app-build-spec.md` O3 makes height optional ("the stylist asks later if skipped"), and a prefilled 5′10″ would save a fake fact for every user.* If he leaves it blank, the echo bubble omits it.
- Birth year starts blank (`Choose`). *This matches the current mockup and ruling 28.*

---

### D4 · O5 Consent
- **Presentation:** onboarding push (step 4 of 6). **Entry:** O3. **Exit:** "Agree & check my fit" closes the onboarding cover, lands in S1 and opens the camera (S2) at once, which triggers the system camera prompt. "Not now" closes the cover into S1 state (a) with the S26 card. Back → O3.
- Also reachable later from S26 "Review and turn on" and Y7, presented as a sheet with an X (same content, no progress bar).

**Layout**
1. Onboarding nav, progress 4 of 6.
2. **Thread** (scrolls if needed):
   - His echo bubble (text, `me`): `5′10″ · Average · Regular · 2005` (template: `{height} · {build} · {fit} · {birthYear}`; omit height if blank).
   - Stylist message (no "who" header): `Last thing before your first check. Here's what happens to your photo.`
   - **Consent card** (`KCard`, a column of rows; each row is a 2-column grid `23.5 | 1fr`, gap 13, pad 13 / 17, hairline between rows; icon 19.5 in `accent`; title 15.5 semibold → `.subheadline.weight(.semibold)`; body 14 → `.footnote`/`.subheadline` `ink2`). Card header above the rows: `Before your first fit check` (`.headline`, pad 13 / 17 / 0). Rows (text is `app-store-and-age-rules.md` §3, ruling 16; `{provider}` comes from remote config with `consentVersion`, default `Google's Gemini API`):
     1. Icon `face.dashed`. Title `What gets sent`. Body `To score your outfit and answer your questions, Kitted sends these to {provider}, an AI service:` then 3 bullets: `your outfit photo, with your face cropped out or blurred first (if we can't remove it, we don't send it)` · `photos of clothes you add to your closet` · `questions you type to your stylist, plus the clothes in your closet (not your photos) so it can answer`
     2. Icon `hand.raised`. Title `What doesn't`. Body `Your face, your birth year, your name, contacts or location.`
     3. Icon `iphone`. Title `What happens to it`. Bullets: `We don't keep your photos on our servers. They stay on your phone.` · `Google uses them only to give you an answer and doesn't use them to train its AI.` · `Google keeps them for up to 55 days only to check for misuse, then deletes them.`
     4. Icon `info.circle`. Title `Your stylist is an AI.` Body `It can make mistakes, so use "Not quite right?" to fix it.`
3. **Footer line** (13 → `.footnote`, `ink3`, pad 10 / 20 / 0): `You can turn this off anytime in You → Privacy.`
4. **Dock** (pad 8 / 16 / 39, gap 5):
   - `Agree & check my fit`: PrimaryButton large.
   - `Not now`: **SecondaryButton large, same width and height, `surface2` fill, `ink` label** (not ghost, not greyed).
   - Link row, centered, `.footnote`, `accent`, gap 18: `See an example first` · `Privacy policy`.

**Interactions**
| Element | Action |
|---|---|
| Agree & check my fit | Saves `consentVersion` + date. Ends onboarding. Opens S2 in Propped mode with occasion Everyday |
| Not now | Ends onboarding without consent. S1 shows S26. Closet, Lookbook and "Describe it" work; every AI call is refused in code |
| See an example first | Pushes O1e |
| Privacy policy | Opens the policy URL in `SFSafariViewController` |
| Back | Pop to O3 |

**States:** nothing is pre-checked; only "Agree" counts.

**VoiceOver:** each consent row is one element (title + body). Buttons as labeled.

**Differs from mockup because ruling 16** (Google keeps paid-tier data 55 days, and the server keeps no scores, so the mockup's "We don't keep your photos · Only garment notes and scores" and "Never used for ads" lines are inaccurate):
- The 4 rows now carry the §3 text above. The mockup's titles `Faces are blurred first`, `Read securely by Google Gemini`, `We don't keep your photos`, `Delete anytime` and their bodies are **not used**.
- The mockup's footer `Your stylist is an AI. It reads clothes, never faces.` is replaced by `You can turn this off anytime in You → Privacy.` (the AI line is now row 4).
- The secondary button is `Not now` (same width), per §3 rule 2; the mockup's `See an example first` becomes a link.

> **Update Oct 15 (#289; built):** `See an example first` shows in onboarding (O1e, back to consent with `Check my own fit`); `Privacy policy` waits for `PRIVACY_URL`. Opened from the camera or as a sheet, the intro is `Before I score a photo, here's what happens to it.` and the button `Agree`. The footer reads `You can turn this off anytime in You → Settings → Privacy & data.` A hairline sits over the dock; the buttons are 8 pt apart.

---

### D5 · S2 Camera
> **Update Oct 8 (camera guidance, DECISIONS-LOG #100–102; built):** the tip pill follows `features/camera/guidance.ts`, most urgent first: `Too dark. Face a window or turn on a light.` (+ a `Turn on flash` capsule under the pill; with the flash on: `Flash is on. A light in front of you helps most.`) · `Step into the frame` (Mirror: `Phone at chest height, aimed at the mirror.`) · `Bright light behind you. Turn to face it.` · too close · `Come a little closer` · move left/right · `Hold still` (Mirror only) · good. A new tip shows after it holds 0.4 s; problem tips are spoken in Propped (at most every 4 s). The 3-2-1 waits while it's too dark without the flash. Mirror no longer shows `cam.tip.mirror` (the volume shutter is v1.1). Demo screens 41–43.

- **Presentation:** `fullScreenCover`, always dark (fixed). **Entry:** "Check my fit" (composer), O5 Agree, Re-check (same mode and occasion, locked), C1/L1 empty-state "Check my fit". **Exit:** X → back to where he was, nothing sent; a capture → S3 quality check → the cover closes and S1 shows the photo bubble + S5 reading card.
- **Demo note:** the Simulator has no camera. Show the bundled photo `p01b` (crop `full`) as the "live preview", with the guide and the blurred face; the shutter (or the 3-2-1) "captures" it. A "Sample photos" strip (`05` P3) picks which bundled photo is in front of the camera and can "shoot" any of the 12.

**Layout** (status bar white)
1. **Preview**, full bleed (crop `full`). **No live face blur** (founder, Oct 7: he sees himself as in any camera). Faces are hidden after capture, in photo prep. *Differs from mockup because of DECISIONS-LOG #54; the mockup blurs the face live.*
2. **Scrim:** a vertical gradient: black 45% at the top to clear at 22%, clear to 70%, then black 70% at the bottom.
3. **Framing guide** (§4 `FramingOverlay`) drawn over the detected body box: head ellipse solid white 2 pt; body outline white 2 pt, dashed 7 / 5 while searching, **solid when good**.
4. **Top bar** at y = 65, left/right inset 18, `space-between`:
   - X: glass circle 44 (`white` at 16%, blur 15.5), `xmark` 19.5 white.
   - **Tip pill** (36.5 tall, radius 18, pad 0 14.5, white at 92%, text `#121628` 14.5 semibold → `.subheadline.weight(.semibold)`, gap 6.5): icon + text. In the drawn state: green (`#2B7651`) checkmark + `Shoulders and hips in frame`.
   - Flash: glass circle 44, `bolt` (front camera = screen flash; toggles `bolt.slash`).
5. **Countdown** centered at 44% height: a 119.5 pt circle (3 pt white-90% border, inner 8 pt white-12% ring, fill `rgba(10,12,20,.35)` + blur 8) holding Archivo 75.5 numeral (`3`, `2`, `1`); below it, gap 8, `Hold still` (15.5 semibold white, soft shadow).
6. **Bottom controls**, 39 pt above the bottom edge, gap 21:
   - Mode switch (glass capsule: pad 4, radius 21, black 40% + blur 13; segments 14.5 semibold, pad 6.5 / 15.5, radius 17; off = white 75%, on = white 95% fill with `#121628` text): `Propped` · `Mirror`.
   - Control row, pad 0 44, `space-between`: **Library button** (52 glass circle, `photo` 26) · **Shutter** (88.5 ring, 4.5 white border, 70 white disc inside) · **Flip** (glass circle 52, `camera.rotate` 26).

**Guide states** (one at a time, words + icon + outline; spoken once per change, throttled):
| State | Tip pill | Outline |
|---|---|---|
| No one in frame | `exclamationmark.triangle` + `Step into the frame` | dashed |
| Too close (no hips) | `Step back a little. Shoes in frame if you can.` | dashed |
| Off-center | `Move a little left` / `Move a little right` | dashed |
| **Good** (shoulders + hips steady 0.5 s) | `checkmark.circle.fill` (green) + `Shoulders and hips in frame` | solid → starts 3-2-1 |
| Good and ankles visible | `checkmark.circle.fill` + `Head to shoes in frame` | solid |
| Counting | (unchanged) | solid; center shows `3` → `2` → `1` + `Hold still` |
| Moved out during count | back to the matching state; countdown cancels | dashed |

**Modes**
- **Propped (default):** front camera, full guide, auto 3-2-1 with haptic ticks and an optional spoken count (`AVSpeechSynthesizer`); the manual shutter also works.
- **Mirror:** lighter guide (no countdown by default), manual shutter, **the volume buttons take the photo** (ruling 14). A `timer` glass button replaces Flash at the top right; `Timer off` / `Timer 3s`. Tip in Mirror: `Phone at chest height. Volume button takes the photo.`
- The last-used mode is remembered.

**Interactions**
| Element | Action |
|---|---|
| X | Close the cover. Nothing is saved or sent |
| Flash | Toggle screen flash (front) or torch (rear) |
| Propped / Mirror | Switch mode |
| Library button | Opens S4 `PhotosPicker` (single image). A picked photo goes through the same S3 checks |
| Shutter | Capture now (any guide state). Medium haptic |
| Flip | Front ↔ rear camera |
| Volume up/down (Mirror) | Capture |

**States:** permission not decided → the system prompt on the first open (only here). **Denied** → the cover doesn't open; S1 posts S18. Pose fails entirely → the shutter still works (pose is advisory for capture, but the upload rule in S3 still applies).

**VoiceOver:** X "Close camera". Flash "Flash, off". Mode switch "Camera mode, Propped". Library "Choose a photo". Shutter "Take photo". Flip "Switch camera". Tip changes are announced. The countdown announces "3, 2, 1".

**Differs from mockup because…**
- **The library button is an icon, not a thumbnail of his latest photo.** *Because a thumbnail needs Photos read access, and 09 #6 / §3 says never ask for library access (PhotosPicker needs no permission).* The mockup draws photo `s25` in a 52 pt rounded-13 tile.
- Mirror mode adds the Timer button and the volume-button shutter, which the mockup only describes in its caption.

---

### D6 · S5 Reading (an inline state of S1, not a screen)
- **Ruling 13:** the reading is the skeleton card inside the chat, not its own screen. Keep the mockup's best idea: **the photo bubble shows the uploaded crop and says "Only this is sent."** *Differs from mockup because ruling 13 (fewer screens): the drawn screen's nav ("Reading your fit / About 7 seconds"), its X and its 317 pt photo are gone; their content moves into the bubble and the skeleton card below.*
- **Entry:** a capture or library pick that passes S3. **Exit:** the skeleton fills in place and becomes S6 / S6p / S6r (or S19/S23 on failure). Leaving the app keeps going in the background (`beginBackgroundTask`); a local N2 "fit check ready" fires when it finishes (if allowed).

**Layout in the Stylist thread** (compact composer showing, see S1)
1. **His photo bubble** (right-aligned, `me`, pad 4, width 135, radius 21 / 21 / 6.5 / 21): photo 135 × 171.5 (inner radius 17 / 17 / 4 / 17), crop `neck` = **exactly the processed upload copy**. Caption row (13.5 → `.footnote`, pad 6.5 / 9 / 5, `space-between`, 90% opacity): left `lock` 15.5 + `Face hidden when sent` (#64), right the time (`7:42`). When the score lands, the caption becomes `{Occasion}` · time (as in D7).
2. **Skeleton card** in the final card's exact shape (`KCard`, radius 26):
   - Tagline row: left `Reading your fit`, right `About 7 seconds` (mono 12). At 9 s the right side changes to `Taking longer than usual` (ruling 19).
   - Score row placeholder: a 76 × 62 `surface2` rounded rect where the number goes, and two text bars for the verdict (shimmer; static with Reduce Motion).
   - **Found pieces:** a wrapping row of pills (26 tall, radius 13, `.footnote.weight(.semibold)`), one per garment slot as it streams in: `White tee` · `Overshirt · in hand` · `Tan chinos` · `Shoes…` (a pending slot shows in `ink3` with an ellipsis).
   - Seam (dashed divider, §4).
   - **Stage list** (gap 11.5; each row: a 23.5 circle + label 16 → `.callout`, gap 13):
     1. `Finding your pieces`, trailing mono 13 `3 of 4` (slots found / expected). Done = filled `ink` circle with a white check, label `ink`.
     2. `Checking fit`. Current = an accent ring spinning (static ring with Reduce Motion), label `ink` semibold.
     3. `Colors & proportion`.
     4. `Writing your fixes`.
     Pending rows are `ink3`. These are real stages: 1 ticks with the streamed slots; 2 and 3 tick when the on-device scorer finishes each sub-score (they can tick nearly together, which is honest); 4 is the text model's explanation, which streams into the summary after the score is shown.
3. **Occasion question** under the card (not inside it), gap 10.5:
   - `Where are you headed?` (15.5 semibold → `.subheadline.weight(.semibold)`).
   - Chips (34 tall, capsule, pad 0 14, 1 pt `line` border, `surface` fill, 15 medium → `.subheadline.weight(.medium)`, gap 8, wrapping): `Everyday` · `Class/Work` · `Date` · `Interview` · `Event` · `Gym` · `Home`. Selected = `ink` fill, `surface` text.
   - Hint (13 → `.footnote`, `ink3`): `Everyday is picked unless you tap.` (Template `{occasion} is picked unless you tap.` with the preselected one: his last-used occasion, or Everyday the first time.)

**Interactions:** tapping a chip changes the occasion and re-scores in code for free (before or after the score lands). Chips stay under the finished card until he scrolls past or sends something; after that, the card's occasion chip (D7) changes it.

**Occasion → rubric key** (logic owned by `04`): Everyday `everyday` · Class/Work `class` · Date `date` · Interview `interview` · Event `event` · Gym `gym` · Home `home`.

**Timing (ruling 19):** hedge request at 5 s if no first token, "Taking longer than usual" at 9 s, abort at 14 s, the app gives up at 16 s → S19 "That took too long."

**VoiceOver:** the skeleton card is one element, "Reading your fit." Each finished stage is announced once ("Finding your pieces, done"). Bubble: "Your outfit photo, 7:42. Face hidden when sent."

---

### D7 · S6 Fit check card (the result)
- **Presentation:** inline card in S1. **Entry:** S5 completes. **Exit:** buttons below.

**Nav (S1):** inline title `Stylist`, subtitle (12 → `.caption`, `ink3`, via `.navigationSubtitle`): `Re-check included` (the quota line; rules in S1).

**Thread:** his photo bubble (caption `Date` · `7:42`, crop `neck`) then the card. The compact composer and the tab bar sit below (S1).

**Card layout** (`KCard`: `surface`, radius 26, 1 pt `line` border, soft shadow in light mode, clips children)
1. **Header block** (pad 14 / 16, gap 10):
   - Tagline row (mono 12, `ink3`; right side `ink2`): left `Fit check · Full`, right **occasion chip** `Date` with a `chevron.down` 10 (tap = occasion menu).
   - Score row (aligned to the bottom, gap 15.5): Archivo 75.5 `8.0` with mono 14.5 `/10` in `ink3` at the baseline (4 pt left gap); verdict stack (gap 4, pad-bottom 4): `Sharp` (`.headline`), `Clean base. The overshirt in your hand finishes it.` (`.subheadline`, `ink2`, up to 2 lines).
2. Seam.
3. **Fixes block** (pad 4 / 16): fix rows (§4 `FixRow`), here one:
   - `1` in a 26 pt circle (1.3 pt `ink` border, 13 bold) · title `Wear the overshirt, open` (`.callout.weight(.semibold)`) · subtitle `Free · it's already in your hand` (`.footnote`, `ink2`; the mockup's ink3 is raised per 03 §3.2) · trailing gain `→ 9.0` (mono 14.5, `accent`).
   - **Tip line** (top hairline, pad 8 / 0 / 6, `.footnote`, `ink2`): `Next level` in `accent` semibold, then `One standout color, like a rust tee. No score change today.`
4. Seam.
5. **Footer block** (pad 14 / 16, gap 10):
   - **Added row** (gap 10.5, `.subheadline`, `ink2`): overlapping thumbs (28.5 squares, radius 8, `surface2` with 1.5 `surface` border, −8 overlap; garment icons `tee`, `chino`, `sneaker`, `overshirt`), text `Added 4 to Closet`, trailing link `Review` (`accent`, semibold).
   - **Actions row** (gap 8): PrimaryButton regular `Re-check after fixing` with the re-check icon 15.5 (36 tall, capsule, flex) + icon button 36 × 36 `surface2` `square.and.arrow.up` (Share).
   - **Links row** (`.subheadline.weight(.semibold)`, `accent`, gap 24): `Why 8.0?` · `Not quite right?` · and **on the first-ever check only**, a trailing `Later` link in `ink2`.

**Interactions**
| Element | Action |
|---|---|
| Occasion chip · Style chip (#61) | Native pull-down menus (occasions incl. `Going out`; styles). **After the score has landed, picking one asks first** (#62): a native alert `Re-score for {choice}?` · message `Same photo. It would be {new} instead of {old}.` (or `Same photo. The score stays {old}.`) · buttons `Keep {current}` (cancel) / `Re-score` (default). Re-score → the same card updates in place (`8.0 → 7.0` cross-fade), a footnote `Re-scored · was {old} for {previous}` appears under the links, the Why sheet and Lookbook follow. Keep → nothing changes. Free, never uses a check, never a new card. While the reading card is still scoring (S5 chips), changes stay instant with no alert (no score to contradict yet). |
| Photo bubble / card photo | S13 photo viewer |
| Review | Sheet S11 (never switches tabs) |
| Re-check after fixing | Posts the stylist line for S6r (`Overshirt on? Send it. I'll only re-read the layer.`) and opens S2 in the same mode, occasion locked. Hidden after the window closes (30 min; **first-ever check: until 4 am**, ruling 22) or once used |
| Share | S12 |
| Why 8.0? | Sheet S7 |
| Not quite right? | Sheet S8 |
| Later (first check only) | Keeps the re-check open until 4 am and posts S14 (Your first 3 moves) right away |
| Long-press card | Context menu: Why this score, Not quite right?, Re-check, Share, Save (bookmark) |

**Fix rules (ruling 20 and build spec §2.3):** 1–3 fixes, ranked by gain ÷ effort; **at least one free fix whenever any fix exists**; at most one buy fix. Effort tags: `Free` · `Free if you own one` · `From your closet` (only when a matching ClosetItem exists) · `Tailor ~$15` · `Buy`. First check: every fix is doable in 60 seconds with what's in the photo. If nothing gains ≥ 0.5 → S22 (dialed in).

**Gain format:** `→ {new score}` on the card (predicted score after this fix, rounded to 0.5); the raw gain `+0.75` appears only on a done fix in S6r.

**After the first-ever check:** Re-check (then S6r) **or** Later → S14 → P1 → S15 (ruling 23). Nothing else interrupts between the result and the re-check.

**States:** see S5 (scoring), S6p (partial), S19 (failed), S22 (dialed in), S23 (not rated, unreadable, not clothed), S17 (limit). **Rules updated:** old cards show a footnote under the links: `Scored with rules v3.1`.

**VoiceOver:** the whole card is **one element**: "Fit check, Date. Score 8.0 out of 10, Sharp. Clean base. The overshirt in your hand finishes it. Top fix: wear the overshirt, open, free. Added 4 to Closet." Custom actions: Why this score, Not quite right?, Re-check, Share, Review added items, Change occasion. Never describes the body.

**Differs from mockup because…**
- The occasion on the tagline gets a `chevron.down` (the partial card in D11 already has `Everyday ▾`), so every card's occasion is visibly tappable. *Because build spec §4.5 makes it tappable and the two drawn cards disagree.*
- The `Later` link exists on the first-ever check. *Because ruling 23 (Result → Re-check or Later → 3 moves).*
- His photo bubble uses crop `neck`, not `blur` (§0.4).

---

### D8 · S7 Why this score
- **Presentation:** sheet over S1, detents `[.fraction(0.78), .large]` (the mockup's sheet top is at y = 190), grabber visible, an X in the title row. **Entry:** "Why 8.0?", card context menu. **Exit:** X, swipe down; a "What I read" pill swaps to S8.

**Layout** (sheet pad 8 / 20 / 24, gap 12; iOS 26 inset floating sheet, 8 pt side and bottom inset, radius 38)
1. Grabber 36 × 5 (`line`).
2. **Title row:** `Why 8.0` (`.title2.bold()`) + trailing X circle (36, `surface2`, `xmark` 15.5; 44 hit).
3. Subtitle (`.subheadline`, `ink2`, −6 top): `Same photo, same score. Here's the math.`
4. **Ledger** (`.subheadline`; each row `space-between`, gap 13, pad 9 / 0, bottom hairline; the label is `ink2` with the rule name in `ink` semibold; the value is mono 15, no wrap):
   - `Everyone starts at` · `7.0`
   - **`Elevated piece`** ` · tan chinos` · `+0.5` (`good`)
   - **`Shoes that match`** ` · white leather sneakers` · `+0.5` (`good`)
   - **`Layered`** ` · the overshirt is in your hand, not on` · `+0`
   - **`Point of interest`** ` · all neutrals today` · `+0`
   - **`Date`** ` · dressed right for it` · `±0`
   - Mistake rows (when they fire) use the same shape with the value in `accent`, e.g. **`Pooling hem`** ` · the chinos bunch at your shoes` · `−0.5`.
   - **Total row** (pad-top 13, aligned bottom): left `Your score` (`.headline`) with `No mistakes found` under it (`.footnote`, `ink3`; template `1 mistake found` / `{n} mistakes found`); right Archivo 52 `8.0` + `/10`.
5. **What I read** (gap 8):
   - Tagline row: left `What I read`, right `How I score ›` (`accent`).
   - Pills (gap 6, wrapping): `White tee` · `Tan chinos · straight` · `White leather sneakers` · `Beige overshirt · in hand`.
6. Footnote (`.footnote`, `ink3`): `I score the clothes only. Never your face, body or skin.`

**Interactions**
| Element | Action |
|---|---|
| X / swipe | Dismiss |
| A "What I read" pill | Dismiss and open S8 with that garment's row expanded on "Wrong color or fit" |
| How I score › | Push (inside the sheet's own NavigationStack) the "How I score" page (copy deck `why.how.*`) |

**States:** partial check: a row `Shoes` · `not in the photo, so no points lost` · `±0`. Not-rated garment: a row `Kurta` · `not rated` · `—`.

**VoiceOver:** each ledger row is one element: "Elevated piece, tan chinos, plus 0.5." Total: "Your score, 8.0 out of 10. No mistakes found."

**Differs from mockup:** none.

---

### D9 · S8 Not quite right?
- **Presentation:** sheet, `.large` detent (mockup top at y = 150), grabber + X. **Entry:** card link, card context menu, a pill in S7. **Exit:** Save correction (dismisses), X, swipe.

**Layout**
1. Grabber.
2. Title row: `Not quite right?` (`.title2.bold()`) + X.
3. Subtitle: `Tap what I got wrong. Fixing a detail re-scores right away, free.`
4. **Reason chips** (gap 6, wrapping): `Wrong item` · `Wrong color or fit` (selected in the drawn state) · `Fix doesn't apply` · `Score feels off`.
5. **Garment list** (1 pt `line` border, radius 20, clips): rows are a grid `44 | 1fr | 21`, gap 13, pad 10.5 / 15.5, hairlines between:
   - Tile 44 (radius 11.5, `surface2`, garment icon 36.5) · title `.subheadline.weight(.semibold)` `ink` · detail `.footnote` `ink2` · trailing `pencil` 19.5 `ink3`.
   - Rows: `White tee` / `Regular fit` · **open row** `Tan chinos · straight leg` / `How do they really fit?` (open row: `accentSoft` background, detail in `accent` semibold) · `White leather sneakers` / `Low profile`.
   - Under the open row, an `accentSoft` panel (pad 2 / 14 / 14) with value chips (gap 6): `Slim` (selected) · `Straight` · `Relaxed`.
6. **Preview line** (`space-between`, baseline): left `Score stays ` + **`8.0`** (the mockup sets this number in SF 17 bold); when the score would move: `Score ` + Archivo 31 `8.0 → 8.5` with the new number in `accent`. Right: pill `Closet updated` (transparent, 1 pt `line` border, `good` text) whenever the edited garment matches a closet item.
7. PrimaryButton large: `Save correction`.

**Reason modes**
| Reason | What the list shows | Preview |
|---|---|---|
| Wrong item | Each garment; tapping opens a type chip row for that slot (e.g. `Tee` · `Polo` · `Oxford` · `Overshirt` · `Sweater` · `Hoodie` · `Jacket`), plus `Not in the photo` | Re-scored live |
| Wrong color or fit | As drawn. Fields per slot: color chips (color families), fit/leg chips (`Skinny` · `Slim` · `Straight` · `Relaxed` · `Wide` for bottoms; `Slim` · `Regular` · `Relaxed` · `Oversized` for tops), hem (`Clean` · `Cuffed` · `Pooling` · `Cropped`), sleeves (`Down` · `Rolled`), tucked (`Tucked` · `Half tuck` · `Untucked`) | Re-scored live |
| Fix doesn't apply | The card's fixes as rows; tapping one marks it `I'll skip it` and shows which fix replaces it | `Next fix: {title}` |
| Score feels off | Two chips `Higher` · `Lower`, then optional `What would you give it?` stepper 5.0–9.5 by 0.5 | `Score stays {n}. Thanks, this helps me get better.` Button label becomes `Send` |

**Interactions:** Save correction → creates a corrected Reading (never edits the original), re-scores in code (no API), updates the card in place, logs a Correction, dismisses, then a toast: `Saved to your tan chinos.` (template `Saved to your {item}.`; when no closet item matches: `Correction saved.`).

**VoiceOver:** reason chips are a single-select group. Each garment row: "Tan chinos, straight leg. Edit." Preview: "Score stays 8.0. Closet updated."

**Differs from mockup:** none. (10 calls the button "Update score"; the mockup's `Save correction` wins because not every correction moves the score.)

---

### D10 · S6r Re-check card
- **Presentation:** inline card. **Entry:** Re-check after fixing → S2 → S5 → this card. **Exit:** Share → S12; Tell me → S21 sheet.

**Thread**
1. Stylist line, posted the moment he taps Re-check (before the camera opens): `Overshirt on? Send it. I'll only re-read the layer.` (template `{fixQuestion} Send it. I'll only re-read the {slotWord}.`; slot words `layer`, `top`, `pants`, `shoes`).
2. His photo bubble, caption `Re-check` · `7:50`, photo `p01a` (crop `neck`).
3. **Re-check card:**
   - Header block (pad 14 / 16, gap 12):
     - Tagline: `Re-check · Full` / `Date`.
     - **Delta row** (aligned bottom, gap 8): old score Archivo 44 weight 500 `ink3`, struck through (1.5 pt) `8.0` · `chevron.right` 28 `accent` (8 pt up) · new score Archivo 75.5 `9.0` + `/10` · trailing pill (`accentSoft` / `accent`) `+1.0`.
     - Summary (`.callout`): `Layered and clean. ` **`Dialed in.`** ` Nothing else changed.` (the verdict word in semibold).
   - Seam.
   - Fixes block: the done fix: a filled `ink` 26 circle with a white checkmark · title struck through in `ink2` `Wear the overshirt, open` · trailing gain `+0.75` (raw gain, mono, `accent`).
   - Footer (pad 4 / 16 / 14, gap 8): PrimaryButton regular, full width, share icon + `Share the before and after`; centered link `Didn't catch the change? Tell me`.

**Logic:** `RecheckMerger` re-reads only the target fields; a new problem counts only if read `clear` and gets its own line (`New: your shirt came untucked`). The score can't drop from noise. The displayed delta is the rounded score difference; the fix shows the raw gain.

**Interactions**
| Element | Action |
|---|---|
| Share the before and after | S12 with both scores (`8.0 → 9.0 after 1 fix`) |
| Didn't catch the change? Tell me | S21 sheet |
| Card photo | S13 |

**After the first-ever re-check:** post S14 (moves), then present P1.

**VoiceOver:** one element: "Re-check, Date. Score went from 8.0 to 9.0, up 1.0. Dialed in. Done: wear the overshirt, open." Custom actions: Share, Tell me.

**Differs from mockup:** crop mode `neck` for the bubble (§0.4).

---

### D11 · S6p Partial check card
- **Presentation:** inline card. Same card as D7 plus one row (ruling 21). **Entry:** S5 when the score's `not_rated` contains `"shoes"` (the v3 reading has `scene.shoes_visible == false`: shoes not included) or `"bottom half"` (`scene.framing == "upper_only"`: top only). There is no `scene.feet` field in v3 (`05` trap T5).

**Card layout**
1. Header block: tagline `Fit check · Partial` / `Everyday ▾`. Score row: `6.5` `/10`; verdict `Getting there`; under it, the **partial label** (`.subheadline.weight(.semibold)`, `ink`, gap 6.5): `square.dashed` 15.5 + `Partial check: shoes not included` (or `Partial check: top only`).
2. Summary (`.subheadline`, `ink2`): `Gym shorts read as loungewear outside the gym. Headed there? Change the occasion. Your score may change once I see your shoes.`
3. Seam. Fix row: `1` · `Swap to jeans or chino shorts` · subtitle (see below) · `→ 7.0`.
4. Seam.
5. Footer block (gap 10):
   - **Finish the check row** (gap 9, `.subheadline`, `ink2`): text stack (`Finish the check` in `ink` semibold, line break, `Same shoes as {weekday}?`; the demo seed renders `Same shoes as Monday?`, see below) · pushed right: a 44 tile (radius 13, `surface2`, 1 pt `line`) showing the remembered pair's icon/cut-out · a 44 tile (`surface`) with `camera` 19.5 · `Skip` (semibold, `ink2`, 5 pt left pad).
   - Actions row: `Re-check after fixing` + Share icon (same as D7). Re-check stays primary because a free fix exists (ruling 21).
   - Links: `Why 6.5?` · `Not quite right?`.

**Finish the check variants**
| Situation | Second line | Shoe tile |
|---|---|---|
| Shoes from a logged day in the last 7 days | `Same shoes as {weekday}?` | That pair |

*The mockup says "Sunday", but Sunday Oct 18 isn't a logged day in the seed, so the computed copy is "Same shoes as Monday?" (Oct 19; `seed.json → fitChecks[FC2].finishRow`, `04` §12 #3). Build the template; don't hard-code Sunday.*
| Shoes in the closet but none recent | `Snap your shoes or pick a pair.` | `shoe.2` icon → S10 |
| No shoes in the closet | `Snap your shoes to finish.` | hidden |
| Top only | `Snap your bottom half to finish.` | hidden (the camera does a bottom-half snap) |

**Interactions**
| Element | Action |
|---|---|
| Shoe tile (remembered pair) | Applies those stored shoe attributes, no API. Score updates in place; the partial label becomes `checkmark.circle.fill` + `Full check (shoes from your closet)` |
| Shoe tile (icon) | S10 sheet |
| Camera tile | S9 shoe snap. On return the score updates in place (cross-fade when it moves), label `checkmark.circle.fill` + `Full check`, plus a line in the summary with the reason. Demo: the snap returns `variants/s24_shoe_snap_runners` (grey runners) and the score stays 6.5 (raw 6.4); Pick from Closet with the white sneakers gives 7.0 (`expected_scores.json → partials`). Never uses a check or the re-check |
| Skip | Hides the row for good on this check (`snapState = skipped`); the partial label stays |

**Fix subtitle (ruling 20):** "change into" fixes say `Free · from your closet` **only when a matching ClosetItem exists** (here: his dark jeans); otherwise `Free if you own one`.

**Partial rules:** what isn't in the photo never costs points; the label is always in words; partial checks are never compared with full ones (Lookbook too).

**VoiceOver:** "Fit check, Everyday. Score 6.5 out of 10, getting there. Partial check: shoes not included. Top fix: swap to jeans or chino shorts, free from your closet." Finish-row elements: "Use your white sneakers from Monday", "Snap your shoes", "Skip finishing the check".

**Differs from mockup because…** the fix subtitle is conditional (ruling 20). The drawn copy `Free · from your closet` is right only because his closet holds jeans. Bubble crop is already `neck` in the mockup.

---

### D12 · S1 Stylist home (idle)
- **Presentation:** tab root of Stylist. **Entry:** tab, cold launch after onboarding. Notification taps scroll it to a card.

**Nav:** inline `Stylist`, subtitle quota line (`.caption`, `ink3`). Trailing toolbar button `ellipsis` (44 glass circle) with a menu: `Find a past fit check` (switches to Lookbook) · `See an example`. *Differs from mockup because build spec §4.2 has the `…` menu; the mockup leaves the slot empty. It's small; drop it if it crowds the title.*

**Quota line rules** (free tier only, shown only when relevant):
| Situation | Subtitle |
|---|---|
| Free check unused | `1 free check today` |
| Check used, re-check still open | `Re-check included` |
| Check (and re-check) used | `Check used today` |
| A held photo is waiting | `1 photo waiting to score` |
| Pro or trial | (none) |

**AI note (ruling 17):** the very first message in the Stylist thread, posted once when onboarding ends (above his first photo bubble, or above S26 if he chose "Not now"), is the stylist text `stylist.aiNote` with the "who" header. It's not drawn in the mockup because the mockup's thread starts mid-conversation. In the `full` seed it sits at the top of the history, so it doesn't show in screenshot 12.

**Thread** (ScrollView + LazyVStack, pad 4 / 16 / 0, gap 12, bottom-anchored; newest 50 messages first, older on scroll):
1. **Day stamp** (centered, `.footnote.weight(.medium)`, `ink3`): `Thursday 8:00 am` (format: weekday + time within 6 days; `Oct 14, 8:00 am` older).
2. Stylist message with the "who" header (shown on the first stylist message after a day stamp): `Morning. An easy one for class today:` (template: `Morning. An easy one for {occasionWord} today:`).
3. **Outfit idea card** (`KCard`, pad 14 / 16, gap 13):
   - Tagline: `Outfit idea` / `From your closet`.
   - 4-column grid (gap 8): each a square tile (radius 18, `surface2`, garment icon 62%) + minilabel below (gap 6.5, `.footnote`, `ink2`): `Navy overshirt` · `Grey tee` · `Khaki chinos` · `White sneakers`.
   - Actions (gap 8): PrimaryButton regular `Wear this` · SecondaryButton regular (`surface2`) `Swap one`.

**Dock: idle composer** (pad 8 / 16 / 92, gap 10; 92 = the tab bar's 62 + 21 + 9)
1. ~~**Quick-start row**~~ **Removed Oct 7 (S1d, #58).** Was: (one horizontally scrolling row, bleeding off the right edge, gap 8): chips 34 tall, capsule, pad 0 13, `surface`, 1 pt `line`, `.subheadline.weight(.semibold)`, leading icon 19.5 `ink2`, gap 8: `tshirt` `What should I wear?` · `bag` `I bought something` · `questionmark.circle` `Ask a question`.
2. **Composer row** (gap 9): **Check my fit** button (40 tall, capsule, pad 0 16 0 13, `primary` fill, `camera` 26 + `Check my fit` `.subheadline.weight(.semibold)`, gap 9) · text field (flex, 40 tall, capsule, `surface`, 1 pt `line`, pad 0 16, placeholder `Ask…` `.body` `ink3`).

**Compact composer** (the injected `data-composer` in D7, D10, D11, D13, D19; overlay pinned above the tab bar with a `bg` fade above it, pad 8 / 16 / 92): camera circle 40 (`primary`, `camera` 26) · field placeholder `Ask your stylist…`. When the field has text, a send button `arrow.up.circle.fill` (32, `primary`, not copper: copper is only for gains, links and "+N fits") appears inside the field's trailing edge.

**Which composer shows:** compact while an exchange is active (the newest message is under 10 minutes old and part of something he started: a check, a question, "What should I wear?") or while the keyboard is up. Idle otherwise (quiet for 10+ minutes, a fresh foreground, or the newest message is stylist-started like the daily idea). The quick-start row and the camera button (pill or circle) hide while the field is focused or has text, so the field gets the full width. With the keyboard up the dock sits 8 pt above it. Reserve 146 pt (compact) or 184 pt (idle) at the bottom of the thread.

**Interactions**
| Element | Action |
|---|---|
| Check my fit / camera circle | S2 (or O5 as a sheet first if no consent; or S17 is posted after capture if the free check is used) |
| What should I wear? | S20 flow |
| I bought something | S24 flow |
| Ask a question | S25 flow (focuses the field) |
| Field + send | Sends a question (S25) |
| Wear this | Logs today (WearLog) and the card becomes `Wearing this today` with a check (button disabled); toast `Logged for today.` with Undo |
| Swap one | S28 sheet |
| Outfit tile | Push C2 in the Stylist stack (looking at an item from here is fine) |

**State matrix (10 §2)**
| State | S1 shows |
|---|---|
| (a) First launch, consent declined | S26 card: greeting `Send me a fit. I'll score it and start your closet.` + `Turn on fit checks` + `See an example` |
| (b) After first check | Card + re-check, then the S14 moves card |
| (c) Day 7 returning | Today's idea on top (as drawn), quota line |
| (d) Free limit reached | Subtitle `Check used today`; the shutter still works and holds the photo (S17); questions show `{n} left` |
| (e) Offline | G1 banner; a photo stays in the thread with caption `Not sent · Retry` (S19); ideas from cache still work |
| (f) AI call failed | S19 card |

**Accessibility:** when scrolled up more than one screen, show G3 (`Latest` pill, 44 pt). Answers stream; VoiceOver announces them once complete.

**VoiceOver:** Check my fit "Check my fit. Opens the camera." Field "Ask your stylist". The outfit card is one element: "Outfit idea from your closet: navy overshirt, grey tee, khaki chinos, white sneakers." Custom actions: Wear this, Swap one.

**Differs from mockup:** the `…` menu (above); and **no library circle in the composer, and the camera button hides while typing.** *Because the composer's three buttons crowded the field (founder, Oct 7); the camera screen's library button (S2) is the iOS norm for picking a photo.*

---

### S5q · One quick tap (built Oct 8, DECISIONS-LOG #85; founder approved the feature and the wording)
- **When:** after the reading, before the score, only when core `askQuestion(reading, opts)` returns a question: one garment the reading isn't sure about, read as one half of a fixed look-alike pair, where the answer moves the score by a whole point or more (rubric v4, RULEBOOK Part 5). At most one question per check. Never on a re-check, a shoe snap, the same photo again, or a check that already asked.
- **Where:** the reading card's slot (the row's status is `asking`). It survives the app closing: the question is stored on the check.
- **Layout (existing parts only):** tagline `Fit check · Full` with the occasion as plain text (frozen: it can't change while asking) · a static 76 × 62 `surface2` block where the score will be (no shimmer) · the question (`.headline`) over `I couldn't tell from the photo. It changes your score.` (`.subheadline`, `ink2`) · two equal secondary buttons in the question's word order (`Jeans` · `Sweatpants`; no scores shown, the as-read answer isn't marked) · seam · a ≥ 44 pt Skip row: `Skip` + `I'll score it as {choice}.` (`.footnote`, `ink3`). Fades in over 180 ms (none under Reduce Motion). Selection haptic on an answer.
- **The 9 questions:** `Jeans or sweatpants?` · `Jeans or joggers?` · `Jeans or pull-on trousers?` · `Chinos or dress trousers?` · `Separate trousers or suit trousers?` · `Regular shorts or gym shorts?` · `Jeans or chinos?` · `Knit sweater or sweatshirt?` · `Chelsea boots or work boots?` (core's text; `tap.q.*` keys).
- **Answer:** the score lands in the same slot (S6) from his answer. **Skip** scores the more generous reading and the card then shows a `surface2` inset `Scored as jeans. Not right? Tap.`; the whole inset is a button to S8 `Wrong item` with the other answer picked. The inset shows only while that piece still has the skipped value.
- **What counts:** nothing is counted or added to Closet while asking. The check counts when he answers (on the check's own day), and the re-check window opens at the answer. An answer (not a Skip) marks the closet piece's type as confirmed. A new photo while asking sets the open question aside: `Not scored. You sent a newer photo, so nothing was counted.` (no Try again).
- **AX sizes:** the placeholder block hides; the two buttons stack full width.
- **VoiceOver:** on appear, announces `One quick question before your score. {question}`; the question is a header; each answer has the hint `Scores it as {choice}`; Skip reads `Skip. I'll score it as {choice}.` After an answer it announces the score and moves focus to the result card. The result card's label adds `Reads as …` and `Scored as …`, and a custom action `Change the answer`.
- **Demo screens:** 34 asking, 35 answered Jeans (6.5, Reads as streetwear, Black jeans added), 36 skipped (6.5 + the skip inset). The reading is the founder's Oct 7 phone check shown on s12's stock photo (photo id `ph1`; never his photo).
- **Update Oct 8 (tap v2, DECISIONS-LOG #120–124): the shoe question.** A 10th question, `Boots, sneakers or slides?`, asked when the shoe type was lost: read `other`, or `unsure`, or slides that isn't `clear`, and the best answer raises the score by 0.5+. Never at Gym or Home, never when the shoes aren't visible, and only upward. **Three equal buttons** `Boots` · `Sneakers` · `Slides`, in one row (stacked at AX sizes). Code picks the type inside the kind (boots → work boots / suede chukkas / Chelsea boots by how dressed-up the rest is). **Skip keeps the kind that was read**: `I'll score them as slides.`; only a lost type (`other`) skips to the best answer. The skip inset reads `Scored as slides.` / `Not right? Tap.`, opening S8's Wrong item with every shoe type listed. Between two qualifying questions, the one that could raise the score wins. Copy keys `tap.q.boots_sneakers_slides`, `tap.opt.boots|sneakers|slides`, `tap.as.*` (in `addedInBuild`). Demo screens **60** asking, **61** answered Boots (8.5), **62** skipped (7.5): the founder's Oct 8 reading (boots read as slides) on s12's stand-in photo.
- **Update Oct 8 (#125, founder): Skip keeps what was read on every question**, so screen 36 now shows 5.0 with `Scored as sweatpants. Not right? Tap.` and the skip note `I'll score it as sweatpants.` **The hint is now** `I couldn't tell from the photo. I want to get this right.` (was "It changes your score.", which told him which answer pays).
- **Update Oct 8 (#126): "Your {piece}?" about a piece he owns.** When exactly one confirmed piece fits an unsure read and its type would move the score by 0.5+, the question is `Your grey work boots?` (his closet's name) with **Yes** / **No**, his piece's closet drawing in the 76 × 62 block, and the usual hint. Skip keeps the read, except a lost shoe: `I'll score them as your grey work boots.` If his piece agrees with the read, nothing is asked. Copy keys `tap.q.known`, `tap.opt.yes|no`, `tap.skipNote.known`, `tap.skipped.known` (in `addedInBuild`). Demo screens **63** (asking) and **64** (Yes).

### S6s · "Reads as" (rubric v4; DECISIONS-LOG #82, #85; replaces "Scored for", #61–62; applies to S6, S6p, S6r and the Why sheet S8)
- **A style never changes a score** (rubric v4, founder Oct 8). The rubric still gets one style per check (`[[style, 1]]`: the morning/evening card's style, else his first onboarding style), but it only breaks a tie when two detected looks both fit.
- **The line:** `Reads as streetwear` under the summary, above the fixes: `tag` 14 `ink2` + `.footnote` `ink2`, no inset. From core `styleLabel` (the look the outfit reads as), stored on the check (`details.readsAs`) on every re-score. Shown for every detected look, smart casual included (founder, #82). No look detected → no line.
- **Card tagline:** `Fit check · Full` left; the occasion pull-down right. No style text (it never changed the score).
- **Why sheet (S8):** one ±0 row `Reads as streetwear · the look it's going for`, just above the occasion row. The rows still add up. The old "Scored for" section is gone.
- **Never:** "wrong style", a penalty for mixing styles, or the AI judging style.
- **Redesigned Oct 8 (#70, "hero strip", founder's pick):** the card now opens with the outfit edge to edge (equal tiles, hairline gaps, no labels; dashed `+ Shoes` tiles for gaps), then a headline from the first reason or the occasion with a `☂ 46°→63°` badge, one context line `Class ⌄ · Smart casual ⌄` (inline MorphPickers, `Sample weather` at the right), the why line, Wear this + `Swap` (after Wear this: `✓ Logged for today` + primary `Check it on`; thin or new: `Check my fit`), and a one-line copper link `Wearing something else? Check it ›`. The weather strip and the boxed "Going with your own?" row are gone. **Composer:** one glass capsule (camera icon · field · mic → send); voice per #70. The quick-start row stays removed.
- **As built (Oct 8, #67):**
  - **Header (#68, #85):** `Fit check · Full` left; right `Everyday ⌄`. The occasion grows into its menu (`MorphPicker`, #69). VoiceOver: custom action Change occasion.
  - **The alert's buttons:** `Re-score` (default) / `Keep {current}`.
  - **The note under the links:** `Re-scored · was 8.0 for smart casual`.
- **Resolved (#68, #85):** built: the `Reads as {style}` label above replaced the "Scored for" line.

### S1d · The morning card (decided Oct 7, DECISIONS-LOG #58; replaces the quick-start row)
*Differs from mockup 12 because the founder found the chip row above the composer cramped. Once a day the stylist opens with the weather and an outfit instead.*

- **When: two moments a day** (founder, Oct 7, #60). Each is posted as a stylist message the first time Stylist is shown in its window, at most once per day key and slot:
  - **Day card,** 4 am to 4:59 pm: plans today (`Morning.` / `Afternoon.`).
  - **Evening card,** 5 pm to 3:59 am: plans tonight (`Evening. Heading out?`). Default occasion `Going out`. The weather strip shows tonight (`58° at 8 pm · 51° by midnight · dry`, `moon` symbol at night). The camera row reads `Check it before you head out`. It's posted even if he checked a day fit; a check after 5 pm collapses it.
  - `Staying in` in the occasion menu collapses the evening card to `Staying in tonight`. **After 3 evening cards in a row are skipped or ignored, evening cards stop auto-posting.** Picking an evening occasion on any card turns it back on.
  - Tomorrow's outfit comes from the morning N1 notification, not an evening card.
- **Locked per day:** the outfit for a day key is picked once and stored. The same day shows the same idea in the card and the N1 notification. "Swap one" and an occasion change re-pick deliberately. The notification for the next 3 days is planned from the daily forecast on each app open.
- **Greeting** (template, no AI): `{Morning|Afternoon|Evening}. {weather phrase}`, e.g. `Morning. Cold start, warm afternoon, rain tonight.` / `Morning. 48° and cloudy, a layer kind of day.` Without weather: `Morning. An easy one for {occasionWord} today:` (the old line).
- **Card** (KCard):
  1. Header: `Today` / `Tonight` (mono tagline) + two pills; tapping one makes the pill grow into its menu (`MorphPicker`, #69: same fill, its top row is still the pill, 44 pt rows with a check; it floats over the card):
     - **Occasion pill:** Everyday · Class/Work · Date · Going out · Interview · Event · Staying in (evening only). Weekday days default to his Class/Work, weekends to Everyday, evenings to Going out.
     - **Style pill** (#61): `Your styles` (his onboarding picks) then `More styles`: Streetwear · Smart casual · Minimal · Workwear · Old money · Sporty · Outdoorsy (rubric ids streetwear, smart_casual, minimalist, workwear, old_money + preppy merged per #57, vintage_sport, gorpcore). The default is his first style. The last pick is remembered separately for the day and evening cards.
     - **On this card, changes re-pick instantly with no alert** (it's a suggestion, not a score).
     - **Same outfit after a change:** why line `Same pick works for {style}.`
     - **Closet can't do the style:** `Closest {style} I can make from your closet.`
     Right side: `From your closet` (or `{n} pieces so far` when thin).
  2. **Weather strip** (`surface2`, radius 12): SF Symbol for the condition · `{now}° now · {high}° high` · second line `Rain likely after 5 pm` / `Dry all day`. °F (US-only app). Tapping it does nothing.
  3. 4 garment tiles (as S1) with a dashed `You'd need: {item}` tile for a slot the closet can't fill (e.g. a layer when it's cold).
  4. **Why line** (`.subheadline`, `ink2`, one or two sentences, template): names the weather reason, e.g. `Overshirt for the cold walk; it comes off by noon. Boots over the white sneakers for the rain.`
  5. Actions: `Wear this` (primary) · `Swap one` (secondary). Tapping a tile pushes C2.
  6. **"Your own fit" row** (founder, Oct 7, #59): below the actions, a full-width row inside the card above a 1 pt `line` divider (pad 12 / 16): camera circle 30 (`surface2`) · `Going with your own?` (`.subheadline`) over `Check it before you leave` (`.footnote`, `ink2`) · `chevron.right` (`ink3`). Tap → the camera (S2) with the card's occasion and style preset (`/camera?occasion=…&style=…&from=morning`); the check is scored for them (S6s). One 44 pt+ row, not a third button (the founder found 3-across cramped).
     - After `Wear this`: the card shows `Wearing this today` (check) and the row becomes `Dressed? Check it on` / `See how it fits on you`.
     - Free check already used today (non-Pro): the row reads `Your free check resets tomorrow` and opens S17's held flow, never a paywall push.
     - Evening card: the row reads `Going with your own?` / `Check it before you head out`.
  7. Footer: Apple's Weather mark + `Data sources` link (WeatherKit attribution, required). Only when live weather is shown.
- **Closet states:**
  - **Enough** (a valid top + bottom + shoes for the occasion): as above.
  - **Thin** (some pieces, no valid outfit): the known pieces only (no dashed tiles since #380, Oct 28); why line `I only know {n} of your pieces. Check today's fit and I'll learn the rest.`; actions `Check my fit` (primary) · `Add basics` (→ C5).
  - **Empty** (new user): no tiles; `Send me today's fit and I'll start learning your closet.` + `Check my fit`. With consent declined, S26 instead.
- **After a fit check today** (either path, or a check from the composer): the card collapses in place to one row: photo thumb 44 × 56 (radius 8) · `Today · {Occasion}` tagline over `You went with your own` / `You wore my pick` · his score (Archivo, `.title2`) with the score word under it. Tapping it scrolls to the full result card in the thread. Re-checks update the number.
- **Past days and slots:** earlier cards render collapsed (`Thursday's idea · Wore it` / `· Went with your own · 8.0` / `· Skipped`), so the thread doesn't fill with full cards.
- **Weather never changes the score** (#59). Same photo, same score on any day. Weather only adds one advice line under the result's fixes when relevant (`Rain tonight: boots over suede.`; `Cold out: bring the overshirt.`), from `weatherTip()` in core.
- **No predicted score is shown on the idea** (#59). A number from closet items can differ from the photo's score, which undermines trust in the score.
- **Location ask** (once, inside the first card that would show weather): a row `Use your local weather?` + `Allow` → the system prompt (When In Use, reduced accuracy). Declined or not asked yet: no strip; the greeting and why line use the season ("October: bring a layer").
- **Weather rules** (code, in `@kitted/core` `weather.ts`; feels-like °F over his day, 8 am to 8 pm):
  - **80 and up:** no layer; shorts allowed for Everyday.
  - **65 to 79:** no layer needed.
  - **50 to 64:** a light layer is suggested.
  - **35 to 49:** a layer is required; if none fits, the why line says so ("It's cold out, and I haven't seen a layer of yours yet."); no dashed tile since #380.
  - **Below 35:** an outer layer is required.
  - **Rain chance 50%+:** no suede; boots or dark sneakers are preferred over white sneakers.
  - **A swing of 15° or more between morning and high:** a layer he can take off.
  - The founder reviews these numbers with the rubric.
- **Composer:** the quick-start row is gone. Idle dock = `Check my fit` + `Ask…` field only; reserve shrinks accordingly. "What should I wear?" is the card (and later typed questions); "I bought something" is v1.1; "Ask a question" is the field.
- **As built (Oct 8, #67):**
  - **Header:** two rows: the mono tagline (`Today` / `Tonight` · `From your closet`), then the two pills.
  - **Sample weather:** the strip's footer reads `Sample weather` until WeatherKit is live; Apple's mark replaces it then.
    > **Update Oct 14 (founder): the weather is real now, from the US National Weather Service** (api.weather.gov, free, public domain, US only; 05 §MC9). `Allow` shows the real iOS location prompt (When In Use, approximate by default); after it, the card plans with live weather and the label beside the pills reads `Weather: National Weather Service` (key `wx.nws`). `Sample weather` now shows only on sample weather (demo screens, which keep their sample days). Declined, offline, outside the US, or a build without the location module: no weather, the season as before. **Privacy:** only the approximate location, rounded to about 1 km, goes to the National Weather Service; never to Google, never stored by us. Apple WeatherKit (with its mark and `Data sources`) replaces NWS after the paid program.
  - **Allow:** the copper text link (`TextLink`).
  - **Thin closet:** shows only `Check my fit` until Starter essentials (C5) exists; `Add basics` is hidden.
  - **Swap one:** ~~the iOS action sheet (`The navy chinos`, …), not S28's sheet yet.~~ **Update Oct 23 (#377):** S28's sheet (09-ui-review §28).
  - **Same pick after a style change:** a toast `Same pick works for {style}.`, not a why line.
- **VoiceOver:** the "your own fit" row is its own button ("Going with your own? Check it before you leave. Opens the camera."). The collapsed card: "Today, class: you went with your own, 8.0, Sharp. Shows the result."
- **VoiceOver:** the card is one element: "Outfit idea for class today. 48 degrees now, high 63, rain likely after 5 pm. Navy overshirt, grey tee, khaki chinos, brown boots." Custom actions: Wear this, Swap one, Change occasion.

---

### D13 · S20 What should I wear? → Outfit card
- **Presentation:** inline flow in S1 (code only, no AI, free). **Entry:** quick-start chip. **Exit:** buttons on the card.

**Thread**
1. His bubble: `What should I wear?`
2. Stylist: `Where to?`
3. **Occasion chips** (gap 6.5, wrapping, 5 chips, no Gym/Home here): `Everyday` · `Class/Work` · `Date` · `Interview` · `Event`. The tapped one flashes the `ac` style (accent border, accent text, `accentSoft` fill) and the row is replaced by his echo bubble.
4. His bubble: `Interview`
5. Stylist: `Career fair on the 29th, right? Business casual, and you can build it from what you own.` (a template that uses a saved Fact when one matches the occasion; otherwise `{OccasionTarget}, and you can build it from what you own.` e.g. `Business casual, and you can build it from what you own.`)
6. **Outfit card (hero)**:
   - Top: 4 tiles edge to edge, 1 pt `line` gaps (the grid's background), each aspect 1 : 1.05, no radius (the card clips): `oxford` light blue, `sweater` navy, `chino` navy, `loafer` brown.
   - Body (pad 14 / 16, gap 11.5): title `Sharp, not stiff` (17.5 semibold → `.headline`); description (`.subheadline`, `ink2`, line height 1.4, 2.5 below the title): `Light-blue oxford under a navy crewneck, navy chinos, brown loafers. Match a brown belt to the shoes.`
   - Actions: `Wear this` (primary) · `Swap one` (secondary) · icon button 36 `bookmark` (Save).

**Missing pieces (#380, Oct 28: replaces the dashed tile):** a slot the closet can't fill draws no tile; the pieces he owns fill the strip, and only the why line names a missing layer or coat. The dashed tile with `You'd need: {item}` looked tappable and did nothing, and the founder wants no add option on the card.

**Not enough closet** (no top + bottom + shoes yet): instead of the card, stylist says `I need your shoes to build outfits.` (or `I need a top, a bottom and shoes to build outfits.`) with chips `Snap them` · `Tap the basics you own` (→ C5).

**Interactions:** Wear this → logs the day (as in S1); Swap one → S28; Save → toggles `bookmark.fill`, toast `Saved to your Lookbook.`, and the outfit appears in L1b.

**VoiceOver:** chips are buttons; the card is one element ("Outfit idea for Interview: Sharp, not stiff. Light-blue oxford under a navy crewneck…"), custom actions Wear this, Swap one, Save.

**Differs from mockup:** none. (No follow-up question, since nothing is unknown.)

---

### D14 · N1–N3 Notifications (all three kinds)
- **Presentation:** local notifications (`UNUserNotificationCenter`), shown here on the lock screen. The lock screen itself is system UI; you only write the payloads. The system shows the app name "Kitted" as the header, so **leave `title` empty** and put the text in `body`.

| ID | When | Body (exact) | Template | Tap opens |
|---|---|---|---|---|
| N1 Daily idea | At his chosen time; the next 3 days are scheduled on each app open | `Today: navy overshirt, grey tee, khaki chinos, white sneakers.` | `Today: {item1}, {item2}, {item3}, {item4}.` (lowercase item names) | S1, scrolled to that idea card |
| N2 Fit check ready | A check finished while the app was in the background (only if already allowed) | `Your fit check is ready. 2 quick fixes inside.` | `Your fit check is ready. {n} quick fixes inside.` / `Your fit check is ready. 1 quick fix inside.` / `Your fit check is ready.` (0 fixes) | S1, that card |
| N3 Trial ending | Trial start + 12 days (2 days before the end), only for trial users | `Your trial ends Friday. Cancel before then and you won't be charged.` | `Your trial ends {weekday}. Cancel before then and you won't be charged.` | Y5 (not the paywall) |

**Rules:** that's the whole list. Never "we miss you," never streak guilt. After 3 delivered-but-unopened ideas, stop scheduling and post S29 once. No sound for N1; default sound for N2 and N3. Thread identifiers: `idea`, `ready`, `trial`.

**Differs from mockup:** none. (The mockup's lock-screen chrome, date `Thursday, October 22` and time `8:00`, is system UI; don't build it.)

---

### D15 · C1 Closet
> **Update Oct 8 (DECISIONS-LOG #84, #87, #88; wireframes `mockups/closet-concepts.html`). These override the layout below where they differ:**
> - **Pieces | Outfits** segmented control under the title. It opens on **Outfits once he can make 3+ outfits**, otherwise on Pieces, then remembers his last pick. Pieces is the layout below; the rotation card opens Outfits (not C6).
> - **Outfits:** occasion chips; `Try next` (not yet worn, best first, **no score shown**) and `Your go-tos` (worn: his kept photo + real score). Each outfit is a "standing outfit" tile (top / bottoms / shoes stacked, layer at the side) with a plain reason line from templates. Tap: `Wear this` → Stylist.
> - **Rotation count:** top + bottoms + shoes combos rated Put together (7.0+) at Everyday; layers don't multiply it.
> - **No outfits yet** (no top, bottoms or shoes): `No outfits yet` + a 3-row checklist (Top · Bottoms · Shoes, missing slot named: "Add shoes and you'd have {n} outfits") + `Scan a piece` (if built) · `Tap basics you own` · `Describe it` · `Check my fit`. Replaces `closet.rotation.locked`. 1–2 outfits: "{n} outfits so far" with the next unlock.
> - **C2 (piece):** `Goes with`: 3 standing outfits labelled `Best match` · `Dressier` · `More relaxed`; neutral `Worn {n}×` · `Last worn {date}` · `{n} outfits`; `Style this` → Stylist. No "not worn lately" nudges.
> - **C7 (next best buy):** named by kind and spec, never a brand; shows the outfits it unlocks with the new piece dashed; no shop links.
> - **C4 "+":** `Take photo` / `Choose photos` come back for v1 if the founder approves (#88); one photo may hold several pieces laid flat.

- **Presentation:** tab root, large title. **Entry:** tab. **Exit:** pushes and sheets below.

**Layout**
1. **Large title** `Closet` (34 bold, pad 5 / 21 / 10.5) with a trailing toolbar `plus` button (44 circle, `surface2`).
2. Content (pad 0 18, gap 13), in a ScrollView:
   - **Rotation card** (`KCard`, pad 14 / 16, gap 15.5):
     - Top row `space-between`: left: tagline `Your rotation`; under it (5 pt), Archivo 67.5 `37` + label (`.subheadline`, `ink2`, 2 lines, 5 pt bottom pad, gap 9) `fits your` / `closet makes`. Right: pill (`accentSoft` / `accent`) `+3 this week`.
     - **Starter essentials** (gap 8): row `space-between`, 14.5 (`.subheadline`): `Starter essentials` (semibold) · `8 of 12` (`ink2`); a 12-slot bar (12 equal columns, gap 4, each 8 tall, radius 4; owned = `ink`, missing = `surface2`).
   - **Next best buy card** (`KCard`, grid `60 | 1fr`, gap 14.5, pad 13 / 15.5): tile 60 (radius 15.5, `surface2`, grey `sweater` icon at 78%) · text: tagline `Next best buy`; title (16 semibold → `.callout.weight(.semibold)`, 2.5 below) `Grey quarter-zip ` + gain `+9 fits` (mono, `accent`); detail (`.footnote`, `ink2`) `$40–70 · Plain, no big logo. Layers over every tee you own.`
   - **Filter chips** (one scrolling row, no wrap, gap 6.5): `All 16` (selected) · `Tops 6` · `Bottoms 3` · `Shoes 4` · `Layers 3` (and `Extras {n}` when there are extras). Filters appear once he has 12+ items.
   - **Item grid** (3 columns, row gap 10.5, column gap 8): tile aspect 1 : 0.92, radius 18, `surface2`, cut-out or garment icon at 62%; minilabel under it (`.footnote`, `ink2`, gap 6.5). Items drawn: `Olive overshirt` · `White tee` · `Navy crewneck` · `Dark jeans` · `White sneakers` · `Denim jacket` + ` · no photo` (in `ink3`).
     - **Not photographed** ("ghosted"): transparent tile, 1.5 pt dashed `inkFaint` border, icon at 50% opacity.

**Tile image order (09 §2, ruling 12):** garment cut-out (pose regions + person mask) → plain crop → color icon. In the demo: color icons from seed data.

**Interim grid (Oct 8, #91), until P5 builds the rest of this screen:** the tiles are the **detailed graphic**: the garment icon in the piece's exact shade (core `displayHex`, always inside its color family) plus at most 3 detail marks (full / half zip, drawstrings, pockets, side stripe, cuffs, belt loops, collar and buttons, denim rips or fade, a graphic panel, stripes or checks, a chunky sole), a faint heather speckle or twill hatch, and a brand as a small neutral chest mark (the word only on C2's large tile; never a logo shape). Real crops from his photo replace them in phase 3. Newest first. Above the grid, one card per open question: tagline `A quick question` + the S11 duplicate question (both tiles, the same chips). VoiceOver per tile: name + what's drawn ("Medium grey Nike hoodie, drawstrings, cuffs, front pouch"). Demo screen **38**.

**Interactions**
| Element | Action |
|---|---|
| + | C4 menu |
| Rotation number / card top | C6 sheet |
| Starter essentials row | Push C5 |
| `+3 this week` pill | Nothing (decoration); VoiceOver reads it |
| Next best buy card | C7 sheet |
| Filter chip | Filters the grid |
| Item tile | Push C2 |

**States:** empty → C1e (§3). Fewer than top + bottom + shoes: the Rotation number is replaced by `Rotation unlocks with a top, bottoms and shoes.` (`.subheadline`, `ink2`) and essentials still show (pre-filled, e.g. `3 of 12`). Rotation 1: `1 fit your closet makes`. Nothing loads (all local).

**VoiceOver:** Rotation: "Your rotation: 37 fits your closet makes. Up 3 this week. Shows how it's counted." Essentials: "Starter essentials, 8 of 12." Next best buy: "Next best buy: grey quarter-zip, adds 9 fits, 40 to 70 dollars." Ghost tile: "Denim jacket, no photo yet." Plus: "Add an item".

**Differs from mockup:** none.

---

### D16 · L1 Lookbook (Calendar segment)
- **Presentation:** tab root, large title. **Entry:** tab, "Find a past fit check". **Exit:** push L2, L3.

**Layout**
1. Large title `Lookbook` (no trailing button).
2. Content (pad 0 18, gap 13):
   - **Segmented control** (native `Picker(.segmented)`, the mockup's `.segs.wide`: `surface2`, radius 13, segments 15.5 → `.subheadline.weight(.medium)`): `Looks` · `Calendar` (selected) · **`Saved`**.
   - **Your moves row** (only while moves aren't all done): a 52 pt row (`KCard`, pad 0 16): `checklist` icon + `Your moves` (`.subheadline.weight(.semibold)`) + trailing `1 of 3` (`ink2`) + chevron → L3.
   - **Intent counter** (row, gap 18, pad 2.5): Archivo 44 `4` + `this week` (`.subheadline`, `ink2`, gap 6.5) · a 1 × 34 `line` divider · Archivo 44 `19` + `total` · pushed right, a right-aligned 2-line label (mono 12, `ink3`): `Days dressed` / `with intent`.
   - **Calendar card** (`KCard`, pad 13 / 13 / 10.5):
     - Header row: `October 2026` (`.headline`) · `chevron.left` and `chevron.right` 19.5 `ink3`, gap 8 (each with a 44 hit area).
     - 7-column grid, row gap 2.5, centered: weekday letters `S M T W T F S` (12 → `.caption.weight(.semibold)`, `ink3`, 5 pt below). Day cells **44 tall** (the mockup's 34 is under the 44 pt hit minimum; 03 §5 CalendarMonth) (`.footnote`, `ink2`):
       - **Logged** day: `ink` semibold + a 5 pt `accent` dot 2.5 pt from the bottom.
       - **Today**: a 27.5 `ink` circle with the number in `surface`.
       - **Future**: `ink3` at 60% opacity.
       - **Current week** row: `surface2` band, rounded 10.5 at the ends.
       - Leading blanks so the 1st lands on its weekday (Oct 1, 2026 is a Thursday: 4 blanks).
   - **Look rows** (gap 13 between rows; grid `49.5 | 1fr | 21`, gap 13): photo 49.5 × 62.5 (radius 11.5, crop `neck`) · text: title (16 → `.callout.weight(.semibold)`) + detail (`.footnote`, `ink2`) · `chevron.right` `ink3`.
     - `Date · 8.0 → 9.0` / `Thu, Oct 22 · Full check · 1 fix`
     - `Everyday · 6.5` + pill (22 tall, 12 pt) `Partial` / `Tue, Oct 20 · Shoes not included`

**Below the calendar:** with no day selected, the rows list **this week's looks**, newest first. Tapping a day selects it (`ink` ring) and lists that day's looks and logged outfits; tapping it again clears it. A logged "Wear this" day without a photo shows a row with the outfit's 4 icons as a 2×2 thumb and `Wore an outfit idea`.

**Counter rule:** distinct days with a fit check or a "Wear this" log. No chain, nothing ever "lost."

**Interactions:** segment switch; month chevrons; day tap; look row → push L2; moves row → push L3.

**States:** Looks segment → L1a; Saved → L1b; empty and "Welcome back" → L1e.

**VoiceOver:** counter: "Days dressed with intent: 4 this week, 19 total." Each day: "October 22, today, 1 outfit logged." Month buttons: "Previous month", "Next month". Look row: "Date, 8.0 to 9.0, Thursday October 22, full check, 1 fix."

**Differs from mockup because…** the `Saved` segment and the `Your moves` row are added. *Because 10 §5.9–5.10 and 13 §2 (10's map) put Saved outfits and the pinned moves here; the mockup has no home for "Save" on an outfit card.*

---

### D17 · Y1 You
- **Presentation:** tab root, large title. **Exit:** pushes Y2, Y3, Y4, Y5, Y7, L3; P1.

**Layout**
1. Large title `You` + trailing toolbar `gearshape` (44 circle) → Y4.
2. Content (pad 0 18, gap 13):
   - **Profile card** (`KCard`, pad 14 / 16, grid `57 | 1fr | auto`, gap 15.5, centered): silhouette 57 × 80.5 (no tape caption) · title `5′10″ · Average · Regular fit` (17.5 semibold → `.headline`) + style pills (gap 5, 8 below): `Smart casual` · `Workwear` · trailing `Edit` (`.subheadline.weight(.semibold)`, `accent`).
   - **Tagline row** (pad 5 / 5 / 0): `What your stylist knows` / `All 9` (the count).
   - **Facts card** (`KCard`, rows pad 10.5 / 17, hairlines; title `.subheadline.weight(.semibold)` `ink`; detail `.footnote` `ink3`; trailing chevron):
     - `Likes straight-leg pants` / `From a fit check · Oct 12`
     - `Spends $30–60 an item` / `You told me · Oct 14`
     - `Career fair on Oct 29` / `You told me · Oct 20`
     - Guess row (title italic, medium weight, `ink2`): `Boldness: a little` / `My guess · not asked yet`
     (Show the 4 most recent; "All 9" opens the full list.)
   - **Plan card** (`KCard`, row, gap 13): `Free plan` (`.callout.weight(.semibold)`) + usage line (`.footnote`, `ink2`) · trailing outlined button (39 tall, capsule, 1 pt `line`) `Try Pro`.
   - **Your moves row** (while not all done): same as in L1.
   - **Privacy row** (pad 5, gap 11.5, `.subheadline.weight(.medium)`): `lock` (`ink3`) + `Your photos are saved on this iPhone` + chevron.

**Usage line on the plan card:** `Today: {checksUsed} of 1 checks · {questionsUsed} of 5 questions · resets at 4 am` (e.g. `Today: 1 of 1 checks · 2 of 5 questions · resets at 4 am`). Pro: title `Kitted Pro`, line `Up to 10 fit checks and 50 questions a day` (ruling 25 wording), button `Manage`. Trial: title `Pro trial`, line `Ends {date}. I'll remind you 2 days before.`

**Interactions:** Edit → Y2; All 9 → Y3; a fact row → Y3 fact sheet; Try Pro → P1; Manage → Y5; plan card body → Y5; moves row → L3; privacy row → Y7; gear → Y4.

**State (a):** facts card empty state: `I'll add what I learn here.` (`.subheadline`, `ink2`).

**VoiceOver:** silhouette hidden; profile card: "5 foot 10, average build, regular fit. Styles: smart casual, workwear. Edit." Fact: "Likes straight-leg pants. From a fit check, October 12." Guess: "My guess: boldness, a little. Not asked yet."

**Differs from mockup because…**
- The privacy row reads `Your photos are saved on this iPhone`, not `Your photos stay on this phone`. *Because ruling 18 and 13 §3 (CLAUDE.md L35): a face-free copy goes to Google, so "stay on this phone" overstates it.*
- The plan card's line shows today's usage instead of `Resets at 4 am`. *Because 10 §2 state (d) puts the usage here ("Checks 1 of 1 · Questions 2 of 5 · resets 4 am").*
- The Your moves row is added (10 §5.10).

---

### D18 · P1 Paywall, page 1 of 2
> **Update Oct 15 (#285, #291; `10-onboarding.md` §9.4):** built on a mock store, behind `PAYWALL_BUILT` (off on his phone). Headline `Up to {checks} checks a day.` / `Ask as you go.` (#233 item 4); perks from the quota's limits, without `Your full next-buy list` until C7 exists; the onboarding placement opens 2.5 s after the S14 card, only with Stylist in front and nothing reading; checkmarks in ink (copper only for a moving score, #231).

- **Presentation:** `fullScreenCover` with its own NavigationStack (page 2 is a push). **Entry (placements):** after S14 in onboarding (once; quitting here counts as shown), S17 "Try Pro · 14 days free", Y1/Y5 "Try Pro", a Pro-only feature (the full next-buy list, the 6th question). Never inside a progress moment. **Exit:** X or Continue free → back where he was; See plans → P1b.

**Layout**
1. **Nav** (44): leading X circle (44, `surface2`); trailing `Restore` (`.subheadline.weight(.semibold)`, `ink2`).
2. Content (pad 2.5 / 23.5, gap 17):
   - Woven label, copper variant: `KITTED PRO`.
   - Headline (31 bold → `.largeTitle.bold()`, tracking −0.025 em, line height 1.08): `Check every fit.` / `Ask anything.`
   - **Today card** (grid `49.5 | 1fr`, gap 13, pad 10.5 / 13, radius 18, `surface`, 1 pt `line`): photo 49.5 × 62.5 (radius 11.5, crop `neck`, his latest check) · `Today: 8.0 → 9.0` (16 semibold → `.callout.weight(.semibold)`) / `One free fix. Nothing new to buy.` (`.footnote`, `ink2`).
   - **Perks** (gap 9, `.callout.weight(.medium)`; each with an `accent` checkmark 15.5, gap 10.5): `Up to 10 fit checks a day` · `Up to 50 questions a day` · `Your full next-buy list, ranked`.
3. **Bottom** (gap 6.5):
   - PrimaryButton large: `See plans`.
   - Ghost button 44 (`.body`, `ink`): `Continue free`.
   - Links (centered, gap 18, 12.5 → `.caption`, `ink3`): `Terms` · `Privacy`.

**Today card variants:** after a re-check: `Today: {before} → {after}` / `One free fix. Nothing new to buy.` (or `{n} free fixes. Nothing new to buy.`). No re-check: `Today: 6.5` / `Two free fixes to 8.0.` (template `{n} free fixes to {target}.`; `One free fix to {target}.`). Dialed in: `Today: 9.0` / `Dialed in on your first check.` Not from onboarding: his latest check, or hide the card if he has none.

**Interactions:** X / Continue free → dismiss (logs `paywall_closed`); Restore → `Entitlements.restore()` (`DemoStore` in the demo, RevenueCat's `restorePurchases()` in v1), then toast `toast.restored` or `toast.nothingRestore`; See plans → push P1b; Terms / Privacy → `SFSafariViewController`.

**VoiceOver:** X "Close". Today card: "Today: 8.0 to 9.0. One free fix. Nothing new to buy." Woven label "Kitted Pro".

**Differs from mockup because…**
- **The paywall is two pages** (ruling 23 and ruling 6). Page 1 is his result + what Pro adds (this screen); the plan cards, the trial button and the fine print move to **P1b**, our own plans page (React Native has no `SubscriptionStoreView`; `05` P6, `06` §7). The primary button here is `See plans` instead of `Start 14-day free trial`.
- **`Unlimited questions` becomes `Up to 50 questions a day`** (ruling 25: a hidden cap behind "unlimited" is a 3.1.2 / 2.3.1 accuracy risk). `Up to 10 fit checks a day` is already in the mockup.

---

### D19 · S17 Limit card
- **Presentation:** inline card. **Entry:** a capture after the free check (and its re-check) is used. The shutter still works and the photo is held. **Exit:** Save for tomorrow → S17h; Try Pro → P1.

**Thread**
1. Day stamp `Thursday 9:12 pm`.
2. His photo bubble, caption `Everyday` · `9:12` (crop `neck`).
3. **Limit card** (`KCard`, pad 14 / 16, gap 13):
   - Tagline: `Daily limit` / `Resets at 4 am`.
   - Headline (19.5 semibold → `.title3.weight(.semibold)`, line height 1.25): `That's today's free check.`
   - Body (`.subheadline`, `ink2`): `I'll save this photo and score it when you open Kitted after 4 am. Questions still work tonight: 3 left.` If the re-check is still open, append ` Today's re-check still works.` If no questions are left: `I'll save this photo and score it when you open Kitted after 4 am.`
   - Buttons (stacked, gap 8, each 49.5 tall, radius 24.5, full width): PrimaryButton `Save for tomorrow` · SecondaryButton (`surface2`) `Try Pro · 14 days free` (trial already used: `Try Pro`).

**Nav subtitle:** `Check used today`.

**Rules:** the free path is the default. No blurred score, no "upgrade to see." Nothing is sent.

**Interactions:** Save for tomorrow → status `held`, the card becomes S17h; Try Pro → P1 (if he buys, the held photo is scored right away with a toast `Pro is on.`); ignoring it = held anyway (the photo stays, labeled `Waiting to score`).

**VoiceOver:** "Daily limit. That's today's free check. I'll save this photo and score it when you open Kitted after 4 am. Questions still work tonight, 3 left." Buttons as labeled.

**Differs from mockup because** `Go unlimited · 14 days free` becomes `Try Pro · 14 days free` (ruling 25: Pro is capped at 10 a day, so "unlimited" is inaccurate). Bubble crop `neck` (§0.4).

---

### D20 · S12 Share card
- **Presentation:** `fullScreenCover`, always dark (background `#08090D`). **Entry:** Share on S6/S6r/S6p/L2. **Exit:** X.

**Layout**
1. **Nav** (44): leading glass X (44, white 16% + blur); centered title `Share` (`.headline`, white).
2. **Card preview** (pad 8 / 39 / 0 → 324 wide; aspect 9 : 16 → 576 tall; radius 18; heavy drop shadow; clips):
   - Photo: top 76% of the card, crop `neck`, the latest photo of this look (`p01a` after a re-check).
   - Occasion pill at top-left (15.5 inset): pill `Date` with `rgba(18,22,40,.55)` fill, white text, blur 10.5.
   - **Band** (bottom 24%, fill `#121628`, top border 1 pt dashed `rgba(222,151,98,.6)`, pad 13 / 18 / 15.5, content at the bottom, gap 8):
     - Row (aligned bottom, gap 13): Archivo 73 white `9.0` · stack (5 pt bottom pad): `Dialed in` (18 bold → `.headline`), `8.0 → 9.0 after 1 fix` (mono 13 `#DE9762`, no wrap).
     - Watermark at the band's top-right (13 / 15.5 inset): `scored by ` (mono 11 → 12, white 60%) + `KITTED` (Archivo wide, 10.5, letter-spaced, white).
3. **Share actions** (centered row, gap 28.5, pad-top 23.5, white): three 57 circles (white 12%) with icons 26 and labels under them (`.footnote.weight(.semibold)`, gap 6.5): `photo` `Story` · `square.and.arrow.down` `Save` · `square.and.arrow.up` `More`.

**Card variants:** single check: score + word, second line `{Occasion} · Full check` (or `Partial check: shoes not included`, which must always show on a partial). Re-check: as drawn (`{before} → {after} after {n} fix` / `fixes`).

**Interactions**
| Element | Action |
|---|---|
| Story | Renders 1080 × 1920 with `ImageRenderer` and opens `ShareLink` (Instagram, TikTok, Messages appear there). The Instagram Stories sticker API waits for v1.1 |
| Save | Saves the 1080 × 1920 image to Photos (add-only; first use triggers the `NSPhotoLibraryAddUsageDescription` prompt, ruling 26). Toast `Saved to Photos.` Denied → toast `Photos access is off. Turn it on in Settings.` |
| More | `ShareLink` with the 1080 × 1350 feed version |
| X | Dismiss |

**Rules:** never gated, neck-down by default, the face never appears (there is none stored). If pose failed for this photo, use a collage of his garment cut-outs instead of the photo (09 §6).

**VoiceOver:** the card is an image: "Share card: Date, 9.0 out of 10, Dialed in, 8.0 to 9.0 after 1 fix, scored by Kitted." Buttons "Share to Story", "Save to Photos", "More sharing options".

**Differs from mockup:** the Save icon is `square.and.arrow.down` (the mockup's up-arrow). Watermark stays `scored by KITTED` (09 suggested adding `trykitted.com`; the mockup wins; add the URL only if the founder asks).

> **Update Oct 18 (DECISIONS-LOG #347): one card in two versions, after Strava's share stickers; replaces the layout above and the first set (#346).** Demo page `mockups/share-card.html`. Code: `app/src/features/share/` (`shareModel.ts`, `ShareCard.tsx`, `ShareScreen.tsx`, `exportCard.ts`, `shareNative.ts` + `offer.ts`); tests `app/src/__tests__/shareCard.test.ts`; demo screens 20 (re-check win) and 230 (single check).
> - **The overlay:** white stats, a small label over a 40 pt Archivo value (a single check: Score "8.0/10" · Rating "Sharp"; a re-check that went up: Before · After · Change), the tape (5 to 10 in halves; a copper dot on the score, a hollow dot on the "before"), then the KITTED wordmark (11 pt). Copper is the dot only. No occasion, fix, date, pieces, sign-off line or Kit.
> - **Transparent:** the overlay alone, no background, a 1080 × 600 PNG (the preview shows it on a checkerboard): "Save it, then add it to your own photo or video."
> - **Solid (#348–349):** the same overlay on a ground, the same 1080 × 600, rounded 24 pt corners (outside them the PNG stays transparent). **Dark:** white on indigo #121628. **Light:** indigo ink #121628 on chalk #F3F4F6, the dot in copper #9C5326. "Light | Dark" under Solid, starting in the phone's appearance.
> - **With photo:** the same overlay on his photo, full bleed 1080 × 1920, a soft night shade over the bottom (clear to 45%, 35% by 65%, 65% at the bottom), the overlay's bottom 132 pt up (above Instagram's bottom 20%), a light text shadow. "Neck down | Full photo", neck down every time; neck down needs the measured head line and the image size, else the overlay shows on night with "I can't tell where this photo starts below your face, so this version shows the score on its own."
> - **The screen:** "Transparent | Solid | With photo" (opens on With photo), the face toggle under it for the photo version, Share and Save (Photos, add-only), a status line ("Saved to Photos." / "Photos access is off. Turn it on in Settings." / "Couldn't make the image. Try again.").
> - **Offered:** a scored full check at 7.0+, or a re-check that went up; never a partial. The card's Share button waits for a build with the native modules.
> - **Checks SC1–SC7 (Oct 18):** SC1 offered (pass) · SC2 two versions of one overlay, the sticker with no background (pass) · SC3 what it says, copper only on the dot (pass) · SC4 the face crop, neck down by default and not stored (pass) · SC5 above Instagram's bottom 20% (pass) · SC6 Share and Save (in tests; **not yet run on iOS**) · SC7 VoiceOver, one image with the score once (tests; not heard on a device). Seen on the web preview, demo screens 20 and 230, both versions. **Not yet seen:** the PNG's transparency and the capture on iOS (needs the native build).

---

## 3. Screens not drawn yet

Same visual language as §2: chalk `bg`, white `KCard`s with radius 26 and dashed seams, `ink` primary buttons, `accent` only for gains, "+N fits", links and the active tab, SF Mono 12 sentence-case taglines, Archivo for numbers. Copy here is new and is now the spec (keys in §5).

### 3.1 Onboarding

#### O1e · Example check
- **Presentation:** onboarding push (from O1 "See an example check" or O5 "See an example first"); also a sheet from S1/S26 "See an example" (with an X).
- **Layout:** onboarding nav with Back (no progress bar). Stylist message `Here's a real check. This is what you'll get.` Then a full **S6 card** for the bundled example photo `s15` (crop `neck`): tagline `Example · Full` / `Everyday`, `8.5` `Sharp`, the bundled reading's fixes and explanation, `Why 8.5?` works (S7 opens read-only), `Not quite right?`, `Re-check` and `Share` are hidden. Dock: PrimaryButton large `Get started` (from O1) or `Check my own fit` (from O5 / S26, which returns to consent).
- **Rules:** no API call, no consent needed (this is also the App Review demo). Nothing is added to his closet.
- **VoiceOver:** card label starts with "Example fit check."

> **Update Oct 15 (#289; built):** the photo is s14 (the Welcome photo), the score is the engine's (7.5 "Put together", the same as Welcome's mini card), his photo bubble shows above the card, `Why 7.5?` opens the math in place under the card (onboarding has no sheet stack of its own), and a fine-print line says `A real photo, scored by the same code as yours. Nothing was sent.` The tagline is `Example · Full` / `Everyday`.

#### O2n · Pick by name (sheet)
- Medium detent, grabber, title `Pick by name` (`.title2.bold()`) + Done.
- Subtitle `Up to 3. You can change these later in You.`
- Chips (wrapping, single tap toggles, max 3, a 4th tap shakes): `Smart casual` · `Minimal` · `Old money` · `Workwear` · `Vintage sport` · `Streetwear` · `Preppy` · `Outdoor` (keys `smart_casual`, `minimalist`, `old_money`, `workwear`, `vintage_sport`, `streetwear`, `preppy`, `gorpcore`).
- Done → back to O2 with those picks reflected as `Continue · N of 3` (photo tiles stay unselected).

#### O3w · Birth-year wheel (sheet)
- `.height(320)` detent, grabber, title `Birth year` + `Done` (disabled until a real year is chosen).
- A `.wheel` Picker whose **first row is a blank placeholder `Choose`** (selected on open), followed by years from the current year down to current − 100. Nothing hints at a cutoff; no "you must be 18" copy anywhere.
- Done → value saved locally only (never sent; ruling: "Never: face, birth year…"). VoiceOver: "Birth year picker."

#### O4 · Age stop
- **Presentation:** replaces the whole app (root view), no tab bar, no Back, no X. **Terminal:** relaunching shows it again (Keychain flag, which survives "Delete all my data").
- **Layout:** centered column, pad 0 28.5: woven `KITTED` label; title `.title2.bold()` `Kitted is for ages 18 and up.`; body `.body` `ink2` `Thanks for checking it out. You can delete the app from your Home Screen.`
- **No** "try again," no birth-year edit, no link back (build spec O3: "there's no 'try again' hint, and Back doesn't reopen the question").
- **VoiceOver:** title is a header.

### 3.2 Stylist: capture

#### S3 · Retake prompt (inline in S2)
> **Update Oct 8 (built, DECISIONS-LOG #100–102):** runs after every capture and library pick (`assess` measures, `fitIssue` decides; ~0.1–0.3 s on a phone, 1.2 s on the Simulator's CPU), the photo frozen behind and the pill reading `Checking the photo…`. Added reason: `Too bright behind you. Face the light and try again.` (Use anyway: yes). Too dark with the flash off: the primary button is `Retake with flash`. A library photo's primary button is `Choose another`. No person / can't frame now show here instead of a toast after the cover closes; when no person is found because it's dark or blurry, the title says that (still no Use anyway). **Lens smudge is not built** (can't be told from blur on the phone). Shoe snaps are only checked for light and blur. Demo screens 44–45.

- **Presentation:** inside the camera cover, after a capture or library pick, in under 150 ms. The frozen photo stays behind; a bottom panel (`surface` fixed dark `#171A23`, radius 38, inset 8, pad 20, gap 12) slides up.
- **Layout:** icon 26 (`exclamationmark.triangle`) · title (`.headline`, white) · body (`.subheadline`, white 75%) `This one doesn't count.` · buttons stacked: PrimaryButton large `Retake` (white fill, `#121628` text) · SecondaryButton large `Use anyway` (white 16%).
- **Reasons** (title copy):
  | Reason | Title | "Use anyway"? |
  |---|---|---|
  | Too dark | `Too dark: face a window or turn on a light` | yes |
  | Blurry | `Too blurry. Hold still and try again.` | yes |
  | Lens smudge | `Wipe your lens` | yes |
  | No person | `I can't find you in this photo.` | no |
  | Can't remove the face (pose and face detection both failed) | `Couldn't frame this one. Try again.` | no (ruling 10: never send it) |
  | 2+ people | (no panel) → S23 "Which one is you?" after the cover closes | — |
  | Shoes cut off | **not a retake reason**: continues as a partial check | — |
- **VoiceOver:** the title is announced when the panel appears.

#### S4 · Photo picker
- System `PhotosPicker` (`.images`, single selection for a check; `maxSelectionCount: 20` for Closet "+"). No permission and no plist string. Re-encode through ImageIO to strip EXIF/GPS. A pick goes through S3, then S5.
- **Screenshot heuristic** (screen-sized pixels and no camera Make/Model): before scoring, post a Question card `Is this you?` with `Yes, it's me` · `No, just ideas`. "No" → inspiration mode: no score, nothing added to the closet or Lookbook; the stylist describes what works in the outfit (as a question answer, counts as a question).

#### S9 · Shoe snap camera
- **Presentation:** `fullScreenCover`, fixed dark, **rear camera** by default. **Entry:** the camera tile on S6p. **Exit:** X, or a capture.
- **Layout:** same chrome as S2 (X top-left, flash top-right, shutter + flip at the bottom; no mode switch, no countdown, no library button). Tip pill: `Hold your phone at knee height, pointed at your feet.` Guide: a rounded rectangle across the lower 40% of the preview, white 2 pt dashed, labeled `Shoes and hems here` (`.footnote.weight(.semibold)`, white).
- **Top-only partial** uses the same screen with tip `Step back so your pants and shoes are in frame.` and a guide over the lower 60%.
- **After capture:** the cover closes; his bubble shows the snap (caption `Shoe snap` · time) and the card updates in place (S6p). Never uses a check or the re-check. Failure → a toast `Couldn't read your shoes. Try again or pick a pair.` and the Finish row stays.
- **VoiceOver:** shutter "Take shoe photo".

> **Update Oct 16 (built, DECISIONS-LOG #313, `12-two-shot-check.md` §10–11):** the top-only variant is built: opened from a top-only card's camera tile (`part=bottom`), tip `Point your phone down at your pants and shoes.` (differs from the line above because the rear camera points at him: he looks down at his own pants and shoes), guide over the lower 60% `Pants and shoes here`, shutter VoiceOver "Take a photo of your pants and shoes", bubble caption `Pants and shoes`; the merge is `mergeBottomSnap` (the card becomes `Full check`). A failed snap now shows its toast (`Couldn't read your shoes. Try again or pick a pair.` / `Couldn't read your pants and shoes. Try again.`); it showed nothing before. Snap photos are prepared without needing a person (faces still hidden). In S2's Mirror mode with no hips found, the tip is `Can't step back? Prop your phone up instead.` with a `Use Propped` pill. Demo screens 185–188.

#### S10 · Pick shoes from Closet (sheet)
- Medium detent, grabber, title `Which shoes?` + X. Subtitle `I'll use what I know about them. Hems stay unrated.`
- Grid of his shoes (3 columns, tiles as in C1, minilabel). The last-worn pair is first with the pill `Last worn {weekday}`.
- Last row: a dashed tile `Not here? Snap them` → S9.
- Tap a pair → applies, dismisses; card label becomes `Full check (shoes from your closet)`. No API.

#### S11 · Added items review (sheet)
- **Entry:** `Review` on a card's closet row. **Detent:** medium + large. Title `Added to your closet` + `Done`. Subtitle `From this check. Fix anything I got wrong.`
- **Since Oct 8 (DECISIONS-LOG #91), the closet is written after the score card shows,** from a separate closet call (shade, details, logo text, shape). While it's out (at most 12 s) the rows come from the reading, with the detail `Checking the details…` and no Undo; then the rows are the real pieces (or, offline / slow, the pieces written from the reading alone; a late answer adds the details).
- **List (new pieces):** one row per item, same shape as S8's garment rows (44 tile with the detailed graphic, name `.subheadline.weight(.semibold)`, detail `.footnote` `ink2`, e.g. `Top · Regular fit`), trailing `Undo` button (`arrow.uturn.backward`, `ink2`, 44 hit). Names: `{shade} {Brand} {detail} {garment}` ("Medium grey Nike hoodie"); see #91.
- **Duplicate question** (inline under the row of a piece the stylist wasn't sure about): `Same as your khaki chinos?`, two 64 pt tiles `This photo` · `In your closet`, chips `Yes, same one` · `No, a new one` (+ `It's my {runner-up}` when a second piece was close). Until he answers, the piece is its own item (a duplicate does less harm than a wrong merge). "Yes" folds it into the existing item (wornCount +1; a different type read becomes an alias). "No" keeps both and they're never asked about again. Answered: `Saved as your khaki chinos.` / `Kept as a new piece.` + `Change` (re-answerable). At AX sizes each tile gets its own row with the caption beside it.
- **Already in your closet** (section, `.footnote.weight(.semibold)` `ink2`): the pieces this photo matched, with `Not the same` (accent text link): that sighting becomes its own piece and the two are never matched again.
- **Tap a row** → C3 Edit item (the sheet's own push). **Undo** → removes that item (it stays in the reading; Rotation updates), row shows `Removed` + `Add back`.
- **VoiceOver:** "White tee, top, regular fit. Actions: Edit, Undo." Matched: "White tee, already in your closet. Top, regular fit. Actions: Not the same." The question reads both tiles: "Same as your khaki chinos? This photo: Tan chinos, belt loops. In your closet: Khaki chinos, belt loops."
- **The card's row** reads `Added 3 to Closet · 1 question`, `2 already in your closet` when nothing was new, or `Checking the details…` while pending (`summaryText.ts`).
- **Differs from the spec above (Oct 8):** the duplicate question shows both tiles; the third chip and the "Already in your closet" section are new (#91). Demo screens **37** (p01b vs seed T1/B1/S1) and **21**.

#### S13 · Photo viewer
- `fullScreenCover`, black, the stored neck-down copy (the only copy), pinch to zoom, double-tap zoom, swipe down to dismiss, X top-left (glass). Caption at the bottom (`.footnote`, white 75%): `{Occasion} · {date}`. For a look with a shoe snap, swipe left/right between the photo and the snap (page dots).
- VoiceOver: "Your outfit photo, October 6." Never describes the body.

### 3.3 Stylist: cards and states

#### S14 · Your first 3 moves (Plan card)
> **Update Oct 15 (#291; `10-onboarding.md` §9 owns the order and triggers):** built. Move 2 is the first check's top fix word for word with its tag (the habit wording below needed new copy per fix); move 3 is the Starter piece that adds the most outfits (`Add {item}`, budget price, `+N fits` only when N > 0); Start move 2 opens the camera with no extra line; Start move 3 opens C5 (C7 isn't built); a done row is the filled circle and grey title (no strikethrough, #246 (14)). **L3 and the pinned rows built Oct 15 (#292, `10-onboarding.md` §9.9):** the row is the first row of Lookbook and You; L3 gives every move left its own Start; the done check is the row's own badge.

- **When:** after his first re-check card, or right after he taps `Later` on the first check (ruling 23). Then P1 is presented.
- **Thread:** stylist message `Here's where to start. Three moves, in order.` then the card.
- **Card** (`KCard`, pad 14 / 16, gap 12): tagline `Your plan` / `3 moves`; title `.headline` `Your first 3 moves`; three rows in the FixRow shape (number circle, title `.callout.weight(.semibold)`, subtitle `.footnote` `ink2`, no gain on the right; a done row uses the filled circle + strikethrough):
  1. `Tap the basics you own` / `30 seconds · in Closet` (always move 1)
  2. Built from today's top fix as a habit, e.g. `Wear a layer open over a tee` / `Free · you own one now`
  3. Built from the Starter 12 gap with the most "+N fits", e.g. `Add a grey quarter-zip` / `$40–70 · +9 fits`
  - Button: PrimaryButton regular, full width, `Start move 1`.
- **Interactions:** Start move 1 → switches to Closet and pushes C5. Moves 2 and 3 get their own `Start` when it's their turn (move 2 → the camera with a stylist line `Show me the layer and I'll check it.`; move 3 → C7).
- **Persistence:** the moves live in L3 and are pinned atop Lookbook and You as `Your moves · 1 of 3`.
- **Dialed-in first check:** move 2 becomes the rubric's "next level" idea (`Try one standout color` / `Free · next time you get dressed`).
- **VoiceOver:** "Your first 3 moves. 1, tap the basics you own, 30 seconds. 2, …" Custom action Start move 1.

#### S15 · Notification ask (Question card)
- **When:** after P1 is dismissed in onboarding (bought or not). Asked once.
- **Thread:** stylist `Want a daily outfit idea at a time you choose?` then a Question card: PrimaryButton regular `Yes, pick a time` · SecondaryButton regular `No thanks`.
- **Yes** → the card expands in place: a compact `DatePicker(.hourAndMinute)` defaulting to 8:00 am, label `Daily idea at`, and PrimaryButton `Set {time}` (e.g. `Set 8:00 am`). Tapping it shows **Apple's system prompt** (the only place it's asked). Allowed → card becomes `Done. Your first idea lands tomorrow at 8:00 am.` Denied → `No problem. You can turn it on later in You → Settings → Notifications.`
- **No thanks** → `No problem. You can turn it on later in You → Settings → Notifications.` The system prompt is never shown.
- **VoiceOver:** standard.

#### S17h · Held check ("Waiting to score")
- **Status:** `held` FitCheck (ruling 27): never auto-sent; one tap scores it.
- **After "Save for tomorrow"** the Limit card becomes: tagline `Waiting to score` / `After 4 am`; text (`.subheadline`) `Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.`; link `Don't score it` (`ink2`).
- **After 4 am, on open:** a stylist message `Ready to score last night's photo?` with PrimaryButton `Score it` · SecondaryButton `Not this one`. Score it → S5 → S6 (uses that day's check). Not this one → the photo is deleted (it was never sent).
- **Lookbook:** a held photo shows as a look row with detail `Waiting to score` and no score.
- **VoiceOver:** "Photo waiting to score after 4 am."

#### S18 · Camera off
- **When:** camera permission denied (or restricted) and he taps Check my fit.
- **Card:** icon `camera` with a slash (`video.slash` or `camera` + `xmark`), text `Camera is off for Kitted. You can still choose a photo.`; buttons PrimaryButton `Choose a photo` (→ S4) · SecondaryButton `Open Settings` (opens `UIApplication.openSettingsURLString`).
- If the device has no camera (Simulator): `Choose a photo` only.

#### S19 · Failure cards (nothing counts)
The photo bubble stays; its caption becomes the status. Card (`KCard`, pad 14 / 16, gap 10): icon (`exclamationmark.triangle`, `ink2`) + text (`.subheadline`) + buttons.

| ID | When | Text | Buttons | Bubble caption |
|---|---|---|---|---|
| S19a AI failed | Server or model error | `I couldn't score this one. It didn't use your check.` | `Try again` | `Not scored` |
| S19b Timeout | 16 s app timeout | `That took too long. Try again. This one doesn't count.` | `Try again` | `Not scored` |
| S19c Offline | No connection at send time | `You're offline. Fit checks need a connection. Your photo is saved here.` | `Retry` | `Not sent · Retry` |
| S19d Paused | Kill-switch or quota service down | `Fit checks are paused for a bit. Your photo is saved. Try again later.` | `Try again` | `Not sent` |
| S19e Couldn't frame | Server-side refusal of the crop | `Couldn't frame this one. Try again.` | `Retake` | `Not sent` |
| S19f Question failed | `/ask` error | `I couldn't answer that. It doesn't count.` | `Retry` | — |

`Try again` re-sends the saved processed copy (no new photo). Nothing is added to the closet, no look is created, no check is used. The old copy "That's on me" from 10 is **not** used. *Because the voice rules say errors state what happened and what to do, with no apologies.*

#### S21 · Re-check: change not seen + "Tell me"
- **Change not seen** (the merger finds the target fields unchanged): the re-check card shows the same score with summary `I still see the overshirt in your hand.` (template `I still see {problem}.`) and two buttons: PrimaryButton `I did wear it` (template `I did {fixPast}`: `I did cuff them`, `I did tuck it`) · SecondaryButton `Try another photo` (opens S2; doesn't use another re-check).
- **"Tell me" sheet** (from `Didn't catch the change? Tell me`): medium detent, title `What changed?` + X. One row per suggested fix with a checkbox chip `Done`. Preview line as in S8 (`Score 8.0 → 9.0`). PrimaryButton `Update score`. Result: target fields set as fixed in a corrected Reading, re-scored, a Correction logged (`kind = fixConfirmed`), card summary gains `You confirmed it.`
- **VoiceOver:** standard.

#### S22 · Dialed-in card
- **When:** no fix gains ≥ 0.5 (build spec §2.3).
- Same as S6, but the fixes block is replaced by: title `This is dialed in. Nothing to fix.` (`.callout.weight(.semibold)`) and the tip line `Next level` + the rubric's advice (e.g. `One standout color, like a rust tee. No score change today.`). The Re-check button is replaced by `Save this look` (bookmark); Share stays.
- First-ever check dialed in: S14 still follows (move 2 = the next-level idea).

#### S23 · Not rated, unreadable, not clothed, other people
| Case | Card | Score? | Saved? |
|---|---|---|---|
| **Traditional / cultural garment** | Normal card with a pill on that garment's line and the summary `Your kurta isn't rated. I score everything else.` (template `Your {garment} isn't rated. I score everything else.`). S7 shows it as `not rated` | Yes, without that garment | Yes |
| **Unreadable** (model can't read it) | `I can't read this one. Try a brighter spot.` + `Retake` | No; doesn't count | No |
| **Not fully clothed** | `I score outfits you'd wear out.` + `Try another photo` | No; doesn't count | **Nothing saved, local file deleted** |
| **2+ people** | Question card `Which one is you?` with the photo and a tap target over each detected person (outline on tap) + `Cancel` | After the tap | Others are masked out; their clothes never enter his closet |
| **Face / body request** (typed) | Stylist text `I rate outfits, never people.` | — | — |

#### S24 · I bought something → Item card
- **Entry:** quick-start chip. A confirmation dialog titled `Add something new`: `Take photo` (item camera, see C4) · `Choose photo` (S4) · `Describe it` (C4d) · `Cancel`.
- **Item read** (photo): a skeleton item card with the stage `Reading your new piece` (not a check or a question; fair use 20 a day). **Demo:** there are no bundled item readings, so Take photo / Choose photo end in `This demo only knows its sample photos. Use Describe it.` (key `item.demoOnly`); `Describe it` (C4d) works fully, since it's code only.
- **Item card** (`KCard`, pad 14 / 16, gap 12):
  - Tagline `Added to Closet` / `New`.
  - Row: tile 60 (cut-out or icon) · title `Grey quarter-zip` (`.callout.weight(.semibold)`) · detail `Layer · Grey · Regular fit` (`.footnote`, `ink2`) · gain `+12 fits` (mono, `accent`).
  - Line (`.subheadline`, `ink2`): `Rotation 21 → 33` with the arrow and the new number in `accent`.
  - Actions: SecondaryButton `Undo` · SecondaryButton `Edit` (→ C3).
- **At most one follow-up question** after it, as a Question card: `How does it fit?` chips `Slim` · `Regular` · `Relaxed`. **Budget is asked here first** (once ever): `Roughly what do you spend on one piece?` chips `Under $30` · `$30–60` · `$60–100` · `$100+` · `Skip`.
- **Duplicate:** `Same as your grey quarter-zip?` chips `Yes, same one` · `No, a new one`.
- **Fair-use limit (20 item reads a day):** `That's a lot of new stuff today. Add the rest in Closet with Describe it.`
- **VoiceOver:** "Added grey quarter-zip. Adds 12 fits. Rotation 21 to 33." Actions Undo, Edit.

#### S25 · Ask a question
- **Update Oct 14 (#265):** the full chat plan is `handoff/07-stylist-chat.md`; it adds the states below S25 doesn't cover (taking longer, paused, one question in flight, draft kept, what counts) and keeps the starter chips inside the opened composer.
- **Entry:** quick-start chip or typing in the field.
- **Starter chips** (above the composer while the field is focused and empty; one scrolling row, chip style as quick-starts, no icons): 3 from templates using his closet, e.g. `What goes with my navy crewneck?` · `How should chinos fit?` · `Can I wear white sneakers to an interview?`
- **Sending:** his text bubble; a typing indicator (three 6 pt `ink3` dots pulsing; static "…" with Reduce Motion) in the stylist's position; the answer streams in as plain stylist text, VoiceOver announces it once complete. At most one follow-up question per reply (as a Question card with tap answers).
- **Quota (free 5 a day):** the nav subtitle shows `{n} questions left today` when 3 or fewer remain. At 0: stylist text `That's today's 5 questions. More at 4 am, or go Pro for up to 50 a day.` with SecondaryButton `Try Pro` (→ P1). Pro at 50: `That's 50 questions today. More at 4 am.`
- **Offline:** send disabled, draft kept, G1 banner.
- **Distress words** (on-device list) → S27 instead of sending.
- **Demo (no text model):** a mock `AnswerSource` returns the seeded answers for the seeded questions (`seed.json → chatThread` M15–M18) and, for anything else, the honest line `This demo can't answer new questions yet. The real app will.` (key `ask.demoOnly`). It still counts toward the 5 a day so the quota states can be shown.

#### S26 · Turn on fit checks (no consent) + See an example
- **State (a)**, after "Not now" on O5, or after consent is withdrawn in Y7.
- **Thread:** stylist with "who" header: `Send me a fit. I'll score it and start your closet.` Then a card: title `.headline` `Turn on fit checks`; body (`.subheadline`, `ink2`) `To score a photo, I need your OK to send a face-free copy to Google's Gemini API.` (provider from config); PrimaryButton `Review and turn on` (→ O5 as a sheet with X) · SecondaryButton `See an example` (→ O1e as a sheet).
- The composer's camera and send are visible; tapping them opens O5 as a sheet. Questions are blocked too (they also go to the AI). Closet "Describe it" and Lookbook still work.

#### S27 · Support card and refusals
- **Distress** (an on-device word list catches it **before** anything is sent; no styling content): a card with `heart` icon in `ink2`, text `That sounds like a lot right now. If you're in the US, you can call or text 988 any time to talk to someone.` and PrimaryButton `Call or text 988` (opens a choice: `Call 988` → `tel:988`, `Text 988` → `sms:988`). Nothing is logged except the event name.
- **Face or body rating requests:** `I rate outfits, never people.`
- **Off-topic:** `I'm best at clothes. Ask me about an outfit, a fit or what to buy next.`

#### S28 · Swap one (sheet)
- Medium detent, title `Swap one piece` + X. Subtitle `Tap the piece to change.`
- Row of the outfit's 4 tiles; tapping one shows, below, the alternatives from his closet for that slot that still pass the outfit rules (3-column grid, each with its "fits" count hidden). Tapping an alternative updates the outfit card in place and dismisses. No alternatives: `Nothing else in your closet works here yet.`
- Code only, free.
- **Built Oct 23 (#377, 09-ui-review §28; differs from this spec in two places):** "works" is the card picker's own rules (allowed for the occasion and weather, the weather's layer rule, `outfitValid`, and at least Put together, or the card's own score when lower), best first; a pick shows the toast `Swapped in your {piece}.` with Undo (8 s), since a piece swapped away stays out of that card (#353). Over the grid: `Instead of your {piece}`. Nothing is picked when the sheet opens.

#### S29 · Unopened ideas question
- **When:** 3 daily ideas delivered and none opened. Scheduling stops; asked once.
- Stylist: `I've sent 3 ideas you didn't open. Want me to keep sending them?` chips `Keep them coming` · `Change the time` (→ the S15 time picker inline) · `Stop for now` (turns off N1; Y6 shows it off).

#### S30 · Buy suggestion card
- **When:** he asks what to buy, or a move says so. Card: tagline `Next best buy` / `+9 fits`; tile 60 + `Grey quarter-zip` / `$40–70 · Plain, no big logo.`; text `Layers over every tee you own.`; SecondaryButton `What to look for` (→ C7). Free users see the top pick; `See the full list` → P1 (a Pro feature).
- **Update Oct 14 (#265):** the full list is free too (it comes from code, and everything that runs on code is free, CLAUDE.md); `See the full list` opens it for everyone. In chat, the `+N` and the kind come from code; the stylist only words it (`07-stylist-chat.md` §5).

### 3.4 Closet

#### C1e · Closet empty
- `ContentUnavailableView`-style, centered under the large title: icon `hanger` (44, `ink3`); title `.title3.weight(.semibold)` `Your closet builds itself.`; body (`.subheadline`, `ink2`) `Do a fit check and I'll add what you're wearing.`; PrimaryButton regular `Check my fit` (→ Stylist `.checkMyFit`) · SecondaryButton regular `Tap the basics you own` (→ C5). The `+` toolbar button stays.

#### C2 · Item detail (push)
- **Nav:** inline title = item name; trailing `Edit` (→ C3).
- **Layout** (pad 0 18, gap 13):
  1. Large tile: full width, aspect 1, radius 26, `surface2`, cut-out (or icon at 62%; ghosted style if not photographed, plus a chip `Add a photo`).
  2. Title `.title2.bold()` `Navy crewneck`; detail `.subheadline` `ink2` `Layer · Navy · Regular fit`.
  3. **Fits card** (`KCard`, row): Archivo 44 `14` + `.subheadline` `ink2` `of your 37 fits use it` (template `of your {total} fits use it`). **Hidden while the seed's display Rotation (37) is in use** (`04` §9.4), since computed per-item counts don't fit under it.
  4. **Facts list** (grouped, 52 pt rows, label left `ink2`, value right `ink`): `Worn` · `4 times` · `Last worn` · `Oct 20` · `Added` · `From a fit check · Oct 12` (or `You added it · Oct 12`, `From Starter essentials`).
  5. **Seen in** (tagline): a horizontal row of look thumbnails 49.5 × 62.5 (crop `neck`), each → L2 (pushed in this stack).
  6. PrimaryButton large `Style this` (→ Stylist `.styleItem`).
- **Add a photo** (not photographed) → a dialog `Take photo` · `Choose photo` (item read via `/v1/item`; consent required).
- **VoiceOver:** tile "Navy crewneck, photo" or "Navy crewneck, no photo yet".

#### C3 · Edit item (sheet)
> **Update Oct 16 (#315, 09-ui-review §17; differs from this spec because the founder picked rows over one form):** the piece page shows a "What it is" section (Kind · Color · Leg or Fit · Pattern); each row opens this route as a one-row picker (`?field=`), pictures of the piece with that one thing changed, one tap picks, a toast with Undo. No Save, no Photo or Delete here (Remove from Closet stays on the page). The form below is superseded.

- Large detent; toolbar `Cancel` · title `Edit item` · `Save`.
- Form sections:
  - `Type`: a picker of the slot's types (`Tee`, `Polo`, `Oxford`, `Overshirt`, `Sweater`, `Hoodie`, `Jacket`, `Jeans`, `Chinos`, `Trousers`, `Shorts`, `Sneakers`, `Boots`, `Loafers`, `Belt`…).
  - `Color`: color-family chips with a 14 pt swatch each (`White`, `Cream`, `Light grey`, `Grey`, `Charcoal`, `Black`, `Navy`, `Khaki`, `Tan`, `Brown`, `Olive`, `Light blue`, `Blue`, `Rust`, `Burgundy`, `Green`, `Other`).
  - `Fit` (tops: `Slim` · `Regular` · `Relaxed` · `Oversized`) or `Leg` (bottoms: `Skinny` · `Slim` · `Straight` · `Relaxed` · `Wide`).
  - `Photo`: toggle `Use icon instead of photo`; button `Retake item photo`.
  - Destructive row `Delete item`.
- Edited fields become **confirmed fields** (they anchor future readings).
- **Delete:** dialog title `Delete navy crewneck?`, message `Your rotation goes from 37 to 23 fits.` (template), buttons `Delete` (destructive) · `Cancel` (default). After: pop to C1, toast `Deleted navy crewneck.` + Undo (5 s).

#### C4 · Add item
> **Update Oct 8 (scan camera built, DECISIONS-LOG #88, #100–102; route `/scan`):** "+" is a system action sheet: `Take photo` · `Choose photos` (`Describe it` joins when C4d is built). The scan camera: fixed dark, rear camera, X · tip pill · torch; the preview is a 3:4 rounded frame (exactly the photo) under the top bar, with corner brackets per piece found (copper when it touches the edge); under it `Lay pieces flat, front side up, not overlapping.`; library button · shutter. Tips, most urgent first: `Too dark. Turn on a light or tap the flash.` (+ `Turn on flash`; torch on: `Still dark. Turn on a room light too.`) · `I see a person. Lay it flat or hang it up.` · `Point the camera at your clothes.` · `Hold still` · `Too much glare. Tilt the phone a little.` · `Step back so every piece fits.` · `Move a little closer.` · `{n} pieces in view` / `1 piece in view` (`Looking for clothes…` before the first measures). After the shot, the S3 panel with body `Nothing's saved yet.`: `Too dark: turn on a light or the flash.` · `Too blurry. Hold still and try again.` · `I see a person. Lay it flat or hang it up.` · `I can't find clothes in this photo.` · `A piece runs off the edge. Step back so it all fits.` · `Glare is hiding part of it. Tilt the phone and try again.`, all with Use anyway; `There's a person here I can't blur. Lay it flat or hang it up.` without. Choose photos: up to 10; if some need a look, one panel `{n} of {m} photos need a look` lists them (thumb + reason) with `Save the {n} good ones` · `Save all {n}` · `Choose others`. Saved: `Saved for your closet` (`Saved {n} photos for your closet`) + `Reading clothes from photos is coming soon. Your photo stays on your phone until then.` · `Scan another` · `Done`. Until the item reading exists, scans wait in the scan inbox (no review sheet yet). Demo screens 46–53. *The tip "One piece, flat or on a hanger." below is replaced: a photo may hold several pieces (#88).*

- **"+" menu** (a `Menu` from the toolbar button): `Take photo` · `Choose photos` · `Describe it`.
- **Take photo:** a simple full-screen item camera (fixed dark, rear camera, X, shutter, no guide) with tip `One piece, flat or on a hanger.`; foreground-mask cut-out on device.
- **Choose photos:** S4 with up to 20.
- **Review sheet** (after reads): title `Review {n} items` + `Save`; rows as in S11 (editable, removable); duplicate questions inline. Save → pop, toast `+12 fits` (template `+{n} fits`; 0: `Added to your closet.`).
- **Rule:** this is the one "doing" action that stays in Closet (data entry, Jakob's Law).

#### C4d · Describe it (sheet)
- Medium/large detent, title `Describe it` + `Add`. No AI, no consent needed.
- Sections with chips: `What is it?` (types grouped `Tops` / `Layers` / `Bottoms` / `Shoes` / `Extras`), `Color` (families), `Fit` (optional).
- Preview tile with the icon in that color and the label `{Color} {type}`; caption `Not photographed yet. Add a photo anytime.`
- Add → item saved as `isPhotographed = false` (ghosted tile), toast `+{n} fits`.

#### C5 · Starter essentials (push)
- **Nav:** inline title `Starter essentials`.
- **Header** (pad 0 18): text `.subheadline` `ink2` `You probably own a few already. Tap the ones you have.`; then `8 of 12` (`.headline`) and the 12-slot bar from C1.
- **List** (grouped `KCard`, 60 pt rows): tile 44 (icon) · name (`.subheadline.weight(.semibold)`) + price line (`.footnote` `ink2`) · trailing toggle circle (28; owned = `ink` fill with a white check; not owned = 1.5 pt `line` ring). Items and prices from `rubric/v3.md` (budget / mid):
  1. `White heavyweight tee` · `$15–20 · $35–60`
  2. `Polo or knit polo` · `$30–40 · $70–120`
  3. `Light-blue or white oxford shirt` · `$40–50 · $70–98`
  4. `Crewneck knit` · `$40–50 · $80–150`
  5. `Dark straight jeans` · `$50–60 · $80–120`
  6. `Chinos, straight or relaxed` · `$50–60 · $80–98`
  7. `Overshirt or chore coat` · `$50–70 · $100–250`
  8. `Casual jacket` · `$50–90 · $120–300`
  9. `White leather sneakers` · `$70–110 · $150–300`
  10. `Loafers or boots` · `$60–110 · $150–275`
  11. `Quarter-zip or plain hoodie` · `$40–50 · $80–150`
  12. `Leather belt` · `About $30 · $50–100`
  - Price line format: `Budget {a} · Mid {b}`.
- Owned rows show a detail `In your closet` (photographed or detected) or `Marked as owned`. Detected items are pre-filled (e.g. 3 of 12 after the first check).
- **Footer card:** `Next step` tagline, `Unstructured navy blazer` / `For interviews and weddings · Budget $80–150 · Mid $200–400`.
- **Tap to own:** creates a not-photographed ClosetItem, toast `+{n} fits`. Untapping one he marked (not one detected from a photo) removes it with Undo.
- At 12 of 12 the C1 essentials row collapses to `Starter essentials · All 12`.
- **VoiceOver:** each row is a toggle: "White heavyweight tee, owned."

#### C6 · How Rotation is counted (sheet)
- Medium detent, title `How Rotation is counted` + `Done`.
- Body (`.body`): `Rotation is how many different outfits your closet makes. I count every top, bottom and shoes combo that works together, plus a layer when it helps.`
- Bullets (`.subheadline`, `ink2`, `checkmark` in `accent`): `Pieces have to be close in how dressy they are.` · `No more than 4 standout colors at once. Neutrals like navy, grey and white don't count.` · `Near-duplicates count once, so two white tees don't double it.` · `It only goes down if you delete something.`
- Footer: `Your rotation: 37 fits` in Archivo + `.subheadline`.

#### C7 · Next best buy (sheet)
- Medium detent, title = item `Grey quarter-zip` + X. Tile 60 + `+9 fits` (Archivo 31, `accent`) + `$40–70` (`.subheadline` `ink2`).
- `Why this one` (tagline) + text `Layers over every tee you own.`
- `What to look for` (tagline) + bullets: `Plain, no big logo.` · `Mid-weight cotton or merino.` · `Fitted at the hem, not baggy.` · `Grey, navy or cream.`
- PrimaryButton large `Got it`. Free users: a footnote link `See the full list (Pro)` → P1; Pro: a ranked list of the next 5 below.

### 3.5 Lookbook

#### L1a · Looks segment
- Filter chips row: `All` · `Full checks` · then occasions he has used (`Date`, `Everyday`…).
- Grid: 3 columns, gap 8; tile aspect 3 : 4, radius 13, crop `neck` (400 px thumbnails). Overlays: bottom-left a score pill (`surface` 90%, `ink` mono 13 `8.0`; re-checked looks show `8.0 → 9.0`); top-right `Partial` pill when partial; `bookmark.fill` badge when saved. Held: no score, pill `Waiting`.
- Newest first; month headers (`.footnote.weight(.semibold)`, `ink3`: `October 2026`).
- Tap → L2.

#### L1b · Saved segment
- Saved outfit ideas (from "Save" on outfit cards) and saved looks, newest first, as compact outfit cards (4 tiles + title + `Wear this`). `Wear this` → Stylist (logs the day).
- Empty: `Tap the bookmark on any outfit to keep it here.`

#### L1e · Empty and Welcome back
- **Empty (state a):** a ghost look card (dashed 1.5 `inkFaint`, radius 26, 3 : 4 placeholder) with `Your first look lands here, with its score.` and PrimaryButton `Check my fit` (→ Stylist).
- **After 7+ days away:** a one-time banner card at the top: `Welcome back. Your closet and looks are right where you left them.` (dismiss X). Never a loss or a reset count.

#### L2 · Look detail (push)
- **Nav:** inline title `{Occasion} · {weekday, date}` (e.g. `Date · Thu, Oct 22`); trailing `ellipsis` menu: `Save` / `Unsave` · `Share` (→ S12) · `Delete photo` (destructive).
- **Layout** (pad 0 18, gap 13):
  1. Photo full width, aspect 3 : 4, radius 26, crop `neck` (tap → S13; with a shoe snap, a small 60 thumb at the bottom-right).
  2. The fit-check card content (ScoreBlock, partial label, summary, fixes with done states, the tip line), without the Added row; for a re-check, the delta row (`8.0 → 9.0`) and a `Before` thumbnail.
  3. `Pieces` (tagline) + a row of item tiles (→ C2).
  4. Buttons: PrimaryButton large `Wear this again` (→ Stylist `.wearAgain`) · SecondaryButton large `Show in chat`. Inside the re-check window, the primary becomes `Re-check` (→ Stylist).
- **Delete photo dialog:** title `Delete this photo?`, message `The score stays in your Lookbook.`, `Delete photo` (destructive) / `Cancel`. After: the photo becomes a `surface2` placeholder with `Photo deleted`.
- **Partial looks** are never compared with full ones (no delta to a full check).

#### L3 · Your moves (push)
> **Update Oct 15 (#292; `10-onboarding.md` §9.9):** built. Each move not done has its own `Start` (any order; the card keeps one button); a done move shows the filled check badge (no second check on the right). From You it's pushed inside the You tab (`/you/moves`).

- Inline title `Your moves`. Header `1 of 3 done` (`.headline`) + a 3-slot bar.
- The 3 moves as `KCard` rows (number circle, title, subtitle, trailing `Start` SecondaryButton small or a `Done` check). Start → as in S14 (cross-tab).
- When all 3 are done: `All 3 done. Nice work.` and the pinned rows in L1 and Y1 disappear.

### 3.6 You

#### Y2 · Style profile (push)
- Inline title `Style profile`; toolbar `Save` (enabled on change).
- Sections (grouped list, 52 pt rows):
  - `Basics`: Height (stepper), Build (segments), Fit you like (segments), **Birth year (read-only, `ink2`)** with footer `Birth year can't be changed here.`
  - `Styles` (`Up to 3`): chips as in O2n.
  - `How bold`: segments `Keep it safe` · `A little` · `Bold` (default `A little`, shown as `My guess` until he picks).
  - `Budget per piece`: chips `Under $30` · `$30–60` · `$60–100` · `$100+`.
- The silhouette at the top updates live.

#### Y3 · What your stylist knows (push) + fact sheet
- Inline title `What your stylist knows`. Header text `.subheadline` `ink2` `Everything I use to style you. Edit or delete anything.`
- List (grouped): each fact row as in Y1 (title + `{source} · {date}`; sources `You told me` · `From a fit check` · `My guess · not asked yet`). Swipe left → `Delete` → row gone + toast `Forgot it.` with Undo.
- **Fact sheet** (tap a row; medium detent): title = the fact; `Where it came from` + source and date; for a fit-check fact, a `Show the check` link (→ L2); buttons `Edit` (inline text or chips) · `Delete` (destructive, no dialog; Undo toast). Guess facts get `That's right` · `Change it` instead.
- Footer: `Deleted facts are never used again.`
- Empty: `I'll add what I learn here.`

#### Y4 · Settings (push)
Grouped list, inline title `Settings`:
| Section | Rows |
|---|---|
| (none) | `Notifications` › (Y6) · `Plan & usage` › (Y5) · `Privacy & data` › (Y7) |
| `Appearance` | Picker `System` · `Light` · `Dark` |
| `Units` | Picker `US (ft, in)` · `Metric (cm)` |
| `Subscription` | `Manage subscription` (`manageSubscriptionsSheet`) · `Restore purchases` · `Redeem a code` (`offerCodeRedemption`) |
| `About` | `Privacy policy` · `Terms of use` · `Contact support` (mailto) |
| footer | `Kitted {version} ({build}) · Rules v3.1` |

#### Y5 · Plan & usage (push)
- Inline title `Plan & usage`.
- **Status card** (`KCard`): `Free plan` / `Kitted Pro · Yearly` / `Pro trial`; detail: free `Resets at 4 am`, Pro `Renews {date}`, trial `Trial ends {date}. I'll remind you 2 days before.`
- **Today** (tagline) list: `Fit checks` · `0 of 1` (Pro `0 of 10`) · `Re-check` · `1 left` / `Used` · `Questions` · `3 of 5` (Pro `of 50`) · footer `Resets at 4 am.`
- Buttons: free → PrimaryButton large `Try Pro` (→ P1); Pro → SecondaryButton large `Manage subscription`. Then rows `Restore purchases` · `Redeem a code`.
- N3 opens here.

#### Y6 · Notifications (push)
- Inline title `Notifications`. Header: `That's all I send. No reminders to open the app.`
- Rows: `Daily outfit idea` toggle + row `Time` · `8:00 am` (DatePicker, compact) · `Fit check ready` toggle · `Trial ending` toggle (only during a trial).
- **System permission off:** a card on top `Notifications are off for Kitted.` + `Open Settings`; toggles disabled. Never-asked state: turning on a toggle shows the system prompt (this is the "only way back in" after No thanks).

#### Y7 · Privacy & data (push)
- Inline title `Privacy & data`.
- **Promise card** (`KCard`, `lock` icon in `accent`): `Your photos are saved on this iPhone and in its own backup. Kitted's servers never keep them.` + `A face-free copy of each check goes to {provider}. Google keeps it up to 55 days to check for misuse and doesn't train on it.`
- Rows (grouped):
  - Toggle `Send to Google for fit checks and questions` (consent; off = withdraws, every AI call stops at once, S1 shows S26). Footer `Turn this off and Closet, Lookbook and outfit ideas still work.` Turning it back on opens O5 as a sheet.
  - `Photos on this iPhone` · `31 photos · 42 MB` (read-only).
  - `Delete all photos` (destructive text) → dialog.
  - `Forget what your stylist knows` (destructive text) → dialog.
  - `Delete all my data` (destructive text) → dialog.
  - `Privacy policy` ›.
- **Dialogs** (Cancel is the default button):
  | Action | Title | Message | Destructive button |
  |---|---|---|---|
  | Delete all photos | `Delete all photos?` | `Your scores and closet stay. This can't be undone.` | `Delete all photos` |
  | Forget facts | `Forget everything I know?` | `Your closet and looks stay. I'll start learning again from your next check.` | `Forget everything` |
  | Delete all my data | `Delete all your data?` | `This removes your closet, looks, photos, facts and settings from this iPhone. Your subscription is billed by Apple, so cancel it in Settings if you want to stop paying.` | `Delete everything` |
- After "Delete everything": wipe the SQLite database, photos and the secure-store device ID (**keep the age flag**), then return to O1. A subscription warning row sits above the button for Pro users: `You have Kitted Pro. Deleting your data doesn't cancel it.` + link `Manage subscription`.
- Works offline (all local).

### 3.7 Paywall

#### P1b · Paywall page 2 (plans)
> **Update Oct 15 (#285, #291):** one plan only, `Monthly` / `1 week free` / `$9.99` `/mo` (the store's price string), selected; the button `Start 1-week free trial` (trial used: `Subscribe for {price}/month`); the fine print `pay.fine.trial` / `pay.fine.monthly` (renewal and how to cancel, 3.1.2); `Restore purchases`; X from this page closes the whole cover. The yearly card, the badge and the 14-day trial below are kept for when a yearly plan is decided.

- **Presentation:** push inside the paywall's own `Stack` (`src/app/paywall/plans.tsx`). **Nav:** leading Back (`chevron.left`), trailing X (both 44). Back-swipe returns to page 1.
- **Build:** our own page (React Native has no `SubscriptionStoreView`): the marketing header, two `PlanCard`s as a radio group, our purchase button, `Restore purchases`, and `Terms` · `Privacy` links, fed by the `Entitlements` interface (`05` P6, `06` §7). The demo's `DemoStore` returns `kitted.pro.annual` ($29.99/year, 14-day free trial) and `kitted.pro.monthly` ($5.99/month) and shows `Demo: no real purchase`; v1 swaps in RevenueCat (`05` S8). It must carry everything Apple's view did (Guideline 3.1.2): plan name and length, price per period, the billed amount as the most prominent price, trial length and post-trial price, auto-renewal, Restore, Terms and Privacy, X and `Continue free` from the first frame.
- **Marketing header** (pad 0 23.5, gap 12): woven `KITTED PRO`; title `.title2.bold()` `Pick your plan`; a one-line reminder `.subheadline` `ink2` `Up to 10 fit checks and 50 questions a day.` (ruling 25).
- **Target look of the plan picker** (from the mockup; build it exactly, since it's our own component now): two cards (pad 13 / 17, radius 19.5, 1.5 pt `line` border, selected = `ink` border), **Yearly preselected**:
  - `Yearly` / `14 days free · $2.50 a month` · price SF Pro `.title2.weight(.bold).monospacedDigit()` `$29.99` + `/yr` (the mockup draws Archivo 24.5; 03 §3.3) · badge (21 tall, `accent` fill, `onPrimary` 11.5 → 12 bold) `Best value` straddling the top edge at the right (−10.5, 15.5 in).
  - `Monthly` / `No trial` · `$5.99` + `/mo`.
- **Below the picker:** fine print (`.caption`, `ink3`, centered) `Free for 14 days, then $29.99 a year. I'll remind you 2 days before. Cancel anytime.` (monthly selected: `$5.99 a month. Cancel anytime.`) and a ghost button `Continue free`.
- The purchase button is a PrimaryButton large: `pay.cta.trial` with Yearly selected, `pay.cta.monthly` with Monthly. The billed price must be the biggest number (3.1.2). No timers, no exit offers.
- **Founding offer:** waitlist users redeem the $19.99 first-year offer code via `Redeem a code` (Y4/Y5), not here.

#### P1s · Paywall states
| State | What shows |
|---|---|
| Products loading | Skeleton plan cards (static with Reduce Motion); the purchase button disabled. If products fail: `pay.loadFailed` + `pay.retry` |
| Purchase pending | Inline text `Waiting for approval.` |
| Failed | The store's error (Apple's own alert when it shows one); stay on P1b. A user cancel shows nothing |
| Success | Dismiss P1, toast `Pro is on.`, back where he was (a held photo is scored now) |
| Already Pro | P1 shows `You're Pro.` + `Up to 10 fit checks and 50 questions a day.` + SecondaryButton `Manage subscription` + X |
| Offline | `Plans need a connection.` + `Continue free` |

---

## 4. Global components

Component names match `app-build-spec.md` §6 where they exist; `handoff/03-design-system.md` owns tokens and code. Sizes are from the mockup CSS.

| Component | Spec | Used in |
|---|---|---|
| `KCard` | `surface`, radius 26 continuous, 1 pt `line` border, soft shadow in light mode (none in dark; the surface contrast is the border), clips children. Inner blocks pad 14 / 16 | Every card, rows lists, consent, Rotation, profile |
| `Seam` | 1 pt dashed line (5 on, 4 off) in `inkFaint` at 45% opacity, inset 18 from the card edges | Card dividers (D7, D10, D11), S5 |
| `Tagline` | Row `space-between`, SF Mono 12, sentence case; left `ink3`, right `ink2` (or `accent` for links) | Card headers, You facts header, Closet cards |
| `ScoreBlock` | Archivo score (`<Numeral>`, 76 base, scales on the `largeTitle` ramp, capped at 1.6×) + mono `/10` in `ink3` + verdict word `.headline` + detail `.subheadline` `ink2` + optional partial label. The word always shows with the number. Words: `Needs a fix` (≤ 5.5) · `Getting there` (6–6.5) · `Put together` (7–7.5) · `Sharp` (8–8.5) · `Dialed in` (9–9.5) (ruling 24) | S6, S6p, S6r, S22, O1, O1e, L2 |
| `DeltaRow` | Struck-through old score Archivo 44 `ink3` · `chevron.right` 28 `accent` · new score · pill `+1.0` | S6r, L2, share card line |
| `FixRow` | Grid `26 | 1fr | auto`, gap 12, pad 10.5 vertical, hairline between rows; number circle 26 (1.3 pt `ink`), title `.callout.weight(.semibold)`, subtitle `.footnote` `ink2`, gain mono `accent`. Done: filled circle + check, title struck through `ink2` | S6, S6p, S6r, S14, L2, L3 |
| `TipLine` | Top hairline, pad 8 / 0 / 6, `.footnote` `ink2`, lead word in `accent` semibold | S6, S22 |
| `AddedRow` | Overlapping 28.5 thumbs (−8), text, trailing `Review` link | S6, S6p |
| `PrimaryButton` | `primary` fill, `onPrimary` label. Regular 36 tall capsule, `.subheadline.weight(.semibold)`, pad 0 16, optional leading icon 15.5. Large 50 tall, full width, `.headline`. Limit-card variant 49.5. Not glass, except over the camera | Everywhere |
| `SecondaryButton` | Same shapes, `surface2` fill, `ink` label | Swap one, Not now, Limit card, dialogs |
| `GhostButton` | Transparent, `ink2` (or `ink`), 44 tall | See an example check, Continue free |
| `OutlineButton` | Transparent, 1 pt `line`, 39 tall | Y1 Try Pro |
| `IconButton` | 36 × 36 circle `surface2` (44 hit) | Share, Save, sheet X |
| `NavCircle` | 44 circle, `surface2` (glass on camera/share) | Onboarding Back, paywall X, toolbar +, gear |
| `Chip` | 34 tall capsule, pad 0 14, 1 pt `line`, `surface`, `.subheadline.weight(.medium)`. Selected: `ink` fill + `surface` text. Accent variant: `accent` border + text on `accentSoft` | Occasions, reasons, filters, values |
| `QuickStartChip` | 34 tall capsule, pad 0 13, `surface` + `line`, `.subheadline.weight(.semibold)`, icon 19.5 `ink2` | S1 dock, S25 starters |
| `Pill` | 26 tall (22 small) capsule, pad 0 10.5, `.footnote.weight(.semibold)`; neutral `surface2` / `ink2`; accent `accentSoft` / `accent`; ok = transparent + `line` border + `good` text | What I read, `+3 this week`, `+1.0`, `Partial`, `Closet updated` |
| `ChipFlow` | Wrapping layout; at AX sizes becomes a vertical stack | All chip groups |
| `ChatBubble.me` | `me` fill, `onMe` text, pad 10.5 / 15.5, radius 23.5 with the bottom-right corner 6.5, max width 78%, `.body` | His messages and echoes |
| `ChatBubble.photo` | 135 wide, pad 4, photo 171.5 tall (radius 17 / 17 / 4 / 17), caption row `.footnote` at 90% opacity | His check photos |
| `StylistText` | No bubble, `.body`, max width 92%; optional "who" header (18 pt `K` tile + `Your stylist`) | All stylist messages |
| `DayStamp` | Centered `.footnote.weight(.medium)` `ink3` | Thread separators |
| `Composer` (idle / compact) | See D12 | S1 |
| `SkeletonCard` + `StageList` | See D6 | S5, S24 item read |
| `OutfitTiles` | 4-up grid (gap 8, square tiles radius 18 + minilabel) or hero strip (1 pt dividers, aspect 1 : 1.05) | S1 idea, S20, L1b |
| `ClosetTile` | Aspect 1 : 0.92, radius 18, `surface2`, image at 62%; ghosted = dashed 1.5 `inkFaint`, image at 50% | C1, S10, C5 |
| `GarmentIcon(type:color:)` | Vector garment in the item's color (tee, oxford, overshirt, jacket, sweater, hoodie, chino, jeans, trouser, cargo, sneaker, runner, boot, loafer) | Tiles, thumbs, rows (fallback for cut-outs) |
| `Silhouette` | Neutral figure (no face features) with a tailor's tape on the right (`accentSoft` fill, `accent` ticks every 6 units, a dashed line at head height); height caption mono 12 `accent` | O3, Y1, Y2 |
| `WovenLabel` | The wordmark: `#1B2340` (or `accent` for "KITTED PRO") rectangle, radius 2, Archivo wide (width 125%) bold, letter-spacing ~0.32 em, dashed vertical "stitch" lines 5–7 pt in from each end. Small = **11 pt** text (the mockup's 8.5 is under the 11 pt floor; `WovenLabel(size: .small)` already does this), pad 6 / 16 / 6 / 18. It's a logo: fixed size, `accessibilityLabel("Kitted")`, exempt from Dynamic Type | O1, O4, P1, P1b |
| `ConsentRow` | Grid `23.5 | 1fr`, gap 13, pad 13 / 17, icon `accent` | O5 |
| `LedgerRow` / `LedgerTotal` | See D8 | S7 |
| `ReadRow` | Grid `44 | 1fr | 21`, gap 13, pad 10.5 / 15.5; open = `accentSoft` | S8, S11, C4 review |
| `LookRow` | Grid `49.5 | 1fr | 21`, gap 13; photo 49.5 × 62.5 radius 11.5 | L1, L2 "Seen in", held looks |
| `FactRow` | Pad 10.5 / 17, title + `{source} · {date}`; guess = italic `ink2` | Y1, Y3 |
| `IntentCounter` | Two Archivo 44 numbers + labels + divider + mono label | L1 |
| `MonthCalendar` | See D16 | L1 |
| `SlotBar` | 12 (or 3) equal slots, gap 4, 8 tall, radius 4 | C1, C5, L3 |
| `FramingOverlay` | Head ellipse + body outline, white 2 pt, dashed 7 / 5 → solid when good | S2 |
| `CameraTip` | 36.5 capsule, white 92%, `#121628` text, leading status icon | S2, S9 |
| `Countdown` | 119.5 circle + Archivo 75.5 numeral + `Hold still` | S2 |
| `ModeSwitch` | Glass capsule segmented (Propped / Mirror) | S2 |
| `Shutter` | 88.5 ring (4.5 white) + 70 disc | S2, S9, item camera |
| `GlassCircle` | White 16% + blur 15.5 (44 or 52) | Camera, share X |
| `PlanCard` | See P1b | P1b |
| `TodayCard` | See D18 | P1 |
| `PerkList` | `accent` checks, `.callout.weight(.medium)`, gap 9 | P1 |
| `ShareCardView` | The 9 : 16 render (D20), drawn once and used both for preview and the `react-native-view-shot` capture | S12 |
| `QuestionCard` | Stylist text + 2–4 tap answers (chips or buttons); at most one per reply | S15, S24, S29, S4 "Is this you?", S23 |
| `G1 OfflineBanner` | Capsule under the nav bar (pad 8 / 14, `surface2`, `wifi.slash` + `.footnote.weight(.semibold)` `Offline. Your closet and lookbook still work.`); auto-hides on reconnect with a short `Back online.` | Any tab |
| `G2 Toast` | Capsule above the tab bar (bottom 100), `surface` + shadow (dark: `surface2`), pad 12 / 16, `.subheadline`; optional trailing `Undo` (`accent` semibold). 5 s, VoiceOver-announced, one at a time | Undo, "+N fits", saved, logged, Pro is on |
| `G3 LatestPill` | 44 tall capsule `primary` with `arrow.down` + `Latest`, centered above the composer when scrolled up | S1 |
| `EmptyState` | Our own component copying `ContentUnavailableView`'s layout (don't use `@expo/ui`'s, it has no web; `06` §3): icon, title `.title3.weight(.semibold)`, body `.subheadline` `ink2`, 1–2 buttons | C1e, L1e, Y3 |
| Sheet chrome | iOS 26 inset sheet; grabber 36 × 5; title `.title2.bold()` + 36 X circle; content pad 8 / 20 / 24, gap 12 | All sheets |

**Haptics:** light on chip/tile selection; medium on capture; a soft tick on each 3-2-1 count; success on a score rise and on purchase; none on errors.

---

## 5. Copy deck

Every user-facing string, keyed for `Localizable.xcstrings`. `{braces}` are format arguments; make the counted ones plural variations. **M** = verbatim from the mockup; **R** = from a ruling or the source doc it cites; **N** = new in this spec. Strings marked M are exact: check them against the HTML if you change anything.

### 5.1 Tabs, navigation, common
| Key | String | Src |
|---|---|---|
| `tab.stylist` | Stylist | M |
| `tab.closet` | Closet | M |
| `tab.lookbook` | Lookbook | M |
| `tab.you` | You | M |
| `common.back` | Back | N |
| `common.close` | Close | N |
| `common.done` | Done | N |
| `common.cancel` | Cancel | N |
| `common.save` | Save | N |
| `common.edit` | Edit | M |
| `common.undo` | Undo | N |
| `common.delete` | Delete | N |
| `common.skip` | Skip | M |
| `common.retry` | Retry | N |
| `common.tryAgain` | Try again | N |
| `common.openSettings` | Open Settings | R |
| `common.terms` | Terms | M |
| `common.privacy` | Privacy | M |
| `common.privacyPolicy` | Privacy policy | R |
| `common.termsOfUse` | Terms of use | N |
| `common.latest` | Latest | N |
| `common.who` | Kit | M |
| `brand.wordmark` | KITTED | M |
| `brand.wordmark.pro` | KITTED PRO | M |
| `a11y.brand` | Kitted | N |

### 5.2 Onboarding
| Key | String | Src |
|---|---|---|
| `onb.welcome.cardTag` | Fit check | M |
| `onb.welcome.cardOccasion` | Everyday | M |
| `onb.welcome.cardWord` | Sharp | M |
| `onb.welcome.cardDetail` | Full check | M |
| `onb.welcome.title` | Look put together.\nWithout trying\ntoo hard. | M |
| `onb.welcome.body` | Send a fit. Get a score out of 10 and the two or three moves that raise it. | M |
| `onb.welcome.start` | Get started | M |
| `onb.welcome.example` | See an example check | M |
| `onb.progress.a11y` | Step {n} of 6 | N |
| `onb.looks.prompt` | Which of these would you actually wear? Tap up to 3. | R (#173; was M: "Hey. I'm your stylist. Tap up to 3 looks you'd actually wear. No style words needed.") |
| `onb.looks.byName` | Pick by name instead | M |
| `onb.looks.notSure` | Not sure | M |
| `onb.looks.continue` | Continue | N |
| `onb.looks.continueCount` | Continue · {n} of 3 | M |
| `onb.looks.max` | Up to 3. | R |
| `onb.looks.tileA11y` | {style}: {line} | R (#173) |
| `onb.looks.line.streetwear` | Hoodies, graphic tees, baggy jeans or cargos, big sneakers | R (#173) |
| `onb.looks.line.minimalist` | Plain pieces, quiet colors, clean lines | R (#173) |
| `onb.looks.line.smart_casual` | Polos, quarter-zips, button-ups, chinos, neat shoes | R (#173) |
| `onb.looks.line.classic_prep` | Blazers, polos, knits, chinos, loafers | R (#173) |
| `onb.looks.line.workwear` | Chore coats, flannels, sturdy jeans, boots | R (#173) |
| `onb.looks.line.outdoor` | Shell jackets, fleeces, cargos, trail shoes | R (#173) |
| `onb.looks.line.vintage_sport` | Football jerseys, rugby shirts, retro sneakers | R (#173) |
| `onb.looks.else.title` | Something else? | R (#173) |
| `onb.looks.else.cta` | Tell me in your words | R (#173) |
| `onb.looks.else.placeholder` | Like skater, or all black | N |
| `onb.looks.else.a11y` | Something else. Describe your style in your own words. | N |
| `onb.looks.else.saved` | "{words}" | N |
| `onb.byName.title` | Pick by name | N |
| `onb.byName.sub` | Up to 3. You can change these later in You. | N |
| `style.smart_casual` | Smart casual | M |
| `style.minimalist` | Minimal | N |
| `style.workwear` | Workwear | M |
| `style.vintage_sport` | Vintage sport | N |
| `style.streetwear` | Streetwear | N |
| `style.classic_prep` | Classic prep | N |
| `style.outdoor` | Outdoor | N |
| `onb.basics.echoNotSure` | Not sure yet | N |
| `onb.basics.replyTwo` | {style1} with some {style2}. Good mix. Now your basics, so the advice fits your frame. | M (template) |
| `onb.basics.replyOne` | {style1}. Good pick. Now your basics, so the advice fits your frame. | N |
| `onb.basics.replyNone` | No problem. I'll learn your style from your checks. Now your basics, so the advice fits your frame. | N |
| `onb.basics.height` | Height | M |
| `onb.basics.heightAdd` | Add | N |
| `onb.basics.build` | Build | M |
| `build.slim` | Slim | M |
| `build.average` | Average | M |
| `build.broad` | Broad | M |
| `onb.basics.fit` | Fit you like | M |
| `fitpref.fitted` | Fitted | M |
| `fitpref.regular` | Regular | M |
| `fitpref.relaxed` | Relaxed | M |
| `onb.basics.birthYear` | Birth year | M |
| `onb.basics.choose` | Choose | M |
| `onb.basics.cta` | Looks right | M |
| `onb.basics.silhouetteA11y` | Silhouette: {build} build, {fit} fit. | R |
| `onb.year.title` | Birth year | N |
| `onb.consent.echo` | {height} · {build} · {fit} · {birthYear} | M (template; mockup: "5′10″ · Average · Regular · 2005") |
| `onb.consent.intro` | Last thing before your first check. Here's what happens to your photo. | M |
| `onb.consent.header` | Before your first fit check | R |
| `onb.consent.sentTitle` | What gets sent | R |
| `onb.consent.sentBody` | To score your outfit and answer your questions, Kitted sends these to {provider}, an AI service: | R |
| `onb.consent.sent1` | your outfit photo, with your face cropped out or blurred first (if we can't remove it, we don't send it) | R |
| `onb.consent.sent2` | photos of clothes you add to your closet | R |
| `onb.consent.sent3` | questions you type to your stylist, plus the clothes in your closet (not your photos) so it can answer | R |
| `onb.consent.notTitle` | What doesn't | R |
| `onb.consent.notBody` | Your face, your birth year, your name, contacts or location. | R |
| `onb.consent.keptTitle` | What happens to it | R |
| `onb.consent.kept1` | We don't keep your photos on our servers. They stay on your phone. | R |
| `onb.consent.kept2` | Google uses them only to give you an answer and doesn't use them to train its AI. | R |
| `onb.consent.kept3` | Google keeps them for up to 55 days only to check for misuse, then deletes them. | R |
| `onb.consent.aiTitle` | Kit, your stylist, is an AI. | R |
| `onb.consent.aiBody` | It can make mistakes, so use "Not quite right?" to fix it. | R |
| `onb.consent.footer` | You can turn this off anytime in You → Privacy. | R |
| `onb.consent.agree` | Agree & check my fit | M |
| `onb.consent.notNow` | Not now | R |
| `onb.consent.example` | See an example first | M |
| `config.providerDefault` | Google's Gemini API | R |
| `onb.example.intro` | Here's a real check. This is what you'll get. | N |
| `onb.example.tag` | Example · Full | N |
| `onb.example.ctaOwn` | Check my own fit | N |
| `onb.age.title` | Kitted is for ages 18 and up. | R |
| `onb.age.body` | Thanks for checking it out. You can delete the app from your Home Screen. | N |

### 5.3 Camera, reading, retake
| Key | String | Src |
|---|---|---|
| `cam.mode.propped` | Propped | M |
| `cam.mode.mirror` | Mirror | M |
| `cam.tip.noPerson` | Step into the frame | R |
| `cam.tip.tooClose` | Step back a little. Shoes in frame if you can. | R |
| `cam.tip.moveLeft` | Move a little left | R |
| `cam.tip.moveRight` | Move a little right | N |
| `cam.tip.good` | Shoulders and hips in frame | M |
| `cam.tip.goodFull` | Head to shoes in frame | N |
| `cam.tip.mirror` | Phone at chest height. Volume button takes the photo. | N |
| `cam.countdown.hold` | Hold still | M |
| `cam.timer.off` | Timer off | R |
| `cam.timer.on` | Timer 3s | N |
| `cam.a11y.close` | Close camera | N |
| `cam.a11y.flash` | Flash | N |
| `cam.a11y.library` | Choose a photo | N |
| `cam.a11y.shutter` | Take photo | R |
| `cam.a11y.flip` | Switch camera | N |
| `cam.retake.dark` | Too dark: face a window or turn on a light | R |
| `cam.retake.blurry` | Too blurry. Hold still and try again. | N |
| `cam.retake.smudge` | Wipe your lens | R |
| `cam.retake.noPerson` | I can't find you in this photo. | R |
| `cam.retake.cantFrame` | Couldn't frame this one. Try again. | R |
| `cam.retake.noCount` | This one doesn't count. | N |
| `cam.retake.retake` | Retake | R |
| `cam.retake.useAnyway` | Use anyway | R |
| `cam.shoe.tip` | Hold your phone at knee height, pointed at your feet. | R |
| `cam.shoe.guide` | Shoes and hems here | N |
| `cam.shoe.bottomTip` | Step back so your pants and shoes are in frame. | N |
| `cam.shoe.a11yShutter` | Take shoe photo | N |
| `cam.shoe.failed` | Couldn't read your shoes. Try again or pick a pair. | N |
| `cam.item.tip` | One piece, flat or on a hanger. | N |
| `read.bubble.onlySent` | Face hidden when sent | R (mockup: "Only this crop is sent"; changed Oct 7, #64: the bubble shows his unblurred kept photo since #55, so "Only this is sent" was no longer true) |
| `read.tag` | Reading your fit | M |
| `read.eta` | About 7 seconds | M |
| `read.slow` | Taking longer than usual | R |
| `read.stage.pieces` | Finding your pieces | M |
| `read.stage.piecesCount` | {found} of {total} | M |
| `read.stage.fit` | Checking fit | M |
| `read.stage.color` | Colors & proportion | M |
| `read.stage.fixes` | Writing your fixes | M |
| `read.pending` | {slot}… | M (e.g. "Shoes…") |
| `read.occasion.q` | Where are you headed? | M |
| `read.occasion.hint` | {occasion} is picked unless you tap. | M (template; mockup: "Everyday is picked unless you tap.") |
| `occasion.everyday` | Everyday | M |
| `occasion.classWork` | Class/Work | M |
| `occasion.date` | Date | M |
| `occasion.interview` | Interview | M |
| `occasion.event` | Event | M |
| `occasion.gym` | Gym | M |
| `occasion.home` | Home | M |

### 5.4 Fit-check, re-check and partial cards
| Key | String | Src |
|---|---|---|
| `card.tag.full` | Fit check · Full | M |
| `card.tag.partial` | Fit check · Partial | M |
| `card.tag.recheck` | Re-check · Full | M |
| `card.tag.recheckPartial` | Re-check · Partial | N |
| `card.outOf` | /10 | M |
| `score.word.needsFix` | Needs a fix | M |
| `score.word.gettingThere` | Getting there | M |
| `score.word.putTogether` | Put together | M |
| `score.word.sharp` | Sharp | M |
| `score.word.dialedIn` | Dialed in | M |
| `card.example.verdict` | Clean base. The overshirt in your hand finishes it. | M |
| `card.example.fix1` | Wear the overshirt, open | M |
| `card.example.fix1Sub` | Free · it's already in your hand | M |
| `card.gainTo` | → {score} | M |
| `card.gainRaw` | +{gain} | M |
| `card.nextLevel` | Next level | M |
| `card.example.nextLevel` | One standout color, like a rust tee. No score change today. | M |
| `card.added` | Added {n} to Closet | M |
| `card.review` | Review | M |
| `card.recheck` | Re-check after fixing | M |
| `card.share.a11y` | Share | M |
| `card.why` | Why {score}? | M |
| `card.nqr` | Not quite right? | M |
| `card.later` | Later | R |
| `card.rulesNote` | Scored with rules v{version} | R |
| `fix.tag.free` | Free | M |
| `fix.tag.freeIfOwn` | Free if you own one | R |
| `fix.tag.fromCloset` | Free · from your closet | M |
| `fix.tag.tailor` | Tailor ~${price} | R |
| `fix.tag.buy` | Buy | R |
| `recheck.prompt` | {fixQuestion} Send it. I'll only re-read the {slotWord}. | M (template; mockup: "Overshirt on? Send it. I'll only re-read the layer.") |
| `recheck.bubbleCap` | Re-check | M |
| `recheck.example.summary` | Layered and clean. Dialed in. Nothing else changed. | M |
| `recheck.share` | Share the before and after | M |
| `recheck.tellMe` | Didn't catch the change? Tell me | M |
| `recheck.newProblem` | New: {problem} | R |
| `recheck.notSeen` | I still see {problem}. | R |
| `recheck.iDid` | I did {fixPast} | R |
| `recheck.tryAnother` | Try another photo | R |
| `recheck.tell.title` | What changed? | N |
| `recheck.tell.done` | Done | N |
| `recheck.tell.update` | Update score | R |
| `recheck.tell.confirmed` | You confirmed it. | N |
| `partial.label.shoes` | Partial check: shoes not included | M |
| `partial.label.topOnly` | Partial check: top only | R |
| `partial.example.summary` | Gym shorts read as loungewear outside the gym. Headed there? Change the occasion. Your score may change once I see your shoes. | M |
| `partial.example.fix` | Swap to jeans or chino shorts | M |
| `partial.mayChange` | Your score may change once I see your shoes. | M |
| `partial.finish.title` | Finish the check | M |
| `partial.finish.same` | Same shoes as {weekday}? | M (mockup: "Same shoes as Sunday?") |
| `partial.finish.snapOrPick` | Snap your shoes or pick a pair. | N |
| `partial.finish.snapOnly` | Snap your shoes to finish. | N |
| `partial.finish.bottom` | Snap your bottom half to finish. | N |
| `partial.full` | Full check | R |
| `partial.fullCloset` | Full check (shoes from your closet) | R |
| `partial.a11y.useSame` | Use your {shoes} from {weekday} | N |
| `partial.a11y.snap` | Snap your shoes | R |
| `partial.a11y.skip` | Skip finishing the check | N |
| `dialed.title` | This is dialed in. Nothing to fix. | R |
| `dialed.save` | Save this look | N |
| `notRated.summary` | Your {garment} isn't rated. I score everything else. | R |
| `notRated.pill` | not rated | R |
| `unreadable.text` | I can't read this one. Try a brighter spot. | R |
| `notClothed.text` | I score outfits you'd wear out. | R |
| `whichOne.q` | Which one is you? | R |
| `isThisYou.q` | Is this you? | R |
| `isThisYou.yes` | Yes, it's me | N |
| `isThisYou.no` | No, just ideas | N |
| `card.a11y.fitCheck` | Fit check, {occasion}. Score {score} out of 10, {word}. {partial}{summary} Top fix: {fix}, {tag}. | R |

### 5.5 Why this score, Not quite right?
| Key | String | Src |
|---|---|---|
| `why.title` | Why {score} | M |
| `why.sub` | Same photo, same score. Here's the math. | M |
| `why.start` | Everyone starts at | M |
| `why.credit.elevated` | Elevated piece | M |
| `why.credit.shoes` | Shoes that match | M |
| `why.credit.layered` | Layered | M |
| `why.credit.interest` | Point of interest | M |
| `why.example.elevated` | tan chinos | M |
| `why.example.shoes` | white leather sneakers | M |
| `why.example.layered` | the overshirt is in your hand, not on | M |
| `why.example.interest` | all neutrals today | M |
| `why.example.occasion` | dressed right for it | M |
| `why.partialRow` | not in the photo, so no points lost | N |
| `why.total` | Your score | M |
| `why.noMistakes` | No mistakes found | M |
| `why.mistakes` | {n} mistakes found | N (plural: "1 mistake found") |
| `why.read` | What I read | M |
| `why.howLink` | How I score › | M |
| `why.footer` | I score the clothes only. Never your face, body or skin. | M |
| `why.how.title` | How I score | N |
| `why.how.body1` | Everyone starts at 7.0. That's a clean, basic outfit. | N |
| `why.how.body2` | Credits add points: a layer, an elevated piece, a point of interest, and shoes that match. | N |
| `why.how.body3` | Mistakes take points off, like a pooling hem or loungewear outside the gym. What isn't in the photo never costs you. | N |
| `why.how.body4` | The best score today is 9.5. The same photo always gets the same score. | N |
| `why.how.body5` | I never score your face, body, weight or skin. | N |
| `nqr.title` | Not quite right? | M |
| `nqr.sub` | Tap what I got wrong. Fixing a detail re-scores right away, free. | M |
| `nqr.reason.item` | Wrong item | M |
| `nqr.reason.detail` | Wrong color or fit | M |
| `nqr.reason.fix` | Fix doesn't apply | M |
| `nqr.reason.score` | Score feels off | M |
| `nqr.example.teeDetail` | Regular fit | M |
| `nqr.example.chinos` | Tan chinos · straight leg | M |
| `nqr.ask.fit` | How do they really fit? | M |
| `nqr.example.sneakerDetail` | Low profile | M |
| `nqr.notInPhoto` | Not in the photo | N |
| `nqr.skipFix` | I'll skip it | N |
| `nqr.nextFix` | Next fix: {title} | N |
| `nqr.higher` | Higher | R |
| `nqr.lower` | Lower | R |
| `nqr.whatWouldYouGive` | What would you give it? | R |
| `nqr.scoreStays` | Score stays {score} | M |
| `nqr.scoreMoves` | Score {from} → {to} | N |
| `nqr.thanks` | Thanks, this helps me get better. | N |
| `nqr.closetUpdated` | Closet updated | M |
| `nqr.save` | Save correction | M |
| `nqr.send` | Send | N |
| `nqr.toast.saved` | Saved to your {item}. | R |
| `nqr.toast.generic` | Correction saved. | N |
| `value.leg.skinny` … `value.leg.wide` | Skinny · Slim · Straight · Relaxed · Wide | M (Slim, Straight, Relaxed) / N |
| `value.topFit.*` | Slim · Regular · Relaxed · Oversized | N |
| `value.hem.*` | Clean · Cuffed · Pooling · Cropped | N |
| `value.sleeve.*` | Down · Rolled | N |
| `value.tuck.*` | Tucked · Half tuck · Untucked | N |

### 5.6 Stylist home, ideas, questions, items, plan
| Key | String | Src |
|---|---|---|
| `stylist.title` | Stylist | M |
| `stylist.aiNote` | I'm Kit, your stylist. Quick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tap "Not quite right?" when I do. | R (ruling 17; first message in the Stylist thread, posted once when onboarding ends, above his first photo bubble) |
| `stylist.quota.free` | 1 free check today | M |
| `stylist.quota.recheck` | Re-check included | M |
| `stylist.quota.used` | Check used today | M |
| `stylist.quota.held` | 1 photo waiting to score | N |
| `stylist.quota.questions` | {n} questions left today | N |
| `stylist.menu.findPast` | Find a past fit check | R |
| `stylist.menu.example` | See an example | R |
| `stylist.morning` | Morning. An easy one for {occasionWord} today: | M (mockup: "Morning. An easy one for class today:") |
| `idea.tag` | Outfit idea | M |
| `idea.fromCloset` | From your closet | M |
| `idea.wear` | Wear this | M |
| `idea.swap` | Swap one | M |
| `idea.save.a11y` | Save | M |
| `idea.wearing` | Wearing this today | N |
| `idea.youdNeed` | You'd need: {item} | R |
| `quick.wear` | What should I wear? | M |
| `quick.bought` | I bought something | M |
| `quick.ask` | Ask a question | M |
| `composer.check` | Check my fit | M |
| `composer.placeholderIdle` | Ask… | M |
| `composer.placeholder` | Ask Kit… | M |
| `composer.a11y.camera` | Check my fit. Opens the camera. | N |
| `composer.a11y.send` | Send | N |
| `wear.whereTo` | Where to? | M |
| `wear.example.reply` | Career fair on the 29th, right? Business casual, and you can build it from what you own. | M |
| `wear.reply` | {target}, and you can build it from what you own. | N |
| `wear.example.title` | Sharp, not stiff | M |
| `wear.example.desc` | Light-blue oxford under a navy crewneck, navy chinos, brown loafers. Match a brown belt to the shoes. | M |
| `wear.needShoes` | I need your shoes to build outfits. | R |
| `wear.needBasics` | I need a top, a bottom and shoes to build outfits. | N |
| `wear.snapThem` | Snap them | R |
| `wear.tapBasics` | Tap the basics you own | R |
| `swap.title` | Swap one piece | N |
| `swap.sub` | Tap the piece to change. | N |
| `swap.none` | Nothing else in your closet works here yet. | N |
| `ask.limit.free` | That's today's 5 questions. More at 4 am, or go Pro for up to 50 a day. | N |
| `ask.limit.pro` | That's 50 questions today. More at 4 am. | N |
| `ask.offTopic` | I'm best at clothes. Ask me about an outfit, a fit or what to buy next. | N |
| `ask.refuseFace` | I rate outfits, never people. | R |
| `ask.demoOnly` | This demo can't answer new questions yet. The real app will. | N (demo only) |
| `item.demoOnly` | This demo only knows its sample photos. Use Describe it. | N (demo only) |
| `demo.unknownPhoto` | This demo only knows its sample photos. | N (demo only; `05` P3) |
| `support.text` | That sounds like a lot right now. If you're in the US, you can call or text 988 any time to talk to someone. | N |
| `support.cta` | Call or text 988 | N |
| `support.call` | Call 988 | N |
| `support.textOpt` | Text 988 | N |
| `bought.menu.title` | Add something new | N |
| `bought.menu.photo` | Take photo | R |
| `bought.menu.choose` | Choose photo | R |
| `bought.menu.describe` | Describe it | R |
| `bought.reading` | Reading your new piece | N |
| `item.tag` | Added to Closet | N |
| `item.tagNew` | New | N |
| `item.fits` | +{n} fits | M (plural) |
| `item.rotation` | Rotation {from} → {to} | R |
| `item.q.fit` | How does it fit? | N |
| `item.q.budget` | Roughly what do you spend on one piece? | N |
| `budget.under30` | Under $30 | N |
| `budget.30to60` | $30–60 | N |
| `budget.60to100` | $60–100 | N |
| `budget.over100` | $100+ | N |
| `item.q.duplicate` | Same as your {item}? | R |
| `item.dup.yes` | Yes, same one | N |
| `item.dup.no` | No, a new one | N |
| `item.fairUse` | That's a lot of new stuff today. Add the rest in Closet with Describe it. | N |
| `plan.intro` | Want outfit ideas from your own clothes? This part is optional. | N (#343; was "Here's where to start. Three moves, in order.") |
| `plan.tag` | Optional | N (#343; was "Your plan") |
| `plan.tagCount` | About 30 seconds | N (#343; was "3 moves") |
| `plan.title` | Tap the clothes you already own | N (#343; was "Your first 3 moves") |
| `plan.body` | I'll build outfit ideas from them. Skip it and I'll still learn your closet from your fit checks. | N (#343) |
| `plan.show` | Show me the list | N (#343) |
| `plan.skip` | Skip | N (#343) |
| `plan.skipped` | Skipped. It's in Closet whenever you want it. | N (#343) |
| `plan.added` | Added {n} to your closet. | N (#343) |
| `plan.addMore` | Add more | N (#343) |
| `notif.ask` | What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before. | N (specs/notifications.md NT1) |
| `notif.ask.label` | I get dressed at | N (NT1) |
| `notif.ask.yes` | Send me ideas | N (NT1) |
| `notif.ask.no` | No thanks | R |
| `notif.ask.done` | Done. Your first idea lands tomorrow at {time}. | N |
| `notif.ask.doneToday` | Done. Your first idea lands today at {time}. | N (NT1) |
| `notif.ask.later` | No problem. You can turn it on later in You → Notifications. | N (NT1) |
| `comeback.q` | I paused your daily ideas after a week without a visit. Want them back? | N (NT4) |
| `comeback.on` | Turn them back on | N (NT4) |
| `comeback.time` | Change the time | N (NT4) |
| `comeback.no` | No thanks | N (NT4) |
| `comeback.back` | Back on. Next one lands tomorrow at {time}. | N (NT4) |
| `comeback.backToday` | Back on. Next one lands today at {time}. | N (NT4) |
| `comeback.done` | Done. You can turn them on in You → Notifications. | N (NT4) |
| `buy.tag` | Next best buy | M |
| `buy.lookFor` | What to look for | N |
| `buy.fullList` | See the full list | N |
| `noConsent.greeting` | Send me a fit. I'll score it and start your closet. | R |
| `noConsent.title` | Turn on fit checks | R |
| `noConsent.body` | To score a photo, I need your OK to send a face-free copy to {provider}. | N |
| `noConsent.cta` | Review and turn on | N |
| `noConsent.example` | See an example | R |

### 5.7 Limit, held, failures, banners, toasts
| Key | String | Src |
|---|---|---|
| `limit.tag` | Daily limit | M |
| `limit.resets` | Resets at 4 am | M |
| `limit.title` | That's today's free check. | M |
| `limit.body` | I'll save this photo and score it when you open Kitted after 4 am. Questions still work tonight: {n} left. | M (template; mockup "3 left") |
| `limit.bodyNoQuestions` | I'll save this photo and score it when you open Kitted after 4 am. | M (prefix) |
| `limit.recheckStill` | Today's re-check still works. | R |
| `limit.save` | Save for tomorrow | M |
| `limit.pro` | Try Pro · 1 week free | R (mockup: "Go unlimited · 14 days free"; 1 week since #285) |
| `limit.proNoTrial` | Try Pro | N |
| `held.tag` | Waiting to score | R |
| `held.tagWhen` | After 4 am | N |
| `held.body` | Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check. | N |
| `held.dontScore` | Don't score it | N |
| `held.ready` | Ready to score last night's photo? | N |
| `held.score` | Score it | N |
| `held.notThis` | Not this one | N |
| `held.lookbook` | Waiting to score | R |
| `camOff.text` | Camera is off for Kitted. You can still choose a photo. | R |
| `camOff.choose` | Choose a photo | R |
| `fail.ai` | I couldn't score this one. It didn't use your check. | R (edited) |
| `fail.timeout` | That took too long. Try again. This one doesn't count. | R (edited) |
| `fail.offline` | You're offline. Fit checks need a connection. Your photo is saved here. | R (edited) |
| `fail.paused` | Fit checks are paused for a bit. Your photo is saved. Try again later. | N |
| `fail.cantFrame` | Couldn't frame this one. Try again. | R |
| `fail.ask` | I couldn't answer that. It doesn't count. | R |
| `fail.cap.notScored` | Not scored | N |
| `fail.cap.notSent` | Not sent | N |
| `fail.cap.notSentRetry` | Not sent · Retry | R |
| `banner.offline` | Offline. Your closet and lookbook still work. | R |
| `banner.online` | Back online. | N |
| `toast.logged` | Logged for today. | N |
| `toast.savedLookbook` | Saved to your Lookbook. | N |
| `toast.fits` | +{n} fits | M (plural) |
| `toast.addedCloset` | Added to your closet. | N |
| `toast.deletedItem` | Deleted {item}. | N |
| `toast.forgot` | Forgot it. | N |
| `toast.pro` | Pro is on. | R |
| `toast.restored` | Purchases restored. | N |
| `toast.nothingRestore` | Nothing to restore. | N |
| `toast.savedPhotos` | Saved to Photos. | N |
| `toast.photosOff` | Photos access is off. Turn it on in Settings. | N |

### 5.8 Closet
| Key | String | Src |
|---|---|---|
| `closet.title` | Closet | M |
| `closet.add.a11y` | Add an item | N |
| `closet.rotation.tag` | Your rotation | M |
| `closet.rotation.label` | fits your\ncloset makes | M (plural "fit your closet makes") |
| `closet.rotation.week` | +{n} this week | M |
| `closet.rotation.locked` | Rotation unlocks with a top, bottoms and shoes. | R |
| `closet.essentials` | Starter essentials | M |
| `closet.essentials.count` | {n} of 12 | M |
| `closet.essentials.all` | All 12 | N |
| `closet.nextBuy.tag` | Next best buy | M |
| `closet.nextBuy.example` | Grey quarter-zip | M |
| `closet.nextBuy.exampleDetail` | $40–70 · Plain, no big logo. Layers over every tee you own. | M |
| `closet.filter.all` | All {n} | M |
| `closet.filter.tops` | Tops {n} | M |
| `closet.filter.bottoms` | Bottoms {n} | M |
| `closet.filter.shoes` | Shoes {n} | M |
| `closet.filter.layers` | Layers {n} | M |
| `closet.filter.extras` | Extras {n} | N |
| `closet.noPhoto` | · no photo | M |
| `closet.empty.title` | Your closet builds itself. | R |
| `closet.empty.body` | Do a fit check and I'll add what you're wearing. | R |
| `closet.empty.check` | Check my fit | R |
| `closet.empty.basics` | Tap the basics you own | R |
| `closet.add.menu.photo` | Take photo | R |
| `closet.add.menu.photos` | Choose photos | R |
| `closet.add.menu.describe` | Describe it | R |
| `closet.review.title` | Review {n} items | N |
| `added.title` | Added to your closet | N |
| `added.sub` | From this check. Fix anything I got wrong. | N |
| `added.removed` | Removed | N |
| `added.addBack` | Add back | N |
| `describe.title` | Describe it | R |
| `describe.add` | Add | N |
| `describe.what` | What is it? | N |
| `describe.color` | Color | N |
| `describe.fit` | Fit | N |
| `describe.notPhotographed` | Not photographed yet. Add a photo anytime. | R |
| `item.fitsUse` | of your {total} fits use it | N |
| `item.worn` | Worn | N |
| `item.wornCount` | {n} times | N (plural) |
| `item.lastWorn` | Last worn | N |
| `item.addedLabel` | Added | N |
| `item.source.fitCheck` | From a fit check · {date} | M |
| `item.source.added` | You added it · {date} | N |
| `item.source.starter` | From Starter essentials | N |
| `item.seenIn` | Seen in | R |
| `item.styleThis` | Style this | R |
| `item.addPhoto` | Add a photo | N |
| `item.styleBubble` | Style my {item} | N |
| `edit.title` | Edit item | N |
| `edit.type` | Type | N |
| `edit.color` | Color | N |
| `edit.fit` | Fit | N |
| `edit.leg` | Leg | N |
| `edit.useIcon` | Use icon instead of photo | R |
| `edit.retake` | Retake item photo | R |
| `edit.delete` | Delete item | N |
| `edit.delete.title` | Delete {item}? | N |
| `edit.delete.msg` | Your rotation goes from {from} to {to} fits. | N |
| `shoes.title` | Which shoes? | N |
| `shoes.sub` | I'll use what I know about them. Hems stay unrated. | N |
| `shoes.lastWorn` | Last worn {weekday} | N |
| `shoes.snap` | Not here? Snap them | N |
| `starter.title` | What you already own | N (#343; was "Starter essentials") |
| `starter.sub` | Optional. Tap what you have and pick the color. Skip anything you're not sure about: your fit checks fill in the rest. | N (#343) |
| `starter.which` | Which one is yours? | N (#343) |
| `starter.remove` | Remove from closet | N (#343) |
| `starter.addedToast` | Added {item}. | N (#343) |
| `starter.added` | Added: {item} | N (#343) |
| `starter.inCloset` | In your closet | N |
| `starter.marked` | Marked as owned | N |
| `starter.item.1` … `starter.item.12` | Plain tee · Polo · Oxford shirt · Crewneck sweater · Jeans · Chinos · Overshirt · Casual jacket · Leather sneakers · Loafers or boots · Quarter-zip or hoodie · Belt | N (#343: plain names, he picks the color; was rubric v3's "White heavyweight tee · … · Leather belt") |
| `rotation.title` | How Rotation is counted | R |
| `rotation.body` | Rotation is how many different outfits your closet makes. I count every top, bottom and shoes combo that works together, plus a layer when it helps. | N |
| `rotation.rule1` | Pieces have to be close in how dressy they are. | N |
| `rotation.rule2` | No more than 4 standout colors at once. Neutrals like navy, grey and white don't count. | N |
| `rotation.rule3` | Near-duplicates count once, so two white tees don't double it. | N |
| `rotation.rule4` | It only goes down if you delete something. | N |
| `nextBuy.why` | Why this one | N |
| `nextBuy.gotIt` | Got it | R |
| `nextBuy.fullListPro` | See the full list (Pro) | N |

### 5.9 Lookbook
| Key | String | Src |
|---|---|---|
| `lookbook.title` | Lookbook | M |
| `lookbook.seg.looks` | Looks | M |
| `lookbook.seg.calendar` | Calendar | M |
| `lookbook.seg.saved` | Saved | R |
| `lookbook.intent.week` | this week | M |
| `lookbook.intent.total` | total | M |
| `lookbook.intent.label` | Days dressed\nwith intent | M |
| `lookbook.intent.a11y` | Days dressed with intent: {week} this week, {total} total. | N |
| `lookbook.row.full` | {date} · Full check · {n} fix | M (mockup: "Thu, Oct 22 · Full check · 1 fix"; plural "fixes") |
| `lookbook.row.partialShoes` | {date} · Shoes not included | M |
| `lookbook.pill.partial` | Partial | M |
| `lookbook.wore` | Wore an outfit idea | N |
| `lookbook.moves` | Your moves | R |
| `lookbook.movesCount` | {n} of 3 | R |
| `lookbook.filter.all` | All | N |
| `lookbook.filter.full` | Full checks | N |
| `lookbook.pill.waiting` | Waiting | N |
| `lookbook.saved.empty` | Tap the bookmark on any outfit to keep it here. | N |
| `lookbook.empty` | Your first look lands here, with its score. | R |
| `lookbook.welcomeBack` | Welcome back. Your closet and looks are right where you left them. | R ("Welcome back") + N |
| `look.pieces` | Pieces | N |
| `look.before` | Before | N |
| `look.wearAgain` | Wear this again | R |
| `look.showInChat` | Show in chat | R |
| `look.recheck` | Re-check | R |
| `look.deletePhoto` | Delete photo | R |
| `look.delete.title` | Delete this photo? | N |
| `look.delete.msg` | The score stays in your Lookbook. | R |
| `look.photoDeleted` | Photo deleted | N |

### 5.10 You and settings
| Key | String | Src |
|---|---|---|
| `you.title` | You | M |
| `you.basicsLine` | {height} · {build} · {fit} fit | M (mockup: "5′10″ · Average · Regular fit") |
| `you.knows` | What Kit knows | M |
| `you.knowsAll` | All {n} | M |
| `fact.source.fitCheck` | From a fit check · {date} | M |
| `fact.source.told` | You told me · {date} | M |
| `fact.source.guess` | My guess · not asked yet | M |
| `fact.example.leg` | Likes straight-leg pants | M |
| `fact.example.budget` | Spends $30–60 an item | M |
| `fact.example.event` | Career fair on Oct 29 | M |
| `fact.example.boldness` | Boldness: a little | M |
| `you.plan.free` | Free plan | M |
| `you.plan.usage` | Today: {checks} of 1 checks · {questions} of 5 questions · resets at 4 am | R |
| `you.plan.resets` | Resets at 4 am | M |
| `you.plan.tryPro` | Try Pro | M |
| `you.plan.pro` | Kitted Pro | N |
| `you.plan.proLine` | Up to 10 fit checks and 50 questions a day | R |
| `you.plan.trial` | Pro trial | N |
| `you.plan.trialLine` | Ends {date}. I'll remind you 2 days before. | N |
| `you.plan.manage` | Manage | N |
| `you.privacyRow` | Your photos are saved on this iPhone | R (mockup: "Your photos stay on this phone") |
| `you.facts.empty` | I'll add what I learn here. | R |
| `profile.title` | Style profile | N |
| `profile.basics` | Basics | N |
| `profile.birthYearNote` | Birth year can't be changed here. | N |
| `profile.styles` | Styles | N |
| `profile.stylesMax` | Up to 3 | N |
| `profile.bold` | How bold | N |
| `bold.safe` | Keep it safe | N |
| `bold.little` | A little | N (mockup lowercase in "Boldness: a little") |
| `bold.bold` | Bold | N |
| `profile.budget` | Budget per piece | N |
| `knows.title` | What Kit knows | M |
| `knows.header` | Everything I use to style you. Edit or delete anything. | N |
| `knows.cameFrom` | Where it came from | N |
| `knows.showCheck` | Show the check | N |
| `knows.right` | That's right | N |
| `knows.change` | Change it | N |
| `knows.footer` | Deleted facts are never used again. | M (caption) |
| `settings.title` | Settings | N |
| `settings.notifications` | Notifications | R |
| `settings.plan` | Plan & usage | R |
| `settings.privacy` | Privacy & data | R |
| `settings.appearance` | Appearance | R |
| `appearance.system` | System | R |
| `appearance.light` | Light | M |
| `appearance.dark` | Dark | M |
| `settings.units` | Units | R |
| `units.us` | US (ft, in) | N |
| `units.metric` | Metric (cm) | N |
| `settings.subscription` | Subscription | N |
| `settings.manage` | Manage subscription | R |
| `settings.restore` | Restore purchases | R |
| `settings.redeem` | Redeem a code | R |
| `settings.about` | About | N |
| `settings.support` | Contact support | R |
| `settings.version` | Kitted {version} ({build}) · Rules v{rules} | N |
| `usage.title` | Plan & usage | R |
| `usage.today` | Today | N |
| `usage.checks` | Fit checks | N |
| `usage.of` | {used} of {limit} | R |
| `usage.recheck` | Re-check | N |
| `usage.recheckLeft` | 1 left | N |
| `usage.used` | Used | N |
| `usage.questions` | Questions | N |
| `usage.resets` | Resets at 4 am. | N |
| `usage.renews` | Renews {date} | N |
| `usage.trialEnds` | Trial ends {date}. I'll remind you 2 days before. | N |
| `notifs.title` | Notifications | R |
| `notifs.header` | An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send. | N (NT3) |
| `notifs.idea` | Daily outfit idea | R |
| `notifs.time` | I get dressed at | N (NT3) |
| `notifs.ready` | Fit check ready | R |
| `notifs.off` | Notifications are off for Kitted. | N |
| `privacy.title` | Privacy & data | R |
| `privacy.promise` | Your photos are saved on this iPhone and in its own backup. Kitted's servers never keep them. | R (CLAUDE.md L35 fix) |
| `privacy.google` | A face-free copy of each check goes to {provider}. Google keeps it up to 55 days to check for misuse and doesn't train on it. | R |
| `privacy.consentToggle` | Send to Google for fit checks and questions | R |
| `privacy.consentFooter` | Turn this off and Closet, Lookbook and outfit ideas still work. | N |
| `privacy.storage` | Photos on this iPhone | N |
| `privacy.storageValue` | {n} photos · {size} | R |
| `privacy.deletePhotos` | Delete all photos | R |
| `privacy.forget` | Forget what Kit knows | N |
| `privacy.deleteAll` | Delete all my data | R |
| `privacy.deletePhotos.title` | Delete all photos? | N |
| `privacy.deletePhotos.msg` | Your scores and closet stay. This can't be undone. | N |
| `privacy.forget.title` | Forget everything I know? | N |
| `privacy.forget.msg` | Your closet and looks stay. I'll start learning again from your next check. | N |
| `privacy.forget.cta` | Forget everything | N |
| `privacy.deleteAll.title` | Delete all your data? | N |
| `privacy.deleteAll.msg` | This removes your closet, looks, photos, facts and settings from this iPhone. Your subscription is billed by Apple, so cancel it in Settings if you want to stop paying. | N |
| `privacy.deleteAll.cta` | Delete everything | N |
| `privacy.proWarning` | You have Kitted Pro. Deleting your data doesn't cancel it. | N |

### 5.11 Paywall
| Key | String | Src |
|---|---|---|
| `pay.restore` | Restore | M |
| `pay.title` | Up to {checks} checks a day.\nAsk as you go. | R (#233 item 4, #291: the mockup's "Check every fit. Ask anything." reads as unlimited) |
| `pay.today` | Today: {before} → {after} | M |
| `pay.today.oneFix` | One free fix. Nothing new to buy. | M |
| `pay.today.nFixes` | {n} free fixes. Nothing new to buy. | N |
| `pay.today.score` | Today: {score} | R |
| `pay.today.toTarget` | {n} free fixes to {target}. | R (10 §5.13; plural "One free fix to {target}.") |
| `pay.today.dialed` | Dialed in on your first check. | N |
| `pay.perk.checks` | Up to {n} fit checks a day | M (the quota's real limit) |
| `pay.perk.questions` | Up to {n} questions a day | R (mockup: "Unlimited questions") |
| `pay.perk.nextBuy` | Your full next-buy list, ranked | M (not shown until C7 exists, #291) |
| `pay.seePlans` | See plans | N |
| `pay.continueFree` | Continue free | M |
| `pay.p2.title` | Pick your plan | N |
| `pay.p2.reminder` | Up to {checks} fit checks and {questions} questions a day. | R |
| `pay.plan.yearly` | Yearly | M (not offered since #285: monthly only) |
| `pay.plan.yearlyDetail` | 14 days free · $2.50 a month | M |
| `pay.plan.yearlyPrice` | $29.99 | M |
| `pay.plan.perYear` | /yr | M |
| `pay.plan.monthly` | Monthly | M |
| `pay.plan.monthlyDetail` | 1 week free | R (#285) |
| `pay.plan.noTrial` | No trial | M (the trial already used) |
| `pay.plan.monthlyPrice` | $9.99 | R (#285; the store's own price string is shown, this is the fallback) |
| `pay.plan.perMonth` | /mo | M |
| `pay.plan.badge` | Best value | M |
| `pay.cta.trial` | Start 1-week free trial | R (#285; P1b's purchase button; React Native has no Apple paywall view, so we draw it) |
| `pay.cta.monthly` | Subscribe for {price}/month | N (P1b's purchase button when the trial is used) |
| `pay.loadFailed` | Plans didn't load. | N |
| `pay.retry` | Try again | N |
| `pay.demoNote` | Demo: no real purchase | N (demo builds only; `DemoStore`) |
| `pay.fine.yearly` | Free for 14 days, then $29.99 a year. I'll remind you 2 days before. Cancel anytime. | M |
| `pay.fine.monthly` | {price} a month. It renews every month until you cancel. Cancel at least 24 hours before it renews (Settings › your Apple ID › Subscriptions). | N (#291, 3.1.2) |
| `pay.fine.trial` | Free for 1 week, then {price} a month. It renews every month until you cancel. Cancel at least 24 hours before the trial ends and you won't be charged (Settings › your Apple ID › Subscriptions). | N (#291, 3.1.2) |
| `pay.failed` | That didn't go through. Nothing was charged. | N (#291) |
| `pay.restorePurchases` | Restore purchases | N (#291, P1b) |
| `pay.pending` | Waiting for approval. | R |
| `pay.alreadyPro` | You're Pro. | R |
| `pay.offline` | Plans need a connection. | N |

### 5.12 Share
| Key | String | Src |
|---|---|---|
| `share.title` | Share | M |
| `share.delta` | {before} → {after} after {n} fix | M (plural "fixes") |
| `share.single` | {occasion} · Full check | N |
| `share.watermark` | scored by | M |
| `share.story` | Story | M |
| `share.save` | Save | M |
| `share.more` | More | M |
| `share.a11y.story` | Share to Story | N |
| `share.a11y.save` | Save to Photos | N |
| `share.a11y.more` | More sharing options | N |

### 5.13 Notifications and system strings
| Key | String | Src |
|---|---|---|
| `push.nudge.check` | Check today's fit. Each one teaches me your closet. | N (NT2) |
| `push.nudge.idea` | Today's outfit idea is ready. | N (NT2) |
| `push.nudge.bigEnough` | Your closet's big enough now: here's today's idea. | N (NT2) |
| `push.ready` | Your fit check is ready. {n} quick fixes inside. | M (plural "1 quick fix"; 0 → `push.ready.none`) |
| `push.ready.none` | Your fit check is ready. | N (NT6) |
| `plist.NSCameraUsageDescription` | Kitted uses the camera to check your outfit. Your face is cropped out before anything is sent. | N |
| `plist.NSPhotoLibraryAddUsageDescription` | Save your Kitted card to Photos. | R |

---

## 6. Every "differs from mockup" change in one list

1. Consent card text replaced with `app-store-and-age-rules.md` §3; secondary button `Not now` (same width); "See an example first" becomes a link (ruling 16).
2. Paywall split into 2 pages; page 1 primary `See plans`; page 2 = our own plans page (rulings 6 and 23; React Native has no `SubscriptionStoreView`).
3. `Unlimited questions` → `Up to 50 questions a day` (ruling 25).
4. Limit card `Go unlimited · 14 days free` → `Try Pro · 14 days free` (ruling 25).
5. Reading is an inline skeleton card, not a screen; the bubble says `Only this is sent` (ruling 13).
6. His chat bubbles use the `neck` crop, not `blur` (rulings 11, 13 §2).
7. First-ever check card gets a `Later` link (ruling 23).
8. Every card's occasion gets a `chevron.down` (build spec §4.5; the two drawn cards disagree).
9. Partial fix tag `Free · from your closet` only with a matching item, else `Free if you own one` (ruling 20).
10. You: privacy row `Your photos are saved on this iPhone`; plan card shows today's usage; Your moves row added (ruling 18, 10 §2 and §5.10).
11. Lookbook: `Saved` segment and Your moves row added (10 §5.9–5.10).
12. Camera library button is an icon, not a thumbnail of his latest photo (no library read access, 09 §3).
13. Mirror mode gains the Timer button and the volume-button shutter (ruling 14).
14. Height starts blank (`Add`) like birth year (build spec O3 makes it optional).
15. Taglines render sentence case in SF Mono 12 (ruling 29).
16. `ink3` darkened for text to pass 4.5:1 (build spec §4).
17. Stylist nav gets a `…` menu (build spec §4.2).
18. Lookbook tab icon is `square.grid.2x2` (mockup), not `book.closed` (build spec).
19. Share "Save" icon is `square.and.arrow.down`.
20. Height stepper value and plan prices are SF Pro, not Archivo; calendar day cells are 44 pt; the small woven label is 11 pt (03 §11).
21. Stylist composer has no library circle, and its camera button hides while typing (founder, Oct 7; DECISIONS-LOG #28).
21. Partial card: "Same shoes as Monday?" (computed from the seed), not "Sunday" (04 §12 #3).
22. A one-time AI note is the first Stylist-thread message (`stylist.aiNote`, ruling 17).
23. **Screen 7 shows `Reads as smart casual`** under the summary (not drawn). *Because rubric v4 names the look an outfit reads as (#82, #85); p01b fits both minimal and smart casual, and his first pick (smart casual) breaks the tie.*
24. **The one quick tap (S5q) can come between the reading card and the result** (not drawn). *Because rubric v4 asks one look-alike question when the answer moves the score by a point or more (#85).*
25. **The result card's tagline has no style** (the drawn cards have none either; the build had added one, #68). *Because a style never changes the score (rubric v4).*
