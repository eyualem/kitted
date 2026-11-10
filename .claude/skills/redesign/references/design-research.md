# Design research: running a redesign, critiquing it, and what reads as "serious"

Researched Nov 9, 2026 for the redesign tooling (`.claude/skills/redesign/`, `.claude/agents/art-director.md`, the upgraded `ui-designer.md` and `ui-critic.md`). Read only: nothing downloaded or installed. It lives here rather than in `inputs/` because the commit hook refuses anything under `inputs/` (private photos). The rules the agents actually use are distilled in `visual-tone.md`, next to this file.

**How strong each claim is:** **[strong]** replicated research or Apple's own rules · **[medium]** one solid study, or a consistent practitioner consensus · **[weak]** a convention, a blog, or a third party's reverse-engineering of a brand.

---

## 1. How design teams run a visual redesign

- **Direction comes before components, and gets agreed before the first big review.** Mood boards are used early in a new product "or when substantially revising one", to decide the visual and emotional direction (NN/g, *Mood Boards*). InVision's guide says to agree the look and feel before the first big design review, then use the board as a map to check later choices against. Wiredcraft says to keep boarding until the team agrees on tone, then write principles from it, then apply them to color, type, imagery and layout before any component. **[medium, consistent across sources]**
- **Principles, then a shared vocabulary, then components.** Airbnb's design language system (Saarinen, *Building a Visual Language*, 2016) came out of products that felt inconsistent because teams had no shared language. The fix was principles first, then a small set of components everyone names the same way. **[medium]**
- **A redesign differs from per-feature design** in what it decides. Per-feature design picks layouts inside an existing system. A redesign changes the system itself (shape, type, color, density), then redraws screens in it. So it needs a stage that decides the system once, on a few representative screens, before any feature screen is redrawn; otherwise each screen drifts its own way. (My synthesis of the above.)
- **Show the direction on real screens, not abstract tiles.** Every source above shows the direction applied. A palette and a radius table alone don't let a non-designer judge the feel. Hence 2–3 directions, each on the same three screens, side by side.

## 2. How critiques are run

- **A critique improves the design; it isn't sign-off.** NN/g (Gibbons, *Design Critiques*, 2016): a critique is a conversation tied to agreed objectives and a clear scope, separate from a heuristic *design review*. The pitfalls it names: no agreed objectives, rushing to solve, talking only about negatives. **[medium]**
- **Tie every finding to a stated goal, and describe the problem, not just the fix.** NN/g (above), plus the OneRedOak design-review agent's "problems over prescriptions" and evidence-with-screenshots rules. **[medium]**
- **Independent evaluators, then pool.** Nielsen's severity method says ratings from one evaluator are too unreliable, so average about three independent ones. Severity combines frequency, impact and persistence on a 0–4 scale: 0 not a problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, must fix before release (Nielsen, *Severity Ratings for Usability Problems*, 1994). **[strong, long-standing method]**
- **Write first impressions before discussion,** to avoid anchoring on the first opinion voiced (practitioner critique guides). For an AI critic: look at the frames cold, write what it sees, *then* read the author's notes. **[medium]**
- **Heuristics as a checklist:** Nielsen's ten, unchanged since 1994 and reviewed in 2024: visibility of status, match with the real world, user control, consistency and standards, error prevention, recognition over recall, flexibility, aesthetic and minimalist design, error recovery, help. NN/g asks for credit and a link when they're used. **[strong]**
- **Triage levels from a published AI design reviewer:** OneRedOak's agent sorts findings into Blocker, High-priority, Medium-priority and Nitpick, and opens its report with what works. **[practice]**

## 3. Public AI design skills and prompts (read only; nothing installed)

| What | Size | What it does well | Worth installing? |
|---|---|---|---|
| Anthropic `frontend-design` skill (`anthropics/skills`, `skills/frontend-design/SKILL.md`; license in its LICENSE.txt) | ~9.4k chars | A plan → review-against-the-brief → build → critique loop; a short token plan (4–6 named colors, type roles, wireframes) reviewed before any code; a list of "AI-default tells" to avoid; copy rules | **No.** It's web-first (CSS, hover, breakpoints). Its two best ideas are now in `art-director.md` and the critic's rubric: plan the tokens and review them against the brief before drawing, and keep a named list of generic tells. |
| OneRedOak `claude-code-workflows` design-review agent (Patrick Ellis; ~3.9k stars) | ~6k chars, plus a ~9k-char principles checklist | Phased review (flow, responsiveness, polish, accessibility, robustness, code health, content); four triage levels; evidence with screenshots; problems over prescriptions | **No.** It's built on Playwright and web viewports, and Kitted's critic already shoots the Simulator. Its triage levels and "open with what works" are adopted. No license is shown, so copying its text isn't safe anyway. |
| `ui-ux-pro-max` (already in `.claude/skills/`) | large data skill | Searchable styles, palettes, font pairs, UX rules | Already here. It stays a checklist, never a source of Kitted's look. |

