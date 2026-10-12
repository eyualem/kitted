#!/usr/bin/env python3
"""Headroom test (Oct 12, 2026): which proportion facts are worth a phone-side measuring script? No API calls, no money.

  /usr/bin/python3 headroom_test.py   -> results/headroom1/analysis.txt + analysis.json + moves.csv

For each reading field the parts engine (rubrics/parts_proto.py, engine v7, the default; the file is NOT changed)
consumes and a script could plausibly measure, on the real corpus (agree_test.py's loader: parts1/corpus.json + the
Oct 10 pull + batch 1 run 0 + af7e93 from the Oct 11 pull; 79 photos):
  (1) ONE-STEP FLIP: move the field one neighbouring step each way on the garment the engine reads (its first top,
      first outer layer, first bottom), re-score, and count photos whose SHOWN (rounded) score moves.
  (2) LABEL SWAP: where Claude's blind labels exist, put the label's value in place of the AI's and re-score.
  (3) DISAGREEMENT: how often the AI's value falls outside the label (an "a|b" label counts as agreeing when the AI
      says either; firm-only shown beside it).
A field whose flips never move a shown score has no headroom: measuring it better can't change what he sees.

Ladders (one step = the neighbour):
  top length / outer length   cropped - at_belt - mid_fly - below_crotch           (na: the top is tucked; skipped)
  tuck                        none(=na) - half - full
  leg shape                   skinny - slim - straight - relaxed - wide            (flare_bootcut, barrel: skipped)
  hem                         cropped - no_break - slight_break - full_break - pooling; cuffed sits with no_break
                              (shorter: cropped, longer: slight_break)
  sleeve end                  above_wrist - at_wrist - covers_hand                 (na = short sleeve: skipped)
  roominess (volume)          1 - 2 - 3 - 4 - 5
  peek (second look)          the app doesn't send the second look, so today = no; the flip is yes (photos with a
                              layer or two tops)
  rests on the shoe           today = the engine's fallback (hem pooling or full break); the flip is the opposite
                              (photos with bottoms and shoes)

Label sources (all one labeller's blind work, Claude subagents Oct 8-10, not ground truth):
  top length   ruler_labels.top_length where the labeller saw no layer (shows_below_outer = na), else
               b1_labels.top_hem_at (waistband = at_belt, hip = at_belt|mid_fly, crotch/thigh = below_crotch)
  tuck         b1_labels.top_hem_at, else ruler_labels.top_length: "tucked" = half|full, a length = none
  outer length b1_labels.outer_hem_at (same mapping as the top)
  leg shape    leg_labels.leg_shape, else inputs/phone-oct8/truth.csv (flare = flare_bootcut, aliased to straight)
  hem          hem_labels.hem, else ruler_labels.hem, else leg_labels.hem, else truth.csv; "stacked" = full_break
               (the engine has no stacked value; since #221 a stack must never cost points, and full_break doesn't)
  sleeve end   ruler_labels.sleeve_end, else b1_labels.sleeve_end, else truth.csv (on the outermost piece, as the
               ruler labels it); stacked_at_cuff = at_wrist, pushed_up = above_wrist, short sleeve = na
  peek         b1_labels.under_shows (a_little/clearly = yes, no = no), else ruler_labels.shows_below_outer
  rests        look_labels.l_covers_shoe (partly/mostly = yes, no = no), else ruler_labels.hem_pos (covers = yes)
  roominess    no labels exist
The swap with an "a|b" label the AI falls outside of uses the label value nearest the AI's (the smallest change).

Rule 7: the founder is profile pending (no birth year or picked looks yet); his friends are profile unknown; 703a8b and
ebe23f are unknown (ask the founder); stock and web photos are profile unknown. Everything is scored with ONE stated
test profile (picks Minimal + Smart casual, 0.5 each; boldness a little; no age), each photo at its own occasion
(everyday or class). Picks never move a number, so no split by age band or picked look is possible.
"""
import copy
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import parts_test as T  # noqa: E402
import parts2_test as Q  # noqa: E402
import agree_test as A  # noqa: E402

OUT = HERE / "results" / "headroom1"
LINES = []
ENGINE = "v7"


def say(s=""):
    LINES.append(s)
    print(s)


