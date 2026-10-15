#!/usr/bin/env python3
"""The waist ruler test (DECISIONS-LOG #264): does the visual waistline measured on the phone (vision/WaistRuler.swift)
beat the AI's top length and tuck at saying "the waist shows" (a tuck, a short top, a visible waistband)?

  vision/build.sh
  /usr/bin/python3 waist_test.py --out results/waist1            (runs every photo × 4 variants, then the report)
  /usr/bin/python3 waist_test.py --report results/waist1         (re-analyze only)
  /usr/bin/python3 waist_test.py --out results/waist-dev --fast --sets dev   (tuning: base run, dev photos only)

Photos: the fit ruler's set (his phone checks, Oct 7, the 12 mirror selfies, the 40 stock photos; photos the app
refuses for two people are left out) and the 225 gold-set screenshots. Labels: waist_labels/labels-*.csv (Claude
subagents, Oct 14, by eye from the face-hidden copies, before anything was measured; guide waist_labels/GUIDE.md).
Dev (tuning allowed): stock, mirror and the odd-numbered gold photos. Test (held out, scored once): his photos and
the even-numbered gold photos.
"""
import argparse, csv, json, re, subprocess, sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import fit_ruler as FR  # noqa: E402

TOOL = HERE / "vision" / "bin" / "kmeasure"
GOLD = HERE / "results" / "gold1"
VETO = -0.12
CONSENSUS = True  # truth = photos where both label passes agree (--single for the first pass alone)
VARIANTS = {"base": [], "again": [], "max1600": ["--max", "1600"], "crop3": ["--crop", "0.03"]}
MULTI = {"phone-1f1b29", "phone-602c13", "phone-6bf356", "phone-729b22", "stock-s18-before_phone"}


def photos():
    out = []
    for p in FR.photo_set():
        if p["id"] not in MULTI:
            out.append({"id": p["id"], "path": str(p["path"]), "group": p["group"], "pull": p.get("pull"), "hash": p.get("hash")})
    for m in json.loads((GOLD / "manifest.json").read_text()):
        out.append({"id": m["id"], "path": m["path"], "group": "gold-" + m["source"]})
    for p in out:
        p["set"] = split_of(p)
    return out


def split_of(p):
    g = p["group"]
    if g in ("stock", "mirror"):
        return "dev"
    if g in ("phone", "oct7"):
        return "test"
    n = int(re.sub(r"\D", "", p["id"]) or 0)
    return "dev" if n % 2 else "test"


# ---------------------------------------------------------------- the AI's call, as the engine uses it (PR1)

def ai_call(j):
    """'waist_shows' / 'covered' / None, the way parts_proto's PR1 reads it: the first top, no outer layer, tucked
    in full or a cropped / at-belt length. With an outer layer PR1 never fires: None (not comparable)."""
    gs = j.get("garments") or []
    tops = [g for g in gs if g.get("category") == "top"]
    outers = [g for g in gs if g.get("category") == "outerwear"]
    if not tops:
        return None, None
    T = tops[0]
    shows = T.get("tucked") == "full" or T.get("length") in ("cropped", "at_belt")
    loose = T.get("tucked") in ("full", "half") or T.get("length") in ("cropped", "at_belt")
    return ("waist_shows" if shows else "covered", bool(outers)), ("waist_shows" if loose else "covered")


def ai_readings(ps):
    out = defaultdict(list)
    zoom = FR.ai_readings()
    for p in ps:
        if p["group"] == "phone":
            out[p["id"]] = zoom.get(p["id"]) or (FR.pull_readings(Path(p["pull"]), p["hash"]) if p.get("pull") else [])
        elif not p["group"].startswith("gold"):
            out[p["id"]] = zoom.get(p["id"], [])
    for r in json.loads((GOLD / "raw.json").read_text()):
        if isinstance(r.get("json"), dict):
            out[r["photo"]].append(r["json"])
    return out


# ---------------------------------------------------------------- labels

def load_labels():
    out = {}
    for f in sorted((HERE / "waist_labels").glob("labels-*.csv")):
        for r in csv.DictReader(f.open()):
            out[r["photo"].replace(".full.jpg", "").strip()] = {k: (v or "").strip() for k, v in r.items()}
    return out


def load_second():
    out = {}
    for f in sorted((HERE / "waist_labels").glob("second-*.csv")):
        for r in csv.DictReader(f.open()):
            out[r["photo"].replace(".full.jpg", "").strip()] = {"yes": "waist_shows", "no": "covered"}.get((r.get("waist") or "").strip())
    return out


