# Kitted: the plan

The live state of the build. Built from `specs.md` (what the launch is); the rules for editing this file are in CLAUDE.md → "How to work". History lives in git, the pull requests and `handoff/DECISIONS-LOG.md`, not here.

## Where things stand
- **On your phone today:** fit checks with scores, fixes and re-checks; Closet, Lookbook and You; Kit answering for real; the morning and evening card with real weather (the US weather service); share cards; voice input (not yet confirmed on your phone).
- **Built but switched off or mocked:** the paywall and purchases (a mock store); sign-in and backup (on open pull requests, not on main); notifications (the package isn't installed). Every tester gets Pro's limits from the server during the beta.
- **Still the old rules in the app:** the 1-week trial, Pro at 10 checks and 50 questions, free at 1 check a day forever and 5 questions.
- **Not built yet:** the 7 free checks, the name greeting, the spend cap working the spec's way, App Check, PostHog, reading scanned clothes, womenswear "not rated", Apple's age check.
- **10 pull requests are open,** three of them (sign-in, backup and sync, the Welcome example) carrying spec work.

## Next up
1. **T1** Review the open pull requests against the spec, so nothing is rebuilt or merged wrong.
2. **T10, T20** The free-and-Pro and limits specs, with you. Everything about money waits on them.
3. **T80** Switch on the paid Apple team in the app (Apple's weather, App Attest), since App Store Connect is set up.
4. **Y5, Y6** Start the two launch-bar photo sets now; they take the longest.
5. **T70** Reading scanned clothes (your clothes photos are in).

## Your to-do list
P1 = this week · P2 = before the beta · P3 = before launch.

| ID | P | What | Time | Unblocks |
|---|---|---|---|---|
| Y1 | P1 | Register trykitted.com and claim @kitted.app / @trykitted | 10 min | Y2, the waitlist and videos |
| Y2 | P1 | A support email, a privacy policy page and terms (Apple's standard EULA is fine) | 15 min after Y1 | T84, "Report a wrong score" |
| Y3 | P1 | Say merge, close or fix for each open pull request, after T1's recommendations | 10 min | T41, T1 |
| Y4 | P1 | Rotate the Gemini dev key (Google AI Studio: delete, make new, paste into `app/.env.development.local`) | 2 min | safety |
| Y5 | P1 | The fix pairs: 20 real before/after photos with friends, each doing a fix the card suggested; profile per person | ~1 h | T81 |
| Y6 | P1 | The rating set: 40+ real photos of real people (with their OK and profile), rated blind by you and one friend aged 18–22 | 1–2 h | T82 |
| Y7 | P2 | A RevenueCat account, and the monthly and yearly products in App Store Connect | 20 min | T13 |
| Y8 | P2 | A PostHog account (US cloud) | 10 min | T91 |
| Y9 | P2 | OK about $1 of Gemini for the scan-reading test | 1 min | T70 |
| Y10 | P2 | App Store text: name, subtitle, description, privacy label, 18+ rating (`market/app-store-connect.md` §1–7) | 10 min | T84 |
| Y11 | P2 | A phone pass: voice input (3 questions by mic) and one full check, re-check and new check | 10 min | F14.1, T83 |
| Y12 | P2 | Talk to 10 guys 18–30 (script: `market/market-research.md` §8) | 15 min each | launch videos, App Store copy |
| Y13 | P3 | Try Looksee, DRPD, GRWM, Dressly and ChatGPT with the same photo | 45 min | the "same photo, same score" video |
| Y14 | P3 | Raise the Google billing alert to match the $25-a-day cap | 5 min | T22 |

## Tasks
Status: `[ ]` to do · `[~] <session>` claimed or pull request open · `[x] <date> <PR>` merged to main · `[!] Yn` waiting on you. IDs are permanent: each lane counts in its own tens, and new work takes the next free number.

**Shared files** (one session at a time; a task that needs one says so): `app/src/i18n/en.ts`, `app/app.config.ts`, `app/package.json`, `app/src/config/features.ts`, `app/src/data/types.ts`, `handoff/DECISIONS-LOG.md`, `plan.md`.

**Already meets the spec (checked Nov 7):** F2.1, F2.4, F2.6, F3.2, F4.1, F5.1, F5.3, F5.4, F6.1, F6.2, F6.3, F7.1, F7.4, F7.5, F8.1, F9.2, F10.2, F10.3, F10.4, F10.5, F11.1, F11.5, F12.1. T83 re-checks them all before submission.

### Merge train (files: other branches only)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T1 | Review the 10 open pull requests against `specs.md`: merge, close or fix, with a reason each; renumber their colliding log entries | – | Y3 answered | – |

### Free and Pro (files: `app/src/features/{paywall,held,finish}`, `app/src/services/{quota,purchases,entitlements}.ts`, `app/src/features/settings/plan.ts`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T10 | Write `specs/free-and-pro.md` with you: the soft page, the limit card's button, the paywall without a trial, their words | – | your yes | `specs/free-and-pro.md` |
| [ ] | T11 | The new limits in the app: 7 free checks (max 1 a day), 3 questions a day, Pro 5 + 30, no trial anywhere | T10 | F10 Free and Pro bullets, F10.4 | quota.ts, paywall/, settings/plan.ts, en.ts (shared) |
| [ ] | T12 | The three upgrade moments: soft page after the first result, the limit card's button, the full paywall at check 8 | T10, T11 | F10 "When he sees it", F10.2, F10.3 | finish/, paywall/, held/ |
| [!] Y7 | T13 | RevenueCat: monthly and yearly, real purchases and Restore in place of the mock store | T10, Y7 | F10.5, F10.6 on a sandbox account | purchases.ts, entitlements.ts, package.json + app.config.ts (shared) |

### Server (files: `firebase/`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T20 | Write `specs/limits-and-spend.md` with you: how free checks are counted so a wipe can't reset them (default: Apple DeviceCheck), the pause card's words | – | your yes | `specs/limits-and-spend.md` |
| [ ] | T21 | Server limits: 7 lifetime free checks per device and account, 3 questions, Pro 5 + 30 per user (from purchases, not one global switch), declined questions not counted | T20 | F10.1, F10.6; F5.2's "doesn't count" | `firebase/functions/src/api/{limits,store,handler}.ts` |
| [ ] | T22 | The spend cap: $25 default, pauses free only, turns over at 4 am, the photo held, an alert to you | T21 | F15.1, F15.2 | `firebase/functions/src/api/` |
| [ ] | T23 | App Check: the app sends its token, the server insists | T80 | F15.3 | `firebase/`, `app/src/services/server/`, package.json (shared) |
| [ ] | T24 | A scan cap of 30 photos a day on the closet route, free and Pro alike | T20 | F7.3 | `firebase/functions/src/api/limits.ts` |

### Setup and You (files: `app/src/features/{onboarding,you,aboutYou,settings,privacy}` except `privacy/wipe.ts`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T30 | Write `specs/setup-and-you.md` with you: the name field, where consent shows (the spec says the first camera open; the app has it as setup step 4), the age check | – | your yes | `specs/setup-and-you.md` |
| [ ] | T31 | The name field on the birth-year step; change or clear it in Style profile; Apple's first name fills an empty one | T30 | F1.4, F1.5 | onboarding/, you/, data/types.ts + en.ts (shared) |
| [ ] | T32 | Apple's Declared Age Range check at first launch (native) | T30, T80 | F1.2 | onboarding/, a native module |
| [ ] | T33 | The setup path and consent match the spec (6 taps, consent names PostHog) | T30, T90 | F1.1, F1.3 | onboarding/, en.ts (shared) |

### Sign-in and backup (files: `app/src/features/account`, `app/src/sync`, `app/src/features/privacy/wipe.ts`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T40 | Write `specs/sign-in-and-backup.md` with you: Apple and Google only, the photo-backup switch and its words | – | your yes | `specs/sign-in-and-backup.md` |
| [!] Y3 | T41 | Land the open sign-in and sync pull requests to the spec: remove email, photo backup off by default (today it's on), then merge | T1, T40, Y3 | F11 Apple + Google, F11.3 | account/, sync/ |
| [ ] | T42 | "Delete account and all data" also wipes the server (the deleteAccount job and usage) | T41 | F9.1 | account/, privacy/wipe.ts |
| [ ] | T43 | Restore tested end to end on two Simulators; photos upload only with backup on and only he can read them | T41 | F11.2, F11.4 | sync/, `firebase/tests` |

### Stylist and Kit (files: `app/src/features/{stylist,ask,morning}`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T50 | Write `specs/kit-and-morning.md` with you: the decline line, greetings by name, the two notifications | – | your yes | `specs/kit-and-morning.md` |
| [ ] | T51 | Greetings by name on the morning and evening card | T31, T50 | F6 greeting, F1.5 | morning/copy.ts, en.ts (shared) |
| [ ] | T52 | Kit's decline: off-topic questions (haircuts, grooming, fitness, dating) caught on the phone, the spec's line, never counted | T50 | F5.2 | ask/ |
| [ ] | T53 | Notifications: install expo-notifications, schedule the daily idea and "fit check ready", remove "trial ending" | T50 | F13 | finish/service.ts, `app/src/features/settings/prefs.ts`, `you/notifications.tsx`, package.json (shared) |

### Fit check and scoring (files: `app/packages/kitted-core`, `extraction-test/`, `app/src/features/{fitcheck,camera}`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T60 | Write `specs/not-rated.md` with you: womenswear "not rated yet" and the card's words | – | your yes | `specs/not-rated.md` |
| [ ] | T61 | Womenswear (dress, skirt, heels) read and marked "not rated" in the Python engine first, then core, parity tests green | T60 | F2.5 | `extraction-test/`, core |
| [ ] | T62 | The card's words to the spec: the head-not-found line, "Taking longer…", "I did make the change" | T60 | F2.2, F2.3, F3.3 | camera/, fitcheck/, en.ts (shared) |
| [ ] | T63 | A test proving every parts card with a fix has a free fix | – | F2.7 | core tests |

### Closet (files: `app/src/features/{closet,scan,lookbook}`, `app/src/services/closetSource`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T70 | Write `specs/scan-reading.md` with you, then test reading on your clothes photos | Y9 | your yes, the test's result | `specs/scan-reading.md`, `extraction-test/` |
| [ ] | T71 | Scanned photos read into Closet pieces (the "Waiting to be read" inbox empties) | T70, T24 | F7.2, F7.3 | scan/, closetSource/ |

### Launch (files: `app/app.config.ts`, `extraction-test/results`, `market/`)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T80 | Switch on the paid Apple team: Apple's weather first, the App Attest entitlement; native rebuild | – | weather from Apple on the Simulator | app.config.ts (shared) |
| [!] Y5 | T81 | The fix-works bar on the fix pairs | Y5, T62 | 18 of 20 go up (F3.1) | `extraction-test/results` |
| [!] Y6 | T82 | The fair-score bar on the rating set, per age band and look | Y6 | the bar in `specs.md` → "The launch" | `extraction-test/results` |
| [ ] | T83 | Every criterion F1.1–F16.2 checked, with how; the privacy label matches the Data table | all above | a pass for each | – |
| [!] Y2 | T84 | The App Store build and submission | T83, Y2, Y10 | submitted | – |

### Analytics (files: every lane's, so it goes last)
| | ID | Task | Depends on | Done when | Files |
|---|---|---|---|---|---|
| [ ] | T90 | Write `specs/analytics.md` with you: the ~15 events and what each carries | – | your yes | `specs/analytics.md` |
| [!] Y8 | T91 | PostHog installed and the events sent; a test proves no photo, words, name, birth year or location in any event | T90, Y8 | F16.1, F16.2 | many (shared) |

## Open decisions (the default is used until you decide)
- **Free checks after a wipe:** "Delete all my data" clears the phone's ID today, which would reset the 7 free checks. Default: count them with Apple DeviceCheck, which survives a wipe and a reinstall (T20).
- **Beta testers:** the server gives everyone Pro's limits during the beta. Default: keep it until launch, then everyone starts with 7 free checks.
- **Scans:** their own cap of 30 a day for everyone (assumed in `specs.md`).
- **Consent's place:** setup step 4 (as built) or the first camera open (the spec). Default: the spec; settled in T30.

## Session log (last 15, newest first)
- 2026-11-07 · plan.md written from the spec and a code audit; CLAUDE.old.md archived · #389
- 2026-11-07 · the spec interview: `specs.md` written · #388
