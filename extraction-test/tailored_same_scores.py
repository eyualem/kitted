#!/usr/bin/env python3
"""T94 · TL3: Tailored is a name, never a number. The $0 before/after proof (specs/tailored.md TL3.1-TL3.4).

  KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 tailored_same_scores.py
      [--base <git ref>]       the engine to compare against (default da9b7253: main's engine as T69 merged it, v15 and
                               v16; before the merge with main it was 541440c2, this branch before any engine change)
      [--sets parity,fixes,rubric,conformance,corpus,phone,gold]
      [--new-from <dir>]       the "after" engine is this checkout's, with any of rubric.py / parts_proto.py /
                               parts_fixes.py found in <dir> laid over it (a scratch plant); writes nothing
      [--self-check]           base against base: every case must be identical (proves the comparer); writes
                               results/tailored/self_check.json only

Writes results/tailored/report.md and summary.json (not with --new-from); exits 1 on any failure.

Two kinds of set (IMPLEMENTATION.md Step 4):
  (a) the parity sets: the base commit's parts_parity.json, parts_fixes.json, rubric_parity.json and
      rules_conformance.json. Their `expected` is the base engine's exact output; every case is re-run, by its own
      config (src, reading, occasion, styles, boldness, second look, tune, closet, warm, first check; for a v16 case also
      its season and graded look), on the after engine.
  (b) the saved real photos, run on both engines: the corpus (results/parts1/corpus.json), every phone pull's scored
      checks (deduped by image hash, the newest pull wins; the loader of hoodie_layer_paper.py) and every gold run
      (results/gold1/raw.json). Each at its own occasion (gold: everyday), with no picks and with its profile's picks,
      with fixes. Profiles (CLAUDE.md rule 7): gold and the corpus are "profile unknown", run with the one stated test
      profile (Minimal + Smart casual, 0.5 each, boldness a little); the phone pulls are the founder's own checks, run
      with his profile (born 2004, 22-25; picks streetwear, minimal, workwear). Each on engine v15 and on v16 (the
      engine the app scores new checks with since T69; cool, graded as the outfit's own looks).

Every number must be identical. Allowed to differ, name only: detected_styles may gain "tailored" (in LOOK_ORDER's
place) and nothing else; style_label may become "tailored" (only when "tailored" is detected); a line may differ only
by a look's name once both sides are normalized (any of the 8 names -> <look>; "a matching suit" -> "reads as <look>").
Also a failure (TL3.3): a reading that meets TL1 (rubric.is_tailored) whose detected looks lack "tailored", or whose
label is smart casual, classic prep or none; a label "tailored" on a reading that doesn't meet TL1. A Tailored outfit
that also reads as another look (minimal: an unstructured blazer) may carry that look's name when his picks choose it
(TL2.1's tie rule); the report lists those.

Each engine runs in its own subprocess (`-I`, its files laid out in a temp dir), so module names never collide.
No network, no AI call, $0.
"""
import argparse
import ast
import copy
import glob
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATA = Path(os.environ.get("KITTED_DATA", ROOT))
OUT = HERE / "results" / "tailored"
DEFAULT_BASE = "da9b7253"     # main's engine after T69 (PR #149); T94's own first base was 541440c2
ENGINE_FILES = {"rubric.py": "extraction-test/rubric.py", "parts_proto.py": "extraction-test/rubrics/parts_proto.py",
                "parts_fixes.py": "handoff/fixtures/parts_fixes.py"}
SUPPORT_FILES = ["handoff/fixtures/kitted_logic.py", "handoff/fixtures/fixes.json"]   # this checkout's, both engines
SETS = ["parity", "fixes", "rubric", "conformance", "corpus", "phone", "gold"]
LOOK_ORDER = ["vintage_sport", "outdoor", "workwear", "streetwear", "tailored", "classic_prep", "minimalist", "smart_casual"]
NAMES = ["vintage sport", "outdoor", "workwear", "streetwear", "tailored", "classic prep", "minimal", "smart casual"]
PROFILE = [["minimalist", 0.5], ["smart_casual", 0.5]]          # the stated test profile (gold, corpus)
FOUNDER = [["streetwear", 0.5], ["minimalist", 0.25], ["workwear", 0.25]]   # his picks, in order (hoodie_layer_paper.FOUNDER)
BOLD = "a_little"
EXTRA_PULLS = [Path("/Users/eyu/Desktop/files/Kitted/.claude/worktrees/recheck-added-layer-11b01f")]   # as hoodie_layer_paper


# ===================================================================================================== comparing
def norm_text(s):
    """A line with every look's name made the same: the 8 names -> <look>; "a matching suit" -> "reads as <look>"."""
    s = s.replace("a matching suit", "reads as <look>")
    for n in sorted(NAMES, key=len, reverse=True):
        s = s.replace(n, "<look>")
    return s


