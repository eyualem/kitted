"""Reference implementation (Python) of the PARTS engine's fix engine (DECISIONS-LOG #208). NOT live: the app still
uses kitted_logic.suggest_fixes on rubric.py v4.1. The TypeScript port is @kitted/core src/partsFixes.ts; parity
fixtures: make_parts_fixes.py -> parts_fixes.json.

How it works ("a fix row never shows a gain that doesn't happen", #204):
  1. Every candidate in fixes.json -> "parts" -> "candidates" is an edit to a COPY of the scored garments (free
     actions, his closet's pieces, generic swaps, adds, a tailor). Each copy is re-scored with the parts engine
     (parts_proto.score_parts, the default engine: v13) with the same occasion, picks, boldness and second look (plus the candidate's
     `look` override: a tuck hides a peek, a cuff lifts the hem off the shoe).
  2. A candidate is a FIX only when the ROUNDED score rises (gain >= 0.5). Its number is the engine's own.
  3. A candidate that raises a part's half-point display but leaves the rounded score where it is (and lowers no
     part, and doesn't lower the raw total) is a SMALLER STEP: one line, no number ("Dark straight jeans lift Style
     to 7.5, but the score stays 7.0."). One is shown: a smaller version of a shown fix's move (same group) first,
     then the largest raw gain.
  4. Order: free first, then closet, then "free if you own one", then tailor; the larger gain first inside a class.
     On the same rounded gain, the fix whose fixed outfit reads as his earliest pick goes first (picks shape the
     fixes, never the score; style-fairness.md §4), then the larger raw gain.
     One fix per group; a later class in the same group shows only when its gain is strictly larger. At most 3.
  5. #162's rules stay: no layer (anything that adds outerwear) and no boots on warm days, no boots with shorts,
     never one everyday sneaker for another; at the gym or at home only the `lounge` free actions (sleeves, care).
  6. A "Next level" line (no number) when its edit would lift the named part. His first pick's path to 8 (entries
     with `style`) comes first: shown when there's no fix and the edited outfit reads as that style, unless the
     Smaller step shown is the same kind of move (same `group`). The generic lines need no fix and no Smaller step.
  7. Tuck it in, not swap it (v1.7, #336): a shown tuck (`tucks`: the slots it tucks) hides any fix that swaps one of
     those pieces to raise a part the tuck raises, for no more gain (a color swap stays). A tuck tip by shirt type (`always` + `tuck`: a dress shirt untucked; an oxford or polo
     hanging to mid-fly or below) also shows next to fixes, when no tuck fix is shown and no free Smaller step is.

Rounding: rubric.round_half for every shown number (via parts_proto), Python round(x, 6) for raw gains; the TS uses
the same helpers (roundHalf, pyRound). Never mutates its inputs.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
KEMPT = os.path.abspath(os.path.join(HERE, "../.."))
sys.path.insert(0, os.path.join(KEMPT, "extraction-test"))
sys.path.insert(0, os.path.join(KEMPT, "extraction-test/rubrics"))
sys.path.insert(0, HERE)
import parts_proto as P  # noqa: E402
import kitted_logic as K  # noqa: E402  (name(), G(), SLOT_TO_CLOSET: the v4 helpers the TS port already has)

R = P.R
CATALOG = json.load(open(os.path.join(HERE, "fixes.json")))["parts"]
SLOTS = ("top", "outerwear", "bottom", "footwear")


def _score(reading, occasion, styles, sl, boldness, engine="v15", season=None):
    """score_parts plus the unrounded final (parts_proto.combine), like make_parts_parity.run. T69: engine "v16" scores
    with the card's season and takes the unrounded final from the result itself (combine is v15's)."""
    K._captured.clear()            # kitted_logic patches rubric.round to record calls; keep that list from growing
    if engine == "v16":
        return P.score_parts(copy.deepcopy(reading), occasion, dict(styles or {}), copy.deepcopy(sl), boldness, engine="v16",
                             season=season)
    res = P.score_parts(copy.deepcopy(reading), occasion, dict(styles or {}), copy.deepcopy(sl), boldness)
    if res["overall"] is not None:
        ps = {k: res["parts"][k]["score"] for k in P.PART_ORDER if res["parts"][k]["score"] is not None}
        _, x, _, _ = P.combine(ps, res["condition"], res["occasion"], occasion, res["care_or_strain"])
        res["raw_unrounded"] = x
    return res


def _working(reading):
    """The scored garments (rubric._prepare + _normalize: unsure and accessories out, hidden shoes out, open shirts
    re-filed as layers) as a reading, so `when` and every edit see what the engine judges. Scoring it gives the same
    result as scoring the reading itself (the generator checks)."""
    scene, garments, _ = R._prepare(copy.deepcopy(reading))
    w = {"scene": scene, "garments": R._normalize(garments)}
    if reading.get("held_items"):
        w["held_items"] = copy.deepcopy(reading["held_items"])
    return w


def _first(r, cat):
    return next((g for g in r["garments"] if g.get("category") == cat), None)


def _idx(r, cat):
    return next((i for i, g in enumerate(r["garments"]) if g.get("category") == cat), None)


def _match(g, where):
    for k, v in where.items():
        if k.endswith("_not_in"):
            if g.get(k[:-7]) in v:
                return False
        elif k.endswith("_in"):
            if g.get(k[:-3]) not in v:
                return False
        elif g.get(k) != v:
            return False
    return True


def _quiet(r):
    """All-neutral, all-solid clothes (the paper test's standout what-if, parts2_test._quiet)."""
    main = [g for g in r["garments"] if g.get("category") in ("top", "outerwear", "bottom")]
    if not main:
        return False
    for g in main:
        c = g.get("color_family")
        if R.is_bright(g) or (c not in R.NEUTRALS and c not in (None, "multicolor") and not str(c).startswith("denim")):
            return False
        if g.get("pattern") not in (None, "solid"):
            return False
    return True


def _peek_under(r):
    """The piece a longer, untucked layer hangs out under (v9 fixes, #232): the first upper piece that ends at the belt
    or above with a later one ending below it. Outer layers come first, then tops in reading order. None if none."""
    gs = r["garments"]
    upper = [g for g in gs if g.get("category") == "outerwear"] + [g for g in gs if g.get("category") == "top"]
    for i, a in enumerate(upper):
        if a.get("length") in ("cropped", "at_belt"):
            for b in upper[i + 1:]:
                if b.get("length") in ("mid_fly", "below_crotch") and b.get("tucked") not in ("full", "half"):
                    return a
    return None


KNITS = {"sweater", "cardigan", "quarter_zip", "knit_polo"}   # v10 tip_knit: knit tops (not a tee or a woven shirt)


def _knit_on_knit(r):
    """v10 (creators-rules B13, Tim: "contrast the textures"): two knit pieces in the upper half (a cardigan, sweater,
    quarter-zip or knit polo worn over another), tops and outer layers alike."""
    return sum(1 for g in r["garments"] if g.get("category") in ("top", "outerwear") and g.get("subcategory") in KNITS) >= 2


def _light_on_light(base):
    """v1.9 tip_anchor (#376): the scored card has the light-on-light charge on Color ([COL-12])."""
    return any(x["check"] == "CL2_light_on_light" for x in base["parts"]["color"]["reasons"])


def _reads_as(r):
    """The styles the working outfit reads as, pick-free (picks never move a fix's gain or whether it shows)."""
    return R.detect_styles(r["garments"], {})["detected"]


def _when_ok(when, r, occasion, warm, base=None):
    for k, v in (when or {}).items():
        if k == "light_on_light":                # read from the scored card (base), not the edited outfit
            if v and not (base is not None and _light_on_light(base)):
                return False
        elif k == "reads_as_in":
            if v and not any(s in v for s in _reads_as(r)):
                return False
        elif k == "peek_under":
            if v and _peek_under(r) is None:
                return False
        elif k == "knit_on_knit":
            if v and not _knit_on_knit(r):
                return False
        elif k == "not_street_stack":            # #221: a stack on wide jeans is the streetwear look, not a fault
            b = _first(r, "bottom")
            if v and b is not None and b.get("leg_shape") in R.LOOSE and "streetwear" in _reads_as(r):
                return False
        elif k == "not_warm":
            if v and warm:
                return False
        elif k == "no_outer":
            if v and _first(r, "outerwear") is not None:
                return False
        elif k == "occasion_in":
            if occasion not in v:
                return False
        elif k == "quiet":
            if v and not _quiet(r):
                return False
        else:
            slot, cond = k.split(".", 1)
            g = _first(r, slot)
            val = g.get(cond[:-7] if cond.endswith("_not_in") else cond[:-3]) if g is not None else None
            if cond.endswith("_not_in"):
                if val in v:
                    return False
            elif cond.endswith("_in"):
                if val not in v:
                    return False
            else:
                raise ValueError(k)
    return True


def _expand(op, r0, closet):
    """One edit op -> list of (reading, info) or ("ALTS", [readings], info) (worst case is scored)."""
    kind = op["op"]
    rules = CATALOG["rules"]
    out = []
    if kind == "set":
        i = _idx(r0, op["slot"])
        if i is None:
            return []
        r = copy.deepcopy(r0); r["garments"][i].update(copy.deepcopy(op["fields"]))
        return [(r, {"name": K.name(r0["garments"][i])})]
    if kind == "set_where":
        hits = [i for i, g in enumerate(r0["garments"]) if _match(g, op["where"])]
        if not hits:
            return []
        r = copy.deepcopy(r0)
        for i in hits:
            r["garments"][i].update(copy.deepcopy(op["fields"]))
        return [(r, {"name": K.name(r0["garments"][hits[0]])})]
    if kind == "set_visible_layer":
        i = _idx(r0, "outerwear")
        i = _idx(r0, "top") if i is None else i
        if i is None:
            return []
        r = copy.deepcopy(r0); r["garments"][i].update(copy.deepcopy(op["fields"]))
        return [(r, {"name": K.name(r0["garments"][i])})]
    if kind == "fit_culprit":
        for i, g in enumerate(r0["garments"]):
            cat = g.get("category")
            if cat not in ("top", "outerwear", "bottom"):
                continue
            sleeves = cat != "bottom" and g.get("sleeve_end") == "covers_hand" and g.get("subcategory") not in rules["shortSleeve"]
            strain = g.get("strain") == "clear"
            if not (sleeves or strain):
                continue
            r = copy.deepcopy(r0); h = r["garments"][i]
            if sleeves:
                h["sleeve_end"] = "at_wrist"
                if (h.get("volume") or 3) >= 4 and h.get("subcategory") not in rules["keepVolume"]:
                    h["volume"] = 3
            if strain:
                h["strain"] = "none"
            out.append((r, {"name": K.name(g)}))
        return out
    if kind == "neutral_color":
        for i, g in enumerate(r0["garments"]):
            cat = g.get("category")
            if cat not in rules["neutralFor"]:
                continue
            c = g.get("color_family")
            if c in R.NEUTRALS or c is None:
                continue
            r = copy.deepcopy(r0); r["garments"][i].update({"color_family": rules["neutralFor"][cat], "saturation": "na"})
            out.append((r, {"name": K.name(g)}))
        return out
    if kind == "plain_pattern":
        for i, g in enumerate(r0["garments"]):
            if g.get("category") not in ("top", "outerwear", "bottom") or g.get("pattern") in (None, "solid"):
                continue
            r = copy.deepcopy(r0); r["garments"][i].update({"pattern": "solid", "pattern_scale": "na"})
            out.append((r, {"name": K.name(g)}))
        return out
    if kind in ("swap_closet", "add_closet"):
        slot = op["slot"]
        i = _idx(r0, slot)
        if kind == "swap_closet" and i is None:
            return []
        cur = r0["garments"][i] if i is not None else None
        for it in closet:
            if it["slot"] != K.SLOT_TO_CLOSET[slot] or it["garment"].get("subcategory") in rules["closetSkip"]:
                continue                                       # a piece whose type was never read can't promise a score
            g = copy.deepcopy(it["garment"])
            if kind == "swap_closet":
                if g.get("subcategory") == cur.get("subcategory") and K.fam(g.get("color_family")) == K.fam(cur.get("color_family")):
                    continue                                   # that's the piece he's already wearing
                for k in rules["keepOnSwap"]:                  # how he wears it comes from the photo
                    if k in cur and g.get("category") == cur.get("category"):
                        g[k] = cur[k]
                for k in rules["ownOnSwap"]:                   # the piece's own cut, when it was read (v1.8, #372)
                    if k in cur and g.get("category") == cur.get("category") and g.get(k) in (None, "na"):
                        g[k] = cur[k]
                r = copy.deepcopy(r0); r["garments"][i] = g
            else:
                r = copy.deepcopy(r0); r["garments"].append(g)
            out.append((r, {"name": K.name(g), "item": it["name"], "item_id": it["id"]}))
        return out
    if kind == "add_held":
        held = [h for h in r0.get("held_items", []) if h.get("category") == op["category"]]
        if not held:
            return []
        r = copy.deepcopy(r0)
        r["garments"].insert(1, copy.deepcopy(held[0]))
        r["held_items"] = [copy.deepcopy(h) for h in r0["held_items"] if h is not held[0]]
        return [(r, {"name": K.name(held[0])})]
    if kind == "add":
        alts = []
        for gg in op["garments"]:
            r = copy.deepcopy(r0); r["garments"].append(K.G(gg["category"], gg["subcategory"], gg["color_family"])); alts.append(r)
        info = {"name": K.name(op["garments"][0])}
        return [(alts[0], info)] if len(alts) == 1 else [("ALTS", alts, info)]
    raise ValueError(kind)


def _blocked(base, r, warm):
    """#162's hard rules, on the edited reading: no layer added and no boots on a warm day; no boots with shorts;
    never one everyday sneaker for another."""
    rules = CATALOG["rules"]
    n_out = lambda x: sum(1 for g in x["garments"] if g.get("category") == "outerwear")  # noqa: E731
    if warm and n_out(r) > n_out(base):
        return True
    s0, s1 = _first(base, "footwear"), _first(r, "footwear")
    if s1 is not None and (s0 is None or s1.get("subcategory") != s0.get("subcategory")):
        if s1.get("subcategory") in rules["boots"]:
            b = _first(r, "bottom")
            if warm or (b is not None and b.get("subcategory") in rules["shorts"]):
                return True
        if s0 is not None and s0.get("subcategory") in rules["everydaySneakers"] and s1.get("subcategory") in rules["everydaySneakers"]:
            return True
    return False


def _look(base_sl, over):
    if not over:
        return base_sl["input"]
    d = {"peek": base_sl["peek"], "rests_on_shoe": base_sl["rests_on_shoe"]}
    d.update(over)
    return d


def _changes(base, res):
    """Per part: (before score, after score, before display, after display) for parts live in both."""
    out = []
    for k in P.PART_ORDER:
        a, b = base["parts"][k], res["parts"].get(k)
        if b is None or a["score"] is None or b["score"] is None:
            continue
        out.append((k, a["score"], b["score"], a["display"], b["display"]))
    return out


def _raises(base, res):
    """Parts whose score rose, by weighted size (ties: part order): [{part, from, to}] with half-point displays."""
    ch = [(k, P.WEIGHTS[k] * (s1 - s0), d0, d1) for k, s0, s1, d0, d1 in _changes(base, res) if s1 > s0]
    ch.sort(key=lambda x: (-x[1], P.PART_ORDER.index(x[0])))
    return [{"part": k, "from": d0, "to": d1} for k, _, d0, d1 in ch]


def _raises_line(base, res, raises):
    c = CATALOG["copy"]
    if len(raises) >= 2:
        return c["raisesTwo"].replace("{part}", P.PART_NAMES[raises[0]["part"]]).replace("{part2}", P.PART_NAMES[raises[1]["part"]])
    if len(raises) == 1:
        x = raises[0]
        if x["to"] > x["from"]:
            return c["raisesOne"].replace("{part}", P.PART_NAMES[x["part"]]).replace("{to}", f"{x['to']:g}")
        return c["raisesOneSame"].replace("{part}", P.PART_NAMES[x["part"]])
    if res["condition"]["deduction"] < base["condition"]["deduction"]:
        return c["raisesCondition"]
    o0, o1 = base["occasion"], res["occasion"]
    if o1["deduction"] < o0["deduction"] or (o0["ceiling"] is not None and (o1["ceiling"] is None or o1["ceiling"] > o0["ceiling"])):
        return c["raisesOccasion"]
    return ""


def _fill(s, info):
    return s.replace("{name}", info.get("name", "piece")).replace("{item}", info.get("item", ""))


def _shift(base, r):
    """How far a shoe change moves the shoes' dressiness (#160's tie-break: the smallest change wins). 0 otherwise."""
    s0, s1 = _first(base, "footwear"), _first(r, "footwear")
    if s0 is None or s1 is None or s0.get("subcategory") == s1.get("subcategory"):
        return 0.0
    return abs(R.formality(s1) - R.formality(s0))


def _evaluate(cand, w, closet, occasion, styles, boldness, base_sl, warm, engine="v15", season=None):
    """All the readings the candidate's edits make, scored; the best one (max raw), or None. An 'ALTS' edit is scored
    at its worst alternative (never over-promise)."""
    states = [(w, {})]
    for op in cand["edits"]:
        nxt = []
        for r, info in states:
            for o in _expand(op, r, closet):
                if o[0] == "ALTS":
                    nxt.append((o[1], {**info, **o[2]}))
                else:
                    nxt.append((o[0], {**info, **o[1]}))
        states = nxt
        if not states:
            return None
    sl = _look(base_sl, cand.get("look"))
    best = None
    for r, info in states:
        alts = r if isinstance(r, list) else [r]
        worst = None
        for a in alts:
            if a["garments"] == w["garments"] or _blocked(w, a, warm):
                worst = None
                break
            res = _score(a, occasion, styles, sl, boldness, engine, season)
            if res["overall"] is None:
                worst = None
                break
            if worst is None or res["raw_unrounded"] < worst[0]["raw_unrounded"]:
                worst = (res, a)
        if worst is None:
            continue
        if best is None or worst[0]["raw_unrounded"] > best[0]["raw_unrounded"]:
            best = (worst[0], worst[1], info)
    return best


SWAP_KEYS = ("subcategory", "color_family", "pattern", "volume")


def _swapped(w, r):
    """v1.7 (#336): the slots whose first piece the edit replaced (a different kind, color, pattern or roominess, or
    added or removed). A tuck changes none of these, so it never swaps."""
    out = set()
    for slot in SLOTS:
        a, b = _first(w, slot), _first(r, slot)
        if (a is None) != (b is None) or (a is not None and any(a.get(k) != b.get(k) for k in SWAP_KEYS)):
            out.add(slot)
    return out


# T94 (TL5, [TLR-6]): with Tailored among his picks, a fix that clears a tailoring fault leads within its class.
TAILORING_CHECKS = ("FF1_sleeves_tailored", "FF1_sleeves_long", "FF1_cuffs_ribbed", "FF7_pooling",
                    "FF7b_full_break_narrow", "H3_another_world", "GT1_graphic_under_tailoring", "SX1_another_look")
HEM_CHECKS = ("FF7_pooling", "FF7b_full_break_narrow")      # a tailoring fault only over dress trousers


def _reason_checks(res):
    return {x["check"] for part in res["parts"].values() for x in (part.get("reasons") or [])}


def _tailoring_fix(base, res, w):
    """The working outfit w has a tailored jacket (a top or layer), and the fixed card `res` no longer carries a
    tailoring check that `base` carried (as a reason on any part). The hem checks count only over dress trousers."""
    if not any(g.get("category") in ("top", "outerwear") and g.get("subcategory") in R.TL_JACKET for g in w["garments"]):
        return False
    b = _first(w, "bottom")
    trousers = b is not None and b.get("subcategory") in R.TL_TROUSERS
    cleared = _reason_checks(base) - _reason_checks(res)
    return any(k in cleared and (k not in HEM_CHECKS or trousers) for k in TAILORING_CHECKS)


def _picks(styles):
    """His picks in order (the 1st pick first), from [name, weight] pairs or a dict; weight 0 is not a pick."""
    return [k for k, wt in styles.items() if wt and wt > 0]


def _pick_rank(res, picks):
    """The index of his earliest pick the fixed outfit reads as; len(picks) when none (or no picks)."""
    det = res.get("detected_styles") or []
    return next((i for i, k in enumerate(picks) if k in det), len(picks))


def suggest_parts_fixes(reading, occasion="everyday", styles=None, boldness="a_little", second_look=None, closet=(),
                        warm=False, first_check=False, exclude=(), engine="v15", season=None):
    """Up to 3 parts-engine fixes, a Smaller step and a Next level line. styles: [name, weight] pairs or a dict.
    T69: engine "v16" scores every candidate with v16 and the card's season (the app passes warm = season == "warm")."""
    if isinstance(styles, list):
        styles = {k: wt for k, wt in styles}
    styles = dict(styles or {})
    picks = _picks(styles)
    tailored_pick = "tailored" in picks                  # TL5: any position, weight > 0
    c = CATALOG["copy"]
    classes = CATALOG["classes"]
    base = _score(reading, occasion, styles, second_look, boldness, engine, season)
    out = {"base_overall": base["overall"], "base_raw": None, "fixes": [], "smaller_step": None, "next_level": None,
           "none_line": None}
    if base["overall"] is None:
        return out
    out["base_raw"] = round(base["raw_unrounded"], 6)
    w = _working(reading)
    bsl = dict(base["second_look"]); bsl["input"] = second_look
    lounge = occasion in CATALOG["rules"]["loungeOccasions"]
    allowed = {"free"} if first_check else set(classes)

    cands = []
    for order, cand in enumerate(CATALOG["candidates"]):
        if cand["id"] in exclude:
            continue
        if lounge and not cand.get("lounge"):
            continue
        if not _when_ok(cand.get("when"), w, occasion, warm):
            continue
        ev = _evaluate(cand, w, closet, occasion, styles, boldness, bsl, warm, engine, season)
        if ev is None:
            continue
        res, r, info = ev
        cl = classes[cand["class"]]
        x = {"id": cand["id"], "group": cand["group"], "class": cand["class"], "rank": cl["rank"], "effort": cand["effort"],
             "free": cl["free"], "to": res["overall"], "to_raw": round(res["raw_unrounded"], 6),
             "gain": res["overall"] - base["overall"], "raw_gain": round(res["raw_unrounded"] - base["raw_unrounded"], 6),
             "item_id": info.get("item_id"), "order": order, "shift": _shift(w, r), "pick_rank": _pick_rank(res, picks),
             "tailor_lead": 0 if tailored_pick and _tailoring_fix(base, res, w) else 1}
        x["copy"] = _fill(cand["copy"], info)
        x["tag"] = cl["tag"] + (f" · {cand['detail']}" if cand.get("detail") else "")
        x["raises"] = _raises(base, res)
        x["raises_line"] = _raises_line(base, res, x["raises"])
        x["step"] = _fill(cand["step"], info)
        x["drops"] = any(d1 < d0 for _, _, _, d0, d1 in _changes(base, res))
        x["lifts_display"] = any(d1 > d0 for _, _, _, d0, d1 in _changes(base, res))
        x["tucks"] = set(cand.get("tucks") or ())
        x["swaps"] = _swapped(w, r)
        x["anchors"] = _light_on_light(base) and not _light_on_light(res)   # v1.9: the fix clears light on light
        cands.append(x)

    # TL5: tailor_lead after the class, before the gain; with no Tailored pick it is 1 everywhere (today's order)
    key = lambda x: (x["rank"], x["tailor_lead"], -x["gain"], x["pick_rank"], -x["raw_gain"], x["effort"], x["shift"], x["order"])  # noqa: E731

    def pick(allowed_classes):
        fixes = [x for x in cands if x["gain"] >= 0.5 and x["class"] in allowed_classes]
        # v1.7 (#336): tuck it in, not swap it. The best tuck hides fixes that swap a piece it tucks to raise the same
        # parts (another way to fix the shape) for no more gain; a swap that fixes something else (a color) stays.
        tk = next((x for x in sorted(fixes, key=key) if x["tucks"]), None)
        if tk is not None:
            tk_parts = {p["part"] for p in tk["raises"]}
            fixes = [x for x in fixes if x is tk or not (x["swaps"] & tk["tucks"] and x["gain"] <= tk["gain"]
                                                         and tk_parts & {p["part"] for p in x["raises"]})]
        kept = []
        for grp in dict.fromkeys(x["group"] for x in sorted(fixes, key=key)):
            mx = None             # sorted by class first, so a later entry is a later class or a smaller gain
            for x in sorted((y for y in fixes if y["group"] == grp), key=key):
                if mx is None or x["gain"] > mx:
                    kept.append(x); mx = x["gain"]
        kept.sort(key=key)
        picked, tailor = [], 0
        for x in kept:
            if len(picked) == CATALOG["rules"]["maxFixes"]:
                break
            if x["class"] == "tailor":
                if tailor >= CATALOG["rules"]["maxTailor"]:
                    continue
                tailor += 1
            picked.append(x)
        return picked

    picked = pick(allowed)
    if first_check and not picked:          # at least one free fix whenever one exists (v4's first-check rule)
        picked = pick({"free", "own"})[:1]
    shown = {x["id"] for x in picked}

    # the Smaller step: raises a part's half point, the rounded score doesn't move, nothing drops
    steps = [x for x in cands if x["class"] in allowed and x["gain"] == 0 and x["raw_gain"] > 0 and x["lifts_display"]
             and not x["drops"] and x["id"] not in shown]
    if steps:
        groups = {x["group"] for x in picked}       # a smaller version of a shown move first, then the largest raw gain
        s = sorted(steps, key=lambda x: (x["group"] not in groups, -x["raw_gain"], x["rank"], x["effort"], x["shift"], x["order"]))[0]
        top = next(p for p in s["raises"] if p["to"] > p["from"])
        out["smaller_step"] = {"id": s["id"], "class": s["class"], "item_id": s["item_id"], "part": top["part"],
                               "from": top["from"], "to": top["to"], "raw_gain": s["raw_gain"],
                               "line": c["smallerStep"].replace("{step}", s["step"]).replace("{part}", P.PART_NAMES[top["part"]])
                               .replace("{to}", f"{top['to']:g}").replace("{score}", f"{base['overall']:.1f}")}

    # v9 (#232): the stylist's tips (a cuff, a hem, the layer underneath) show with no number when there's no fix,
    # ahead of a Smaller step that means buying something and ahead of the generic Next level lines
    # v1.7 (#336): a tuck tip by shirt type also shows next to fixes, when no tuck fix is shown
    # v1.9 (#376): so does an anchoring tip, when no fix shown clears the light on light
    tip_shown = False
    tuck_shown = any(x["group"] == "tuck" for x in picked)
    anchored = any(x["anchors"] for x in picked)
    if not lounge:
        step = out["smaller_step"]
        if step is None or not classes[step["class"]]["free"] or step["class"] == "own":
            for nl in CATALOG["nextLevel"]:
                if not nl.get("always"):
                    continue
                if picked and not ((nl.get("tuck") and not tuck_shown) or (nl.get("anchor") and not anchored)):
                    continue
                if not _when_ok(nl.get("when"), w, occasion, warm, base):
                    continue
                piece = (_peek_under(w) if nl["when"].get("peek_under")
                         else _first(w, nl.get("name") or "bottom"))
                out["next_level"] = {"id": nl["id"], "part": nl["part"], "line": _fill(nl["copy"], {"name": K.name(piece)}), "style": None}
                out["smaller_step"] = None
                tip_shown = True
                break

    if not picked and not lounge and not tip_shown:
        step = out["smaller_step"]
        step_group = next((x["group"] for x in cands if step and x["id"] == step["id"]), None)
        for nl in CATALOG["nextLevel"]:
            if nl.get("always"):
                continue
            st = nl.get("style")
            if st is not None:                    # his first pick's path to 8
                if not picks or st != picks[0] or nl.get("group") == step_group:
                    continue
            elif step is not None:                # the generic lines: no fix and no Smaller step
                continue
            if not _when_ok(nl.get("when"), w, occasion, warm):
                continue
            ev = _evaluate(nl, w, (), occasion, styles, boldness, bsl, warm, engine, season)
            if ev is None:
                continue
            if st is not None and st not in (ev[0].get("detected_styles") or []):
                continue
            part = ev[0]["parts"].get(nl["part"])
            if part and part["display"] is not None and base["parts"][nl["part"]]["display"] is not None \
                    and part["display"] > base["parts"][nl["part"]]["display"]:
                out["next_level"] = {"id": nl["id"], "part": nl["part"], "line": _fill(nl["copy"], ev[2]), "style": st}
                break

    for x in picked:
        for k in ("order", "rank", "step", "drops", "lifts_display", "shift", "pick_rank", "tailor_lead", "tucks", "swaps", "anchors"):
            x.pop(k, None)
    out["fixes"] = picked
    if not picked:
        out["none_line"] = c["dialedIn"] if base["overall"] >= 9.0 else c["noFixes"]
    return out
