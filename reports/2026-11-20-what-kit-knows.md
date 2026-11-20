# What Kit knows when it answers

*Nov 20, 2026 · a read of the code on main (`c39e1f29`) · no code changed, nothing paid · cloud copy: none yet*

Your questions (Nov 20): how much do the chat and the ratings know about each other? When Kit answers, how much does it know about the scores you've been given and the pieces in those outfits? About your closet? About the outfits you've tried on this week?

## The short answer

- **Today: a lot.** On every question, not only "why", Kit gets each of today's fit checks in full: the score and its word, the one-line summary, each part's score with the reasons that took points off or added them, every fix with the score it leads to, the tip, and the pieces by name.
- **Earlier this week: very little.** Each check from the last 7 days gets one line: the day, the score, the word, the occasion and the piece names. No fixes, no reasons. Kit only sees one of them in full when you ask about it by day or by score ("why did I get a 6.5 on Tuesday?").
- **Your closet: every piece, up to 80**, most-worn first. Each piece comes with its name, its kind, its color, its cut (how roomy a top is, the leg shape of pants), how many times you've worn it, and whether it has a photo. It doesn't get the pattern, a logo or graphic, or when you last wore it.
- **What you wore this week: Kit's own words don't know it.** The code that picks outfits for Kit uses your fit checks, "Wear this" taps and Kit's past outfit cards so it doesn't repeat itself. But Kit is never told in words "he wore the navy overshirt yesterday". The Lookbook isn't sent as a list at all.
- **Earlier days' chats: nothing yet**, except the facts in What Kit knows, which go with every question. T108 adds a 7-day recap of Kit's own cards and your taps, never anyone's words.
- **Each way:** the chat reads the ratings but never changes them. The only path back is Re-score, which you tap yourself. Rating a photo doesn't use anything you said in the chat either.

## How one question is put together

1. **The pack** (`app/src/features/ask/context.ts`, `buildStylistContext`): code on your phone writes it fresh for every question, from a snapshot that copies only the allowed fields (`snapshot.ts`).
2. **The route** (`router.ts`): plain code, no AI. It sorts the question into one of 11 kinds (why, what if, what goes with, what to wear, can I wear, what to buy, how should it fit, shape, remember, push-back, general). It also finds the pieces and the check you mean.
3. **The evidence** (`evidence.ts`): extra facts the code works out for that kind of question. For "why", the check in full. For "what if", the fixes and a re-score of the swap. For "what goes with" or "what to wear", outfits picked from your closet with the rules' own notes. For "what to buy", the Starter basics you don't own.
4. **The prompt** (`prompt.ts`): the *system* part holds Kit's rules, the format of its closing block, the app map, 10 example answers and the parts of the stylist guide that kind of question needs. The *user* part holds the pack, the evidence and the question.
5. **The server** (`firebase/functions/src/api/routes.ts`, `handler.ts`): it checks the request's shape and passes it to **OpenAI's GPT-5.6 Luna**. It adds no data of its own, asks OpenAI not to keep it (`store: false`), and logs only ids, timings and token counts, never the question or the answer.

Size: on the demo closet, the system part is about 19,000–21,000 characters (roughly 5,000 tokens, the same every time, so the provider can cache it). The pack and evidence come to about 2,700–3,200 characters (roughly 750 tokens).

## The example: one real request, as Kit sees it

This is the app's own code run on the demo scenario (16 pieces, two checks this morning, one on Tuesday), for the question **"Why did I get a 9.0 today?"** It was built on the Mac in a test with no AI call. The demo's profile is made up (profile unknown). Only the system part's rules and guide are left out here.

