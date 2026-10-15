// 09-ui-review §7 (#287), written before the build: C6 one flash control at a time, C7 no blank frame opening the camera.
import { CAMERA_BACKGROUND, FRAME_LOOK, cameraFrame, flashControls, type CameraPermission, type FlashInput } from '@/features/camera/cameraControls';
import { fitTip } from '@/features/camera/guidance';
import type { GuideEvent } from '../../modules/kitted-vision';

const PERMISSIONS: (CameraPermission | null)[] = [null, 'asking', 'granted', 'denied'];
const bools = [false, true];
/** Every combination of the flash inputs. */
const allInputs: FlashInput[] = bools.flatMap((offered) =>
  bools.flatMap((flash) => bools.flatMap((canOffer) => bools.map((timerSlot) => ({ offered, flash, canOffer, timerSlot })))),
);

/** Relative luminance (WCAG) of a #rrggbb color. */
function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

describe('C6 one flash control at a time', () => {
  it('C6: while the "Turn on flash" pill shows, the separate flash toggle is hidden', () => {
    for (const s of allInputs) {
      const c = flashControls(s);
      if (c.offer) expect({ input: s, toggle: c.toggle }).toEqual({ input: s, toggle: false });
    }
  });

  it('C6: when the pill goes, the toggle is back (Propped, and the scan camera)', () => {
    // Dark room, flash off: the pill, no toggle.
    const dark = { offered: true, flash: false, canOffer: true, timerSlot: false };
    expect(flashControls(dark)).toEqual({ offer: true, toggle: false });
    // He taps the pill (flash on): the pill goes and the toggle is back, showing the flash on.
    expect(flashControls({ ...dark, flash: true })).toEqual({ offer: false, toggle: true });
    // The room brightens: the pill goes, the toggle is back.
    expect(flashControls({ ...dark, offered: false })).toEqual({ offer: false, toggle: true });
    // The after-shot panel hides the pill: the toggle is back.
    expect(flashControls({ ...dark, canOffer: false })).toEqual({ offer: false, toggle: true });
  });

  it('C6: Mirror keeps its timer in that slot; the pill alone is the flash control there', () => {
    expect(flashControls({ offered: true, flash: false, canOffer: true, timerSlot: true })).toEqual({ offer: true, toggle: false });
    expect(flashControls({ offered: false, flash: false, canOffer: true, timerSlot: true })).toEqual({ offer: false, toggle: false });
  });

  it('C6: the live guide in a dark room offers the pill and the toggle goes, until the flash is on', () => {
    const darkFrame: GuideEvent = { state: 'good', faces: [], luma: 0.5, subjectLuma: 0.05, clipped: 0, bodyShare: 0.7, motion: 0 };
    const off = fitTip(darkFrame, { mode: 'propped', flash: false });
    expect(flashControls({ offered: off.offerFlash, flash: false, canOffer: true, timerSlot: false })).toEqual({ offer: true, toggle: false });
    const on = fitTip(darkFrame, { mode: 'propped', flash: true });
    expect(flashControls({ offered: on.offerFlash, flash: true, canOffer: true, timerSlot: false })).toEqual({ offer: false, toggle: true });
  });
});

describe('C7 no blank flash opening the camera', () => {
  it('C7: while consent loads, the screen is the camera\'s dark background with its close button', () => {
    for (const perm of PERMISSIONS) {
      const look = FRAME_LOOK[cameraFrame(null, perm)];
      expect(look).toEqual({ background: CAMERA_BACKGROUND, close: true });
    }
  });

  it('C7: while the camera permission loads, the screen is the camera\'s dark background with its close button', () => {
    expect(FRAME_LOOK[cameraFrame(true, null)]).toEqual({ background: CAMERA_BACKGROUND, close: true });
    expect(FRAME_LOOK[cameraFrame(true, 'asking')]).toEqual({ background: CAMERA_BACKGROUND, close: true });
  });

  it('C7: never an empty frame without controls, in any state', () => {
    for (const consent of [null, false, true]) {
      for (const perm of PERMISSIONS) expect({ consent, perm, close: FRAME_LOOK[cameraFrame(consent, perm)].close }).toEqual({ consent, perm, close: true });
    }
  });

  it('C7: the camera background is dark (never white), whatever the theme', () => {
    expect(luminance(CAMERA_BACKGROUND)).toBeLessThan(0.05);
  });

  it('C7: the loading frame is not the live camera, so the permission prompt never comes before consent', () => {
    for (const perm of PERMISSIONS) expect(cameraFrame(null, perm)).not.toBe('camera');
  });
});
