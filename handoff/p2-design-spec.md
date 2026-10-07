# P2 visual spec (designer, Oct 7 2026)

Kitted P2 visual spec: Stylist chat and fit-check cards (screens 6–12, plus the chat pieces shared with 13/19)

How to read this:
- Sizes are in pt. "CSS" means the mockup rule in `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html` (first `<style>` block lines 5–266, second block 1012–1193).
- When the mockup value is odd, I give it first and then the snapped value (for example "10.5 → 10"). The tolerance is 4 pt.
- Tokens are `colors.*` from `app/src/design-system/tokens.ts`. Light/dark hex values are listed once in §0.
- Type roles are `roles.*` / `variant` from `typography.ts`, always rendered through `<KText>`.
- Copy keys are the ones in `app/src/i18n/en.generated.ts` (I checked that they exist). Keys marked **NEW** don't exist yet and must be added.

---

## 0. Shared facts

### Tokens used here (light / dark)

| Token | Light | Dark |
|---|---|---|
| bg | #F3F4F6 | #0C0E14 |
| surface | #FFF | #171A23 |
| surface2 | #ECEEF1 | #21252F |
| ink | #121628 | #ECEEF3 |
| ink2 | #585E70 | #A1A7B5 |
| ink3 (text-safe, fixed) | #646A7A | #9096A5 |
| inkFaint (decoration only) | #848A99 | #6E7484 |
| line | #E0E3E8 | #2A2F3B |
| accent | #9C5326 | #DE9762 |
| accentSoft | accent @ 9% | accent @ 15% |
| primary / onPrimary | #121628 / #FFF | #ECEEF3 / #0C0E14 |
| me / onMe | #1B2340 / #F2F3F7 | #2A3150 / #EEF0F6 |
| good | #2B7651 | #5DC08F |

Fixed (same in both modes): `fixed.label` #1B2340, `fixed.onDark` #EEF0F5 (the "K" avatar).

### Bugs found in existing code that P2 depends on (fix first)

1. **`Pill` with `tone="pending"` adds "…" itself, and so does the key `read.pending` ("{slot}…").** Using both gives "Shoes……". Remove the auto-append from `Pill` and always pass `t('read.pending', {slot})`.
2. **Hard-coded English inside components** breaks 02 §1.5 ("all strings from en.ts"):
   - `StylistMessage`: "Your stylist" (use `common.who`)
   - `PhotoBubble`: "Your outfit photo…", "Only this is sent" (use `read.bubble.onlySent`)
   - `FixRow` spoken: "Fix", "Done:", "Score goes to"
   - `ScoreBlock`: "Score … out of 10", "Partial check: "
   - `PartialLabel` builds `Partial check: ${missing}`. Change it to take the full label string (`partial.label.shoes` / `partial.label.topOnly`).
   - `scoreWord()` returns English words. Map them to `score.word.*`.
   - `StageList` label "Checking your fit" should be `read.tag` ("Reading your fit").
3. **Generator bug:** `value.topFit.*`, `value.hem.*`, `value.sleeve.*` and `value.tuck.*` are single keys holding "Slim · Regular · …". Split them into one key per value (`value.topFit.slim` …), like `value.leg.*`.
4. **`NeckDownPhoto`** uses RN `Image`, skips the mockup's +0.012 foot pad, and doesn't clamp the vertical offset. Fixed math is in §C.
5. **`LedgerRow`** renders every 0 as "±0". The mockup uses "+0" for unearned credits and "±0" for the occasion row and the partial row. Fix in §D8.

### Hit-area rule that changes spacing

The existing components put the 44 pt hit area *in the layout*:
- `KButton` regular: +4 above and below.
- `Chip`: +5 above and below.
- `TextLink`: `minHeight: 44`.

So every gap next to them must be reduced, or they need a compact variant. The concrete numbers are given per screen (summed up in §D4).

---

## A. Component inventory, by screen

### Shared chat pieces (S1 thread; used on 6, 7, 10, 11, 12, 13, 19)

**A1. Nav title + subtitle** (`.nav .t`, `.nav .t small`)
1. **Status:** route options exist (`(tabs)/stylist/_layout.tsx`, inline title). **New:** a `TitleWithSubtitle` used as `headerTitle`; SDK 57 has no subtitle option (06 §2).
2. **Layout:** centered column.
   - Title: `headline` (17/600), `ink`.
   - Subtitle: `caption` (12) weight 500, **`ink3`** (see B10), line-height ~1.15 → no gap between the lines.
   - Nav height 44 is native.
   - Trailing: native `unstable_headerRightItems` `ellipsis` button with a menu (iOS 26 glass circle). Don't draw a surface2 circle.
3. **Keys:**
   - title `stylist.title`
   - subtitle one of `stylist.quota.free` / `.recheck` / `.used` / `.held`; none for Pro/trial
   - menu `stylist.menu.findPast`, `stylist.menu.example`
4. **States:** the 5 quota states (02 D12 table). After the re-check is used, the subtitle is `Check used today` even though mockup 10 shows none (B10).
5. **VoiceOver:** header role. Label "Stylist, {subtitle}". Menu button "More" (**NEW** `stylist.menu.a11y`).

**A2. Day stamp** (`.stamp`)
1. Covered: `DayStamp` (children = string).
2. Centered, `dayStamp` role (footnote 13/500, ink3). No padding of its own; the thread gap is 12.
3. No key; formatted. Within 6 days: "Thursday 8:00 am". Older: "Oct 14, 8:00 am".
4. One state.
5. VoiceOver reads the text.

**A3. Stylist "who" label + text** (`.say`, `.say .who`, `.who i`)
1. Covered: `StylistMessage { children, showHeader, footer }`. **Change:** label from `common.who`.
2. Measurements:
   - max width 92%, `chatText` (body 17, ink)
   - header row gap 8, margin-bottom 4
   - avatar 18×18, radius 5, `fixed.label`, "K" in ArchivoExpanded-Bold 10.5 `fixed.onDark` (not scaled)
   - "Your stylist" = `stylistWho` (footnote/600, ink3)
3. Keys: `common.who`. Text keys: `stylist.morning`, `recheck.prompt`, `stylist.aiNote`.
4. `showHeader` is true only on the first stylist message after a day stamp. The S6r prompt (mockup 10) has no header.
5. VoiceOver: "Your stylist: {text}" (one element).