```text
<pack>
Today: Thursday, Oct 22, fall
Looks he picked: smart casual (1st), workwear
Prefers a regular fit
Budget: $30–60 a piece

What you know about him (he can see and delete these):
- Career fair on Oct 29
- You wear tees untucked
- (a guess, not confirmed) You like muted colors more than bright ones
- You like straight-leg pants
- You wear white sneakers most days
- You own a denim jacket (no photo yet)
- You have class most weekdays
- (a guess, not confirmed) You like a little boldness, nothing loud

His closet (16 pieces, most worn first):
P1 · White sneakers · shoes · white · worn 9×
P2 · Navy overshirt · outer · navy · regular · worn 8×
P3 · Dark jeans · bottom · dark · slim leg · worn 7×
P4 · Khaki chinos · bottom · khaki · straight leg · worn 6×
P5 · Navy chinos · bottom · navy · slim leg · worn 5×
P6 · White tee · top · white · regular · worn 4×
P7 · Light-blue oxford · top · light-blue · regular · worn 4×
P8 · Grey runners · shoes · grey · worn 4×
P9 · Black tee · top · black · regular · worn 4×
P10 · Brown loafers · shoes · brown · worn 4×
P11 · Navy crewneck · top · navy · regular · worn 4×
P12 · Grey tee · top · grey · regular · worn 2×
P13 · Olive overshirt · outer · olive · regular · worn 1×
P14 · Black sweatshirt · top · black · regular · worn 1×
P15 · Denim jacket · outer · mid-wash · regular · worn 1× · no photo yet
P16 · Black Chelsea boots · shoes · black · worn 1×

Today's fit checks (the app's scores; never change them):
FC1 · 7:42 am · 8.0 Sharp · Date
  Summary: Clean base. The overshirt in your hand finishes it.
  Pieces: P6 White tee, P4 Khaki chinos, P1 White sneakers
  Fix 1: Wear the overshirt, open → 9.0
  Next level: Mix textures or shades, like a knit or suede. No score change today.
FC2 · 7:50 am · 9.0 Dialed in · Date · re-check of FC1
  Summary: Layered and clean. Dialed in. Nothing else changed.
  Pieces: P6 White tee, P4 Khaki chinos, P1 White sneakers
  Fixes: none on the card
  Next level: Mix textures or shades, like a knit or suede. No score change today.

Earlier this week:
FC3 · Tuesday, Oct 20 · 6.5 Getting there · Everyday · black sweatshirt

Today's chat so far:
He: (sent a photo for a fit check, FC1)
You: Overshirt on? Send it. I'll only re-read the layer.
He: (sent a photo for a fit check, FC2)
You: Morning. An easy one for class today:
He: What should I wear?
You: Where to?
He: Interview
You: Career fair on the 29th, right? Business casual, and you can build it from what you own.

His question: Why did I get a 9.0 today?
</pack>

<evidence>
The check he means: FC2
FC2 · 7:50 am · 9.0 Dialed in · Date · re-check of FC1
  Summary: Layered and clean. Dialed in. Nothing else changed.
  Pieces: P6 White tee, P4 Khaki chinos, P1 White sneakers
  Fixes: none on the card
  Next level: Mix textures or shades, like a knit or suede. No score change today.
</evidence>

Question: Why did I get a 9.0 today?
```

**What a live check adds.** The demo's checks were written by hand, before the parts engine, so they have no `Parts:` line. A check scored in the app today has one more line, which is where "which rules cost or added points" lives. From the app's own test (`app/src/__tests__/stylistContext.test.ts`):

```text
FC1 · 9:15 am · 7.0 Put together · Class/Work · reads as streetwear · going for minimal
  Summary: Nothing's wrong with it; it just doesn't have a waist.
  Partial check: shoes not in the photo (what isn't in the photo never costs points)
  Pieces: P1 Black tee
  Parts: Proportions 6.5 (the tee hangs over the wide jeans −0.5) · Fit 7 · Color 7 · Shoes not scored · Style 7
  Fix 1: Tuck in your tee → 7.5 (Raises Proportions)
  Smaller step: Dark straight jeans would sit better
```

**Other questions on the same closet get different evidence.** "What should I wear to a date tonight?" gets two outfits the code picked:

```text
Outfits from his closet for date:
- Pick (date): P11 Navy crewneck + P5 Navy chinos + P16 Black Chelsea boots · why: Navy crewneck for the cold. · careful: the slim chinos would balance better with a straight leg
- Another (date): P2 Navy overshirt + P9 Black tee + P5 Navy chinos + P8 Grey runners · why: Navy overshirt for the cold. · careful: the slim chinos would balance better with a straight leg
```

