#!/usr/bin/env python3
"""T94 · Tailored, the 8th look (specs/tailored.md, tasks/T94/TESTING.md): the Python engine's tests.

  /usr/bin/python3 tailored_test.py          -> prints PASS / FAIL <ID> · <name> for each test; exits 1 on any failure;
                                                when every test passes, writes ../handoff/fixtures/tailored.json (the
                                                readings and Python's results, read by kitted-core's tailored.test.ts)
  /usr/bin/python3 tailored_test.py --pin    -> (test writer, at the lock only) writes the base engine's numbers to
                                                ../handoff/fixtures/tailored_base_v15.json; refuses on a Tailored engine

What they hold the build to:
  TL1  what counts as Tailored (a tailored jacket and dress trousers, nothing on the never-list, no roominess 5);
  TL2  the name on the card (Tailored wins over smart casual and prep before his picks; "reads as tailored" where the
       card said "a matching suit"; a suit that isn't Tailored keeps "a matching suit", the founder's option 1);
  TL3  every number stays what engine v15 gave at the base commit: tailored_base_v15.json pins, for every reading here,
       the overall, raw score, bonus, problems, floor, condition, occasion and every part's score, display, reasons
       (check and points) and tips (check). The lines are not pinned: only the look's name in them may change;
  TL5  with Tailored among his picks, a fix that clears a tailoring fault leads within its class; nothing else moves.

Rule 7: these are made-up readings with no person in them (no age, no picks unless a test says so; boldness "a
little"; occasion everyday). The demo reading s09 is a stock photo, "profile unknown", run with no picks.
No network, no AI call, $0.
"""
import json
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
sys.path.insert(0, str(K / "handoff" / "fixtures"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import parts_fixes as PF  # noqa: E402
from rules_conformance import top, outer, bottom, shoe, Rd, mod  # noqa: E402

PINS = K / "handoff" / "fixtures" / "tailored_base_v15.json"
OUT = K / "handoff" / "fixtures" / "tailored.json"
SEVEN = ["vintage_sport", "outdoor", "workwear", "streetwear", "classic_prep", "minimalist", "smart_casual"]
LOOK_ORDER = ["vintage_sport", "outdoor", "workwear", "streetwear", "tailored", "classic_prep", "minimalist", "smart_casual"]

# --------------------------------------------------------------------------------------------- the readings
SHIRT = top("dress_shirt", "white", tucked="full")
GREY_TROUSERS = bottom("trousers", "grey", "straight", "slight_break")
LOAFER = shoe("loafer", "brown")


def scene(r, **kw):
    out = json.loads(json.dumps(r))
    out["scene"].update(kw)
    return out


# The base outfits (TESTING.md "The base outfits").
SUIT = Rd(SHIRT, outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("derby", "black"))
def BLZ_WITH(s): return Rd(SHIRT, outer("blazer", "navy"), GREY_TROUSERS, s)  # noqa: E302,E704
BLZ = BLZ_WITH(LOAFER)
PREP = Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), bottom("chinos", "khaki_beige", "straight"), LOAFER)
KNIT = Rd(top("sweater", "grey"), bottom("trousers", "grey", "straight"), LOAFER)
DJ = Rd(top("tee", "white"), outer("blazer", "navy"), bottom("jeans", "denim_dark", "straight"), LOAFER)

