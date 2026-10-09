import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { store } from '@/data/db';
import { CameraScreen } from '@/features/camera/CameraScreen';
import { hasConsent } from '@/features/onboarding/complete';

// S2 Camera (02 D5, mockup 5). Every way in passes here: without his consent (he tapped "Not now") the
// consent sheet opens instead, and no photo is taken or sent (02 D4).
export default function CameraRoute() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    void hasConsent(store).then((c) => {
      setOk(c);
      if (!c) router.replace('/sheets/consent');
    });
  }, []);
  return ok ? <CameraScreen /> : null;
}
