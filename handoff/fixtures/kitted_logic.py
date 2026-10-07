"""Reference implementation (Python) of the KittedCore logic AROUND the rubric:
exact scoring wrapper, fix engine, anchored re-check merger, shoe snap / closet pick, corrections, Rotation.

rubric.py stays the source of truth for SCORES. This file is the reference for everything the Swift port
builds on top of it (spec: handoff/04-logic-and-demo-data.md sections 5-8). make_expected.py runs it to
produce the expected fixes / merges / rotation numbers that the Swift tests compare against.
Only imports rubric.py; never modifies it.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, itertools, json, math, os, sys

KEMPT = "/Users/eyu/Desktop/files/Kitted"
sys.path.insert(0, os.path.join(KEMPT, "extraction-test"))
import rubric  # noqa: E402

FIXES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixes.json")))

# ---------------------------------------------------------------- exact scoring
_captured = []
_builtin_round = round


def _capturing_round(x, n=None):
    _captured.append(x)
    return _builtin_round(x, n) if n is not None else _builtin_round(x)


rubric.round = _capturing_round   # module global shadows the builtin inside rubric.score only


def score(reading, occasion="everyday", styles=None, boldness="a_little"):
    """rubric.score on a deep copy, plus the UNROUNDED raw / credit / mistakes doubles.
    styles: list of [name, weight] pairs (order matters for float sums) or a dict."""
    if isinstance(styles, list):
        styles = {k: w for k, w in styles}
    _captured.clear()
    out = rubric.score(copy.deepcopy(reading), occasion=occasion, styles=dict(styles or {}), boldness=boldness)
    if out.get("overall") is not None:
        raw, credit, mistakes = _captured[0], _captured[1], _captured[2]
        out["raw_unrounded"], out["credit_unrounded"], out["mistakes_unrounded"] = raw, credit, mistakes
    return out


# ---------------------------------------------------------------- words, names
def score_word(x):
    if x is None:
        return None
    if x <= 5.5:
        return "Needs a fix"
    if x <= 6.5:
        return "Getting there"
    if x <= 7.5:
        return "Put together"
    if x <= 8.5:
        return "Sharp"
    return "Dialed in"


def partial_label(not_rated):
    if "bottom half" in (not_rated or []):
        return "Partial check: top only"
    if "shoes" in (not_rated or []):
        return "Partial check: shoes not included"
    return None


SUB_NAME = {"white_leather_sneaker": "leather sneakers", "low_profile_sneaker": "low-profile sneakers",
            "canvas_sneaker": "canvas sneakers", "retro_runner": "runners", "performance_runner": "running shoes",
            "chunky_sneaker": "chunky sneakers", "basketball_sneaker": "high-tops", "slides_sandals": "slides",
            "chelsea_boot": "Chelsea boots", "work_boot": "work boots", "dress_shoe": "dress shoes", "suede_chukka": "chukkas",
            "loafer": "loafers", "derby": "derbies", "athletic_shorts": "gym shorts", "drawstring_trousers": "drawstring trousers",
            "suit_trousers": "suit trousers", "oxford_shirt": "oxford", "dress_shirt": "dress shirt", "flannel_shirt": "flannel",
            "graphic_tee": "graphic tee", "quarter_zip": "quarter-zip", "knit_polo": "knit polo", "tank_top": "tank top",
            "suit_jacket": "suit jacket", "sport_coat": "sport coat", "unstructured_blazer": "blazer", "denim_jacket": "denim jacket",
            "chore_coat": "chore coat", "field_jacket": "field jacket", "rain_jacket": "rain jacket", "shell_jacket": "shell jacket",
            "leather_jacket": "leather jacket", "camp_collar_shirt": "camp shirt", "rugby_shirt": "rugby shirt"}


def name(g):
    return SUB_NAME.get(g.get("subcategory"), (g.get("subcategory") or "piece").replace("_", " "))


def G(category, subcategory, color, **kw):
    g = {"category": category, "subcategory": subcategory, "color_family": color, "pattern": "solid", "logo": "none",
         "volume": 3, "leg_shape": "na", "hem": "na", "tucked": "na", "condition": "clean", "certainty": "clear",
         "length": "na", "pattern_scale": "na", "saturation": "na", "sleeve_end": "na", "strain": "none",
         "distressed_by_design": False, "shows_below_outer": False}
    g.update(kw)
    return g


SLOT_TO_CLOSET = {"top": "top", "bottom": "bottom", "footwear": "shoes", "outerwear": "outer"}
CORE = ("top", "bottom", "footwear", "outerwear")


def idx(reading, category):
    return next((i for i, g in enumerate(reading["garments"]) if g.get("category") == category), None)


def fam(c):
    return rubric.FAMILY.get(c, c)


# ---------------------------------------------------------------- fix engine
def _band(styles):
    if isinstance(styles, list):
        styles = {k: w for k, w in styles}
    return rubric.blended_band(styles or {})


def _closet_matches(closet, slot, match, current, styles):
    (vlo, vhi), (llo, lhi) = _band(styles)
    out = []
    for it in closet:
        if it["slot"] != SLOT_TO_CLOSET[slot]:
            continue
        g = it["garment"]
        if current is not None and g["subcategory"] == current.get("subcategory") and fam(g["color_family"]) == fam(current.get("color_family")):
            continue  # that's the piece he's already wearing
        m = match or {}
        if "volume_max" in m and (g.get("volume") or 3) > m["volume_max"]:
            continue
        if m.get("volume_in_band") and not (vlo <= (g.get("volume") or 3) <= vhi):
            continue
        if m.get("leg_in_band"):
            if g.get("leg_shape") not in rubric.LEG_ORDER or not (llo <= rubric.LEG_ORDER.index(g["leg_shape"]) <= lhi):
                continue
        if "leg_in" in m and g.get("leg_shape") not in m["leg_in"]:
            continue
        if "not_subcategory" in m and g["subcategory"] in m["not_subcategory"]:
            continue
        if "color_not_in" in m and g["color_family"] in m["color_not_in"]:
            continue
        if "formality_min" in m and rubric.formality(g) < m["formality_min"]:
            continue
        out.append(it)
    return out


NEUTRAL_FOR = {"top": "white", "outerwear": "navy", "bottom": "navy", "footwear": "white"}
VOLUME_WORD = {1: "fitted", 2: "slim-fit", 3: "regular-fit", 4: "relaxed", 5: "oversized"}


def _expand(op, reading, closet, occasion, styles):
    """Returns a list of (modified_reading, {"name":..., "item":..., "target":...}) for one edit op."""
    r0 = reading
    kind = op["op"]
    res = []
    if kind == "set":
        i = idx(r0, op["slot"])
        if i is None:
            return []
        r = copy.deepcopy(r0); r["garments"][i].update(op["fields"])
        return [(r, {"name": name(r0["garments"][i])})]
    if kind == "set_where":
        hits = [i for i, g in enumerate(r0["garments"]) if all(g.get(k) == v for k, v in op["where"].items())]
        if not hits:
            return []
        r = copy.deepcopy(r0)
        for i in hits:
            r["garments"][i].update(op["fields"])
        return [(r, {"name": name(r0["garments"][hits[0]])})]
    if kind == "alternatives":
        i = idx(r0, op["slot"])
        if i is None:
            return []
        alts = []
        for fields in op["each"]:
            r = copy.deepcopy(r0); r["garments"][i].update(fields); alts.append(r)
        return [("ALTERNATIVES", alts, {"name": name(r0["garments"][i])})]
    if kind == "set_band":
        i = idx(r0, op["slot"])
        if i is None:
            return []
        (vlo, vhi), (llo, lhi) = _band(styles)
        g = r0["garments"][i]
        r = copy.deepcopy(r0)
        if op["field"] == "volume":
            lo, hi = math.ceil(vlo), math.floor(vhi)
            v = g.get("volume") or 3
            t = min(max(v, lo), hi) if lo <= hi else rubric.nearest((vlo + vhi) / 2)
            r["garments"][i]["volume"] = t
            return [(r, {"name": name(g), "target": VOLUME_WORD.get(t, "regular-fit")})]
        if g.get("leg_shape") not in rubric.LEG_ORDER:
            return []
        lo, hi = math.ceil(llo), math.floor(lhi)
        li = rubric.LEG_ORDER.index(g["leg_shape"])
        t = min(max(li, lo), hi) if lo <= hi else rubric.nearest((llo + lhi) / 2)
        r["garments"][i]["leg_shape"] = rubric.LEG_ORDER[t]
        return [(r, {"name": name(g), "target": rubric.LEG_ORDER[t]})]
    if kind in ("swap_closet", "add_closet"):
        slots = [s for s in ("top", "bottom", "footwear") if idx(r0, s) is not None] if op["slot"] == "any_core" else [op["slot"]]
        for s in slots:
            i = idx(r0, s)
            if kind == "swap_closet" and i is None:
                continue
            cur = r0["garments"][i] if i is not None else None
            for it in _closet_matches(closet, s, op.get("match"), cur if kind == "swap_closet" else None, styles):
                r = copy.deepcopy(r0)
                g = copy.deepcopy(it["garment"])
                if kind == "swap_closet":
                    # keep how he wears it (state fields) from the photo, take the item's identity
                    for k in ("hem", "tucked", "length", "sleeve_end"):
                        if k in cur and g.get("category") == cur.get("category"):
                            g[k] = cur[k]
                    r["garments"][i] = g
                else:
                    r["garments"].append(g)
                res.append((r, {"name": name(g), "item": it["name"], "item_id": it["id"]}))
        return res
    if kind == "add_held":
        held = [h for h in r0.get("held_items", []) if h.get("category") == op["category"]]
        if not held:
            return []
        r = copy.deepcopy(r0)
        r["garments"].insert(1, copy.deepcopy(held[0]))
        r["held_items"] = [h for h in r0["held_items"] if h is not held[0]]
        return [(r, {"name": name(held[0])})]
    if kind == "add":
        gg = op["garment"]
        r = copy.deepcopy(r0); r["garments"].append(G(gg["category"], gg["subcategory"], gg["color_family"]))
        return [(r, {"name": name(gg)})]
    if kind == "neutralize_culprit":
        for i, g in enumerate(r0["garments"]):
            c = g.get("category")
            if c not in NEUTRAL_FOR:
                continue
            if g.get("color_family") in rubric.NEUTRALS and g.get("pattern") in (None, "solid"):
                continue
            r = copy.deepcopy(r0)
            r["garments"][i].update({"color_family": NEUTRAL_FOR[c], "saturation": "na", "pattern": "solid", "pattern_scale": "na"})
            res.append((r, {"name": name(g)}))
        return res
    if kind == "upgrade_culprit":
        core = [(rubric.formality(g), i) for i, g in enumerate(r0["garments"]) if g.get("category") in ("top", "bottom", "footwear")]
        if not core:
            return []
        fmin = min(core)[0]
        lo = rubric.OCCASION_TARGET.get(occasion, (2, 3))[0]
        for f, i in core:
            if f != fmin:
                continue
            g = r0["garments"][i]; c = g["category"]
            if op.get("from_closet"):
                for it in _closet_matches(closet, c, {"formality_min": f + 0.5}, g, styles):
                    r = copy.deepcopy(r0); r["garments"][i] = copy.deepcopy(it["garment"])
                    res.append((r, {"name": name(g), "item": it["name"], "item_id": it["id"]}))
            else:
                up = {"top": "oxford_shirt", "bottom": "chinos",
                      "footwear": "loafer" if lo >= 3.5 else "white_leather_sneaker"}[c]
                r = copy.deepcopy(r0); r["garments"][i].update({"subcategory": up})
                if c == "bottom" and r["garments"][i].get("leg_shape") in (None, "na"):
                    r["garments"][i]["leg_shape"] = "straight"
                res.append((r, {"name": name(g)}))
        return res
    if kind == "remove_most_formal_outer":
        outs = [(rubric.formality(g), i) for i, g in enumerate(r0["garments"]) if g.get("category") == "outerwear"]
        if not outs:
            return []
        i = max(outs)[1]
        r = copy.deepcopy(r0); g = r["garments"].pop(i)
        return [(r, {"name": name(g)})]
    raise ValueError(kind)


def _evaluate(option, reading, closet, occasion, styles, boldness):
    """Apply an option's edits (chained) and return the scored outcome, or None if it doesn't apply."""
    if "closet_requires" in option:
        cr = option["closet_requires"]
        if not any(it["slot"] == SLOT_TO_CLOSET[cr["slot"]] and it["garment"]["subcategory"] in cr["subcategory_in"] for it in closet):
            return None
    if option.get("when", {}).get("leg_too_wide"):
        i = idx(reading, "bottom")
        (_, _), (llo, lhi) = _band(styles)
        if i is None or reading["garments"][i].get("leg_shape") not in rubric.LEG_ORDER or rubric.LEG_ORDER.index(reading["garments"][i]["leg_shape"]) <= lhi:
            return None
    states = [(reading, {})]
    for op in option["edits"]:
        nxt = []
        for r, info in states:
            for out in _expand(op, r, closet, occasion, styles):
                if out[0] == "ALTERNATIVES":
                    nxt.append((out[1], {**info, **out[2], "alternatives": True}))
                else:
                    nxt.append((out[0], {**info, **out[1]}))
        states = nxt
        if not states:
            return None
    best = None
    for r, info in states:
        if info.get("alternatives"):
            scored = [(score(a, occasion, styles, boldness), a) for a in r]
            sc, rr = min(scored, key=lambda t: t[0]["raw_unrounded"])   # conservative: never over-promise
        else:
            sc, rr = score(r, occasion, styles, boldness), r
        if sc.get("overall") is None:
            continue
        if best is None or sc["raw_unrounded"] > best[0]["raw_unrounded"]:
            best = (sc, rr, info)
    return best


def _copy_line(option, info):
    s = option["copy"].replace("{name}", info.get("name", "piece")).replace("{item}", info.get("item", "")).replace("{target}", info.get("target", ""))
    d = option.get("detail", "").replace("{target}", info.get("target", ""))
    tier = option["tier"]
    tag = {"adjust": "Free" + (f" · {d}" if d else ""), "swapFromCloset": "Free · from your closet",
           "changeInto": "Free if you own one", "tailor": "Tailor" + (f" · {d}" if d else " ~$15"),
           "buy": "Buy"}[tier]
    return s, tag


def suggest_fixes(reading, occasion="everyday", styles=None, boldness="a_little", closet=(), first_check=False):
    base = score(reading, occasion, styles, boldness)
    out = {"base_overall": base.get("overall"), "base_raw": base.get("raw_unrounded"), "fixes": [], "next_level": [], "tips": []}
    if base.get("overall") is None:
        return out
    for a in base["advice"]:
        if a.startswith("next level:"):
            out["next_level"].append(FIXES["next_level"].get(a, a))
        else:
            out["tips"].append(FIXES["tips"].get(a, a))
    fired = list(dict.fromkeys(base["rules_fired"]))
    if fired:
        targets = fired
    else:   # clean outfit: credit fixes only (K3 is never a fix, it's the "Next level" tip)
        targets = [k for k in ("K1_layered", "K2_elevated_piece", "K4_shoes_complement") if k not in base["credits"]]
        if occasion in rubric.LOUNGE_OK:   # at the gym or home, a clean outfit has nothing to fix
            targets = []
        if "shoes" in base["not_rated"] or "bottom half" in base["not_rated"]:
            targets = [t for t in targets if t != "K4_shoes_complement"]
    tiers = FIXES["tiers"]

    def candidates(allowed):
        cands = []
        for order, t in enumerate(targets):
            best = None
            for opt in FIXES["targets"].get(t, []):
                if opt["tier"] not in allowed:
                    continue
                ev = _evaluate(opt, reading, closet, occasion, styles, boldness)
                if not ev:
                    continue
                sc, rr, info = ev
                gain = sc["overall"] - base["overall"]
                raw_gain = sc["raw_unrounded"] - base["raw_unrounded"]
                if gain < 0.5:
                    continue
                eff = tiers[opt["tier"]]["effort"]
                c = {"target": t, "tier": opt["tier"], "effort": eff, "free": tiers[opt["tier"]]["free"],
                     "to": sc["overall"], "to_raw": round(sc["raw_unrounded"], 6), "gain": gain, "raw_gain": round(raw_gain, 6),
                     "edits": opt["edits"], "item_id": info.get("item_id"), "order": order}
                c["copy"], c["tag"] = _copy_line(opt, info)
                if best is None or (raw_gain / eff, -eff) > (best["raw_gain"] / best["effort"], -best["effort"]):
                    best = c
            if best:
                cands.append(best)
        return cands

    allowed = {"adjust"} if first_check else set(tiers)
    cands = candidates(allowed)
    if first_check and not cands:          # at least one free fix whenever any fix exists
        cands = candidates({"adjust", "changeInto"})[:1]
    cands.sort(key=lambda c: (-c["raw_gain"] / c["effort"], c["effort"], c["order"]))
    best_free = max((c["to"] for c in cands if c["free"]), default=None)
    picked = []
    for c in cands:
        if len(picked) == 3:
            break
        if c["tier"] == "buy" and (any(p["tier"] == "buy" for p in picked) or (best_free is not None and best_free >= 7.0)):
            continue
        picked.append(c)
    if cands and not any(p["free"] for p in picked) and any(c["free"] for c in cands):
        f = next(c for c in cands if c["free"])
        picked = (picked[:2] + [f]) if len(picked) == 3 else picked + [f]
    picked.sort(key=lambda c: (not c["free"], -c["gain"], c["effort"]))
    for c in picked:
        c.pop("order", None)
    out["fixes"] = picked
    if not picked:
        out["dialed_in"] = "This is dialed in. Nothing to fix."
    return out


def apply_fix(reading, fix, closet=(), occasion="everyday", styles=None):
    """'Didn't catch the change? Tell me': apply the fix's edits to the FIRST reading (source userConfirmed)."""
    opt = {"edits": fix["edits"], "tier": fix["tier"]}
    states = [reading]
    for op in opt["edits"]:
        nxt = []
        for r in states:
            for out in _expand(op, r, closet, occasion, styles):
                if out[0] == "ALTERNATIVES":
                    nxt.append(out[1][0])
                else:
                    if fix.get("item_id") and out[1].get("item_id") not in (None, fix["item_id"]):
                        continue
                    nxt.append(out[0])
        states = nxt
    return states[0] if states else None


def fix_targets(fixes):
    """Reading fields a card's fixes touch: 'category' = whole slot, 'category.field' = one field."""
    t = set()
    for f in fixes:
        for op in f["edits"]:
            k = op["op"]
            if k in ("set",):
                t |= {f'{op["slot"]}.{x}' for x in op["fields"]}
            elif k == "set_where":
                t |= {f'*.{x}' for x in op["fields"]}
            elif k in ("swap_closet", "alternatives", "upgrade_culprit"):
                t.add(op.get("slot", "*"))
            elif k in ("add_held", "add", "add_closet", "remove_most_formal_outer"):
                t.add(op.get("category") or op.get("slot") or op.get("garment", {}).get("category") or "outerwear")
            elif k == "set_band":
                t.add(f'{op["slot"]}.{op["field"]}')
            elif k == "neutralize_culprit":
                t |= {"*.color_family", "*.pattern", "*.pattern_scale", "*.saturation"}
    return t