SHOES = {  # TL1.3: the shoes swapped into BLZ
    "white_leather_sneaker": shoe("white_leather_sneaker", "white"), "low_profile_sneaker": shoe("low_profile_sneaker", "black"),
    "chunky_sneaker": shoe("chunky_sneaker", "white"), "performance_runner": shoe("performance_runner", "grey"),
    "slides_sandals": shoe("slides_sandals", "black"), "work_boot": shoe("work_boot", "brown"),
    "basketball_sneaker": shoe("basketball_sneaker", "white"), "canvas_sneaker": shoe("canvas_sneaker", "black"),
    "retro_runner": shoe("retro_runner", "grey"),
}
NEVER_BOTTOMS = {  # TL1.6: in place of DJ's jeans
    "chinos": bottom("chinos", "khaki_beige", "straight"), "cargos": bottom("cargos", "olive", "straight"),
    "sweatpants": bottom("sweatpants", "grey", "straight"), "joggers": bottom("joggers", "black", "slim", "cuffed"),
    "shorts": bottom("shorts", "khaki_beige", "straight", "na"), "athletic_shorts": bottom("athletic_shorts", "black", "straight", "na"),
}
NEVER_TOPS = {  # TL1.6: under BLZ's blazer, in place of the dress shirt
    "hoodie": top("hoodie", "grey"), "sweatshirt": top("sweatshirt", "grey"), "graphic_tee": top("graphic_tee", "black"),
    "tank_top": top("tank_top", "white"), "jersey": top("jersey", "red"), "fleece": top("fleece", "grey"),
}
PICKS_TL21 = {"none": [], "sc": [["smart_casual", 1]], "prep": [["classic_prep", 1]],
              "prep+sc": [["classic_prep", 0.5], ["smart_casual", 0.5]], "tailored": [["tailored", 1]]}
PINK = Rd(top("oxford_shirt", "pink"), outer("blazer", "navy"), GREY_TROUSERS, LOAFER)
MIN_TIE = Rd(top("tee", "white"), outer("unstructured_blazer", "navy"), bottom("trousers", "black", "straight"), shoe("loafer", "black"))
SLEEVES = Rd(SHIRT, outer("blazer", "navy", sleeve_end="covers_hand"), bottom("trousers", "grey", "straight", "no_break"),
             shoe("canvas_sneaker", "red"))
SLEEVES_WRINKLED = Rd(top("dress_shirt", "white", tucked="full", condition="wrinkled"), outer("blazer", "navy", sleeve_end="covers_hand"),
                      GREY_TROUSERS, LOAFER)
KNIT_SLEEVES = Rd(top("sweater", "grey", sleeve_end="covers_hand"), bottom("trousers", "grey", "straight"), LOAFER)
COAT_SLEEVES = Rd(top("sweater", "grey"), outer("overcoat", "tan_camel", sleeve_end="covers_hand"), bottom("trousers", "grey", "straight"),
                  shoe("canvas_sneaker", "red"))
S09 = json.loads((K / "handoff" / "fixtures" / "readings" / "s09.json").read_text())

CASES = {}   # id -> {"crit", "reading", "picks" ([name, weight] pairs), "occasion"}


def add(cid, crit, reading, picks=(), occasion="everyday"):
    assert cid not in CASES, cid
    CASES[cid] = {"crit": crit, "reading": reading, "picks": [list(p) for p in picks], "occasion": occasion}


add("suit", "TL1.1", SUIT)
add("suit-no-shoes", "TL1.1", scene(SUIT, shoes_visible=False))
add("suit-upper-only", "TL1.1", scene(SUIT, framing="upper_only"))
add("blz", "TL1.2", BLZ)
add("suit-jacket-plain-trousers", "TL1.2", Rd(SHIRT, outer("suit_jacket", "navy"), GREY_TROUSERS, LOAFER))
for k, s in SHOES.items():
    add(f"blz+{k}", "TL1.3", BLZ_WITH(s))
for i, what in enumerate(("shirt", "blazer", "trousers", "loafers")):
    gs = [dict(g) for g in BLZ["garments"]]
    gs[i]["volume"] = 5
    add(f"blz-volume5-{what}", "TL1.3", {"scene": dict(BLZ["scene"]), "garments": gs})
for k, p in {"none": [], "tailored": [["tailored", 1.0]], "prep": [["classic_prep", 1]], "sc": [["smart_casual", 1]],
             "tailored+sc": [["tailored", 0.5], ["smart_casual", 0.5]]}.items():
    add(f"prep@{k}", "TL1.4", PREP, p)
