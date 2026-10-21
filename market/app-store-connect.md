# App Store Connect: the drafts and the approval-day checklist (Oct 21, 2026, #365)

Everything App Store Connect asks for, written against what the app really sends today, plus the steps for the day the $99 program is approved. **All of it is outward-facing: drafts for the founder's OK, nothing is submitted.** The code side is in `handoff/09-ui-review.md` §26; the older research (rules, sources) in `inputs/app-store-and-age-rules.md`.

Rules the copy follows (CLAUDE.md "Wording"): never "AI stylist", "unlimited", "accurate" (until the gold set backs it) or "pocket stylist"; the stylist is Kit and is said plainly to be an AI; no emoji; adults only (college, first job, interviews, dates).

---

## 1. Name, subtitle, keywords (your call: P2 on the to-do list)
- **Name (30 max):** `Kitted: Outfit Rater for Men` (28). Default from `market-research.md` §7.
- **Subtitle (30 max):** `Score your fit. Get the fix.` (28).
- **Keywords (100 max, commas between, no space after a comma):** `rate,rating,score,fit check,stylist,wardrobe,closet,ootd,drip,mens,guys,what to wear,ideas,advice` (97). "Kitted", "outfit" and "rater" are in the name already, so they're left out (Apple counts them from the name).
- **Category:** Lifestyle (primary), none secondary. Lifestyle is where the rater apps sit; Photo & Video would put it against editors.
- **Price:** free, with Pro as an in-app subscription (not in the beta build).

## 2. Promotional text (170 max, can change any time without review)
> Send a fit pic, get a score out of 10 and the one fix that raises it. Same photo, same score. It rates the outfit, never you. Your daily check is free.

(151)

## 3. Description (4,000 max)
> Kitted scores your outfit out of 10 and tells you the one change that would make it better.
>
> Take a photo in the mirror, or prop your phone up and step back. In a few seconds you get a score, a word for where it lands (from "Getting there" to "Sharp"), and two or three fixes, at least one of them free: tuck it in, cuff the jeans, swap the sneakers. Make the fix, check again, and see the score move.
>
> SAME PHOTO, SAME SCORE
> The score comes from fixed rules about fit, shape, color, shoes and how the pieces work together, so the same photo always gets the same number. Tap the score to see exactly where every point came from.
>
> IT RATES THE OUTFIT, NEVER YOU
> Kitted never rates faces, bodies, weight or skin. Your face is blurred on your phone before anything is sent, and if it can't be blurred, nothing is sent.
>
> A CLOSET THAT BUILDS ITSELF
> Every fit check adds what you wore to your closet, drawn piece by piece. Kitted counts the outfits you can already make, suggests one for the weather each morning, and names the one piece that would add the most outfits to what you own.
>
> ASK KIT
> Kit is your stylist, and Kit is an AI. Ask what to wear to an interview, how chinos should fit, or what goes with your olive overshirt, and get a short answer built from your own clothes.
>
> FREE EVERY DAY
> One fit check (with a re-check) and five questions a day, free. Seeing your score is always free.
>
> Kitted is for adults 18 and up, in the US.

(About 1,300 characters. When Pro ships, add: "Kitted Pro: up to 10 fit checks and 50 questions a day, $9.99 a month after a 1-week free trial. Cancel anytime in Settings." plus the Terms and Privacy links, App Review 3.1.2.)

