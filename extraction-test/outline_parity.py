#!/usr/bin/env python3
"""v16 stays byte-identical with the outline work's knobs off (Nov 17, $0). Compares this checkout's parts_proto.py
against a base copy (BASE_ENGINE=<path to the old parts_proto.py>) on every gold reading and every rated photo, v15
and v16, cool and warm, with and without the second looks. Exit 1 on any difference.

  KITTED_DATA=<main checkout> BASE_ENGINE=<old parts_proto.py> /usr/bin/python3 outline_parity.py
"""
import importlib.util
import json
import os
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

spec = importlib.util.spec_from_file_location("parts_base", os.environ["BASE_ENGINE"])
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    looks = V.load_looks()
    cases = [(k, v[2], v[3]) for k, v in pool.items()]
    for p, rs in runs.items():
        for i, rd in enumerate(rs):
            cases.append((f"{p}#{i}", rd, (looks.get(p) or [None] * 9)[i] if looks.get(p) and i < len(looks[p]) else None))
    n = bad = 0
    for k, rd, lk in cases:
        for eng in ("v15", "v16"):
            for season in (None, "warm"):
                for sl in (None, lk):
                    a = P.score_parts(rd, "everyday", V.PROFILE, sl, "a_little", engine=eng, season=season)
                    b = B.score_parts(rd, "everyday", V.PROFILE, sl, "a_little", engine=eng, season=season)
                    n += 1
                    if json.dumps(a, sort_keys=True, default=str) != json.dumps(b, sort_keys=True, default=str):
                        bad += 1
                        if bad <= 5:
                            print("DIFF", k, eng, season, sl is not None, a.get("overall"), b.get("overall"))
    print(f"{n} results compared, {bad} differ")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
