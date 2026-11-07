# Question bank

Starting points, not a script. Each area lists the questions that most often change a design, and the trap they catch. Pick the ones that matter for this idea, rephrase them in the user's terms, and attach options and a recommendation. Skip anything the repo or an earlier answer already settles.

Rough priority: areas near the top are the expensive ones to reverse.

## 1. Scope

The trap: a first version that quietly contains three products.

- If you could ship only one thing in the first version, which one?
- What would you be fine *not* having on day one, even if it feels basic? (Accounts, settings, search, sharing, editing, undo.)
- Who is explicitly *not* the user? (A different skill level, platform, country, age, team size.)
- Is there a deadline or event that sets the size of the first version?
- Which idea do you keep coming back to that is really version two?
- What existing tool or habit does this replace, and what is the one thing it must do better than that?

## 2. Core flows

The trap: the happy path is clear, but nobody decided the first-time path or the way back.

- Walk me through the very first time someone uses it, from opening to the first moment it is useful.
- What does a normal second visit look like? What has changed since the first?
- Where does the user start this flow from, and where do they land when it's done?
- Can they back out halfway? What's kept and what's thrown away?
- Is any step waiting on something slow (an upload, a network call, another person)? What do they see meanwhile?
- Which step would you cut if the flow had to be one step shorter?

## 3. Data and state

The trap: data that must survive a reinstall, a second device or a deletion request was never named.

- What must still be there tomorrow? After the app is closed? On a new phone?
- Where does it live: only on the device, on a server, or both? If both, which copy wins in a conflict?
- What is the one record everything else hangs off (a user, a project, an item)? How do the others relate to it?
- Can the user edit or delete it? Does deleting one thing delete the things attached to it?
- Is anything personal or sensitive (photos, location, health, money, minors)? How long is it kept?
- Does anything need a history (versions, an undo, an audit trail), or is the latest value enough?

## 4. Failure and edge cases

The trap: "handle errors" in the spec, a blank screen in the app.

- No network: what works, what doesn't, and what does the user see?
- The slow or failing outside service (AI, payments, an API): retry, fall back, or tell the user? With what words?
- Empty states: what does a brand-new user see before there is any data?
- Too much: what happens with 1,000 items, a 20 MB file, a 5,000-word input?
- Bad input: duplicates, the wrong file type, a blurry photo, a blank field, emoji, another language.
- Two at once: the same action twice quickly, two devices editing, a double tap on "pay".
- What should *never* happen, even when everything breaks? (Lose data, charge twice, show someone else's data.)

## 5. Interfaces

The trap: the screen list is decided, the words on it are not.

- What are the screens (or commands, or endpoints), and which one does a user see most?
- For the main screen: what is the one action it exists for?
- What are the exact words on the buttons and messages that matter (errors, empty states, confirmations)? Who signs off on them?
- Is there a mockup, sketch or app you want this to look like? What should it *not* look like?
- Light and dark? Large text sizes? Phone and tablet? Landscape?
- For an API: who calls it, how are they identified, and what does each error look like?

## 6. Constraints

The trap: a stack, budget or rule in the user's head that rules out half the design.

- What already exists that this must fit into (code, a design system, a database, a style)?
- Any stack that is fixed, or ruled out?
- What's the budget for running costs (servers, AI calls, paid APIs) per month or per user?
- Where does it run and who hosts it? Does anything need an app store review?
- Any new library or service that needs approval before it's added?
- Who builds it: one person, several sessions in parallel, a team? How many hours a week?

## 7. Quality

The trap: "fast", "secure" and "accessible" with no number attached.

- Speed: which action must feel instant, and what is the limit in seconds?
- Security: who can see what? What happens if someone guesses another user's link or ID?
- Privacy: what leaves the device, and what does the user agree to first?
- Accessibility: screen reader labels, contrast, text sizes, touch target size.
- Cost per use: what does one action cost to run, and what stops it from running away?
- Rules and law: age limits, regions, store rules, terms the user must accept.

## 8. Testing

The trap: requirements no one can check, so "done" becomes an opinion.

- For each feature, what would you look at to know it works? Turn the answer into a pass/fail line.
- Which checks can be automatic tests, and which need a person (a phone test, a visual check)?
- What real data or real people should it be tried on before it counts as done?
- What would make you call the first version a failure, even if every test passes?

## 9. Structure for parallel work

The trap: two agents editing the same file at the same time.

- Will this be built in one session or several at once?
- Which parts are truly independent (different screens, a separate service, a pure function)?
- Which shared pieces (data types, the API shape, design tokens) must be settled first, by one owner, before the rest start?
- What is the order: what has to exist before anything else can be tested?

## Question shapes that work

- **The forced choice:** "If X and Y conflict, which wins?" Surfaces priorities fast.
- **The concrete scenario:** "A user uploads the same photo twice in a minute. What happens?" Beats "how do you handle duplicates?"
- **The number:** "How many is a lot here: 50, 500 or 5,000?" Turns adjectives into limits.
- **The removal test:** "If we dropped this, would anyone notice in the first month?" Finds scope to cut.
- **The worst case:** "What's the worst thing this could do to a user?" Finds the hard lines.