**A4. His photo bubble + caption row** (`.me.photo`, `.me.photo .ph`, `.me.photo .cap`)
1. Covered: `PhotoBubble { source, aspect, crop, occasion, time, reading }`. **Changes:**
   - (a) render with expo-image through the fixed `NeckDownPhoto` (§C)
   - (b) reading lock icon 12 → `size="small"` (16; spec 15.5)
   - (c) the reading caption must allow 2 lines (below)
   - (d) add `onPress` → S13 photo viewer
   - (e) strings from keys
2. Measurements:
   - outer: width 135, padding 4, `me`, radii TL/TR/BL 21, BR 6 (6.5)
   - photo: 127 × 172 (171.5), radii 17/17/4/17 (TL TR BR BL)
   - caption row: padding 6 (6.5) top / 9 sides / 5 bottom, `space-between`, opacity 0.9, `photoCaption` (footnote 13, onMe)
   - **Reading caption width problem:** the content box is 109 pt. lock 16 + gap 4 + "Only this is sent" (~105 pt at 13 pt) + "7:42" (~28) does not fit. Let the label wrap (`numberOfLines={2}`, lock top-aligned, `alignItems: 'flex-start'`). The time stays on the right.
3. Keys:
   - `read.bubble.onlySent`
   - caption left = occasion key (`occasion.*`), `recheck.bubbleCap` ("Re-check"), or a failure caption (`fail.cap.*`)
   - shoe snap caption "Shoe snap" (**NEW** `cam.shoe.bubbleCap`)
4. States:
   - reading: lock + "Only this is sent"
   - scored: occasion · time
   - re-check: "Re-check" · time
   - failed: "Not scored" / "Not sent" / "Not sent · Retry"
5. VoiceOver: one image element. "Your outfit photo, 7:42. Only this is sent." (reading) / "Your outfit photo, 7:42, Date." Never describe the body. Hint "Opens the photo".

**A5. His text bubble** (`.me`)
1. Covered: `UserBubble`.
2. Padding 10 (10.5) / 16 (15.5), radius 24 with BR 6, max width 78%, `userBubbleText`.
3. Keys: echoes like `quick.wear`, `occasion.*`.
4. Default; tappable only in onboarding.
5. VoiceOver reads the text.

**A6. GarmentIcon** (`data-gi`, the `gi()` function in the mockup script)
1. **New.** Port `gi(t,c)` verbatim to `react-native-svg`:
   - viewBox 0 0 60 60
   - `shade(c, −.3)` for strokes, `shade(c, .2)` for lights, stroke width 1.1
   - types: tee, oxford, overshirt, jacket, sweater, hoodie, chino, jeans, trouser, cargo, sneaker, runner, boot, loafer
   - props `{type, color, size}`
2. Used inside:
   - Added thumbs: icon 24 (23.5) in a 28 box
   - read-row tiles: icon 36 (36.5) in 44
   - pick tile: 36 in 44
   - outfit tiles: 62% of the tile
3. No copy.
4. One state.
5. Always hidden from VoiceOver; the parent carries the label.

**A7. Composer: compact** (the injected `.cfix` `.composer` on 7, 10, 11, 13, 19)
1. **New:** `Composer variant="compact" | "idle"`.
2. Wrapper (`.cfix`):
   - absolute, pinned to the bottom
   - padding top 8, sides 16; bottom = safe-area bottom (NativeTabs includes the tab bar) + 8. Verify it sits 9 pt above the tab bar like the mockup's 92 = 62 + 21 + 9.
   - background `linear-gradient(to bottom, transparent, ${bg} 22%)` via `experimental_backgroundImage`
   - Row (`.composer`): gap 9 → 8, alignItems center.
   - Camera circle: 40, `primary`, `camera` icon size 26 (`'large'`) in `onPrimary`, `hitSlop 2`.
   - Library circle: 40, `surface`, 1 pt `line` border, `photo` icon 20 in `ink2`.
   - Field: `TextInput`, flex 1, minHeight 40, capsule (radius 20), `surface`, 1 pt `line`, paddingHorizontal 16, body 17, text `ink`, `placeholderTextColor` = `ink3`, multiline, grows to 5 lines then scrolls.
   - Send: appears only with text. `arrow.up.circle.fill` drawn ~28 inside a 32 box, `primary` (not copper), inset 4 from the trailing edge; field paddingRight 4 while it shows.
   - Thread bottom padding: 146.
3. Keys:
   - placeholder `composer.placeholder` ("Ask your stylist…")
   - `composer.a11y.camera`, `cam.a11y.library` ("Choose a photo"), `composer.a11y.send`
   - field label "Ask your stylist" (**NEW** `composer.a11y.field`; the placeholder has an ellipsis)
4. States: empty / typing (send shows) / keyboard up (lifted with `KeyboardAvoidingView` padding). At AX sizes the field moves to its own row under the circles.
5. VoiceOver: "Check my fit. Opens the camera." / "Choose a photo" / "Ask your stylist" (text field) / "Send".

**A8. Composer: idle + quick-start row** (screen 12: `.dock`, `.quickrow`, `.qc`, `.fitbtn`)
1. **New** (same component). `QuickStartChip` is **new**: the existing `Chip` has padding 14, icon 16, gap 6 and weight 500, which is wrong for this.
2. Measurements:
   - Dock: padding 8 / 16 / (safe bottom + 8), column gap 10. Thread bottom padding: 184.
   - Quick row: horizontal `ScrollView`, `showsHorizontalScrollIndicator={false}`, `marginRight: -16` (CSS −15.5) so it bleeds; content gap 8, paddingRight 16.
   - QuickStartChip: height 34, capsule, paddingHorizontal 13, `surface`, 1 pt `line`; icon 20 (`'regular'`, CSS 19.5) in `ink2`; gap 8; label `quickStart` role (subheadline 15/600, ink). Vertical hit padding 5 → 44.
   - "Check my fit" pill (`.fitbtn`): height 40, capsule, padding left 13 / right 16, `primary`; `camera` icon 26 in `onPrimary`, gap 9 → 8; label subheadline/600 in `onPrimary`; `flex: none`.
   - Then the library circle (as A7), then the field with placeholder `composer.placeholderIdle` ("Ask…").
