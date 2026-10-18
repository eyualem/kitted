# Kitted share cards: design brief (Oct 18, 2026)

## The product
Kitted is an iOS app for guys 18–30 (college, first job) who aren't into fashion. You send an outfit photo; you get a
score out of 10 with a word and the one fix. Positioning: "Look put together. Without trying too hard."
Score words (always shown with the number): ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in.
Max score is 9.5. Scores are in halves (7.5, 8.0). The stylist inside the app is called Kit. The app is KITTED.
Growth: the founder posts short-form video daily with $0 budget; share cards are the growth loop.

## The founder's calls for share cards (Oct 18)
- **Face: his choice per share.** Default is the neck-down crop (chin line to feet); a "Show my face" toggle uses the full photo.
  Every photo-based format should show both states (at least once per format family).
- **Which scores:** a share card is offered at 7.0+ and after a re-check win (a before → after). A low score is only ever
  shared as the "before" of a win.
- **Tone:** mostly premium (the app's look), plus 1–2 louder formats built for TikTok energy.
- **Both stills and motion** (short video loops of the score reveal and the before → after). In the demo, motion is CSS/JS
  animation that loops or replays on tap.
- Already decided earlier: lead with the look and the pieces (useful to the viewer), the score beside it; never show the
  occasion; never show the fix he still needs on a single check (only a fix he did, on a before → after); watermark
  "scored by KITTED" + trykitted.com (domain not registered yet; fine for demos).

## Hard rules (never break)
- Never rate faces, bodies, weight or skin. All copy is about the outfit. Never "rate me"; "rate the fit" is fine.
- No emoji. No RPG ranks, badges, confetti, streak chains, anime theme. Never "unlimited". Never "AI stylist".
- Copper (#DE9762) is used only for score movement/brand stitch accents; not for random decoration.
- Don't show other people. Don't show brands except the woven KITTED label.
- Partial check must say "Partial check: shoes not included" if shown (avoid partials in demos).

## The look (the app's design system)
- Fixed palette in base.css (tokens --k-*): night #08090D, indigo #121628 / #1A2448, label indigo #22305C, copper #DE9762,
  chalk #F3F4F6, white. Score numerals: Archivo Condensed SemiBold (`.k-num`, var(--k-num)), tabular. Wordmark: Archivo
  Expanded Bold, letter-spaced (the `.k-woven` woven label: indigo with dashed stitch ends). Body: SF Pro (var(--k-sf)).
  Mono for small labels (var(--k-mono)).
- Signature motifs: the dashed copper "seam" (stitch line), the woven label, a tape-measure score reveal (a tape slides
  under a fixed marker and locks on the number; measured, not luck; never slot-machine digits), hang tags,
  drawn garment flats (simple SVG shapes of the pieces in their colors).
- Existing reference: the current story card = photo top 66%, indigo band bottom with copper dashed top border,
  Archivo score ~80–96px, word, "Reads as smart casual", 3 piece rows with small drawn flats, trykitted.com.

## Demo photos (img/, free stock; face crops via --neck)
Use `<div class="k-photo" style="--neck:.32"><img src="img/s22.jpg"></div>` for neck-down, add class `full` for face-shown.
| id | neck | outfit (as the app read it) | demo score |
|---|---|---|---|
| p01b | .315 | white tee, tan chinos (straight), white leather sneakers | BEFORE 7.5 Put together |
| p01a | .315 | same + khaki overshirt worn open | AFTER 8.5 Sharp (fix: "Added the overshirt, worn open", +1.0) |
| s15 | .235 | cream overshirt, tan tee, wide khaki trousers, white chunky sneakers, watch | 8.0 Sharp · Reads as minimal |
| s14 | .21 | white sweater, charcoal denim jacket, grey relaxed drawstring trousers, grey chunky sneakers | 7.5 Put together · Reads as streetwear |
| s22 | .32 | tan knit polo, khaki chinos, watch | 7.5 Put together · Reads as smart casual |
| s10 | .28 | black denim jacket, burgundy sweater, black slim jeans, black chelsea boots | 8.0 Sharp · Reads as workwear |
| s25 | .30 (mirror selfie) | cream camp-collar shirt, khaki drawstring trousers, tan chelsea boots, watch | 8.0 Sharp · Reads as minimal |
| s05 | .195 | navy hoodie, mid-wash slim jeans, white retro runners | 7.0 Put together · Reads as streetwear |
| s13 | .30 | black top, navy straight trousers, brown low sneakers | 7.0 Put together |
Look at a photo (Read tool on the jpg) before using it. Scores are illustrative demo numbers.

## Platforms (research, Oct 18; design to the strictest)
- One 9:16 master (1080×1920; draw at 360×640) for IG Stories, Reels, TikTok, Shorts, Snapchat. Strictest safe zone:
  keep text out of top ~14% (≈90px of 640) and bottom ~20% for Stories; for Reels/TikTok/Shorts videos the bottom ~30–35%
  (caption, sound) and right ~12% (buttons rail) are covered. Safe core ≈ centered 900×1400 of 1080×1920.
- IG feed: 4:5 1080×1350 (draw 360×450); the profile grid crops to 3:4, so keep key content in a centered 3:4 (≈ 337×450).
  Carousel slide 1 is the cover.
- TikTok photo mode: up to 35 images, 9:16 (4:5 ok).
- iMessage/WhatsApp: a 4:5 or 1:1 still. Link preview (Open Graph) 1200×630 (draw 400×210); X in-feed 16:9 1600×900.
- Pinterest 2:3 1000×1500.
- iOS hand-off: Instagram Stories API takes a background image/video AND/OR a transparent sticker PNG (the user places it
  over his own photo; needs a Facebook App ID). Snapchat Creative Kit takes a sticker too. TikTok Share Kit can put an
  image behind the creator as a green screen.
- Patterns that spread: sticker on your own photo (Strava), before → after reveal (looksmax TikToks), identity badge
  (Spotify Wrapped), "rate my fit / guess my score" prompts.

## How to work
- Write ONE fragment file per format family at parts/<id>.html (no doctype/html/head/body). It may contain a <style> and a
  <script>. **Prefix every CSS class with your id** (e.g. `.st-band`) and wrap JS in an IIFE; base.css classes (`k-*`)
  are shared. No external resources at all (fonts are local, images in img/).
- Each fragment = a <section class="<id>"> with an <h2> (format name), a one-line <p> on where it's used and why,
  then a `.k-stage` row of cards, each card followed by `.k-cap` caption: platform, export size, what it's for.
- Draw every card at 1/3 export size (360px wide for 1080). Add a safe-zone overlay inside each card using
  `<div class="k-safe"><i style="top:0;left:0;right:0;height:14%"></i><b style="top:4px">IG Story UI</b>…</div>`
  (shown only when body.show-safe).
- Build and look: `python3 build.py` then `./shot.sh preview/<id>.html shots/<id>.png 1400 <height> 1`
  (one Chrome at a time; the script waits its turn). Then Read the PNG to check it. For animation, also shoot with
  KVT=<ms> at a couple of moments. `KSAFE=safe python3 build.py` renders the safe-zone overlays on.
- Keep each fragment under ~60 KB. Don't touch other designers' parts files or base.css (ask in your report if base needs a change).
