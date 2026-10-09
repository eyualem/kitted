// Fixed tab-bar geometry (NativeTabs' height can't be measured, 05 T33): the iOS 26 floating
// bar is 62 tall, 21 from the bottom; the composer sits 9 above it.
export const TAB_BAR = { height: 62, bottom: 21 } as const;
export const COMPOSER_BOTTOM = TAB_BAR.height + TAB_BAR.bottom + 9;
/** Thread padding under the last message so it clears the composer (design-spec A7/A8). */
/** Idle used to be 184 with the quick-start row (DECISIONS-LOG #58 removed it): both docks are one row now. */
export const THREAD_PAD = { compact: 146, idle: 146 } as const;
/** Space between the composer and the keyboard while he types. */
export const KEYBOARD_GAP = 8;
/** Space between the newest message and the top of the dock (mockup: 146 = 92 + 48 + 6). */
export const DOCK_GAP = 6;
/** The tab bar's bottom accessory (StylistBar): the system's capsule, measured on iOS 26.5 (53 tall,
 *  its bottom at COMPOSER_BOTTOM). The open composer sits exactly over it. */
export const ACCESSORY_H = 53;
