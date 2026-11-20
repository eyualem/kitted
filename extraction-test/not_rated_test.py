#!/usr/bin/env python3
"""T61 · The scoring's "not rated" (specs/not-rated.md NR1, NR2; tasks/T61/TESTING.md): the Python engines' tests.

  /usr/bin/python3 not_rated_test.py     -> prints PASS / FAIL <ID> · <name> for each test; exits 1 on any failure

Both engines are held to the same rules: rubric.py `score` and parts_proto.py `score_parts` (the app's engine, v15 and
v16; they share rubric._prepare). Readings are hand-built from one plain base outfit (white tee, dark straight jeans,
white leather sneakers, fully clothed, full body, shoes visible, every piece clear), changed one field at a time.

Rule 6: made-up readings with no person in them (no age, no picks; boldness "a little"; occasion everyday).
No network, no AI call, $0. The parity fixtures are NOT written here: the generators make them (NR1.7, core side).
"""
import json
import sys
import traceback
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
sys.path.insert(0, str(K / "handoff" / "fixtures"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import parts_fixes as PF  # noqa: E402
from rules_conformance import G, top, outer, bottom, shoe, acc, Rd, mod  # noqa: E402

ENGINES = {
    "rubric.py": lambda r: R.score(r),
    "parts v15": lambda r: P.score_parts(r, engine="v15"),
    "parts v16": lambda r: P.score_parts(r, engine="v16"),
}
# today's overall for the base outfit, pinned from the engines before T61 (NR1.3: "today's score")
BASE_OVERALL = {"rubric.py": 7.5, "parts v15": 7.0, "parts v16": 7.0}

TEE = top("tee", "white")
JEANS = bottom("jeans", "denim_dark", "straight")
SNEAKER = shoe("white_leather_sneaker", "white")
BASE = Rd(TEE, JEANS, SNEAKER)


def rd(*gs, **scene):
    return Rd(*gs, **scene)


def with_scene(r, **kw):
    out = json.loads(json.dumps(r))
    out["scene"].update(kw)
    return out


def swap(r, cat, new):
    out = json.loads(json.dumps(r))
    out["garments"] = [new if g["category"] == cat else g for g in out["garments"]]
    return out


def add(r, g):
    out = json.loads(json.dumps(r))
    out["garments"].append(g)
    return out


DRESS = G("top", "dress", "black", 3, tucked="na", length="mid_fly")
SKIRT = G("bottom", "skirt", "black", 3, "straight", "na")
KURTA = G("traditional", "other", "white")
HEELS = G("footwear", "heels", "black")
TRAD_SHOE = G("footwear", "traditional_shoe", "brown")
TRAD_CAT_SHOE = G("traditional", "traditional_shoe", "brown")
UNSURE = {"certainty": "unsure"}

TESTS = []


def test(name):
    def deco(fn):
        TESTS.append((name, fn))
        return fn
    return deco


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def eq(got, want, what):
    if got != want:
        raise AssertionError(f"{what}: got {got!r}, want {want!r}")


def blocked(reading, reason, slot=None):
    for name, run in ENGINES.items():
        r = run(reading)
        eq(r["overall"], None, f"{name} overall")
        eq(r.get("reason"), reason, f"{name} reason")
        eq(r.get("unreadable_slot"), slot, f"{name} unreadable_slot")
        if slot is None:
            check("unreadable_slot" not in r, f"{name} carries an unreadable_slot key without the reason unreadable")
        if name == "rubric.py":
            eq(r.get("partial"), False, f"{name} partial")


# ===== NR1.1 =========================================================================================================
@test("NR1.1 · a dress in the base outfit gives no number and the reason womenswear")
def _():
    blocked(rd(DRESS, JEANS, SNEAKER), "womenswear")
    blocked(rd(DRESS, SNEAKER), "womenswear")


@test("NR1.1 · a skirt in the base outfit gives no number and the reason womenswear")
def _():
    blocked(rd(TEE, SKIRT, SNEAKER), "womenswear")


@test("NR1.1 · the base outfit itself still gets today's number (the must-not-block side)")
def _():
    for name, run in ENGINES.items():
        r = run(BASE)
        eq(r["overall"], BASE_OVERALL[name], f"{name} base overall")
        check(r.get("reason") in (None,), f"{name} base has a reason {r.get('reason')!r}")


# ===== NR1.2 =========================================================================================================
@test("NR1.2 · a traditional piece (kurta) with jeans and sneakers is not rated: reason traditional")
def _():
    blocked(rd(KURTA, JEANS, SNEAKER), "traditional")
    blocked(rd(KURTA), "traditional")


@test("NR1.2 · the old traditional garment (not rated) token is never produced")
def _():
    for name, run in ENGINES.items():
        r = run(rd(KURTA, JEANS, SNEAKER))
        check("traditional garment (not rated)" not in (r.get("not_rated") or []), f"{name} still emits the old token")


@test("NR1.2 · an unsure traditional piece blocks too (rules 2-3 are not unsure-filtered)")
def _():
    blocked(rd(mod(KURTA, **UNSURE), JEANS, SNEAKER), "traditional")
    blocked(rd(mod(DRESS, **UNSURE), JEANS, SNEAKER), "womenswear")


# ===== NR1.3 =========================================================================================================
@test("NR1.3 · scene.costume_or_uniform true gives costume_or_uniform")
def _():
    blocked(with_scene(BASE, costume_or_uniform=True), "costume_or_uniform")


@test("NR1.3 · costume_or_uniform false, or the field missing, gives today's score")
def _():
    for name, run in ENGINES.items():
        eq(run(with_scene(BASE, costume_or_uniform=False))["overall"], BASE_OVERALL[name], f"{name} false")
        eq(run(BASE)["overall"], BASE_OVERALL[name], f"{name} missing")


# ===== NR1.4 =========================================================================================================
@test("NR1.4 · an unsure top is unreadable with slot top")
def _():
    blocked(rd(mod(TEE, **UNSURE), JEANS, SNEAKER), "unreadable", "top")


@test("NR1.4 · an unsure added jacket is unreadable with slot jacket")
def _():
    blocked(add(BASE, mod(outer("bomber", "black"), **UNSURE)), "unreadable", "jacket")


@test("NR1.4 · unsure jeans are unreadable with slot pants")
def _():
    blocked(rd(TEE, mod(JEANS, **UNSURE), SNEAKER), "unreadable", "pants")


@test("NR1.4 · the first unsure main piece in reading order names the slot")
def _():
    blocked(rd(TEE, mod(JEANS, **UNSURE), mod(outer("bomber", "black"), **UNSURE), SNEAKER), "unreadable", "pants")
    blocked(rd(TEE, mod(outer("bomber", "black"), **UNSURE), mod(JEANS, **UNSURE), SNEAKER), "unreadable", "jacket")


@test("NR1.4 · a top-only photo with unsure jeans is NOT blocked (the jeans are filtered out first)")
def _():
    r = rd(TEE, mod(JEANS, **UNSURE), framing="upper_only")
    for name, run in ENGINES.items():
        res = run(r)
        check(res["overall"] is not None, f"{name} blocked a top-only photo: {res.get('reason')!r}")
        eq(res.get("reason"), None, f"{name} reason")
        check("bottom half" in (res.get("not_rated") or []), f"{name} lost the bottom half note")


# ===== NR1.5 =========================================================================================================
@test("NR1.5 · order: costume flag plus a skirt gives costume_or_uniform")
def _():
    blocked(with_scene(rd(TEE, SKIRT, SNEAKER), costume_or_uniform=True), "costume_or_uniform")


@test("NR1.5 · order: a traditional piece plus a dress gives traditional")
def _():
    blocked(rd(KURTA, DRESS, SNEAKER), "traditional")


@test("NR1.5 · order: a dress plus an unsure jacket gives womenswear")
def _():
    blocked(add(rd(DRESS, SNEAKER), mod(outer("bomber", "black"), **UNSURE)), "womenswear")


@test("NR1.5 · order: a dress marked unsure gives womenswear, not unreadable")
def _():
    blocked(rd(mod(DRESS, **UNSURE), JEANS, SNEAKER), "womenswear")


# ===== NR1.6 =========================================================================================================
@test("NR1.6 · an unsure accessory (a watch) changes nothing")
def _():
    for name, run in ENGINES.items():
        a = run(BASE)
        b = run(add(BASE, mod(acc("watch"), **UNSURE)))
        eq(b, a, f"{name} result with an unsure watch")


@test("NR1.6 · shoes_visible false: the shoes drop out, notRated is shoes, the score is today's")
def _():
    nos = with_scene(BASE, shoes_visible=False)
    for name, run in ENGINES.items():
        r = run(nos)
        check(r["overall"] is not None, f"{name} blocked a no-shoes photo")
        eq(r.get("not_rated"), ["shoes"], f"{name} not_rated")
        eq(r["overall"], 7.0, f"{name} overall")


@test("NR1.6 · framing upper_only: bottom half and shoes are not rated, today's parts")
def _():
    up = with_scene(BASE, framing="upper_only")
    for name, run in ENGINES.items():
        r = run(up)
        check(r["overall"] is not None, f"{name} blocked a top-only photo")
        eq(r.get("not_rated"), ["bottom half"], f"{name} not_rated")


@test("NR1.6 · not_fully_clothed and nothing_readable are as today (and win over the new reasons)")
def _():
    for name, run in ENGINES.items():
        r = run(with_scene(rd(DRESS, SNEAKER), clothed="partly"))
        eq(r["overall"], None, f"{name} partly overall")
        eq(r.get("reason"), "not_fully_clothed", f"{name} partly reason")
        r = run(rd(mod(acc("watch"), **UNSURE)))
        eq(r.get("reason"), "nothing_readable", f"{name} nothing_readable")


# ===== NR2 ===========================================================================================================
def _heel_base():
    # an outfit that has fixes to offer, so "the fixes equal" is not trivially empty
    return rd(top("tee", "white", 5), bottom("jeans", "denim_dark", "straight", "full_break"), SNEAKER)


def _equal_but_not_rated(shoe_piece, reading=None):
    reading = reading or _heel_base()
    target = swap(reading, "footwear", shoe_piece)
    hidden = with_scene(reading, shoes_visible=False)
    for name, run in ENGINES.items():
        got, want = run(target), run(hidden)
        check(got["overall"] is not None, f"{name} blocked the outfit")
        eq(got.get("not_rated"), ["shoes not rated"], f"{name} not_rated")
        eq(want.get("not_rated"), ["shoes"], f"{name} the shoes-out twin")
        got2 = {k: v for k, v in got.items() if k != "not_rated"}
        want2 = {k: v for k, v in want.items() if k != "not_rated"}
        eq(got2, want2, f"{name} everything but not_rated")
    for eng in ("v15", "v16"):
        fg = PF.suggest_parts_fixes(target, "everyday", [], engine=eng)
        fw = PF.suggest_parts_fixes(hidden, "everyday", [], engine=eng)
        check(len(fw["fixes"]) > 0, f"fixes {eng}: the test outfit offers no fix, so the comparison proves nothing")
        eq(fg, fw, f"fixes {eng}")


@test("NR2.1 · heels score exactly like shoes out of the photo; notRated is shoes not rated")
def _():
    _equal_but_not_rated(HEELS)


@test("NR2.1 · the heels outfit is not marked with plain shoes (no shoe snap offered)")
def _():
    for name, run in ENGINES.items():
        r = run(swap(_heel_base(), "footwear", HEELS))
        check("shoes" not in (r.get("not_rated") or []), f"{name} offers a shoe snap")
        eq(r.get("partial"), True, f"{name} partial")


@test("NR2.2 · footwear traditional_shoe is dropped the same way")
def _():
    _equal_but_not_rated(TRAD_SHOE)


@test("NR2.2 · category traditional with subcategory traditional_shoe is dropped, not a traditional block")
def _():
    _equal_but_not_rated(TRAD_CAT_SHOE)


@test("NR2.2 · a traditional_shoe never triggers the traditional reason")
def _():
    for name, run in ENGINES.items():
        r = run(swap(BASE, "footwear", TRAD_CAT_SHOE))
        eq(r.get("reason"), None, f"{name} reason")


@test("NR2.3 · unsure shoes give today's result exactly")
def _():
    for name, run in ENGINES.items():
        r = run(swap(BASE, "footwear", mod(SNEAKER, **UNSURE)))
        gone = run(rd(TEE, JEANS))
        eq(r, gone, f"{name} unsure shoes vs no shoes piece")
        check("shoes not rated" not in (r.get("not_rated") or []), f"{name} unsure shoes got the new token")


def main():
    fails = 0
    for name, fn in TESTS:
        try:
            fn()
            print(f"PASS {name}")
        except Exception as e:
            fails += 1
            msg = "".join(traceback.format_exception_only(type(e), e)).strip()
            print(f"FAIL {name}\n     {msg[:600]}")
    print(f"{len(TESTS) - fails}/{len(TESTS)} pass")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
