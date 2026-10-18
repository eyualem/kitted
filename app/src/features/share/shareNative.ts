// Is this build able to make share images? The capture (react-native-view-shot), the share sheet (expo-sharing) and
// Photos (expo-media-library) are native modules: a dev build made before they were added (his phone until its next
// reinstall) doesn't have them, and their JS throws on import there. So nothing imports them until this says yes, and
// the card's Share button stays hidden until then (#341).
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

let cached: boolean | null = null;

export function shareNativeReady(): boolean {
  if (cached !== null) return cached;
  if (Platform.OS === 'web') return (cached = false);
  const shot = TurboModuleRegistry.get('RNViewShot') ?? NativeModules.RNViewShot;
  cached = !!shot && !!requireOptionalNativeModule('ExpoSharing') && !!requireOptionalNativeModule('ExpoMediaLibrary');
  return cached;
}