# ---------------------------------------------------------------- anchored re-check
STATE_FIELDS = ("hem", "tucked", "length", "sleeve_end", "condition", "strain", "shows_below_outer")


def recheck_merge(first, new, targets, occasion="everyday", styles=None, boldness="a_little"):
    """RecheckMerger. first/new are v3 readings; targets from fix_targets(). Returns (merged, notes)."""
    notes = []
    merged = {"scene": copy.deepcopy(first["scene"]), "garments": []}
    new_scene = new["scene"]

    def is_target(cat, field=None):
        if cat in targets or "*" in targets:
            return True
        return field is not None and (f"{cat}.{field}" in targets or f"*.{field}" in targets)

    def hidden_in_new(cat):
        if cat == "footwear" and not new_scene.get("shoes_visible", True):
            return True
        return cat in ("bottom", "footwear") and new_scene.get("framing") == "upper_only"

    by_cat = lambda r, c: [g for g in r["garments"] if g.get("category") == c]
    pending_checks = []
    for g in first["garments"]:
        c = g.get("category")
        if c not in CORE:
            merged["garments"].append(copy.deepcopy(g))
    for c in CORE:
        F, N = by_cat(first, c), by_cat(new, c)
        if is_target(c) and not (hidden_in_new(c) and not N):
            merged["garments"] += copy.deepcopy(N)
            if [x.get("subcategory") for x in F] != [x.get("subcategory") for x in N]:
                notes.append(f"changed: {c}")
            continue
        for i, f in enumerate(F):
            n = N[i] if i < len(N) else None
            if n is None:
                merged["garments"].append(copy.deepcopy(f))      # missed or hidden: keep the first reading
                continue
            if n.get("subcategory") != f.get("subcategory") or fam(n.get("color_family")) != fam(f.get("color_family")):
                merged["garments"].append(copy.deepcopy(n)); notes.append(f"swapped: {name(f)} -> {name(n)}")
                continue
            g = copy.deepcopy(f)
            for k in STATE_FIELDS:
                if is_target(c, k) and k in n:
                    g[k] = n[k]
                elif n.get(k) != f.get(k) and n.get("certainty") == "clear":
                    pending_checks.append((c, i, k, n[k]))
            merged["garments"].append(g)
        for n in N[len(F):]:
            if n.get("certainty") == "clear":
                merged["garments"].append(copy.deepcopy(n)); notes.append(f"new item: {name(n)}")
        if c == "footwear" and not first["scene"].get("shoes_visible", True) and new_scene.get("shoes_visible", True) and N:
            merged["scene"]["shoes_visible"] = True
            if not F:
                notes.append("shoes now in the photo")
    # a non-target state change counts only if the new reading is sure AND it is a new problem
    base = score(merged, occasion, styles, boldness)
    for c, i, k, v in pending_checks:
        trial = copy.deepcopy(merged)
        gi = [j for j, g in enumerate(trial["garments"]) if g.get("category") == c][i]
        trial["garments"][gi][k] = v
        sc = score(trial, occasion, styles, boldness)
        new_rules = [r for r in sc.get("rules_fired", []) if r not in base.get("rules_fired", [])]
        if new_rules:
            merged = trial; base = sc
            notes.append(f"new problem: {c}.{k} = {v} ({', '.join(new_rules)})")
    return merged, notes


