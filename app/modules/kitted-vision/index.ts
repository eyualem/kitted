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
      /** The working image (long edge ≤ 2048 since #83; 4096 in older native builds). */
      width: number;
      height: number;
      people: number;
      faceBoxes: number;
      pose: 'full' | 'upper' | 'none';
      // Added in #83 (absent from older native builds until the app is reinstalled):
      /** Face-hidden 2048 px copy in Caches/detail, kept a week: the source for closet crops. */
      detailUri?: string;
      sourceWidth?: number;
      sourceHeight?: number;
      uploadWidth?: number;
      uploadHeight?: number;
      uploadBytes?: number;
      keptWidth?: number;
      keptHeight?: number;
      detailWidth?: number;
      detailHeight?: number;
      visionMs?: number;
      totalMs?: number;
      // Added in #104 (absent from older native builds):
      /** Face-hidden close-ups for the scoring call, in order: upper + lower body, or the whole person. */
      zoomBase64?: string[];
      zoomKinds?: string[];
      zoomSizes?: [number, number][];
      zoomMs?: number;
      // Added Oct 14 (absent from older native builds): everyone else covered in every copy sent.
      /** How many other people were covered; whether he was picked automatically (clearly the subject) … */
      masked?: number;
      autoPicked?: boolean;
      /** … or the candidate he tapped on "Which one is you?" (the photo's hash then names that person too). */
      picked?: number;
    }
  | {
      status: 'multiplePeople';
      sha256?: string;
      sourceWidth?: number;
      sourceHeight?: number;
      /** "Which one is you?" (Oct 14; absent from older native builds): everyone he could be, [x, y, w, h] 0–1, origin
       *  top-left on the upright photo, the biggest first; and the upright photo's size. */
      candidates?: number[][];
      width?: number;
      height?: number;
      people?: number;
    }
  | {
      status: 'noPerson' | 'couldNotFrame' | 'notImplemented';
      sha256?: string;
      sourceWidth?: number;
      sourceHeight?: number;
    };

export type DictationEvent =
  | { type: 'text'; text: string; final: boolean }
  | { type: 'level'; level: number }
  | { type: 'end'; error: string | null };

/** A clothes scan's prep (#88, #100): no person needed; any face is still hidden. */
export type PrepareItemsResult =
  | {
      status: 'ok';
      sha256: string;
      /** His photo as taken (no metadata), 2048 px, in Documents/scans. */
      keptUri: string;
      thumbUri: string;
      /** Every face hidden, 2048 px: the copy the item reading will send. */
      sendUri: string;
      width: number;
      height: number;
      people: number;
      faceBoxes: number;
      totalMs?: number;
    }
  | { status: 'couldNotFrame' | 'notImplemented'; sha256?: string };

