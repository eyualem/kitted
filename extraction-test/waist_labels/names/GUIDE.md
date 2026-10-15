# Which reading names the clothes right? (Oct 15, 2026, DECISIONS-LOG #278)

Each item gives an outfit photo (faces hidden) and two readings, A and B, of the clothes: for each slot (top, outerwear,
bottom, footwear) a color and a garment type. You don't know which model wrote which. Open the photo with the Read
tool and judge each reading by eye. Label the clothes only; never comment on the body, face, weight or skin.

For every slot that appears in either reading, answer for A and for B separately:
- `type`: right · close (a near look-alike a stylist wouldn't fuss over, e.g. hoodie vs sweatshirt, chinos vs trousers) · wrong · missing (the slot is there in the photo but the reading has none) · extra (the reading names a piece that isn't there)
- `color`: right · close (a neighboring shade, e.g. navy vs black in dim light, cream vs white) · wrong

Write a CSV with header `photo,slot,reading,type,color,notes` (reading = A or B; one row per slot per reading; notes a
few plain words, quoted if they contain a comma) with the Write tool to the output path given. Don't open any other
file. Reply with only the row count.
