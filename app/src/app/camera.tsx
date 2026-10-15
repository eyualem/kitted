import { useEffect, useState } from 'react';
import { store } from '@/data/db';
import { CameraScreen, CameraShell } from '@/features/camera/CameraScreen';
import { cameraFrame } from '@/features/camera/cameraControls';
import { ConsentScreen } from '@/features/onboarding/ConsentScreen';
import { hasConsent } from '@/features/onboarding/complete';
import { getDemoArgs } from '@/state/session';

// S2 Camera (02 D5, mockup 5). Every way in passes here. Until he has agreed (a new install, "Not now", "Score my fits"
// off), the consent screen shows first, in the camera's place: "Agree" saves it for good and the camera opens right
// there; "Not now" or the X closes. So the ask comes before any photo, once, never after he has picked one (02 D4).
// Demo screens open the camera straight away (their bundled photos never leave the phone). While consent is read the
// camera's dark background and close button show, never an empty frame (C7, #287).
export default function CameraRoute() {
  const [ok, setOk] = useState<boolean | null>(() => (getDemoArgs().demoScreen !== null ? true : null));
  useEffect(() => {
    if (getDemoArgs().demoScreen === null) void hasConsent(store).then(setOk, () => setOk(false));
  }, []);
  const frame = cameraFrame(ok, null);
  if (frame === 'shell') return <CameraShell />;
  return frame === 'consent' ? <ConsentScreen mode="camera" onAgreed={() => setOk(true)} /> : <CameraScreen />;
}