def with_tailored(det):
    return [s for s in LOOK_ORDER if s in det or s == "tailored"]


def diff(b, n, path, out):
    """Every difference between a base and an after output, as (path, kind, before, after). kind: "name" (allowed:
    a look's name only) or "number" (anything else)."""
    if isinstance(b, dict) and isinstance(n, dict):
        for k in sorted(set(b) | set(n), key=str):
            p = f"{path}.{k}" if path else str(k)
            if k not in b or k not in n:
                out.append((p, "number", b.get(k, "<missing>"), n.get(k, "<missing>")))
            elif k == "detected_styles" and isinstance(b[k], list) and isinstance(n[k], list):
                if b[k] != n[k]:
                    ok = "tailored" not in b[k] and n[k] == with_tailored(b[k])
                    out.append((p, "name" if ok else "number", b[k], n[k]))
            elif k == "style_label":
                if b[k] != n[k]:
                    ok = n[k] == "tailored" and "tailored" in (n.get("detected_styles") or [])
                    out.append((p, "name" if ok else "number", b[k], n[k]))
            else:
                diff(b[k], n[k], p, out)
    elif isinstance(b, list) and isinstance(n, list):
        if len(b) != len(n):
            out.append((path, "number", f"{len(b)} items", f"{len(n)} items"))
            return
        for i, (x, y) in enumerate(zip(b, n)):
            diff(x, y, f"{path}[{i}]", out)
    elif isinstance(b, str) and isinstance(n, str):
        if b != n:
            out.append((path, "name" if norm_text(b) == norm_text(n) else "number", b, n))
    elif type(b) is not type(n) or b != n:
        out.append((path, "number", b, n))


class Tally:
    """One set's counts, its failures in full and the name changes by old -> new label."""

    def __init__(self, name):
        self.name, self.cases, self.identical, self.name_only = name, 0, 0, 0
        self.failures, self.labels, self.ties, self.suits_kept = [], defaultdict(list), [], []

    def add(self, cid, cfg, b, n, tl=None, label_of=None, looks=None):
        """b, n: the two outputs. tl: rubric.is_tailored on the garments the engine judged (after engine), or None.
        label_of: (base, after) label pair for the report's label table, when the output carries one. looks: the part
        of the after output that carries detected_styles / style_label (default: n itself)."""
        self.cases += 1
        b, n = json.loads(json.dumps(b)), json.loads(json.dumps(n))      # tuples -> lists, as the stored fixtures
        looks = n if looks is None else json.loads(json.dumps(looks))
        d = []
        diff(b, n, "", d)
        bad = [x for x in d if x[1] == "number"]
        why = []
        if isinstance(looks, dict) and "detected_styles" in looks:
            det, lab = looks.get("detected_styles") or [], looks.get("style_label")
            if tl is not None and tl != ("tailored" in det):
                why.append(f"is_tailored {tl} but detected {det}")
            if tl and lab in ("smart_casual", "classic_prep", None):
                why.append(f"meets TL1 but its label is {lab}")
            if lab == "tailored" and tl is False:
                why.append("labelled tailored without meeting TL1")
            if tl and lab not in ("tailored", "smart_casual", "classic_prep", None):
                self.ties.append((cid, cfg.get("styles"), lab))
        if bad or why:
            self.failures.append({"set": self.name, "id": cid, "config": cfg, "changes": [list(x) for x in bad[:12]],
                                  "tl3_3": why})
            return
        if d:
            self.name_only += 1
        else:
            self.identical += 1
        if label_of and label_of[0] != label_of[1] and len(self.labels[f"{label_of[0]} -> {label_of[1]}"]) < 3:
            self.labels[f"{label_of[0]} -> {label_of[1]}"].append(cid)
        if label_of and label_of[0] != label_of[1]:
            self.labels.setdefault("_counts", Counter())[f"{label_of[0]} -> {label_of[1]}"] += 1

    def summary(self):
        counts = dict(self.labels.get("_counts", Counter()))
        return {"cases": self.cases, "identical": self.identical, "name_only": self.name_only, "failed": len(self.failures),
                "label_changes": counts, "label_examples": {k: v for k, v in self.labels.items() if k != "_counts"},
                "tailored_ties": len(self.ties), "tie_examples": self.ties[:5], "suits_kept": len(self.suits_kept),
                "suit_examples": self.suits_kept[:5], "failures": self.failures}


def matching_suit(n):
    """A card that still says "a matching suit" (founder 1: a suit that reads as no look)."""
    for p in (n.get("parts") or {}).values():
        if any(r.get("line") == "a matching suit" for r in p.get("reasons") or []):
            return True
    return False


# ===================================================================================================== engines
def git_show(ref, path):
    return subprocess.run(["git", "-C", str(ROOT), "show", f"{ref}:{path}"], capture_output=True, check=True).stdout


