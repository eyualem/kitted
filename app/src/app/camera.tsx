import { useEffect, useState } from 'react';
import { store } from '@/data/db';
import { CameraScreen } from '@/features/camera/CameraScreen';
import { ConsentScreen } from '@/features/onboarding/ConsentScreen';
import { hasConsent } from '@/features/onboarding/complete';
import { getDemoArgs } from '@/state/session';

// S2 Camera (02 D5, mockup 5). Every way in passes here. Until he has agreed (a new install, "Not now", "Score my fits"
// off), the consent screen shows first, in the camera's place: "Agree" saves it for good and the camera opens right
// there; "Not now" or the X closes. So the ask comes before any photo, once, never after he has picked one (02 D4).
// Demo screens open the camera straight away (their bundled photos never leave the phone).
export default function CameraRoute() {
  const [ok, setOk] = useState<boolean | null>(() => (getDemoArgs().demoScreen !== null ? true : null));
  useEffect(() => {
    if (getDemoArgs().demoScreen === null) void hasConsent(store).then(setOk, () => setOk(false));
  }, []);
  if (ok === null) return null;
  return ok ? <CameraScreen /> : <ConsentScreen mode="camera" onAgreed={() => setOk(true)} />;
}
