"""How steady the bagginess readings are (volume for tops and layers, leg_shape for bottoms), from saved results only:
no API calls (#315, handoff/09-ui-review.md section 18).
  - run to run: the shipped reading with close-ups, 2-3 runs of the same photo (zoom1 arm B, zoom1-stock arm B, gold1);
  - across photos of the same piece: the founder's newest phone pull (screenshots/phone/*/SQLite/kitted.db);
  - accuracy: leg_labels.csv (Claude's blind labels);
  - the gold panel's Fit scores and reasons for roomy pieces.
Every photo is "profile unknown" (rule 7): scored with no picks at Everyday, the scorer's defaults.
Run from anywhere: /usr/bin/python3 extraction-test/bagginess_steady.py <checkout with the git-ignored results and inputs>"""
import re, collections, csv, glob, json, os, sqlite3, sys, copy

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ET = os.path.join(ROOT, "extraction-test")
RES = os.path.join(ET, "results")
sys.path.insert(0, ET)
sys.path.insert(0, os.path.join(ET, "rubrics"))
import parts_proto as P  # noqa: E402

NARROW = {"skinny", "slim"}
LOOSE = {"relaxed", "wide", "barrel"}
CATS = ("top", "outerwear", "bottom")


def leg_group(v):
    return "narrow" if v in NARROW else "loose" if v in LOOSE else "straight" if v == "straight" else "other"


def runs_by_photo(raw, arm=None):
    by = collections.defaultdict(dict)
    for e in raw:
        if arm and e.get("arm") != arm:
            continue
        j = e.get("json")
        if not j or not j.get("garments"):
            continue
        by[e["photo"]][e["run"]] = j
    return by


def pair(readings):
    """Pair garments across runs by category and position (only when every run has the same count)."""
    out = []
    for cat in CATS:
        lists = [[g for g in r["garments"] if g.get("category") == cat] for r in readings]
        n = {len(x) for x in lists}
        if len(n) != 1 or 0 in n:
            continue
        for i in range(n.pop()):
            out.append((cat, [x[i] for x in lists]))
    return out


def source_of(photo):
    p = photo.split("-")[0]
    return {"oct8": "his photos", "oct7": "his photos", "phone": "his photos", "ig": "Instagram", "pin": "Pinterest", "rd": "Reddit",
            "reddit": "Reddit", "stock": "stock"}.get(p, p)


stats = collections.defaultdict(lambda: collections.Counter())
dist = collections.defaultdict(collections.Counter)
by_cert = collections.defaultdict(collections.Counter)
by_sub = collections.defaultdict(collections.Counter)
score_moves = collections.Counter()
examples = []


def tally(src, cat, gs):
    vols = [g.get("volume") for g in gs]
    k = (src, cat)
    s = stats[k]
    s["n"] += 1
    for v in vols:
        dist[(src, cat)][v] += 1
    s["vol_same"] += len(set(vols)) == 1
    s["vol_roomy_same"] += len({(v or 3) >= 4 for v in vols}) == 1
    s["vol_fitted_same"] += len({(v or 3) <= 2 for v in vols}) == 1
    s["vol_any_roomy"] += any((v or 3) >= 4 for v in vols)
    s["vol_within1"] += (max(v or 3 for v in vols) - min(v or 3 for v in vols)) <= 1
    cert = "clear" if all(g.get("certainty") == "clear" for g in gs) else "likely"
    by_cert[(cat, cert)]["n"] += 1
    by_cert[(cat, cert)]["roomy_flip"] += len({(v or 3) >= 4 for v in vols}) != 1
    if cat in ("top", "outerwear"):
        sub = gs[0].get("subcategory")
        by_sub[sub]["n"] += 1
        by_sub[sub]["roomy_any"] += any((v or 3) >= 4 for v in vols)
        by_sub[sub]["roomy_flip"] += len({(v or 3) >= 4 for v in vols}) != 1
    if cat == "bottom":
        legs = [g.get("leg_shape") for g in gs]
        s["leg_same"] += len(set(legs)) == 1
        s["leg_group_same"] += len({leg_group(x) for x in legs}) == 1
        s["leg_narrow_same"] += len({x in NARROW for x in legs}) == 1
        s["leg_skinny_same"] += len({x == "skinny" for x in legs}) == 1
        s["leg_loose_same"] += len({x in LOOSE for x in legs}) == 1
        for x in legs:
            dist[(src, "leg")][x] += 1