def engine_tree(ref, overlay=None):
    """A temp dir laid out like the repo with one engine's three files (from `ref`, or this checkout when ref is None,
    then anything in `overlay`) plus this checkout's kitted_logic.py and fixes.json."""
    t = Path(tempfile.mkdtemp(prefix="tl3-engine-"))
    for base, rel in ENGINE_FILES.items():
        dst = t / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        src = Path(overlay) / base if overlay and (Path(overlay) / base).exists() else None
        if src is not None:
            shutil.copyfile(src, dst)
        elif ref is None:
            shutil.copyfile(ROOT / rel, dst)
        else:
            dst.write_bytes(git_show(ref, rel))
    for rel in SUPPORT_FILES:
        dst = t / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / rel, dst)
    return t


def load_engine(tree):
    """(worker only) Import one engine from its temp tree."""
    tree = Path(tree)
    for p in ("handoff/fixtures", "extraction-test/rubrics", "extraction-test"):
        sys.path.insert(0, str(tree / p))
    import rubric as R  # noqa: E402
    import parts_proto as P  # noqa: E402
    import kitted_logic as K  # noqa: E402
    import parts_fixes as F  # noqa: E402
    assert Path(R.__file__).resolve().is_relative_to(tree.resolve()), R.__file__
    assert Path(P.__file__).resolve().is_relative_to(tree.resolve()), P.__file__
    assert Path(F.__file__).resolve().is_relative_to(tree.resolve()), F.__file__
    return R, P, K, F


def run_worker(tree, mode, *args):
    subprocess.run(["/usr/bin/python3", "-I", str(Path(__file__).resolve()), "--worker", mode, str(tree), *map(str, args)],
                   check=True, env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"})


# ===================================================================================================== worker side
def tune_calls(R, P):
    """make_parts_parity.py's tune variants: name -> (engine, what-if overrides). Read from its source (no import)."""
    src = (ROOT / "handoff/fixtures/make_parts_parity.py").read_text()
    consts = {}
    env = {"__builtins__": {}, "frozenset": frozenset, "set": set, "tuple": tuple, "dict": dict, "R": R, "P": P,
           "_taste": lambda **kw: {"taste": dict(P.TUNE["v16"]["taste"], **kw)}}   # make_parts_parity._taste
    for node in ast.parse(src).body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) \
                and node.targets[0].id.startswith("WHATIF"):
            # this repo's own constants (dicts of numbers, a few `1 / 3`-style sums): evaluated with no builtins
            consts[node.targets[0].id] = eval(compile(ast.Expression(node.value), "make_parts_parity.py", "eval"), env)

    def call(name):
        if name.startswith("v16_whatif_"):                      # T69: TUNES["v16_whatif_" + knob] = ("v16", WHATIF16[knob])
            return "v16", consts["WHATIF16"][name[len("v16_whatif_"):]]
        if not name.endswith("_whatif"):
            return name, None
        eng = name[:-len("_whatif")]
        return eng, consts["WHATIF" if eng == "v4" else "WHATIF" + eng[1:]]
    return call


def parts_garments(R, P, reading):
    scene, gs, _ = R._prepare(copy.deepcopy(reading))
    if scene.get("clothed") != "fully" or not gs:
        return None
    return P._refile(R._normalize(gs))


def run_parts(R, P, reading, occ, styles, sl, bold, engine="v15", tune=None, season=None, graded_look=None):
    """make_parts_parity.run() (run16() for engine v16: its own unrounded values, with the season and graded look):
    score_parts plus the unrounded average and final, or the error Python raised."""
    try:
        if engine == "v16":
            return P.score_parts(copy.deepcopy(reading), occ, {k: w for k, w in styles}, copy.deepcopy(sl), bold, "v16", tune,
                                 season=season, graded_look=copy.deepcopy(graded_look))
        res = P.score_parts(copy.deepcopy(reading), occ, {k: w for k, w in styles}, copy.deepcopy(sl), bold, engine, tune)
    except Exception as e:  # noqa: BLE001  (a stored error must be the same error)
        return {"error": f"{type(e).__name__}: {e}"}
    if res["overall"] is not None:
        ps = {k: res["parts"][k]["score"] for k in P.PART_ORDER if res["parts"][k]["score"] is not None}
        avg, x, _, _ = P.combine(ps, res["condition"], res["occasion"], occ, res["care_or_strain"], engine, tune)
        res["average_unrounded"], res["raw_unrounded"] = avg, x
    return res


def is_tl(R, gs):
    if gs is None or not hasattr(R, "is_tailored"):
        return None
    return bool(R.is_tailored(gs))


