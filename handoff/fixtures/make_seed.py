"""Builds fixtures/seed.json (demo seed data matching the mockups) and fixtures/rotation_expected.json.

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_seed.py
Run make_readings.py first (the seed's fit checks embed the demo readings).

Two scenarios:
  "firstRun": Thu Oct 22 2026, 7:38 am, empty app. Reproduces Flow 1 + Flow 2 + the paywall exactly
              (p01b is check #1: "Added 4 to Closet", re-check included, "Today: 8.0 -> 9.0").
  "full":     Thu Oct 22 2026, 12:20 pm snapshot. Reproduces Flows 3-5 (Stylist morning, outfit idea, lock screen,
              Closet 16 / 37 / 8 of 12, Lookbook 4 + 19, You, Limit card, Share). The p01 date check (7:42) and the
              s24 partial check (Tue Oct 20) are already in history.
Every invariant the mockups show is asserted at the end, so a broken seed fails loudly.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, datetime as dt, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kitted_logic import G, score, suggest_fixes, recheck_merge, fix_targets, rotation, outfit_valid, score_word, partial_label  # noqa

TZ = "-04:00"   # America/New_York, EDT in Sep/Oct 2026
STYLES = [["smart_casual", 0.5], ["workwear", 0.5]]   # s22 tapped first, then s10 (order matters for float sums)
R = lambda p: json.load(open(os.path.join(HERE, "readings", p + ".json")))
INDEX = json.load(open(os.path.join(HERE, "readings", "INDEX.json")))


def ts(day, hm="08:00"):
    return f"{day}T{hm}:00{TZ}"


# ------------------------------------------------------------------ closet (16, exactly the Closet tab)
def item(iid, name, slot, garment, hex_, icon, created, source, **kw):
    d = {"id": iid, "name": name, "slot": slot, "section": {"top": "Tops", "bottom": "Bottoms", "shoes": "Shoes", "outer": "Layers"}[slot],
         "garment": garment, "colorHex": hex_, "tileIcon": icon, "isPhotographed": True, "photoFile": None,
         "source": source, "sourceRef": None, "starterID": None, "confirmedFields": [], "createdAt": created,
         "wornCount": 0, "lastWornAt": None}
    d.update(kw)
    return d


CLOSET = [
    item("T1", "White tee", "top", G("top", "tee", "white", tucked="none", length="at_belt"), "#F2F0EA", "tee", ts("2026-09-24", "19:10"), "fitCheck", starterID="s01", sourceRef="FC0"),
    item("T2", "Grey tee", "top", G("top", "tee", "grey", tucked="none", length="at_belt"), "#9CA0A6", "tee", ts("2026-09-24", "19:14"), "added"),
    item("T3", "Navy crewneck", "top", G("top", "sweater", "navy", tucked="none", length="at_belt"), "#2B3550", "sweater", ts("2026-09-24", "19:14"), "added", starterID="s04"),
    item("T4", "Light-blue oxford", "top", G("top", "oxford_shirt", "light_blue", tucked="none", length="mid_fly", sleeve_end="at_wrist"), "#AFC6DE", "oxford", ts("2026-09-24", "19:14"), "added", starterID="s03"),
    item("T5", "Black tee", "top", G("top", "tee", "black", tucked="none", length="at_belt"), "#1E2026", "tee", ts("2026-09-28", "07:55"), "added"),
    item("T6", "Black sweatshirt", "top", G("top", "sweatshirt", "black", tucked="none", length="mid_fly", sleeve_end="at_wrist"), "#22252B", "sweater", ts("2026-10-20", "08:11"), "fitCheck", sourceRef="FC2"),
    item("B1", "Khaki chinos", "bottom", G("bottom", "chinos", "khaki_beige", leg_shape="straight", hem="slight_break"), "#C9B48A", "chino", ts("2026-09-24", "19:10"), "fitCheck", starterID="s06", sourceRef="FC0", confirmedFields=["leg_shape"]),
    item("B2", "Navy chinos", "bottom", G("bottom", "chinos", "navy", leg_shape="slim", hem="slight_break"), "#2A3046", "chino", ts("2026-09-24", "19:14"), "added"),
    item("B3", "Dark jeans", "bottom", G("bottom", "jeans", "denim_dark", leg_shape="slim", hem="slight_break"), "#26324F", "jeans", ts("2026-09-24", "19:14"), "added"),
    item("S1", "White sneakers", "shoes", G("footwear", "white_leather_sneaker", "white"), "#F2F1EC", "sneaker", ts("2026-09-24", "19:10"), "fitCheck", starterID="s09", sourceRef="FC0"),
    item("S2", "Brown loafers", "shoes", G("footwear", "loafer", "brown"), "#5A3522", "loafer", ts("2026-09-24", "19:14"), "added", starterID="s10"),
    item("S3", "Grey runners", "shoes", G("footwear", "retro_runner", "grey"), "#9AA0A8", "sneaker", ts("2026-10-05", "07:50"), "added"),
    item("S4", "Black Chelsea boots", "shoes", G("footwear", "chelsea_boot", "black"), "#1F1B18", "boot", ts("2026-10-14", "18:30"), "added"),
    item("L1", "Navy overshirt", "outer", G("outerwear", "overshirt", "navy", tucked="none", length="mid_fly", sleeve_end="at_wrist"), "#273250", "overshirt", ts("2026-09-24", "19:14"), "added", starterID="s07"),
    item("L2", "Olive overshirt", "outer", G("outerwear", "overshirt", "olive", tucked="none", length="mid_fly", sleeve_end="at_wrist"), "#5B6440", "overshirt", ts("2026-10-21", "18:40"), "chat", sourceRef="I bought something"),
    item("L3", "Denim jacket", "outer", G("outerwear", "denim_jacket", "denim_mid", tucked="none", length="at_belt", sleeve_end="at_wrist"), "#5D7393", "jacket", ts("2026-10-09", "21:05"), "chat", starterID="s08", isPhotographed=False, sourceRef="I have a denim jacket"),
]
GRID_ORDER = ["L2", "T1", "T3", "B3", "S1", "L3", "T4", "T2", "T5", "T6", "B1", "B2", "S2", "S3", "S4", "L1"]

STARTER = [  # rubric/v3.md "Starter 12" (2026 prices: budget / mid)
    ("s01", "White heavyweight tee", "$15–20", "$35–60"), ("s02", "Polo or knit polo", "$30–40", "$70–120"),
    ("s03", "Light-blue or white oxford shirt", "$40–50", "$70–98"), ("s04", "Crewneck knit (merino)", "$40–50", "$80–150"),
    ("s05", "Dark straight jeans", "$50–60", "$80–120"), ("s06", "Chinos, straight or relaxed", "$50–60", "$80–98"),
    ("s07", "Overshirt or chore coat", "$50–70", "$100–250"), ("s08", "Casual jacket (trucker, MA-1, harrington, field)", "$50–90", "$120–300"),
    ("s09", "White leather sneakers", "$70–110", "$150–300"), ("s10", "Loafers or Chelsea/work boots", "$60–110", "$150–275"),
    ("s11", "Quarter-zip or plain hoodie", "$40–50", "$80–150"), ("s12", "Leather belt", "~$30", "$50–100"),
]
STARTER_NOTES = {"s05": "His dark jeans are slim, so they don't fill 'dark straight jeans'.",
                 "s11": "Filled by the next best buy (grey quarter-zip).", "s12": "Not in the closet yet."}

NEXT_BUY = [  # mocked list of 5 archetypes (app-build-spec 7.1). displayFits = the number the card shows; only the
    # grey quarter-zip's +9 is drawn in the mockups. None = not drawn; the Pro list shows the engine's computed number.
    {"id": "grey_quarter_zip", "name": "Grey quarter-zip", "slot": "top", "garment": G("top", "quarter_zip", "grey", tucked="none", length="at_belt"),
     "price": "$40–70", "note": "Plain, no big logo. Layers over every tee you own.", "tileIcon": "sweater", "colorHex": "#9CA0A6", "displayFits": 9, "starterID": "s11"},
    {"id": "navy_polo", "name": "Navy polo", "slot": "top", "garment": G("top", "polo", "navy", tucked="none", length="at_belt"),
     "price": "$30–40", "note": "Dresses up jeans without trying.", "tileIcon": "tee", "colorHex": "#2A3046", "displayFits": None, "starterID": "s02"},
    {"id": "dark_straight_jeans", "name": "Dark straight jeans", "slot": "bottom", "garment": G("bottom", "jeans", "denim_dark", leg_shape="straight", hem="slight_break"),
     "price": "$50–60", "note": "The leg you said you like.", "tileIcon": "jeans", "colorHex": "#26324F", "displayFits": None, "starterID": "s05"},
    {"id": "navy_unstructured_blazer", "name": "Unstructured navy blazer", "slot": "outer", "garment": G("outerwear", "unstructured_blazer", "navy"),
     "price": "$80–150", "note": "For the career fair and weddings.", "tileIcon": "jacket", "colorHex": "#273250", "displayFits": None, "starterID": None},
    {"id": "brown_belt", "name": "Brown leather belt", "slot": "extra", "garment": G("accessory", "belt", "brown"),
     "price": "~$30", "note": "Matches your loafers. Belts don't add fits, but finish them.", "tileIcon": "belt", "colorHex": "#5A3522", "displayFits": None, "starterID": "s12"},
]

# ------------------------------------------------------------------ calendar
LOGGED_OCT = [1, 2, 5, 6, 7, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22]
LOGGED_SEP = [24, 25, 28, 30]
CHECK_DAYS = {"2026-09-24": "FC0", "2026-10-12": "FC1", "2026-10-20": "FC2", "2026-10-22": "FC3"}


def closet_on(day):
    return [c for c in CLOSET if c["createdAt"][:10] <= day]


def pick_outfit(day, n, must=None):
    """Deterministic 'Wear this' outfit for a past day: valid combos from the closet as it was that day."""
    import itertools
    cl = closet_on(day)
    by = {s: [c for c in cl if c["slot"] == s] for s in ("top", "bottom", "shoes", "outer")}
    combos = []
    for t, b, s in itertools.product(by["top"], by["bottom"], by["shoes"]):
        for l in [None] + by["outer"]:
            items = [t, b, s] + ([l] if l else [])
            if must and must not in [i["id"] for i in items]:
                continue
            if t["id"] == "T6":        # the sweatshirt was a one-off
                continue
            if outfit_valid(items, STYLES):
                combos.append(items)
    combos.sort(key=lambda its: [i["id"] for i in its])
    return combos[(n * 17 + 5) % len(combos)]


def main():
    days = [f"2026-09-{d:02d}" for d in LOGGED_SEP] + [f"2026-10-{d:02d}" for d in LOGGED_OCT]
    outfits, wear = [], []
    for n, day in enumerate(days):
        if day in CHECK_DAYS:
            wear.append({"day": day, "kind": "fitCheck", "ref": CHECK_DAYS[day]})
            continue
        must = {"2026-10-19": "S1", "2026-10-21": "L2"}.get(day)
        its = pick_outfit(day, n, must)
        oid = f"OW{n:02d}"
        outfits.append({"id": oid, "itemIDs": [i["id"] for i in its], "occasion": "class", "summary": ", ".join(i["name"] for i in its),
                        "source": "idea", "isSaved": False, "createdAt": ts(day, "07:58"), "woreAt": ts(day, "08:02")})
        wear.append({"day": day, "kind": "outfit", "ref": oid})

    # today's two ideas (screens 12-14)
    outfits.append({"id": "O_MORNING", "itemIDs": ["L1", "T2", "B1", "S1"], "occasion": "class", "summary": "An easy one for class today",
                    "tiles": ["Navy overshirt", "Grey tee", "Khaki chinos", "White sneakers"], "source": "idea", "isSaved": False,
                    "createdAt": ts("2026-10-22", "08:00"), "woreAt": None,
                    "notification": "Today: navy overshirt, grey tee, khaki chinos, white sneakers."})
    interview_items = [c for c in CLOSET if c["id"] in ("T3", "T4", "B2", "S2")]
    iv_reading = {"scene": {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good", "clothed": "fully"},
                  "garments": [copy.deepcopy(next(c for c in CLOSET if c["id"] == k)["garment"]) for k in ("T3", "T4", "B2", "S2")]}
    iv = score(iv_reading, "interview", STYLES)
    outfits.append({"id": "O_INTERVIEW", "itemIDs": ["T4", "T3", "B2", "S2"], "occasion": "interview", "title": "Sharp, not stiff",
                    "summary": "Light-blue oxford under a navy crewneck, navy chinos, brown loafers. Match a brown belt to the shoes.",
                    "heroTiles": ["oxford:#AFC6DE", "sweater:#2B3550", "chino:#2A3046", "loafer:#5A3522"], "source": "idea", "isSaved": False,
                    "createdAt": ts("2026-10-22", "08:04"), "woreAt": None,
                    "predictedScore": iv["overall"], "predictedRaw": iv["raw_unrounded"], "predictedRules": iv["rules_fired"]})

    # ------------------------------------------------------------- fit checks (history in "full")
    fc0_reading = {"scene": dict(R("p01b")["scene"]), "garments": [copy.deepcopy(next(c for c in CLOSET if c["id"] == k)["garment"]) for k in ("T1", "B1", "S1")]}
    fc1_read = {"scene": dict(R("p01b")["scene"]), "garments": [copy.deepcopy(next(c for c in CLOSET if c["id"] == k)["garment"]) for k in ("T2", "L1", "B1", "S1")]}
    fc1_read["garments"][2]["leg_shape"] = "slim"     # the model read slim; he corrected it to straight
    fc1_fix = copy.deepcopy(fc1_read); fc1_fix["garments"][2]["leg_shape"] = "straight"

    def check(fid, created, photo, occasion, reading, first_check=False, closet=(), **kw):
        sc = score(reading, occasion, STYLES)
        fx = suggest_fixes(reading, occasion, STYLES, closet=list(closet), first_check=first_check)
        d = {"id": fid, "createdAt": created, "photoID": photo, "photoDeleted": photo is None, "occasion": occasion, "status": "scored",
             "isPartial": sc["partial"], "notRated": sc["not_rated"], "partialLabel": partial_label(sc["not_rated"]),
             "score": sc["overall"], "rawScore": sc["raw_unrounded"], "word": score_word(sc["overall"]), "subscores": sc["subscores"],
             "occasionAdj": sc["occasion_adj"], "rulesFired": sc["rules_fired"], "credits": sc["credits"], "advice": sc["advice"],
             "fixes": fx["fixes"], "nextLevel": fx["next_level"], "rubricVersion": "3.1.0", "isFavorite": False, "snapState": "none",
             "recheckUsed": False, "parentID": None, "reading": reading, "readingSource": "full"}
        d.update(kw)
        return d

    before_fc1 = [c for c in CLOSET if c["createdAt"][:10] <= "2026-10-12"]
    before_fc2 = [c for c in CLOSET if c["createdAt"][:10] < "2026-10-20"]
    fc3_closet = [c for c in CLOSET if c["createdAt"][:10] <= "2026-10-22"]
    p01b, p01a = R("p01b"), R("p01a")
    fc3 = check("FC3", ts("2026-10-22", "07:42"), "p01b", "date", p01b, closet=fc3_closet, recheckUsed=True,
                closetSummary={"matched": ["T1", "B1", "S1"], "added": [], "undone": ["Beige overshirt (in hand)"]},
                verdict="Clean base. The overshirt in your hand finishes it.")
    merged, notes = recheck_merge(p01b, p01a, fix_targets(fc3["fixes"]), "date", STYLES)
    fc3r = check("FC3R", ts("2026-10-22", "07:50"), "p01a", "date", merged, closet=fc3_closet, parentID="FC3", readingSource="recheckMerged",
                 recheckNotes=notes, doneFixes=[{"copy": fc3["fixes"][0]["copy"], "rawGain": round(score(merged, "date", STYLES)["raw_unrounded"] - fc3["rawScore"], 6)}],
                 summary="Layered and clean. Dialed in. Nothing else changed.",
                 closetSummary={"matched": ["T1", "B1", "S1"], "added": [], "undone": ["Beige overshirt"]})
    fc2 = check("FC2", ts("2026-10-20", "08:10"), "s24", "everyday", R("s24"), closet=before_fc2, snapState="skipped",
                closetSummary={"matched": [], "added": ["T6"], "undone": ["Black gym shorts"]},
                summary="Gym shorts read as loungewear outside the gym. Headed there? Change the occasion. Your score may change once I see your shoes.",
                finishRow={"title": "Finish the check", "question": "Same shoes as Monday?", "suggestedItemID": "S1",
                           "mockupSaid": "Same shoes as Sunday? (Sunday Oct 18 isn't a logged day, so the computed copy says Monday)"})
    fc1 = check("FC1", ts("2026-10-12", "07:45"), None, "class", fc1_fix, closet=before_fc1, readingSource="corrected",
                correction={"field": "bottom.leg_shape", "oldValue": "slim", "newValue": "straight",
                            "scoreBefore": score(fc1_read, "class", STYLES)["overall"], "scoreAfter": score(fc1_fix, "class", STYLES)["overall"],
                            "closetItemID": "B1"}, closetSummary={"matched": ["T2", "L1", "B1", "S1"], "added": [], "undone": []})
    fc0 = check("FC0", ts("2026-09-24", "19:10"), None, "everyday", fc0_reading, first_check=True,
                closetSummary={"matched": [], "added": ["T1", "B1", "S1"], "undone": []}, isFirstCheck=True)
    fit_checks = [fc0, fc1, fc2, fc3, fc3r]

    # worn counts from wear logs + fit checks
    for c in CLOSET:
        c["wornCount"], c["lastWornAt"] = 0, None
    for w in wear:
        ids = next(o["itemIDs"] for o in outfits if o["id"] == w["ref"]) if w["kind"] == "outfit" else \
            {"FC0": ["T1", "B1", "S1"], "FC1": ["T2", "L1", "B1", "S1"], "FC2": ["T6"], "FC3": ["T1", "B1", "S1"]}[w["ref"]]
        for i in ids:
            c = next(c for c in CLOSET if c["id"] == i)
            c["wornCount"] += 1; c["lastWornAt"] = w["day"]

    # ------------------------------------------------------------- rotation (computed) vs displayed
    rot_layers, combos = rotation(CLOSET, STYLES)
    rot_core, _ = rotation(CLOSET, STYLES, layers=False)
    week_start = "2026-10-18"
    rot_before_week, _ = rotation([c for c in CLOSET if c["createdAt"][:10] < week_start], STYLES)
    per_item = {c["id"]: rot_layers - rotation([x for x in CLOSET if x is not c], STYLES)[0] for c in CLOSET}
    buy = {}
    for b in NEXT_BUY:
        if b["slot"] == "extra":
            buy[b["id"]] = {"layers": 0, "coreOnly": 0}
            continue
        nb = {"id": "NEW", "name": b["name"], "slot": b["slot"], "garment": b["garment"]}
        buy[b["id"]] = {"layers": rotation(CLOSET + [nb], STYLES)[0] - rot_layers,
                        "coreOnly": rotation(CLOSET + [nb], STYLES, layers=False)[0] - rot_core}
    rotation_expected = {
        "_doc": "Rotation computed by kitted_logic.rotation() on the seed closet (spec: 04-logic-and-demo-data.md section 9). "
                "The mockup's 37 / +3 / +9 are DISPLAY seed values; these are what the specified algorithm gives.",
        "styles": STYLES, "closetSize": len(CLOSET),
        "rotation_with_layers": rot_layers, "rotation_core_only": rot_core,
        "rotation_before_this_week": rot_before_week, "week_delta": rot_layers - rot_before_week,
        "fits_added_per_item": per_item, "next_buy_fits_added": buy,
        "first_10_combos": [[list(k) if k else None for k in c] for c in combos[:10]],
    }

    starter = [{"id": sid, "name": n, "budget": b, "mid": m, "ownedItemID": next((c["id"] for c in CLOSET if c["starterID"] == sid), None),
                "note": STARTER_NOTES.get(sid)} for sid, n, b, m in STARTER]

    facts = [
        {"id": "F1", "text": "Likes straight-leg pants", "key": "leg_preference", "value": "straight", "source": "fitCheck", "sourceLabel": "From a fit check", "createdAt": ts("2026-10-12", "07:46"), "isDeleted": False, "shownInMockup": True, "ref": "FC1"},
        {"id": "F2", "text": "Spends $30–60 an item", "key": "budget", "value": "30_60", "source": "told", "sourceLabel": "You told me", "createdAt": ts("2026-10-14", "18:31"), "isDeleted": False, "shownInMockup": True},
        {"id": "F3", "text": "Career fair on Oct 29", "key": "event", "value": "career_fair:2026-10-29", "source": "told", "sourceLabel": "You told me", "createdAt": ts("2026-10-20", "12:02"), "isDeleted": False, "shownInMockup": True},
        {"id": "F4", "text": "Boldness: a little", "key": "boldness", "value": "a_little", "source": "guess", "sourceLabel": "My guess · not asked yet", "createdAt": ts("2026-09-24", "19:11"), "isDeleted": False, "shownInMockup": True},
        {"id": "F5", "text": "Has class most weekdays", "key": "routine", "value": "class_weekdays", "source": "told", "sourceLabel": "You told me", "createdAt": ts("2026-09-24", "19:20"), "isDeleted": False, "shownInMockup": False},
        {"id": "F6", "text": "Owns a denim jacket (no photo yet)", "key": "owns", "value": "L3", "source": "told", "sourceLabel": "You told me", "createdAt": ts("2026-10-09", "21:05"), "isDeleted": False, "shownInMockup": False},
        {"id": "F7", "text": "Wears white sneakers most days", "key": "habit", "value": "S1", "source": "fitCheck", "sourceLabel": "From your fit checks", "createdAt": ts("2026-10-12", "07:46"), "isDeleted": False, "shownInMockup": False},
        {"id": "F8", "text": "Doesn't tuck his tees", "key": "tuck", "value": "never_tees", "source": "told", "sourceLabel": "You told me", "createdAt": ts("2026-10-13", "08:20"), "isDeleted": False, "shownInMockup": False},
        {"id": "F9", "text": "Mostly neutral colors", "key": "palette", "value": "neutrals", "source": "guess", "sourceLabel": "My guess", "createdAt": ts("2026-10-07", "08:05"), "isDeleted": False, "shownInMockup": False},
    ]

    profile = {"heightCm": 178, "heightDisplay": "5′10″", "build": "average", "fitPreference": "regular",
               "styles": STYLES, "styleLabels": ["Smart casual", "Workwear"], "birthYear": 2005, "boldness": None, "boldnessForScoring": "a_little",
               "budget": "30_60", "dressCode": None, "lastOccasion": "date", "consentVersion": 1, "consentAt": ts("2026-09-24", "19:05"),
               "onboardingStep": "done", "paywallShownAt": ts("2026-09-24", "19:12"), "ideaTime": "08:00", "ideasUnopened": 0, "units": "us",
               "plan": "free", "summaryLine": "5′10″ · Average · Regular fit"}

    thread = [
        {"id": "M01", "createdAt": ts("2026-10-20", "08:10"), "role": "user", "kind": "photo", "photoID": "s24", "caption": "Everyday", "fitCheckID": "FC2"},
        {"id": "M02", "createdAt": ts("2026-10-20", "08:11"), "role": "stylist", "kind": "card", "cardType": "fitCheck", "fitCheckID": "FC2"},
        {"id": "M03", "createdAt": ts("2026-10-22", "07:42"), "role": "user", "kind": "photo", "photoID": "p01b", "caption": "Date", "fitCheckID": "FC3"},
        {"id": "M04", "createdAt": ts("2026-10-22", "07:43"), "role": "stylist", "kind": "card", "cardType": "fitCheck", "fitCheckID": "FC3"},
        {"id": "M05", "createdAt": ts("2026-10-22", "07:49"), "role": "stylist", "kind": "text", "text": "Overshirt on? Send it. I'll only re-read the layer."},
        {"id": "M06", "createdAt": ts("2026-10-22", "07:50"), "role": "user", "kind": "photo", "photoID": "p01a", "caption": "Re-check", "fitCheckID": "FC3R"},
        {"id": "M07", "createdAt": ts("2026-10-22", "07:50"), "role": "stylist", "kind": "card", "cardType": "recheck", "fitCheckID": "FC3R"},
        {"id": "M08", "createdAt": ts("2026-10-22", "08:00"), "role": "stylist", "kind": "text", "text": "Morning. An easy one for class today:", "stamp": "Thursday 8:00 am"},
        {"id": "M09", "createdAt": ts("2026-10-22", "08:00"), "role": "stylist", "kind": "card", "cardType": "outfitIdea", "outfitID": "O_MORNING", "chips": ["Wear this", "Swap one"]},
        {"id": "M10", "createdAt": ts("2026-10-22", "08:04"), "role": "user", "kind": "text", "text": "What should I wear?"},
        {"id": "M11", "createdAt": ts("2026-10-22", "08:04"), "role": "stylist", "kind": "text", "text": "Where to?", "chips": ["Everyday", "Class/Work", "Date", "Interview", "Event"]},
        {"id": "M12", "createdAt": ts("2026-10-22", "08:04"), "role": "user", "kind": "text", "text": "Interview"},
        {"id": "M13", "createdAt": ts("2026-10-22", "08:04"), "role": "stylist", "kind": "text", "text": "Career fair on the 29th, right? Business casual, and you can build it from what you own."},
        {"id": "M14", "createdAt": ts("2026-10-22", "08:04"), "role": "stylist", "kind": "card", "cardType": "outfitIdea", "outfitID": "O_INTERVIEW", "chips": ["Wear this", "Swap one", "Save"]},
        {"id": "M15", "createdAt": ts("2026-10-22", "12:05"), "role": "user", "kind": "text", "text": "Can I wear the olive overshirt with the navy chinos?", "countsAsQuestion": True},
        {"id": "M16", "createdAt": ts("2026-10-22", "12:05"), "role": "stylist", "kind": "text", "text": "Yes. Olive and navy is an easy pair. Add the white tee and white sneakers, and wear the overshirt open."},
        {"id": "M17", "createdAt": ts("2026-10-22", "12:09"), "role": "user", "kind": "text", "text": "What belt goes with brown loafers?", "countsAsQuestion": True},
        {"id": "M18", "createdAt": ts("2026-10-22", "12:09"), "role": "stylist", "kind": "text", "text": "A brown leather belt, close to the loafers' shade. It's also the last piece on your Starter 12."},
    ]

    photos = [{"id": e["id"], "file": e["photo_file"], "sha256": e["photo_sha256"], "readingID": e["id"], "license": e["license"],
               "sourceURL": e["source_url"], "photographer": e["photographer"], "usedFor": e["used_for"], "latencySeconds": e["latency_s"]}
              for e in INDEX["photos"]]

    this_week = [d for d in days if "2026-10-18" <= d <= "2026-10-24"]
    full = {
        "now": ts("2026-10-22", "12:20"), "timeZone": "America/New_York", "weekStartsOn": "sunday",
        "profile": profile, "facts": facts, "closet": CLOSET, "closetGridOrder": GRID_ORDER,
        "closetStats": {"rotationDisplayed": 37, "rotationWeekDeltaDisplayed": 3, "starterOwned": 8, "starterTotal": 12,
                        "rotationComputed": rot_layers, "rotationCoreOnlyComputed": rot_core,
                        "note": "Display the *Displayed values in the demo; see rotation_expected.json and 04 section 9."},
        "nextBestBuy": NEXT_BUY, "starter12": starter, "fitChecks": fit_checks, "outfits": outfits, "wearLog": wear,
        "lookbookHeader": {"thisWeek": len(this_week), "total": len(days)},
        "lookbookRows": [{"fitCheckID": "FC3", "title": "Date · 8.0 → 9.0", "subtitle": "Thu, Oct 22 · Full check · 1 fix", "photoID": "p01a"},
                         {"fitCheckID": "FC2", "title": "Everyday · 6.5", "badge": "Partial", "subtitle": "Tue, Oct 20 · Shoes not included", "photoID": "s24"}],
        "calendar": {"month": "2026-10", "firstWeekday": "thursday", "today": 22, "logged": LOGGED_OCT, "highlightWeek": [18, 24]},
        "chatThread": thread,
        "usageToday": {"dayKey": "2026-10-22", "rollsOverAt": "04:00", "checks": 1, "checkLimit": 1, "recheckUsed": True,
                       "questions": 2, "questionLimit": 5, "items": 0},
        "lockScreen": [{"when": "now", "text": "Today: navy overshirt, grey tee, khaki chinos, white sneakers.", "kind": "dailyIdea"},
                       {"when": "Tue", "text": "Your fit check is ready. 2 quick fixes inside.", "kind": "checkReady"},
                       {"when": "Wed", "text": "Your trial ends Friday. Cancel before then and you won't be charged.", "kind": "trialEnding",
                        "note": "Only sent to trial users; shown for review. This profile is on the free plan."}],
        "heldPhotoScript": {"photoID": "s12", "occasion": "everyday", "at": ts("2026-10-22", "21:12"),
                            "card": {"title": "That's today's free check.",
                                     "body": "I'll save this photo and score it when you open Kitted after 4 am. Questions still work tonight: {questionsLeft} left.",
                                     "primary": "Save for tomorrow", "secondary": "Go unlimited · 14 days free"},
                            "expectedQuestionsLeft": 3, "scoresNextDay": score(R("s12"), "everyday", STYLES)["overall"]},
        "shareCard": {"fitCheckID": "FC3R", "photoID": "p01a", "occasion": "Date", "score": 9.0, "word": "Dialed in", "line": "8.0 → 9.0 after 1 fix", "mark": "scored by KITTED"},
    }

    first_run = {
        "now": ts("2026-10-22", "07:38"), "timeZone": "America/New_York", "weekStartsOn": "sunday",
        "profile": None, "facts": [], "closet": [], "fitChecks": [], "outfits": [], "wearLog": [], "chatThread": [],
        "usageToday": {"dayKey": "2026-10-22", "rollsOverAt": "04:00", "checks": 0, "checkLimit": 1, "recheckUsed": False, "questions": 0, "questionLimit": 5, "items": 0},
        "onboardingAnswers": {"looks": ["s22", "s10"], "styles": STYLES, "styleLine": "Smart casual with some workwear. Good mix.",
                              "heightDisplay": "5′10″", "heightCm": 178, "build": "average", "fitPreference": "regular", "birthYear": 2005,
                              "basicsBubble": "5′10″ · Average · Regular · 2005", "birthYearStartsBlank": True},
        "story": {
            "firstCheck": {"photoID": "p01b", "occasion": "date", "expectedScore": 8.0, "word": "Sharp", "verdict": "Clean base. The overshirt in your hand finishes it.",
                           "expectedFix": {"copy": "Wear the overshirt, open", "tag": "Free · it's already in your hand", "to": 9.0},
                           "nextLevel": "One standout color, like a rust tee. No score change today.",
                           "closetRow": {"text": "Added 4 to Closet", "tiles": ["tee:#F2F0EA", "chino:#B98E62", "sneaker:#F2F1EC", "overshirt:#D8CDB8"]},
                           "whatIRead": ["White tee", "Tan chinos · straight", "White leather sneakers", "Beige overshirt · in hand"]},
            "correction": {"garment": "Tan chinos · straight leg", "field": "leg_shape", "from": "straight", "to": "slim", "line": "Score stays 8.0", "closetPill": "Closet updated"},
            "recheck": {"photoID": "p01a", "expectedScore": 9.0, "delta": "+1.0", "doneFixGain": "+0.75", "summary": "Layered and clean. Dialed in. Nothing else changed."},
            "paywall": {"todayLine": "Today: 8.0 → 9.0", "sub": "One free fix. Nothing new to buy."},
            "afterStory": {"closetItems": 4, "lookbook": {"thisWeek": 1, "total": 1}, "starterPrefilled": ["s01", "s06", "s07", "s09"]},
        },
    }

    seed = {
        "_doc": "Kitted demo seed. Shape documented in handoff/04-logic-and-demo-data.md section 10. Generated by make_seed.py; do not hand-edit.",
        "schemaVersion": 1, "rubricVersion": "3.1.0",
        "scoreWords": [{"max": 5.5, "word": "Needs a fix"}, {"min": 6.0, "max": 6.5, "word": "Getting there"}, {"min": 7.0, "max": 7.5, "word": "Put together"},
                       {"min": 8.0, "max": 8.5, "word": "Sharp"}, {"min": 9.0, "word": "Dialed in"}],
        "occasionChips": [{"label": "Everyday", "key": "everyday"}, {"label": "Class/Work", "key": "class", "keyIfBusinessCasual": "work"},
                          {"label": "Date", "key": "date"}, {"label": "Interview", "key": "interview"}, {"label": "Event", "key": "event"},
                          {"label": "Gym", "key": "gym"}, {"label": "Home", "key": "home"}],
        "onboardingLooks": [{"photoID": "s05", "style": "minimalist"}, {"photoID": "s22", "style": "smart_casual"}, {"photoID": "s14", "style": "gorpcore"},
                            {"photoID": "s10", "style": "workwear"}, {"photoID": "s13", "style": "streetwear"}, {"photoID": "s09", "style": "old_money"}],
        "welcomeExample": {"photoID": "s15", "occasion": "everyday", "score": score(R("s15"), "everyday", [])["overall"], "word": "Sharp", "label": "Full check",
                           "note": "Scored with no styles (before onboarding); same 8.5 with the demo profile."},
        "photos": photos,
        "scenarios": {"firstRun": first_run, "full": full},
    }

    # ------------------------------------------------------------- invariants from the mockups
    sec = lambda s: sum(1 for c in CLOSET if c["section"] == s)
    assert len(CLOSET) == 16 and (sec("Tops"), sec("Bottoms"), sec("Shoes"), sec("Layers")) == (6, 3, 4, 3), "closet counts"
    assert sum(1 for s in starter if s["ownedItemID"]) == 8, "starter 8 of 12"
    assert full["lookbookHeader"] == {"thisWeek": 4, "total": 19}, full["lookbookHeader"]
    assert len(LOGGED_OCT) == 15 and dt.date(2026, 10, 1).weekday() == 3, "Oct 1 2026 is a Thursday"
    assert [c["id"] for c in CLOSET if not c["isPhotographed"]] == ["L3"]
    assert len(facts) == 9 and sum(f["shownInMockup"] for f in facts) == 4
    assert fc3["score"] == 8.0 and fc3["fixes"][0]["copy"] == "Wear the overshirt, open" and fc3["fixes"][0]["to"] == 9.0
    assert fc3r["score"] == 9.0 and fc2["score"] == 6.5 and fc2["isPartial"] and fc2["fixes"][0]["to"] == 7.0
    assert seed["welcomeExample"]["score"] == 8.5
    assert full["heldPhotoScript"]["expectedQuestionsLeft"] == 5 - full["usageToday"]["questions"]
    assert set(GRID_ORDER) == {c["id"] for c in CLOSET}
    for o in outfits:
        assert all(any(c["id"] == i for c in CLOSET) for i in o["itemIDs"])

    with open(os.path.join(HERE, "seed.json"), "w") as f:
        json.dump(seed, f, indent=1, ensure_ascii=False); f.write("\n")
    with open(os.path.join(HERE, "rotation_expected.json"), "w") as f:
        json.dump(rotation_expected, f, indent=1); f.write("\n")
    print("seed.json written:", len(CLOSET), "closet items,", len(fit_checks), "fit checks,", len(outfits), "outfits,", len(wear), "logged days,", len(thread), "messages")
    print("rotation (spec, with layers):", rot_layers, "| core only:", rot_core, "| before this week:", rot_before_week, "| displayed: 37")
    print("next-buy fits added (layers / core):", {k: (v["layers"], v["coreOnly"]) for k, v in buy.items()})
    print("fits added per item:", per_item)
    print("interview idea predicted:", iv["overall"], iv["rules_fired"], "| FC0", fc0["score"], "| FC1", fc1["score"], fc1["correction"])


if __name__ == "__main__":
    main()
