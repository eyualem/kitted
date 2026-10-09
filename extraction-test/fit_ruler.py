#!/usr/bin/env python3
"""Fit ruler test (DECISIONS-LOG #170): measure where garments end against his own joints, on the phone and
without the AI, and compare with the AI's readings (zoom1 / zoom1-stock arm B, his phone checks' own readings).

  vision/build.sh                                  (builds bin/kmeasure with vision/FitRuler.swift)
  /usr/bin/python3 fit_ruler.py --out results/ruler1          (runs the ruler on every photo, then the report)
  /usr/bin/python3 fit_ruler.py --report results/ruler1       (re-analyze only)

Photos: his phone checks (every pull in screenshots/phone, kept copies), his Oct 7 photos, the 12 mirror
selfies, the 40 stock photos. Labels: ruler_labels.csv (Claude, Oct 9, made before the ruler ran) plus
inputs/phone-oct8/truth.csv (sleeve_end and hem, Oct 8). Garment boxes come from the closet call: the
phone's own (closet_observations) or results/closet1 (run 0).
"""
import argparse, csv, json, sqlite3, subprocess, tempfile
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
# Photos and pulls are git-ignored; a worktree reads them from the main checkout.
DATA = ROOT if (ROOT / "inputs").exists() else Path("/Users/eyu/Desktop/files/Kitted")
PULLS = DATA / "screenshots" / "phone"
TOOL = HERE / "vision" / "bin" / "kmeasure"
LABELS = HERE / "ruler_labels.csv"


def pull_photos():
    """{hash6: (pull dir, full hash)} for every kept photo in every pull; the latest pull wins."""
    out = {}
    for pull in sorted(p for p in PULLS.iterdir() if (p / "photos").is_dir()):
        for f in (pull / "photos").glob("*-photo.jpg"):
            h = f.name.split("-")[0]
            out[h[:6]] = (pull, h)
    return out


def photo_set():
    """[{id, path, group, mirrored?}]: phone = his checks, oct7, mirror = 12 mirror selfies, stock = 40 stock."""
    out = []
    for h6, (pull, h) in sorted(pull_photos().items()):
        out.append({"id": f"phone-{h6}", "path": pull / "photos" / f"{h}-photo.jpg", "group": "phone", "hash": h, "pull": pull})
    for d in sorted((DATA / "inputs" / "phone-oct7").iterdir()):
        if d.is_dir() and (d / "before_mirror.jpg").exists():
            out.append({"id": f"oct7-{d.name}", "path": d / "before_mirror.jpg", "group": "oct7", "closet": f"{d.name}/before_mirror.jpg"})
    for d in sorted((DATA / "inputs" / "mirror-fit-check-1").iterdir()):
        if d.is_dir():
            f = next(iter(sorted(d.glob("*.jp*g"))), None)
            if f:
                out.append({"id": f"mirror-{d.name}", "path": f, "group": "mirror", "closet": f"{d.name}/{f.name}"})
    for d in sorted((DATA / "inputs" / "fitcheck-photos").iterdir()):
        if d.is_dir():
            for f in sorted(d.glob("*.jp*g")):
                out.append({"id": f"stock-{d.name}-{f.stem}", "path": f, "group": "stock", "closet": f"{d.name}/{f.name}"})
    return out


# ---------------------------------------------------------------- inputs per photo

def closet1_boxes():
    """{'s01/before_studio.jpg': [garments]} from results/closet1 (run 0): category, subcategory, box."""
    out = {}
    for r in json.loads((HERE / "results" / "closet1" / "raw.json").read_text()):
        if r.get("run") != 0 or not isinstance(r.get("json"), dict):
            continue
        stubs = {i: g for i, g in r["stubs"]}
        gs = []
        for g in r["json"].get("garments", []):
            s = stubs.get(g.get("i"))
            if s and g.get("visible") and len(g.get("box_2d") or []) == 4:
                gs.append({"category": s["category"], "subcategory": s["subcategory"], "box": g["box_2d"], "sleeve_length": g.get("sleeve_length")})
        out[r["photo"]] = gs
    return out