# ============================================================================================ ladders
LEN = ["cropped", "at_belt", "mid_fly", "below_crotch"]
TUCK = ["none", "half", "full"]
LEG = ["skinny", "slim", "straight", "relaxed", "wide"]
HEM = ["cropped", "no_break", "slight_break", "full_break", "pooling"]
SLEEVE = ["above_wrist", "at_wrist", "covers_hand"]
VOL = [1, 2, 3, 4, 5]

# field id -> (plain name, role, reading key, ladder, words for down / up)
FIELDS = {
    "top_length": ("Top length (where the top ends, no tuck)", "T", "length", LEN, "shorter", "longer"),
    "tuck": ("Tuck (none / half / full)", "T", "tucked", TUCK, "less tucked", "more tucked"),
    "outer_length": ("Outer layer length", "O", "length", LEN, "shorter", "longer"),
    "leg_shape": ("Leg shape (skinny ... wide)", "B", "leg_shape", LEG, "narrower", "wider"),
    "hem": ("Hem (how the pant meets the shoe)", "B", "hem", HEM, "shorter / cleaner", "longer / heavier"),
    "sleeve_top": ("Sleeve end, the top", "T", "sleeve_end", SLEEVE, "shorter", "longer"),
    "sleeve_outer": ("Sleeve end, the outer layer", "O", "sleeve_end", SLEEVE, "shorter", "longer"),
    "volume_top": ("Roominess of the top (1-5)", "T", "volume", VOL, "closer", "roomier"),
    "volume_outer": ("Roominess of the outer layer (1-5)", "O", "volume", VOL, "closer", "roomier"),
    "peek": ("Shirt showing below the layer (second look)", "SL", "peek", None, None, "yes"),
    "rests": ("Pant rests on the shoe (second look)", "SL", "rests_on_shoe", None, "no", "yes"),
}

# which rules read each field, and the values they read (rubric/v5-styles.md IDs; engine checks in brackets)
RULES_READ = {
    "top_length": "PRO-4 waist break +1.5 (cropped/at_belt, no jacket, full leg; +0.5 untucked in a mirror) [PR1]; "
                  "STR-5 streetwear shape +1.0 (cropped/at_belt/mid_fly) [PR4]; PRO-11 excuse (cropped/at_belt over a "
                  "full leg) [PB1]; MIN-2 minimal signature (roomy + at_belt/cropped); PRO-10 tip (below_crotch) [PF2]",
    "tuck": "PRO-4 waist break (full) [PR1]; PRO-5 front tuck +0.5 (half) [PR1b]; PRO-7 tailored line +1.0 (full) [PR3]; "
            "PRO-11 excuse (full) [PB1]; STR-5 needs untucked [PR4]; CON-3 untucked dress shirt -0.6; PRO-10 tips "
            "[PF2, PF4]",
    "outer_length": "PRO-10 tip only (below_crotch over loose legs) [PF3]: no points",
    "leg_shape": "PRO-2/PRO-3 skinny [PF5, PF6]; PRO-4/6/7 need straight/relaxed/wide (PRO-7: not skinny) [PR1-3]; "
                 "PRO-11 slim vs full [PB1]; STR-5 relaxed/wide [PR4]; WRK-4 [PR5]; SHO-9 chunky under slim/skinny "
                 "-1.5 [SW1]; STR-6 +0.5 loose [SW2]; SHO-2 drag on slides (loose); STY-3 relaxed/wide jeans under a "
                 "blazer -1.5; FIT-3 strain size; style detection (STR-1/3, MIN-2, WRK-1, VSP-1, PRP-2); tips PRO-12, "
                 "FIT-6",
    "hem": "PRO-8 pooling blocks every shape credit; FIT-4 pooling -1.5/-2.0 [FF7]; STR-6/STR-12 pooling switches off "
           "the carry; SHO-2 drag fallback (pooling/full_break) on slides; MIN-2 minimal signature needs a clean hem "
           "(cropped/no/slight/cuffed); tips PRO-10 [PF1], FIT-6",
    "sleeve_top": "FIT-2 sleeves over the hands (covers_hand only) -0.5 to -2.0 [FF1, FF5]; PRO-11 excuse [PB1]",
    "sleeve_outer": "FIT-2 (covers_hand only) [FF1, FF5]",
    "volume_top": "PRO-2 roomy (4+) over skinny -1.5; PRO-11 roomy (4+) -1.5; STR-5 roomy (4+); PRO-4 ribbed tops "
                  "need 4+; FIT-2 too big (4+, covers_hand); STY-5 roomy (4+) -3.0 Style; detection (STR-2/4, MIN-2, "
                  "WRK-2 at 5, SMC-2 at 5, PRP-2); PF4 tip (3 or less)",
    "volume_outer": "PRO-2 roomy jacket over skinny; FIT-2 too big; STR-2/4 detection (roomy jacket); WRK-2/SMC-2 at 5",
    "peek": "PRO-9 shirt below the jacket -0.5 and no jacket shape credit (PR2, PR5) [PF10]; never fires today (KD-15)",
    "rests": "SHO-2 loose jeans or cargos dragging on slides -0.5 [SK1b]; only with slides out of the house",
}


