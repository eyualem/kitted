// Which camera controls show, as plain functions (09-ui-review §7, #287), so the rules are tested without rendering.
// The fit-check camera (CameraScreen) and the scan camera (ScanCameraScreen) both use them.
import { fixed } from '@/design-system/tokens';

/** The camera's own background: always dark, whatever the app's theme (02 D5). */
export const CAMERA_BACKGROUND = fixed.black;

export interface FlashInput {
  /** The live guide says it's too dark (guidance.ts `offerFlash`). */
  offered: boolean;
  /** The flash (or the scan's torch) is on. */
  flash: boolean;
  /** The screen may show the "Turn on flash" pill now (not over the after-shot panel, not in a shoe snap). */
  canOffer: boolean;
  /** The top bar's right slot holds the timer instead (Mirror). */
  timerSlot: boolean;
}

export interface FlashControls {
  /** The "Turn on flash" pill under the tip. */
  offer: boolean;
  /** The flash toggle in the top bar's right slot. */
  toggle: boolean;
}

/** C6: one flash control at a time. While the pill offers the flash, the toggle steps aside (its slot stays, empty, so
 *  the tip pill doesn't move); once the pill goes (flash on, the room brighter, a panel over it) the toggle is back. */
export function flashControls(s: FlashInput): FlashControls {
  const offer = s.offered && !s.flash && s.canOffer;
  return { offer, toggle: !s.timerSlot && !offer };
}

export type CameraPermission = 'asking' | 'granted' | 'denied';
/** What the camera route shows. 'shell' = the camera's dark background with its close button, while consent is read
 *  (never an empty frame). */
export type CameraFrame = 'shell' | 'consent' | 'off' | 'camera';

/**
 * C7: the frame for the route's state. `consent` is null while it's being read; `permission` is null until the camera
 * screen has asked (it asks only once consent is in, so the system prompt never comes before the agreement).
 */
export function cameraFrame(consent: boolean | null, permission: CameraPermission | null): CameraFrame {
  if (consent === null) return 'shell';
  if (!consent) return 'consent';
  return permission === 'denied' ? 'off' : 'camera';
}

/** How each frame looks: its background ('theme' = the app's light or dark page) and whether the close button shows.
 *  While the camera permission is asked, 'camera' shows its controls over the dark background, the preview not yet on. */
export const FRAME_LOOK: Record<CameraFrame, { background: string; close: boolean }> = {
  shell: { background: CAMERA_BACKGROUND, close: true },
  consent: { background: 'theme', close: true },
  off: { background: CAMERA_BACKGROUND, close: true },
  camera: { background: CAMERA_BACKGROUND, close: true },
};
