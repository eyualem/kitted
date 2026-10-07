// On-device photo prep (05 §P3 C): neck-down crop, face removed, metadata stripped, hashed.
// The demo's bundled photos use the mockup's crop table instead and never call this.
import { requireOptionalNativeModule } from 'expo';

export type PrepareResult =
  | {
      status: 'ok';
      uploadUri: string;
      /** The upload JPEG (1024 px), base64, so the reading source doesn't re-read the file. */
      uploadBase64: string;
      neckDownUri: string;
      thumbUri: string;
      sha256: string;
      width: number;
      height: number;
      people: number;
      faceBoxes: number;
      pose: 'full' | 'upper' | 'none';
    }
  | { status: 'noPerson' | 'multiplePeople' | 'couldNotFrame' | 'notImplemented'; sha256?: string };

interface KittedVisionNative {
  prepare(originalUri: string): Promise<PrepareResult>;
  reloadUpload(sha256: string): Promise<string | null>;
}

// Optional: the module exists only in iOS dev/Release builds, not on web or Android yet.
const native = requireOptionalNativeModule<KittedVisionNative>('KittedVision');

export async function prepare(originalUri: string): Promise<PrepareResult> {
  if (!native) return { status: 'notImplemented' };
  return native.prepare(originalUri);
}

/** The upload copy kept from an earlier prep (base64), for "Try again"; null once it's gone. */
export async function reloadUpload(sha256: string): Promise<string | null> {
  return native ? native.reloadUpload(sha256) : null;
}

export const isAvailable: boolean = native !== null;