## 4. Review notes (App Review and TestFlight's Beta App Review)
> Kitted is a fit-check app for adults (18+, US only). It scores clothing only, never people.
>
> **No account is needed.** The app makes a silent guest account (Firebase Anonymous Auth) on the first fit check, only to count the day's free checks on our server. Nothing to sign in to.
>
> **How to try a fit check:**
> 1. On first launch: Welcome → pick up to 3 looks → Basics (birth year 2000 or earlier) → the AI consent screen → Agree.
> 2. Without a photo of yourself: tap "See an example check" on Welcome or on the consent screen. It's a real scored card for a bundled photo; nothing is sent.
> 3. With a photo: in the Stylist tab tap the camera, then the photo button to choose any full-length photo of a person in an outfit from the library (or take one: phone propped up, the 3-2-1 timer takes it). The score arrives in about 8 seconds. The face is blurred on the phone before upload; a photo with no person in it is refused on the phone.
> 4. Then tap "Why 7.5?" to see how the score adds up, or a fix's re-check to score the change. Ask Kit a question in the "Ask Kit…" bar.
> Free limits: 1 fit check (plus 1 re-check) and 5 questions a day, reset at 4 am. During the beta, testers get 10 checks and 50 questions a day.
>
> **The AI:** outfit photos (face blurred) go to Google's Gemini API, which only describes the garments in fixed categories; the score is computed by rules in the app. Questions go as text to OpenAI's API. Both are named on the consent screen (5.1.2(i)) before anything is sent, with a working "Not now". Neither trains on the data; Google keeps it up to 55 days and OpenAI up to 30 days for abuse checks. Our server forwards the requests and stores no photos, questions or answers, only daily counts.
>
> **Kit** is the in-app stylist persona and is introduced as an AI in its first message and on the consent screen. It's a conversation with an AI only: no user-to-user messaging, no public content, nothing shared with other users.
>
> **Age:** 18+. A birth-year gate (blank by default) blocks under-18s; [after the age-check build: plus Apple's Declared Age Range where required].
>
> **Location** is optional, approximate only, asked from the morning outfit card, and used only for the weather.
>
> **Deleting data:** You → Settings → Privacy & data has "Delete all my data" and a switch that stops sending photos.
>
> Contact: [support email].

(Before submitting: fill the support email; for the App Store release, add the subscription paragraph and the Declared Age Range line.)

## 5. App Privacy ("nutrition label") answers
Apple counts data as **collected** when it leaves the phone and we or a partner can keep it longer than the request needs. Google's 55-day and OpenAI's 30-day abuse logs make photos and questions collected, though our server forgets them. **The same list is in the app's privacy manifest** (`app/app.config.ts` → `ios.privacyManifests`); a test keeps the two in step (`approvalDay.test.ts` P2).

**Tracking: No** (no ads, no data brokers, nothing joined with other companies' data). So no tracking prompt.

| App Store data type | Collected | Linked to the user | Purpose | What it is |
|---|---|---|---|---|
| **Photos or Videos** | Yes | No | App Functionality | The face-blurred copy of a fit photo, sent through our server to Google's Gemini (no account ID goes with it to Google). |
| **Other User Content** | Yes | No | App Functionality | Questions to Kit, as text, through our server to OpenAI. |
| **User ID** | Yes | Yes | App Functionality | The Firebase guest account's ID, the key for the server's daily counts. |
| **Product Interaction** | Yes | Yes | App Functionality | The server's per-account daily counts of checks and questions (kept 7 days). |
| **Coarse Location** | Yes (conservative) | No | App Functionality | Approximate location, rounded to about 1 km, sent only to the weather service (NWS; Apple Weather once WeatherKit is on); never stored by us. Arguably "not collected" (real-time only); declaring it is the safe side. |
| **Other Data Types** | Yes | No | App Functionality | Height and build, as words with a question, only if he gave them. |

**Not collected:** name, email (until Continue with Google or Apple ships in a Release build: then **Email Address**, linked, App Functionality), contacts, birth year (stays on the phone), the unblurred photo, health, financial info, browsing history, search history, diagnostics (crash logs stay on the phone; Apple's own crash reports aren't ours to declare), device ID, purchases (until Pro ships: then **Purchase History**, linked, App Functionality).

## 6. Age rating questionnaire
- In-app controls: Parental Controls **No**; Age Assurance **Yes** (the birth-year gate; plus Declared Age Range once built).
- Capabilities: Unrestricted Web Access **No**; User-Generated Content **No** (nothing reaches other users); Social Media **No**; Messaging and Chat **No** (Kit is an AI, not people talking to each other; the review notes say so); Advertising **No**.
- Mature or suggestive themes, violence, profanity, horror, sexual content, nudity, alcohol/tobacco/drugs, gambling, simulated gambling, contests, loot boxes: **None**.
- Medical or treatment information **No**; health or wellness topics **No** (Kit refuses body, weight and diet questions).
- Result: Apple computes about 4+. **Override to 18+** (Gemini's terms require it, and the Terms say 18+).
- Availability: **United States only.**

## 7. Other App Store Connect fields
- **Support URL:** needed (e.g. `trykitted.com/support`, or a mailto page). **Privacy Policy URL:** needed for the App Store, and have it for external TestFlight too. Both are on the to-do list (P1, `app/src/config/links.ts`).
- **Copyright:** `2026 Eyu Haile` (or the business name).
- **Export compliance:** answered by the build (`ITSAppUsesNonExemptEncryption = NO`: HTTPS only).
- **Content rights:** "No, it doesn't contain, show or access third-party content" (the demo photos are bundled stock; replace before marketing, as the to-do list says).
- **App Store screenshots** (6.9" iPhone, 1320 × 2868): a score card with its free fix; "same photo, same score"; the Why sheet; the closet's outfits; Kit answering. Not made yet.
- **TestFlight test information:** beta description ("Send a fit pic, get a score and the one fix. Tell me what feels off."), feedback email (the support email), and the review notes above.

---

## 8. The approval-day checklist (about 2 hours of console work)
Order matters; each step says where. Claude can do the repo steps (marked **[Claude]**) while you click through the consoles.

**0. Before the day (needs your OK now, so the day isn't blocked):**
- [ ] OK installing the EAS CLI (`npm install -g eas-cli`, Expo's own tool, ~60 MB) and an Expo account (free tier: 15 iOS builds a month in the cloud queue, or build locally with `eas build --local`). The alternative is Xcode's own Archive → Upload, which needs no new tool; EAS is the default because it signs and uploads in one step.
- [ ] A support email and a privacy policy URL (already P1 on the list).

**1. Agreements (10 min, App Store Connect → Business)**
- [ ] Accept the Free Apps agreement (automatic) and sign the **Paid Apps Agreement**: tax forms (W-9) and a bank account. Needed before any subscription, not before TestFlight; do it now anyway, it can take a day to clear.

**2. The App ID and capabilities (15 min, developer.apple.com → Certificates, Identifiers & Profiles)**
- [ ] Note the **Team ID** (Membership details, 10 characters).
- [ ] Register the App ID `com.trykitted.kitted` (Explicit). If Apple says it's not available (the free Personal Team holds it), use `com.trykitted.app`, and tell Claude: it changes `ios.bundleIdentifier` in `app.config.ts`, and the Firebase iOS app (Google sign-in's client) has to be added again for the new ID.
- [ ] Capabilities on it: **Sign in with Apple**, **App Attest**, **Declared Age Range**, **WeatherKit**. Then the **App Services** tab: tick **WeatherKit** too (separate from the capability; it takes up to 30 min to start answering). EAS also turns capabilities on from the entitlements when it builds, but WeatherKit's App Services tick is manual.

**3. Flip the switch [Claude] (5 min)**
- [ ] In `app/app.config.ts`: `APPLE.paid = true` and `APPLE.teamId = '<your Team ID>'`. That one block sets the team, the four entitlements, Apple Weather first, and the location string that names it.
- [ ] `npm run check`, then `npm run check:app -- <built app> --paid` after the first build.

**4. EAS project (10 min, terminal, with your Expo login)**
- [ ] `cd app && eas login && eas init` (links the project; add the `extra.eas.projectId` it prints to `app.config.ts` [Claude]).
- [ ] The Firebase key as a build variable, for both Release profiles (it's public by design; plaintext is fine):
  ```bash
  eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value <the key in app/.env.local> --visibility plaintext
  ```
  ```bash
  eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value <the key in app/.env.local> --visibility plaintext
  ```
  Without it the config refuses the build (by design: a build without it can't score anything).

**5. The app record (15 min, App Store Connect → Apps → +)**
- [ ] New App: iOS, name (§1), primary language English (U.S.), the bundle ID from step 2, SKU `kitted-ios`, full access.
- [ ] App Information: category (§1), content rights (§7), age rating (§6, override to 18+).
- [ ] App Privacy: the answers in §5, and the privacy policy URL.
- [ ] Pricing and Availability: free, **United States only**.
- [ ] (Later, for Pro) Subscriptions: a group "Kitted Pro" with `kitted.pro.monthly`, $9.99, an introductory offer of 1 week free, its review screenshot. The same product is in `app/storekit/Kitted.storekit` for Simulator tests.

**6. The first upload (30–60 min, mostly waiting)**
- [ ] `npm run guard:release` [Claude], then `eas build --platform ios --profile production` (EAS asks to make the distribution certificate and profile: say yes) and `eas submit --platform ios --latest` (asks for an App Store Connect API key or your Apple ID login once).
- [ ] Or without EAS: Xcode → Product → Archive (Release), Distribute → App Store Connect.
- [ ] Wait for "Processing" to finish (10–30 min), then answer export compliance if asked (the plist already says No).

**7. TestFlight (20 min, then waiting)**
- [ ] **Internal testing:** add yourself (and anyone with an App Store Connect role, up to 100) to an internal group. No review; installs in minutes. Do the phone pass here: a fit check, a question, the morning card's weather (with " Weather" under it), Delete all my data.
- [ ] **External testing:** a group "Beta" for the Nov 3 testers (up to 10,000, by email or a public link). Fill Test Information (§7) and the review notes (§4), then submit for **Beta App Review**. **Submit by Oct 31** at the latest: the first build's review usually takes about a day but can take longer. Later builds of the same version mostly skip it.
- [ ] Confirm the server's beta allowance (`server/config` → `tier: pro`) is what testers should get.

**8. Before the App Store release (not the beta)**
- [ ] Declared Age Range in the app (native Swift, no package; required in Texas since June 2026).
- [ ] App Check (a package, your OK) and `enforceAppCheck: true` on the server.
- [ ] Sign in with Apple's button (`expo-apple-authentication`, your OK), if accounts ship in v1.
- [ ] A purchases library (RevenueCat is the default, your OK) and the paywall switched on; Terms and Privacy links on it.
- [ ] Screenshots, the description's Pro paragraph, and the final review notes.

**Waiting on the founder for the code (listed for your OK; nothing installed):** the EAS CLI (step 0), `expo-apple-authentication` (Sign in with Apple), a purchases library (`react-native-purchases`, RevenueCat), `@react-native-firebase/app` + `app-check` (App Check with App Attest).