add("knit", "TL1.5", KNIT)
add("knit+overcoat", "TL1.5", Rd(top("sweater", "grey"), outer("overcoat", "tan_camel"), bottom("trousers", "grey", "straight"), LOAFER))
add("dj", "TL1.6", DJ)
for k, b in NEVER_BOTTOMS.items():
    add(f"dj-{k}", "TL1.6", Rd(top("tee", "white"), outer("blazer", "navy"), b, LOAFER))
for k, t in NEVER_TOPS.items():
    add(f"blz-under-{k}", "TL1.6", Rd(t, outer("blazer", "navy"), GREY_TROUSERS, LOAFER))
for k, p in PICKS_TL21.items():
    add(f"blz@{k}", "TL2.1", BLZ, p)
    add(f"pink-oxford@{k}", "TL2.1", PINK, p)
add("min-tie@none", "TL2.1", MIN_TIE)
add("min-tie@minimalist", "TL2.1", MIN_TIE, [["minimalist", 1]])
add("s09", "TL2.2", S09)
add("suit+chunky", "TL2.2", Rd(SHIRT, outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"),
                               shoe("chunky_sneaker", "white")))
add("suit-over-graphic-tee", "TL2.2", Rd(top("graphic_tee", "black"), outer("suit_jacket", "charcoal"),
                                         bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("derby", "black")))
for k, p in {"none": [], "tailored": [["tailored", 1]], "streetwear+tailored": [["streetwear", 0.5], ["tailored", 0.5]],
             "sc": [["smart_casual", 1]]}.items():
    add(f"sleeves@{k}", "TL5.1", SLEEVES, p)
    add(f"sleeves-wrinkled@{k}", "TL5.1", SLEEVES_WRINKLED, p)
    add(f"knit-sleeves@{k}", "TL5.1", KNIT_SLEEVES, p)
    add(f"coat-sleeves@{k}", "TL5.1", COAT_SLEEVES, p)


# --------------------------------------------------------------------------------------------- running a case
def picks_of(c):
    return {k: w for k, w in c["picks"]}


def parts(cid):
    c = CASES[cid]
    return P.score_parts(c["reading"], c["occasion"], picks_of(c))


def scored(cid):
    return R.scored_garments(CASES[cid]["reading"])


def looks(cid, picks=None):
    return R.detect_looks(scored(cid), picks_of(CASES[cid]) if picks is None else picks)


def fixes(cid):
    c = CASES[cid]
    return PF.suggest_parts_fixes(c["reading"], c["occasion"], c["picks"])


def numbers(sp):
    """Every number of a parts result (never a line, never a look name)."""
    if sp.get("overall") is None:
        return {"overall": None, "reason": sp.get("reason")}
    return {
        "overall": sp["overall"], "raw_score": sp["raw_score"], "average": sp["average"], "earned_bonus": sp["earned_bonus"],
        "piled_penalty": sp["piled_penalty"], "floored": sp["floored"],
        "condition": sp["condition"]["deduction"], "occasion": [sp["occasion"]["deduction"], sp["occasion"]["ceiling"]],
        "parts": {k: {"score": v["score"], "display": v["display"], "reasons": [[x["check"], x["points"]] for x in v["reasons"]],
                      "tips": [x["check"] for x in v.get("tips", [])]} for k, v in sp["parts"].items()},
    }


def fix_numbers(f):
    return {"base_overall": f["base_overall"], "fixes": sorted([x["id"], x["to"], x["gain"], x["raw_gain"]] for x in f["fixes"])}


def lines(sp, check=None):
    return [x["line"] for p in (sp.get("parts") or {}).values() for x in p.get("reasons", []) + p.get("tips", [])
            if check is None or x["check"] == check]


def reasons(sp, part):
    return [(x["check"], x["points"], x["line"]) for x in sp["parts"][part]["reasons"]]


def h1(sp):
    return [(x["check"], x["points"], x["line"]) for x in sp["parts"]["cohesion"]["reasons"] if x["check"] == "H1_reads_as_style"]


# --------------------------------------------------------------------------------------------- the pins (TL3)
def load_pins():
    return json.loads(PINS.read_text())


def pinned(cid):
    return load_pins()["cases"][cid]