# ============================================================================================ the engine's view
def roles(reading):
    """Raw garment indices of the engine's T (first top), O (first outer layer), B (first bottom), S (first shoes),
    after rubric.py's _prepare filter and _normalize recategorization (same order, so positions map back)."""
    scene = reading.get("scene") or {}
    raw = reading.get("garments") or []
    idx = [i for i, g in enumerate(raw) if g.get("certainty") != "unsure" and g.get("category") != "accessory"]
    if not scene.get("shoes_visible", True):
        idx = [i for i in idx if raw[i].get("category") != "footwear"]
    if scene.get("framing") == "upper_only":
        idx = [i for i in idx if raw[i].get("category") not in ("bottom", "footwear")]
    idx = [i for i in idx if raw[i].get("category") != "traditional"]
    gs = P._refile(R._normalize([raw[i] for i in idx]))
    assert len(gs) == len(idx)
    out = {"tops": 0}
    for j, g in enumerate(gs):
        role = {"top": "T", "outerwear": "O", "bottom": "B", "footwear": "S"}.get(g.get("category"))
        if role == "T":
            out["tops"] += 1
        if role and role not in out:
            out[role] = idx[j]
    return out


def score(reading, occ, sl=None):
    return P.score_parts(reading, occ, Q.PROFILE, sl, Q.BOLD, engine=ENGINE)


def prop_of(r):
    return ((r.get("parts") or {}).get("proportions") or {}).get("display")


def with_value(reading, gi, key, val):
    rd = copy.deepcopy(reading)
    rd["garments"][gi][key] = val
    return rd


def ai_value(reading, ro, fid):
    """The AI's value of the field as the engine reads it, or None when the field isn't there."""
    _, role, key, lad, _, _ = FIELDS[fid]
    if role == "SL":
        return None
    gi = ro.get(role)
    if gi is None:
        return None
    v = reading["garments"][gi].get(key)
    if fid == "tuck":
        v = "none" if v in (None, "na") else v
    if fid == "volume_top" or fid == "volume_outer":
        v = 3 if v is None else v
    if fid == "leg_shape" and v in R.LEG_ALIAS:
        return v                                                     # kept, but has no ladder step
    return v


def neighbours(fid, v):
    lad = FIELDS[fid][3]
    if fid == "hem" and v == "cuffed":
        return {"down": "cropped", "up": "slight_break"}
    if v not in lad:
        return {}
    i = lad.index(v)
    out = {}
    if i > 0:
        out["down"] = lad[i - 1]
    if i < len(lad) - 1:
        out["up"] = lad[i + 1]
    return out


def has_layer(ro):
    return "O" in ro or ro["tops"] >= 2


def rests_fallback(reading, ro):
    b = reading["garments"][ro["B"]] if "B" in ro else None
    return bool(b is not None and b.get("hem") in ("pooling", "full_break"))


# ============================================================================================ labels
def _opts(raw):
    return [o.rstrip("?") for o in (raw or "").split("|") if o.rstrip("?") not in ("", "unsure", "ns", "na")]


def _len_from_b1(raw):
    """b1 top/outer hem vocabulary -> the reading's length values. None if tucked or no answer."""
    os_ = _opts(raw)
    if not os_ or "tucked" in os_:
        return None
    m = {"waistband": ["at_belt"], "hip": ["at_belt", "mid_fly"], "crotch": ["below_crotch"], "thigh": ["below_crotch"],
         "knee": ["below_crotch"], "cropped": ["cropped"]}
    s = set()
    for o in os_:
        s.update(m.get(o, []))
    return sorted(s, key=LEN.index) or None