def pull_boxes(pull: Path, h: str):
    db = sqlite3.connect(pull / "SQLite" / "kitted.db")
    rows = db.execute("""select o.garment_json, o.closet_json from closet_observations o join fit_checks f on f.id = o.fit_check_id
                         where f.image_hash = ? and o.closet_json is not null and o.is_deleted = 0 order by o.created_at, o.garment_index""", (h,)).fetchall()
    gs, seen = [], set()
    for gj, cj in rows:
        g, c = json.loads(gj), json.loads(cj)
        if not c.get("visible") or len(c.get("box") or []) != 4:
            continue
        key = (g["category"], tuple(c["box"]))
        if key in seen:
            continue
        seen.add(key)
        gs.append({"category": g["category"], "subcategory": g["subcategory"], "box": c["box"], "sleeve_length": c.get("sleeve_length")})
    return gs


def pull_readings(pull: Path, h: str):
    db = sqlite3.connect(pull / "SQLite" / "kitted.db")
    rows = db.execute("select reading_json from readings where image_hash = ? and source = 'full' order by created_at", (h,)).fetchall()
    return [json.loads(r[0]) for r in rows[:1]]


def ai_readings():
    """{photo id: [reading json, ...]}: zoom1 / zoom1-stock arm B (3 runs, close-ups on, the app's config)."""
    out = defaultdict(list)
    for name, prefix in (("zoom1", ""), ("zoom1-stock", "")):
        for r in json.loads((HERE / "results" / name / "raw.json").read_text()):
            if r.get("arm") == "B" and r.get("json"):
                pid = r["photo"].replace("oct8-", "phone-")
                out[pid].append(r["json"])
    return out


# ---------------------------------------------------------------- the AI's fields, in the ruler's terms

TOP_CATS = ("top", "outerwear")
LEN_ORDER = ["cropped", "at_belt", "mid_fly", "below_crotch"]
HEM_POS = {"cropped": "gap", "cuffed": "gap", "no_break": "meets", "slight_break": "meets", "full_break": "covers", "pooling": "covers"}


def ai_fields(j):
    gs = j.get("garments") or []
    outer = [g for g in gs if g["category"] == "outerwear"]
    tops = [g for g in gs if g["category"] == "top"]
    bottoms = [g for g in gs if g["category"] == "bottom"]
    f = {}
    # Sleeve: the outermost layer's.
    for g in outer + tops:
        if g.get("sleeve_end") not in (None, "na"):
            f["sleeve_end"] = g["sleeve_end"]; break
    # Top length: the lowest edge of the top stack; tucked when the only top is tucked and no outer layer.
    lens = [g.get("length") for g in outer + tops if g.get("length") in LEN_ORDER]
    if lens:
        f["top_length"] = max(lens, key=LEN_ORDER.index)
    elif tops and tops[0].get("tucked") in ("full", "half") and not outer:
        f["top_length"] = "tucked"
    if bottoms:
        b = bottoms[0]
        f["shorts"] = b.get("subcategory") in ("shorts", "athletic_shorts")
        if b.get("hem") in HEM_POS:
            f["hem"] = HEM_POS[b["hem"]]
            f["hem5"] = b["hem"]
    under = [g for g in tops if g.get("shows_below_outer") is not None]
    if outer and under:
        f["layers"] = "yes" if any(g.get("shows_below_outer") for g in under) else "no"
    return f


# ---------------------------------------------------------------- run

VARIANTS = {"base": [], "again": [], "max1600": ["--max", "1600"], "crop3": ["--crop", "0.03"]}