def same_numbers(cid, sp=None):
    """TL3: every number of the case equals base v15's (pinned at the lock)."""
    got = numbers(sp if sp is not None else parts(cid))
    want = pinned(cid)["numbers"]
    assert got == want, f"{cid}: a number moved\n  base v15: {json.dumps(want)}\n  now:      {json.dumps(got)}"


def write_pins():
    if hasattr(R, "detect_looks") or "tailored" in getattr(R, "STYLES", {}):
        sys.exit("--pin runs on the base engine only (this rubric.py already knows Tailored); the pins are locked.")
    out = {"about": "T94 (tasks/T94/TESTING.md, TL3): engine v15's numbers, labels and fixes for every reading in "
                    "extraction-test/tailored_test.py, recorded by the test writer on the base engine before any T94 change "
                    "(tailored_test.py --pin). Read by tailored_test.py and kitted-core's tailored.test.ts. Never edit by hand, "
                    "never regenerate after the lock.",
           "parts_version": P.PARTS_VERSION if hasattr(P, "PARTS_VERSION") else None, "cases": {}}
    for cid, c in CASES.items():
        sp = parts(cid)
        f = fixes(cid)
        out["cases"][cid] = {"crit": c["crit"], "reading": c["reading"], "picks": c["picks"], "occasion": c["occasion"],
                             "numbers": numbers(sp), "detected_styles": sp.get("detected_styles"), "style_label": sp.get("style_label"),
                             "fixes": fix_numbers(f), "fix_order": [x["id"] for x in f["fixes"]]}
    PINS.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {PINS.relative_to(K)} ({len(CASES)} readings)")


# --------------------------------------------------------------------------------------------- the tests
TESTS = []


def test(name):
    def deco(fn):
        TESTS.append((name, fn))
        return fn
    return deco


def is_look(cid, picks=None):
    d = looks(cid, picks)
    return "tailored" in d["detected"]


# ===== TL1 · what counts =============================================================================================
@test("TL1.1 · a charcoal suit with black derbies reads as Tailored")
def _():
    d = looks("suit", {})
    assert "tailored" in d["detected"] and d["label"] == "tailored", d
    sp = parts("suit")
    assert sp["style_label"] == "tailored", sp["style_label"]
    assert sp["detected_styles"] == ["tailored"], sp["detected_styles"]
    assert R.is_tailored(scored("suit")) is True
    # must not: the scoring detector stays the 7 looks, and no number moves
    assert R.STYLE_ORDER == SEVEN, R.STYLE_ORDER
    assert "tailored" not in R.detect_styles(scored("suit"))["detected"]
    assert R.detect_styles(scored("suit")) == {"detected": [], "label": None}
    assert R.LOOK_ORDER == LOOK_ORDER, R.LOOK_ORDER
    assert R.STYLE_NAMES["tailored"] == "tailored"
    same_numbers("suit", sp)


@test("TL1.1 · edges: no shoes in view still Tailored; the top half only isn't")
def _():
    assert looks("suit-no-shoes", {}) == {"detected": ["tailored"], "label": "tailored"}, looks("suit-no-shoes", {})
    assert R.is_tailored(scored("suit-no-shoes")) is True
    assert parts("suit-no-shoes")["style_label"] == "tailored"
    same_numbers("suit-no-shoes")
    d = looks("suit-upper-only", {})
    assert "tailored" not in d["detected"] and d["label"] is None, d
    assert R.is_tailored(scored("suit-upper-only")) is False
    sp = parts("suit-upper-only")
    assert sp["style_label"] is None and "tailored" not in sp["detected_styles"], (sp["style_label"], sp["detected_styles"])
    same_numbers("suit-upper-only", sp)


