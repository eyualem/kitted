# Waistline labels, second pass (Oct 14, 2026, DECISIONS-LOG #264): one question, for label reliability

You label outfit photos by eye. Never open any other file in `extraction-test/` (no other labels, AI readings or
measurements). Faces are already hidden. Label the clothes only; never comment on the body, face, weight or skin.

For each image (Read tool), answer one question about **the top the pants meet at the front** (the innermost top
that reaches lowest; ignore an open jacket or overshirt hanging over it):

**Does the outfit show the waist?** That is: the top is tucked in (full or front tuck), OR the top ends at or above
the pants' waistband so that the waistband or belt is visible at the front.

- `yes` = tucked, or the waistband/belt is visible between the top and the pants
- `no` = the top hangs over and covers the waistband (it ends on the fly or lower)
- `ns` = can't see (hidden by an arm, bag, phone, a closed long coat, the photo cut off) or shorts

Output CSV with header `photo,waist,confidence,why` (`photo` = file name without `.full.jpg`; confidence high/low;
why = a few plain words, quoted if it has a comma). Write it with the Write tool to the output path given, and reply
with only the row count.
