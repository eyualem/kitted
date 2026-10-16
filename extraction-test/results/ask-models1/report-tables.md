| Model | G1 | G2 | G2red | G3 | G4block | G4cards | G5offtopic | G6med | G6p90 | G7jan | hard gates |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gemini-3.5-flash-lite | 100.0 | 4.9 ✗ | 0 | 0 | 100.0 | 100.0 | 100.0 | 1092 | 1494 | 0.12 | out |
| gemini-3.8-flash | 76.8 ✗ | 0.0 | 0 | 0 | 100.0 | 100.0 | 100.0 | 3937 ✗ | 8065 ✗ | 0.81 ✗ | out |
| gpt-6-luna | 100.0 | 2.4 ✗ | 0 | 0 | 98.8 | 100.0 | 100.0 | 655 | 1244 | 0.02 | out |
| gpt-5.6-luna | 100.0 | 0.0 | 0 | 0 | 100.0 | 100.0 | 100.0 | 655 | 932 | 0.04 | pass |
| gpt-5.4-mini | 100.0 | 2.4 ✗ | 0 | 0 | 87.8 ✗ | 91.7 | 100.0 | 456 | 591 | 0.11 | out |
| claude-haiku-5-5 | 100.0 | 9.8 ✗ | 0 | 0 | 100.0 | 100.0 | 100.0 | 672 | 958 | 0.03 | out |
| claude-sonnet-5-5 (ref) | 100.0 | 1.2 ✗ | 0 | 0 | 100.0 | 83.3 ✗ | 100.0 | 772 | 1494 | 0.68 ✗ | out |

| Model | Q1 good % | Q2 mean | Q3 invented % | Q4 steady % (code / judged) | Q5 voice flags % | ¢ now | ¢ Jan 2027 | first words median s | tokens in / out | cached |
|---|---|---|---|---|---|---|---|---|---|---|
| gemini-3.5-flash-lite | 54 | 4.29 | 12.2 | 66 / 90 | 7 | 0.117 | 0.117 | 1.09 | 4561 / 74 | 37% |
| gemini-3.8-flash | 54 | 4.01 | 0.0 | 67 / 93 | 6 | 0.406 | 0.811 | 3.94 | 4561 / 376 | 25% |
| gpt-6-luna | 68 | 4.53 | 4.9 | 62 / 90 | 7 | 0.016 | 0.016 | 0.66 | 4420 / 82 | 81% |
| gpt-5.6-luna | 83 | 4.58 | 4.9 | 72 / 93 | 10 | 0.035 | 0.035 | 0.66 | 4472 / 89 | 81% |
| gpt-5.4-mini | 49 | 4.17 | 2.4 | 53 / 93 | 21 | 0.114 | 0.114 | 0.46 | 4368 / 90 | 86% |
| claude-haiku-5-5 | 56 | 4.29 | 0.0 | 66 / 90 | 33 | 0.033 | 0.033 | 0.67 | 6557 / 151 | 70% |
| claude-sonnet-5-5 | 71 | 4.44 | 7.3 | 68 / 88 | 37 | 0.681 | 0.681 | 0.77 | 6778 / 155 | 70% |

Judges' mean by criterion:
| Model | correct | grounded | useful | voice | safe |
|---|---|---|---|---|---|
| gemini-3.5-flash-lite | 4.15 | 4.16 | 4.00 | 4.28 | 4.85 |
| gemini-3.8-flash | 3.85 | 3.85 | 3.63 | 3.74 | 5.00 |
| gpt-6-luna | 4.58 | 4.55 | 4.24 | 4.36 | 4.90 |
| gpt-5.6-luna | 4.72 | 4.61 | 4.34 | 4.32 | 4.90 |
| gpt-5.4-mini | 4.14 | 4.20 | 3.71 | 3.91 | 4.91 |
| claude-haiku-5-5 | 4.29 | 4.36 | 3.97 | 3.91 | 4.94 |
| claude-sonnet-5-5 | 4.50 | 4.66 | 4.16 | 4.04 | 4.85 |

Spent: $1.149 on 574 answers. Judges: stylist, beginner, factcheck.

Safety rules each model broke in its own words (before the gate): gemini-3.5-flash-lite: body, fact, handle, score; gemini-3.8-flash: filler; gpt-6-luna: handle, score; gpt-5.6-luna: none; gpt-5.4-mini: fact, handle; claude-haiku-5-5: banned, handle; claude-sonnet-5-5: body
