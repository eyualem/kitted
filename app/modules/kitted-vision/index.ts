// On-device photo prep (05 §P3 C): neck-down crop, face removed, metadata stripped, hashed.
// The demo's bundled photos use the mockup's crop table instead and never call this.
import type { ComponentType, Ref } from 'react';
import type { ViewProps } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';

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

// ---- The live camera (05 §P3 B) ------------------------------------------------------------

export type GuideState = 'noPerson' | 'tooClose' | 'moveLeft' | 'moveRight' | 'good' | 'goodFull';
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface GuideEvent {
  state: GuideState;
  /** The body box and face boxes in view points (for the outline and the live face blur). */
  body?: ViewBox;
  faces: ViewBox[];
}
export interface CameraHandle {
  /** A temporary JPEG (file://); photo prep deletes it after cropping. */
  takePhoto(): Promise<string>;
}
export interface CameraViewProps extends ViewProps {
  facing: 'front' | 'back';
  torch?: boolean;
  onGuide?: (e: { nativeEvent: GuideEvent }) => void;
  onReady?: (e: { nativeEvent: { facing: string } }) => void;
  onCameraError?: (e: { nativeEvent: { code: string } }) => void;
  ref?: Ref<CameraHandle>;
}

interface CameraNative {
  hasCamera(): boolean;
  requestCameraPermission(): Promise<'granted' | 'denied'>;
}
const cam = native as unknown as CameraNative | null;

/** False on the Simulator, on web, and where the module isn't built: use the simulated camera. */
export const hasCamera: boolean = cam !== null && typeof cam.hasCamera === 'function' && cam.hasCamera();

export async function requestCameraPermission(): Promise<'granted' | 'denied'> {
  return cam ? cam.requestCameraPermission() : 'denied';
}

export const KittedCameraView: ComponentType<CameraViewProps> | null = hasCamera ? requireNativeView<CameraViewProps>('KittedVision') : null;