3. Keys: `quick.wear` (icon `tshirt`), `quick.bought` (`bag`), `quick.ask` (`questionmark.circle`), `composer.check`, `composer.placeholderIdle`.
4. States:
   - idle = quiet for 10+ minutes, a fresh foreground, or the newest message was stylist-started
   - compact = during an exchange or with the keyboard up
   - the quick row hides while typing
   - cross-fade between the two (static swap with Reduce Motion)
5. VoiceOver: chips are buttons named by their label. Pill: "Check my fit. Opens the camera."

---

### Screen 6 · S5 Reading (inline in S1, not a screen)

Thread order: photo bubble (A4, `reading`) → skeleton card → occasion block.

**6a. Skeleton card**
1. **New** `SkeletonCard`, built from `KCard`, `KCardSection`, `TagLine`, `Pill`, `Seam` and `StageList`. All of those exist.
2. Layout:
   - `KCard` (radius 26, 1 pt line, light shadow)
   - Section 1: `KCardSection` padding 14/16, gap 10:
     - **TagLine**: left `read.tag`, right `read.eta` (`read.slow` after 9 s). Mono 12; left ink3, right ink2. Not pressable.
     - **Score placeholder row** (same geometry as `ScoreBlock`): row, `alignItems: flex-end`, gap 16.
       - Numeral block: 76 × 62, `surface2`, radius 12.
       - Verdict stack: gap 8, paddingBottom 4. Bar 1 is 96 × 18, bar 2 is 160 × 14; both radius 7, `surface2`.
       - Shimmer: Reanimated opacity 1 → 0.55 → 1, 900 ms, repeating. Static at opacity 1 with Reduce Motion.
     - **Found-piece pills**: wrapping row (`flexWrap`, gap 6 both ways), `Pill` (26 tall, padding 10, footnote/600).
       - Found: `tone="gray"` (surface2 / ink2).
       - Pending: `tone="pending"` (ink3), text `t('read.pending', {slot})`.
       - Pills fade in as slots stream (no slide; plain appear with Reduce Motion).
   - `<Seam />` as a **direct child of the KCard** (it carries its own 18 inset).
   - Section 2: padding 14/16, holding `<StageList stages=… />`:
     - rows gap 12 (CSS 11.5), circle 24 (23.5), ring 1.5, row gap 13, label `callout`
     - done: filled ink + `checkmark` in surface
     - now: copper ring with a clear top, 1 s spin; label 600 ink
     - pending: `line` ring, label ink3
     - count = mono 13 ink3 `read.stage.piecesCount` ("3 of 4") on row 1
3. Keys: `read.tag`, `read.eta`, `read.slow`, `read.stage.pieces`, `read.stage.piecesCount`, `read.stage.fit`, `read.stage.color`, `read.stage.fixes`, `read.pending`. Pill labels are garment names from the reading.
4. States:
   - stage progress: 1 ticks with the slots; 2 and 3 tick with the scorer; 4 with the text model
   - 9 s: right tagline → `read.slow`
   - 16 s → S19b
   - When done, the card **morphs in place** into S6 / S6p / S6r (cross-fade the inner content, same `KCard` instance) so the thread doesn't jump.
5. VoiceOver:
   - the card is one element, `accessibilityRole="progressbar"`, label `read.tag`, value "Checking fit, step 2 of 4"
   - announce once per finished stage: "{stage}, done" (**NEW** `read.a11y.stageDone`). Today `StageList` announces the *now* stage label; change it to announce completion.