"How should chinos fit?" gets no evidence at all: the pack, plus the guide's sections on fit.

Two things in the demo that aren't the app's fault: the re-check FC2 lists the same three pieces as FC1, without the overshirt it added, because the demo data is written that way. The live code adds a re-check's new pieces to its list (`closet/service.ts`, the re-check's `matched` and `added`), but I didn't check that on a phone. There's also no outfit idea or weather line, because the demo has no morning card for that day.

## Your questions, one by one

### 1. The latest fit check: **Yes**, on every question
- **What Kit gets:** for each check today, in time order: the time, the score and its word, the occasion, "re-check of FC1" if it is one, what it reads as and the look you were going for, the summary, whether it was a partial photo, the pieces (by closet name), every part's score with each reason and its points (minus for a cost, plus for a credit), the condition deduction, every fix with the score it leads to and the part it raises, and the tip line. `context.ts` `fullCheckLines`, lines 116–150.
- **Which questions:** all of them. Today's checks are in the pack, not the evidence. A "why" or push-back question gets that check a second time as evidence (the same lines), and "what if" adds a re-score of the swap he names, computed by the scoring code (`evidence.ts` lines 184–208).
- **The pieces it read:** **Partly.** The check lists pieces by name and handle. Their color and cut come from the matching closet line. Kit never sees the vision model's raw reading (no pattern, hem, length, tuck or logo), only what the closet piece carries. A piece still waiting on "Same as your …?" is left out of the closet list, and so it **also drops out of that check's piece list** (`context.ts` lines 181–206). Right after a check that asks "Same as your navy overshirt?", Kit can't see that piece in the outfit you're asking about.
- **Not sent:** the old v4 columns (`rulesFired`, `credits`, `subscores`). The parts line replaced them.

### 2. Earlier fit checks: **Partly**
- **Today's:** all of them, in full (above).
- **This week:** the last 7 days before today, newest first, at most 14. **One line each**: the day and weekday, the score and word, the occasion and the piece names (`context.ts` lines 228–236). No summary, no fixes, no parts.
- **In full only on demand:** when the router finds a "why", "what if" or push-back question that names a weekday, "yesterday" or a score ("my 6.5"), that check's full lines go into the evidence (`router.ts` `namedCheck`).
- **Older than 7 days:** nothing.

### 3. The closet: **Yes, capped**
- **Which pieces:** owned pieces that aren't deleted, merged into another or waiting on a "Same as…?" answer. Sorted by most worn, then most recently worn. **At most 80** (`MAX_PIECES`, `context.ts` line 59).
- **Fields:** a handle (P1…), the name, the slot (top, bottom, shoes, outer, accessory), the color word, the cut (fitted, trim, regular, roomy or oversized for tops and outerwear; the leg shape for bottoms), the times worn, and "no photo yet" for pieces you only mentioned in chat (`pieceLine`, lines 96–107).
- **Not sent:** pattern, logo or graphic, the exact kind beyond the name (a "jacket" could be a bomber or a chore coat), when it was last worn, condition, and any photo. The vision model doesn't read fabric at all (there's no fabric field), so "mix in a knit or suede" advice can only lean on piece names.
- **Pieces you mentioned in chat** ("I own black Chelsea boots") are in the closet with "no photo yet", and the outfit picker uses them.

### 4. What you've worn this week: **Partly**, and mostly not in words
- **Fit checks:** yes, as the one-line history above (the day, score and pieces).
- **"Wear this" taps on the morning card:** **No** in Kit's words. The code uses them only to rotate the outfits it suggests (`evidence.ts` `historyFor`, lines 117–134), so Kit doesn't keep suggesting the same pieces. They also raise a piece's worn count.
- **Kit's own outfit cards from earlier days:** the same, used for rotation only (`kitCards`, lines 87–97).
- **Lookbook:** **No.** The Lookbook is your scored checks. The last 7 days of them reach Kit as the one-liners above, and nothing older does.
- **Today's morning card:** **Yes.** Its outfit, occasion, look, state (for example worn) and the reason line, plus today's weather in words (`context.ts` lines 238–249).

