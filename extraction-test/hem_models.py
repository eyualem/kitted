#!/usr/bin/env python3
"""A specialist call on a cheap model (DECISIONS-LOG #278): the hem3 crop questions (prompt_hem3.txt, the same crops,
labels and pass bar as hem_test.py) sent to OpenAI's GPT-6 Luna, against Gemini 3.8 Flash's run (results/hem3).

  /usr/bin/python3 hem_models.py run [none|low]     (3 runs; resumable)
  /usr/bin/python3 hem_models.py report
"""
import json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hem_test as H  # noqa: E402
import openai_read as O  # noqa: E402

OUT = HERE / "results" / "hem-models"
SCHEMA = O.strict(json.loads((HERE / "schema_hem3.json").read_text()))
PROMPT = (HERE / "prompt_hem3.txt").read_text()
QS = ["hem_touches_shoe", "folds_above_shoe", "drags_at_heel", "ankle_shows", H.QB]


def pids():
    return json.loads((HERE / "results" / "hem3" / "manifest.json").read_text())["photos"]


def run(effort, runs=3):
    OUT.mkdir(parents=True, exist_ok=True)
    raw = OUT / f"luna_{effort}.json"
    res = [r for r in (json.loads(raw.read_text()) if raw.exists() else []) if r.get("json")]
    done = {(r["photo"], r["run"]) for r in res}
    jobs = [(p, i) for i in range(runs) for p in pids() if (p, i) not in done]

    def one(j):
        p, i = j
        r = O.call(PROMPT, [(H.CROPS / f"{p}.hem.jpg").read_bytes()], effort=effort, schema=SCHEMA, name="hem")
        r.update({"photo": p, "run": i})
        return r

    with ThreadPoolExecutor(6) as ex:
        for r in ex.map(one, jobs):
            res.append(r)
            if r.get("error"):
                print(p := r["photo"], r["error"][:120])
    raw.write_text(json.dumps(res))
    print(f"{len(res)} readings · ${sum(r.get('cost', 0) for r in res):.3f}")


def report():
    lab = H.labels()
    ps = [p for p in pids() if p in lab]
    arms = {"gemini-3.8-flash (hem3)": json.loads((HERE / "results" / "hem3" / "raw.json").read_text())}
    for e in ("none", "low"):
        f = OUT / f"luna_{e}.json"
        if f.exists():
            arms[f"gpt-6-luna {e}"] = json.loads(f.read_text())
    L = ["# The hem specialist call on cheaper models", "", f"{len(ps)} labeled photos (hem3_labels.csv), 3 runs each; "
         "the pass bar: steady ≥ 90%, right ≥ 85% when it answers, can't-see ≤ 30%.", "",
         "| Question | " + " | ".join(arms) + " |", "|---|" + "---|" * len(arms)]
    for q in QS:
        cells = []
        for name, raw in arms.items():
            s = H.stats(H.answers(raw), lab, ps, q)
            cells.append(f"steady {H.fmt(s['steady'])} · right {H.fmt(s['right'], s['right_n'])} · finds yeses {H.fmt(s['found'], s['found_n'])} · can't see {H.fmt(s['cant_see'])}"
                         + (" **passes**" if H.passes(s) else ""))
        L.append(f"| {q} | " + " | ".join(cells) + " |")
    for name, raw in arms.items():
        c = [r.get("cost") for r in raw if r.get("cost") is not None]
        if c:
            L.append(f"\n{name}: {sum(c) / len(c) * 100:.4f}¢ a call.")
    (OUT / "report.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        run(sys.argv[2] if len(sys.argv) > 2 else "none")
    else:
        report()