def worker_parity(tree, which, base_ref, out_path):
    """(a): re-run every case of the base commit's fixture on this engine and compare with its stored `expected`."""
    R, P, K, F = load_engine(tree)
    T = Tally(which)
    rp = json.loads(git_show(base_ref, "handoff/fixtures/rubric_parity.json"))
    if which == "rubric":
        keep = ("overall", "reason", "partial", "rules_fired", "raw_score", "raw_unrounded", "subscores", "occasion_adj",
                "credits", "credit_points", "credit_unrounded", "mistake_points", "mistakes_unrounded", "advice", "not_rated",
                "detected_styles", "style_label")
        for i, c in enumerate(rp["cases"]):
            r = rp["readings"][c["reading"]]
            s = K.score(r, c["occasion"], c["styles"], c["boldness"])
            n = {"expected": {k: s[k] for k in keep if k in s},
                 "ask": R.ask_question(copy.deepcopy(r), c["occasion"], {k: w for k, w in c["styles"]}, c["boldness"])}
            b = {"expected": c["expected"], "ask": c["ask"]}
            cfg = {"reading": c["reading"], "occasion": c["occasion"], "styles": c["styles"], "boldness": c["boldness"]}
            T.add(f"rubric#{i}", cfg, b, n, is_tl(R, R.scored_garments(r)) if "detected_styles" in s else None,
                  (c["expected"].get("style_label"), s.get("style_label")) if "style_label" in s else None)
    elif which == "parity":
        pp = json.loads(git_show(base_ref, "handoff/fixtures/parts_parity.json"))
        pool, calls = pp["pool"], tune_calls(R, P)
        for i, c in enumerate(pp["cases"]):
            r = pp["readings"].get(c["reading"]) or rp["readings"][c["reading"]]
            e = dict(c["expected"])
            if "parts" in e:
                e["parts"] = {k: pool[v] for k, v in e["parts"].items()}
            for k in ("condition", "occasion", "lowest", "weights_used"):
                if k in e:
                    e[k] = pool[e[k]]
            eng, tn = ("v15", None) if "tune" not in c else calls(c["tune"])
            n = run_parts(R, P, r, c["occasion"], c["styles"], c["second_look"], c["boldness"], eng, tn, c.get("season"),
                          c.get("graded_look"))
            cfg = {k: c.get(k) for k in ("src", "reading", "occasion", "styles", "boldness", "second_look", "tune", "season",
                                         "graded_look")}
            T.add(f"parity#{i}:{c['src']}", cfg, e, n, is_tl(R, parts_garments(R, P, r)) if "detected_styles" in n else None,
                  (e.get("style_label"), n.get("style_label")) if "style_label" in n else None)
            if n.get("style_label") is None and matching_suit(n):
                T.suits_kept.append(f"parity#{i}:{c['src']}")
        del pp
    elif which == "fixes":
        fx = json.loads(git_show(base_ref, "handoff/fixtures/parts_fixes.json"))
        pool = fx["pool"]
        for i, c in enumerate(fx["cases"]):
            r = fx["readings"].get(c["reading"]) or rp["readings"][c["reading"]]
            e = dict(c["expected"])
            e["fixes"] = [pool[j] for j in e["fixes"]]
            if e["smaller_step"] is not None:
                e["smaller_step"] = pool[e["smaller_step"]]
            st = c.get("styles", fx["profile"])
            v16 = c.get("tune") == "v16" or c.get("engine") == "v16"          # T69: a v16 case is tagged, with its season
            n = F.suggest_parts_fixes(copy.deepcopy(r), c["occasion"], st, fx["boldness"], copy.deepcopy(c["second_look"]),
                                      fx["closet"] if c["closet"] == "seed" else [], c["warm"], c["first_check"],
                                      **({"engine": "v16", "season": c.get("season")} if v16 else {}))
            cfg = {k: c.get(k) for k in ("src", "reading", "occasion", "second_look", "warm", "closet", "first_check", "tune",
                                         "season")}
            cfg["styles"] = st
            T.add(f"fixes#{i}:{c['src']}", cfg, e, json.loads(json.dumps(n)))
        del fx
    elif which == "conformance":
        rc = json.loads(git_show(base_ref, "handoff/fixtures/rules_conformance.json"))
        for c in rc["cases"]:
            n = run_parts(R, P, c["reading"], c["occasion"], c["styles"], c["second_look"], c["boldness"],
                          c.get("engine", "v15"), None, c.get("season"), c.get("graded_look"))
            if "error" in n or n.get("overall") is None:
                proj = {"overall": n.get("overall"), "error": n.get("error")}
                b = {"overall": c["python"].get("overall"), "error": c["python"].get("error")}
            else:
                proj = {"overall": n["overall"], "raw_score": n["raw_score"],
                        "parts": {k: v["score"] for k, v in n["parts"].items()},
                        "detected_styles": n["detected_styles"], "style_label": n["style_label"]}
                b = {k: c["python"].get(k) for k in proj}
            cfg = {k: c.get(k) for k in ("id", "occasion", "styles", "boldness", "second_look", "engine", "season")}
            T.add(c["id"], cfg, b, proj, is_tl(R, parts_garments(R, P, c["reading"])) if "detected_styles" in proj else None,
                  (b.get("style_label"), proj.get("style_label")) if "style_label" in proj else None)
    Path(out_path).write_text(json.dumps(T.summary()))


