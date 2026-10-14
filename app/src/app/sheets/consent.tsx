import { useLocalSearchParams } from 'expo-router';
import { ConsentScreen } from '@/features/onboarding/ConsentScreen';

// O5 as a sheet (02 D4: "also reachable later… as a sheet with an X"). From You › Privacy when he turns "Score my fits"
// back on (`?from=privacy`: agreeing just closes it), and when a photo of his was held back for the agreement
// (`?resume=1`: agreeing scores that same photo). The camera's own first-open ask is inside the camera (app/camera.tsx).
export default function ConsentSheet() {
  const { from, resume } = useLocalSearchParams<{ from?: string; resume?: string }>();
  return <ConsentScreen mode="sheet" after={resume ? 'resume' : from === 'privacy' ? 'close' : 'camera'} />;
}
