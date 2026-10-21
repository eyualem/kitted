// A tile under the native iOS long-press menu (PieceMenu.ios, PhotoMenu.ios): a hold belongs to the menu, never to the
// tile's tap (founder, Oct 17). The menu cancels the tile's touch only once it has opened, so a finger lifted after its
// haptic but before the menu showed used to count as a tap and opened the piece page under it. The tile now gives a
// hold a no-op long press before the menu's haptic, so a release after it opens nothing; a tap stays a tap
// (well under this).
export const MENU_HOLD_MS = 350;

/** The tile's own long press while the native menu owns the hold: nothing, so the release isn't a tap. */
export function holdForMenu(): void {}
