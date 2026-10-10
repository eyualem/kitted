#!/usr/bin/env python3
"""Report for the reading batch 1 flip test (b1_test.py). No API calls.

  /usr/bin/python3 b1_analyze.py            -> results/b1/analysis.json + printed tables (report.md is written by hand from these)

Steadiness: a field is "the same" on a photo when all 3 runs give the same value for the primary garment of a slot
(first top, first outerwear, first bottom, first footwear). A slot missing from any run is left out of the field and
counted under "garment set". Accuracy: against b1_labels.csv (written blind, before any batch-1 output was read) and,
for old fields, ruler_labels.csv / hem_labels.csv / leg_labels.csv. A label "unsure" is left out; "a|b" accepts either.
Score: rubric.py (v4.1) at Everyday with the stated test profile (Minimal + Smart casual, 0.5 each; picks don't change
v4 scores). Batch-1 sleeve values are mapped back for scoring: short_sleeve -> na, stacked_at_cuff -> at_wrist,
pushed_up -> above_wrist.
"""
import copy, csv, json, statistics
from collections import Counter, defaultdict
from pathlib import Path

import rubric

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "b1"
PRICE_IN, PRICE_OUT = 0.75 / 1e6, 3.75 / 1e6
STYLES = rubric.parse_styles("minimalist:0.5,smart_casual:0.5")
SLOTS = ("top", "outerwear", "bottom", "footwear")
UPPER = ("top", "outerwear")
SLEEVE_BACK = {"short_sleeve": "na", "stacked_at_cuff": "at_wrist", "pushed_up": "above_wrist"}

OLD_FIELDS = {  # field -> slots it applies to
    "subcategory": SLOTS, "color_family": SLOTS, "pattern": SLOTS, "logo": SLOTS, "volume": SLOTS,
    "condition": SLOTS, "certainty": SLOTS, "pattern_scale": SLOTS, "saturation": SLOTS, "strain": SLOTS,
    "distressed_by_design": SLOTS, "leg_shape": ("bottom",), "hem": ("bottom",), "tucked": ("top",),
    "length": UPPER, "sleeve_end": UPPER, "shows_below_outer": ("top",),
}
SCENE_OLD = ("framing", "shoes_visible", "people_count", "mirror_selfie", "lighting", "clothed")
NEW_FIELDS = {"hem_at": UPPER, "under_shows": ("outerwear",), "shoulder_seam": UPPER,
              "lightness": SLOTS, "sleeve_end_b1": UPPER}

TYPE_GROUPS = {
    "hoodie": {"hoodie", "sweatshirt", "quarter_zip"}, "sweatshirt": {"sweatshirt", "hoodie", "sweater"},
    "tee": {"tee", "graphic_tee", "tank_top", "jersey"}, "tank": {"tank_top", "tee"}, "polo": {"polo", "knit_polo"},
    "shirt": {"oxford_shirt", "dress_shirt", "flannel_shirt", "overshirt", "camp_collar_shirt", "rugby_shirt", "other"},
    "sweater": {"sweater", "quarter_zip", "cardigan", "sweatshirt", "other"},
    "quarter_zip": {"quarter_zip", "sweater", "sweatshirt", "fleece", "hoodie"}, "vest": {"sweater", "cardigan", "other"},
    "blazer": {"blazer", "sport_coat", "unstructured_blazer", "suit_jacket"},
    "suit_jacket": {"suit_jacket", "blazer", "sport_coat", "unstructured_blazer"},
    "chore_coat": {"chore_coat", "overshirt", "denim_jacket", "field_jacket", "other"},
    "fleece": {"fleece", "field_jacket", "shell_jacket", "other"},
    "quilted_jacket": {"field_jacket", "puffer", "bomber", "shell_jacket", "other", "leather_jacket"},
    "denim_jacket": {"denim_jacket"}, "overcoat": {"overcoat"}, "puffer": {"puffer", "other"},
    "overshirt": {"overshirt", "flannel_shirt", "oxford_shirt", "camp_collar_shirt", "chore_coat", "other"},
    "rain_jacket": {"rain_jacket", "shell_jacket", "other"},
}
GROUP_ORDER = ("phone", "oct7", "mirror", "stock")


def load_raw():
    rs = json.loads((OUT / "raw.json").read_text())
    by = defaultdict(list)
    for r in rs:
        if r.get("json"):
            by[(r["arm"], r["photo"])].append(r)
    for k in by:
        by[k].sort(key=lambda r: r["run"])
    return rs, by


def primary(j, cat):
    g = [x for x in (j.get("garments") or []) if x.get("category") == cat]
    return g[0] if g else None


