# Visual tone: the rules a direction is built and judged by

For `/redesign`'s art director (building directions), interaction designer and redesign critic (judging them). The research and its sources are in `.claude/skills/redesign/references/design-research.md`; each rule below names how strong its evidence is. **Strong** = Apple's rules or replicated research. **Practice** = what serious product teams and the reference brands do, which is convention, not proof.

## 1. What is fixed in every direction
- **The hard lines** (CLAUDE.md): no face, body, weight or skin; no emoji, ranks or anime styling; no streaks. These aren't up for a direction to change.
- **Apple's chrome stays Apple's** (strong; WWDC25 #356): the NativeTabs tab bar, native-stack headers and their glass bar buttons, form sheets, the native segmented control, switches, menus and alerts. On iPhone these are capsules and glass, and a direction doesn't redraw them. Their tint color is the direction's call.
- **Concentric nesting** (strong; WWDC25 #356): a shape inside a rounded shape takes radius = outer radius − padding, never its own number. If outer − padding would be under 4, the inner corner is square or ≤ 4, never larger than the outer.
- **Accessibility** (strong; HIG, 03 §1.6): 44 pt hit areas, 4.5:1 text contrast (3:1 for meaningful shapes), Dynamic Type to AX5 with reflow, dark mode from its own tokens, Reduce Motion and Reduce Transparency.
- **Glass only on controls that float over content** (strong; WWDC25 #356, 03 §1.5). Never behind reading text.
- **The score is a number and a word, never color alone** (03 §1.2).

## 2. What a direction decides (and must write down as numbers)
1. **Shape scale:** at most **three** radii for Kitted's own surfaces (containers / inner items / small marks), plus 0 if used, plus capsule only where the direction names a reason. Each surface below gets one: card, small card, tile, thumbnail, photo, chip, in-content button, composer field, his bubble, Kit's text, badge, score block, sheet content.
2. **Where capsules and circles are allowed** outside Apple's chrome. In today's app they're the default for buttons, chips, pills, the composer, fields, numbered badges and icon buttons. A direction lists each one as kept, changed (to what), or removed.
3. **Type:** the faces (from §3), the roles (large title, title, headline, body, caption, the score numeral, labels), the sizes and weights per role, tracking, case (sentence case, or where caps are allowed), and the maximum number of sizes and weights on one screen.
4. **Color:** the neutral ramp, the one accent and what earns it (today: copper only for score movement, the founder's rule #231; a direction that changes it says so as a founder's call), saturation, how photos sit (edge to edge, matted, framed), and dark mode.
5. **Density and grid:** gutters, the spacing scale's steps used, the row height, how much is on the first screen without scrolling, and the alignment edges (how many left edges a screen may have).
6. **Lines and depth:** hairlines vs seams vs space between sections, borders, shadows (today: one faint card shadow, light mode only).
7. **Icons and marks:** SF Symbols weight and scale, filled or outline, badges (numbers in circles, or plain numerals), the woven label's role.
8. **Motion:** what moves and how long; Reduce Motion behaviour.
9. **What it keeps from today** (03 §1 "keep all five": the woven wordmark, seams, the tape-measure silhouette, score words, copper as the only accent) and **what it drops,** each a founder's call.

## 3. Faces available without a download
- **SF Pro** (and its Text/Display optical sizes): the system face, Dynamic Type built in.
- **New York** (Apple's system serif), **SF Pro Rounded**, **SF Mono**: system faces on iOS, reached by system font design. Confirm how React Native reaches each before the change list relies on it; mark it "not verified" until checked.
- **Archivo** (already bundled; today only the score numerals and the wordmark).
- **Anything else is a download and usually a license**: the founder's call (CLAUDE.md "Ask before"), with the foundry, the price, the file size, and a system-face fallback the direction still works with.
- In the HTML frames, Chrome may not draw New York. Use a named stand-in (e.g. `ui-serif, Georgia`), say so in the board's caption, and never judge a direction on a stand-in's details.

## 4. What reads as serious, as things you can count (practice)
Judge a screen by these, not by adjectives. Today's numbers are the baseline a direction has to beat; the approved direction's own numbers become the rule.
- **Distinct radii on one screen** (outside Apple's chrome): serious directions use 2–3.
- **Capsules and circles on one screen** outside Apple's chrome: each one has a reason (a choice chip, a toggle-like filter), not "it's a button".
- **Type sizes on one screen ≤ 4, weights ≤ 3;** one face for reading, at most one more for display or numerals.
- **One primary thing per screen:** the squint test (blur the PNG): one element reads first, and it's the one the spec says matters (the score on the result card, the composer and today's card on Stylist home, the pieces in Closet).
- **Accent uses per screen:** only what the color rule allows (today: score movement only).
- **Left edges per screen:** content aligns to few edges (gutter, one inset), not a new indent per card.
- **Decoration that carries no meaning:** gradients, glows, drop shadows beyond the one card shadow, tinted backgrounds behind icons, sparkle "AI" marks, illustrations. Each needs a reason.
- **Photos carry the color** (SSENSE, Mr Porter): UI color recedes so the clothes lead.

## 5. Tells of a generic or toy-like UI (practice; adapted from Anthropic's frontend-design skill, for iOS)
Flag any of these in a board or a frame:
- Every surface the same big radius; pills for everything; numbers in circles; icon buttons as filled circles in content.
- Cards inside cards; every section in its own card with a shadow; centred everything.
- Pastel gradients, glow, "glassmorphism" on content, a sparkle icon for AI.
- Emoji or emoji-like icons; mascots; bouncy or springy motion with no meaning.
- All-caps eyebrow labels over every section; middle-dot meta strings everywhere; an arrow on every link.
- Uniform medium weight everywhere (no hierarchy), or bold everywhere (no hierarchy either).
- Friendly filler copy around the real content (copy is the founder's, but the critic flags extra words the layout invites).

## 6. Shape and tone: what the research does and doesn't say
- People *like* curves more than sharp corners (strong; Bar & Neta 2006; meta-analysis g ≈ 0.39, varies with expertise and task). That's liking, not seriousness: nobody tested "professional".
- Round vs angular shifts associations a little: soft and comfortable vs hard and durable (medium; Jiang et al. 2016). Warm vs competent is assumed in the literature more than tested (weak).
- So no direction may claim "square = serious" as fact. Seriousness in the reference brands comes from restraint and contrast: few radii used consistently, strong type, a grid, quiet color. A direction can be rounded and still serious (Apple, Oura), or square (Uniqlo, Arc'teryx), if its numbers are consistent.

## 7. Reference brands: what each teaches (practice; exact values are third-party reads)
- **Whoop:** dense, dark, few strong numbers, one accent per metric. Density reads expert only with a clear first thing to look at.
- **Oura (2025):** refined type, a new grid, a simpler component set; a serif accent for display.
- **SSENSE:** editorial and near-monochrome; minimal labels; photos lead.
- **Mr Porter:** magazine layout and a house typeface carry the stylist's authority.
- **Uniqlo:** square containers; roundness only for tags; black primary buttons; red used sparingly.
- **Arc'teryx:** zero radius, uppercase display over full-bleed photos, near-monochrome: technical and durable.
- **Apple's iOS 26 apps:** capsule controls on glass, concentric content, exact type and spacing.
A direction names 2–3 of these as its references and says what it takes from each, and what it doesn't.