HEM_MAP = {"stacked": "full_break", "full": "full_break", "slight": "slight_break", "none": "no_break",
           "pooling": "pooling", "full_break": "full_break", "slight_break": "slight_break", "no_break": "no_break",
           "cropped": "cropped", "cuffed": "cuffed"}
SLEEVE_MAP = {"at_wrist": "at_wrist", "stacked_at_cuff": "at_wrist", "above_wrist": "above_wrist",
              "pushed_up": "above_wrist", "covers_hand": "covers_hand", "short_sleeve": "na", "mid_bicep": "na",
              "at_elbow": "na"}
LEG_MAP = {"skinny": "skinny", "slim": "slim", "straight": "straight", "relaxed": "relaxed", "wide": "wide",
           "flare": "flare_bootcut"}


def load_labels():
    """{photo: {field: (set of accepted engine values, firm?, source)}}"""
    rd = lambda f: {r["photo"]: r for r in csv.DictReader(open(f))}  # noqa: E731
    ruler, leg, hem, b1, look = (rd(HERE / f) for f in ("ruler_labels.csv", "leg_labels.csv", "hem_labels.csv",
                                                          "b1_labels.csv", "look_labels.csv"))
    truth = defaultdict(dict)
    for r in csv.DictReader(open(K / "inputs/phone-oct8/truth.csv")):
        truth["phone-" + r["photo"]][r["slot"]] = r
    lab = defaultdict(dict)

    def put(p, f, vals, src):
        vals = [v for v in vals if v is not None]
        if vals and f not in lab[p]:
            lab[p][f] = (vals, len(vals) == 1, src)

    for p in set(ruler) | set(b1) | set(leg) | set(hem) | set(look) | set(truth):
        r, b, lg, h, lk, tr = ruler.get(p), b1.get(p), leg.get(p), hem.get(p), look.get(p), truth.get(p, {})
        # top length
        if r and r["shows_below_outer"] == "na":
            put(p, "top_length", [o for o in _opts(r["top_length"]) if o in LEN], "ruler")
        if b:
            put(p, "top_length", _len_from_b1(b["top_hem_at"]) or [], "b1")
        # tuck
        if b and _opts(b["top_hem_at"]):
            os_ = _opts(b["top_hem_at"])
            if os_ == ["tucked"]:
                put(p, "tuck", ["half", "full"], "b1")
            elif "tucked" not in os_:
                put(p, "tuck", ["none"], "b1")
        if r and _opts(r["top_length"]):
            os_ = _opts(r["top_length"])
            if os_ == ["tucked"]:
                put(p, "tuck", ["half", "full"], "ruler")
            elif "tucked" not in os_ and r["shows_below_outer"] == "na":
                put(p, "tuck", ["none"], "ruler")
        # outer length
        if b and b["outer_type"] not in ("na", ""):
            put(p, "outer_length", _len_from_b1(b["outer_hem_at"]) or [], "b1")
        # leg shape
        if lg:
            put(p, "leg_shape", sorted({LEG_MAP[o] for o in _opts(lg["leg_shape"]) if o in LEG_MAP}, key=_legkey), "leg")
        if tr.get("bottom") and tr["bottom"]["leg_shape"]:
            put(p, "leg_shape", [LEG_MAP[tr["bottom"]["leg_shape"]]], "truth")
        # hem
        for src, row, col in (("hem", h, "hem"), ("ruler", r, "hem"), ("leg", lg, "hem"), ("truth", tr.get("bottom"), "hem")):
            if row and _opts(row[col]):
                put(p, "hem", sorted({HEM_MAP[o] for o in _opts(row[col]) if o in HEM_MAP}, key=_hemkey), src)
        # sleeve end (outermost piece)
        for src, row in (("ruler", r), ("b1", b)):
            if row and _opts(row["sleeve_end"]):
                put(p, "sleeve", sorted({SLEEVE_MAP[o] for o in _opts(row["sleeve_end"]) if o in SLEEVE_MAP}), src)
        for slot in ("outerwear", "top"):
            if tr.get(slot) and tr[slot]["sleeve_end"]:
                put(p, "sleeve", [SLEEVE_MAP[tr[slot]["sleeve_end"]]], "truth")
        # peek
        if b and b["under_shows"]:
            us = b["under_shows"]
            if us == "na":
                put(p, "peek", ["no"], "b1")
            else:
                put(p, "peek", sorted({"yes" if o in ("a_little", "clearly") else "no" for o in _opts(us)}), "b1")
        if r and r["shows_below_outer"] in ("yes", "no"):
            put(p, "peek", [r["shows_below_outer"]], "ruler")
        # rests on the shoe
        if lk and _opts(lk["l_covers_shoe"]):
            vs = {"yes" if o in ("partly", "mostly") else "no" for o in _opts(lk["l_covers_shoe"]) if o != "no_shoes_visible"}
            put(p, "rests", sorted(vs), "look")
        if r and _opts(r["hem_pos"]):
            put(p, "rests", sorted({"yes" if o == "covers" else "no" for o in _opts(r["hem_pos"])}), "ruler")
    return lab