def worker_real(tree, jobs_path, out_path):
    """(b): one engine's outputs on the real photos (parts, fixes, is_tailored), for the parent to compare."""
    R, P, K, F = load_engine(tree)
    jobs = json.loads(Path(jobs_path).read_text())
    out = []
    for j in jobs:
        r, occ, st, sl = j["reading"], j["occasion"], j["styles"], j.get("second_look")
        eng = j.get("engine", "v15")
        o = {"id": j["id"], "parts": run_parts(R, P, r, occ, st, sl, BOLD, eng)}
        if j.get("fixes"):
            try:
                o["fixes"] = json.loads(json.dumps(F.suggest_parts_fixes(copy.deepcopy(r), occ, st, BOLD, copy.deepcopy(sl),
                                                                         **({"engine": "v16"} if eng == "v16" else {}))))
            except Exception as e:  # noqa: BLE001
                o["fixes"] = {"error": f"{type(e).__name__}: {e}"}
        gs = parts_garments(R, P, r)
        o["is_tailored"] = is_tl(R, gs)
        if gs is not None and hasattr(R, "is_tailored") and o["is_tailored"] is False:
            o["blocks"] = blocker(R, gs)
        out.append(o)
    Path(out_path).write_text(json.dumps(out))


def blocker(R, gs):
    """The piece (or the missing piece) that keeps a reading from TL1."""
    c = R.Outfit(gs)
    if not any(g.get("subcategory") in R.TL_JACKET for g in c.tops + c.outer):
        return "no tailored jacket"
    if c.bsub not in R.TL_TROUSERS:
        return f"bottom: {c.bsub or 'not in view'}"
    never = sorted(c.subs & R.TL_NEVER)
    if never:
        return "never-list: " + ", ".join(never)
    big = [g.get("subcategory") for g in c.main if (g.get("volume") or 3) >= 5]
    return "roominess 5: " + ", ".join(big) if big else "?"


# ===================================================================================================== the real photos
def load_corpus():
    return [{"id": x["id"], "file": x.get("photo") or x["id"], "reading": x["reading"], "occasion": x["occ"]}
            for x in json.loads((HERE / "results/parts1/corpus.json").read_text())]


def load_phone():
    """hoodie_layer_paper.load_phone(): every scored check in every pull, deduped by image hash (newest pull wins)."""
    out = {}
    dbs = sorted(glob.glob(str(DATA / "screenshots/phone/*/SQLite/kitted.db")))
    for e in EXTRA_PULLS:
        dbs += sorted(glob.glob(str(e / "screenshots/phone/*/SQLite/kitted.db")))
    for db in dbs:
        cx = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        try:
            q = cx.execute("select f.image_hash, f.occasion, r.reading_json, f.details, f.created_at from fit_checks f join "
                           "readings r on r.id = f.reading_id where f.status = 'scored' order by f.created_at").fetchall()
        except sqlite3.Error:
            q = []
            try:
                q = [(h, o, j, "{}", c) for h, o, j, c in cx.execute(
                    "select f.image_hash, f.occasion, r.reading_json, f.created_at from fit_checks f join readings r on "
                    "r.id = f.reading_id where f.status = 'scored'").fetchall()]
            except sqlite3.Error:
                continue
        for h, occ, js, det, ca in q:
            if not js:
                continue
            try:
                d = json.loads(det or "{}")
            except ValueError:
                d = {}
            slr = d.get("secondLook") or {}
            sl = None
            if slr.get("u") or slr.get("l"):
                sl = {**(slr.get("u") or {}), **(slr.get("l") or {})}
            pull = Path(db).parent.parent.name
            out["phone-" + h[:6]] = {"id": "phone-" + h[:6], "file": f"{pull} check {h[:6]}", "reading": json.loads(js),
                                     "occasion": occ, "second_look": sl}
    return list(out.values())


def load_gold():
    raw = json.loads((DATA / "extraction-test/results/gold1/raw.json").read_text())
    return [{"id": f"gold:{x['photo']}:run{x['run']}", "file": x["photo"], "run": x["run"], "reading": x["json"],
             "occasion": "everyday"} for x in sorted(raw, key=lambda x: (x["photo"], x["run"])) if x.get("json")]


def real_jobs(name, photos):
    prof = FOUNDER if name == "phone" else PROFILE
    jobs = []
    for p in photos:
        for eng in ("v15", "v16"):                               # v16: the engine new checks score with since T69
            for pn, st in (("none", []), ("profile", prof)):
                jobs.append({"id": f"{p['id']}|{pn}" + ("" if eng == "v15" else "|v16"), "reading": p["reading"],
                             "occasion": p["occasion"], "styles": st, "second_look": p.get("second_look"), "fixes": True,
                             "engine": eng})
    return jobs