# ---------------------------------------------------------------- partial checks
def merge_shoe_snap(first, snap):
    """Shoe snap: replace the footwear slot; take bottom.hem from the snap if it read one."""
    r = copy.deepcopy(first)
    r["garments"] = [g for g in r["garments"] if g.get("category") != "footwear"]
    shoes = [g for g in snap["garments"] if g.get("category") == "footwear"]
    r["garments"] += copy.deepcopy(shoes[:1])
    sb = next((g for g in snap["garments"] if g.get("category") == "bottom"), None)
    bi = idx(r, "bottom")
    if sb and bi is not None and sb.get("hem") not in (None, "na"):
        r["garments"][bi]["hem"] = sb["hem"]
    r["scene"]["shoes_visible"] = bool(shoes)
    return r


def merge_bottom_snap(first, snap):
    r = copy.deepcopy(first)
    r["garments"] = [g for g in r["garments"] if g.get("category") not in ("bottom", "footwear")]
    r["garments"] += copy.deepcopy([g for g in snap["garments"] if g.get("category") in ("bottom", "footwear")])
    r["scene"]["framing"] = "full_body"
    r["scene"]["shoes_visible"] = any(g.get("category") == "footwear" for g in snap["garments"])
    return r


def pick_shoes_from_closet(first, item):
    r = copy.deepcopy(first)
    r["garments"] = [g for g in r["garments"] if g.get("category") != "footwear"]
    r["garments"].append(copy.deepcopy(item["garment"]))
    r["scene"]["shoes_visible"] = True      # bottom.hem stays as read (usually 'na' = unknown, so hem rules skip)
    return r