def _legkey(v):
    return LEG.index(R.LEG_ALIAS.get(v, v))


def _hemkey(v):
    return HEM.index("no_break" if v == "cuffed" else v)


def label_for(lab, p, fid):
    f = "sleeve" if fid in ("sleeve_top", "sleeve_outer") else fid
    return lab.get(p, {}).get(f)


def nearest(fid, ai, vals):
    """The label value nearest the AI's (the smallest change), for an 'a|b' label the AI falls outside of."""
    lad = FIELDS[fid][3]
    if lad is None or ai is None:
        return vals[0]
    pos = lambda v: (_legkey(v) if fid == "leg_shape" else _hemkey(v) if fid == "hem"  # noqa: E731
                     else lad.index(v) if v in lad else 99)
    try:
        a = pos(ai)
    except ValueError:
        return vals[0]
    return min(vals, key=lambda v: (abs(pos(v) - a), pos(v)))


def same_value(fid, ai, vals):
    if fid == "leg_shape":
        return R.LEG_ALIAS.get(ai, ai) in {R.LEG_ALIAS.get(v, v) for v in vals}
    if fid in ("sleeve_top", "sleeve_outer"):
        return (ai if ai in SLEEVE else "na") in vals or (ai in (None, "na", "above_wrist") and "na" in vals)
    return ai in vals


# ============================================================================================ main
GROUPS = {"founder": "the founder (profile pending)", "friend": "his friends (profile unknown)",
          "unknown": "unknown, ask the founder (703a8b, ebe23f)", "web": "web mirror photos (profile unknown)",
          "stock": "stock photos (profile unknown)"}


