#!/usr/bin/env python3
"""A waist specialist call (DECISIONS-LOG #278): one narrow question about where the top meets the pants, on the
same three images the main read sends, to GPT-6 Luna. Scored against the waist labels both blind passes agree on
(waist_labels/), next to the main reads' own call (the engine's PR1 test: tucked in full, or cropped / at the belt).

  /usr/bin/python3 waist_specialist.py run [none|low] [runs]
  /usr/bin/python3 waist_specialist.py report
"""
import json, sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import openai_read as O  # noqa: E402
import waist_test as WT  # noqa: E402
import zoom_test as Z  # noqa: E402
import model_test as M  # noqa: E402

OUT = HERE / "results" / "waist-specialist"
PROMPT = (HERE / "prompt_waist1.txt").read_text()
SCHEMA = O.strict(json.loads((HERE / "schema_waist1.json").read_text()))


def labeled():
    """(set, photo) for every photo in the model test with an agreed waist label."""
    L = WT.load_labels(); WT.SECOND.clear(); WT.SECOND.update(WT.load_second())
    out = []
    for s in M.SETS:
        for p in M.photos(s):
            pid = {"phone": "phone-" + p[5:] if p.startswith("oct8-") else p}.get(s, p)
            lab = L.get(p) or L.get(pid)
            if lab and WT.truth(dict(lab, photo=p if p in L else pid)):
                out.append((s, p, WT.truth(dict(lab, photo=p if p in L else pid))))
    return out


def call_of_visible(js):
    """Mapping B (chosen after seeing mapping A's answers, Oct 15: the model said "covers the waistband" and "the
    waistband partly shows" together on 130 photos): the labels' own definition, a tuck or a visible waistband."""
    if js.get("tucked") == "full" or js.get("top_end") in ("tucked", "above_waistband"):
        return "waist_shows"
    if js.get("waistband_visible") in ("yes", "partly"):
        return "waist_shows"
    if js.get("waistband_visible") == "no":
        return "covered"
    return None


def call_of(js):
    """Mapping A (set before the run): the specialist's answer as the engine's question: does the waist show?"""
    if js.get("tucked") == "full" or js.get("top_end") in ("tucked", "above_waistband"):
        return "waist_shows"
    if js.get("top_end") == "at_waistband":
        return "waist_shows" if js.get("waistband_visible") in ("yes", "partly") else "covered"
    if js.get("top_end") in ("covers_waistband", "below_crotch"):
        return "covered"
    return None


def run(effort, runs):
    OUT.mkdir(parents=True, exist_ok=True)
    raw = OUT / f"luna_{effort}.json"
    res = [r for r in (json.loads(raw.read_text()) if raw.exists() else []) if r.get("json")]
    done = {(r["set"], r["photo"], r["run"]) for r in res}
    every = [(s, p) for s in M.SETS for p in M.photos(s)] if "--all" in sys.argv else [(s, p) for s, p, _ in labeled()]
    jobs = [(s, p, i) for i in range(runs) for s, p in every if (s, p, i) not in done]

    def one(j):
        s, p, i = j
        r = O.call(PROMPT, Z.images_for(p, True, M.SETS[s]), effort=effort, schema=SCHEMA, name="waist")
        r.update({"set": s, "photo": p, "run": i})
        return r

    with ThreadPoolExecutor(6) as ex:
        for r in ex.map(one, jobs):
            res.append(r)
            if r.get("error"):
                print(r["photo"], r["error"][:120])
    raw.write_text(json.dumps(res))
    print(f"{len(res)} readings · ${sum(r.get('cost', 0) for r in res):.3f}")


def report():
    lab = {(s, p): t for s, p, t in labeled()}
    import model_report as MR
    arms = MR.load()
    L = ["# The waist specialist", "", f"{len(lab)} photos with an agreed waist label.", "",
         "| Reader | right | wrong: says shows | wrong: says covered | no answer | same twice | ¢ |", "|---|---|---|---|---|---|---|"]
    def line(name, calls, steady, cost):
        c = Counter()
        for (k, v) in calls:
            t = lab[k]
            c["none" if v is None else "ok" if v == t else ("fp" if v == "waist_shows" else "fn")] += 1
        n = sum(c.values())
        L.append(f"| {name} | {100 * c['ok'] // max(1, n - c['none'])}% ({c['ok']}/{n - c['none']}) | {c['fp']} | {c['fn']} | {c['none']} | {steady} | {cost} |")
    for arm in ("gem38", "luna", "luna_low", "fl35"):
        by = arms.get(arm, {})
        calls, pairs = [], 0
        same = 0
        for k in lab:
            runs = [by[k][i]["json"] for i in sorted(by.get(k, {}))]
            vs = [MR.waist_call(r) for r in runs]
            calls += [(k, v) for v in vs]
            if len(vs) >= 2:
                pairs += 1; same += vs[0] == vs[1]
        line(f"main read · {arm}", calls, f"{same}/{pairs}", "")
    for e in ("none", "low"):
        f = OUT / f"luna_{e}.json"
        if not f.exists():
            continue
        raw = json.loads(f.read_text())
        by = {}
        for r in raw:
            by.setdefault((r["set"], r["photo"]), {})[r["run"]] = r
        calls, same, pairs = [], 0, 0
        for k, rs in by.items():
            vs = [call_of(rs[i]["json"]) for i in sorted(rs) if rs[i].get("json")]
            calls += [(k, v) for v in vs]
            if len(vs) >= 2:
                pairs += 1; same += vs[0] == vs[1]
        cost = sum(r.get("cost", 0) for r in raw) / max(1, len(raw)) * 100
        line(f"waist specialist · luna {e} (mapping A, set before)", calls, f"{same}/{pairs}", f"{cost:.4f}")
        calls, same, pairs = [], 0, 0
        for k, rs in by.items():
            vs = [call_of_visible(rs[i]["json"]) for i in sorted(rs) if rs[i].get("json")]
            calls += [(k, v) for v in vs]
            if len(vs) >= 2:
                pairs += 1; same += vs[0] == vs[1]
        line(f"waist specialist · luna {e} (mapping B, after seeing A)", calls, f"{same}/{pairs}", f"{cost:.4f}")
    (OUT / "report.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        run(sys.argv[2] if len(sys.argv) > 2 else "none", int(sys.argv[3]) if len(sys.argv) > 3 else 2)
    else:
        report()
