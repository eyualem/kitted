# Kitted workflow report: why the beta fixes ran slow

Nov 10, 2026 · for Eyu Haile · cloud copy (editable, with the chart): [Kitted workflow report](https://claude.ai/artifact/4DRgHi6445jHdEPr1jddBL)

## Summary

The build workflow spent most of its effort checking, not building. From Nov 8 to 10, the six beta-fix sessions made about 8,100 model calls. Only 18% of their agents' calls went to writing the app's code. Testing and checking took 43%, and design took 24%.

- **What it cost you:** the 5-hour usage limit was hit twice, and each time every session stopped at once. Tasks you had moved on from were still being tested a day later.
- **What it produced:** 799 lines of app code, 3,791 lines of tests and 3,251 lines of task documents, about 9 lines of checking and paperwork per line of app.
- **The proposal:** a lean workflow for the beta, to be settled in its own session. Heavy checks stay only where a mistake is serious (scores, limits, privacy, the age gate, the server), and everything else gets one build and one review pass.

## What happened

After build 1 reached TestFlight on Nov 8, your beta feedback was split into six sessions running side by side, one per part of the app.

| Session | Merged so far | Still open when paused |
| --- | --- | --- |
| Morning card | One evening card per evening; the card waits until Kit knows two outfits; Apple's weather parked until after the beta | none |
| UI design workflow | The designer and critic stage | none (a bigger redesign stage was opened elsewhere and is still unmerged) |
| You tab and first run | The setup-and-You spec; You as the settings home | The tips guide and going through setup again: not started |
| Onboarding screens | The setup screens' spec | The new drawn Welcome (built, screen check unfinished); plain forms with age choices and landing in Stylist (tests written, not built) |
| Closet | none | The Closet spec and Closet without Outfits (verified, waiting for your merge); the one-card review (built, being checked) |
| Notifications | The notifications spec | The notifications build (94 tests locked, code in progress) |

- **The usage limit** was hit on Nov 9 and again on Nov 10. Each time, every session stopped mid-step and had to pick up again after the reset.
- **The Mac's memory** fell to 120–300 MB free with two Simulators running, so checks were held back to avoid crashing it.
- **The disk** fell to 9 GB free. Clearing old test logs, an unused Simulator and 25 finished sessions brought it back to about 13 GB.

## Where the effort went

Testing and checking took the biggest share of the agents' calls: the test writer and checker made 43% of 6,445 agent calls, Nov 8–10. The builder, who writes the app's code, made 18%.

| Agent | Calls | Share |
| --- | --- | --- |
| Test writer | 1,624 | 25% |
| Designer and critic | 1,578 | 24% |
| Builder | 1,157 | 18% |
| Checker | 1,154 | 18% |
| Planner | 892 | 14% |
| Web lookups | 40 | 1% |

Counted from the six sessions' agent transcripts on this Mac; the session coordinators' own calls are not included. The design agents add another 24%, so 67% of all agent calls went to checking and drawing.

## Why the testing is so heavy

The workflow asked for five things on every task, and each one multiplies the others.

1. **Every test is shown failing before any code exists,** then locked, then locked again whenever it changes. The test writer alone ran the test suite 266 times.
2. **Every visible element gets its own test:** its exact words, its VoiceOver label, in light, dark and the largest text size. That's why the tap-through tests pile up: 60 runs by the test writer.
3. **The checker redoes everything:** the full app check, every tap-through test in the app (not just the task's own), one planted bug per check with the tests rerun each time, and every screen state in three modes on the Simulator. That's 89 tap-through runs and 71 Simulator sessions.
4. **Each fix round repeats the whole check.** The You tab used all 3 allowed rounds. Closet and Onboarding each had tests that were themselves wrong, and settling that meant a round trip back through the test writer.
5. **The slow tools set the pace.** A tap-through test or a Simulator check takes minutes, and the Mac fits two Simulators at most. Single test-writer and checker runs stretched across 20–30 hours, waiting on memory and the usage limit.

## What the checking caught

The checking found real problems, so the lean version keeps it where a mistake costs most.

- **The double evening card:** found by its root cause (Stylist asked for the card twice at the same moment), with tests that replay your exact late-night setup.
- **A test that could never pass:** it expected "1 of 3" for a set of 4 questions. The builder refused to bend the app to fit it.
- **4 design problems** caught in a drawing before any code was written.
- **Screens cut off** at the largest text size on the You tab.

None of these would have hurt a friend's data or score. They would have looked rough, which a beta can absorb. That's the line the lean workflow draws.

## The lean workflow

The spec and your yes stay the same. What changes is everything after it.

| Step | Before | Lean, for the beta |
| --- | --- | --- |
| Plan | A separate planner writes two documents | The builder writes a short checklist; a planner only for a new screen |
| Tests | A separate test writer, before code, for every check and every word on screen | Tests only for scoring, limits, privacy, the age gate and the server; a bug fix gets one test that reproduces it |
| Words and labels on screen | A test per element, in 3 modes | Screenshots of the changed screens, light and dark |
| Build | The builder works to the locked tests | One builder writes the code and its tests |
| Review | Full check, every tap-through test, one planted bug per check, every state in 3 modes | One pass by a separate checker: the app check, screenshots, a read of the change; planted bugs (3 at most) only in scoring, limits or privacy code |
| Tap-through tests | Every flow, on every task | About 5 core flows (setup, a fit check, Kit, Closet, You), once before each TestFlight build |
| Design | Designer and critic, several rounds | Only for a new screen: one critic pass, then your look |
| Fix rounds | Up to 3 | 1, then it comes to you |

- **What stays strict:** scoring, the daily limits, privacy (what leaves the phone, face blurring, consent, wipes), the age gate and the server. There, a separate test writer still writes the tests before the code.
- **The trade-off:** more small bugs will reach your friends, like a cut-off label or an odd gap. In a beta that's acceptable, and TestFlight's feedback is the test.
- **The expected effect:** roughly half the calls, and most of the hours, since most of the waiting was on the Simulator and tap-through tests. That's an estimate; the first task run this way gives the real number.

## The paused sessions, and the way to the beta

If the lean workflow is adopted, each paused session switches where it stands. Nothing already written is thrown away.

| Session | Where it stands | Lean next step |
| --- | --- | --- |
| Closet | Closet without Outfits verified; the one-card review built | Merge the spec, then Closet without Outfits; the one-card review gets one review pass with screenshots, then your look |
| Onboarding screens | The drawn Welcome built; the age step's tests written | The Welcome: screenshots of the changed screens, no more full screen check; the age step: build it, one review pass (the age gate keeps its strict tests) |
| Notifications | 94 tests locked, code in progress | Finish the code against the tests already written; one review pass; only the notification flows, not every flow |
| You tab | The settings home merged; the tips not started | The tips: one drawing pass, your look, build, one review; going through setup again waits until after the beta |

**Then the beta:**

- [ ] Merge what's verified, then make one new TestFlight build with all the fixes, after the 5 core flows pass once.
- [ ] Set up the support email and privacy page (Y2), which Apple needs before outside testers.
- [ ] Collect your friends' Apple ID emails (Y17), and invite them as outside testers.
- [ ] Keep at most 3 sessions building at once.
