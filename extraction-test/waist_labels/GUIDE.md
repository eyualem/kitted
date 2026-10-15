# Waistline labels: the guide (Oct 14, 2026, DECISIONS-LOG #264)

You label outfit photos by eye, one row per photo, **before** any measurement or AI reading is seen. Never open
any other file in `extraction-test/results/` and never look at AI readings, ruler outputs or other labels. Faces
are already hidden in these copies. Label the clothes only; never comment on the body, face, weight or skin.

Read each image with the Read tool. Output a CSV with exactly this header:

```
photo,shot,view,full_body,outer,top_end,outer_end,waistband,tuck,shows_below,leg,bottoms,dark_on_dark,hand_at_waist,confidence,notes
```

`photo` = the file name without `.full.jpg` (e.g. `phone-0d39d6`, `ig-001`).

| Column | Values | Meaning |
|---|---|---|
| shot | mirror · propped · other | mirror = a mirror selfie (phone held toward a mirror); propped = someone else or a propped/timer phone; other = can't tell |
| view | front · angled · side · back | which way the body faces the camera |
| full_body | yes · no | yes when shoulders down to at least the knees are visible |
| outer | none · open · closed | an outer layer (jacket, coat, overshirt, open shirt, cardigan) over another top: open = front open so the top under it shows; closed = zipped/buttoned |
| top_end | tucked · cropped · at_waistband · mid_fly · below_crotch · ns | where the **innermost top that reaches lowest at the front center** stops, i.e. the top the pants meet. Not the outer layer. |
| outer_end | cropped · at_waistband · mid_fly · below_crotch · na · ns | the outer layer's hem at the front, same scale (na = no outer layer) |
| waistband | yes · partly · no · ns | can you **see the pants' waistband or belt** at the front between the top and the pants (look at the front center and the sides)? partly = only on one side or only a sliver |
| tuck | full · half · none · na · ns | full = tucked all around the front; half = front tuck only; none = hangs loose |
| shows_below | yes · no · na | an under-layer (a tee or shirt) shows below the hem of the piece over it (a hoodie, sweater or jacket); na = only one top |
| leg | slim · straight · wide · ns | the pants' leg shape (skinny and tapered = slim; relaxed/baggy/wide = wide); shorts = ns |
| bottoms | jeans · chinos · trousers · joggers · shorts · other | |
| dark_on_dark | yes · no | the piece the pants meet and the pants are nearly the same color and lightness (black hoodie on black jeans) |
| hand_at_waist | yes · no | a hand, arm, phone or bag covers the front waist/hip area, or a hand is in a front pocket |
| confidence | high · low | low when the call on top_end or waistband was hard |
| notes | short free text | one plain line: the pieces and what decided the call. Quote with "" if it has a comma. |

**The top_end scale, in plain words:**
- **tucked**: the top goes inside the pants at the front (full or half tuck; say which in `tuck`).
- **cropped**: the top ends clearly above the waistband: a gap, skin or an under-layer shows between the top and the pants.
- **at_waistband**: the hem ends at the waistband or belt: the waistband or belt shows at least partly, or the hem sits right on it.
- **mid_fly**: the hem covers the waistband and ends partway down the fly (above the crotch).
- **below_crotch**: the hem reaches the crotch or lower (covers the seat at the back on a side view).
- **ns**: can't see (a bag, an arm, the photo cuts off, a long coat hides it).

When two are equally right, write both with a bar, e.g. `at_waistband|mid_fly`, and set confidence low. Don't guess
when you can't see: use ns. Work through the images in the order given, write the CSV with the Write tool to the
output path you were given, and reply with only the row count and how many rows are low confidence.