def run_all(out: Path, variants=None, groups=None):
    variants = variants or list(VARIANTS)
    out.mkdir(parents=True, exist_ok=True)
    (out / "overlays").mkdir(exist_ok=True)
    c1 = closet1_boxes()
    ai = ai_readings()
    manifest = []
    for p in photo_set():
        pid = p["id"]
        if groups and p["group"] not in groups:
            continue
        if p["group"] == "phone":
            boxes = pull_boxes(p["pull"], p["hash"])
            if pid not in ai:
                ai[pid] = pull_readings(p["pull"], p["hash"])
        else:
            boxes = c1.get(p["closet"], [])
        votes = Counter(ai_fields(j).get("shorts", False) for j in ai.get(pid, []))
        shorts = votes.most_common(1)[0][0] if votes else False
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(boxes, f)
        res = {}
        for v, extra in ((v, VARIANTS[v]) for v in variants):
            dst = out / "runs" / f"{pid}.{v}.json"
            dst.parent.mkdir(exist_ok=True)
            cmd = [str(TOOL), "ruler", str(p["path"]), str(dst), "--boxes", f.name] + (["--shorts"] if shorts else []) + extra
            if v == "base":
                cmd += ["--overlay", str(out / "overlays" / f"{pid}.jpg")]
            subprocess.run(cmd, check=True, capture_output=True)
            res[v] = json.loads(dst.read_text())
        manifest.append({"id": pid, "group": p["group"], "shorts": shorts, "boxes": len(boxes), "ai_runs": len(ai.get(pid, []))})
        if len(variants) == len(VARIANTS):
            print(pid, " ".join(f"{k}={res['base'].get(k, {}).get('value')}" for k in ("sleeve_end", "top_length", "hem", "shorts_length", "layers") if k in res["base"]))
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
    (out / "ai.json").write_text(json.dumps({k: [ai_fields(j) for j in v] for k, v in ai.items()}, indent=1))


# ---------------------------------------------------------------- analysis

COLLAPSE = {"cropped": "short", "at_belt": "regular", "mid_fly": "regular", "below_crotch": "long"}
MEASURES = {  # measure: (label column, labels that mean "not judged")
    "sleeve_end": ("sleeve_end", {"ns", "na", ""}),
    "top_length": ("top_length", {"ns", "na", "tucked", ""}),
    "top_length3": ("top_length", {"ns", "na", "tucked", ""}),
    "hem": ("hem_pos", {"ns", "na", ""}),
    "shorts_length": ("shorts_length", {"ns", "na", ""}),
    "layers": ("shows_below_outer", {"na", ""}),
    "top_length_box": ("top_length", {"ns", "na", "tucked", ""}),
    "hem_box": ("hem_pos", {"ns", "na", ""}),
}
LONG = {"above_wrist", "at_wrist", "covers_hand"}
SETS = {"dev (stock + mirror; tuned on)": ("stock", "mirror"), "test (his photos; held out)": ("phone", "oct7"), "all": ("stock", "mirror", "phone", "oct7")}


def load_labels():
    return {r["photo"]: r for r in csv.DictReader(LABELS.open())}


def pct(a, b):
    return f"{a}/{b} ({100 * a // b}%)" if b else "–"