No founder decision needed: nothing here is worth installing.

## 4. Shape: what the research actually shows

- **People generally *like* curved shapes more than sharp ones.** Bar & Neta (2006, *Psychological Science*) tested 140 object pairs and 140 abstract pairs, and the curved one was preferred. A meta-analysis (Chuquichambi et al., 2022, *Annals of the New York Academy of Sciences*) pools the effect at Hedges' g ≈ 0.39 (medium) and calls it "reliable but not universal". Presentation time, stimulus type, **expertise** and task all change its size. **[strong for liking]**
- **That's about liking, not about seriousness.** None of these studies measured "professional" or "serious". So the research doesn't say "rounded = goofy"; rounded corners on their own are liked.
- **Rounded vs angular shifts *associations*, modestly.** Jiang et al. (2016, *Journal of Consumer Research*): a circular logo made the same shoes seem more comfortable, an angular one more durable (softness vs hardness). Zhang, Feick & Price (2006, *PSPB*): angular reads as confrontation and rounded as compromise, and which one people like depends on the viewer. Yao et al. (2021, *Frontiers*) assume rounded = warmth and angular = competence but never test that link directly, and their effects are small (r ≈ 0.12–0.19). **[medium for soft/hard; weak for warm/competent]**
- **The rest is design practice, not science.** "Small radii signal authority, large radii friendliness" is a common rule of thumb with no test behind it. A July 2026 scrape of 514 design systems found about a third use pill-shaped primary buttons and almost none use 0 px corners (Lazyweb; LLM-extracted, so indicative only). **[weak]**
- **So the honest read on "goofy":** it's more likely the *combination* than any one corner. Today's app has capsules everywhere, *plus* circles for badges and icon buttons, *plus* a large 26 pt card radius, *plus* friendly type and soft color, with no contrast between shapes. In the reference brands (§6), seriousness comes from **restraint and contrast**: one or two radii, used consistently, against strong type and a disciplined grid.

## 5. Apple's own shape rules on iOS 26 (Liquid Glass)

