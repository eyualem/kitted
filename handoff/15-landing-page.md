# 15 · The beta landing page: plan, stack and tests

Written Oct 19, 2026, after the founder's go on the plan ("use 21st dot dev and ui dot shadcn… i can listen to
pushbacks"). The page is where his TikTok bio link points (and every share card, which already prints
trykitted.com). Each check below is written before its code, as for every feature since #291. Results go in §9.

## 1. What a visitor sees

He taps the link in a TikTok bio. TikTok opens it in its own in-app browser, which is slow, has weak autofill and is
easy to leave, so the page is built for that browser first.

- **One screen, top to bottom:**
  1. the KITTED woven-label wordmark;
  2. a 5-second muted loop of a real score reveal (the tape locking on the score, then the fix), with a still
     frame shown at once;
  3. the headline and one line under it;
  4. the form: email, **iPhone | Android**, "I'm 18 or older", and **Join the beta**;
  5. one fine-print line.
- **Below the fold:**
  - how it works, in 4 steps;
  - a trust row;
  - a short FAQ;
  - the footer: Privacy · Terms · Support.
- **After Join:**
  - **iPhone:** "You're on the list." with when invites start;
  - **Android:** "We'll email you when it's on Android."
  - The same message shows whether or not the email was already on the list, so the page never reveals who signed
    up.
- **The page changes with the app, at the same address:**
  - **Now:** the waitlist.
  - **Beta:** the same waitlist; invites go out by email in batches (§6).
  - **After the app passes review:** the button becomes the App Store pre-order, then the download.

## 1b. By device (founder, Oct 19: "can the page load differently based on what it is opened on like laptops")

One page at one address, adjusted in two ways:

- **The layout follows the screen width** (CSS only, set when the page is built), so nothing jumps after it loads.
  - **Phone (under 640 px):** §1 as written.
  - **Tablet:** the same column, wider.
  - **Laptop or desktop (900 px and up, with a mouse):** two columns.
    - Left: the headline, the line under it and the form.
    - Right: the score-reveal loop inside an iPhone frame, with the sections below in a grid.
- **The content follows the device**, read from the browser's own report of what it's running on. This is only a
  hint: every visitor can still pick iPhone or Android by hand, and no one is ever turned away.
  - **iPhone, in Safari or in TikTok's browser:** iPhone is already picked.
  - **Android:** Android is picked, and the line under the button says "iPhone first. Android is coming: join and
    you'll hear first."
  - **Laptop or desktop:**
    - the form stays, so they can still join with their email;
    - a QR code is added, "On your phone? Scan to open Kitted's page", pointing to the same page with `?src=qr`;
    - the platform is left unpicked.
  - **After launch:** the iPhone visitor gets the App Store button, the Android visitor the waitlist, and the laptop
    visitor the QR code plus the App Store link.
- **The QR code** is drawn when the site is built, as an SVG in the page. Nothing loads from outside, which keeps W7.
  It needs one more small package (`qrcode`), used only while building: one more OK.
- **The device word** (`iphone` | `android` | `desktop`) is added to the visit and signup counts, next to `src`
  (§4), so the counts show how many came from a laptop. Nothing else about the device is kept.

## 2. The stack (the founder's picks, with Claude's pushbacks folded in)

**shadcn/ui: yes, as the base.** Its pieces are Radix underneath (labels, focus, keyboard and screen-reader behavior
done right) and the code is copied into the repo, so there's nothing to keep paying for or depend on.

**21st.dev: yes, for a few sections, picked one at a time.** It's a marketplace of shadcn-style components, installed
with the same `npx shadcn add <url>` command. Three conditions:

1. **No Magic MCP.** It's the paid, credit-based generator (account, API key, monthly credits; the plans and prices
   differ across 21st's own pages). The marketplace components are enough. A free 21st account may be needed if the
   free plan limits copies per day.
2. **Restyled to Kitted, never the marketplace look.** The popular components are the generic AI-startup look:
   aurora gradients, glowing borders, spotlight cards, 3D globes. On Kitted that would look like every other app,
   and unlike the app the visitor then installs. Kept: the layout and the motion. Replaced: every color and font,
   with the app's own tokens (03 §2: chalk/night, indigo ink, copper only where a score moves, Archivo for the
   numerals and the wordmark). No gradient blobs, no glow, no copper decoration.
3. **Every component read before it goes in.** They're community code. Rejected:
   - anything that loads from another server (fonts, scripts, images);
   - anything that pulls three.js or a WebGL canvas;
   - anything without a license that allows commercial use.
   At most one animation library (`motion`), and only if a picked component can't do with CSS.