def swap_bagginess(target, donor):
    """target reading with each paired garment's volume and leg_shape taken from donor."""
    t = copy.deepcopy(target)
    for cat in CATS:
        a = [g for g in t["garments"] if g.get("category") == cat]
        b = [g for g in donor["garments"] if g.get("category") == cat]
        if len(a) != len(b):
            return None
        for x, y in zip(a, b):
            x["volume"], x["leg_shape"] = y.get("volume"), y.get("leg_shape")
    return t


def score(r):
    try:
        return P.score_parts(r)["overall"]
    except Exception:
        return None


def flatten(r):
    """Every top/layer at volume 3, every leg 'straight': what if the reading saw no bagginess at all."""
    t = copy.deepcopy(r)
    for g in t["garments"]:
        if g.get("category") in ("top", "outerwear"):
            g["volume"] = 3
        if g.get("category") == "bottom" and g.get("leg_shape") not in (None, "na"):
            g["leg_shape"], g["volume"] = "straight", 3
    return t


def run_set(name, raw, arm=None, src_fn=source_of):
    by = runs_by_photo(raw, arm)
    for photo, runs in by.items():
        if len(runs) < 2:
            continue
        rs = [runs[k] for k in sorted(runs)]
        src = src_fn(photo)
        for cat, gs in pair(rs):
            tally(src, cat, gs)
        # how much do run-to-run bagginess flips alone move the score?
        base = score(rs[1])
        swapped = swap_bagginess(rs[1], rs[0])
        if base is not None and swapped is not None:
            s2 = score(swapped)
            if s2 is not None:
                score_moves[(src, "n")] += 1
                score_moves[(src, "moved")] += s2 != base
                if s2 != base and len(examples) < 12:
                    examples.append((name, photo, base, s2))
        # how much does bagginess move scores at all (run 0)?
        b0 = score(rs[0])
        f0 = score(flatten(rs[0]))
        if b0 is not None and f0 is not None:
            score_moves[(src, "flat_n")] += 1
            score_moves[(src, "flat_moved")] += f0 != b0
            score_moves[(src, "flat_delta")] += round((b0 - f0) * 2)


zoom = json.load(open(os.path.join(RES, "zoom1/raw.json")))
run_set("zoom1", zoom, arm="B")
zs = json.load(open(os.path.join(RES, "zoom1-stock/raw.json")))
run_set("zoom1-stock", zs, arm="B")
gold = json.load(open(os.path.join(RES, "gold1/raw.json")))
run_set("gold1", gold)

print("# Run to run (same photo, shipped reading with close-ups)")
for (src, cat), s in sorted(stats.items()):
    n = s["n"]
    line = (f"{src:12s} {cat:9s} n={n:4d} volume exact {s['vol_same']/n:5.0%} · within 1 {s['vol_within1']/n:5.0%}"
            f" · roomy(>=4) same {s['vol_roomy_same']/n:5.0%} · fitted(<=2) same {s['vol_fitted_same']/n:5.0%}"
            f" · any run roomy {s['vol_any_roomy']/n:4.0%}")
    if cat == "bottom":
        line += (f"\n{'':22s} leg exact {s['leg_same']/n:5.0%} · narrow/straight/loose same {s['leg_group_same']/n:5.0%}"
                 f" · narrow-vs-not {s['leg_narrow_same']/n:5.0%} · skinny-vs-not {s['leg_skinny_same']/n:5.0%}"
                 f" · loose-vs-not {s['leg_loose_same']/n:5.0%}")
    print(line)
print("\n# Value mix")
for k, c in sorted(dist.items(), key=lambda x: str(x[0])):
    tot = sum(c.values())
    print(k, {v: f"{c[v]/tot:.0%}" for v in sorted(c, key=str)}, f"(n={tot})")
