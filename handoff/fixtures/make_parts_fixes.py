"""Writes fixtures/parts_fixes.json: the parts fix engine's exact Python output (parts_fixes.suggest_parts_fixes on
parts_proto.py v15) for @kitted/core's suggestPartsFixes() parity test (test/partsFixes.parity.test.ts).

Run (after make_parts_parity.py, whose loaders and edge cases it reuses):
    /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_parts_fixes.py

Readings x configs:
  1. the real saved corpus (extraction-test/results/parts1/corpus.json) and the newest phone pull's scored checks,
     deduped, each with the paper tests' second look (look1 majority), at every app occasion (app/src/data/types.ts
     OCCASIONS), warm on and off, with an empty closet and the seed closet (seed.json scenarios.full: 16 pieces);
     plus the first check (free fixes only) at the reading's own occasion
  2. rubric_parity.json's hand-written edge readings and make_parts_parity's parts edge cases (with their own second
     look), at every app occasion, warm on and off, both closets
  3. fix edge cases below, written to make every candidate, the Smaller step, every Next level line and both "no fix"
     lines appear (the generator asserts it)
  4. picks variants: the real readings at their own occasion and every edge with no picks, one pick (each of the 7
     styles) and three picks, so the pick tie-break and the first pick's Next level line are covered
Profile (CLAUDE.md rule 7): the paper tests' one stated test profile (picks Minimal + Smart casual 0.5 each,
boldness a little, no age) unless the case names its own `styles`; picks never move a number (the generator
asserts the base score is the same under every picks).

Each case's `expected` is suggest_parts_fixes()'s dict. Fix and Smaller-step objects repeat across thousands of
cases, so each is stored once in `pool` and referenced by index.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, hashlib, json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
KEMPT = os.path.abspath(os.path.join(HERE, "../.."))
ET = os.path.join(KEMPT, "extraction-test")
sys.path.insert(0, ET)
sys.path.insert(0, os.path.join(ET, "rubrics"))
sys.path.insert(0, HERE)
import parts_proto as P  # noqa: E402
import parts_test as T  # noqa: E402
import make_parts_parity as MP  # noqa: E402
import parts_fixes as F  # noqa: E402

PROFILE = MP.PROFILE
BOLD = MP.BOLD
OCCASIONS = ["everyday", "class", "date", "going_out", "interview", "event", "gym", "home"]   # the app's (data/types.ts)
SEED = json.load(open(os.path.join(HERE, "seed.json")))["scenarios"]["full"]["closet"]
CLOSET = [{"id": it["id"], "slot": it["slot"], "name": it["name"], "garment": it["garment"]} for it in SEED]
G, Rd, TEE, JEANS, SHOE = MP.G, MP.Rd, MP.TEE, MP.JEANS, MP.SHOE


def fix_edges():
    E = []
    add = lambda name, r, occ="everyday", sl=None: E.append((name, r, occ, sl))  # noqa: E731
    held = Rd(TEE(color="black", volume=4, length="mid_fly"), JEANS(color="black", leg_shape="wide"), SHOE())
    held["held_items"] = [G("outerwear", "denim_jacket", "denim_dark"), G("outerwear", "bomber", "olive")]
    add("held_jacket", held)
    add("wrinkled_shirt", Rd(G("top", "oxford_shirt", "white", tucked="full", condition="wrinkled"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("worn_tee", Rd(TEE(condition="pilled_or_worn"), JEANS(), SHOE()))
    add("worn_shoes", Rd(TEE(), JEANS(), SHOE(condition="pilled_or_worn")))
    add("stained_tee", Rd(TEE(condition="stained"), JEANS(), SHOE()))
    add("pooling_trousers", Rd(G("top", "oxford_shirt", "light_blue", tucked="full"), G("bottom", "trousers", "grey", leg_shape="straight", hem="pooling"),
                               SHOE(sub="derby", color="brown")), occ="date")
    add("pooling_jeans", Rd(TEE(), JEANS(hem="pooling"), SHOE()))
    add("slides_drag", Rd(TEE(sub="hoodie", color="grey"), JEANS(leg_shape="wide", hem="pooling", color="black"), SHOE(sub="slides_sandals", color="black")),
        sl={"peek": False, "rests_on_shoe": True})
    add("sleeves_hoodie", Rd(TEE(sub="hoodie", color="grey", sleeve_end="covers_hand", volume=4), JEANS(), SHOE()))
    add("sleeves_oxford", Rd(G("top", "oxford_shirt", "white", sleeve_end="covers_hand", tucked="none"), JEANS(), SHOE()))
    add("sleeves_blazer", Rd(TEE(tucked="full"), G("outerwear", "blazer", "navy", sleeve_end="covers_hand"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"),
                             SHOE(sub="loafer", color="brown")))
    add("strain_tee", Rd(TEE(strain="clear"), JEANS(), SHOE()))
    add("strain_jeans", Rd(TEE(), JEANS(leg_shape="slim", strain="clear"), SHOE()))
    add("too_big_shirt", Rd(G("top", "oxford_shirt", "white", sleeve_end="covers_hand", volume=5, tucked="none"), JEANS(), SHOE()))
    add("skinny_big_top", Rd(TEE(volume=5), JEANS(leg_shape="skinny"), SHOE()))
    add("chunky_slim", Rd(TEE(), JEANS(leg_shape="slim"), SHOE(sub="chunky_sneaker", color="white")))
    add("bright_clash", Rd(TEE(color="red"), JEANS(sub="chinos", color="yellow"), SHOE()))
    add("too_many_colors", Rd(TEE(color="red"), G("outerwear", "bomber", "green"), JEANS(sub="chinos", color="purple"), SHOE()))
    add("pattern_clash", Rd(TEE(sub="flannel_shirt", color="red", pattern="checks_plaid", pattern_scale="medium"),
                            G("outerwear", "overshirt", "navy", pattern="checks_plaid", pattern_scale="medium"), JEANS(), SHOE()))
    add("interview_jeans", Rd(G("top", "oxford_shirt", "white", tucked="full"), JEANS(color="denim_dark"), SHOE(sub="white_leather_sneaker")), occ="interview")
    add("blazer_jeans", Rd(TEE(color="black", tucked="full"), G("outerwear", "blazer", "navy"), JEANS(leg_shape="relaxed", color="denim_mid"), SHOE(sub="suede_chukka", color="grey")),
        occ="class")
    add("lounge_out", Rd(TEE(sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="cuffed"), SHOE(sub="slides_sandals", color="black")))
    add("lounge_gym", Rd(TEE(condition="wrinkled", sleeve_end="covers_hand", sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey"), SHOE(sub="slides_sandals", color="black")),
        occ="gym")
    add("shorts_boots_blocked", Rd(TEE(), G("bottom", "shorts", "khaki_beige"), SHOE(sub="canvas_sneaker")))
    add("quiet_plain", Rd(TEE(color="grey"), JEANS(sub="chinos", color="navy"), SHOE(sub="canvas_sneaker", color="white")))
    add("quiet_hoodie", Rd(TEE(sub="hoodie", color="black"), JEANS(color="black", leg_shape="straight"), SHOE(sub="canvas_sneaker", color="white")))
    add("street_shape", Rd(TEE(sub="graphic_tee", color="black", volume=4, pattern="graphic"), JEANS(leg_shape="wide", hem="cuffed"), SHOE()), occ="class")
    add("dialed_in", Rd(G("top", "oxford_shirt", "light_blue", tucked="full"), G("outerwear", "sport_coat", "navy"),
                        G("bottom", "chinos", "khaki_beige", leg_shape="straight", hem="no_break"), SHOE(sub="loafer", color="brown")), occ="date")
    add("suit", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "navy"), G("bottom", "suit_trousers", "navy", leg_shape="straight", hem="no_break"),
                   SHOE(sub="derby", color="black")), occ="event")
    add("unclear_shoes", Rd(TEE(), JEANS(), SHOE(sub="other", color="grey")))
    add("no_shoes", Rd(TEE(), JEANS(), SHOE(), shoes_visible=False))
    add("upper_only", Rd(TEE(), G("outerwear", "overshirt", "olive"), framing="upper_only", shoes_visible=False))
    add("not_scored", Rd(TEE(), JEANS(), SHOE(), clothed="partial"))
    # v5's style-crossing swaps: a street-coded top in a quiet outfit (SX1)
    add("clash_graphic_trousers", Rd(TEE(sub="graphic_tee", color="white", volume=4, pattern="graphic"),
                                     G("bottom", "trousers", "charcoal", leg_shape="straight", hem="slight_break"), SHOE(sub="loafer", color="black")))
    add("clash_hoodie_chinos", Rd(TEE(sub="hoodie", color="grey", volume=4), G("bottom", "chinos", "khaki_beige", leg_shape="slim", hem="slight_break"),
                                  SHOE(sub="loafer", color="brown")), occ="class")
    add("clash_tee_chinos", Rd(TEE(color="white", volume=4), G("bottom", "chinos", "khaki_beige", leg_shape="slim", hem="slight_break"),
                               SHOE(sub="derby", color="brown")), occ="date")
    # his first pick's path to 8 (the Next level lines with a style)
    CHORE = G("outerwear", "chore_coat", "tan_camel")
    add("pick_chore_sneakers", Rd(TEE(), CHORE, JEANS(color="black"), SHOE(sub="canvas_sneaker", color="white")))
    add("pick_chore_low", Rd(TEE(color="black"), dict(CHORE, color_family="olive"), JEANS(color="denim_dark", leg_shape="wide", hem="cuffed"),
                             SHOE(sub="low_profile_sneaker", color="white")))
    add("pick_jeans_boots", Rd(TEE(color="grey"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")))
    add("pick_street", Rd(TEE(sub="hoodie", color="black", volume=4, length="mid_fly"), JEANS(color="black", leg_shape="wide", hem="cuffed"),
                          SHOE(sub="chunky_sneaker", color="white")))
    add("pick_knit_trousers", Rd(G("top", "sweater", "cream", tucked="none", length="mid_fly"), G("bottom", "trousers", "grey", leg_shape="wide", hem="slight_break"),
                                 SHOE(sub="loafer", color="black")))
    add("pick_knit_jeans", Rd(G("top", "sweater", "navy", tucked="none", length="mid_fly"), JEANS(color="denim_dark"), SHOE(sub="white_leather_sneaker")))
    add("pick_oxford_chinos", Rd(G("top", "oxford_shirt", "light_blue", tucked="none", length="mid_fly"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"),
                                 SHOE(sub="loafer", color="brown")))
    add("pick_oxford_half", Rd(G("top", "oxford_shirt", "light_blue", tucked="half"), G("bottom", "chinos", "navy", leg_shape="straight"),
                               SHOE(sub="loafer", color="brown")))
    # v8: a half-tucked oxford over wide chinos (the prep blazer line, now that a short jacket is the Smaller step on straight legs)
    add("pick_oxford_half_wide", Rd(G("top", "oxford_shirt", "light_blue", tucked="half"), G("bottom", "chinos", "navy", leg_shape="wide"),
                                    SHOE(sub="loafer", color="brown")))
    # v10: knit over knit (tip_knit, the creators' "contrast the textures")
    add("knit_on_knit", Rd(G("outerwear", "cardigan", "navy"), G("top", "sweater", "grey", tucked="none", length="at_belt"), JEANS(color="denim_dark"),
                           SHOE(sub="suede_chukka", color="brown")))
    add("knit_qz_polo", Rd(G("top", "quarter_zip", "navy", tucked="none", length="at_belt"), G("top", "knit_polo", "white", tucked="none", length="at_belt"),
                           G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    add("knit_over_oxford", Rd(G("outerwear", "cardigan", "navy"), G("top", "oxford_shirt", "white", tucked="none", length="at_belt"), JEANS(color="denim_dark"),
                               SHOE(sub="suede_chukka", color="brown")))
    # v12: jeans read straight at roominess 2 are judged slim; the swap keeps his wash (pants_straight_fitted)
    add("fitted_straight_jeans", Rd(TEE(color="black"), JEANS(volume=2), SHOE()))
    add("fitted_straight_jeans_chunky", Rd(TEE(color="black"), JEANS(volume=2), SHOE(sub="chunky_sneaker")))
    add("fitted_straight_jeans_tucked", Rd(G("top", "polo", "black", tucked="full"), JEANS(volume=2, color="off_white_cream"), SHOE()))
    add("pick_polo_jeans",Rd(G("top", "polo", "navy", tucked="none", length="mid_fly"), JEANS(color="denim_dark"), SHOE(sub="white_leather_sneaker")))
    # v1.7 (#336): tuck it in, not swap it. The founder's open check shirt over a navy tee (before: tuck the layer), a tuck
    # that hides a same-gain swap of the shirt, and the tuck tips by shirt type (alone and next to a fix)
    open_shirt = lambda **kw: G("outerwear", kw.pop("sub", "flannel_shirt"), kw.pop("color", "tan_camel"), **{"tucked": "none", "length": "mid_fly", "volume": 4, "sleeve_end": "covers_hand", **kw})  # noqa: E731
    add("tuck_layer_open_shirt", Rd(TEE(color="navy"), open_shirt(), JEANS(color="denim_light", leg_shape="relaxed", volume=4, hem="full_break"), SHOE()), occ="going_out")
    add("tuck_layer_tucked", Rd(TEE(color="navy", tucked="full", length="na"), open_shirt(tucked="full", length="na"), JEANS(color="denim_light", leg_shape="relaxed", volume=4, hem="full_break"), SHOE(sub="retro_runner")), occ="going_out")
    add("tuck_layer_oxford_open", Rd(TEE(), open_shirt(sub="oxford_shirt", color="light_blue", volume=3, sleeve_end="at_wrist"), JEANS(color="denim_dark", leg_shape="wide"), SHOE()))
    add("tuck_hides_shirt_swap", Rd(G("top", "oxford_shirt", "white", tucked="none", length="mid_fly", volume=4), JEANS(leg_shape="wide", color="denim_dark"), SHOE()))
    add("tuck_hides_camp_swap", Rd(G("top", "camp_collar_shirt", "olive", tucked="none", length="mid_fly", volume=5), JEANS(leg_shape="wide", hem="pooling"), SHOE(sub="slides_sandals", color="black")))
    add("tip_tuck_dress_alone", Rd(G("top", "dress_shirt", "white", tucked="none", length="mid_fly"), JEANS(leg_shape="relaxed", color="denim_dark"), SHOE(sub="loafer", color="brown")))
    add("tip_tuck_dress_slim", Rd(G("top", "dress_shirt", "white", tucked="none", length="mid_fly"), JEANS(leg_shape="slim", color="black"), SHOE(sub="loafer", color="black")), occ="date")
    add("tip_tuck_dress_wrinkled", Rd(G("top", "dress_shirt", "white", tucked="none", length="mid_fly", condition="wrinkled"), JEANS(leg_shape="wide"), SHOE(sub="derby", color="brown")))
    add("tip_tuck_polo_slim", Rd(G("top", "polo", "navy", tucked="none", length="mid_fly"), JEANS(leg_shape="slim", volume=2), SHOE()), occ="class")
    add("tip_tuck_oxford_slim_chinos", Rd(G("top", "oxford_shirt", "light_blue", tucked="none", length="mid_fly", condition="wrinkled"), G("bottom", "chinos", "khaki_beige", leg_shape="slim"), SHOE()), occ="class")
    add("tip_tuck_oxford_at_belt", Rd(G("top", "oxford_shirt", "light_blue", tucked="none", length="at_belt"), G("bottom", "chinos", "khaki_beige", leg_shape="slim"), SHOE()))
    add("tip_tuck_half", Rd(G("top", "dress_shirt", "white", tucked="half", length="na"), JEANS(leg_shape="slim"), SHOE()))
    add("tip_tuck_gym", Rd(G("top", "polo", "navy", tucked="none", length="mid_fly"), JEANS(leg_shape="slim", volume=2), SHOE()), occ="gym")
    # v1.9 (#376): the anchoring tips on light on light ([COL-12]); light shoes add "dark shoes", dark ones don't; no tip
    # without the charge (a white tee over khaki, a cream shirt over navy chinos)
    add("anchor_cream_khaki_loafers", Rd(G("top", "oxford_shirt", "off_white_cream", tucked="full"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"),
                                         SHOE(sub="loafer", color="brown")))
    add("anchor_white_cream_sneakers", Rd(TEE(length="at_belt"), JEANS(color="off_white_cream"), SHOE()))
    add("anchor_cream_khaki_cream", Rd(TEE(color="off_white_cream", length="at_belt"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"),
                                       SHOE(sub="canvas_sneaker", color="off_white_cream")))
    add("anchor_white_khaki_free", Rd(TEE(length="at_belt"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE()))
    add("anchor_cream_navy_free", Rd(G("top", "oxford_shirt", "off_white_cream", tucked="full"), G("bottom", "chinos", "navy", leg_shape="straight"), SHOE()))
    return E


PICK_LEADS = []


def main():
    rp = json.load(open(os.path.join(HERE, "rubric_parity.json")))
    readings, cases, cov = {}, [], Counter()
    pool, seen = [], {}

    def intern(v):
        k = json.dumps(v, sort_keys=True, separators=(",", ":"))
        if k not in seen:
            seen[k] = len(pool); pool.append(v)
        return seen[k]

    def ref(r):
        rid = MP.rid_of(r)
        if r.get("held_items"):
            rid += "h" + hashlib.sha256(json.dumps(r["held_items"], sort_keys=True).encode()).hexdigest()[:6]
        if rid not in rp["readings"] or r.get("held_items"):
            readings.setdefault(rid, {"scene": r.get("scene"), "garments": r.get("garments"),
                                      **({"held_items": r["held_items"]} if r.get("held_items") else {})})
        return rid

    def add(src, r, occ, sl, warm, closet, first=False, styles=None, engine="v15", season=None):
        rid = ref(r)
        st = PROFILE if styles is None else styles
        pre = "v16 " if engine == "v16" else ""          # T69: v16's coverage counts apart, so v15's stay as they were
        # _working must score the same as the reading itself, and picks never move the score
        b0 = F._score(r, occ, dict(st), sl, BOLD, engine, season)
        b1 = F._score(F._working(r), occ, dict(st), sl, BOLD, engine, season)
        bn = F._score(r, occ, {}, sl, BOLD, engine, season)
        assert b0.get("overall") == b1.get("overall") and b0.get("raw_unrounded") == b1.get("raw_unrounded"), src
        assert b0.get("overall") == bn.get("overall") and b0.get("raw_unrounded") == bn.get("raw_unrounded"), src
        exp = F.suggest_parts_fixes(r, occ, st, BOLD, sl, CLOSET if closet else [], warm, first, engine=engine, season=season)
        if styles is not None:
            ref_exp = F.suggest_parts_fixes(r, occ, [], BOLD, sl, CLOSET if closet else [], warm, first, engine=engine, season=season)
            assert ref_exp["base_overall"] == exp["base_overall"] and ref_exp["base_raw"] == exp["base_raw"], src
            lead = lambda e: e["fixes"][0]["id"] if e["fixes"] else None  # noqa: E731
            cov["picks: cards"] += 1
            cov["picks: lead fix differs from no picks"] += lead(exp) != lead(ref_exp)
            cov["picks: fix order differs from no picks"] += [f["id"] for f in exp["fixes"]] != [f["id"] for f in ref_exp["fixes"]]
            cov["picks: next level differs from no picks"] += (exp["next_level"] or {}).get("id") != (ref_exp["next_level"] or {}).get("id")
            if lead(exp) != lead(ref_exp):
                PICK_LEADS.append((src, st, lead(ref_exp), lead(exp)))
        for f in exp["fixes"]:
            cov[pre + "fix " + f["id"]] += 1
        if exp["smaller_step"]:
            cov[pre + "step " + exp["smaller_step"]["id"]] += 1
        if exp["next_level"]:
            cov[pre + "next " + exp["next_level"]["id"]] += 1
        if exp["none_line"]:
            cov[pre + "none " + exp["none_line"]] += 1
        if exp["base_overall"] is None:
            cov[pre + "(not scored)"] += 1
        exp["fixes"] = [intern(f) for f in exp["fixes"]]
        if exp["smaller_step"] is not None:
            exp["smaller_step"] = intern(exp["smaller_step"])
        case = {"src": src, "reading": rid, "occasion": occ, "second_look": sl, "warm": warm,
                "closet": "seed" if closet else "empty", "first_check": first, "expected": exp}
        if styles is not None:
            case["styles"] = styles
        if engine == "v16":                              # T69: tagged, with the card's season (warm == season "warm")
            assert warm == (season == "warm"), src
            case["tune"] = "v16"
            case["season"] = season
        cases.append(case)

    # 1. real readings
    U = T.load_runs(os.path.join(ET, "results/look1/raw.json"), "U")
    L = T.load_runs(os.path.join(ET, "results/look1/raw.json"), "L")
    corpus = json.load(open(os.path.join(ET, "results/parts1/corpus.json")))
    pull_path = MP.pinned_pull()                  # T69 (Q-T6): the pull the v15 cases were made from
    T.PULL = pull_path
    pull = T.load_pull() if pull_path else {}
    real, ids = [], set()
    for k, v in pull.items():                    # the newest pull first: its reading wins a duplicate
        real.append((f"pull:{os.path.basename(os.path.dirname(os.path.dirname(pull_path)))}:{v['check']}", k, v["reading"], v["occ"]))
    for x in corpus:
        real.append(("corpus:" + x["id"], T.key_from_corpus(x["id"]), x["reading"], x["occ"]))
    uniq = []
    for src, k, r, occ in real:
        rid = MP.rid_of(r)
        if rid in ids:
            continue
        ids.add(rid); uniq.append((src, k, r, occ))
    for src, k, r, occ in uniq:
        sl = T.second_look_for(k, U, L)
        for o in OCCASIONS:
            for warm in (False, True):
                for closet in (False, True):
                    add(f"{src}|{k}@{o}", r, o, sl, warm, closet)
        for closet in (False, True):
            add(f"{src}|{k}@{occ}:first", r, occ, sl, False, closet, True)
    n_real = len(cases)

    # 2. edge readings
    edge_ids = [rid for rid, srcs in rp["provenance"].items() if any(s.startswith("edge:") for s in srcs)]
    edges = [("edge:" + rid, rp["readings"][rid], None) for rid in edge_ids]
    edges += [("parts-edge:" + name, r, sl) for name, r, occ, sl, bold, styles in MP.parts_edges()]
    for src, r, sl in edges:
        for o in OCCASIONS:
            for warm in (False, True):
                for closet in (False, True):
                    add(f"{src}@{o}", r, o, sl, warm, closet)
    n_edge = len(cases) - n_real

    # 3. fix edges
    fe = fix_edges()
    for name, r, occ, sl in fe:
        for o in dict.fromkeys([occ] + OCCASIONS):
            for warm in (False, True):
                for closet in (False, True):
                    add(f"fix-edge:{name}@{o}", r, o, sl, warm, closet)
        add(f"fix-edge:{name}@{occ}:first", r, occ, sl, False, False, True)

    # 4. picks variants
    n_before_picks = len(cases)
    STY = list(P.R.STYLE_NAMES)
    PICKS = [("none", [])] + [(f"one:{x}", [[x, 1.0]]) for x in STY] + \
            [("three", [["streetwear", 0.5], ["vintage_sport", 0.25], ["smart_casual", 0.25]]),
             ("three-b", [["workwear", 0.5], ["minimalist", 0.25], ["classic_prep", 0.25]])]
    for src, k, r, occ in uniq:
        sl = T.second_look_for(k, U, L)
        for pn, st in PICKS:
            add(f"picks:{pn}:{src}|{k}@{occ}", r, occ, sl, False, False, False, st)
    for src, r, sl in edges:
        for pn, st in PICKS:
            add(f"picks:{pn}:{src}@everyday", r, "everyday", sl, False, False, False, st)
    for name, r, occ, sl in fe:
        for pn, st in PICKS:
            for closet in (False, True):
                add(f"picks:{pn}:fix-edge:{name}@{occ}", r, occ, sl, False, closet, False, st)
    n_picks = len(cases) - n_before_picks

    # 5. T69: parts engine v16, the card's engine and season (warm = season "warm"), after every v15 case
    n_before_v16 = len(cases)
    for src, k, r, occ in uniq:
        sl = T.second_look_for(k, U, L)
        for o in OCCASIONS:
            for season in (None, "warm"):
                for closet in (False, True):
                    add(f"v16:{src}|{k}@{o}", r, o, sl, season == "warm", closet, engine="v16", season=season)
        add(f"v16:{src}|{k}@{occ}:first", r, occ, sl, False, False, True, engine="v16")
    for name, r, occ, sl in fe:
        for season in (None, "warm"):
            for closet in (False, True):
                add(f"v16:fix-edge:{name}@{occ}", r, occ, sl, season == "warm", closet, engine="v16", season=season)
    n_v16 = len(cases) - n_before_v16

    must = ["fix " + c["id"] for c in F.CATALOG["candidates"]] + ["next " + n["id"] for n in F.CATALOG["nextLevel"]] + \
           ["none " + F.CATALOG["copy"]["noFixes"], "(not scored)"]
    # "Dialed in" (9+) can't happen yet: Fit tops out at 7 until the fit cues pass, so the best a reading reaches is 8.5
    missing = [m for m in must if not cov[m]]
    assert not missing, f"never appeared: {missing}"
    assert sum(v for k, v in cov.items() if k.startswith("step ")) > 0

    out = {
        "_doc": "Parts fix engine parity fixtures (handoff/fixtures/parts_fixes.py on parts_proto.py v15, catalog fixes.json -> "
                "parts). For each case, suggestPartsFixes(reading, {occasion, styles: the case's styles, else profile, boldness, secondLook, closet, warm, "
                "firstCheck}) must equal `expected` after mapping camelCase to these keys, exactly. closet 'seed' = `closet` here, "
                "'empty' = []. A case's reading is readings[id] here, else rubric_parity.json's readings[id]. expected.fixes[i] and "
                "expected.smaller_step are indices into `pool`.",
        "catalog_version": F.CATALOG["version"],
        "parts_proto_sha256": hashlib.sha256(open(P.__file__, "rb").read()).hexdigest(),
        "parts_fixes_sha256": hashlib.sha256(open(F.__file__, "rb").read()).hexdigest(),
        "pull": os.path.relpath(pull_path, MP.DATA) if pull_path else None,
        "profile": PROFILE, "boldness": BOLD, "occasions": OCCASIONS, "closet": CLOSET,
        "counts": {"real_readings": len(uniq), "real_cases": n_real, "edge_readings": len(edges), "edge_cases": n_edge,
                   "fix_edge_readings": len(fe), "picks_cases": n_picks, "v16_cases": n_v16, "cases": len(cases), "own_readings": len(readings), "pool": len(pool)},
        "coverage": dict(sorted(cov.items())),
        "pool": pool, "readings": readings, "cases": cases,
    }
    path = os.path.join(HERE, "parts_fixes.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(json.dumps(out["counts"]))
    print("file size MB:", round(os.path.getsize(path) / 1e6, 2))
    for k, v in sorted(cov.items()):
        print(f"   {v:6d}  {k}")
    print("lead fix changed by picks:")
    for x in PICK_LEADS:
        print("   ", x)


if __name__ == "__main__":
    main()