def grp_txt(c):
    return ", ".join(f"{g} {c[g]}" for g in GROUPS if c.get(g)) or "-"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, _B1, _B1L, U, L, _Z = Q.load()
    new11 = {k: v for k, v in A.load_pull11().items() if k not in prim}
    prim.update(new11)

    def who(k):                                       # af7e93 = the founder's Oct 11 check (as agree_test.py)
        return "founder" if k == "phone-af7e93" else T.who(k)

    lab = load_labels()
    base = {k: score(v["reading"], v["occ"]) for k, v in prim.items()}
    ro = {k: roles(v["reading"]) for k, v in prim.items()}
    scored = [k for k in prim if base[k]["overall"] is not None]
    with_prop = [k for k in scored if prop_of(base[k]) is not None]
    say("HEADROOM TEST (Oct 12): which proportion facts can move the score a man sees? (parts engine v7, unchanged)")
    say(f"  corpus {len(prim)} photos (+{len(new11)} from the Oct 11 pull), {len(scored)} scored, {len(with_prop)} with a "
        f"Proportions part; by whose: {grp_txt(Counter(who(k) for k in scored))}")
    say("  Rule 7: founder profile pending; friends profile unknown; 703a8b/ebe23f unknown (ask the founder); stock/web "
        "profile unknown. One test profile (Minimal + Smart casual 0.5 each, boldness a little, no age), each photo at "
        "its own occasion; picks never move a number, so no age-band or picked-look split.")
    pc = Counter(prop_of(base[k]) for k in with_prop)
    say("  today: Proportions " + " · ".join(f"{x:g}: {n}" for x, n in sorted(pc.items())))
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "corpus": len(prim), "scored": len(scored), "with_proportions": len(with_prop), "fields": {}}
    moves_rows = []

    # ---------------------------------------------------------------- (1) one-step flips
    say("\n(1) ONE-STEP FLIP of each field, every scored photo where the field is there")
    for fid, (name, role, key, lad, wdown, wup) in FIELDS.items():
        present, skipped, dirs = [], Counter(), {"down": [], "up": []}
        for k in scored:
            rd, occ, r0 = prim[k]["reading"], prim[k]["occ"], base[k]
            if role == "SL":
                if fid == "peek":
                    if not has_layer(ro[k]):
                        continue
                    flips = {"up": {"peek": True}}
                else:
                    if "B" not in ro[k] or "S" not in ro[k]:
                        continue
                    fb = rests_fallback(rd, ro[k])
                    flips = {("down" if fb else "up"): {"rests_on_shoe": not fb}}
                present.append(k)
                for d, sl in flips.items():
                    r1 = score(rd, occ, sl)
                    dirs[d].append((k, r1))
                continue
            v = ai_value(rd, ro[k], fid)
            if v is None or v == "na":
                if ro[k].get(role) is not None:
                    skipped[str(v)] += 1
                continue
            nb = neighbours(fid, v)
            if not nb:
                skipped[str(v)] += 1
                continue
            present.append(k)
            for d, nv in nb.items():
                r1 = score(with_value(rd, ro[k][role], key, nv), occ)
                dirs[d].append((k, r1))
        fres = {"name": name, "present": len(present), "skipped": dict(skipped),
                "values": dict(Counter(str(ai_value(prim[k]["reading"], ro[k], fid)) for k in present)) if role != "SL" else {},
                "dirs": {}}
        moved_any = set()
        say(f"\n  {name}: on {len(present)} photos" + (f" (skipped: {dict(skipped)})" if skipped else "")
            + (f"; AI values {fres['values']}" if fres["values"] else ""))
        for d, items in dirs.items():
            if not items:
                continue
            mv = [(k, r1["overall"] - base[k]["overall"]) for k, r1 in items
                  if r1["overall"] is not None and r1["overall"] != base[k]["overall"]]
            pmv = [k for k, r1 in items if prop_of(r1) != prop_of(base[k])]
            moved_any |= {k for k, _ in mv}
            up = [x for x in mv if x[1] > 0]
            dn = [x for x in mv if x[1] < 0]
            sizes = Counter(f"{x[1]:+g}" for x in mv)
            word = wdown if d == "down" else wup
            fres["dirs"][d] = {"word": word, "tried": len(items), "moved": len(mv), "up": len(up), "down": len(dn),
                               "sizes": dict(sizes), "prop_moved": len(pmv),
                               "by_group": dict(Counter(who(k) for k, _ in mv)), "photos": [[k, x] for k, x in mv]}
            say(f"    {word:18s} tried {len(items):2d} · shown score moves on {len(mv):2d} ({len(up)} up, {len(dn)} down; "
                f"{' '.join(f'{s}: {n}' for s, n in sorted(sizes.items())) or '-'}) · Proportions moves on {len(pmv)} · "
                f"by whose: {grp_txt(Counter(who(k) for k, _ in mv))}")
            for k, x in mv:
                r1 = dict(items)[k]
                newc = [r["check"] for part in r1["parts"].values() for r in part.get("reasons", [])]
                oldc = [r["check"] for part in base[k]["parts"].values() for r in part.get("reasons", [])]
                plus = [c for c in newc if c not in oldc]
                minus = [c for c in oldc if c not in newc]
                say(f"      {k:26s} [{who(k)}; {prim[k]['occ']}] {base[k]['overall']} -> {r1['overall']}"
                    + (f" · + {','.join(plus)}" if plus else "") + (f" · - {','.join(minus)}" if minus else ""))
                moves_rows.append({"test": "flip", "field": fid, "direction": word, "photo": k, "who": who(k),
                                   "occ": prim[k]["occ"], "today": base[k]["overall"], "after": r1["overall"],
                                   "prop_today": prop_of(base[k]), "prop_after": prop_of(r1),
                                   "checks_added": " ".join(plus), "checks_removed": " ".join(minus)})
        fres["moved_any"] = len(moved_any)
        fres["moved_any_by_group"] = dict(Counter(who(k) for k in moved_any))
        say(f"    either direction: {len(moved_any)} of {len(present)} photos' shown score moves "
            f"(by whose: {grp_txt(Counter(who(k) for k in moved_any))})")
        res["fields"][fid] = {"flip": fres, "rules": RULES_READ[fid]}

    # ---------------------------------------------------------------- (2) label swap + (3) disagreement
    say("\n(2) LABEL SWAP and (3) AI-vs-label DISAGREEMENT, per field (labels: Claude's blind labels, not truth)")
    look_maj = {}
    for k in scored:
        sl = T.second_look_for(k, U, L)
        look_maj[k] = sl
    all_swaps = defaultdict(list)                     # photo -> [(role, key, value) or ("SL", key, value)]
    for fid, (name, role, key, lad, _, _) in FIELDS.items():
        if fid.startswith("volume"):
            res["fields"][fid]["label"] = None
            say(f"\n  {name}: no labels exist")
            continue
        n_lab = agree = agree_firm = n_firm = 0
        dis, swapped = [], []
        ai_src = "the engine's own value"
        for k in scored:
            lb = label_for(lab, k, fid)
            if lb is None:
                continue
            vals, firm, src = lb
            rd = prim[k]["reading"]
            if role == "SL":
                if fid == "peek":
                    if not has_layer(ro[k]):
                        continue
                    lm = look_maj[k]
                    ai = None if lm is None else ("yes" if lm.get("peek") else "no")
                    today = "no"                       # the app sends no second look
                    ai_src = "the second look (look1, 3-run majority) where it ran; today the app uses 'no'"
                else:
                    if "B" not in ro[k] or "S" not in ro[k]:
                        continue
                    today = "yes" if rests_fallback(rd, ro[k]) else "no"
                    ai = today
                    ai_src = "today's fallback from the hem (pooling/full break = rests)"
                n_lab += 1
                if ai is not None:
                    ok = ai in vals
                    agree += ok
                    if firm:
                        n_firm += 1
                        agree_firm += ok
                    if not ok:
                        dis.append((k, ai, "|".join(vals)))
                if today in vals:
                    continue
                new = vals[0] if len(vals) == 1 else None
                if new is None:
                    continue
                sl = {key: new == "yes"}
                all_swaps[k].append(("SL", key, new == "yes"))
                r1 = score(rd, prim[k]["occ"], sl)
                swapped.append((k, today, new, r1))
                continue
            gi = ro[k].get(role)
            if gi is None:
                continue
            ai = ai_value(rd, ro[k], fid)
            if fid in ("top_length",) and ai in (None, "na"):
                continue                               # a tucked top has no length reading
            if fid == "outer_length" and ai in (None, "na"):
                continue
            if fid in ("sleeve_top",) and "O" in ro[k]:
                continue                               # the label is the outermost sleeve: compare it on the layer
            if fid in ("leg_shape", "hem") and ai in (None, "na"):
                continue
            n_lab += 1
            ok = same_value(fid, ai, vals)
            agree += ok
            if firm:
                n_firm += 1
                agree_firm += ok
            if ok:
                continue
            dis.append((k, ai, "|".join(vals)))
            new = nearest(fid, ai, [v for v in vals if v != "na"]) if [v for v in vals if v != "na"] else None
            if new is None:
                continue
            if fid == "tuck" and new == "none":
                newval = "none"
            else:
                newval = new
            all_swaps[k].append((role, key, newval))
            r1 = score(with_value(rd, gi, key, newval), prim[k]["occ"])
            swapped.append((k, ai, newval, r1))
        mv = [(k, a, b, r1) for k, a, b, r1 in swapped if r1["overall"] is not None and r1["overall"] != base[k]["overall"]]
        up = [x for x in mv if x[3]["overall"] > base[x[0]]["overall"]]
        pmv = [x for x in swapped if prop_of(x[3]) != prop_of(base[x[0]])]
        lres = {"labelled": n_lab, "agree": agree, "agree_firm": [agree_firm, n_firm], "disagree": n_lab - agree if role != "SL" or fid == "rests" else None,
                "ai_source": ai_src, "swapped": len(swapped), "moved": len(mv), "up": len(up), "down": len(mv) - len(up),
                "prop_moved": len(pmv), "by_group": dict(Counter(who(x[0]) for x in mv)),
                "disagreements": [[k, str(a), b] for k, a, b in dis],
                "moves": [[k, str(a), str(b), base[k]["overall"], r1["overall"]] for k, a, b, r1 in mv]}
        res["fields"][fid]["label"] = lres
        n_ai = sum(1 for _ in dis) + agree
        say(f"\n  {name}: labelled on {n_lab} photos where the engine reads it (AI = {ai_src})")
        if n_ai:
            say(f"    AI outside the label: {len(dis)}/{n_ai} ({round(100 * len(dis) / n_ai)}%); firm labels only: "
                f"{n_firm - agree_firm}/{n_firm}" + (f" ({round(100 * (n_firm - agree_firm) / n_firm)}%)" if n_firm else ""))
        say(f"    swapped {len(swapped)} · shown score moves on {len(mv)} ({len(up)} up, {len(mv) - len(up)} down) · "
            f"Proportions moves on {len(pmv)} · by whose: {grp_txt(Counter(who(x[0]) for x in mv))}")
        for k, a, b in dis:
            say(f"      differs {k:26s} [{who(k)}] AI {a} · label {b}")
        for k, a, b, r1 in mv:
            newc = [r["check"] for part in r1["parts"].values() for r in part.get("reasons", [])]
            oldc = [r["check"] for part in base[k]["parts"].values() for r in part.get("reasons", [])]
            plus = [c for c in newc if c not in oldc]
            minus = [c for c in oldc if c not in newc]
            say(f"      MOVES   {k:26s} [{who(k)}; {prim[k]['occ']}] {a} -> {b}: {base[k]['overall']} -> {r1['overall']}"
                + (f" · + {','.join(plus)}" if plus else "") + (f" · - {','.join(minus)}" if minus else ""))
            moves_rows.append({"test": "label", "field": fid, "direction": f"{a}->{b}", "photo": k, "who": who(k),
                               "occ": prim[k]["occ"], "today": base[k]["overall"], "after": r1["overall"],
                               "prop_today": prop_of(base[k]), "prop_after": prop_of(r1),
                               "checks_added": " ".join(plus), "checks_removed": " ".join(minus)})

    # every label swap at once
    say("\n  ALL LABEL SWAPS AT ONCE (the label ceiling for these fields)")
    mv_all = []
    for k, sw in all_swaps.items():
        rd = copy.deepcopy(prim[k]["reading"])
        sl = {}
        for role, key, val in sw:
            if role == "SL":
                sl[key] = val
            else:
                rd["garments"][ro[k][role]][key] = val
        r1 = score(rd, prim[k]["occ"], sl or None)
        if r1["overall"] != base[k]["overall"]:
            mv_all.append((k, base[k]["overall"], r1["overall"], prop_of(base[k]), prop_of(r1)))
    say(f"    photos with any swap {len(all_swaps)} · shown score moves on {len(mv_all)} "
        f"({sum(1 for x in mv_all if x[2] > x[1])} up) · by whose: {grp_txt(Counter(who(x[0]) for x in mv_all))}")
    for k, a, b, pa, pb in mv_all:
        say(f"      {k:26s} [{who(k)}] {a} -> {b} (Proportions {pa} -> {pb})")
    res["all_labels"] = {"photos_swapped": len(all_swaps), "moved": [list(x) for x in mv_all]}

    # ---------------------------------------------------------------- ranked table
    say("\n(4) RANKED: photos whose shown score moves (either one-step flip) · label swap moves · AI outside the label")
    rows = []
    for fid, f in res["fields"].items():
        fl, lb = f["flip"], f.get("label")
        n_ai = (len(lb["disagreements"]) + lb["agree"]) if lb else 0
        rows.append((fl["moved_any"], fid, fl["present"], (lb or {}).get("moved"), (lb or {}).get("swapped"),
                     f"{len(lb['disagreements'])}/{n_ai}" if lb and n_ai else "-"))
    rows.sort(key=lambda r: (-r[0], r[1]))
    for m, fid, n, lm, ls, d in rows:
        say(f"    {FIELDS[fid][0]:46s} flip moves {m:2d}/{n:2d} · label swap moves {lm if lm is not None else '-'}"
            f"{'' if ls is None else f' (of {ls} swapped)'} · AI outside label {d}")
    res["ranked"] = rows
    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1, default=str)
    with open(OUT / "moves.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(moves_rows[0]) if moves_rows else ["test"])
        w.writeheader()
        w.writerows(moves_rows)
    print(f"\n-> {OUT}")


if __name__ == "__main__":
    main()