def truth(lab):
    """Both passes: the first pass's call when the second pass (GUIDE2) agrees, else None."""
    t = truth1(lab)
    if t is None or not SECOND:
        return t
    return t if SECOND.get(lab.get("photo", "").replace(".full.jpg", "").strip()) == t else None


SECOND = {}


def truth1(lab):
    """'waist_shows' / 'covered' / None (can't tell or ambiguous)."""
    if not lab or lab.get("bottoms") == "shorts":
        return None
    wb = lab.get("waistband", "")
    vals = set()
    for te in lab.get("top_end", "ns").split("|"):
        if te in ("tucked", "cropped"):
            vals.add("waist_shows")
        elif te == "at_waistband":
            vals.add("waist_shows" if wb in ("yes", "partly") else "covered" if wb == "no" else None)
        elif te in ("mid_fly", "below_crotch"):
            vals.add("covered")
        else:
            vals.add(None)
    return vals.pop() if len(vals) == 1 else None


def truth4(lab):
    if not lab or lab.get("bottoms") == "shorts":
        return None
    t = truth(lab)
    te = lab.get("top_end", "")
    if t == "waist_shows":
        return "waist"
    if t == "covered":
        return "below_crotch" if te == "below_crotch" else "mid_fly" if te == "mid_fly" else "mid_fly"
    return None


# ---------------------------------------------------------------- run

def run_all(out, variants, sets):
    out.mkdir(parents=True, exist_ok=True)
    (out / "overlays").mkdir(exist_ok=True)
    (out / "runs").mkdir(exist_ok=True)
    ps = [p for p in photos() if not sets or p["set"] in sets]
    for i, p in enumerate(ps):
        for v in variants:
            dst = out / "runs" / f"{p['id']}.{v}.json"
            cmd = [str(TOOL), "waist", p["path"], str(dst)] + VARIANTS[v]
            if v == "base":
                cmd += ["--overlay", str(out / "overlays" / f"{p['id']}.jpg")]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode:
                print(p["id"], v, "failed", r.stderr[-200:])
        if i % 25 == 0:
            print(i, "/", len(ps), flush=True)
    (out / "manifest.json").write_text(json.dumps([{k: str(v) if isinstance(v, Path) else v for k, v in p.items()} for p in ps], indent=1))


# ---------------------------------------------------------------- analysis

def pct(a, b):
    return f"{a}/{b} ({round(100 * a / b)}%)" if b else "–"


def measured(run):
    w = (run or {}).get("waist") or {}
    return w.get("value", "unsure") if run and run.get("status") == "ok" else "unsure"


def analyze(out, write=True):
    labels = load_labels()
    SECOND.clear()
    if CONSENSUS:
        SECOND.update(load_second())
    ps = json.loads((out / "manifest.json").read_text())
    ai = ai_readings(ps)
    runs = {}
    for p in ps:
        runs[p["id"]] = {}
        for v in VARIANTS:
            f = out / "runs" / f"{p['id']}.{v}.json"
            if f.exists():
                runs[p["id"]][v] = json.loads(f.read_text())
    rows = []
    for p in ps:
        lab = labels.get(p["id"])
        t = truth(lab)
        base = runs[p["id"]].get("base")
        m = measured(base)
        calls = [ai_call(j) for j in ai.get(p["id"], [])]
        pr1 = [c[0][0] for c in calls if c[0] and not c[0][1]]    # PR1-comparable: no outer layer read
        any_ = [c[0][0] for c in calls if c[0]]
        w = (base or {}).get("waist") or {}
        rows.append({
            "id": p["id"], "group": p["group"], "set": p["set"], "truth": t, "measured": m,
            "again": measured(runs[p["id"]].get("again")) if "again" in runs[p["id"]] else None,
            "max1600": measured(runs[p["id"]].get("max1600")) if "max1600" in runs[p["id"]] else None,
            "crop3": measured(runs[p["id"]].get("crop3")) if "crop3" in runs[p["id"]] else None,
            "ai": any_, "ai_pr1": pr1, "why": w.get("why", ""), "pants_s": w.get("pants_start_s"), "top_s": w.get("top_end_s"),
            "visual_s": w.get("visual_s"), "split": w.get("split_upper_share"), "sep": w.get("sep"), "belt": w.get("belt_band"),
            "edge_value": w.get("edge_value"), "crotch_s": w.get("crotch_mask_s"), "rise": w.get("rise_T"), "edge_s": (w.get("edge_peak") or {}).get("s"),
            "outer": (lab or {}).get("outer"), "shot": (lab or {}).get("shot"), "dark": (lab or {}).get("dark_on_dark"),
            "hand": (lab or {}).get("hand_at_waist"), "conf": (lab or {}).get("confidence"), "top_end": (lab or {}).get("top_end"),
            "waistband": (lab or {}).get("waistband"), "tuck": (lab or {}).get("tuck"), "leg": (lab or {}).get("leg"),
            "shin_over_thigh": ((base or {}).get("legs") or {}).get("shin_over_thigh"), "status": (base or {}).get("status"),
        })
    return rows


