"""Writes fixtures/expected_scores.json: the exact rubric.py output for every demo reading x occasion,
plus the demo's fix / re-check / correction / partial-check expectations. These are the Swift demo tests.

Run (after make_readings.py and make_seed.py):
    /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_expected.py
Imports rubric.py from extraction-test/ (read-only). Asserts every number the mockups show.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, hashlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kitted_logic as K  # noqa: E402  (imports and wraps rubric.py)

KEMPT = K.KEMPT
RUBRIC = os.path.join(KEMPT, "extraction-test/rubric.py")
DEMO = [["smart_casual", 0.5], ["workwear", 0.5]]
CHIPS = ["everyday", "class", "work_casual", "work", "date", "interview", "event", "gym", "home"]
INDEX = json.load(open(os.path.join(HERE, "readings/INDEX.json")))
SEED = json.load(open(os.path.join(HERE, "seed.json")))
CLOSET = SEED["scenarios"]["full"]["closet"]


def load(rid):
    p = os.path.join(HERE, "readings", rid + ".json")
    if not os.path.exists(p):
        p = os.path.join(HERE, "readings/variants", rid + ".json")
    return json.load(open(p))


def result(reading, occasion, styles=DEMO, boldness="a_little"):
    s = K.score(reading, occasion, styles, boldness)
    s["word"] = K.score_word(s.get("overall"))
    s["partial_label"] = K.partial_label(s.get("not_rated"))
    return s


def main():
    cases, checks = [], []
    ids = [e["id"] for e in INDEX["photos"]] + [v["id"] for v in INDEX["variants"]]
    for rid in ids:
        for occ in CHIPS:
            cases.append({"id": f"{rid}@{occ}", "reading": rid, "occasion": occ, "styles": DEMO, "boldness": "a_little",
                          "expected": result(load(rid), occ)})
    # the welcome example is scored before any style is picked
    cases.append({"id": "s15@everyday#no_styles", "reading": "s15", "occasion": "everyday", "styles": [], "boldness": "a_little",
                  "expected": result(load("s15"), "everyday", [])})
    by = {c["id"]: c["expected"] for c in cases}

    def must(cid, key, want):
        got = by[cid][key]
        ok = got == want
        checks.append({"case": cid, "field": key, "want": want, "got": got, "ok": ok})
        assert ok, f"{cid}.{key}: want {want}, got {got}"

    # ---- every number the mockups draw
    must("p01b@date", "overall", 8.0); must("p01b@date", "rules_fired", []); must("p01b@date", "credits", ["K2_elevated_piece", "K4_shoes_complement"])
    must("p01b@date", "partial", False); must("p01b@date", "word", "Sharp")
    must("p01a@date", "overall", 9.0); must("p01a@date", "raw_score", 8.75); must("p01a@date", "word", "Dialed in")
    must("p01b_chinos_slim@date", "overall", 8.0)
    must("p01b_chinos_slim@date", "rules_fired", [])   # rubric v4: slim is inside the general band (v3.1: P1 via the demo picks)
    # rubric v4: the mockup's 8.5 is now 8.0 (wide trousers outside the general band; picks no longer widen it)
    must("s15@everyday", "overall", 8.0); must("s15@everyday", "partial", False); must("s15@everyday#no_styles", "overall", 8.0)
    must("s15@everyday", "word", "Sharp")
    must("s24@everyday", "overall", 6.5); must("s24@everyday", "rules_fired", ["O4_loungewear_out"]); must("s24@everyday", "not_rated", ["shoes"])
    must("s24@everyday", "word", "Getting there"); must("s24@everyday", "partial_label", "Partial check: shoes not included")
    must("s24_jeans@everyday", "overall", 7.0); must("s24_jeans_generic@everyday", "overall", 7.0); must("s24_chino_shorts_generic@everyday", "overall", 7.0)
    must("s24@gym", "overall", 7.0); must("s24@home", "overall", 7.0)

    # ---- fix engine (kitted_logic.suggest_fixes) for the demo cards
    fixes = []

    def fx(cid, rid, occ, first_check, closet, note):
        out = K.suggest_fixes(load(rid), occ, DEMO, closet=closet, first_check=first_check)
        fixes.append({"id": cid, "reading": rid, "occasion": occ, "firstCheck": first_check, "closet": "full seed closet" if closet else "empty", "note": note, "expected": out})
        return out

    a = fx("fix:p01b@date#firstRun", "p01b", "date", True, [], "screen 7: first check, adjust tier only")
    assert [(f["copy"], f["tag"], f["to"]) for f in a["fixes"]] == [("Wear the overshirt, open", "Free · it's already in your hand", 9.0)], a
    # rubric v4: p01b reads as minimal, so the next-level idea is "vary texture or shade" (mockup: "One standout color")
    assert a["next_level"] == ["Mix textures or shades, like a knit or suede. No score change today."], a["next_level"]
    b = fx("fix:p01b@date#full", "p01b", "date", False, CLOSET, "same photo later: adjust (held overshirt) beats 'Add your navy overshirt'")
    assert [f["copy"] for f in b["fixes"]] == ["Wear the overshirt, open"]
    c = fx("fix:s24@everyday#full", "s24", "everyday", False, CLOSET, "screen 11: one closet fix, -> 7.0")
    assert [(f["copy"], f["tag"], f["to"]) for f in c["fixes"]] == [("Swap to jeans or chino shorts", "Free · from your closet", 7.0)], c
    d = fx("fix:s24@gym#full", "s24", "gym", False, CLOSET, "at the gym nothing is wrong and credit fixes are skipped")
    assert d["fixes"] == [] and d["dialed_in"]
    fx("fix:s15@everyday#full", "s15", "everyday", False, CLOSET, "wide trousers -> his straight khaki chinos")
    fx("fix:s15@everyday#empty", "s15", "everyday", False, [], "no closet match -> 'Free if you own one'")
    fx("fix:s12@everyday#full", "s12", "everyday", False, CLOSET, "the held photo, scored the next morning")
    for rid in ("s25", "s05", "s09", "s10", "s13", "s14", "s22"):
        fx(f"fix:{rid}@everyday#full", rid, "everyday", False, CLOSET, "onboarding / library photo")

    # ---- anchored re-check
    rechecks = []
    first = load("p01b")
    targets = sorted(K.fix_targets(a["fixes"]))

    def rc(cid, new_id, note):
        merged, notes = K.recheck_merge(first, load(new_id), set(targets), "date", DEMO)
        s = result(merged, "date")
        rechecks.append({"id": cid, "first": "p01b", "new": new_id, "targets": targets, "occasion": "date", "note": note,
                         "expected": {"merged_reading": merged, "notes": notes, "overall": s["overall"], "raw_unrounded": s["raw_unrounded"],
                                      "rules_fired": s["rules_fired"], "credits": s["credits"],
                                      "delta_display": s["overall"] - by["p01b@date"]["overall"],
                                      "delta_raw": round(s["raw_unrounded"] - by["p01b@date"]["raw_unrounded"], 6)}})
        return s

    s1 = rc("recheck:p01b->p01a", "p01a", "screen 10: 8.0 -> 9.0 (+1.0 shown, +0.75 raw), 'Nothing else changed'")
    assert s1["overall"] == 9.0 and abs(s1["raw_unrounded"] - 8.75) < 1e-9
    rc("recheck:p01b->p01a_real", "p01a_real", "the REAL model reading of the after photo: anchoring keeps tee/chinos/shoes from the first reading "
       "(the real one says chinos slim and shoes hidden), but the new overshirt is read 'wrinkled', so F7 fires: 8.5")
    s3 = rc("recheck:p01b->p01b(missed)", "p01b", "model missed the change (same reading back): stays 8.0, so offer 'Didn't catch the change? Tell me'")
    assert s3["overall"] == 8.0
    told = K.apply_fix(first, a["fixes"][0])
    st = result(told, "date")
    rechecks.append({"id": "recheck:tell-me", "first": "p01b", "note": "'Didn't catch the change? Tell me' applies the fix edit to the FIRST reading (source userConfirmed)",
                     "expected": {"merged_reading": told, "overall": st["overall"], "raw_unrounded": st["raw_unrounded"], "rules_fired": st["rules_fired"]}})
    assert st["overall"] == 9.0

    # ---- Not quite right? correction (screen 9)
    corr_reading = K.apply_correction(first, 1, "leg_shape", "slim")
    cs = result(corr_reading, "date")
    corrections = [{"id": "correct:p01b chinos straight->slim", "reading": "p01b", "garmentIndex": 1, "field": "leg_shape", "from": "straight", "to": "slim",
                    "occasion": "date", "expected": {"overall": cs["overall"], "raw_unrounded": cs["raw_unrounded"], "rules_fired": cs["rules_fired"],
                                                     "line": K.correction_line(by["p01b@date"]["overall"], cs["overall"]), "closetPill": "Closet updated"}}]
    assert corrections[0]["expected"]["line"] == "Score stays 8.0"

    # ---- partial checks (screen 11)
    s24 = load("s24")
    white = next(c for c in CLOSET if c["id"] == "S1")
    picked = K.pick_shoes_from_closet(s24, white)
    ps = result(picked, "everyday")
    snap = {"scene": {"framing": "upper_only", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good", "clothed": "fully"},
            "garments": [K.G("footwear", "retro_runner", "grey")]}
    snapped = K.merge_shoe_snap(s24, snap)
    ss = result(snapped, "everyday")
    partials = [
        {"id": "partial:s24 pick White sneakers from closet", "label_after": "Full check (shoes from your closet)", "expected": {"reading": picked, **{k: ps[k] for k in ("overall", "raw_unrounded", "rules_fired", "credits", "not_rated", "partial")}}},
        {"id": "partial:s24 shoe snap grey runners", "snap_reading": snap, "label_after": "Full check ✓", "expected": {"reading": snapped, **{k: ss[k] for k in ("overall", "raw_unrounded", "rules_fired", "credits", "not_rated", "partial")}}},
    ]

    rub_sha = hashlib.sha256(open(RUBRIC, "rb").read()).hexdigest()
    out = {"_doc": "Expected rubric.py v4.0 output for the demo readings (demo profile unless noted). Generated by make_expected.py; "
                   "@kitted/core must match: overall, subscores, rules_fired (order), credits (order), not_rated, advice exactly; "
                   "raw_unrounded / credit_unrounded / mistakes_unrounded exactly as Double (same operation order) or within 1e-9.",
           "rubric_file": RUBRIC, "rubric_sha256": rub_sha, "profile": {"styles": DEMO, "boldness": "a_little"},
           "occasions": CHIPS, "cases": cases, "mockup_checks": checks, "fixes": fixes, "rechecks": rechecks,
           "corrections": corrections, "partials": partials}
    with open(os.path.join(HERE, "expected_scores.json"), "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False); f.write("\n")
    print(f"expected_scores.json: {len(cases)} score cases, {len(checks)} mockup checks passed, {len(fixes)} fix cases, "
          f"{len(rechecks)} re-checks, {len(corrections)} corrections, {len(partials)} partial cases")
    for r in rechecks:
        print("  ", r["id"], "->", r["expected"]["overall"], r["expected"].get("notes"))
    for p in partials:
        print("  ", p["id"], "->", p["expected"]["overall"], p["expected"]["rules_fired"], p["expected"]["credits"])
    for x in fixes:
        print("  ", x["id"], x["expected"]["base_overall"], [(f["copy"], f["tag"], f["to"]) for f in x["expected"]["fixes"]], x["expected"]["next_level"])


if __name__ == "__main__":
    main()