These come from the transcript of WWDC25 session 356, *Get to know the new design system*. The HIG pages (Buttons, Layout, Materials) are drawn by scripts in the browser, so a plain fetch got nothing in this session; read them in the Browser pane before quoting their exact wording. **[strong: platform rules]**
- **Three shape types:** fixed (one radius at every size), capsule (radius = half the height), and concentric (radius = the parent's radius minus the padding).
- **Capsules are Apple's shape for touch controls on iPhone,** especially near the screen edge (with extra margin). On the Mac, small and medium controls stay rounded rectangles, and capsules are kept for the actions that should stand out in dense layouts.
- **Nested shapes must be concentric.** Corners that look "pinched or flared" (an inner radius that doesn't follow the outer one, such as artwork in a card) create tension. The fix is inner radius = outer radius − padding.
- **Glass is the control layer floating above content,** not decoration for content. Remove custom bar backgrounds, show hierarchy by layout and grouping, and tint only primary actions.
- **What this means for Kitted:** the system chrome is Apple's (tab bar, nav-bar buttons, sheets, the native segmented control, switches), and it stays capsule and glass in every direction. Fighting it would look *less* native, not more serious. A direction can change only Kitted's own shapes: cards, tiles, chips, the composer, in-content buttons, badges, bubbles and the score block. Within those, concentric nesting is a rule.

## 6. Visual tone in the reference brands (mostly third-party descriptions, so exact values are [weak])

- **Whoop:** almost all black. Dense data stays calm through high contrast and a few strong numbers, with one accent per metric. Its 2023 home screen was praised for showing more and criticised as daunting for new users (the5krunner). Lesson: density reads as expert, but only when there's a clear first thing to look at.
- **Oura (Oct 2025 redesign by Instrument):** "refined typography, updated grid and layout system, and a simplified component language" (Instrument's case study). One third-party read lists a grotesque with an italic serif for display accents. Lesson: seriousness through a simpler set of components and a typographic accent, not through color.
- **SSENSE:** minimal labels, an editorial home page, near-monochrome. Its spare site inspired its concrete David Chipperfield flagship (Azure). Lesson: let photos carry the color while the UI recedes.
- **Mr Porter:** an editorial, magazine-style layout, a custom typeface (Underware), and the black-and-white box as the brand. Lesson: type and editorial voice carry a stylist's authority.
- **Uniqlo:** a third-party read describes square photos, buttons and cards, with roundness kept only for tags; red is used sparingly and primary buttons are black. Lesson: one shape for containers, and a different one only where the meaning differs.
- **Arc'teryx:** described as zero-radius geometry with uppercase display type over full-bleed photos, near-monochrome (a third-party DESIGN.md). Lesson: hard geometry reads technical and durable, which matches Jiang et al.'s hardness finding.
- **Apple's own apps on iOS 26:** capsule controls on glass, concentric cards, content in rounded rectangles. Apple stays friendly and still reads premium because its type and spacing are exact.
- **Color:** saturation and value strengthen brand-personality traits (Labrecque & Milne, 2012, *JAMS*); muted, low-saturation palettes read calmer. **[medium]**
- **Type:** readers attribute personality to typefaces the way they do to words, and judge whether a face fits the content (Brumberger, 2003, *Technical Communication*). **[medium]**
- **First impressions are fast and they stick:** visual appeal is judged within 50 ms and colours later judgements, including judgements of usability (Lindgaard et al., 2006, *Behaviour & Information Technology*). So the redesign's first screen matters most. **[strong]**

## 7. What the tooling takes from this

1. A direction stage before any screen is redrawn: 2–3 boards on the same three screens (Stylist home, the result card, Closet). Each gets its shape scale, type and color rules, named references, and what it gives up. The founder picks one, and the pick becomes a token-and-component change list.
2. A written critique rubric with Nielsen-style severity. The critic writes first impressions cold, before reading the author's notes. Every finding is tied to a rule or the approved direction, and what works gets kept.
3. Shape rules from Apple, not from taste: system chrome stays Apple's, Kitted's own shapes use at most two or three radii, and nested shapes are concentric.
4. "Serious" is judged by proxies that can be counted, not by adjectives: distinct radii, capsules and circles outside system chrome, type sizes and weights, accent uses, and one primary thing per screen.


## 8. Interaction design: cutting steps, features and information (added Nov 9 for the interaction designer)

- **Clarity and deference** (Apple's HIG, the long-standing themes): legible text, precise icons, subtle adornment, and an interface that steps back so content leads. On iOS 26, Apple reframes its themes as hierarchy, harmony and consistency, with an interface that can "prioritize, hide, or simplify" by what the user is doing (createwithswift's reading of the HIG; read Apple's pages directly before quoting them). **[strong: platform rules; secondhand wording]**
- **Aesthetic and minimalist design** (Nielsen's heuristic 8): every extra unit of information competes with the relevant ones. **[strong]**
- **Progressive disclosure** (Nielsen, NN/g, 2006): defer secondary options to a later screen or a tap, so attention stays on the few that matter. It improves learnability, efficiency and error rate; NN/g also describes "staged disclosure" (wizards) as a variant. Designs that go past two levels of disclosure tend to fail, so I've used "never three layers deep" as the rule (from the article as quoted secondhand). **[strong]**
- **Cognitive load** (Whitenton, NN/g, 2013, *Minimize Cognitive Load to Maximize Usability*): intrinsic load comes from the task, extraneous load from the design. Remove the extraneous part: clutter, things to remember, decisions with no payoff. **[strong]**
- **Hick–Hyman law** (Hick 1952; Hyman 1953): decision time grows logarithmically with the number of equally likely choices. Its effect shrinks for familiar, practised responses, and it isn't a law of "choice overload". So it supports one clear primary action, not "fewer options is always better". **[medium]**
- **Feature fatigue** (Thompson, Hamilton & Rust, 2005, *Journal of Marketing Research* 42(4)): people weight capability before use and usability after it, so they pick feature-heavy products that satisfy them less. In one study, 66% picked the model with the most features in the store; after use, 56% preferred a simpler one (University of Maryland's summary). **[medium]**
- **Kitted's own evidence (founder, Nov 9):** a tester said the result card's numbers (gains on every fix, "+1.0" pills, the ledger) felt like sports betting. Numbers change what the product feels like, not just how busy it looks.
- **Why a debate, and why in writing:** NN/g's critique guidance (a conversation tied to goals, not a verdict) plus Nielsen's independent evaluators. Each agent writes its points before it sees anyone's reasoning, and a third party (the critic) settles what a rule can settle. Taste and features go to the one person who owns them, the founder.

Sources for §8:
- NN/g, Progressive Disclosure (Nielsen, 2006): https://www.nngroup.com/articles/progressive-disclosure/ · video: https://www.nngroup.com/videos/progressive-disclosure/
- NN/g, Minimize Cognitive Load to Maximize Usability (Whitenton, 2013): https://www.nngroup.com/articles/minimize-cognitive-load/
- Hick's law (overview and limits): https://en.wikipedia.org/wiki/Hick%27s_law
- Thompson, Hamilton & Rust 2005, Feature Fatigue: https://doi.org/10.1509/jmkr.2005.42.4.431 · summary: https://www.rhsmith.umd.edu/news/feature-fatigue-research-proves-simpler-products-are-better-manufacturers-advised-lose-extra
- Apple's design themes, secondhand: https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/

---

## Sources
- NN/g, Mood Boards: https://www.nngroup.com/articles/mood-boards/
- InVision, Mood boards: https://www.invisionapp.com/inside-design/mood-boards/
- Wiredcraft, Mood board, a tool or a trick?: https://wiredcraft.com/blog/mood-board-a-tool-or-a-trick/
- Saarinen, Building a Visual Language (Airbnb, 2016): https://airbnb.design/building-a-visual-language/
- Gibbons, Design Critiques (NN/g, 2016): https://www.nngroup.com/articles/design-critiques/
- Nielsen, 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, Severity Ratings for Usability Problems: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- Anthropic, frontend-design skill: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- OneRedOak, design-review agent: https://github.com/OneRedOak/claude-code-workflows (design-review/design-review-agent.md, design-principles-example.md)
- Bar & Neta 2006, Humans prefer curved visual objects: https://pubmed.ncbi.nlm.nih.gov/16913943/
- Gómez-Puerto, Munar & Nadal 2016, Preference for curvature (review): https://www.frontiersin.org/articles/10.3389/fnhum.2015.00712/full
- Chuquichambi et al. 2022, How universal is preference for visual curvature? (meta-analysis): https://doi.org/10.1111/nyas.14919 (abstract via search; the full text was blocked)
- Jiang, Gorn, Galli & Chattopadhyay 2016, Does your company have the right logo?: https://ira.lib.polyu.edu.hk/handle/10397/64985
- Zhang, Feick & Price 2006, Self-construal and angular vs rounded shapes: https://repository.ceibs.edu/en/publications/the-impact-of-self-construal-on-aesthetic-preference-for-angular-
- Yao et al. 2021, Shape–trait consistency: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.615647/full
- Labrecque & Milne 2012, Exciting red and competent blue: https://doi.org/10.1007/s11747-010-0245-y
- Brumberger 2003, The rhetoric of typography: https://www.ingentaconnect.com/content/stc/tc/2003/00000050/00000002/art00008
- Lindgaard et al. 2006, 50 milliseconds (Nature news): https://www.nature.com/news/2006/060109/full/news060109-13.html
- Apple, WWDC25 #356 Get to know the new design system: https://developer.apple.com/videos/play/wwdc2025/356/
- Lazyweb, button corner radius survey (indicative): https://experiments.lazyweb.com/research/what-button-corner-radius-is-standard.md
- A practitioner's radius rule of thumb: https://personal-website-mohan.pages.dev/blogs/how_to_choose_the_corner_radius_for_web_interface
- Whoop design breakdown: https://www.925studios.co/blog/whoop-design-breakdown · Whoop home screen review: https://the5krunner.com/2023/03/28/new-whoop-home-screen-looks-pretty-but-is-it-as-intuitive/
- Instrument, Oura app: https://instrument.com/work/oura-app · 9to5Google, Oura redesign: https://9to5google.com/2025/10/20/oura-app-redesign/
- SSENSE: https://ixd.prattsi.org/?p=38279 · https://www.azuremagazine.com/article/retail-in-the-raw-david-chipperfield-canada/
- Mr Porter typeface (Underware): https://www.underware.nl/custom_type/mr_porter
- Uniqlo (third-party DESIGN.md): https://www.shadcn.io/design/uniqlo · Arc'teryx (third-party DESIGN.md): https://www.shadcn.io/design/arcteryx
