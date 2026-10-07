// Fixed tab-bar geometry (NativeTabs' height can't be measured, 05 T33): the iOS 26 floating
// bar is 62 tall, 21 from the bottom; the composer sits 9 above it.
export const TAB_BAR = { height: 62, bottom: 21 } as const;
export const COMPOSER_BOTTOM = TAB_BAR.height + TAB_BAR.bottom + 9;
/** Thread padding under the last message so it clears the composer (design-spec A7/A8). */
export const THREAD_PAD = { compact: 146, idle: 184 } as const;
/** Space between the composer and the keyboard while he types. */
export const KEYBOARD_GAP = 8;
/** Space between the newest message and the top of the dock (mockup: 146 = 92 + 48 + 6). */
export const DOCK_GAP = 6;