@test("TL1.2 · navy blazer, white dress shirt, grey trousers, brown loafers reads as Tailored")
def _():
    sp = parts("blz")
    assert sp["style_label"] == "tailored", sp["style_label"]
    assert sp["detected_styles"] == ["tailored", "classic_prep", "smart_casual"], sp["detected_styles"]
    assert R.is_tailored(scored("blz")) is True
    assert ("H1_reads_as_style", 0.5, "reads as tailored") in reasons(sp, "cohesion"), reasons(sp, "cohesion")
    assert not [ln for ln in lines(sp) if "reads as smart casual" in ln or "reads as classic prep" in ln], lines(sp)
    # the 7 looks' membership is unchanged
    assert R.detect_styles(scored("blz"))["detected"] == ["classic_prep", "smart_casual"]
    same_numbers("blz", sp)


@test("TL1.2 · edge: a suit jacket with plain trousers (re-filed as a blazer) reads as Tailored")
def _():
    sp = parts("suit-jacket-plain-trousers")
    assert sp["style_label"] == "tailored" and "tailored" in sp["detected_styles"], (sp["style_label"], sp["detected_styles"])
    assert R.is_tailored(scored("suit-jacket-plain-trousers")) is True
    assert h1(sp) == [("H1_reads_as_style", 0.5, "reads as tailored")], h1(sp)
    same_numbers("suit-jacket-plain-trousers", sp)


@test("TL1.3 · white leather sneakers keep it Tailored; chunky, running, slides, work boots don't")
def _():
    for k in ("white_leather_sneaker", "low_profile_sneaker"):
        sp = parts(f"blz+{k}")
        assert sp["style_label"] == "tailored" and "tailored" in sp["detected_styles"], (k, sp["style_label"], sp["detected_styles"])
        assert R.is_tailored(scored(f"blz+{k}")) is True, k
        same_numbers(f"blz+{k}", sp)
    for k in ("chunky_sneaker", "performance_runner", "slides_sandals", "work_boot", "basketball_sneaker"):
        cid = f"blz+{k}"
        sp = parts(cid)
        assert "tailored" not in sp["detected_styles"] and sp["style_label"] != "tailored", (k, sp["detected_styles"])
        assert not is_look(cid, {}) and R.is_tailored(scored(cid)) is False, k
        assert sp["style_label"] == pinned(cid)["style_label"], (k, sp["style_label"], pinned(cid)["style_label"])
        assert sp["detected_styles"] == pinned(cid)["detected_styles"], (k, sp["detected_styles"])
        same_numbers(cid, sp)


@test("TL1.3 · edges: canvas sneakers and retro runners stay Tailored; any piece at roominess 5 doesn't")
def _():
    for k in ("canvas_sneaker", "retro_runner"):
        sp = parts(f"blz+{k}")
        assert sp["style_label"] == "tailored", (k, sp["style_label"])
        same_numbers(f"blz+{k}", sp)
    for what in ("shirt", "blazer", "trousers", "loafers"):
        cid = f"blz-volume5-{what}"
        sp = parts(cid)
        assert "tailored" not in sp["detected_styles"] and sp["style_label"] != "tailored", (cid, sp["detected_styles"])
        assert R.is_tailored(scored(cid)) is False, cid
        assert sp["style_label"] == pinned(cid)["style_label"], (cid, sp["style_label"])
        same_numbers(cid, sp)


@test("TL1.4 · blazer with khaki chinos and loafers stays classic prep")
def _():
    for k in ("none", "tailored", "prep", "sc", "tailored+sc"):
        cid = f"prep@{k}"
        sp = parts(cid)
        assert "tailored" not in sp["detected_styles"], (cid, sp["detected_styles"])
        assert not is_look(cid) and R.is_tailored(scored(cid)) is False, cid
        assert sp["detected_styles"] == ["classic_prep", "smart_casual"], (cid, sp["detected_styles"])
        assert sp["style_label"] == pinned(cid)["style_label"], (cid, sp["style_label"], pinned(cid)["style_label"])
        same_numbers(cid, sp)
    assert parts("prep@none")["style_label"] == "classic_prep"
    assert parts("prep@tailored")["style_label"] == "classic_prep"          # a Tailored pick never invents the look


