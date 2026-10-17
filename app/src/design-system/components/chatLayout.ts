// Pure layout numbers for the chat pieces (Chat.tsx), apart so tests can read them without the native modules.

/** His bubble's widest share of the row. At the accessibility sizes 78% left one word per line (07 §17, U13). */
export function userBubbleMaxWidth(isAccessibilitySize: boolean): `${number}%` {
  return isAccessibilitySize ? '88%' : '78%';
}
