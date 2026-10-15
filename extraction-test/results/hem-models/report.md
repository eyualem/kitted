# The hem specialist call on cheaper models

78 labeled photos (hem3_labels.csv), 3 runs each; the pass bar: steady ≥ 90%, right ≥ 85% when it answers, can't-see ≤ 30%.

| Question | gemini-3.8-flash (hem3) | gpt-6-luna none | gpt-6-luna low |
|---|---|---|---|
| hem_touches_shoe | steady 96% · right 94% (225) · finds yeses 93% (192) · can't see 0% **passes** | steady 94% · right 91% (225) · finds yeses 99% (192) · can't see 0% **passes** | steady 87% · right 92% (224) · finds yeses 95% (191) · can't see 0% |
| folds_above_shoe | steady 86% · right 69% (204) · finds yeses 60% (57) · can't see 0% | steady 83% · right 57% (204) · finds yeses 86% (57) · can't see 0% | steady 81% · right 57% (204) · finds yeses 88% (57) · can't see 0% |
| drags_at_heel | steady 94% · right 91% (200) · finds yeses 25% (24) · can't see 2% **passes** | steady 100% · right 88% (201) · finds yeses 0% (24) · can't see 1% **passes** | steady 99% · right 88% (203) · finds yeses 8% (26) · can't see 0% **passes** |
| ankle_shows | steady 95% · right 97% (224) · finds yeses 100% (39) · can't see 0% **passes** | steady 94% · right 86% (225) · finds yeses 38% (39) · can't see 0% **passes** | steady 78% · right 86% (224) · finds yeses 74% (39) · can't see 0% |
| piles_or_drags | steady 85% · right 66% (198) · finds yeses 55% (78) · can't see 0% | steady 83% · right 59% (195) · finds yeses 79% (75) · can't see 1% | steady 81% · right 60% (197) · finds yeses 83% (77) · can't see 0% |

gpt-6-luna none: 0.0074¢ a call.

gpt-6-luna low: 0.0150¢ a call.
