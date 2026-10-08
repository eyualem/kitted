// What a check is scored for (DECISIONS-LOG #61): one style, never a blend. A check started from
// the morning/evening card uses the card's style; one from "Check my fit" uses his first
// onboarding style; no styles ("Not sure") means the general standard. Rows from before V4
// (style null with styles in his profile) keep the profile blend they were scored with.
import type { Styles } from '@kitted/core';
import { normStyleKey, type StyleKey } from '@/data/types';

export function firstStyle(styles: Styles | null | undefined): StyleKey | null {
  return normStyleKey(styles?.[0]?.[0]); // old onboarding keys map to the V5 names (#85)
}

/** The rubric input for a check scored for `style`. */
export function stylesFor(style: StyleKey | null, profileStyles: Styles): Styles {
  return style ? [[style, 1]] : profileStyles;
}