def value(j, slot, field, arm):
    g = primary(j, slot)
    if g is None:
        return None
    if field == "sleeve_end_b1":
        return g.get("sleeve_end")
    v = g.get(field)
    if field == "sleeve_end" and arm == "B1":
        v = SLEEVE_BACK.get(v, v)
    return v


def for_rubric(j, arm):
    if arm != "B1":
        return j
    j = copy.deepcopy(j)
    for g in j.get("garments") or []:
        g["sleeve_end"] = SLEEVE_BACK.get(g.get("sleeve_end"), g.get("sleeve_end"))
    return j


def score(j, arm):
    sc = rubric.score(for_rubric(j, arm), occasion="everyday", styles=STYLES)
    return sc.get("overall")


def labels():
    with (HERE / "b1_labels.csv").open() as f:
        return {r["photo"]: r for r in csv.DictReader(f)}


def accepts(label, v):
    if label is None or label == "" or label == "unsure":
        return None
    opts = set(label.split("|")) - {"unsure"}
    if not opts:
        return None
    return v in opts


def match_upper(j, lab):
    """{'top': garment, 'outer': garment} for the labeled top and outer layer, by type, then by category."""
    ups = [g for g in (j.get("garments") or []) if g.get("category") in UPPER]
    used, out = set(), {}
    for slot, tkey, cat in (("outer", "outer_type", "outerwear"), ("top", "top_type", "top")):
        t = lab.get(tkey)
        if not t or t in ("na", "none"):
            continue
        grp = TYPE_GROUPS.get(t, set())
        # prefer the same category, then any upper garment of the right type, then the category's first garment
        cands = [g for g in ups if id(g) not in used and g.get("subcategory") in grp and g.get("category") == cat]
        cands += [g for g in ups if id(g) not in used and g.get("subcategory") in grp]
        cands += [g for g in ups if id(g) not in used and g.get("category") == cat]
        if cands:
            out[slot] = cands[0]; used.add(id(cands[0]))
    return out


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "–"