def table(rows, title, keep=lambda r: True):
    """The core comparison on labeled photos passing `keep`."""
    R = [r for r in rows if r["truth"] and keep(r)]
    n = len(R)
    sure = [r for r in R if r["measured"] != "unsure"]
    right = sum(r["measured"] == r["truth"] for r in sure)
    ai_n = sum(len(r["ai"]) for r in sure)
    ai_right = sum(sum(v == r["truth"] for v in r["ai"]) for r in sure)
    ai_all_n = sum(len(r["ai"]) for r in R)
    ai_all = sum(sum(v == r["truth"] for v in r["ai"]) for r in R)
    def same(v):
        S = [r for r in R if r.get(v) is not None]
        return f"{sum(r[v] == r['measured'] for r in S)}/{len(S)}"
    ai_steady = [r for r in R if len(r["ai"]) >= 2]
    # Combined: the ruler when sure, else the AI's first run.
    comb = [(r["measured"] if r["measured"] != "unsure" else (r["ai"][0] if r["ai"] else None)) for r in R]
    comb_right = sum(c == r["truth"] for c, r in zip(comb, R))
    # Veto: the AI's call, except a sure "covered" from the ruler cancels the AI's "waist_shows".
    veto = [("covered" if (r["ai"] and r["ai"][0] == "waist_shows" and r["measured"] == "covered") else (r["ai"][0] if r["ai"] else None)) for r in R]
    veto_right = sum(c == r["truth"] for c, r in zip(veto, R))
    # The frozen veto (dev, Oct 14): only when the pants start clearly low (s < VETO) and no belt band was seen.
    def vcall(r, a):
        return "covered" if (a == "waist_shows" and r["pants_s"] is not None and r["pants_s"] < VETO and not r["belt"]) else a
    v_runs = [(vcall(r, a), r["truth"]) for r in R for a in r["ai"]]
    a_runs = [(a, r["truth"]) for r in R for a in r["ai"]]
    v_fix = sum(1 for r in R for a in r["ai"] if vcall(r, a) != a and r["truth"] == "covered")
    v_break = sum(1 for r in R for a in r["ai"] if vcall(r, a) != a and r["truth"] == "waist_shows")
    ai_first_right = sum((r["ai"][0] if r["ai"] else None) == r["truth"] for r in R)
    # False "waist" calls (what the credit fires on wrongly)
    def fp(calls):
        return sum(1 for c, r in zip(calls, R) if c == "waist_shows" and r["truth"] == "covered")
    return [f"### {title}", "",
            f"Labeled photos: {n} (waist shows {sum(r['truth'] == 'waist_shows' for r in R)}, covered {sum(r['truth'] == 'covered' for r in R)}).", "",
            "| | Ruler | AI |", "|---|---|---|",
            f"| Right when it answers | {pct(right, len(sure))} | {pct(ai_right, ai_n)} on the same photos · {pct(ai_all, ai_all_n)} on all |",
            f"| Unsure | {pct(n - len(sure), n)} | 0 |",
            f"| Same answer: rerun · 1600 px · 3% crop | {same('again')} · {same('max1600')} · {same('crop3')} | {pct(sum(len(set(r['ai'])) == 1 for r in ai_steady), len(ai_steady))} photos same over runs |",
            f"| Wrong \"waist shows\" (the credit firing on a covered waist), first AI run | {sum(r['measured'] == 'waist_shows' and r['truth'] == 'covered' for r in sure)} | {fp([r['ai'][0] if r['ai'] else None for r in R])} |",
            f"| Combined: ruler when sure, else the AI | {pct(comb_right, n)} | AI alone (first run) {pct(ai_first_right, n)} |",
            f"| Frozen veto (pants start below s {VETO}, no belt): every AI run | {pct(sum(a == b for a, b in v_runs), len(v_runs))} (fixes {v_fix}, breaks {v_break}) | AI runs alone {pct(sum(a == b for a, b in a_runs), len(a_runs))} |",
            ""]


