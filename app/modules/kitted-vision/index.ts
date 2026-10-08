// On-device photo prep (05 §P3 C): full frame, every face blurred, metadata stripped, hashed.
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
      keptUri: string;
      thumbUri: string;
      sha256: string;
      width: number;
      height: number;
      people: number;
      faceBoxes: number;
      pose: 'full' | 'upper' | 'none';
    }
  | { status: 'noPerson' | 'multiplePeople' | 'couldNotFrame' | 'notImplemented'; sha256?: string };

export type DictationEvent =
  | { type: 'text'; text: string; final: boolean }
  | { type: 'level'; level: number }
  | { type: 'end'; error: string | null };

interface KittedVisionNative {
  prepare(originalUri: string): Promise<PrepareResult>;
  reloadUpload(sha256: string): Promise<string | null>;
  requestMicrophone(): Promise<'granted' | 'denied'>;
  dictationSupported(): Promise<boolean>;
  startDictation(): Promise<void>;
  stopDictation(): Promise<void>;
  addListener(event: 'onDictation', cb: (e: DictationEvent) => void): { remove(): void };
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

// ---- Voice input (DECISIONS-LOG #70): on-device dictation ----------------------------------

/** The native module exists (iOS dev/Release builds). Whether THIS phone can dictate on-device: dictationSupported(). */
export const dictationAvailable: boolean = native !== null && typeof native.startDictation === 'function';

/** True when the phone has an on-device dictation model for his language (no audio leaves the phone). */
export async function dictationSupported(): Promise<boolean> {
  if (!native || typeof native.dictationSupported !== 'function') return false;
  try {
    return await native.dictationSupported();
  } catch {
    return false;
  }
}

export async function requestMicrophone(): Promise<'granted' | 'denied'> {
  return native ? native.requestMicrophone() : 'denied';
}

export async function startDictation(): Promise<void> {
  if (native) await native.startDictation();
}

export async function stopDictation(): Promise<void> {
  if (native) await native.stopDictation();
}

export function onDictation(cb: (e: DictationEvent) => void): () => void {
  if (!native) return () => {};
  const sub = native.addListener('onDictation', cb);
  return () => sub.remove();
}

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