def main():
    raw, by = load_raw()
    lab = labels()
    photos = sorted({p for (a, p) in by})
    arms = [a for a in ("A", "B1") if any(k[0] == a for k in by)]
    full = [p for p in photos if all(len(by.get((a, p), [])) >= 3 for a in arms)]
    group = {p: lab[p]["group"] if p in lab else p.split("-")[0] for p in full}
    person = {p: lab[p]["person"] if p in lab else "?" for p in full}
    res = {"photos": len(full), "arms": {}}
    lines = []
    P = lines.append

    # ---------- cost and latency (every call in raw.json, pilot included)
    for a in arms:
        rs = [r for r in raw if r["arm"] == a and r.get("usage")]
        c = [100 * (r["usage"].get("promptTokenCount", 0) * PRICE_IN + r["usage"].get("candidatesTokenCount", 0) * PRICE_OUT) for r in rs]
        res["arms"][a] = {"calls": len(rs), "cents_per_call": round(statistics.mean(c), 3), "spent_usd": round(sum(c) / 100, 3),
                          "median_s": statistics.median(r["seconds"] for r in rs), "p90_s": sorted(r["seconds"] for r in rs)[int(len(rs) * .9) - 1],
                          "tokens_in": round(statistics.mean(r["usage"].get("promptTokenCount", 0) for r in rs)),
                          "tokens_out": round(statistics.mean(r["usage"].get("candidatesTokenCount", 0) for r in rs)),
                          "errors": sum(1 for r in raw if r["arm"] == a and not r.get("json")),
                          "finish_not_stop": sum(1 for r in rs if r.get("finish") not in (None, "STOP"))}
    P(f"Photos with 3 runs in both arms: {len(full)}")
    for a, s in res["arms"].items():
        P(f"{a}: {s}")
    P(f"total spent ${sum(s['spent_usd'] for s in res['arms'].values()):.3f}")

    # ---------- old fields: 3-run agreement per arm
    def agree(a, p, slot, field):
        vals = [value(r["json"], slot, field, a) for r in by[(a, p)][:3]]
        if any(v is None and primary(r["json"], slot) is None for v, r in zip(vals, by[(a, p)][:3])):
            return None
        return len(set(map(json.dumps, vals))) == 1

    old = {}
    for field, slots in OLD_FIELDS.items():
        old[field] = {}
        for a in arms:
            hits = [agree(a, p, s, field) for p in full for s in slots]
            hits = [h for h in hits if h is not None]
            old[field][a] = (sum(hits), len(hits))
    for field in SCENE_OLD:
        old["scene." + field] = {}
        for a in arms:
            hits = [len({json.dumps(r["json"]["scene"].get(field)) for r in by[(a, p)][:3]}) == 1 for p in full]
            old["scene." + field][a] = (sum(hits), len(hits))
    old["garment set"] = {}
    for a in arms:
        hits = [len({json.dumps(sorted(Counter(g["category"] for g in r["json"]["garments"] if g["category"] != "accessory").items())) for r in by[(a, p)][:3]}) == 1 for p in full]
        old["garment set"][a] = (sum(hits), len(hits))
    P("\nOLD FIELDS: 3-run agreement (A vs B1, diff in points)")
    worst = []
    for f, d in old.items():
        if len(arms) == 2:
            pa, pb = (100 * d[x][0] / d[x][1] if d[x][1] else 0 for x in arms)
            worst.append((pb - pa, f))
            P(f"  {f:24s} A {pct(*d['A']):>14s}   B1 {pct(*d['B1']):>14s}   {pb - pa:+.1f}")
    # pooled over all old garment fields
    pooled = {a: [sum(old[f][a][0] for f in OLD_FIELDS), sum(old[f][a][1] for f in OLD_FIELDS)] for a in arms}
    P(f"  pooled old garment fields: " + "  ".join(f"{a} {pct(*v)}" for a, v in pooled.items()))
    res["old_fields"] = {f: {a: list(v) for a, v in d.items()} for f, d in old.items()}
    res["old_pooled"] = pooled

    # ---------- scores
    P("\nSCORES (v4.1, Everyday, test profile Minimal + Smart casual)")
    sc = {}
    for a in arms:
        sc[a] = {p: [score(r["json"], a) for r in by[(a, p)][:3]] for p in full}
    res["scores"] = {a: sc[a] for a in arms}

    def steady(s, mode):
        s = [x for x in s if x is not None]
        if len(s) < 3:
            return None
        if mode == "exact":
            return len(set(s)) == 1
        m = statistics.median(s)
        return all(abs(x - m) <= 0.5 for x in s)

    for mode in ("within 0.5 of median", "exact"):
        md = "exact" if mode == "exact" else "half"
        row = []
        for a in arms:
            h = [steady(sc[a][p], md) for p in full]
            h = [x for x in h if x is not None]
            row.append(f"{a} {pct(sum(h), len(h))}")
            res.setdefault("score_steady", {}).setdefault(md, {})[a] = [sum(h), len(h)]
        P(f"  {mode:22s} " + "   ".join(row))
    for g in GROUP_ORDER:
        ps = [p for p in full if group[p] == g]
        row = []
        for a in arms:
            h = [steady(sc[a][p], "exact") for p in ps]; h = [x for x in h if x is not None]
            h2 = [steady(sc[a][p], "half") for p in ps]; h2 = [x for x in h2 if x is not None]
            row.append(f"{a} exact {pct(sum(h), len(h))} · ±0.5 {pct(sum(h2), len(h2))}")
        P(f"  {g:8s} " + "   ".join(row))
    for who in sorted(set(person.values())):
        ps = [p for p in full if person[p] == who]
        row = []
        for a in arms:
            h = [steady(sc[a][p], "exact") for p in ps]; h = [x for x in h if x is not None]
            med = statistics.mean(statistics.median([x for x in sc[a][p] if x is not None]) for p in ps if any(x is not None for x in sc[a][p]))
            row.append(f"{a} exact {pct(sum(h), len(h))} mean-median {med:.2f}")
        P(f"  {who[:40]:40s} n={len(ps)} " + "   ".join(row))
    shift = [statistics.median([x for x in sc['B1'][p] if x is not None]) - statistics.median([x for x in sc['A'][p] if x is not None])
             for p in full if any(x is not None for x in sc['A'][p]) and any(x is not None for x in sc['B1'][p])]
    P(f"  median score B1 - A: mean {statistics.mean(shift):+.2f}, photos moved {sum(1 for s in shift if s)} / {len(shift)}")
    unst = {a: [f"{p} {sc[a][p]}" for p in full if steady(sc[a][p], 'exact') is False] for a in arms}
    for a in arms:
        P(f"  {a} unsteady (not exact): " + "; ".join(unst[a]))
    res["unsteady"] = unst

    # ---------- new fields: steadiness (B1 only)
    P("\nNEW FIELDS (B1): 3-run agreement")
    newst = {}
    for field, slots in NEW_FIELDS.items():
        for s in slots:
            h = [agree("B1", p, s, field) for p in full]
            h = [x for x in h if x is not None]
            newst[f"{field}·{s}"] = [sum(h), len(h)]
        h = [agree("B1", p, s, field) for p in full for s in slots]
        h = [x for x in h if x is not None]
        newst[field] = [sum(h), len(h)]
    h = [len({r["json"]["scene"].get("pose") for r in by[("B1", p)][:3]}) == 1 for p in full]
    newst["scene.pose"] = [sum(h), len(h)]
    for k, v in newst.items():
        P(f"  {k:26s} {pct(*v)}")
    res["new_steady"] = newst
    # where hem_at disagrees
    flips = defaultdict(list)
    for field, slots in NEW_FIELDS.items():
        for p in full:
            for s in slots:
                if agree("B1", p, s, field) is False:
                    flips[field].append(f"{p}·{s} {[value(r['json'], s, field, 'B1') for r in by[('B1', p)][:3]]}")
    for p in full:
        if len({r["json"]["scene"].get("pose") for r in by[("B1", p)][:3]}) > 1:
            flips["pose"].append(f"{p} {[r['json']['scene'].get('pose') for r in by[('B1', p)][:3]]}")
    res["new_flips"] = flips
    for k, v in flips.items():
        P(f"  flips {k}: " + "; ".join(v))

    # ---------- new fields: accuracy vs the blind labels (every run counts)
    P("\nNEW FIELDS (B1): accuracy vs b1_labels.csv, every run")
    acc = defaultdict(lambda: [0, 0])          # field -> [right, judged]
    prec = defaultdict(lambda: [0, 0])         # field=value -> [right, fired]
    recall = defaultdict(lambda: [0, 0])       # field=value (labelled) -> [found, labelled]
    conf = defaultdict(Counter)

    def judge(field, lab_v, v, key=None):
        ok = accepts(lab_v, v)
        if ok is None:
            return
        acc[field][0] += ok; acc[field][1] += 1
        prec[f"{field}={v}"][0] += ok; prec[f"{field}={v}"][1] += 1
        conf[field][(lab_v, v)] += 1
        opts = set(lab_v.split("|")) - {"unsure"}
        if len(opts) == 1:
            o = next(iter(opts)); recall[f"{field}={o}"][0] += ok; recall[f"{field}={o}"][1] += 1

    for p in full:
        L = lab.get(p)
        if not L:
            continue
        for r in by[("B1", p)][:3]:
            j = r["json"]
            judge("pose", L["pose"], j["scene"].get("pose"))
            m = match_upper(j, L)
            for slot, g in m.items():
                pre = "top" if slot == "top" else "outer"
                judge("hem_at", L[f"{pre}_hem_at"], g.get("hem_at"))
                judge(f"hem_at·{pre}", L[f"{pre}_hem_at"], g.get("hem_at"))
                judge("shoulder_seam", L[f"{pre}_shoulder_seam"], g.get("shoulder_seam"))
                judge("lightness", L[f"{pre}_lightness"], g.get("lightness"))
            # sleeve: the outermost upper garment with a sleeve reading
            sg = m.get("outer") or m.get("top")
            if sg is not None:
                judge("sleeve_end", L["sleeve_end"], sg.get("sleeve_end"))
            for slot, key in (("bottom", "bottom_lightness"), ("footwear", "shoes_lightness")):
                g = primary(j, slot)
                if g is not None:
                    judge("lightness", L[key], g.get("lightness"))
            # under_shows: on the AI's outerwear only; labels apply to the piece under the outermost upper layer
            o = primary(j, "outerwear")
            if o is not None and L["under_shows"] not in ("na", ""):
                judge("under_shows", L["under_shows"], o.get("under_shows"))
    for k, v in sorted(acc.items()):
        P(f"  {k:22s} overall {pct(*v)}")
    P("  precision when it fires (AI value -> right):")
    for k, v in sorted(prec.items()):
        P(f"    {k:34s} {pct(*v)}")
    P("  recall (single-value labels found):")
    for k, v in sorted(recall.items()):
        P(f"    {k:34s} {pct(*v)}")
    res["new_acc"] = {k: v for k, v in acc.items()}
    res["new_prec"] = {k: v for k, v in prec.items()}
    res["new_recall"] = {k: v for k, v in recall.items()}
    res["confusion"] = {f: {f"{a} -> {b}": n for (a, b), n in c.most_common()} for f, c in conf.items()}
    # under_shows coverage: labelled peeks, how many runs had an outerwear garment at all
    peeks = [p for p in full if p in lab and set(lab[p]["under_shows"].split("|")) & {"a_little", "clearly"}]
    cov = []
    for p in peeks:
        cov.append(f"{p}: " + ", ".join(f"{(primary(r['json'], 'outerwear') or {}).get('subcategory', 'no outer')}/{(primary(r['json'], 'outerwear') or {}).get('under_shows', '-')}" for r in by[("B1", p)][:3]))
    res["peek_runs"] = cov
    P("  labelled peeks, B1 runs (outer subcategory/under_shows): " + " | ".join(cov))

    # ---------- old fields accuracy, both arms (no loss of accuracy)
    P("\nOLD FIELDS: accuracy vs existing labels, both arms, every run")
    rl = {r["photo"]: r for r in csv.DictReader((HERE / "ruler_labels.csv").open())}
    hl = {r["photo"]: r for r in csv.DictReader((HERE / "hem_labels.csv").open())}
    ll = {r["photo"]: r for r in csv.DictReader((HERE / "leg_labels.csv").open())}
    LEN_ORDER = ["cropped", "at_belt", "mid_fly", "below_crotch"]
    oacc = {a: defaultdict(lambda: [0, 0]) for a in arms}
    for a in arms:
        for p in full:
            for r in by[(a, p)][:3]:
                j = r["json"]
                b = primary(j, "bottom")
                if p in hl and b is not None:
                    hv = hl[p]["hem"]
                    ok = accepts(hv.replace("stacked", "full_break") if a == "A" else hv.replace("stacked", "full_break"), b.get("hem"))
                    if ok is not None and hv != "na":
                        oacc[a]["hem"][0] += ok; oacc[a]["hem"][1] += 1
                if p in ll and b is not None:
                    lv = ll[p]["leg_shape"].replace("flare", "flare_bootcut")
                    ok = accepts(lv, b.get("leg_shape"))
                    if ok is not None and lv != "na":
                        oacc[a]["leg_shape"][0] += ok; oacc[a]["leg_shape"][1] += 1
                if p in rl:
                    ups = [g for g in j["garments"] if g["category"] in UPPER]
                    outer = [g for g in ups if g["category"] == "outerwear"]
                    sv = rl[p]["sleeve_end"].replace("at_elbow", "na").replace("mid_bicep", "na")
                    for g in outer + [g for g in ups if g["category"] == "top"]:
                        s = g.get("sleeve_end")
                        s = SLEEVE_BACK.get(s, s) if a == "B1" else s
                        if s not in (None,) and not (s == "na" and "na" not in sv):
                            break
                    else:
                        s = None
                    if sv != "ns" and s is not None:
                        ok = accepts(sv, s)
                        oacc[a]["sleeve_end (old values)"][0] += bool(ok); oacc[a]["sleeve_end (old values)"][1] += 1
                    lens = [g.get("length") for g in outer + [g for g in ups if g["category"] == "top"] if g.get("length") in LEN_ORDER]
                    tl = rl[p]["top_length"].rstrip("?")
                    if tl not in ("ns", ""):
                        if lens:
                            v = max(lens, key=LEN_ORDER.index)
                        elif ups and any(g.get("tucked") in ("full", "half") for g in ups if g["category"] == "top") and not outer:
                            v = "tucked"
                        else:
                            v = "na"
                        ok = accepts(tl, v)
                        oacc[a]["length (lowest top edge)"][0] += bool(ok); oacc[a]["length (lowest top edge)"][1] += 1
    for k in sorted({k for a in arms for k in oacc[a]}):
        P(f"  {k:26s} " + "   ".join(f"{a} {pct(*oacc[a][k])}" for a in arms))
    res["old_acc"] = {a: dict(v) for a, v in oacc.items()}

    # ---------- per group / per person for the new fields' steadiness
    P("\nNEW FIELDS steadiness by group (B1)")
    for g in GROUP_ORDER:
        ps = [p for p in full if group[p] == g]
        row = []
        for field, slots in list(NEW_FIELDS.items()):
            h = [agree("B1", p, s, field) for p in ps for s in slots]; h = [x for x in h if x is not None]
            row.append(f"{field} {pct(sum(h), len(h))}")
        h = [len({r["json"]["scene"].get("pose") for r in by[("B1", p)][:3]}) == 1 for p in ps]
        row.append(f"pose {pct(sum(h), len(h))}")
        P(f"  {g:7s} n={len(ps):2d}  " + " · ".join(row))
    P("\nOLD pooled garment-field steadiness by group")
    for g in GROUP_ORDER:
        ps = [p for p in full if group[p] == g]
        row = []
        for a in arms:
            h = [agree(a, p, s, f) for p in ps for f, sl in OLD_FIELDS.items() for s in sl]; h = [x for x in h if x is not None]
            row.append(f"{a} {pct(sum(h), len(h))}")
        P(f"  {g:7s} " + "   ".join(row))
    (OUT / "analysis.json").write_text(json.dumps(res, indent=1, default=list))
    (OUT / "analysis.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
