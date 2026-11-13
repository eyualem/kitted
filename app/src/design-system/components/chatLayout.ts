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

/** His photo in the chat (founder, Nov 12: "Bigger, no frame"): its share of the screen's width, and the cap for wide screens. */
export const PHOTO_BUBBLE_SHARE = 0.6;
export const PHOTO_BUBBLE_MAX_WIDTH = 264;
/** The photo's height over its width, kept between these so a very short or very tall crop doesn't look odd. */
export const PHOTO_BUBBLE_MIN_RATIO = 1.2;
export const PHOTO_BUBBLE_MAX_RATIO = 1.45;
/** The neck-down shape of a photo that gives no shape (stored check photos): the old tile's 127 × 172. */
export const PHOTO_BUBBLE_DEFAULT_ASPECT = 127 / 172;

/** His photo's size in the chat: about 60% of the screen wide (capped), tall enough for its neck-down shape (width / height). */
export function photoBubbleSize(screenWidth: number, shapeAspect?: number): { width: number; height: number } {
  const width = Math.round(Math.min(screenWidth * PHOTO_BUBBLE_SHARE, PHOTO_BUBBLE_MAX_WIDTH));
  const aspect = shapeAspect && Number.isFinite(shapeAspect) && shapeAspect > 0 ? shapeAspect : PHOTO_BUBBLE_DEFAULT_ASPECT;
  const ratio = Math.min(PHOTO_BUBBLE_MAX_RATIO, Math.max(PHOTO_BUBBLE_MIN_RATIO, 1 / aspect));
  return { width, height: Math.round(width * ratio) };
}