def analyze(out: Path):
    labels = load_labels()
    manifest = {m["id"]: m for m in json.loads((out / "manifest.json").read_text())}
    ai = json.loads((out / "ai.json").read_text())
    runs = {}
    for pid in manifest:
        runs[pid] = {v: json.loads(f.read_text()) for v in VARIANTS if (f := out / "runs" / f"{pid}.{v}.json").exists()}
        for v in VARIANTS:
            runs[pid].setdefault(v, runs[pid]["base"])
    rows, table = [], {}
    for name, groups in SETS.items():
        for m, (col, skip) in MEASURES.items():
            st = Counter()
            for pid, meta in manifest.items():
                if meta["group"] not in groups or pid not in labels:
                    continue
                lab = labels[pid][col]
                if lab in skip:
                    continue
                # Photos taken before the closet call existed have no garment boxes: the hem and the layers need them.
                if m in ("hem", "layers", "top_length_box", "hem_box") and not meta["boxes"]:
                    continue
                ok = set(lab.split("|"))
                src = "top_length" if m == "top_length3" else m
                ai_src = {"top_length_box": "top_length", "hem_box": "hem"}.get(src, src)
                def val(v):
                    x = runs[pid][v].get(src, {}).get("value", "unsure")
                    if m == "layers" and x == "na":
                        x = "unsure"
                    return COLLAPSE.get(x, x) if m == "top_length3" else x
                if m == "top_length3":
                    ok = {COLLAPSE.get(x, x) for x in ok}
                st["n"] += 1
                base = val("base")
                sure = base != "unsure"
                st["sure"] += sure
                st["right"] += sure and base in ok
                st["same_again"] += val("again") == base
                for v in ("max1600", "crop3"):
                    st[f"same_{v}"] += val(v) == base
                # The AI on the same photos (every run counts), and only where it reads that field at all.
                comparable = not (m == "sleeve_end" and not ok & LONG) and m != "shorts_length"
                ai_vals = [f.get(ai_src) for f in ai.get(pid, [])]
                if m == "top_length3":
                    ai_vals = [COLLAPSE.get(v, v) for v in ai_vals]
                if comparable and ai_vals:
                    st["ai_n"] += len(ai_vals)
                    st["ai_right"] += sum(v in ok for v in ai_vals)
                    st["ai_photos"] += 1
                    st["ai_same"] += len(set(ai_vals)) == 1
                    if sure:
                        st["ai_n_sure"] += len(ai_vals); st["ai_right_sure"] += sum(v in ok for v in ai_vals)
                        st["r_sure_cmp"] += 1; st["r_right_cmp"] += base in ok
                    # The combination the app would use: the ruler when sure, else the AI's majority.
                    maj = Counter(ai_vals).most_common(1)[0][0]
                    st["comb_right"] += (base if sure else maj) in ok
                if name == "all":
                    if m != "top_length3":
                        rows.append({"photo": pid, "measure": m, "label": lab, "ruler": base, "ai": "/".join(str(v) for v in ai_vals),
                                     "why": runs[pid]["base"].get(m, {}).get("why", ""), "pos": runs[pid]["base"].get(m, {}).get("pos")})
            table[(name, m)] = st
    lines = ["# Fit ruler test", "", f"Run: {out.name}. Labels: `ruler_labels.csv` (Claude, Oct 9). AI = zoom1 / zoom1-stock arm B "
             "(3 runs, close-ups on) and his phone's own reading for the Oct 9 photos (1 run).", ""]
    for name in SETS:
        lines += [f"## {name}", "", "| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |",
                  "|---|---|---|---|---|---|---|---|---|---|"]
        for m in MEASURES:
            st = table[(name, m)]
            if not st["n"]:
                continue
            lines.append(f"| {m} | {st['n']} | {st['sure']} | {pct(st['right'], st['sure'])} | {pct(st['n'] - st['sure'], st['n'])} | "
                         f"{pct(st['ai_right'], st['ai_n'])} | {pct(st['ai_right_sure'], st['ai_n_sure'])} | {pct(st['comb_right'], st['ai_photos'])} | "
                         f"{st['same_again']}/{st['n']} · {st['same_max1600']}/{st['n']} · {st['same_crop3']}/{st['n']} | {pct(st['ai_same'], st['ai_photos'])} |")
        lines.append("")
    lines += ["## Every labeled reading", "", "| Photo | Measure | Label | Ruler | Position | Why unsure | AI runs |", "|---|---|---|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: (r["measure"], r["photo"])):
        mark = "" if r["ruler"] == "unsure" else (" ✓" if r["ruler"] in r["label"].split("|") else " ✗")
        pos = "" if r["pos"] is None else f"{r['pos']:.2f}"
        lines.append(f"| {r['photo']} | {r['measure']} | {r['label']} | {r['ruler']}{mark} | {pos} | {r['why']} | {r['ai']} |")
    (out / "report.md").write_text("\n".join(lines) + "\n")
    (out / "summary.json").write_text(json.dumps({f"{n} · {m}": dict(v) for (n, m), v in table.items()}, indent=1))
    print("\n".join(lines[:40]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "results" / "ruler1"))
    ap.add_argument("--report", help="re-analyze this results folder; no runs")
    ap.add_argument("--fast", action="store_true", help="base run only (tuning)")
    ap.add_argument("--groups", help="comma-separated: phone,oct7,mirror,stock")
    a = ap.parse_args()
    if a.report:
        analyze(Path(a.report))
    else:
        run_all(Path(a.out), ["base"] if a.fast else None, a.groups.split(",") if a.groups else None)
        analyze(Path(a.out))
