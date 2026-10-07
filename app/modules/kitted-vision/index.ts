// The final interface (05 §4.6) so app code never changes when the real module lands in P8.
// The demo's ImagePrep uses the mockup's crop table and never calls this.
import { requireOptionalNativeModule } from 'expo';

export type PrepareResult =
  | {
      status: 'ok';
      uploadUri: string;
      neckDownUri: string;
      thumbUri: string;
      sha256: string;
      people: number;
      faceBoxes: number;
      pose: 'full' | 'upper' | 'none';
    }
  | { status: 'noPerson' | 'multiplePeople' | 'couldNotFrame' | 'notImplemented' };

interface KittedVisionNative {
  prepare(originalUri: string): Promise<PrepareResult>;
}

// Optional: the module exists only in iOS dev/Release builds, not on web or Android yet.
const native = requireOptionalNativeModule<KittedVisionNative>('KittedVision');

export async function prepare(originalUri: string): Promise<PrepareResult> {
  if (!native) return { status: 'notImplemented' };
  return native.prepare(originalUri);
}

export const isAvailable: boolean = native !== null;