@test("TL1.5 · a sweater with dress trousers and loafers isn't Tailored")
def _():
    sp = parts("knit")
    assert sp["detected_styles"] == ["minimalist", "smart_casual"] == pinned("knit")["detected_styles"], sp["detected_styles"]
    assert sp["style_label"] == "minimalist" == pinned("knit")["style_label"], sp["style_label"]
    assert R.is_tailored(scored("knit")) is False and not is_look("knit")
    same_numbers("knit", sp)
    sp = parts("knit+overcoat")                                        # an overcoat isn't a tailored jacket
    assert "tailored" not in sp["detected_styles"] and sp["style_label"] == pinned("knit+overcoat")["style_label"], sp["detected_styles"]
    assert R.is_tailored(scored("knit+overcoat")) is False
    same_numbers("knit+overcoat", sp)


@test("TL1.6 · a blazer with dark jeans isn't Tailored")
def _():
    sp = parts("dj")
    assert "tailored" not in sp["detected_styles"], sp["detected_styles"]
    assert sp["style_label"] == "classic_prep" == pinned("dj")["style_label"], sp["style_label"]
    assert R.is_tailored(scored("dj")) is False and not is_look("dj")
    same_numbers("dj", sp)
    for cid in [f"dj-{k}" for k in NEVER_BOTTOMS] + [f"blz-under-{k}" for k in NEVER_TOPS]:
        sp = parts(cid)
        assert "tailored" not in sp["detected_styles"] and sp["style_label"] != "tailored", (cid, sp["detected_styles"])
        assert R.is_tailored(scored(cid)) is False and not is_look(cid, {}), cid
        assert sp["style_label"] == pinned(cid)["style_label"] and sp["detected_styles"] == pinned(cid)["detected_styles"], cid
        same_numbers(cid, sp)


@test("TL1.7 · is_tailored agrees with the framework on every parity reading")
def _():
    readings = {}
    for f in ("rubric_parity.json", "parts_parity.json"):
        readings.update(json.loads((K / "handoff" / "fixtures" / f).read_text())["readings"])
    yes = 0
    for rid, r in readings.items():
        try:
            gs = R.scored_garments(r)
        except Exception:                                              # a stored error: not a reading the engine scores
            continue
        if not gs:
            continue
        a = R.is_tailored(gs)
        b = "tailored" in R.detect_looks(gs, {})["detected"]
        assert a == b, f"{rid}: is_tailored {a}, detect_looks {b}"
        yes += a
    assert yes > 0, "no parity reading reads as Tailored: the check would prove nothing"


# ===== TL2 · the name ================================================================================================
@test("TL2.1 · Tailored wins over smart casual and prep whatever the picks")
def _():
    for base in ("blz", "pink-oxford"):
        nums = None
        for k in PICKS_TL21:
            cid = f"{base}@{k}"
            sp = parts(cid)
            assert sp["style_label"] == "tailored", (cid, sp["style_label"])
            assert looks(cid)["label"] == "tailored", (cid, looks(cid))
            assert h1(sp) == [("H1_reads_as_style", 0.5, "reads as tailored")], (cid, h1(sp))
            same_numbers(cid, sp)
            nums = nums or numbers(sp)
            assert numbers(sp) == nums, f"{cid}: a pick moved a number"
    # the pink oxford is a prep marker today
    assert pinned("pink-oxford@none")["style_label"] == "classic_prep"


@test("TL2.1 · a tie Tailored doesn't own goes to his picks, then the fixed order")
def _():
    d0 = looks("min-tie@none")
    assert "tailored" in d0["detected"] and "minimalist" in d0["detected"], d0       # both detected: the case is real
    assert d0["label"] == "tailored", d0                                             # no picks: the fixed order
    assert looks("min-tie@minimalist")["label"] == "minimalist", looks("min-tie@minimalist")
    assert parts("min-tie@none")["style_label"] == "tailored"
    assert parts("min-tie@minimalist")["style_label"] == "minimalist"
    assert numbers(parts("min-tie@none")) == numbers(parts("min-tie@minimalist")), "a pick moved a number"
    same_numbers("min-tie@none")
    same_numbers("min-tie@minimalist")


