// Pure layout numbers for the chat pieces (Chat.tsx), apart so tests can read them without the native modules.

/** His bubble's widest share of the row. At the accessibility sizes 78% left one word per line (07 §17, U13). */
export function userBubbleMaxWidth(isAccessibilitySize: boolean): `${number}%` {
  return isAccessibilitySize ? '88%' : '78%';
}

/** Kit's bubble (#338): his text's inset, which "Kit" above it lines up with. */
export const KIT_BUBBLE_PAD_H = 16;

/** Kit's bubble's widest share of the row: a little wider than his (answers carry piece chips). */
export function kitBubbleMaxWidth(isAccessibilitySize: boolean): `${number}%` {
  return isAccessibilitySize ? '94%' : '86%';
}
