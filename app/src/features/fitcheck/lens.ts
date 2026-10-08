// What a check is scored for (DECISIONS-LOG #61): one style, never a blend. A check started from
// the morning/evening card uses the card's style; one from "Check my fit" uses his first
// onboarding style; no styles ("Not sure") means the general standard. Rows from before V4
// (style null with styles in his profile) keep the profile blend they were scored with.
import type { Styles } from '@kitted/core';
import { STYLES, type StyleKey } from '@/data/types';

export function firstStyle(styles: Styles | null | undefined): StyleKey | null {
  const s = styles?.[0]?.[0];
  if (s === 'preppy') return 'old_money'; // merged (#57)
  return typeof s === 'string' && (STYLES as readonly string[]).includes(s) ? (s as StyleKey) : null;
}

/** The rubric input for a check scored for `style`. */
export function stylesFor(style: StyleKey | null, profileStyles: Styles): Styles {
  return style ? [[style, 1]] : profileStyles;
}