def jacket_led(reading):
    return any(g.get("category") in ("top", "outerwear") and g.get("subcategory") in
               {"blazer", "suit_jacket", "sport_coat", "unstructured_blazer"} and g.get("certainty") != "unsure"
               for g in reading.get("garments") or [])


# ===================================================================================================== the parent
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--sets", default=",".join(SETS))
    ap.add_argument("--new-from")
    ap.add_argument("--self-check", action="store_true")
    ap.add_argument("--worker", nargs="+")
    a = ap.parse_args()
    if a.worker:
        mode, tree, *rest = a.worker
        if mode == "parity":
            worker_parity(tree, *rest)
        elif mode == "real":
            worker_real(tree, *rest)
        return 0

    sets = [s for s in a.sets.split(",") if s]
    assert all(s in SETS for s in sets), sets
    base_sha = subprocess.run(["git", "-C", str(ROOT), "rev-parse", a.base], capture_output=True, text=True, check=True).stdout.strip()
    head_sha = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    work = Path(tempfile.mkdtemp(prefix="tl3-"))
    base_tree = engine_tree(a.base)
    new_tree = base_tree if a.self_check else engine_tree(None, a.new_from)
    results, extra = {}, {}
    try:
        for s in ("parity", "fixes", "rubric", "conformance"):
            if s in sets:
                print(f"[{s}] re-running the base fixture's cases on the after engine", flush=True)
                run_worker(new_tree, "parity", s, a.base, work / f"{s}.json")
                results[s] = json.loads((work / f"{s}.json").read_text())
        photos_by_set = {}
        for s, loader in (("corpus", load_corpus), ("phone", load_phone), ("gold", load_gold)):
            if s not in sets:
                continue
            photos = loader()
            photos_by_set[s] = photos
            (work / f"{s}-jobs.json").write_text(json.dumps(real_jobs(s, photos)))
            print(f"[{s}] {len(photos)} readings on both engines", flush=True)
            run_worker(base_tree, "real", work / f"{s}-jobs.json", work / f"{s}-base.json")
            run_worker(new_tree, "real", work / f"{s}-jobs.json", work / f"{s}-new.json")
            B = {o["id"]: o for o in json.loads((work / f"{s}-base.json").read_text())}
            N = {o["id"]: o for o in json.loads((work / f"{s}-new.json").read_text())}
            T = Tally(s)
            for j in json.loads((work / f"{s}-jobs.json").read_text()):
                b, n = B[j["id"]], N[j["id"]]
                cfg = {"occasion": j["occasion"], "styles": j["styles"], "second_look": j["second_look"], "engine": j["engine"]}
                bo = {"parts": b["parts"], "fixes": b.get("fixes")}
                no = {"parts": n["parts"], "fixes": n.get("fixes")}
                T.add(j["id"], cfg, bo, no, n["is_tailored"] if "detected_styles" in n["parts"] else None,
                      (b["parts"].get("style_label"), n["parts"].get("style_label")) if "detected_styles" in n["parts"] else None,
                      n["parts"])
                if n["parts"].get("style_label") is None and matching_suit(n["parts"]):
                    T.suits_kept.append(j["id"])
            results[s] = T.summary()
            extra[s] = {"base": B, "new": N, "photos": photos}
        six = None
        if "gold" in sets:
            gold_run0 = [p for p in photos_by_set["gold"] if str(p["run"]) == "0"]
            jobs = [{"id": p["id"], "reading": p["reading"], "occasion": "everyday", "styles": PROFILE, "engine": "v13"} for p in gold_run0]
            (work / "v13-jobs.json").write_text(json.dumps(jobs))
            run_worker(base_tree, "real", work / "v13-jobs.json", work / "v13-base.json")
            v13 = json.loads((work / "v13-base.json").read_text())
            six = [o["id"] for o in v13 if any(r["check"] == "PR3_tailored_line" for p in (o["parts"].get("parts") or {}).values()
                                                  for r in p["reasons"])]
    finally:
        shutil.rmtree(work, ignore_errors=True)
        shutil.rmtree(base_tree, ignore_errors=True)
        if new_tree is not base_tree:
            shutil.rmtree(new_tree, ignore_errors=True)

    failed = sum(r["failed"] for r in results.values())
    for s, r in results.items():
        print(f"  {s:12s} cases {r['cases']:6d}  identical {r['identical']:6d}  name only {r['name_only']:5d}  failed {r['failed']}")
        for f in r["failures"][:5]:
            print("    FAIL", f["id"], json.dumps(f["changes"][:3])[:400], f["tl3_3"])
    if a.new_from:
        print(f"--new-from {a.new_from}: {failed} failed; nothing written")
        return 1 if failed else 0
    OUT.mkdir(parents=True, exist_ok=True)
    if a.self_check:
        bad = {s: r["cases"] - r["identical"] for s, r in results.items() if r["identical"] != r["cases"]}
        (OUT / "self_check.json").write_text(json.dumps({"base": base_sha, "against": base_sha, "sets": {
            s: {k: r[k] for k in ("cases", "identical", "name_only", "failed")} for s, r in results.items()},
            "all_identical": not bad, "not_identical": bad}, indent=1) + "\n")
        print("self-check:", "every case identical" if not bad else f"NOT identical: {bad}")
        return 1 if bad else 0
    rows = report_rows(extra, six) if extra else {"six": [], "others": []}
    if any(x["pass"] == "FAIL" for x in rows["six"] + rows["others"]):
        failed += 1
    summary = {"base": base_sha, "after": head_sha, "after_dirty": dirty(), "sets": {
        s: {k: r[k] for k in ("cases", "identical", "name_only", "failed", "label_changes", "tailored_ties", "suits_kept")}
        for s, r in results.items()}, "failed": failed, "six": rows["six"], "jacket_led": rows["others"]}
    (OUT / "summary.json").write_text(json.dumps(summary, indent=1) + "\n")
    (OUT / "report.md").write_text(report(results, rows, base_sha, head_sha, failed))
    print(f"wrote {OUT / 'report.md'}; {'FAIL' if failed else 'PASS'}")
    return 1 if failed else 0