def report(out):
    rows = analyze(out)
    L = ["# Waist ruler test", "", f"Run `{out.name}`. Truth: waist_labels/ (Claude subagents, Oct 14, blind). "
         "\"Waist shows\" = tucked, a cropped top, or a hem at the waistband with the waistband visible.", ""]
    for setname in ("dev", "test", "all"):
        keep = (lambda r, s=setname: s == "all" or r["set"] == s)
        L += [f"## {setname}", ""]
        L += table(rows, "All labeled", keep)
        L += table(rows, "No outer layer (where the credit can fire)", lambda r, k=keep: k(r) and r["outer"] == "none")
        L += table(rows, "His photos", lambda r, k=keep: k(r) and r["group"] in ("phone", "oct7"))
        L += table(rows, "Mirror selfies", lambda r, k=keep: k(r) and r["shot"] == "mirror")
        L += table(rows, "Propped / other", lambda r, k=keep: k(r) and r["shot"] != "mirror")
        L += table(rows, "Dark on dark", lambda r, k=keep: k(r) and r["dark"] == "yes")
        L += table(rows, "Hand at the waist", lambda r, k=keep: k(r) and r["hand"] == "yes")
        L += table(rows, "High-confidence labels only", lambda r, k=keep: k(r) and r["conf"] == "high")
    why = Counter(r["why"] for r in rows if r["measured"] == "unsure" and r["truth"])
    L += ["## Why unsure (labeled photos)", "", *[f"- {k or '(status ' + 'not ok)'}: {v}" for k, v in why.most_common()], ""]
    # Where the pants start, by label: the spread the cut has to separate.
    by = defaultdict(list)
    for r in rows:
        if r["pants_s"] is not None and r["top_end"]:
            by[r["top_end"]].append(r["pants_s"])
    L += ["## Where the pants start (s, torsos above the hip joints), by the labeled top end", "", "| Label | n | 10% | median | 90% |", "|---|---|---|---|---|"]
    for k, v in sorted(by.items(), key=lambda kv: -len(kv[1])):
        v = sorted(v)
        if len(v) >= 3:
            L.append(f"| {k} | {len(v)} | {v[len(v) // 10]:.2f} | {v[len(v) // 2]:.2f} | {v[(9 * len(v)) // 10]:.2f} |")
    sp = defaultdict(list)
    for r in rows:
        if r["split"] is not None and r["truth"]:
            sp[r["truth"]].append(r["split"])
    L += ["", "## The visual split (upper share: shoulders → waistline over shoulders → ankles)", ""]
    for k, v in sp.items():
        v = sorted(v)
        L.append(f"- {k}: n {len(v)}, median {v[len(v) // 2]:.2f}, 10–90% {v[len(v) // 10]:.2f}–{v[(9 * len(v)) // 10]:.2f}")
    L += ["", "## Every labeled photo", "", "| Photo | Set | Label (top end · waistband) | Truth | Ruler | pants s | top s | AI runs | Why |", "|---|---|---|---|---|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: (r["set"], r["id"])):
        if not r["truth"]:
            continue
        mark = "" if r["measured"] == "unsure" else (" ✓" if r["measured"] == r["truth"] else " ✗")
        L.append(f"| {r['id']} | {r['set']} | {r['top_end']} · {r['waistband']} | {r['truth']} | {r['measured']}{mark} | "
                 f"{'' if r['pants_s'] is None else r['pants_s']} | {'' if r['top_s'] is None else r['top_s']} | {'/'.join(x[0] for x in r['ai'])} | {r['why']} |")
    (out / "report.md").write_text("\n".join(L) + "\n")
    (out / "rows.json").write_text(json.dumps(rows, indent=1))
    print("\n".join(L[:60]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "results" / "waist1"))
    ap.add_argument("--report")
    ap.add_argument("--fast", action="store_true")
    ap.add_argument("--sets", help="dev,test")
    ap.add_argument("--single", action="store_true", help="truth from the first label pass alone")
    a = ap.parse_args()
    CONSENSUS = not a.single
    if a.report:
        report(Path(a.report))
    else:
        run_all(Path(a.out), ["base"] if a.fast else list(VARIANTS), set(a.sets.split(",")) if a.sets else None)
        report(Path(a.out))