**Astro around them, not a React app (Claude's pushback).** shadcn needs React and Tailwind, but a plain React page
(Vite or Next) sends the whole page as JavaScript before it shows, which is the wrong trade in TikTok's browser.
Astro, which shadcn supports officially, writes the page as plain HTML when it's built. Only the form, and any
21st.dev piece that really moves, run as small React "islands". The headline, the video's still frame and the form
show before any JavaScript arrives.

**Hosting and the form: the Firebase project that already exists (`kitted-a5b45`).**
- **The page:** Firebase Hosting, free at this size.
- **The address:** `kitted-a5b45.web.app` until trykitted.com is registered, then the domain points at it.
- **The form:** posts to a new, small function `waitlist`, separate from `api` (that one requires a sign-in; this
  one is public).
- **What this saves:** no new accounts, no new company holding the emails, $0.

**Packages (each needs the founder's OK, CLAUDE.md "Ask before"):**
- `astro`, `@astrojs/react`, `react`, `react-dom`;
- `tailwindcss` and `@tailwindcss/vite` (v4);
- what `shadcn init` adds: `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`, `lucide-react` (icons;
  only the ones used end up in the page);
- the `shadcn` CLI, run with `npx`;
- maybe `motion` (see condition 3 above).

All of them live in `web/`, a new folder at the repo root. Nothing goes into `app/`.

## 3. The words (draft, outward-facing: on the founder's skim list)

| Where | Words |
|---|---|
| Headline | Send a fit pic. Get a score and the one fix. |
| Under it | Kitted rates your outfit out of 10 and tells you the one change that raises it. It rates the outfit, never you. |
| Fields | Email · I use: iPhone / Android · I'm 18 or older |
| Button | Join the beta |
| Fine print | Free during the beta. iPhone first, US only. We'll only email you about Kitted. Unsubscribe anytime. Privacy |
| Done, iPhone | You're on the list. Invites go out in small batches starting in November. Watch for an email from Kitted. |
| Done, Android | You're on the list for Android. We'll email you when it's ready. |
| Under 18 | Kitted is for ages 18 and up. |
| Bad email | Check your email address. |
| Failure | That didn't go through. Try again. |
| How it works | 1 Snap your fit: prop your phone up, or use the mirror. · 2 Get your score: out of 10, with a word, like Put together or Sharp. · 3 Make the fix: one change, and the score it gets you. Re-check to see it. · 4 Your closet builds itself: every check adds your pieces, so outfit ideas come from clothes you own. |
| Trust row | Same photo, same score. · It rates the outfit, never you. · Your face is blurred before anything is sent. · One free fit check a day, always. |
| FAQ: Is it free? | Free during the beta. After launch, a fit check a day stays free. |
| FAQ: My photo? | Your photo stays on your phone. To read the clothes, a copy with your face blurred goes to Google's AI. We keep no photos. |
| FAQ: When? | Invites go out in batches from November. iPhone, US, 18 and up. |
| FAQ: Android? | Not yet. Join and pick Android, and you'll hear first. |
| Link preview (title, line) | Kitted: rate my fit · Send a fit pic. Get a score and the one fix. |

The house rules hold: never "unlimited", "AI stylist", "accurate" or "pocket stylist", no emoji, no prices yet (the
founding offer is an open call, CLAUDE.md to-do P2 (d)).

## 4. What's kept, and where

- **Firestore `waitlist/{id}`, one document per email:**
  - the email, trimmed and lowercased;
  - `platform` (`ios` | `android`);
  - `adult: true`;
  - `src` (the `?src=` tag: `tiktok`, `ig`, `snap`, `share`, or `direct`);
  - the day it was added;
  - `batch` and `invitedAt` (set by the founder's export script);
  - `unsubscribed`.
  - The id is a hash of the email, so a second signup with the same email lands on the same document.
- **Counts `waitlist_stats/{day}`:** visits and signups per `src`. The page sends one small request on load, with no
  cookie and nothing stored on the phone.
- **Never kept:**
  - the IP address. The rate limit uses a hash with a daily salt, kept 24 hours;
  - the browser's identity;
  - any tracking pixel or cookie. No TikTok pixel, no analytics service, so no cookie banner.
- **The rules:** no app or browser can read or write either collection. Only the function writes, with the admin key.
- **Deleting:**
  - an email to support → `npm run waitlist:delete <email>`;
  - after launch, rows that were never invited are deleted 90 days after the launch email.

## 5. The legal pages (they're also the App Review links, CLAUDE.md to-do P1)

- `/privacy`: the site (what the form keeps, why, how long, how to delete) and the app (what's sent to Google for
  fit checks and to OpenAI for questions, what's kept and for how long, deletion, contact). The app's
  `app/src/config/links.ts` gets this URL.
- `/terms`: a short beta-terms page that links Apple's standard EULA for the app.
- `/support`: the support email and the three most common questions.
- Claude drafts all three from the app's real behavior (CLAUDE.md "Privacy"). The founder OKs them: they're
  outward-facing, and they're not a lawyer's review.
- **Invite emails:** each one has an unsubscribe link and a postal address (US CAN-SPAM). A PO box is fine. This is
  needed before the first invite, not before the page goes live.

## 6. Invites and batches

- **Why batches:** at Pro's limits (every beta account has them, `server/config` → `tier: pro`), an active tester
  costs about 2.3¢ a day (2 checks at 1.08¢ and 5 questions at 0.035¢). The $3-a-day spending stop therefore
  covers about 130 active testers. A public TestFlight link in the bio would let one good video blow through it in
  an hour, and every tester would see "paused".
- **Default sizes:** 25, then 100, then 250, about a week apart. Raising the stop to ~$10 a day covers ~400 testers
  (money: the founder's call).
- **How a batch is invited:**
  1. `npm run waitlist:export -- --batch 1 --size 25` writes a CSV of the oldest un-invited iPhone signups to
     `inputs/waitlist/` (git-ignored) and marks them invited.
  2. The founder imports the CSV into an external TestFlight group in App Store Connect. Apple sends each person
     the TestFlight invite, so a forwarded link can't let strangers in.
  3. The founder sends one short email from Gmail (BCC) saying what to expect. An email service (e.g. Resend) waits
     until the list is in the hundreds: a new account, his call.
- **Blocked on:** the $99 Apple program and Beta App Review (1–2 days for the first build). The page itself isn't.

## 7. Build steps, in order

0. **The founder's OKs:**
   - the packages (§2);
   - the hero video's source (§10);
   - the first deploy, which makes `kitted-a5b45.web.app` public.
1. **Scaffold `web/`:** Astro + React + Tailwind v4 + `shadcn init`. The app's tokens become CSS variables for light
   and dark (the phone's setting), and Archivo is served from our own folder (OFL, the app's files).
2. **The pieces:**
   - **shadcn:** Button, Input, Checkbox, ToggleGroup, Accordion, Label.
   - **21st.dev:** 3–5 candidates for the hero layout, the how-it-works steps and the FAQ. Each is read, checked
     against §2's conditions and restyled. The picks and rejections are logged in §9.
3. **The page and its words** (§3), mobile first, plus the link-preview image (1200 × 630).
4. **The `waitlist` function, its rules and its tests** on the emulator (§8 F), in
   `firebase/functions/src/waitlist/` and `firebase/tests/`.
5. **Hosting:** `firebase.json` gets `hosting` (public `web/dist`, `/api/waitlist` rewritten to the function,
   cache headers).
6. **The hero video:** recorded, cut to 5 s, H.264, ≤ 1.5 MB, plus its still frame.
7. **The legal pages** (§5).
8. **The checks:** the Browser pane at 375 and 430 wide, light and dark; then the founder opens the link inside
   TikTok on his phone.
9. **Deploy** (after his go). When trykitted.com exists, its DNS records are added in the Firebase console
   (Hosting → Add custom domain).

About 1.5–2 days of Claude's work. Steps 1–5 and 7 need nothing from him but the package OK.

## 8. Checks (written before the code)

**W · the page**
- W1 The headline, the still frame and the form show with JavaScript turned off. The page is built as HTML.
- W2 From 320 to 430 px wide: no sideways scroll, nothing cut off, 16 px side margins.
- W3 Light and dark follow the phone. Every text color pair meets the app's contrast table (03 §2).
- W4 At 200% browser text size, everything wraps and nothing overlaps.
- W5 Inside TikTok's browser on the founder's iPhone:
  - the page opens;
  - the video plays muted and inline;
  - the keyboard doesn't cover Join the beta;
  - a signup goes through.
- W6 A link pasted into iMessage and Instagram DMs shows the preview image and title.
- W7 The built site makes no request to any server but its own: no font CDN, no script CDN, no tracker. A test
  scans `web/dist`.
- W8 A test scans the built words for the banned list (§3) and for emoji.
- W9 At 1280 × 800 with a mouse: two columns, with the video in the phone frame and the QR code. The QR code opens
  the page with `?src=qr` (scanned with a real iPhone camera).
- W10 Each device opens with the right platform picked: an iPhone (Safari and TikTok) picks iPhone, an Android
  browser picks Android, a laptop picks nothing. Each can still be changed by hand. Checked by setting the browser's
  device report in the Browser pane, and on the founder's phone.
- W11 Nothing moves after the page loads on any device: the layout is set before the page shows, and the platform
  pick fills in without moving anything.

**P · speed** (the in-app browser is the reason)
- P1 First load without the video: ≤ 250 KB transferred, of which ≤ 60 KB of JavaScript, gzipped. A test reads the
  build output.
- P2 The video: ≤ 1.5 MB, `muted playsinline loop`, preload only after the page has loaded. The still frame is
  ≤ 60 KB.
- P3 With Reduce Motion on, the still frame shows and the video never plays. Any 21st animation stops too.

**F · the form and the function** (emulator tests in `firebase/tests/waitlist.test.ts`)
- F1 A valid signup is stored once, with the trimmed, lowercased email, platform, `src` and day.
- F2 The same email again (any case or spaces): one document, the same success answer.
- F3 Without "18 or older": refused (400), nothing stored. The page shows the under-18 line.
- F4 A bad email or a body over 2 KB: refused, nothing stored.
- F5 The hidden trap field filled in: answers success, stores nothing.
- F6 More than 10 tries an hour from one address: 429, nothing stored. No raw IP is ever written.
- F7 The rules: an outsider can't read, list or write `waitlist` or `waitlist_stats`. Checked with the emulator's
  rules, like R1–R10.
- F8 Only `POST`, and only from our own origins. Anything else is refused.
- F9 The function never writes an email to its logs. A test captures the log output.
- F10 Counts: one visit and one signup with `src=tiktok` add one to each of that day's tiktok counts.
- F11 The export script marks exactly the batch it wrote and never exports an unsubscribed or Android row.
- F12 The unsubscribe link (a signed token) sets `unsubscribed` and can't be guessed for another email.
- F13 The delete script removes the document, and a second signup afterwards starts fresh.

**A · accessibility**
- A1 Every field has a visible label.
- A2 Errors and the success line are announced (a live region). Focus moves to the success line.
- A3 Everything works by keyboard alone, with a visible focus ring.
- A4 The video is decorative (`aria-hidden`); the words around it carry the meaning.

**L · legal and words**
- L1 Privacy, Terms and Support are reachable from the footer and the fine print.
- L2 Every claim on the page is true of today's app. Each line in §3 is checked against CLAUDE.md "The product" and
  "Privacy".

## 9. Results

### Built Oct 19 (#360), on branch `claude/beta-landing-page-plan-5bd638`, not deployed

**Where the code is:**
- **The page:** `web/` (Astro 7, Tailwind 4, shadcn's Button, Input and Label). The words are in `src/pages/index.astro`, the form in `src/components/JoinForm.astro`, the settings in `src/lib/site.ts`.
- **The function:** `firebase/functions/src/waitlist/` (`handler.ts`, `admin.ts`), exported as `waitlist` and `purgeWaitlistRate` from `index.ts`.
- **Hosting:** `firebase/firebase.json` → `hosting`.
- **The founder's script:** `firebase/scripts/waitlist.mjs` (export a batch, delete an email, show the counts).
- **The tools:**
  - `tools/web/serve-local.sh`: the whole site on the emulators. Launch config `kitted-site`, at http://127.0.0.1:5002.
  - `tools/web/og.sh`: renders the link-preview image.
  - `tools/web/glyphs.swift`: Archivo's letters as outlines.

**Changed from the plan while building:**
1. **No React reaches the phone.** With React as an island, the page sent 93 KB of JavaScript (gzipped) against P1's 60 KB: React alone is 65 KB.
   - shadcn's components are now drawn to HTML when the site is built.
   - The platform choice and the age box are native inputs in shadcn's look.
   - A 1.8 KB script sends the form.
   - First load: about 16 KB in all.
   - The form also works with JavaScript off: the server answers a plain form post with a page (new check F14).
2. **21st.dev now needs an account and an API key to read any component's code,** and the free plan allows 2 downloads a day.
   - Claude can't make accounts, so nothing from 21st.dev is in the page yet.
   - The phone frame, the steps and the FAQ are drawn in our own code with the app's tokens.
   - The MIT-licensed candidates, if the founder wants them later: `designali-in/iphone-16-pro` (phone frame), `ln-dev7/how-it-works-02` (vertical steps), `ln-dev7/faqs-01` (FAQ).
3. **The FAQ uses plain `<details>`,** not shadcn's Accordion, which needs React.
4. **No font downloads.** The wordmark and the score numerals are Archivo outlines made from the app's own font files.
5. **The hero is a drawn example card** ("8.0 Sharp", "Tuck in your white tee → 8.5") with the reveal done in CSS, until the founder's recording exists.
   - Drop `hero.mp4` and `hero.jpg` into `web/public/hero/` and the page shows the video instead (P2 checks it).
6. **shadcn's installer pulled in an npm package called `cn`,** which wasn't asked for, and pointed the components at it. It was removed and the imports point back at our `src/lib/utils.ts`.

**Checks:**
- **F1–F14:** 26 of 26 on the Firestore emulator (`firebase/tests/waitlist.test.ts`). The whole Firebase suite: 100 of 100.
- **W1, W7, W8, W10, P1, P2, A1, A4, L1:** 9 of 9 (`web/tests/build.test.mjs`, `npm --prefix web run check`).
  - W10 runs the head's device script against iPhone Safari, TikTok's and Instagram's in-app browsers, Android, a Mac, an iPad and Windows.
- **In the Browser pane, against the real function on the emulators:**
  - **Phone (375 × 812, dark), the Android preset:**
    - Android came up already picked;
    - an empty Join said "Check your email address." and focused the field;
    - with no age box ticked it said "Kitted is for ages 18 and up." and focused the box;
    - a full signup showed "You're on the list for Android.".
    - The emulator's database held one row, lowercased, `src: tiktok`, plus that day's counts. No address was stored.
  - **Laptop (1280 × 800, light):** two columns, with the card in a phone frame and the QR code.
  - **320 px wide:** no sideways scroll.
- **Fixed on the way:**
  - the numerals were clipped;
  - the dashed seam touched the text above it (styles moved into a CSS layer);
  - the privacy page's date line was shown at body size;
  - the reveal was shortened to about 1.2 s, so the fix shows before people scroll on;
  - the phone frame was widened, and the app's "Ask Kit…" bar added to it.
- **Not checked yet:**
  - **W4** (200% text);
  - **W5** (inside TikTok on his iPhone);
  - **W6** (a pasted link's preview);
  - **W9** (scanning the QR code with a real iPhone);
  - **A2, A3** with VoiceOver and the keyboard;
  - **P3** (Reduce Motion: the code turns the animation off; not seen).
  - They need the live page or his phone.
- **`npm --prefix web run guard`** refuses a deploy today: the support email isn't set, so the privacy, terms and support pages still say "not set yet".

**Deploying, once the founder says go:**
1. Put the support email in `web/src/lib/site.ts`.
2. `firebase functions:secrets:set WAITLIST_SECRET --project kitted-a5b45`, with a long random string (Claude can make one).
3. `npm --prefix web run check && npm --prefix web run guard`.
4. From `firebase/`: `tests/node_modules/.bin/firebase deploy --only hosting,functions:waitlist,functions:purgeWaitlistRate --project kitted-a5b45`.
   - The page goes live at `kitted-a5b45.web.app`.
5. When trykitted.com is registered: Firebase console → Hosting → Add custom domain, then the DNS records at the registrar.

## 10. Decisions and asks

- **Decided by the founder (Oct 19):** a waitlist page, shadcn/ui and 21st.dev.
- **Decided by Claude:**
  - Astro around them;
  - no Magic MCP;
  - restyled to the app's tokens;
  - Firebase Hosting with a separate `waitlist` function;
  - no trackers;
  - batches sized to the spending stop.
- **Asks (CLAUDE.md to-do):**
  1. **The packages (§2), 1 min.**
  2. **The hero video, 1 min to decide:**
     - **Default:** a screen recording of one of his own fit checks on his phone, neck down: the reveal and the fix.
     - The demo photos are stock and can't be used in marketing (CLAUDE.md, the Welcome photo item).
  3. **The words (§3), 3 min.**
  4. **The first deploy's go** (§9 "Deploying"), after the support email is in.
  4b. **21st.dev, optional:** a free account and API key (2 downloads a day) if you want any of their pieces. Claude's
      view: the page doesn't need them.
  5. **Later:**
     - trykitted.com (already P1);
     - the support email (already P1);
     - a postal address for invite emails;
     - the batch sizes and the spending stop.