def dirty():
    out = subprocess.run(["git", "-C", str(ROOT), "status", "--porcelain", "--", *ENGINE_FILES.values()],
                         capture_output=True, text=True, check=True).stdout.strip()
    return bool(out)


def report_rows(extra, six):
    def one(s, key):
        b, n = extra[s]["base"][key], extra[s]["new"][key]
        bp, np_ = b["parts"], n["parts"]
        tl = n["is_tailored"]
        lab0, lab1 = bp.get("style_label"), np_.get("style_label")
        ok = bp.get("overall") == np_.get("overall") and (lab1 == "tailored") == bool(tl) if tl is not None else True
        if tl and lab1 not in ("tailored", "smart_casual", "classic_prep", None):
            ok = bp.get("overall") == np_.get("overall")       # TL2.1: his picks chose another look the outfit reads as
        return n, f"{lab0} -> {lab1}", f"{bp.get('overall')} -> {np_.get('overall')}", ok

    def row(s, pid, file, prof_txt):
        n, lab15, sc15, ok15 = one(s, f"{pid}|profile")
        _, lab16, sc16, ok16 = one(s, f"{pid}|profile|v16")
        tl = n["is_tailored"]
        return {"file": file, "profile": prof_txt, "tl1": "yes" if tl else f"no ({n.get('blocks', '?')})" if tl is False else "n/a",
                "label": lab15, "score": sc15, "label16": lab16, "score16": sc16,
                "pass": "PASS" if ok15 and ok16 else "FAIL"}
    gold_txt = "profile unknown (web photo); age band unknown; picked looks none known; scored with the stated test profile: Minimal + Smart casual, 0.5 each, everyday"
    out = {"six": [], "others": []}
    if six is not None and "gold" in extra:
        for gid in six:
            p = next(x for x in extra["gold"]["photos"] if x["id"] == gid)
            out["six"].append(row("gold", gid, f"{p['file']} (run 0)", gold_txt))
    for s, txt in (("corpus", "profile unknown (saved corpus reading); scored with the stated test profile: Minimal + Smart casual, 0.5 each, at its own occasion"),
                   ("phone", "the founder (born 2004, 22-25; picks streetwear, minimal, workwear), at its own occasion"),
                   ("gold", gold_txt)):
        if s not in extra:
            continue
        for p in extra[s]["photos"]:
            if not jacket_led(p["reading"]) or (s == "gold" and six and p["id"] in six):
                continue
            out["others"].append({"set": s, **row(s, p["id"], p["file"] + (f" (run {p['run']})" if s == "gold" else ""), txt)})
    return out


