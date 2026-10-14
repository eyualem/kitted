import { useLocalSearchParams } from 'expo-router';
import { ConsentScreen } from '@/features/onboarding/ConsentScreen';

// O5 as a sheet (02 D4: "also reachable later… as a sheet with an X"): from the camera when he said "Not now", and from
// You › Privacy when he turns "Score my fits" back on (`?from=privacy`: agreeing closes the sheet, no camera).
export default function ConsentSheet() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <ConsentScreen mode="sheet" thenCamera={from !== 'privacy'} />;
}