@test('TL2.2 · a suit that reads as Tailored never says "a matching suit"')
def _():
    for cid in ("suit", "suit-no-shoes", "s09"):
        sp = parts(cid)
        assert sp["style_label"] == "tailored", (cid, sp["style_label"])
        assert h1(sp) == [("H1_reads_as_style", 0.5, "reads as tailored")], (cid, h1(sp))
        assert not [ln for ln in lines(sp) if "matching suit" in ln], (cid, lines(sp))
        same_numbers(cid, sp)
    # every Tailored card among these readings: no "matching suit" anywhere
    for cid in CASES:
        sp = parts(cid)
        if sp.get("style_label") == "tailored":
            assert not [ln for ln in lines(sp) if "matching suit" in ln], (cid, lines(sp))


@test('TL2.2 · across the regenerated parts parity, no Tailored card says "matching suit"')
def _():
    d = json.loads((K / "handoff" / "fixtures" / "parts_parity.json").read_text())
    pool = d["pool"]
    tl = 0
    for c in d["cases"]:
        e = c["expected"]
        if e.get("style_label") != "tailored":
            continue
        tl += 1
        for name, ix in (e.get("parts") or {}).items():
            p = pool[ix] if isinstance(ix, int) else ix
            bad = [x["line"] for x in p.get("reasons", []) + p.get("tips", []) if "matching suit" in x["line"]]
            assert not bad, (c["reading"], c["occasion"], name, bad)
    assert tl > 0, "parts_parity.json has no Tailored case: it wasn't regenerated from the Tailored engine"


@test("TL3.2 · the regenerated parity and fix fixtures carry a Tailored picks variant")
def _():
    d = json.loads((K / "handoff" / "fixtures" / "parts_parity.json").read_text())
    with_tl = [c for c in d["cases"] if any(k == "tailored" for k, _ in c["styles"])]
    assert with_tl, "no parts_parity case has a Tailored pick (make_parts_parity.py's new picks variant)"
    f = json.loads((K / "handoff" / "fixtures" / "parts_fixes.json").read_text())
    assert any(any(k == "tailored" for k, _ in (c.get("styles") or [])) for c in f["cases"]), \
        "no parts_fixes case has a Tailored pick (make_parts_fixes.py iterates STYLE_NAMES)"


@test('TL2.2 · founder 1 (default): a suit that isn\'t Tailored keeps +0.5 and "a matching suit"')
def _():
    for cid in ("suit+chunky", "suit-over-graphic-tee"):
        sp = parts(cid)
        assert sp["style_label"] is None and "tailored" not in sp["detected_styles"], (cid, sp["style_label"], sp["detected_styles"])
        assert R.is_tailored(scored(cid)) is False, cid
        assert h1(sp) == [("H1_reads_as_style", 0.5, "a matching suit")], (cid, h1(sp))
        same_numbers(cid, sp)


# ===== TL5 · fixes ===================================================================================================
def order(cid):
    return [x["id"] for x in fixes(cid)["fixes"]]


def same_fix_numbers(cid):
    f = fixes(cid)
    assert fix_numbers(f) == pinned(cid)["fixes"], f"{cid}: a fix number moved\n  base: {pinned(cid)['fixes']}\n  now:  {fix_numbers(f)}"
    same_numbers(cid)


@test("TL5.1 · the sleeve fix leads with Tailored first; the score is the same")
def _():
    assert order("sleeves@none") == ["shoes_loafers", "fit_better"] == pinned("sleeves@none")["fix_order"], order("sleeves@none")
    assert [x["to"] for x in fixes("sleeves@none")["fixes"]] == [7.5, 7.0]
    assert order("sleeves@tailored") == ["fit_better", "shoes_loafers"], order("sleeves@tailored")
    assert order("sleeves@streetwear+tailored") == ["fit_better", "shoes_loafers"], order("sleeves@streetwear+tailored")
    for k in ("none", "tailored", "streetwear+tailored", "sc"):
        same_fix_numbers(f"sleeves@{k}")
    a, b = fixes("sleeves@none"), fixes("sleeves@tailored")
    by = lambda f: {x["id"]: (x["to"], x["gain"], x["raw_gain"], x["to_raw"]) for x in f["fixes"]}  # noqa: E731
    assert by(a) == by(b) and a["base_overall"] == b["base_overall"] and a["base_raw"] == b["base_raw"]
    assert numbers(parts("sleeves@none")) == numbers(parts("sleeves@tailored"))