**6b. Occasion question** (below the card, not inside it; a separate thread item, full width)
1. Covered: `Chip` + `ChipFlow`. **Change:** `ChipFlow` needs a `gap` prop (8 here, 6 in the sheets).
2. Layout:
   - column; question → chips gap 6 (CSS 10.5 minus the chip's 5 pt hit pad); hint `marginTop: -2` after the chips
   - question: subheadline/600, ink
   - chips: 34, capsule, padding 14, 1 pt `line`, `surface`, subheadline/500, columnGap 8 (CSS 8); visual row gap is 10 because of the hit pads
   - selected: `ink` fill + border, `surface` text
   - hint: footnote, ink3
3. Keys: `read.occasion.q`; chips `occasion.everyday`, `.classWork`, `.date`, `.interview`, `.event`, `.gym`, `.home`; hint `read.occasion.hint` {occasion}.
4. States:
   - preselected = last-used occasion (Everyday the first time)
   - a tap re-scores in code (light haptic)
   - the block stays under the finished card until he scrolls past or sends something
   - **The hint shows only while the preselection is untouched** (B13)
   - AX sizes: chips stack
5. VoiceOver: group label `read.occasion.q`; each chip is a button with `selected` state.

---

### Screen 7 · S6 Fit check card

Thread: photo bubble (caption = occasion · time), then the card. Compact composer. Nav subtitle `stylist.quota.recheck`.

Card = `KCard`, assembled as:
- Header section
- Seam (direct child)
- Fixes section
- Seam
- Footer section

**7a. Header section**
- `KCardSection` padding 14/16, gap 10. CSS `.card-pad` + inline gap 10.

**7b. Tagline + occasion chip**
1. Covered: `TagLine`. **Changes:**
   - (a) a right-side `chevron.down` glyph: size 10, weight `semibold`, `ink2`, gap 4, after the mono text
   - (b) the right side becomes an `@expo/ui` `Menu` trigger listing the 7 occasions
   - (c) hitSlop 14 so the mono line (16 tall) reaches 44
2. SF Mono 12 sentence case: left ink3, right ink2.
3. Keys: `card.tag.full`; right = the occasion key.
4. States: picking an occasion re-scores in code; the number cross-fades (`8.0 → 7.5`).
5. VoiceOver: "Fit check, full. Occasion: Date. Double-tap to change." (Inside the one-element card this becomes the custom action "Change occasion" (**NEW** `card.a11y.changeOccasion`).)

**7c. Score block** (`.score-row`, `.score`, `.score sub`, `.verdict`)
1. Covered: `ScoreBlock { score, verdict }`.
2. Measurements:
   - row `alignItems: flex-end`, gap 16 (15.5)
   - numeral: `Numeral size=76`, ArchivoCondensed-SemiBold, tabular, tracking −2.5% (−1.9 pt), ink, descender trimmed
   - "/10": mono 15 (14.5) ink3, gap 4, `alignItems: baseline` with the numeral
   - verdict stack: gap 4, paddingBottom 4; word `scoreWord` (headline 17/600 ink); verdict `verdict` (subheadline 15, ink2), up to 2 lines (wraps, never truncates)
   - Target: the verdict's last baseline sits ~3–4 pt **above** the numeral baseline (measured in `07-light.png`)
   - AX sizes: stacks
3. Keys: score via `displayScore()`; word via `score.word.*`; `card.outOf`; verdict text from the explainer. Demo: `card.example.verdict`.
4. States: full / partial (7c + PartialLabel, screen 11) / preview (no "/10"). The word always shows.
5. VoiceOver: part of the card label.

**7d. Fixes section** (`.fixes`, `.fix`, `.fix .n`, `.fix .what`, `.gain`)
1. Covered: `FixRow { number, title, detail, gain, done }` and `TipLine { lead, text }`. **Change:** add a 1 pt `line` `RowDivider` between consecutive FixRows (`.fix+.fix`).
2. Measurements:
   - section: `KCardSection paddingVertical={4} gap={0}`
   - FixRow: paddingVertical 10 (10.5), gap 12 (11.5)
   - badge: 26, 1.3 ring `ink`, number footnote/700
   - title: `fixTitle` (callout 16/600)
   - detail: `fixDetail` (footnote, **ink2**; the CSS says ink3, see B7)
   - title/detail gap ~2.5
   - gain: mono 15 (14.5)/500, `accent`, no wrap
   - TipLine: 1 pt `line` top border, padding 8 top / 6 bottom, footnote ink2, lead footnote/600 accent
3. Keys:
   - `card.gainTo` {score}
   - tags `fix.tag.free`, `.freeIfOwn`, `.fromCloset`, `.tailor`, `.buy`
   - demo `card.example.fix1`, `card.example.fix1Sub`
   - `card.nextLevel` + `card.example.nextLevel`
4. States: 1–3 fixes, the free one first. Dialed-in (S22) replaces this block with title `dialed.title` (callout/600) plus the TipLine. AX sizes: the gain moves under the text.
5. VoiceOver: inside the card label as "Top fix: …".

**7e. Footer section**
- `KCardSection` padding 14/16, **gap 6** (CSS 10 minus the button's 4 pt hit pad).

**7f. Added-to-closet row** (`.added`, `.added .thumbs span`, `.added a`)
1. **New** `AddedRow { items: {type, color}[], count, onReview }`.
2. Measurements:
   - row alignItems center, gap 10 (10.5)
   - thumbs: up to 4; each 28 × 28 (28.5), radius 8, `surface2`, 1.5 border `surface`; `marginLeft: -8` from the 2nd on; later ones on top (zIndex = index); GarmentIcon 24
   - text: `addedRow` (subheadline, ink2), flexShrink 1
   - "Review": text link pushed right (`marginLeft: auto`), subheadline/600 accent. Use an **inline** TextLink (no `minHeight: 44`; `hitSlop {top:8,bottom:8,left:8,right:8}`) so the row stays 28 tall.
3. Keys: `card.added` {n}, `card.review`.
4. States: hidden when 0 added. Review → S11 sheet.
5. VoiceOver: custom action "Review added items" (**NEW** `card.a11y.review`). Standalone label: "Added 4 items to Closet: white tee, tan chinos, white sneakers, beige overshirt. Review."

**7g. Actions row** (`.actions`, `.btn.p`, `.btn.icon`)
1. Covered:
   - `KButton kind="primary" size="regular" icon="recheck" style={{flex:1}}`
   - `IconButton icon="share" diameter={36} label=…`
2. Measurements:
   - row gap 8, alignItems center
   - button: visual height 36, capsule, padding 16; `arrow.clockwise` icon 16 (15.5) + gap 6; subheadline/600 onPrimary
   - share circle: 36, `surface2`, glyph ~15 ink, hitSlop to 44
3. Keys: `card.recheck`, `card.share.a11y`.
4. States:
   - pressed 82%
   - the Re-check button is hidden after the window closes (30 min; first-ever check: until 4 am) or once used; then the row is Share alone, right-aligned
   - **Dialed-in:** primary becomes `dialed.save` with `bookmark`
   - AX sizes: stacked full width
5. VoiceOver: buttons "Re-check after fixing" and "Share" (also card custom actions).

**7h. Text links** (`.links`)
1. Covered: `TextLinkRow` + `TextLink`. **Changes:**
   - (a) a `compact` TextLink (no `minHeight`, `hitSlop {top:12,bottom:12}`)
   - (b) a `color` prop (the "Later" link is ink2)
   - (c) TextLinkRow `justify` prop (S6r centers)
2. Measurements:
   - columnGap 24 (23.5), subheadline/600 (15.5), accent
   - optional footnote below (`finePrint`, ink3, marginTop 4): "Scored with rules v3.1" on old cards
3. Keys: `card.why` {score}, `card.nqr`, `card.later` (first-ever check only), `card.rulesNote` {version}.
4. States: `Later` shows only on the first-ever check.
5. VoiceOver: custom actions "Why this score", "Not quite right?" (and "Later").

**7i. Card as a whole**
1. `KCard accessibilityLabel accessibilityActions onAccessibilityAction`. The card is ONE element.
2. Long-press: `@expo/ui` `ContextMenu` with Why this score, Not quite right?, Re-check, Share, Save.
3. Label: `card.a11y.fitCheck` → "Fit check, Date. Score 8 out of 10, Sharp. Clean base… Top fix: wear the overshirt, open, free. Added 4 to Closet."
   - Score via `spokenScore()`.
   - `{partial}` is empty here.
   - Append the added count.
4. Custom actions: why, nqr, recheck, share, review, changeOccasion.

---

### Screen 8 · S7 Why this score (sheet)

The route exists: `sheets/why/[checkId]`, `formSheet`, detents [0.78, 1].

1. **Chrome:**
   - native grabber (`sheetGrabberVisible`); don't draw `.grab`
   - `headerShown: false`
   - content in a `ScrollView`, padding top 28 (CSS 8 + 5 grabber + 2.5 + 12), sides 20, bottom 24; column gap 12
2. **Title row** (`.sheet h4`):
   - row `space-between`, center
   - `KText role="sheetTitle"` (title2 22/700) `why.title` {score}
   - `IconButton icon="close" diameter={36}` (glyph ~15), label `common.close`, `router.back()`
3. **Subtitle** (`.sub-t`): `sheetSubtitle` (subheadline, ink2), `marginTop: -6`, text `why.sub`.
4. **Ledger** (`.ledger .l`):
   - Covered: `LedgerRow { rule, item, amount, valueText }`, padding 9/0, gap 13, 1 pt `line` bottom border.
   - Label: subheadline ink2 with the rule in 600 ink. Value: mono 15, no wrap.
     - plus → `good`
     - minus → `accent`, with U+2212
     - zero → ink
   - **Change:** zero formatting: "+0" for credits, "±0" for the occasion row, `valueText="—"` for not-rated.
   - Rows (demo):

     | Rule | Item | Value |
     |---|---|---|
     | `why.start` | — | valueText "7.0" |
     | `why.credit.elevated` | `why.example.elevated` | +0.5 |
     | `why.credit.shoes` | `why.example.shoes` | +0.5 |
     | `why.credit.layered` | `why.example.layered` | "+0" |
     | `why.credit.interest` | `why.example.interest` | "+0" |
     | occasion word | `why.example.occasion` | "±0" |

   - Partial row: `Shoes` · `why.partialRow` · "±0". Not-rated: garment · `notRated.pill` · "—".
5. **Total** (`.ledger .tot`):
   - Covered: `LedgerTotal { score, note }`, paddingTop 13, flex-end.
   - "Your score" = `why.total` (headline).
   - Note = `why.noMistakes` / `why.mistakes` {n} (plural), footnote ink3.
   - `Numeral 52` + "/10" mono ink3.
   - Spoken: "Your score, 8 out of 10. No mistakes found."
6. **What I read** (column gap 8):
   - `TagLine` left `why.read`; right `why.howLink` in **accent**. **Change:** TagLine needs `rightColor="accent"` + `onPressRight` → push "How I score" (`why.how.*`) inside the sheet's own stack.
   - Pills: wrapping row gap 6, `Pill tone="gray"`. They are **tappable**, so wrap each in a `Pressable` (role button, hitSlop vertical 9). Tap → dismiss + open S8 with that row expanded on "Wrong color or fit". Label "{garment}. Correct it" (**NEW** `why.a11y.pill`).
7. **Footer:** `finePrint` (footnote ink3) `why.footer`.
8. **VoiceOver:** each ledger row is one element ("Elevated piece, tan chinos, plus 0.5.").

---

### Screen 9 · S8 Not quite right? (sheet)

Route `sheets/correct/[checkId]`, detent [1]. Same chrome as screen 8 (title `nqr.title`, X, subtitle `nqr.sub`). Column gap 12.

1. **Reason chips:**
   - `ChipFlow gap={6}` + **regular** 34 `Chip` (the mockup uses `.chip`, not `.sm`)
   - `nqr.reason.item`, `.detail` (selected in the drawn state), `.fix`, `.score`
   - single-select; selected = ink fill
   - VoiceOver: a radio-like group; each chip has the `selected` state
2. **Garment list** (frame + `.read-row`)
   - **New** `ReadRow` and `ReadList`.
   - Frame: 1 pt `line` border, radius 20, `overflow: hidden`; 1 pt `line` divider between rows.
   - Row: `flexDirection: row`, alignItems center, gap 13 → 12, padding 10 (10.5) / 16 (15.5).
     - Tile: 44 × 44, radius 12 (11.5), `surface2`, GarmentIcon 36.
     - Text: title `KText variant="subheadline" weight="600"` ink (B14); detail `rowSubtitle` (footnote ink2).
     - Trailing: `pencil` 20 (19.5) in **ink3**, inside a 21-wide box.
   - Open row: background `accentSoft`; the detail becomes the question in `accent`, weight 600.
   - Under the open row: a panel, `accentSoft`, padding 2 / 14 / 14, with value chips (`ChipFlow gap 6`, regular 34 chips, single-select).
   - Panel open/close: height animation 200 ms (instant with Reduce Motion).
3. **Keys:**
   - rows `nqr.example.teeDetail`, `nqr.example.chinos`, `nqr.ask.fit`, `nqr.example.sneakerDetail`
   - values `value.leg.*` (Slim selected), `value.topFit.*`, `value.hem.*`, `value.sleeve.*`, `value.tuck.*` (after the key split)
   - `nqr.notInPhoto`, `nqr.skipFix`, `nqr.nextFix`, `nqr.higher`, `nqr.lower`, `nqr.whatWouldYouGive`
4. **Preview line** (`.preview-line`): row `space-between`, `alignItems: baseline`.
   - Unchanged: "Score stays " (subheadline ink2) + **"8.0"** in `headline` (SF 17/600, ink, tabular).
   - Moved: "Score " + `Numeral size={31}` "8.0 → 8.5", with the new number in `accent` (two Numerals + an arrow Text in one baseline row).
   - Right: `Pill tone="ok"` `nqr.closetUpdated` (transparent, 1 pt line, `good` text + checkmark), only when a closet item matches.
   - Keys: `nqr.scoreStays`, `nqr.scoreMoves`, `nqr.thanks`.
5. **Save:** `KButton kind="primary" size="large"` (50, full width, headline). `nqr.save`; label becomes `nqr.send` in "Score feels off" mode.
6. **States:** the 4 reason modes (02 D9 table); live re-score on every chip tap; Save → toast `nqr.toast.saved` {item} / `nqr.toast.generic`.
7. **VoiceOver:**
   - row: "Tan chinos, straight leg. Edit." With `accessibilityState={{expanded}}`, the open row reads "…Expanded. Choose a fit."
   - preview: "Score stays 8. Closet updated."
   - Announce score changes.

---

### Screen 10 · S6r Re-check card

Thread:
- `StylistMessage` (no header): `recheck.prompt` (demo: "Overshirt on? Send it. I'll only re-read the layer.")
- photo bubble, caption `recheck.bubbleCap` · time
- the card

**10a. Header section** (`KCardSection` padding 14/16, **gap 12**)
- TagLine: `card.tag.recheck` / occasion (chevron, see B18).

**10b. Delta row** (`.delta`, `.delta .was`, `.delta .ic`)
1. **New** `DeltaRow { was, now }`.
2. Measurements:
   - row `alignItems: flex-end`, gap 8, items in order:
   - **was:** `Numeral size={44} face="scoreLight"` (ArchivoCondensed-Medium), `ink3`, trimmed, `marginBottom: 4` (puts its baseline ~1 pt below the hero's, as measured).
     - **Strike:** an absolute `View` 1.5 tall, `ink3`, full numeral width, bottom = 12 pt above the was baseline. Don't rely on `textDecorationLine`: RN can't set its thickness.
   - **chevron:** `chevron.right` as SF size ~20, weight medium, `accent`, centered in a 28 × 28 box, `marginBottom: 7`. A 28 pt SF glyph is visibly bigger than the mockup's stroked SVG.
   - **hero:** the same numeral + "/10" group as 7c (`Numeral 76` + mono "/10").
   - **pill:** `Pill tone="accent"` (accentSoft / accent, 26 tall) with `marginLeft: 'auto'`, bottom-aligned.
3. Copy: `card.gainRaw`? No: the pill shows the **rounded** score difference "+1.0" (format `+{delta}`, one decimal); the fix row shows the raw gain.
4. States: up / same (S21 "change not seen": no strike or chevron; plain ScoreBlock + `recheck.notSeen`). The score never drops from noise.
5. VoiceOver: part of the card label.

**10c. Summary** (`.summary`)
- `cardSummary` (callout 16, ink). The verdict word is nested `KText weight="600"`.
- Key `recheck.example.summary` (demo). Template: sentence + **{word}.** + "Nothing else changed."
- Optional line `recheck.newProblem`, `recheck.tell.confirmed`.

**10d. Fixes section** (padding 4/16)
- `FixRow done` (filled ink badge + `checkmark`, title ink2 struck in ink3, no detail, gain `+0.75` mono accent).

**10e. Footer** (`KCardSection` padding top 4 / sides 16 / bottom 14, gap 4)
- `KButton kind="primary" size="regular" fullWidth icon="share"` `recheck.share` (36 visual).
- Compact `TextLinkRow justify="center"` with `recheck.tellMe` → `sheets/tell-me`.
- S21 variant: primary `recheck.iDid` + secondary `recheck.tryAnother`.

**10f. VoiceOver**
- One element: "Re-check, Date. Score went from 8 to 9, up 1.0. Dialed in. Done: wear the overshirt, open." (**NEW** `card.a11y.recheck`)
- Custom actions: Share, Tell me.

---

### Screen 11 · S6p Partial check card

Same as screen 7 except:

1. **Tagline:** `card.tag.partial` / occasion + chevron.down (the mockup's "Everyday ▾" glyph becomes the SF chevron).
2. **ScoreBlock:**
   - word `score.word.gettingThere`
   - `PartialLabel` instead of the verdict: `square.dashed` icon 16 (15.5) ink, gap 6 (6.5), `partialLabel` (subheadline/600 ink), wraps to 2 lines
   - after a full finish: `checkmark.circle.fill` + `partial.full` / `partial.fullCloset`
3. **Summary row** (inside the header section, gap 10): `KText variant="subheadline" color="ink2"`. Not `cardSummary`: the mockup overrides it to 15 ink2.
   - Key `partial.example.summary` (demo); it always ends with `partial.mayChange` while partial.
4. **Fix row:** `partial.example.fix`, detail `fix.tag.fromCloset` only if a matching ClosetItem exists, else `fix.tag.freeIfOwn`; gain "→ 7.0".
5. **Finish-the-check row** (`.pick`, `.pk`, `.pk.snap`, `.sk`)
   - **New** `FinishCheckRow`.
   - Row alignItems center, gap 8 (9).
   - Text: one `KText variant="subheadline" color="ink2"` with a nested 600 `ink` "Finish the check" + "\n" + second line; flexShrink 1 (~180 pt available; must fit "Same shoes as Monday?").
   - Remembered-pair tile: 44 × 44, radius 12 (13), `surface2`, 1 pt `line`, GarmentIcon 36, `marginLeft: 'auto'`.
   - Camera tile: 44, `surface` + 1 pt `line`, `camera` 20 ink.
   - Skip: subheadline/600 ink2, paddingLeft 4, 44 hit.
   - AX sizes: text on its own line, controls in a row under it.
   - Keys:
     - `partial.finish.title`
     - `partial.finish.same` {weekday} (demo = "Monday", computed; never hard-code)
     - `partial.finish.snapOrPick` (tile shows a `shoe.2` icon → S10)
     - `partial.finish.snapOnly` (tile hidden)
     - `partial.finish.bottom` (tile hidden)
     - `common.skip`
   - States:
     - pair tap → applies stored attributes, re-scores in place
     - camera → S9; returns with a cross-fade if the score moves
     - Skip → the row hides for good; the label stays
   - VoiceOver: three separate buttons, **not** folded into the card element. `partial.a11y.useSame` {shoes, weekday}, `partial.a11y.snap`, `partial.a11y.skip`. The card's one-element label covers the rest, so give this row `accessible={false}` children reachable via custom actions "Use your white sneakers from Monday" / "Snap your shoes" / "Skip finishing the check".
6. **Actions and links:** as screen 7 (`card.why` "Why 6.5?").
7. **VoiceOver card label:** `card.a11y.fitCheck` with {partial} = "Partial check: shoes not included. ".

---

### Screen 12 · S1 Stylist home (idle)

**12a. Thread**
- `FlatList`, bottom-anchored. Use `inverted`, or `contentContainerStyle={{flexGrow:1, justifyContent:'flex-end'}}` + `maintainVisibleContentPosition`.
- Padding 4 / 16 / 184 (idle) or 146 (compact). Item gap 12.
- Order: DayStamp ("Thursday 8:00 am") → StylistMessage with header (`stylist.morning` {occasionWord}) → Outfit idea card.
- Earliest in the history: `stylist.aiNote` once (with header).

**12b. Outfit idea card**
1. **New** `OutfitIdeaCard`: `KCard` + `TagLine` + **new** `OutfitTiles` + two `KButton`s.
2. Measurements:
   - one section, padding 14/16, gap 13 (CSS inline gap 13); visual 13 to the buttons' top means section gap 9 above the actions (buttons add 4)
   - TagLine `idea.tag` / `idea.fromCloset` (not pressable)
   - Grid: 4 columns, gap 8. Each column: square tile (aspect 1; ≈78 pt on a 402 phone), radius 18, `surface2`, GarmentIcon 62%; minilabel `miniLabel` (footnote ink2) gap 6 (6.5), wraps to 2 lines
   - At AX sizes: 2 columns
   - Actions: gap 8, hugging. `KButton primary regular` `idea.wear` + `KButton secondary regular` `idea.swap` (`surface2` / ink)
3. Keys: `idea.tag`, `idea.fromCloset`, `idea.wear`, `idea.swap`, `idea.wearing`, `toast.logged`, `idea.youdNeed` (missing slot = dashed 1.5 `inkFaint` tile, glyph 50%).
4. States:
   - Wear this → the card shows `idea.wearing` with a check; button disabled (40%); toast with Undo
   - a tile tap pushes C2
5. VoiceOver: one element, "Outfit idea from your closet: navy overshirt, grey tee, khaki chinos, white sneakers." Custom actions Wear this, Swap one.

**12c. Dock:** idle composer (A8). **12d. Nav:** A1 with `stylist.quota.free`.

---

## B. Mockup vs 02 disagreements (and which wins)

1. **Reading screen (6).** The mockup is a full screen (X, "Reading your fit / About 7 seconds" nav, 317 pt photo, scan line, detection tags, "Only this **crop** is sent"). **02 wins (ruling 13):** an inline skeleton card. The nav text moves to the card tagline, the tags become pills, the copy is `Only this is sent`, and `DetectionTag` goes unused.
2. **His photo bubbles on 7, 8, 10** use `data-crop="blur"` (a blurred head shows). **02 wins:** `neck` everywhere (the face is never stored). Screen 11 is already `neck`.
3. **Taglines:** the mockup is DM Mono 12.5, uppercase, 0.09 em tracking (as the PNGs show). **02/03 win (ruling 29):** SF Mono 12, sentence case, no tracking ("Fit check · Full").
4. **Occasion affordance:** 7 and 10 show plain "Date"; 11 shows the text "Everyday ▾". **02 wins:** every card's occasion gets an SF `chevron.down` and opens a menu.
5. **The `Later` link** isn't drawn. **02 wins:** it shows on the first-ever check only.
6. **Partial (11):** "Same shoes as **Sunday**?" → **computed** (`Monday` in the seed). The fix tag "Free · from your closet" is conditional, else `Free if you own one` (ruling 20).
7. **Fix detail color:** CSS `.fix .what span` is ink3 → **ink2** (03 §3.2, 02 D7).
8. **ink3 values:** the CSS #848A99 / #6E7484 fail contrast → **#646A7A / #9096A5** for text and meaningful glyphs (pencil, chevrons). The old values survive as `inkFaint` for seams and dashes only.
9. **Stylist nav:** the mockup's trailing slot is empty → **02 adds the `…` menu** (drop it only if it crowds the title).
10. **Nav subtitle color:** mockup and 02 say ink3; 03's role-map line says "caption ink2". **Mockup/02 win: ink3** (the fixed value).
   - Mockups 10 and 11 show no subtitle at all; **02's quota rules win** (for example, after the re-check is used: `Check used today`).
11. **Tab bar:** the mockup's custom accentSoft capsule → **native NativeTabs** with `tintColor=accent` (03 §2.3).
12. **"Closet updated" pill:** the mockup has text only → **03 adds a leading checkmark** (not color alone). 03 wins; it's an accessibility fix.
13. **Occasion hint vs selection (6):** the mockup shows `Date` selected under "Everyday is picked unless you tap." That's contradictory. **Decision:** show the hint (with the preselected occasion) only until he taps a chip, then hide it.
14. **Read-row title size:** 02 D9 says `.subheadline.weight(.semibold)`, 03 says `.callout.weight(.semibold)`, CSS says 15.5. **02 wins** (screen spec; S11 agrees): subheadline/600.
15. **Ledger zeros:** the mockup shows "+0" for Layered and Point of interest and "±0" for the occasion. The existing `LedgerRow` prints "±0" for all. **Mockup wins.**
16. **Partial summary:** the mockup overrides `.summary` to 15 ink2; 02 says subheadline ink2. They agree; don't use the `cardSummary` (callout ink) role there.
17. **S8 chips:** 03 says the small chip variant is "for sheets", but mockup 9 uses regular 34 chips. **Mockup wins** (03 permits small; it doesn't require it).
18. **Re-check card occasion:** 02's rule says "every card" is tappable, but the re-check's occasion is locked ("opens S2 in the same mode, occasion locked"). **By precedence the chevron shows.** My recommendation: changing it re-scores *both* readings in code, so the delta stays like-for-like. Flag this to the founder; the alternative is a static label on S6r only.
19. **Photo-bubble lock:** 02 says 15.5; the existing `PhotoBubble` uses 12 → use 16. The reading caption can't fit on one line at 135 pt, so let it wrap to 2 lines (my call; nothing is drawn for it).
20. **Sheets:** the mockup draws the grabber and the 38-radius inset sheet → **use the system form sheet** (native grabber; don't draw `.grab`). The mockup's sheet tops (y 190 / 150) map to detents 0.78 / 1, already in `_layout.tsx`.
21. **Quick-start chip text:** CSS 14/600 → `subheadline` 15/600 (03 role map). The row scrolls, so the extra width is fine.
22. **Score face:** the mockup uses Archivo variable width 70 / weight 640 → static **Archivo Condensed SemiBold** (width 75 / 600), about 7% wider. Accepted in 03 §3.4.

---

## C. Neck-down crop math (expo-image in a clipping View)

**Inputs**
- From `app/assets/demo-photos/demo-photos.json`: `neck`, `foot`, `cx` (fractions of image height/width).
- **Not in the JSON: the pixel size.** Read it with `Image.resolveAssetSource(require(...))` (`width`/`height`), or add `w`/`h` to the JSON.
- Actual sizes: p01a and p01b 546×820, s24 543×820, s25 461×820, s05/s14/s15 656×820, s22 615×820, s09/s10/s13 546×820, s12 547×820.
- Target box W × H (bubble: **127 × 172**).

**The math** (this matches the mockup's `placePhoto`, `mode === 'neck'`):
```
ar     = imgW / imgH
span   = (foot + 0.012) - neck                     // the mockup pads the feet by 1.2%
h      = H / span                                  // rendered image height so neck→feet fills H
w      = h * ar
if (w < W) { w = W; h = W / ar }                   // too narrow: fill the width instead
offX   = clamp(W/2 - cx * w, W - w, 0)             // center on the body, never expose an edge
offY   = clamp(-neck * h,   H - h, 0)              // chin line at the top; never show a gap at the bottom
scale  = h / imgH                                  // pt per source pixel (for reference)
```
where `clamp(v, lo, hi) = Math.min(hi, Math.max(lo, v))`.

**Render**
```tsx
<View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: colors.surface2,
               borderTopLeftRadius: 17, borderTopRightRadius: 17, borderBottomRightRadius: 4,
               borderBottomLeftRadius: 17, borderCurve: 'continuous' }}>
  <Image source={src} contentFit="fill" transition={0}
         style={{ position: 'absolute', left: offX, top: offY, width: w, height: h }} />
</View>
```
- `fill` is correct because w/h already match the aspect.
- Hide it from VoiceOver; the bubble carries the label.

**Worked check, p01b in the bubble** (ar .6659, W 127, H 172):
- span .682 → h = 252.2, w = 167.9
- offX = 63.5 − 83.95 = **−20.5** (inside [−40.9, 0])
- offY = −79.4, clamp lower bound 172 − 252.2 = −80.2 → **−79.4**

**s24:** span .702 → h = 245.0, w = 162.3; offX = 63.5 − 89.3 = −25.8; offY = −75.9 → clamped to **−73.0**. The clamp matters here: without it, a 2.9 pt strip shows at the bottom. The current `NeckDownPhoto` gets this wrong when `foot ≈ 1` and in its width-fill branch.

**Real (non-demo) app:** the stored photo is already neck-down, so `contentFit="cover"` + `contentPosition="top center"`, no math.

**Same function everywhere:** the card thumbnail, Lookbook, share card and S13. **Never** use the `blur` mode.

---

## D. Top 10 details most likely to go wrong

1. **Score numeral alignment.**
   - `Numeral size=76`: ArchivoCondensed-SemiBold, no `fontWeight`, `letterSpacing −0.025 em`, `tabular-nums`, no `lineHeight`, descender trimmed via `onTextLayout`.
   - "/10" is mono 15 ink3, baseline-aligned, 4 pt gap.
   - The score row is `flex-end` with the verdict's `paddingBottom: 4`, so the verdict's last baseline sits ~3–4 pt above the numeral baseline.
   - Test "6.5", "8.0", "9.5"; light and dark; AX5 (stacks; cap 1.6×).
   - Confirm the PostScript names with `getLoadedFonts()`; the fallback is SystemCondensed.
2. **Seams vs hairlines.**
   - Seams (5 on / 4 off, `inkFaint` @ 45%, inset 18) go **between card sections, as direct children of `KCard`**. Inside a padded section they'd be double-inset to 34.
   - Rows inside a section use a 1 pt `line` (FixRow dividers, TipLine top, ledger rows), never `hairlineWidth`, never dashed.
3. **Copper discipline.**
   - Accent only on: gains ("→ 9.0", "+0.75"), text links (Why / Not quite right? / Review / Tell me / How I score ›), the "Next level" lead, the "+1.0" pill, the delta chevron, mistake ledger values, the open read-row question, the spinning stage ring.
   - Never on: the send button (`primary`), primary buttons, selected chips (ink), the numeral, the partial label (ink), "Closet updated" (`good`).
   - No red anywhere.
4. **Hit padding inflating gaps.**
   - `KButton` regular adds 4 pt above and below; `Chip` adds 5; `TextLink` forces 44.
   - Card footer gap 6, not 10.
   - Compact links (hitSlop) in cards and the Added row.
   - Occasion block gap 6.
   - Otherwise the cards grow ~20–30 pt taller than the mockup and fail the 4 pt tolerance.
5. **Photos.**
   - Neck crop with clamps (§C).
   - Bubble 135 = 4 + 127 + 4; photo 172; tail corners BR 6 outer / 4 inner.
   - The reading caption wraps.
   - Show `surface2` while loading.
   - Never a face, never `blur`.
6. **Mono text.**
   - `ui-monospace` (SF Mono) 12 / 500, **sentence case**. The PNGs show uppercase tracked DM Mono; don't copy that.
   - Gains and ledger values are mono 15 tabular.
   - Verify on device that SF Mono renders ("iiii" = "MMMM" width).
7. **Re-check delta.**
   - The "was" score uses the **Medium** cut 44, ink3, with a 1.5 pt strike drawn as a View.
   - Chevron ~20 pt SF in a 28 box, copper, raised ~7.
   - The pill is pushed right and bottom-aligned.
   - The pill shows the rounded delta ("+1.0"); the done fix shows the raw gain ("+0.75").
   - The verdict word is bold inside the summary, not beside the number.
8. **Ledger formatting.**
   - Credits: "+0.5" in good; unearned "+0" in ink.
   - Occasion and partial: "±0"; not-rated: "—".
   - Mistakes: "−0.5" with U+2212 in copper.
   - `nowrap`.
   - VoiceOver speaks the sign ("plus 0.5").
9. **VoiceOver structure.**
   - Each result card is ONE element with custom actions; labels are built from keys with `spokenScore()` ("8", not "8.0").
   - No body words.
   - The Finish-row buttons and the occasion menu must stay reachable (custom actions).
   - Seams and garment icons are hidden.
   - Stage completions are announced once.
10. **Dark mode and contrast.**
   - The primary button becomes a light pill with near-black text.
   - The card shadow is off (border only); accentSoft goes to 15%; the bubble is `#2A3150`.
   - The avatar "K" stays fixed indigo `#1B2340` in both modes.
   - The composer fade uses the current `bg`.
   - Increase Contrast swaps ink3 → ink2 and darkens `line`; test every screen in light, dark, IC and AX5.

Also easy to miss:
- the double ellipsis on pending pills (§0 bug 1)
- `ChipFlow` needs a `gap` prop (6 in sheets)
- `TagLine` needs the chevron and an accent right side
- don't draw a grabber in sheets
- `square.dashed` plus words for partial checks (never icon-only)

Files referenced: `/Users/eyu/Desktop/files/Kitted/app/src/design-system/components/{Chat,Chip,ScoreBlock,Numeral,FixRow,KButton,MonoLabel,Ledger,StageList,KCard,Seam,IconButton}.tsx`, `/Users/eyu/Desktop/files/Kitted/app/src/i18n/en.generated.ts`, `/Users/eyu/Desktop/files/Kitted/app/assets/demo-photos/demo-photos.json`, `/Users/eyu/Desktop/files/Kitted/app/src/app/_layout.tsx` (sheet routes), `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html`.