/** Normalized box (0–1, origin top-left). */
export interface NormBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The quick check after the shot (#100): measures only; features/camera/guidance.ts judges. */
export interface StillAssessment {
  ok: boolean;
  kind?: 'fit' | 'scan';
  width?: number;
  height?: number;
  /** Mean brightness 0–1, and the share of near-white pixels. */
  luma?: number;
  clipped?: number;
  /** Variance of the Laplacian, and how much of it survives a light blur (near 1 = soft). */
  lapVar?: number;
  blurRatio?: number;
  /** Whether photo prep could send it (the same face rule, ruling 10). */
  frame?: 'ok' | 'noPerson' | 'multiplePeople' | 'couldNotFrame';
  /** Fit: the person's own brightness, and his height as a share of the frame. */
  subjectLuma?: number;
  bodyShare?: number;
  pose?: 'full' | 'upper' | 'none';
  /** Scan: people and faces (normalized), the clothes label's confidence, the top labels, pieces. */
  people?: NormBox[];
  faces?: NormBox[];
  clothes?: number;
  labels?: string[];
  pieces?: { box: NormBox; share: number; edge: boolean }[];
  ms?: number;
}

/** One garment to measure: its closet-call box ([ymin, xmin, ymax, xmax], 0–1000) and a file key. */
export interface MeasureInput {
  key: string;
  category: string;
  box: number[];
}

/** What the phone measured for one garment (DECISIONS-LOG #104). Statistics are at 1024 px. */
export interface MeasuredGarment {
  key: string;
  /** The dominant color (largest of 3 Lab clusters) and its CIE L*; absent when no pixel was his. */
  hex?: string;
  L?: number;
  clusters: { hex: string; L: number; share: number }[];
  /** His pixels the color used, and their share of the box. */
  ownedPx: number;
  coverage: number;
  /** Share of the box under outer-layer boxes ("partly hidden"), and inside head/hand regions. */
  overlapOuter: number;
  headOverlap: number;
  /** Share of his pixels dropped as the outer layer's colors. */
  droppedOuter: number;
  /** The box in pixels at 2048, and its sharpness (variance of the Laplacian). */
  boxW: number;
  boxH: number;
  lapVar: number;
  personMask: boolean;
  /** The cut-out was flipped back to true view (a mirror selfie, #109). Absent before #109. */
  mirrored?: boolean;
  /** Documents/closet/<sha>-<key>.png: the display cut-out (face-hidden source, every head removed). */
  cropUri?: string;
  cropW?: number;
  cropH?: number;
  /** Documents/closet/<sha>-<key>.print: Apple's image feature print of the cut-out. */
  printUri?: string;
}

export type MeasureResult =
  | { status: 'ok'; garments: MeasuredGarment[]; ms?: number }
  | { status: 'missing' | 'mismatch' | 'notImplemented' };

interface KittedVisionNative {
  prepare(originalUri: string): Promise<PrepareResult>;
  preparePerson?(originalUri: string, pick: number[]): Promise<PrepareResult>;
  measureGarments?(keptUri: string, detailUri: string, sha: string, garments: MeasureInput[], mirrored?: boolean): Promise<MeasureResult>;
  printDistance?(a: string, b: string): Promise<number | null>;
  prepareItems?(originalUri: string): Promise<PrepareItemsResult>;
  assess?(uri: string, kind: 'fit' | 'scan'): Promise<StillAssessment>;
  reloadUpload(sha256: string): Promise<string | null>;
  reloadZoom?(sha256: string): Promise<string[]>;
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

/** "Which one is you?" (02 S23): the same prep with the person he tapped (one of `candidates`); everyone else is
 *  covered in every copy sent. notImplemented on web and in native builds from before Oct 14. */
export async function preparePerson(originalUri: string, pick: NormBox): Promise<PrepareResult> {
  if (!native || typeof native.preparePerson !== 'function') return { status: 'notImplemented' };
  return native.preparePerson(originalUri, [pick.x, pick.y, pick.width, pick.height]);
}

/** A clothes scan's prep (#100). notImplemented on web and in older native builds. */
export async function prepareItems(originalUri: string): Promise<PrepareItemsResult> {
  if (!native || typeof native.prepareItems !== 'function') return { status: 'notImplemented' };
  return native.prepareItems(originalUri);
}

/** The quick check after a shot or a library pick (#100). null where it can't run (web, older
 *  builds, an unreadable file): the photo then goes on, and photo prep still decides. */
export async function assess(uri: string, kind: 'fit' | 'scan'): Promise<StillAssessment | null> {
  if (!native || typeof native.assess !== 'function') return null;
  try {
    const r = await native.assess(uri, kind);
    return r.ok ? r : null;
  } catch {
    return null;
  }
}

/** Measures garments on his photo after the closet call (#104): color, quality, cut-out, fingerprint. `mirrored`
 *  (a mirror selfie) flips the cut-outs back to true view (#109). notImplemented on web and in native builds from
 *  before #104. Never throws. */
export async function measureGarments(keptUri: string, detailUri: string, sha: string, garments: MeasureInput[], mirrored = false): Promise<MeasureResult> {
  if (!native || typeof native.measureGarments !== 'function') return { status: 'notImplemented' };
  try {
    return await native.measureGarments(keptUri, detailUri, sha, garments, mirrored);
  } catch {
    return { status: 'missing' };
  }
}

/** Feature-print distance between two stored prints (#104); null when it can't be computed. */
export async function printDistance(a: string, b: string): Promise<number | null> {
  if (!native || typeof native.printDistance !== 'function') return null;
  try {
    return await native.printDistance(a, b);
  } catch {
    return null;
  }
}

/** The upload copy kept from an earlier prep (base64), for "Try again"; null once it's gone. */
export async function reloadUpload(sha256: string): Promise<string | null> {
  return native ? native.reloadUpload(sha256) : null;
}

/** The close-ups kept from an earlier prep (#104), for "Try again"; [] once they're gone or on older builds. */
export async function reloadZoom(sha256: string): Promise<string[]> {
  if (!native || typeof native.reloadZoom !== 'function') return [];
  try {
    return await native.reloadZoom(sha256);
  } catch {
    return [];
  }
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
export interface ScanPiece {
  /** In view points. */
  box: ViewBox;
  /** Share of the frame it covers. */
  share: number;
  /** Touches the frame edge: probably cut off. */
  edge: boolean;
}
export interface GuideEvent {
  state: GuideState;
  /** The body box and face boxes in view points (for the outline; there's no live blur, #54). */
  body?: ViewBox;
  faces: ViewBox[];
  // Added in #100 (absent from older native builds; the guide then works on `state` alone):
  /** Mean brightness 0–1 of the frame, its near-white share, and of the person (fit). */
  luma?: number;
  clipped?: number;
  subjectLuma?: number;
  /** The camera's exposure: ISO, its maximum, and the shutter time in seconds. */
  iso?: number;
  maxIso?: number;
  exposure?: number;
  /** Mean change since the last analyzed frame (0–1): shake or movement. */
  motion?: number;
  /** Fit: his shoulders-to-ankles height as a share of the frame. */
  bodyShare?: number;
  /** Scan mode: people (each a share of the frame), the clothes label's confidence, the pieces. */
  scan?: { people: number[]; clothes?: number; labels?: string[]; pieces: ScanPiece[] };
}
/** A still from the live camera: a temporary JPEG (file://) that photo prep reads and deletes. */
export interface CapturedPhoto {
  uri: string;
  /** Upright pixels (12 MP: 3024 × 4032); 0 when an older native build returned only the uri. */
  width: number;
  height: number;
  bytes: number;
  /** Shutter press to photo data. */
  ms: number;
}
export interface CameraReadyEvent {
  facing: string;
  /** Added in #83; absent from older native builds. */
  photo?: string;
  photoSizes?: string[];
  frames?: string;
  zsl?: boolean;
  thermal?: string;
}
export interface CameraHandle {
  /** Older native builds resolve a bare uri string; use takePhotoFrom() to read either shape. */
  takePhoto(): Promise<CapturedPhoto | string>;
}
/** Takes a photo and normalizes the result across native builds. */
export async function takePhotoFrom(cam: CameraHandle | null | undefined): Promise<CapturedPhoto | null> {
  const r = await cam?.takePhoto();
  if (!r) return null;
  return typeof r === 'string' ? { uri: r, width: 0, height: 0, bytes: 0, ms: 0 } : r;
}
export interface CameraViewProps extends ViewProps {
  facing: 'front' | 'back';
  /** 'scan' adds the clothes measures (#100). The view should then be sized 3:4, like the photo. */
  kind?: 'fit' | 'scan';
  torch?: boolean;
  onGuide?: (e: { nativeEvent: GuideEvent }) => void;
  onReady?: (e: { nativeEvent: CameraReadyEvent }) => void;
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
