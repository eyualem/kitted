// Approximate location for the morning/evening card's weather (02 "S1d", DECISIONS-LOG #58):
// reduced accuracy, when-in-use, one shot. Asked only from the card's "Use your local weather?"
// row, never in onboarding. The coordinate goes to the weather source and nowhere else.
import { requireOptionalNativeModule } from 'expo';

export type LocationPermission = 'granted' | 'denied' | 'unknown';
export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface KittedLocationNative {
  permission(): Promise<string>;
  requestPermission(): Promise<string>;
  currentLocation(timeoutMs: number): Promise<Coordinate | null>;
}

// Optional: absent on web, Android, and native builds from before this module (reinstall needed).
const native = requireOptionalNativeModule<KittedLocationNative>('KittedLocation');

/** The native module is in this build. */
export const isAvailable: boolean = native !== null;

function label(v: unknown): LocationPermission {
  return v === 'granted' || v === 'denied' ? v : 'unknown';
}

/** Never shows a prompt. 'unknown' = not asked yet (or no module). */
export async function permission(): Promise<LocationPermission> {
  if (!native) return 'unknown';
  try {
    return label(await native.permission());
  } catch {
    return 'unknown';
  }
}

/** Shows the iOS prompt the first time; afterwards answers at once. 'denied' without the module. */
export async function requestPermission(): Promise<LocationPermission> {
  if (!native) return 'denied';
  try {
    return label(await native.requestPermission());
  } catch {
    return 'denied';
  }
}

/** One approximate fix, or null (not allowed, no fix in time, or no module). Never throws. */
export async function currentLocation(timeoutMs: number): Promise<Coordinate | null> {
  if (!native) return null;
  try {
    const c = await native.currentLocation(timeoutMs);
    return c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude) ? { latitude: c.latitude, longitude: c.longitude } : null;
  } catch {
    return null;
  }
}
