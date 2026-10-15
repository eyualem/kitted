// The Closet "+" (C4; DECISIONS-LOG #88, #100): Take photo → the scan camera, Choose photos → the library. iOS shows
// them in the native pull-down menu from the button (AddMenu.ios.tsx, 09-ui-review §7 C8); elsewhere a system alert
// (AddMenu.tsx). Describe it (C4d) joins the list when it's built.
import { t } from '@/i18n/en';

export interface ClosetAddAction {
  label: string;
  href: '/scan' | '/scan?library=1';
  /** SF Symbol for the native menu row. */
  systemImage: 'camera' | 'photo.on.rectangle';
}

export const CLOSET_ADD_ACTIONS: readonly ClosetAddAction[] = [
  { label: t('closet.add.menu.photo'), href: '/scan', systemImage: 'camera' },
  { label: t('closet.add.menu.photos'), href: '/scan?library=1', systemImage: 'photo.on.rectangle' },
];