print("\n# Roomy flips by certainty")
for k, c in sorted(by_cert.items()):
    print(k, c["n"], f"flip {c['roomy_flip']/c['n']:.0%}")
print("\n# Tops by kind (n>=8): share read roomy in any run, flip rate")
for sub, c in sorted(by_sub.items(), key=lambda x: -x[1]["n"]):
    if c["n"] >= 8:
        print(f"{sub:16s} n={c['n']:3d} roomy {c['roomy_any']/c['n']:4.0%} flip {c['roomy_flip']/c['n']:4.0%}")
print("\n# Score moves")
for src in sorted({k[0] for k in score_moves}):
    n, m = score_moves[(src, "n")], score_moves[(src, "moved")]
    fn, fm, fd = score_moves[(src, "flat_n")], score_moves[(src, "flat_moved")], score_moves[(src, "flat_delta")]
    print(f"{src:12s} run-to-run bagginess flips alone change the score on {m}/{n} ({m/max(n,1):.0%});"
          f" reading no bagginess at all would change {fm}/{fn} ({fm/max(fn,1):.0%}), net {fd/2:+.1f} points in total")
print("examples", examples)

# ---- across photos of the same piece: his phone closet
DB = sorted(glob.glob(os.path.join(ROOT, "screenshots/phone/*/SQLite/kitted.db")))[-1]
con = sqlite3.connect(DB)
items = {r[0]: (r[1], r[2], r[3], json.loads(r[4] or "[]")) for r in con.execute(
    "select id, name, slot, merged_into, confirmed_fields from closet_items")}


def root(i):
    seen = set()
    while i in items and items[i][2] and i not in seen:
        seen.add(i); i = items[i][2]
    return i


groups = collections.defaultdict(list)
for item_id, gj, dec, fc in con.execute(
        "select item_id, garment_json, decision, fit_check_id from closet_observations where is_deleted=0"):
    g = json.loads(gj or "{}")
    groups[root(item_id)].append((g, fc))
print(f"\n# Across photos of the same piece (his phone, {os.path.basename(os.path.dirname(os.path.dirname(DB)))})")
agg = collections.Counter()
for iid, obs in groups.items():
    checks = {fc for _, fc in obs}
    if len(checks) < 2:
        continue
    name, slot = items.get(iid, ("?", "?"))[:2]
    vols = [g.get("volume") for g, _ in obs]
    legs = [g.get("leg_shape") for g, _ in obs] if slot == "bottom" else []
    cat = "bottom" if slot == "bottom" else "top"
    agg[(cat, "n")] += 1
    agg[(cat, "vol_same")] += len(set(vols)) == 1
    agg[(cat, "roomy_same")] += len({(v or 3) >= 4 for v in vols}) == 1
    if legs:
        agg[(cat, "leg_same")] += len(set(legs)) == 1
        agg[(cat, "leg_narrow_same")] += len({x in NARROW for x in legs}) == 1
        agg[(cat, "leg_group_same")] += len({leg_group(x) for x in legs}) == 1
    print(f"  {name:30s} {slot:9s} {len(checks)} checks · volume {vols}" + (f" · leg {legs}" if legs else ""))
for cat in ("top", "bottom"):
    n = agg[(cat, "n")]
    if n:
        print(cat, n, {k[1]: f"{v}/{n}" for k, v in agg.items() if k[0] == cat and k[1] != "n"})

# ---- accuracy vs labels (leg_labels.csv; every run counts)
lab = {}
for r in csv.DictReader(open(os.path.join(ET, "leg_labels.csv"))):
    if r["leg_shape"] in ("unsure", "na", ""):
        continue
    lab[r["photo"].replace("phone-", "oct8-")] = set(r["leg_shape"].replace("flare", "flare_bootcut").split("|"))