### 5. Past chats and What Kit knows: **Partly**
- **Today's chat:** your words and Kit's words, the **last 10 turns** only (about 5 back-and-forths). Photos show as "(sent a photo for a fit check, FC1)" (`MAX_TURNS`, lines 251–263).
- **Earlier days' chats:** **No**, none of it (`handoff/07` §3.2). T108 will add the recap (see below).
- **What Kit knows:** **Yes**, every fact you haven't deleted, on every question, with guesses marked "(a guess, not confirmed)" (lines 173–178). Fourteen kinds of fact: sizes, budget, dress code, school or work, events coming up, colors and fits you like or avoid, the look you're into now, and pieces you own with no photo. Anything about your body, health, age, money beyond a clothes budget or other people is dropped before it's saved (`memory.ts` `NEVER`). There's no cap on how many facts go.

### 6. Your profile: **Yes**, the clothes part only
- **Sent:** your picked looks in order (the first marked), your "Something else" words, your fit preference, your budget, today's date and season, and the weather as words when today's morning card has it. The occasion travels with each check, not with the profile.
- **Deliberately not sent:** your photo (the chat is text only; the server rejects images on this route, `maxImages: 0`), your name, birth year or age, your location (the weather goes as words, never a place), height and build (removed in #375 after a blind test showed they didn't change the advice), consent state, units, file paths and raw readings. The snapshot doesn't even copy these fields (`snapshot.ts`), so a mistake further down can't leak them.
- **Leftovers to tidy:** the comment at the top of `context.ts` still says height and build are sent, and one of Kit's rules (`prompt.ts` line 97) still tells it how to use them "when given". Neither changes what's sent, but the rule costs tokens on every question.

### 7. Today's cards and the app map: **Yes**
- **Cards Kit showed today:** the newest 8, as plain lines ("Outfit for date: Navy crewneck, Navy chinos…", "Next buy: olive overshirt"), with the rule never to contradict them (`evidence.ts` `shownCardLines`).
- **The app map:** in the system part, built from the feature switches: the four tabs, fit check, re-check, Why, Lookbook, Past chats, What Kit knows, and where Next buy lives in the beta. A screen that's switched off is never listed (`prompt.ts` `appMapLines`).

## Against the spec (`specs/kit-stylist-chat.md`, KC7)

### What's planned: T108 already covers
- **The 7-day recap (KC7.2):** per day, the outfits, options and buy cards Kit showed (piece names only) and your taps (Wear this, Add, No thanks, I have one, Re-score). At most 25 lines, never your words or Kit's.
- **Two new fact kinds (KC7.1):** "shopping for" ("a jacket to replace the tan bomber, around $115") and the dislike from T107 ("you'd rather not wear your tan bomber").
- **Deleting a day's chat removes it from the recap (KC7.3)**, and the privacy line stays the same (KC7.5).
- **One thing T108 should settle:** KC7.2 says "his taps … built from Past chats". The morning card's **Wear this** is the tap that answers "what did I wear this week", so T108 should confirm the morning card's taps count, not just taps on Kit's answer cards. That's a reading of the approved spec, not a change to it.

### Gaps: what a real stylist would want Kit to know, most useful first
1. **The rest of today's chat.** Ten turns is about five questions. On Nov 12 your friend asked 20 in one evening, so by the last ones Kit had forgotten the start. The 8 card lines help, but Kit loses what he said ("I'm going to a rooftop bar"). *Recommend:* raise the limit to 20 turns. That's about 300–500 more tokens on a long evening, under 0.02¢ a question.
2. **What went wrong earlier this week.** Kit can't say "the slim leg has cost you points three times this week" or build on Tuesday's fix, because earlier checks have no fixes or parts. *Recommend:* add each earlier check's lowest part and first fix, written by code (about 25 tokens a check, 14 at most). Or add one code-computed line: "what kept costing points this week".
3. **What he actually wore, in words.** "Don't give me what I wore yesterday" or "what did I wear Monday?" can't be answered. T108's recap covers it if the morning card's Wear this counts (above). *Recommend:* also add "last worn" as a weekday to each closet line ("worn 9×, last Tue").
4. **Pattern and graphic on each piece.** The color advice and the clash rules care about stripes, checks and big logos, but Kit only has names. *Recommend:* add the pattern when it isn't solid, and "graphic" when the piece has a logo or print (the vision model already reads both).
5. **A piece waiting on "Same as…?" vanishes from that check.** *Recommend:* list it as "(maybe your P2 Navy overshirt)" in the check's pieces. That's a small fix to match what 07 §3 already says ("today's checks in full"), not new data.
6. **Checks older than 7 days and the Lookbook.** Lower value for now. *Recommend:* later, a single line of his 3 best checks ever, with their pieces, so Kit can say "go back to what got you the 9".

Smaller clean-ups (no spec change, they only save tokens): drop the dead height-and-build rule; stop sending the "why" check twice (it's in the pack and again in the evidence); and the question is written twice (in the pack and after it).

### What's new: would need a spec change
| Change | Spec change? | Recommendation |
|---|---|---|
| Today's chat: 10 turns → 20 | Yes: the 10 is in `handoff/07` §3, and it sends more of his own words | **Do it**, in T108 or right after. Biggest gain for the least cost |
| Earlier checks get their lowest part and first fix | Yes, small: a KC7 line | **Do it**. All clothes data, all written by code |
| "Last worn" weekday on closet lines | Yes, small | **Do it**, weekday only, not the date and time |
| Pattern and graphic on closet lines | Yes, small | **Do it**. Clothes data only |
| The "Same as…?" piece in its check | No: it matches 07 §3's "today's checks in full" | **A tiny task** |
| Best 3 checks ever | Yes | **Later**, after the beta shows people ask for it |
| Earlier days' chat words | Yes, and against KC7.2 ("never his words") | **Don't.** The recap of cards and taps is the safer form |

### Privacy: what would change what goes to OpenAI
What goes today: the rules and guide, your clothes profile (looks, fit, budget, your own look words), every live fact, up to 80 closet pieces, today's checks in full and the week's as one-liners, today's morning card and weather in words, today's last 10 chat turns and today's cards, plus the question. OpenAI is asked not to store it (`store: false`). The server doesn't keep it, and logs no words.

- **T108's recap** already changes this, which is why it's a strict task. It adds piece names and tap names from up to 7 earlier days, never words. Approved in the spec (KC7.5).
- **20 chat turns** sends more of your own typed words from today. It's the same kind of data, but more of it, so you should OK it.
- **"Last worn" weekdays** is a small new kind of data: when you wore something. Clothes only, no place. Weekday-level is enough.
- **Pattern, graphic, earlier fixes and parts:** clothes data the app already computes, the same kind as what's sent now. No new category.
- **Worth knowing:** piece names and facts you type go as typed. The code strips control characters and caps the length, but a piece renamed with a real name or a phone number would be sent as is. A clothes-name check on what you type (the way facts are filtered) would close that. It's not urgent for a friends beta.

## A lesson from this one: the context pack

What you just read is a **context pack**: the one block of text a language model gets for each answer. The model remembers nothing between calls. Everything it "knows" about you is whatever the code chose to paste in that time. Kitted builds the pack in plain code from your phone's data (that's what makes "the code judges" work), and caps each part (80 pieces, 10 turns, 14 checks) so the cost and the answer time stay flat as your history grows.

In an interview, this is the **context window trade-off**: you can stuff everything in (expensive, slower, and models get worse at finding the one fact that matters), or you can *retrieve* only what the question needs. Kitted does both. A small fixed pack goes with every question, and the router adds evidence for the kind of question. That's a simple form of what people call RAG (retrieval-augmented generation). A good answer to "how would you give a chatbot memory?" names that trade-off and gives the caps as numbers.

*If you want to try it by hand:* open `app/src/features/ask/context.ts`, find `MAX_TURNS = 10` and `MAX_PIECES = 80` near the top, and follow where each one is used with your editor's "find all references". Don't change them, just trace them.
