#!/usr/bin/env python3
"""Writes look_labels.csv (blind labels for the Look U / Look L second-look test). Run once, before any Look output exists.
U labels are derived from b1_labels.csv (written blind before batch 1) with the outer/under roles re-assigned the Look way
(a hoodie, sweatshirt or quarter-zip over another top is the outer piece); the under-tee hems for those 5 photos and every
L label were added by eye from the same face-hidden close-ups that are sent, before any Look call was made."""
import csv
from pathlib import Path

HERE = Path(__file__).resolve().parent
b1 = {r["photo"]: r for r in csv.DictReader((HERE / "b1_labels.csv").open())}

# Under-piece hems where the outer is a top worn over a top (not in b1_labels)
UNDER_HEM = {"phone-6b14db": "waistband|hip", "phone-7de605": "waistband|hip", "phone-a765e8": "waistband|hip",
             "stock-s04-before_studio": "waistband|hip", "stock-s24-before_mirror": "waistband|hip"}
# Look L: (pant_end, covers_shoe)
L = {
 "mirror-m01": ("cropped|no_break", "no"), "mirror-m02": ("cropped", "no"), "mirror-m03": ("unsure", "unsure"),
 "mirror-m07": ("slight_break|full_break", "no|partly"), "mirror-m08": ("slight_break|full_break", "no|partly"),
 "mirror-m09": ("not_visible", "no_shoes_visible"), "mirror-m10": ("slight_break|no_break", "no_shoes_visible"),
 "mirror-m12": ("cropped|no_break", "no"),
 "oct7-ph1": ("full_break|pooling", "partly|mostly"), "oct7-ph2": ("no_break|slight_break", "no_shoes_visible"),
 "oct7-ph3": ("slight_break|no_break", "no"), "oct7-ph4": ("full_break|slight_break", "no_shoes_visible"),
 "phone-0d39d6": ("full_break|pooling", "partly"), "phone-1f1997": ("full_break", "partly"),
 "phone-403ade": ("full_break|stacked", "partly"), "phone-5a9049": ("full_break", "partly"),
 "phone-6b14db": ("cropped", "no"), "phone-703a8b": ("not_visible", "no_shoes_visible"),
 "phone-7de605": ("cropped", "no"), "phone-7f14a4": ("full_break", "partly"),
 "phone-8ad378": ("full_break|stacked", "partly"), "phone-8bc29d": ("full_break", "partly"),
 "phone-968016": ("full_break|stacked", "partly"), "phone-a765e8": ("cropped", "no"),
 "phone-b0f0c8": ("full_break", "partly"), "phone-d1967f": ("stacked|full_break", "partly"),
 "phone-d58b14": ("full_break", "partly"), "phone-d6559a": ("full_break", "partly"),
 "phone-d918c0": ("full_break", "partly"), "phone-e026de": ("full_break", "partly"),
 "phone-e438d4": ("slight_break|full_break", "no|partly"), "phone-ebe23f": ("slight_break|full_break", "partly"),
 "phone-f07193": ("full_break", "partly"), "phone-f4870b": ("slight_break|full_break", "no|partly"),
 "phone-fb0b17": ("slight_break|full_break", "no|partly"),
 "stock-p03-after_street": ("slight_break|stacked|no_break", "no|partly"),
 "stock-p06-after_studio": ("unsure", "no_shoes_visible"), "stock-s01-before_studio": ("full_break", "partly"),
 "stock-s02-before_studio": ("shorts", "no"), "stock-s04-before_studio": ("cropped", "no"),
 "stock-s07-before_studio": ("no_break|slight_break", "no"), "stock-s08-before_studio": ("full_break", "mostly"),
 "stock-s10-before_street": ("stacked", "no|partly"), "stock-s11-before_street": ("slight_break|no_break", "no"),
 "stock-s14-before_street": ("stacked|full_break", "partly"), "stock-s15-before_street": ("full_break", "partly"),
 "stock-s19-before_phone": ("unsure", "no_shoes_visible"), "stock-s21-before_phone": ("slight_break|no_break", "no"),
 "stock-s24-before_mirror": ("shorts", "no_shoes_visible"), "stock-s26-before_mirror": ("stacked|full_break", "no_shoes_visible"),
}
NOTE_L = {"phone-d1967f": "back leg stacks in several folds above the suede boot; front leg a full break",
          "stock-p03-after_street": "skinny trousers, a few folds at the Chelsea boot; between slight and stacked",
          "stock-s10-before_street": "skinny jeans gathered in folds on the boot shaft",
          "stock-s08-before_studio": "flares cover most of the shoe", "phone-703a8b": "cut at the thigh"}
LAB = ("Claude subagent (look1), Oct 10: U columns re-mapped from b1_labels.csv (blind, pre-batch-1); under hems for "
       "hoodie/quarter-zip-over-tee photos and all L columns by eye from the face-hidden close-ups, before any Look call")
rows = []
for p, (pe, cs) in L.items():
    r = b1[p]
    layer = r["outer_type"] not in ("na", "none", "")
    peek = set(r["under_shows"].split("|")) & {"a_little", "clearly"}
    if layer:
        okind, ohem, seam = r["outer_type"], r["outer_hem_at"], r["outer_shoulder_seam"]
        upres = "no" if r["top_type"] == "none" else ("unsure" if r["top_type"] == "unsure" else "yes")
        uhem, ushow = (r["top_hem_at"] if upres == "yes" else "na"), r["under_shows"]
    elif peek:
        okind, ohem, seam = r["top_type"], r["top_hem_at"], r["top_shoulder_seam"]
        upres, uhem, ushow = "yes", UNDER_HEM[p], r["under_shows"]
    else:
        okind, ohem, seam = r["top_type"], r["top_hem_at"], r["top_shoulder_seam"]
        upres, uhem, ushow = "no", "na", "no"
    if p == "phone-f07193":
        upres, uhem, ushow = "yes|no", "unsure", "no"   # a grey layer shows only at the neck
    rows.append({"photo": p, "group": r["group"], "person": r["person"], "profile": r["profile"],
                 "u_outer_kind": okind, "u_outer_hem_at": ohem, "u_under_present": upres, "u_under_hem_at": uhem,
                 "u_under_shows": ushow, "u_outer_seam": seam, "l_pant_end": pe, "l_covers_shoe": cs,
                 "labeler": LAB, "notes": NOTE_L.get(p, "")})
with (HERE / "look_labels.csv").open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)
print(len(rows), "rows")