# ---------------------------------------------------------------- corrections
def apply_correction(reading, garment_index, field, value):
    r = copy.deepcopy(reading)
    r["garments"][garment_index][field] = value
    return r


def correction_line(before, after):
    if before == after:
        return f"Score stays {after:.1f}"
    d = after - before
    return f"Updated {after:.1f} {'↑' if d > 0 else '↓'}{abs(d):.1f}"


# ---------------------------------------------------------------- Rotation
HARD_RULES = {"C1a_too_many_accent_colors", "C1b_too_many_colors", "C3_bright_clash", "C4a_same_pattern_same_scale",
              "C4b_three_plus_patterns", "B1_too_many_focal_points", "P2_big_top_skinny_leg", "P3_everything_oversized",
              "S1_bulky_shoe_narrow_leg", "S2_shoes_too_casual_for_outfit", "O4_loungewear_out"}


def outfit_reading(items):
    gs = []
    for it in items:
        g = copy.deepcopy(it["garment"])
        if g["category"] == "bottom":
            g["hem"] = "slight_break"
        if g["category"] == "top":
            g["tucked"], g["length"] = "none", "at_belt"
        gs.append(g)
    return {"scene": {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False,
                      "lighting": "good", "clothed": "fully"}, "garments": gs}


def outfit_valid(items, styles, boldness="a_little"):
    fs = [rubric.formality(it["garment"]) for it in items]
    if max(fs) - min(fs) > 1.0:
        return False
    (vlo, vhi), (llo, lhi) = _band(styles)
    for it in items:
        g = it["garment"]
        if g["category"] == "top" and g.get("volume") and max(0, vlo - g["volume"], g["volume"] - vhi) >= 1:
            return False
        if g["category"] == "bottom" and g.get("leg_shape") in rubric.LEG_ORDER:
            li = rubric.LEG_ORDER.index(g["leg_shape"])
            if max(0, llo - li, li - lhi) >= 1:
                return False
    sc = score(outfit_reading(items), "everyday", styles, boldness)
    return not (set(sc["rules_fired"]) & HARD_RULES)


def item_key(it):
    g = it["garment"]
    return (it["slot"], g["subcategory"], fam(g["color_family"]), g.get("pattern") or "solid")


def rotation(closet, styles, boldness="a_little", layers=True):
    by = {s: [it for it in closet if it["slot"] == s] for s in ("top", "bottom", "shoes", "outer")}
    seen = set()
    for t, b, s in itertools.product(by["top"], by["bottom"], by["shoes"]):
        for l in ([None] + by["outer"]) if layers else [None]:
            items = [t, b, s] + ([l] if l else [])
            if outfit_valid(items, styles, boldness):
                seen.add((item_key(t), item_key(b), item_key(s), item_key(l) if l else None))
    return len(seen), sorted(seen, key=str)
