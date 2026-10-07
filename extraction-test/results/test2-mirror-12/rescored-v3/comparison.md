# Re-score: v2 → v3 (test2-mirror-12)

Same saved model readings, judged by both rulebooks. No API calls.

| Photo | Stage | v2 | v3 | v3 runs | Human estimate | Credits (most common) | Mistakes (most common) |
|---|---|---|---|---|---|---|---|
| m01 | before | 8.5 | **7.0** | [7.0, 7.0, 7.0] | 7.5 | — | P1_top_volume_vs_style |
| m02 | before | 8.5 | **8.5** | [8.5, 8.5, 8.5] | 8.5 | K1_layered, K2_elevated_piece, K4_shoes_complement | P1_leg_vs_style |
| m03 | before | 9.0 | **8.0** | [8.0, 8.0, 8.5] | 7.5 | K2_elevated_piece, K3_point_of_interest, K4_shoes_complement | — |
| m04 | before | 8.0 | **6.5** | [6.5, 6.5, 6.5] | 6.0 | — | O4_loungewear_out |
| m05 | before | 8.5 | **8.0** | [8.0, 7.5, 8.0] | 8.0 | K2_elevated_piece, K3_point_of_interest, K4_shoes_complement | O1_too_formal |
| m06 | before | 9.0 | **7.0** | [7.0, 7.0, 7.5] | 5.5 | — | — |
| m07 | before | 8.0 | **8.5** | [8.5, 8.5, 8.5] | 8.0 | K1_layered, K2_elevated_piece | — |
| m08 | before | 9.0 | **9.0** | [9.0, 9.0, 9.0] | 7.0 | K1_layered, K2_elevated_piece, K4_shoes_complement | — |
| m09 | before | 8.5 | **8.0** | [8.0, 8.0, 8.0] | 7.5 | K1_layered, K2_elevated_piece | O1_too_formal |
| m10 | before | 8.5 | **9.0** | [9.5, 9.0, 9.0] | 7.0 | K1_layered, K2_elevated_piece, K3_point_of_interest | P1_leg_vs_style |
| m11 | before | 8.0 | **8.0** | [8.0, 8.0, 8.0] | 8.0 | K1_layered, K2_elevated_piece, K4_shoes_complement | P1_leg_vs_style, O1_too_formal |
| m12 | before | 7.0 | **6.5** | [6.5, 7.0, 6.5] | 7.5 | K1_layered, K2_elevated_piece, K3_point_of_interest | S2_shoes_too_casual_for_outfit |

- Score range: v2 7.0–9.0 → v3 6.5–9.0
- Average gap to the human estimate: v2 +1.04 (off by 1.12) → v3 +0.50 (off by 0.75)
- Full report under v3 (consistency, fix detection): `rescored-v3/report.md`