acc = collections.Counter()
for raw, arm in ((zoom, "B"), (zs, "B")):
    for e in raw:
        if e.get("arm") != arm or not e.get("json") or e["photo"] not in lab:
            continue
        bs = [g for g in e["json"]["garments"] if g.get("category") == "bottom"]
        if len(bs) != 1:
            continue
        got, ok = bs[0].get("leg_shape"), lab[e["photo"]]
        src = source_of(e["photo"])
        acc[(src, "n")] += 1
        acc[(src, "exact")] += got in ok
        acc[(src, "narrow")] += bool((got in NARROW) == any(x in NARROW for x in ok))
        acc[(src, "loose")] += (got in LOOSE) == any(x in LOOSE for x in ok)
print("\n# Leg reading vs labels (leg_labels.csv, Claude's blind labels; every run)")
for src in sorted({k[0] for k in acc}):
    n = acc[(src, "n")]
    print(f"{src:12s} n={n} exact {acc[(src,'exact')]/n:.0%} narrow-vs-not {acc[(src,'narrow')]/n:.0%} loose-vs-not {acc[(src,'loose')]/n:.0%}")

# ---- what the panel says about size (gold set, judges' reasons)
gm = {m["gid"]: m["photo"] for m in json.load(open(os.path.join(ROOT, "inputs/gold-judge/manifest.json")))}
jud = collections.defaultdict(list)
for f in glob.glob(os.path.join(ROOT, "inputs/gold-judge/judge-*-b*.csv")):
    for r in csv.DictReader(open(f)):
        p = gm.get(r["id"])
        if p:
            try:
                jud[p].append((float(r["fit"]), r["reason"].lower()))
            except ValueError:
                pass
SIZE_BAD = re.compile(r"too big|a size (up|down|big|large)|size down|swallow|drown|sloppy|too loose|too baggy|too long|tent|shapeless|oversized .*(fight|sloppy|wrong|swamp)|swamp")
TIGHT = re.compile(r"too tight|too small|pull|strain|clings|shrunk|a size small")
gold_by = runs_by_photo(gold)
rows = collections.Counter()
for p, js in jud.items():
    if p not in gold_by or 0 not in gold_by[p]:
        continue
    r0 = gold_by[p][0]
    roomy = any((g.get("volume") or 3) >= 4 for g in r0["garments"] if g.get("category") in ("top", "outerwear"))
    loose = any(g.get("leg_shape") in LOOSE for g in r0["garments"] if g.get("category") == "bottom")
    fit = sorted(x[0] for x in js)[len(js) // 2]
    bad = sum(bool(SIZE_BAD.search(x[1])) for x in js) >= 2
    tight = sum(bool(TIGHT.search(x[1])) for x in js) >= 2
    k = ("roomy top" if roomy else "regular top") + (" + loose leg" if loose else "")
    rows[(k, "n")] += 1; rows[(k, "fit")] += fit; rows[(k, "bad")] += bad; rows[(k, "tight")] += tight
    rows[("all", "n")] += 1; rows[("all", "bad")] += bad; rows[("all", "tight")] += tight; rows[("all", "fit")] += fit
print("\n# Gold panel on size (2+ of 5 judges name a size/baggy problem)")
for k in sorted({k[0] for k in rows}):
    n = rows[(k, "n")]
    print(f"{k:26s} n={n:3d} panel Fit median-of-5 mean {rows[(k,'fit')]/n:.2f} · 'too big/baggy' {rows[(k,'bad')]}/{n} ({rows[(k,'bad')]/n:.0%}) · 'too tight' {rows[(k,'tight')]}")

kw = collections.Counter(); what = collections.Counter(); samples = []
for p, js in jud.items():
    hits = [x[1] for x in js if SIZE_BAD.search(x[1])]
    if len(hits) < 2:
        continue
    for h in hits:
        for m in SIZE_BAD.finditer(h):
            kw[m.group(0)[:20]] += 1
        for w in ("sleeve", "pant", "trouser", "jean", "jacket", "shirt", "tee", "hoodie", "coat", "blazer", "short", "hem", "shoulder"):
            if w in h: what[w] += 1
    if len(samples) < 8: samples.append((p, hits[0][:160]))
print("\nkeywords", kw.most_common(12)); print("about", what.most_common(12))
for s in samples: print(s)