@test("TL5.1 · no lead without Tailored, never across a class, never without a tailored jacket")
def _():
    assert order("sleeves@sc") == order("sleeves@none") == ["shoes_loafers", "fit_better"], order("sleeves@sc")
    for k in ("none", "tailored", "streetwear+tailored", "sc"):
        assert order(f"sleeves-wrinkled@{k}") == ["steam", "fit_better"], (k, order(f"sleeves-wrinkled@{k}"))
        same_fix_numbers(f"sleeves-wrinkled@{k}")
        assert order(f"knit-sleeves@{k}") == pinned("knit-sleeves@none")["fix_order"], (k, order(f"knit-sleeves@{k}"))
        same_fix_numbers(f"knit-sleeves@{k}")
        # an overcoat isn't a tailored jacket: its sleeve fix keeps its place behind the shoes
        assert order(f"coat-sleeves@{k}") == ["shoes_loafers", "fit_better"], (k, order(f"coat-sleeves@{k}"))
        same_fix_numbers(f"coat-sleeves@{k}")
    # the outputs keep their shape: the lead key is dropped like pick_rank
    for x in fixes("sleeves@tailored")["fixes"]:
        assert "tailor_lead" not in x and "pick_rank" not in x, sorted(x)
        assert sorted(x) == sorted(fixes("sleeves@none")["fixes"][0]), sorted(x)


@test("TL3.1 · every reading here keeps every number of engine v15 (the pins)")
def _():
    bad = []
    for cid in CASES:
        try:
            same_numbers(cid)
            f = fixes(cid)
            if fix_numbers(f) != pinned(cid)["fixes"]:
                bad.append(f"{cid}: fixes")
        except AssertionError as e:
            bad.append(str(e).split("\n")[0])
    assert not bad, bad
    assert sorted(load_pins()["cases"]) == sorted(CASES), "the pinned readings and the test's readings differ"
    for cid, c in CASES.items():
        p = pinned(cid)
        assert (p["reading"], p["picks"], p["occasion"]) == (c["reading"], c["picks"], c["occasion"]), f"{cid}: reading changed"


# --------------------------------------------------------------------------------------------- the TS fixture
def snapshot(cid):
    c = CASES[cid]
    sp = parts(cid)
    gs = scored(cid)
    f = fixes(cid)
    return {"is_tailored": R.is_tailored(gs), "looks": R.detect_looks(gs, picks_of(c)), "looks_nopick": R.detect_looks(gs, {}),
            "detected_styles": sp.get("detected_styles"), "style_label": sp.get("style_label"),
            "lines": {k: [[x["check"], x["points"], x["line"]] for x in v["reasons"]] for k, v in (sp.get("parts") or {}).items()},
            "numbers": numbers(sp), "fix_order": [x["id"] for x in f["fixes"]]}


def main():
    if "--pin" in sys.argv:
        write_pins()
        return 0
    fails = 0
    for name, fn in TESTS:
        try:
            fn()
            print(f"PASS {name}")
        except Exception as e:                                         # an AttributeError here is "not built"
            fails += 1
            msg = "".join(traceback.format_exception_only(type(e), e)).strip()
            print(f"FAIL {name}\n     {msg[:1500]}")
    print(f"{len(TESTS) - fails}/{len(TESTS)} pass")
    if fails:
        return 1
    out = {"about": "T94: the Tailored readings and Python's results. Generated by extraction-test/tailored_test.py when "
                    "every test passes; read by app/packages/kitted-core/test/tailored.test.ts (TL1.7). Never edit by hand.",
           "cases": [{"id": cid, **CASES[cid], "python": snapshot(cid)} for cid in CASES]}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(K)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
