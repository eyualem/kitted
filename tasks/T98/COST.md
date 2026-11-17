# T98: cost estimate for the optional paid round

**Status: run Nov 16, $0.4137 (252 calls, ~0.164¢ each).** Shorts length passed; the long-top question failed (`extraction-test/results/reading-proportions/report.md`). The founder said yes in the coordinating session (Nov 16: "you have my yes for the test"); that session runs `extraction-test/proportions_looks.py`. The T98 session makes no paid call. Prepared set: 24 shorts photos (C140 has no face-hidden close-up) and 102 long-top crops (12 long, 16 borderline, 74 not), 252 calls for 2 runs, about 55 cents.

Nothing in T98 so far has cost money: the $0 round used stored readings and the Mac's own body ruler.

The $0 round left two reads short (`extraction-test/results/reading-proportions/report.md`):

1. **Shorts length** on his own photos. Today's reading doesn't carry it, and the Mac's shorts ruler fails (65% right). A narrow look that already passed on 24 gold photos in October (shorts1 arm C, `prompt_shorts1.txt`: 99% right on above vs at-or-below the knee, steady 92%) has never been run on his 25 rated shorts photos.
2. **A top that's too long.** The ruler finds it (8 of 8 measured) but raises 8% false alarms and can't measure about 1 photo in 5. A narrow look on a crop the code cuts from his joints (hips to mid-thigh), asked as a presence question ("can you see pants fabric between the bottom of the top and where the legs split?"), is the untried idea from #465.

| Call | Photos | Runs | Calls | Per call | Cost |
|---|---|---|---|---|---|
| Shorts length (the October prompt, unchanged, on the lower close-up) | 25 | 2 | 50 | 0.22¢ | 11¢ |
| Long top (new presence question, on a hip-to-thigh crop) | ~100 (the 62 long-top photos + about 40 of his untucked, jacket-free ones) | 2 | ~200 | 0.22¢ | 44¢ |
| A 5-call pilot first | | | 5 | 0.22¢ | 1¢ |
| **Total** | | | **~255** | | **~56¢** |

- **Per call:** 0.2168¢, measured on the Nov 14 long-top run with the same model and settings (gemini-3.8-flash, thinking off, temperature 0; ~1,320 tokens in, ~11 out, **~300 thinking tokens billed even with thinking off**).
- **Hard stop:** 70¢, counting real token usage (thinking included) plus the worst case of every call in flight. The task's cap is $2.00; spent so far $0.00.
- **Labels** are already written and committed (`extraction-test/proportions_labels.csv`, `longtop_labels.csv`), before any call.
- **Pass bars, set now:** shorts: 90% right and 90% steady on his photos. Long top: catch 7 of 9 clear long tops, false yes under 5%, steady 90% where it fires; otherwise it stays on the ruler.
- **Photos:** only the face-hidden copies the app sends (the prep's own close-ups in `results/rated1/images`, `gold1`, `b1`, `creators1`). Every photo is profile unknown.
