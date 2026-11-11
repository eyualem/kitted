# T36 research: how good apps teach a new user (Nov 10)

Read by a research agent and checked here. Every source was opened. Vendor numbers are marked as such.

## What the sources say
- **Apple HIG → Onboarding:** people should understand the app "simply by experiencing it"; if onboarding is needed it is "fast, fun, and optional"; "teach through interactivity" (people remember a task they did, not one they watched); prefer context-specific tips near the area they refer to over one onboarding flow; teaching too much overwhelms. https://developer.apple.com/design/human-interface-guidelines/onboarding
- **Apple HIG → Offering help:** help relates to "the precise action or task people are doing right now"; prefer "animation or graphics to educate instead of a lengthy description"; tips are one or two sentences, actionable, never promotional; use eligibility rules so people who already used a feature never see its tip; space several tips out. https://developer.apple.com/design/human-interface-guidelines/offering-help
- **Apple HIG → Feedback:** put status next to the items it describes; match the feedback's loudness to how much it matters. https://developer.apple.com/design/human-interface-guidelines/feedback
- **TipKit (rules only; Kitted adds no package, SY scope):** use tips "sparingly to highlight nonobvious features"; "Don't use tips to guide people through your app"; a tip with nothing to do ("this feature is better now") isn't a tip; remove a tip once he does the action. https://developer.apple.com/documentation/tipkit · WWDC23 10229 https://developer.apple.com/videos/play/wwdc2023/10229/
- **NN/g:** "Tutorials interrupt users, don't necessarily improve task performance, and are quickly forgotten"; prefer "pull" help triggered by need (https://www.nngroup.com/articles/onboarding-tutorials/). Most apps don't need onboarding; spend the effort on a clearer interface (https://www.nngroup.com/articles/mobile-app-onboarding/). Instructional overlays: users "dismiss them quickly and do not read thoroughly"; one interaction per hint, one at a time (https://www.nngroup.com/articles/mobile-instructional-overlay/). Empty states are contextual help: say what will appear and give the next step (https://www.nngroup.com/articles/empty-state-interface-design/). Motion can show the interface changed state and direction through a hierarchy (https://www.nngroup.com/articles/animation-purpose-ux/).
- **Learning by doing:** Superhuman teaches in a real-looking inbox you actually clear; self-serve activation 40% → 50% (company-reported; https://review.firstround.com/superhuman-onboarding-playbook/). Duolingo's first lesson is the onboarding; signup comes after, framed as saving progress (https://goodux.appcues.com/blog/duolingo-user-onboarding; its often-quoted +20% is unverified).
- **Chips instead of explanation:** ChatGPT added example prompts and suggested replies in Aug 2023 (https://venturebeat.com/ai/openai-adds-huge-set-of-chatgpt-updates-including-suggested-prompts-multiple-file-uploads). Google's conversation design guide: chips are short, action-first, help people find what they "might not think to ask for"; a tap sends the chip as his reply (https://developers.google.cn/assistant/conversation-design/chips).
- **Tours:** average tour completion 33.5%, 5-step tours 21.6%, tours the user opened himself 64% (Chameleon 2024, vendor data, web software; https://www.chameleon.io/benchmark-report-24).
- **Activation:** the milestone that predicts retention is the one to design for (https://www.lennysnewsletter.com/p/how-to-determine-your-activation). For Kitted: the first scored check, ideally the second.
- **Not found:** no controlled study of a "fly to the tab" animation; only vendor anecdotes, not cited.

## What it means for Kitted
1. The intro is the first fit check. No tour before it (setup already ends in Kit's offer).
2. No list of how it works, in chat or anywhere.
3. Teach each tab once, after the thing that fills it happened (Closet after the first check adds pieces), never before.
4. Show where things went with motion and a badge, not a sentence; back it with words a VoiceOver user hears, and skip the motion with Reduce Motion.
5. A tab badge only when something new and specific landed there; it clears when he opens the tab.
6. Empty tabs already teach (Closet: "Your closet builds itself."); no card on top of a tab that has content.
7. At most one new hint at a time, and never one with nothing to do (a "Got it" card is that).
8. Measure the second check within 7 days, not "finished the intro".

## Anti-patterns (what #95 did)
- Kit's first message as a bullet list explaining every tab.
- A card with only `Got it` at the top of Closet, Lookbook and You, which tells him what he can already see.

## Checked against research-context.md §C14
- Tab bar stays the only top-level navigation, always visible; a badge is a familiar pattern (Jakob's Law).
- Progressive disclosure: each tab is taught only once he's used the thing that fills it.
- 44 pt targets, 4.5:1 contrast and the largest text: checked in the frames and the build's screenshots.
- Feedback in ~0.1 s: the pieces start moving as the score settles, with a light haptic.
- C14's "settings behind a gear" is out of date: the founder moved settings into You (SY1, Nov 9).