def report(results, rows, base_sha, head_sha, failed):
    L = []
    nfail = sum(len(r["failures"]) for r in results.values())
    if nfail:
        L.append(f"# STOP: {nfail} cases changed a number\n")
        L.append("| set | id | occasion | picks | field | before | after |\n|---|---|---|---|---|---|---|")
        for r in results.values():
            for f in r["failures"]:
                cfg = f["config"]
                for ch in f["changes"] or [["(TL3.3)", "number", "", "; ".join(f["tl3_3"])]]:
                    L.append(f"| {f['set']} | {f['id'][:60]} | {cfg.get('occasion')} | {json.dumps(cfg.get('styles'))} | {ch[0]} | "
                             f"{json.dumps(ch[2])[:80]} | {json.dumps(ch[3])[:80]} |")
                if f["tl3_3"] and f["changes"]:
                    L.append(f"| {f['set']} | {f['id'][:60]} | | | TL3.3 | | {'; '.join(f['tl3_3'])} |")
        L.append("")
    L.append("# Tailored: same scores (TL3)\n")
    L.append(f"Base engine `{base_sha[:8]}` (main's engine after T69: v15 and v16, before T94's names) against this branch's engine `{head_sha[:8]}`"
             f"{' (with uncommitted engine changes)' if dirty() else ''}. Generated by `extraction-test/tailored_same_scores.py`; "
             "stored readings only, no AI call, $0.\n")
    sc = OUT / "self_check.json"
    if sc.exists():
        s = json.loads(sc.read_text())
        n = sum(v["cases"] for v in s["sets"].values())
        L.append(f"**Self-check** (base against base, `--self-check`): {n:,} cases, "
                 f"{'every one identical' if s['all_identical'] else 'NOT all identical: ' + json.dumps(s['not_identical'])}.\n")
    else:
        L.append("**Self-check:** not run (`--self-check`).\n")
    L.append(f"**Result: {'FAIL' if failed else 'PASS'}.** Every number is identical on every case; only the look's name moves.\n" if not failed
             else f"**Result: FAIL** ({failed}).\n")
    L.append("## Counts by set\n\n| set | cases | identical | name only | failed |\n|---|---|---|---|---|")
    for s, r in results.items():
        L.append(f"| {s} | {r['cases']:,} | {r['identical']:,} | {r['name_only']:,} | {r['failed']} |")
    L.append("\nThe parity sets re-run the base commit's committed fixtures (their `expected` is the base engine's exact output). "
             "The real photos (corpus, phone, gold) are each scored with no picks and with the profile's picks, with fixes, on both "
             "engines, each on v15 and on v16 (cool; graded as the outfit's own looks). The gold set has 2 runs per photo on file "
             "(run 0 and run 1), each compared.\n")
    L.append("## The name changes (old -> new label)\n\n| set | old -> new | cases | examples |\n|---|---|---|---|")
    for s, r in results.items():
        for k, v in sorted(r["label_changes"].items(), key=lambda t: -t[1]):
            L.append(f"| {s} | {k} | {v:,} | {', '.join(x[:48] for x in r['label_examples'].get(k, []))} |")
    L.append("")
    ties = {s: r["tailored_ties"] for s, r in results.items() if r["tailored_ties"]}
    L.append("**Tailored outfits his picks name as another look** (TL2.1: a tie Tailored doesn't own, here minimal with an "
             f"unstructured blazer, goes to his picks): {sum(ties.values()) if ties else 0} cases"
             + (" (" + ", ".join(f"{s} {v:,}" for s, v in ties.items()) + ")" if ties else "") + ".\n")
    suits = {s: r["suits_kept"] for s, r in results.items() if r["suits_kept"]}
    L.append(f"**Suits that read as no look and keep \"a matching suit\" +0.5** (founder 1): {sum(suits.values()) if suits else 0} cases"
             + (" (" + ", ".join(f"{s} {v:,}" for s, v in suits.items()) + ")" if suits else "") + ".\n")
    six = rows["six"]
    L.append(f"## The {len(six)} jacket-led photos (TL3.3)\n")
    L.append("The gold photos where `PR3_tailored_line` fires on run 0 under engine v13 (#266's count), recomputed here"
             + ("" if len(six) == 6 else f": the real count is **{len(six)}**, not 6, and all are listed") + ". "
             f"{len(six)} photos, a small sample; the founder chose the saved 6 only. File names only, never a photo.\n")
    L.append("| photo | profile | TL1 met | v15 label before -> after | v15 score | v16 label before -> after | v16 score | result |\n"
             "|---|---|---|---|---|---|---|---|")
    for x in six:
        L.append(f"| {x['file']} | {x['profile']} | {x['tl1']} | {x['label']} | {x['score']} | {x['label16']} | {x['score16']} | {x['pass']} |")
    oth = rows["others"]
    L.append(f"\n## Every other saved jacket-led reading ({len(oth)})\n")
    L.append("Corpus and phone readings with a blazer, suit jacket, sport coat or unstructured blazer; gold runs not in the table above. "
             "Scored with the profile in the row.\n")
    L.append("| set | reading | profile | TL1 met | v15 label before -> after | v15 score | v16 label before -> after | v16 score | result |\n"
             "|---|---|---|---|---|---|---|---|---|")
    for x in oth:
        L.append(f"| {x['set']} | {x['file']} | {x['profile']} | {x['tl1']} | {x['label']} | {x['score']} | {x['label16']} | {x['score16']} | {x['pass']} |")
    L.append("")
    return "\n".join(L)


if __name__ == "__main__":
    sys.exit(main())
